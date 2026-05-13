import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WorkspaceShell } from "../../../src/app/workspace-shell";
import {
  getSandboxOAuthUiState,
  HMRC_SANDBOX_API_BASE_URL,
  HMRC_SANDBOX_AUTH_BASE_URL,
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

describe("QL-008 sandbox UI rendering", () => {
  test("shows the sandbox step order and gates HMRC connect by demo access", () => {
    const html = renderToStaticMarkup(
      createElement(WorkspaceShell, {
        hmrcSandboxOAuth: getSandboxOAuthUiState(oauthEnv),
        ql008FraudCollector: {
          enabled: true,
          appEnvironment: "local",
          hmrcEnvironment: "sandbox",
          endpointPath: "/api/local-sandbox/fraud-prevention-inputs",
        },
      }),
    );

    assert(html.includes("Step 1: Continue as sandbox demo user"));
    assert(html.includes("Step 2: Collect fraud-prevention inputs"));
    assert(html.includes("Step 3: Connect to HMRC Sandbox"));
    assert(html.includes("Complete Step 1 before connecting to HMRC Sandbox."));
    assert(!html.includes("href=\"/api/hmrc/oauth/start\""));
    assert(!html.includes("unit-test-client-credential"));
  });

  test("shows HMRC connect link after sandbox demo access is active", () => {
    const html = renderToStaticMarkup(
      createElement(WorkspaceShell, {
        hmrcSandboxOAuth: getSandboxOAuthUiState(oauthEnv, {
          sandboxDemoSessionActive: true,
        }),
        ql008FraudCollector: {
          enabled: true,
          appEnvironment: "local",
          hmrcEnvironment: "sandbox",
          endpointPath: "/api/local-sandbox/fraud-prevention-inputs",
        },
      }),
    );

    assert(html.includes("href=\"/api/hmrc/oauth/start\""));
    assert(html.includes("Temporary QL-008 sandbox demo access is active."));
    assert(!html.includes("unit-test-client-credential"));
  });
});
