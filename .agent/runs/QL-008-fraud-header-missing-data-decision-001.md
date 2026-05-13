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

| Variable | HMRC header | Classification | Exact reason | Can be used for QL-008 sandbox testing now? | Exact value source if applicable | HMRC support must be contacted? | Block Test Fraud Prevention Headers? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `QL_008_FRAUD_MFA_TYPE` | `Gov-Client-Multi-Factor` | C | HMRC says this relates to users accessing the software, not the HMRC authority grant. QL-BOOTSTRAP has demo access but no real QuarterLink MFA event. The type must reflect the actual MFA factor used, such as `TOTP`, `AUTH_CODE`, or `OTHER`; inventing one would be a fake fraud-prevention value. | No. | None in current QL-008 state. Future source is the real QuarterLink MFA event for the signed-in user. | Yes, if QL-008 is to proceed before real MFA exists or if QuarterLink intends to omit/empty this header. | Yes. |
| `QL_008_FRAUD_MFA_TIMESTAMP` | `Gov-Client-Multi-Factor` | C | HMRC requires the UTC timestamp of the last successful prompt for the MFA factor. There is no real QuarterLink MFA prompt in QL-BOOTSTRAP, so there is no legitimate timestamp to send. | No. | None in current QL-008 state. Future source is the real MFA verification timestamp. | Yes, if QL-008 is to proceed before real MFA exists or if QuarterLink intends to omit/empty this header. | Yes. |
| `QL_008_FRAUD_MFA_UNIQUE_REFERENCE` | `Gov-Client-Multi-Factor` | C | HMRC requires a stable reference for the MFA factor, such as a salted-and-hashed phone number or identifier linked to a TOTP secret, not the secret itself. QL-BOOTSTRAP has no real MFA factor record. | No. | None in current QL-008 state. Future source is a consistent salted hash or equivalent reference from the real MFA factor record. | Yes, if QL-008 is to proceed before real MFA exists or if QuarterLink intends to omit/empty this header. | Yes. |
| `QL_008_FRAUD_CLIENT_PUBLIC_PORT` | `Gov-Client-Public-Port` | D | HMRC requires the public TCP source port used by the originating device and says it must not be a server port. Railway's documented request headers do not expose this source port. Supplying `80`, `443`, the app port, or a guessed value would be wrong. | No. | None currently verified. | Yes. This is a platform/request-metadata missing-data issue unless Railway can provide an accepted source. | Yes. |
| `QL_008_FRAUD_CLIENT_USER_ID_KEY` | `Gov-Client-User-IDs` | C | HMRC expects keys indicating accounts the user holds in the software. QL-BOOTSTRAP has no real SaaS user account model or authenticated QuarterLink user identity beyond demo access. | No. | None in current QL-008 state. Future source is the real QuarterLink authenticated user identity namespace, for example an application account key. | Yes, if QL-008 is to proceed before real SaaS user identity exists or if QuarterLink intends to omit/empty this header. | Yes. |
| `QL_008_FRAUD_CLIENT_USER_ID_VALUE` | `Gov-Client-User-IDs` | C | HMRC expects the identifier the user signs into the application with, and any internal identifier if present. QL-BOOTSTRAP does not have a real SaaS user record; a demo label would not be a real user identifier. | No. | None in current QL-008 state. Future source is the real QuarterLink user identifier used for sign-in and/or internal account ID. | Yes, if QL-008 is to proceed before real SaaS user identity exists or if QuarterLink intends to omit/empty this header. | Yes. |
| `QL_008_FRAUD_VENDOR_FORWARDED_BY` | `Gov-Vendor-Forwarded` | D | HMRC requires `by` to be the public IP address that received the request at the vendor boundary. Railway's documented request headers do not expose that public vendor boundary IP. This value must not be replaced with localhost, a private interface, a region name, or a guessed DNS result. | No. | None currently verified. A future value source would need verified Railway/deployment metadata for the public boundary IP that actually received the request. | Yes, unless Railway can provide a verified accepted source. | Yes. |
| `QL_008_FRAUD_VENDOR_FORWARDED_FOR` | `Gov-Vendor-Forwarded` | A | For the first vendor hop, HMRC says `for` is the public IP of the request sender and matches `Gov-Client-Public-IP`. Railway documents `X-Real-IP` for the client's remote IP, and the local collector already reads `x-real-ip` as a public client-IP source. | Not as a complete header. This variable can be derived, but `Gov-Vendor-Forwarded` still cannot be assembled until `QL_008_FRAUD_VENDOR_FORWARDED_BY` is resolved. | Railway `X-Real-IP` request header, validated as a public IP by the collector. | No for this variable alone; yes for the unresolved paired `by` value. | Yes, because the full `Gov-Vendor-Forwarded` header remains blocked. |
| `QL_008_FRAUD_VENDOR_LICENSE_ID_KEY` | `Gov-Vendor-License-IDs` | C | HMRC expects a key-value structure for hashed licence keys relating to the vendor software initiating the API request. QL-BOOTSTRAP has no real licence system. A placeholder product key would be fake licence metadata. | No. | None in current QL-008 state. Future source is the real QuarterLink licence/account entitlement namespace. | Yes, if QL-008 is to proceed before real licence metadata exists or if QuarterLink intends to omit/empty this header. | Yes. |
| `QL_008_FRAUD_VENDOR_LICENSE_ID_VALUE` | `Gov-Vendor-License-IDs` | C | HMRC expects a hashed licence value with a consistent hashing function. QL-BOOTSTRAP has no licence record to hash. Inventing a hash would still be fake licence metadata. | No. | None in current QL-008 state. Future source is a consistent hash of the real QuarterLink licence/account entitlement reference. | Yes, if QL-008 is to proceed before real licence metadata exists or if QuarterLink intends to omit/empty this header. | Yes. |
| `QL_008_FRAUD_VENDOR_PUBLIC_IP` | `Gov-Vendor-Public-IP` | D | HMRC requires the public IP address of the server, WAF, DDoS service, or load balancer that the originating device sent the request to. Railway's documented request headers do not expose this public vendor boundary IP, and the value may not be substituted with localhost, a private service address, or an unverified guess. | No. | None currently verified. A future value source would need verified Railway/deployment metadata for the public boundary IP that actually received the browser request. | Yes, unless Railway can provide a verified accepted source. | Yes. |

## Result

Test Fraud Prevention Headers remains blocked for QL-008. The block is not because the Test Fraud Prevention Headers API is unavailable; it is because the assembled `WEB_APP_VIA_SERVER` header set would still contain missing required real-world values. HMRC guidance says missing header data must be discussed with HMRC, and placeholders such as `null`, `undefined`, guessed ports, fake MFA events, fake user IDs, or fake licence IDs must not be sent.

## Exact next action

Contact HMRC at `SDSTeam@hmrc.gov.uk` with a missing-data question for QL-008 before attempting Test Fraud Prevention Headers or any Income Tax MTD sandbox call. The question should cover:

- no real QuarterLink MFA exists during QL-BOOTSTRAP, so `Gov-Client-Multi-Factor` cannot be truthfully populated yet;
- no real QuarterLink SaaS user identity exists during QL-BOOTSTRAP, so `Gov-Client-User-IDs` cannot be truthfully populated yet;
- no real QuarterLink licence system exists during QL-BOOTSTRAP, so `Gov-Vendor-License-IDs` cannot be truthfully populated yet;
- Railway currently documents `X-Real-IP` but not client public source port or public vendor boundary IP request headers, so `Gov-Client-Public-Port`, `Gov-Vendor-Public-IP`, and the `by` component of `Gov-Vendor-Forwarded` remain unresolved.

If HMRC accepts an omit-or-empty approach for any missing values, record that correspondence without secrets and update the QL-008 preflight rules. If HMRC does not accept that approach, QL-008 remains blocked until real SaaS auth/MFA/licence implementation and verified deployment metadata exist under an approved later ticket.
