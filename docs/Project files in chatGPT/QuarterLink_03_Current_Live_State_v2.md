# QuarterLink — Current Live State v2

Last updated: 2026-05-11
Repository: `leehaetu/QuarterLink`
Default branch: `main`
Status: QL-001 pushed to main; pending GPT/human acceptance review

## Confirmed live repo state

Known latest committed state:

```text
ec0e78939609cc7a4befae8ee354fe030b2d5e37
```

Known tag:

```text
bootstrap-complete
```

Known control state:

- `.agent/STATUS.md` says current ticket `QL-001` is `CODEX_COMPLETED`.
- `.agent/QUEUE.md` says `QL-BOOTSTRAP` is `COMMITTED`.
- `.agent/QUEUE.md` says `QL-001` is `CODEX_COMPLETED`.
- `docs/tickets/QL-BOOTSTRAP.md` says `COMMITTED`.
- `QL-001` is `CODEX_COMPLETED`.
- `QL-002`, `QL-003`, and `QL-004` are still `DRAFT`.

## Resolved accidental branch

A branch was accidentally created by GPT/GitHub tooling:

```text
ql-001-status-fix-draft
```

It was deleted from `origin` on 2026-05-11 after explicit human approval.

Post-deletion checks show no matching local branch and no matching remote branch.

## Resolved local drift

`docs/tickets/QL-BOOTSTRAP.md` now says:

```text
Status: COMMITTED
```

This now matches `.agent/STATUS.md` and `.agent/QUEUE.md` in the local working tree:

```text
COMMITTED
```

This drift fix was committed and pushed as part of QL-001.

## Current QL-001 state

`docs/tickets/QL-001.md` was too thin. It previously said:

```text
Scope
To be specified in a later ticket.
```

The live `main` branch now contains the implemented QL-001 web-app skeleton:

- `README.md` cleanup.
- Static app-oriented first screen.
- No HMRC, authentication, database, spreadsheet parsing, billing, tenant persistence, or platform admin features.
- QL-001 is `CODEX_COMPLETED`, not `GPT_ACCEPTED`.

## Current repo capability

Implemented:

- Next.js scaffold.
- TypeScript.
- Tailwind.
- ESLint.
- `src/` directory.
- Static app-oriented first screen.
- Control files.
- Placeholder source folders.
- Lightweight tax-regime placeholders.

Not implemented:

- User auth.
- Organisation/tenant model.
- Database.
- Row-level access control.
- HMRC OAuth.
- HMRC APIs.
- Fraud prevention headers.
- Spreadsheet upload/import.
- Digital-link evidence.
- Quarterly update submission.
- Audit logs.
- Evidence packs.
- Public production website.
- Billing.
- Practice/client workflows.

## Known skeleton cleanup item

`README.md` default create-next-app boilerplate and `app/page.tsx` path drift are fixed in the local QL-001 implementation.

This is committed and pushed. QL-001 still needs GPT/human acceptance review.

## Correct next action

Order:

1. Review QL-001 implementation.
2. Move QL-001 through GPT/human acceptance if approved, or mark fixes required.
3. Clean up the project-pack source files before treating `docs/Project files in chatGPT/` as complete source of truth.
4. Do not start QL-002 until QL-001 is accepted and the next ticket is explicitly approved.

## Update rule

Update this file after every:

- accepted Codex run,
- commit,
- push,
- tag,
- branch deletion,
- ticket approval,
- checkpoint pass,
- or discovered drift issue.
