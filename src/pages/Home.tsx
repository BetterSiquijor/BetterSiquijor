import Hero from '../components/sections/Hero';
import ServicesSection from '../components/home/ServicesSection';
import GovernmentActivitySection from '../components/home/GovernmentActivitySection';
import SEO from '../components/SEO';
import ProvinceDataSection from '../components/home/ProvinceDataSection';

const Home: React.FC = () => {
  return (
    <>
      <SEO
        title="Home"
        description="Independent community portal for Siquijor Province. Read service guides, local officials, municipality and barangay data, and provincial financial records."
        keywords="government, local government, services, public services, civic services"
      />
      <main className="flex-grow">
        <Hero />
        <ServicesSection />
        <GovernmentActivitySection />
        <ProvinceDataSection />
      </main>
    </>
  );
};

export default Home;
