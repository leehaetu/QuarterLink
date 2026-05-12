import { redactHeaders, REDACTED_VALUE } from "./redaction";
import type {
  HmrcHeaders,
  HmrcOAuthAuthorisationInput,
  HmrcPreparedRequest,
  HmrcRequestInput,
  HmrcSandboxConfig,
} from "./types";

export class HmrcRequestBuildError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HmrcRequestBuildError";
  }
}

export class HmrcSandboxClient {
  readonly #config: HmrcSandboxConfig;

  constructor(config: HmrcSandboxConfig) {
    if (config.hmrcEnvironment !== "sandbox") {
      throw new HmrcRequestBuildError(
        "QL-007 HMRC client scaffold only supports sandbox request construction.",
      );
    }

    this.#config = config;
  }

  buildOAuthAuthorisationUrl(input: HmrcOAuthAuthorisationInput): URL {
    const state = input.state.trim();

    if (state.length === 0) {
      throw new HmrcRequestBuildError("OAuth state is required.");
    }

    const url = new URL("/oauth/authorize", this.#config.authBaseUrl);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", this.#config.clientId);
    url.searchParams.set("scope", this.#config.scopes.join(" "));
    url.searchParams.set("redirect_uri", this.#config.redirectUri);
    url.searchParams.set("state", state);

    if (input.codeChallenge !== undefined) {
      const codeChallenge = input.codeChallenge.trim();

      if (codeChallenge.length === 0) {
        throw new HmrcRequestBuildError("PKCE code challenge cannot be empty.");
      }

      url.searchParams.set("code_challenge", codeChallenge);
      url.searchParams.set("code_challenge_method", "S256");
    }

    return url;
  }

  prepareRequest(input: HmrcRequestInput): HmrcPreparedRequest {
    const accessToken = normaliseAccessToken(input.accessToken);
    const url = buildSandboxUrl(this.#config.apiBaseUrl, input.path, input.query);
    const safeUrl = buildSafeUrl(url);
    const headers = buildHeaders(input, accessToken);
    const body = serialiseBody(input.body);

    return {
      request: {
        method: input.method,
        url: url.toString(),
        headers,
        ...(body === undefined ? {} : { body }),
      },
      safeMetadata: {
        environment: "sandbox",
        method: input.method,
        url: safeUrl,
        headerNames: Object.keys(headers).sort(),
        redactedHeaders: redactHeaders(headers),
        hasBody: body !== undefined,
      },
    };
  }
}

function buildSafeUrl(url: URL): string {
  const safeUrl = new URL(url.toString());

  for (const key of safeUrl.searchParams.keys()) {
    safeUrl.searchParams.set(key, REDACTED_VALUE);
  }

  return safeUrl.toString();
}

function buildSandboxUrl(
  apiBaseUrl: string,
  path: string,
  query: HmrcRequestInput["query"],
): URL {
  const trimmedPath = path.trim();

  if (
    trimmedPath.length === 0 ||
    !trimmedPath.startsWith("/") ||
    trimmedPath.startsWith("//") ||
    /^[a-z][a-z\d+\-.]*:/i.test(trimmedPath)
  ) {
    throw new HmrcRequestBuildError(
      "HMRC request path must be a relative absolute path such as /organisations/...",
    );
  }

  const url = new URL(trimmedPath, apiBaseUrl);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

function buildHeaders(input: HmrcRequestInput, accessToken: string): HmrcHeaders {
  const headers: HmrcHeaders = {
    Authorization: `Bearer ${accessToken}`,
    ...input.fraudPreventionHeaders,
  };

  if (input.accept !== undefined) {
    headers.Accept = input.accept;
  }

  if (input.govTestScenario !== undefined) {
    headers["Gov-Test-Scenario"] = input.govTestScenario;
  }

  if (input.body !== undefined) {
    headers["Content-Type"] = input.contentType ?? "application/json";
  } else if (input.contentType !== undefined) {
    headers["Content-Type"] = input.contentType;
  }

  return headers;
}

function normaliseAccessToken(accessToken: string): string {
  const trimmedToken = accessToken.trim();

  if (trimmedToken.length === 0) {
    throw new HmrcRequestBuildError("A server-side HMRC bearer token is required.");
  }

  if (trimmedToken.toLowerCase().startsWith("bearer ")) {
    throw new HmrcRequestBuildError(
      "Pass the raw HMRC access token without the Bearer prefix.",
    );
  }

  return trimmedToken;
}

function serialiseBody(body: unknown): string | undefined {
  if (body === undefined) {
    return undefined;
  }

  if (typeof body === "string") {
    return body;
  }

  return JSON.stringify(body);
}
