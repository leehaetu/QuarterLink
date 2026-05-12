import type { HmrcHeaders } from "./types";

const FRAUD_HEADER_PREFIXES = ["gov-client-", "gov-vendor-"];

const SENSITIVE_HEADER_NAMES = new Set([
  "authorization",
  "proxy-authorization",
  "x-api-key",
  "x-client-secret",
]);

const SENSITIVE_KEY_PARTS = [
  "access_token",
  "authorization",
  "bearer",
  "client_secret",
  "code_verifier",
  "device_id",
  "hmrc_sandbox_client_secret",
  "password",
  "pkce",
  "refresh_token",
  "secret",
  "token",
];

export const REDACTED_VALUE = "[REDACTED]";

export function redactSecret(value: string | undefined | null): string {
  if (value === undefined || value === null || value.length === 0) {
    return REDACTED_VALUE;
  }

  if (value.length <= 8) {
    return REDACTED_VALUE;
  }

  return `${value.slice(0, 2)}...${value.slice(-2)} (${REDACTED_VALUE})`;
}

export function redactAuthorizationHeader(value: string): string {
  if (value.toLowerCase().startsWith("bearer ")) {
    return `Bearer ${REDACTED_VALUE}`;
  }

  return REDACTED_VALUE;
}

export function isFraudPreventionHeader(headerName: string): boolean {
  const normalisedName = headerName.toLowerCase();
  return FRAUD_HEADER_PREFIXES.some((prefix) => normalisedName.startsWith(prefix));
}

export function isSensitiveKey(key: string): boolean {
  const normalisedKey = key.toLowerCase().replaceAll("-", "_");
  return SENSITIVE_KEY_PARTS.some((part) => normalisedKey.includes(part));
}

export function redactHeaderValue(headerName: string, value: string): string {
  const normalisedName = headerName.toLowerCase();

  if (normalisedName === "authorization") {
    return redactAuthorizationHeader(value);
  }

  if (SENSITIVE_HEADER_NAMES.has(normalisedName)) {
    return REDACTED_VALUE;
  }

  if (normalisedName === "gov-client-connection-method") {
    return value;
  }

  if (isFraudPreventionHeader(headerName)) {
    return REDACTED_VALUE;
  }

  if (isSensitiveKey(headerName)) {
    return REDACTED_VALUE;
  }

  return value;
}

export function redactHeaders(headers: HmrcHeaders): HmrcHeaders {
  return Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [
      name,
      redactHeaderValue(name, value),
    ]),
  );
}

export function redactSensitiveRecord(
  record: Readonly<Record<string, string | number | boolean | undefined>>,
): Record<string, string | number | boolean> {
  const redactedEntries = Object.entries(record).flatMap(([key, value]) => {
    if (value === undefined) {
      return [];
    }

    if (isSensitiveKey(key)) {
      return [[key, REDACTED_VALUE] as const];
    }

    return [[key, value] as const];
  });

  return Object.fromEntries(redactedEntries);
}
