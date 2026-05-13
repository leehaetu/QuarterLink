import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  collectQl008FraudPreventionInputs,
  getQl008FraudCollectorUiState,
  resolveQl008DeviceIdCookie,
  signQl008DeviceIdCookieForTest,
  type Ql008BrowserFraudInputPayload,
  type Ql008FraudInputCollectionResult,
  type Ql008FraudVariableName,
} from "../../../src/server/hmrc";

const deviceId = "beec798b-b366-47fa-b1f8-92cede14a1ce";
const regeneratedDeviceId = "a72ac00d-2db1-4b25-842e-c68472cf601d";
const cookieSecret = "ql-008-local-cookie-secret";
const localSandboxEnv = {
  APP_ENV: "local",
  HMRC_ENV: "sandbox",
  QL_008_DEVICE_COOKIE_SECRET: cookieSecret,
  npm_package_version: "0.1.0",
};
const browserPayload: Ql008BrowserFraudInputPayload = {
  browserJsUserAgent: "Mozilla/5.0 QuarterLinkLocal",
  screenWidth: 1920,
  screenHeight: 1080,
  screenScalingFactor: 2,
  screenColourDepth: 24,
  timezone: "UTC+01:00",
  windowWidth: 1440,
  windowHeight: 900,
};

describe("QL-008 fraud-prevention input collector", () => {
  test("is visible only for local sandbox mode", () => {
    assert.equal(
      getQl008FraudCollectorUiState({
        APP_ENV: "local",
        HMRC_ENV: "sandbox",
      }).enabled,
      true,
    );
    assert.equal(
      getQl008FraudCollectorUiState({
        APP_ENV: "sandbox",
        HMRC_ENV: "sandbox",
      }).enabled,
      false,
    );
    assert.equal(
      getQl008FraudCollectorUiState({
        APP_ENV: "local",
        HMRC_ENV: "production",
      }).enabled,
      false,
    );
  });

  test("generates a server device ID when no cookie exists", () => {
    const result = resolveQl008DeviceIdCookie({
      env: localSandboxEnv,
      randomUuid: () => deviceId,
    });

    assert.equal(result.ok, true);

    if (!result.ok) {
      assert.fail("Expected device ID cookie resolution to succeed.");
    }

    assert.equal(result.deviceId, deviceId);
    assert.equal(result.shouldSetCookie, true);
    assert.match(result.signedCookieValue, /^v1\./);
  });

  test("reuses a valid signed device ID cookie", () => {
    const signedCookieValue = signQl008DeviceIdCookieForTest({
      deviceId,
      secret: cookieSecret,
    });
    const result = resolveQl008DeviceIdCookie({
      cookieValue: signedCookieValue,
      env: localSandboxEnv,
      randomUuid: () => regeneratedDeviceId,
    });

    assert.equal(result.ok, true);

    if (!result.ok) {
      assert.fail("Expected device ID cookie resolution to succeed.");
    }

    assert.equal(result.deviceId, deviceId);
    assert.equal(result.signedCookieValue, signedCookieValue);
    assert.equal(result.shouldSetCookie, false);
  });

  test("rejects a tampered signed device ID cookie and regenerates it", () => {
    const signedCookieValue = signQl008DeviceIdCookieForTest({
      deviceId,
      secret: cookieSecret,
    });
    const result = resolveQl008DeviceIdCookie({
      cookieValue: signedCookieValue.replace(deviceId, regeneratedDeviceId),
      env: localSandboxEnv,
      randomUuid: () => regeneratedDeviceId,
    });

    assert.equal(result.ok, true);

    if (!result.ok) {
      assert.fail("Expected device ID cookie resolution to succeed.");
    }

    assert.equal(result.deviceId, regeneratedDeviceId);
    assert.notEqual(result.signedCookieValue, signedCookieValue);
    assert.equal(result.shouldSetCookie, true);
  });

  test("refuses the local device ID collector outside local sandbox mode", () => {
    assert.deepEqual(
      resolveQl008DeviceIdCookie({
        env: {
          APP_ENV: "production",
          HMRC_ENV: "sandbox",
          QL_008_DEVICE_COOKIE_SECRET: cookieSecret,
        },
      }),
      { ok: false, reason: "collector-disabled" },
    );
    assert.deepEqual(
      resolveQl008DeviceIdCookie({
        env: {
          APP_ENV: "local",
          HMRC_ENV: "production",
          QL_008_DEVICE_COOKIE_SECRET: cookieSecret,
        },
      }),
      { ok: false, reason: "collector-disabled" },
    );
  });

  test("collects browser values and leaves localhost-only network values missing", () => {
    const result = collectQl008FraudPreventionInputs({
      browser: browserPayload,
      deviceId,
      headers: {
        "x-forwarded-for": "127.0.0.1, 10.0.0.5",
        "x-forwarded-client-port": "443",
        "x-quarterlink-vendor-public-ip": "192.168.0.2",
      },
      env: localSandboxEnv,
      now: () => new Date("2026-05-13T09:30:00.000Z"),
    });

    assert.equal(result.hmrcApiCallsAttempted, false);
    assert.equal(result.hmrcSubmissionCallsAttempted, false);
    assert.equal(
      readVariable(result, "QL_008_FRAUD_BROWSER_JS_USER_AGENT").status,
      "collected",
    );
    assert.equal(
      readVariable(result, "QL_008_FRAUD_DEVICE_ID").status,
      "collected",
    );
    assert.equal(
      readVariable(result, "QL_008_FRAUD_CLIENT_PUBLIC_IP_TIMESTAMP").value,
      "2026-05-13T09:30:00.000Z",
    );
    assert.equal(
      readVariable(result, "QL_008_FRAUD_CLIENT_PUBLIC_IP").status,
      "unavailable-on-localhost",
    );
    assert.equal(
      readVariable(result, "QL_008_FRAUD_CLIENT_PUBLIC_PORT").status,
      "unavailable-on-localhost",
    );
    assert.equal(
      readVariable(result, "QL_008_FRAUD_VENDOR_PUBLIC_IP").status,
      "unavailable-on-localhost",
    );
    assert(result.envSnippet.includes("QL_008_FRAUD_BROWSER_JS_USER_AGENT="));
    assert(result.envSnippet.includes("# TODO QL_008_FRAUD_CLIENT_PUBLIC_IP:"));
  });

  test("derives public request values from trusted headers when available", () => {
    const result = collectQl008FraudPreventionInputs({
      browser: browserPayload,
      deviceId,
      headers: {
        "x-forwarded-for": "8.8.8.8, 10.0.0.5",
        "x-forwarded-client-port": "52345",
        "x-quarterlink-vendor-public-ip": "1.1.1.1",
      },
      env: localSandboxEnv,
      now: () => new Date("2026-05-13T09:30:00.000Z"),
    });

    assert.equal(
      readVariable(result, "QL_008_FRAUD_CLIENT_PUBLIC_IP").value,
      "8.8.8.8",
    );
    assert.equal(
      readVariable(result, "QL_008_FRAUD_CLIENT_PUBLIC_PORT").value,
      "52345",
    );
    assert.equal(
      readVariable(result, "QL_008_FRAUD_VENDOR_FORWARDED_BY").value,
      "1.1.1.1",
    );
    assert.equal(
      readVariable(result, "QL_008_FRAUD_VENDOR_FORWARDED_FOR").value,
      "8.8.8.8",
    );
    assert.equal(
      readVariable(result, "QL_008_FRAUD_VENDOR_PUBLIC_IP").value,
      "1.1.1.1",
    );
  });

  test("does not treat documentation IP ranges as collected public values", () => {
    const result = collectQl008FraudPreventionInputs({
      browser: browserPayload,
      deviceId,
      headers: {
        "x-forwarded-for": "198.51.100.10, 203.0.113.10",
        "x-quarterlink-vendor-public-ip": "203.0.113.10",
      },
      env: localSandboxEnv,
      now: () => new Date("2026-05-13T09:30:00.000Z"),
    });

    assert.equal(
      readVariable(result, "QL_008_FRAUD_CLIENT_PUBLIC_IP").status,
      "unavailable-on-localhost",
    );
    assert.equal(
      readVariable(result, "QL_008_FRAUD_VENDOR_PUBLIC_IP").status,
      "unavailable-on-localhost",
    );
  });

  test("ignores a browser-supplied device ID payload value", () => {
    const browserDeviceId = "d20ae56f-95bd-4de2-859a-6b3f05650af6";
    const result = collectQl008FraudPreventionInputs({
      browser: {
        ...browserPayload,
        deviceId: browserDeviceId,
      },
      deviceId,
      headers: {},
      env: localSandboxEnv,
      now: () => new Date("2026-05-13T09:30:00.000Z"),
    });

    assert.equal(
      readVariable(result, "QL_008_FRAUD_DEVICE_ID").value,
      deviceId,
    );
    assert(!result.envSnippet.includes(browserDeviceId));
  });
});

function readVariable(
  result: Ql008FraudInputCollectionResult,
  name: Ql008FraudVariableName,
) {
  const variable = result.variables.find((item) => item.name === name);

  if (variable === undefined) {
    assert.fail(`Expected ${name} to be present.`);
  }

  return variable;
}
