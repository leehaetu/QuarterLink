import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  HMRC_SANDBOX_API_BASE_URL,
  HMRC_SANDBOX_AUTH_BASE_URL,
  HmrcConfigError,
  loadHmrcSandboxConfig,
  validateHmrcSandboxConfig,
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
};

describe("HMRC sandbox config validation", () => {
  test("accepts a complete sandbox config and normalises base URLs", () => {
    const result = validateHmrcSandboxConfig(validEnv);

    if (!result.ok) {
      assert.fail("Expected sandbox config to validate.");
    }

    assert.equal(result.config.apiBaseUrl, HMRC_SANDBOX_API_BASE_URL);
    assert.equal(result.config.authBaseUrl, HMRC_SANDBOX_AUTH_BASE_URL);
    assert.deepEqual(result.config.scopes, [
      "read:self-assessment",
      "write:self-assessment",
    ]);
  });

  test("fails closed when required sandbox settings are missing", () => {
    const result = validateHmrcSandboxConfig({
      APP_ENV: "local",
      HMRC_ENV: "sandbox",
    });

    if (result.ok) {
      assert.fail("Expected sandbox config to fail validation.");
    }

    assert(
      result.issues.some(
        (issue) => issue.variable === "HMRC_SANDBOX_CLIENT_SECRET",
      ),
    );
  });

  test("rejects malformed or non-sandbox base URLs", () => {
    const result = validateHmrcSandboxConfig({
      ...validEnv,
      HMRC_SANDBOX_API_BASE_URL: "https://api.service.hmrc.gov.uk",
      HMRC_SANDBOX_AUTH_BASE_URL: "not a url",
    });

    if (result.ok) {
      assert.fail("Expected sandbox config to fail validation.");
    }

    assert(
      result.issues.some(
        (issue) => issue.variable === "HMRC_SANDBOX_API_BASE_URL",
      ),
    );
    assert(
      result.issues.some(
        (issue) => issue.variable === "HMRC_SANDBOX_AUTH_BASE_URL",
      ),
    );
  });

  test("rejects production HMRC config during QL-007", () => {
    const result = validateHmrcSandboxConfig({
      ...validEnv,
      HMRC_PRODUCTION_CLIENT_SECRET: "production-secret",
    });

    if (result.ok) {
      assert.fail("Expected sandbox config to fail validation.");
    }

    assert(
      result.issues.some(
        (issue) => issue.code === "mixed-production-config",
      ),
    );
  });

  test("throws errors without exposing secret values", () => {
    assert.throws(
      () =>
        loadHmrcSandboxConfig({
          ...validEnv,
          HMRC_ENV: "production",
          HMRC_SANDBOX_CLIENT_SECRET: "do-not-leak-this-secret",
        }),
      (error) => {
        assert(error instanceof HmrcConfigError);
        assert(!error.message.includes("do-not-leak-this-secret"));
        return true;
      },
    );
  });
});
