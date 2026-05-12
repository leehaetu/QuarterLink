import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildFraudPreventionInputFromEnv,
  HMRC_SANDBOX_API_BASE_URL,
  HMRC_SANDBOX_AUTH_BASE_URL,
  REDACTED_VALUE,
  runQl008SandboxDiscovery,
} from "../../../src/server/hmrc";

const validBaseEnv = {
  APP_ENV: "local",
  HMRC_ENV: "sandbox",
  HMRC_SANDBOX_API_BASE_URL,
  HMRC_SANDBOX_AUTH_BASE_URL,
  HMRC_SANDBOX_CLIENT_ID: "sandbox-client-id",
  HMRC_SANDBOX_CLIENT_SECRET: "sandbox-client-secret",
  HMRC_SANDBOX_REDIRECT_URI: "http://localhost:3000/api/hmrc/oauth/callback",
  HMRC_SANDBOX_SCOPES: "read:self-assessment write:self-assessment",
  HMRC_SANDBOX_ACCESS_TOKEN: "fresh-user-token",
  HMRC_SANDBOX_TEST_NINO: "AA000000A",
};

const validFraudEnv = {
  QL_008_FRAUD_BROWSER_JS_USER_AGENT: "Mozilla/5.0",
  QL_008_FRAUD_DEVICE_ID: "beec798b-b366-47fa-b1f8-92cede14a1ce",
  QL_008_FRAUD_MFA_TYPE: "AUTH_CODE",
  QL_008_FRAUD_MFA_TIMESTAMP: "2026-05-12T10:00Z",
  QL_008_FRAUD_MFA_UNIQUE_REFERENCE:
    "fc4b5fd6816f75a7c81fc8eaa9499d6a299bd803397166e8c4cf9280b801d62c",
  QL_008_FRAUD_CLIENT_PUBLIC_IP: "198.51.100.10",
  QL_008_FRAUD_CLIENT_PUBLIC_IP_TIMESTAMP: "2026-05-12T10:00:00.000Z",
  QL_008_FRAUD_CLIENT_PUBLIC_PORT: "52345",
  QL_008_FRAUD_SCREEN_WIDTH: "1920",
  QL_008_FRAUD_SCREEN_HEIGHT: "1080",
  QL_008_FRAUD_SCREEN_SCALING_FACTOR: "2",
  QL_008_FRAUD_SCREEN_COLOUR_DEPTH: "24",
  QL_008_FRAUD_TIMEZONE: "UTC+01:00",
  QL_008_FRAUD_CLIENT_USER_ID_KEY: "quarterlink",
  QL_008_FRAUD_CLIENT_USER_ID_VALUE: "user-123",
  QL_008_FRAUD_WINDOW_WIDTH: "1440",
  QL_008_FRAUD_WINDOW_HEIGHT: "900",
  QL_008_FRAUD_VENDOR_FORWARDED_BY: "203.0.113.10",
  QL_008_FRAUD_VENDOR_FORWARDED_FOR: "198.51.100.10",
  QL_008_FRAUD_VENDOR_LICENSE_ID_KEY: "quarterlink",
  QL_008_FRAUD_VENDOR_LICENSE_ID_VALUE: "hashed-license-reference",
  QL_008_FRAUD_VENDOR_PUBLIC_IP: "203.0.113.10",
  QL_008_FRAUD_VENDOR_VERSION: "0.1.0",
};

describe("QL-008 sandbox discovery", () => {
  test("reports missing WEB_APP_VIA_SERVER inputs without HMRC calls", async () => {
    const result = await runQl008SandboxDiscovery({
      env: validBaseEnv,
      allowHmrcNetworkCalls: true,
      fetchImpl: async () => {
        assert.fail("Discovery must not call HMRC when fraud inputs are missing.");
      },
    });

    assert.equal(result.ok, false);
    assert.equal(result.hmrcNetworkCallsAttempted, false);
    assert.equal(result.hmrcSubmissionCallsAttempted, false);
    assert(
      result.missingFraudPreventionInputs.some(
        (input) => input.headerName === "Gov-Client-Browser-JS-User-Agent",
      ),
    );
  });

  test("stays dry-run unless network calls are explicitly enabled", async () => {
    const result = await runQl008SandboxDiscovery({
      env: {
        ...validBaseEnv,
        ...validFraudEnv,
      },
      fetchImpl: async () => {
        assert.fail("Discovery must not call HMRC during dry-run.");
      },
    });

    assert.equal(result.hmrcNetworkCallsAttempted, false);
    assert.equal(result.hmrcSubmissionCallsAttempted, false);
    assert(
      result.items.some(
        (item) =>
          item.check === "HMRC sandbox network calls" && item.status === "skip",
      ),
    );
  });

  test("gets an application-restricted token before FPH and read-only discovery", async () => {
    const requestedUrls: string[] = [];
    const result = await runQl008SandboxDiscovery({
      env: {
        ...validBaseEnv,
        ...validFraudEnv,
      },
      allowHmrcNetworkCalls: true,
      fetchImpl: async (input, init) => {
        requestedUrls.push(String(input));

        if (requestedUrls.length === 1) {
          assert.equal(
            String(input),
            `${HMRC_SANDBOX_API_BASE_URL}/oauth/token`,
          );
          assert.equal(init?.method, "POST");
          assert.equal(init?.signal instanceof AbortSignal, true);
          const body = init?.body as URLSearchParams;
          assert.equal(body.get("grant_type"), "client_credentials");
          assert.equal(body.get("client_id"), "sandbox-client-id");
          assert.equal(body.get("client_secret"), "sandbox-client-secret");
          assert.equal(body.has("scope"), false);
          return jsonResponse({
            access_token: "fresh-application-token",
            token_type: "bearer",
            expires_in: 14400,
          });
        }

        const authorization =
          init?.headers instanceof Headers
            ? init.headers.get("Authorization")
            : (init?.headers as Record<string, string>).Authorization;
        assert.equal(
          authorization,
          requestedUrls.length === 2
            ? "Bearer fresh-application-token"
            : "Bearer fresh-user-token",
        );

        if (requestedUrls.length === 2) {
          return jsonResponse({
            specVersion: "3.1",
            code: "VALID_HEADERS",
            message: "All headers required for your connection method appear valid.",
          });
        }

        if (requestedUrls.length === 3) {
          return jsonResponse({
            businessData: [
              {
                typeOfBusiness: "self-employment",
                businessId: "XBIS12345678903",
              },
            ],
          });
        }

        return jsonResponse({
          obligations: [
            {
              typeOfBusiness: "self-employment",
              businessId: "XBIS12345678903",
              obligationDetails: [
                {
                  periodStartDate: "2026-04-06",
                  periodEndDate: "2026-07-05",
                  dueDate: "2026-08-07",
                  status: "open",
                },
              ],
            },
          ],
        });
      },
    });

    assert.equal(result.ok, true);
    assert.equal(result.hmrcNetworkCallsAttempted, true);
    assert.equal(result.hmrcSubmissionCallsAttempted, false);
    assert.equal(requestedUrls.length, 4);
    assert(requestedUrls[1].endsWith("/test/fraud-prevention-headers/validate"));
    assert(requestedUrls[2].includes("/individuals/business/details/"));
    assert(requestedUrls[3].includes("/obligations/details/"));
    assert.deepEqual(result.businessDetails?.selfEmploymentBusinessIds, [
      "XBIS12345678903",
    ]);
    assert.equal(result.obligations?.openObligationCount, 1);
    assert(!JSON.stringify(result).includes("fresh-application-token"));
    assert(!JSON.stringify(result).includes("fresh-user-token"));
    assert(!JSON.stringify(result).includes("sandbox-client-secret"));
  });

  test("blocks Business Details when Test Fraud Prevention Headers does not pass", async () => {
    const requestedUrls: string[] = [];
    const result = await runQl008SandboxDiscovery({
      env: {
        ...validBaseEnv,
        ...validFraudEnv,
      },
      allowHmrcNetworkCalls: true,
      fetchImpl: async (input) => {
        requestedUrls.push(String(input));
        if (requestedUrls.length === 1) {
          return jsonResponse({
            access_token: "fresh-application-token",
            token_type: "bearer",
          });
        }

        return jsonResponse({
          specVersion: "3.1",
          code: "INVALID_HEADERS",
          message: "At least 1 header is invalid.",
          errors: [
            {
              code: "MISSING_HEADER",
              message: "Header required",
              headers: ["gov-vendor-version"],
            },
          ],
        });
      },
    });

    assert.equal(result.ok, false);
    assert.equal(result.hmrcNetworkCallsAttempted, true);
    assert.equal(result.hmrcSubmissionCallsAttempted, false);
    assert.equal(requestedUrls.length, 2);
    assert.equal(result.businessDetails, undefined);
  });

  test("redacts sensitive values in CLI-safe payloads", async () => {
    const result = await runQl008SandboxDiscovery({
      env: {
        ...validBaseEnv,
        ...validFraudEnv,
      },
      allowHmrcNetworkCalls: true,
      fetchImpl: async (_input, _init) => {
        if (_init?.method === "POST") {
          return jsonResponse({
            access_token: "application-token-that-must-not-leak",
            token_type: "bearer",
          });
        }

        return jsonResponse({
          specVersion: "3.1",
          code: "INVALID_HEADERS",
          message: "At least 1 header is invalid.",
          errors: [
            {
              code: "INVALID_HEADER",
              message: "Do not echo sensitive data.",
              access_token: "token-that-must-not-leak",
            },
          ],
        });
      },
    });

    assert.equal(
      result.testFraudPreventionHeaders?.safeMetadata?.errors instanceof Array,
      true,
    );
    assert(JSON.stringify(result).includes(REDACTED_VALUE));
    assert(!JSON.stringify(result).includes("token-that-must-not-leak"));
    assert(!JSON.stringify(result).includes("application-token-that-must-not-leak"));
  });

  test("supports an optional FPH token override without requiring it", async () => {
    const requestedUrls: string[] = [];
    const result = await runQl008SandboxDiscovery({
      env: {
        ...validBaseEnv,
        ...validFraudEnv,
        HMRC_SANDBOX_FPH_ACCESS_TOKEN: "optional-application-token",
      },
      allowHmrcNetworkCalls: true,
      fetchImpl: async (input) => {
        requestedUrls.push(String(input));
        return jsonResponse({
          specVersion: "3.1",
          code: "INVALID_HEADERS",
          message: "Stopped after the validator for this test.",
        });
      },
    });

    assert.equal(result.fphApplicationToken?.usedOverride, true);
    assert.equal(requestedUrls.length, 1);
    assert(requestedUrls[0].endsWith("/test/fraud-prevention-headers/validate"));
    assert(!JSON.stringify(result).includes("optional-application-token"));
  });

  test("builds structured fraud input from environment variables", () => {
    const result = buildFraudPreventionInputFromEnv({
      ...validFraudEnv,
      npm_package_version: "0.1.0",
    });

    assert.equal(result.missing.length, 0);
    assert.equal(result.input?.server.vendorProductName, "QuarterLink");
    assert.equal(result.input?.server.clientPublicPort, 52345);
  });

  test("reports invalid numeric fraud inputs without throwing", async () => {
    const result = await runQl008SandboxDiscovery({
      env: {
        ...validBaseEnv,
        ...validFraudEnv,
        QL_008_FRAUD_CLIENT_PUBLIC_PORT: "not-a-number",
      },
      allowHmrcNetworkCalls: true,
      fetchImpl: async () => {
        assert.fail("Discovery must not call HMRC when fraud inputs are invalid.");
      },
    });

    assert.equal(result.ok, false);
    assert.equal(result.hmrcNetworkCallsAttempted, false);
    assert(
      result.missingFraudPreventionInputs.some(
        (input) => input.headerName === "Gov-Client-Public-Port",
      ),
    );
  });
});

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
