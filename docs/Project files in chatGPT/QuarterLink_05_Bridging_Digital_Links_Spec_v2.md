# QuarterLink — Bridging and Digital Links Specification v2

Last updated: 2026-05-11
Status: active bridging specification source of truth

## Purpose

This file defines the product boundary that keeps QuarterLink as bridging software rather than full bookkeeping software.

## Core bridging rule

QuarterLink must connect to spreadsheet records. It must not become the user's primary bookkeeping ledger in MVP.

Imported monetary figures must be read-only after import.

If a figure is wrong:

1. The user corrects the source spreadsheet/record-keeping software.
2. The user re-imports the corrected totals.
3. QuarterLink records the new import attempt and evidence.
4. QuarterLink never silently edits the previous imported values.

## Supported import routes

### Route A — QuarterLink template

User records income/expense data in a QuarterLink-provided spreadsheet template.

Pros:

- Easier validation.
- Lower mapping complexity.
- Better first sandbox evidence path.

Cons:

- Weaker “keep your spreadsheet” message.
- Users with existing sheets may resist migrating.

MVP status:

- Useful for internal sandbox/testing and early users.
- Should not be the only product route if the core sales message is “keep your spreadsheet”.

### Route B — Linked summary sheet

User keeps their existing spreadsheet, but adds a QuarterLink summary sheet or area. The summary cells are linked by formula to existing record sheets.

Pros:

- Strongest alignment with bridging software.
- Strongest customer proposition.
- Clear digital-link path.
- Lower risk than arbitrary messy spreadsheet mapping.

Cons:

- User must add/maintain the summary sheet correctly.
- Needs clear template and validation rules.

MVP recommendation:

- Route B should be the primary public MVP route.

### Route C — CSV/XLSX export/import from another product

User exports records/totals from another record-keeping tool and imports into QuarterLink.

Pros:

- Accepted digital-link route where supported.
- Useful for agents/practices.

Cons:

- Needs strict import mapping and evidence.
- Must avoid manual copy/paste.

MVP status:

- Good secondary route after Route B.

### Route D — Smart mapping of arbitrary spreadsheets

QuarterLink tries to infer figures from messy spreadsheets.

MVP status:

- Not a launch blocker.
- Later paid feature only after core compliance is stable.

## Digital-link evidence requirements

Every import should capture:

- Tenant ID.
- User ID.
- Taxpayer/client ID.
- Income source ID.
- Tax year.
- Update period start date.
- Update period end date.
- Source file name.
- Source file type.
- Source file size.
- Source file hash.
- Upload/import timestamp.
- Mapping/template version.
- Sheet name(s).
- Cell references or column mapping.
- Category code/name.
- Imported value.
- Validation result.
- User confirmation timestamp.
- Submission ID if later submitted.
- Previous import ID if this import replaces or corrects a prior import attempt.

Do not store the full spreadsheet forever by default unless a clear retention/legal/business reason is approved. Prefer storing import evidence and the exact imported category totals needed for audit/submission records.

## Imported totals model

At minimum:

```text
import_batch
  id
  tenant_id
  taxpayer_id
  income_source_id
  tax_year
  period_start
  period_end
  source_type
  source_filename
  source_hash
  mapping_version
  status
  created_by_user_id
  created_at

import_line
  id
  import_batch_id
  category_code
  category_label
  amount
  source_sheet
  source_cell_or_column
  validation_status
  validation_message
```

## Submission evidence model

Every submission must capture:

- Submission attempt ID.
- Tenant ID.
- User ID.
- Taxpayer/client ID.
- HMRC income source/business ID.
- Tax year.
- Period start/end.
- Import batch used.
- Payload sent to HMRC.
- Payload hash.
- HMRC endpoint/version.
- HMRC correlation/request ID where available.
- HMRC response body/status where allowed.
- Success/failure state.
- Error code/message.
- User declaration text shown.
- User declaration timestamp.
- Fraud prevention header evidence record reference.
- Created/updated timestamps.

The evidence pack must be immutable after successful submission except for append-only notes/status updates.

## Validation rules before submission

Block submission if:

- No HMRC authorisation exists.
- HMRC authorisation expired and cannot be refreshed.
- No income source is selected.
- Period does not match an open/relevant HMRC obligation.
- Source file hash is missing.
- Import mapping is incomplete.
- Required category totals are missing.
- Imported value is non-numeric.
- Totals fail type/category validation.
- User has not confirmed the declaration.
- Current user lacks permission.
- Tenant/client access check fails.
- Fraud prevention header evidence cannot be created.

Warn, but do not necessarily block, if:

- Value is zero.
- Previous import exists for same period.
- Spreadsheet filename differs from prior import.
- Mapping version changed.
- User is importing close to deadline.
- User has multiple income sources and only one is being submitted.

## Corrections workflow

During the year:

1. User notices error.
2. User corrects source spreadsheet.
3. User imports again.
4. QuarterLink records the new import batch.
5. The next quarterly update includes the corrected data according to HMRC rules/API behaviour.

Do not normalise this as “editing a previous submitted update” unless current HMRC rules/API endpoints require that exact flow.

After the fourth update:

- Do not implement correction handling without a specific ticket and a fresh HMRC check.

## No manual-edit rule

QuarterLink may allow:

- Notes.
- Mapping metadata edits.
- Re-import.
- Source cell/column selection.
- Category mapping where the mapping is not changing monetary values.

QuarterLink must not allow:

- Typing over imported monetary totals.
- Adjusting category totals inside the app.
- Copy/paste-based value transfer as a submission route.
- Manual “balancing” entries inside QuarterLink.
- Tax adjustments in quarterly-update workflow.

## User-facing wording for import screen

Approved style:

```text
QuarterLink reads linked totals from your spreadsheet. If a figure is wrong, correct it in your spreadsheet and import again.
```

Avoid:

```text
Edit your quarterly update figures here.
Adjust your tax figures before sending.
Type your totals into QuarterLink.
```

## MVP spreadsheet deliverables

Before implementation, create:

- Route B summary-sheet template.
- Category list by income-source type.
- Mapping version document.
- Import validation table.
- Evidence pack schema.
- User instructions for linking cells.
- Internal test spreadsheet examples.

## Anti-overbuild rule

Do not build AI mapping, OCR, receipt capture, bank feed import, invoice creation, or full ledger tools before the core Route B import/submission path works in sandbox.
