# QL-008 Railway OAuth UI Readiness 001

Date: 2026-05-13
Status: CODEX_COMPLETED

## Scope

Fixed the QL-008 HMRC sandbox OAuth UI readiness check for the Railway sandbox route.

No QL-009 work was created. No HMRC production endpoints were used. No HMRC API calls, HMRC submission calls, Self Employment Business cumulative submission calls, database storage, authentication, final declaration, bookkeeping, VAT, payroll, invoicing, or spreadsheet parsing was attempted or added.

No `.env.local` file, client secret, access token, refresh token, authorisation code, sandbox password, raw fraud-prevention value, raw device cookie secret, or sensitive runtime value is recorded in this report.

## Change

- Replaced the hard-coded localhost-only OAuth UI redirect readiness check with the same sandbox redirect URI validation used by the server config path.
- Kept `http://localhost:3000/api/hmrc/oauth/callback` valid for local development.
- Kept `https://quarterlink-production.up.railway.app/api/hmrc/oauth/callback` valid for the Railway sandbox OAuth route.
- Updated the browser readiness card to show the configured redirect URI, which is safe non-secret config.
- Added regression tests for localhost redirect readiness, Railway HTTPS redirect readiness, missing redirect blocking, and malformed redirect blocking.

## Railway Values To Confirm

- `APP_ENV=local`
- `HMRC_ENV=sandbox`
- `HMRC_SANDBOX_API_BASE_URL=https://test-api.service.hmrc.gov.uk`
- `HMRC_SANDBOX_AUTH_BASE_URL=https://test-www.tax.service.gov.uk`
- `HMRC_SANDBOX_REDIRECT_URI=https://quarterlink-production.up.railway.app/api/hmrc/oauth/callback`
- `HMRC_SANDBOX_SCOPES=read:self-assessment write:self-assessment`
- `HMRC_SANDBOX_TEST_USER_TYPE=individual`
- `HMRC_SANDBOX_CLIENT_ID` is set but not printed.
- `HMRC_SANDBOX_CLIENT_SECRET` is set but not printed.
- `HMRC_SANDBOX_OAUTH_SHOW_TOKENS=false`

No `HMRC_PRODUCTION_*` variables should be configured for this QL-008 sandbox route.

## Evidence Boundary

HMRC calls made: no.

No HMRC sandbox evidence was created during this UI readiness fix. Local tests and build output are not HMRC sandbox evidence.

## Checks

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test`: passed, 59 tests.
- `npm run build`: passed.
- `git diff`: reviewed.
- `git diff --check`: passed.
