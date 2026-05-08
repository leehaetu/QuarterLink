# Agent Rules

## Product rules

- QuarterLink is bridging-only software for Making Tax Digital for Income Tax.
- QuarterLink helps users send quarterly updates from spreadsheet records.
- QuarterLink is not bookkeeping software.
- During QL-BOOTSTRAP, Codex must not build bookkeeping, VAT features, bank feeds, receipt capture, payroll, invoicing, final declaration, tax return, HMRC API, database, auth, or spreadsheet parsing.

## HMRC wording rules

- Use: Making Tax Digital for Income Tax, send quarterly updates, quarterly updates, spreadsheet records, bridging software, software that connects to records.
- Avoid user-facing claims or wording such as HMRC-approved, file quarterly tax returns, submit quarterly returns, EOPS, End of Period Statement, VAT features, and bookkeeping software.

## Architecture rules

- Keep core modules as country-neutral as practical.
- Put tax authority logic in tax-regime adapters.
- Do not build a complex global tax engine in QL-BOOTSTRAP.

## Spreadsheet bridge rules

- Initial route A is a QuarterLink template used as the user's digital record.
- Initial route B is an existing spreadsheet with a linked QuarterLink summary sheet.
- Recommend route B for existing spreadsheet users because it helps preserve the digital path.
- Imported monetary figures must be read-only after import.
- Corrections must happen in the source spreadsheet, followed by re-import.

## Security rules

- Do not invent production approval evidence.
- Do not invent sandbox evidence.
- Do not add authentication, database storage, or HMRC API calls during QL-BOOTSTRAP.

## Development rules

- Use stable TypeScript.
- Use npm.
- Use Next.js App Router, src directory, Tailwind CSS, ESLint, and Turbopack.
- Expect Node.js 20.9 or later.

## Ticket control rules

- Codex may only implement the currently approved ticket.
- Codex must not start the next ticket.
- Codex must write a run report after every meaningful implementation ticket.
- Codex must not mark work GPT_ACCEPTED.
- Human controls commits and pushes.

## Sandbox evidence rules

- Codex must not claim HMRC sandbox evidence unless it came from actual HMRC sandbox API calls.
- Local mock data must never be labelled as HMRC sandbox evidence.
- No sandbox evidence is created during QL-BOOTSTRAP.
