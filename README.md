# QuarterLink

QuarterLink is bridging-only software for Making Tax Digital for Income Tax.

QuarterLink helps users send quarterly updates from spreadsheet records. It is not bookkeeping software.

## Bootstrap status

QL-BOOTSTRAP creates the initial Next.js skeleton, control files, and source-of-truth project documents only.

This app is not ready for HMRC sandbox use or production use. No HMRC API code exists yet.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## npm scripts

- `npm run dev` starts Next.js with Turbopack.
- `npm run build` creates a production build.
- `npm run start` starts the production server after a build.
- `npm run lint` runs ESLint.
- `npm run typecheck` runs TypeScript without emitting files.

## Scope note

HMRC API calls, authentication, database storage, spreadsheet parsing, quarterly update payloads, final declaration, and tax return features are not implemented in the bootstrap.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
