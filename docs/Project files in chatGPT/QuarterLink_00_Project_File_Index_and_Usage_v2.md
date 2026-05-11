# QuarterLink — Project File Index and Usage Rules v2

Last updated: 2026-05-12
Status: active project-pack index

## Purpose

This file pack replaces the earlier mixed project files. The previous files were useful for bootstrap control, but they overlapped and did not fully describe the target product: an HMRC Making Tax Digital for Income Tax bridging-only, multi-tenant SaaS with a public information and sales website.

Use this v2 pack as the project source of truth for future ChatGPT and Codex work.

## Intended v2 files

The intended complete v2 pack has nine files:

1. `QuarterLink_00_Project_File_Index_and_Usage_v2.md` — how to use the pack.
2. `QuarterLink_01_Product_Source_of_Truth_v2.md` — product position, MVP, exclusions, success criteria.
3. `QuarterLink_02_AI_Workflow_and_Control_Rules_v2.md` — GPT/Codex/human workflow and status rules.
4. `QuarterLink_03_Current_Live_State_v2.md` — live repo state and immediate next action.
5. `QuarterLink_04_HMRC_Compliance_Matrix_v2.md` — official HMRC/GOV.UK requirement mapping.
6. `QuarterLink_05_Bridging_Digital_Links_Spec_v2.md` — spreadsheet, import, evidence and bridging-only rules.
7. `QuarterLink_06_SaaS_Tenancy_RBAC_Security_v2.md` — multi-tenant SaaS, RBAC, audit, support and security blueprint.
8. `QuarterLink_07_Website_Copy_and_Prelaunch_Rules_v2.md` — public website, copy, legal-risk and launch boundaries.
9. `QuarterLink_08_Roadmap_Tickets_and_Codex_Prompts_v2.md` — build sequence and exact immediate Codex prompts.

## Currently present in this repo folder

As of 2026-05-11, this working tree contains clean, non-duplicate copies of files `00` to `08`.

Files `05` to `08` were restored from the complete v2 reference pack before the duplicate/deleted reference folders were removed. The duplicate ` 2.md` copies in that reference pack were byte-for-byte identical to the clean filenames and were not promoted.

## Retired / downgraded files

These earlier files have been superseded by the active v2 pack and should not be treated as source of truth:

- `QuarterLink_00_How_To_Use_Project_Files.md`
- `QuarterLink_01_Master_Source_of_Truth.md`
- `QuarterLink_02_AI_Workflow_and_Control_Rules.md`
- `QuarterLink_03_Current_Live_State.md`
- `QuarterLink_04_QL001_Draft_Ticket.md`
- `QuarterLink_05_Codex_Prompt_Apply_Status_Fix_and_QL001_Draft.md`
- `QuarterLink_06_HMRC_Wording_Guardrails.md`
- `QuarterLink_full_scope.md`
- `Website project files.zip`

Useful details from those files have either been carried into the active v2 files or judged obsolete. The old website zip is retained only under `Archive/` as a visual/content prototype. It must not be copied into the live repo without a separate approved website ticket.

## Archive folder

`Archive/Website project files.zip` is the only retained historical reference from the cleanup.

It is not active source of truth. It exists only as a reference for future website design/copy work after a dedicated website ticket is approved.

## How future chats must use this pack

At the start of a QuarterLink development chat, instruct ChatGPT:

```text
Use the QuarterLink v2 project files as the source of truth. Do not rely on old chat memory if it conflicts with the v2 files. Check the Current Live State file and live GitHub repo before giving Codex instructions.
```

## Source priority order

When there is conflict, use this order:

1. Official HMRC/GOV.UK/developer guidance checked live for the current date.
2. Live repo state.
3. These v2 project files.
4. Earlier uploaded project files.
5. Chat history.
6. Model memory.

For this project, old memory and old chats must not override the v2 files or live repo.

## Mandatory pre-Codex checklist

Before giving Codex an instruction, GPT must check:

- Current live repo branch and status if GitHub/repo access is available.
- `.agent/STATUS.md`.
- `.agent/QUEUE.md`.
- Current ticket file under `docs/tickets/`.
- `QuarterLink_03_Current_Live_State_v2.md`.
- Relevant scope file from this pack.
- HMRC wording/compliance file if user-facing or HMRC-facing work is involved.

If the repo conflicts with the project files, stop and call out the conflict before giving Codex instructions.

## Current immediate priority

Do not build HMRC, authentication, database, spreadsheet import, billing, or tenant-management features without an approved ticket.

Immediate order:

1. Treat QL-001 and the project-file consolidation as human-accepted and committed after the QL-002 control-sync commit.
2. Use QL-003 to define the narrow polished sandbox-readiness MVP and HMRC production-access checklist.
3. Move quickly into QL-004 product UI/workflow implementation.
4. Keep sandbox evidence claims blocked until real HMRC sandbox API calls occur.


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
