import { isIP } from "node:net";
import { redactHeaders } from "./redaction";
import type {
  FraudPreventionAssemblyInput,
  FraudPreventionAssemblyResult,
  FraudPreventionForwardedHop,
  FraudPreventionMissingValue,
  FraudPreventionMultiFactor,
  FraudPreventionScreen,
  FraudPreventionWindowSize,
  HmrcHeaders,
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

export function assembleFraudPreventionHeaders(
  input: FraudPreventionAssemblyInput,
): FraudPreventionAssemblyResult {
  const headers: HmrcHeaders = {
    "Gov-Client-Connection-Method": HMRC_CONNECTION_METHOD_WEB_APP_VIA_SERVER,
  };
  const missing: FraudPreventionMissingValue[] = [];

  setRequiredHeader(
    headers,
    missing,
    "Gov-Client-Browser-JS-User-Agent",
    input.client.browserJsUserAgent,
    "Browser JavaScript user agent must be collected by the client at the user action.",
  );
  setRequiredHeader(
    headers,
    missing,
    "Gov-Client-Device-ID",
    input.client.deviceId,
    "Device ID must be generated and persisted for the originating device.",
  );
  setRequiredHeader(
    headers,
    missing,
    "Gov-Client-Multi-Factor",
    formatMultiFactor(input.client.multiFactor),
    "MFA metadata is required unless HMRC has agreed a missing-data approach.",
  );
  setRequiredHeader(
    headers,
    missing,
    "Gov-Client-Public-IP",
    validateIp(input.server.clientPublicIp),
    "Client public IP must be derived from a trusted edge/server source.",
  );
  setRequiredHeader(
    headers,
    missing,
    "Gov-Client-Public-IP-Timestamp",
    validateIpTimestamp(input.server.clientPublicIpTimestamp),
    "Client public IP timestamp must be captured in UTC when the IP is collected.",
  );
  setRequiredHeader(
    headers,
    missing,
    "Gov-Client-Public-Port",
    validateClientPublicPort(input.server.clientPublicPort),
    "Client public port must be supplied by the trusted deployment layer and must not be a server port.",
  );
  setRequiredHeader(
    headers,
    missing,
    "Gov-Client-Screens",
    formatScreens(input.client.screens),
    "Screen details must be collected by the client.",
  );
  setRequiredHeader(
    headers,
    missing,
    "Gov-Client-Timezone",
    validateTimezone(input.client.timezone),
    "Client timezone must be collected in UTC offset format.",
  );
  setRequiredHeader(
    headers,
    missing,
    "Gov-Client-User-IDs",
    formatKeyValueMap(input.server.clientUserIds),
    "User identifiers must be derived from authenticated server-side identity.",
  );
  setRequiredHeader(
    headers,
    missing,
    "Gov-Client-Window-Size",
    formatWindowSize(input.client.windowSize),
    "Window size must be collected by the client.",
  );
  setRequiredHeader(
    headers,
    missing,
    "Gov-Vendor-Forwarded",
    formatForwarded(input.server.vendorForwarded),
    "Forwarded hops must be derived from QuarterLink-controlled internet hops.",
  );
  setRequiredHeader(
    headers,
    missing,
    "Gov-Vendor-License-IDs",
    formatKeyValueMap(input.server.vendorLicenseIds),
    "Vendor licence IDs are required unless HMRC has agreed a missing-data approach.",
  );
  setRequiredHeader(
    headers,
    missing,
    "Gov-Vendor-Product-Name",
    encodeHmrcValue(input.server.vendorProductName),
    "Vendor product name must be configured server-side.",
  );
  setRequiredHeader(
    headers,
    missing,
    "Gov-Vendor-Public-IP",
    validateIp(input.server.vendorPublicIp),
    "Vendor public IP must be supplied by deployment configuration.",
  );
  setRequiredHeader(
    headers,
    missing,
    "Gov-Vendor-Version",
    formatKeyValueMap(input.server.vendorVersion),
    "Vendor version must be supplied by build/deployment metadata.",
  );

  if (missing.length > 0) {
    return {
      ok: false,
      missing,
      redactedHeaders: redactHeaders(headers),
    };
  }

  return {
    ok: true,
    headers,
    redactedHeaders: redactHeaders(headers),
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
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function setRequiredHeader(
  headers: HmrcHeaders,
  missing: FraudPreventionMissingValue[],
  headerName: string,
  value: string | undefined,
  reason: string,
): void {
  if (!isNonPlaceholder(value)) {
    missing.push({ headerName, reason });
    return;
  }

  headers[headerName] = value;
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

function validateIp(value: string): string | undefined {
  const trimmedValue = value.trim();

  if (!isNonPlaceholder(trimmedValue) || isIP(trimmedValue) === 0) {
    return undefined;
  }

  return trimmedValue;
}

function validateIpTimestamp(value: string): string | undefined {
  const trimmedValue = value.trim();
  const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

  if (!timestampPattern.test(trimmedValue)) {
    return undefined;
  }

  return trimmedValue;
}

function validateClientPublicPort(value: number): string | undefined {
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    return undefined;
  }

  if (value === 80 || value === 443) {
    return undefined;
  }

  return String(value);
}

function validateTimezone(value: string): string | undefined {
  const trimmedValue = value.trim();

  if (!/^UTC[+-]\d{2}:\d{2}$/.test(trimmedValue)) {
    return undefined;
  }

  return trimmedValue;
}

function formatScreens(
  screens: readonly FraudPreventionScreen[] | undefined,
): string | undefined {
  if (screens === undefined || screens.length === 0) {
    return undefined;
  }

  const encodedScreens = screens.map((screen) => {
    if (
      !isPositiveWholeNumber(screen.width) ||
      !isPositiveWholeNumber(screen.height) ||
      !Number.isFinite(screen.scalingFactor) ||
      screen.scalingFactor <= 0 ||
      !isPositiveWholeNumber(screen.colourDepth)
    ) {
      return undefined;
    }

    return formatKeyValueMap({
      width: String(screen.width),
      height: String(screen.height),
      "scaling-factor": String(screen.scalingFactor),
      "colour-depth": String(screen.colourDepth),
    });
  });

  if (encodedScreens.some((screen) => screen === undefined)) {
    return undefined;
  }

  return encodedScreens.join(",");
}

function formatWindowSize(
  windowSize: FraudPreventionWindowSize | undefined,
): string | undefined {
  if (
    windowSize === undefined ||
    !isPositiveWholeNumber(windowSize.width) ||
    !isPositiveWholeNumber(windowSize.height)
  ) {
    return undefined;
  }

  return formatKeyValueMap({
    width: String(windowSize.width),
    height: String(windowSize.height),
  });
}

function formatMultiFactor(
  factors: readonly FraudPreventionMultiFactor[] | undefined,
): string | undefined {
  if (factors === undefined || factors.length === 0) {
    return undefined;
  }

  const encodedFactors = factors.map((factor) => {
    const timestampIsValid =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?Z$/.test(
        factor.timestamp,
      );

    if (
      !isNonPlaceholder(factor.type) ||
      !timestampIsValid ||
      !isNonPlaceholder(factor.uniqueReference)
    ) {
      return undefined;
    }

    return formatKeyValueMap({
      type: factor.type,
      timestamp: factor.timestamp,
      "unique-reference": factor.uniqueReference,
    });
  });

  if (encodedFactors.some((factor) => factor === undefined)) {
    return undefined;
  }

  return encodedFactors.join(",");
}

function formatForwarded(
  forwarded: readonly FraudPreventionForwardedHop[] | undefined,
): string | undefined {
  if (forwarded === undefined || forwarded.length === 0) {
    return undefined;
  }

  const encodedHops = forwarded.map((hop) => {
    if (validateIp(hop.by) === undefined || validateIp(hop.for) === undefined) {
      return undefined;
    }

    return formatKeyValueMap({
      by: hop.by,
      for: hop.for,
    });
  });

  if (encodedHops.some((hop) => hop === undefined)) {
    return undefined;
  }

  return encodedHops.join(",");
}

function formatKeyValueMap(
  values: Readonly<Record<string, string>> | undefined,
): string | undefined {
  if (values === undefined) {
    return undefined;
  }

  const entries = Object.entries(values);

  if (entries.length === 0) {
    return undefined;
  }

  const encodedEntries = entries.map(([key, value]) => {
    if (!isNonPlaceholder(key) || !isNonPlaceholder(value)) {
      return undefined;
    }

    return `${encodeHmrcValue(key)}=${encodeHmrcValue(value)}`;
  });

  if (encodedEntries.some((entry) => entry === undefined)) {
    return undefined;
  }

  return encodedEntries.join("&");
}

function isPositiveWholeNumber(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}
