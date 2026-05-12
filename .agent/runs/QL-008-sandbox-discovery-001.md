# QL-008 Sandbox Discovery Step

Date: 2026-05-13

## Scope

Added a guarded local/sandbox-only discovery command for the next QL-008 step.

No QL-009 work was created. No production endpoints, HMRC submission calls, Self Employment Business cumulative calls, database storage, authentication, spreadsheet parsing, bookkeeping, VAT, payroll, invoicing, final declaration, or tax return features were added.

## Required Order

1. fresh OAuth token
2. WEB_APP_VIA_SERVER fraud-prevention inputs
3. Test Fraud Prevention Headers validation
4. Business Details read-only call to get self-employment businessId
5. Obligations read-only call to get period/context
6. preflight retry

## Change

- Added `npm run hmrc:sandbox-discovery`.
- Added environment-driven local assembly of `WEB_APP_VIA_SERVER` fraud-prevention inputs.
- Added a dry-run default so no HMRC network call is made unless `QL_008_DISCOVERY_ALLOW_HMRC_CALLS=true`.
- Added sandbox-only client-credentials token retrieval for the application-restricted Test Fraud Prevention Headers API.
- Added Test Fraud Prevention Headers validation before any read-only Business Details discovery.
- Added read-only Business Details discovery only after Test Fraud Prevention Headers returns `VALID_HEADERS`.
- Added read-only Obligations discovery only after Business Details returns a self-employment business ID.
- Added redacted output for tokens, client secrets, authorisation codes, passwords, and raw fraud-prevention metadata.

The current Test Fraud Prevention Headers 1.0 OpenAPI definition shows `applicationRestricted` with `clientCredentials` and an empty `scopes` object, so no `HMRC_SANDBOX_FPH_SCOPES` value is required at this point. The script still accepts optional `HMRC_SANDBOX_FPH_SCOPES` if HMRC later requires a scope.

## Current Blockers

The local environment checked during this run had a user-restricted sandbox access token and sandbox client secret present, but did not expose values. It was still missing:

- `QL_008_FRAUD_BROWSER_JS_USER_AGENT`
- `QL_008_FRAUD_DEVICE_ID`
- `QL_008_FRAUD_MFA_TYPE`
- `QL_008_FRAUD_MFA_TIMESTAMP`
- `QL_008_FRAUD_MFA_UNIQUE_REFERENCE`
- `QL_008_FRAUD_CLIENT_PUBLIC_IP`
- `QL_008_FRAUD_CLIENT_PUBLIC_IP_TIMESTAMP`
- `QL_008_FRAUD_CLIENT_PUBLIC_PORT`
- `QL_008_FRAUD_SCREEN_WIDTH`
- `QL_008_FRAUD_SCREEN_HEIGHT`
- `QL_008_FRAUD_SCREEN_SCALING_FACTOR`
- `QL_008_FRAUD_SCREEN_COLOUR_DEPTH`
- `QL_008_FRAUD_TIMEZONE`
- `QL_008_FRAUD_CLIENT_USER_ID_KEY`
- `QL_008_FRAUD_CLIENT_USER_ID_VALUE`
- `QL_008_FRAUD_WINDOW_WIDTH`
- `QL_008_FRAUD_WINDOW_HEIGHT`
- `QL_008_FRAUD_VENDOR_FORWARDED_BY`
- `QL_008_FRAUD_VENDOR_FORWARDED_FOR`
- `QL_008_FRAUD_VENDOR_LICENSE_ID_KEY`
- `QL_008_FRAUD_VENDOR_LICENSE_ID_VALUE`
- `QL_008_FRAUD_VENDOR_PUBLIC_IP`

`HMRC_SANDBOX_FPH_ACCESS_TOKEN` is no longer required for the normal local developer flow. It is accepted only as an optional override; otherwise the discovery command requests the application-restricted token from `https://test-api.service.hmrc.gov.uk/oauth/token` using `grant_type=client_credentials`.

## Safety Notes

The sandbox client secret and previous access token were reported as exposed in chat before this step, so rotation was required. During this run, the human stated that the sandbox client secret had been refreshed and a fresh token was available. The exposed token must not be used. Before an evidence-producing HMRC call, the active shell must contain only refreshed credentials and fresh tokens.

No client secret, sandbox password, authorisation code, access token, refresh token, raw public IP, raw device ID, or raw fraud-prevention header value was written to this report.
