import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Heading } from '../ui/Heading';
import { Text } from '../ui/Text';

const quickLinks = [
  { label: 'Find a school', to: '/services/education/find-school' },
  { label: 'Hospitals', to: '/services/health/hospitals' },
  { label: 'Police stations', to: '/services/public-safety/police-stations' },
  { label: 'Local records', to: '/data' },
];

export default function Hero() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
  }

  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="animate-fade-in">
            <Text transform="uppercase">Welcome to</Text>
            <Heading>
              {import.meta.env.VITE_GOVERNMENT_NAME || 'BetterSiquijor'}
            </Heading>
            <Text className="text-primary-50">{t('hero.subtitle')}</Text>
          </div>
          <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-lg p-5 md:p-6">
            <form onSubmit={handleSubmit} role="search">
              <label
                htmlFor="hero-search"
                className="block text-sm font-medium text-white mb-2"
              >
                Search services, schools, or local records
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                  <Search
                    className="h-4 w-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    id="hero-search"
                    type="search"
                    value={query}
                    maxLength={120}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="e.g. PhilHealth, birth certificate, Lazi"
                    className="w-full rounded-md bg-white text-gray-900 placeholder:text-gray-500 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-primary-900 hover:bg-primary-800 text-white font-medium text-sm px-5 py-2.5 rounded-md transition-colors cursor-pointer shrink-0"
                >
                  Search
                </button>
              </div>
            </form>
            <div className="flex flex-wrap gap-2 mt-4">
              {quickLinks.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-xs font-medium bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-full transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
