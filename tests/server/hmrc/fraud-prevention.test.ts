import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  assembleFraudPreventionHeaders,
  HMRC_CONNECTION_METHOD_WEB_APP_VIA_SERVER,
  REDACTED_VALUE,
  requireFraudPreventionHeaders,
  type FraudPreventionAssemblyInput,
} from "../../../src/server/hmrc";

function validFraudInput(): FraudPreventionAssemblyInput {
  return {
    client: {
      browserJsUserAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
      deviceId: "beec798b-b366-47fa-b1f8-92cede14a1ce",
      multiFactor: [
        {
          type: "AUTH_CODE",
          timestamp: "2026-05-12T10:00Z",
          uniqueReference:
            "fc4b5fd6816f75a7c81fc8eaa9499d6a299bd803397166e8c4cf9280b801d62c",
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

describe("HMRC fraud-prevention header assembly", () => {
  test("assembles the full WEB_APP_VIA_SERVER header set", () => {
    const result = assembleFraudPreventionHeaders(validFraudInput());

    if (!result.ok) {
      assert.fail("Expected fraud-prevention headers to assemble.");
    }

    assert.equal(
      result.headers["Gov-Client-Connection-Method"],
      HMRC_CONNECTION_METHOD_WEB_APP_VIA_SERVER,
    );
    assert.equal(result.headers["Gov-Client-Public-Port"], "52345");
    assert.equal(
      result.headers["Gov-Client-Multi-Factor"],
      "type=AUTH_CODE&timestamp=2026-05-12T10%3A00Z&unique-reference=fc4b5fd6816f75a7c81fc8eaa9499d6a299bd803397166e8c4cf9280b801d62c",
    );
    assert.equal(
      result.headers["Gov-Vendor-Product-Name"],
      "QuarterLink",
    );
  });

  test("makes missing MFA and licence data explicit", () => {
    const result = assembleFraudPreventionHeaders({
      ...validFraudInput(),
      client: {
        ...validFraudInput().client,
        multiFactor: undefined,
      },
      server: {
        ...validFraudInput().server,
        vendorLicenseIds: undefined,
      },
    });

    if (result.ok) {
      assert.fail("Expected fraud-prevention headers to be blocked.");
    }

    assert.deepEqual(
      result.missing.map((item) => item.headerName).sort(),
      ["Gov-Client-Multi-Factor", "Gov-Vendor-License-IDs"],
    );
  });

  test("rejects spoofable or placeholder server-derived values", () => {
    const result = assembleFraudPreventionHeaders({
      ...validFraudInput(),
      server: {
        ...validFraudInput().server,
        clientPublicIp: "not-an-ip",
        clientPublicPort: 443,
      },
    });

    if (result.ok) {
      assert.fail("Expected fraud-prevention headers to be blocked.");
    }

    assert(
      result.missing.some(
        (item) => item.headerName === "Gov-Client-Public-IP",
      ),
    );
    assert(
      result.missing.some(
        (item) => item.headerName === "Gov-Client-Public-Port",
      ),
    );
  });

  test("redacts raw fraud metadata from safe output", () => {
    const result = assembleFraudPreventionHeaders(validFraudInput());

    if (!result.ok) {
      assert.fail("Expected fraud-prevention headers to assemble.");
    }

    assert.equal(
      result.redactedHeaders["Gov-Client-Connection-Method"],
      HMRC_CONNECTION_METHOD_WEB_APP_VIA_SERVER,
    );
    assert.equal(result.redactedHeaders["Gov-Client-Device-ID"], REDACTED_VALUE);
    assert.equal(result.redactedHeaders["Gov-Client-Public-IP"], REDACTED_VALUE);
    assert.equal(result.redactedHeaders["Gov-Vendor-Forwarded"], REDACTED_VALUE);
  });

  test("throws a safe error when required headers are missing", () => {
    assert.throws(
      () =>
        requireFraudPreventionHeaders({
          ...validFraudInput(),
          client: {
            ...validFraudInput().client,
            deviceId: "undefined",
          },
        }),
      /Gov-Client-Device-ID/,
    );
  });
});
