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

QL-007 deliberately rejects `HMRC_PRODUCTION_*` variables if they are present in the sandbox config source. Production HMRC calls are outside this ticket.

## Local Setup

1. Create or update an ignored `.env.local` file from `.env.example`.
2. Put real sandbox values only in `.env.local` or the deployment secret manager.
3. Do not put HMRC access tokens, refresh tokens, client secrets, PKCE verifiers, or authorisation codes in source files, browser storage, screenshots, logs, or evidence previews.
4. Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` after changing HMRC foundation code.

The current application UI still shows local/demo evidence only. It must not be treated as HMRC sandbox evidence.

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
