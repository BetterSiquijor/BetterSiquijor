import { Link, useSearchParams } from 'react-router';
import { ExternalLink, MapPin } from 'lucide-react';
import schoolData from '../../data/derived/schools.json';
import educationOsm from '../../data/derived/education-osm.json';
import EducationMap, { type EducationMapPin } from '../components/EducationMap';
import SEO from '../components/SEO';
import Section from '../components/ui/Section';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { Heading } from '../components/ui/Heading';

type FieldValue = string | number | string[];
type DirectoryField = {
  key: string;
  label: string;
  values: { value: FieldValue; sources: string[] }[];
};
type OsmLocation =
  (typeof educationOsm.schoolsById)[keyof typeof educationOsm.schoolsById];

const osmBySchoolId = educationOsm.schoolsById as Record<string, OsmLocation>;

const municipalities = [
  ...new Set(schoolData.schools.map(s => s.municipality)),
].sort();
const levels = ['Kindergarten', 'Elementary', 'Secondary'];
const exportDates = [
  ...new Set(
    schoolData.metadata.sources.map(source =>
      new Intl.DateTimeFormat('en-PH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Manila',
      }).format(new Date(source.exportedAt))
    )
  ),
];
const schools = schoolData.schools.map(s => ({
  ...s,
  osm: osmBySchoolId[s.id] ?? null,
  searchText: [
    s.name,
    s.schoolId,
    s.municipality,
    s.barangay,
    osmBySchoolId[s.id]?.osmName,
    JSON.stringify(s.sections),
  ]
    .join(' ')
    .toLowerCase(),
}));
const additionalOsmFacilities = educationOsm.additionalFacilities.map(f => ({
  ...f,
  searchText: [f.name, f.municipality, f.osmBarangay, f.category, f.osmId]
    .filter(Boolean)
    .join(' ')
    .toLowerCase(),
}));
const inputStyle =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-sm';
const officeEntries = [
  ...new Map(
    schoolData.governingOffices
      .flatMap(group => Object.values(group.offices))
      .map(office => [JSON.stringify(office), office])
  ).values(),
];
const officeLabels: Record<string, string> = {
  superintendent: 'Superintendent listed',
  office_address: 'Address',
  official_website: 'Website',
  facebook_page_name: 'Facebook page name',
  email: 'Email',
  alternate_email: 'Other email',
  mobile: 'Mobile',
  landline: 'Telephone',
};

function Value({ value, field }: { value: FieldValue; field: string }) {
  if (Array.isArray(value))
    return (
      <ul className="list-disc pl-5 space-y-1">
        {value.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  const text = String(value);
  if (/^https?:\/\//i.test(text))
    return (
      <a
        className="text-primary-600 underline break-all"
        href={text}
        target="_blank"
        rel="noopener noreferrer"
      >
        {text}
      </a>
    );
  if (field.endsWith('email') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text))
    return (
      <a
        className="text-primary-600 underline break-all"
        href={'mailto:' + text}
      >
        {text}
      </a>
    );
  return <span className="break-words">{text}</span>;
}

function Fields({ fields }: { fields: DirectoryField[] }) {
  return (
    <dl className="space-y-4">
      {fields.map(field => (
        <div key={field.key}>
          <dt className="font-medium text-gray-900 mb-1">{field.label}</dt>
          <dd className="text-gray-700 space-y-3">
            {field.values.map((variant, i) => (
              <div key={i}>
                <Value value={variant.value} field={field.key} />
                {field.values.length > 1 ? (
                  <p className="text-xs text-gray-600 mt-1">
                    {variant.sources.join(' · ')}
                  </p>
                ) : null}
              </div>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function Schools() {
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') || '').slice(0, 120);
  const municipality = params.get('municipality') || '';
  const level = params.get('level') || '';
  const sector = params.get('sector') || '';
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const rows = schools.filter(
    s =>
      (!municipality || s.municipality === municipality) &&
      (!level || s.levels.includes(level)) &&
      (!sector || s.sector === sector) &&
      words.every(word => s.searchText.includes(word))
  );
  const matchingAdditional = additionalOsmFacilities.filter(
    f =>
      (!municipality || f.municipality === municipality) &&
      (!sector || sector === 'Public') &&
      (!level || (level === 'Kindergarten' && f.amenity === 'kindergarten')) &&
      words.every(word => f.searchText.includes(word))
  );
  const schoolPins: EducationMapPin[] = rows
    .filter(s => s.osm !== null)
    .map(s => ({
      id: s.id,
      targetId: s.id,
      name: s.name,
      municipality: s.municipality,
      barangay: s.barangay,
      category: s.sector === 'Private' ? 'Private' : 'Public',
      badgeLabel: `${s.sector} school · ${s.levels.join(' / ')}`,
      subtitle: [
        [s.barangay, s.municipality].filter(Boolean).join(', '),
        s.schoolId ? `DepEd ID ${s.schoolId}` : null,
      ]
        .filter(Boolean)
        .join(' · '),
      lat: s.osm!.lat,
      lon: s.osm!.lon,
      osmId: s.osm!.osmId,
      osmName: s.osm!.osmName,
      osmUrl: s.osm!.osmUrl,
      googleMapsUrl: s.osm!.googleMapsUrl,
      osmMunicipality: s.osm!.osmMunicipality,
      municipalityDiffers: s.osm!.municipalityDiffers,
    }));
  const additionalPins: EducationMapPin[] = matchingAdditional.map(f => ({
    id: f.id,
    name: f.name,
    municipality: f.municipality,
    barangay: f.osmBarangay,
    category: 'Community',
    badgeLabel: `${f.category} · OpenStreetMap`,
    subtitle: `${f.municipality}${f.osmBarangay ? ` (OSM area: ${f.osmBarangay})` : ''}`,
    lat: f.lat,
    lon: f.lon,
    osmId: f.osmId,
    osmName: f.osmName,
    osmUrl: f.osmUrl,
    googleMapsUrl: f.googleMapsUrl,
    osmMunicipality: f.osmMunicipality,
  }));
  function jumpToSchool(schoolId: string) {
    const details = document.getElementById(
      `school-${schoolId}`
    ) as HTMLDetailsElement | null;
    if (!details) return;
    details.open = true;
    details.scrollIntoView({ behavior: 'smooth', block: 'center' });
    details.querySelector('summary')?.focus();
  }
  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }
  return (
    <>
      <SEO
        title="Find a school in Siquijor"
        description="Find Siquijor elementary schools, high schools, integrated schools, and kindergarten centers. Explore locations, education levels, and school contacts."
      />
      <Section>
        <Breadcrumbs className="mb-8" />
        <Heading>Find a school in Siquijor</Heading>
        <p className="text-gray-700 mb-4">
          Explore schools near you. Search by school name, DepEd ID, or
          location, then open a school for its contact details and programs.
        </p>
        <p className="text-sm text-gray-600 mb-7">
          {schools.length} schools across six municipalities (
          {educationOsm.metadata.matchedSchools} mapped on OpenStreetMap) ·
          Directory export: {exportDates.join(' / ')}
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <div>
            <label
              htmlFor="school-search"
              className="block text-sm font-medium mb-2"
            >
              School name, ID, or location
            </label>
            <input
              id="school-search"
              type="search"
              value={q}
              maxLength={120}
              onChange={e => update('q', e.target.value)}
              placeholder="e.g. Cabulihan or 500232"
              className={inputStyle}
            />
          </div>
          <div>
            <label
              htmlFor="school-municipality"
              className="block text-sm font-medium mb-2"
            >
              Municipality
            </label>
            <select
              id="school-municipality"
              value={municipality}
              onChange={e => update('municipality', e.target.value)}
              className={inputStyle}
            >
              <option value="">All municipalities</option>
              {municipalities.map(m => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="school-level"
              className="block text-sm font-medium mb-2"
            >
              Education level
            </label>
            <select
              id="school-level"
              value={level}
              onChange={e => update('level', e.target.value)}
              className={inputStyle}
            >
              <option value="">All levels</option>
              {levels.map(l => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="school-sector"
              className="block text-sm font-medium mb-2"
            >
              Public or private
            </label>
            <select
              id="school-sector"
              value={sector}
              onChange={e => update('sector', e.target.value)}
              className={inputStyle}
            >
              <option value="">All schools</option>
              <option>Public</option>
              <option>Private</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 justify-between items-center mb-5">
          <p role="status" className="text-sm text-gray-700">
            {rows.length} of {schools.length} schools
          </p>
          <button
            onClick={() => setParams({}, { replace: true })}
            className="text-primary-600 underline text-sm"
          >
            Clear filters
          </button>
        </div>
        <EducationMap
          title="Explore schools on the Siquijor map"
          itemLabel="schools"
          pins={schoolPins}
          additionalPins={additionalPins}
          additionalToggleLabel="Show day care & technical"
          totalFilteredCount={rows.length}
          jumpLabel="Open school details in list below"
          onJumpToItem={jumpToSchool}
        />
        <div className="space-y-4">
          {rows.map(school => (
            <details
              key={school.id}
              id={`school-${school.id}`}
              className="rounded-lg border border-gray-300 border-t-4 border-t-primary-500 bg-white"
            >
              <summary className="cursor-pointer p-5 focus-visible:outline-2 focus-visible:outline-primary-600">
                <span className="font-semibold text-lg text-primary-700">
                  {school.name}
                </span>
                <span className="block mt-2 text-sm text-gray-700">
                  {[school.barangay, school.municipality]
                    .filter(Boolean)
                    .join(', ')}{' '}
                  · {school.sector} · {school.levels.join(' / ')}
                  {school.osm ? ' · Map available' : ''}
                </span>
                {school.schoolId ? (
                  <span className="block text-xs text-gray-600 mt-2">
                    DepEd school ID: {school.schoolId}
                  </span>
                ) : null}
              </summary>
              <div className="border-t border-gray-200 p-5 grid gap-8 md:grid-cols-2">
                {school.sections.map(section => (
                  <section key={section.title} className="min-w-0">
                    <h2 className="text-lg font-semibold mb-4">
                      {section.title}
                    </h2>
                    <Fields fields={section.fields} />
                  </section>
                ))}
                {school.osm ? (
                  <section className="min-w-0">
                    <h2 className="text-lg font-semibold mb-4">
                      Map location (OpenStreetMap)
                    </h2>
                    <div className="space-y-3 text-sm text-gray-700">
                      <p className="flex items-start gap-2">
                        <MapPin
                          className="w-4 h-4 shrink-0 mt-0.5 text-primary-600"
                          aria-hidden="true"
                        />
                        <span>
                          {school.osm.lat.toFixed(5)},{' '}
                          {school.osm.lon.toFixed(5)} (
                          {school.osm.geometryType === 'Point'
                            ? 'point marker'
                            : 'campus outline'}
                          , OpenStreetMap {school.osm.osmId})
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-4">
                        <a
                          href={school.osm.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-primary-600 underline font-medium"
                        >
                          Open in Google Maps
                          <ExternalLink
                            className="w-3.5 h-3.5"
                            aria-hidden="true"
                          />
                        </a>
                        <a
                          href={school.osm.osmUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-primary-600 underline font-medium"
                        >
                          View on OpenStreetMap
                          <ExternalLink
                            className="w-3.5 h-3.5"
                            aria-hidden="true"
                          />
                        </a>
                      </div>
                      {school.osm.osmName !== school.name ? (
                        <p className="text-xs text-gray-600">
                          OpenStreetMap label: “{school.osm.osmName}”
                        </p>
                      ) : null}
                      {school.osm.municipalityDiffers ? (
                        <p className="text-xs text-gray-600">
                          HOTOSM’s administrative boundary polygon assigns this
                          border coordinate to {school.osm.osmMunicipality};
                          DepEd’s directory lists {school.municipality}.
                        </p>
                      ) : null}
                      <p className="text-xs text-gray-600">
                        Source: OpenStreetMap contributors via HOTOSM (15
                        November 2026 snapshot, ODbL 1.0).
                      </p>
                    </div>
                  </section>
                ) : null}
              </div>
            </details>
          ))}
        </div>
        {rows.length === 0 ? (
          <p className="rounded-lg bg-gray-50 p-8 text-center text-gray-700">
            No schools match these filters. Try another name or clear the
            filters.
          </p>
        ) : null}
        {matchingAdditional.length > 0 ? (
          <details className="mt-8 rounded-lg border border-gray-300 bg-white p-5">
            <summary className="cursor-pointer font-semibold text-primary-700">
              Community-mapped day care centers and technical institute in
              OpenStreetMap ({matchingAdditional.length})
            </summary>
            <div className="mt-4 space-y-4">
              <p className="text-sm text-gray-700">
                These additional named education sites appear in the HOTOSM /
                OpenStreetMap extract (15 November 2026) outside the 93-school
                DepEd directory. OpenStreetMap is volunteer-mapped and not
                exhaustive—other barangays and municipalities also have day care
                centers not yet tagged in this snapshot.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {matchingAdditional.map(site => (
                  <div
                    key={site.id}
                    className="rounded-md border border-gray-200 p-4 text-sm space-y-1.5"
                  >
                    <p className="font-medium text-gray-900">{site.name}</p>
                    <p className="text-xs text-gray-600">
                      {site.category} · {site.municipality} ·{' '}
                      {site.lat.toFixed(5)}, {site.lon.toFixed(5)}
                    </p>
                    <div className="flex flex-wrap gap-4 pt-1 text-xs">
                      <a
                        href={site.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary-600 underline"
                      >
                        Open in Google Maps
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </a>
                      <a
                        href={site.osmUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary-600 underline"
                      >
                        OpenStreetMap ({site.osmId})
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </details>
        ) : null}
        <div className="mt-10">
          <Heading level={2}>Education office contacts</Heading>
          <div className="grid gap-6 md:grid-cols-2">
            {officeEntries.map(office => (
              <section
                key={office.name}
                className="border border-gray-300 rounded-lg p-5 min-w-0"
              >
                <h3 className="text-lg font-semibold mb-4">{office.name}</h3>
                <dl className="space-y-3">
                  {Object.entries(office)
                    .filter(([key]) => key !== 'name')
                    .map(([key, value]) => (
                      <div key={key}>
                        <dt className="font-medium text-sm">
                          {officeLabels[key] || key.replaceAll('_', ' ')}
                        </dt>
                        <dd className="text-gray-700 text-sm">
                          <Value value={value} field={key} />
                        </dd>
                      </div>
                    ))}
                </dl>
              </section>
            ))}
          </div>
        </div>
        <div className="mt-10 border-t border-gray-200 pt-7">
          <Heading level={2}>Enrollment and school records</Heading>
          <div className="flex flex-wrap gap-5 text-primary-600">
            <Link className="underline" to="/services/education/colleges">
              Colleges in Siquijor
            </Link>
            <Link
              className="underline"
              to="/services/education/schools-division"
            >
              Enroll in basic education
            </Link>
            <Link
              className="underline"
              to="/services/education/school-directory"
            >
              Request school records
            </Link>
            <Link
              className="underline"
              to="/government/departments/education-office"
            >
              Contact the Schools Division
            </Link>
          </div>
        </div>
        <details className="mt-8 border-t border-gray-200 pt-6">
          <summary className="cursor-pointer font-medium text-primary-700">
            Directory sources and downloads
          </summary>
          <div className="text-sm text-gray-700 mt-5 space-y-4">
            <p>
              The elementary and high school lists were supplied in this project
              and exported on {exportDates.join(' / ')}. Matching school IDs
              appear once, with their listed education levels combined. The
              files remain unchanged.
            </p>
            <p>
              Where the files list different contacts or staff, both entries
              retain their list labels. Historical labels are preserved. The
              files do not provide per-field publication dates or source
              citations; the export date is not a certification of current
              staffing, enrollment, accreditation, or course availability.
            </p>
            <p>
              Map coordinates, campus links, and community-mapped day care and
              technical sites come from the HOTOSM / HDX Philippines Education
              Facilities extract (OpenStreetMap snapshot 15 November 2026,
              exported 16 November 2026, licensed under{' '}
              <a
                className="text-primary-600 underline"
                href={educationOsm.metadata.licenseUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                ODC-ODbL 1.0
              </a>
              ). The Siquijor subset contains{' '}
              {educationOsm.metadata.featureCount} mapped features (
              {educationOsm.metadata.namedFeatureCount} named facilities and{' '}
              {educationOsm.metadata.unnamedBuildingFootprints} unnamed school
              building footprints).
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <a
                  className="text-primary-600 underline"
                  href="/data/schools.json"
                  download
                >
                  Download the combined directory (JSON)
                </a>
              </li>
              <li>
                <a
                  className="text-primary-600 underline"
                  href="/data/schools.csv"
                  download
                >
                  Download the school list (CSV)
                </a>
              </li>
              <li>
                <a
                  className="text-primary-600 underline"
                  href="/data/education-facilities-osm.geojson"
                  download
                >
                  OpenStreetMap Siquijor education facilities — all{' '}
                  {educationOsm.metadata.featureCount} features (GeoJSON)
                </a>
              </li>
              <li>
                <a
                  className="text-primary-600 underline"
                  href="/data/education-facilities-osm.csv"
                  download
                >
                  OpenStreetMap named education facilities and coordinates (CSV)
                </a>
              </li>
              <li>
                <a
                  className="text-primary-600 underline"
                  href="/data/schools/siquijor_elementary_schools.json"
                  download
                >
                  Elementary school file (JSON)
                </a>
              </li>
              <li>
                <a
                  className="text-primary-600 underline"
                  href="/data/schools/siquijor_high_schools.json"
                  download
                >
                  High school file (JSON)
                </a>
              </li>
              <li>
                <a
                  className="text-primary-600 underline"
                  href="https://www.deped-siquijor.com/schools-2/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Related reference: DepEd Siquijor school directory
                </a>
              </li>
            </ul>
          </div>
        </details>
      </Section>
    </>
  );
}
