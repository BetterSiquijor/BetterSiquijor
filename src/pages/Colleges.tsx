import { Link, useSearchParams } from 'react-router';
import { ExternalLink, Mail, MapPin, Phone } from 'lucide-react';
import directory from '../../data/records/colleges.json';
import register from '../../data/sources/college-sources.json';
import educationOsm from '../../data/derived/education-osm.json';
import EducationMap, { type EducationMapPin } from '../components/EducationMap';
import SEO from '../components/SEO';
import Section from '../components/ui/Section';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { Heading } from '../components/ui/Heading';
import ReportIssueLink from '../components/ui/ReportIssueLink';

type College = (typeof directory.colleges)[number];
type OsmCollegeEntry =
  (typeof educationOsm.collegesById)[keyof typeof educationOsm.collegesById];
const osmByCollegeId = educationOsm.collegesById as Record<
  string,
  OsmCollegeEntry
>;
const sourceById = new Map(register.sources.map(s => [s.id, s]));
const municipalities = [
  ...new Set(directory.colleges.map(c => c.municipality)),
].sort();
const colleges = directory.colleges.map(college => ({
  ...college,
  searchText: [
    college.name,
    college.shortName,
    college.address,
    ...college.programs.flatMap(p => [p.name, ...p.majors]),
  ]
    .join(' ')
    .toLowerCase(),
}));
const control =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-sm';
const link = 'text-primary-600 underline';

function CollegeCard({ college }: { college: College }) {
  const osmEntry = osmByCollegeId[college.id];
  const sourceIds = [
    ...new Set([
      college.identitySourceId,
      ...college.addressSourceIds,
      ...college.contacts.map(c => c.sourceId),
      ...college.programs.map(p => p.sourceId),
      college.facebook.sourceId,
      ...college.additionalSourceIds,
      ...(college.websiteSourceId ? [college.websiteSourceId] : []),
    ]),
  ];
  return (
    <article
      id={college.id}
      className="border border-gray-300 border-t-4 border-t-primary-500 rounded-lg p-6 min-w-0"
    >
      <p className="text-xs font-medium text-primary-700 mb-2">
        {college.sector} college · {college.municipality}
      </p>
      <h2 className="text-xl font-bold text-gray-900 mb-4">{college.name}</h2>
      <p className="flex items-start gap-2 text-gray-700">
        <MapPin className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
        {college.address}
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 mb-2 text-sm">
        <a
          className={`${link} inline-flex items-center gap-1.5`}
          href={
            osmEntry
              ? osmEntry.primary.googleMapsUrl
              : 'https://www.google.com/maps/search/?api=1&query=' +
                encodeURIComponent(college.name + ', ' + college.address)
          }
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in Google Maps{' '}
          <ExternalLink className="w-4 h-4" aria-hidden="true" />
        </a>
        {osmEntry ? (
          <a
            className={`${link} inline-flex items-center gap-1.5`}
            href={osmEntry.primary.osmUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenStreetMap{' '}
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        ) : null}
      </div>
      {osmEntry ? (
        <p className="text-xs text-gray-600 mb-5">
          Mapped coordinates: {osmEntry.primary.lat.toFixed(5)},{' '}
          {osmEntry.primary.lon.toFixed(5)} (OpenStreetMap · 15 Nov 2026)
          {osmEntry.additionalCampuses.length ? (
            <span className="block mt-1">
              Other mapped campus:{' '}
              {osmEntry.additionalCampuses.map((campus, index) => (
                <span key={campus.osmId}>
                  {index > 0 ? ' · ' : ''}
                  <a
                    className={link}
                    href={campus.osmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {campus.osmName}
                  </a>
                </span>
              ))}
            </span>
          ) : null}
        </p>
      ) : (
        <div className="mb-5" />
      )}
      <dl className="space-y-4">
        {college.contacts.map(contact => (
          <div key={contact.value}>
            <dt className="text-sm font-medium text-gray-900 mb-1">
              {contact.label}
            </dt>
            <dd>
              <a
                className={`${link} inline-flex items-start gap-2 break-all`}
                href={
                  contact.kind === 'phone'
                    ? 'tel:' + contact.value.replace(/[^+\d]/g, '')
                    : 'mailto:' + contact.value
                }
              >
                {contact.kind === 'phone' ? (
                  <Phone className="w-4 h-4 shrink-0 mt-1" aria-hidden="true" />
                ) : (
                  <Mail className="w-4 h-4 shrink-0 mt-1" aria-hidden="true" />
                )}
                {contact.value}
              </a>
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-3 mt-5">
        <a
          className="inline-flex gap-2 items-center border border-primary-600 text-primary-700 rounded-md px-4 py-2 text-sm font-medium hover:bg-primary-50"
          href={college.facebook.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Facebook page <ExternalLink className="w-4 h-4" aria-hidden="true" />
        </a>
        {college.website ? (
          <a
            className={`${link} inline-flex gap-2 items-center text-sm px-1 py-2`}
            href={college.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            College website{' '}
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        ) : null}
      </div>
      {college.programs.length ? (
        <details className="mt-6 border-t border-gray-200 pt-4">
          <summary className="cursor-pointer font-medium text-primary-700">
            Courses and majors ({college.programs.length})
          </summary>
          <div className="mt-4 space-y-5">
            {['Undergraduate', 'Graduate'].map(level => {
              const programs = college.programs.filter(p => p.level === level);
              return programs.length ? (
                <div key={level}>
                  <h3 className="font-semibold text-sm mb-3">
                    {level} programs
                  </h3>
                  <ul className="list-disc pl-5 space-y-3 text-sm text-gray-700">
                    {programs.map(program => (
                      <li key={program.name}>
                        <span className="font-medium">{program.name}</span>
                        {program.majors.length ? (
                          <span className="block mt-1">
                            Majors: {program.majors.join(', ')}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null;
            })}
            <p className="text-sm text-gray-700">
              Ask the college about available intakes and admission requirements
              for your chosen course.
            </p>
          </div>
        </details>
      ) : (
        <p className="mt-6 text-sm text-gray-700">
          Contact the college about degree programs and admission requirements.
        </p>
      )}
      <details className="mt-6 border-t border-gray-200 pt-4">
        <summary className="cursor-pointer text-sm font-medium text-primary-700">
          Sources and contact dates
        </summary>
        <div className="mt-4 space-y-3 text-sm text-gray-700">
          {college.notes.map(note => (
            <p key={note}>{note}</p>
          ))}
          {osmEntry && osmEntry.primary.osmName !== college.name ? (
            <p>
              OpenStreetMap feature {osmEntry.primary.osmId} records the label “
              {osmEntry.primary.osmName}”.
            </p>
          ) : null}
          <ul className="space-y-3">
            {sourceIds.map(id => {
              const source = sourceById.get(id);
              return source ? (
                <li key={id}>
                  <a
                    className={link}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {source.publisher}: {source.title}
                  </a>
                  <span className="block text-xs mt-1">
                    {source.sourceDate
                      ? 'Publication: ' + source.sourceDate
                      : 'Publication date not stated'}{' '}
                    · Checked: {source.reviewed}
                  </span>
                </li>
              ) : null;
            })}
          </ul>
        </div>
      </details>
      <div className="mt-4 pt-3 border-t border-gray-200">
        <ReportIssueLink
          recordType="College directory entry"
          recordId={college.id}
          recordName={college.name}
          pagePath="/services/education/colleges"
        />
      </div>
    </article>
  );
}

export default function Colleges() {
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') || '').slice(0, 120);
  const municipality = params.get('municipality') || '';
  const sector = params.get('sector') || '';
  const words = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const rows = colleges.filter(
    c =>
      (!municipality || c.municipality === municipality) &&
      (!sector || c.sector === sector) &&
      words.every(word => c.searchText.includes(word))
  );
  const primaryCollegePins: EducationMapPin[] = rows
    .filter(college => Boolean(osmByCollegeId[college.id]))
    .map(college => {
      const osmEntry = osmByCollegeId[college.id];
      return {
        id: college.id,
        targetId: college.id,
        name: college.name,
        municipality: college.municipality,
        category: college.sector === 'Private' ? 'Private' : 'Public',
        badgeLabel: `${college.sector} college · ${college.municipality}`,
        subtitle: college.address,
        lat: osmEntry.primary.lat,
        lon: osmEntry.primary.lon,
        osmId: osmEntry.primary.osmId,
        osmName: osmEntry.primary.osmName,
        osmUrl: osmEntry.primary.osmUrl,
        googleMapsUrl: osmEntry.primary.googleMapsUrl,
        osmMunicipality: osmEntry.primary.osmMunicipality,
        municipalityDiffers: osmEntry.primary.municipalityDiffers,
      };
    });
  const branchCampusPins: EducationMapPin[] = rows.flatMap(college => {
    const osmEntry = osmByCollegeId[college.id];
    if (!osmEntry) return [];
    return osmEntry.additionalCampuses.map(campus => ({
      id: `${college.id}-${campus.osmId}`,
      targetId: college.id,
      name: campus.osmName,
      municipality: campus.osmMunicipality,
      category: college.sector === 'Private' ? 'Private' : 'Public',
      badgeLabel: `${college.sector} college (mapped branch campus)`,
      subtitle: `${campus.osmMunicipality}, Siquijor · Part of ${college.name}`,
      lat: campus.lat,
      lon: campus.lon,
      osmId: campus.osmId,
      osmName: campus.osmName,
      osmUrl: campus.osmUrl,
      googleMapsUrl: campus.googleMapsUrl,
      osmMunicipality: campus.osmMunicipality,
    }));
  });
  function jumpToCollege(collegeId: string) {
    const card = document.getElementById(collegeId);
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
        title="Colleges in Siquijor"
        description="Find public and private colleges in Siquijor. Compare courses, view campus locations, and contact college admissions or registrar offices."
      />
      <Section>
        <Breadcrumbs className="mb-8" />
        <Heading>Colleges in Siquijor</Heading>
        <p className="text-gray-700 mb-7">
          Find a college near you, explore courses, and contact the admissions
          or registrar’s office. Choose a college to ask about application
          dates, requirements, and fees.
        </p>
        <div className="grid gap-4 md:grid-cols-3 mb-5">
          <div>
            <label
              htmlFor="college-search"
              className="block text-sm font-medium mb-2"
            >
              College or course
            </label>
            <input
              id="college-search"
              className={control}
              type="search"
              maxLength={120}
              placeholder="e.g. SSC, education, or tourism"
              value={q}
              onChange={e => update('q', e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="college-municipality"
              className="block text-sm font-medium mb-2"
            >
              Municipality
            </label>
            <select
              id="college-municipality"
              className={control}
              value={municipality}
              onChange={e => update('municipality', e.target.value)}
            >
              <option value="">All municipalities</option>
              {municipalities.map(town => (
                <option key={town}>{town}</option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="college-sector"
              className="block text-sm font-medium mb-2"
            >
              College type
            </label>
            <select
              id="college-sector"
              className={control}
              value={sector}
              onChange={e => update('sector', e.target.value)}
            >
              <option value="">Public and private</option>
              <option>Public</option>
              <option>Private</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-3 items-center mb-6">
          <p role="status" className="text-sm text-gray-700">
            {rows.length} of {colleges.length} colleges
          </p>
          <button
            className={`${link} text-sm`}
            onClick={() => setParams({}, { replace: true })}
          >
            Clear filters
          </button>
        </div>
        <EducationMap
          title="Explore colleges on the Siquijor map"
          itemLabel="colleges"
          pins={primaryCollegePins}
          additionalPins={branchCampusPins}
          additionalToggleLabel="Show branch campuses"
          totalFilteredCount={rows.length}
          jumpLabel="Jump to college details below"
          onJumpToItem={jumpToCollege}
        />
        <div className="grid gap-6 lg:grid-cols-2 items-start">
          {rows.map(college => (
            <CollegeCard key={college.id} college={college} />
          ))}
        </div>
        {!rows.length ? (
          <p className="bg-gray-50 p-8 rounded-lg text-center text-gray-700">
            No colleges match these filters. Try another college or course, or
            clear your filters.
          </p>
        ) : null}
        <nav
          aria-label="More education services"
          className="flex flex-wrap gap-5 mt-10 border-t border-gray-200 pt-6"
        >
          <Link className={link} to="/services/education/find-school">
            Find an elementary or secondary school
          </Link>
          <Link
            className={link}
            to="/services/education/public-higher-education"
          >
            Siquijor State College course guide
          </Link>
        </nav>
        <details className="mt-8 border-t border-gray-300 pt-6">
          <summary className="cursor-pointer font-medium text-primary-700">
            Directory information and downloads
          </summary>
          <div className="mt-5 text-sm text-gray-700 space-y-4">
            <p>
              Institutions follow UniFAST’s participating-HEI directory.
              Locations and contacts come from CHED and the colleges’ own
              websites or Facebook pages. Course lists follow each college’s
              catalogue or official Facebook announcements (Siquijor State
              College undergraduate programs updated from its 18 June 2025
              Facebook post, checked 20 November 2026; other college entries
              checked 18 November 2026). Undated publications retain that
              status. Phone numbers have not been call-tested. Campus
              coordinates and OpenStreetMap links come from the HOTOSM /
              OpenStreetMap Philippines extract (15 November 2026 snapshot,{' '}
              <a
                className={link}
                href={educationOsm.metadata.licenseUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                ODC-ODbL 1.0
              </a>
              ).
            </p>
            <p>
              Contact your chosen college for current intakes, fees, and
              admission dates. A UniFAST directory listing does not guarantee
              scholarship eligibility or certify the accreditation of individual
              degrees.
            </p>
            <p className="flex flex-wrap gap-x-5 gap-y-3">
              <a className={link} href="/data/colleges.json" download>
                Download college records (JSON)
              </a>
              <a className={link} href="/data/colleges.csv" download>
                Download colleges (CSV)
              </a>
              <a className={link} href="/data/college-sources.json" download>
                Download source records (JSON)
              </a>
              <a
                className={link}
                href="/data/education-facilities-osm.geojson"
                download
              >
                Download OpenStreetMap education map (GeoJSON)
              </a>
              <a
                className={link}
                href="/data/education-facilities-osm.csv"
                download
              >
                Download OpenStreetMap coordinates (CSV)
              </a>
            </p>
          </div>
        </details>
      </Section>
    </>
  );
}
