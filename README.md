# BetterSiquijor

**BetterSiquijor** is an independent, volunteer-run public information portal for **Siquijor Province, Philippines**. It brings government service guides, emergency hotlines, local directories, interactive maps, and provincial public records into one fast, easy-to-use site.

> **Note:** BetterSiquijor is an independent community project and is **not** an official provincial or municipal government website.

- **Website:** [bettersiquijor.vercel.app](https://bettersiquijor.vercel.app/)
- **Facebook:** [facebook.com/bettersiquijor](https://facebook.com/bettersiquijor)
- **Source Code:** [github.com/BetterSiquijor/BetterSiquijor](https://github.com/BetterSiquijor/BetterSiquijor)

## What you can find

- **Emergency Hotlines (`/hotlines`)** — Tap-to-call provincial and municipal numbers (911, PDRRMO, MDRRMO, BFP Fire, PNP Police, Coast Guard, Hospitals, RHUs, PROSIELCO, DPWH) with municipality filters and a printable emergency card.
- **Barangay Lookup Hub (`/barangays`)** — Search all **134 barangays** across Siquijor’s six municipalities for 2024 census population, local schools, municipal office contacts, and emergency hotlines.
- **Interactive Maps & Directories** — Search and explore **93 schools**, **4 colleges**, **hospitals**, **Rural Health Units**, **police stations**, **fire stations**, **Coast Guard sub-stations**, and **ports** on interactive OpenStreetMap tile maps.
- **Everyday Service Guides (`/services`)** — Primary-source guides for PSA certificates & civil registry corrections, National ID, LTO driver’s licenses & vehicles, Police & NBI clearances, PhilHealth, Senior/PWD/Solo Parent IDs, SSS/Pag-IBIG/GSIS, DSWD AICS, passports, utilities, business permits, BIR tax registration, Real Property Tax (Amilyar), RSBSA agriculture registration, and sea travel.
- **Local Public Records (`/data`)** — Searchable tables, charts, and JSON/CSV downloads for 2024 POPCEN barangay census data, elected officials, government offices, and provincial financial disclosures.
- **Smart Local Search (`/search`)** — Runs directly in your browser with category/municipality filters and everyday local terms (e.g., _brownout_, _ospital_, _bumbero_, _ferry_, _lisensya_, _amilyar_).

## Report outdated info or contribute

Every factual record is tied to an official primary publication, with source dates and review notes kept transparent.

- **Spotted a wrong number or outdated detail?** Click **Report outdated info** on any directory card, or [open an issue](https://github.com/BetterSiquijor/BetterSiquijor/issues/new) with the page link and an official source.
- **Want to help update records?** See [data/README.md](data/README.md) for the data structure and source-verification rules.

## Run locally (for developers)

Built with React, TypeScript, Vite, Tailwind CSS, Leaflet, and Kapwa UI. No database, backend, or API keys are required.

**Requires:** Node.js 24+

```bash
git clone https://github.com/BetterSiquijor/BetterSiquijor.git
cd BetterSiquijor
npm ci --include=dev
npm run dev
```

| Command              | Purpose                                                                      |
| -------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`        | Regenerate local data and start dev server (`http://localhost:5173`)         |
| `npm run data:build` | Regenerate derived directories, JSON/CSV downloads, and source catalogue     |
| `npm run check:data` | Validate census totals, source IDs, attachment hashes, and internal links    |
| `npm run build`      | Run data build, data checks, TypeScript check, Vite build, and static routes |
| `npm run preview`    | Preview the production build locally (`http://localhost:4173`)               |

## License & attribution

Built from [Better Local Gov](https://github.com/iyanski/betterlocalgov) (**CC0 1.0 Universal**; original `LICENSE` preserved). Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) (ODbL 1.0). Cited government publications and datasets retain their original terms.
