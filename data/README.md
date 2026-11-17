# Data and source maintenance

This folder contains the editable records used by BetterSiquijor. Public downloads are generated; do not edit `public/data/` directly.

| Location | Purpose |
| --- | --- |
| `schools/*.json` | Supplied elementary and secondary school lists; edit these original files to update schools |
| `derived/schools.json` and `derived/school-search.json` | Generated school directory and site-search entries; do not edit |
| `records/colleges.json` | College identities, sectors, locations, contacts and campus-specific degree catalogues with field-level sources |
| `sources/college-sources.json` | UniFAST, CHED HEIDA, college websites and directly read institutional Facebook pages |
| `reviews/colleges-2026-11-18.json` | College source review, telephone discrepancies and catalogue access limits |
| `records/facilities.json` | Hospital and police locations, contacts and substantiated Facebook links; field-level source references |
| `sources/facility-sources.json` | PhilHealth September 2026 PDF, office-published pages, source access and date notes |
| `records/census.json` | Province, municipalities, and all 134 barangays; PSA codes, classifications, and 2024 populations |
| `records/officials.json` | 71 dated elected-office records, with source IDs and row references |
| `records/offices.json` | Office addresses, telephone numbers, email addresses, and per-record source dates |
| `records/financial-records.json` | 2024 complete statement, 2025 page-one extract, procurement notices, and COA catalogue entry |
| `records/citizen-services.json` | Structured AICS and adult-passport requirements and steps |
| `sources/*-sources.json` | Agency publications, original URLs, editions, reference locators, and review dates |
| `guide-exports.json` | Maps Markdown guides to download filenames and source IDs |
| `reviews/2026-11-17.json` | Review evidence, newer editions checked, and unresolved source discrepancies |
| `../content/` | Citizen-facing guides and page text |
| `../public/documents/` | Unmodified source PDFs and clearly identified notice transcriptions |

The React data tables import `records/` directly. The school directory imports generated `derived/schools.json`; `scripts/lib/schools.mjs` combines the two original school files by DepEd ID, preserves different source values, and excludes secondary-focused references from elementary-level counts. Original school JSON exports remain unchanged. `scripts/build-data.mjs` generates the public JSON/CSV files and guide downloads from these records and the Markdown pages. It also generates the 2025 financial extract page. `scripts/update-source-catalogue.mjs` generates the source catalogue.

## Source rules

- Use the responsible government agency or institution, including the college's own publications for private-college contacts and courses. For PSA Serbilis fees, identify the PSA-authorized provider and the exact receiving channel; do not label those fees as universal PSA outlet prices.
- Keep the publisher, source URL, source edition/reference period, review date, and relevant page/row together. An undated source stays undated.
- `sourceAsOf`, `period`, and census reference dates describe the publication's data. `reviewedAt`, `reviewed`, and `retrievedAt` describe our checks. A review date must never substitute for a publication date or a live-tenure check.
- Missing values are `null` or empty arrays. Zero is used only when the original source actually reports zero. Never infer dialing codes, personal contacts, office hours, fees, deadlines, eligibility, awards, or completion.
- Government publications can disagree. Preserve the conflicting readings and their sources; do not silently resolve them. DILG's February 2026 roster is a dated directory, not a live tenure certification.
- The DBM BESF 2027 first page is headed 2025, but its continuation is headed 2024. Only the first page's 24 clearly dated values are included in the 2025 extract. Its continuation is not combined into a 2025 total. The complete 2024 statement remains separate.
- Procurement ABCs are ceilings, not payments or award prices. Past deadlines stay historical. The COA entry contains catalogue metadata, not findings or an audit opinion.

## Update workflow

1. Read the responsible agency's current publication. Compare its effective date and scope with the existing source; do not use search snippets as the sole evidence for requirements or figures.
2. Edit the canonical record and source register. Keep identifiers stable. Update the relevant `content/` guide if a requirement or figure changed.
3. Record the evidence and exact scope of the review in `reviews/`. Advance review dates only after a substantive source comparison. Link availability alone does not verify facts or freshness.
4. Run `npm run data:build` to regenerate downloads and catalogues.
5. Run `npm run check:data` and `npm run build`. Check the affected local page and filters.

Builds check unique codes, census reconciliation, financial units/precision and equations, attachment hashes, source IDs, guide/export parity, local links, and generated-file parity. These checks detect inconsistent edits; they cannot certify that an agency has published no newer information.

The college directory imports `records/colleges.json` directly. `scripts/lib/colleges.mjs` generates JSON/CSV downloads and the Markdown mirror used by site search. Update the canonical records and `sources/college-sources.json`, then rebuild. Keep programme sources specific to the campus. A UniFAST institutional listing is not a degree-accreditation certificate or an individual scholarship entitlement. Empty programme arrays mean no supported degree list was added; never fill them from guesses or another campus's catalogue.
