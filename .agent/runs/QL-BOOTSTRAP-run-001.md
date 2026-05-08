# QL-BOOTSTRAP Run 001

## Ticket

QL-BOOTSTRAP

## Status

CODEX_COMPLETED

## Runtime

- Node.js version: v24.12.0
- Package manager: npm 11.6.2
- Next.js version: 16.2.6
- TypeScript version: 5.9.3
- Turbopack: enabled in `package.json` with `next dev --turbopack`; `next build` also reported `Next.js 16.2.6 (Turbopack)`.

## Files Created or Changed

- Created or replaced bootstrap control files:
  - `AGENTS.md`
  - `.agent/STATUS.md`
  - `.agent/QUEUE.md`
  - `.agent/DECISIONS.md`
  - `.agent/runs/.gitkeep`
  - `.agent/runs/QL-BOOTSTRAP-run-001.md`
  - `.agent/checkpoints/.gitkeep`
  - `.agent/evidence/sandbox/EVIDENCE_RULES.md`
  - `.agent/evidence/local-mock/.gitkeep`
- Created project source-of-truth documents:
  - `docs/PROJECT_BRIEF.md`
  - `docs/AI_OPERATING_SYSTEM.md`
  - `docs/HMRC_WORDING_AND_SCOPE.md`
  - `docs/PROMPT_LIBRARY.md`
  - `docs/checkpoints/GATE_RULES.md`
  - `docs/hmrc/HMRC_FACTS.md`
  - `docs/architecture/COUNTRY_ADAPTER_ARCHITECTURE.md`
  - `docs/reviews/README.md`
- Created ticket documents:
  - `docs/tickets/QL-BOOTSTRAP.md`
  - `docs/tickets/QL-001.md`
  - `docs/tickets/QL-002.md`
  - `docs/tickets/QL-003.md`
  - `docs/tickets/QL-004.md`
- Created Next.js scaffold files from `create-next-app` output:
  - `.gitignore`
  - `eslint.config.mjs`
  - `next.config.ts`
  - `next-env.d.ts`
  - `package.json`
  - `package-lock.json`
  - `postcss.config.mjs`
  - `tsconfig.json`
  - `public/file.svg`
  - `public/globe.svg`
  - `public/next.svg`
  - `public/vercel.svg`
  - `public/window.svg`
  - `src/app/favicon.ico`
  - `src/app/globals.css`
  - `src/app/layout.tsx`
  - `src/app/page.tsx`
- Created placeholder source folders:
  - `src/core/audit/.gitkeep`
  - `src/core/spreadsheets/.gitkeep`
  - `src/core/organisations/.gitkeep`
  - `src/core/users/.gitkeep`
  - `src/core/submissions/.gitkeep`
- Created lightweight tax-regime placeholders:
  - `src/tax-regimes/common/index.ts`
  - `src/tax-regimes/uk/mtd-income-tax/index.ts`

## Commands Run

- `node -v`
- `npx create-next-app@latest . --yes --reset-preferences --ts --eslint --tailwind --app --src-dir --turbopack --import-alias "@/*" --use-npm --disable-git`
- `npx -y create-next-app@latest . --yes --ts --eslint --tailwind --app --src-dir --turbopack --import-alias "@/*" --use-npm --disable-git`
- `npx -y create-next-app@latest quarterlink-scaffold --yes --ts --eslint --tailwind --app --src-dir --turbopack --import-alias "@/*" --use-npm --disable-git`
- `rsync -a --exclude node_modules --exclude .next --exclude .git "quarterlink-scaffold/" "QuarterLink MTD ITSA/"`
- `npm install`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm -v`
- `npm list next typescript --depth=0`
- `rm -rf "quarterlink-scaffold"`

## Command Results

- `node -v`: passed, returned `v24.12.0`.
- Preferred `create-next-app` command with `--reset-preferences`: reset saved preferences and exited without creating files.
- Direct `create-next-app` command without `--reset-preferences`: failed because the folder name `QuarterLink MTD ITSA` is not a valid npm package name.
- Temporary valid-name `create-next-app` command: passed and created official scaffold output in `quarterlink-scaffold`.
- Scaffold copy: passed, copied the official scaffold output into the target directory while excluding `.git`, `.next`, and `node_modules`.
- `npm install`: passed. It reported 2 moderate severity vulnerabilities in the installed dependency tree.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm list next typescript --depth=0`: passed, returned `next@16.2.6` and `typescript@5.9.3`.
- Temporary scaffold cleanup: passed.

## Implemented

- Created the Next.js App Router skeleton with TypeScript, Tailwind CSS, ESLint, npm, src directory, import alias, and Turbopack development script.
- Created the QuarterLink control files and bootstrap ticket queue.
- Created the first source-of-truth project documents from the prompt.
- Created the required placeholder source folders.
- Created lightweight generic tax-regime interfaces and the UK Making Tax Digital for Income Tax placeholder constants.
- Replaced the default homepage with the approved bootstrap homepage wording.

## Deliberately Not Implemented

- No HMRC API calls.
- No HMRC sandbox evidence.
- No production approval claims.
- No authentication.
- No database.
- No spreadsheet parsing.
- No spreadsheet template fields.
- No quarterly update payload submission.
- No final declaration or tax return features.
- No VAT features.
- No bookkeeping ledger.
- No bank feeds.
- No receipt capture.
- No payroll.
- No invoicing.
- No manual adjustment of imported monetary figures.
- No pricing.
- No commit.
- No push.

## Risks or Unresolved Issues

- `npm install` reported 2 moderate severity vulnerabilities. No audit fix was run because this bootstrap keeps the official scaffold dependency output stable.
- The target directory did not contain `.git`, so no Git metadata was preserved or altered.
- Details for pricing, HMRC production approval process, spreadsheet template fields, proof pack contents, role permissions, sandbox test evidence, database schema, authentication, final declaration / tax return features, and future country support remain: To be specified in a later ticket.

## Suggested Next Ticket

QL-001 — Review bootstrap and stabilise project skeleton. Status remains DRAFT.
