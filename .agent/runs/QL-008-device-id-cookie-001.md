# QL-008 Device ID Cookie Run

Date: 2026-05-13

## Scope

Finished the local/sandbox-only QL-008 device ID binding for the fraud-prevention input collector.

## Changes

- Generated the QL-008 fraud-prevention device ID server-side as a UUID.
- Stored the device ID in an HTTP-only signed cookie.
- Signed the cookie with `QL_008_DEVICE_COOKIE_SECRET`.
- Reused valid signed cookies.
- Rejected tampered or invalid signed cookies and regenerated the device ID.
- Stopped trusting browser-supplied `deviceId` payload values.
- Set `QL_008_FRAUD_DEVICE_ID` from the verified server-side cookie value.
- Kept the collector gated to `APP_ENV=local` and `HMRC_ENV=sandbox`.

## Local Env Needed

`QL_008_DEVICE_COOKIE_SECRET`

This value is server-only. It must not be exposed to browser code, logged, pasted into chat, or committed.

## Checks

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test`: passed.
- `npm run build`: passed.
- `git diff`: completed.
- `git diff --check`: passed.

## Safety Notes

- No HMRC API calls were made.
- No HMRC submission calls were made.
- No production endpoints were used.
- No HMRC tokens were linked to the device ID.
- No raw device cookie secret was written to this report.
- No secrets, tokens, auth codes, sandbox passwords, or raw fraud values were intentionally committed.
- No commit was made.
