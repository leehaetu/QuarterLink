# Fraud Prevention Headers Architecture

Status: QL-006 Codex draft for human review
Last updated: 2026-05-12

## Purpose

This document defines QuarterLink's intended fraud-prevention-header architecture for HMRC Making Tax Digital for Income Tax API calls.

It is architecture only. It does not implement header collection, HMRC OAuth, HMRC API calls, sandbox evidence, or production access.

## Official HMRC Sources Checked

Checked on 2026-05-12:

- HMRC fraud prevention overview: `https://developer.service.hmrc.gov.uk/guides/fraud-prevention/`
- HMRC connection methods: `https://developer.service.hmrc.gov.uk/guides/fraud-prevention/connection-method/`
- HMRC web application via server method: `https://developer.service.hmrc.gov.uk/guides/fraud-prevention/connection-method/web-app-via-server/`
- HMRC Test Fraud Prevention Headers API: `https://developer.service.hmrc.gov.uk/guides/fraud-prevention/test-api/`
- HMRC getting it right / missing header data: `https://developer.service.hmrc.gov.uk/guides/fraud-prevention/getting-it-right/`
- HMRC Making Tax Digital for Income Tax service guide: `https://developer.service.hmrc.gov.uk/guides/income-tax-mtd-end-to-end-service-guide/documentation/how-to-integrate.html`

## Connection Method Decision

For the first QuarterLink SaaS path, use:

```text
Gov-Client-Connection-Method: WEB_APP_VIA_SERVER
```

Reason:

- QuarterLink is a web application.
- Browser users initiate the quarterly update action.
- Server-side QuarterLink services will call HMRC.
- HMRC token and client-secret handling must stay server-side.

If the deployment architecture changes, the connection method must be re-verified before QL-007 makes sandbox calls.

## Header Responsibility Split

Client-collected values:

- browser JavaScript user agent
- device ID stored in a secure first-party cookie or equivalent approved browser storage
- screen information
- browser window size
- local timezone
- latest successful QuarterLink MFA prompt metadata, once MFA exists

Server-derived values:

- client public IP, from trusted request/network layer only
- client public IP timestamp
- client public port, where the platform can provide it
- vendor public IP
- forwarded chain across QuarterLink-controlled internet hops
- product name
- vendor version
- user identifiers from authenticated server-side identity
- hashed licence/customer reference if required later

Never trust client input alone for:

- public IP
- public port
- forwarded chain
- user identity
- tenant identity
- taxpayer identity
- HMRC scopes
- token or connection status

## Required Web Application Via Server Header Set

QL-007 must implement or explicitly block on every required header for the chosen connection method:

| Header | Source | QL-006 decision |
| --- | --- | --- |
| `Gov-Client-Connection-Method` | Server constant | Always `WEB_APP_VIA_SERVER`. |
| `Gov-Client-Browser-JS-User-Agent` | Browser | Collect through client-side script and send to server. |
| `Gov-Client-Device-ID` | Browser/server issued | Generate UUID and persist for the originating device. |
| `Gov-Client-Multi-Factor` | Auth/session | Include when MFA exists; missing-data handling must be agreed if MFA is absent. |
| `Gov-Client-Public-IP` | Trusted edge/server | Derive from trusted deployment headers only. |
| `Gov-Client-Public-IP-Timestamp` | Server/edge | Capture when public IP is collected. |
| `Gov-Client-Public-Port` | Trusted edge/server | Must verify deployment support; do not spoof. |
| `Gov-Client-Screens` | Browser | Collect screen width, height, scaling factor, colour depth. |
| `Gov-Client-Timezone` | Browser | Collect UTC offset. |
| `Gov-Client-User-IDs` | Server identity | Derive from authenticated QuarterLink user IDs. |
| `Gov-Client-Window-Size` | Browser | Collect browser viewport width and height. |
| `Gov-Vendor-Forwarded` | Trusted edge/server | Build from QuarterLink-controlled internet hops. |
| `Gov-Vendor-License-IDs` | Server/commercial state | For MVP, likely unavailable; verify missing-data approach with HMRC if required. |
| `Gov-Vendor-Product-Name` | Server constant | `QuarterLink`, percent-encoded. |
| `Gov-Vendor-Public-IP` | Deployment config | Public IP of server/load balancer/WAF endpoint. |
| `Gov-Vendor-Version` | Build metadata | App/package version and deployed component versions. |

## Assembly Flow

1. Browser collects allowed device/browser values during the user action.
2. Browser submits them to QuarterLink server with the user action.
3. Server validates the authenticated user, tenant, taxpayer, and income-source scope.
4. Server derives IP, port, forwarded chain, user IDs, product, and version.
5. Server rejects the HMRC call if required fraud data is missing and no documented missing-data handling approach agreed with HMRC exists.
6. Server assembles headers immediately before calling HMRC.
7. Server records an audit event with header-status metadata only, not raw sensitive header values.
8. Server sends headers to the Test Fraud Prevention Headers API before any Income Tax MTD API sandbox call.

## Logging And Redaction Rules

Allowed in logs/audit metadata:

- whether each required header was present
- validation status from Test Fraud Prevention Headers API
- connection method
- redacted or hashed user/device references
- environment (`sandbox` or `production`)
- correlation/request IDs where safe

Do not log:

- HMRC access token
- HMRC refresh token
- HMRC client secret
- full public IP address unless a retention/privacy decision explicitly allows it
- raw device ID
- raw user identifiers when a stable hash is enough
- full forwarded chain in general application logs
- raw browser fingerprint values outside the fraud-header assembly path

Evidence packs should reference a fraud-header evidence record by ID and status, not include raw header values by default.

## Environment Differences

Local:

- No real HMRC calls.
- Header collection may be previewed only.
- Missing public IP/port must not be faked.

Sandbox:

- Use sandbox HMRC base URLs and sandbox app credentials.
- Send real fraud-prevention headers with sandbox calls.
- Use Test Fraud Prevention Headers API before Income Tax MTD API calls.
- Label resulting evidence as HMRC sandbox evidence only after actual HMRC sandbox API calls.

Production:

- Use production app credentials and production base URLs only after access is granted.
- Monitor fraud-header status in Developer Hub.
- Do not share internal fraud-header status publicly.

## Fallback And Error Behaviour

- If required header data is missing, block the HMRC call by default.
- Do not send placeholder values such as `null`, `undefined`, or guessed IP/port values.
- If deployment restrictions prevent collecting a value, record the restriction and require human/HMRC verification before proceeding.
- If Test Fraud Prevention Headers API reports missing, invalid, error, or advisory status, do not proceed to Income Tax MTD API sandbox calls until reviewed.
- If the user action is batch-like but user-initiated, keep the originating device as the user's device, not the server.

## Required Before QL-007 Can Make HMRC Sandbox Calls

- Connection method accepted as `WEB_APP_VIA_SERVER`.
- Deployment path documented, including WAF/load balancer/proxy hops.
- Client collection script designed for user agent, screen, window, timezone, and device ID.
- Server derivation design accepted for IP, port, forwarded chain, user IDs, product name, vendor IP, and version.
- Redaction rules implemented before logging any header-related data.
- Test Fraud Prevention Headers API integration plan accepted.
- Missing-data decision recorded for MFA and licence IDs if not implemented.
- Human verification completed for deployment support of public IP and public port.

## Human Verification Items

- Whether the chosen deployment provider exposes the client public IP and public port in a way HMRC accepts.
- Exact treatment of `Gov-Client-Multi-Factor` before QuarterLink MFA exists.
- Exact treatment of `Gov-Vendor-License-IDs` before billing/licensing exists.
- Whether any third-party proxy/CDN/WAF changes `Gov-Vendor-Forwarded` requirements.
- Whether HMRC guidance changes before QL-007 implementation.
