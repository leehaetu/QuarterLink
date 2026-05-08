export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-950">
      <section className="mx-auto flex max-w-3xl flex-col gap-8">
        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            QuarterLink
          </p>
          <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">
            Send Making Tax Digital for Income Tax quarterly updates from
            spreadsheet records.
          </h1>
          <p className="text-xl leading-8 text-slate-700">
            QuarterLink is bridging software for users who keep their records
            in spreadsheets.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Quarterly updates</h2>
            <p className="mt-2 text-slate-700">
              Focused on the quarterly updates workflow for Making Tax Digital
              for Income Tax.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Spreadsheet records</h2>
            <p className="mt-2 text-slate-700">
              Software that connects to records while preserving the
              spreadsheet as the source record.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
