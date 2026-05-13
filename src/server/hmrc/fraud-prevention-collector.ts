import { isIP } from "node:net";

type EnvironmentSource = Readonly<Record<string, string | undefined>>;
type HeaderSource = Headers | Readonly<Record<string, string | undefined>>;

export const QL_008_FRAUD_COLLECTOR_PATH =
  "/api/local-sandbox/fraud-prevention-inputs";

export type Ql008FraudInputStatus =
  | "collected"
  | "manual-override"
  | "missing"
  | "unavailable-on-localhost";

export interface Ql008FraudCollectorUiState {
  readonly enabled: boolean;
  readonly appEnvironment: string;
  readonly hmrcEnvironment: string;
  readonly endpointPath: string;
}

export interface Ql008BrowserFraudInputPayload {
  readonly browserJsUserAgent?: string;
  readonly deviceId?: string;
  readonly screenWidth?: number;
  readonly screenHeight?: number;
  readonly screenScalingFactor?: number;
  readonly screenColourDepth?: number;
  readonly timezone?: string;
  readonly windowWidth?: number;
  readonly windowHeight?: number;
}

export interface Ql008FraudInputVariable {
  readonly name: Ql008FraudVariableName;
  readonly status: Ql008FraudInputStatus;
  readonly source: string;
  readonly sensitive: boolean;
  readonly value?: string;
  readonly warning?: string;
}

export interface Ql008FraudInputCollectionResult {
  readonly ok: boolean;
  readonly generatedAt: string;
  readonly localSandboxOnly: boolean;
  readonly hmrcApiCallsAttempted: false;
  readonly hmrcSubmissionCallsAttempted: false;
  readonly variables: readonly Ql008FraudInputVariable[];
  readonly envSnippet: string;
  readonly automaticallyCollected: readonly Ql008FraudVariableName[];
  readonly manualOverrideRequired: readonly Ql008FraudVariableName[];
  readonly warnings: readonly string[];
}

export type Ql008FraudVariableName =
  | "QL_008_FRAUD_BROWSER_JS_USER_AGENT"
  | "QL_008_FRAUD_DEVICE_ID"
  | "QL_008_FRAUD_MFA_TYPE"
  | "QL_008_FRAUD_MFA_TIMESTAMP"
  | "QL_008_FRAUD_MFA_UNIQUE_REFERENCE"
  | "QL_008_FRAUD_CLIENT_PUBLIC_IP"
  | "QL_008_FRAUD_CLIENT_PUBLIC_IP_TIMESTAMP"
  | "QL_008_FRAUD_CLIENT_PUBLIC_PORT"
  | "QL_008_FRAUD_SCREEN_WIDTH"
  | "QL_008_FRAUD_SCREEN_HEIGHT"
  | "QL_008_FRAUD_SCREEN_SCALING_FACTOR"
  | "QL_008_FRAUD_SCREEN_COLOUR_DEPTH"
  | "QL_008_FRAUD_TIMEZONE"
  | "QL_008_FRAUD_CLIENT_USER_ID_KEY"
  | "QL_008_FRAUD_CLIENT_USER_ID_VALUE"
  | "QL_008_FRAUD_WINDOW_WIDTH"
  | "QL_008_FRAUD_WINDOW_HEIGHT"
  | "QL_008_FRAUD_VENDOR_FORWARDED_BY"
  | "QL_008_FRAUD_VENDOR_FORWARDED_FOR"
  | "QL_008_FRAUD_VENDOR_LICENSE_ID_KEY"
  | "QL_008_FRAUD_VENDOR_LICENSE_ID_VALUE"
  | "QL_008_FRAUD_VENDOR_PUBLIC_IP"
  | "QL_008_FRAUD_VENDOR_VERSION";

const MANUAL_MFA_VARIABLES: readonly Ql008FraudInputVariable[] = [
  {
    name: "QL_008_FRAUD_MFA_TYPE",
    status: "manual-override",
    source: "QuarterLink authentication event",
    sensitive: true,
    warning:
      "Local demo sign-in is not a real MFA event. Use real local sandbox auth metadata or an HMRC-agreed missing-data approach.",
  },
  {
    name: "QL_008_FRAUD_MFA_TIMESTAMP",
    status: "manual-override",
    source: "QuarterLink authentication event",
    sensitive: true,
    warning:
      "Use the timestamp of the last successful MFA prompt for the originating user action.",
  },
  {
    name: "QL_008_FRAUD_MFA_UNIQUE_REFERENCE",
    status: "manual-override",
    source: "QuarterLink authentication event",
    sensitive: true,
    warning:
      "Use a consistent salted hash or equivalent reference, never the MFA secret itself.",
  },
];

const MANUAL_USER_ID_VARIABLES: readonly Ql008FraudInputVariable[] = [
  {
    name: "QL_008_FRAUD_CLIENT_USER_ID_KEY",
    status: "manual-override",
    source: "Authenticated QuarterLink user identity",
    sensitive: true,
    warning:
      "QL-BOOTSTRAP has no production auth or database user record, so this must be a local sandbox override.",
  },
  {
    name: "QL_008_FRAUD_CLIENT_USER_ID_VALUE",
    status: "manual-override",
    source: "Authenticated QuarterLink user identity",
    sensitive: true,
    warning:
      "Do not use a real taxpayer identifier unless it is the intended local sandbox user identifier.",
  },
];

const MANUAL_LICENSE_VARIABLES: readonly Ql008FraudInputVariable[] = [
  {
    name: "QL_008_FRAUD_VENDOR_LICENSE_ID_KEY",
    status: "manual-override",
    source: "QuarterLink licence metadata",
    sensitive: true,
    warning:
      "QL-BOOTSTRAP has no licence system. Use a local sandbox value only if it reflects the actual test setup.",
  },
  {
    name: "QL_008_FRAUD_VENDOR_LICENSE_ID_VALUE",
    status: "manual-override",
    source: "QuarterLink licence metadata",
    sensitive: true,
    warning:
      "Use a hashed licence reference or an HMRC-agreed missing-data approach. Do not invent production evidence.",
  },
];

const PUBLIC_CLIENT_IP_HEADERS = [
  "true-client-ip",
  "cf-connecting-ip",
  "x-real-ip",
  "x-client-ip",
  "x-forwarded-for",
  "forwarded",
] as const;

const CLIENT_PUBLIC_PORT_HEADERS = [
  "x-client-public-port",
  "x-forwarded-client-port",
  "x-original-client-port",
] as const;

const VENDOR_PUBLIC_IP_HEADERS = [
  "x-quarterlink-vendor-public-ip",
  "x-vendor-public-ip",
  "x-forwarded-by",
  "forwarded",
] as const;

export function getQl008FraudCollectorUiState(
  source: EnvironmentSource = process.env,
): Ql008FraudCollectorUiState {
  const appEnvironment = source.APP_ENV?.trim() ?? "";
  const hmrcEnvironment = source.HMRC_ENV?.trim() ?? "";

  return {
    enabled: appEnvironment === "local" && hmrcEnvironment === "sandbox",
    appEnvironment: appEnvironment || "not set",
    hmrcEnvironment: hmrcEnvironment || "not set",
    endpointPath: QL_008_FRAUD_COLLECTOR_PATH,
  };
}

export function collectQl008FraudPreventionInputs(input: {
  readonly browser: Ql008BrowserFraudInputPayload;
  readonly deviceId: string;
  readonly headers: HeaderSource;
  readonly env?: EnvironmentSource;
  readonly now?: () => Date;
}): Ql008FraudInputCollectionResult {
  const env = input.env ?? process.env;
  const generatedAt = (input.now ?? (() => new Date()))().toISOString();
  const headers = normaliseHeaders(input.headers);
  const clientPublicIp = findFirstPublicIp(
    headers,
    PUBLIC_CLIENT_IP_HEADERS,
    "for",
  );
  const forwardedClient = parseForwardedFor(headers.get("forwarded"));
  const clientPublicPort =
    findClientPublicPort(headers) ?? forwardedClient?.port;
  const vendorPublicIp = findFirstPublicIp(
    headers,
    VENDOR_PUBLIC_IP_HEADERS,
    "by",
  );
  const npmVersion = env.npm_package_version?.trim();
  const variables: Ql008FraudInputVariable[] = [
    collectBrowserText(
      "QL_008_FRAUD_BROWSER_JS_USER_AGENT",
      input.browser.browserJsUserAgent,
      "browser navigator.userAgent",
    ),
    collectBrowserText(
      "QL_008_FRAUD_DEVICE_ID",
      input.deviceId,
      "verified HTTP-only signed server cookie",
      true,
    ),
    ...MANUAL_MFA_VARIABLES,
    collectServerText(
      "QL_008_FRAUD_CLIENT_PUBLIC_IP",
      clientPublicIp,
      "trusted request IP headers",
      true,
      "No public client IP was available from the local request. Do not use localhost, private, or documentation IP ranges as a substitute.",
      "unavailable-on-localhost",
    ),
    {
      name: "QL_008_FRAUD_CLIENT_PUBLIC_IP_TIMESTAMP",
      status: "collected",
      source: "server request timestamp",
      sensitive: false,
      value: generatedAt,
      warning:
        clientPublicIp === undefined
          ? "Timestamp collected, but use it only with a matching public client IP captured at the same request boundary."
          : undefined,
    },
    collectServerText(
      "QL_008_FRAUD_CLIENT_PUBLIC_PORT",
      clientPublicPort === undefined ? undefined : String(clientPublicPort),
      "trusted edge client source-port header",
      true,
      "The local request did not expose the client's public TCP source port. Do not use server ports such as 80, 443, or the localhost dev port.",
      "unavailable-on-localhost",
    ),
    collectBrowserNumber(
      "QL_008_FRAUD_SCREEN_WIDTH",
      input.browser.screenWidth,
      "browser screen.width",
    ),
    collectBrowserNumber(
      "QL_008_FRAUD_SCREEN_HEIGHT",
      input.browser.screenHeight,
      "browser screen.height",
    ),
    collectBrowserNumber(
      "QL_008_FRAUD_SCREEN_SCALING_FACTOR",
      input.browser.screenScalingFactor,
      "browser window.devicePixelRatio",
    ),
    collectBrowserNumber(
      "QL_008_FRAUD_SCREEN_COLOUR_DEPTH",
      input.browser.screenColourDepth,
      "browser screen.colorDepth",
    ),
    collectBrowserText(
      "QL_008_FRAUD_TIMEZONE",
      input.browser.timezone,
      "browser timezone offset",
    ),
    ...MANUAL_USER_ID_VARIABLES,
    collectBrowserNumber(
      "QL_008_FRAUD_WINDOW_WIDTH",
      input.browser.windowWidth,
      "browser window.innerWidth",
    ),
    collectBrowserNumber(
      "QL_008_FRAUD_WINDOW_HEIGHT",
      input.browser.windowHeight,
      "browser window.innerHeight",
    ),
    collectServerText(
      "QL_008_FRAUD_VENDOR_FORWARDED_BY",
      clientPublicIp === undefined ? undefined : vendorPublicIp,
      "public vendor request boundary",
      true,
      "Vendor forwarded data needs the public vendor IP that received the request. Localhost/private hops are intentionally not used.",
      "unavailable-on-localhost",
    ),
    collectServerText(
      "QL_008_FRAUD_VENDOR_FORWARDED_FOR",
      vendorPublicIp === undefined ? undefined : clientPublicIp,
      "public client request boundary",
      true,
      "Vendor forwarded data needs the public client IP. Localhost/private hops are intentionally not used.",
      "unavailable-on-localhost",
    ),
    ...MANUAL_LICENSE_VARIABLES,
    collectServerText(
      "QL_008_FRAUD_VENDOR_PUBLIC_IP",
      vendorPublicIp,
      "trusted vendor public IP header",
      true,
      "No public vendor IP was available from the local request. Do not use localhost or a private interface as a substitute.",
      "unavailable-on-localhost",
    ),
    {
      name: "QL_008_FRAUD_VENDOR_VERSION",
      status: isPresent(npmVersion) ? "collected" : "missing",
      source: "npm package version",
      sensitive: false,
      value: isPresent(npmVersion) ? npmVersion : undefined,
      warning: isPresent(npmVersion)
        ? undefined
        : "npm_package_version was not available to the server process.",
    },
  ];

  const automaticallyCollected = variables
    .filter((item) => item.status === "collected")
    .map((item) => item.name);
  const manualOverrideRequired = variables
    .filter((item) => item.status !== "collected")
    .map((item) => item.name);
  const warnings = [
    "Local sandbox only. Do not use this collector in production.",
    "Do not paste collected values into chat or tickets.",
    "Do not commit .env.local.",
    "No HMRC API call or HMRC submission call is made by this collector.",
    ...variables.flatMap((item) => item.warning ?? []),
  ];

  return {
    ok: manualOverrideRequired.length === 0,
    generatedAt,
    localSandboxOnly: true,
    hmrcApiCallsAttempted: false,
    hmrcSubmissionCallsAttempted: false,
    variables,
    envSnippet: buildEnvSnippet(variables),
    automaticallyCollected,
    manualOverrideRequired,
    warnings,
  };
}

function collectBrowserText(
  name: Ql008FraudVariableName,
  value: string | undefined,
  source: string,
  sensitive = false,
): Ql008FraudInputVariable {
  return {
    name,
    status: isPresent(value) ? "collected" : "missing",
    source,
    sensitive,
    value: isPresent(value) ? value.trim() : undefined,
    warning: isPresent(value) ? undefined : "Browser did not provide this value.",
  };
}

function collectBrowserNumber(
  name: Ql008FraudVariableName,
  value: number | undefined,
  source: string,
): Ql008FraudInputVariable {
  const validValue = Number.isFinite(value) && value !== undefined && value > 0;

  return {
    name,
    status: validValue ? "collected" : "missing",
    source,
    sensitive: false,
    value: validValue ? String(value) : undefined,
    warning: validValue ? undefined : "Browser did not provide a positive value.",
  };
}

function collectServerText(
  name: Ql008FraudVariableName,
  value: string | undefined,
  source: string,
  sensitive: boolean,
  warning: string,
  missingStatus: Ql008FraudInputStatus = "missing",
): Ql008FraudInputVariable {
  return {
    name,
    status: isPresent(value) ? "collected" : missingStatus,
    source,
    sensitive,
    value: isPresent(value) ? value.trim() : undefined,
    warning: isPresent(value) ? undefined : warning,
  };
}

function buildEnvSnippet(variables: readonly Ql008FraudInputVariable[]): string {
  const lines = [
    "# QL-008 WEB_APP_VIA_SERVER fraud-prevention inputs",
    "# Local sandbox only. Do not paste into chat. Do not commit .env.local.",
    "# Values marked TODO need a real local override or an HMRC-agreed missing-data approach.",
  ];

  for (const variable of variables) {
    if (variable.sensitive) {
      lines.push("# Sensitive local value.");
    }

    if (variable.status === "collected" && variable.value !== undefined) {
      lines.push(`${variable.name}=${quoteEnvValue(variable.value)}`);
      continue;
    }

    lines.push(`# TODO ${variable.name}: ${variable.warning ?? "Manual value required."}`);
    lines.push(`${variable.name}=`);
  }

  return `${lines.join("\n")}\n`;
}

function quoteEnvValue(value: string): string {
  return JSON.stringify(value);
}

function normaliseHeaders(headers: HeaderSource): Map<string, string> {
  if (headers instanceof Headers) {
    return new Map(
      [...headers.entries()].map(([name, value]) => [name.toLowerCase(), value]),
    );
  }

  return new Map(
    Object.entries(headers).flatMap(([name, value]) =>
      value === undefined ? [] : [[name.toLowerCase(), value.trim()] as const],
    ),
  );
}

function findFirstPublicIp(
  headers: ReadonlyMap<string, string>,
  names: readonly string[],
  forwardedKey: "by" | "for",
): string | undefined {
  for (const name of names) {
    const value = headers.get(name);

    if (!isPresent(value)) {
      continue;
    }

    const candidates =
      name === "x-forwarded-for"
        ? value.split(",").map((part) => part.trim())
        : name === "forwarded"
          ? parseForwardedIps(value, forwardedKey)
          : [stripPort(value)];

    const publicIp = candidates.find(isPublicIp);
    if (publicIp !== undefined) {
      return publicIp;
    }
  }

  return undefined;
}

function findClientPublicPort(headers: ReadonlyMap<string, string>): number | undefined {
  for (const name of CLIENT_PUBLIC_PORT_HEADERS) {
    const port = parsePort(headers.get(name));

    if (port !== undefined) {
      return port;
    }
  }

  return undefined;
}

function parseForwardedIps(value: string, key: "by" | "for"): readonly string[] {
  return value
    .split(",")
    .flatMap((entry) =>
      entry
        .split(";")
        .map((part) => part.trim())
        .filter((part) => part.toLowerCase().startsWith(`${key}=`))
        .map((part) => stripForwardedValue(part.slice(part.indexOf("=") + 1)).ip),
    )
    .filter((ip): ip is string => ip !== undefined);
}

function parseForwardedFor(value: string | undefined): { readonly ip: string; readonly port?: number } | undefined {
  if (!isPresent(value)) {
    return undefined;
  }

  for (const entry of value.split(",")) {
    const parts = entry.split(";").map((part) => part.trim());
    const forPart = parts.find((part) => part.toLowerCase().startsWith("for="));

    if (forPart === undefined) {
      continue;
    }

    const parsed = stripForwardedValue(forPart.slice(forPart.indexOf("=") + 1));

    if (parsed.ip !== undefined && isPublicIp(parsed.ip)) {
      return {
        ip: parsed.ip,
        port: parsed.port,
      };
    }
  }

  return undefined;
}

function stripForwardedValue(value: string): { readonly ip?: string; readonly port?: number } {
  const unquoted = value.trim().replace(/^"|"$/g, "");

  if (unquoted.startsWith("[") && unquoted.includes("]")) {
    const closingIndex = unquoted.indexOf("]");
    const ip = unquoted.slice(1, closingIndex);
    const port = unquoted.slice(closingIndex + 1).startsWith(":")
      ? parsePort(unquoted.slice(closingIndex + 2))
      : undefined;

    return { ip, port };
  }

  const lastColonIndex = unquoted.lastIndexOf(":");

  if (
    lastColonIndex > -1 &&
    unquoted.indexOf(":") === lastColonIndex &&
    isIP(unquoted.slice(0, lastColonIndex)) === 4
  ) {
    return {
      ip: unquoted.slice(0, lastColonIndex),
      port: parsePort(unquoted.slice(lastColonIndex + 1)),
    };
  }

  return { ip: stripPort(unquoted) };
}

function stripPort(value: string): string {
  const trimmed = value.trim().replace(/^"|"$/g, "");
  const lastColonIndex = trimmed.lastIndexOf(":");

  if (
    lastColonIndex > -1 &&
    trimmed.indexOf(":") === lastColonIndex &&
    isIP(trimmed.slice(0, lastColonIndex)) === 4
  ) {
    return trimmed.slice(0, lastColonIndex);
  }

  return trimmed;
}

function parsePort(value: string | undefined): number | undefined {
  if (!isPresent(value)) {
    return undefined;
  }

  const port = Number(value.trim());

  if (!Number.isInteger(port) || port < 1 || port > 65535 || port === 80 || port === 443) {
    return undefined;
  }

  return port;
}

function isPublicIp(value: string): boolean {
  const version = isIP(value);

  if (version === 4) {
    return isPublicIpv4(value);
  }

  if (version === 6) {
    return isPublicIpv6(value);
  }

  return false;
}

function isPublicIpv4(value: string): boolean {
  const parts = value.split(".").map(Number);
  const [first, second, third] = parts;

  if (parts.length !== 4 || parts.some((part) => part < 0 || part > 255)) {
    return false;
  }

  if (first === 0 || first === 10 || first === 127 || first >= 224) {
    return false;
  }

  if (first === 100 && second >= 64 && second <= 127) {
    return false;
  }

  if (first === 169 && second === 254) {
    return false;
  }

  if (first === 172 && second >= 16 && second <= 31) {
    return false;
  }

  if (first === 192 && second === 168) {
    return false;
  }

  if (first === 192 && (second === 0 || second === 2 || second === 88)) {
    return false;
  }

  if (first === 198 && (second === 18 || second === 19)) {
    return false;
  }

  if (first === 198 && second === 51 && third === 100) {
    return false;
  }

  if (first === 203 && second === 0 && third === 113) {
    return false;
  }

  return true;
}

function isPublicIpv6(value: string): boolean {
  const normalised = value.toLowerCase();
  const firstHextet = Number.parseInt(normalised.split(":")[0] || "0", 16);

  if (!Number.isFinite(firstHextet)) {
    return false;
  }

  return (
    normalised !== "::" &&
    normalised !== "::1" &&
    (firstHextet & 0xfe00) !== 0xfc00 &&
    (firstHextet & 0xffc0) !== 0xfe80 &&
    (firstHextet & 0xff00) !== 0xff00 &&
    !normalised.startsWith("2001:db8")
  );
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
