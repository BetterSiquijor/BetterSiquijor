import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Search as SearchIcon } from 'lucide-react';
import SEO from '../components/SEO';
import schoolEntries from '../../data/derived/school-search.json';
import census from '../../data/records/census.json';
import hotlinesData from '../../data/derived/hotlines.json';

type SearchEntry = {
  url: string;
  title: string;
  description: string;
  type:
    'services' | 'government' | 'pages' | 'schools' | 'barangays' | 'hotlines';
  municipality?: string;
  content: string;
};

const documents = import.meta.glob('../../content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const MUNICIPALITIES = [
  'Enrique Villanueva',
  'Larena',
  'Lazi',
  'Maria',
  'San Juan',
  'Siquijor',
];

/**
 * Local English, Cebuano/Bisaya, and Tagalog aliases that map everyday resident terms
 * to the official guide keywords indexed in BetterSiquijor.
 */
const QUERY_ALIASES: Record<string, string[]> = {
  brownout: ['prosielco', 'electricity', 'power', 'outage'],
  blackout: ['prosielco', 'electricity', 'outage'],
  kuryente: ['prosielco', 'electricity', 'utilities'],
  tubig: ['water', 'mswd', 'utilities'],
  ospital: ['hospital', 'health', 'medicare'],
  doktor: ['hospital', 'health', 'rhu'],
  bumbero: ['fire', 'bfp', 'emergency'],
  sunog: ['fire', 'bfp', 'emergency'],
  pulis: ['police', 'pnp', 'clearance'],
  ferry: ['port', 'ferry', 'shipping', 'ppa'],
  barko: ['port', 'ferry', 'shipping'],
  pantalan: ['port', 'larena', 'lazi', 'siquijor'],
  lisensya: ['lto', 'license', 'driver'],
  motor: ['lto', 'vehicle', 'registration'],
  senior: ['senior', 'osca', 'social'],
  pwd: ['pwd', 'disability', 'mswdo'],
  amilyar: ['real property tax', 'treasurer', 'assessor'],
  magsasaka: ['rsbsa', 'agriculture', 'farmer'],
  mangisda: ['rsbsa', 'fisherfolk', 'agriculture'],
  kasal: ['marriage', 'civil registrar', 'psa'],
  eskwelahan: ['school', 'deped', 'enrollment'],
  kolehiyo: ['college', 'ssc', 'university'],
  trabaho: ['job', 'peso', 'philjobnet'],
  negosyo: ['business', 'dti', 'bir', 'permit'],
};

const documentEntries: SearchEntry[] = Object.entries(documents).map(
  ([path, content]) => {
    const parts = path
      .replace('../../content/', '')
      .replace(/\.md$/, '')
      .split('/');
    const rawType = parts.shift()!;
    const type: SearchEntry['type'] =
      rawType === 'services' || rawType === 'government' ? rawType : 'pages';
    const title = content.match(/^#\s+(.+)$/m)?.[1] || parts.at(-1)!;
    const description = content
      .replace(/^#.*$/gm, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*|>#]/g, '')
      .trim()
      .split('\n')
      .filter(Boolean)
      .slice(0, 2)
      .join(' ');
    const url =
      rawType === 'pages'
        ? '/' + parts.join('/')
        : '/' + rawType + '/' + parts.join('/');
    return { url, title, description, type, content };
  }
);

const typedSchoolEntries: SearchEntry[] = schoolEntries.map(s => ({
  ...s,
  type: 'schools',
}));

const barangayEntries: SearchEntry[] = census.municipalities.flatMap(m =>
  m.barangays.map(b => ({
    url: `/barangays?barangay=${encodeURIComponent(b.psgc)}`,
    title: `Barangay ${b.name}, ${m.name}`,
    description: `${b.classification} barangay in ${m.name} · 2024 population: ${b.population.toLocaleString('en-PH')} · PSGC ${b.psgc}`,
    type: 'barangays' as const,
    municipality: m.name,
    content: `${b.name} ${m.name} barangay ${b.classification} ${b.psgc}`,
  }))
);

const hotlineEntries: SearchEntry[] = hotlinesData.municipalDirectories.map(
  m => ({
    url: `/hotlines?municipality=${encodeURIComponent(m.municipality)}`,
    title: `${m.municipality} Emergency Hotlines`,
    description: m.entries.map(e => e.office).join(' · '),
    type: 'hotlines' as const,
    municipality: m.municipality,
    content: [
      m.municipality,
      'hotline emergency 911 fire police coast guard rhu mdrrmo',
      ...m.entries.flatMap(e => [e.office, ...e.contactNumbers]),
    ].join(' '),
  })
);

const entries: SearchEntry[] = [
  ...documentEntries,
  ...hotlineEntries,
  ...typedSchoolEntries,
  ...barangayEntries,
];

const TYPE_FILTERS: { id: string; label: string }[] = [
  { id: '', label: 'All' },
  { id: 'services', label: 'Services' },
  { id: 'government', label: 'Government' },
  { id: 'hotlines', label: 'Hotlines' },
  { id: 'schools', label: 'Schools' },
  { id: 'barangays', label: 'Barangays' },
];

const TYPE_BADGE: Record<SearchEntry['type'], string> = {
  services: 'Service',
  government: 'Government',
  pages: 'Project information',
  schools: 'School',
  barangays: 'Barangay',
  hotlines: 'Emergency hotline',
};

export default function Search() {
  const [params, setParams] = useSearchParams();
  const query = (params.get('q') || '').slice(0, 120);
  const typeFilter = params.get('type') || '';
  const municipality = params.get('municipality') || '';

  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  const results = useMemo(() => {
    if (!words.length && !typeFilter && !municipality) return [];
    return entries
      .filter(e => {
        if (typeFilter && e.type !== typeFilter) return false;
        const haystack =
          `${e.title} ${e.description} ${e.content}`.toLowerCase();
        if (municipality) {
          if (e.municipality) {
            if (e.municipality !== municipality) return false;
          } else if (!haystack.includes(municipality.toLowerCase())) {
            return false;
          }
        }
        if (!words.length) return true;
        return words.every(w => {
          if (haystack.includes(w)) return true;
          const aliases = QUERY_ALIASES[w];
          return aliases ? aliases.some(a => haystack.includes(a)) : false;
        });
      })
      .sort((a, b) => {
        // Prioritize title matches and guides/hotlines over long lists
        const aTitle = words.some(w => a.title.toLowerCase().includes(w))
          ? 0
          : 1;
        const bTitle = words.some(w => b.title.toLowerCase().includes(w))
          ? 0
          : 1;
        return aTitle - bTitle;
      });
  }, [query, typeFilter, municipality]);

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <SEO
        title="Search"
        description="Search Siquijor services, emergency hotlines, schools, barangays, and public records in this edition."
      />
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Search</h1>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] mb-4">
        <div className="relative">
          <SearchIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500"
            aria-hidden="true"
          />
          <label htmlFor="portal-search" className="sr-only">
            Search services, hotlines, schools, and barangays
          </label>
          <input
            id="portal-search"
            type="search"
            value={query}
            onChange={e => update('q', e.target.value)}
            maxLength={120}
            placeholder="Try “brownout”, “ospital”, “LTO”, “Lazi”, or a barangay…"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label htmlFor="search-municipality" className="sr-only">
            Filter by municipality
          </label>
          <select
            id="search-municipality"
            value={municipality}
            onChange={e => update('municipality', e.target.value)}
            className="w-full sm:w-48 px-3 py-3 border border-gray-300 rounded-lg bg-white text-sm"
          >
            <option value="">All municipalities</option>
            {MUNICIPALITIES.map(m => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category filter pills */}
      <div
        className="flex flex-wrap gap-2 mb-6"
        role="group"
        aria-label="Filter results by category"
      >
        {TYPE_FILTERS.map(f => (
          <button
            key={f.id || 'all'}
            type="button"
            onClick={() => update('type', f.id)}
            aria-pressed={typeFilter === f.id}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
              typeFilter === f.id
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-primary-700 border-gray-300 hover:bg-primary-50'
            }`}
          >
            {f.label}
          </button>
        ))}
        {query || typeFilter || municipality ? (
          <button
            type="button"
            onClick={() => setParams({}, { replace: true })}
            className="text-xs text-primary-700 underline px-2 py-1.5"
          >
            Clear all
          </button>
        ) : null}
      </div>

      <p className="text-sm text-gray-700 mb-6" role="status">
        {words.length || typeFilter || municipality
          ? `${results.length} result${results.length === 1 ? '' : 's'}${query ? ` for “${query}”` : ''}${municipality ? ` in ${municipality}` : ''}`
          : 'Start typing or pick a category. Search runs locally in your browser and understands common local terms like “brownout”, “ospital”, “bumbero”, or “ferry”.'}
      </p>

      {results.length > 0 ? (
        <div className="space-y-3">
          {results.slice(0, 80).map(hit => (
            <Link key={hit.url} to={hit.url} className="block group">
              <div className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 mb-2">
                  {TYPE_BADGE[hit.type]}
                </span>
                <h2 className="text-base font-semibold text-gray-900 group-hover:text-primary-700">
                  {hit.title}
                </h2>
                <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                  {hit.description}
                </p>
              </div>
            </Link>
          ))}
          {results.length > 80 ? (
            <p className="text-xs text-gray-600 text-center pt-2">
              Showing the first 80 of {results.length} matches. Narrow your
              search or choose a municipality to see specific entries.
            </p>
          ) : null}
        </div>
      ) : words.length > 0 || typeFilter || municipality ? (
        <div className="text-center py-12 text-gray-700">
          No matching pages yet. Try “PhilHealth”, “LTO”, “brownout”, “budget”,
          or a municipality name.
        </div>
      ) : null}
    </main>
  );
}
