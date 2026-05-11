# QuarterLink — AI Workflow and Control Rules v2

Last updated: 2026-05-12
Status: active workflow source of truth

## Roles

### GPT / ChatGPT

GPT should:

- Read the v2 project files before giving implementation instructions.
- Check live repo state when available.
- Create tickets.
- Review Codex output.
- Check scope, architecture, HMRC wording, security and SaaS boundaries.
- Write exact Codex prompts.
- Accept, reject or request fixes after Codex output.

GPT must not:

- Invent product scope without marking it as proposed.
- Treat old chats or memory as more authoritative than the v2 files.
- Tell Codex to implement unapproved features.
- Merge old documents together if they conflict without calling out the conflict.
- Generate HMRC API structures from assumptions when official API docs or repo code should be checked.

### Codex

Codex should:

- Work on one approved ticket at a time.
- Edit only files within the ticket scope.
- Run the required checks.
- Create/update run reports.
- Stop after the ticket.
- Report exactly what changed.

Codex must not:

- Decide product strategy.
- Decide HMRC compliance scope.
- Mark work `GPT_ACCEPTED`.
- Start the next ticket.
- Commit unless explicitly instructed.
- Push unless explicitly instructed.
- Create/delete tags unless explicitly instructed.
- Add dependencies outside approved scope.
- Add product features outside the active ticket.
- Copy the old website zip into the app unless a dedicated website ticket approves it.

### Human

The human controls:

- Final product decisions.
- Whether a ticket is approved for Codex.
- Commits.
- Pushes.
- Merges.
- Tags.
- HMRC production/recognition decisions.

## Allowed ticket statuses

```text
DRAFT
GPT_APPROVED_FOR_CODEX
CODEX_IN_PROGRESS
CODEX_COMPLETED
GPT_REVIEWING
FIX_REQUIRED
GPT_ACCEPTED
COMMITTED
CHECKPOINT_PASSED
```

## Status rules

- A ticket starts as `DRAFT`.
- GPT/human may move a ticket to `GPT_APPROVED_FOR_CODEX`.
- Codex may move an approved ticket to `CODEX_IN_PROGRESS`.
- Codex may move its implemented work to `CODEX_COMPLETED` after checks and run report.
- Codex must never mark anything `GPT_ACCEPTED`.
- GPT reviews and may recommend `FIX_REQUIRED` or `GPT_ACCEPTED`.
- A ticket becomes `COMMITTED` only after the relevant commit exists.
- A gate becomes `CHECKPOINT_PASSED` only after explicit GPT/human review.

## Branch rules

Default:

- Work on a clearly named branch for non-trivial changes.
- Do not modify `main` directly unless human explicitly instructs it.
- Do not leave accidental branches around.
- If a mistaken branch is created, delete it with explicit human approval.

## Commit rules

Default:

- Codex does not commit.
- Codex does not push.
- Codex stops after creating/editing files and running checks.
- Human commits after GPT acceptance.

Exception:

- If human explicitly instructs Codex to commit/push/delete a branch, Codex may do only that exact requested Git action.

## Run report rules

Every meaningful Codex run must write a report under:

```text
.agent/runs/
```

Run report must include:

- Ticket name.
- Status.
- Branch.
- Files inspected.
- Files changed.
- Commands run.
- Command results.
- What changed.
- What deliberately did not change.
- Risks or unresolved issues.
- Whether commit/push/tag/branch deletion happened.
- Suggested next step.

## Evidence rules

- Do not claim HMRC sandbox evidence unless it came from real HMRC sandbox API calls made by the app.
- Local mocks are not HMRC sandbox evidence.
- Test fixtures are not HMRC sandbox evidence.
- Screenshots of local pages are not HMRC sandbox evidence.
- No production access, approval or recognition claim may be made until evidenced.

## Drift-control rules

If repo files conflict with v2 project files:

1. Stop.
2. Identify the conflicting files.
3. Explain which source is more authoritative.
4. Give a narrow drift-fix prompt before product work.

If HMRC wording conflicts with the guardrails:

- The guardrails win unless a newer official HMRC source has been checked and documented.

If official HMRC/GOV.UK guidance changes:

- Update the compliance matrix first.
- Then update affected tickets and copy.

## Current workflow gate

The bootstrap and project-pack cleanup are closed.

Current direction:

1. QL-001 is accepted by the human and recorded as `COMMITTED`.
2. The project-file consolidation is accepted by the human and recorded as completed/committed.
3. QL-002 reconciles the ticket sequence and does not mark anything `GPT_ACCEPTED`.
4. QL-003 is the next draft ticket: sandbox-readiness MVP target and HMRC production-access checklist.
5. QL-004 should move quickly back into product UI/workflow implementation after QL-003 is accepted.

No HMRC/auth/database/spreadsheet feature work starts without an explicitly approved ticket. The project should now move toward a polished sandbox-readiness MVP, not remain in open-ended documentation cleanup.
