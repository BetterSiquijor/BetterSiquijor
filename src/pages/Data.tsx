import { useSearchParams, Link } from 'react-router';
import { Download, Search as SearchIcon } from 'lucide-react';
import census from '../../data/records/census.json';
import SEO from '../components/SEO';
import Section from '../components/ui/Section';
import LocalRecordTables, {
  DatasetNavigation,
} from '../components/LocalRecordTables';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { Heading } from '../components/ui/Heading';
import { CensusPopulationChart } from '../components/DataCharts';

const records = census.municipalities.flatMap(m =>
  m.barangays.map(b => ({
    ...b,
    municipality: m.name,
    municipalitySlug: m.slug,
  }))
);
const fmt = (n: number) => n.toLocaleString('en-PH');

export default function Data() {
  const [params, setParams] = useSearchParams();
  const requestedDataset = params.get('dataset') || 'barangays';
  const dataset = ['barangays', 'officials', 'offices', 'finances'].includes(
    requestedDataset
  )
    ? requestedDataset
    : 'barangays';
  const query = (params.get('q') || '').slice(0, 120);
  const municipality = params.get('municipality') || '';
  const classification = params.get('classification') || '';
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const rows = records.filter(
    r =>
      (!municipality || r.municipality === municipality) &&
      (!classification || r.classification === classification) &&
      words.every(w =>
        (r.name + ' ' + r.municipality + ' ' + r.psgc).toLowerCase().includes(w)
      )
  );
  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }
  return (
    <>
      <SEO
        title="Local records"
        description="Find Siquijor barangays, officials, office contacts, and provincial financial records."
      />
      <Section>
        <Breadcrumbs className="mb-8" />
        <Heading>Local records</Heading>
        <DatasetNavigation />
        {dataset !== 'barangays' ? (
          <LocalRecordTables dataset={dataset} />
        ) : (
          <>
            <p className="text-gray-700 mb-6">
              Find your barangay, compare municipality populations, or download
              the data for your own use.
            </p>
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-8">
              <h2 className="font-semibold text-primary-900 mb-2">
                Population and communities
              </h2>
              <p className="text-primary-900">
                6 municipalities · 134 barangays ·{' '}
                {fmt(census.province.population)} residents. Population: 2024
                POPCEN, reference date 1 July 2024. Geographic listing on the
                PSA pages: 31 July 2025.
              </p>
              <p className="text-sm text-primary-900 mt-3">
                Choose a municipality or search by barangay name to narrow the
                list, or open the{' '}
                <Link
                  to="/barangays"
                  className="font-semibold underline text-primary-900"
                >
                  Barangay Lookup Hub
                </Link>{' '}
                to see schools, municipal contacts, and hotlines for each
                barangay.
              </p>
            </div>
            <CensusPopulationChart
              activeMunicipality={municipality}
              onSelectMunicipality={m => update('municipality', m)}
            />
            <div className="flex flex-wrap gap-4 mb-8 text-primary-600 font-medium">
              <a
                className="inline-flex items-center gap-2 underline"
                href="/data/barangays.csv"
                download
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download 134 records (CSV)
              </a>
              <a
                className="inline-flex items-center gap-2 underline"
                href="/data/census.json"
                download
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download census data (JSON)
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div>
                <label
                  htmlFor="barangay-query"
                  className="block text-sm font-medium mb-2"
                >
                  Barangay, municipality, or PSGC
                </label>
                <div className="relative">
                  <SearchIcon
                    aria-hidden="true"
                    className="h-4 w-4 absolute left-3 top-3.5 text-gray-700"
                  />
                  <input
                    id="barangay-query"
                    type="search"
                    value={query}
                    maxLength={120}
                    onChange={e => update('q', e.target.value)}
                    placeholder="e.g. Poblacion"
                    className="border border-gray-300 rounded-md w-full pl-9 pr-3 py-3 text-sm"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="municipality-filter"
                  className="block text-sm font-medium mb-2"
                >
                  Municipality
                </label>
                <select
                  id="municipality-filter"
                  value={municipality}
                  onChange={e => update('municipality', e.target.value)}
                  className="border border-gray-300 rounded-md bg-white w-full px-3 py-3 text-sm"
                >
                  <option value="">All six municipalities</option>
                  {census.municipalities.map(m => (
                    <option key={m.psgc} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="classification-filter"
                  className="block text-sm font-medium mb-2"
                >
                  PSA classification
                </label>
                <select
                  id="classification-filter"
                  value={classification}
                  onChange={e => update('classification', e.target.value)}
                  className="border border-gray-300 rounded-md bg-white w-full px-3 py-3 text-sm"
                >
                  <option value="">Urban and rural</option>
                  <option>Urban</option>
                  <option>Rural</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap justify-between gap-3 items-center mb-4">
              <p className="text-sm text-gray-700" role="status">
                {rows.length} of {records.length} barangays ·{' '}
                {fmt(rows.reduce((n, r) => n + r.population, 0))} residents in
                the selected records
              </p>
              <button
                className="text-primary-600 underline text-sm"
                onClick={() => setParams({}, { replace: true })}
              >
                Clear filters
              </button>
            </div>
            <div className="overflow-x-auto border border-gray-300 rounded-lg">
              <table className="w-full text-sm text-left">
                <caption className="sr-only">
                  Barangay population, municipality, geographic code, and
                  classification
                </caption>
                <thead className="bg-primary-50 text-gray-900">
                  <tr>
                    <th scope="col" className="p-4">
                      Barangay
                    </th>
                    <th scope="col" className="p-4">
                      Municipality
                    </th>
                    <th scope="col" className="p-4">
                      PSGC
                    </th>
                    <th scope="col" className="p-4">
                      Classification
                    </th>
                    <th scope="col" className="p-4 text-right">
                      Population (2024)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr
                      key={r.psgc}
                      className="border-t border-gray-200 hover:bg-primary-50"
                    >
                      <th scope="row" className="p-4 font-medium">
                        {r.name}
                      </th>
                      <td className="p-4">
                        <Link
                          className="text-primary-600 hover:underline"
                          to={
                            '/government/municipalities/' + r.municipalitySlug
                          }
                        >
                          {r.municipality}
                        </Link>
                      </td>
                      <td className="p-4 whitespace-nowrap font-mono text-xs">
                        {r.psgc}
                      </td>
                      <td className="p-4">{r.classification}</td>
                      <td className="p-4 text-right">{fmt(r.population)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length === 0 ? (
              <p className="p-8 text-center text-gray-700">
                No records match these filters. Clear a filter or try another
                name.
              </p>
            ) : null}
            <div className="mt-10">
              <Heading level={2}>More about Siquijor</Heading>
              <ul className="space-y-3 text-primary-600">
                <li>
                  <Link to="/government/departments/provincial-officials">
                    Provincial and municipal officials →
                  </Link>
                </li>
                <li>
                  <Link to="/government/departments/office-directory">
                    Office contacts →
                  </Link>
                </li>
                <li>
                  <Link to="/government/transparency">
                    Financial disclosures and procurement records →
                  </Link>
                </li>
                <li>
                  <Link to="/services">
                    Service requirements and procedures →
                  </Link>
                </li>
              </ul>
            </div>
          </>
        )}
        {dataset === 'barangays' ? (
          <details className="mt-8 border-t border-gray-300 pt-6">
            <summary className="cursor-pointer font-medium text-primary-700">
              Sources and reference dates
            </summary>
            <p className="text-sm text-gray-700 my-4">
              Publisher: Philippine Statistics Authority. Retrieved 17 November
              2026. The tables retain PSA's published names, codes,
              classifications, and population figures. No missing population
              values were filled or estimated. Data licensed CC BY 4.0;
              reformatted as local tables, CSV, and JSON.
            </p>
            <ul className="space-y-2 text-sm">
              {census.municipalities.map(m => (
                <li key={m.psgc}>
                  <a
                    className="text-primary-600 underline"
                    href={m.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    PSA: {m.name}{' '}
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-sm mt-4">
              <a
                className="text-primary-600 underline"
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noopener noreferrer"
              >
                CC BY 4.0 license
              </a>
            </p>
          </details>
        ) : null}
      </Section>
    </>
  );
}
