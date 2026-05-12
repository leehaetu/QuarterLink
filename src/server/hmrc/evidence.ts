import { isSensitiveKey, redactHeaderValue, REDACTED_VALUE } from "./redaction";

export type HmrcEvidenceClassification =
  | "local/demo"
  | "hmrc-sandbox"
  | "production";

export interface HmrcEvidenceClassificationInput {
  readonly environment: "local" | "sandbox" | "production";
  readonly cameFromActualHmrcResponse: boolean;
}

export function classifyHmrcEvidence(
  input: HmrcEvidenceClassificationInput,
): HmrcEvidenceClassification {
  if (input.environment === "production") {
    return "production";
  }

  if (input.environment === "sandbox" && input.cameFromActualHmrcResponse) {
    return "hmrc-sandbox";
  }

  return "local/demo";
}

export function assertSandboxEvidenceOutputPath(outputPath: string): void {
  const normalisedPath = outputPath.replaceAll("\\", "/");

  if (
    !normalisedPath.startsWith(".agent/evidence/hmrc-sandbox/") &&
    !normalisedPath.startsWith(".agent/runs/")
  ) {
    throw new Error(
      "QL-008 evidence output must be written under .agent/evidence/hmrc-sandbox/ or .agent/runs/.",
    );
  }

  if (normalisedPath.toLowerCase().includes("production")) {
    throw new Error("QL-008 evidence output path must not reference production.");
  }
}

export function redactEvidenceValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactEvidenceValue(item));
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => {
        if (isSensitiveKey(key) || key.toLowerCase() === "authorization") {
          return [key, REDACTED_VALUE];
        }

        if (typeof entryValue === "string") {
          return [key, redactPotentialHeaderValue(key, entryValue)];
        }

        return [key, redactEvidenceValue(entryValue)];
      }),
    );
  }

  return value;
}

function redactPotentialHeaderValue(key: string, value: string): string {
  const redactedHeaderValue = redactHeaderValue(key, value);

  if (redactedHeaderValue !== value) {
    return redactedHeaderValue;
  }

  if (looksLikeBearerToken(value)) {
    return REDACTED_VALUE;
  }

  return value;
}

function looksLikeBearerToken(value: string): boolean {
  return /^bearer\s+\S+/i.test(value) || /^access[-_]?token/i.test(value);
}
