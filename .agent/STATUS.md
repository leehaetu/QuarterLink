Current phase: Sprint 0
Current gate: G1 — App skeleton and source-of-truth control closed
Current ticket: QL-008
Current status: DRAFT

Last completed ticket: QL-007
Last completed status: GPT_ACCEPTED after human review on 2026-05-12

QL-003 was accepted by human review on 2026-05-12.
QL-003 was documentation/specification only: no product code, HMRC API calls, auth, database, spreadsheet parsing, submissions, billing, practice workflows, or public website work.
QL-004 built the static/local guided app workspace shell for the first sandbox-readiness slice.
QL-004 did not implement HMRC OAuth, HMRC API calls, auth, database persistence, spreadsheet parsing, real submissions, billing, practice workflows, or production website functionality.
QL-004 was accepted by human review on 2026-05-12.
QL-005 built the local/static Route B spreadsheet workflow and evidence design for the first sandbox-readiness slice.
QL-005 did not implement spreadsheet upload/parsing, HMRC OAuth, HMRC API calls, auth, database persistence, real submissions, billing, practice workflows, public website functionality, or production evidence generation.
QL-005 was accepted by human review on 2026-05-12.
QL-006 created architecture/specification outputs for auth, tenancy, audit, secrets, HMRC OAuth/token handling, consent/declaration records, and fraud-prevention headers.
QL-006 was documentation/specification only: no product code, HMRC OAuth implementation, HMRC API calls, database persistence, authentication implementation, spreadsheet parsing, submissions, billing, practice workflows, or public website functionality.
QL-006 was accepted by human review on 2026-05-12.
QL-007 added a limited server-side HMRC sandbox foundation: environment validation, request construction, OAuth URL construction, fraud-prevention-header assembly, redaction helpers, focused tests, and setup documentation.
QL-007 did not implement HMRC API network calls, production HMRC calls, persistent token storage, database migrations, spreadsheet parsing, real quarterly update sending, final declaration or tax return features, HMRC sandbox evidence, or production evidence.
QL-007 was accepted by human review on 2026-05-12.
QL-007 acceptance confirmed `npm audit --audit-level=moderate` still reports 2 moderate advisories from Next's bundled PostCSS dependency. No `npm audit fix --force` was applied because npm reports a potentially breaking fix path.
QL-008 is now the next active ticket, but it has not been started.
Codex did not mark any ticket GPT_ACCEPTED without human instruction.

Allowed statuses:
- DRAFT
- GPT_APPROVED_FOR_CODEX
- CODEX_IN_PROGRESS
- CODEX_COMPLETED
- GPT_REVIEWING
- FIX_REQUIRED
- GPT_ACCEPTED
- COMMITTED
- CHECKPOINT_PASSED

Rule:
Codex must not mark tickets GPT_ACCEPTED.
