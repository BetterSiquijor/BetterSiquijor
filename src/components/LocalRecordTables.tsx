import { useSearchParams, Link } from 'react-router';
import officials from '../../data/records/officials.json';
import offices from '../../data/records/offices.json';
import finances from '../../data/records/financial-records.json';

export const localDatasets = [
  { id: 'barangays', label: 'Barangays', count: 134 },
  { id: 'officials', label: 'Officials', count: officials.officials.length },
  { id: 'offices', label: 'Offices', count: offices.offices.length },
  {
    id: 'finances',
    label: 'Financial records',
    count: finances.records.length,
  },
];
export function DatasetNavigation() {
  const [params] = useSearchParams();
  const selected = params.get('dataset') || 'barangays';
  return (
    <nav aria-label="Local dataset" className="flex flex-wrap gap-3 mb-7">
      {localDatasets.map(d => (
        <Link
          key={d.id}
          to={'/data' + (d.id === 'barangays' ? '' : '?dataset=' + d.id)}
          aria-current={selected === d.id ? 'page' : undefined}
          className={`border rounded-md px-4 py-2 text-sm font-medium ${selected === d.id ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-primary-700 hover:bg-primary-50'}`}
        >
          {d.label} ({d.count})
        </Link>
      ))}
    </nav>
  );
}

const td = 'p-4 align-top';
function FilterInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="max-w-lg mb-6">
      <label htmlFor="record-query" className="block font-medium text-sm mb-2">
        Search these records
      </label>
      <input
        id="record-query"
        type="search"
        value={value}
        maxLength={120}
        onChange={e => onChange(e.target.value)}
        className="border border-gray-300 w-full rounded-md px-3 py-3 text-sm"
        placeholder="Search a name, office, or record…"
      />
    </div>
  );
}

export default function LocalRecordTables({ dataset }: { dataset: string }) {
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') || '').slice(0, 120);
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = (value: string) =>
    words.every(w => value.toLowerCase().includes(w));
  function setQuery(value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set('q', value);
    else next.delete('q');
    setParams(next, { replace: true });
  }
  if (dataset === 'officials') {
    const rows = officials.officials.filter(o =>
      matches(
        [o.name, o.role, o.municipality, o.officeEmail]
          .filter(Boolean)
          .join(' ')
      )
    );
    return (
      <>
        <h2 className="text-2xl font-bold mb-4">
          Provincial and municipal officials
        </h2>
        <p className="text-gray-700 mb-5">
          DILG directory for the 2025–2028 term, snapshot February 2026; House
          representative from DBM’s 2026 directory.
        </p>
        <FilterInput value={q} onChange={setQuery} />
        <p role="status" className="text-sm mb-4">
          {rows.length} of {officials.officials.length} officials
        </p>
        <div className="overflow-x-auto border border-gray-300 rounded-lg">
          <table className="w-full text-sm text-left">
            <caption className="sr-only">Government officials</caption>
            <thead className="bg-primary-50">
              <tr>
                {[
                  'Name',
                  'Office',
                  'Municipality / scope',
                  'Office email',
                  'Directory date',
                ].map(h => (
                  <th key={h} className={td} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((o, i) => (
                <tr
                  key={o.role + o.name + i}
                  className="border-t border-gray-200"
                >
                  <th scope="row" className={td + ' font-medium'}>
                    {o.name}
                  </th>
                  <td className={td}>{o.role}</td>
                  <td className={td}>
                    {o.municipality || 'Province of Siquijor'}
                  </td>
                  <td className={td + ' break-all'}>
                    {o.officeEmail ? (
                      <a
                        className="text-primary-600 underline"
                        href={'mailto:' + o.officeEmail}
                      >
                        {o.officeEmail}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className={td + ' whitespace-nowrap'}>{o.sourceAsOf}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-5 mt-6 text-primary-600">
          <a href="/data/officials.json" download className="underline">
            Download officials JSON
          </a>
          <Link
            to="/government/departments/provincial-officials"
            className="underline"
          >
            Officials and source notes
          </Link>
        </div>
      </>
    );
  }
  if (dataset === 'offices') {
    const rows = offices.offices.filter(o =>
      matches(
        [o.office, o.scope, o.address, o.email, ...o.phones]
          .filter(Boolean)
          .join(' ')
      )
    );
    return (
      <>
        <h2 className="text-2xl font-bold mb-4">Office contact directory</h2>
        <FilterInput value={q} onChange={setQuery} />
        <p role="status" className="text-sm mb-4">
          {rows.length} of {offices.offices.length} offices
        </p>
        <div className="overflow-x-auto border border-gray-300 rounded-lg">
          <table className="w-full text-sm text-left">
            <caption className="sr-only">Siquijor office contacts</caption>
            <thead className="bg-primary-50">
              <tr>
                {['Office', 'Address', 'Telephone', 'Email'].map(h => (
                  <th key={h} className={td} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(o => (
                <tr key={o.id} className="border-t border-gray-200">
                  <th scope="row" className={td + ' font-medium min-w-48'}>
                    {o.office}
                  </th>
                  <td className={td}>{o.address || '—'}</td>
                  <td className={td + ' whitespace-nowrap'}>
                    {o.phones.length ? o.phones.join('; ') : '—'}
                  </td>
                  <td className={td + ' break-all'}>
                    {o.email ? (
                      <a
                        className="text-primary-600 underline"
                        href={'mailto:' + o.email}
                      >
                        {o.email}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-5 mt-6 text-primary-600">
          <a href="/data/offices.json" download className="underline">
            Download office JSON
          </a>
          <Link
            to="/government/departments/office-directory"
            className="underline"
          >
            Office details and source dates
          </Link>
        </div>
      </>
    );
  }
  const statement = finances.records.find(
    r => r.recordType === 'statement-of-receipts-and-expenditures'
  );
  const metrics = (statement?.metrics || []).filter(m =>
    matches(m.label + ' ' + m.section)
  );
  const notices = finances.records.filter(
    r => r.recordType === 'procurement-notice'
  );
  return (
    <>
      <h2 className="text-2xl font-bold mb-4">Provincial finances</h2>
      <p className="mb-6">
        <Link
          className="text-primary-600 underline"
          to="/government/transparency/receipts-2025"
        >
          Explore 2025 cash and receipt categories →
        </Link>
      </p>
      <h3 className="text-xl font-semibold mb-4">
        Complete statement, FY 2024
      </h3>
      <p className="text-gray-700 mb-5">
        Reported receipts, expenditures and cash balances for the Provincial
        Government of Siquijor. Amounts are in{' '}
        <strong>million Philippine pesos</strong>, Financial year: 2024. Source:
        DBM BESF 2026, Table F.10.
      </p>
      <FilterInput value={q} onChange={setQuery} />
      <p role="status" className="text-sm mb-4">
        {metrics.length} of 50 financial measures
      </p>
      <div className="overflow-x-auto border border-gray-300 rounded-lg">
        <table className="w-full text-sm text-left">
          <caption className="sr-only">
            FY 2024 provincial receipts and expenditures in million Philippine
            pesos
          </caption>
          <thead className="bg-primary-50">
            <tr>
              <th scope="col" className={td}>
                Measure
              </th>
              <th scope="col" className={td}>
                Section
              </th>
              <th scope="col" className={td + ' text-right'}>
                PHP million
              </th>
            </tr>
          </thead>
          <tbody>
            {metrics.map(m => (
              <tr key={m.key} className="border-t border-gray-200">
                <th scope="row" className={td + ' font-medium'}>
                  {m.label}
                </th>
                <td className={td}>{m.section}</td>
                <td className={td + ' text-right font-mono'}>
                  {m.sourceValue}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 className="text-xl font-semibold my-6">
        Provincial procurement notices
      </h3>
      <p className="text-gray-700 text-sm mb-4">
        ABC is the approved budget ceiling for a notice, not a paid or awarded
        contract amount. All deadlines below have passed.
      </p>
      <div className="overflow-x-auto border border-gray-300 rounded-lg">
        <table className="w-full text-sm text-left">
          <caption className="sr-only">
            Published provincial procurement notices
          </caption>
          <thead className="bg-primary-50">
            <tr>
              {[
                'Reference',
                'Notice',
                'Published',
                'Closing date',
                'ABC (PHP)',
              ].map(h => (
                <th scope="col" key={h} className={td}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {notices.map(r => (
              <tr key={r.id} className="border-t border-gray-200">
                <th scope="row" className={td + ' font-medium'}>
                  {r.referenceNumber}
                </th>
                <td className={td}>{r.title}</td>
                <td className={td + ' whitespace-nowrap'}>{r.published}</td>
                <td className={td + ' whitespace-nowrap'}>{r.closingDate}</td>
                <td className={td + ' text-right whitespace-nowrap'}>
                  {r.abcPesos?.toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-5 mt-6 text-primary-600">
        <a href="/data/financial-records.json" download className="underline">
          Download financial records JSON
        </a>
        <a
          href="/documents/siquijor-finance-sre-2024-dbm-besf2026-f10.pdf"
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Download the financial statement (PDF)
        </a>
        <Link to="/government/transparency/procurement" className="underline">
          Full procurement details
        </Link>
      </div>
    </>
  );
}
