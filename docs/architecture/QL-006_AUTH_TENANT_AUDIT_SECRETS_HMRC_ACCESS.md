# QL-006 Auth, Tenant, Audit, Secrets And HMRC Access Architecture

Status: QL-006 Codex draft for human review
Last updated: 2026-05-12

## Purpose

This document defines the minimum security and access architecture QuarterLink needs before real HMRC sandbox API work starts.

It is architecture only. It does not implement authentication, database persistence, HMRC OAuth, HMRC API calls, spreadsheet parsing, quarterly update submission, billing, practice workflows, or production evidence generation.

## Official Guidance Checked

Checked on 2026-05-12:

- HMRC Developer Hub getting started: `https://developer.service.hmrc.gov.uk/api-documentation/docs/using-the-hub`
- HMRC Developer Hub terms of use: `https://developer.service.hmrc.gov.uk/api-documentation/docs/terms-of-use`
- HMRC Developer Hub credentials: `https://developer.service.hmrc.gov.uk/api-documentation/docs/authorisation/credentials`
- HMRC user-restricted endpoint authorisation: `https://developer.service.hmrc.gov.uk/api-documentation/docs/authorisation/user-restricted-endpoints`
- HMRC Making Tax Digital for Income Tax service guide: `https://developer.service.hmrc.gov.uk/guides/income-tax-mtd-end-to-end-service-guide/documentation/how-to-integrate.html`
- HMRC Income Tax MTD API catalogue: `https://developer.service.hmrc.gov.uk/api-documentation/docs/api?categoryFilters=INCOME_TAX_MTD`
- HMRC fraud prevention headers: `https://developer.service.hmrc.gov.uk/guides/fraud-prevention/`
- HMRC web application via server fraud header method: `https://developer.service.hmrc.gov.uk/guides/fraud-prevention/connection-method/web-app-via-server/`
- HMRC Test Fraud Prevention Headers API guidance: `https://developer.service.hmrc.gov.uk/guides/fraud-prevention/test-api/`
- GOV.UK digital records guidance: `https://www.gov.uk/guidance/use-making-tax-digital-for-income-tax/create-digital-records`
- GOV.UK quarterly updates guidance: `https://www.gov.uk/guidance/use-making-tax-digital-for-income-tax/send-quarterly-updates`

Human verification is still required for the exact current HMRC Production Approvals Checklist wording, live API versions, deployment provider header behaviour, legal/privacy wording, and final retention periods.

## Minimum Architecture Decision

For the first sandbox-readiness path, QuarterLink should use:

- one individual taxpayer user
- one individual tenant owned by that user
- one taxpayer profile under that tenant
- one self-employment income source
- one HMRC connection per taxpayer profile
- one Route B import/evidence path per quarterly update period
- server-side-only HMRC token handling
- append-only audit events for all high-risk workflow steps

Practice, agent, delegated-user, billing, and platform-admin features must not be mixed into the first slice. Data structures should be shaped so those later tenancy types can be added without changing the individual-user security boundary.

## User And Tenant Model

First slice:

| Concept | QL-006 decision |
| --- | --- |
| User type | Individual taxpayer only. |
| Tenant boundary | One `individual` tenant per user account. |
| Taxpayer profile | One taxpayer profile owned by the tenant. |
| Income source | One self-employment income source first. |
| HMRC connection | Scoped to tenant + taxpayer profile, not to a browser session. |
| Route B imports | Scoped to tenant + taxpayer + income source + tax year + update period. |
| Submissions | Scoped to tenant + taxpayer + income source + obligation/update period. |

Tenant-scoped from day one:

- user membership
- taxpayer profile
- HMRC connection status and tokens
- income source records
- Route B import batches and lines
- evidence reviews
- declaration records
- send attempts and HMRC responses
- audit events
- support access records

Future practice tenancy:

- Practice and agent concepts stay deferred.
- Practice users must later access clients through explicit assignments.
- Practice support must not reuse the individual tenant owner shortcut.
- Platform/support access must be consent-bound, time-limited, read-only where possible, and unable to send quarterly updates or edit imported figures.

## Auth And Session Model

Recommended MVP auth approach:

- Use first-party web auth for QuarterLink user accounts before any HMRC token is stored.
- Store sessions server-side or in signed/encrypted HTTP-only secure cookies backed by server validation.
- Use SameSite cookies and CSRF protection for state-changing routes.
- Require email verification before HMRC connection.
- Require password reset and session revocation before public users.
- Use rate limiting on sign-in, password reset, HMRC connect, declaration, and send attempts.

MFA stance:

- Before production/public users: MFA should be required for platform/admin roles and strongly preferred for all users.
- Before HMRC quarterly update sending in production: require step-up MFA or recent re-authentication for high-risk actions.
- For the first sandbox foundation: record MFA architecture and fraud-header impact even if MFA UI is not yet implemented.

Before any real HMRC OAuth token is stored:

- a real authenticated QuarterLink user must exist
- the user must belong to exactly one individual tenant
- the session must be server-verifiable
- the tenant and taxpayer profile IDs must be derived server-side
- the OAuth state/PKCE verifier must be stored server-side or in an encrypted HTTP-only cookie
- audit logging must be available
- token encryption-at-rest must be implemented

Deferred until production hardening:

- delegated individual users
- practice users and client assignments
- platform admin UI
- full device/session management UI
- full incident response automation

## HMRC OAuth And Token Handling

HMRC user-restricted endpoints use OAuth 2.0 Authorization Code Grant. QuarterLink must not change or bypass HMRC's authorisation journey.

Requirements:

- OAuth start happens server-side.
- OAuth callback validates `state` and tenant/user context.
- Use PKCE where supported, with server-held verifier.
- Exchange authorisation code server-side only.
- Never expose access tokens, refresh tokens, authorisation codes, client secrets, or PKCE verifiers to client components.
- Store HMRC access tokens and refresh tokens encrypted at rest.
- Store token metadata separately from token secret material:
  - environment
  - scopes
  - expiry
  - connection status
  - HMRC account type when known
  - created/updated timestamps
  - last refresh result
- Treat refresh tokens as single-use and guard refresh with a per-connection lock.
- On disconnect, mark the connection disconnected, delete or render token material unusable, and write an audit event.
- On refresh failure or 401 from HMRC, do not loop indefinitely. Mark reconnection required and audit the failure without logging tokens.

Environment separation:

- Local: no real HMRC credentials committed; sandbox credentials only via local ignored environment files or secret manager.
- Sandbox: sandbox app credentials, sandbox redirect URI, sandbox base URLs, explicit `sandbox` environment tag.
- Production: separate production application, production credentials, production redirect URI, production base URLs, and no fallback to sandbox defaults.

## Secrets And Environment Variables

Secret categories:

- HMRC sandbox client ID and client secret
- HMRC production client ID and client secret
- session signing/encryption secret
- token encryption key or KMS key reference
- CSRF/state signing secret
- database connection string when persistence exists
- deployment platform secret references
- log/telemetry provider keys when approved later

Rules:

- Do not commit secrets or `.env` files.
- Do not put secrets in browser bundles, client components, analytics, console logs, downloadable evidence, or screenshots.
- Validate required environment variables at startup before enabling HMRC routes.
- Fail closed if the environment is ambiguous, missing, or mixes sandbox and production values.
- Rotate HMRC client secrets regularly and immediately after suspected exposure.
- Keep local development examples limited to placeholder names in an ignored `.env.local` pattern or future `.env.example`.
- For Railway or another deployment provider, secrets must be configured in provider-managed environment variables, not in source files.

Fail-fast checks needed before QL-007:

- `APP_ENV` is one of `local`, `sandbox`, `production`.
- `HMRC_ENV` matches `APP_ENV` for HMRC-enabled routes.
- HMRC client ID and secret are present for sandbox only when sandbox routes are enabled.
- redirect URI matches the Developer Hub application.
- session secret and token encryption key are present and strong enough.
- logging redaction rules are active.

## Audit Event Catalogue

| Event | Trigger | Actor | Scope | Required metadata | Never store | Gate |
| --- | --- | --- | --- | --- | --- | --- |
| `auth.sign_in.succeeded` | User signs in | User | Tenant | session id hash, IP hash, user agent hash, timestamp | password, raw IP if not needed | Before sandbox |
| `auth.sign_in.failed` | Failed sign-in | Unknown/user | None or tenant if known | email hash, reason code, IP hash, timestamp | password, full credential | Before sandbox |
| `auth.sign_out` | User signs out | User | Tenant | session id hash, timestamp | session secret | Before sandbox |
| `hmrc.oauth.start` | User starts HMRC connection | User | Tenant, taxpayer | scopes, redirect URI id, state id hash, environment | client secret, state value, PKCE verifier | Before sandbox |
| `hmrc.oauth.callback.succeeded` | Callback validates and token stored | User/system | Tenant, taxpayer | scopes, token expiry, connection id, environment | code, tokens, client secret | Before sandbox |
| `hmrc.oauth.callback.failed` | Callback denied or invalid | User/system | Tenant if known | error code, state id hash, environment | code, tokens | Before sandbox |
| `hmrc.connection.refreshed` | Token refresh succeeds | System | Tenant, taxpayer | connection id, old/new expiry, environment | refresh token, access token | Before sandbox |
| `hmrc.connection.refresh_failed` | Refresh fails | System | Tenant, taxpayer | error category, reconnection flag | refresh token, access token | Before sandbox |
| `hmrc.connection.disconnected` | User disconnects HMRC | User | Tenant, taxpayer | connection id, reason, timestamp | deleted token values | Before sandbox |
| `route_b.import.created` | Import placeholder becomes real later | User | Tenant, taxpayer, income source | file name, size, hash, mapping version, period | full spreadsheet by default | Before sandbox if import exists |
| `route_b.import.replaced` | Re-import/correction | User | Tenant, taxpayer, income source | old/new import ids, hash, mapping version | full spreadsheet by default | Before sandbox if import exists |
| `evidence.reviewed` | User reviews evidence | User | Tenant, taxpayer, income source | evidence bundle id, version, period | token/header secrets | Before sandbox |
| `declaration.accepted` | User accepts declaration | User | Tenant, taxpayer, income source | wording version, timestamp, period | browser token data | Before send |
| `quarterly_update.send_attempted` | Send requested | User | Tenant, taxpayer, income source | obligation id, import id, declaration id, payload hash | tokens, raw client secret | Before send |
| `quarterly_update.send_succeeded` | HMRC returns success | System | Tenant, taxpayer, income source | endpoint/version, correlation id, response status, payload hash | access token | Before send |
| `quarterly_update.send_failed` | HMRC returns error/failure | System | Tenant, taxpayer, income source | endpoint/version, error category/code, correlation id | access token, sensitive body data | Before send |
| `support.access.requested` | Support access requested | Support/user | Tenant/taxpayer | requester, reason, duration, consent state | private support notes unrelated to request | Production hardening |
| `support.access.denied` | Support access denied | User/system | Tenant/taxpayer | requester, reason category | sensitive notes | Production hardening |
| `security.config.changed` | Security/HMRC config changes | Admin/system | Platform | config key name, old/new hash, actor, timestamp | secret value | Before sandbox for HMRC config |

Audit storage:

- append-only
- server-written only
- tenant-scoped
- immutable for business events
- redacted by default
- exportable only through approved evidence/export routes later

## Consent And Declaration Records

Before HMRC connection:

- capture that the user chose to connect QuarterLink to HMRC
- store consent wording version
- store scopes requested
- store timestamp, tenant, taxpayer, and actor
- record that HMRC sign-in happens with HMRC and QuarterLink does not store HMRC sign-in details

Before sending a quarterly update:

- capture evidence-review acknowledgement
- capture declaration wording version
- capture authority to send for the selected taxpayer/income source/period
- capture timestamp and user/session context
- link the declaration to import batch/evidence bundle

Human verification required:

- exact consent wording
- exact declaration wording
- privacy notice wording
- retention period for consent/declaration records

## What Must Never Be Exposed To The Browser

Never expose these to client components, browser local storage, console logs, analytics, downloadable evidence bundles, screenshots, or client-side error payloads:

- HMRC client secret
- HMRC access token
- HMRC refresh token
- HMRC authorisation code
- PKCE verifier
- encryption keys
- session signing/encryption secrets
- CSRF/state signing secrets
- raw secret environment variables
- raw database credentials
- unredacted fraud-prevention metadata where inappropriate
- raw support/admin notes
- unrelated tenant or taxpayer data
- raw HMRC error payloads containing sensitive identifiers unless redacted and explicitly approved

Client-visible data should be limited to status, safe labels, redacted identifiers, and user-action prompts.

## Required Before Sandbox API Testing

Must exist before QL-007 can make real HMRC sandbox calls:

- accepted QL-006 architecture
- accepted fraud-prevention-header architecture
- individual tenant boundary implementation plan
- authenticated user/session implementation plan
- server-side OAuth state/PKCE storage plan
- encrypted token storage plan
- secret/env validation plan
- audit event minimum catalogue accepted
- consent/declaration minimum accepted
- redaction/logging rules accepted
- sandbox Developer Hub app and redirect URI details available outside source control
- Test Fraud Prevention Headers API plan
- explicit no-claim rule for HMRC recognition, production access, or sandbox evidence until actual calls exist

Can wait until production hardening:

- practice tenancy
- billing/entitlements
- platform admin UI
- full evidence export UI
- support access UI
- penetration testing execution
- full incident response automation
- production terms/privacy publication

## QL-007 Readiness Gate

QL-007 must not start real HMRC sandbox foundation work until this checklist is true:

- auth/session decision accepted
- tenant boundary accepted
- token-storage approach accepted
- secrets approach accepted
- fraud-prevention-header architecture accepted
- audit-event minimum accepted
- consent/declaration minimum accepted
- HMRC guidance verification items recorded
- environment separation plan accepted
- no HMRC recognised or production-ready claims added
- no product code drift from the local/demo workflow boundary

## Human Verification Items

- Current HMRC Production Approvals Checklist wording.
- Exact live API versions and scopes needed for the first self-employment in-year path.
- Whether the deployment stack can collect `Gov-Client-Public-IP`, `Gov-Client-Public-Port`, and full forwarded-chain data.
- Final consent, declaration, privacy, retention, and support-access wording.
- Whether production MFA must be mandatory for all users or only high-risk actions.
