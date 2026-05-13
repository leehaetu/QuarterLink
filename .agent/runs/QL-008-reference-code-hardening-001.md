# QL-008 Reference-Code Hardening Run 001

Generated: 2026-05-13

## Scope

Bounded reference-code extraction and Priority 1 hardening for the current QL-008 OAuth / fraud-prevention / HMRC client foundation.

No QL-009 work was created. No HMRC API calls, HMRC submission calls, production endpoint calls, Business Details calls, Obligations calls, Test Fraud Prevention Headers calls, or Self Employment submission calls were made.

## Reference Files

Old MVP files inspected were limited to the approved list recorded in:

- `.agent/runs/QL-008-reference-code-gap-report-001.md`

The old code was used for patterns only. No old product/vendor names, hard-coded fraud defaults, token persistence code, database auth code, Redis lock code, Business Details/Obligations calls, or submission code was copied.

## Changes Made

- Wrote the required gap report: `.agent/runs/QL-008-reference-code-gap-report-001.md`.
- Added local sandbox OAuth PKCE generation in `src/server/hmrc/oauth.ts`.
- Replaced required static `HMRC_SANDBOX_OAUTH_STATE` usage with generated one-time in-memory OAuth state and `code_verifier` storage using a five-minute TTL.
- Added `code_challenge` / `code_challenge_method=S256` to the sandbox authorisation URL.
- Added `code_verifier` to the token exchange request body.
- Added token metadata: `issuedAt`, adjusted `expiresAt`, and `clockDriftBufferSeconds`.
- Hardened redaction keys for authorisation-code and PKCE-related fields in `src/server/hmrc/redaction.ts`.
- Updated focused OAuth and redaction tests.

## Deferred

- Device ID binding remains a gap. Current local fraud collection still uses browser local storage and a client-writable cookie, not a server-signed cookie. This should be a separate narrow patch if approved.
- No database token store, Redis lock, refresh-token lifecycle, Business Details, Obligations, Test Fraud Prevention Headers, or submission implementation was added.

## Verification

- `npm run typecheck`: passed after `.next` was regenerated. The first attempt failed because stale duplicate `.next/types/* 2.ts` generated files existed locally.
- `npm run lint`: passed.
- `npm test`: passed, 48 tests.
- `npm run build`: passed after approved network access for Next.js Google font fetching. The first sandboxed build attempt failed only because network access to Google Fonts was blocked.
- `git diff`: reviewed.
- `git diff --check`: passed.

## Safety Notes

- No `.env.local` file was committed.
- No files were committed.
- No HMRC network calls were made.
- The successful `npm run build` did make non-HMRC network requests for Google font assets after approval.
- No current QuarterLink secrets, tokens, auth codes, sandbox passwords, personal credentials, Railway secrets, Redis secrets, or raw fraud values were committed.
- One old reference fraud/vendor default was visible in local command output during early inspection of an approved old reference file; it was not copied into QuarterLink code, reports, docs, tests, commits, or final output.
