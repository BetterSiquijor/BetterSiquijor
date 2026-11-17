import { Link, useSearchParams } from 'react-router';
import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react';
import directory from '../../data/records/facilities.json';
import sources from '../../data/sources/facility-sources.json';
import SEO from '../components/SEO';
import Section from '../components/ui/Section';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { Heading } from '../components/ui/Heading';

const routes = {
  hospitals: '/services/health/hospitals',
  police: '/services/public-safety/police-stations',
};
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

export default function Facilities({ kind }: { kind: 'hospitals' | 'police' }) {
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') || '').slice(0, 120);
  const municipality = params.get('municipality') || '';
  const words = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const entries = directory.facilities.filter(f =>
    kind === 'hospitals' ? f.kind === 'hospital' : f.kind !== 'hospital'
  );
  const rows = entries.filter(
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
  );
  const title =
    kind === 'hospitals'
      ? 'Hospitals in Siquijor'
      : 'Police stations in Siquijor';
  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }
  return (
    <>
      <SEO
        title={title}
        description={
          kind === 'hospitals'
            ? 'Find Siquijor hospitals, addresses, contact numbers, email addresses, and hospital Facebook pages.'
            : 'Find municipal police stations and the provincial police office in Siquijor, with locations and contact details.'
        }
      />
      <Section>
        <Breadcrumbs className="mb-8" />
        <Heading>{title}</Heading>
        <p className="text-gray-700 mb-5">
          {kind === 'hospitals'
            ? 'Find hospital locations and contact details. Call ahead for clinic schedules, appointments, and the service you need.'
            : 'Find your municipal police station or contact the provincial police office. Choose a municipality to find local assistance.'}
        </p>
        <div className="border-l-4 border-primary-600 bg-primary-50 p-5 mb-7">
          <p className="font-semibold text-primary-900">
            Need urgent assistance?{' '}
            <a href="tel:911" className="underline">
              Call 911
            </a>
          </p>
          <p className="text-sm text-primary-900 mt-2">
            For emergencies, call rather than send a Facebook message. Tell the
            operator your location and what happened.
          </p>
        </div>
        <nav
          aria-label="Hospital and police directories"
          className="flex flex-wrap gap-3 mb-7"
        >
          {Object.entries(routes).map(([id, path]) => (
            <Link
              key={id}
              to={path}
              aria-current={kind === id ? 'page' : undefined}
              className={`border rounded-md px-4 py-2 text-sm font-medium ${kind === id ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-300 text-primary-700 hover:bg-primary-50'}`}
            >
              {id === 'hospitals' ? 'Hospitals' : 'Police stations'}
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
              placeholder={
                kind === 'hospitals'
                  ? 'e.g. Lazi Medicare'
                  : 'e.g. Larena or Poblacion'
              }
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
        <div className="flex flex-wrap justify-between gap-3 items-center mb-6">
          <p role="status" className="text-sm text-gray-700">
            {rows.length} of {entries.length}{' '}
            {kind === 'hospitals'
              ? 'health facilities'
              : 'police offices and stations'}
          </p>
          <button
            className="text-primary-600 underline text-sm"
            onClick={() => setParams({}, { replace: true })}
          >
            Clear filters
          </button>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {rows.map(facility => {
            const citedIds = [
              ...new Set([
                ...facility.addressSourceIds,
                ...facility.contacts.map(c => c.sourceId),
                ...facility.details.flatMap(d => d.sourceIds),
                ...(facility.facebook ? [facility.facebook.sourceId] : []),
              ]),
            ];
            const mapUrl =
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
                <a
                  className="inline-flex gap-2 items-center text-primary-600 underline text-sm mt-3 mb-5"
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in Maps
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                </a>
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
                      <dd className="text-sm text-gray-700">{detail.value}</dd>
                    </div>
                  ))}
                </dl>
                {!facility.contacts.length ? (
                  <p className="mt-4 text-sm text-gray-700">
                    For police assistance,{' '}
                    <a className="text-primary-600 underline" href="tel:911">
                      call 911
                    </a>{' '}
                    or{' '}
                    <Link
                      className="text-primary-600 underline"
                      to={routes.police + '?q=Provincial'}
                    >
                      contact the provincial police office
                    </Link>
                    .
                  </p>
                ) : null}
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
              </article>
            );
          })}
        </div>
        {rows.length === 0 ? (
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
              Contacts checked against their cited publications on {date}.
              Hospital classification and capacity follow PhilHealth’s 30
              September 2026 list. Office-published Facebook contacts and
              undated station directory contacts are identified separately.
              Phone numbers have not been call-tested. Map links search for the
              published facility name and address.
            </p>
            <p>
              <a
                className="text-primary-600 underline"
                href="/data/facilities.json"
                download
              >
                Download hospital and police records (JSON)
              </a>{' '}
              ·{' '}
              <a
                className="text-primary-600 underline"
                href="/data/facilities.csv"
                download
              >
                Download contacts (CSV)
              </a>{' '}
              ·{' '}
              <a
                className="text-primary-600 underline"
                href="/data/facility-sources.json"
                download
              >
                Download source records (JSON)
              </a>
            </p>
            {kind === 'hospitals' ? (
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
            <p>
              <a
                className="text-primary-600 underline"
                href={sourceById.get(directory.metadata.emergencySourceId)?.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Philippine News Agency: SAFE NIR Dial 911
              </a>
            </p>
          </div>
        </details>
      </Section>
    </>
  );
}
