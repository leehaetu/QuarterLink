# QL-008 OAuth Readiness 001

Status: CODEX_COMPLETED - sandbox OAuth callback/token exchange added, preflight still blocked
Date: 2026-05-12

## Summary

Ran the QL-008 OAuth readiness step only.

No QL-009 ticket was created. No new numbered ticket was started. No Business Details, Obligations, Self Employment Business, Test Fraud Prevention Headers, or production endpoint calls were made. No client secret, HMRC user password, access token, refresh token, or authorisation code was written to this run report.

## OAuth Readiness Result

The repo already had a sandbox OAuth authorisation URL builder, but no working OAuth start route, callback route, or token exchange flow.

Added the smallest sandbox-only local flow:

- `GET /api/hmrc/oauth/start` builds the sandbox authorisation URL and redirects to HMRC.
- `GET /api/hmrc/oauth/callback` validates the returned `state` and exchanges the authorisation code for a token through the sandbox token endpoint.
- The flow requires `HMRC_SANDBOX_TEST_USER_TYPE=individual` so it cannot be used with an organisation sandbox test user for this step.
- The callback does not persist tokens. It displays the access token only when `HMRC_SANDBOX_OAUTH_SHOW_TOKENS=true` is set locally.

## Redirect URI

Register this exact redirect URI in HMRC Developer Hub:

`http://localhost:3000/api/hmrc/oauth/callback`

## Local Environment

Required before starting OAuth:

- `APP_ENV=local`
- `HMRC_ENV=sandbox`
- `HMRC_SANDBOX_API_BASE_URL=https://test-api.service.hmrc.gov.uk`
- `HMRC_SANDBOX_AUTH_BASE_URL=https://test-www.tax.service.gov.uk`
- `HMRC_SANDBOX_CLIENT_ID`
- `HMRC_SANDBOX_CLIENT_SECRET`
- `HMRC_SANDBOX_REDIRECT_URI=http://localhost:3000/api/hmrc/oauth/callback`
- `HMRC_SANDBOX_SCOPES="read:self-assessment write:self-assessment"`
- `HMRC_SANDBOX_TEST_USER_TYPE=individual`
- `HMRC_SANDBOX_OAUTH_STATE`, a local opaque value of at least 16 characters
- `HMRC_SANDBOX_OAUTH_SHOW_TOKENS=true`, temporary while obtaining the local access token

Required after OAuth and before QL-008 preflight can pass:

- `HMRC_SANDBOX_ACCESS_TOKEN`
- `HMRC_SANDBOX_TEST_USER_READY=true`
- `HMRC_SANDBOX_TEST_NINO=NX995584B`
- `HMRC_SANDBOX_SELF_EMPLOYMENT_BUSINESS_ID`
- `HMRC_SANDBOX_TAX_YEAR`
- `HMRC_SANDBOX_PERIOD_START_DATE`
- `HMRC_SANDBOX_PERIOD_END_DATE`
- real `WEB_APP_VIA_SERVER` fraud-prevention inputs

The known individual sandbox test user details supplied by the human were NINO `NX995584B`, MTD Income Tax ID `XAIT00779561042`, and Self Assessment UTR `2503319560`. These are not a substitute for the self-employment business ID or period context required by preflight.

## Evidence Boundary

No HMRC sandbox evidence was produced. OAuth readiness is not Business Details, Obligations, Self Employment Business, Test Fraud Prevention Headers, or production evidence.

## Checks

- `npm run typecheck` - passed.
- `npm run lint` - passed.
- `npm test` - passed, 27 tests.
- `npm run build` - passed.
- `npm run hmrc:sandbox-evidence:preflight` - blocked with exit code `2` before any HMRC sandbox evidence call.
- `git diff` - reviewed.
- `git diff --check` - passed.

Preflight was run from the current shell without writing secrets to `.env.local` or injecting the supplied client secret into the command. It therefore reported the base sandbox environment values as missing in this shell, plus the expected remaining QL-008 blockers: no access token, no test-user readiness flag, no self-employment business/period context, and no fraud-prevention input.
