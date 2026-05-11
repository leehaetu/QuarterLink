# QL-001 Readiness and Drift Report 001

Status: ACCEPTED_AND_COMMITTED
Date: 2026-05-12

## Purpose

Record the current control cleanup, explain the placeholder architecture, and identify what should be reviewed before QuarterLink moves from bootstrap skeleton into web-app development.

## Placeholder Architecture

The current architecture is intentionally light:

- `src/app` contains the Next.js App Router entry points.
- `src/core` contains empty domain folders for future country-neutral modules: audit, organisations, spreadsheets, submissions, and users.
- `src/tax-regimes/common` contains minimal shared tax-regime types such as income sources, obligations, periods, and adapter identity.
- `src/tax-regimes/uk/mtd-income-tax` contains the first UK Making Tax Digital for Income Tax adapter placeholder with supported income-source identifiers.

This is solid for bootstrap because it keeps the app country-aware without building a complex global tax engine. It is not yet sufficient for real product behaviour, HMRC integration, spreadsheet imports, tenant access, or audit evidence.

## Local Fixes Prepared

- Fixed `docs/tickets/QL-BOOTSTRAP.md` so its status is `COMMITTED`.
- Updated `.agent/QUEUE.md` so the QL-001 summary matches the new draft.
- Replaced the thin `docs/tickets/QL-001.md` placeholder with a complete DRAFT ticket for stabilising the bootstrap and preparing the web-app skeleton.
- Updated current-live-state records during QL-001 preparation. Later QL-002 control sync supersedes the earlier pending-review wording.

## QL-001 Implementation Completed

- `README.md` now describes the current project accurately and removes create-next-app boilerplate.
- `src/app/page.tsx` now renders a static app-oriented workspace shell.
- `src/app/globals.css` keeps the app on the configured font.
- `.gitignore` ignores generated Playwright MCP logs.
- QL-001 is now recorded as `COMMITTED` after human acceptance, not as `GPT_ACCEPTED`.

## Resolved Drift and Control Issues

1. Remote branch `ql-001-status-fix-draft` has been deleted from `origin`.
   - Local branch: not present.
   - Remote branch: not present after deletion check.
   - Status: resolved on 2026-05-11 after explicit human approval.

2. The v2 project-pack index now matches the active files `00` to `08`.
   - Status: resolved by project-file consolidation.

3. The `docs/Project files in chatGPT/` source-of-truth files are committed.
   - Status: resolved by project-file consolidation.

4. `README.md` boilerplate drift is resolved by QL-001 implementation.

5. `AGENTS.md` is usable, but several exclusions are written as `During QL-BOOTSTRAP`.
   - Recommendation: QL-003 to QL-008 now separate permanent product exclusions from future-ticket-approved work.

## Recommended Stage Order

1. Complete and commit QL-002 control-state sync.
2. Use QL-003 to define the narrow polished sandbox-readiness MVP and HMRC production-access checklist.
3. Move quickly into QL-004 product UI/workflow implementation.
4. Do not start HMRC/auth/database/spreadsheet implementation until each slice is explicitly approved.

## Web-App Focus

Sales and marketing website work should stay out of the next stage. The immediate web-app path should be:

- polished app workspace and guided workflow shell,
- then Route B spreadsheet workflow and evidence design,
- then auth, tenant, audit, secrets, and HMRC access architecture,
- then HMRC sandbox integration foundation,
- then first real HMRC sandbox evidence run.
