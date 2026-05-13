# QL-008 Completion Batch 001

Date: 2026-05-13
Status: BLOCKED

## Scope

This batch stayed inside QL-008. No QL-009 work was created. No production endpoint was used. No Self Employment Business cumulative submission, write endpoint, HMRC submission endpoint, final declaration, billing, practice workflow, database auth, Redis lock, or broad SaaS infrastructure was added.

No client secret, access token, refresh token, authorisation code, sandbox password, raw fraud-prevention value, raw device cookie secret, or sensitive fraud metadata is recorded in this report.

## Repo And Local Safety

- `main` was pulled from `origin/main`; it was already up to date.
- Working tree was clean before this batch.
- `.env.local` exists, is ignored, is untracked, and was not staged.
- Required local keys were present by presence/value status only:
  - `APP_ENV=local`
  - `HMRC_ENV=sandbox`
  - `HMRC_SANDBOX_CLIENT_ID`
  - `HMRC_SANDBOX_CLIENT_SECRET`
  - `HMRC_SANDBOX_ACCESS_TOKEN`
  - `HMRC_SANDBOX_TEST_USER_READY=true`
  - `HMRC_SANDBOX_TEST_NINO`
  - `QL_008_DEVICE_COOKIE_SECRET`
- Current access token value was not found in tracked files by the local audit. Token expiry metadata was not present in `.env.local`, so freshness could not be proven before a guarded HMRC call. No guarded HMRC call was reached because the dry-run blocked on fraud-prevention input readiness.

## Architecture Checkpoint

- OAuth status: local sandbox OAuth flow exists; `.env.local` contains a user-restricted sandbox access token by presence only. No token value was printed.
- PKCE status: OAuth start/callback code uses generated one-time state and PKCE verifier/challenge handling with expiry metadata in the code path.
- Device ID status: the QL-008 collector uses the verified server-side signed HTTP-only device ID cookie. Browser-supplied `deviceId` is ignored.
- Fraud-header builder status: dry-run reports 3 buildable headers, 6 missing headers, 4 localhost-only limitations, and 3 manual override groups.
- Dry-run status: `set -a; source .env.local; set +a; npm run hmrc:sandbox-discovery` ran after the build and made no HMRC network call and no HMRC submission call.
- Test Fraud Prevention Headers readiness: not runnable until all required `WEB_APP_VIA_SERVER` fraud-prevention variables are present and `QL_008_DISCOVERY_ALLOW_HMRC_CALLS=true` is set for the guarded run.
- Business Details readiness: code is now wired to run the read-only `GET /individuals/business/details/{nino}/list` call only after Test Fraud Prevention Headers passes.
- Obligations readiness: code is now wired to run the read-only `GET /obligations/details/{nino}/income-and-expenditure` call only after Business Details passes.

## Official Endpoint Check

Checked current public HMRC Developer Hub OAS surfaces during this batch:

- Test Fraud Prevention Headers 1.0: `https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/txm-fph-validator-api/1.0/oas/file`
- Business Details 2.0: `https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/business-details-api/2.0/oas/file`
- Obligations 3.0: `https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/obligations-api/3.0/oas/file`

## Local Collector Result

The local browser collector was opened at `http://127.0.0.1:3000` and the `Collect local fraud-prevention inputs` button ran successfully. It produced a local `.env.local` snippet in the UI. The snippet was not copied into a committed file and raw values are not recorded here.

The collector still requires manual/local infrastructure values for MFA metadata, public client/vendor IP and port data, QuarterLink user ID metadata, forwarded metadata, and vendor licence metadata.

## Dry-Run Result

Dry-run result: BLOCKED.

HMRC network calls attempted: no.
HMRC submission calls attempted: no.

Dry-run blockers:

- `WEB_APP_VIA_SERVER fraud-prevention header builder`: 3 header(s) buildable; 6 missing; 4 unavailable on localhost; 3 manual override required; Test Fraud Prevention Headers is not runnable in this dry-run/default state.
- `WEB_APP_VIA_SERVER fraud-prevention inputs`: missing browser/device/timestamp/screen/timezone/window values, localhost-only public network values, and manual override groups for MFA, user IDs, and vendor licence IDs.

## Remaining Blockers

Add real local `.env.local` values for these keys. Do not paste them into chat or commit `.env.local`.

- `QL_008_FRAUD_BROWSER_JS_USER_AGENT`
- `QL_008_FRAUD_DEVICE_ID`
- `QL_008_FRAUD_MFA_TYPE`
- `QL_008_FRAUD_MFA_TIMESTAMP`
- `QL_008_FRAUD_MFA_UNIQUE_REFERENCE`
- `QL_008_FRAUD_CLIENT_PUBLIC_IP`
- `QL_008_FRAUD_CLIENT_PUBLIC_IP_TIMESTAMP`
- `QL_008_FRAUD_CLIENT_PUBLIC_PORT`
- `QL_008_FRAUD_SCREEN_WIDTH`
- `QL_008_FRAUD_SCREEN_HEIGHT`
- `QL_008_FRAUD_SCREEN_SCALING_FACTOR`
- `QL_008_FRAUD_SCREEN_COLOUR_DEPTH`
- `QL_008_FRAUD_TIMEZONE`
- `QL_008_FRAUD_CLIENT_USER_ID_KEY`
- `QL_008_FRAUD_CLIENT_USER_ID_VALUE`
- `QL_008_FRAUD_WINDOW_WIDTH`
- `QL_008_FRAUD_WINDOW_HEIGHT`
- `QL_008_FRAUD_VENDOR_FORWARDED_BY`
- `QL_008_FRAUD_VENDOR_FORWARDED_FOR`
- `QL_008_FRAUD_VENDOR_LICENSE_ID_KEY`
- `QL_008_FRAUD_VENDOR_LICENSE_ID_VALUE`
- `QL_008_FRAUD_VENDOR_PUBLIC_IP`

## Checks

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test`: passed.
- `npm run build`: passed.
- `set -a; source .env.local; set +a; npm run hmrc:sandbox-discovery`: ran as dry-run, blocked before HMRC calls.

## HMRC Calls

HMRC calls made: no.

- Test Fraud Prevention Headers: not run.
- Business Details: not run.
- Obligations: not run.
- Self Employment Business cumulative submission: not run.
