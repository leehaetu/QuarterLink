"use client";

import { useMemo, useState } from "react";

type WorkflowStage = {
  id: string;
  label: string;
  shortLabel: string;
  status: "Current" | "Ready" | "Blocked" | "Preview";
  title: string;
  description: string;
  actions: string[];
  evidence: string[];
  boundary: string;
};

const workflowStages: WorkflowStage[] = [
  {
    id: "overview",
    label: "Workspace overview",
    shortLabel: "Overview",
    status: "Current",
    title: "Local workspace for the first sandbox-readiness slice",
    description:
      "This preview follows one individual taxpayer with one self-employment income source. It is a local workflow shell only.",
    actions: [
      "Review the guided path from spreadsheet records to a quarterly update placeholder.",
      "Confirm the first route stays focused on Route B linked summary sheets.",
      "Keep every imported monetary figure read-only inside QuarterLink.",
    ],
    evidence: [
      "Workflow stage checklist",
      "Local preview status",
      "No HMRC connection state",
    ],
    boundary:
      "No authentication, database storage, spreadsheet parsing, HMRC calls, or sandbox evidence exists in this preview.",
  },
  {
    id: "readiness",
    label: "Check Making Tax Digital readiness",
    shortLabel: "Readiness",
    status: "Blocked",
    title: "HMRC connection placeholder",
    description:
      "QuarterLink is not connected to HMRC yet. A later ticket must design OAuth, fraud prevention headers, audit events, and secret handling before sandbox API work starts.",
    actions: [
      "Show the user that Making Tax Digital for Income Tax setup is a later gated step.",
      "Keep Developer Hub and sandbox credential tasks out of this UI ticket.",
      "Prevent any production access, approval, or recognition wording.",
    ],
    evidence: [
      "Connection state: not connected",
      "Sandbox status: no sandbox calls",
      "Production status: not available",
    ],
    boundary:
      "The connect action is intentionally disabled. It does not start OAuth and does not call HMRC.",
  },
  {
    id: "income-source",
    label: "Choose income source",
    shortLabel: "Income",
    status: "Ready",
    title: "Self-employment first",
    description:
      "The first vertical slice supports one self-employment income source. Property, multiple self-employments, and agent workflows stay deferred.",
    actions: [
      "Keep the selected income source fixed to self-employment.",
      "Show one standard update period for the local preview.",
      "Avoid end-of-year workflow prompts.",
    ],
    evidence: [
      "Income source type: self-employment",
      "Tax regime: UK Making Tax Digital for Income Tax",
      "Update period path: one quarterly update",
    ],
    boundary:
      "Income source discovery from HMRC Business Details is not implemented in QL-004.",
  },
  {
    id: "spreadsheet",
    label: "Spreadsheet workflow",
    shortLabel: "Spreadsheet",
    status: "Ready",
    title: "Route B linked summary sheet",
    description:
      "The user keeps their existing spreadsheet and adds a QuarterLink summary sheet linked by formulas to their spreadsheet records.",
    actions: [
      "Use Route B as the recommended route for existing spreadsheet users.",
      "Explain that linked cells preserve the digital path.",
      "Direct corrections back to the source spreadsheet, then re-import.",
    ],
    evidence: [
      "Source filename placeholder",
      "Summary sheet name placeholder",
      "Mapping version placeholder",
    ],
    boundary:
      "No file upload, spreadsheet parsing, cell reading, or import worker exists in this ticket.",
  },
  {
    id: "review",
    label: "Review imported totals",
    shortLabel: "Review",
    status: "Preview",
    title: "Read-only imported totals placeholder",
    description:
      "Preview totals are displayed as locked rows. They are not parsed from a spreadsheet and they cannot be edited inside QuarterLink.",
    actions: [
      "Review category totals as read-only values.",
      "Check source cell references as placeholder evidence.",
      "Correct any figure in the source spreadsheet, then import again in a later ticket.",
    ],
    evidence: [
      "Local source hash placeholder",
      "Sheet and cell reference placeholders",
      "Validation status placeholders",
    ],
    boundary:
      "The values shown are local demo data only and are not HMRC sandbox evidence.",
  },
  {
    id: "declaration",
    label: "Declaration and evidence",
    shortLabel: "Evidence",
    status: "Blocked",
    title: "Declaration and evidence placeholder",
    description:
      "A later ticket must define the exact declaration wording and evidence pack. This screen shows the shape without creating a submission record.",
    actions: [
      "State that quarterly updates are not tax returns.",
      "Show which evidence fields will be needed before sandbox testing.",
      "Keep support and audit expectations visible without implementing storage.",
    ],
    evidence: [
      "Declaration text placeholder",
      "User confirmation timestamp placeholder",
      "Evidence pack placeholder",
    ],
    boundary:
      "No declaration is captured, no audit event is written, and no evidence pack is generated.",
  },
  {
    id: "submission",
    label: "Quarterly update placeholder",
    shortLabel: "Update",
    status: "Blocked",
    title: "Sending is disabled",
    description:
      "This stage shows where a user would later send a quarterly update after HMRC OAuth, obligations, fraud prevention headers, and evidence capture are implemented.",
    actions: [
      "Keep the send action disabled in the local preview.",
      "Show the missing preconditions before HMRC sandbox testing.",
      "Avoid any claim that QuarterLink can send updates today.",
    ],
    evidence: [
      "HMRC authorisation: missing",
      "Fraud prevention header evidence: missing",
      "Open obligation check: not implemented",
    ],
    boundary:
      "No submission payload is built and no quarterly update is sent.",
  },
  {
    id: "confirmation",
    label: "Confirmation placeholder",
    shortLabel: "Confirm",
    status: "Blocked",
    title: "Confirmation and evidence placeholder",
    description:
      "A future sandbox run will record request, response, payload hash, endpoint version, and status. QL-004 only previews that destination.",
    actions: [
      "Show where confirmation details will appear after real sandbox API calls.",
      "Keep local mock information separate from HMRC sandbox evidence.",
      "Point the next implementation work toward Route B evidence design.",
    ],
    evidence: [
      "HMRC response: not available",
      "Submission attempt ID: not created",
      "Evidence export: not available",
    ],
    boundary:
      "No confirmation exists because no HMRC sandbox or production call has occurred.",
  },
];

const previewTotals = [
  {
    category: "Turnover",
    value: "12,480.00",
    source: "QL Summary!B8",
    status: "Linked total placeholder",
  },
  {
    category: "Cost of goods",
    value: "2,150.00",
    source: "QL Summary!B12",
    status: "Linked total placeholder",
  },
  {
    category: "Travel costs",
    value: "380.00",
    source: "QL Summary!B18",
    status: "Linked total placeholder",
  },
  {
    category: "Office costs",
    value: "215.00",
    source: "QL Summary!B22",
    status: "Linked total placeholder",
  },
] as const;

const readinessCards = [
  {
    label: "HMRC connection",
    value: "Not connected",
    detail: "OAuth and API calls are deliberately absent.",
  },
  {
    label: "Workflow data",
    value: "Local only",
    detail: "State resets on refresh and is not persisted.",
  },
  {
    label: "Spreadsheet import",
    value: "Placeholder",
    detail: "No spreadsheet file is read or parsed.",
  },
  {
    label: "Evidence status",
    value: "Preview only",
    detail: "No HMRC sandbox evidence is created.",
  },
] as const;

const deferredItems = [
  "HMRC OAuth and API calls",
  "Authentication and tenant storage",
  "Spreadsheet parsing",
  "Real quarterly update sending",
  "End-of-year workflows",
] as const;

export function WorkspaceShell() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStage = workflowStages[activeIndex];
  const completionLabel = useMemo(
    () => `${activeIndex + 1} of ${workflowStages.length}`,
    [activeIndex],
  );

  const goToPrevious = () => {
    setActiveIndex((current) => Math.max(0, current - 1));
  };

  const goToNext = () => {
    setActiveIndex((current) =>
      Math.min(workflowStages.length - 1, current + 1),
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
                Workspace preview for Making Tax Digital for Income Tax
                quarterly updates.
              </p>
            </div>
            <span className="inline-flex rounded-md border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 lg:mt-5">
              Sandbox/local demo only
            </span>
          </div>

          <nav className="mt-6" aria-label="QuarterLink workflow stages">
            <ol className="grid gap-2">
              {workflowStages.map((stage, index) => {
                const isActive = index === activeIndex;

                return (
                  <li key={stage.id}>
                    <button
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      aria-current={isActive ? "step" : undefined}
                      className={`w-full rounded-md border px-3 py-3 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 ${
                        isActive
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-teal-700 hover:bg-teal-50"
                      }`}
                    >
                      <span className="block text-xs font-semibold uppercase tracking-normal">
                        Stage {index + 1}
                      </span>
                      <span className="mt-1 block font-semibold">
                        {stage.shortLabel}
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
                  Guided quarterly update workflow
                </p>
                <h1 className="mt-2 max-w-4xl text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
                  Prepare a linked spreadsheet summary for one quarterly update.
                </h1>
                <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
                  A polished local workspace for the first sandbox-readiness
                  slice: one individual taxpayer, one self-employment, Route B
                  spreadsheet records, and read-only review placeholders.
                </p>
              </div>

              <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950 xl:w-80">
                QuarterLink is not connected to HMRC yet. This screen does not
                create sandbox evidence, send quarterly updates, or store data.
              </div>
            </div>
          </header>

          <section
            aria-labelledby="readiness-summary"
            className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4"
          >
            <h2 id="readiness-summary" className="sr-only">
              Local readiness summary
            </h2>
            {readinessCards.map((card) => (
              <article
                key={card.label}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50"
              >
                <p className="text-sm font-medium text-slate-600">
                  {card.label}
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  {card.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {card.detail}
                </p>
              </article>
            ))}
          </section>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-6">
              <section
                aria-labelledby="active-stage-title"
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6"
              >
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-teal-800">
                      Stage {completionLabel}
                    </p>
                    <h2
                      id="active-stage-title"
                      className="mt-2 text-2xl font-semibold tracking-normal text-slate-950"
                    >
                      {activeStage.title}
                    </h2>
                    <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
                      {activeStage.description}
                    </p>
                  </div>
                  <span
                    className={`inline-flex w-fit rounded-md px-3 py-1 text-xs font-semibold ${
                      activeStage.status === "Blocked"
                        ? "bg-amber-100 text-amber-900"
                        : activeStage.status === "Ready"
                          ? "bg-teal-100 text-teal-900"
                          : activeStage.status === "Current"
                            ? "bg-slate-950 text-white"
                            : "bg-sky-100 text-sky-900"
                    }`}
                  >
                    {activeStage.status}
                  </span>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-950">
                      User guidance
                    </h3>
                    <ul className="mt-3 space-y-3">
                      {activeStage.actions.map((action) => (
                        <li
                          key={action}
                          className="rounded-md border border-slate-200 bg-[#fafbf8] px-3 py-3 text-sm leading-6 text-slate-700"
                        >
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-950">
                      Evidence placeholders
                    </h3>
                    <ul className="mt-3 space-y-3">
                      {activeStage.evidence.map((item) => (
                        <li
                          key={item}
                          className="rounded-md border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-700"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <p className="mt-5 rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                  {activeStage.boundary}
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={goToPrevious}
                    disabled={activeIndex === 0}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                  >
                    Previous stage
                  </button>
                  <button
                    type="button"
                    onClick={goToNext}
                    disabled={activeIndex === workflowStages.length - 1}
                    className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Next stage
                  </button>
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
                      Read-only imported totals placeholder
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                      QuarterLink reads linked totals from your spreadsheet. If
                      a figure is wrong, correct it in your spreadsheet and
                      import again.
                    </p>
                  </div>
                  <span className="inline-flex w-fit rounded-md border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                    Editing disabled
                  </span>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                    <caption className="sr-only">
                      Static preview totals for the Route B linked summary sheet
                    </caption>
                    <thead>
                      <tr className="text-slate-600">
                        <th scope="col" className="border-b px-3 py-3">
                          Category
                        </th>
                        <th scope="col" className="border-b px-3 py-3">
                          Amount
                        </th>
                        <th scope="col" className="border-b px-3 py-3">
                          Source cell
                        </th>
                        <th scope="col" className="border-b px-3 py-3">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewTotals.map((total) => (
                        <tr key={total.category} className="align-top">
                          <th
                            scope="row"
                            className="border-b border-slate-100 px-3 py-3 font-semibold text-slate-950"
                          >
                            {total.category}
                          </th>
                          <td className="border-b border-slate-100 px-3 py-3 font-mono text-slate-800">
                            GBP {total.value}
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3 text-slate-700">
                            {total.source}
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3 text-slate-700">
                            {total.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section
                aria-labelledby="route-card-heading"
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50"
              >
                <h2
                  id="route-card-heading"
                  className="text-base font-semibold text-slate-950"
                >
                  Route B workflow
                </h2>
                <ol className="mt-4 space-y-3">
                  {[
                    "Keep existing spreadsheet records.",
                    "Add a QuarterLink summary sheet.",
                    "Link summary cells by formula.",
                    "Review read-only totals in QuarterLink.",
                  ].map((item, index) => (
                    <li
                      key={item}
                      className="flex gap-3 text-sm leading-6 text-slate-700"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-100 text-xs font-semibold text-teal-900">
                        {index + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </section>

              <section
                aria-labelledby="blocked-heading"
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50"
              >
                <h2
                  id="blocked-heading"
                  className="text-base font-semibold text-slate-950"
                >
                  Deferred from QL-004
                </h2>
                <ul className="mt-4 space-y-3">
                  {deferredItems.map((item) => (
                    <li key={item} className="text-sm leading-6 text-slate-700">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section
                aria-labelledby="disabled-actions-heading"
                className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-amber-950"
              >
                <h2
                  id="disabled-actions-heading"
                  className="text-base font-semibold"
                >
                  Disabled actions
                </h2>
                <p className="mt-3 text-sm leading-6">
                  Connect to HMRC, import spreadsheet, send quarterly update,
                  and export evidence actions are placeholders only.
                </p>
                <button
                  type="button"
                  disabled
                  className="mt-4 w-full cursor-not-allowed rounded-md bg-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  HMRC connection not available
                </button>
              </section>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
