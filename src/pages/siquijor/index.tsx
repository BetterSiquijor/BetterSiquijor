import { FC } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  MapPinIcon,
  UsersIcon,
  Building2Icon,
  GlobeIcon,
  PhoneIcon,
  MailIcon,
  LandmarkIcon,
  TreesIcon,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';

const municipalities = [
  {
    name: 'Siquijor',
    zipCode: '6225',
    description: 'Provincial capital and center of government.',
    mayor: 'RICHARD C. QUEZON',
    viceMayor: 'TEODORO G. JUMAWAN JR.',
  },
  {
    name: 'Larena',
    zipCode: '6226',
    description: 'Gateway to the island with the main seaport.',
    mayor: 'CYRUS VINCENT M. CALIBO',
    viceMayor: 'JAN DEAN O. VILLA',
    contact: '(035) 542-6029',
  },
  {
    name: 'San Juan',
    zipCode: '6227',
    description: 'Known for its white sand beaches and resorts.',
    mayor: 'WILFREDO Q. CAPUNDAG JR.',
    viceMayor: 'RUBILYN M. RAGAY',
  },
  {
    name: 'Lazi',
    zipCode: '6228',
    description:
      'Home to the historic San Isidro Labrador Church and Lazi Convent.',
    mayor: 'PHIL MOORE D. LARGO',
    viceMayor: 'ROSE MAE B. DALAYGON',
  },
  {
    name: 'Maria',
    zipCode: '6229',
    description: 'A peaceful municipality with natural springs and waterfalls.',
    mayor: 'ROSELYN T. ASOK',
    viceMayor: 'MEYNARD R. ASOK',
    contact: '(032) 542-6539',
  },
  {
    name: 'Enrique Villanueva',
    zipCode: '6230',
    description: 'The smallest municipality, known for its marine sanctuaries.',
    mayor: 'NALE VINCENT J. MASAYON',
    viceMayor: 'RUTH B. AQUE',
    viceMayorContact: '(035) 542-6148',
  },
];

const quickFacts = [
  {
    icon: <MapPinIcon className='h-6 w-6' />,
    title: 'Location',
    description:
      'Siquijor is an island province in the Negros Island Region (NIR), located in the Bohol Sea southeast of Cebu and south of Bohol.',
  },
  {
    icon: <UsersIcon className='h-6 w-6' />,
    title: 'Population',
    description:
      'Approximately 105,000 residents across 6 municipalities with a rich cultural heritage.',
  },
  {
    icon: <Building2Icon className='h-6 w-6' />,
    title: 'Capital',
    description:
      'Siquijor (municipality) serves as the provincial capital and administrative center.',
  },
  {
    icon: <TreesIcon className='h-6 w-6' />,
    title: 'Geography',
    description:
      'A 343.5 sq km island known for its lush forests, coral reefs, white sand beaches, and natural springs.',
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
      'Known as the "Island of Fire," Siquijor has centuries-old churches, traditional healing practices, and vibrant festivals.',
  },
];

const SiquijorPage: FC = () => {
  return (
    <div className='min-h-screen bg-gray-50'>
      <Helmet>
        <title>Siquijor Island | BetterGov.ph</title>
        <meta
          name='description'
          content='Explore Siquijor Island — local government directory, municipal services, and island information. A BetterGov.ph community portal for the Province of Siquijor, Negros Island Region.'
        />
        <link rel='canonical' href='https://bettergov.ph/siquijor' />
      </Helmet>

      {/* Hero Section */}
      <div className='bg-linear-to-r from-primary-600 to-primary-700 text-white py-12 md:py-20'>
        <div className='container mx-auto px-4'>
          <div className='max-w-3xl'>
            <div className='flex items-center gap-2 mb-4'>
              <MapPinIcon className='h-5 w-5 text-blue-200' />
              <span className='text-blue-200 text-sm font-medium'>
                Negros Island Region
              </span>
            </div>
            <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight'>
              Siquijor Island
            </h1>
            <p className='text-lg md:text-xl text-blue-200 leading-relaxed max-w-2xl'>
              Your gateway to local government services, municipal directories,
              and community information for the Province of Siquijor.
            </p>
            <div className='mt-6 flex flex-wrap gap-3'>
              <Link
                to='/government/local/negros-island-region'
                className='inline-flex items-center bg-white text-primary-700 hover:bg-blue-50 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors'
              >
                <Building2Icon className='h-4 w-4 mr-2' />
                View Full LGU Directory
              </Link>
              <Link
                to='/services'
                className='inline-flex items-center bg-white/10 text-white hover:bg-white/20 border border-white/20 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors'
              >
                Government Services
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='container mx-auto px-4 py-12'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Left Content */}
          <div className='lg:col-span-2 space-y-10'>
            {/* Quick Facts */}
            <section>
              <h2 className='text-3xl font-bold text-gray-900 mb-6'>
                About Siquijor
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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
            </section>

            {/* Municipalities Directory */}
            <section>
              <h2 className='text-3xl font-bold text-gray-900 mb-6'>
                Municipalities
              </h2>
              <p className='text-gray-800 mb-6'>
                Siquijor Province is composed of 6 municipalities. Each is led
                by an elected mayor and vice mayor serving the local community.
              </p>
              <div className='grid gap-4'>
                {municipalities.map((muni, index) => (
                  <Card
                    key={index}
                    className='hover:shadow-md transition-shadow duration-300'
                  >
                    <CardContent className='p-6'>
                      <div className='flex flex-col md:flex-row md:items-start md:justify-between gap-4'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-1'>
                            <h3 className='text-xl font-semibold text-gray-900'>
                              {muni.name}
                            </h3>
                            <span className='text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700'>
                              {muni.zipCode}
                            </span>
                          </div>
                          <p className='text-gray-800 text-sm mb-3'>
                            {muni.description}
                          </p>
                          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                            <div className='flex items-start gap-2'>
                              <div className='w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0' />
                              <div>
                                <p className='text-xs text-gray-500'>Mayor</p>
                                <p className='text-sm font-medium text-gray-900'>
                                  {muni.mayor}
                                </p>
                              </div>
                            </div>
                            <div className='flex items-start gap-2'>
                              <div className='w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0' />
                              <div>
                                <p className='text-xs text-gray-500'>
                                  Vice Mayor
                                </p>
                                <p className='text-sm font-medium text-gray-900'>
                                  {muni.viceMayor}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        {(muni.contact || muni.viceMayorContact) && (
                          <div className='flex items-center gap-2 text-sm text-gray-600'>
                            <PhoneIcon className='h-4 w-4' />
                            <span>{muni.contact || muni.viceMayorContact}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            <Card>
              <CardContent className='p-6'>
                <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                  Key Information
                </h3>
                <div className='space-y-3'>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      Province
                    </div>
                    <div className='text-gray-900'>Siquijor</div>
                  </div>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      Region
                    </div>
                    <div className='text-gray-900'>Negros Island Region</div>
                  </div>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      Capital
                    </div>
                    <div className='text-gray-900'>Siquijor (municipality)</div>
                  </div>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      Municipalities
                    </div>
                    <div className='text-gray-900'>6</div>
                  </div>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      Area
                    </div>
                    <div className='text-gray-900'>343.5 km²</div>
                  </div>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      ZIP Codes
                    </div>
                    <div className='text-gray-900'>6225–6230</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                  Related Links
                </h3>
                <nav className='space-y-2'>
                  <Link
                    to='/government/local/negros-island-region'
                    className='flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
                  >
                    <Building2Icon className='h-4 w-4' />
                    Negros Island Region LGUs
                  </Link>
                  <Link
                    to='/government/local'
                    className='flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
                  >
                    <UsersIcon className='h-4 w-4' />
                    All Local Government Units
                  </Link>
                  <Link
                    to='/services'
                    className='flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
                  >
                    <GlobeIcon className='h-4 w-4' />
                    Government Services
                  </Link>
                  <Link
                    to='/philippines/regions'
                    className='flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
                  >
                    <MapPinIcon className='h-4 w-4' />
                    Philippine Regions
                  </Link>
                </nav>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                  Contact Provincial Government
                </h3>
                <div className='space-y-3'>
                  <div className='flex items-center gap-2 text-sm text-gray-700'>
                    <MailIcon className='h-4 w-4 text-gray-500' />
                    <span>Provincial Capitol, Siquijor, Siquijor 6225</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-gray-700'>
                    <PhoneIcon className='h-4 w-4 text-gray-500' />
                    <span>(035) 377-2045</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiquijorPage;
