# QuarterLink

QuarterLink is bridging-only software for Making Tax Digital for Income Tax.

It is being built to help users send quarterly updates from spreadsheet records. The application is currently a controlled web-app skeleton and is not ready for HMRC sandbox use or production use.

## Current Stage

- `QL-BOOTSTRAP` is committed.
- `QL-001` is the active implementation ticket.
- The current focus is the web app foundation, not a public sales or marketing website.

## Implemented

- Next.js App Router in `src/app`.
- TypeScript.
- Tailwind CSS.
- ESLint.
- npm scripts.
- Turbopack for local development.
- Placeholder architecture under `src/core` and `src/tax-regimes`.
- A static app-oriented first screen for continued product development.

## Not Implemented Yet

- Authentication.
- Database storage.
- Multi-tenant persistence.
- HMRC OAuth.
- HMRC API calls.
- HMRC sandbox evidence.
- Spreadsheet upload, import, parsing, or mapping.
- Sending quarterly updates.
- Billing.
- Platform admin controls.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The main app entry point is `src/app/page.tsx`.

## npm Scripts

- `npm run dev` starts Next.js with Turbopack.
- `npm run build` creates a production build.
- `npm run start` starts the production server after a build.
- `npm run lint` runs ESLint.
- `npm run typecheck` runs TypeScript without emitting files.

## Development Rules

- Follow `AGENTS.md`.
- Work one approved ticket at a time.
- Keep user-facing wording aligned with `docs/HMRC_WORDING_AND_SCOPE.md`.
- Do not claim HMRC sandbox evidence unless it came from real HMRC sandbox API calls.
- Keep imported monetary figures read-only when spreadsheet import is implemented later.
