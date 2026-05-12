import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  assertSandboxEvidenceOutputPath,
  classifyHmrcEvidence,
  redactEvidenceValue,
  REDACTED_VALUE,
} from "../../../src/server/hmrc";

describe("HMRC QL-008 evidence safety", () => {
  test("classifies sandbox evidence only when it came from an actual HMRC response", () => {
    assert.equal(
      classifyHmrcEvidence({
        environment: "sandbox",
        cameFromActualHmrcResponse: true,
      }),
      "hmrc-sandbox",
    );
    assert.equal(
      classifyHmrcEvidence({
        environment: "sandbox",
        cameFromActualHmrcResponse: false,
      }),
      "local/demo",
    );
  });

  test("rejects production-labelled evidence output paths", () => {
    assert.doesNotThrow(() =>
      assertSandboxEvidenceOutputPath(".agent/evidence/hmrc-sandbox/QL-008/"),
    );
    assert.throws(() =>
      assertSandboxEvidenceOutputPath(".agent/evidence/production/QL-008/"),
    );
  });

  test("redacts tokens, secrets, and fraud metadata from evidence records", () => {
    const redacted = redactEvidenceValue({
      Authorization: "Bearer access-token-that-must-not-leak",
      client_secret: "secret-value",
      headers: {
        "Gov-Client-Device-ID": "beec798b-b366-47fa-b1f8-92cede14a1ce",
      },
      status: "blocked",
    });

    const serialised = JSON.stringify(redacted);

    assert(!serialised.includes("access-token-that-must-not-leak"));
    assert(!serialised.includes("secret-value"));
    assert(!serialised.includes("beec798b-b366"));
    assert(serialised.includes(REDACTED_VALUE));
  });
});
