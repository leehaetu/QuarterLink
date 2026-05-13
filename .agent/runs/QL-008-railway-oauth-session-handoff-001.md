# QL-008 Railway OAuth Session Handoff 001

Date: 2026-05-13
Status: CODEX_COMPLETED

## Scope

Fixed the QL-008 Railway sandbox OAuth result flow so the public callback no longer tells the user to copy an access token into `.env.local`.

No QL-009 work was created. No HMRC production endpoints were used. No HMRC API calls, HMRC submission calls, Self Employment Business cumulative submission calls, database storage, production authentication, Redis, final declaration, bookkeeping, VAT, payroll, invoicing, or spreadsheet parsing was attempted or added.

No `.env.local` file, client secret, access token, refresh token, authorisation code, sandbox password, raw fraud-prevention value, raw device cookie secret, or sensitive runtime value is recorded in this report.

## Change

- Added a temporary QL-008 sandbox-only OAuth token session.
- The token session is enabled only when `APP_ENV=local` and `HMRC_ENV=sandbox`.
- The token is stored server-side in short-lived process memory and keyed by an HTTP-only signed cookie containing only an opaque session id.
- On HTTPS, the session cookie is `Secure`, HTTP-only, and `SameSite=strict`.
- The Railway/public callback now says: `OAuth token exchange succeeded. Token is held only for this sandbox session. No HMRC submission has been made.`
- The Railway/public callback does not show `.env.local` token-copy instructions.
- Localhost can still show the access token only when `HMRC_SANDBOX_OAUTH_SHOW_TOKENS=true`.
- Added a guarded sandbox discovery route that can use the server-side sandbox OAuth session token without exposing it to the browser.
- Kept dry-run as the default for sandbox discovery. HMRC calls still require `QL_008_DISCOVERY_ALLOW_HMRC_CALLS=true` and complete fraud-prevention inputs.
- Updated the UI to show the intended order:
  1. Continue as sandbox demo user.
  2. Collect fraud-prevention inputs.
  3. Connect to HMRC Sandbox.

## Demo Bypass Boundary

No real QuarterLink SaaS sign-in is required for this QL-008 route only because the runtime is configured with `APP_ENV=local` and `HMRC_ENV=sandbox`.

The bypass is temporary sandbox demo access. It is not production auth, does not create a user record, and is disabled outside `APP_ENV=local` plus `HMRC_ENV=sandbox`.

## Evidence Boundary

HMRC calls made: no.

No HMRC sandbox evidence was created during this UI/session handoff fix. Local tests and build output are not HMRC sandbox evidence.

## Checks

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test`: passed, 65 tests.
- `npm run build`: passed.
- `git diff`: reviewed.
- `git diff --check`: passed.
