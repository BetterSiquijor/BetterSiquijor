import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildSchoolDirectory } from './lib/schools.mjs';

const read = path => JSON.parse(readFileSync(path, 'utf8'));
const directory = buildSchoolDirectory();
const elementary = read('data/schools/siquijor_elementary_schools.json');
const high = read('data/schools/siquijor_high_schools.json');
assert.deepEqual(
  read('data/derived/schools.json'),
  directory,
  'Generated UI data matches the supplied school files'
);
assert.deepEqual(
  read('public/data/schools.json'),
  directory,
  'Download matches the directory'
);
assert.equal(
  new Set(directory.schools.map(s => s.id)).size,
  directory.schools.length,
  'Each institution appears once'
);
assert.equal(
  directory.schools.filter(s => s.levels.includes('Elementary')).length,
  elementary.summary.total_confirmed_elementary_schools,
  'Elementary scope agrees with input summary'
);
assert.equal(
  directory.schools.filter(s => s.levels.includes('Secondary')).length,
  high.summary.total_high_schools,
  'Secondary scope agrees with input summary'
);
for (const source of directory.metadata.sources) {
  assert.equal(
    createHash('sha256')
      .update(readFileSync('public/' + source.file))
      .digest('hex'),
    source.sha256,
    'Original downloads are unchanged'
  );
}
for (const school of directory.schools) {
  assert(
    school.name && school.municipality && school.sector && school.levels.length
  );
  assert(
    school.schoolId === null || /^\d{6}$/.test(school.schoolId),
    'Never invent a missing DepEd ID'
  );
  for (const section of school.sections)
    for (const field of section.fields)
      for (const variant of field.values) {
        assert(variant.value !== null && variant.value !== undefined);
        if (Array.isArray(variant.value))
          assert(
            variant.value.every(value => value !== null),
            'Omit empty values without replacing them'
          );
        assert(
          variant.sources.length,
          'Preserve file attribution for each value'
        );
      }
}
// These source differences must survive combining duplicate institutions.
const siquijor = directory.schools.find(s => s.schoolId === '501431');
const staff = siquijor.sections
  .flatMap(s => s.fields)
  .find(f => f.key === 'leadership.school_head');
assert.equal(
  staff.values.length,
  2,
  'Different school-head listings retain both values and source labels'
);
const cabulihan = directory.schools.find(s => s.schoolId === '500232');
const emails = cabulihan.sections
  .flatMap(s => s.fields)
  .find(f => f.key === 'contact.email');
assert.equal(emails.values.length, 2, 'Different contact emails are preserved');
for (const id of ['404629', '404632', '404633']) {
  assert(
    !directory.schools
      .find(s => s.schoolId === id)
      .levels.includes('Elementary'),
    'Secondary-only references do not imply elementary provision'
  );
}
assert.equal(
  readFileSync('public/data/schools.csv', 'utf8').trim().split(/\r?\n/).length,
  directory.schools.length + 1
);
const search = read('data/derived/school-search.json');
assert.equal(
  search.length,
  directory.schools.length,
  'Every school is included in site search'
);
assert.equal(new Set(search.map(s => s.url)).size, search.length);
console.log(
  `School checks passed: ${directory.schools.length} unique schools, ${directory.metadata.inputRecords} input entries, all source variants and downloads preserved.`
);
