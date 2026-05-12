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
- HMRC Income Tax MTD changelog: `https://github.com/hmrc/income-tax-mtd-changelog`
- HMRC Making Tax Digital for Income Tax service guide, making updates during the tax year: `https://developer.service.hmrc.gov.uk/guides/income-tax-mtd-end-to-end-service-guide/documentation/make-updates-during-tax-year.html`
- Test Fraud Prevention Headers API 1.0: `https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/txm-fph-validator-api/1.0`
- HMRC fraud prevention headers, web application via server: `https://developer.service.hmrc.gov.uk/guides/fraud-prevention/connection-method/web-app-via-server/`
- HMRC Test Fraud Prevention Headers guide: `https://developer.service.hmrc.gov.uk/guides/fraud-prevention/test-api/`
- GOV.UK digital records guidance: `https://www.gov.uk/guidance/use-making-tax-digital-for-income-tax/create-digital-records`
- GOV.UK quarterly updates guidance: `https://www.gov.uk/guidance/use-making-tax-digital-for-income-tax/send-quarterly-updates`

## HMRC Changelog Entries Relied On

The HMRC Income Tax MTD changelog was checked before the endpoint decision. The entries relied on are:

| Date | API | Change summary used for QL-008 |
| --- | --- | --- |
| 24 July 2024 | Self Employment Business API v3.0 | Period summary endpoints no longer accept data for tax years 2025-26 onwards. |
| 11 December 2024 | Self Employment Business API v4.0 sandbox | Self-employment cumulative period summary endpoints were created for tax years 2025-26 onwards; period summary endpoints no longer accept data for tax years 2025-26 onwards. |
| 11 December 2024 | Obligations API v3.0 sandbox | Added `CUMULATIVE` `Gov-Test-Scenario` for income and expenditure obligations and updated sandbox data with cumulative dates for tax years 2025-26 onwards. |
| 24 March 2025 | Self Employment Business API v5.0 sandbox | Version 5.0 was added in sandbox and includes the Self-Employment Cumulative Period Summary endpoint family. |
| 14 April 2025 | Self Employment Business API v4.0 production | The same 2025-26 onward cumulative endpoint direction was promoted to production for v4.0; period summary endpoints no longer accept data for tax years 2025-26 onwards. |
| 30 May 2025 | Self Employment Business API v4.0 and v5.0 sandbox | Updated the `STATEFUL` `Gov-Test-Scenario` and clarified support is limited to standard cumulative quarterly updates where no `commencementDate` is present for Create or Amend a Self-Employment Cumulative Period Summary. |
| 24 March 2026 | Self Employment Business API v5.0 production | Version 5.0 was updated in production and still includes Create and Amend a Self-Employment Cumulative Period Summary; the entry changes that endpoint's success code from `200` to `204`. |

Later Self Employment Business API v5.0 changelog entries checked on 22 April 2026 and 12 May 2026 relate to annual-submission field deprecations and did not change the self-employment quarterly update endpoint path.

## Verified Current Endpoint Snapshot

| Purpose | API | Version | Method/path | Accept | Scope |
| --- | --- | --- | --- | --- | --- |
| Retrieve business context | Business Details (MTD) | 2.0 | `GET /individuals/business/details/{nino}/list` | `application/vnd.hmrc.2.0+json` | `read:self-assessment` |
| Retrieve quarterly update obligations | Obligations (MTD) | 3.0 | `GET /obligations/details/{nino}/income-and-expenditure` | `application/vnd.hmrc.3.0+json` | `read:self-assessment` |
| Create self-employment period summary for 2024-25 or earlier only | Self Employment Business (MTD) | 5.0 | `POST /individuals/business/self-employment/{nino}/{businessId}/period` | `application/vnd.hmrc.5.0+json` | `write:self-assessment` |
| Amend/retrieve self-employment cumulative period summary for 2025-26 onwards | Self Employment Business (MTD) | 5.0 | `PUT /individuals/business/self-employment/{nino}/{businessId}/cumulative/{taxYear}` and `GET /individuals/business/self-employment/{nino}/{businessId}/cumulative/{taxYear}` | `application/vnd.hmrc.5.0+json` | `write:self-assessment` for `PUT`, `read:self-assessment` for `GET` |
| Validate fraud prevention headers | Test Fraud Prevention Headers | 1.0 | `GET /test/fraud-prevention-headers/validate` | `application/vnd.hmrc.1.0+json` | application-restricted OAuth |

Endpoint conclusion for the first retry: do not use the 2024-25 period summary endpoint for a 2025-26 onward evidence run. If QL-008 retries against tax year `2025-26` or later, the current HMRC Self Employment Business (MTD) 5.0 path to prepare is `PUT /individuals/business/self-employment/{nino}/{businessId}/cumulative/{taxYear}`. Use the legacy `POST /individuals/business/self-employment/{nino}/{businessId}/period` path only if the approved retry deliberately targets tax year `2024-25` or earlier.

This is also supported by the HMRC Income Tax MTD changelog entries listed above.

Human review accepted this endpoint conclusion for QL-008 blocker-resolution / retry-prerequisites planning on 2026-05-12. This does not mark QL-008 `GPT_ACCEPTED` and does not make the retry safe.

Human verification still required: confirm the intended sandbox tax year and scenario before the retry. QL-008 should default to the 2025-26 onward cumulative path only when the sandbox test user, obligations response, and fixture period all support that tax year.

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
- At run 001 time, the current self-employment endpoint path for tax year 2025-26 onward needed explicit verification before a current-period sandbox run.

QL-008 blocker-resolution update on 2026-05-12: the endpoint-path blocker is resolved for retry planning by the changelog and Developer Hub cross-checks above. Runtime blockers remain open until the sandbox credentials, test-user authority, exact sandbox fixture values, real fraud-prevention inputs, and preflight pass.

## Required Before Retrying

1. Configure sandbox credentials and redirect URI outside source control:
   - `APP_ENV=local` or `APP_ENV=sandbox`
   - `HMRC_ENV=sandbox`
   - `HMRC_SANDBOX_API_BASE_URL=https://test-api.service.hmrc.gov.uk`
   - `HMRC_SANDBOX_AUTH_BASE_URL=https://test-www.tax.service.gov.uk`
   - `HMRC_SANDBOX_CLIENT_ID`
   - `HMRC_SANDBOX_CLIENT_SECRET`
   - `HMRC_SANDBOX_REDIRECT_URI`, exactly matching a sandbox app redirect URI
   - `HMRC_SANDBOX_SCOPES` containing `read:self-assessment write:self-assessment`
2. Confirm the sandbox application is subscribed to:
   - Business Details (MTD) API 2.0
   - Obligations (MTD) API 3.0
   - Self Employment Business (MTD) API 5.0
   - Test Fraud Prevention Headers API 1.0
3. Complete OAuth/test-user setup:
   - create or select an HMRC sandbox individual test user suitable for Income Tax Self Assessment;
   - complete the user-restricted OAuth authorisation journey for `read:self-assessment write:self-assessment`;
   - provide the resulting server-side sandbox access token to the run process only;
   - set the readiness flag expected by the preflight, `HMRC_SANDBOX_TEST_USER_READY=true`.
4. Decide the retry tax year:
   - for `2024-25` or earlier, use `POST /individuals/business/self-employment/{nino}/{businessId}/period`;
   - for `2025-26` onwards, use `PUT /individuals/business/self-employment/{nino}/{businessId}/cumulative/{taxYear}`.
5. Provide sandbox context inputs:
   - `HMRC_SANDBOX_TEST_NINO`, in the format required by HMRC;
   - `HMRC_SANDBOX_SELF_EMPLOYMENT_BUSINESS_ID`, obtained from Business Details or an official sandbox scenario and matching the self-employment business ID pattern;
   - `HMRC_SANDBOX_TAX_YEAR`;
   - `HMRC_SANDBOX_PERIOD_START_DATE`;
   - `HMRC_SANDBOX_PERIOD_END_DATE`;
   - any `Gov-Test-Scenario` value deliberately selected from the official endpoint docs.
6. Confirm the preliminary Income Tax MTD inputs:
   - Business Details `GET /individuals/business/details/{nino}/list` must identify a self-employment business or a documented sandbox scenario business ID.
   - Obligations `GET /obligations/details/{nino}/income-and-expenditure` must use the NINO and, where filtering by business, `typeOfBusiness` plus `businessId`; date filters must be supplied as a valid `fromDate`/`toDate` pair no more than 366 days apart.
   - The selected obligation period must align with the intended `periodStartDate` and `periodEndDate`.
7. Provide real `WEB_APP_VIA_SERVER` fraud-prevention inputs for the originating user action:
   - client-collected: browser JavaScript user agent, persistent device ID, MFA details or HMRC-agreed missing-data approach, public IP timestamp, screen data, timezone, and window size;
   - server-derived: client public IP, client public port, QuarterLink user IDs, vendor forwarded hops, vendor licence IDs or HMRC-agreed missing-data approach, vendor product name, vendor public IP, and vendor version.
8. Run the Test Fraud Prevention Headers API successfully with the assembled `Gov-*` headers before any Income Tax MTD sandbox call.
9. Run `npm run hmrc:sandbox-evidence:preflight`. Make no HMRC sandbox call unless it passes.

Anything not confirmed from HMRC docs, the sandbox app, the sandbox test user, or the live run environment must stay marked as human verification required. Do not infer missing HMRC fixture values.

## Evidence Boundary

No file produced by this QL-008 run is HMRC sandbox evidence.

The QL-008 report is safe to commit because it contains only redacted readiness metadata and official-source references. It contains no tokens, client secrets, authorisation codes, raw fraud-prevention metadata, NINO values, or real taxpayer data.
