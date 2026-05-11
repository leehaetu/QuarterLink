# QuarterLink — SaaS Tenancy, RBAC and Security Blueprint v2

Last updated: 2026-05-11
Status: active SaaS architecture source of truth

## Purpose

QuarterLink is intended to become a multi-tenant SaaS. This file defines the required tenancy/security model before auth, database or HMRC integration is built.

## Tenant model

QuarterLink should have one platform with multiple tenant types.

| Concept | Meaning |
|---|---|
| Platform | QuarterLink service itself. |
| Tenant / organisation | A billing/security boundary. Individual taxpayer account or practice account. |
| User | Login identity. A user may belong to one or more tenants later. |
| Taxpayer profile | Person/entity whose income sources and HMRC connection are being managed. |
| Practice client | A taxpayer profile managed by an agent/practice tenant. |
| Assignment | Permission relationship between practice user and client. |
| HMRC connection | OAuth/token state for a taxpayer/client. |
| Income source | HMRC business/income-source record. |
| Obligation | HMRC quarterly/update obligation record. |
| Import batch | Spreadsheet import evidence. |
| Submission | HMRC submission attempt and evidence. |
| Audit event | Append-only record of material action. |

## Required tenant types

### Individual tenant

For a self-employed person or landlord using QuarterLink directly.

Core roles:

- Owner.
- Optional delegated user later.

### Practice tenant

For an accountant/bookkeeper managing multiple clients.

Core roles later:

- Practice owner.
- Practice admin.
- Practice staff.
- Client viewer.

### Platform tenant/internal admin

For QuarterLink staff only.

Core roles:

- Platform super admin.
- Platform admin.
- Support operator.
- Read-only auditor.

## RBAC minimum matrix

| Action | Individual owner | Practice owner/admin | Practice staff | Client viewer | Support operator | Platform admin |
|---|---:|---:|---:|---:|---:|---:|
| View own dashboard | Yes | Yes | Assigned only | View only | Consent/support only | No direct taxpayer access by default |
| Connect HMRC | Yes | Client-authorised only | Permissioned only | No | No | No |
| Upload spreadsheet | Yes | Assigned client only | Assigned client only | No | No | No |
| Send quarterly update | Yes | Permissioned only | Permissioned only | No | No | No |
| View submission evidence | Yes | Assigned client only | Assigned client only | View only if enabled | Consent/support only | No direct access by default |
| Manage users | Own tenant | Practice tenant | No | No | No | Platform-level only |
| Manage billing | Yes | Owner/admin | No | No | No | Platform-level only |
| Access support tools | No | No | No | No | Consent-bound | Yes, audited |
| Impersonate user | No | No | No | No | Prefer no; use support look-in | Restricted, audited, consent-bound |

## Support access rules

Support access must be designed before launch.

Rules:

- Default support access is no taxpayer data access.
- Support look-in should be read-only where possible.
- User/client consent should be required for viewing sensitive records.
- Support sessions must be time-limited.
- Every support access action must be audited.
- Support must not be able to send HMRC submissions for a user.
- Support must not be able to edit imported figures.
- Emergency access, if ever added, must require elevated approval and audit.

## Auth requirements

Before production:

- Secure email/password or external identity provider.
- Email verification.
- Password reset.
- Session expiry.
- Device/session management.
- MFA for platform admins.
- MFA for practice admins.
- MFA for high-risk actions, or preferably all users.
- Brute-force/rate limiting.
- Login audit events.

High-risk actions:

- HMRC connect/disconnect.
- Send quarterly update.
- Invite/remove users.
- Change client assignment.
- Export evidence pack.
- Change billing/admin settings.

## Data isolation requirements

QuarterLink must enforce tenant isolation in:

- Database queries.
- API handlers.
- Background jobs.
- File/object storage.
- Audit logs.
- Admin/support tools.
- Exports.

Recommended principle:

- Every tenant-scoped table has `tenant_id`.
- Every client/taxpayer scoped table has `taxpayer_id` or `client_id` where relevant.
- Use Row Level Security or equivalent strong enforcement where the chosen database supports it.
- Never rely only on frontend filtering.

## HMRC token security

HMRC OAuth/token records must be treated as highly sensitive.

Rules:

- Encrypt tokens at rest.
- Restrict token access to server-side services only.
- Never expose tokens to browser/client JavaScript.
- Rotate/refresh tokens according to HMRC OAuth rules.
- Store token expiry and connection status.
- Audit connect, refresh failure, disconnect, and reconnect events.
- Do not log access tokens, refresh tokens, authorisation codes or secrets.

## Audit event minimum schema

```text
audit_event
  id
  tenant_id
  user_id
  taxpayer_id nullable
  client_id nullable
  action
  entity_type
  entity_id
  risk_level
  ip_address_hash
  user_agent_hash
  metadata_json
  created_at
```

High-risk audit events:

- Login success/failure.
- MFA enable/disable.
- HMRC OAuth started/completed/failed/disconnected.
- Spreadsheet import created/replaced.
- Submission declaration accepted.
- HMRC submission sent.
- HMRC response received.
- Evidence pack viewed/exported.
- User invited/removed.
- Client assignment changed.
- Support access requested/granted/used/revoked.
- Billing plan changed.

## Evidence retention

MVP must define retention before launch.

Suggested product rule:

- Submission evidence and audit logs are retained for at least the period needed to support Self Assessment record-keeping expectations and business/legal defence.
- Exact retention must be confirmed with legal/privacy review before production.

## Billing/entitlements placeholders

Do not build billing yet, but do not block it.

Future entitlement dimensions:

- Number of taxpayers/clients.
- Number of practice staff seats.
- Supported income-source types.
- Submissions included.
- Evidence export.
- Practice workflows.
- Priority support.

Billing must not affect already-submitted evidence access in a way that creates compliance risk.

## Platform admin rules

Platform admin tools must separate:

- Operational metrics.
- Tenant management.
- Billing support.
- Support access.
- Security/audit.

Do not create a platform admin that can casually browse taxpayer records.

## Dashboard planning boundaries

Dashboard work is future product work, not QL-BOOTSTRAP implementation. These concepts define expected direction so the architecture does not block later user journeys.

### Individual dashboard

Should show, once the supporting systems exist:

- HMRC connection status.
- Income sources.
- Current update periods.
- Deadline to send.
- Spreadsheet upload/link status.
- Review status.
- Ready-to-send status.
- Sent update history.
- Evidence download history.

### Agent Solo dashboard

Should show, once practice workflows are approved:

- Client list.
- Client income-source types.
- Current quarter/update status.
- Missing spreadsheet records.
- Mapping or review issues.
- Client approval status.
- Ready-to-send status.
- Sent/rejected history.
- Evidence pack access.

### Practice dashboard

Should show, once multi-staff practice workflows are approved:

- Firm-wide workload.
- Staff/client assignments.
- Clients due soon.
- Clients missing records.
- Reviews awaiting sign-off.
- Submitted updates.
- Rejected/failed items.
- Audit trail.

## Minimum security gates before HMRC sandbox work

Before real HMRC sandbox integration:

- Server-side secret management.
- Environment variable validation.
- No token leakage in logs.
- Basic auth/session security design.
- Fraud prevention header architecture.
- Audit event design.
- Tenant model design.

## Minimum security gates before production/public users

Before real users:

- Auth implemented.
- MFA implemented for high-risk/admin roles.
- Tenant isolation tested.
- Audit log implemented.
- HMRC tokens encrypted.
- Rate limiting.
- Security headers.
- Privacy/cookie documentation.
- Backups and restore process.
- Incident response plan.
- Data export/deletion policy.
