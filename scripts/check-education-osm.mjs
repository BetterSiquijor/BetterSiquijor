import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { buildEducationOsm, geometryCentroid } from './lib/education-osm.mjs';

const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const sha256 = path =>
  createHash('sha256').update(readFileSync(path)).digest('hex');

const rawPath = 'data/osm/siquijor_education_facilities.geojson';
const publicGeojsonPath = 'public/data/education-facilities-osm.geojson';
const raw = readJson(rawPath);
const { derived: expected, csvRows } = buildEducationOsm();
const stored = readJson('data/derived/education-osm.json');
const schools = readJson('data/derived/schools.json');
const colleges = readJson('data/records/colleges.json');

assert.deepEqual(
  stored,
  expected,
  'Derived OSM education lookup matches canonical GeoJSON and directories'
);
assert.equal(
  sha256(publicGeojsonPath),
  sha256(rawPath),
  'Public OSM GeoJSON download matches canonical Siquijor extract verbatim'
);
assert.equal(
  raw.metadata.licenseUrl,
  'https://opendatacommons.org/licenses/odbl/1-0/',
  'ODbL 1.0 license metadata is preserved'
);
assert.equal(raw.features.length, raw.metadata.featureCount);

for (const feature of raw.features) {
  assert.equal(
    feature.properties.adm2_pcode,
    'PH07061',
    'Every extracted feature belongs to Siquijor Province (PH07061)'
  );
  assert.equal(feature.properties.adm2_name, 'Siquijor');
  const { lat, lon } = geometryCentroid(feature.geometry);
  assert(
    lon >= 123.43 && lon <= 123.76 && lat >= 9.05 && lat <= 9.34,
    `Feature coordinates stay inside Siquijor Island bounds: ${feature.properties.id}`
  );
}

const schoolIds = new Set(schools.schools.map(s => s.id));
for (const [schoolId, loc] of Object.entries(stored.schoolsById)) {
  assert(
    schoolIds.has(schoolId),
    `Matched OSM school resolves in schools.json: ${schoolId}`
  );
  assert(loc.osmUrl.startsWith('https://www.openstreetmap.org/'));
}

const collegeIds = new Set(colleges.colleges.map(c => c.id));
for (const collegeId of Object.keys(stored.collegesById)) {
  assert(
    collegeIds.has(collegeId),
    `Matched OSM college resolves in colleges.json: ${collegeId}`
  );
}

const accountedNamed =
  stored.metadata.matchedSchools +
  stored.metadata.additionalCollegeCampuses +
  stored.metadata.additionalMappedFacilities;
assert.equal(
  accountedNamed,
  stored.metadata.namedFeatureCount,
  'All named OSM Siquijor education features are explicitly accounted for'
);

const actualCsvRows =
  readFileSync('public/data/education-facilities-osm.csv', 'utf8')
    .trim()
    .split(/\r?\n/).length - 1;
assert.equal(
  actualCsvRows,
  csvRows.length,
  'Named OSM education CSV row count matches named features'
);

console.log(
  `Education OSM checks passed: ${raw.features.length} features (${stored.metadata.namedFeatureCount} named), ${stored.metadata.matchedSchools} matched schools, ${stored.metadata.matchedColleges} matched colleges, ${stored.metadata.additionalMappedFacilities} additional mapped sites.`
);
