import { runQl008Preflight } from "../src/server/hmrc/preflight";
import { redactEvidenceValue } from "../src/server/hmrc/evidence";

const preflight = runQl008Preflight();

console.log(
  JSON.stringify(
    redactEvidenceValue({
      ticket: "QL-008",
      mode: "preflight",
      ok: preflight.ok,
      generatedAt: preflight.generatedAt,
      evidenceClassification: preflight.evidenceClassification,
      sandboxCallsAllowed: preflight.sandboxCallsAllowed,
      blockers: preflight.blockers,
      items: preflight.items,
    }),
    null,
    2,
  ),
);

if (!preflight.ok) {
  process.exitCode = 2;
}
