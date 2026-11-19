import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const OSM_GEOJSON_FILE = 'data/osm/siquijor_education_facilities.geojson';

/**
 * Verified explicit matches where OCHA ADM3 border polygons assign an OSM school
 * to a neighbouring municipality or where OSM uses an abbreviated/alternate title.
 */
const OSM_SCHOOL_OVERRIDES = {
  'way/1092389882': 'deped-190005', // Candigum Elementary School (Larena)
  'way/718768831': 'deped-120661', // New Bataan Elementary School (Larena)
  'way/798608066': 'deped-120684', // Pisong B Elementary School (Maria)
  'way/721769326': 'deped-502891', // Bogo Integrated School (Maria)
  'way/1101369641': 'deped-502892', // Cantugbas Elementary/Integrated School (Maria)
  'way/710020494': 'deped-120667', // Cadoldolan Elementary School (Lazi)
  'way/717441776': 'deped-190002', // Ytaya Elementary School (Lazi)
  'way/718318830': 'deped-120709', // Tambisan Elementary School (San Juan)
  'way/718769149': 'deped-303300', // Tambisan National High School (San Juan)
  'way/717441814': 'deped-404635', // Saint/St. Isidore the Farmer Catholic School (Lazi)
  'way/721769340': 'deped-404629', // Ave Maria Academy (Maria)
  'way/634087082': 'deped-404630', // Saint/St. John High School (San Juan)
  'way/547595301': 'deped-404631', // Assisi High School (Siquijor)
  'way/611791384': 'deped-600036', // Siquijor State College (Larena)
  'way/713016005': 'deped-404633', // Quezon Memorial Institute of Siquijor (Siquijor)
};

const OSM_COLLEGE_MATCHES = {
  'siquijor-state-college': {
    primary: 'way/611791384',
    additionalCampuses: ['way/715268787', 'way/710670379'],
  },
  'bit-siquijor': {
    primary: 'way/719075702',
    additionalCampuses: [],
  },
  'carmelite-college': {
    primary: 'node/8493963917',
    additionalCampuses: [],
  },
  'quezon-memorial-institute': {
    primary: 'way/713016005',
    additionalCampuses: [],
  },
};

const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const sha256 = path =>
  createHash('sha256').update(readFileSync(path)).digest('hex');
const csvCell = value => '"' + String(value ?? '').replaceAll('"', '""') + '"';

function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replaceAll('collegr', 'college')
    .replace(/\b(inc\.?|incorporated)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function cleanMunicipality(value) {
  return String(value || '')
    .replace(/\s*\(Capital\)\s*$/i, '')
    .trim();
}

function ringPoints(ring) {
  if (ring.length > 1) {
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] === last[0] && first[1] === last[1]) return ring.slice(0, -1);
  }
  return ring;
}

/**
 * Computes a representative [lon, lat] centroid for a Point, Polygon, or MultiPolygon.
 */
export function geometryCentroid(geometry) {
  let pts = [];
  if (geometry.type === 'Point') {
    pts = [geometry.coordinates];
  } else if (geometry.type === 'Polygon') {
    pts = ringPoints(geometry.coordinates[0] || []);
  } else if (geometry.type === 'MultiPolygon') {
    pts = geometry.coordinates.flatMap(poly => ringPoints(poly[0] || []));
  }
  const lon = pts.reduce((sum, p) => sum + p[0], 0) / pts.length;
  const lat = pts.reduce((sum, p) => sum + p[1], 0) / pts.length;
  return {
    lat: Number(lat.toFixed(6)),
    lon: Number(lon.toFixed(6)),
  };
}

function toLocationEntry(feature, overrideMunicipality = null) {
  const props = feature.properties;
  const { lat, lon } = geometryCentroid(feature.geometry);
  const osmMunicipality = cleanMunicipality(props.adm3_name);
  return {
    osmId: props.id,
    osmName: props.name,
    amenity: props.amenity || null,
    building: props.building || null,
    operatorType: props.operator_type || null,
    geometryType: feature.geometry.type,
    lat,
    lon,
    osmUrl: `https://www.openstreetmap.org/${props.id}`,
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
    osmSourceTag: props.source || null,
    osmMunicipality,
    osmBarangay: props.adm4_name || null,
    municipalityDiffers:
      overrideMunicipality !== null && osmMunicipality !== overrideMunicipality,
  };
}

/**
 * Matches Siquijor OpenStreetMap education features to BetterSiquijor schools
 * and colleges while keeping unmatched community-mapped sites distinct.
 */
export function buildEducationOsm() {
  const geojson = readJson(OSM_GEOJSON_FILE);
  const schoolDirectory = readJson('data/derived/schools.json');
  const collegeDirectory = readJson('data/records/colleges.json');

  const schoolById = new Map(schoolDirectory.schools.map(s => [s.id, s]));
  const schoolByKey = new Map();
  for (const school of schoolDirectory.schools) {
    schoolByKey.set(
      `${school.municipality}|${normalizeName(school.name)}`,
      school
    );
    for (const section of school.sections) {
      for (const field of section.fields) {
        if (field.key !== 'former_name' && field.key !== 'alternate_name')
          continue;
        for (const variant of field.values) {
          const items = Array.isArray(variant.value)
            ? variant.value
            : [variant.value];
          for (const alias of items) {
            schoolByKey.set(
              `${school.municipality}|${normalizeName(alias)}`,
              school
            );
          }
        }
      }
    }
  }

  const featureByOsmId = new Map();
  const municipalityStats = new Map();
  const namedFeatures = [];

  for (const feature of geojson.features) {
    const props = feature.properties;
    const osmMuni = cleanMunicipality(props.adm3_name);
    const stat = municipalityStats.get(osmMuni) || {
      municipality: osmMuni,
      totalFeatures: 0,
      namedFeatures: 0,
      unnamedBuildingFootprints: 0,
    };
    stat.totalFeatures += 1;
    if (props.name) {
      stat.namedFeatures += 1;
      namedFeatures.push(feature);
      featureByOsmId.set(props.id, feature);
    } else {
      stat.unnamedBuildingFootprints += 1;
    }
    municipalityStats.set(osmMuni, stat);
  }

  const schoolsById = {};
  const schoolIdByOsmId = new Map();

  for (const feature of namedFeatures) {
    const props = feature.properties;
    const osmId = props.id;
    let matchedSchool = null;
    if (OSM_SCHOOL_OVERRIDES[osmId]) {
      matchedSchool = schoolById.get(OSM_SCHOOL_OVERRIDES[osmId]) || null;
    } else {
      const osmMuni = cleanMunicipality(props.adm3_name);
      matchedSchool =
        schoolByKey.get(`${osmMuni}|${normalizeName(props.name)}`) || null;
    }
    if (matchedSchool) {
      schoolsById[matchedSchool.id] = toLocationEntry(
        feature,
        matchedSchool.municipality
      );
      schoolIdByOsmId.set(osmId, matchedSchool.id);
    }
  }

  const collegesById = {};
  const collegeIdByOsmId = new Map();
  for (const college of collegeDirectory.colleges) {
    const spec = OSM_COLLEGE_MATCHES[college.id];
    if (!spec) continue;
    const primaryFeature = featureByOsmId.get(spec.primary);
    if (!primaryFeature) continue;
    collegeIdByOsmId.set(spec.primary, college.id);
    const additionalCampuses = [];
    for (const campusOsmId of spec.additionalCampuses) {
      const campusFeature = featureByOsmId.get(campusOsmId);
      if (campusFeature) {
        collegeIdByOsmId.set(campusOsmId, college.id);
        additionalCampuses.push(toLocationEntry(campusFeature));
      }
    }
    collegesById[college.id] = {
      primary: toLocationEntry(primaryFeature, college.municipality),
      additionalCampuses,
    };
  }

  const additionalFacilities = namedFeatures
    .filter(
      feature =>
        !schoolIdByOsmId.has(feature.properties.id) &&
        !collegeIdByOsmId.has(feature.properties.id)
    )
    .map(feature => {
      const loc = toLocationEntry(feature);
      const category =
        loc.amenity === 'kindergarten'
          ? 'Early childhood / Day Care'
          : 'Technical / Vocational';
      return {
        id: loc.osmId.replace('/', '-'),
        ...loc,
        name: loc.osmName,
        municipality: loc.osmMunicipality,
        category,
      };
    })
    .sort(
      (a, b) =>
        a.municipality.localeCompare(b.municipality) ||
        a.name.localeCompare(b.name)
    );

  const csvRows = namedFeatures
    .map(feature => {
      const loc = toLocationEntry(feature);
      return {
        osm_id: loc.osmId,
        osm_name: loc.osmName,
        amenity: loc.amenity || '',
        building: loc.building || '',
        operator_type: loc.operatorType || '',
        osm_municipality: loc.osmMunicipality,
        osm_barangay: loc.osmBarangay || '',
        geometry_type: loc.geometryType,
        latitude: loc.lat,
        longitude: loc.lon,
        osm_url: loc.osmUrl,
        matched_school_id: schoolIdByOsmId.get(loc.osmId) || '',
        matched_college_id: collegeIdByOsmId.get(loc.osmId) || '',
        osm_source: loc.osmSourceTag || '',
      };
    })
    .sort(
      (a, b) =>
        a.osm_municipality.localeCompare(b.osm_municipality) ||
        a.osm_name.localeCompare(b.osm_name) ||
        a.osm_id.localeCompare(b.osm_id)
    );

  return {
    derived: {
      metadata: {
        ...geojson.metadata,
        file: OSM_GEOJSON_FILE,
        sha256: sha256(OSM_GEOJSON_FILE),
        publicGeojsonDownload: '/data/education-facilities-osm.geojson',
        publicCsvDownload: '/data/education-facilities-osm.csv',
        matchedSchools: Object.keys(schoolsById).length,
        totalSchools: schoolDirectory.schools.length,
        matchedColleges: Object.keys(collegesById).length,
        totalColleges: collegeDirectory.colleges.length,
        additionalCollegeCampuses: Object.values(collegesById).reduce(
          (sum, c) => sum + c.additionalCampuses.length,
          0
        ),
        additionalMappedFacilities: additionalFacilities.length,
      },
      municipalityCounts: [...municipalityStats.values()].sort((a, b) =>
        a.municipality.localeCompare(b.municipality)
      ),
      schoolsById,
      collegesById,
      additionalFacilities,
    },
    csvRows,
  };
}

/**
 * Writes derived OSM location lookup JSON plus public GeoJSON and CSV downloads.
 */
export function writeEducationOsm() {
  const { derived, csvRows } = buildEducationOsm();
  mkdirSync('data/derived', { recursive: true });
  mkdirSync('public/data', { recursive: true });

  writeFileSync(
    'data/derived/education-osm.json',
    JSON.stringify(derived, null, 2) + '\n'
  );
  writeFileSync(
    'public/data/education-facilities-osm.geojson',
    readFileSync(OSM_GEOJSON_FILE)
  );

  const columns = [
    'osm_id',
    'osm_name',
    'amenity',
    'building',
    'operator_type',
    'osm_municipality',
    'osm_barangay',
    'geometry_type',
    'latitude',
    'longitude',
    'osm_url',
    'matched_school_id',
    'matched_college_id',
    'osm_source',
  ];
  const lines = [columns, ...csvRows.map(row => columns.map(col => row[col]))];
  writeFileSync(
    'public/data/education-facilities-osm.csv',
    lines.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
  );

  console.log(
    `Education OSM extract: ${derived.metadata.featureCount} Siquijor features (${derived.metadata.namedFeatureCount} named); matched ${derived.metadata.matchedSchools}/${derived.metadata.totalSchools} schools, ${derived.metadata.matchedColleges}/${derived.metadata.totalColleges} colleges, and ${derived.metadata.additionalMappedFacilities} additional mapped sites.`
  );
}
