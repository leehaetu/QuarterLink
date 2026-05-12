import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  redactHeaders,
  redactSecret,
  redactSensitiveRecord,
  REDACTED_VALUE,
} from "../../../src/server/hmrc";

describe("HMRC redaction helpers", () => {
  test("redacts bearer tokens and raw fraud-prevention headers", () => {
    const redactedHeaders = redactHeaders({
      Authorization: "Bearer access-token-that-must-not-leak",
      Accept: "application/json",
      "Gov-Client-Connection-Method": "WEB_APP_VIA_SERVER",
      "Gov-Client-Device-ID": "beec798b-b366-47fa-b1f8-92cede14a1ce",
    });

    assert.equal(redactedHeaders.Authorization, `Bearer ${REDACTED_VALUE}`);
    assert.equal(redactedHeaders.Accept, "application/json");
    assert.equal(
      redactedHeaders["Gov-Client-Connection-Method"],
      "WEB_APP_VIA_SERVER",
    );
    assert.equal(redactedHeaders["Gov-Client-Device-ID"], REDACTED_VALUE);
  });

  test("redacts sensitive record fields without dropping safe fields", () => {
    const redacted = redactSensitiveRecord({
      client_id: "safe-client-id-label",
      client_secret: "secret-value",
      refresh_token: "refresh-token-value",
      status: "configured",
      enabled: true,
    });

    assert.equal(redacted.client_id, "safe-client-id-label");
    assert.equal(redacted.client_secret, REDACTED_VALUE);
    assert.equal(redacted.refresh_token, REDACTED_VALUE);
    assert.equal(redacted.status, "configured");
    assert.equal(redacted.enabled, true);
  });

  test("partially redacts standalone secret values", () => {
    const redacted = redactSecret("sandbox-client-secret");

    assert(redacted.startsWith("sa..."));
    assert(redacted.endsWith(`et (${REDACTED_VALUE})`));
    assert(!redacted.includes("sandbox-client-secret"));
  });
});
