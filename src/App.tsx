import { lazy, Suspense } from 'react';
import { NuqsAdapter } from 'nuqs/adapters/react';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import ScrollToTop from './components/ui/ScrollToTop';
import Services from './pages/Services';
const Document = lazy(() => import('./pages/Document'));
import Government from './pages/Government';
const Search = lazy(() => import('./pages/Search'));
const Data = lazy(() => import('./pages/Data'));
const Schools = lazy(() => import('./pages/Schools'));
const Colleges = lazy(() => import('./pages/Colleges'));
const Facilities = lazy(() => import('./pages/Facilities'));
const Hotlines = lazy(() => import('./pages/Hotlines'));
const Barangays = lazy(() => import('./pages/Barangays'));

import { BrowserRouter as Router, Routes, Route } from 'react-router';

function App() {
  return (
    <HelmetProvider>
      <Router>
        <NuqsAdapter>
          <div className="min-h-screen flex flex-col">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:p-4 focus:bg-white focus:text-primary-700"
            >
              Skip to content
            </a>
            <Navbar />
            <div className="bg-primary-50 text-primary-800 text-sm py-2 px-4 text-center">
              Independent, volunteer-run portal for Siquijor Province. Not an
              official government website.
            </div>
            <div id="main-content" tabIndex={-1} className="flex-grow">
              <ScrollToTop />
              <Suspense
                fallback={
                  <p className="container mx-auto px-4 py-12" role="status">
                    Loading information…
                  </p>
                }
              >
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/services/:category" element={<Services />} />
                  <Route path="/services" element={<Services />} />
                  <Route
                    path="/services/education/find-school"
                    element={<Schools />}
                  />
                  <Route
                    path="/services/education/colleges"
                    element={<Colleges />}
                  />
                  <Route
                    path="/services/health/hospitals"
                    element={<Facilities kind="hospitals" />}
                  />
                  <Route
                    path="/services/public-safety/police-stations"
                    element={<Facilities kind="police" />}
                  />
                  <Route
                    path="/services/:category/:documentSlug"
                    element={<Document categoryType="service" />}
                  />
                  <Route
                    path="/government/:category"
                    element={<Government />}
                  />
                  <Route path="/government" element={<Government />} />
                  <Route
                    path="/government/:category/:documentSlug"
                    element={<Document categoryType="government" />}
                  />
                  <Route path="/search" element={<Search />} />
                  <Route path="/data" element={<Data />} />
                  <Route path="/hotlines" element={<Hotlines />} />
                  <Route path="/barangays" element={<Barangays />} />
                  <Route path="/:lang/:documentSlug" element={<Document />} />
                  <Route path="/:documentSlug" element={<Document />} />
                </Routes>
              </Suspense>
            </div>
            <Footer />
          </div>
        </NuqsAdapter>
      </Router>
    </HelmetProvider>
  );
}

export default App;
