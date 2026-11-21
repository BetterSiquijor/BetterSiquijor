import census from '../../data/records/census.json';
import finances from '../../data/records/financial-records.json';

const fmt = (n: number) => n.toLocaleString('en-PH');

/**
 * Interactive horizontal bar chart of 2024 POPCEN population by municipality.
 * Clicking a municipality bar filters the barangay table below.
 */
export function CensusPopulationChart({
  activeMunicipality,
  onSelectMunicipality,
}: {
  activeMunicipality: string;
  onSelectMunicipality: (municipality: string) => void;
}) {
  const sorted = [...census.municipalities].sort(
    (a, b) => b.population - a.population
  );
  const maxPop = sorted[0]?.population || 1;
  const total = census.province.population;

  return (
    <section
      aria-labelledby="census-chart-heading"
      className="rounded-lg border border-gray-300 bg-white p-5 mb-8"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <div>
          <h2
            id="census-chart-heading"
            className="text-base font-semibold text-gray-900"
          >
            Population by municipality (2024 POPCEN)
          </h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Reference date: 1 July 2024 · Click a municipality to filter the
            barangay table below
          </p>
        </div>
        <span className="text-xs font-mono text-gray-700">
          Province total: {fmt(total)}
        </span>
      </div>
      <div className="space-y-3">
        {sorted.map(m => {
          const pctOfMax = (m.population / maxPop) * 100;
          const share = ((m.population / total) * 100).toFixed(1);
          const isSelected = activeMunicipality === m.name;
          return (
            <button
              key={m.psgc}
              type="button"
              onClick={() => onSelectMunicipality(isSelected ? '' : m.name)}
              aria-pressed={isSelected}
              className={`w-full text-left rounded-md p-2 -mx-2 transition-colors ${
                isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-baseline justify-between gap-2 text-sm mb-1">
                <span className="font-medium text-gray-900">
                  {m.name}{' '}
                  <span className="text-xs font-normal text-gray-600">
                    ({m.barangayCount} barangays)
                  </span>
                </span>
                <span className="font-mono text-xs text-gray-800 shrink-0">
                  {fmt(m.population)} ({share}%)
                </span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isSelected ? 'bg-primary-700' : 'bg-primary-500'
                  }`}
                  style={{ width: `${pctOfMax}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Horizontal bar breakdown of FY 2024 Provincial Government receipts and expenditures.
 * Preserves DBM BESF 2026 Table F.10 source precision and caveats.
 */
export function FinancialBreakdownChart() {
  const statement = finances.records.find(
    r => r.recordType === 'statement-of-receipts-and-expenditures'
  );
  if (!statement?.metrics) return null;

  const byKey = new Map(statement.metrics.map(m => [m.key, m]));
  const get = (key: string) => byKey.get(key);

  const receiptsBars = [
    {
      key: 'national_tax_allotment',
      label: 'National Tax Allotment (NTA)',
      color: 'bg-primary-600',
    },
    {
      key: 'total_nonincome_receipts',
      label: 'Non-income receipts (incl. loans)',
      color: 'bg-primary-400',
    },
    {
      key: 'total_local_sources',
      label: 'Local sources (tax + non-tax)',
      color: 'bg-success-600',
    },
  ]
    .map(item => ({ ...item, metric: get(item.key) }))
    .filter(item => item.metric);

  const expenditureBars = [
    {
      key: 'social_services_expenditures',
      label: 'Social services',
      color: 'bg-secondary-500',
    },
    {
      key: 'general_services_expenditures',
      label: 'General services',
      color: 'bg-accent-500',
    },
    {
      key: 'economic_services_expenditures',
      label: 'Economic services',
      color: 'bg-primary-500',
    },
    {
      key: 'total_nonoperating_expenditures',
      label: 'Non-operating (incl. capital outlay)',
      color: 'bg-gray-600',
    },
    {
      key: 'debt_services_expenditures',
      label: 'Debt services',
      color: 'bg-gray-400',
    },
  ]
    .map(item => ({ ...item, metric: get(item.key) }))
    .filter(item => item.metric);

  const totalReceipts = get('total_receipts')?.value || 1;
  const totalExpenditures = get('total_expenditures')?.value || 1;
  const endingCash = get('ending_cash_balance');

  return (
    <section
      aria-labelledby="finance-chart-heading"
      className="rounded-lg border border-gray-300 bg-white p-5 mb-7 space-y-6"
    >
      <div>
        <h3
          id="finance-chart-heading"
          className="text-base font-semibold text-gray-900"
        >
          FY 2024 provincial receipts vs. expenditures (PHP million)
        </h3>
        <p className="text-xs text-gray-600 mt-0.5">
          Provincial Government of Siquijor only · Source: DBM BESF 2026, Table
          F.10 (rounded to 2 decimal places; separate from the 2025 page-1
          extract)
        </p>
      </div>

      {/* Headline summary cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md bg-primary-50 border border-primary-200 p-3.5">
          <p className="text-xs text-primary-800 font-medium">Total receipts</p>
          <p className="text-xl font-bold text-primary-900 font-mono mt-0.5">
            ₱{get('total_receipts')?.sourceValue}M
          </p>
        </div>
        <div className="rounded-md bg-secondary-50 border border-secondary-200 p-3.5">
          <p className="text-xs text-secondary-900 font-medium">
            Total expenditures
          </p>
          <p className="text-xl font-bold text-secondary-900 font-mono mt-0.5">
            ₱{get('total_expenditures')?.sourceValue}M
          </p>
        </div>
        <div className="rounded-md bg-gray-50 border border-gray-200 p-3.5">
          <p className="text-xs text-gray-700 font-medium">
            Ending cash balance
          </p>
          <p className="text-xl font-bold text-gray-900 font-mono mt-0.5">
            ₱{endingCash?.sourceValue}M
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Where receipts came from (FY 2024)
          </h4>
          <div className="space-y-3">
            {receiptsBars.map(bar => {
              const val = bar.metric!.value;
              const pct = Math.min(100, (val / totalReceipts) * 100);
              return (
                <div key={bar.key}>
                  <div className="flex justify-between gap-2 text-xs mb-1">
                    <span className="text-gray-800 font-medium">
                      {bar.label}
                    </span>
                    <span className="font-mono text-gray-700 shrink-0">
                      ₱{bar.metric!.sourceValue}M ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${bar.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            How expenditures were allocated (FY 2024)
          </h4>
          <div className="space-y-3">
            {expenditureBars.map(bar => {
              const val = bar.metric!.value;
              const pct = Math.min(100, (val / totalExpenditures) * 100);
              return (
                <div key={bar.key}>
                  <div className="flex justify-between gap-2 text-xs mb-1">
                    <span className="text-gray-800 font-medium">
                      {bar.label}
                    </span>
                    <span className="font-mono text-gray-700 shrink-0">
                      ₱{bar.metric!.sourceValue}M ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${bar.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
