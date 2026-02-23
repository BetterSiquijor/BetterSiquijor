import { FC } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPinIcon,
  UsersIcon,
  Building2Icon,
  GlobeIcon,
  LandmarkIcon,
  TreesIcon,
} from 'lucide-react';
import { Card, CardContent } from '../ui/Card';

const quickFacts = [
  {
    icon: <MapPinIcon className='h-6 w-6' />,
    title: 'Location',
    description:
      'Island province in the Negros Island Region, located in the Bohol Sea southeast of Cebu.',
  },
  {
    icon: <UsersIcon className='h-6 w-6' />,
    title: 'Population',
    description:
      'Approximately 105,000 residents (2020 Census) across 6 municipalities.',
  },
  {
    icon: <Building2Icon className='h-6 w-6' />,
    title: 'Capital',
    description: 'Siquijor (municipality) serves as the provincial capital.',
  },
  {
    icon: <TreesIcon className='h-6 w-6' />,
    title: 'Geography',
    description:
      'A 343.5 sq km island known for lush forests, coral reefs, and white sand beaches.',
  },
  {
    icon: <GlobeIcon className='h-6 w-6' />,
    title: 'Languages',
    description:
      'Cebuano (Bisaya) is the primary language, with Filipino and English widely spoken.',
  },
  {
    icon: <LandmarkIcon className='h-6 w-6' />,
    title: 'Heritage',
    description:
      'Known as the "Island of Fire," with centuries-old churches and traditional healing practices.',
  },
];

const SiquijorHighlights: FC = () => {
  return (
    <section className='py-12 bg-gray-50'>
      <div className='container mx-auto px-4'>
        <div className='text-center mb-10'>
          <h2 className='text-2xl md:text-3xl font-bold text-gray-900 mb-4'>
            About Siquijor Island
          </h2>
          <p className='text-gray-800 max-w-2xl mx-auto'>
            Discover the enchanting island province of Siquijor — its people,
            culture, and local government.
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
          {quickFacts.map((fact, index) => (
            <Card key={index}>
              <CardContent className='p-6'>
                <div className='flex items-start space-x-4'>
                  <div className='p-3 bg-primary-100 rounded-lg text-primary-600'>
                    {fact.icon}
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                      {fact.title}
                    </h3>
                    <p className='text-gray-800'>{fact.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className='text-center mt-8'>
          <Link
            to='/siquijor'
            className='inline-flex items-center justify-center rounded-md font-medium transition-colors px-6 py-3 bg-primary-500 text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-xs'
          >
            Learn More About Siquijor
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SiquijorHighlights;
