import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  assembleFraudPreventionHeaders,
  HMRC_SANDBOX_API_BASE_URL,
  HMRC_SANDBOX_AUTH_BASE_URL,
  HmrcRequestBuildError,
  HmrcSandboxClient,
  loadHmrcSandboxConfig,
  REDACTED_VALUE,
  type FraudPreventionAssemblyInput,
} from "../../../src/server/hmrc";

const config = loadHmrcSandboxConfig({
  APP_ENV: "local",
  HMRC_ENV: "sandbox",
  HMRC_SANDBOX_API_BASE_URL,
  HMRC_SANDBOX_AUTH_BASE_URL,
  HMRC_SANDBOX_CLIENT_ID: "sandbox-client-id",
  HMRC_SANDBOX_CLIENT_SECRET: "sandbox-client-secret",
  HMRC_SANDBOX_REDIRECT_URI: "http://localhost:3000/api/hmrc/oauth/callback",
  HMRC_SANDBOX_SCOPES: "read:self-assessment write:self-assessment",
});

function fraudHeaders() {
  const input: FraudPreventionAssemblyInput = {
    client: {
      browserJsUserAgent: "Mozilla/5.0",
      deviceId: "beec798b-b366-47fa-b1f8-92cede14a1ce",
      multiFactor: [
        {
          type: "TOTP",
          timestamp: "2026-05-12T10:00Z",
          uniqueReference: "hashed-totp-reference",
        },
      ],
      screens: [
        {
          width: 1920,
          height: 1080,
          scalingFactor: 1,
          colourDepth: 24,
        },
      ],
      timezone: "UTC+00:00",
      windowSize: {
        width: 1280,
        height: 720,
      },
    },
    server: {
      clientPublicIp: "198.51.100.20",
      clientPublicIpTimestamp: "2026-05-12T10:00:00.000Z",
      clientPublicPort: 50123,
      clientUserIds: {
        quarterlink: "user-123",
      },
      vendorForwarded: [
        {
          by: "203.0.113.20",
          for: "198.51.100.20",
        },
      ],
      vendorLicenseIds: {
        quarterlink: "hashed-license-reference",
      },
      vendorProductName: "QuarterLink",
      vendorPublicIp: "203.0.113.20",
      vendorVersion: {
        quarterlink: "0.1.0",
      },
    },
  };
  const result = assembleFraudPreventionHeaders(input);

  if (!result.ok) {
    assert.fail("Expected test fraud-prevention headers to assemble.");
  }

  return result.headers;
}

describe("HMRC sandbox client scaffold", () => {
  test("constructs an OAuth authorisation URL without the client secret", () => {
    const client = new HmrcSandboxClient(config);
    const url = client.buildOAuthAuthorisationUrl({
      state: "opaque-state-id",
      codeChallenge: "pkce-code-challenge",
    });

    assert.equal(url.origin, HMRC_SANDBOX_AUTH_BASE_URL);
    assert.equal(url.pathname, "/oauth/authorize");
    assert.equal(url.searchParams.get("response_type"), "code");
    assert.equal(url.searchParams.get("client_id"), "sandbox-client-id");
    assert.equal(
      url.searchParams.get("redirect_uri"),
      "http://localhost:3000/api/hmrc/oauth/callback",
    );
    assert.equal(url.searchParams.get("state"), "opaque-state-id");
    assert.equal(url.searchParams.get("code_challenge_method"), "S256");
    assert(!url.toString().includes("sandbox-client-secret"));
  });

  test("prepares sandbox requests with redacted safe metadata", () => {
    const client = new HmrcSandboxClient(config);
    const prepared = client.prepareRequest({
      method: "GET",
      path: "/individuals/business/details",
      accessToken: "access-token-that-must-not-leak",
      fraudPreventionHeaders: fraudHeaders(),
      query: {
        nino: "AA000000A",
      },
      govTestScenario: "DEFAULT",
      accept: "application/json",
    });

    assert.equal(
      prepared.request.url,
      `${HMRC_SANDBOX_API_BASE_URL}/individuals/business/details?nino=AA000000A`,
    );
    assert.equal(
      prepared.request.headers.Authorization,
      "Bearer access-token-that-must-not-leak",
    );
    assert.equal(
      prepared.safeMetadata.redactedHeaders.Authorization,
      `Bearer ${REDACTED_VALUE}`,
    );
    assert.equal(
      prepared.safeMetadata.redactedHeaders["Gov-Client-Device-ID"],
      REDACTED_VALUE,
    );
    assert(!JSON.stringify(prepared.safeMetadata).includes("access-token-that"));
    assert(!prepared.safeMetadata.url.includes("AA000000A"));
    assert(
      prepared.safeMetadata.url.includes(
        `nino=${encodeURIComponent(REDACTED_VALUE)}`,
      ),
    );
  });

  test("rejects absolute URLs and Bearer-prefixed token input", () => {
    const client = new HmrcSandboxClient(config);

    assert.throws(
      () =>
        client.prepareRequest({
          method: "GET",
          path: "https://api.service.hmrc.gov.uk/production",
          accessToken: "access-token",
          fraudPreventionHeaders: fraudHeaders(),
        }),
      HmrcRequestBuildError,
    );

    assert.throws(
      () =>
        client.prepareRequest({
          method: "GET",
          path: "/individuals/business/details",
          accessToken: "Bearer access-token",
          fraudPreventionHeaders: fraudHeaders(),
        }),
      HmrcRequestBuildError,
    );
  });
});
