# QuarterLink — Roadmap, Tickets and Codex Prompts v2

Last updated: 2026-05-11
Status: active roadmap and next-ticket source of truth

## Current phase

Phase 0: Bootstrap and project-pack stabilisation.

QL-001 has been implemented by Codex and pushed to `main`. It is `CODEX_COMPLETED`, not `GPT_ACCEPTED`.

Do not build HMRC, authentication, database, spreadsheet import, billing, platform admin, or tenant-management features until the relevant ticket is explicitly approved.

## Current immediate sequence

1. Review QL-001.
2. Move QL-001 to `GPT_ACCEPTED` or `FIX_REQUIRED`; Codex must not set either status by itself.
3. Review and commit the cleaned v2 project-pack files if accepted.
4. Keep the old website prototype only as archived reference material.
5. Only after QL-001 is accepted, approve the next ticket.

## Completed cleanup milestones

- Mistaken remote branch `ql-001-status-fix-draft` was deleted after explicit human approval.
- `docs/tickets/QL-BOOTSTRAP.md` was corrected to `COMMITTED`.
- QL-001 draft was completed, approved by the human for implementation, implemented, committed, and pushed.
- The active v2 project-pack folder now has clean filenames for files `00` to `08`.
- Useful dashboard, website tone/visual direction, and later deployment boundary notes were extracted from the older full-scope reference.
- Superseded/deleted duplicate project files were removed after comparison.

## QL-002 — Product and HMRC Compliance Specification Pack

Recommended next ticket type:

- Documentation/specification only.
- No product code.
- No HMRC API code.
- No auth/database implementation.
- No spreadsheet parser implementation.

Purpose:

- Align repo docs with the v2 project pack.
- Promote the useful source-of-truth content into stable tracked docs.
- Treat `Archive/Website project files.zip` as non-authoritative reference only.
- Prepare clear acceptance criteria for later domain-model work.

Likely files:

- `docs/product/PRODUCT_REQUIREMENTS.md`
- `docs/hmrc/HMRC_COMPLIANCE_MATRIX.md`
- `docs/architecture/BRIDGING_AND_DIGITAL_LINKS.md`
- `docs/architecture/SAAS_TENANCY_RBAC_SECURITY.md`
- `docs/website/WEBSITE_COPY_AND_PRELAUNCH_RULES.md`
- `docs/tickets/QL-002.md`
- `.agent/runs/QL-002-run-001.md`

## QL-003 — Domain Model Proposal Only

Purpose:

- Propose domain entities and TypeScript types/interfaces only.
- Cover tenants, users, taxpayer profiles, income sources, obligations, import batches, submissions, and audit events.
- Keep country-neutral concepts in `src/core`.
- Keep tax-authority-specific concepts in tax-regime adapters.

Out of scope:

- Database migration.
- ORM.
- Authentication.
- HMRC API implementation.
- Spreadsheet parser.

## QL-004 — Auth and Tenant Architecture Decision Record

Purpose:

- Decide auth provider or approach.
- Decide tenant isolation approach.
- Decide support access principles.
- Decide secret/token storage approach.

Out of scope:

- Production auth implementation unless separately approved.
- Database implementation unless separately approved.
- HMRC token storage implementation.

## QL-005 — HMRC API Architecture Decision Record

Purpose:

- OAuth flow design.
- Fraud prevention header design.
- Business Details and Obligations API mapping.
- Quarterly update API mapping.
- Sandbox evidence plan.
- Error handling plan.

Out of scope:

- Real HMRC API implementation.
- Sandbox evidence claims.
- Production access claims.

## QL-006 — Spreadsheet Route B Specification

Purpose:

- Define linked summary-sheet template.
- Define category mapping by income-source type.
- Define import evidence schema.
- Define validation rules.
- Define test spreadsheet fixtures.

Out of scope:

- Parser implementation.
- Arbitrary messy spreadsheet smart mapping.
- Manual editing of imported monetary figures.

## QL-007+ — Implementation After Specifications Are Accepted

Implementation order should be staged:

1. Auth and tenant skeleton.
2. Audit log foundation.
3. HMRC OAuth and fraud-prevention-header infrastructure.
4. Business Details and Obligations read-only integration.
5. Spreadsheet import proof of concept.
6. Submission evidence model.
7. Sandbox quarterly update submission.
8. Public pre-launch website.
9. Railway deployment setup after the local app foundation is stable.
10. Billing and practice workflows later.

Each implementation ticket must include:

- Clear approved scope.
- Explicit out-of-scope list.
- Required checks.
- Run report.
- No `GPT_ACCEPTED` status set by Codex.
