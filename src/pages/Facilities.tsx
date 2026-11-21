import { Link, useSearchParams } from 'react-router';
import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react';
import directory from '../../data/records/facilities.json';
import sources from '../../data/sources/facility-sources.json';
import facilityOsm from '../../data/records/facility-osm.json';
import hotlinesData from '../../data/derived/hotlines.json';
import SEO from '../components/SEO';
import Section from '../components/ui/Section';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { Heading } from '../components/ui/Heading';
import FacilityMap, { type FacilityMapPin } from '../components/FacilityMap';
import ReportIssueLink from '../components/ui/ReportIssueLink';

type FacilityView =
  'hospitals' | 'rhu' | 'police' | 'fire' | 'coast-guard' | 'ports';

type OsmCoord = {
  lat: number;
  lon: number;
  osmId: string;
  osmName: string;
  osmUrl: string;
  googleMapsUrl: string;
  note?: string;
};

const osmById = facilityOsm.byId as Record<string, OsmCoord>;
const sourceById = new Map(sources.sources.map(source => [source.id, source]));

const municipalities = [
  'Enrique Villanueva',
  'Larena',
  'Lazi',
  'Maria',
  'San Juan',
  'Siquijor',
];

const control =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-sm';

const date = new Intl.DateTimeFormat('en-PH', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Manila',
}).format(new Date(directory.metadata.reviewedAt));

const VIEW_TABS: {
  id: FacilityView;
  label: string;
  to: string;
  color: string;
}[] = [
  {
    id: 'hospitals',
    label: 'Hospitals',
    to: '/services/health/hospitals',
    color: '#0066eb',
  },
  {
    id: 'rhu',
    label: 'Rural Health Units',
    to: '/services/health/hospitals?view=rhu',
    color: '#0f766e',
  },
  {
    id: 'police',
    label: 'Police stations',
    to: '/services/public-safety/police-stations',
    color: '#1d4ed8',
  },
  {
    id: 'fire',
    label: 'Fire stations (BFP)',
    to: '/services/public-safety/police-stations?view=fire',
    color: '#dc2626',
  },
  {
    id: 'coast-guard',
    label: 'Coast Guard',
    to: '/services/public-safety/police-stations?view=coast-guard',
    color: '#0369a1',
  },
  {
    id: 'ports',
    label: 'Ports',
    to: '/services/health/hospitals?view=ports',
    color: '#b45309',
  },
];

type SimpleFacility = {
  id: string;
  name: string;
  badge: string;
  municipality: string;
  address: string;
  phones: { label: string; value: string }[];
  details: { label: string; value: string }[];
  note?: string | null;
  sourceLabel: string;
  sourceUrl?: string;
};

function buildHotlineFacilities(
  prefix: string,
  matchTerm: string,
  badge: string,
  nameSuffix: string
): SimpleFacility[] {
  return hotlinesData.municipalDirectories.map(group => {
    const slug = group.municipality.toLowerCase().replace(/\s+/g, '-');
    const entry = group.entries.find(e =>
      e.office.toLowerCase().includes(matchTerm)
    );
    return {
      id: `${prefix}-${slug}`,
      name: `${group.municipality} ${nameSuffix}`,
      badge,
      municipality: group.municipality,
      address: `${group.municipality}, Siquijor`,
      phones: (entry?.contactNumbers || []).map((num, idx) => ({
        label: idx === 0 ? 'Supplied PDRRMO hotline' : 'Additional hotline',
        value: num,
      })),
      details: [],
      note: group.note,
      sourceLabel:
        'User-supplied PDRRMO Emergency Hotline Directory (undated, integrated 18 November 2026)',
    };
  });
}

const rhuFacilities = buildHotlineFacilities(
  'rhu',
  'rural health',
  'Rural Health Unit (RHU)',
  'Rural Health Unit (RHU)'
);
const fireFacilities = buildHotlineFacilities(
  'fire',
  'fire',
  'Bureau of Fire Protection',
  'Fire Station (BFP)'
);
const coastGuardFacilities = buildHotlineFacilities(
  'pcg',
  'coast guard',
  'Philippine Coast Guard',
  'Coast Guard Sub-station'
);

const portFacilities: SimpleFacility[] = [
  {
    id: 'port-siquijor',
    name: 'Port of Siquijor',
    badge: 'PPA Port',
    municipality: 'Siquijor',
    address: 'Poblacion, Siquijor, Siquijor',
    phones: [
      { label: 'PPA PMO-NOS (Dumaguete)', value: '(035) 527-2079' },
      { label: 'PPA PMO-NOS mobile', value: '+63 915 052 1161' },
    ],
    details: [
      {
        label: 'Routes listed by PPA',
        value:
          'RoRo and fastcraft ferries to Dumaguete; PPA schedule page also lists Tagbilaran.',
      },
      {
        label: 'Shipping lines listed by PPA',
        value: 'Aleson, Montenegro, Ocean Fast Ferries, HS Star Marine',
      },
    ],
    sourceLabel:
      'Philippine Ports Authority — PMO Negros Oriental / Siquijor (checked 18 November 2026)',
    sourceUrl: 'https://ppapmo-nos.com/schedules/port-of-sqiuijor/',
  },
  {
    id: 'port-larena',
    name: 'Port of Larena',
    badge: 'PPA Port',
    municipality: 'Larena',
    address: 'North Poblacion, Larena, Siquijor',
    phones: [
      { label: 'PPA PMO-NOS (Dumaguete)', value: '(035) 527-2079' },
      { label: 'PPA PMO-NOS mobile', value: '+63 915 052 1161' },
    ],
    details: [
      {
        label: 'Routes listed by PPA',
        value:
          'RoRo and fastcraft gateway; PPA schedule page lists Plaridel, Tagbilaran, and Samboan.',
      },
      {
        label: 'Shipping lines listed by PPA',
        value: 'Lite Shipping, Maayo Shipping, Momovillage Panglao Adventure',
      },
    ],
    sourceLabel:
      'Philippine Ports Authority — PMO Negros Oriental / Siquijor (checked 18 November 2026)',
    sourceUrl: 'https://ppapmo-nos.com/schedules/port-of-larena/',
  },
  {
    id: 'port-lazi',
    name: 'Port of Lazi',
    badge: 'PPA Port',
    municipality: 'Lazi',
    address: 'Tigbawan, Lazi, Siquijor',
    phones: [
      { label: 'PPA PMO-NOS (Dumaguete)', value: '(035) 527-2079' },
      { label: 'PPA PMO-NOS mobile', value: '+63 915 052 1161' },
    ],
    details: [
      {
        label: 'Overview',
        value:
          '65 m berth and 68-passenger terminal building; PIA reported a Lazi–Tagbilaran–Plaridel ferry route launched 23 October 2026.',
      },
    ],
    sourceLabel:
      'PPA PMO-NOS TMO-Larena Profile & PIA (checked 18 November 2026)',
    sourceUrl: 'https://ppapmo-nos.com/sub-ports/539-2/',
  },
];

export default function Facilities({ kind }: { kind: 'hospitals' | 'police' }) {
  const [params, setParams] = useSearchParams();
  const requestedView = params.get('view') as FacilityView | null;
  const activeView: FacilityView =
    requestedView && VIEW_TABS.some(t => t.id === requestedView)
      ? requestedView
      : kind;

  const q = (params.get('q') || '').slice(0, 120);
  const municipality = params.get('municipality') || '';
  const words = q.toLowerCase().trim().split(/\s+/).filter(Boolean);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  function jumpToCard(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const activeTabMeta = VIEW_TABS.find(t => t.id === activeView)!;

  const isCanonicalView = activeView === 'hospitals' || activeView === 'police';
  const canonicalEntries = directory.facilities.filter(f =>
    activeView === 'hospitals' ? f.kind === 'hospital' : f.kind !== 'hospital'
  );
  const canonicalRows = isCanonicalView
    ? canonicalEntries.filter(
        f =>
          (!municipality || f.municipality === municipality) &&
          words.every(word =>
            [
              f.name,
              f.address,
              ...f.contacts.flatMap(c =>
                c.kind === 'phone'
                  ? [c.value, c.value.replace(/\D/g, '')]
                  : [c.value]
              ),
            ]
              .join(' ')
              .toLowerCase()
              .includes(word)
          )
      )
    : [];

  const simpleSource =
    activeView === 'rhu'
      ? rhuFacilities
      : activeView === 'fire'
        ? fireFacilities
        : activeView === 'coast-guard'
          ? coastGuardFacilities
          : activeView === 'ports'
            ? portFacilities
            : [];

  const simpleRows = !isCanonicalView
    ? simpleSource.filter(
        f =>
          (!municipality || f.municipality === municipality) &&
          words.every(word =>
            [
              f.name,
              f.municipality,
              f.address,
              ...f.phones.flatMap(p => [p.value, p.value.replace(/\D/g, '')]),
              ...f.details.map(d => d.value),
            ]
              .join(' ')
              .toLowerCase()
              .includes(word)
          )
      )
    : [];

  const mapPins: FacilityMapPin[] = isCanonicalView
    ? canonicalRows
        .filter(f => Boolean(osmById[f.id]))
        .map(f => {
          const osm = osmById[f.id];
          return {
            id: f.id,
            targetId: f.id,
            name: f.name,
            municipality: f.municipality,
            badgeLabel:
              f.kind === 'hospital'
                ? 'Health facility'
                : f.kind === 'police-office'
                  ? 'Provincial police office'
                  : 'Municipal police station',
            subtitle: f.address,
            color: activeTabMeta.color,
            lat: osm.lat,
            lon: osm.lon,
            osmId: osm.osmId,
            osmName: osm.osmName,
            osmUrl: osm.osmUrl,
            googleMapsUrl: osm.googleMapsUrl,
          };
        })
    : simpleRows
        .filter(f => Boolean(osmById[f.id]))
        .map(f => {
          const osm = osmById[f.id];
          return {
            id: f.id,
            targetId: f.id,
            name: f.name,
            municipality: f.municipality,
            badgeLabel: f.badge,
            subtitle: f.address,
            color: activeTabMeta.color,
            lat: osm.lat,
            lon: osm.lon,
            osmId: osm.osmId,
            osmName: osm.osmName,
            osmUrl: osm.osmUrl,
            googleMapsUrl: osm.googleMapsUrl,
          };
        });

  const titles: Record<FacilityView, string> = {
    hospitals: 'Hospitals in Siquijor',
    rhu: 'Rural Health Units (RHUs) in Siquijor',
    police: 'Police stations in Siquijor',
    fire: 'Fire stations (BFP) in Siquijor',
    'coast-guard': 'Coast Guard sub-stations in Siquijor',
    ports: 'Ports in Siquijor',
  };

  const intros: Record<FacilityView, string> = {
    hospitals:
      'Find hospital locations and contact details. Call ahead for clinic schedules, appointments, and the service you need.',
    rhu: 'Find municipal Rural Health Units across Siquijor’s six towns. Mapped locations come from OpenStreetMap; hotlines come from the supplied PDRRMO directory.',
    police:
      'Find your municipal police station or contact the provincial police office. Choose a municipality to find local assistance.',
    fire: 'Find municipal Bureau of Fire Protection (BFP) stations and fire response hotlines across Siquijor.',
    'coast-guard':
      'Find municipal Philippine Coast Guard sub-station hotlines for maritime and coastal emergencies. (Coast Guard sub-stations are not yet mapped in OpenStreetMap.)',
    ports:
      'Find Siquijor’s three PPA ports (Siquijor, Larena, and Lazi) on the map and check port management contacts.',
  };

  const totalCount = isCanonicalView
    ? canonicalEntries.length
    : simpleSource.length;
  const filteredCount = isCanonicalView
    ? canonicalRows.length
    : simpleRows.length;
  const pagePath =
    kind === 'hospitals'
      ? '/services/health/hospitals'
      : '/services/public-safety/police-stations';

  return (
    <>
      <SEO title={titles[activeView]} description={intros[activeView]} />
      <Section>
        <Breadcrumbs className="mb-8" />
        <Heading>{titles[activeView]}</Heading>
        <p className="text-gray-700 mb-5">{intros[activeView]}</p>

        <div className="border-l-4 border-primary-600 bg-primary-50 p-5 mb-7 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-primary-900">
              Need urgent assistance?{' '}
              <a href="tel:911" className="underline">
                Call 911
              </a>
            </p>
            <p className="text-sm text-primary-900 mt-1">
              For emergencies, call rather than send a Facebook message. Tell
              the operator your location and what happened.
            </p>
          </div>
          <Link
            to="/hotlines"
            className="text-sm font-medium text-primary-700 underline shrink-0"
          >
            All emergency hotlines →
          </Link>
        </div>

        <nav
          aria-label="Facility directories"
          className="flex flex-wrap gap-2.5 mb-7"
        >
          {VIEW_TABS.map(tab => (
            <Link
              key={tab.id}
              to={tab.to}
              aria-current={activeView === tab.id ? 'page' : undefined}
              className={`border rounded-md px-3.5 py-2 text-sm font-medium ${
                activeView === tab.id
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : 'border-gray-300 text-primary-700 hover:bg-primary-50'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <div className="grid gap-4 md:grid-cols-2 max-w-3xl mb-5">
          <div>
            <label
              htmlFor="facility-search"
              className="block text-sm font-medium mb-2"
            >
              Name, location, or contact number
            </label>
            <input
              id="facility-search"
              type="search"
              className={control}
              value={q}
              maxLength={120}
              onChange={e => update('q', e.target.value)}
              placeholder="e.g. Lazi, Poblacion, or 0927"
            />
          </div>
          <div>
            <label
              htmlFor="facility-municipality"
              className="block text-sm font-medium mb-2"
            >
              Municipality
            </label>
            <select
              id="facility-municipality"
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
        </div>

        <div className="flex flex-wrap justify-between gap-3 items-center mb-5">
          <p role="status" className="text-sm text-gray-700">
            {filteredCount} of {totalCount} {activeTabMeta.label.toLowerCase()}
          </p>
          {q || municipality ? (
            <button
              className="text-primary-600 underline text-sm"
              onClick={() => {
                const next = new URLSearchParams();
                if (requestedView) next.set('view', requestedView);
                setParams(next, { replace: true });
              }}
            >
              Clear filters
            </button>
          ) : null}
        </div>

        {/* Interactive Leaflet + OSM Map */}
        {activeView !== 'coast-guard' ? (
          <FacilityMap
            title={`Explore ${activeTabMeta.label.toLowerCase()} on the Siquijor map`}
            itemLabel={activeTabMeta.label.toLowerCase()}
            pins={mapPins}
            totalFilteredCount={filteredCount}
            onJumpToItem={jumpToCard}
          />
        ) : null}

        {/* Canonical Hospital / Police Cards */}
        {isCanonicalView ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {canonicalRows.map(facility => {
              const osm = osmById[facility.id];
              const citedIds = [
                ...new Set([
                  ...facility.addressSourceIds,
                  ...facility.contacts.map(c => c.sourceId),
                  ...facility.details.flatMap(d => d.sourceIds),
                  ...(facility.facebook ? [facility.facebook.sourceId] : []),
                ]),
              ];
              const mapUrl =
                osm?.googleMapsUrl ||
                'https://www.google.com/maps/search/?api=1&query=' +
                  encodeURIComponent(facility.name + ', ' + facility.address);
              return (
                <article
                  key={facility.id}
                  id={facility.id}
                  className="border border-gray-300 border-t-4 border-t-primary-500 rounded-lg p-6 min-w-0"
                >
                  <p className="text-xs font-medium text-primary-700 mb-2">
                    {facility.kind === 'hospital'
                      ? 'Health facility'
                      : facility.kind === 'police-office'
                        ? 'Provincial police office'
                        : 'Municipal police station'}{' '}
                    · {facility.municipality}
                  </p>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {facility.name}
                  </h2>
                  <p className="flex items-start gap-2 text-gray-700">
                    <MapPin
                      className="w-5 h-5 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    {facility.address}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 mb-5 text-sm">
                    <a
                      className="inline-flex gap-1.5 items-center text-primary-600 underline"
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open in Maps
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    </a>
                    {osm ? (
                      <a
                        className="inline-flex gap-1.5 items-center text-primary-600 underline"
                        href={osm.osmUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        OpenStreetMap ({osm.osmId})
                        <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                  <dl className="space-y-4">
                    {facility.contacts.map(contact => (
                      <div key={contact.kind + contact.value}>
                        <dt className="text-sm font-medium text-gray-900 mb-1">
                          {contact.label}
                        </dt>
                        <dd>
                          <a
                            className="inline-flex items-start gap-2 text-primary-600 underline break-all"
                            href={
                              contact.kind === 'phone'
                                ? 'tel:' + contact.value.replace(/[^+\d]/g, '')
                                : 'mailto:' + contact.value
                            }
                          >
                            {contact.kind === 'phone' ? (
                              <Phone
                                className="w-4 h-4 shrink-0 mt-1"
                                aria-hidden="true"
                              />
                            ) : (
                              <Mail
                                className="w-4 h-4 shrink-0 mt-1"
                                aria-hidden="true"
                              />
                            )}
                            {contact.value}
                          </a>
                          {sourceById.get(contact.sourceId)?.sourceType ===
                          'office-published-directory' ? (
                            <p className="text-xs text-gray-600 mt-1">
                              Undated station-directory listing
                            </p>
                          ) : null}
                        </dd>
                      </div>
                    ))}
                    {facility.details.map(detail => (
                      <div key={detail.label}>
                        <dt className="text-sm font-medium text-gray-900 mb-1">
                          {detail.label}
                        </dt>
                        <dd className="text-sm text-gray-700">
                          {detail.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {facility.facebook ? (
                    <a
                      className="inline-flex mt-5 gap-2 items-center border border-primary-600 text-primary-700 rounded-md px-4 py-2 text-sm font-medium hover:bg-primary-50"
                      href={facility.facebook.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Facebook page
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    </a>
                  ) : null}
                  <details className="mt-6 border-t border-gray-200 pt-4">
                    <summary className="cursor-pointer text-sm font-medium text-primary-700">
                      Sources and contact dates
                    </summary>
                    <div className="mt-4 space-y-3 text-sm text-gray-700">
                      {facility.notes.map(note => (
                        <p key={note}>{note}</p>
                      ))}
                      <ul className="space-y-3">
                        {citedIds.map(id => {
                          const source = sourceById.get(id);
                          return source ? (
                            <li key={id}>
                              <a
                                className="text-primary-600 underline"
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
                      recordType="Facility directory entry"
                      recordId={facility.id}
                      recordName={facility.name}
                      pagePath={pagePath}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* RHU, Fire, Coast Guard, and Port Cards */
          <div className="grid gap-6 lg:grid-cols-2">
            {simpleRows.map(facility => {
              const osm = osmById[facility.id];
              return (
                <article
                  key={facility.id}
                  id={facility.id}
                  className="border border-gray-300 border-t-4 border-t-primary-500 rounded-lg p-6 min-w-0 flex flex-col justify-between"
                >
                  <div>
                    <p className="text-xs font-medium text-primary-700 mb-2">
                      {facility.badge} · {facility.municipality}
                    </p>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">
                      {facility.name}
                    </h2>
                    <p className="flex items-start gap-2 text-gray-700 text-sm">
                      <MapPin
                        className="w-4 h-4 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      {facility.address}
                    </p>
                    {osm ? (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 mb-4 text-sm">
                        <a
                          className="inline-flex gap-1.5 items-center text-primary-600 underline"
                          href={osm.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open in Google Maps
                          <ExternalLink
                            className="w-4 h-4"
                            aria-hidden="true"
                          />
                        </a>
                        <a
                          className="inline-flex gap-1.5 items-center text-primary-600 underline"
                          href={osm.osmUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          OpenStreetMap ({osm.osmId})
                          <ExternalLink
                            className="w-4 h-4"
                            aria-hidden="true"
                          />
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-600 mt-2 mb-4">
                        Not yet mapped in OpenStreetMap.
                      </p>
                    )}

                    {facility.note ? (
                      <p className="text-xs text-warning-900 bg-warning-50 border border-warning-300 rounded p-2.5 mb-4">
                        {facility.note}
                      </p>
                    ) : null}

                    <dl className="space-y-3">
                      {facility.phones.map(p => (
                        <div key={p.value}>
                          <dt className="text-xs font-medium text-gray-700">
                            {p.label}
                          </dt>
                          <dd>
                            <a
                              href={'tel:' + p.value.replace(/[^+\d]/g, '')}
                              className="inline-flex items-center gap-2 text-primary-600 underline text-sm font-medium"
                            >
                              <Phone className="w-4 h-4" aria-hidden="true" />
                              {p.value}
                            </a>
                          </dd>
                        </div>
                      ))}
                      {facility.details.map(d => (
                        <div key={d.label}>
                          <dt className="text-xs font-medium text-gray-900">
                            {d.label}
                          </dt>
                          <dd className="text-sm text-gray-700">{d.value}</dd>
                        </div>
                      ))}
                    </dl>
                    {activeView === 'ports' ? (
                      <p className="mt-4 text-sm">
                        <Link
                          to="/services/tourism/ports-and-ferries"
                          className="text-primary-700 underline font-medium"
                        >
                          Full ports &amp; shipping-line contacts →
                        </Link>
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-5 pt-3 border-t border-gray-200 space-y-2">
                    <p className="text-xs text-gray-600">
                      Source:{' '}
                      {facility.sourceUrl ? (
                        <a
                          href={facility.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-primary-700"
                        >
                          {facility.sourceLabel}
                        </a>
                      ) : (
                        facility.sourceLabel
                      )}
                    </p>
                    <ReportIssueLink
                      recordType={`${facility.badge} directory entry`}
                      recordId={facility.id}
                      recordName={facility.name}
                      pagePath={pagePath}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {filteredCount === 0 ? (
          <p className="bg-gray-50 p-8 rounded-lg text-center text-gray-700">
            No matching facilities. Try another name or clear your filters.
          </p>
        ) : null}

        <details className="mt-10 border-t border-gray-300 pt-6">
          <summary className="cursor-pointer font-medium text-primary-700">
            Directory information and downloads
          </summary>
          <div className="mt-5 text-sm text-gray-700 space-y-4">
            <p>
              Hospital and police contacts checked against their cited
              publications on {date}. Hospital classification and capacity
              follow PhilHealth’s 30 September 2026 list. RHU, Fire Station, and
              Coast Guard hotline numbers come from the undated user-supplied
              PDRRMO hotline directory. Map coordinates come from OpenStreetMap
              (queried 21 November 2026, ODbL 1.0); unmapped facilities are
              omitted from the map. Phone numbers have not been call-tested.
            </p>
            <p className="flex flex-wrap gap-x-4 gap-y-2">
              <a
                className="text-primary-600 underline"
                href="/data/facilities.json"
                download
              >
                Download hospital and police records (JSON)
              </a>
              <a
                className="text-primary-600 underline"
                href="/data/facilities.csv"
                download
              >
                Download contacts (CSV)
              </a>
              <a
                className="text-primary-600 underline"
                href="/data/emergency-hotlines.json"
                download
              >
                Download emergency hotlines (JSON)
              </a>
            </p>
            {activeView === 'hospitals' ? (
              <p>
                <a
                  className="text-primary-600 underline"
                  href="/documents/philhealth-hospitals-2026-09.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  PhilHealth hospital directory (PDF)
                </a>
                , page 52.
              </p>
            ) : null}
          </div>
        </details>
      </Section>
    </>
  );
}
