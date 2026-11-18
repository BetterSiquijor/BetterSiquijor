import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import * as yaml from 'js-yaml';
import { createHash } from 'node:crypto';

const readJSON = path => JSON.parse(readFileSync(path, 'utf8'));
const census = readJSON('public/data/census.json');
assert.equal(
  census.municipalities.length,
  6,
  'All six municipalities are present'
);
const barangays = census.municipalities.flatMap(m => m.barangays);
assert.equal(barangays.length, 134, 'All 134 barangays are present');
assert.equal(
  new Set(barangays.map(b => b.psgc)).size,
  134,
  'Barangay codes are unique'
);
for (const m of census.municipalities) {
  assert.equal(m.barangays.length, m.barangayCount, `${m.name}: complete list`);
  assert.equal(
    m.barangays.reduce((sum, b) => sum + b.population, 0),
    m.population,
    `${m.name}: population reconciles`
  );
  assert(
    m.barangays.every(
      b =>
        /^\d{10}$/.test(b.psgc) &&
        Number.isInteger(b.population) &&
        b.population >= 0
    )
  );
}
assert.equal(
  census.municipalities.reduce((sum, m) => sum + m.population, 0),
  107642,
  'Provincial census total'
);
assert.equal(
  readFileSync('public/data/barangays.csv', 'utf8').trim().split(/\r?\n/)
    .length,
  135,
  'CSV includes header and all records'
);

const officials = readJSON('public/data/officials.json');
assert.equal(officials.officials.length, 71, 'Verified elected-office records');
for (const o of officials.officials) {
  assert(
    o.name && o.role && o.sourceId && o.reviewedAt,
    'Every official has provenance'
  );
  assert(officials.sources.some(s => s.id === o.sourceId));
}
const offices = readJSON('public/data/offices.json');
assert.equal(offices.offices.length, offices.coverage.records);
assert.equal(
  new Set(offices.offices.map(o => o.id)).size,
  offices.offices.length
);
for (const o of offices.offices) {
  assert(offices.sources.some(s => s.id === o.sourceId));
  for (const p of o.phones)
    assert(
      p.replace(/\D/g, '').length >= 7,
      'No zero or incomplete phone placeholders'
    );
}

const financial = readJSON('public/data/financial-records.json');
assert.equal(financial.records.length, 8);
const statement = financial.records.find(
  r => r.recordType === 'statement-of-receipts-and-expenditures'
);
assert.equal(statement.metrics.length, 50);
assert.equal(statement.period, '2024');
assert.equal(statement.unit, 'PHP million');
assert.equal(new Set(statement.metrics.map(m => m.key)).size, 50);
for (const m of statement.metrics) {
  assert(Number.isFinite(m.value));
  assert.equal(
    Number(m.sourceValue.replaceAll(',', '')),
    m.value,
    'Source display precision retained'
  );
  assert.equal(m.unit, 'PHP million');
}
const values = Object.fromEntries(statement.metrics.map(m => [m.key, m.value]));
const near = (a, b) =>
  assert(
    Math.abs(a - b) < 0.021,
    'Published figures reconcile within source rounding'
  );
near(
  values.opening_cash_balance +
    values.total_receipts -
    values.total_expenditures,
  values.fund_cash_available
);
near(
  values.fund_cash_available -
    values.prior_year_accounts_payable -
    values.continuing_appropriation,
  values.ending_cash_balance
);
assert.equal(
  financial.records.filter(r => r.recordType === 'procurement-notice').length,
  5
);
for (const r of financial.records) {
  assert(r.sourceUrl && r.reviewed && r.period);
  if (r.localDocument) {
    const p = 'public' + r.localDocument;
    assert(existsSync(p), `Source attachment exists: ${p}`);
    if (p.endsWith('.pdf'))
      assert.equal(readFileSync(p).subarray(0, 5).toString(), '%PDF-');
  }
}

const extract = financial.records.find(
  r => r.id === 'siquijor-provincial-sre-2025-page1'
);
assert.equal(extract.period, '2025');
assert.equal(
  extract.metrics.length,
  24,
  'Only the clearly dated 2025 page is included'
);
assert(
  extract.metrics.every(
    m => m.pdfPage === 1 && m.printedPage === 586 && m.unit === 'PHP million'
  )
);
assert(
  !extract.metrics.some(
    m => m.key === 'total_expenditures' || m.key === 'ending_cash_balance'
  ),
  'Do not combine the contradictory continuation heading into the 2025 extract'
);
for (const r of [statement, extract]) {
  const digest = createHash('sha256')
    .update(readFileSync('public' + r.localDocument))
    .digest('hex');
  assert.equal(
    digest,
    r.validation.sourceSha256,
    'Original financial PDF matches the reviewed attachment'
  );
  for (const m of r.metrics)
    assert.equal(Number(m.sourceValue.replaceAll(',', '')), m.value);
}

// Public downloads must match canonical records, not independently edited copies.
for (const name of ['census', 'officials', 'offices', 'financial-records']) {
  assert.deepEqual(
    readJSON(`public/data/${name}.json`),
    readJSON(`data/records/${name}.json`),
    `${name}: regenerate public downloads after editing canonical data`
  );
}
const sourceRegisters = [
  'college-sources',
  'facility-sources',
  'census-sources',
  'officials-sources',
  'financial-sources',
  'service-sources',
  'business-service-sources',
  'citizen-service-sources',
];
const sourceIds = new Set();
for (const name of sourceRegisters) {
  const canonical = readJSON(`data/sources/${name}.json`);
  assert.deepEqual(
    readJSON(`public/data/${name}.json`),
    canonical,
    `${name}: source export matches canonical register`
  );
  assert.equal(
    new Set(canonical.sources.map(s => s.id)).size,
    canonical.sources.length,
    'Source IDs are unique within each register'
  );
  for (const s of canonical.sources) {
    assert(
      s.id && s.title && s.publisher && s.url,
      'Sources identify the responsible publisher'
    );
    assert.equal(new URL(s.url).protocol, 'https:');
    if (s.localDocument && s.sourceSha256) {
      assert.equal(
        createHash('sha256')
          .update(readFileSync('public' + s.localDocument))
          .digest('hex'),
        s.sourceSha256,
        'Stored source attachment matches the reviewed original'
      );
    }
    sourceIds.add(s.id);
  }
}
for (const group of readJSON('data/guide-exports.json').groups) {
  const exported = readJSON('public/data/' + group.exportFile);
  assert.equal(exported.guides.length, group.guides.length);
  for (const g of group.guides) {
    const match = exported.guides.find(e => e.path === g.path);
    assert(match, `Exported guide exists: ${g.path}`);
    assert.equal(
      match.content || match.contentMarkdown,
      readFileSync(g.path, 'utf8'),
      'Guide download matches the page text'
    );
    for (const id of g.sourceIds || g.sources || [])
      assert(sourceIds.has(id), `Guide source resolves: ${g.path} → ${id}`);
  }
}

const routes = new Set(['/', '/services', '/government', '/search', '/data']);
const pages = [];
for (const group of ['services', 'government']) {
  const categories = yaml.load(
    readFileSync(`src/data/${group}.yaml`, 'utf8')
  ).categories;
  for (const c of categories) {
    routes.add(`/${group}/${c.slug}`);
    const index = yaml.load(
      readFileSync(`content/${group}/${c.slug}/index.yaml`, 'utf8')
    );
    for (const page of index.pages) {
      const file = `content/${group}/${c.slug}/${page.slug}.md`;
      assert(existsSync(file), `Indexed page exists: ${file}`);
      pages.push(file);
      routes.add(`/${group}/${c.slug}/${page.slug}`);
    }
  }
}
for (const f of readdirSync('content/pages').filter(f => f.endsWith('.md'))) {
  pages.push(`content/pages/${f}`);
  routes.add('/' + f.slice(0, -3));
}
for (const file of pages) {
  const body = readFileSync(file, 'utf8');
  assert(
    !/lorem ipsum|John Doe|Jane Doe|\{YOUR_[A-Z_]+\}|What we cannot yet confirm/i.test(
      body
    ),
    `No filler or removed sections: ${file}`
  );
  for (const match of body.matchAll(/\]\((\/[^)\s]*)\)/g)) {
    const href = decodeURIComponent(match[1].split(/[?#]/)[0]);
    assert(
      routes.has(href) || existsSync('public' + href),
      `Internal link resolves: ${file} → ${href}`
    );
  }
}
console.log(
  `Data integrity passed: ${barangays.length} barangays, ${officials.officials.length} officials, ${offices.offices.length} offices, 74 financial fields across two distinct periods, 5 notices, ${pages.length} indexed pages.`
);
console.log(
  'Checks validate local consistency and provenance fields; factual changes still require primary-source review.'
);

// Article tables must stay consistent with canonical factual records.
for (const m of census.municipalities) {
  const page = readFileSync(
    `content/government/municipalities/${m.slug}.md`,
    'utf8'
  );
  for (const b of m.barangays) {
    assert(
      page.includes(
        `| ${b.name} | ${b.psgc} | ${b.classification} | ${b.population.toLocaleString('en-US')} |`
      ),
      `Barangay article agrees with canonical data: ${m.name}/${b.name}`
    );
  }
}
const officialPage = readFileSync(
  'content/government/departments/provincial-officials.md',
  'utf8'
);
for (const o of officials.officials)
  assert(
    officialPage.includes(o.name),
    `Official appears consistently in the directory: ${o.name}`
  );
const financialPage = readFileSync(
  'content/government/transparency/full-disclosure.md',
  'utf8'
);
for (const m of statement.metrics)
  assert(
    financialPage.includes(`| ${m.label} | ${m.sourceValue} |`),
    `Financial article agrees with canonical data: ${m.key}`
  );

await import('./check-schools.mjs');

await import('./check-facilities.mjs');
await import('./check-colleges.mjs');
await import('./check-hotlines.mjs');
