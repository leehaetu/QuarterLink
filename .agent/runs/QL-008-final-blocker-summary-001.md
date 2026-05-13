# QL-008 Final Blocker Summary 001

Date: 2026-05-13
Status: BLOCKED

## Scope

QL-008 is closed as BLOCKED on genuine fraud-prevention and deployment inputs.

No QL-009 work was created. No helper code was added. No HMRC API calls, HMRC submission calls, production endpoint calls, Self Employment Business cumulative submission calls, database storage, authentication, final declaration, bookkeeping, VAT, payroll, invoicing, or spreadsheet parsing was attempted or added.

No `.env.local` file, client secret, access token, refresh token, authorisation code, sandbox password, raw fraud-prevention value, raw device cookie secret, or sensitive runtime value is recorded in this report.

## Readiness Summary

| Item | Status |
| --- | --- |
| OAuth ready | yes |
| PKCE ready | yes |
| local sandbox demo access | yes |
| signed device ID | yes |
| fraud-header builder | yes |
| sandbox discovery dry-run | yes |
| Test Fraud Prevention Headers | blocked |
| Business Details | blocked |
| Obligations | blocked |
| Self Employment cumulative submission | not attempted |
| HMRC calls made | no |

The code path is ready enough for the next deployment or tunnel-based sandbox test, but QL-008 cannot progress from localhost alone.

## Final Blocker

Localhost cannot genuinely provide all required `WEB_APP_VIA_SERVER` fraud-prevention inputs. The remaining blocker is not more local helper code; it is the lack of deployment-bound and real request-context values that must come from a public HTTPS/tunnel/deployed sandbox boundary, or from explicit HMRC guidance/approval on missing fraud-prevention data.

Exact blocker categories:

- MFA context
- public client IP
- public client port
- vendor forwarded chain
- vendor public IP
- vendor licence ID
- real SaaS user ID context

## Blocked Steps

Test Fraud Prevention Headers is blocked until genuine `WEB_APP_VIA_SERVER` fraud-prevention inputs are available and a guarded HMRC call is intentionally enabled for a sandbox-only run.

Business Details is blocked because the read-only Business Details call must not be run before Test Fraud Prevention Headers passes.

Obligations is blocked because the read-only Obligations call must not be run before Test Fraud Prevention Headers and Business Details pass.

Self Employment cumulative submission was not attempted.

## Next Real Options

1. Public HTTPS tunnel/deployed sandbox test route.
2. HMRC support query about local sandbox missing fraud-prevention data.

## Evidence Boundaries

HMRC calls made: no.

No HMRC sandbox evidence was created during this blocker closeout. Local dry-run readiness must not be described as HMRC sandbox evidence.
