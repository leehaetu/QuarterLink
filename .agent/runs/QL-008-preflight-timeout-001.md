# QL-008 Preflight Timeout Debug

Date: 2026-05-12

## Scope

Debugged the local QL-008 sandbox preflight command that appeared to hang:

```bash
set -a; source .env.local; set +a; npm run hmrc:sandbox-evidence:preflight
```

No QL-009 work was created. No production endpoints, HMRC submission calls, Business Details calls, Obligations calls, Self Employment Business calls, or Test Fraud Prevention Headers calls were added.

## Finding

The preflight path is local-only. It validates configuration, readiness flags, sandbox context, fraud-prevention input presence, evidence path safety, and tracked secret-file safety. It does not attempt HMRC network calls.

The command can appear to hang because the script previously emitted no progress output until `tsx` startup and the full JSON result completed.

## Change

- Added redacted progress logging to the QL-008 preflight command.
- Added an explicit preflight result field showing HMRC network calls were not attempted.
- Added a timeout to the local `git ls-files` tracked secret-file safety subprocess.
- Changed unverifiable tracked secret-file safety to block rather than pass silently.
- Added regression coverage for redacted progress logging, no HMRC network calls, and secret-file safety blocking.

## Secrets

No client secret, sandbox password, authorisation code, access token, refresh token, or HMRC credential value was written to this report.
