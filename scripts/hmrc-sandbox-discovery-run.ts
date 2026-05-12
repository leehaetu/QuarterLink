import { runQl008SandboxDiscovery } from "../src/server/hmrc/sandbox-discovery";
import { redactEvidenceValue } from "../src/server/hmrc/evidence";

main().catch((error: unknown) => {
  console.error("[QL-008 sandbox discovery] command failed safely");
  console.error(error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
});

async function main(): Promise<void> {
  const startedAt = Date.now();

  console.error(
    "[QL-008 sandbox discovery] command started; output is redacted and no HMRC submission call will be made",
  );

  const result = await runQl008SandboxDiscovery();

  console.log(
    JSON.stringify(
      redactEvidenceValue({
        ticket: "QL-008",
        mode: "sandbox-discovery",
        ok: result.ok,
        generatedAt: result.generatedAt,
        hmrcNetworkCallsAttempted: result.hmrcNetworkCallsAttempted,
        hmrcSubmissionCallsAttempted: result.hmrcSubmissionCallsAttempted,
        blockers: result.blockers,
        missingFraudPreventionInputs: result.missingFraudPreventionInputs,
        items: result.items,
        fphApplicationAuth: result.fphApplicationToken,
        testFraudPreventionHeaders: result.testFraudPreventionHeaders,
        businessDetails: result.businessDetails,
        obligations: result.obligations,
      }),
      null,
      2,
    ),
  );

  console.error(
    `[QL-008 sandbox discovery] command finished in ${Date.now() - startedAt}ms`,
  );

  if (!result.ok) {
    process.exitCode = 2;
  }
}
