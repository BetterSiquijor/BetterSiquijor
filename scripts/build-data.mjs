import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { writeFacilities } from './lib/facilities.mjs';
import { writeColleges } from './lib/colleges.mjs';
import { writeSchoolDirectory } from './lib/schools.mjs';

const read = path => JSON.parse(readFileSync(path, 'utf8'));
const write = (name, value) =>
  writeFileSync(`public/data/${name}`, JSON.stringify(value, null, 2) + '\n');
mkdirSync('public/data', { recursive: true });
writeSchoolDirectory();
writeFacilities();
writeColleges();

// Editable records live under data/. public/data is generated for visitors.
for (const name of ['census', 'officials', 'offices', 'financial-records']) {
  write(`${name}.json`, read(`data/records/${name}.json`));
}
for (const name of [
  'college-sources',
  'facility-sources',
  'census-sources',
  'officials-sources',
  'financial-sources',
  'service-sources',
  'business-service-sources',
  'citizen-service-sources',
]) {
  write(`${name}.json`, read(`data/sources/${name}.json`));
}

const census = read('data/records/census.json');
const csvCell = value => '"' + String(value ?? '').replaceAll('"', '""') + '"';
const columns = [
  'municipality',
  'barangay',
  'psgc',
  'correspondence_code',
  'classification',
  'population_2024',
  'source_url',
];
const rows = census.municipalities.flatMap(m =>
  m.barangays.map(b => [
    m.name,
    b.name,
    b.psgc,
    b.correspondenceCode,
    b.classification,
    b.population,
    m.sourceUrl,
  ])
);
writeFileSync(
  'public/data/barangays.csv',
  [columns, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n') +
    '\r\n'
);

const citizenDetails = read('data/records/citizen-services.json');
let exportedGuideCount = 0;
for (const group of read('data/guide-exports.json').groups) {
  const guides = group.guides.map(guide => {
    const content = readFileSync(guide.path, 'utf8');
    const title = content.match(/^#\s+(.+)$/m)?.[1];
    const detail =
      group.exportFile === 'citizen-service-guides.json'
        ? citizenDetails.guides.find(g => g.id === guide.id)
        : {};
    const result = { ...detail, ...guide, title };
    if (group.exportFile === 'service-guides.json') result.content = content;
    else result.contentMarkdown = content;
    return result;
  });
  exportedGuideCount += guides.length;
  write(group.exportFile, { ...group.metadata, guides });
}

const financial = read('data/records/financial-records.json');
const latestReceipts = financial.records.find(
  r => r.id === 'siquijor-provincial-sre-2025-page1'
);
let receiptPage = `# Provincial cash and receipts, 2025

Explore the provincial government’s opening cash balance, local income, and external receipts for **2025**. These figures come from the first page of **DBM BESF 2027, Table F.10**.

**Reporting year: 2025 · Amounts in million Philippine pesos · Page 1 extract**

## Cash and receipt categories

| Measure | PHP million |
| --- | ---: |
`;
for (const m of latestReceipts.metrics)
  receiptPage += `| ${m.label} | ${m.sourceValue} |\n`;
receiptPage += `
## More provincial financial records

- [Explore the complete 2024 receipts and expenditures statement](/government/transparency/full-disclosure).
- [Search financial measures](/data?dataset=finances).
- [Download financial records (JSON)](/data/financial-records.json).
- [Download the original DBM table (PDF)](${latestReceipts.localDocument}).

## Sources and reference dates

[Department of Budget and Management — BESF 2027, Table F.10](${latestReceipts.sourceUrl}), printed page **586**, Siquijor provincial row. Reviewed **17 November 2026**.

The first page is headed **2025**. Its continuation page is headed **2024 (Continuation)**. This page reproduces only the 24 values on the explicitly labelled 2025 page. The continuation’s overall receipts, expenditures, and ending balances have not been combined with this extract. This preserves the publisher’s date discrepancy without guessing a correction.

The publication year **2027** is distinct from the **2025** financial reporting period. These figures are not an approved 2027 provincial budget. Source values are rounded to two decimal places in million pesos.
`;
writeFileSync('content/government/transparency/receipts-2025.md', receiptPage);

// This import produces the catalogue from the same canonical source registers.
await import('./update-source-catalogue.mjs');
console.log(
  `Generated record downloads, barangay CSV, and ${exportedGuideCount} guide exports from canonical files.`
);
