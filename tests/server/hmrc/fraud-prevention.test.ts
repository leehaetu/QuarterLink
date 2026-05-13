import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  assembleFraudPreventionHeaders,
  buildWebAppViaServerFraudPreventionHeaders,
  encodeHmrcKeyValue,
  encodeHmrcScreens,
  HMRC_CONNECTION_METHOD_WEB_APP_VIA_SERVER,
  REDACTED_VALUE,
  requireFraudPreventionHeaders,
  timezoneFromOffsetMinutes,
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
      clientPublicIp: "8.8.8.8",
      clientPublicIpTimestamp: "2026-05-12T10:00:00.000Z",
      clientPublicPort: 52345,
      clientUserIds: {
        quarterlink: "user-123",
      },
      vendorForwarded: [
        {
          by: "1.1.1.1",
          for: "8.8.8.8",
        },
      ],
      vendorLicenseIds: {
        quarterlink: "hashed-license-reference",
      },
      vendorProductName: "QuarterLink",
      vendorPublicIp: "1.1.1.1",
      vendorVersion: {
        quarterlink: "0.1.0",
      },
    },
  };
}

describe("HMRC fraud-prevention header assembly", () => {
  test("encodes HMRC key-value, screen, and timezone values", () => {
    assert.equal(
      encodeHmrcKeyValue({
        "QuarterLink Web": "0.1.0",
        "license/id": "hash value",
      }),
      "QuarterLink%20Web=0.1.0&license%2Fid=hash%20value",
    );
    assert.equal(
      encodeHmrcScreens([
        {
          width: 1920,
          height: 1080,
          scalingFactor: 1.5,
          colourDepth: 24,
        },
      ]),
      "width=1920&height=1080&scaling-factor=1.5&colour-depth=24",
    );
    assert.equal(timezoneFromOffsetMinutes(-60), "UTC+01:00");
  });

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
    assert.equal(
      result.headers["Gov-Vendor-Forwarded"],
      "by=1.1.1.1&for=8.8.8.8",
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

  test("classifies localhost-limited and manual override values", () => {
    const result = buildWebAppViaServerFraudPreventionHeaders({
      localSandbox: true,
      client: {
        browserJsUserAgent: validFraudInput().client.browserJsUserAgent,
        deviceId: validFraudInput().client.deviceId,
        screens: validFraudInput().client.screens,
        timezone: validFraudInput().client.timezone,
        windowSize: validFraudInput().client.windowSize,
      },
      server: {
        clientPublicIpTimestamp: "2026-05-12T10:00:00.000Z",
        vendorProductName: "QuarterLink",
        vendorVersion: {
          quarterlink: "0.1.0",
        },
      },
    });

    if (result.ok) {
      assert.fail("Expected local incomplete fraud headers to be blocked.");
    }

    assert(
      result.statuses.some(
        (item) =>
          item.headerName === "Gov-Client-Public-IP" &&
          item.status === "unavailable-on-localhost",
      ),
    );
    assert(
      result.statuses.some(
        (item) =>
          item.headerName === "Gov-Client-Multi-Factor" &&
          item.status === "manual-override-required",
      ),
    );
    assert.equal(result.redactedHeaders["Gov-Client-Device-ID"], REDACTED_VALUE);
  });

  test("does not accept documentation IP ranges as public request values", () => {
    const result = assembleFraudPreventionHeaders({
      ...validFraudInput(),
      server: {
        ...validFraudInput().server,
        clientPublicIp: "198.51.100.10",
        vendorPublicIp: "203.0.113.10",
        vendorForwarded: [
          {
            by: "203.0.113.10",
            for: "198.51.100.10",
          },
        ],
      },
    });

    if (result.ok) {
      assert.fail("Expected documentation IP ranges to be blocked.");
    }

    assert.deepEqual(
      result.missing.map((item) => item.headerName).sort(),
      [
        "Gov-Client-Public-IP",
        "Gov-Vendor-Forwarded",
        "Gov-Vendor-Public-IP",
      ],
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
