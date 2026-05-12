# QuarterLink - Roadmap, Tickets and Codex Prompts v2

Last updated: 2026-05-12
Status: active roadmap and next-ticket source of truth

## Current Phase

Phase 1: polished sandbox-readiness MVP.

Bootstrap and project-pack cleanup are complete. QL-001 and the project-file consolidation have been accepted by the human and are recorded as committed through the QL-002 control sync.

The next goal is QL-006: define the auth, tenant, audit, secrets, and HMRC access architecture before sandbox integration work.

## Strategy

QuarterLink should not wait for a full production SaaS before sandbox testing.

QuarterLink should also not rush into an ugly or weak sandbox hack.

The practical path is:

1. Define the narrow sandbox-readiness MVP and production-access checklist.
2. Build a polished guided app workflow around that path.
3. Add Route B spreadsheet and evidence design.
4. Add only the auth, tenant, audit, secret, and fraud-prevention decisions needed before HMRC sandbox work.
5. Implement the HMRC sandbox foundation.
6. Run real sandbox evidence only when the app actually makes HMRC sandbox API calls.

## Non-Negotiable Boundaries

- Do not claim HMRC sandbox evidence unless it came from actual HMRC sandbox API calls.
- Do not claim production access, approval, or recognition.
- Keep QuarterLink as bridging software for Making Tax Digital for Income Tax.
- Keep spreadsheet records as the source record.
- Keep imported monetary figures read-only after import.
- Corrections happen in the source spreadsheet, followed by re-import.
- Avoid VAT, bookkeeping, bank feeds, receipt capture, payroll, invoicing, final declaration, and tax return features unless a later approved ticket explicitly changes scope.

## Completed Cleanup Milestones

- Mistaken remote branch `ql-001-status-fix-draft` was deleted after explicit human approval.
- `docs/tickets/QL-BOOTSTRAP.md` was corrected to `COMMITTED`.
- QL-001 was implemented, committed, pushed, and human-accepted.
- The active v2 project-pack folder now has clean filenames for files `00` to `08`.
- Useful dashboard, website tone/visual direction, and later deployment boundary notes were extracted from the older full-scope reference.
- Superseded/deleted duplicate project files were removed after comparison.
- Project-file consolidation report 001 is accepted and recorded as completed/committed.

## QL-002 - Control-State Sync

Status: `COMMITTED` after this control-sync commit.

Purpose:

- Record QL-001 acceptance without Codex marking `GPT_ACCEPTED`.
- Record project-file consolidation acceptance.
- Reconcile the ticket sequence with the sandbox-readiness MVP strategy.
- Move the old "tax regime adapter interfaces" placeholder later in the sequence.

## QL-003 - Sandbox-Readiness MVP Target and HMRC Production-Access Checklist

Status: `GPT_ACCEPTED` after human review on 2026-05-12.

Ticket type:

- Documentation/specification only.
- Short and practical.
- No product code.
- No HMRC API calls.

Purpose:

- Define the narrow first MVP path.
- Identify which screens/workflows must be polished before sandbox testing.
- Create a checklist from official HMRC developer guidance for production access readiness.
- Confirm which requirements must be satisfied before sandbox work and which can wait.

Likely files:

- `docs/product/SANDBOX_READINESS_MVP.md`
- `docs/hmrc/PRODUCTION_ACCESS_CHECKLIST.md`
- `.agent/runs/QL-003-run-001.md`

QL-003 did not implement product code, HMRC API calls, authentication, database storage, spreadsheet parsing, submissions, billing, practice workflows, or public website work.

## QL-004 - Polished App Workspace and Guided Workflow Shell

Status: `GPT_ACCEPTED` after human review on 2026-05-12.

Purpose:

- Make the app feel like a real product workspace.
- Build guided screens for getting started, spreadsheet route choice, Route B preparation, review/evidence readiness, and HMRC connection placeholder.
- Keep all state static or local preview data.
- Keep the design credible and usable before HMRC sandbox work.

Out of scope:

- HMRC API calls.
- Auth/database.
- Spreadsheet parsing.
- Sandbox evidence.
- Public marketing website.

QL-004 built a static/local app workspace shell only. It did not implement HMRC OAuth, HMRC API calls, authentication, database persistence, spreadsheet parsing, real submissions, billing, practice workflows, or production website functionality.

## QL-005 - Spreadsheet Route B Local Workflow and Evidence Design

Status: `GPT_ACCEPTED` after human review on 2026-05-12.

Purpose:

- Specify and/or prototype the linked QuarterLink summary sheet route.
- Define evidence fields and validation expectations.
- Preserve the digital path from existing spreadsheet records.
- Keep imported monetary figures read-only.

Out of scope unless explicitly approved:

- Arbitrary spreadsheet smart mapping.
- Manual edits to imported monetary values.
- Quarterly update sending.

QL-005 built a local/static Route B workflow and evidence preview only. It did not implement spreadsheet upload/parsing, HMRC OAuth, HMRC API calls, authentication, database persistence, real submissions, billing, practice workflows, public website functionality, or production evidence generation.

## QL-006 - Auth, Tenant, Audit, Secrets, and HMRC Access Architecture

Purpose:

- Decide the minimum security foundation needed before real HMRC sandbox integration.
- Cover auth approach, tenant boundary, audit events, secret handling, HMRC token handling, and fraud prevention headers.
- Avoid production-access blockers.

Out of scope unless explicitly approved:

- Full production auth.
- Full database implementation.
- HMRC API implementation.

## QL-007 - HMRC Sandbox Integration Foundation

Purpose:

- Implement environment validation.
- Add server-side HMRC API client scaffolding.
- Add OAuth and fraud-prevention-header foundation if approved.
- Keep local evidence and HMRC sandbox evidence clearly separated.

Out of scope:

- Production HMRC calls.
- Production access or recognition claims.
- Quarterly update sending unless explicitly approved.

## QL-008 - First HMRC Sandbox Quarterly Update Evidence Run

Purpose:

- Make real HMRC sandbox API calls.
- Record evidence correctly.
- Update the production-access checklist with actual sandbox results.

Out of scope:

- Production HMRC API calls.
- Public launch.
- Billing.
- Practice workflows.

## Later Work

After the first sandbox evidence path is proven:

1. harden auth and tenant isolation,
2. persist audit and evidence records,
3. broaden spreadsheet import handling,
4. improve HMRC error handling and recovery,
5. prepare production-access responses,
6. build public pre-launch website,
7. deploy to Railway or another approved platform,
8. add billing and practice workflows later.

Each implementation ticket must include:

- clear approved scope,
- explicit out-of-scope list,
- required checks,
- run report,
- no `GPT_ACCEPTED` status set by Codex.
