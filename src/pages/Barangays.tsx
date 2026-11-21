import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  MapPin,
  Users,
  GraduationCap,
  Phone,
  Building2,
  ShieldCheck,
  Search as SearchIcon,
} from 'lucide-react';
import census from '../../data/records/census.json';
import schoolData from '../../data/derived/schools.json';
import officesData from '../../data/records/offices.json';
import facilitiesData from '../../data/records/facilities.json';
import hotlinesData from '../../data/derived/hotlines.json';
import SEO from '../components/SEO';
import Section from '../components/ui/Section';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { Heading } from '../components/ui/Heading';

const fmt = (n: number) => n.toLocaleString('en-PH');

const allBarangays = census.municipalities.flatMap(m =>
  m.barangays.map(b => ({
    ...b,
    municipality: m.name,
    municipalitySlug: m.slug,
    municipalityPopulation: m.population,
    municipalityBarangayCount: m.barangayCount,
  }))
);

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export default function Barangays() {
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') || '').slice(0, 120);
  const municipality = params.get('municipality') || '';
  const selectedPsgc = params.get('barangay') || '';

  const words = q.toLowerCase().trim().split(/\s+/).filter(Boolean);

  const filtered = useMemo(
    () =>
      allBarangays.filter(
        b =>
          (!municipality || b.municipality === municipality) &&
          words.every(w =>
            `${b.name} ${b.municipality} ${b.psgc} ${b.classification}`
              .toLowerCase()
              .includes(w)
          )
      ),
    [municipality, q]
  );

  const selected =
    allBarangays.find(b => b.psgc === selectedPsgc) || filtered[0] || null;

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  // Gather related local records for the selected barangay's municipality & barangay
  const relatedSchools = useMemo(() => {
    if (!selected) return { exact: [], townCount: 0 };
    const normBrgy = normalizeName(selected.name);
    const inTown = schoolData.schools.filter(
      s => s.municipality === selected.municipality
    );
    const exact = inTown.filter(s => {
      if (!s.barangay) return false;
      const nb = normalizeName(s.barangay);
      return nb === normBrgy || nb.includes(normBrgy) || normBrgy.includes(nb);
    });
    return { exact, townCount: inTown.length };
  }, [selected]);

  const townOffices = useMemo(() => {
    if (!selected) return [];
    const target = selected.municipality.toLowerCase();
    return officesData.offices.filter(o => {
      const scope = (o.scope || '').toLowerCase();
      const name = (o.office || '').toLowerCase();
      return (
        scope === `municipality of ${target}` ||
        name.includes(`municipality of ${target}`) ||
        (scope.includes(target) && !scope.includes('province'))
      );
    });
  }, [selected]);

  const townHotlines = useMemo(() => {
    if (!selected) return null;
    return (
      hotlinesData.municipalDirectories.find(
        m => m.municipality === selected.municipality
      ) || null
    );
  }, [selected]);

  const townPolice = useMemo(() => {
    if (!selected) return null;
    return (
      facilitiesData.facilities.find(
        f =>
          f.kind === 'police-station' &&
          f.municipality === selected.municipality
      ) || null
    );
  }, [selected]);

  return (
    <>
      <SEO
        title="Barangay lookup hub (134 barangays)"
        description="Search any of Siquijor’s 134 barangays to see 2024 census population, local schools, municipal hall contacts, and emergency hotlines in one place."
      />
      <Section>
        <Breadcrumbs className="mb-8" />
        <Heading>Barangay lookup hub</Heading>
        <p className="text-gray-700 mb-6 max-w-3xl">
          Search any of Siquijor’s <strong>134 barangays</strong> across all six
          municipalities to view its 2024 census population, nearby schools,
          municipal hall contacts, and local emergency hotlines in one place.
        </p>

        {/* Search and municipality filter */}
        <div className="grid gap-4 md:grid-cols-2 max-w-3xl mb-6">
          <div>
            <label
              htmlFor="brgy-hub-search"
              className="block text-sm font-medium mb-2"
            >
              Find your barangay
            </label>
            <div className="relative">
              <SearchIcon
                className="w-4 h-4 absolute left-3 top-3.5 text-gray-500"
                aria-hidden="true"
              />
              <input
                id="brgy-hub-search"
                type="search"
                value={q}
                maxLength={120}
                onChange={e => update('q', e.target.value)}
                placeholder="e.g. Poblacion, Caipilan, San Antonio, Solangon"
                className="w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 py-3 text-sm"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="brgy-hub-town"
              className="block text-sm font-medium mb-2"
            >
              Municipality
            </label>
            <select
              id="brgy-hub-town"
              value={municipality}
              onChange={e => {
                const next = new URLSearchParams(params);
                if (e.target.value) next.set('municipality', e.target.value);
                else next.delete('municipality');
                next.delete('barangay');
                setParams(next, { replace: true });
              }}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-sm"
            >
              <option value="">All six municipalities (134 barangays)</option>
              {census.municipalities.map(m => (
                <option key={m.psgc} value={m.name}>
                  {m.name} ({m.barangayCount} barangays)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr] items-start">
          {/* Left: scrollable barangay list */}
          <div className="rounded-lg border border-gray-300 bg-white overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-800" role="status">
                {filtered.length} of {allBarangays.length} barangays
              </p>
              {q || municipality ? (
                <button
                  type="button"
                  onClick={() => setParams({}, { replace: true })}
                  className="text-xs text-primary-700 underline"
                >
                  Clear
                </button>
              ) : null}
            </div>
            <ul className="divide-y divide-gray-200 max-h-[540px] overflow-y-auto">
              {filtered.map(b => {
                const active = selected?.psgc === b.psgc;
                return (
                  <li key={b.psgc}>
                    <button
                      type="button"
                      onClick={() => update('barangay', b.psgc)}
                      aria-current={active ? 'true' : undefined}
                      className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors ${
                        active
                          ? 'bg-primary-50 border-l-4 border-l-primary-600'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-sm text-gray-900 block">
                          {b.name}
                        </span>
                        <span className="text-xs text-gray-600">
                          {b.municipality} · {b.classification}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-gray-700 shrink-0">
                        {fmt(b.population)}
                      </span>
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 ? (
                <li className="p-6 text-sm text-gray-600 text-center">
                  No barangays match your search.
                </li>
              ) : null}
            </ul>
          </div>

          {/* Right: unified barangay profile */}
          {selected ? (
            <article className="rounded-lg border border-gray-300 border-t-4 border-t-primary-600 bg-white p-6 space-y-6">
              <div>
                <p className="text-xs font-medium text-primary-700 uppercase tracking-wide">
                  Municipality of {selected.municipality} ·{' '}
                  {selected.classification} barangay
                </p>
                <h2 className="text-2xl font-bold text-gray-900 mt-1">
                  Barangay {selected.name}
                </h2>
                <p className="text-xs font-mono text-gray-600 mt-1">
                  PSGC: {selected.psgc}
                </p>
              </div>

              {/* Population card */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-md bg-primary-50 border border-primary-200 p-4">
                  <p className="text-xs font-medium text-primary-800 flex items-center gap-1.5">
                    <Users className="w-4 h-4" aria-hidden="true" />
                    2024 Census Population
                  </p>
                  <p className="text-2xl font-bold text-primary-900 mt-1">
                    {fmt(selected.population)}
                  </p>
                  <p className="text-xs text-primary-800 mt-1">
                    {(
                      (selected.population / selected.municipalityPopulation) *
                      100
                    ).toFixed(1)}
                    % of {selected.municipality} (
                    {fmt(selected.municipalityPopulation)})
                  </p>
                </div>
                <div className="rounded-md bg-gray-50 border border-gray-200 p-4">
                  <p className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                    <MapPin
                      className="w-4 h-4 text-primary-600"
                      aria-hidden="true"
                    />
                    Municipality Profile
                  </p>
                  <p className="text-base font-semibold text-gray-900 mt-1">
                    {selected.municipality} (
                    {selected.municipalityBarangayCount} barangays)
                  </p>
                  <Link
                    to={`/government/municipalities/${selected.municipalitySlug}`}
                    className="text-xs text-primary-700 underline inline-block mt-1"
                  >
                    View full municipality page →
                  </Link>
                </div>
              </div>

              {/* Schools in this barangay */}
              <section className="border-t border-gray-200 pt-5">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <GraduationCap
                    className="w-5 h-5 text-primary-600"
                    aria-hidden="true"
                  />
                  Schools in {selected.name}
                </h3>
                {relatedSchools.exact.length > 0 ? (
                  <ul className="space-y-2 mb-3">
                    {relatedSchools.exact.map(s => (
                      <li
                        key={s.id}
                        className="rounded-md border border-gray-200 p-3 flex flex-wrap items-center justify-between gap-2 text-sm"
                      >
                        <div>
                          <span className="font-medium text-gray-900 block">
                            {s.name}
                          </span>
                          <span className="text-xs text-gray-600">
                            {s.sector} · {s.levels.join(' / ')}
                            {s.schoolId ? ` · DepEd ID ${s.schoolId}` : ''}
                          </span>
                        </div>
                        <Link
                          to={`/services/education/find-school?municipality=${encodeURIComponent(selected.municipality)}&q=${encodeURIComponent(s.name)}`}
                          className="text-xs text-primary-700 underline font-medium"
                        >
                          Details &amp; map
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600 mb-3">
                    No DepEd school in the directory lists Barangay{' '}
                    {selected.name} directly. Check nearby schools in{' '}
                    {selected.municipality}.
                  </p>
                )}
                <Link
                  to={`/services/education/find-school?municipality=${encodeURIComponent(selected.municipality)}`}
                  className="text-sm text-primary-700 underline font-medium"
                >
                  Browse all {relatedSchools.townCount} schools in{' '}
                  {selected.municipality} →
                </Link>
              </section>

              {/* Municipal Hall / Office Contacts */}
              <section className="border-t border-gray-200 pt-5">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <Building2
                    className="w-5 h-5 text-primary-600"
                    aria-hidden="true"
                  />
                  Municipal office contacts ({selected.municipality})
                </h3>
                {townOffices.length > 0 ? (
                  <ul className="space-y-2.5 text-sm">
                    {townOffices.map(o => (
                      <li
                        key={o.id}
                        className="rounded-md bg-gray-50 p-3 border border-gray-200"
                      >
                        <p className="font-medium text-gray-900">{o.office}</p>
                        {o.address ? (
                          <p className="text-xs text-gray-600 mt-0.5">
                            {o.address}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs">
                          {o.phones.map(p => (
                            <a
                              key={p}
                              href={`tel:${p.replace(/[^+\d]/g, '')}`}
                              className="text-primary-700 underline font-medium"
                            >
                              {p}
                            </a>
                          ))}
                          {o.email ? (
                            <a
                              href={`mailto:${o.email}`}
                              className="text-primary-700 underline break-all"
                            >
                              {o.email}
                            </a>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">
                    See the{' '}
                    <Link
                      to="/government/departments/office-directory"
                      className="text-primary-700 underline"
                    >
                      provincial and municipal office directory
                    </Link>
                    .
                  </p>
                )}
              </section>

              {/* Emergency Hotlines for this municipality */}
              <section className="border-t border-gray-200 pt-5">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <ShieldCheck
                    className="w-5 h-5 text-primary-600"
                    aria-hidden="true"
                  />
                  Emergency hotlines ({selected.municipality})
                </h3>
                {townHotlines ? (
                  <div className="space-y-2 text-sm">
                    {townHotlines.note ? (
                      <p className="text-xs text-warning-900 bg-warning-50 border border-warning-300 rounded p-2.5">
                        {townHotlines.note}
                      </p>
                    ) : null}
                    <dl className="grid gap-2 sm:grid-cols-2">
                      {townHotlines.entries.map(e => (
                        <div
                          key={e.office}
                          className="rounded-md border border-gray-200 p-2.5"
                        >
                          <dt className="text-xs font-semibold text-gray-800">
                            {e.office}
                          </dt>
                          <dd className="flex flex-wrap gap-2 mt-1">
                            {e.contactNumbers.map(num => (
                              <a
                                key={num}
                                href={`tel:${num.replace(/[^+\d]/g, '')}`}
                                className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 underline"
                              >
                                <Phone className="w-3 h-3" aria-hidden="true" />
                                {num}
                              </a>
                            ))}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    {townPolice ? (
                      <p className="text-xs text-gray-600 pt-1">
                        Municipal police station:{' '}
                        <Link
                          to={`/services/public-safety/police-stations?municipality=${encodeURIComponent(selected.municipality)}`}
                          className="text-primary-700 underline"
                        >
                          {townPolice.name} ({townPolice.address})
                        </Link>
                      </p>
                    ) : null}
                    <div className="pt-2">
                      <Link
                        to={`/hotlines?municipality=${encodeURIComponent(selected.municipality)}`}
                        className="text-sm text-primary-700 underline font-medium"
                      >
                        Open printable {selected.municipality} emergency card →
                      </Link>
                    </div>
                  </div>
                ) : null}
              </section>
            </article>
          ) : null}
        </div>
      </Section>
    </>
  );
}
