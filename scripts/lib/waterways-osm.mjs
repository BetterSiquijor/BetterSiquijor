import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const WATERWAYS_GEOJSON_FILE = 'data/osm/siquijor_waterways.geojson';

const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const sha256 = path =>
  createHash('sha256').update(readFileSync(path)).digest('hex');
const csvCell = value => '"' + String(value ?? '').replaceAll('"', '""') + '"';

function cleanMunicipality(value) {
  return String(value || '')
    .replace(/\s*\(Capital\)\s*$/i, '')
    .trim();
}

function featureCategory(props, geomType) {
  const ww = props.waterway;
  const w = props.water;
  if (ww === 'waterfall') return 'waterfall';
  if (ww === 'river' || w === 'river') return 'river';
  if (ww === 'stream' || ww === 'tidal_channel' || ww === 'flowline' || ww === 'stream_end')
    return 'stream';
  if (ww === 'canal' || ww === 'ditch' || ww === 'drain' || ww === 'flow_control')
    return 'drainage';
  if (w || geomType === 'Polygon' || geomType === 'MultiPolygon')
    return 'waterbody';
  return 'other';
}

function geometryCenter(geometry) {
  let pts = [];
  if (geometry.type === 'Point') {
    pts = [geometry.coordinates];
  } else if (geometry.type === 'LineString') {
    pts = geometry.coordinates;
  } else if (geometry.type === 'Polygon') {
    pts = geometry.coordinates[0] || [];
  } else if (geometry.type === 'MultiLineString') {
    pts = geometry.coordinates.flat();
  } else if (geometry.type === 'MultiPolygon') {
    pts = geometry.coordinates.flatMap(p => p[0] || []);
  }
  if (!pts.length) return { lat: 9.2, lon: 123.55 };
  const mid = pts[Math.floor(pts.length / 2)];
  return {
    lat: Number(mid[1].toFixed(6)),
    lon: Number(mid[0].toFixed(6)),
  };
}

/**
 * Builds summary statistics, named waterways list, and CSV rows from the
 * Siquijor OpenStreetMap waterways GeoJSON extract.
 */
export function buildWaterwaysOsm() {
  const geojson = readJson(WATERWAYS_GEOJSON_FILE);
  const byMunicipality = new Map();
  const byCategory = {};
  const namedFeatures = [];
  const csvRows = [];

  for (const feature of geojson.features) {
    const props = feature.properties || {};
    const municipality = cleanMunicipality(props.adm3_name);
    const barangay = props.adm4_name || null;
    const category = featureCategory(props, feature.geometry.type);
    const { lat, lon } = geometryCenter(feature.geometry);

    byCategory[category] = (byCategory[category] || 0) + 1;

    const mStat = byMunicipality.get(municipality) || {
      municipality,
      total: 0,
      river: 0,
      stream: 0,
      drainage: 0,
      waterbody: 0,
      waterfall: 0,
      named: 0,
    };
    mStat.total += 1;
    if (category in mStat) mStat[category] += 1;
    if (props.name) mStat.named += 1;
    byMunicipality.set(municipality, mStat);

    const osmId = props.id;
    const osmUrl = `https://www.openstreetmap.org/${osmId}`;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;

    if (props.name) {
      namedFeatures.push({
        id: osmId.replace('/', '-'),
        osmId,
        name: props.name,
        category,
        waterwayTag: props.waterway || null,
        waterTag: props.water || null,
        geometryType: feature.geometry.type,
        municipality,
        barangay,
        lat,
        lon,
        osmUrl,
        googleMapsUrl,
      });
    }

    csvRows.push({
      osm_id: osmId,
      name: props.name || '',
      category,
      waterway: props.waterway || '',
      water: props.water || '',
      geometry_type: feature.geometry.type,
      municipality,
      barangay: barangay || '',
      latitude: lat,
      longitude: lon,
      osm_url: osmUrl,
    });
  }

  namedFeatures.sort(
    (a, b) =>
      a.municipality.localeCompare(b.municipality) ||
      a.name.localeCompare(b.name)
  );

  return {
    derived: {
      metadata: {
        ...geojson.metadata,
        file: WATERWAYS_GEOJSON_FILE,
        sha256: sha256(WATERWAYS_GEOJSON_FILE),
        publicGeojsonDownload: '/data/waterways-osm.geojson',
        publicCsvDownload: '/data/waterways-osm.csv',
      },
      categoryCounts: byCategory,
      municipalityCounts: [...byMunicipality.values()].sort((a, b) =>
        a.municipality.localeCompare(b.municipality)
      ),
      namedFeatures,
    },
    csvRows,
  };
}

/**
 * Writes derived waterways summary JSON plus public GeoJSON and CSV downloads.
 */
export function writeWaterwaysOsm() {
  const { derived, csvRows } = buildWaterwaysOsm();
  mkdirSync('data/derived', { recursive: true });
  mkdirSync('public/data', { recursive: true });

  writeFileSync(
    'data/derived/waterways-osm.json',
    JSON.stringify(derived, null, 2) + '\n'
  );
  writeFileSync(
    'public/data/waterways-osm.geojson',
    readFileSync(WATERWAYS_GEOJSON_FILE)
  );

  const columns = [
    'osm_id',
    'name',
    'category',
    'waterway',
    'water',
    'geometry_type',
    'municipality',
    'barangay',
    'latitude',
    'longitude',
    'osm_url',
  ];
  const lines = [columns, ...csvRows.map(row => columns.map(col => row[col]))];
  writeFileSync(
    'public/data/waterways-osm.csv',
    lines.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
  );

  console.log(
    `Waterways OSM extract: ${derived.metadata.featureCount} Siquijor features (${derived.metadata.namedFeatureCount} named) exported.`
  );
}
