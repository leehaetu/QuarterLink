# QuarterLink — Product Source of Truth v2

Last updated: 2026-05-11
Status: active product source of truth

## Product name

QuarterLink

## One-sentence product summary

QuarterLink is spreadsheet bridging software for Making Tax Digital for Income Tax, built first for self-employed individuals and landlords who already keep records in spreadsheets and need to send quarterly updates without moving to full bookkeeping software.

## Core customer message

Keep your spreadsheet. Send your quarterly updates.

## Product position

QuarterLink is:

- Bridging software.
- Spreadsheet-first.
- Focused first on Making Tax Digital for Income Tax in-year quarterly updates.
- Built for self-employed individuals, UK property landlords, foreign property landlords, and combinations of these income sources.
- Designed to become a multi-tenant SaaS with individual, agent and practice workflows.
- Built around digital links, read-only imported figures, audit evidence, and clear HMRC submission records.

QuarterLink is not:

- Full bookkeeping software.
- VAT software.
- Payroll software.
- Receipt capture software.
- Bank-feed software.
- Invoicing software.
- Full accounts production software.
- A full end-of-year tax return/final declaration product at MVP launch.
- A tool for editing or adjusting imported monetary totals inside the app.

## MVP definition

QuarterLink MVP is an in-year Making Tax Digital for Income Tax bridging product.

It must support:

1. User account creation and secure login.
2. Individual taxpayer onboarding.
3. HMRC OAuth authorisation.
4. Retrieval/display of relevant business income sources.
5. Retrieval/display of obligations for supported income sources.
6. Spreadsheet/CSV import of linked category totals.
7. Read-only review of imported totals.
8. User declaration/confirmation before sending.
9. Sending quarterly updates for supported income sources.
10. HMRC response capture.
11. Submission evidence pack.
12. Audit log.
13. Clear signposting for final declaration/tax return outside MVP.

## Supported MVP income-source types

MVP should support these as first-class concepts:

- Self-employment.
- Multiple self-employments.
- UK property income.
- Foreign property income.
- Mixed self-employment plus property users.

## Multi-tenant SaaS target

QuarterLink must be designed as one SaaS platform, not separate apps.

Tenant types:

| Tenant type | MVP support | Notes |
|---|---:|---|
| Individual taxpayer | Yes | First commercial launch path. |
| Sole trader landlord combo | Yes | One login, multiple income sources. |
| Accounting/bookkeeping practice | Later, but architecture must not block it | Practice can manage clients and staff. |
| Read-only client portal | Later | Useful for practice-managed clients. |
| Platform admin | Internal only | Strict audit and access controls. |

## MVP exclusions

The MVP must not include:

- VAT features.
- Full bookkeeping ledger.
- Bank feeds.
- Receipt scanning/capture.
- Payroll.
- Invoicing.
- Full accounts production.
- In-app tax adjustments.
- In-app final declaration submission.
- In-app full tax return submission.
- Manual editing of imported monetary figures.
- Arbitrary AI mapping of messy spreadsheets as a launch blocker.
- HMRC production/recognition claims before actual approval/recognition.
- Fake HMRC sandbox evidence.
- Fake production evidence.
- Claims that QuarterLink is HMRC-approved or HMRC-endorsed.

## Future product ladder

Future tiers may include:

- QuarterLink Individual.
- QuarterLink Plus.
- QuarterLink Agent.
- QuarterLink Practice.
- Later end-of-year/final declaration module if explicitly scoped and approved.

Pricing is not decided in bootstrap. Do not publish pricing until product scope, costs, support requirements and HMRC access position are known.

## Product success criteria

A credible first release must achieve:

- Clear bridging-only scope.
- Correct HMRC wording.
- HMRC OAuth and API integration in sandbox before production claims.
- Fraud prevention headers implemented and evidenced.
- Spreadsheet import path with digital-link evidence.
- No in-app editing of imported monetary figures.
- Tenant isolation.
- Audit log for all material actions.
- Evidence pack for every submission.
- Clear final declaration/tax return signposting/diversion.
- No misleading marketing claims.

## Non-negotiable product principles

1. Spreadsheet totals are imported, not manually typed into the app for submission.
2. Imported monetary values are read-only in QuarterLink.
3. Corrections happen in the source spreadsheet/record-keeping software, then are re-imported.
4. Every submission must have a durable audit trail.
5. Every HMRC call must use compliant fraud prevention headers once HMRC APIs are implemented.
6. Every tenant boundary must be enforced by code and data access rules.
7. User-facing copy must not overstate current capability.
8. The public website must distinguish “being built” from “available now”.

## Current product state

As of 2026-05-11, the live repo has completed QL-001 and remains a web-app skeleton only.

Implemented:

- Next.js/TypeScript/Tailwind scaffold.
- Control documents.
- Placeholder source folders.
- Lightweight tax-regime placeholders.
- Static app-oriented first screen.
- README bootstrap cleanup.

Not implemented:

- Auth.
- Database.
- Multi-tenancy.
- HMRC OAuth.
- HMRC API calls.
- Fraud prevention headers.
- Spreadsheet import/parsing.
- Quarterly update payload submission.
- Evidence packs.
- Audit log.
- Billing.
- Practice/client workflows.
- Production-grade sales website.
