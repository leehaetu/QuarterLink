"use client";

import { useMemo, useState } from "react";
import { Ql008FraudPreventionCollector } from "./ql008-fraud-prevention-collector";
import type {
  HmrcSandboxOAuthUiState,
  Ql008SandboxDiscoveryResult,
  Ql008FraudCollectorUiState,
} from "@/server/hmrc";

type RouteBStep = {
  id: string;
  label: string;
  title: string;
  summary: string;
  checklist: string[];
  note: string;
};

const routeBSteps: RouteBStep[] = [
  {
    id: "explain",
    label: "Route B",
    title: "Keep your spreadsheet. Add a linked QuarterLink summary sheet.",
    summary:
      "Route B means the user keeps their own spreadsheet records and adds a summary sheet whose cells are linked by formula to those records.",
    checklist: [
      "Keep day-to-day records in the existing spreadsheet.",
      "Add a sheet named QuarterLink Summary.",
      "Use formulas to link each summary total to source record sheets.",
      "Do not copy and paste totals into QuarterLink.",
    ],
    note: "This is a local design preview. No spreadsheet file is uploaded or read.",
  },
  {
    id: "prepare",
    label: "Prepare",
    title: "Prepare the linked summary sheet",
    summary:
      "The summary sheet gives QuarterLink one predictable place to read quarterly update category totals later.",
    checklist: [
      "Set the tax year and update period on the summary sheet.",
      "Use one row per quarterly update category placeholder.",
      "Keep source sheet and cell references visible.",
      "Use one mapping version for the local workflow preview.",
    ],
    note: "Corrections happen in the source spreadsheet, followed by re-import in a later ticket.",
  },
  {
    id: "categories",
    label: "Categories",
    title: "Review self-employment category placeholders",
    summary:
      "The first slice is one individual taxpayer with one self-employment income source and one quarterly update path.",
    checklist: [
      "Use self-employment category placeholders only.",
      "Keep property and multiple-income-source routes deferred.",
      "Show missing categories as placeholders, not editable figures.",
      "Keep the update period separate from the filing deadline.",
    ],
    note: "Category mapping is static here. No HMRC obligation or income-source API is called.",
  },
  {
    id: "read-only",
    label: "Read-only",
    title: "Imported totals are locked in QuarterLink",
    summary:
      "The app design shows monetary values as imported totals that cannot be edited inside QuarterLink.",
    checklist: [
      "Show the category total.",
      "Show the linked source cell.",
      "Show the validation placeholder.",
      "Make correction instructions visible beside the totals.",
    ],
    note: "No accounting or tax figure can be changed in the app shell.",
  },
  {
    id: "evidence",
    label: "Evidence",
    title: "Preview the digital-link evidence bundle",
    summary:
      "The evidence preview shows what would later support sandbox testing: file metadata, mapping version, source references, validation, and user confirmation.",
    checklist: [
      "Capture source file details later without retaining the full file by default.",
      "Retain the mapping version and source cell references.",
      "Link the evidence bundle to the quarterly update period.",
      "Keep local preview evidence separate from future HMRC sandbox evidence.",
    ],
    note: "This preview creates no evidence record and stores nothing.",
  },
  {
    id: "declaration",
    label: "Declaration",
    title: "Declaration placeholder for future quarterly update sending",
    summary:
      "A later ticket must define exact declaration text. This screen only shows the intended position in the workflow.",
    checklist: [
      "Tell the user they are reviewing a quarterly update.",
      "Keep read-only total review separate from any future send action.",
      "Show sandbox OAuth status from the current QL-008 session state.",
      "Disable send and evidence export actions in the local preview.",
    ],
    note: "Quarterly update sending remains disabled in QL-008.",
  },
];

const categoryPlaceholders = [
  {
    code: "SE-TURNOVER",
    label: "Turnover",
    expected: "Required",
    source: "QuarterLink Summary!B8",
  },
  {
    code: "SE-COSTS",
    label: "Cost of goods",
    expected: "Placeholder",
    source: "QuarterLink Summary!B12",
  },
  {
    code: "SE-TRAVEL",
    label: "Travel costs",
    expected: "Placeholder",
    source: "QuarterLink Summary!B18",
  },
  {
    code: "SE-OFFICE",
    label: "Office costs",
    expected: "Placeholder",
    source: "QuarterLink Summary!B22",
  },
] as const;

const importedTotals = [
  {
    category: "Turnover",
    amount: "12,480.00",
    source: "QuarterLink Summary!B8",
    validation: "Numeric total placeholder",
  },
  {
    category: "Cost of goods",
    amount: "2,150.00",
    source: "QuarterLink Summary!B12",
    validation: "Numeric total placeholder",
  },
  {
    category: "Travel costs",
    amount: "380.00",
    source: "QuarterLink Summary!B18",
    validation: "Numeric total placeholder",
  },
  {
    category: "Office costs",
    amount: "215.00",
    source: "QuarterLink Summary!B22",
    validation: "Numeric total placeholder",
  },
] as const;

const evidenceBundle = [
  ["Taxpayer", "Individual taxpayer placeholder"],
  ["Income source", "Self-employment placeholder"],
  ["Update period", "6 April to 5 July"],
  ["Source file", "sole-trader-records.xlsx"],
  ["Source hash", "Local hash placeholder"],
  ["Mapping version", "route-b-self-employment-v0"],
  ["Sheet references", "QuarterLink Summary cells B8, B12, B18, B22"],
  ["Confirmation", "Not captured in local preview"],
] as const;

const boundaryCards = [
  {
    title: "Local/demo only",
    body: "This workflow uses local React state. It does not store data and does not create HMRC sandbox evidence.",
  },
  {
    title: "Sandbox connection only",
    body: "The HMRC connection step can start sandbox OAuth locally. It does not enable production or send quarterly updates.",
  },
  {
    title: "Read-only figures",
    body: "Monetary totals are displayed as locked imported values. Corrections happen in the spreadsheet.",
  },
] as const;

const hmrcRemainingBlockers = [
  "Self-employment business ID still needed.",
  "Tax year still needed.",
  "Period start and end dates still needed.",
  "WEB_APP_VIA_SERVER fraud-prevention inputs still needed.",
  "Test Fraud Prevention Headers validation still needed.",
] as const;

const preflightCommand =
  "set -a; source .env.local; set +a; npm run hmrc:sandbox-evidence:preflight";

interface WorkspaceShellProps {
  readonly hmrcSandboxOAuth: HmrcSandboxOAuthUiState;
  readonly ql008FraudCollector: Ql008FraudCollectorUiState;
  readonly initialStepIndex?: number;
}

type SandboxDiscoveryResponse = Pick<
  Ql008SandboxDiscoveryResult,
  | "ok"
  | "generatedAt"
  | "hmrcNetworkCallsAttempted"
  | "hmrcSubmissionCallsAttempted"
  | "blockers"
  | "items"
> & {
  readonly tokenSource?: string;
};

type Ql008EvidenceStatus = "not_run" | "passed" | "failed" | "unknown";
type Ql008DiscoveryStatus = "not_run" | "discovered" | "failed" | "unknown";
type Ql008SubmissionStatus = "not_attempted";

interface Ql008RealState {
  readonly demoAccessActive: boolean;
  readonly oauthSessionPresent: boolean;
  readonly fraudInputsCollected: boolean;
  readonly fphValidationStatus: Ql008EvidenceStatus;
  readonly businessDetailsStatus: Ql008DiscoveryStatus;
  readonly obligationsStatus: Ql008DiscoveryStatus;
  readonly submissionStatus: Ql008SubmissionStatus;
}

export function WorkspaceShell({
  hmrcSandboxOAuth,
  ql008FraudCollector,
  initialStepIndex = 0,
}: WorkspaceShellProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(() =>
    clampStepIndex(initialStepIndex),
  );
  const [sandboxDiscoveryResult, setSandboxDiscoveryResult] =
    useState<SandboxDiscoveryResponse>();
  const [sandboxDiscoveryError, setSandboxDiscoveryError] = useState<string>();
  const [sandboxDiscoveryRunning, setSandboxDiscoveryRunning] = useState(false);
  const activeStep = routeBSteps[activeStepIndex];
  const stepCount = useMemo(
    () => `${activeStepIndex + 1} of ${routeBSteps.length}`,
    [activeStepIndex],
  );
  const ql008RealState = buildQl008RealState(hmrcSandboxOAuth);

  const goToPrevious = () => {
    setActiveStepIndex((current) => Math.max(0, current - 1));
  };

  const goToNext = () => {
    setActiveStepIndex((current) =>
      Math.min(routeBSteps.length - 1, current + 1),
    );
  };

  const runGuardedSandboxDiscovery = async () => {
    setSandboxDiscoveryRunning(true);
    setSandboxDiscoveryError(undefined);

    try {
      const response = await fetch(hmrcSandboxOAuth.discoveryPath, {
        method: "POST",
      });
      const payload: unknown = await response.json();

      if (!response.ok) {
        setSandboxDiscoveryResult(undefined);
        setSandboxDiscoveryError(readDiscoveryError(payload));
        return;
      }

      setSandboxDiscoveryResult(payload as SandboxDiscoveryResponse);
    } catch {
      setSandboxDiscoveryResult(undefined);
      setSandboxDiscoveryError("Guarded sandbox discovery did not complete.");
    } finally {
      setSandboxDiscoveryRunning(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-slate-950">
      <div className="mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6 lg:border-b-0 lg:border-r">
          <div className="flex flex-wrap items-start justify-between gap-4 lg:block">
            <div>
              <p className="text-xl font-semibold">QuarterLink</p>
              <p className="mt-1 max-w-60 text-sm leading-5 text-slate-600">
                Route B workflow preview for spreadsheet records and quarterly
                updates.
              </p>
            </div>
            <span className="inline-flex rounded-md border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 lg:mt-5">
              Local/demo only
            </span>
          </div>

          <nav className="mt-6" aria-label="Route B workflow stages">
            <ol className="grid gap-2">
              {routeBSteps.map((step, index) => {
                const isActive = index === activeStepIndex;

                return (
                  <li key={step.id}>
                    <button
                      type="button"
                      onClick={() => setActiveStepIndex(index)}
                      aria-current={isActive ? "step" : undefined}
                      className={`w-full rounded-md border px-3 py-3 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 ${
                        isActive
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-teal-700 hover:bg-teal-50"
                      }`}
                    >
                      <span className="block text-xs font-semibold uppercase tracking-normal">
                        Step {index + 1}
                      </span>
                      <span className="mt-1 block font-semibold">
                        {step.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </aside>

        <section className="px-4 py-5 sm:px-6 lg:px-8">
          <header className="border-b border-slate-200 pb-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-4xl">
                <p className="text-sm font-semibold text-teal-800">
                  Route B linked summary sheet
                </p>
                <h1 className="mt-2 max-w-4xl text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
                  Keep spreadsheet records and review linked quarterly totals.
                </h1>
                <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
                  A local workflow design for one individual taxpayer, one
                  self-employment income source, one quarterly update, and a
                  read-only evidence preview.
                </p>
              </div>

              <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950 xl:w-80">
                This page can start sandbox OAuth only. It does not upload
                spreadsheets, parse files, persist data, call HMRC APIs, or send
                quarterly updates.
              </div>
            </div>
          </header>

          <section
            aria-labelledby="boundaries-heading"
            className="mt-6 grid gap-3 md:grid-cols-3"
          >
            <h2 id="boundaries-heading" className="sr-only">
              Route B boundaries
            </h2>
            {boundaryCards.map((card) => (
              <article
                key={card.title}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50"
              >
                <h3 className="font-semibold text-slate-950">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {card.body}
                </p>
              </article>
            ))}
          </section>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-6">
              <section
                aria-labelledby="active-step-title"
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6"
              >
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-teal-800">
                      Route B step {stepCount}
                    </p>
                    <h2
                      id="active-step-title"
                      className="mt-2 text-2xl font-semibold tracking-normal text-slate-950"
                    >
                      {activeStep.title}
                    </h2>
                    <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
                      {activeStep.summary}
                    </p>
                  </div>
                  <span className="inline-flex w-fit rounded-md bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-900">
                    Static workflow
                  </span>
                </div>

                <ul className="mt-5 grid gap-3 md:grid-cols-2">
                  {activeStep.checklist.map((item) => (
                    <li
                      key={item}
                      className="rounded-md border border-slate-200 bg-[#fafbf8] px-3 py-3 text-sm leading-6 text-slate-700"
                    >
                      {item}
                    </li>
                  ))}
                </ul>

                <p className="mt-5 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
                  {activeStep.note}
                </p>

                {activeStep.id === "declaration" ? (
                  <Ql008DeclarationRealStatePanel state={ql008RealState} />
                ) : null}

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={goToPrevious}
                    disabled={activeStepIndex === 0}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                  >
                    Previous step
                  </button>
                  <button
                    type="button"
                    onClick={goToNext}
                    disabled={activeStepIndex === routeBSteps.length - 1}
                    className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Next step
                  </button>
                </div>
              </section>

              <section
                aria-labelledby="categories-heading"
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6"
              >
                <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2
                      id="categories-heading"
                      className="text-xl font-semibold text-slate-950"
                    >
                      Quarterly update category placeholders
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                      These are local placeholders for the self-employment Route
                      B summary. Exact category rules remain for a later
                      implementation ticket.
                    </p>
                  </div>
                  <span className="inline-flex w-fit rounded-md border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                    One self-employment
                  </span>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                    <caption className="sr-only">
                      Route B self-employment category placeholders
                    </caption>
                    <thead>
                      <tr className="text-slate-600">
                        <th scope="col" className="border-b px-3 py-3">
                          Code
                        </th>
                        <th scope="col" className="border-b px-3 py-3">
                          Category
                        </th>
                        <th scope="col" className="border-b px-3 py-3">
                          Requirement
                        </th>
                        <th scope="col" className="border-b px-3 py-3">
                          Linked cell
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryPlaceholders.map((category) => (
                        <tr key={category.code} className="align-top">
                          <td className="border-b border-slate-100 px-3 py-3 font-mono text-xs text-slate-700">
                            {category.code}
                          </td>
                          <th
                            scope="row"
                            className="border-b border-slate-100 px-3 py-3 font-semibold text-slate-950"
                          >
                            {category.label}
                          </th>
                          <td className="border-b border-slate-100 px-3 py-3 text-slate-700">
                            {category.expected}
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3 text-slate-700">
                            {category.source}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section
                aria-labelledby="totals-heading"
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6"
              >
                <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2
                      id="totals-heading"
                      className="text-xl font-semibold text-slate-950"
                    >
                      Read-only imported totals preview
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                      QuarterLink reads linked totals from your spreadsheet. If
                      a figure is wrong, correct it in your spreadsheet and
                      import again.
                    </p>
                  </div>
                  <span className="inline-flex w-fit rounded-md border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                    Figures locked
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {importedTotals.map((total) => (
                    <article
                      key={total.category}
                      className="rounded-md border border-slate-200 bg-[#fafbf8] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-950">
                            {total.category}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {total.source}
                          </p>
                        </div>
                        <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-600">
                          Read-only
                        </span>
                      </div>
                      <p className="mt-4 font-mono text-2xl font-semibold text-slate-950">
                        GBP {total.amount}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {total.validation}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section
                aria-labelledby="ql008-sandbox-flow-heading"
                className="rounded-lg border border-teal-700 bg-white p-5 shadow-sm shadow-slate-200/50"
              >
                <div className="flex flex-col gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-normal text-teal-800">
                      QL-008 sandbox sequence
                    </p>
                    <h2
                      id="ql008-sandbox-flow-heading"
                      className="mt-1 text-base font-semibold text-slate-950"
                    >
                      Railway sandbox flow
                    </h2>
                  </div>
                  <span
                    className={`inline-flex w-fit rounded-md px-3 py-1 text-xs font-semibold ${
                      hmrcSandboxOAuth.sandboxDemoSessionActive
                        ? "bg-teal-100 text-teal-900"
                        : "bg-amber-100 text-amber-950"
                    }`}
                  >
                    {hmrcSandboxOAuth.sandboxDemoSessionActive
                      ? "Demo access active"
                      : "Start at step 1"}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-700">
                  Temporary QL-008 sandbox demo access is allowed only when
                  `APP_ENV` is `local` and `HMRC_ENV` is `sandbox`. It is not
                  real QuarterLink SaaS sign-in and it is disabled outside that
                  environment pair.
                </p>

                <ol className="mt-4 grid gap-3 text-sm">
                  <li className="rounded-md border border-slate-200 bg-[#fafbf8] px-3 py-3">
                    <p className="font-semibold text-slate-950">
                      Step 1: Continue as sandbox demo user
                    </p>
                    <p className="mt-1 leading-6 text-slate-700">
                      {hmrcSandboxOAuth.sandboxDemoSessionActive
                        ? "Temporary QL-008 sandbox demo access is active."
                        : "Required before HMRC sandbox OAuth can start."}
                    </p>
                    {hmrcSandboxOAuth.canUseSandboxDemoSession &&
                    !hmrcSandboxOAuth.sandboxDemoSessionActive ? (
                      <form
                        action={hmrcSandboxOAuth.demoSessionPath}
                        method="post"
                        className="mt-3"
                      >
                        <button
                          type="submit"
                          className="inline-flex w-full items-center justify-center rounded-md border border-amber-700 bg-white px-4 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-700 focus:ring-offset-2"
                        >
                          Continue as sandbox demo user
                        </button>
                      </form>
                    ) : null}
                  </li>
                  <li className="rounded-md border border-slate-200 bg-[#fafbf8] px-3 py-3">
                    <p className="font-semibold text-slate-950">
                      Step 2: Collect fraud-prevention inputs
                    </p>
                    <p className="mt-1 leading-6 text-slate-700">
                      Use the collector below before connecting to HMRC Sandbox.
                      It makes no HMRC API call.
                    </p>
                  </li>
                  <li className="rounded-md border border-slate-200 bg-[#fafbf8] px-3 py-3">
                    <p className="font-semibold text-slate-950">
                      Step 3: Connect to HMRC Sandbox
                    </p>
                    <p className="mt-1 leading-6 text-slate-700">
                      The connect button remains disabled until demo access and
                      sandbox OAuth configuration are present.
                    </p>
                  </li>
                </ol>
              </section>

              <Ql008FraudPreventionCollector
                collector={ql008FraudCollector}
              />

              <section
                aria-labelledby="hmrc-sandbox-heading"
                className="rounded-lg border border-teal-700 bg-white p-5 shadow-sm shadow-slate-200/50"
              >
                <div className="flex flex-col gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-normal text-teal-800">
                      QL-008 sandbox only
                    </p>
                    <h2
                      id="hmrc-sandbox-heading"
                      className="mt-1 text-base font-semibold text-slate-950"
                    >
                      Step 3: HMRC sandbox connection
                    </h2>
                  </div>
                  <span
                    className={`inline-flex w-fit rounded-md px-3 py-1 text-xs font-semibold ${
                      hmrcSandboxOAuth.canStartOAuth
                        ? "bg-teal-100 text-teal-900"
                        : "bg-amber-100 text-amber-950"
                    }`}
                  >
                    {hmrcSandboxOAuth.canStartOAuth
                      ? "OAuth start available"
                      : "Local setup needed"}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-700">
                  This connects to the HMRC sandbox authorisation journey for an
                  individual sandbox test user. It is not production, no HMRC
                  submission has been made, and OAuth gives an access token
                  only.
                </p>

                {hmrcSandboxOAuth.canUseSandboxDemoSession ? (
                  <p
                    className={`mt-3 rounded-md border px-3 py-2 text-sm leading-6 ${
                      hmrcSandboxOAuth.sandboxDemoSessionActive
                        ? "border-teal-200 bg-teal-50 text-teal-950"
                        : "border-amber-300 bg-amber-50 text-amber-950"
                    }`}
                  >
                    {hmrcSandboxOAuth.sandboxDemoSessionActive
                      ? "Temporary QL-008 sandbox demo access is active. This is not real QuarterLink authentication and it creates no user record."
                      : "Complete Step 1 before connecting to HMRC Sandbox."}
                  </p>
                ) : (
                  <p className="mt-3 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
                    Outside the local sandbox demo flow, a real QuarterLink user
                    must be signed in before connecting HMRC.
                  </p>
                )}

                <dl className="mt-4 grid gap-2 text-sm">
                  <div className="rounded-md border border-slate-200 bg-[#fafbf8] px-3 py-2">
                    <dt className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                      Redirect URI
                    </dt>
                    <dd className="mt-1 break-all font-mono text-xs text-slate-800">
                      {hmrcSandboxOAuth.redirectUri}
                    </dd>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-[#fafbf8] px-3 py-2">
                    <dt className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                      Individual test user
                    </dt>
                    <dd className="mt-1 text-sm text-slate-800">
                      User ID 713919258798, NINO NX995584B
                    </dd>
                  </div>
                </dl>

                {hmrcSandboxOAuth.canStartOAuth ? (
                  <a
                    href={hmrcSandboxOAuth.startPath}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2"
                  >
                    Connect to HMRC Sandbox
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="mt-4 w-full cursor-not-allowed rounded-md bg-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
                  >
                    Connect to HMRC Sandbox
                  </button>
                )}

                {!hmrcSandboxOAuth.isLocalOrSandboxMode ? (
                  <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm leading-6 text-rose-900">
                    This button is enabled only when `APP_ENV` is `local` or
                    `sandbox`.
                  </p>
                ) : null}

                {hmrcSandboxOAuth.canUseSandboxDemoSession &&
                !hmrcSandboxOAuth.sandboxDemoSessionActive ? (
                  <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-950">
                    Continue as the sandbox demo user before connecting to HMRC
                    Sandbox.
                  </p>
                ) : null}

                {hmrcSandboxOAuth.missingEnvVars.length > 0 ? (
                  <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-3 text-sm leading-6 text-amber-950">
                    <p className="font-semibold">Missing local env vars</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {hmrcSandboxOAuth.missingEnvVars.map((variable) => (
                        <li key={variable} className="font-mono text-xs">
                          {variable}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {hmrcSandboxOAuth.invalidEnvMessages.length > 0 ? (
                  <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-3 text-sm leading-6 text-amber-950">
                    <p className="font-semibold">Local config to fix</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {hmrcSandboxOAuth.invalidEnvMessages.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-4 rounded-md border border-slate-200 bg-[#fafbf8] px-3 py-3">
                  <h3 className="text-sm font-semibold text-slate-950">
                    After OAuth
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {hmrcSandboxOAuth.sandboxTokenSessionActive
                      ? "HMRC sandbox OAuth connected. No HMRC API evidence calls have been made. No HMRC submission has been made."
                      : "HMRC sandbox OAuth not connected. Connect through the QL-008 sandbox connection panel first."}
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
                    {hmrcRemainingBlockers.map((blocker) => (
                      <li key={blocker}>{blocker}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 rounded-md border border-slate-200 bg-white px-3 py-3">
                  <h3 className="text-sm font-semibold text-slate-950">
                    Guarded sandbox discovery
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    Dry-run remains the default. No HMRC call is made unless
                    `QL_008_DISCOVERY_ALLOW_HMRC_CALLS=true` and the required
                    fraud-prevention inputs are present.
                  </p>
                  <button
                    type="button"
                    onClick={runGuardedSandboxDiscovery}
                    disabled={
                      !hmrcSandboxOAuth.sandboxTokenSessionActive ||
                      sandboxDiscoveryRunning
                    }
                    className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {sandboxDiscoveryRunning
                      ? "Running guarded discovery"
                      : "Run guarded sandbox discovery"}
                  </button>
                  {!hmrcSandboxOAuth.sandboxTokenSessionActive ? (
                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      Complete Step 3 before running guarded sandbox discovery.
                    </p>
                  ) : null}
                  {sandboxDiscoveryError !== undefined ? (
                    <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm leading-6 text-rose-900">
                      {sandboxDiscoveryError}
                    </p>
                  ) : null}
                  {sandboxDiscoveryResult !== undefined ? (
                    <div className="mt-3 rounded-md border border-slate-200 bg-[#fafbf8] px-3 py-3">
                      <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                        Discovery result
                      </p>
                      <dl className="mt-2 grid gap-2 text-xs leading-5 text-slate-700">
                        <div>
                          <dt className="font-semibold">Token source</dt>
                          <dd>{sandboxDiscoveryResult.tokenSource ?? "not returned"}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold">HMRC network calls</dt>
                          <dd>
                            {sandboxDiscoveryResult.hmrcNetworkCallsAttempted
                              ? "attempted"
                              : "not attempted"}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-semibold">HMRC submission calls</dt>
                          <dd>
                            {sandboxDiscoveryResult.hmrcSubmissionCallsAttempted
                              ? "attempted"
                              : "not attempted"}
                          </dd>
                        </div>
                      </dl>
                      {sandboxDiscoveryResult.blockers.length > 0 ? (
                        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-700">
                          {sandboxDiscoveryResult.blockers
                            .slice(0, 4)
                            .map((blocker) => (
                              <li key={blocker}>{blocker}</li>
                            ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 rounded-md border border-slate-200 bg-white px-3 py-3">
                  <h3 className="text-sm font-semibold text-slate-950">
                    Local preflight command
                  </h3>
                  <p className="mt-2 break-all font-mono text-xs leading-5 text-slate-700">
                    {preflightCommand}
                  </p>
                </div>
              </section>

              <section
                aria-labelledby="evidence-heading"
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50"
              >
                <h2
                  id="evidence-heading"
                  className="text-base font-semibold text-slate-950"
                >
                  Evidence bundle preview
                </h2>
                <dl className="mt-4 space-y-3">
                  {evidenceBundle.map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-md border border-slate-200 bg-[#fafbf8] px-3 py-3"
                    >
                      <dt className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                        {label}
                      </dt>
                      <dd className="mt-1 text-sm leading-6 text-slate-800">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section
                aria-labelledby="digital-link-heading"
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50"
              >
                <h2
                  id="digital-link-heading"
                  className="text-base font-semibold text-slate-950"
                >
                  Digital-link boundary
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  The intended path is source records to linked summary cells to
                  QuarterLink. Manual changes to imported monetary totals are
                  not part of the workflow.
                </p>
              </section>

              <section
                aria-labelledby="deferred-actions-heading"
                className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-amber-950"
              >
                <h2
                  id="deferred-actions-heading"
                  className="text-base font-semibold"
                >
                  Deferred outside QL-008
                </h2>
                <p className="mt-3 text-sm leading-6">
                  Spreadsheet import, parsing, quarterly update calls, final
                  declaration, billing, and practice workflows are not part of
                  this step.
                </p>
                <button
                  type="button"
                  disabled
                  className="mt-4 w-full cursor-not-allowed rounded-md bg-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Spreadsheet import not available
                </button>
              </section>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function clampStepIndex(index: number): number {
  if (!Number.isInteger(index)) {
    return 0;
  }

  return Math.min(Math.max(index, 0), routeBSteps.length - 1);
}

function buildQl008RealState(
  hmrcSandboxOAuth: HmrcSandboxOAuthUiState,
): Ql008RealState {
  return {
    demoAccessActive: hmrcSandboxOAuth.sandboxDemoSessionActive,
    oauthSessionPresent: hmrcSandboxOAuth.sandboxTokenSessionActive,
    fraudInputsCollected: false,
    fphValidationStatus: "not_run",
    businessDetailsStatus: "not_run",
    obligationsStatus: "not_run",
    submissionStatus: "not_attempted",
  };
}

function Ql008DeclarationRealStatePanel({
  state,
}: {
  readonly state: Ql008RealState;
}) {
  return (
    <section
      aria-labelledby="ql008-real-state-heading"
      className="mt-5 rounded-md border border-slate-200 bg-[#fafbf8] px-4 py-4"
    >
      <h3
        id="ql008-real-state-heading"
        className="text-sm font-semibold text-slate-950"
      >
        QL-008 real state
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        {state.oauthSessionPresent
          ? "HMRC sandbox OAuth connected. No HMRC API evidence calls or submissions have been made yet."
          : "HMRC sandbox OAuth not connected. Connect through the QL-008 sandbox connection panel first."}
      </p>
      <dl className="mt-3 grid gap-2 text-sm leading-6 text-slate-700">
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
          <dt className="font-semibold text-slate-950">Demo access</dt>
          <dd>
            {state.demoAccessActive
              ? "Demo access active"
              : "Demo access not active"}
          </dd>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
          <dt className="font-semibold text-slate-950">
            HMRC sandbox OAuth
          </dt>
          <dd>
            {state.oauthSessionPresent
              ? "HMRC sandbox OAuth connected"
              : "HMRC sandbox OAuth not connected"}
          </dd>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
          <dt className="font-semibold text-slate-950">
            HMRC API evidence calls
          </dt>
          <dd>No HMRC API evidence calls have been made</dd>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
          <dt className="font-semibold text-slate-950">
            Fraud-prevention inputs
          </dt>
          <dd>{formatFraudInputStatus(state.fraudInputsCollected)}</dd>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
          <dt className="font-semibold text-slate-950">
            Test Fraud Prevention Headers
          </dt>
          <dd>{formatFphStatus(state.fphValidationStatus)}</dd>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
          <dt className="font-semibold text-slate-950">
            Business Details and Obligations
          </dt>
          <dd>
            {formatBusinessAndObligationsStatus(
              state.businessDetailsStatus,
              state.obligationsStatus,
            )}
          </dd>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
          <dt className="font-semibold text-slate-950">Submission</dt>
          <dd>{formatSubmissionStatus(state.submissionStatus)}</dd>
        </div>
      </dl>
      <button
        type="button"
        disabled
        className="mt-4 w-full cursor-not-allowed rounded-md bg-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
      >
        Quarterly update sending remains disabled
      </button>
    </section>
  );
}

function formatFraudInputStatus(collected: boolean): string {
  return collected
    ? "Fraud-prevention inputs collected"
    : "Fraud-prevention inputs not yet verified on this screen";
}

function formatFphStatus(status: Ql008EvidenceStatus): string {
  if (status === "passed") {
    return "Fraud-prevention validation passed";
  }

  if (status === "failed") {
    return "Fraud-prevention validation failed";
  }

  if (status === "unknown") {
    return "Fraud-prevention validation status unknown";
  }

  return "Fraud-prevention validation still required";
}

function formatBusinessAndObligationsStatus(
  businessDetailsStatus: Ql008DiscoveryStatus,
  obligationsStatus: Ql008DiscoveryStatus,
): string {
  if (
    businessDetailsStatus === "discovered" &&
    obligationsStatus === "discovered"
  ) {
    return "Business Details and Obligations discovered";
  }

  if (businessDetailsStatus === "failed" || obligationsStatus === "failed") {
    return "Business Details or Obligations discovery failed";
  }

  if (businessDetailsStatus === "unknown" || obligationsStatus === "unknown") {
    return "Business Details and Obligations discovery status unknown";
  }

  return "Business Details and Obligations discovery still required";
}

function formatSubmissionStatus(status: Ql008SubmissionStatus): string {
  if (status === "not_attempted") {
    return "No HMRC submission has been made";
  }

  return "No HMRC submission has been made";
}

function readDiscoveryError(payload: unknown): string {
  if (
    payload !== null &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    typeof (payload as { readonly detail?: unknown }).detail === "string"
  ) {
    return (payload as { readonly detail: string }).detail;
  }

  return "Guarded sandbox discovery was not available.";
}
