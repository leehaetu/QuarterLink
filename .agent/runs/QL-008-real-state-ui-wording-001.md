# QL-008 real-state UI wording 001

Date: 2026-05-13

Scope: QL-008 UI wording and status reporting only. No QL-009 work was created. No HMRC API calls, HMRC submission calls, production endpoints, final declaration sending, database storage, auth system, spreadsheet parsing, bookkeeping, VAT, payroll, invoicing, or send action was added.

## Cause

The declaration placeholder in `src/app/workspace-shell.tsx` used static copy that said the HMRC connection was missing. That was misleading once the page began receiving the temporary sandbox OAuth token-session state, because OAuth presence is a separate state from Test Fraud Prevention Headers, Business Details, Obligations, and submission evidence.

## Change

- Replaced the static Step 6 HMRC wording with a QL-008 real-state panel.
- Added explicit UI state fields for demo access, sandbox OAuth session presence, fraud-prevention input collection, Test Fraud Prevention Headers status, Business Details status, Obligations status, and submission status.
- Kept QL-008 submission status fixed at `not_attempted`.
- Kept quarterly update sending disabled.
- Added tests that OAuth presence does not imply Test Fraud Prevention Headers passed, Business Details discovered, Obligations discovered, or submission readiness.

## User-facing wording

Before OAuth:

- `HMRC sandbox OAuth not connected`
- `Connect through the QL-008 sandbox connection panel first`
- `No HMRC API evidence calls have been made`
- `No HMRC submission has been made`
- `Fraud-prevention validation still required`
- `Business Details and Obligations discovery still required`
- `Quarterly update sending remains disabled`

After OAuth when the current sandbox token-session state is present:

- `HMRC sandbox OAuth connected`
- `HMRC sandbox OAuth connected. No HMRC API evidence calls or submissions have been made yet.`
- `No HMRC API evidence calls have been made`
- `No HMRC submission has been made`
- `Fraud-prevention validation still required`
- `Business Details and Obligations discovery still required`
- `Quarterly update sending remains disabled`

## Evidence boundary

No HMRC calls were made for this wording change. No access tokens, refresh tokens, authorisation codes, client secrets, sandbox passwords, device cookie secrets, raw fraud-prevention header values, or raw fraud-prevention override values were added to this report or the UI.
