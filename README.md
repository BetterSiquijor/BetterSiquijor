# BetterSiquijor

Independent, volunteer-run civic portal for **Siquijor Province**. Maintainer: [@frenzjay](https://github.com/frenzjay).

Built directly from [iyanski/betterlocalgov](https://github.com/iyanski/betterlocalgov), the **Better Local Gov** community starter. The starter's blue theme, typography, navigation, cards, and footer are preserved. Upstream snapshot: `fad8273b3f19604589c8b3e4d1042b8f3ac65287`. Original starter documentation remains available in `STARTER-KIT-README.md`.

This is not an official provincial or municipal government website. Applications and inquiries continue on the responsible agency's website.

## First edition

- Four service categories: health, education, civil documents, and tourism.
- Provincial officials and office source references.
- Six municipality profiles with PSA **2024 POPCEN** population figures.
- DILG, COA, and PhilGEPS transparency resources.
- Source catalogue, methodology, explicit missing-data notes, and correction guidance.
- Local search, mobile navigation, keyboard support, direct links to every published page, and downloadable source catalogues (JSON/CSV).

Budget amounts, project progress, ordinances, and additional local records remain pending. No invented financial figures or sample government claims are published.

## Develop

Requires Node.js 22.12+ (tested with Node.js 24).

```sh
npm ci
npm run dev
```

```sh
npm run build
npm run preview
```

The build runs TypeScript checks and Vite, then prepares direct-entry HTML files for each content route. Deploy `dist/` to any static host. No database or API keys are required. Search runs entirely in the browser.

## Edit content

- Category cards: `src/data/services.yaml` and `src/data/government.yaml`.
- Category indexes: `content/services/<category>/index.yaml` and `content/government/<category>/index.yaml`.
- Pages: Markdown files alongside those indexes; general pages in `content/pages/`.
- New category: register its index in `src/data/yamlLoader.ts`.
- Header/footer content: `src/data/navigation.ts` and `public/locales/en/common.json`.
- Source register downloads: `public/data/source-catalogue.json` and `.csv`.

Every factual addition needs its original source, reference date, and review scope. Keep provincial and municipal records separate. Preserve census years. Do not change the review date without reviewing the source. See `/government/sources/methodology` for the public method.

## Hosting

Site identity is tracked in `.openai/hosting.json`. Reuse that ID for edits. The Sites deployment begins owner-private. The civic project's source is public at [BetterSiquijor/BetterSiquijor](https://github.com/BetterSiquijor/BetterSiquijor).

For other static hosts, use build command `npm run build` and output `dist`. `vercel.json` retains the starter's SPA rewrite. Known content routes also receive direct-entry HTML for hosts without rewrites. No custom domain has been purchased or configured.

## Privacy and contributions

No accounts, government application forms, analytics, or advertising are included. The hosting provider may keep technical access logs, Google Fonts receives normal requests, and language preference is stored locally. External services use their own privacy policies. GitHub issues are public; omit personal or sensitive information.

[Suggest a correction](https://github.com/BetterSiquijor/BetterSiquijor/issues/new) with the page, original source URL, document date, and proposed change.

## License and attribution

The starter is CC0 1.0 Universal; its original `LICENSE` is preserved. Source material retains its original terms. BetterSiquijor makes no claim of official endorsement by the provincial government, agencies, or BetterGov.ph. No official government seal is used.
