# QuarterLink - Current Live State v2

Last updated: 2026-05-12
Repository: `leehaetu/QuarterLink`
Default branch: `main`
Status: QL-001 and project-file consolidation accepted by the human; QL-002 control sync committed.

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
- `QL-002` is the control-sync ticket that closes the drift and reconciles the ticket sequence.
- `QL-003` is the next draft ticket.
- Codex did not mark any work `GPT_ACCEPTED`.

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

Not implemented:

- User auth.
- Organisation/tenant model.
- Database.
- Row-level access control.
- HMRC OAuth.
- HMRC APIs.
- Fraud prevention headers.
- Spreadsheet upload/import.
- Digital-link evidence.
- Quarterly update sending.
- Audit logs.
- Evidence packs.
- Public production website.
- Billing.
- Practice/client workflows.

## Correct Next Action

After QL-002 is committed, the next ticket should be QL-003:

```text
Sandbox-readiness MVP target and HMRC production-access checklist.
```

QL-003 should be short and practical. It should define the narrow path for:

- one polished individual-user workflow,
- Route B spreadsheet records,
- read-only imported totals when import exists,
- evidence boundaries,
- HMRC sandbox readiness,
- official HMRC production-access checklist items.

Then move quickly into QL-004 product UI/workflow implementation.

## Ticket Sequence

- `QL-003`: Sandbox-readiness MVP target and HMRC production-access checklist.
- `QL-004`: Polished app workspace and guided workflow shell.
- `QL-005`: Spreadsheet Route B local workflow and evidence design.
- `QL-006`: Auth, tenant, audit, secrets, and HMRC access architecture.
- `QL-007`: HMRC sandbox integration foundation.
- `QL-008`: First HMRC sandbox quarterly update evidence run.

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
