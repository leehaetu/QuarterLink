# QL-008 Cloudflare sandbox route 001

Date: 2026-05-13

Scope: planning and support check only for moving the current QL-008 Railway sandbox route behind a Cloudflare-fronted public HTTPS hostname. No QL-009 work was created. No HMRC API calls, Test Fraud Prevention Headers calls, HMRC submission calls, production endpoints, Self Employment Business cumulative submission, final declaration sending, database storage, auth system, spreadsheet parsing, bookkeeping, VAT, payroll, invoicing, or send action was added.

## Sources checked

- Current local QL-008 implementation: `src/server/hmrc/config.ts`, `src/server/hmrc/oauth.ts`, `src/server/hmrc/fraud-prevention-collector.ts`, `src/app/api/local-sandbox/fraud-prevention-inputs/route.ts`, `tests/server/hmrc/fraud-prevention-collector.test.ts`, `docs/hmrc/SANDBOX_SETUP.md`.
- Cloudflare HTTP request headers documentation, checked 2026-05-13: https://developers.cloudflare.com/fundamentals/reference/http-headers/
- Railway public networking and custom domain documentation, checked 2026-05-13: https://docs.railway.com/deploy/exposing-your-app
- HMRC Developer Hub redirect URI reference, checked 2026-05-13: https://developer.service.hmrc.gov.uk/api-documentation/docs/reference-guide

## Current QL-008 assumptions

- `HMRC_SANDBOX_REDIRECT_URI` may be HTTP localhost for local development, or HTTPS for a public sandbox route.
- The OAuth callback route remains `/api/hmrc/oauth/callback`.
- The OAuth start route, callback route, token handoff, and fraud-prevention collector remain sandbox-only.
- The temporary QL-008 demo access path is still guarded for `APP_ENV=local` and `HMRC_ENV=sandbox`; it is not real QuarterLink SaaS sign-in.
- The current collector already reads `true-client-ip`, `cf-connecting-ip`, `x-real-ip`, `x-client-ip`, `x-forwarded-for`, and `forwarded` as possible client public IP sources, then validates that the selected IP is public.
- The collector already rejects localhost, private, and documentation IP ranges. It does not use browser-supplied network values.
- Raw Railway and localhost flows can remain available by keeping their redirect URIs registered separately in HMRC Developer Hub and using the matching `HMRC_SANDBOX_REDIRECT_URI` value for each environment.

## Recommended Cloudflare route

Use a first-level sandbox subdomain:

`sandbox.quarterlink.co.uk`

Avoid deeper hostnames such as `ql008.sandbox.quarterlink.co.uk` for the initial Cloudflare-proxied Railway route unless Cloudflare Advanced Certificate Manager is available and explicitly configured.

## Exact DNS and custom-domain steps

1. In Railway, open the QL-008 sandbox service.
2. Go to service settings and add a custom domain in Public Networking.
3. Enter `sandbox.quarterlink.co.uk`.
4. Select the web service port that serves the Next.js app.
5. Copy the Railway-provided CNAME target, for example a value shaped like `<railway-target>.up.railway.app`.
6. In Cloudflare DNS for `quarterlink.co.uk`, create:
   - Type: `CNAME`
   - Name: `sandbox`
   - Target: the exact Railway-provided CNAME target
   - Proxy status: proxied / orange cloud
7. In Cloudflare SSL/TLS settings for this route, use the Railway-compatible Cloudflare proxy mode documented by Railway. Do not assume a stricter mode works until Railway verifies the custom domain and the browser can load the app over HTTPS.
8. Wait for Railway custom-domain verification.
9. Confirm the browser loads `https://sandbox.quarterlink.co.uk` and reaches the QL-008 UI before attempting any HMRC OAuth journey.

Do not use the raw Railway URL as the HMRC redirect URI for the Cloudflare route once this hostname is active. The raw Railway URL may remain useful for rollback/debugging only if it is registered as its own HMRC redirect URI and the matching environment value is deployed for that route.

## HMRC Developer Hub redirect URI

Register this exact sandbox redirect URI on the HMRC sandbox application:

`https://sandbox.quarterlink.co.uk/api/hmrc/oauth/callback`

The redirect URI used in the OAuth authorise request and the token exchange must match the registered redirect URI. For the Cloudflare-fronted Railway sandbox route, set the Railway environment variable to exactly:

```bash
HMRC_SANDBOX_REDIRECT_URI=https://sandbox.quarterlink.co.uk/api/hmrc/oauth/callback
```

Keep the HMRC sandbox origins unchanged:

```bash
HMRC_SANDBOX_API_BASE_URL=https://test-api.service.hmrc.gov.uk
HMRC_SANDBOX_AUTH_BASE_URL=https://test-www.tax.service.gov.uk
HMRC_ENV=sandbox
```

Do not add or deploy any `HMRC_PRODUCTION_*` values for QL-008.

## Headers Cloudflare may help provide

Cloudflare may improve the realism of the public HTTPS request boundary for these QL-008 checks:

- `CF-Connecting-IP`: can provide the visitor IP address seen by Cloudflare to the Railway origin. The current collector already checks `cf-connecting-ip` before generic forwarding headers.
- `True-Client-IP`: may be available on some Cloudflare plans. The current collector already checks `true-client-ip`.
- `X-Forwarded-For`: Cloudflare can add or maintain this forwarding chain. The current collector reads it only as a server-side header source and still requires a public IP.
- `X-Forwarded-Proto`: can confirm the visitor used HTTPS for operational diagnostics, but it is not enough by itself to satisfy the unresolved fraud-prevention values.
- `CF-Ray`: useful for correlating Cloudflare requests with logs. It is not a substitute for any required HMRC `Gov-*` fraud-prevention header value.

These may help derive or corroborate:

- `Gov-Client-Public-IP`
- the `for` component of `Gov-Vendor-Forwarded`

They do not prove that Test Fraud Prevention Headers can pass. They must still be validated through the actual HMRC Test Fraud Prevention Headers API in a later approved step, after every required real value exists.

## Headers Cloudflare cannot solve

Cloudflare does not remove the following QL-008 blockers:

- `Gov-Client-Public-Port`: do not fake this with `443`, `80`, the Railway app port, the browser URL port, or any guessed value. If Cloudflare/Railway does not expose the originating device's public TCP source port in a verified request header, this remains a missing-data item for HMRC discussion.
- `Gov-Vendor-Public-IP`: Cloudflare request headers available to the app do not by themselves prove the exact public server, WAF, DDoS, load balancer, or edge IP that HMRC expects. Do not substitute `CF-Ray`, a Cloudflare data-centre code, localhost, a private Railway address, or DNS lookup output.
- the `by` component of `Gov-Vendor-Forwarded`: this still needs a verified public vendor boundary IP or an HMRC-agreed missing-data approach.
- `Gov-Client-Multi-Factor`: requires real QuarterLink MFA data.
- `Gov-Client-User-IDs`: requires real QuarterLink SaaS user identity data.
- `Gov-Vendor-License-IDs`: requires real QuarterLink licence or entitlement metadata.

## Code support check

No code change is needed for the Cloudflare-fronted route at this point.

The current collector is already safe enough for QL-008 header observation behind Cloudflare/Railway because it:

- reads Cloudflare-specific client IP headers before generic forwarding headers;
- reads Railway `x-real-ip`;
- reads standard `x-forwarded-for` and `forwarded` values;
- strips ports before IP validation;
- accepts only public IPs;
- rejects localhost, private, and documentation IP ranges;
- treats public port as unavailable unless a trusted edge/source-port header or valid `Forwarded` port is actually present;
- keeps manual MFA, user ID, and licence fields explicit rather than inferred.

No Cloudflare or Railway header must be treated as proof that Test Fraud Prevention Headers will pass. The route only makes the request boundary more realistic for the next controlled validation step.

## Required operator checklist before retrying OAuth on the Cloudflare route

- Railway custom domain `sandbox.quarterlink.co.uk` is verified.
- Cloudflare DNS has a proxied CNAME `sandbox` pointing at the Railway-provided CNAME target.
- `https://sandbox.quarterlink.co.uk` loads the QL-008 UI.
- HMRC sandbox application includes `https://sandbox.quarterlink.co.uk/api/hmrc/oauth/callback` as a redirect URI.
- Railway has `HMRC_SANDBOX_REDIRECT_URI=https://sandbox.quarterlink.co.uk/api/hmrc/oauth/callback`.
- No production HMRC environment variables are present.
- No `.env.local`, secrets, tokens, auth codes, sandbox passwords, raw fraud values, or device cookie secrets are committed.
- No send/submission action is enabled.
- Test Fraud Prevention Headers is still not run until the missing fraud-prevention values are resolved or HMRC has agreed an omission/missing-data approach.

## Remaining QL-008 blockers

Test Fraud Prevention Headers remains blocked until all required real `WEB_APP_VIA_SERVER` data exists or HMRC agrees how to handle the missing values.

Exact remaining blockers:

- real MFA type, timestamp, and unique reference;
- real SaaS user ID key and value;
- real vendor licence ID key and hashed value;
- verified client public source port, or an HMRC-agreed missing-data approach;
- verified vendor public IP and `Gov-Vendor-Forwarded` `by` value, or an HMRC-agreed missing-data approach.

No HMRC API calls, Test Fraud Prevention Headers calls, or HMRC submission calls were made for this report.
