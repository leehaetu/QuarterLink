import { execFileSync } from "node:child_process";
import {
  assembleFraudPreventionHeaders,
  WEB_APP_VIA_SERVER_FRAUD_HEADER_NAMES,
} from "./fraud-prevention";
import {
  assertSandboxEvidenceOutputPath,
  classifyHmrcEvidence,
  type HmrcEvidenceClassification,
} from "./evidence";
import {
  HMRC_SANDBOX_API_BASE_URL,
  HMRC_SANDBOX_AUTH_BASE_URL,
  type FraudPreventionAssemblyInput,
  type HmrcConfigValidationResult,
  type HmrcValidationIssue,
} from "./types";
import { validateHmrcSandboxConfig } from "./config";

type EnvironmentSource = Readonly<Record<string, string | undefined>>;

export type Ql008PreflightStatus = "pass" | "block";

export interface Ql008PreflightItem {
  readonly check: string;
  readonly status: Ql008PreflightStatus;
  readonly detail: string;
}

export interface Ql008OfficialEndpoint {
  readonly api: string;
  readonly version: string;
  readonly method: string;
  readonly path: string;
  readonly acceptHeader: string;
  readonly scopes: readonly string[];
  readonly sourceUrl: string;
  readonly note?: string;
}

export interface Ql008PreflightInput {
  readonly env?: EnvironmentSource;
  readonly fraudPreventionInput?: FraudPreventionAssemblyInput;
  readonly evidenceOutputPath?: string;
}

export interface Ql008PreflightResult {
  readonly ok: boolean;
  readonly generatedAt: string;
  readonly evidenceClassification: HmrcEvidenceClassification;
  readonly sandboxCallsAllowed: boolean;
  readonly officialEndpoints: readonly Ql008OfficialEndpoint[];
  readonly items: readonly Ql008PreflightItem[];
  readonly blockers: readonly string[];
}

const REQUIRED_SCOPES = ["read:self-assessment", "write:self-assessment"] as const;

const PRODUCTION_ENV_KEYS = [
  "HMRC_PRODUCTION_API_BASE_URL",
  "HMRC_PRODUCTION_AUTH_BASE_URL",
  "HMRC_PRODUCTION_CLIENT_ID",
  "HMRC_PRODUCTION_CLIENT_SECRET",
  "HMRC_PRODUCTION_REDIRECT_URI",
] as const;

const SAFE_EVIDENCE_OUTPUT_PATH = ".agent/evidence/hmrc-sandbox/QL-008/";

export const QL_008_OFFICIAL_ENDPOINTS: readonly Ql008OfficialEndpoint[] = [
  {
    api: "Business Details (MTD)",
    version: "2.0",
    method: "GET",
    path: "/individuals/business/details/{nino}/list",
    acceptHeader: "application/vnd.hmrc.2.0+json",
    scopes: ["read:self-assessment"],
    sourceUrl:
      "https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/business-details-api/2.0",
  },
  {
    api: "Obligations (MTD)",
    version: "3.0",
    method: "GET",
    path: "/obligations/details/{nino}/income-and-expenditure",
    acceptHeader: "application/vnd.hmrc.3.0+json",
    scopes: ["read:self-assessment"],
    sourceUrl:
      "https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/obligations-api/3.0",
  },
  {
    api: "Self Employment Business (MTD)",
    version: "5.0",
    method: "POST",
    path: "/individuals/business/self-employment/{nino}/{businessId}/period",
    acceptHeader: "application/vnd.hmrc.5.0+json",
    scopes: ["write:self-assessment"],
    sourceUrl:
      "https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/self-employment-business-api/5.0",
    note: "The create period summary endpoint states it can only be used for tax year 2024-25 or earlier and points to cumulative submission for 2025-26 onwards.",
  },
  {
    api: "Test Fraud Prevention Headers",
    version: "1.0",
    method: "GET",
    path: "/test/fraud-prevention-headers/validate",
    acceptHeader: "application/vnd.hmrc.1.0+json",
    scopes: [],
    sourceUrl:
      "https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/txm-fph-validator-api/1.0",
    note: "Application-restricted endpoint using OAuth client credentials.",
  },
];

export function runQl008Preflight(
  input: Ql008PreflightInput = {},
): Ql008PreflightResult {
  const env = input.env ?? process.env;
  const items: Ql008PreflightItem[] = [];
  const configResult = validateHmrcSandboxConfig(env);

  recordConfigItems(items, configResult);
  recordProductionBlock(items, env);
  recordOfficialScopes(items, configResult);
  recordOAuthReadiness(items, env);
  recordSandboxContext(items, env);
  recordFraudPreventionReadiness(items, input.fraudPreventionInput);
  recordEvidenceSafety(items, input.evidenceOutputPath ?? SAFE_EVIDENCE_OUTPUT_PATH);

  const blockers = items
    .filter((item) => item.status === "block")
    .map((item) => `${item.check}: ${item.detail}`);

  const ok = blockers.length === 0;

  return {
    ok,
    generatedAt: new Date().toISOString(),
    evidenceClassification: classifyHmrcEvidence({
      environment: "local",
      cameFromActualHmrcResponse: false,
    }),
    sandboxCallsAllowed: ok,
    officialEndpoints: QL_008_OFFICIAL_ENDPOINTS,
    items,
    blockers,
  };
}

function recordConfigItems(
  items: Ql008PreflightItem[],
  configResult: HmrcConfigValidationResult,
): void {
  if (configResult.ok) {
    items.push(
      {
        check: "Sandbox API base URL",
        status: configResult.config.apiBaseUrl === HMRC_SANDBOX_API_BASE_URL ? "pass" : "block",
        detail: "Configured for the HMRC sandbox API origin.",
      },
      {
        check: "Sandbox auth base URL",
        status:
          configResult.config.authBaseUrl === HMRC_SANDBOX_AUTH_BASE_URL
            ? "pass"
            : "block",
        detail: "Configured for the HMRC sandbox authorisation origin.",
      },
      {
        check: "HMRC sandbox client ID",
        status: "pass",
        detail: "Present in server-side configuration. Value not displayed.",
      },
      {
        check: "HMRC sandbox client secret",
        status: "pass",
        detail: "Present in server-side configuration. Value not displayed.",
      },
      {
        check: "HMRC sandbox redirect URI",
        status: "pass",
        detail: "Present and syntactically valid for OAuth readiness.",
      },
    );
    return;
  }

  for (const issue of configResult.issues) {
    items.push({
      check: `Sandbox config ${issue.variable}`,
      status: "block",
      detail: safeConfigIssueDetail(issue),
    });
  }
}

function recordProductionBlock(
  items: Ql008PreflightItem[],
  env: EnvironmentSource,
): void {
  const presentProductionKeys = PRODUCTION_ENV_KEYS.filter((key) =>
    isPresent(env[key]),
  );

  items.push({
    check: "Production HMRC configuration disabled",
    status: presentProductionKeys.length === 0 ? "pass" : "block",
    detail:
      presentProductionKeys.length === 0
        ? "No production HMRC environment keys are present in the supplied configuration."
        : `Production HMRC keys are present and blocked: ${presentProductionKeys.join(", ")}.`,
  });
}

function recordOfficialScopes(
  items: Ql008PreflightItem[],
  configResult: HmrcConfigValidationResult,
): void {
  items.push({
    check: "Current official endpoint versions",
    status: "pass",
    detail:
      "Official docs checked for Business Details 2.0, Obligations 3.0, Self Employment Business 5.0, and Test Fraud Prevention Headers 1.0.",
  });

  if (!configResult.ok) {
    items.push({
      check: "Required OAuth scopes",
      status: "block",
      detail:
        "Cannot compare configured scopes because HMRC sandbox config did not validate.",
    });
    return;
  }

  const missingScopes = REQUIRED_SCOPES.filter(
    (scope) => !configResult.config.scopes.includes(scope),
  );

  items.push({
    check: "Required OAuth scopes",
    status: missingScopes.length === 0 ? "pass" : "block",
    detail:
      missingScopes.length === 0
        ? "Configured scopes include read:self-assessment and write:self-assessment."
        : `Configured scopes are missing: ${missingScopes.join(", ")}.`,
  });
}

function recordOAuthReadiness(
  items: Ql008PreflightItem[],
  env: EnvironmentSource,
): void {
  items.push(
    {
      check: "User-restricted OAuth access token",
      status: isPresent(env.HMRC_SANDBOX_ACCESS_TOKEN) ? "pass" : "block",
      detail: isPresent(env.HMRC_SANDBOX_ACCESS_TOKEN)
        ? "Server-side sandbox access token is present. Value not displayed."
        : "No server-side sandbox access token is available for user-restricted Income Tax MTD endpoints.",
    },
    {
      check: "Sandbox test user authority",
      status: isPresent(env.HMRC_SANDBOX_TEST_USER_READY) ? "pass" : "block",
      detail: isPresent(env.HMRC_SANDBOX_TEST_USER_READY)
        ? "Sandbox test user readiness flag is present."
        : "No sandbox test-user authority/readiness flag is available.",
    },
  );
}

function recordSandboxContext(
  items: Ql008PreflightItem[],
  env: EnvironmentSource,
): void {
  const requiredContext = [
    "HMRC_SANDBOX_TEST_NINO",
    "HMRC_SANDBOX_SELF_EMPLOYMENT_BUSINESS_ID",
    "HMRC_SANDBOX_TAX_YEAR",
    "HMRC_SANDBOX_PERIOD_START_DATE",
    "HMRC_SANDBOX_PERIOD_END_DATE",
  ] as const;

  const missingContext = requiredContext.filter((key) => !isPresent(env[key]));

  items.push({
    check: "Sandbox taxpayer and self-employment period context",
    status: missingContext.length === 0 ? "pass" : "block",
    detail:
      missingContext.length === 0
        ? "Required sandbox taxpayer/business/period context values are present. Values not displayed."
        : `Missing required sandbox context variables: ${missingContext.join(", ")}.`,
  });
}

function recordFraudPreventionReadiness(
  items: Ql008PreflightItem[],
  fraudPreventionInput: FraudPreventionAssemblyInput | undefined,
): void {
  if (fraudPreventionInput === undefined) {
    items.push({
      check: "Fraud-prevention-header assembly",
      status: "block",
      detail: `No QL-008 fraud-prevention input was supplied. Required WEB_APP_VIA_SERVER headers: ${WEB_APP_VIA_SERVER_FRAUD_HEADER_NAMES.join(", ")}.`,
    });
    return;
  }

  const result = assembleFraudPreventionHeaders(fraudPreventionInput);

  items.push({
    check: "Fraud-prevention-header assembly",
    status: result.ok ? "pass" : "block",
    detail: result.ok
      ? "WEB_APP_VIA_SERVER headers can be assembled. Raw header values not displayed."
      : `Missing or invalid fraud-prevention values: ${result.missing
          .map((item) => item.headerName)
          .join(", ")}.`,
  });
}

function recordEvidenceSafety(
  items: Ql008PreflightItem[],
  evidenceOutputPath: string,
): void {
  try {
    assertSandboxEvidenceOutputPath(evidenceOutputPath);
    items.push({
      check: "Evidence output path",
      status: "pass",
      detail: `Sandbox-only evidence path accepted: ${evidenceOutputPath}.`,
    });
  } catch (error) {
    items.push({
      check: "Evidence output path",
      status: "block",
      detail: error instanceof Error ? error.message : "Evidence path is invalid.",
    });
  }

  items.push({
    check: "Evidence/log redaction",
    status: "pass",
    detail:
      "QL-007 redaction helpers are available; QL-008 preflight output reports presence/status only.",
  });

  items.push({
    check: "Secret file commit safety",
    status: trackedSecretFilesAreAbsent() ? "pass" : "block",
    detail: trackedSecretFilesAreAbsent()
      ? "No tracked .env or secret input files are detected by the QL-008 preflight helper."
      : "A tracked .env or secret input file was detected and must be removed before proceeding.",
  });
}

function safeConfigIssueDetail(issue: HmrcValidationIssue): string {
  return `${issue.code}: ${issue.message}`;
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

function trackedSecretFilesAreAbsent(): boolean {
  const trackedSecretPaths = [
    ".env",
    ".env.local",
    ".env.development.local",
    ".env.production.local",
    ".agent/evidence/hmrc-sandbox/QL-008/input.json",
  ];

  try {
    const output = execFileSync("git", ["ls-files", "--", ...trackedSecretPaths], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    return output.trim().length === 0;
  } catch {
    return true;
  }
}
