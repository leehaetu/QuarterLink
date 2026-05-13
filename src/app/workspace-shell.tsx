"use client";

import { useMemo, useState } from "react";
import { Ql008FraudPreventionCollector } from "./ql008-fraud-prevention-collector";
import type {
  HmrcSandboxOAuthUiState,
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
    title: "Declaration placeholder before sending a quarterly update",
    summary:
      "A later ticket must define exact declaration text. This screen only shows the intended position in the workflow.",
    checklist: [
      "Tell the user they are reviewing a quarterly update.",
      "Require read-only total review before a future send action.",
      "Show that HMRC connection is still missing.",
      "Disable send and evidence export actions in the local preview.",
    ],
    note: "QuarterLink is not connected to HMRC and cannot send anything from this screen.",
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
  "Access token must be kept local only.",
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
}

export function WorkspaceShell({
  hmrcSandboxOAuth,
  ql008FraudCollector,
}: WorkspaceShellProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const activeStep = routeBSteps[activeStepIndex];
  const stepCount = useMemo(
    () => `${activeStepIndex + 1} of ${routeBSteps.length}`,
    [activeStepIndex],
  );

  const goToPrevious = () => {
    setActiveStepIndex((current) => Math.max(0, current - 1));
  };

  const goToNext = () => {
    setActiveStepIndex((current) =>
      Math.min(routeBSteps.length - 1, current + 1),
    );
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
                      HMRC sandbox connection
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
                      ? "Ready to start OAuth"
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
                  hmrcSandboxOAuth.sandboxDemoSessionActive ? (
                    <p className="mt-3 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm leading-6 text-teal-950">
                      Local sandbox demo user active. This is not real
                      QuarterLink authentication and it creates no user record.
                    </p>
                  ) : (
                    <form
                      action={hmrcSandboxOAuth.demoSessionPath}
                      method="post"
                      className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-3"
                    >
                      <p className="text-sm leading-6 text-amber-950">
                        Full SaaS sign-in is not built yet. Continue with a
                        temporary local sandbox demo user before starting HMRC
                        sandbox OAuth.
                      </p>
                      <button
                        type="submit"
                        className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-amber-700 bg-white px-4 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-700 focus:ring-offset-2"
                      >
                        Continue as sandbox demo user
                      </button>
                    </form>
                  )
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
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
                    {hmrcRemainingBlockers.map((blocker) => (
                      <li key={blocker}>{blocker}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 rounded-md border border-slate-200 bg-white px-3 py-3">
                  <h3 className="text-sm font-semibold text-slate-950">
                    Next command
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
