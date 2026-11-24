import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { buildWaterwaysOsm } from './lib/waterways-osm.mjs';

const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const sha256 = path =>
  createHash('sha256').update(readFileSync(path)).digest('hex');

const { derived, csvRows } = buildWaterwaysOsm();
const written = readJson('data/derived/waterways-osm.json');

assert.deepEqual(
  written,
  derived,
  'Derived waterways JSON matches canonical Siquijor GeoJSON'
);
assert.equal(
  sha256('public/data/waterways-osm.geojson'),
  derived.metadata.sha256,
  'Public waterways GeoJSON matches canonical extract'
);
assert.equal(
  derived.metadata.featureCount,
  1058,
  'All 1,058 Siquijor waterway features preserved'
);
assert.equal(
  derived.municipalityCounts.length,
  6,
  'All six municipalities represented in waterways extract'
);

const actualCsvRows =
  readFileSync('public/data/waterways-osm.csv', 'utf8')
    .trim()
    .split(/\r?\n/).length - 1;
assert.equal(
  actualCsvRows,
  csvRows.length,
  'Waterways CSV row count matches extracted features'
);

console.log(
  `Waterways OSM checks passed: ${derived.metadata.featureCount} features (${derived.metadata.namedFeatureCount} named) across 6 municipalities.`
);
