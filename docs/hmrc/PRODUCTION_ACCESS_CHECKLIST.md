# HMRC Production-Access Checklist

Status: QL-003 Codex draft for human review
Last updated: 2026-05-12

## Purpose

This is QuarterLink's preparation checklist for a later HMRC Developer Hub production-access application.

It is not evidence of production readiness, HMRC recognition, or HMRC approval. The actual HMRC Production Approvals Checklist and Developer Hub questions must be completed from the live HMRC process when QuarterLink is ready to apply.

## Source Snapshot

Official guidance checked on 2026-05-12:

- Developer Hub getting started and production credentials: `https://developer.service.hmrc.gov.uk/api-documentation/docs/using-the-hub`
- Developer Hub terms of use: `https://developer.service.hmrc.gov.uk/api-documentation/docs/terms-of-use`
- Developer Hub application naming guidelines: `https://developer.service.hmrc.gov.uk/api-documentation/docs/name-guidelines`
- Developer Hub authorisation guide: `https://developer.service.hmrc.gov.uk/api-documentation/docs/authorisation/user-restricted-endpoints`
- Developer Hub credentials guide: `https://developer.service.hmrc.gov.uk/api-documentation/docs/authorisation/credentials`
- Fraud prevention guide: `https://developer.service.hmrc.gov.uk/guides/fraud-prevention`
- Test Fraud Prevention Headers guidance: `https://developer.service.hmrc.gov.uk/guides/fraud-prevention/test-api/`
- Making Tax Digital for Income Tax service guide: `https://developer.service.hmrc.gov.uk/guides/income-tax-mtd-end-to-end-service-guide/documentation/how-to-integrate.html`
- Income Tax MTD API catalogue: `https://developer.service.hmrc.gov.uk/api-documentation/docs/api?categoryFilters=INCOME_TAX_MTD`
- GOV.UK digital records guidance: `https://www.gov.uk/guidance/use-making-tax-digital-for-income-tax/create-digital-records`
- GOV.UK quarterly updates guidance: `https://www.gov.uk/guidance/use-making-tax-digital-for-income-tax/send-quarterly-updates`
- GOV.UK recognised software search guidance: `https://www.gov.uk/guidance/find-software-that-works-with-making-tax-digital-for-income-tax`

## Checklist

| Area | QuarterLink readiness item | Status |
| --- | --- | --- |
| Developer Hub account | Register and maintain a developer account with responsible individuals. | Not started |
| Sandbox app | Create sandbox application, subscribe to the required Income Tax MTD APIs, and record app ID outside source control. | Not started |
| Production app | Create production application only when ready; use a user-recognisable name and do not include HMRC in the application name. | Later |
| Terms of use | Prepare responses for organisation details, development practices, service management, personal data, SaaS security, fraud prevention data, and customer authorisation. | Not started |
| Organisation evidence | Prepare official organisation evidence requested by HMRC. | Human verification needed |
| Privacy and terms URLs | Publish privacy policy and terms and conditions covering the software requesting credentials. | Not started |
| Sandbox credentials | Store sandbox client ID and client secret securely; never commit credentials. | Not started |
| Secret rotation | Define client secret rotation and incident process. | Not started |
| OAuth | Implement user-restricted OAuth using HMRC's authorisation journey; do not bypass it. | Not started |
| OAuth consent | Tell users they are connecting QuarterLink to HMRC and granting permission for defined scopes. | Not started |
| HMRC sign-in details | Do not store HMRC user IDs, passwords, authorisation codes, access tokens, or refresh tokens in logs. | Not started |
| Token storage | Encrypt access and refresh tokens at rest; keep token exchange server-side. | Not started |
| Reconnection | Handle access-token expiry, single-use refresh tokens, and re-authorisation after refresh expiry. | Not started |
| Fraud prevention method | Record the connection method as web application via server unless architecture changes. | Not started |
| Fraud prevention data | Collect and send all required headers for the connection method, with no placeholder values. | Not started |
| Fraud prevention test | Use the Test Fraud Prevention Headers API before sending header data to Income Tax MTD APIs. | Not started |
| Header status | Treat Developer Hub fraud-prevention status as internal evidence only, not a marketing claim. | Not started |
| Required APIs | Narrow path uses Business Details, Obligations, and Self Employment Business APIs first. | Not started |
| API versions | Re-check latest API versions immediately before implementation and production application. | Human verification needed |
| Sandbox test user | Create or obtain suitable sandbox test users for an individual taxpayer with one self-employment. | Not started |
| Digital-link evidence | Capture source filename, hash, mapping version, sheet/cell references, imported totals, validation result, and confirmation timestamp. | Not started |
| Read-only totals | Keep imported and submitted monetary totals immutable except through a new import from the source spreadsheet. | Not started |
| Quarterly update evidence | Capture obligation, period, income source, payload hash, endpoint/version, request/correlation IDs where available, response, and status. | Not started |
| Declaration wording | Use a quarterly-update declaration only; do not describe the action as filing a tax return. | Draft needed |
| Error handling | Evidence handling for validation errors, denied authorisation, expired tokens, unauthorised responses, rate limits, and HMRC service errors. | Not started |
| Audit trail | Append-only audit events for connect, import, review, declaration, send attempt, response, evidence export, and support access. | Not started |
| Support boundaries | Support access must be consent-bound, audited, read-only where possible, and unable to send updates or edit figures. | Not started |
| Data retention | Define retention for submission evidence, audit logs, file hashes, uploaded files, and deletion/export requests. | Human/legal verification needed |
| Accessibility | Web app must be checked against applicable accessibility expectations before production application. | Not started |
| Security | Prepare evidence for SaaS security, access control, encryption, incident reporting, and penetration testing expectations. | Not started |
| Public wording | Website must say QuarterLink is being built until live capability and HMRC status are evidenced. | Not started |
| Recognition claims | Do not claim HMRC recognition unless and until the required HMRC process has been completed and evidenced. | Blocked |
| HMRC logos | Do not use HMRC logos or government-style naming unless explicitly allowed by current HMRC rules. | Blocked |

## QL-008 Sandbox Readiness Update

Checked on 2026-05-12 during QL-008.

QL-008 ran the preflight gate and stopped before any HMRC sandbox call. No HMRC sandbox evidence was created.

| Area | QL-008 result |
| --- | --- |
| Current API versions | Verified for this run: Business Details (MTD) 2.0, Obligations (MTD) 3.0, Self Employment Business (MTD) 5.0, Test Fraud Prevention Headers 1.0. |
| Endpoint caveat | Resolved for retry planning: Self Employment Business 5.0 period summary is for tax year 2024-25 or earlier; HMRC Developer Hub and the Income Tax MTD changelog point to the cumulative period summary endpoint for 2025-26 onwards. The sandbox tax year and fixture must still be confirmed before any call. |
| Sandbox config | Blocked: required HMRC sandbox environment variables were not available to the preflight process. |
| Sandbox credentials | Blocked: no sandbox client ID/secret was available to the preflight process. No secret value was displayed. |
| OAuth/test user | Blocked: no server-side sandbox access token, test-user authority confirmation, or OAuth readiness evidence was available. |
| Fraud prevention headers | Blocked: no real `WEB_APP_VIA_SERVER` client/server fraud-prevention inputs were available. |
| Test Fraud Prevention Headers API | Not called because the fraud-prevention-header preflight failed. |
| Business Details / Obligations / Self Employment calls | Not called because the preflight failed. |
| Evidence classification | Local/demo blocked readiness report only; not HMRC sandbox evidence and not production evidence. |

QL-008 blocker-resolution note on 2026-05-12: if the first retry targets tax year `2025-26` or later, prepare `PUT /individuals/business/self-employment/{nino}/{businessId}/cumulative/{taxYear}` from Self Employment Business (MTD) API 5.0. Use `POST /individuals/business/self-employment/{nino}/{businessId}/period` only for an explicitly selected `2024-25` or earlier sandbox fixture. This remains Making Tax Digital for Income Tax bridging-only readiness and does not add final declaration, bookkeeping, production access, auth, database storage, or HMRC API calls.

HMRC changelog entries relied on for that endpoint decision:

| Date | API | Change summary used for QL-008 |
| --- | --- | --- |
| 24 July 2024 | Self Employment Business API v3.0 | Period summary endpoints no longer accept data for tax years 2025-26 onwards. |
| 11 December 2024 | Self Employment Business API v4.0 sandbox | Self-employment cumulative period summary endpoints were created for tax years 2025-26 onwards; period summary endpoints no longer accept data for tax years 2025-26 onwards. |
| 11 December 2024 | Obligations API v3.0 sandbox | Added `CUMULATIVE` `Gov-Test-Scenario` and cumulative sandbox dates for income and expenditure obligations. |
| 24 March 2025 | Self Employment Business API v5.0 sandbox | Version 5.0 was added in sandbox and includes the Self-Employment Cumulative Period Summary endpoint family. |
| 14 April 2025 | Self Employment Business API v4.0 production | The same 2025-26 onward cumulative endpoint direction was promoted to production for v4.0. |
| 30 May 2025 | Self Employment Business API v4.0 and v5.0 sandbox | `STATEFUL` sandbox scenario support for Create or Amend a Self-Employment Cumulative Period Summary is limited to standard cumulative quarterly updates where no `commencementDate` is present. |
| 24 March 2026 | Self Employment Business API v5.0 production | Version 5.0 was updated in production and still includes Create and Amend a Self-Employment Cumulative Period Summary; the entry changes that endpoint's success code from `200` to `204`. |

## Production-Access Blockers

Do not apply for production credentials while any of these remain true:

- no real sandbox evidence for the supported path
- no OAuth implementation for user-restricted endpoints
- no fraud prevention headers or Test Fraud Prevention Headers API result
- no secure token and client-secret storage
- no privacy policy or terms and conditions URL
- no error handling evidence
- no audit trail for imports, declarations, send attempts, and HMRC responses
- no digital-link evidence for Route B
- support staff can send quarterly updates or edit imported figures
- public copy claims HMRC approval, recognition, production readiness, or live submission capability without evidence
- app name, website, or marketing implies government status

## Human Verification Required

Before any production-access application, a human must verify:

- current HMRC Production Approvals Checklist wording and Developer Hub questions
- current Income Tax MTD API versions and endpoint availability
- whether the exact first-slice scope is acceptable for the requested access stage
- current process for appearing in GOV.UK software search/listing
- privacy, retention, terms, and declaration wording
- whether any additional HMRC testing evidence is required beyond sandbox API calls

## Current Position

QuarterLink has not built HMRC OAuth, HMRC API calls, fraud prevention headers, sandbox evidence capture, production credentials, or recognised-software evidence.

The next recommended action is QL-004: build the guided app workspace with static/local state only.
