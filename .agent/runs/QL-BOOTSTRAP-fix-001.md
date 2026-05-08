# QL-BOOTSTRAP Fix 001

## Ticket

QL-BOOTSTRAP

## Status

CODEX_COMPLETED

## Date

2026-05-09

## What Was Checked

- Checked `CLAUDE.md` presence and local evidence for prior CLAUDE instructions.
- Checked `package.json` scripts and package name.
- Checked homepage wording in `src/app/page.tsx` against `docs/HMRC_WORDING_AND_SCOPE.md`.
- Checked `AGENTS.md` for ticket control, sandbox evidence, and bootstrap exclusion rules.
- Checked ticket/status files to keep QL-BOOTSTRAP as the current completed ticket and leave QL-001 untouched.
- Ran the requested npm verification commands.

## What Was Fixed

- Updated `src/app/page.tsx` to remove user-facing references to final declaration, tax return features, and "bookkeeping software".
- Kept the homepage wording aligned to approved wording: Making Tax Digital for Income Tax, quarterly updates, spreadsheet records, bridging software, and software that connects to records.
- Updated `docs/tickets/QL-BOOTSTRAP.md` from `CODEX_IN_PROGRESS` to `CODEX_COMPLETED` to match `.agent/STATUS.md` and `.agent/QUEUE.md`.

## CLAUDE.md Findings

- `find . -name 'CLAUDE.md' -print` returned no matches.
- The target directory is not a git repository, so there is no local git history available to compare or restore an earlier `CLAUDE.md`.
- `.agent/runs/QL-BOOTSTRAP-run-001.md` does not list `CLAUDE.md` as created, changed, removed, or replaced.
- The bootstrap run report records an official scaffold copy from a temporary valid-name `create-next-app` project using `rsync -a` without `--delete`; based on that local evidence, there is no proof that the scaffold intentionally emptied or removed `CLAUDE.md`.
- No meaningful lost CLAUDE content can be identified from the available local evidence, so no replacement content was invented.

## package.json Verification

- Package name is `quarterlink`, which is lowercase and npm-safe.
- Required scripts are present:
  - `dev`: `next dev --turbopack`
  - `build`: `next build`
  - `start`: `next start`
  - `lint`: `eslint`
  - `typecheck`: `tsc --noEmit`
- Next.js remains at `16.2.6`; no downgrade was made.
- Build script remains compatible with Next.js 16 stable behavior. `next build` reported Turbopack during the verification run.

## Wording Verification

- `src/app/page.tsx` was checked for:
  - `HMRC-approved`
  - `HMRC approved`
  - `MTD ITSA`
  - `submit quarterly returns`
  - `file quarterly tax returns`
  - `VAT`
  - `bookkeeping software`
  - `login`
  - `pricing`
  - `price`
- After the homepage wording fix, the targeted search returned no matches.
- No fake login buttons, pricing claims, VAT references, HMRC approval claims, or quarterly tax return wording are present in the homepage.

## AGENTS.md Verification

`AGENTS.md` explicitly states:

- Codex may only implement the currently approved ticket.
- Codex must not start the next ticket.
- Codex must not mark work GPT_ACCEPTED.
- Codex must not claim HMRC sandbox evidence unless it came from actual HMRC sandbox API calls.
- During QL-BOOTSTRAP, Codex must not build bookkeeping, VAT features, bank feeds, receipt capture, payroll, invoicing, final declaration, tax return, HMRC API, database, auth, or spreadsheet parsing.

## Status Verification

- Current ticket remains `QL-BOOTSTRAP`.
- Current status remains `CODEX_COMPLETED`.
- `QL-001` remains `DRAFT`.
- Nothing was changed to `GPT_ACCEPTED`.
- No commit or push was performed.

## Command Results

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
  - Build output reported `Next.js 16.2.6 (Turbopack)`.
  - `/` and `/_not-found` were prerendered as static content.

## Unresolved Risks

- There is no `.git` directory and no `CLAUDE.md` file in the workspace, so exact prior CLAUDE.md contents cannot be recovered from local git history.
- No HMRC sandbox evidence was created or claimed during this fix review.
