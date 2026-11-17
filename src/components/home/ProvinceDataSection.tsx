import { Link } from 'react-router';
import census from '../../../data/records/census.json';
import Section from '../ui/Section';
import { Heading } from '../ui/Heading';
import { Text } from '../ui/Text';

export default function ProvinceDataSection() {
  return (
    <Section>
      <Heading level={2}>Siquijor at a glance</Heading>
      <Text className="text-gray-700 mb-6">
        Get to know the six municipalities and 134 barangays that make up
        Siquijor.
      </Text>
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {[
          [
            census.province.population.toLocaleString('en-PH'),
            'Residents · 2024 POPCEN',
          ],
          [census.municipalities.length, 'Municipalities'],
          [census.province.barangayCount, 'Barangays'],
        ].map(([value, label]) => (
          <div
            key={label}
            className="border border-primary-500 border-t-4 rounded-lg p-6"
          >
            <dt className="text-sm text-gray-700">{label}</dt>
            <dd className="text-3xl font-bold text-gray-900 mt-2">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="overflow-x-auto rounded-lg border border-gray-300">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            All six Siquijor municipalities and 2024 census populations
          </caption>
          <thead className="bg-primary-50 text-gray-900">
            <tr>
              <th scope="col" className="p-4">
                Municipality
              </th>
              <th scope="col" className="p-4 text-right">
                Barangays
              </th>
              <th scope="col" className="p-4 text-right">
                Population (2024)
              </th>
            </tr>
          </thead>
          <tbody>
            {census.municipalities.map(m => (
              <tr key={m.psgc} className="border-t border-gray-200">
                <th scope="row" className="p-4 font-medium">
                  <Link
                    className="text-primary-600 hover:underline"
                    to={'/government/municipalities/' + m.slug}
                  >
                    {m.name}
                  </Link>
                </th>
                <td className="p-4 text-right">{m.barangayCount}</td>
                <td className="p-4 text-right">
                  {m.population.toLocaleString('en-PH')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-5 mt-6 text-primary-600 font-medium">
        <Link to="/data">Find your barangay →</Link>
        <Link to="/government/departments/office-directory">
          Find an office →
        </Link>
        <Link to="/government/transparency">Explore provincial spending →</Link>
      </div>
      <p className="text-sm text-gray-700 mt-4">
        Population: PSA 2024 Census, as of 1 July 2024. Geographic listing: 31
        July 2025.
      </p>
    </Section>
  );
}
