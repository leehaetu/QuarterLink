import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildSandboxOAuthAuthorisationUrl,
  exchangeSandboxOAuthCode,
  getSandboxOAuthUiState,
  HMRC_SANDBOX_API_BASE_URL,
  HMRC_SANDBOX_AUTH_BASE_URL,
  HMRC_SANDBOX_REQUIRED_REDIRECT_URI,
  HmrcSandboxOAuthError,
  summariseSandboxOAuthToken,
} from "../../../src/server/hmrc";

const oauthEnv = {
  APP_ENV: "local",
  HMRC_ENV: "sandbox",
  HMRC_SANDBOX_API_BASE_URL,
  HMRC_SANDBOX_AUTH_BASE_URL,
  HMRC_SANDBOX_CLIENT_ID: "sandbox-client-id",
  HMRC_SANDBOX_CLIENT_SECRET: "sandbox-client-secret",
  HMRC_SANDBOX_REDIRECT_URI: "http://localhost:3000/api/hmrc/oauth/callback",
  HMRC_SANDBOX_SCOPES: "read:self-assessment write:self-assessment",
  HMRC_SANDBOX_TEST_USER_TYPE: "individual",
  HMRC_SANDBOX_OAUTH_STATE: "opaque-local-state-value",
};

describe("HMRC sandbox OAuth readiness", () => {
  test("builds an individual sandbox authorisation URL without the client secret", () => {
    const url = buildSandboxOAuthAuthorisationUrl(oauthEnv);

    assert.equal(url.origin, HMRC_SANDBOX_AUTH_BASE_URL);
    assert.equal(url.pathname, "/oauth/authorize");
    assert.equal(url.searchParams.get("response_type"), "code");
    assert.equal(url.searchParams.get("client_id"), "sandbox-client-id");
    assert.equal(
      url.searchParams.get("scope"),
      "read:self-assessment write:self-assessment",
    );
    assert.equal(
      url.searchParams.get("redirect_uri"),
      "http://localhost:3000/api/hmrc/oauth/callback",
    );
    assert.equal(url.searchParams.get("state"), "opaque-local-state-value");
    assert(!url.toString().includes("sandbox-client-secret"));
  });

  test("rejects organisation sandbox users for this OAuth readiness step", () => {
    assert.throws(
      () =>
        buildSandboxOAuthAuthorisationUrl({
          ...oauthEnv,
          HMRC_SANDBOX_TEST_USER_TYPE: "organisation",
        }),
      HmrcSandboxOAuthError,
    );
  });

  test("reports safe UI readiness without exposing secret values", () => {
    const state = getSandboxOAuthUiState(oauthEnv);

    assert.equal(state.canStartOAuth, true);
    assert.equal(state.requiredRedirectUri, HMRC_SANDBOX_REQUIRED_REDIRECT_URI);
    assert.deepEqual(state.missingEnvVars, []);
    assert(!JSON.stringify(state).includes("sandbox-client-secret"));
  });

  test("reports missing local env vars for the app connection card", () => {
    const state = getSandboxOAuthUiState({
      APP_ENV: "local",
      HMRC_ENV: "sandbox",
      HMRC_SANDBOX_API_BASE_URL,
      HMRC_SANDBOX_AUTH_BASE_URL,
      HMRC_SANDBOX_REDIRECT_URI: HMRC_SANDBOX_REQUIRED_REDIRECT_URI,
      HMRC_SANDBOX_SCOPES: "read:self-assessment write:self-assessment",
      HMRC_SANDBOX_TEST_USER_TYPE: "individual",
    });

    assert.equal(state.canStartOAuth, false);
    assert(state.missingEnvVars.includes("HMRC_SANDBOX_CLIENT_ID"));
    assert(state.missingEnvVars.includes("HMRC_SANDBOX_CLIENT_SECRET"));
    assert(state.missingEnvVars.includes("HMRC_SANDBOX_OAUTH_STATE"));
  });

  test("exchanges an authorisation code against the sandbox token endpoint", async () => {
    let requestedUrl = "";
    let requestedBody = "";

    const token = await exchangeSandboxOAuthCode({
      code: "single-use-authorisation-code",
      state: "opaque-local-state-value",
      source: oauthEnv,
      fetchImpl: async (input, init) => {
        requestedUrl = String(input);
        requestedBody = String(init?.body);

        return new Response(
          JSON.stringify({
            access_token: "access-token-value",
            refresh_token: "refresh-token-value",
            expires_in: 14400,
            scope: "read:self-assessment write:self-assessment",
            token_type: "bearer",
          }),
          { status: 200 },
        );
      },
    });

    const body = new URLSearchParams(requestedBody);

    assert.equal(requestedUrl, `${HMRC_SANDBOX_API_BASE_URL}/oauth/token`);
    assert.equal(body.get("grant_type"), "authorization_code");
    assert.equal(body.get("client_id"), "sandbox-client-id");
    assert.equal(body.get("client_secret"), "sandbox-client-secret");
    assert.equal(body.get("code"), "single-use-authorisation-code");
    assert.equal(
      body.get("redirect_uri"),
      "http://localhost:3000/api/hmrc/oauth/callback",
    );
    assert.equal(token.accessToken, "access-token-value");
    assert.equal(token.refreshToken, "refresh-token-value");
  });

  test("rejects mismatched callback state before token exchange", async () => {
    let called = false;

    await assert.rejects(
      () =>
        exchangeSandboxOAuthCode({
          code: "single-use-authorisation-code",
          state: "wrong-state",
          source: oauthEnv,
          fetchImpl: async () => {
            called = true;
            return new Response("{}", { status: 200 });
          },
        }),
      HmrcSandboxOAuthError,
    );

    assert.equal(called, false);
  });

  test("summarises token exchange output without token values", () => {
    const summary = summariseSandboxOAuthToken({
      accessToken: "access-token-value",
      refreshToken: "refresh-token-value",
      expiresIn: 14400,
      scope: "read:self-assessment write:self-assessment",
      tokenType: "bearer",
    });

    assert.deepEqual(summary, {
      tokenType: "bearer",
      expiresIn: 14400,
      scope: "read:self-assessment write:self-assessment",
      hasAccessToken: true,
      hasRefreshToken: true,
    });
    assert(!JSON.stringify(summary).includes("access-token-value"));
    assert(!JSON.stringify(summary).includes("refresh-token-value"));
  });
});
