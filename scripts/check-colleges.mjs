import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => JSON.parse(readFileSync(file, 'utf8'));
const directory = read('data/records/colleges.json');
const register = read('data/sources/college-sources.json');
const sources = new Map(register.sources.map(s => [s.id, s]));
assert.deepEqual(
  read('public/data/colleges.json'),
  directory,
  'College download matches canonical records'
);
assert.deepEqual(read('public/data/college-sources.json'), register);
assert.equal(
  new Set(directory.colleges.map(c => c.id)).size,
  directory.colleges.length
);
assert(sources.has(directory.metadata.identitySourceId));
for (const c of directory.colleges) {
  assert(c.name && c.address && c.municipality && c.reviewedAt);
  assert(['Public', 'Private'].includes(c.sector));
  assert(c.addressSourceIds.length);
  for (const id of [
    c.identitySourceId,
    ...c.addressSourceIds,
    ...c.additionalSourceIds,
    ...c.contacts.map(t => t.sourceId),
    ...c.programs.map(p => p.sourceId),
    c.facebook.sourceId,
    ...(c.websiteSourceId ? [c.websiteSourceId] : []),
  ]) {
    assert(sources.has(id), `College field source resolves: ${id}`);
  }
  assert.equal(new URL(c.facebook.url).hostname, 'www.facebook.com');
  assert.equal(
    sources.get(c.facebook.sourceId).sourceType,
    'institution-published-social'
  );
  if (c.website) {
    assert(c.websiteSourceId, 'College website needs provenance');
    assert.equal(new URL(c.website).protocol, 'https:');
  }
  for (const contact of c.contacts) {
    if (contact.kind === 'phone')
      assert(/^\d{10,11}$/.test(contact.value.replace(/\D/g, '')));
    else assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.value));
  }
  assert.equal(new Set(c.programs.map(p => p.name)).size, c.programs.length);
  for (const p of c.programs) {
    assert(['Undergraduate', 'Graduate'].includes(p.level));
    assert(
      ['institution-published', 'institution-published-social'].includes(
        sources.get(p.sourceId).sourceType
      ),
      `Program source must be published by the institution: ${p.sourceId}`
    );
  }
}
const bit = directory.colleges.find(c => c.id === 'bit-siquijor');
assert(
  bit.programs.every(p => p.sourceId === 'bit-siquijor-programs'),
  'BIT degrees must belong to the Siquijor campus'
);
assert(
  bit.contacts.some(
    c => c.value === '(035) 480 9415' && c.sourceId === 'bit-facebook'
  ),
  'Retain the campus-published code and provenance'
);
const qmis = directory.colleges.find(c => c.id === 'quezon-memorial-institute');
assert(
  qmis.contacts.some(c => c.kind === 'phone' && c.sourceId === 'qmis-ched'),
  'QMIS phone comes from CHED'
);
const md = readFileSync('content/services/education/colleges.md', 'utf8');
for (const c of directory.colleges) {
  assert(md.includes(c.name), 'Every college is included in site search');
  for (const p of c.programs)
    assert(md.includes(p.name), 'Degree names are searchable');
}
assert.equal(
  readFileSync('public/data/colleges.csv', 'utf8').trim().split(/\r?\n/).length,
  directory.colleges.length + 1
);
console.log(
  `College checks passed: ${directory.colleges.length} institutions; field sources, campus-specific courses, search content and downloads agree.`
);
