# QL-008 fraud-header missing-data decision 001

Date: 2026-05-13

Scope: analysis only for the remaining unresolved QL-008 `WEB_APP_VIA_SERVER` fraud-prevention variables. No HMRC API calls, no HMRC submission calls, no production endpoints, no QL-009 work, and no fake fraud-prevention values.

## Sources checked

- HMRC Developer Hub, Web application via server fraud-prevention guidance, checked 2026-05-13: https://developer.service.hmrc.gov.uk/guides/fraud-prevention/connection-method/web-app-via-server/
- HMRC Developer Hub, Getting it right / Missing header data, checked 2026-05-13: https://developer.service.hmrc.gov.uk/guides/fraud-prevention/getting-it-right/
- HMRC Developer Hub, Test Fraud Prevention Headers API, last updated 2026-03-24, checked 2026-05-13: https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/txm-fph-validator-api/1.0
- Railway public networking specs and limits, checked 2026-05-13: https://docs.railway.com/networking/public-networking/specs-and-limits
- Local implementation checked: `src/server/hmrc/fraud-prevention.ts`, `src/server/hmrc/fraud-prevention-collector.ts`, `src/server/hmrc/sandbox-discovery.ts`, `docs/hmrc/SANDBOX_SETUP.md`, `docs/hmrc/FRAUD_PREVENTION_HEADERS_ARCHITECTURE.md`.

## Current Railway request-header reality

Railway's public networking documentation lists these request headers as available to the service:

- `X-Real-IP`, for the client's remote IP.
- `X-Forwarded-Proto`, always `https`.
- `X-Forwarded-Host`, for the original host header.
- `X-Railway-Edge`, for the edge region.
- `X-Request-Start`, for request receipt time in Unix milliseconds.
- `X-Railway-Request-Id`, for log correlation.

That documentation does not list a client public source-port header. It also does not list a header that gives the public IP address of the Railway edge, load balancer, WAF, or other public vendor boundary that received the browser request.

The local collector already reads `X-Real-IP` through the `x-real-ip` entry in `PUBLIC_CLIENT_IP_HEADERS`, and can therefore use Railway request headers for the client public IP where Railway supplies a public address. No additional code change is needed for that verified source.

## Classification key

- A: Can be safely derived from Railway/server request headers.
- B: Can be supplied as a legitimate QL-008 sandbox override.
- C: Requires real SaaS auth/MFA/licence implementation.
- D: Requires HMRC missing-data discussion.
- E: Cannot be collected and must not be faked.

## Decision table

| Variable | HMRC header | Class | QL-008 can use it now? | Exact reason | Exact next action |
| --- | --- | --- | --- | --- | --- |
| `QL_008_FRAUD_MFA_TYPE` | `Gov-Client-Multi-Factor` | C | No. | HMRC says this relates to users accessing the software, not the HMRC authority grant. QL-BOOTSTRAP has demo access but no real QuarterLink MFA event. The type must reflect the actual MFA factor used, such as `TOTP`, `AUTH_CODE`, or `OTHER`; inventing one would be a fake fraud-prevention value. | Do not send this value in QL-008. Either implement real QuarterLink MFA under a later approved ticket or ask HMRC whether this missing data may be omitted or left empty for the QL-008 sandbox route. |
| `QL_008_FRAUD_MFA_TIMESTAMP` | `Gov-Client-Multi-Factor` | C | No. | HMRC requires the UTC timestamp of the last successful prompt for the MFA factor. There is no real QuarterLink MFA prompt in QL-BOOTSTRAP, so there is no legitimate timestamp to send. | Do not invent a timestamp. Use the real MFA verification timestamp only after real QuarterLink MFA exists, or include this field in the HMRC missing-data question. |
| `QL_008_FRAUD_MFA_UNIQUE_REFERENCE` | `Gov-Client-Multi-Factor` | C | No. | HMRC requires a stable reference for the MFA factor, such as a salted-and-hashed phone number or identifier linked to a TOTP secret, not the secret itself. QL-BOOTSTRAP has no real MFA factor record. | Do not invent an MFA reference. Use a consistent salted hash or equivalent reference from a real MFA factor record later, or include this field in the HMRC missing-data question. |
| `QL_008_FRAUD_CLIENT_PUBLIC_PORT` | `Gov-Client-Public-Port` | D | No. | HMRC requires the public TCP source port used by the originating device and says it must not be a server port. Railway's documented request headers do not expose this source port. Supplying `80`, `443`, the app port, or a guessed value would be wrong. | Ask HMRC how to handle this missing request-metadata field for the Railway sandbox route, and separately confirm whether Railway can expose an accepted client source-port value. Do not guess or substitute a server port. |
| `QL_008_FRAUD_CLIENT_USER_ID_KEY` | `Gov-Client-User-IDs` | C | No. | HMRC expects keys indicating accounts the user holds in the software. QL-BOOTSTRAP has no real SaaS user account model or authenticated QuarterLink user identity beyond demo access. | Do not use demo-access labels as user IDs. Add this only after real QuarterLink user identity exists, or include the missing SaaS identity state in the HMRC missing-data question. |
| `QL_008_FRAUD_CLIENT_USER_ID_VALUE` | `Gov-Client-User-IDs` | C | No. | HMRC expects the identifier the user signs into the application with, and any internal identifier if present. QL-BOOTSTRAP does not have a real SaaS user record; a demo label would not be a real user identifier. | Do not invent or reuse a taxpayer identifier as an app user ID. Add this only after real QuarterLink user identity exists, or include the missing SaaS identity state in the HMRC missing-data question. |
| `QL_008_FRAUD_VENDOR_FORWARDED_BY` | `Gov-Vendor-Forwarded` | D | No. | HMRC requires `by` to be the public IP address that received the request at the vendor boundary. Railway's documented request headers do not expose that public vendor boundary IP. This value must not be replaced with localhost, a private interface, a region name, or a guessed DNS result. | Ask HMRC how to handle this missing vendor-boundary field for the Railway sandbox route, and confirm whether Railway can provide a verified public boundary IP that actually received the request. |
| `QL_008_FRAUD_VENDOR_FORWARDED_FOR` | `Gov-Vendor-Forwarded` | A | Not as a complete header. | For the first vendor hop, HMRC says `for` is the public IP of the request sender and matches `Gov-Client-Public-IP`. Railway documents `X-Real-IP` for the client's remote IP, and the local collector already reads `x-real-ip` as a public client-IP source. The paired `by` value is still unresolved, so the full `Gov-Vendor-Forwarded` header remains blocked. | Keep deriving this from Railway `X-Real-IP` only when it is a validated public client IP, but do not send `Gov-Vendor-Forwarded` until `QL_008_FRAUD_VENDOR_FORWARDED_BY` is resolved or HMRC agrees an omission approach. |
| `QL_008_FRAUD_VENDOR_LICENSE_ID_KEY` | `Gov-Vendor-License-IDs` | C | No. | HMRC expects a key-value structure for hashed licence keys relating to the vendor software initiating the API request. QL-BOOTSTRAP has no real licence system. A placeholder product key would be fake licence metadata. | Do not send placeholder licence metadata. Add this only after real QuarterLink licence or entitlement metadata exists, or include the missing licence state in the HMRC missing-data question. |
| `QL_008_FRAUD_VENDOR_LICENSE_ID_VALUE` | `Gov-Vendor-License-IDs` | C | No. | HMRC expects a hashed licence value with a consistent hashing function. QL-BOOTSTRAP has no licence record to hash. Inventing a hash would still be fake licence metadata. | Do not invent a hash. Add this only after a real QuarterLink licence or entitlement reference exists and can be consistently hashed, or include the missing licence state in the HMRC missing-data question. |
| `QL_008_FRAUD_VENDOR_PUBLIC_IP` | `Gov-Vendor-Public-IP` | D | No. | HMRC requires the public IP address of the server, WAF, DDoS service, or load balancer that the originating device sent the request to. Railway's documented request headers do not expose this public vendor boundary IP, and the value may not be substituted with localhost, a private service address, or an unverified guess. | Ask HMRC how to handle this missing vendor public IP for the Railway sandbox route, and confirm whether Railway can provide a verified public boundary IP that actually received the browser request. |

## Result

Test Fraud Prevention Headers remains blocked for QL-008. The block is not because the Test Fraud Prevention Headers API is unavailable; it is because the assembled `WEB_APP_VIA_SERVER` header set would still contain missing required real-world values. HMRC guidance says missing header data must be discussed with HMRC, and placeholders such as `null`, `undefined`, guessed ports, fake MFA events, fake user IDs, or fake licence IDs must not be sent.

This report contains no secrets, access tokens, refresh tokens, authorisation codes, sandbox passwords, client secrets, device cookie secrets, raw fraud-prevention header values, or raw fraud-prevention override values.

## Exact next action

Contact HMRC at `SDSTeam@hmrc.gov.uk` with a missing-data question for QL-008 before attempting Test Fraud Prevention Headers or any Income Tax MTD sandbox call. The question should cover:

- no real QuarterLink MFA exists during QL-BOOTSTRAP, so `Gov-Client-Multi-Factor` cannot be truthfully populated yet;
- no real QuarterLink SaaS user identity exists during QL-BOOTSTRAP, so `Gov-Client-User-IDs` cannot be truthfully populated yet;
- no real QuarterLink licence system exists during QL-BOOTSTRAP, so `Gov-Vendor-License-IDs` cannot be truthfully populated yet;
- Railway currently documents `X-Real-IP` but not client public source port or public vendor boundary IP request headers, so `Gov-Client-Public-Port`, `Gov-Vendor-Public-IP`, and the `by` component of `Gov-Vendor-Forwarded` remain unresolved.

If HMRC accepts an omit-or-empty approach for any missing values, record that correspondence without secrets and update the QL-008 preflight rules. If HMRC does not accept that approach, QL-008 remains blocked until real SaaS auth/MFA/licence implementation and verified deployment metadata exist under an approved later ticket.
