import {
  HMRC_SANDBOX_API_BASE_URL,
  HMRC_SANDBOX_AUTH_BASE_URL,
  type HmrcConfigValidationResult,
  type HmrcSandboxConfig,
  type HmrcValidationIssue,
  type QuarterLinkRuntimeEnvironment,
} from "./types";

type EnvironmentSource = Readonly<Record<string, string | undefined>>;

const APP_ENV_VALUES = ["local", "sandbox", "production"] as const;

const REQUIRED_SANDBOX_KEYS = [
  "APP_ENV",
  "HMRC_ENV",
  "HMRC_SANDBOX_API_BASE_URL",
  "HMRC_SANDBOX_AUTH_BASE_URL",
  "HMRC_SANDBOX_CLIENT_ID",
  "HMRC_SANDBOX_CLIENT_SECRET",
  "HMRC_SANDBOX_REDIRECT_URI",
  "HMRC_SANDBOX_SCOPES",
] as const;

const PRODUCTION_KEYS_BLOCKED_IN_QL_007 = [
  "HMRC_PRODUCTION_API_BASE_URL",
  "HMRC_PRODUCTION_AUTH_BASE_URL",
  "HMRC_PRODUCTION_CLIENT_ID",
  "HMRC_PRODUCTION_CLIENT_SECRET",
  "HMRC_PRODUCTION_REDIRECT_URI",
] as const;

export class HmrcConfigError extends Error {
  readonly issues: readonly HmrcValidationIssue[];

  constructor(issues: readonly HmrcValidationIssue[]) {
    super(
      `HMRC sandbox configuration is invalid: ${issues
        .map((issue) => `${issue.variable} ${issue.code}`)
        .join(", ")}`,
    );
    this.name = "HmrcConfigError";
    this.issues = issues;
  }
}

export function assertServerOnlyHmrcConfig(): void {
  if (typeof window !== "undefined") {
    throw new HmrcConfigError([
      {
        code: "unsupported",
        variable: "runtime",
        message: "HMRC configuration is only available on the server.",
      },
    ]);
  }
}

export function validateHmrcSandboxConfig(
  source: EnvironmentSource = process.env,
): HmrcConfigValidationResult {
  assertServerOnlyHmrcConfig();

  const issues: HmrcValidationIssue[] = [];

  for (const key of REQUIRED_SANDBOX_KEYS) {
    if (!isPresent(source[key])) {
      issues.push({
        code: "missing",
        variable: key,
        message: `${key} is required for the HMRC sandbox foundation.`,
      });
    }
  }

  for (const key of PRODUCTION_KEYS_BLOCKED_IN_QL_007) {
    if (isPresent(source[key])) {
      issues.push({
        code: "mixed-production-config",
        variable: key,
        message:
          "Production HMRC configuration must not be mixed into QL-007 sandbox setup.",
      });
    }
  }

  const appEnvironment = source.APP_ENV?.trim();
  if (isPresent(appEnvironment) && !isRuntimeEnvironment(appEnvironment)) {
    issues.push({
      code: "invalid",
      variable: "APP_ENV",
      message: "APP_ENV must be one of local, sandbox, or production.",
    });
  }

  if (appEnvironment === "production") {
    issues.push({
      code: "unsupported",
      variable: "APP_ENV",
      message: "Production HMRC calls are outside QL-007.",
    });
  }

  const hmrcEnvironment = source.HMRC_ENV?.trim();
  if (isPresent(hmrcEnvironment) && hmrcEnvironment !== "sandbox") {
    issues.push({
      code: "unsupported",
      variable: "HMRC_ENV",
      message: "QL-007 only enables sandbox HMRC request construction.",
    });
  }

  validateFixedOrigin(
    source.HMRC_SANDBOX_API_BASE_URL,
    "HMRC_SANDBOX_API_BASE_URL",
    HMRC_SANDBOX_API_BASE_URL,
    issues,
  );
  validateFixedOrigin(
    source.HMRC_SANDBOX_AUTH_BASE_URL,
    "HMRC_SANDBOX_AUTH_BASE_URL",
    HMRC_SANDBOX_AUTH_BASE_URL,
    issues,
  );
  validateRedirectUri(source.HMRC_SANDBOX_REDIRECT_URI, issues);

  const scopes = splitScopes(source.HMRC_SANDBOX_SCOPES);
  if (isPresent(source.HMRC_SANDBOX_SCOPES) && scopes.length === 0) {
    issues.push({
      code: "invalid",
      variable: "HMRC_SANDBOX_SCOPES",
      message: "HMRC_SANDBOX_SCOPES must contain at least one scope.",
    });
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    config: {
      appEnvironment: appEnvironment as QuarterLinkRuntimeEnvironment,
      hmrcEnvironment: "sandbox",
      apiBaseUrl: HMRC_SANDBOX_API_BASE_URL,
      authBaseUrl: HMRC_SANDBOX_AUTH_BASE_URL,
      clientId: requireValue(source.HMRC_SANDBOX_CLIENT_ID),
      clientSecret: requireValue(source.HMRC_SANDBOX_CLIENT_SECRET),
      redirectUri: requireValue(source.HMRC_SANDBOX_REDIRECT_URI),
      scopes,
    },
  };
}

export function loadHmrcSandboxConfig(
  source: EnvironmentSource = process.env,
): HmrcSandboxConfig {
  const result = validateHmrcSandboxConfig(source);

  if (!result.ok) {
    throw new HmrcConfigError(result.issues);
  }

  return result.config;
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

function requireValue(value: string | undefined): string {
  if (!isPresent(value)) {
    throw new Error("Expected validated HMRC config value to be present.");
  }

  return value.trim();
}

function isRuntimeEnvironment(
  value: string,
): value is QuarterLinkRuntimeEnvironment {
  return APP_ENV_VALUES.includes(value as QuarterLinkRuntimeEnvironment);
}

function splitScopes(value: string | undefined): readonly string[] {
  if (!isPresent(value)) {
    return [];
  }

  return value
    .trim()
    .split(/\s+/)
    .map((scope) => scope.trim())
    .filter((scope) => scope.length > 0);
}

function validateFixedOrigin(
  value: string | undefined,
  variable: string,
  expectedOrigin: string,
  issues: HmrcValidationIssue[],
): void {
  if (!isPresent(value)) {
    return;
  }

  const origin = parseOrigin(value);

  if (origin === undefined) {
    issues.push({
      code: "invalid",
      variable,
      message: `${variable} must be a valid absolute HTTPS URL.`,
    });
    return;
  }

  if (origin !== expectedOrigin) {
    issues.push({
      code: "unsupported",
      variable,
      message: `${variable} must use the HMRC sandbox origin for QL-007.`,
    });
  }
}

function parseOrigin(value: string): string | undefined {
  try {
    const url = new URL(value);

    if (url.protocol !== "https:") {
      return undefined;
    }

    if (url.username || url.password || url.search || url.hash) {
      return undefined;
    }

    if (url.pathname !== "/" && url.pathname !== "") {
      return undefined;
    }

    return url.origin;
  } catch {
    return undefined;
  }
}

function validateRedirectUri(
  value: string | undefined,
  issues: HmrcValidationIssue[],
): void {
  if (!isPresent(value)) {
    return;
  }

  try {
    const url = new URL(value);
    const isLocalhost =
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "::1";

    if (url.username || url.password || url.hash) {
      throw new Error("Redirect URI must not contain credentials or a hash.");
    }

    if (url.protocol !== "https:" && !(isLocalhost && url.protocol === "http:")) {
      throw new Error("Redirect URI must use HTTPS unless it is localhost.");
    }
  } catch {
    issues.push({
      code: "invalid",
      variable: "HMRC_SANDBOX_REDIRECT_URI",
      message:
        "HMRC_SANDBOX_REDIRECT_URI must be an absolute HTTPS URL, or HTTP localhost for local development.",
    });
  }
}
