import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildSandboxOAuthAuthorisationUrl,
  createSandboxOAuthStart,
  exchangeSandboxOAuthCode,
  getSandboxOAuthUiState,
  HMRC_SANDBOX_API_BASE_URL,
  HMRC_SANDBOX_AUTH_BASE_URL,
  HMRC_SANDBOX_DEMO_SESSION_VALUE,
  HMRC_SANDBOX_REQUIRED_REDIRECT_URI,
  HmrcSandboxOAuthError,
  isSandboxDemoSessionCookieActive,
  summariseSandboxOAuthToken,
} from "../../../src/server/hmrc";

const oauthEnv = {
  APP_ENV: "local",
  HMRC_ENV: "sandbox",
  HMRC_SANDBOX_API_BASE_URL,
  HMRC_SANDBOX_AUTH_BASE_URL,
  HMRC_SANDBOX_CLIENT_ID: "unit-test-client-id",
  HMRC_SANDBOX_CLIENT_SECRET: "unit-test-client-credential",
  HMRC_SANDBOX_REDIRECT_URI: "http://localhost:3000/api/hmrc/oauth/callback",
  HMRC_SANDBOX_SCOPES: "read:self-assessment write:self-assessment",
  HMRC_SANDBOX_TEST_USER_TYPE: "individual",
};

const railwayRedirectUri =
  "https://quarterlink-production.up.railway.app/api/hmrc/oauth/callback";

describe("HMRC sandbox OAuth readiness", () => {
  test("builds an individual sandbox PKCE authorisation URL without the client secret or verifier", () => {
    const url = buildSandboxOAuthAuthorisationUrl(oauthEnv);

    assert.equal(url.origin, HMRC_SANDBOX_AUTH_BASE_URL);
    assert.equal(url.pathname, "/oauth/authorize");
    assert.equal(url.searchParams.get("response_type"), "code");
    assert.equal(url.searchParams.get("client_id"), "unit-test-client-id");
    assert.equal(
      url.searchParams.get("scope"),
      "read:self-assessment write:self-assessment",
    );
    assert.equal(
      url.searchParams.get("redirect_uri"),
      "http://localhost:3000/api/hmrc/oauth/callback",
    );
    assert((url.searchParams.get("state")?.length ?? 0) >= 32);
    assert((url.searchParams.get("code_challenge")?.length ?? 0) >= 43);
    assert.equal(url.searchParams.get("code_challenge_method"), "S256");
    assert(!url.toString().includes("unit-test-client-credential"));
    assert(!url.toString().includes("code_verifier"));
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
    const state = getSandboxOAuthUiState(oauthEnv, {
      sandboxDemoSessionActive: true,
    });

    assert.equal(state.canStartOAuth, true);
    assert.equal(state.canUseSandboxDemoSession, true);
    assert.equal(state.sandboxDemoSessionActive, true);
    assert.equal(
      state.redirectUri,
      "http://localhost:3000/api/hmrc/oauth/callback",
    );
    assert.equal(state.requiredRedirectUri, HMRC_SANDBOX_REQUIRED_REDIRECT_URI);
    assert.deepEqual(state.missingEnvVars, []);
    assert.deepEqual(state.invalidEnvMessages, []);
    assert(!JSON.stringify(state).includes("unit-test-client-credential"));
  });

  test("accepts a Railway HTTPS redirect for UI readiness", () => {
    const state = getSandboxOAuthUiState(
      {
        ...oauthEnv,
        HMRC_SANDBOX_REDIRECT_URI: railwayRedirectUri,
      },
      {
        sandboxDemoSessionActive: true,
      },
    );

    assert.equal(state.canStartOAuth, true);
    assert.equal(state.redirectUri, railwayRedirectUri);
    assert.deepEqual(state.missingEnvVars, []);
    assert.deepEqual(state.invalidEnvMessages, []);
    assert(!JSON.stringify(state).includes("unit-test-client-credential"));
  });

  test("missing redirect disables UI readiness", () => {
    const state = getSandboxOAuthUiState(
      {
        ...oauthEnv,
        HMRC_SANDBOX_REDIRECT_URI: undefined,
      },
      {
        sandboxDemoSessionActive: true,
      },
    );

    assert.equal(state.canStartOAuth, false);
    assert.equal(state.redirectUri, "not set");
    assert(state.missingEnvVars.includes("HMRC_SANDBOX_REDIRECT_URI"));
    assert.deepEqual(state.invalidEnvMessages, []);
  });

  test("malformed redirect disables UI readiness", () => {
    const state = getSandboxOAuthUiState(
      {
        ...oauthEnv,
        HMRC_SANDBOX_REDIRECT_URI: "not-a-url",
      },
      {
        sandboxDemoSessionActive: true,
      },
    );

    assert.equal(state.canStartOAuth, false);
    assert.deepEqual(state.missingEnvVars, []);
    assert(state.invalidEnvMessages.includes(
      "HMRC_SANDBOX_REDIRECT_URI must be an absolute HTTPS URL, or HTTP localhost for local development.",
    ));
  });

  test("requires the local sandbox demo session before OAuth can start", () => {
    const state = getSandboxOAuthUiState(oauthEnv);

    assert.equal(state.canStartOAuth, false);
    assert.equal(state.canUseSandboxDemoSession, true);
    assert.equal(state.sandboxDemoSessionActive, false);
  });

  test("does not enable the demo session bypass outside local sandbox mode", () => {
    const state = getSandboxOAuthUiState(
      {
        ...oauthEnv,
        APP_ENV: "sandbox",
      },
      {
        sandboxDemoSessionActive: true,
      },
    );

    assert.equal(state.canStartOAuth, false);
    assert.equal(state.canUseSandboxDemoSession, false);
    assert.equal(state.sandboxDemoSessionActive, false);
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
    assert(!state.missingEnvVars.includes("HMRC_SANDBOX_OAUTH_STATE"));
  });

  test("recognises only the exact local demo session cookie value", () => {
    assert.equal(
      isSandboxDemoSessionCookieActive(HMRC_SANDBOX_DEMO_SESSION_VALUE),
      true,
    );
    assert.equal(isSandboxDemoSessionCookieActive("other"), false);
    assert.equal(isSandboxDemoSessionCookieActive(undefined), false);
  });

  test("exchanges an authorisation code against the sandbox token endpoint", async () => {
    let requestedUrl = "";
    let requestedBody = "";
    const start = createSandboxOAuthStart(oauthEnv, {
      now: () => Date.parse("2026-05-13T10:00:00.000Z"),
    });

    const token = await exchangeSandboxOAuthCode({
      code: "unit-test-code-value",
      state: start.state,
      source: oauthEnv,
      now: () => Date.parse("2026-05-13T10:01:00.000Z"),
      fetchImpl: async (input, init) => {
        requestedUrl = String(input);
        requestedBody = String(init?.body);

        return new Response(
          JSON.stringify({
            access_token: "unit-test-primary-value",
            refresh_token: "unit-test-secondary-value",
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
    assert.equal(body.get("client_id"), "unit-test-client-id");
    assert.equal(body.get("client_secret"), "unit-test-client-credential");
    assert.equal(body.get("code"), "unit-test-code-value");
    assert((body.get("code_verifier")?.length ?? 0) >= 43);
    assert.equal(
      body.get("redirect_uri"),
      "http://localhost:3000/api/hmrc/oauth/callback",
    );
    assert(!requestedUrl.includes("code_verifier"));
    assert.equal(token.accessToken, "unit-test-primary-value");
    assert.equal(token.refreshToken, "unit-test-secondary-value");
    assert.equal(token.issuedAt, "2026-05-13T10:01:00.000Z");
    assert.equal(token.expiresAt, "2026-05-13T14:00:00.000Z");
    assert.equal(token.clockDriftBufferSeconds, 60);
  });

  test("rejects mismatched callback state before token exchange", async () => {
    let called = false;

    await assert.rejects(
      () =>
        exchangeSandboxOAuthCode({
          code: "unit-test-code-value",
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

  test("rejects reused callback state before token exchange", async () => {
    const start = createSandboxOAuthStart(oauthEnv);

    await exchangeSandboxOAuthCode({
      code: "unit-test-code-value",
      state: start.state,
      source: oauthEnv,
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            access_token: "unit-test-primary-value",
            expires_in: 14400,
          }),
          { status: 200 },
        ),
    });

    let called = false;
    await assert.rejects(
      () =>
        exchangeSandboxOAuthCode({
          code: "unit-test-code-value",
          state: start.state,
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

  test("rejects expired callback state before token exchange", async () => {
    const start = createSandboxOAuthStart(oauthEnv, {
      now: () => Date.parse("2026-05-13T10:00:00.000Z"),
    });

    let called = false;
    await assert.rejects(
      () =>
        exchangeSandboxOAuthCode({
          code: "unit-test-code-value",
          state: start.state,
          source: oauthEnv,
          now: () => Date.parse("2026-05-13T10:06:00.000Z"),
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
      accessToken: "unit-test-primary-value",
      refreshToken: "unit-test-secondary-value",
      expiresIn: 14400,
      issuedAt: "2026-05-13T10:01:00.000Z",
      expiresAt: "2026-05-13T14:00:00.000Z",
      clockDriftBufferSeconds: 60,
      scope: "read:self-assessment write:self-assessment",
      tokenType: "bearer",
    });

    assert.deepEqual(summary, {
      tokenType: "bearer",
      expiresIn: 14400,
      issuedAt: "2026-05-13T10:01:00.000Z",
      expiresAt: "2026-05-13T14:00:00.000Z",
      clockDriftBufferSeconds: 60,
      scope: "read:self-assessment write:self-assessment",
      hasAccessToken: true,
      hasRefreshToken: true,
    });
    assert(!JSON.stringify(summary).includes("unit-test-primary-value"));
    assert(!JSON.stringify(summary).includes("unit-test-secondary-value"));
  });
});
