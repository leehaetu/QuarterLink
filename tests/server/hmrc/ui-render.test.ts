import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

const ql008FraudCollector = {
  enabled: true,
  appEnvironment: "local",
  hmrcEnvironment: "sandbox",
  endpointPath: "/api/local-sandbox/fraud-prevention-inputs",
} as const;

const forbiddenRealStateClaims = [
  "ready to submit",
  "HMRC recognised",
  "HMRC-recognised",
  "production ready",
  "connected to HMRC production",
] as const;

describe("QL-008 sandbox UI rendering", () => {
  test("shows the sandbox step order and gates HMRC connect by demo access", () => {
    const html = renderToStaticMarkup(
      createElement(WorkspaceShell, {
        hmrcSandboxOAuth: getSandboxOAuthUiState(oauthEnv),
        ql008FraudCollector,
      }),
    );

    assert(html.includes("Step 1: Continue as sandbox demo user"));
    assert(html.includes("Step 2: Collect fraud-prevention inputs"));
    assert(html.includes("Step 3: Connect to HMRC Sandbox"));
    assert(html.includes("Complete Step 1 before connecting to HMRC Sandbox."));
    assert(!html.includes("href=\"/api/hmrc/oauth/start\""));
    assert(!html.includes("unit-test-client-credential"));
    assertNoForbiddenRealStateClaims(html);
  });

  test("shows HMRC connect link after sandbox demo access is active", () => {
    const html = renderToStaticMarkup(
      createElement(WorkspaceShell, {
        hmrcSandboxOAuth: getSandboxOAuthUiState(oauthEnv, {
          sandboxDemoSessionActive: true,
        }),
        ql008FraudCollector,
      }),
    );

    assert(html.includes("href=\"/api/hmrc/oauth/start\""));
    assert(html.includes("Temporary QL-008 sandbox demo access is active."));
    assert(!html.includes("unit-test-client-credential"));
    assertNoForbiddenRealStateClaims(html);
  });

  test("shows Step 6 pre-OAuth real state without implying submission readiness", () => {
    const html = renderToStaticMarkup(
      createElement(WorkspaceShell, {
        hmrcSandboxOAuth: getSandboxOAuthUiState(oauthEnv),
        ql008FraudCollector,
        initialStepIndex: 5,
      }),
    );

    assert(html.includes("HMRC sandbox OAuth not connected"));
    assert(
      html.includes("Connect through the QL-008 sandbox connection panel first"),
    );
    assert(html.includes("No HMRC submission has been made"));
    assert(html.includes("Fraud-prevention validation still required"));
    assert(
      html.includes("Business Details and Obligations discovery still required"),
    );
    assert(html.includes("Quarterly update sending remains disabled"));
    assertNoForbiddenRealStateClaims(html);
  });

  test("shows Step 6 OAuth state without treating OAuth as FPH or discovery evidence", () => {
    const html = renderToStaticMarkup(
      createElement(WorkspaceShell, {
        hmrcSandboxOAuth: getSandboxOAuthUiState(oauthEnv, {
          sandboxDemoSessionActive: true,
          sandboxTokenSessionActive: true,
        }),
        ql008FraudCollector,
        initialStepIndex: 5,
      }),
    );

    assert(html.includes("HMRC sandbox OAuth connected"));
    assert(html.includes("No HMRC API evidence calls have been made"));
    assert(html.includes("No HMRC submission has been made"));
    assert(html.includes("Fraud-prevention validation still required"));
    assert(
      html.includes("Business Details and Obligations discovery still required"),
    );
    assert(html.includes("Quarterly update sending remains disabled"));
    assert(!html.includes("HMRC sandbox OAuth not connected"));
    assert(!html.includes("access_token"));
    assert(!html.includes("refresh_token"));
    assert(!html.includes("unit-test-client-credential"));
    assertNoForbiddenRealStateClaims(html);
  });

  test("classifies all missing QL-008 fraud-header variables without raw secret values", () => {
    const report = readFileSync(
      ".agent/runs/QL-008-fraud-header-missing-data-decision-001.md",
      "utf8",
    );

    const expectedRows = [
      ["QL_008_FRAUD_MFA_TYPE", "Gov-Client-Multi-Factor", "C"],
      ["QL_008_FRAUD_MFA_TIMESTAMP", "Gov-Client-Multi-Factor", "C"],
      ["QL_008_FRAUD_MFA_UNIQUE_REFERENCE", "Gov-Client-Multi-Factor", "C"],
      ["QL_008_FRAUD_CLIENT_PUBLIC_PORT", "Gov-Client-Public-Port", "D"],
      ["QL_008_FRAUD_CLIENT_USER_ID_KEY", "Gov-Client-User-IDs", "C"],
      ["QL_008_FRAUD_CLIENT_USER_ID_VALUE", "Gov-Client-User-IDs", "C"],
      ["QL_008_FRAUD_VENDOR_FORWARDED_BY", "Gov-Vendor-Forwarded", "D"],
      ["QL_008_FRAUD_VENDOR_FORWARDED_FOR", "Gov-Vendor-Forwarded", "A"],
      ["QL_008_FRAUD_VENDOR_LICENSE_ID_KEY", "Gov-Vendor-License-IDs", "C"],
      ["QL_008_FRAUD_VENDOR_LICENSE_ID_VALUE", "Gov-Vendor-License-IDs", "C"],
      ["QL_008_FRAUD_VENDOR_PUBLIC_IP", "Gov-Vendor-Public-IP", "D"],
    ] as const;

    for (const [variable, header, classification] of expectedRows) {
      assert(
        report.includes(
          `| \`${variable}\` | \`${header}\` | ${classification} |`,
        ),
        `${variable} was not classified with ${header} / ${classification}`,
      );
    }

    assert(report.includes("Exact next action"));
    assert(report.includes("Test Fraud Prevention Headers remains blocked"));
    assert(!report.includes("access_token="));
    assert(!report.includes("refresh_token="));
    assert(!report.includes("client_secret="));
    assert(!report.includes("sandbox password="));
    assert(!report.includes("auth code="));
  });
});

function assertNoForbiddenRealStateClaims(html: string): void {
  const lowerHtml = html.toLowerCase();

  for (const claim of forbiddenRealStateClaims) {
    assert(
      !lowerHtml.includes(claim.toLowerCase()),
      `Rendered forbidden claim: ${claim}`,
    );
  }
}
