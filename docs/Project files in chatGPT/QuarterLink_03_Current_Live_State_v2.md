# QuarterLink - Current Live State v2

Last updated: 2026-05-12
Repository: `leehaetu/QuarterLink`
Default branch: `main`
Status: QL-007 accepted by human review; QL-008 is the next active ticket and has not been started.

## Confirmed Live Repo State At Start Of QL-002

Known latest committed state before QL-002 began:

```text
e0b39fdc7565a87e75890d8bcbf9f57308a86ce8
```

Known tag:

```text
bootstrap-complete
```

Known branch state:

- Current branch: `main`.
- `main` matched `origin/main` before QL-002 edits began.
- QL-002 control-sync edits have been committed locally.

## Current Control State

- `QL-BOOTSTRAP` is `COMMITTED`.
- `QL-001` is now recorded as `COMMITTED` after human acceptance.
- Project-file consolidation report 001 is now recorded as completed and committed.
- `QL-002` is the control-sync ticket that closed the drift and reconciled the ticket sequence.
- `QL-003` is recorded as `GPT_ACCEPTED` after human review on 2026-05-12.
- `QL-003` was documentation/specification only and did not implement product code, HMRC API calls, authentication, database storage, spreadsheet parsing, submissions, billing, practice workflows, or public website work.
- `QL-004` is recorded as `GPT_ACCEPTED` after human review on 2026-05-12.
- `QL-004` built a static/local guided app workspace shell only; no HMRC OAuth, HMRC API calls, authentication, database persistence, spreadsheet parsing, real submissions, billing, practice workflows, or production website functionality were added.
- `QL-005` is recorded as `GPT_ACCEPTED` after human review on 2026-05-12.
- `QL-005` built the local/static Route B spreadsheet workflow and evidence design only; no spreadsheet upload/parsing, HMRC OAuth, HMRC API calls, authentication, database persistence, real submissions, billing, practice workflows, public website functionality, or production evidence generation was added.
- `QL-006` is recorded as `GPT_ACCEPTED` after human review on 2026-05-12.
- `QL-006` created architecture/specification outputs for auth, tenant boundaries, session assumptions, audit events, secrets, HMRC OAuth/token handling, consent/declaration records, and fraud-prevention-header handling.
- `QL-006` was documentation/specification only; no product code, HMRC OAuth implementation, HMRC API calls, authentication implementation, database persistence, spreadsheet parsing, real submissions, billing, practice workflows, public website functionality, or production evidence generation was added.
- `QL-007` is recorded as `GPT_ACCEPTED` after human review on 2026-05-12.
- `QL-007` added limited server-side HMRC sandbox foundation code: sandbox config validation, OAuth URL construction, request construction, fraud-prevention-header assembly, redaction helpers, tests, and setup documentation.
- `QL-007` did not implement HMRC API network calls, production HMRC calls, persistent token storage, database migrations, spreadsheet parsing, real quarterly update sending, final declaration or tax return features, HMRC sandbox evidence, or production evidence.
- QL-007 acceptance confirmed `npm audit --audit-level=moderate` still reports 2 moderate advisories from Next's bundled PostCSS dependency. No `npm audit fix --force` was applied because npm reports a potentially breaking fix path.
- `QL-008` is now the next active ticket, but it has not been started.
- Codex did not mark any work `GPT_ACCEPTED` without human instruction.

## Accepted Completed Work

QL-001 delivered:

- README cleanup.
- Static app-oriented first screen.
- Next.js App Router skeleton in `src/app`.
- TypeScript, Tailwind CSS, ESLint, npm scripts, and Turbopack.
- Placeholder country-aware architecture under `src/core` and `src/tax-regimes`.
- No HMRC, authentication, database, spreadsheet parsing, billing, tenant persistence, or platform admin features.

Project-file consolidation delivered:

- Clean active v2 project pack from files `00` to `08`.
- Old duplicate/deleted reference folders removed.
- Historical website prototype retained only under `Archive/`.
- Extracted dashboard, website direction, and later deployment notes into active v2 files.
- ESLint ignores the archived website prototype material.

## Product Direction Clarification

The goal is not to build a throwaway sandbox hack.

The goal is a polished sandbox-readiness MVP:

- good enough UI/UX that the product feels credible to use internally,
- narrow enough to reach HMRC sandbox testing quickly,
- structured enough that production access is not blocked later by missing security, evidence, audit, or fraud-prevention decisions.

Sandbox testing should start after the focused workflow is coherent, not after every future SaaS feature is complete.

## Current Repo Capability

Implemented:

- Next.js scaffold.
- TypeScript.
- Tailwind CSS.
- ESLint.
- `src/` directory.
- Static app-oriented first screen.
- Control files.
- Placeholder source folders.
- Lightweight tax-regime placeholders.
- Limited server-side HMRC sandbox foundation helpers for configuration validation, request construction, fraud-prevention-header assembly, and redaction. These helpers do not perform HMRC network calls.

Not implemented:

- User auth.
- Organisation/tenant model.
- Database.
- Row-level access control.
- Full HMRC OAuth journey or callback handling.
- HMRC API network calls.
- Persistent HMRC token storage.
- Browser-side fraud-prevention-header collection.
- Test Fraud Prevention Headers API calls.
- Spreadsheet upload/import.
- Digital-link evidence.
- Quarterly update sending.
- Audit logs.
- Evidence packs.
- Public production website.
- Billing.
- Practice/client workflows.

## Correct Next Action

The next ticket should be QL-008:

```text
First HMRC sandbox quarterly update evidence run.
```

Do not start QL-008 until explicitly instructed.

## Ticket Sequence

- `QL-003`: Sandbox-readiness MVP target and HMRC production-access checklist.
- `QL-004`: Polished app workspace and guided workflow shell.
- `QL-005`: Spreadsheet Route B local workflow and evidence design.
- `QL-006`: Auth, tenant, audit, secrets, and HMRC access architecture.
- `QL-007`: HMRC sandbox integration foundation - GPT_ACCEPTED after human review.
- `QL-008`: First HMRC sandbox quarterly update evidence run - next active ticket, not started.

## Update Rule

Update this file after every:

- accepted Codex run,
- commit,
- push,
- tag,
- branch deletion,
- ticket approval,
- checkpoint pass,
- or discovered drift issue.
