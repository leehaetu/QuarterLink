import { isIP } from "node:net";
import {
  encodeHmrcComponent,
  encodeHmrcForwarded,
  encodeHmrcKeyValue,
  encodeHmrcMultiFactor,
  encodeHmrcScreens,
  encodeHmrcWindowSize,
} from "./fraud-encoding";
import { redactHeaders } from "./redaction";
import type {
  FraudPreventionAssemblyInput,
  FraudPreventionAssemblyResult,
  FraudPreventionHeaderBuildStatus,
  FraudPreventionHeaderStatus,
  FraudPreventionMissingValue,
  HmrcHeaders,
  WebAppViaServerFraudPreventionBuildResult,
  WebAppViaServerFraudPreventionInput,
} from "./types";

export const HMRC_CONNECTION_METHOD_WEB_APP_VIA_SERVER = "WEB_APP_VIA_SERVER";

export const WEB_APP_VIA_SERVER_FRAUD_HEADER_NAMES = [
  "Gov-Client-Connection-Method",
  "Gov-Client-Browser-JS-User-Agent",
  "Gov-Client-Device-ID",
  "Gov-Client-Multi-Factor",
  "Gov-Client-Public-IP",
  "Gov-Client-Public-IP-Timestamp",
  "Gov-Client-Public-Port",
  "Gov-Client-Screens",
  "Gov-Client-Timezone",
  "Gov-Client-User-IDs",
  "Gov-Client-Window-Size",
  "Gov-Vendor-Forwarded",
  "Gov-Vendor-License-IDs",
  "Gov-Vendor-Product-Name",
  "Gov-Vendor-Public-IP",
  "Gov-Vendor-Version",
] as const;

const VARIABLE_MAP: Readonly<Record<string, readonly string[]>> = {
  "Gov-Client-Browser-JS-User-Agent": ["QL_008_FRAUD_BROWSER_JS_USER_AGENT"],
  "Gov-Client-Device-ID": ["QL_008_FRAUD_DEVICE_ID"],
  "Gov-Client-Multi-Factor": [
    "QL_008_FRAUD_MFA_TYPE",
    "QL_008_FRAUD_MFA_TIMESTAMP",
    "QL_008_FRAUD_MFA_UNIQUE_REFERENCE",
  ],
  "Gov-Client-Public-IP": ["QL_008_FRAUD_CLIENT_PUBLIC_IP"],
  "Gov-Client-Public-IP-Timestamp": [
    "QL_008_FRAUD_CLIENT_PUBLIC_IP_TIMESTAMP",
  ],
  "Gov-Client-Public-Port": ["QL_008_FRAUD_CLIENT_PUBLIC_PORT"],
  "Gov-Client-Screens": [
    "QL_008_FRAUD_SCREEN_WIDTH",
    "QL_008_FRAUD_SCREEN_HEIGHT",
    "QL_008_FRAUD_SCREEN_SCALING_FACTOR",
    "QL_008_FRAUD_SCREEN_COLOUR_DEPTH",
  ],
  "Gov-Client-Timezone": ["QL_008_FRAUD_TIMEZONE"],
  "Gov-Client-User-IDs": [
    "QL_008_FRAUD_CLIENT_USER_ID_KEY",
    "QL_008_FRAUD_CLIENT_USER_ID_VALUE",
  ],
  "Gov-Client-Window-Size": [
    "QL_008_FRAUD_WINDOW_WIDTH",
    "QL_008_FRAUD_WINDOW_HEIGHT",
  ],
  "Gov-Vendor-Forwarded": [
    "QL_008_FRAUD_VENDOR_FORWARDED_BY",
    "QL_008_FRAUD_VENDOR_FORWARDED_FOR",
  ],
  "Gov-Vendor-License-IDs": [
    "QL_008_FRAUD_VENDOR_LICENSE_ID_KEY",
    "QL_008_FRAUD_VENDOR_LICENSE_ID_VALUE",
  ],
  "Gov-Vendor-Public-IP": ["QL_008_FRAUD_VENDOR_PUBLIC_IP"],
};

export class FraudPreventionHeaderError extends Error {
  readonly missing: readonly FraudPreventionMissingValue[];

  constructor(missing: readonly FraudPreventionMissingValue[]) {
    super(
      `Missing or invalid HMRC fraud-prevention header data: ${missing
        .map((item) => item.headerName)
        .join(", ")}`,
    );
    this.name = "FraudPreventionHeaderError";
    this.missing = missing;
  }
}

export function buildWebAppViaServerFraudPreventionHeaders(
  input: WebAppViaServerFraudPreventionInput,
): WebAppViaServerFraudPreventionBuildResult {
  const headers: HmrcHeaders = {
    "Gov-Client-Connection-Method": HMRC_CONNECTION_METHOD_WEB_APP_VIA_SERVER,
  };
  const statuses: FraudPreventionHeaderBuildStatus[] = [
    {
      headerName: "Gov-Client-Connection-Method",
      status: "present",
      reason: "QuarterLink uses the WEB_APP_VIA_SERVER connection method.",
      variables: [],
    },
  ];

  setHeader(
    headers,
    statuses,
    "Gov-Client-Browser-JS-User-Agent",
    validatePresentText(input.client.browserJsUserAgent),
    "Browser JavaScript user agent collected from the originating browser action.",
    "missing",
    "Browser JavaScript user agent must be collected by the client at the user action.",
  );
  setHeader(
    headers,
    statuses,
    "Gov-Client-Device-ID",
    validateUuid(input.client.deviceId),
    "Persistent device ID from the verified HTTP-only signed server cookie.",
    "missing",
    "Device ID must come from the verified server-side cookie, not from browser-supplied payload.",
  );
  setHeader(
    headers,
    statuses,
    "Gov-Client-Multi-Factor",
    encodeHmrcMultiFactor(input.client.multiFactor),
    "MFA metadata from the authenticated QuarterLink user action.",
    "manual-override-required",
    "QL-BOOTSTRAP has no production auth/MFA event, so MFA metadata needs a local override or HMRC-agreed missing-data handling.",
  );
  setHeader(
    headers,
    statuses,
    "Gov-Client-Public-IP",
    validatePublicIp(input.server.clientPublicIp),
    "Client public IP from trusted server or edge request metadata.",
    classifyPublicNetworkMissing(input.localSandbox),
    "Client public IP must be derived from trusted public request metadata; localhost, private, and documentation ranges are not valid substitutes.",
  );
  setHeader(
    headers,
    statuses,
    "Gov-Client-Public-IP-Timestamp",
    validateIpTimestamp(input.server.clientPublicIpTimestamp),
    "UTC timestamp captured when the client public IP was collected.",
    "missing",
    "Client public IP timestamp must be captured in UTC when a public client IP is collected.",
  );
  setHeader(
    headers,
    statuses,
    "Gov-Client-Public-Port",
    validateClientPublicPort(input.server.clientPublicPort),
    "Client public source port from trusted server or edge request metadata.",
    classifyPublicNetworkMissing(input.localSandbox),
    "Client public source port must come from trusted request metadata and must not be a server port.",
  );
  setHeader(
    headers,
    statuses,
    "Gov-Client-Screens",
    encodeHmrcScreens(input.client.screens),
    "Screen dimensions, scaling factor, and colour depth collected in the browser.",
    "missing",
    "Screen details must be collected by the browser.",
  );
  setHeader(
    headers,
    statuses,
    "Gov-Client-Timezone",
    validateTimezone(input.client.timezone),
    "Browser timezone in HMRC UTC offset format.",
    "missing",
    "Client timezone must be collected in UTC offset format.",
  );
  setHeader(
    headers,
    statuses,
    "Gov-Client-User-IDs",
    encodeHmrcKeyValue(input.server.clientUserIds ?? {}),
    "Server-derived QuarterLink user identifier.",
    "manual-override-required",
    "QL-BOOTSTRAP has no production auth user record, so user ID metadata needs a local override or HMRC-agreed missing-data handling.",
  );
  setHeader(
    headers,
    statuses,
    "Gov-Client-Window-Size",
    encodeHmrcWindowSize(input.client.windowSize),
    "Browser viewport size collected at the originating user action.",
    "missing",
    "Window size must be collected by the browser.",
  );
  setHeader(
    headers,
    statuses,
    "Gov-Vendor-Forwarded",
    validateForwarded(input.server.vendorForwarded),
    "QuarterLink-controlled public request boundary.",
    classifyPublicNetworkMissing(input.localSandbox),
    "Vendor forwarded data needs both public vendor and public client IPs; localhost/private hops are not valid substitutes.",
  );
  setHeader(
    headers,
    statuses,
    "Gov-Vendor-License-IDs",
    encodeHmrcKeyValue(input.server.vendorLicenseIds ?? {}),
    "QuarterLink licence metadata.",
    "manual-override-required",
    "QL-BOOTSTRAP has no licence system, so vendor licence metadata needs a local override or HMRC-agreed missing-data handling.",
  );
  setHeader(
    headers,
    statuses,
    "Gov-Vendor-Product-Name",
    validatePresentText(input.server.vendorProductName) === undefined
      ? undefined
      : encodeHmrcComponent(input.server.vendorProductName ?? ""),
    "QuarterLink product name configured server-side.",
    "missing",
    "Vendor product name must be configured server-side.",
  );
  setHeader(
    headers,
    statuses,
    "Gov-Vendor-Public-IP",
    validatePublicIp(input.server.vendorPublicIp),
    "QuarterLink server, load balancer, or WAF public IP.",
    classifyPublicNetworkMissing(input.localSandbox),
    "Vendor public IP must come from deployment metadata; localhost and private interfaces are not valid substitutes.",
  );
  setHeader(
    headers,
    statuses,
    "Gov-Vendor-Version",
    encodeHmrcKeyValue(input.server.vendorVersion ?? {}),
    "QuarterLink build or deployment version metadata.",
    "missing",
    "Vendor version must be supplied by build or deployment metadata.",
  );

  const missing = statuses
    .filter((item) => item.status !== "present")
    .map(toMissingValue);
  const redactedHeaders = redactHeaders(headers);

  if (missing.length > 0) {
    return {
      ok: false,
      headers,
      redactedHeaders,
      statuses,
      missing,
    };
  }

  return {
    ok: true,
    headers,
    redactedHeaders,
    statuses,
  };
}

export function assembleFraudPreventionHeaders(
  input: FraudPreventionAssemblyInput,
): FraudPreventionAssemblyResult {
  const result = buildWebAppViaServerFraudPreventionHeaders({
    client: input.client,
    server: input.server,
  });

  if (!result.ok) {
    return {
      ok: false,
      missing: result.missing,
      redactedHeaders: result.redactedHeaders,
    };
  }

  return {
    ok: true,
    headers: result.headers,
    redactedHeaders: result.redactedHeaders,
  };
}

export function requireFraudPreventionHeaders(
  input: FraudPreventionAssemblyInput,
): HmrcHeaders {
  const result = assembleFraudPreventionHeaders(input);

  if (!result.ok) {
    throw new FraudPreventionHeaderError(result.missing);
  }

  return result.headers;
}

export function encodeHmrcValue(value: string): string {
  return encodeHmrcComponent(value);
}

function setHeader(
  headers: HmrcHeaders,
  statuses: FraudPreventionHeaderBuildStatus[],
  headerName: string,
  value: string | undefined,
  presentReason: string,
  missingStatus: FraudPreventionHeaderStatus,
  missingReason: string,
): void {
  if (!isNonPlaceholder(value)) {
    statuses.push({
      headerName,
      status: missingStatus,
      reason: missingReason,
      variables: VARIABLE_MAP[headerName] ?? [],
    });
    return;
  }

  headers[headerName] = value;
  statuses.push({
    headerName,
    status: "present",
    reason: presentReason,
    variables: VARIABLE_MAP[headerName] ?? [],
  });
}

function toMissingValue(
  status: FraudPreventionHeaderBuildStatus,
): FraudPreventionMissingValue {
  return {
    headerName: status.headerName,
    reason: status.reason,
    status: status.status,
    variables: status.variables,
  };
}

function classifyPublicNetworkMissing(
  localSandbox: boolean | undefined,
): FraudPreventionHeaderStatus {
  return localSandbox === true ? "unavailable-on-localhost" : "missing";
}

function validatePresentText(value: string | undefined): string | undefined {
  return isNonPlaceholder(value) ? value.trim() : undefined;
}

function validateUuid(value: string | undefined): string | undefined {
  const trimmedValue = validatePresentText(value);

  if (
    trimmedValue === undefined ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      trimmedValue,
    )
  ) {
    return undefined;
  }

  return trimmedValue.toLowerCase();
}

function isNonPlaceholder(value: string | undefined): value is string {
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

function validatePublicIp(value: string | undefined): string | undefined {
  const trimmedValue = validatePresentText(value);

  if (trimmedValue === undefined || !isPublicIp(trimmedValue)) {
    return undefined;
  }

  return trimmedValue;
}

function validateIpTimestamp(value: string | undefined): string | undefined {
  const trimmedValue = validatePresentText(value);
  const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

  if (trimmedValue === undefined || !timestampPattern.test(trimmedValue)) {
    return undefined;
  }

  return trimmedValue;
}

function validateClientPublicPort(value: number | undefined): string | undefined {
  if (
    value === undefined ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > 65535 ||
    value === 80 ||
    value === 443
  ) {
    return undefined;
  }

  return String(value);
}

function validateTimezone(value: string | undefined): string | undefined {
  const trimmedValue = validatePresentText(value);

  if (trimmedValue === undefined || !/^UTC[+-]\d{2}:\d{2}$/.test(trimmedValue)) {
    return undefined;
  }

  return trimmedValue;
}

function validateForwarded(
  forwarded: WebAppViaServerFraudPreventionInput["server"]["vendorForwarded"],
): string | undefined {
  if (
    forwarded === undefined ||
    forwarded.length === 0 ||
    forwarded.some(
      (hop) => validatePublicIp(hop.by) === undefined || validatePublicIp(hop.for) === undefined,
    )
  ) {
    return undefined;
  }

  return encodeHmrcForwarded(forwarded);
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
