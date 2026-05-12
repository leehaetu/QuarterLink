# HMRC Sandbox Evidence Run

Status: QL-008 blocked readiness output
Last updated: 2026-05-12

## Purpose

This document explains the narrow QL-008 HMRC sandbox evidence attempt.

QL-008 did not create HMRC sandbox evidence because the required preflight inputs were not available. The output from this ticket is a blocked readiness report, not evidence of a successful HMRC sandbox response.

## Current Official Checks

Checked on 2026-05-12:

- HMRC Developer Hub getting started: `https://developer.service.hmrc.gov.uk/api-documentation/docs/using-the-hub`
- HMRC Developer Hub credentials: `https://developer.service.hmrc.gov.uk/api-documentation/docs/authorisation/credentials`
- HMRC user-restricted endpoint authorisation: `https://developer.service.hmrc.gov.uk/api-documentation/docs/authorisation/user-restricted-endpoints`
- HMRC terms of use / production-access questions: `https://developer.service.hmrc.gov.uk/api-documentation/docs/terms-of-use`
- HMRC Income Tax MTD API catalogue: `https://developer.service.hmrc.gov.uk/api-documentation/docs/api?categoryFilters=INCOME_TAX_MTD`
- Business Details (MTD) API 2.0: `https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/business-details-api/2.0`
- Obligations (MTD) API 3.0: `https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/obligations-api/3.0`
- Self Employment Business (MTD) API 5.0: `https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/self-employment-business-api/5.0`
- Test Fraud Prevention Headers API 1.0: `https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/txm-fph-validator-api/1.0`
- HMRC fraud prevention headers, web application via server: `https://developer.service.hmrc.gov.uk/guides/fraud-prevention/connection-method/web-app-via-server/`
- HMRC Test Fraud Prevention Headers guide: `https://developer.service.hmrc.gov.uk/guides/fraud-prevention/test-api/`
- GOV.UK digital records guidance: `https://www.gov.uk/guidance/use-making-tax-digital-for-income-tax/create-digital-records`
- GOV.UK quarterly updates guidance: `https://www.gov.uk/guidance/use-making-tax-digital-for-income-tax/send-quarterly-updates`

## Verified Current Endpoint Snapshot

| Purpose | API | Version | Method/path | Accept | Scope |
| --- | --- | --- | --- | --- | --- |
| Retrieve business context | Business Details (MTD) | 2.0 | `GET /individuals/business/details/{nino}/list` | `application/vnd.hmrc.2.0+json` | `read:self-assessment` |
| Retrieve quarterly update obligations | Obligations (MTD) | 3.0 | `GET /obligations/details/{nino}/income-and-expenditure` | `application/vnd.hmrc.3.0+json` | `read:self-assessment` |
| Create self-employment period summary | Self Employment Business (MTD) | 5.0 | `POST /individuals/business/self-employment/{nino}/{businessId}/period` | `application/vnd.hmrc.5.0+json` | `write:self-assessment` |
| Validate fraud prevention headers | Test Fraud Prevention Headers | 1.0 | `GET /test/fraud-prevention-headers/validate` | `application/vnd.hmrc.1.0+json` | application-restricted OAuth |

Important endpoint caveat: the Self Employment Business 5.0 create period summary endpoint states it can only be used for submissions for tax year 2024-25 or earlier, and that new endpoints supporting cumulative submission are provided for tax year 2025-26 onwards. The exact endpoint for a current-period 2026 evidence run must be verified before any HMRC sandbox call is attempted.

## Preflight Command

Run:

```sh
npm run hmrc:sandbox-evidence:preflight
```

The command emits redacted JSON. Exit code `2` means the preflight blocked the run before any HMRC sandbox call.

## QL-008 Preflight Result

Result on 2026-05-12: blocked.

No HMRC sandbox calls were made.

No Test Fraud Prevention Headers API call was made.

Evidence classification: local/demo blocked readiness report only.

Primary blockers:

- HMRC sandbox environment variables were not configured in the running process.
- No server-side user-restricted sandbox access token was available.
- No sandbox test-user authority/readiness input was available.
- No sandbox NINO, self-employment business ID, tax year, or period dates were available.
- No real `WEB_APP_VIA_SERVER` fraud-prevention input was available.
- The current self-employment endpoint path for tax year 2025-26 onward needs explicit verification before a current-period sandbox run.

## Required Before Retrying

- Configure sandbox credentials and redirect URI outside source control.
- Confirm the sandbox application is subscribed to the required APIs.
- Complete a user-restricted OAuth flow for the sandbox test user and keep tokens server-side only.
- Provide a sandbox individual taxpayer context with one self-employment business and one intended update period.
- Provide real client-collected and server-derived fraud-prevention values for the originating user action.
- Use the Test Fraud Prevention Headers API successfully before any Income Tax MTD sandbox call.
- Confirm whether the first evidence run targets a 2024-25 period summary endpoint or a 2025-26 onward cumulative submission endpoint.

## Evidence Boundary

No file produced by this QL-008 run is HMRC sandbox evidence.

The QL-008 report is safe to commit because it contains only redacted readiness metadata and official-source references. It contains no tokens, client secrets, authorisation codes, raw fraud-prevention metadata, NINO values, or real taxpayer data.
