# QL-008 OAuth UI Auth Bypass 001

Status: CODEX_COMPLETED - local sandbox demo session added, HMRC API calls still blocked
Date: 2026-05-12

## Summary

Added a local/sandbox-only demo session step so QL-008 HMRC sandbox OAuth can be tested from the web app before full QuarterLink SaaS auth exists.

No QL-009 ticket was created. No full authentication, database auth, user record, database record, production endpoint, billing, practice workflow, final declaration, or spreadsheet parsing was added. No Business Details, Obligations, Self Employment Business, Test Fraud Prevention Headers, or production calls were made.

## Cause

The web app HMRC connection flow needed a QuarterLink-side user/session concept before starting HMRC OAuth, but full SaaS sign-in does not exist yet. That blocked the local QL-008 sandbox OAuth test.

## Local-Only Bypass

- Added `Continue as sandbox demo user` to the HMRC sandbox connection card.
- The button posts to `/api/local-sandbox/demo-session`.
- The route sets an HTTP-only local cookie only when `APP_ENV=local` and `HMRC_ENV=sandbox`.
- The cookie is not a real user, not production auth, not database-backed, and not valid outside local sandbox mode.
- `/api/hmrc/oauth/start` requires the local sandbox demo cookie before redirecting to HMRC sandbox OAuth.
- Outside local sandbox mode, `/api/hmrc/oauth/start` says a real QuarterLink user must be signed in before connecting HMRC.

## User Flow

1. Open `http://localhost:3000`.
2. Click `Continue as sandbox demo user`.
3. Click `Connect to HMRC Sandbox`.
4. Sign in to HMRC with the individual sandbox test user.
5. HMRC redirects to `http://localhost:3000/api/hmrc/oauth/callback`.
6. The callback shows the safe local-only OAuth result.

## Boundaries

No sandbox password, client secret, authorisation code, access token, or refresh token was written to this run report. HMRC OAuth still does not make an HMRC submission. Business Details, Obligations, Self Employment Business, and Test Fraud Prevention Headers remain blocked until preflight passes.

## Checks

- `npm run typecheck` - passed.
- `npm run lint` - passed.
- `npm test` - passed, 32 tests.
- `npm run build` - passed.
- Local browser render check - passed on a temporary local port.
- `git diff` - reviewed.
- `git diff --check` - passed.
