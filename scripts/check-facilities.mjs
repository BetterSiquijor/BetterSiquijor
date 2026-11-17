import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = path => JSON.parse(readFileSync(path, 'utf8'));
const data = read('data/records/facilities.json');
const sources = read('data/sources/facility-sources.json');
const byId = new Map(sources.sources.map(s => [s.id, s]));
assert.deepEqual(
  read('public/data/facilities.json'),
  data,
  'Facility downloads match canonical records'
);
assert.deepEqual(read('public/data/facility-sources.json'), sources);
assert.equal(
  new Set(data.facilities.map(f => f.id)).size,
  data.facilities.length,
  'Unique facility IDs'
);
assert.equal(
  data.facilities.filter(f => f.kind === 'hospital').length,
  data.metadata.hospitals
);
const stations = data.facilities.filter(f => f.kind === 'police-station');
assert.equal(stations.length, 6);
assert.equal(
  new Set(stations.map(f => f.municipality)).size,
  6,
  'A municipal police station for each town'
);
assert.equal(data.facilities.filter(f => f.kind === 'police-office').length, 1);
assert(byId.has(data.metadata.emergencySourceId));
for (const f of data.facilities) {
  assert(f.name && f.address && f.municipality && f.reviewedAt);
  assert(f.addressSourceIds.length > 0);
  for (const id of [
    ...f.addressSourceIds,
    ...f.details.flatMap(d => d.sourceIds),
  ])
    assert(byId.has(id), `Facility source resolves: ${id}`);
  for (const c of f.contacts) {
    assert(byId.has(c.sourceId), 'Contact source resolves');
    assert(
      !/info@buconz|example\.com|placeholder/i.test(c.value),
      'No theme contacts or fabricated fields'
    );
    if (c.kind === 'phone')
      assert(
        /^\d{10,11}$/.test(c.value.replace(/\D/g, '')),
        'Complete published contact number'
      );
    else
      assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.value), 'Well-formed email');
  }
  if (f.facebook) {
    assert.equal(
      byId.get(f.facebook.sourceId).sourceType,
      'office-published-social'
    );
    assert.equal(new URL(f.facebook.url).hostname, 'www.facebook.com');
  }
}
const sph = data.facilities.find(f => f.id === 'siquijor-provincial-hospital');
assert(
  sph.contacts.some(
    c =>
      c.value === 'siquijorpho2@gmail.com' &&
      c.sourceId === 'philhealth-hospitals-2026-09'
  ),
  'Retain the newer PhilHealth email'
);
assert(
  sph.contacts.some(
    c =>
      c.value === 'siquijor.hospital@gmail.com' && c.sourceId === 'sph-facebook'
  ),
  'Keep hospital-published email distinct'
);
const maria = data.facilities.find(f => f.id === 'maria-police');
assert.equal(maria.barangay, 'Poblacion Sur', 'Use the directly read station Facebook address');
assert(maria.addressSourceIds.includes('maria-police-facebook'));
for (const s of sources.sources)
  if (s.sourceSha256)
    assert.equal(
      createHash('sha256')
        .update(readFileSync('public' + s.localDocument))
        .digest('hex'),
      s.sourceSha256,
      'Original facility document unchanged'
    );
assert.equal(
  readFileSync('public/data/facilities.csv', 'utf8').trim().split(/\r?\n/)
    .length,
  data.facilities.length + 1
);
for (const file of [
  'content/services/health/hospitals.md',
  'content/services/public-safety/police-stations.md',
]) {
  const text = readFileSync(file, 'utf8');
  for (const f of data.facilities.filter(f =>
    file.includes('/health/') ? f.kind === 'hospital' : f.kind !== 'hospital'
  ))
    assert(text.includes(f.name), 'Every facility is searchable');
}
console.log(
  `Facility checks passed: ${data.metadata.hospitals} health facilities, ${stations.length} municipal stations, 1 provincial police office; sources and downloads match.`
);
