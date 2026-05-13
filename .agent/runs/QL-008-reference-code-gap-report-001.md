# QL-008 Reference-Code Gap Report 001

Generated: 2026-05-13

## Scope Control

This extraction used the old MVP only as a read-only reference. It was limited to the user-approved file list and did not import the old repo wholesale. No HMRC API calls, HMRC submission calls, production endpoint calls, database changes, Redis locks, Business Details calls, Obligations calls, Test Fraud Prevention Headers calls, or Self Employment cumulative submission work are proposed in this report.

## 1. Useful Files Inspected

Old MVP reference files inspected:

- `src/auth/oauthUtils.ts`
- `src/auth/AuthStateModel.ts`
- `src/auth/AuthStateResolver.ts`
- `src/auth/AuthTokenStore.ts`
- `src/auth/InMemoryAuthTokenStore.ts`
- `src/auth/PostgresAuthTokenStore.ts`
- `src/clients/HmrcApiClient.ts`
- `src/clients/HmrcApiError.ts`
- `src/common/fraudHeaders.ts`
- `src/common/fraudPrevention.ts`
- `src/common/fphContext.ts`
- `src/common/httpUser.ts`
- `src/middleware/deviceIdMiddleware.ts`
- `src/config/hmrcConfig.ts`
- `src/config/runtimeConfig.ts`
- `src/services/HmrcAuthService.ts`
- `src/services/HmrcCallLogService.ts`
- `src/services/ObligationsService.ts`
- `test/hmrcAuthService.test.ts`
- `test/hmrcApiClient.test.ts`
- `test/obligationsService.test.ts`
- `OAUTH_FPH_REFERENCE.md`

Current QuarterLink files inspected for fit:

- `src/server/hmrc/oauth.ts`
- `src/server/hmrc/client.ts`
- `src/server/hmrc/config.ts`
- `src/server/hmrc/fraud-prevention.ts`
- `src/server/hmrc/fraud-prevention-collector.ts`
- `src/server/hmrc/redaction.ts`
- `src/server/hmrc/types.ts`
- `src/app/api/hmrc/oauth/start/route.ts`
- `src/app/api/hmrc/oauth/callback/route.ts`
- `src/app/api/local-sandbox/fraud-prevention-inputs/route.ts`
- `src/app/ql008-fraud-prevention-collector.tsx`
- `tests/server/hmrc/oauth.test.ts`
- `tests/server/hmrc/fraud-prevention.test.ts`
- `tests/server/hmrc/redaction.test.ts`

## 2. Patterns Worth Porting

- PKCE helper pattern: generate a cryptographically random `code_verifier`, derive S256 `code_challenge`, include `code_challenge_method=S256` on the authorisation URL, and include `code_verifier` on token exchange.
- One-time OAuth state handling: store state with a short TTL and delete it on callback use.
- Token expiry metadata: record `issuedAt` and `expiresAt` using a clock-drift buffer so token readiness checks do not treat nearly expired tokens as usable.
- Base URL separation: keep OAuth authorise traffic on the HMRC auth base URL and token/API traffic on the HMRC API base URL. QuarterLink already follows this.
- Fraud-header encoding helpers: current QuarterLink `encodeHmrcValue` is at least as strict as the old `encodeURIComponent` pattern because it also escapes characters such as `!'()*`.
- Error metadata shape: keep status code, HMRC code/message, correlation ID, and retry-after metadata available for later HMRC client execution work.
- Device ID signing pattern: the old HMAC-signed cookie pattern is useful, but only if implemented without unsafe default secrets and without claiming it binds real production tokens during QL-008.

## 3. Patterns Rejected And Why

- Redis state and refresh locks: rejected for this step because QL-008 is bounded to local/sandbox OAuth hardening and the user explicitly excluded Redis locks.
- Postgres token persistence: rejected because database token persistence is explicitly out of scope.
- Full refresh-token lifecycle: rejected because the user excluded full refresh-token lifecycle work.
- Broad `HmrcApiClient` endpoint methods: rejected because Business Details, Obligations, Test Fraud Prevention Headers, Self Employment submission, final declaration, and full tax return calls are out of scope for this step.
- In-memory HMRC call log dashboards and summaries: rejected as too broad for this hardening step.
- Old auth-state/RBAC resolver patterns: rejected because they introduce database auth/session/RBAC concerns outside this QL-008 patch.
- Old fallback/default fraud-header values: rejected because they include unsafe placeholder/default behavior and old product/vendor names.
- Old device ID middleware default secret: rejected because a default such as a development secret must not sign security-sensitive cookies.
- Logging OAuth state prefixes, generated device IDs, validator bodies, or persistence errors with raw objects: rejected because the current step must avoid leaking tokens, authorisation codes, fraud values, or sensitive data.

## 4. Unsafe, Stale, Too Broad, Or Not Bridging-Only Old Code

- Old product/vendor names and vendor license defaults appear in the old fraud-header reference. These must not be copied.
- The old fraud-header builder can degrade to `unknown` and server defaults. QuarterLink should continue blocking missing required fraud-prevention inputs instead of fabricating evidence.
- The old HMRC API client includes final declaration, calculation, annual submission, Business Details, Obligations, and submission methods. Those are too broad for this step.
- The old obligations service can branch into final declaration obligations. That is not bridging-only for QL-008.
- The old token store and auth-state resolver rely on database/session/RBAC architecture outside current QuarterLink bootstrap constraints.
- The old tests use placeholder tokens and sandbox request flows that should not be copied verbatim into user-facing output or committed evidence.

## 5. Exact QuarterLink Files That Should Be Changed

Priority 1 safe patch:

- `src/server/hmrc/oauth.ts`
- `src/server/hmrc/redaction.ts`
- `tests/server/hmrc/oauth.test.ts`
- `tests/server/hmrc/redaction.test.ts`

Optional only if still narrow after the OAuth patch:

- `src/server/hmrc/fraud-prevention-collector.ts`
- `src/app/api/local-sandbox/fraud-prevention-inputs/route.ts`
- `src/app/ql008-fraud-prevention-collector.tsx`
- `tests/server/hmrc/fraud-prevention-collector.test.ts`

Run reporting:

- `.agent/runs/QL-008-reference-code-hardening-001.md`

## 6. Exact Changes Proposed Before Implementation

Implement now:

- Add server-only local sandbox OAuth PKCE helpers in `src/server/hmrc/oauth.ts`.
- Generate a fresh random OAuth `state` and `code_verifier` for each local sandbox OAuth start.
- Store the `state` and `code_verifier` in an in-memory one-time store with a five-minute TTL.
- Add `code_challenge` and `code_challenge_method=S256` to the HMRC sandbox authorisation URL.
- On callback, validate and delete the stored state before token exchange.
- Add `code_verifier` to the OAuth token exchange request body.
- Remove `HMRC_SANDBOX_OAUTH_STATE` as a required local environment variable for the OAuth start card, while leaving the old constant available only for backward-compatible diagnostics if needed.
- Add token response metadata: `issuedAt`, adjusted `expiresAt`, and `clockDriftBufferSeconds`.
- Update OAuth tests to prove PKCE is present, `client_secret` is not in the authorisation URL, `code_verifier` is sent only to the token endpoint, mismatched or reused state is blocked, and token summaries do not contain token values.
- Add redaction-key coverage for `authorization_code`, `authorisation_code`, `auth_code`, `code_verifier`, and PKCE-related keys.

Do not implement in this patch:

- Production auth.
- Database token persistence.
- Redis locks.
- Refresh-token lifecycle.
- Business Details calls.
- Obligations calls.
- Test Fraud Prevention Headers calls.
- Self Employment cumulative submission.
- Full device/token binding. The current local fraud collector mirrors a client-writable device ID cookie, so signed server cookie binding remains a separate narrow patch candidate.

## Current Gap Conclusions

- PKCE is missing from the active OAuth start/exchange lifecycle even though the lower-level URL builder can accept a `codeChallenge`.
- Fraud-header encoding is not weaker than the reference; QuarterLink is stricter for special characters and blocks missing values more safely.
- Device ID binding is missing. The current collector uses browser local storage and a client-writable cookie, not a server-signed cookie.
- A small safe patch is possible now for PKCE, one-time state, token expiry metadata, and redaction hardening.
