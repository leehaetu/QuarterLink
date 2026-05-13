import { buildWebAppViaServerFraudPreventionHeaders } from "./fraud-prevention";
import { loadHmrcSandboxConfig } from "./config";
import { redactEvidenceValue } from "./evidence";
import type {
  FraudPreventionAssemblyInput,
  FraudPreventionHeaderBuildStatus,
  FraudPreventionMissingValue,
  HmrcHeaders,
  WebAppViaServerFraudPreventionBuildResult,
  WebAppViaServerFraudPreventionInput,
} from "./types";
import { HMRC_SANDBOX_API_BASE_URL } from "./types";

type EnvironmentSource = Readonly<Record<string, string | undefined>>;
type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

type DiscoveryStatus = "pass" | "block" | "skip";

export interface Ql008SandboxDiscoveryItem {
  readonly check: string;
  readonly status: DiscoveryStatus;
  readonly detail: string;
}

export interface Ql008MissingFraudPreventionInput {
  readonly headerName: string;
  readonly variables: readonly string[];
  readonly reason: string;
  readonly status?: string;
}

export interface Ql008FraudPreventionHeaderBuildSummary {
  readonly redactedHeaders: HmrcHeaders;
  readonly presentHeaderNames: readonly string[];
  readonly missingHeaderNames: readonly string[];
  readonly unavailableOnLocalhostHeaderNames: readonly string[];
  readonly manualOverrideHeaderNames: readonly string[];
  readonly statuses: readonly FraudPreventionHeaderBuildStatus[];
  readonly testFraudPreventionHeadersRunnable: boolean;
}

export interface Ql008SandboxDiscoveryResult {
  readonly ok: boolean;
  readonly generatedAt: string;
  readonly hmrcNetworkCallsAttempted: boolean;
  readonly hmrcSubmissionCallsAttempted: boolean;
  readonly blockers: readonly string[];
  readonly items: readonly Ql008SandboxDiscoveryItem[];
  readonly missingFraudPreventionInputs: readonly Ql008MissingFraudPreventionInput[];
  readonly fraudPreventionHeaderBuild?: Ql008FraudPreventionHeaderBuildSummary;
  readonly fphApplicationToken?: Ql008FphApplicationTokenResult;
  readonly testFraudPreventionHeaders?: Ql008TestFraudPreventionHeadersResult;
  readonly businessDetails?: Ql008BusinessDetailsDiscoveryResult;
  readonly obligations?: Ql008ObligationsDiscoveryResult;
}

export interface Ql008SandboxDiscoveryInput {
  readonly env?: EnvironmentSource;
  readonly allowHmrcNetworkCalls?: boolean;
  readonly fetchImpl?: FetchLike;
  readonly httpTimeoutMs?: number;
  readonly now?: () => Date;
}

export interface Ql008FphApplicationTokenResult {
  readonly attempted: boolean;
  readonly obtained: boolean;
  readonly usedOverride: boolean;
  readonly safeMetadata?: Readonly<Record<string, unknown>>;
}

export interface Ql008TestFraudPreventionHeadersResult {
  readonly attempted: boolean;
  readonly passed: boolean;
  readonly safeMetadata?: Readonly<Record<string, unknown>>;
}

export interface Ql008BusinessDetailsDiscoveryResult {
  readonly attempted: boolean;
  readonly passed: boolean;
  readonly selfEmploymentBusinessIds: readonly string[];
  readonly safeMetadata?: Readonly<Record<string, unknown>>;
}

export interface Ql008ObligationsDiscoveryResult {
  readonly attempted: boolean;
  readonly passed: boolean;
  readonly obligationCount: number;
  readonly openObligationCount: number;
  readonly safeMetadata?: Readonly<Record<string, unknown>>;
}

interface FraudPreventionInputParseResult {
  readonly input?: FraudPreventionAssemblyInput;
  readonly missing: readonly Ql008MissingFraudPreventionInput[];
  readonly headerBuild: WebAppViaServerFraudPreventionBuildResult;
}

interface ResolvedFphApplicationToken {
  readonly accessToken?: string;
  readonly result: Ql008FphApplicationTokenResult;
  readonly hmrcNetworkCallAttempted: boolean;
}

const DISCOVERY_ORDER = [
  "fresh OAuth token",
  "WEB_APP_VIA_SERVER fraud-prevention inputs",
  "Test Fraud Prevention Headers validation",
  "Business Details read-only call to get self-employment businessId",
  "Obligations read-only call to get period/context",
  "preflight retry",
] as const;

const REQUIRED_FPH_ENV_INPUTS = [
  {
    headerName: "Gov-Client-Browser-JS-User-Agent",
    variables: ["QL_008_FRAUD_BROWSER_JS_USER_AGENT"],
    reason: "Browser JavaScript user agent from the originating user action.",
  },
  {
    headerName: "Gov-Client-Device-ID",
    variables: ["QL_008_FRAUD_DEVICE_ID"],
    reason: "Persistent device ID for the originating device.",
  },
  {
    headerName: "Gov-Client-Multi-Factor",
    variables: [
      "QL_008_FRAUD_MFA_TYPE",
      "QL_008_FRAUD_MFA_TIMESTAMP",
      "QL_008_FRAUD_MFA_UNIQUE_REFERENCE",
    ],
    reason: "MFA metadata or an HMRC-agreed missing-data approach.",
  },
  {
    headerName: "Gov-Client-Public-IP",
    variables: ["QL_008_FRAUD_CLIENT_PUBLIC_IP"],
    reason: "Client public IP from a trusted server or edge source.",
  },
  {
    headerName: "Gov-Client-Public-IP-Timestamp",
    variables: ["QL_008_FRAUD_CLIENT_PUBLIC_IP_TIMESTAMP"],
    reason: "UTC timestamp captured when the client public IP was collected.",
  },
  {
    headerName: "Gov-Client-Public-Port",
    variables: ["QL_008_FRAUD_CLIENT_PUBLIC_PORT"],
    reason: "Client public port from a trusted deployment layer.",
  },
  {
    headerName: "Gov-Client-Screens",
    variables: [
      "QL_008_FRAUD_SCREEN_WIDTH",
      "QL_008_FRAUD_SCREEN_HEIGHT",
      "QL_008_FRAUD_SCREEN_SCALING_FACTOR",
      "QL_008_FRAUD_SCREEN_COLOUR_DEPTH",
    ],
    reason: "Screen dimensions, scaling factor, and colour depth from the browser.",
  },
  {
    headerName: "Gov-Client-Timezone",
    variables: ["QL_008_FRAUD_TIMEZONE"],
    reason: "Browser timezone in HMRC UTC offset format.",
  },
  {
    headerName: "Gov-Client-User-IDs",
    variables: [
      "QL_008_FRAUD_CLIENT_USER_ID_KEY",
      "QL_008_FRAUD_CLIENT_USER_ID_VALUE",
    ],
    reason: "Server-derived QuarterLink user identifier for the local sandbox run.",
  },
  {
    headerName: "Gov-Client-Window-Size",
    variables: ["QL_008_FRAUD_WINDOW_WIDTH", "QL_008_FRAUD_WINDOW_HEIGHT"],
    reason: "Browser viewport size from the originating user action.",
  },
  {
    headerName: "Gov-Vendor-Forwarded",
    variables: [
      "QL_008_FRAUD_VENDOR_FORWARDED_BY",
      "QL_008_FRAUD_VENDOR_FORWARDED_FOR",
    ],
    reason: "Forwarded hop across QuarterLink-controlled internet infrastructure.",
  },
  {
    headerName: "Gov-Vendor-License-IDs",
    variables: [
      "QL_008_FRAUD_VENDOR_LICENSE_ID_KEY",
      "QL_008_FRAUD_VENDOR_LICENSE_ID_VALUE",
    ],
    reason: "Vendor licence ID or an HMRC-agreed missing-data approach.",
  },
  {
    headerName: "Gov-Vendor-Public-IP",
    variables: ["QL_008_FRAUD_VENDOR_PUBLIC_IP"],
    reason: "QuarterLink server, load balancer, or WAF public IP.",
  },
] as const;

const APPLICATION_RESTRICTED_TOKEN_OVERRIDE_ENV = "HMRC_SANDBOX_FPH_ACCESS_TOKEN";
const APPLICATION_RESTRICTED_SCOPE_ENV = "HMRC_SANDBOX_FPH_SCOPES";
const USER_RESTRICTED_TOKEN_ENV = "HMRC_SANDBOX_ACCESS_TOKEN";
const ALLOW_CALLS_ENV = "QL_008_DISCOVERY_ALLOW_HMRC_CALLS";
const TEST_FPH_ACCEPT = "application/vnd.hmrc.1.0+json";
const DEFAULT_HMRC_DISCOVERY_TIMEOUT_MS = 10_000;

export async function runQl008SandboxDiscovery(
  input: Ql008SandboxDiscoveryInput = {},
): Promise<Ql008SandboxDiscoveryResult> {
  const env = input.env ?? process.env;
  const now = input.now ?? (() => new Date());
  const generatedAt = now().toISOString();
  const allowHmrcNetworkCalls =
    input.allowHmrcNetworkCalls ?? env[ALLOW_CALLS_ENV]?.trim() === "true";
  const httpTimeoutMs = input.httpTimeoutMs ?? DEFAULT_HMRC_DISCOVERY_TIMEOUT_MS;
  const items: Ql008SandboxDiscoveryItem[] = [];
  const missingFraudPreventionInputs: Ql008MissingFraudPreventionInput[] = [];
  let hmrcNetworkCallsAttempted = false;

  items.push({
    check: "QL-008 sandbox discovery order",
    status: "pass",
    detail: DISCOVERY_ORDER.join(" -> "),
  });

  const configResult = loadSandboxConfigItem(items, env);
  const fraudInputResult = buildFraudPreventionInputFromEnv(env);
  const fraudHeaderBuildSummary = summariseFraudHeaderBuild(
    fraudInputResult.headerBuild,
    allowHmrcNetworkCalls,
  );
  missingFraudPreventionInputs.push(...fraudInputResult.missing);

  recordTokenSource(items, env);

  items.push({
    check: "WEB_APP_VIA_SERVER fraud-prevention header builder",
    status: fraudInputResult.headerBuild.ok ? "pass" : "block",
    detail: formatFraudHeaderBuildDetail(fraudHeaderBuildSummary),
  });

  if (fraudInputResult.missing.length > 0 || fraudInputResult.input === undefined) {
    items.push({
      check: "WEB_APP_VIA_SERVER fraud-prevention inputs",
      status: "block",
      detail: `Fraud-prevention headers not yet runnable. Missing: ${formatHeaderList(
        fraudHeaderBuildSummary.missingHeaderNames,
      )}; unavailable on localhost: ${formatHeaderList(
        fraudHeaderBuildSummary.unavailableOnLocalhostHeaderNames,
      )}; manual override required: ${formatHeaderList(
        fraudHeaderBuildSummary.manualOverrideHeaderNames,
      )}.`,
    });
  }

  if (!allowHmrcNetworkCalls) {
    items.push({
      check: "HMRC sandbox network calls",
      status: "skip",
      detail:
        `${ALLOW_CALLS_ENV}=true is required before the Test Fraud Prevention Headers call can run.`,
    });
  }

  let testFraudPreventionHeaders: Ql008TestFraudPreventionHeadersResult | undefined;
  let fphApplicationToken: Ql008FphApplicationTokenResult | undefined;

  const blockersBeforeNetwork = items
    .filter((item) => item.status === "block")
    .map((item) => `${item.check}: ${item.detail}`);

  if (
    allowHmrcNetworkCalls &&
    blockersBeforeNetwork.length === 0 &&
    configResult !== undefined &&
    fraudInputResult.headerBuild.ok
  ) {
    const resolvedFphToken = await resolveFphApplicationToken({
      env,
      fetchImpl: input.fetchImpl ?? fetch,
      timeoutMs: httpTimeoutMs,
    });
    hmrcNetworkCallsAttempted ||= resolvedFphToken.hmrcNetworkCallAttempted;
    fphApplicationToken = resolvedFphToken.result;

    items.push({
      check: "Application-restricted Test Fraud Prevention Headers token",
      status: resolvedFphToken.result.obtained ? "pass" : "block",
      detail: resolvedFphToken.result.obtained
        ? resolvedFphToken.result.usedOverride
          ? "Optional local override token is present. Value not displayed."
          : "Client credentials token request completed. Token value not displayed."
        : "Could not obtain an application-restricted token for Test Fraud Prevention Headers.",
    });

    if (resolvedFphToken.accessToken === undefined) {
      const blockers = items
        .filter((item) => item.status === "block")
        .map((item) => `${item.check}: ${item.detail}`);

      return {
        ok: false,
        generatedAt,
        hmrcNetworkCallsAttempted,
        hmrcSubmissionCallsAttempted: false,
        blockers,
        items,
        missingFraudPreventionInputs: dedupeMissingFraudInputs(
          missingFraudPreventionInputs,
        ),
        fphApplicationToken,
      };
    }

    const fphResult = await validateFraudPreventionHeaders({
      apiBaseUrl: configResult.apiBaseUrl,
      applicationRestrictedToken: resolvedFphToken.accessToken,
      fraudPreventionHeaders: fraudInputResult.headerBuild.headers,
      fetchImpl: input.fetchImpl ?? fetch,
      timeoutMs: httpTimeoutMs,
    });
    hmrcNetworkCallsAttempted = true;
    testFraudPreventionHeaders = fphResult;

    items.push({
      check: "Test Fraud Prevention Headers validation",
      status: fphResult.passed ? "pass" : "block",
      detail: fphResult.passed
        ? "HMRC sandbox accepted the WEB_APP_VIA_SERVER header set. Raw header values not displayed."
        : "HMRC sandbox did not return VALID_HEADERS. Business Details discovery remains blocked.",
    });

    if (fphResult.passed) {
      items.push(
        {
          check: "Business Details read-only discovery",
          status: "skip",
          detail:
            "Skipped in this QL-008 fraud-header builder consolidation step. No Business Details call was made.",
        },
        {
          check: "Obligations read-only discovery",
          status: "skip",
          detail:
            "Skipped in this QL-008 fraud-header builder consolidation step. No Obligations call was made.",
        },
      );
    }
  }

  const blockers = items
    .filter((item) => item.status === "block")
    .map((item) => `${item.check}: ${item.detail}`);

  return {
    ok: blockers.length === 0,
    generatedAt,
    hmrcNetworkCallsAttempted,
    hmrcSubmissionCallsAttempted: false,
    blockers,
    items,
    missingFraudPreventionInputs: dedupeMissingFraudInputs(
      missingFraudPreventionInputs,
    ),
    fraudPreventionHeaderBuild: fraudHeaderBuildSummary,
    ...(fphApplicationToken === undefined ? {} : { fphApplicationToken }),
    ...(testFraudPreventionHeaders === undefined
      ? {}
      : { testFraudPreventionHeaders }),
  };
}

export function buildFraudPreventionInputFromEnv(
  env: EnvironmentSource = process.env,
): FraudPreventionInputParseResult {
  const partialInput = buildPartialFraudPreventionInputFromEnv(env);
  const headerBuild = buildWebAppViaServerFraudPreventionHeaders(partialInput);
  const missing =
    headerBuild.ok === true
      ? []
      : headerBuild.missing.map(toMissingFraudInput);

  if (!headerBuild.ok) {
    return { missing, headerBuild };
  }

  const input: FraudPreventionAssemblyInput = {
    client: {
      browserJsUserAgent: partialInput.client.browserJsUserAgent ?? "",
      deviceId: partialInput.client.deviceId ?? "",
      multiFactor: partialInput.client.multiFactor,
      screens: partialInput.client.screens ?? [],
      timezone: partialInput.client.timezone ?? "",
      windowSize: partialInput.client.windowSize ?? { width: 0, height: 0 },
    },
    server: {
      clientPublicIp: partialInput.server.clientPublicIp ?? "",
      clientPublicIpTimestamp: partialInput.server.clientPublicIpTimestamp ?? "",
      clientPublicPort: partialInput.server.clientPublicPort ?? 0,
      clientUserIds: partialInput.server.clientUserIds ?? {},
      vendorForwarded: partialInput.server.vendorForwarded ?? [],
      vendorLicenseIds: partialInput.server.vendorLicenseIds,
      vendorProductName: partialInput.server.vendorProductName ?? "QuarterLink",
      vendorPublicIp: partialInput.server.vendorPublicIp ?? "",
      vendorVersion: partialInput.server.vendorVersion ?? {},
    },
  };

  return { input, missing, headerBuild };
}

function buildPartialFraudPreventionInputFromEnv(
  env: EnvironmentSource,
): WebAppViaServerFraudPreventionInput {
  const clientUserIdKey = optionalEnv(env, "QL_008_FRAUD_CLIENT_USER_ID_KEY");
  const clientUserIdValue = optionalEnv(env, "QL_008_FRAUD_CLIENT_USER_ID_VALUE");
  const vendorLicenseKey = optionalEnv(env, "QL_008_FRAUD_VENDOR_LICENSE_ID_KEY");
  const vendorLicenseValue = optionalEnv(
    env,
    "QL_008_FRAUD_VENDOR_LICENSE_ID_VALUE",
  );
  const vendorForwardedBy = optionalEnv(env, "QL_008_FRAUD_VENDOR_FORWARDED_BY");
  const vendorForwardedFor = optionalEnv(env, "QL_008_FRAUD_VENDOR_FORWARDED_FOR");
  const screenWidth = parseOptionalInteger(env, "QL_008_FRAUD_SCREEN_WIDTH");
  const screenHeight = parseOptionalInteger(env, "QL_008_FRAUD_SCREEN_HEIGHT");
  const screenScalingFactor = parseOptionalNumber(
    env,
    "QL_008_FRAUD_SCREEN_SCALING_FACTOR",
  );
  const screenColourDepth = parseOptionalInteger(
    env,
    "QL_008_FRAUD_SCREEN_COLOUR_DEPTH",
  );
  const windowWidth = parseOptionalInteger(env, "QL_008_FRAUD_WINDOW_WIDTH");
  const windowHeight = parseOptionalInteger(env, "QL_008_FRAUD_WINDOW_HEIGHT");
  const mfaType = optionalEnv(env, "QL_008_FRAUD_MFA_TYPE");
  const mfaTimestamp = optionalEnv(env, "QL_008_FRAUD_MFA_TIMESTAMP");
  const mfaUniqueReference = optionalEnv(
    env,
    "QL_008_FRAUD_MFA_UNIQUE_REFERENCE",
  );

  return {
    localSandbox: env.APP_ENV?.trim() === "local" && env.HMRC_ENV?.trim() === "sandbox",
    client: {
      browserJsUserAgent: optionalEnv(env, "QL_008_FRAUD_BROWSER_JS_USER_AGENT"),
      deviceId: optionalEnv(env, "QL_008_FRAUD_DEVICE_ID"),
      multiFactor:
        mfaType === undefined ||
        mfaTimestamp === undefined ||
        mfaUniqueReference === undefined
          ? undefined
          : [
              {
                type: parseMfaType(mfaType),
                timestamp: mfaTimestamp,
                uniqueReference: mfaUniqueReference,
              },
            ],
      screens:
        screenWidth === undefined ||
        screenHeight === undefined ||
        screenScalingFactor === undefined ||
        screenColourDepth === undefined
          ? undefined
          : [
              {
                width: screenWidth,
                height: screenHeight,
                scalingFactor: screenScalingFactor,
                colourDepth: screenColourDepth,
              },
            ],
      timezone: optionalEnv(env, "QL_008_FRAUD_TIMEZONE"),
      windowSize:
        windowWidth === undefined || windowHeight === undefined
          ? undefined
          : {
              width: windowWidth,
              height: windowHeight,
            },
    },
    server: {
      clientPublicIp: optionalEnv(env, "QL_008_FRAUD_CLIENT_PUBLIC_IP"),
      clientPublicIpTimestamp: optionalEnv(
        env,
        "QL_008_FRAUD_CLIENT_PUBLIC_IP_TIMESTAMP",
      ),
      clientPublicPort: parseOptionalInteger(
        env,
        "QL_008_FRAUD_CLIENT_PUBLIC_PORT",
      ),
      clientUserIds:
        clientUserIdKey === undefined || clientUserIdValue === undefined
          ? undefined
          : { [clientUserIdKey]: clientUserIdValue },
      vendorForwarded:
        vendorForwardedBy === undefined || vendorForwardedFor === undefined
          ? undefined
          : [
              {
                by: vendorForwardedBy,
                for: vendorForwardedFor,
              },
            ],
      vendorLicenseIds:
        vendorLicenseKey === undefined || vendorLicenseValue === undefined
          ? undefined
          : { [vendorLicenseKey]: vendorLicenseValue },
      vendorProductName:
        optionalEnv(env, "QL_008_FRAUD_VENDOR_PRODUCT_NAME") ?? "QuarterLink",
      vendorPublicIp: optionalEnv(env, "QL_008_FRAUD_VENDOR_PUBLIC_IP"),
      vendorVersion: {
        quarterlink:
          optionalEnv(env, "QL_008_FRAUD_VENDOR_VERSION") ??
          optionalEnv(env, "npm_package_version") ??
          "0.1.0",
      },
    },
  };
}

function summariseFraudHeaderBuild(
  build: WebAppViaServerFraudPreventionBuildResult,
  allowHmrcNetworkCalls: boolean,
): Ql008FraudPreventionHeaderBuildSummary {
  const statuses = build.statuses;

  return {
    redactedHeaders: build.redactedHeaders,
    presentHeaderNames: headerNamesWithStatus(statuses, "present"),
    missingHeaderNames: headerNamesWithStatus(statuses, "missing"),
    unavailableOnLocalhostHeaderNames: headerNamesWithStatus(
      statuses,
      "unavailable-on-localhost",
    ),
    manualOverrideHeaderNames: headerNamesWithStatus(
      statuses,
      "manual-override-required",
    ),
    statuses,
    testFraudPreventionHeadersRunnable: build.ok && allowHmrcNetworkCalls,
  };
}

function headerNamesWithStatus(
  statuses: readonly FraudPreventionHeaderBuildStatus[],
  status: FraudPreventionHeaderBuildStatus["status"],
): readonly string[] {
  return statuses
    .filter((item) => item.status === status)
    .map((item) => item.headerName);
}

function formatFraudHeaderBuildDetail(
  summary: Ql008FraudPreventionHeaderBuildSummary,
): string {
  return [
    `${summary.presentHeaderNames.length} header(s) buildable`,
    `${summary.missingHeaderNames.length} missing`,
    `${summary.unavailableOnLocalhostHeaderNames.length} unavailable on localhost`,
    `${summary.manualOverrideHeaderNames.length} manual override required`,
    summary.testFraudPreventionHeadersRunnable
      ? "Test Fraud Prevention Headers is allowed to run."
      : "Test Fraud Prevention Headers is not runnable in this dry-run/default state.",
  ].join("; ");
}

async function validateFraudPreventionHeaders(input: {
  readonly apiBaseUrl: string;
  readonly applicationRestrictedToken: string;
  readonly fraudPreventionHeaders: HmrcHeaders;
  readonly fetchImpl: FetchLike;
  readonly timeoutMs: number;
}): Promise<Ql008TestFraudPreventionHeadersResult> {
  const url = new URL(
    "/test/fraud-prevention-headers/validate",
    input.apiBaseUrl,
  );
  const response = await fetchWithTimeout(input.fetchImpl, url, {
    method: "GET",
    headers: {
      Accept: TEST_FPH_ACCEPT,
      Authorization: `Bearer ${input.applicationRestrictedToken}`,
      ...input.fraudPreventionHeaders,
    },
  }, input.timeoutMs);
  const payload = await readJson(response);
  const code = getString(payload, "code");

  return {
    attempted: true,
    passed: response.ok && code === "VALID_HEADERS",
    safeMetadata: {
      endpoint: "Test Fraud Prevention Headers",
      method: "GET",
      path: "/test/fraud-prevention-headers/validate",
      status: response.status,
      ok: response.ok,
      code: code ?? "not returned",
      specVersion: getString(payload, "specVersion") ?? "not returned",
      errors: redactEvidenceValue(payload.errors ?? []),
      warnings: redactEvidenceValue(payload.warnings ?? []),
    },
  };
}

async function resolveFphApplicationToken(input: {
  readonly env: EnvironmentSource;
  readonly fetchImpl: FetchLike;
  readonly timeoutMs: number;
}): Promise<ResolvedFphApplicationToken> {
  const overrideToken = optionalEnv(input.env, APPLICATION_RESTRICTED_TOKEN_OVERRIDE_ENV);

  if (overrideToken !== undefined) {
    return {
      accessToken: overrideToken,
      hmrcNetworkCallAttempted: false,
      result: {
        attempted: false,
        obtained: true,
        usedOverride: true,
        safeMetadata: {
          tokenSource: "optional local override",
          hasAccessToken: true,
        },
      },
    };
  }

  const tokenUrl = new URL("/oauth/token", HMRC_SANDBOX_API_BASE_URL);
  const body = new URLSearchParams();
  body.set("client_id", requirePresentEnv(input.env, "HMRC_SANDBOX_CLIENT_ID"));
  body.set(
    "client_secret",
    requirePresentEnv(input.env, "HMRC_SANDBOX_CLIENT_SECRET"),
  );
  body.set("grant_type", "client_credentials");

  const scopes = optionalEnv(input.env, APPLICATION_RESTRICTED_SCOPE_ENV);
  if (scopes !== undefined) {
    body.set("scope", scopes);
  }

  try {
    const response = await fetchWithTimeout(input.fetchImpl, tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }, input.timeoutMs);
    const payload = await readJson(response);
    const accessToken = getString(payload, "access_token");

    return {
      accessToken: response.ok ? accessToken : undefined,
      hmrcNetworkCallAttempted: true,
      result: {
        attempted: true,
        obtained: response.ok && accessToken !== undefined,
        usedOverride: false,
        safeMetadata: {
          endpoint: "OAuth token",
          method: "POST",
          url: `${HMRC_SANDBOX_API_BASE_URL}/oauth/token`,
          status: response.status,
          ok: response.ok,
          grantType: "client_credentials",
          requestedScope: scopes ?? "none required by current Test Fraud Prevention Headers API docs",
          hasAccessToken: accessToken !== undefined,
          tokenType: getString(payload, "token_type") ?? "not returned",
          expiresIn: getNumber(payload, "expires_in") ?? "not returned",
          errorCode: getString(payload, "error"),
        },
      },
    };
  } catch (error) {
    return {
      hmrcNetworkCallAttempted: true,
      result: {
        attempted: true,
        obtained: false,
        usedOverride: false,
        safeMetadata: {
          endpoint: "OAuth token",
          method: "POST",
          url: `${HMRC_SANDBOX_API_BASE_URL}/oauth/token`,
          ok: false,
          grantType: "client_credentials",
          requestedScope: scopes ?? "none required by current Test Fraud Prevention Headers API docs",
          error: error instanceof Error ? error.name : "UnknownError",
        },
      },
    };
  }
}

function loadSandboxConfigItem(
  items: Ql008SandboxDiscoveryItem[],
  env: EnvironmentSource,
): ReturnType<typeof loadHmrcSandboxConfig> | undefined {
  try {
    const config = loadHmrcSandboxConfig(env);
    items.push({
      check: "Sandbox configuration",
      status: "pass",
      detail: "HMRC sandbox configuration is valid. Secret values not displayed.",
    });
    return config;
  } catch (error) {
    items.push({
      check: "Sandbox configuration",
      status: "block",
      detail:
        error instanceof Error
          ? error.message
          : "HMRC sandbox configuration is invalid.",
    });
    return undefined;
  }
}

function recordTokenSource(
  items: Ql008SandboxDiscoveryItem[],
  env: EnvironmentSource,
): void {
  items.push(
    {
      check: "Fresh user-restricted OAuth token",
      status: isPresent(env[USER_RESTRICTED_TOKEN_ENV]) ? "pass" : "skip",
      detail: isPresent(env[USER_RESTRICTED_TOKEN_ENV])
        ? "Present for later read-only Income Tax MTD discovery. Value not displayed."
        : `${USER_RESTRICTED_TOKEN_ENV} will be required after Test Fraud Prevention Headers passes.`,
    },
    {
      check: "Application-restricted Test Fraud Prevention Headers token source",
      status: "pass",
      detail: isPresent(env[APPLICATION_RESTRICTED_TOKEN_OVERRIDE_ENV])
        ? "Optional override token is present. Value not displayed."
        : "No manual token is required; the script will request a client_credentials token when HMRC calls are explicitly enabled.",
    },
    {
      check: "Sandbox taxpayer identifier",
      status: isPresent(env.HMRC_SANDBOX_TEST_NINO) ? "pass" : "skip",
      detail: isPresent(env.HMRC_SANDBOX_TEST_NINO)
        ? "Present for later read-only Business Details and Obligations discovery. Value not displayed."
        : "HMRC_SANDBOX_TEST_NINO will be required after Test Fraud Prevention Headers passes.",
    },
  );
}

function toMissingFraudInput(
  missing: FraudPreventionMissingValue,
): Ql008MissingFraudPreventionInput {
  const configuredField = REQUIRED_FPH_ENV_INPUTS.find(
    (field) => field.headerName === missing.headerName,
  );

  return {
    headerName: missing.headerName,
    variables: missing.variables ?? configuredField?.variables ?? [],
    reason: missing.reason,
    ...(missing.status === undefined ? {} : { status: missing.status }),
  };
}

function dedupeMissingFraudInputs(
  missing: readonly Ql008MissingFraudPreventionInput[],
): readonly Ql008MissingFraudPreventionInput[] {
  const seen = new Set<string>();

  return missing.filter((item) => {
    const key = `${item.headerName}:${item.variables.join(",")}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function parseMfaType(value: string): "TOTP" | "AUTH_CODE" | "OTHER" {
  if (value === "TOTP" || value === "AUTH_CODE" || value === "OTHER") {
    return value;
  }

  return "OTHER";
}

function parseOptionalInteger(
  env: EnvironmentSource,
  variable: string,
): number | undefined {
  const value = optionalEnv(env, variable);

  if (value === undefined) {
    return undefined;
  }

  const parsedValue = Number.parseInt(value, 10);

  return Number.isInteger(parsedValue) ? parsedValue : undefined;
}

function parseOptionalNumber(
  env: EnvironmentSource,
  variable: string,
): number | undefined {
  const value = optionalEnv(env, variable);

  if (value === undefined) {
    return undefined;
  }

  const parsedValue = Number.parseFloat(value);

  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function formatHeaderList(headerNames: readonly string[]): string {
  const uniqueHeaders = [...new Set(headerNames)];
  return uniqueHeaders.length === 0 ? "none" : uniqueHeaders.join(", ");
}

async function fetchWithTimeout(
  fetchImpl: FetchLike,
  url: URL,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetchImpl(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function requirePresentEnv(env: EnvironmentSource, variable: string): string {
  const value = optionalEnv(env, variable);

  if (value === undefined) {
    throw new Error(`${variable} is required.`);
  }

  return value;
}

function optionalEnv(
  env: EnvironmentSource,
  variable: string,
): string | undefined {
  const value = env[variable];

  if (!isPresent(value)) {
    return undefined;
  }

  return value.trim();
}

function isPresent(value: string | undefined): value is string {
  if (value === undefined) {
    return false;
  }

  const trimmedValue = value.trim();

  return (
    trimmedValue.length > 0 &&
    trimmedValue.toLowerCase() !== "null" &&
    trimmedValue.toLowerCase() !== "undefined"
  );
}

async function readJson(
  response: Response,
): Promise<Readonly<Record<string, unknown>>> {
  const text = await response.text();

  if (text.trim().length === 0) {
    return {};
  }

  try {
    const payload = JSON.parse(text);

    if (payload !== null && typeof payload === "object" && !Array.isArray(payload)) {
      return payload as Readonly<Record<string, unknown>>;
    }
  } catch {
    return {};
  }

  return {};
}

function getString(
  record: Readonly<Record<string, unknown>>,
  key: string,
): string | undefined {
  const value = record[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  return value;
}

function getNumber(
  record: Readonly<Record<string, unknown>>,
  key: string,
): number | undefined {
  const value = record[key];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return value;
}
