import fs from 'node:fs';
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const records = [];
const add = (entry, local) =>
  records.push({ ...entry, localPage: entry.localPage || local });
for (const [file, local] of [
  ['college-sources.json', '/services/education/colleges'],
  ['facility-sources.json', '/services/health/hospitals'],
  ['census-sources.json', '/data'],
  ['officials-sources.json', '/government/departments/provincial-officials'],
  ['financial-sources.json', '/government/transparency'],
  ['service-sources.json', '/services'],
  ['business-service-sources.json', '/services/business'],
  ['citizen-service-sources.json', '/services/citizen-services'],
]) {
  for (const source of read('data/sources/' + file).sources) add(source, local);
}
for (const source of read('data/records/offices.json').sources) {
  add(source, '/government/departments/office-directory');
}
const byUrl = new Map();
for (const r of records) {
  const url = new URL(r.url).href;
  const entry = {
    id: r.id,
    name: r.name || r.title,
    publisher: r.publisher || new URL(url).hostname,
    url,
    sourceDate:
      r.sourceDate ||
      r.asOf ||
      r.publicationDate ||
      r.recordPeriod ||
      (r.sourceYear ? String(r.sourceYear) : null),
    reviewed: r.reviewed || r.reviewedAt || r.retrievedAt || '2026-11-17',
    coverage: r.coverage || r.title,
    sourceType: r.sourceType || 'primary-government',
    localPages: [r.localPage],
    localDocument: r.localDocument || null,
  };
  if (byUrl.has(url)) {
    const old = byUrl.get(url);
    old.localPages = [...new Set([...old.localPages, r.localPage])];
    if (!old.localDocument && entry.localDocument)
      old.localDocument = entry.localDocument;
  } else byUrl.set(url, entry);
}
const sources = [...byUrl.values()];
const catalogueReviewed = sources
  .map(s => s.reviewed)
  .filter(Boolean)
  .sort()
  .at(-1);
const catalogueReviewLabel = new Intl.DateTimeFormat('en-PH', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date(catalogueReviewed));
fs.writeFileSync(
  'public/data/source-catalogue.json',
  JSON.stringify(
    { reviewed: catalogueReviewed, sourceCount: sources.length, sources },
    null,
    2
  ) + '\n'
);
const csvCell = s => '"' + String(s ?? '').replaceAll('"', '""') + '"';
const headers = [
  'publisher',
  'title',
  'url',
  'source_date',
  'reviewed',
  'local_pages',
  'local_document',
];
const rows = sources.map(s => [
  s.publisher,
  s.name,
  s.url,
  s.sourceDate,
  s.reviewed,
  s.localPages.join(';'),
  s.localDocument,
]);
fs.writeFileSync(
  'public/data/source-catalogue.csv',
  [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n') +
    '\r\n'
);
let md = `# Sources and downloads\n\nFind the government and institutional publications behind Siquijor’s service guides and local directories. Download the data or choose a topic to explore.\n\n## Download the information\n\n- [All 134 barangay records (CSV)](/data/barangays.csv) and [full census JSON](/data/census.json).\n- [71 officials (JSON)](/data/officials.json).\n- [24 office contacts (JSON)](/data/offices.json).\n- [Colleges (JSON)](/data/colleges.json) and [CSV](/data/colleges.csv).\n- [Provincial financial records (JSON)](/data/financial-records.json).\n- [Source catalogue (JSON)](/data/source-catalogue.json) and [CSV](/data/source-catalogue.csv).\n\n## Source register\n\n| Publisher | Original source | Explore |\n| --- | --- | --- |\n`;
for (const s of sources)
  md += `| ${s.publisher.replaceAll('|', '/')} | [${s.name.replaceAll('|', '/')}](${s.url}) | [View information](${s.localPages[0]}) |\n`;
md += `\n## Dates and attribution\n\nCatalogue review: **${catalogueReviewLabel}**. The underlying records retain their census year, directory edition, financial year, publication date, and source status. PSA data is licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); its published names and values have been reformatted as local tables and downloads. Source documents retain their original attribution.\n`;
fs.writeFileSync('content/government/sources/catalogue.md', md);
console.log(
  `Updated ${sources.length} source citations, local page references, and JSON/CSV exports.`
);
