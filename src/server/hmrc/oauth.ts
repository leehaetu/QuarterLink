import { HmrcSandboxClient } from "./client";
import { loadHmrcSandboxConfig } from "./config";
import type { HmrcSandboxConfig } from "./types";

type EnvironmentSource = Readonly<Record<string, string | undefined>>;
type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

export const HMRC_SANDBOX_OAUTH_START_PATH = "/api/hmrc/oauth/start";
export const HMRC_SANDBOX_OAUTH_CALLBACK_PATH = "/api/hmrc/oauth/callback";
export const HMRC_SANDBOX_OAUTH_STATE_KEY = "HMRC_SANDBOX_OAUTH_STATE";
export const HMRC_SANDBOX_TEST_USER_TYPE_KEY = "HMRC_SANDBOX_TEST_USER_TYPE";
export const HMRC_SANDBOX_OAUTH_SHOW_TOKENS_KEY =
  "HMRC_SANDBOX_OAUTH_SHOW_TOKENS";
export const HMRC_SANDBOX_REQUIRED_REDIRECT_URI =
  "http://localhost:3000/api/hmrc/oauth/callback";

const REQUIRED_LOCAL_OAUTH_ENV_KEYS = [
  "APP_ENV",
  "HMRC_ENV",
  "HMRC_SANDBOX_API_BASE_URL",
  "HMRC_SANDBOX_AUTH_BASE_URL",
  "HMRC_SANDBOX_CLIENT_ID",
  "HMRC_SANDBOX_CLIENT_SECRET",
  "HMRC_SANDBOX_REDIRECT_URI",
  "HMRC_SANDBOX_SCOPES",
  HMRC_SANDBOX_TEST_USER_TYPE_KEY,
  HMRC_SANDBOX_OAUTH_STATE_KEY,
] as const;

export interface HmrcSandboxOAuthTokenResponse {
  readonly accessToken: string;
  readonly refreshToken?: string;
  readonly expiresIn?: number;
  readonly scope?: string;
  readonly tokenType?: string;
}

export interface HmrcSandboxOAuthTokenSummary {
  readonly tokenType?: string;
  readonly expiresIn?: number;
  readonly scope?: string;
  readonly hasAccessToken: boolean;
  readonly hasRefreshToken: boolean;
}

export interface HmrcSandboxOAuthUiState {
  readonly appEnvironment: string;
  readonly hmrcEnvironment: string;
  readonly redirectUri: string;
  readonly startPath: string;
  readonly callbackPath: string;
  readonly requiredRedirectUri: string;
  readonly isLocalOrSandboxMode: boolean;
  readonly canStartOAuth: boolean;
  readonly missingEnvVars: readonly string[];
  readonly invalidEnvMessages: readonly string[];
  readonly tokenDisplayEnabled: boolean;
}

export class HmrcSandboxOAuthError extends Error {
  readonly statusCode?: number;
  readonly hmrcError?: string;

  constructor(
    message: string,
    options: { readonly statusCode?: number; readonly hmrcError?: string } = {},
  ) {
    super(message);
    this.name = "HmrcSandboxOAuthError";
    this.statusCode = options.statusCode;
    this.hmrcError = options.hmrcError;
  }
}

export function buildSandboxOAuthAuthorisationUrl(
  source: EnvironmentSource = process.env,
): URL {
  const config = loadHmrcSandboxConfig(source);
  const state = requireOAuthState(source);

  assertIndividualSandboxTestUser(source);

  return new HmrcSandboxClient(config).buildOAuthAuthorisationUrl({ state });
}

export function getSandboxOAuthUiState(
  source: EnvironmentSource = process.env,
): HmrcSandboxOAuthUiState {
  const missingEnvVars = REQUIRED_LOCAL_OAUTH_ENV_KEYS.filter(
    (key) => !isPresent(source[key]),
  );
  const invalidEnvMessages: string[] = [];
  const appEnvironment = source.APP_ENV?.trim() ?? "";
  const hmrcEnvironment = source.HMRC_ENV?.trim() ?? "";
  const isLocalOrSandboxMode =
    appEnvironment === "local" || appEnvironment === "sandbox";

  if (isPresent(appEnvironment) && !isLocalOrSandboxMode) {
    invalidEnvMessages.push("APP_ENV must be local or sandbox for this flow.");
  }

  if (isPresent(hmrcEnvironment) && hmrcEnvironment !== "sandbox") {
    invalidEnvMessages.push("HMRC_ENV must be sandbox for this flow.");
  }

  if (
    isPresent(source.HMRC_SANDBOX_REDIRECT_URI) &&
    source.HMRC_SANDBOX_REDIRECT_URI.trim() !== HMRC_SANDBOX_REQUIRED_REDIRECT_URI
  ) {
    invalidEnvMessages.push(
      `HMRC_SANDBOX_REDIRECT_URI must be ${HMRC_SANDBOX_REQUIRED_REDIRECT_URI}.`,
    );
  }

  if (
    isPresent(source[HMRC_SANDBOX_TEST_USER_TYPE_KEY]) &&
    source[HMRC_SANDBOX_TEST_USER_TYPE_KEY]?.trim().toLowerCase() !== "individual"
  ) {
    invalidEnvMessages.push(
      `${HMRC_SANDBOX_TEST_USER_TYPE_KEY} must be individual.`,
    );
  }

  if (
    isPresent(source[HMRC_SANDBOX_OAUTH_STATE_KEY]) &&
    (source[HMRC_SANDBOX_OAUTH_STATE_KEY]?.trim().length ?? 0) < 16
  ) {
    invalidEnvMessages.push(
      `${HMRC_SANDBOX_OAUTH_STATE_KEY} must be at least 16 characters.`,
    );
  }

  return {
    appEnvironment: appEnvironment || "not set",
    hmrcEnvironment: hmrcEnvironment || "not set",
    redirectUri: source.HMRC_SANDBOX_REDIRECT_URI?.trim() || "not set",
    startPath: HMRC_SANDBOX_OAUTH_START_PATH,
    callbackPath: HMRC_SANDBOX_OAUTH_CALLBACK_PATH,
    requiredRedirectUri: HMRC_SANDBOX_REQUIRED_REDIRECT_URI,
    isLocalOrSandboxMode,
    canStartOAuth:
      isLocalOrSandboxMode &&
      missingEnvVars.length === 0 &&
      invalidEnvMessages.length === 0,
    missingEnvVars,
    invalidEnvMessages,
    tokenDisplayEnabled: sandboxOAuthTokenDisplayEnabled(source),
  };
}

export async function exchangeSandboxOAuthCode(
  input: {
    readonly code: string;
    readonly state: string;
    readonly source?: EnvironmentSource;
    readonly fetchImpl?: FetchLike;
  },
): Promise<HmrcSandboxOAuthTokenResponse> {
  const source = input.source ?? process.env;
  const config = loadHmrcSandboxConfig(source);
  const expectedState = requireOAuthState(source);
  const code = input.code.trim();
  const state = input.state.trim();
  const fetchImpl = input.fetchImpl ?? fetch;

  assertIndividualSandboxTestUser(source);

  if (code.length === 0) {
    throw new HmrcSandboxOAuthError("HMRC OAuth callback is missing code.");
  }

  if (state.length === 0 || state !== expectedState) {
    throw new HmrcSandboxOAuthError("HMRC OAuth callback state did not match.");
  }

  const response = await fetchImpl(buildTokenUrl(config), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: buildTokenRequestBody(config, code),
  });

  const payload = await readJson(response);

  if (!response.ok) {
    throw new HmrcSandboxOAuthError("HMRC OAuth token exchange failed.", {
      statusCode: response.status,
      hmrcError: getOptionalString(payload, "error"),
    });
  }

  return parseTokenResponse(payload);
}

export function summariseSandboxOAuthToken(
  token: HmrcSandboxOAuthTokenResponse,
): HmrcSandboxOAuthTokenSummary {
  return {
    tokenType: token.tokenType,
    expiresIn: token.expiresIn,
    scope: token.scope,
    hasAccessToken: token.accessToken.length > 0,
    hasRefreshToken:
      token.refreshToken !== undefined && token.refreshToken.length > 0,
  };
}

export function sandboxOAuthTokenDisplayEnabled(
  source: EnvironmentSource = process.env,
): boolean {
  return source[HMRC_SANDBOX_OAUTH_SHOW_TOKENS_KEY]?.trim() === "true";
}

function buildTokenUrl(config: HmrcSandboxConfig): URL {
  return new URL("/oauth/token", config.apiBaseUrl);
}

function buildTokenRequestBody(
  config: HmrcSandboxConfig,
  code: string,
): URLSearchParams {
  const body = new URLSearchParams();

  body.set("client_secret", config.clientSecret);
  body.set("client_id", config.clientId);
  body.set("grant_type", "authorization_code");
  body.set("redirect_uri", config.redirectUri);
  body.set("code", code);

  return body;
}

function assertIndividualSandboxTestUser(source: EnvironmentSource): void {
  const userType = source[HMRC_SANDBOX_TEST_USER_TYPE_KEY]?.trim().toLowerCase();

  if (userType !== "individual") {
    throw new HmrcSandboxOAuthError(
      `${HMRC_SANDBOX_TEST_USER_TYPE_KEY}=individual is required for this QL-008 OAuth readiness step.`,
    );
  }
}

function requireOAuthState(source: EnvironmentSource): string {
  const state = source[HMRC_SANDBOX_OAUTH_STATE_KEY]?.trim();

  if (state === undefined || state.length < 16) {
    throw new HmrcSandboxOAuthError(
      `${HMRC_SANDBOX_OAUTH_STATE_KEY} must be a local-only opaque value of at least 16 characters.`,
    );
  }

  return state;
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

function parseTokenResponse(
  payload: Readonly<Record<string, unknown>>,
): HmrcSandboxOAuthTokenResponse {
  const accessToken = getRequiredString(payload, "access_token");

  return {
    accessToken,
    refreshToken: getOptionalString(payload, "refresh_token"),
    expiresIn: getOptionalNumber(payload, "expires_in"),
    scope: getOptionalString(payload, "scope"),
    tokenType: getOptionalString(payload, "token_type"),
  };
}

function getRequiredString(
  payload: Readonly<Record<string, unknown>>,
  key: string,
): string {
  const value = getOptionalString(payload, key);

  if (value === undefined) {
    throw new HmrcSandboxOAuthError(
      `HMRC OAuth token response did not include ${key}.`,
    );
  }

  return value;
}

function getOptionalString(
  payload: Readonly<Record<string, unknown>>,
  key: string,
): string | undefined {
  const value = payload[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  return value;
}

function getOptionalNumber(
  payload: Readonly<Record<string, unknown>>,
  key: string,
): number | undefined {
  const value = payload[key];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return value;
}
