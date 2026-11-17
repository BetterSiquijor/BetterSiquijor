# BetterSiquijor

An independent, volunteer-run information portal for **Siquijor Province**, maintained by [@frenzjay](https://github.com/frenzjay). This is not an official provincial or municipal government website.

Built from [Better Local Gov](https://github.com/iyanski/betterlocalgov), retaining its original blue theme, typography, navigation, cards, and footer. The application uses React, TypeScript, Vite, Tailwind CSS, and Kapwa components.

**Source repository:** [BetterSiquijor/BetterSiquijor](https://github.com/BetterSiquijor/BetterSiquijor). Production hosting uses Vercel with the build settings below. Running the local development commands does not publish the website.

## Requirements

- **Node.js 24** — tested with Node.js `24.21.0`.
- **npm** — tested with npm `11.19.0`.
- Internet access for the initial dependency installation and external fonts or agency links.

Check your installed versions:

```bash
node --version
npm --version
```

No database, API keys, or environment variables are required for the current application. Search runs in the browser; no Meilisearch server is needed.

## Run locally

Open a terminal in the project directory. On the current machine:

```bash
cd /home/frenz/Desktop/CLI-WORKSPACE/BetterSiquijor
npm ci --include=dev
npm run dev
```

Open **http://localhost:5173**. Leave the terminal running while using the website. Source changes appear automatically; press **Ctrl+C** to stop the server.

The server binds to `127.0.0.1` and is accessible only from this machine. Port `5173` is configured as a strict port: Vite reports an error if it is already occupied. To deliberately use another local port:

```bash
npm run dev -- --port 5174
```

If dependencies are already installed and `package-lock.json` has not changed, you can start with just `npm run dev`.

On another machine, clone the repository and install the dependencies:

```bash
git clone https://github.com/BetterSiquijor/BetterSiquijor.git
cd BetterSiquijor
npm ci --include=dev
npm run dev
```

## Build for production

From the project directory:

```bash
npm ci --include=dev
npm run build
```

The build validates the local datasets and then runs three compilation steps:

Before compiling, `npm run check:data` checks census totals, record counts, source references, local document attachments, and internal content links.

1. `tsc -b` checks TypeScript.
2. `vite build` bundles the application and copies public assets into `dist/`.
3. `scripts/spa-pages.mjs` creates direct-entry HTML files for the published content routes, allowing those pages to open directly or refresh on static hosts.

A successful build produces `dist/index.html`, bundled files under `dist/assets/`, downloadable files under `dist/data/`, and route directories. `dist/` is generated output and is ignored by Git. Rebuild it after changing source files or content; edit the source rather than files inside `dist/`.

### Preview the production build locally

```bash
npm run preview
```

Open **http://localhost:4173**. This command serves the existing `dist/` directory and does not rebuild it. The preview server also binds only to `127.0.0.1`.

To use another preview port:

```bash
npm run preview -- --port 4174
```

Vite's preview server is for local inspection, not a production web server. See the [official Vite deployment guide](https://vite.dev/guide/static-deploy.html).

## Deployment

The application is a static website. Production hosting serves the contents of `dist/`; a running Node.js process is not required after the build.

### Build settings

For a static host that builds from a source repository, use:

| Setting | Value |
| --- | --- |
| Project/root directory | Directory containing `package.json` |
| Node.js version | `24` |
| Install command | `npm ci --include=dev` |
| Build command | `npm run build` |
| Output/publish directory | `dist` |
| Required environment variables | None |

Upload the full source to your repository before connecting a hosting provider. Include `package.json`, `package-lock.json`, `src/`, `content/`, `public/`, `scripts/`, the TypeScript configuration files, `vite.config.ts`, and `index.html`. Do not upload `node_modules/`.

### Option A: upload a local build

1. Run `npm run build` locally.
2. In your chosen static host, upload the **contents of `dist/`** as the website root.
3. Preserve all asset, data, and route subdirectories. The host's root must contain `index.html`, rather than an extra enclosing `dist/` directory.
4. Configure the host's domain and HTTPS settings if publishing on a custom domain.
5. Follow the verification steps below.

For updates, rebuild and replace the previous deployment with the new `dist/` contents. Prefer the host's atomic deployment mechanism so HTML and hashed assets are updated together.

### Option B: build from Git

1. Push the complete source to your Git repository.
2. Connect the repository to a static hosting provider.
3. Apply the build settings in the table above.
4. Choose a production branch and start the deployment in that provider.
5. Follow the verification steps below.

For Vercel, connect `BetterSiquijor/BetterSiquijor` and set the production branch to `main`. Vercel's Git integration builds production updates when commits reach that branch and creates previews for other branches. No GitHub Actions deployment token or environment variables are needed. The repository pins Node.js 24 in `.nvmrc` and `package.json`, and `vercel.json` provides the install, build and output settings. Keep Vercel's project settings consistent with these files.

### Routing and hosting paths

Deploy this implementation at the **root of a domain**, such as `https://example.org/`. It uses root-relative routes, assets, translations, and download links.

The build generates HTML entry files for known content routes. A static host should serve directory `index.html` files. If it supports SPA fallback rewrites, serve real files first and send other application paths to `/index.html`. `vercel.json` includes the SPA rewrite, `dist` output configuration, and reproducible `npm ci --include=dev` installation.

A project subpath such as `https://username.github.io/BetterSiquijor/` is **not configured**. Supporting that path requires coordinated changes to Vite's `base`, the router basename, and root-relative content, translation, and download URLs. Changing Vite's `base` alone is insufficient for this application.

### Verify a deployment

After deployment, check:

- The homepage renders with the Better Local Gov template design.
- `/services/health/philhealth` opens directly and survives a refresh.
- `/government/municipalities` lists all six municipalities.
- `/search?q=governor` returns the provincial officials page.
- `/data/source-catalogue.json` and `/data/source-catalogue.csv` are accessible.
- Mobile navigation opens and closes, and agency links lead to their original sources.

Page metadata uses the current browser origin, so a deployed site does not need a hardcoded domain in the source.

## Content maintenance

| What to edit | Location |
| --- | --- |
| Service categories | `src/data/services.yaml` |
| Government categories | `src/data/government.yaml` |
| Category page lists | `content/services/<category>/index.yaml` or `content/government/<category>/index.yaml` |
| Service and government articles | Markdown files beside the category indexes |
| About, privacy, accessibility, and sitemap | `content/pages/` |
| Category loader registration | `src/data/yamlLoader.ts` |
| Navigation and footer links | `src/data/navigation.ts` |
| Shared header, footer and favicon logo | `public/better-siquijor.svg`; outline source and design notes in `data/branding/` |
| Homepage labels and descriptions | `public/locales/en/common.json` |
| School lists | `data/schools/` (editable originals); `data/derived/` (generated directory and search data) |
| Colleges, campus contacts and degrees | `data/records/colleges.json`; `data/sources/college-sources.json` |
| Canonical factual records | `data/records/` |
| Original publication registers | `data/sources/` |
| Review evidence and source discrepancies | `data/reviews/` |
| Guide export mappings | `data/guide-exports.json` |
| Generated data downloads (do not edit) | `public/data/` |

When adding a category, register its index in `src/data/yamlLoader.ts`. When adding a page, create the Markdown file and add it to the category's `index.yaml`. The search index and direct-entry route files are generated from the content during the build.

Every factual addition needs its original source, reference date, and review scope. Preserve census years and distinguish provincial from municipal records. Financial tables retain the original reporting periods and units. The complete FY 2024 provincial statement contains 50 fields. A separate 2025 extract contains 24 figures from the clearly dated first page of DBM BESF 2027. Its continuation has a conflicting year heading and is not combined into a 2025 total. Procurement notices retain their published ceilings and deadlines. See `/government/sources/methodology` for the public method.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| `vite` or `tsc` is missing | Run `npm ci --include=dev`; build tools are development dependencies. |
| Dependency installation times out | Check the connection and retry the install. Keep `package-lock.json` for reproducible versions. |
| `npm ci` reports a lockfile mismatch | Review intentional dependency changes, run `npm install` to update the lockfile, and keep both package files together. |
| Local port is already in use | Stop the existing server or pass an alternate port as shown above. |
| A content page is missing | Check its Markdown filename, index slug, YAML indentation, and category loader registration; rebuild afterward. |
| Preview shows old content | Run `npm run build` again, then reload the preview. |
| A deployed route returns 404 on refresh | Check that route directories were uploaded and the host serves directory indexes or a SPA fallback. |
| Deployed styles or scripts return 404 | Upload the entire build, check the publish directory, and ensure the website is hosted at the domain root. |

## Privacy, corrections, and attribution

No accounts, government application forms, analytics, or advertising are included. Google Fonts receives normal font requests, and the template stores display-language preference locally. External services and hosting providers have their own privacy practices.

[Suggest a correction](https://github.com/BetterSiquijor/BetterSiquijor/issues/new) with the affected page, original source URL, document date, and proposed change. GitHub issues are public; omit private information.

The Better Local Gov starter is **CC0 1.0 Universal**; its original `LICENSE` is preserved. Source material retains its original terms. Upstream snapshot: `fad8273b3f19604589c8b3e4d1042b8f3ac65287`. Original starter documentation is in `STARTER-KIT-README.md`. No official government seal or claim of government endorsement is used.

## Local published data

- Complete PSA census/geographic table: **6 municipalities, 134 barangays, 107,642 residents (2024 POPCEN)**.
- **71 elected-office records** from the dated DILG/DBM directory editions.
- **24 published office contacts**.
- **50 provincial FY 2024 financial fields** and a separate **24-field 2025 cash/receipts extract**, five PhilGEPS notices, and one COA catalogue record.
- **14 service guides** with requirements, procedures, published fees, and source dates.

Browse `/data` for searchable tables. Canonical files live in `data/records/` and `data/sources/`; `public/data/` contains generated downloads. Pages do not need to fetch live agency data. Original official PDFs in `public/documents/` are readable locally.

See [data maintenance instructions](data/README.md) for the folder map, provenance rules, and update workflow. After reviewing and updating primary-source records and any affected Markdown guide, regenerate the downloads and citation register:

```bash
npm run data:build
npm run check:data
npm run build
```

The validation checks local integrity; it does not replace reviewing a primary source before changing a fact. Publication dates are retained, and no filler data is generated.

The school directory is available at `/services/education/find-school`, linked from Education. It combines the supplied school files by DepEd ID, offers school-name/ID search and municipality/level/sector filters, and preserves differing contact or staff listings with their file labels. Run `npm run data:build` after changing `data/schools/`; school consistency checks run with `npm run check:data`.

The college directory is at `/services/education/colleges`, linked from Education. It includes Siquijor State College, BIT International College–Siquijor, Carmelite College, and Quezon Memorial Institute. Visitors can search college/course names, filter public/private colleges and municipalities, read degree lists, and use phone, email, website, Facebook and Maps links. Canonical college records, field sources and review notes live under `data/`; JSON/CSV downloads and the searchable Markdown mirror are generated during `npm run data:build`. College consistency checks run with `npm run check:data`. Degree catalogues retain their undated status and do not guarantee current intakes, accreditation or scholarship eligibility.

Hospitals are at `/services/health/hospitals`; police stations are at `/services/public-safety/police-stations`. Edit `data/records/facilities.json` and `data/sources/facility-sources.json`, then run `npm run data:build`. The directory keeps source dates, distinguishes hospital directory contacts from Facebook contacts, and labels undated station-directory numbers. Published telephone numbers have not been call-tested.
