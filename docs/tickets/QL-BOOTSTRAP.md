# QL-BOOTSTRAP

Status: CODEX_COMPLETED

## Goal

Create the initial QuarterLink repository skeleton, control files, and first source-of-truth project documents.

## Scope

- Create the Next.js App Router skeleton with TypeScript, Tailwind CSS, ESLint, src directory, npm, import alias, and Turbopack for development.
- Create QuarterLink control files under `.agent`.
- Create source-of-truth documents under `docs`.
- Create placeholder source directories for future core modules.
- Create lightweight tax-regime TypeScript placeholders only.
- Create a simple homepage with the approved bootstrap wording.

## Out of Scope

- HMRC API calls
- OAuth
- authentication
- database storage
- spreadsheet parsing
- quarterly update payload submission
- final declaration
- tax return features
- VAT features
- bookkeeping ledger
- bank feeds
- receipt capture
- payroll
- invoicing
- manual adjustment of imported monetary figures

## Acceptance Criteria

- Node.js version is checked before scaffolding.
- Next.js skeleton exists.
- Required control files and folders exist.
- Required docs exist.
- Required placeholder source directories exist.
- Homepage uses the approved wording and makes no HMRC recognition or pricing claims.
- `package.json` includes `dev`, `build`, `start`, `lint`, and `typecheck` scripts.
- Turbopack is enabled for development.
- No product features outside bootstrap scope are implemented.
- No commit is created and no push is performed.

## Checks to Run

- `node -v`
- `npm install` if needed
- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Required Run Report

Create `.agent/runs/QL-BOOTSTRAP-run-001.md` with the ticket name, status, versions, Turbopack confirmation, files created or changed, commands run, results, implementation summary, deliberate exclusions, risks, unresolved issues, and suggested next ticket.
