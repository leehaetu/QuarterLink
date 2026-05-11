# Project Files Consolidation Report 001

Status: COMPLETED_AND_COMMITTED
Date: 2026-05-12

## Purpose

Record the cleanup and review of `docs/Project files in chatGPT/` so the active v2 project pack is the clear source of truth for QuarterLink planning and next steps.

## Active v2 Pack

The active top-level folder contains a clean `00` to `08` v2 pack:

- `QuarterLink_00_Project_File_Index_and_Usage_v2.md`
- `QuarterLink_01_Product_Source_of_Truth_v2.md`
- `QuarterLink_02_AI_Workflow_and_Control_Rules_v2.md`
- `QuarterLink_03_Current_Live_State_v2.md`
- `QuarterLink_04_HMRC_Compliance_Matrix_v2.md`
- `QuarterLink_05_Bridging_Digital_Links_Spec_v2.md`
- `QuarterLink_06_SaaS_Tenancy_RBAC_Security_v2.md`
- `QuarterLink_07_Website_Copy_and_Prelaunch_Rules_v2.md`
- `QuarterLink_08_Roadmap_Tickets_and_Codex_Prompts_v2.md`

## Consolidation Actions

- Previous top-level duplicate ` 2.md` files for `00` to `03` were byte-for-byte identical to the clean filenames before deletion.
- `QuarterLink_04_HMRC_Compliance_Matrix_v2 2.md` was the only available `04` copy and was renamed to `QuarterLink_04_HMRC_Compliance_Matrix_v2.md`.
- Files `05` to `08` were restored from the complete v2 reference pack.
- Duplicate clean/` 2.md` pairs inside the deleted v2 reference folder were byte-for-byte identical.
- The two `QuarterLink_Project_Files_v2.zip` archives had the same SHA-256 hash.
- The two website zip references matched by content when `.DS_Store` and Mac metadata were ignored.

## Extracted Details

Useful content from `Superseded/Scope apparently/QuarterLink_full_scope.md` was carried forward before deletion:

- Dashboard planning concepts were added to `QuarterLink_06_SaaS_Tenancy_RBAC_Security_v2.md`.
- Website tone of voice and visual direction were added to `QuarterLink_07_Website_Copy_and_Prelaunch_Rules_v2.md`.
- Later Railway deployment sequencing was added to `QuarterLink_08_Roadmap_Tickets_and_Codex_Prompts_v2.md`.

The remaining superseded text files were covered by the active v2 pack, tracked project docs, or completed QL-001 reports.

## Archive

`docs/Project files in chatGPT/Archive/Website project files.zip` is retained as historical website prototype material only.

It is not active source of truth and must not be copied into the live app without a dedicated approved website ticket.

## Removed Reference Material

After comparison and extraction, these local reference areas were removed:

- `docs/Project files in chatGPT/Superseded/`
- `docs/Project files in chatGPT/deleted/`

This leaves the active v2 pack plus the single archived website prototype as the project-file set.

## Run Record

The cleanup action trail is recorded in `.agent/runs/project-files-consolidation-001.md`.

## VS Code Settings

`.vscode/settings.json` only contained:

```json
{
  "chatgpt.openOnStartup": true
}
```

It was deleted because it was a personal editor preference, not a project rule.

## Tooling

ESLint ignores `docs/Project files in chatGPT/Archive/**` so archived prototype material cannot be treated as active app code if expanded later.

## Checks

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.

## Closeout

Human review accepted this consolidation. The active `00` to `08` v2 pack, the archive zip, this report, and the ESLint ignore update were committed before QL-002.

Codex must not mark this `GPT_ACCEPTED`.
