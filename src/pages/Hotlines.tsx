import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  Phone,
  Copy,
  Check,
  Printer,
  AlertTriangle,
  Download,
  Mail,
} from 'lucide-react';
import hotlinesData from '../../data/derived/hotlines.json';
import facilitiesData from '../../data/records/facilities.json';
import SEO from '../components/SEO';
import Section from '../components/ui/Section';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { Heading } from '../components/ui/Heading';
import ReportIssueLink from '../components/ui/ReportIssueLink';

const municipalities = hotlinesData.municipalDirectories.map(
  m => m.municipality
);

type ServiceCategory =
  | 'all'
  | 'drrmo'
  | 'fire'
  | 'police'
  | 'coast-guard'
  | 'health'
  | 'utilities-roads';

const CATEGORY_OPTIONS: { id: ServiceCategory; label: string }[] = [
  { id: 'all', label: 'All services' },
  { id: 'drrmo', label: 'DRRMO / Rescue' },
  { id: 'fire', label: 'Fire (BFP)' },
  { id: 'police', label: 'Police (PNP)' },
  { id: 'coast-guard', label: 'Coast Guard' },
  { id: 'health', label: 'Health / Hospitals / RHU' },
  { id: 'utilities-roads', label: 'Electricity / Roads' },
];

function classifyOffice(officeName: string): ServiceCategory {
  const n = officeName.toLowerCase();
  if (n.includes('drrmo') || n.includes('disaster') || n.includes('rescue'))
    return 'drrmo';
  if (n.includes('fire') || n.includes('bfp')) return 'fire';
  if (n.includes('police') || n.includes('pnp')) return 'police';
  if (n.includes('coast guard') || n.includes('pcg')) return 'coast-guard';
  if (
    n.includes('hospital') ||
    n.includes('health') ||
    n.includes('rhu') ||
    n.includes('medicare')
  )
    return 'health';
  return 'utilities-roads';
}

function cleanTel(phone: string) {
  return phone.replace(/[^+\d]/g, '');
}

function PhoneActionButton({ number }: { number: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API may be unavailable on non-HTTPS or restricted contexts.
    }
  }

  return (
    <div className="inline-flex items-stretch rounded-md border border-primary-300 bg-primary-50 overflow-hidden">
      <a
        href={`tel:${cleanTel(number)}`}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-primary-900 hover:bg-primary-100"
      >
        <Phone
          className="w-4 h-4 shrink-0 text-primary-700"
          aria-hidden="true"
        />
        {number}
      </a>
      <button
        type="button"
        onClick={handleCopy}
        title={`Copy ${number}`}
        aria-label={`Copy ${number}`}
        className="no-print px-2.5 border-l border-primary-200 text-primary-700 hover:bg-primary-100 flex items-center"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-success-700" aria-hidden="true" />
        ) : (
          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

const policeByMunicipality = new Map(
  facilitiesData.facilities
    .filter(f => f.kind === 'police-station')
    .map(f => [f.municipality, f])
);

export default function Hotlines() {
  const [params, setParams] = useSearchParams();
  const municipality = params.get('municipality') || '';
  const category = (params.get('category') || 'all') as ServiceCategory;
  const query = (params.get('q') || '').slice(0, 120);
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value && value !== 'all') next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  const visibleMunicipalities = hotlinesData.municipalDirectories.filter(
    m => !municipality || m.municipality === municipality
  );

  const provincialCombined = [
    ...hotlinesData.provincialDirectory.map(item => ({
      ...item,
      sourceLabel: 'PDRRMO Emergency Hotline Directory (undated)',
      id: `prov-dir-${item.office.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    })),
    ...hotlinesData.provincialAssistanceContacts.map(item => ({
      ...item,
      sourceLabel: 'Provincial Emergency Assistance List (undated)',
      id: `prov-asst-${item.office.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    })),
  ].filter(item => {
    if (category !== 'all' && classifyOffice(item.office) !== category)
      return false;
    if (!words.length) return true;
    const hay = [item.office, ...item.contactNumbers].join(' ').toLowerCase();
    return words.every(w => hay.includes(w));
  });

  const filteredMunicipalGroups = visibleMunicipalities
    .map(group => {
      const stationFacility = policeByMunicipality.get(group.municipality);
      const entries = group.entries.filter(entry => {
        if (category !== 'all' && classifyOffice(entry.office) !== category)
          return false;
        if (!words.length) return true;
        const hay = [
          group.municipality,
          entry.office,
          ...entry.contactNumbers,
          ...(stationFacility?.contacts.map(c => c.value) || []),
        ]
          .join(' ')
          .toLowerCase();
        return words.every(w => hay.includes(w));
      });
      return { ...group, entries, stationFacility };
    })
    .filter(g => g.entries.length > 0);

  return (
    <>
      <SEO
        title="Emergency hotlines in Siquijor"
        description="Tap-to-call emergency hotlines for Siquijor Province and all six municipalities: 911, PDRRMO, MDRRMO, fire stations, police, Coast Guard, hospitals, RHUs, and utilities."
      />
      <Section>
        <div className="no-print">
          <Breadcrumbs className="mb-8" />
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <Heading>Emergency hotlines in Siquijor</Heading>
            <p className="text-gray-700 mt-2 max-w-2xl">
              Choose your municipality for tap-to-call disaster, fire, police,
              Coast Guard, health, and utility response numbers, or print a
              compact card for your home or barangay hall.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="no-print inline-flex items-center gap-2 rounded-md border border-primary-600 bg-white px-4 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-50"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            Print emergency card
          </button>
        </div>

        {/* Immediate 911 banner */}
        <div className="print-card border-l-4 border-error-600 bg-error-50 rounded-r-lg p-5 mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-bold text-lg text-error-900">
              Immediate life-threatening emergency? Call 911
            </p>
            <p className="text-sm text-error-900 mt-1">
              Tell the operator your exact municipality, barangay, landmark, and
              what happened. Call directly rather than waiting for an email or
              Facebook reply.
            </p>
          </div>
          <a
            href="tel:911"
            className="inline-flex items-center gap-2 rounded-md bg-error-600 px-5 py-3 text-base font-bold text-white hover:bg-error-700 shrink-0"
          >
            <Phone className="w-5 h-5" aria-hidden="true" />
            Call 911
          </a>
        </div>

        {/* Interactive filter bar */}
        <div className="no-print grid gap-4 md:grid-cols-3 mb-5">
          <div>
            <label
              htmlFor="hotline-municipality"
              className="block text-sm font-medium mb-2"
            >
              Municipality
            </label>
            <select
              id="hotline-municipality"
              value={municipality}
              onChange={e => update('municipality', e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-sm"
            >
              <option value="">All six municipalities + Provincial</option>
              {municipalities.map(town => (
                <option key={town} value={town}>
                  {town}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="hotline-category"
              className="block text-sm font-medium mb-2"
            >
              Service type
            </label>
            <select
              id="hotline-category"
              value={category}
              onChange={e => update('category', e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-sm"
            >
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="hotline-search"
              className="block text-sm font-medium mb-2"
            >
              Search office or number
            </label>
            <input
              id="hotline-search"
              type="search"
              value={query}
              maxLength={120}
              onChange={e => update('q', e.target.value)}
              placeholder="e.g. fire, PROSIELCO, 0953"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-sm"
            />
          </div>
        </div>

        {/* Quick municipality pills */}
        <div className="no-print flex flex-wrap items-center gap-2 mb-8">
          <button
            type="button"
            onClick={() => update('municipality', '')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium border ${
              !municipality
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-primary-700 border-gray-300 hover:bg-primary-50'
            }`}
          >
            All towns
          </button>
          {municipalities.map(town => (
            <button
              key={town}
              type="button"
              onClick={() => update('municipality', town)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium border ${
                municipality === town
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-primary-700 border-gray-300 hover:bg-primary-50'
              }`}
            >
              {town}
            </button>
          ))}
        </div>

        {/* Municipal hotlines */}
        <section aria-label="Municipal emergency hotlines" className="mb-10">
          <Heading level={2} className="mb-4">
            {municipality
              ? `${municipality} emergency hotlines`
              : 'Municipal emergency hotlines'}
          </Heading>
          {filteredMunicipalGroups.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {filteredMunicipalGroups.map(group => (
                <article
                  key={group.municipality}
                  className="print-card rounded-lg border border-gray-300 border-t-4 border-t-primary-600 bg-white p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <h3 className="text-lg font-bold text-gray-900">
                        {group.municipality}
                      </h3>
                      <Link
                        to={`/government/municipalities/${group.municipality.toLowerCase().replace(/\s+/g, '-')}`}
                        className="no-print text-xs text-primary-700 underline"
                      >
                        Municipality profile
                      </Link>
                    </div>
                    {group.note ? (
                      <div className="mb-4 rounded-md border border-warning-400 bg-warning-50 p-3 text-xs text-warning-900 flex items-start gap-2">
                        <AlertTriangle
                          className="w-4 h-4 shrink-0 mt-0.5 text-warning-700"
                          aria-hidden="true"
                        />
                        <span>{group.note}</span>
                      </div>
                    ) : null}
                    <dl className="space-y-4">
                      {group.entries.map(entry => {
                        const isPolice =
                          classifyOffice(entry.office) === 'police';
                        const stationPhones =
                          isPolice && group.stationFacility
                            ? group.stationFacility.contacts.filter(
                                c => c.kind === 'phone'
                              )
                            : [];
                        return (
                          <div
                            key={entry.office}
                            className="border-t border-gray-100 pt-3 first:border-t-0 first:pt-0"
                          >
                            <dt className="text-sm font-semibold text-gray-900 mb-2">
                              {entry.office}
                            </dt>
                            <dd className="flex flex-wrap gap-2">
                              {stationPhones.map(c => (
                                <div
                                  key={`station-${c.value}`}
                                  className="flex flex-col gap-0.5"
                                >
                                  <PhoneActionButton number={c.value} />
                                  <span className="text-[11px] text-gray-600 pl-1">
                                    Station page / directory
                                  </span>
                                </div>
                              ))}
                              {entry.contactNumbers.map(num => (
                                <div
                                  key={num}
                                  className="flex flex-col gap-0.5"
                                >
                                  <PhoneActionButton number={num} />
                                  {stationPhones.length > 0 ? (
                                    <span className="text-[11px] text-gray-600 pl-1">
                                      Supplied PDRRMO list
                                    </span>
                                  ) : null}
                                </div>
                              ))}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </div>
                  <div className="no-print mt-5 pt-3 border-t border-gray-200">
                    <ReportIssueLink
                      recordType="Municipal emergency hotlines"
                      recordId={`hotlines-${group.municipality.toLowerCase().replace(/\s+/g, '-')}`}
                      recordName={`${group.municipality} Emergency Hotlines`}
                      pagePath="/hotlines"
                    />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="bg-gray-50 rounded-lg p-6 text-sm text-gray-700">
              No municipal hotline entries match your current filter.
            </p>
          )}
        </section>

        {/* Provincial hotlines */}
        <section aria-label="Provincial response offices" className="mb-10">
          <Heading level={2} className="mb-3">
            Provincial response offices
          </Heading>
          <p className="text-sm text-gray-700 mb-5">
            PDRRMO office: {hotlinesData.pdrrmoDirectoryHeader.address}. Emails:{' '}
            {hotlinesData.pdrrmoDirectoryHeader.emails.map((email, idx) => (
              <span key={email}>
                {idx > 0 ? ' · ' : ''}
                <a
                  href={`mailto:${email}`}
                  className="text-primary-700 underline inline-flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                  {email}
                </a>
              </span>
            ))}
          </p>
          {provincialCombined.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {provincialCombined.map(item => (
                <article
                  key={item.id}
                  className="print-card rounded-lg border border-gray-300 bg-white p-4"
                >
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {item.office}
                  </h3>
                  <p className="text-xs text-gray-600 mb-3">
                    {item.sourceLabel}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.contactNumbers.map(num => (
                      <PhoneActionButton key={num} number={num} />
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="bg-gray-50 rounded-lg p-6 text-sm text-gray-700">
              No provincial hotline entries match your current filter.
            </p>
          )}
        </section>

        {/* Quick related links */}
        <div className="no-print flex flex-wrap gap-4 border-t border-gray-200 pt-6 mb-8 text-sm">
          <Link
            to="/services/health/hospitals"
            className="text-primary-700 underline font-medium"
          >
            Hospitals &amp; RHUs directory →
          </Link>
          <Link
            to="/services/public-safety/police-stations"
            className="text-primary-700 underline font-medium"
          >
            Police &amp; Fire stations directory →
          </Link>
          <Link
            to="/services/citizen-services/utilities"
            className="text-primary-700 underline font-medium"
          >
            PROSIELCO &amp; Water utilities →
          </Link>
          <Link
            to="/waterways"
            className="text-primary-700 underline font-medium"
          >
            Waterways &amp; drainage map (OSM) →
          </Link>
          <Link
            to="/services/public-safety/emergency-response"
            className="text-primary-700 underline font-medium"
          >
            Full emergency response guide →
          </Link>
        </div>

        {/* Source notes & discrepancies */}
        <details className="no-print border-t border-gray-300 pt-6">
          <summary className="cursor-pointer font-medium text-primary-700">
            Sources, preserved discrepancies, and data downloads
          </summary>
          <div className="mt-4 space-y-4 text-sm text-gray-700">
            <p>{hotlinesData.metadata.attribution}</p>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Preserved source discrepancies
              </h3>
              <ul className="list-disc pl-5 space-y-1.5">
                {hotlinesData.metadata.discrepancies.map(d => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-5 pt-2">
              <a
                href="/data/emergency-hotlines.json"
                download
                className="inline-flex items-center gap-1.5 text-primary-700 underline font-medium"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                Download hotlines (JSON)
              </a>
              <a
                href="/data/emergency-hotlines.csv"
                download
                className="inline-flex items-center gap-1.5 text-primary-700 underline font-medium"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                Download hotlines (CSV)
              </a>
            </div>
          </div>
        </details>
      </Section>
    </>
  );
}
