const navigationItems = [
  "Overview",
  "Spreadsheet records",
  "Quarterly updates",
  "Evidence",
  "Settings",
] as const;

const readinessItems = [
  {
    label: "Web app shell",
    status: "In progress",
    detail: "Static workspace foundation for controlled development.",
  },
  {
    label: "Tax-regime adapters",
    status: "Placeholder",
    detail: "UK Making Tax Digital for Income Tax identifiers are isolated.",
  },
  {
    label: "Spreadsheet bridge",
    status: "Planned",
    detail: "Route A template and route B linked summary sheet are not active yet.",
  },
  {
    label: "HMRC connection",
    status: "Not connected",
    detail: "No OAuth, API calls, sandbox evidence, or production claim exists.",
  },
] as const;

const workspaceSteps = [
  "Choose a spreadsheet route",
  "Connect spreadsheet records",
  "Review read-only totals",
  "Send quarterly updates",
] as const;

const guardrails = [
  "Spreadsheet records remain the source record.",
  "Corrections happen in the source spreadsheet, then re-import.",
  "Imported monetary figures will be read-only when import exists.",
  "This local preview is not HMRC sandbox evidence.",
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-50 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[17rem_1fr]">
        <aside className="border-b border-slate-200 bg-white px-5 py-5 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-4 lg:block">
            <div>
              <p className="text-lg font-semibold">QuarterLink</p>
              <p className="mt-1 text-sm leading-5 text-slate-600">
                Making Tax Digital for Income Tax
              </p>
            </div>
            <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800 lg:mt-5 lg:inline-block">
              Local preview
            </span>
          </div>

          <nav className="mt-6 grid gap-1" aria-label="Workspace">
            {navigationItems.map((item, index) => (
              <span
                key={item}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  index === 0
                    ? "bg-slate-950 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item}
              </span>
            ))}
          </nav>
        </aside>

        <section className="px-5 py-6 sm:px-8 lg:px-10">
          <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold text-teal-700">
                Web app skeleton
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
                Prepare spreadsheet records for quarterly updates.
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
                QuarterLink is a controlled app foundation for bridging
                spreadsheet records to Making Tax Digital for Income Tax
                quarterly updates.
              </p>
            </div>

            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 md:w-64">
              Preview only. No HMRC connection, spreadsheet import, or tenant
              storage is active.
            </div>
          </header>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-6">
              <section aria-labelledby="readiness-heading">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <h2
                    id="readiness-heading"
                    className="text-base font-semibold text-slate-950"
                  >
                    Foundation readiness
                  </h2>
                  <span className="text-sm text-slate-500">
                    Static app shell
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {readinessItems.map((item) => (
                    <article
                      key={item.label}
                      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-slate-950">
                          {item.label}
                        </h3>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {item.detail}
                      </p>
                    </article>
                  ))}
                </div>
              </section>

              <section
                aria-labelledby="workflow-heading"
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2
                      id="workflow-heading"
                      className="text-base font-semibold text-slate-950"
                    >
                      Quarterly update workspace
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Preview flow only.
                    </p>
                  </div>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-slate-700">
                    Planned
                  </span>
                </div>

                <ol className="mt-5 grid gap-3 md:grid-cols-4">
                  {workspaceSteps.map((step, index) => (
                    <li
                      key={step}
                      className="rounded-md border border-slate-200 bg-stone-50 p-3"
                    >
                      <span className="text-xs font-semibold text-teal-700">
                        Step {index + 1}
                      </span>
                      <p className="mt-2 text-sm font-medium text-slate-900">
                        {step}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            </div>

            <aside className="space-y-6">
              <section
                aria-labelledby="routes-heading"
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40"
              >
                <h2
                  id="routes-heading"
                  className="text-base font-semibold text-slate-950"
                >
                  Spreadsheet routes
                </h2>
                <div className="mt-4 space-y-4 text-sm leading-6 text-slate-700">
                  <div>
                    <h3 className="font-semibold text-slate-950">Route A</h3>
                    <p>QuarterLink template used as the digital record.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-950">Route B</h3>
                    <p>
                      Existing spreadsheet with a linked QuarterLink summary
                      sheet. Recommended for existing spreadsheet users.
                    </p>
                  </div>
                </div>
              </section>

              <section
                aria-labelledby="guardrails-heading"
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40"
              >
                <h2
                  id="guardrails-heading"
                  className="text-base font-semibold text-slate-950"
                >
                  Scope guardrails
                </h2>
                <ul className="mt-4 space-y-3">
                  {guardrails.map((item) => (
                    <li key={item} className="text-sm leading-6 text-slate-700">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
