import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { buildHotlineDirectory } from './lib/hotlines.mjs';

const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const sha256 = path =>
  createHash('sha256').update(readFileSync(path)).digest('hex');

const expected = buildHotlineDirectory();
const exported = readJson('public/data/emergency-hotlines.json');

assert.deepEqual(
  exported,
  expected,
  'Hotline download matches supplied files in data/hotlines/'
);
assert.equal(
  exported.metadata.phoneAvailabilityTested,
  false,
  'Hotline export explicitly notes phones are untested'
);
assert.equal(
  exported.municipalDirectories.length,
  6,
  'All six municipal hotline groups are present'
);

for (const source of exported.metadata.sources) {
  assert.equal(source.sourceAsOf, null, 'Undated supplied snapshot stays null');
  assert.equal(sha256(source.file), source.sha256);
  assert.equal(
    sha256(`public${source.publicDownload}`),
    source.sha256,
    `Public hotline file matches verbatim original: ${source.file}`
  );
}

const sanJuan = exported.municipalDirectories.find(
  m => m.municipality === 'San Juan'
);
assert(
  sanJuan?.note?.includes('duplicate'),
  'San Juan duplicate discrepancy is documented in export'
);

const expectedCsvRows =
  1 +
  exported.provincialAssistanceContacts.length +
  exported.provincialDirectory.length +
  exported.municipalDirectories.reduce((sum, m) => sum + m.entries.length, 0);
const actualCsvRows =
  readFileSync('public/data/emergency-hotlines.csv', 'utf8')
    .trim()
    .split(/\r?\n/).length - 1;
assert.equal(
  actualCsvRows,
  expectedCsvRows,
  'Hotline CSV row count matches exported entries'
);

const guide = readFileSync(
  'content/services/public-safety/emergency-response.md',
  'utf8'
);
assert(guide.includes('tel:911'), 'Emergency guide retains clickable 911');
for (const m of exported.municipalDirectories) {
  assert(
    guide.includes(m.municipality),
    `Emergency guide includes municipality: ${m.municipality}`
  );
}
for (const token of [
  '0953 209 9165',
  '0933-209-9165',
  '0961 617 5474',
  '035-480-9051',
  '0996-835-1602',
  '0906 835 1602',
  '0926 324 2820',
  '0977 180 3999',
  '0917-506-8857',
]) {
  assert(
    guide.includes(token),
    `Emergency guide preserves key/discrepant hotline token: ${token}`
  );
}
