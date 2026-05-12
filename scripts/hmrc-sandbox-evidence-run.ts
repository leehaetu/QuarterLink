import { runQl008Preflight } from "../src/server/hmrc/preflight";
import { redactEvidenceValue } from "../src/server/hmrc/evidence";

const startedAt = Date.now();

console.error(
  "[QL-008 preflight] command started; output is redacted and no HMRC API calls will be made",
);

const preflight = runQl008Preflight({
  progressLogger: (message) => {
    console.error(message);
  },
});

console.log(
  JSON.stringify(
    redactEvidenceValue({
      ticket: "QL-008",
      mode: "preflight",
      ok: preflight.ok,
      generatedAt: preflight.generatedAt,
      evidenceClassification: preflight.evidenceClassification,
      sandboxCallsAllowed: preflight.sandboxCallsAllowed,
      hmrcNetworkCallsAttempted: preflight.hmrcNetworkCallsAttempted,
      blockers: preflight.blockers,
      items: preflight.items,
    }),
    null,
    2,
  ),
);

console.error(`[QL-008 preflight] command finished in ${Date.now() - startedAt}ms`);

if (!preflight.ok) {
  process.exitCode = 2;
}
