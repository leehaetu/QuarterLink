# Sandbox-Readiness MVP

Status: QL-003 Codex draft for human review
Last updated: 2026-05-12

## Purpose

This file defines the narrow first QuarterLink vertical slice that is worth polishing before HMRC sandbox API testing starts.

This is not the full commercial product definition. It is a sandbox-readiness target for bridging software that helps a user send quarterly updates from spreadsheet records.

## Official Sources Checked

Checked on 2026-05-12:

- HMRC Developer Hub, Making Tax Digital for Income Tax end-to-end service guide: `https://developer.service.hmrc.gov.uk/guides/income-tax-mtd-end-to-end-service-guide/documentation/how-to-integrate.html`
- HMRC Developer Hub, Income Tax MTD API catalogue: `https://developer.service.hmrc.gov.uk/api-documentation/docs/api?categoryFilters=INCOME_TAX_MTD`
- HMRC Developer Hub, fraud prevention data guide: `https://developer.service.hmrc.gov.uk/guides/fraud-prevention`
- GOV.UK, choose the right software for Making Tax Digital for Income Tax: `https://www.gov.uk/guidance/choose-the-right-software-for-making-tax-digital-for-income-tax`
- GOV.UK, create digital records: `https://www.gov.uk/guidance/use-making-tax-digital-for-income-tax/create-digital-records`
- GOV.UK, send quarterly updates: `https://www.gov.uk/guidance/use-making-tax-digital-for-income-tax/send-quarterly-updates`
- GOV.UK, quarterly update direction: `https://www.gov.uk/government/publications/update-notice-for-making-tax-digital-for-income-tax`
- GOV.UK, digital record-keeping direction: `https://www.gov.uk/government/publications/digital-record-keeping-notice-for-making-tax-digital-for-income-tax`
- GOV.UK, find software that works with Making Tax Digital for Income Tax: `https://www.gov.uk/guidance/find-software-that-works-with-making-tax-digital-for-income-tax`

Any HMRC production-access form wording, approval checklist wording, recognition status, or live API version must be re-checked by a human when the Developer Hub application is opened.

## First Slice Definition

The first sandbox-readiness slice is:

- individual taxpayer only
- one self-employment income source first
- UK Making Tax Digital for Income Tax regime only
- Route B linked spreadsheet summary workflow first
- standard update periods first
- one quarterly update path for one open obligation
- read-only imported and submitted totals
- no in-app editing of accounting figures
- no transaction-level accounting system
- no final declaration or tax return workflow
- evidence capture sufficient to support later HMRC sandbox testing

This slice should make the user journey coherent before any real HMRC sandbox evidence is claimed.

## In Scope For This Slice

- App workspace that guides one individual user through the intended flow.
- Route B choice: user keeps an existing spreadsheet and adds a QuarterLink linked summary sheet.
- Clear instructions that corrections happen in the spreadsheet, followed by re-import.
- Import-review screen using local/static or later imported totals, with monetary totals locked read-only.
- Evidence model for source file hash, source sheet/cell references, mapping version, imported category totals, user confirmation, and later submission attempt references.
- HMRC connection placeholder until an approved HMRC integration ticket builds OAuth.
- Quarterly update readiness path for self-employment category totals.
- Declaration copy that states the action is to send a quarterly update, not a tax return.
- Local evidence boundaries that distinguish mock/local data from future HMRC sandbox API evidence.

## Deliberately Deferred

- UK property income.
- Foreign property income.
- Multiple self-employments.
- Agent, practice, staff, and client-assignment workflows.
- Route A QuarterLink spreadsheet template as the main route.
- Route C export/import from another product.
- Route D smart mapping of arbitrary spreadsheets.
- Calendar update periods.
- Nil/no-activity handling beyond noting the requirement for later HMRC verification.
- Full production authentication, database storage, billing, support tooling, and platform administration.
- Tax estimate, annual adjustment, final declaration, or tax return workflows.
- Public production website.

## Must Not Be Built Into The Bridging-Only MVP

These would pull QuarterLink toward full bookkeeping or tax software and are blocked for the bridging-only MVP:

- bookkeeping ledger
- transaction entry or transaction editing
- bank feeds
- receipt capture or OCR
- payroll
- invoicing
- VAT features
- AI categorisation of accounting records
- in-app tax adjustments
- manual edits to imported monetary totals
- copy/paste as the route for moving accounting figures into QuarterLink
- full accounts production
- final declaration or tax return submission inside the first slice

Future modules can only be considered through a later approved ticket and must not weaken the read-only bridging path.

## Required Before Sandbox API Testing Starts

No HMRC sandbox evidence exists until the app makes real HMRC sandbox API calls.

Before starting sandbox API testing, QuarterLink must have:

- QL-004 guided workspace that makes the Route B flow understandable.
- QL-005 Route B summary-sheet template, mapping version, validation rules, and evidence design.
- QL-006 security and HMRC access architecture for OAuth, server-side secrets, token handling, audit events, and fraud prevention headers.
- HMRC Developer Hub sandbox application and subscribed APIs for the narrow path.
- Sandbox credentials stored securely outside source control.
- Sandbox test user plan.
- OAuth callback and reconnection behaviour designed for user-restricted endpoints.
- Fraud prevention header connection method chosen for a web application via server.
- Test Fraud Prevention Headers API plan before any Making Tax Digital for Income Tax API calls.
- Evidence boundaries that label local mock data as local mock data only.
- No public claim of production access, HMRC recognition, or sandbox success.

## Required Before Production-Access Application

Before applying for production credentials or recognition-related listing, QuarterLink must have:

- actual sandbox evidence from Business Details, Obligations, and Self Employment Business API calls for the supported path
- fraud prevention headers implemented and checked with the Test Fraud Prevention Headers API
- OAuth consent journey implemented without storing HMRC sign-in details
- terms and conditions URL and privacy policy URL for the software
- error handling evidence for expected HMRC errors, expired tokens, denied authorisation, validation failures, and service failures
- audit trail for HMRC connect/disconnect, import, review, declaration, send attempt, and response capture
- support access boundaries that prevent support staff from sending updates or editing figures
- retention position for evidence, audit logs, source-file metadata, and uploaded files
- public wording reviewed to avoid production readiness, approval, or recognition claims
- completed HMRC Production Approvals Checklist or current Developer Hub production-access questions

## Next Ticket Dependency

The next recommended ticket is QL-004: build the polished app workspace and guided workflow shell, with static/local state only and no HMRC API calls.
