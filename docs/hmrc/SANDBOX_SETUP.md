# HMRC Sandbox Setup

Status: QL-007 Codex run output for human review
Last updated: 2026-05-12

## Purpose

This file documents the limited HMRC sandbox foundation introduced by QL-007.

QL-007 adds server-side request-construction, configuration validation, fraud-prevention-header assembly, and redaction helpers only. It does not create a full HMRC OAuth journey, does not store tokens, does not call HMRC, and does not send quarterly updates.

## Official Sources Checked

Checked on 2026-05-12:

- HMRC Developer Hub using the hub: `https://developer.service.hmrc.gov.uk/api-documentation/docs/using-the-hub`
- HMRC Developer Hub credentials: `https://developer.service.hmrc.gov.uk/api-documentation/docs/authorisation/credentials`
- HMRC user-restricted endpoint authorisation: `https://developer.service.hmrc.gov.uk/api-documentation/docs/authorisation/user-restricted-endpoints`
- HMRC Developer Hub terms of use: `https://developer.service.hmrc.gov.uk/api-documentation/docs/terms-of-use`
- HMRC Making Tax Digital for Income Tax end-to-end service guide: `https://developer.service.hmrc.gov.uk/guides/income-tax-mtd-end-to-end-service-guide/documentation/how-to-integrate.html`
- HMRC Income Tax MTD API catalogue: `https://developer.service.hmrc.gov.uk/api-documentation/docs/api?categoryFilters=INCOME_TAX_MTD`
- HMRC fraud prevention guidance: `https://developer.service.hmrc.gov.uk/guides/fraud-prevention/`
- HMRC web application via server fraud-prevention method: `https://developer.service.hmrc.gov.uk/guides/fraud-prevention/connection-method/web-app-via-server/`
- HMRC Test Fraud Prevention Headers API: `https://developer.service.hmrc.gov.uk/guides/fraud-prevention/test-api/`
- HMRC Income Tax MTD changelog: `https://github.com/hmrc/income-tax-mtd-changelog`
- HMRC Making Tax Digital for Income Tax service guide, making updates during the tax year: `https://developer.service.hmrc.gov.uk/guides/income-tax-mtd-end-to-end-service-guide/documentation/make-updates-during-tax-year.html`
- GOV.UK digital records guidance: `https://www.gov.uk/guidance/use-making-tax-digital-for-income-tax/create-digital-records`
- GOV.UK quarterly updates guidance: `https://www.gov.uk/guidance/use-making-tax-digital-for-income-tax/send-quarterly-updates`

Human verification is still required before QL-008 for exact live API versions, exact scopes, sandbox application subscriptions, redirect URI registration, deployment public IP/port behaviour, and current HMRC production-access questions.

## Environment Variables

Use `.env.local` for local development. It is ignored by git. Use the deployment provider's secret manager for deployed sandbox environments. Never commit real HMRC credentials or tokens.

| Variable | Required | Purpose | Commit real value? |
| --- | --- | --- | --- |
| `APP_ENV` | QL-007 | QuarterLink runtime environment. QL-007 supports `local` or `sandbox`; production is blocked. | No secret, but keep real deployment value in provider config. |
| `HMRC_ENV` | QL-007 | HMRC environment tag. QL-007 only allows `sandbox`. | No secret. |
| `HMRC_SANDBOX_API_BASE_URL` | QL-007 | HMRC sandbox API origin. Must be `https://test-api.service.hmrc.gov.uk`. | Placeholder only. |
| `HMRC_SANDBOX_AUTH_BASE_URL` | QL-007 | HMRC sandbox authorisation origin. Must be `https://test-www.tax.service.gov.uk`. | Placeholder only. |
| `HMRC_SANDBOX_CLIENT_ID` | QL-007 / QL-008 | Sandbox application client ID from HMRC Developer Hub. | No. |
| `HMRC_SANDBOX_CLIENT_SECRET` | QL-007 / QL-008 | Sandbox application client secret from HMRC Developer Hub. | Never. |
| `HMRC_SANDBOX_REDIRECT_URI` | QL-007 / QL-008 | Redirect URI registered on the HMRC sandbox application. Local HTTP localhost is allowed only for local development. | No. |
| `HMRC_SANDBOX_SCOPES` | QL-007 / QL-008 | Space-separated sandbox scopes for the approved first path. Exact scopes need human verification before QL-008. | No secret, but verify before use. |

QL-008 blocker-resolution update on 2026-05-12: the exact scopes required for the first retry are `read:self-assessment write:self-assessment` for Business Details, Obligations, and Self Employment Business. The Test Fraud Prevention Headers API is application-restricted and needs an OAuth bearer token from the sandbox application credentials flow, not a user-restricted taxpayer consent token.

The first retry must also provide these run-only sandbox context values outside source control:

| Variable | Purpose | Commit real value? |
| --- | --- | --- |
| `HMRC_SANDBOX_ACCESS_TOKEN` | Server-side user-restricted sandbox OAuth access token for the test user. | Never. |
| `HMRC_SANDBOX_TEST_USER_READY` | Explicit operator confirmation that the sandbox test user and authority setup are ready. | No. |
| `HMRC_SANDBOX_TEST_NINO` | Sandbox test user's National Insurance number. | No. |
| `HMRC_SANDBOX_SELF_EMPLOYMENT_BUSINESS_ID` | Self-employment business ID confirmed through Business Details or an official sandbox scenario. | No. |
| `HMRC_SANDBOX_TAX_YEAR` | Intended retry tax year. Use `2025-26` or later only with the cumulative endpoint. | No. |
| `HMRC_SANDBOX_PERIOD_START_DATE` | Intended quarterly update period start date. | No. |
| `HMRC_SANDBOX_PERIOD_END_DATE` | Intended quarterly update period end date. | No. |

QL-007 deliberately rejects `HMRC_PRODUCTION_*` variables if they are present in the sandbox config source. Production HMRC calls are outside this ticket.

## Local Setup

1. Create or update an ignored `.env.local` file from `.env.example`.
2. Put real sandbox values only in `.env.local` or the deployment secret manager.
3. Do not put HMRC access tokens, refresh tokens, client secrets, PKCE verifiers, or authorisation codes in source files, browser storage, screenshots, logs, or evidence previews.
4. Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` after changing HMRC foundation code.

The current application UI still shows local/demo evidence only. It must not be treated as HMRC sandbox evidence.

## QL-008 OAuth Readiness

The local OAuth readiness flow is sandbox-only and uses the individual sandbox test user path. It does not add product authentication, database storage, production endpoints, Business Details calls, Obligations calls, Self Employment Business calls, or Test Fraud Prevention Headers calls.

The local app now shows a visible HMRC sandbox connection card at:

`http://localhost:3000`

Use the card's `Connect to HMRC Sandbox` button when local configuration is complete. The button links to the existing sandbox OAuth start route:

`http://localhost:3000/api/hmrc/oauth/start`

Because full QuarterLink SaaS sign-in is not implemented yet, the local app includes a temporary `Continue as sandbox demo user` button. It sets an HTTP-only local cookie that works only when `APP_ENV=local` and `HMRC_ENV=sandbox`. It does not create real users, database records, HMRC tokens, or production authorisation. Outside that local sandbox mode, a real QuarterLink user must be signed in before connecting HMRC.

Register this exact redirect URI on the HMRC sandbox application:

`http://localhost:3000/api/hmrc/oauth/callback`

Set these local-only values before starting the OAuth journey:

```bash
APP_ENV=local
HMRC_ENV=sandbox
HMRC_SANDBOX_API_BASE_URL=https://test-api.service.hmrc.gov.uk
HMRC_SANDBOX_AUTH_BASE_URL=https://test-www.tax.service.gov.uk
HMRC_SANDBOX_CLIENT_ID=<sandbox-client-id>
HMRC_SANDBOX_CLIENT_SECRET=<sandbox-client-secret>
HMRC_SANDBOX_REDIRECT_URI=http://localhost:3000/api/hmrc/oauth/callback
HMRC_SANDBOX_SCOPES="read:self-assessment write:self-assessment"
HMRC_SANDBOX_TEST_USER_TYPE=individual
HMRC_SANDBOX_OAUTH_STATE=<local-random-opaque-state-at-least-16-chars>
HMRC_SANDBOX_OAUTH_SHOW_TOKENS=true
```

Use `HMRC_SANDBOX_OAUTH_SHOW_TOKENS=true` only while obtaining the local sandbox access token. The callback response displays the access token only in the local browser response and never writes it to source-controlled files. Do not commit the client secret, access token, refresh token, authorisation code, or HMRC test-user password.

Start the app locally and open:

`http://localhost:3000`

Click `Continue as sandbox demo user`, then click `Connect to HMRC Sandbox`. Sign in with an HMRC individual sandbox test user, not an organisation test user. After the callback returns an access token in the local browser response, set it only in the local shell as:

```bash
HMRC_SANDBOX_ACCESS_TOKEN=<access-token-from-local-callback>
HMRC_SANDBOX_TEST_USER_READY=true
```

Then rerun the QL-008 preflight. The preflight still requires taxpayer/business/period context and real fraud-prevention inputs before any Income Tax MTD sandbox call is safe.

The callback page is a local-only success/failure screen. It states that no HMRC submission was made, gives the preflight command, and either hides token display or shows the access token only when `HMRC_SANDBOX_OAUTH_SHOW_TOKENS=true` is set locally. It must not be copied into chat, docs, commits, logs, or run reports.

## Server Boundary

QL-007 code lives under `src/server/hmrc`. It is intended for server-side use only.

The config helper:

- fails closed when required sandbox settings are missing;
- rejects malformed URLs;
- accepts only the HMRC sandbox origins listed above;
- rejects production HMRC environment selection;
- avoids putting secret values into thrown error messages.

The client scaffold:

- constructs OAuth authorisation URLs without including the client secret;
- constructs sandbox request metadata without performing a network call;
- accepts bearer tokens only as server-side values;
- returns redacted safe metadata for tests and debug output;
- does not store access tokens or refresh tokens.

## Fraud-Prevention Headers

The QL-007 helper implements the `WEB_APP_VIA_SERVER` structure from the accepted QL-006 architecture.

Client-collected values are limited to browser/device/screen/window/timezone/MFA metadata. Server-derived values include public IP, public port, user IDs, forwarded hops, product name, vendor public IP, and vendor version.

The helper blocks when required data is missing or invalid. In particular:

- `Gov-Client-Multi-Factor` is required unless HMRC has agreed a missing-data approach.
- `Gov-Vendor-License-IDs` is required unless HMRC has agreed a missing-data approach.
- public IP and public port must come from trusted server/deployment data, not client input.
- placeholder strings such as `null` or `undefined` are rejected.

Redacted helper output exposes header presence and safe labels, not raw device IDs, public IPs, forwarded chains, tokens, or secrets.

Before the QL-008 retry, real `WEB_APP_VIA_SERVER` values must exist for every required header:

- `Gov-Client-Connection-Method`
- `Gov-Client-Browser-JS-User-Agent`
- `Gov-Client-Device-ID`
- `Gov-Client-Multi-Factor`, unless HMRC has explicitly accepted a missing-data approach
- `Gov-Client-Public-IP`
- `Gov-Client-Public-IP-Timestamp`
- `Gov-Client-Public-Port`
- `Gov-Client-Screens`
- `Gov-Client-Timezone`
- `Gov-Client-User-IDs`
- `Gov-Client-Window-Size`
- `Gov-Vendor-Forwarded`
- `Gov-Vendor-License-IDs`, unless HMRC has explicitly accepted a missing-data approach
- `Gov-Vendor-Product-Name`
- `Gov-Vendor-Public-IP`
- `Gov-Vendor-Version`

The Test Fraud Prevention Headers API must validate the assembled `Gov-*` headers before any Income Tax MTD sandbox call.

## QL-008 Endpoint Decision

Checked on 2026-05-12 from HMRC Developer Hub OpenAPI definitions:

- Business Details (MTD) 2.0: `GET /individuals/business/details/{nino}/list`, scope `read:self-assessment`.
- Obligations (MTD) 3.0: `GET /obligations/details/{nino}/income-and-expenditure`, scope `read:self-assessment`.
- Self Employment Business (MTD) 5.0 for 2024-25 or earlier: `POST /individuals/business/self-employment/{nino}/{businessId}/period`, scope `write:self-assessment`.
- Self Employment Business (MTD) 5.0 for 2025-26 onwards: `PUT /individuals/business/self-employment/{nino}/{businessId}/cumulative/{taxYear}`, scope `write:self-assessment`; `GET` on the same path uses `read:self-assessment`.

The first QL-008 retry should use the 2025-26 onward cumulative endpoint only if the selected sandbox test user, obligations response, and fixture period are all for tax year 2025-26 or later. If the operator intentionally chooses a 2024-25 sandbox fixture, the retry must use the 2024-25 period summary endpoint instead.

The HMRC Income Tax MTD changelog supports this decision. Entries relied on:

| Date | API | Change summary used for QL-008 |
| --- | --- | --- |
| 24 July 2024 | Self Employment Business API v3.0 | Period summary endpoints no longer accept data for tax years 2025-26 onwards. |
| 11 December 2024 | Self Employment Business API v4.0 sandbox | Self-employment cumulative period summary endpoints were created for tax years 2025-26 onwards; period summary endpoints no longer accept data for tax years 2025-26 onwards. |
| 11 December 2024 | Obligations API v3.0 sandbox | Added `CUMULATIVE` `Gov-Test-Scenario` and cumulative sandbox dates for income and expenditure obligations. |
| 24 March 2025 | Self Employment Business API v5.0 sandbox | Version 5.0 was added in sandbox and includes the Self-Employment Cumulative Period Summary endpoint family. |
| 14 April 2025 | Self Employment Business API v4.0 production | The same 2025-26 onward cumulative endpoint direction was promoted to production for v4.0. |
| 30 May 2025 | Self Employment Business API v4.0 and v5.0 sandbox | `STATEFUL` sandbox scenario support for Create or Amend a Self-Employment Cumulative Period Summary is limited to standard cumulative quarterly updates where no `commencementDate` is present. |
| 24 March 2026 | Self Employment Business API v5.0 production | Version 5.0 was updated in production and still includes Create and Amend a Self-Employment Cumulative Period Summary; the entry changes that endpoint's success code from `200` to `204`. |

Later v5.0 entries checked on 22 April 2026 and 12 May 2026 relate to annual-submission field deprecations and do not change the quarterly update path.

This setup remains Making Tax Digital for Income Tax bridging-only readiness. It does not add bookkeeping, final declaration, production access, spreadsheet parsing, authentication, database storage, or HMRC API calls.

## Evidence Separation

Current local/demo workflow evidence remains local/demo only.

HMRC sandbox evidence may only be recorded after actual HMRC sandbox responses are received in a later approved ticket. No sandbox evidence was created during QL-007.

Production evidence is outside QL-007.

## Deferred Items

- Real OAuth start route and callback handling.
- Server-side state/PKCE storage.
- Token exchange, refresh, encryption, storage, and disconnect handling.
- Test Fraud Prevention Headers API calls.
- Business Details, Obligations, Self Employment Business, or Property Business API calls.
- Spreadsheet parsing.
- Real quarterly update sending.
- Database migrations and persistent audit/evidence records.
