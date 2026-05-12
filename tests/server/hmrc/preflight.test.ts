import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  HMRC_SANDBOX_API_BASE_URL,
  HMRC_SANDBOX_AUTH_BASE_URL,
  QL_008_OFFICIAL_ENDPOINTS,
  runQl008Preflight,
  type FraudPreventionAssemblyInput,
} from "../../../src/server/hmrc";

const validEnv = {
  APP_ENV: "local",
  HMRC_ENV: "sandbox",
  HMRC_SANDBOX_API_BASE_URL,
  HMRC_SANDBOX_AUTH_BASE_URL,
  HMRC_SANDBOX_CLIENT_ID: "sandbox-client-id",
  HMRC_SANDBOX_CLIENT_SECRET: "sandbox-client-secret",
  HMRC_SANDBOX_REDIRECT_URI: "http://localhost:3000/api/hmrc/oauth/callback",
  HMRC_SANDBOX_SCOPES: "read:self-assessment write:self-assessment",
  HMRC_SANDBOX_ACCESS_TOKEN: "access-token-that-is-not-printed",
  HMRC_SANDBOX_TEST_USER_READY: "true",
  HMRC_SANDBOX_TEST_NINO: "AA000000A",
  HMRC_SANDBOX_SELF_EMPLOYMENT_BUSINESS_ID: "XBIS12345678903",
  HMRC_SANDBOX_TAX_YEAR: "2024-25",
  HMRC_SANDBOX_PERIOD_START_DATE: "2024-04-06",
  HMRC_SANDBOX_PERIOD_END_DATE: "2024-07-05",
};

function fraudInput(): FraudPreventionAssemblyInput {
  return {
    client: {
      browserJsUserAgent: "Mozilla/5.0",
      deviceId: "beec798b-b366-47fa-b1f8-92cede14a1ce",
      multiFactor: [
        {
          type: "AUTH_CODE",
          timestamp: "2026-05-12T10:00Z",
          uniqueReference: "hashed-mfa-reference",
        },
      ],
      screens: [
        {
          width: 1920,
          height: 1080,
          scalingFactor: 2,
          colourDepth: 24,
        },
      ],
      timezone: "UTC+01:00",
      windowSize: {
        width: 1440,
        height: 900,
      },
    },
    server: {
      clientPublicIp: "198.51.100.10",
      clientPublicIpTimestamp: "2026-05-12T10:00:00.000Z",
      clientPublicPort: 52345,
      clientUserIds: {
        quarterlink: "user-123",
      },
      vendorForwarded: [
        {
          by: "203.0.113.10",
          for: "198.51.100.10",
        },
      ],
      vendorLicenseIds: {
        quarterlink: "hashed-license-reference",
      },
      vendorProductName: "QuarterLink",
      vendorPublicIp: "203.0.113.10",
      vendorVersion: {
        quarterlink: "0.1.0",
      },
    },
  };
}

describe("QL-008 HMRC sandbox preflight", () => {
  test("blocks when sandbox config and run inputs are missing", () => {
    const result = runQl008Preflight({
      env: {
        APP_ENV: "local",
        HMRC_ENV: "sandbox",
      },
    });

    assert.equal(result.ok, false);
    assert.equal(result.sandboxCallsAllowed, false);
    assert(
      result.blockers.some((blocker) =>
        blocker.includes("HMRC_SANDBOX_CLIENT_SECRET"),
      ),
    );
    assert.equal(result.evidenceClassification, "local/demo");
  });

  test("passes when config, OAuth context, sandbox context, and fraud inputs are present", () => {
    const result = runQl008Preflight({
      env: validEnv,
      fraudPreventionInput: fraudInput(),
    });

    assert.equal(result.ok, true);
    assert.equal(result.sandboxCallsAllowed, true);
    assert.deepEqual(
      result.officialEndpoints.map((endpoint) => `${endpoint.api} ${endpoint.version}`),
      QL_008_OFFICIAL_ENDPOINTS.map(
        (endpoint) => `${endpoint.api} ${endpoint.version}`,
      ),
    );
  });

  test("records current official versions and the 2025-26 endpoint caveat", () => {
    const selfEmploymentEndpoint = QL_008_OFFICIAL_ENDPOINTS.find(
      (endpoint) => endpoint.api === "Self Employment Business (MTD)",
    );

    assert.equal(selfEmploymentEndpoint?.version, "5.0");
    assert(selfEmploymentEndpoint?.note?.includes("2025-26"));
  });
});
