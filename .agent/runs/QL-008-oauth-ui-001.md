# QL-008 OAuth UI 001

Status: CODEX_COMPLETED - sandbox OAuth connection UI added, HMRC API calls still blocked
Date: 2026-05-12

## Summary

Built the QL-008 sandbox HMRC connection UI into the local web app.

No QL-009 ticket was created. No production endpoint was enabled. No client secret, sandbox user password, authorisation code, access token, or refresh token was written to this run report. No Business Details, Obligations, Self Employment Business, Test Fraud Prevention Headers, or production calls were made.

## UI Added

- The local app at `http://localhost:3000` now shows an HMRC sandbox connection card.
- The card shows `Connect to HMRC Sandbox` when local/sandbox env readiness is complete.
- The button links to `/api/hmrc/oauth/start`.
- Missing or invalid local-only env vars are shown by name only.
- The card states that this is sandbox only, not production, no HMRC submission has been made, OAuth gives an access token only, and fraud-prevention inputs are still required before HMRC API calls.
- The card shows the remaining blockers after OAuth.

## Callback Page

`/api/hmrc/oauth/callback` now returns a safe local-only HTML page instead of raw JSON.

The success page shows:

- `HMRC Sandbox OAuth Complete`;
- `No submission made`;
- `Next: run QL-008 preflight`;
- `set -a; source .env.local; set +a; npm run hmrc:sandbox-evidence:preflight`.

If `HMRC_SANDBOX_OAUTH_SHOW_TOKENS=true` is set locally, the callback page displays the access token with a warning to copy it only into local `.env.local` or the local shell. It never displays a refresh token. If token display is disabled, it reports that token exchange succeeded and token display is hidden.

## Remaining Blockers

- Access token must be kept local only.
- Self-employment business ID still needed.
- Tax year still needed.
- Period start and end dates still needed.
- Real `WEB_APP_VIA_SERVER` fraud-prevention inputs still needed.
- Test Fraud Prevention Headers validation still needed.

## Checks

- `npm run typecheck` - passed.
- `npm run lint` - passed.
- `npm test` - passed, 29 tests.
- `npm run build` - passed.
- `git diff` - reviewed.
- `git diff --check` - passed.
