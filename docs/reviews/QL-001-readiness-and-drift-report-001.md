# QL-001 Readiness and Drift Report 001

Status: IMPLEMENTED_PENDING_REVIEW
Date: 2026-05-11

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
- Updated both current-live-state v2 copies to record that the drift fix and QL-001 draft are prepared locally and pending review.

## QL-001 Implementation Completed

- `README.md` now describes the current project accurately and removes create-next-app boilerplate.
- `src/app/page.tsx` now renders a static app-oriented workspace shell.
- `src/app/globals.css` keeps the app on the configured font.
- `.gitignore` ignores generated Playwright MCP logs.
- QL-001 is marked `CODEX_COMPLETED`, not `GPT_ACCEPTED`.

## Remaining Drift and Control Issues

1. Remote branch `ql-001-status-fix-draft` has been deleted from `origin`.
   - Local branch: not present.
   - Remote branch: not present after deletion check.
   - Status: resolved on 2026-05-11 after explicit human approval.

2. The v2 project-pack index says there are nine active v2 files, but this working tree currently contains only files `00` to `04`, with duplicate copies of `00` to `03`.
   - Recommendation: do not invent missing source-of-truth files. Either supply the missing `05` to `08` files or update the index to match the files actually present.

3. The `docs/Project files in chatGPT/` source-of-truth files are currently untracked by Git.
   - Recommendation: decide whether they should be committed, moved, or treated as external planning inputs.

4. `README.md` boilerplate drift is resolved by QL-001 implementation.

5. `AGENTS.md` is usable, but several exclusions are written as `During QL-BOOTSTRAP`.
   - Recommendation: before HMRC/auth/database work begins, add a later control ticket to clarify which exclusions remain permanent and which are allowed only when explicitly approved by a future ticket.

## Recommended Stage Order

1. Review QL-001 implementation.
2. Commit the accepted control cleanup and QL-001 implementation if approved.
3. Move QL-001 through GPT/human review without Codex marking it `GPT_ACCEPTED`.
4. Do not start domain, tenancy, spreadsheet, HMRC, auth, or database work until the next ticket is explicitly approved.

## Web-App Focus

Sales and marketing website work should stay out of the next stage. The immediate web-app path should be:

- app shell and product workspace foundation,
- then country/regime adapter interfaces,
- then user/organisation domain model,
- then spreadsheet upload metadata and hashing,
- then digital-link/evidence design,
- then HMRC sandbox integration only after the required guardrails are in place.
