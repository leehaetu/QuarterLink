# QL-008 Blocker Resolution 001

Status: CODEX_COMPLETED - retry prerequisites documented, sandbox retry still blocked
Date: 2026-05-12

## Summary

Ran the QL-008 blocker resolution / retry prerequisites action only.

Human review accepted the blocker-resolution / retry-prerequisites action and its endpoint conclusion on 2026-05-12. This run report records that accepted conclusion only; Codex did not mark QL-008 `GPT_ACCEPTED`.

No QL-009 ticket was created. No new numbered ticket was started. No HMRC sandbox call, Test Fraud Prevention Headers API call, production call, product UI change, auth implementation, database storage, final declaration, bookkeeping, or spreadsheet parsing was added.

## Official Sources Checked

- HMRC Income Tax MTD changelog: `https://github.com/hmrc/income-tax-mtd-changelog`
- HMRC Developer Hub Self Employment Business (MTD) API 5.0: `https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/self-employment-business-api/5.0`
- HMRC Developer Hub Business Details (MTD) API 2.0: `https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/business-details-api/2.0`
- HMRC Developer Hub Obligations (MTD) API 3.0: `https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/obligations-api/3.0`
- HMRC Developer Hub Test Fraud Prevention Headers API 1.0: `https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/txm-fph-validator-api/1.0`
- HMRC fraud-prevention guidance for `WEB_APP_VIA_SERVER`: `https://developer.service.hmrc.gov.uk/guides/fraud-prevention/connection-method/web-app-via-server/`
- HMRC Making Tax Digital for Income Tax service guide, making updates during the tax year: `https://developer.service.hmrc.gov.uk/guides/income-tax-mtd-end-to-end-service-guide/documentation/make-updates-during-tax-year.html`

## HMRC Changelog Entries Checked

| Date | API | Change summary used for QL-008 |
| --- | --- | --- |
| 24 July 2024 | Self Employment Business API v3.0 | Period summary endpoints no longer accept data for tax years 2025-26 onwards. |
| 11 December 2024 | Self Employment Business API v4.0 sandbox | Self-employment cumulative period summary endpoints were created for tax years 2025-26 onwards; period summary endpoints no longer accept data for tax years 2025-26 onwards. |
| 11 December 2024 | Obligations API v3.0 sandbox | Added `CUMULATIVE` `Gov-Test-Scenario` and cumulative sandbox dates for income and expenditure obligations. |
| 24 March 2025 | Self Employment Business API v5.0 sandbox | Version 5.0 was added in sandbox and includes the Self-Employment Cumulative Period Summary endpoint family. |
| 14 April 2025 | Self Employment Business API v4.0 production | The same 2025-26 onward cumulative endpoint direction was promoted to production for v4.0. |
| 30 May 2025 | Self Employment Business API v4.0 and v5.0 sandbox | `STATEFUL` sandbox scenario support for Create or Amend a Self-Employment Cumulative Period Summary is limited to standard cumulative quarterly updates where no `commencementDate` is present. |
| 24 March 2026 | Self Employment Business API v5.0 production | Version 5.0 was updated in production and still includes Create and Amend a Self-Employment Cumulative Period Summary; the entry changes that endpoint's success code from `200` to `204`. |

Later Self Employment Business API v5.0 changelog entries checked on 22 April 2026 and 12 May 2026 relate to annual-submission field deprecations and do not change the quarterly update path.

## Endpoint Conclusion

The 2024-25 period summary endpoint is not the correct first retry path for a 2025-26 onward quarterly update evidence run.

For tax year `2025-26` or later, prepare Self Employment Business (MTD) API 5.0:

- `PUT /individuals/business/self-employment/{nino}/{businessId}/cumulative/{taxYear}`
- `Accept: application/vnd.hmrc.5.0+json`
- `Content-Type: application/json`
- user-restricted OAuth scope: `write:self-assessment`

For a retrieval check on the same cumulative path, use `GET /individuals/business/self-employment/{nino}/{businessId}/cumulative/{taxYear}` with `read:self-assessment`.

Use `POST /individuals/business/self-employment/{nino}/{businessId}/period` only if the approved sandbox retry deliberately targets tax year `2024-25` or earlier.

## Blockers Resolved

- Exact HMRC self-employment path choice is resolved for retry planning.
- The first retry decision is documented: use the 2025-26 onward cumulative endpoint unless the operator deliberately selects a 2024-25 or earlier sandbox fixture.
- Required sandbox config values are documented.
- Required OAuth scopes and sandbox test-user setup are documented.
- Required Business Details, Obligations, and Self Employment endpoint inputs are documented.
- Required `WEB_APP_VIA_SERVER` fraud-prevention-header inputs are documented.
- QL-008 blocker/readiness docs now include a precise retry checklist.

## Blockers Still Open

- Real sandbox Developer Hub credentials are not present in source and were not supplied.
- Sandbox application API subscriptions still require human confirmation.
- Sandbox user-restricted OAuth token and test-user authority still require human setup.
- Exact sandbox NINO, business ID, tax year, period start date, and period end date still require human-supplied sandbox context.
- Real client-collected and server-derived `WEB_APP_VIA_SERVER` fraud-prevention values still require runtime collection or human-supplied run input.
- Test Fraud Prevention Headers API validation has not been run.
- No Income Tax MTD sandbox call is safe until the preflight passes.

## Files Changed

- `src/server/hmrc/preflight.ts`
- `tests/server/hmrc/preflight.test.ts`
- `docs/hmrc/SANDBOX_EVIDENCE_RUN.md`
- `docs/hmrc/SANDBOX_SETUP.md`
- `docs/hmrc/PRODUCTION_ACCESS_CHECKLIST.md`
- `docs/tickets/QL-008.md`
- `.agent/runs/QL-008-blocker-resolution-001.md`

## Checks

- `npm run typecheck` - passed.
- `npm run lint` - passed.
- `npm test` - passed, 22 tests.
- `npm run build` - passed.
- `git diff` - reviewed.
- `git diff --check` - passed.
