# QuarterLink — HMRC Compliance Matrix v2

Last updated: 2026-05-10
Status: active HMRC/GOV.UK compliance source of truth

## Purpose

This file maps QuarterLink's intended MVP to official Making Tax Digital for Income Tax requirements and HMRC developer integration expectations.

This is not legal advice. Re-check official HMRC/GOV.UK sources before production use, public launch, or recognition/production-access claims.

## Current legal/product context

Making Tax Digital for Income Tax applies from 6 April 2026 to some sole traders and landlords, initially based on total income thresholds. GOV.UK currently states rollout thresholds of over £50,000 from April 2026, over £30,000 from April 2027, and over £20,000 from April 2028.

QuarterLink is targeting software that connects to existing spreadsheet records, also known as bridging software.

## Scope decision

QuarterLink MVP is an **in-year product** for quarterly updates.

QuarterLink MVP is not a full end-of-year/final declaration product.

Required MVP position:

```text
QuarterLink helps users send Making Tax Digital for Income Tax quarterly updates from spreadsheet records. Final declaration/tax return submission is outside the MVP and must be signposted or diverted until explicitly scoped.
```

## HMRC developer minimum functionality alignment

HMRC developer guidance expects Making Tax Digital for Income Tax-compatible products to facilitate the full journey either alone or collectively with other products. For an in-year product, HMRC identifies Business Details, Obligations, Self Employment Business and/or Property Business APIs, plus Individual Calculations if displaying calculations in software rather than signposting to HMRC account.

| Requirement area | QuarterLink MVP approach | Status |
|---|---|---|
| Fraud prevention headers | Must be designed and implemented for all HMRC API calls. | Not built. Required before real HMRC API integration. |
| Business ID / income-source discovery | Use Business Details API to retrieve self-employment/property business details. | Not built. Required. |
| Digital records | QuarterLink connects to spreadsheet records rather than becoming full record-keeping software. | Needs exact import/evidence spec. |
| Digital links | Supported through linked summary sheet, CSV/XLSX import, and evidence capture. | Needs implementation. |
| Quarterly updates | Submit category totals per income source and period. | Not built. Required. |
| Multiple self-employments | Must support separate records/updates per self-employment source. | Required. |
| UK property | Must support property income source. | Required. |
| Foreign property | Must support foreign property income source. | Required. |
| Tax estimate | Prefer signpost to HMRC account for MVP. If displayed in app, use Individual Calculations and disclaimer. | Signpost first. |
| Final declaration/tax return | Out of MVP. Must signpost/divert. | Not built. |

## Quarterly update periods

### Standard update periods

| Update period | Deadline to send |
|---|---:|
| 6 April to 5 July | 7 August |
| 6 April to 5 October | 7 November |
| 6 April to 5 January | 7 February |
| 6 April to 5 April | 7 May |

Important:

- Do not confuse period end dates with deadlines.
- Q1 period end is 5 July.
- Q1 deadline is 7 August.
- Quarterly updates are not tax returns.

### Calendar update periods

Calendar update periods are later scope unless explicitly brought into MVP.

If supported later:

| Calendar update period | Deadline to send |
|---|---:|
| 1 April to 30 June | 7 August |
| 1 April to 30 September | 7 November |
| 1 April to 31 December | 7 February |
| 1 April to 31 March | 7 May |

Guardrail:

- If a user chooses calendar update periods before the first update, the app must not let them silently switch after submitting the first update unless HMRC rules allow it.

## Quarterly update content rules

Quarterly updates are category totals derived from digital records.

GOV.UK states that users do not need to make accounting or tax adjustments before sending quarterly updates. HMRC receives totals for relevant income and expense categories, not individual digital records.

Product rules:

- Do not call quarterly updates tax returns.
- Do not ask users to perform accounting/tax adjustments before quarterly updates.
- Do not send individual transactions to HMRC for quarterly updates unless an HMRC endpoint specifically requires it.
- If no income or expenses occurred, the app must still support sending the relevant nil/no-activity update if HMRC obligation requires it.

## Corrections

GOV.UK says corrections made during the year are reflected in the next quarterly update. The app must therefore:

- Encourage users to correct the spreadsheet/source records.
- Re-import corrected linked totals.
- Keep previous submission evidence immutable.
- Show that the next update includes corrected year-to-date/category totals where applicable.
- Avoid presenting “amend previous quarterly update” as the normal route.

Special handling may be needed after the fourth quarterly update; do not implement without checking current HMRC rules and API behaviour.

## Digital records and digital links

GOV.UK says software can either create digital records or connect to existing records such as spreadsheets. It also says, where multiple products are used, records must be digitally linked, and copy/paste or cut/paste is not an acceptable way to move records.

QuarterLink MVP rule:

- QuarterLink connects to existing spreadsheet records.
- QuarterLink does not become the primary bookkeeping ledger.
- Imported monetary totals are read-only.
- If a value is wrong, correct the source spreadsheet and re-import.

## Required HMRC APIs for in-year MVP

| API | Why QuarterLink needs it | MVP status |
|---|---|---|
| Business Details (MTD) | Retrieve customer business income sources and manage quarterly reporting type if needed. | Required. |
| Obligations (MTD) | Retrieve obligation periods/statuses. | Required. |
| Self Employment Business (MTD) | Submit quarterly self-employment summaries. | Required for self-employment. |
| Property Business (MTD) | Submit UK/foreign property quarterly summaries. | Required for property. |
| Individual Calculations (MTD) | Required only if showing calculations in software rather than signposting. | Avoid for MVP unless explicitly approved. |
| Test Fraud Prevention Headers | Validate fraud prevention header format during development/testing. | Required for integration hardening. |

## Fraud prevention headers

HMRC states fraud prevention headers are legally required for Income Tax Self Assessment (MTD) APIs and must be correct before production access can be granted.

Product rules:

- Build fraud prevention header collection before any real HMRC sandbox evidence is claimed.
- Include fraud prevention headers in sandbox calls.
- Capture evidence that headers were sent and accepted/validated.
- Do not hard-code fake fraud prevention data.
- Do not log sensitive header values unnecessarily.
- Document browser/server/app deployment architecture because it affects header values.

## Wording rules

Use:

- Making Tax Digital for Income Tax.
- send quarterly updates.
- quarterly updates.
- update period.
- spreadsheet records.
- bridging software.
- software that connects to records.

Avoid:

- HMRC-approved.
- HMRC-authorised.
- HMRC-endorsed.
- file quarterly tax returns.
- submit quarterly returns.
- EOPS.
- End of Period Statement.
- digital handshake.
- new tax regime.
- mandated customer.
- VAT, unless saying QuarterLink is not for VAT.
- bookkeeping software, except to explain QuarterLink is not bookkeeping software.

Pre-recognition wording:

```text
QuarterLink is being built for Making Tax Digital for Income Tax quarterly updates.
```

Post-recognition wording only after actual recognition/evidence:

```text
HMRC-recognised software for Making Tax Digital for Income Tax.
```

## Production access / recognition gate

Before any public production claim, the project must have:

- HMRC Developer Hub application set up.
- Sandbox test users.
- HMRC OAuth implemented.
- Fraud prevention headers implemented and tested.
- Business Details API integration tested.
- Obligations API integration tested.
- Self Employment Business and/or Property Business quarterly update endpoints tested for supported income sources.
- Error handling tested.
- Evidence pack generated from actual sandbox calls.
- Production Approvals Checklist completed for the APIs/stage being requested.
- HMRC production access granted if required.
- Public copy updated only after recognition/access status is evidenced.


## Official sources checked for this v2 pack

These links were checked while preparing this pack on 2026-05-10. Re-check them before any HMRC-facing implementation or public launch copy is approved.

- GOV.UK — Choose the right software for Making Tax Digital for Income Tax: https://www.gov.uk/guidance/choose-the-right-software-for-making-tax-digital-for-income-tax
- GOV.UK — Use Making Tax Digital for Income Tax: send quarterly updates: https://www.gov.uk/guidance/use-making-tax-digital-for-income-tax/send-quarterly-updates
- GOV.UK — Use Making Tax Digital for Income Tax: create digital records: https://www.gov.uk/guidance/use-making-tax-digital-for-income-tax/create-digital-records
- GOV.UK — Making Tax Digital for Income Tax: quarterly update direction: https://www.gov.uk/government/publications/update-notice-for-making-tax-digital-for-income-tax
- GOV.UK — Making Tax Digital for Income Tax: digital record-keeping direction: https://www.gov.uk/government/publications/digital-record-keeping-notice-for-making-tax-digital-for-income-tax
- HMRC Developer Hub — Income Tax MTD end-to-end service guide: https://developer.service.hmrc.gov.uk/guides/income-tax-mtd-end-to-end-service-guide/documentation/how-to-integrate.html
- HMRC Developer Hub — Send fraud prevention data: https://developer.service.hmrc.gov.uk/guides/fraud-prevention
- HMRC Developer Hub — Business Details (MTD) API: https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/business-details-api/2.0
- HMRC Developer Hub — Obligations (MTD) API: https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/obligations-api/2.0
- HMRC Developer Hub — Self Employment Business (MTD) API: https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/self-employment-business-api/5.0
- HMRC Developer Hub — Property Business (MTD) API: https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/property-business-api/6.0
- HMRC Developer Hub — Individual Calculations (MTD) API: https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/individual-calculations-api/7.0
