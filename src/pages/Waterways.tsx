import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Download,
  Droplets,
  ExternalLink,
  MapPin,
  RotateCcw,
} from 'lucide-react';
import waterwaysSummary from '../../data/derived/waterways-osm.json';
import SEO from '../components/SEO';
import Section from '../components/ui/Section';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { Heading } from '../components/ui/Heading';

type CategoryKey = 'river' | 'stream' | 'drainage' | 'waterbody' | 'waterfall';

type GeoJsonFeature = {
  type: 'Feature';
  properties: {
    id: string;
    name?: string | null;
    waterway?: string | null;
    water?: string | null;
    adm3_name?: string | null;
    adm4_name?: string | null;
  };
  geometry: GeoJSON.Geometry;
};

type GeoJsonCollection = {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
};

const SIQUIJOR_BOUNDS: L.LatLngBoundsExpression = [
  [9.09, 123.45],
  [9.305, 123.73],
];

const CATEGORY_META: Record<
  CategoryKey,
  { label: string; color: string; weight: number; dashArray?: string }
> = {
  river: { label: 'Rivers', color: '#0052bc', weight: 3 },
  stream: { label: 'Streams & tidal channels', color: '#3385ef', weight: 1.8 },
  drainage: {
    label: 'Canals, ditches & drains',
    color: '#0f766e',
    weight: 1.8,
    dashArray: '4 4',
  },
  waterbody: { label: 'Lakes, ponds & lagoons', color: '#0284c7', weight: 1.5 },
  waterfall: { label: 'Waterfalls', color: '#b45309', weight: 2 },
};

const ALL_CATEGORIES: CategoryKey[] = [
  'river',
  'stream',
  'drainage',
  'waterbody',
  'waterfall',
];

function cleanMuni(value?: string | null) {
  return String(value || '')
    .replace(/\s*\(Capital\)\s*$/i, '')
    .trim();
}

function classifyFeature(
  props: GeoJsonFeature['properties'],
  geomType: string
): CategoryKey {
  const ww = props.waterway;
  const w = props.water;
  if (ww === 'waterfall') return 'waterfall';
  if (ww === 'river' || w === 'river') return 'river';
  if (
    ww === 'stream' ||
    ww === 'tidal_channel' ||
    ww === 'flowline' ||
    ww === 'stream_end'
  )
    return 'stream';
  if (
    ww === 'canal' ||
    ww === 'ditch' ||
    ww === 'drain' ||
    ww === 'flow_control'
  )
    return 'drainage';
  if (w || geomType === 'Polygon' || geomType === 'MultiPolygon')
    return 'waterbody';
  return 'stream';
}

export default function Waterways() {
  const [params, setParams] = useSearchParams();
  const municipality = params.get('municipality') || '';
  const query = (params.get('q') || '').slice(0, 120);

  const [enabledCategories, setEnabledCategories] = useState<
    Record<CategoryKey, boolean>
  >({
    river: true,
    stream: true,
    drainage: true,
    waterbody: true,
    waterfall: true,
  });
  const [geojson, setGeojson] = useState<GeoJsonCollection | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  function toggleCategory(cat: CategoryKey) {
    setEnabledCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  }

  // Fetch the 921 KB Siquijor waterways GeoJSON on demand when visiting this page.
  useEffect(() => {
    let cancelled = false;
    fetch('/data/waterways-osm.geojson')
      .then(res => {
        if (!res.ok) throw new Error('Could not load waterways GeoJSON');
        return res.json();
      })
      .then((data: GeoJsonCollection) => {
        if (!cancelled) setGeojson(data);
      })
      .catch(err => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Initialize Leaflet tile map once.
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const map = L.map(mapContainerRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
      minZoom: 10,
      maxZoom: 18,
    });

    const osmLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
      {
        subdomains: 'abc',
        maxZoom: 20,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors · Tiles by <a href="https://www.openstreetmap.fr/" target="_blank" rel="noopener noreferrer">OSM France</a>',
      }
    );

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
      }
    );

    osmLayer.addTo(map);
    L.control
      .layers(
        { OpenStreetMap: osmLayer, Satellite: satelliteLayer },
        undefined,
        {
          position: 'topright',
        }
      )
      .addTo(map);

    map.fitBounds(SIQUIJOR_BOUNDS, { padding: [16, 16] });
    const group = L.layerGroup().addTo(map);

    mapRef.current = map;
    layerGroupRef.current = group;

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Render filtered GeoJSON features onto the Leaflet layer group.
  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group || !geojson) return;

    group.clearLayers();

    const filteredFeatures = geojson.features.filter(f => {
      const m = cleanMuni(f.properties.adm3_name);
      if (municipality && m !== municipality) return false;
      const cat = classifyFeature(f.properties, f.geometry.type);
      return enabledCategories[cat];
    });

    const geoLayer = L.geoJSON(
      {
        type: 'FeatureCollection',
        features: filteredFeatures,
      } as GeoJSON.FeatureCollection,
      {
        style: feature => {
          const props = (feature?.properties ||
            {}) as GeoJsonFeature['properties'];
          const cat = classifyFeature(
            props,
            feature?.geometry?.type || 'LineString'
          );
          const meta = CATEGORY_META[cat];
          return {
            color: meta.color,
            weight: meta.weight,
            dashArray: meta.dashArray,
            fillColor: meta.color,
            fillOpacity: cat === 'waterbody' ? 0.35 : 0.2,
            opacity: 0.85,
          };
        },
        pointToLayer: (feature, latlng) => {
          const props = feature.properties as GeoJsonFeature['properties'];
          const cat = classifyFeature(props, 'Point');
          const meta = CATEGORY_META[cat];
          return L.circleMarker(latlng, {
            radius: 7,
            color: '#ffffff',
            weight: 2,
            fillColor: meta.color,
            fillOpacity: 0.95,
          });
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties as GeoJsonFeature['properties'];
          const cat = classifyFeature(props, feature.geometry.type);
          const label =
            props.name ||
            `Unnamed ${props.waterway || props.water || CATEGORY_META[cat].label}`;
          const town = cleanMuni(props.adm3_name);
          const brgy = props.adm4_name ? `${props.adm4_name}, ` : '';
          layer.bindPopup(
            `<div class="text-xs space-y-1">
              <div class="font-semibold text-gray-900">${label}</div>
              <div class="text-gray-600">${brgy}${town} · ${CATEGORY_META[cat].label}</div>
              <a href="https://www.openstreetmap.org/${props.id}" target="_blank" rel="noopener noreferrer" class="text-primary-700 underline">View ${props.id} on OpenStreetMap</a>
            </div>`
          );
        },
      }
    );

    geoLayer.addTo(group);

    if (municipality && filteredFeatures.length > 0) {
      const bounds = geoLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
      }
    } else if (!municipality) {
      map.fitBounds(SIQUIJOR_BOUNDS, { padding: [16, 16] });
    }
  }, [geojson, municipality, enabledCategories]);

  function handleFocusFeature(lat: number, lon: number) {
    if (!mapRef.current) return;
    mapRef.current.setView([lat, lon], 16, { animate: true });
    mapContainerRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }

  function handleResetView() {
    mapRef.current?.fitBounds(SIQUIJOR_BOUNDS, { padding: [16, 16] });
  }

  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const filteredNamed = useMemo(
    () =>
      waterwaysSummary.namedFeatures.filter(
        f =>
          (!municipality || f.municipality === municipality) &&
          enabledCategories[f.category as CategoryKey] &&
          words.every(w =>
            `${f.name} ${f.municipality} ${f.barangay || ''} ${f.category} ${f.waterwayTag || ''}`
              .toLowerCase()
              .includes(w)
          )
      ),
    [municipality, query, enabledCategories]
  );

  const visibleCount = useMemo(() => {
    if (!geojson) return waterwaysSummary.metadata.featureCount;
    return geojson.features.filter(f => {
      const m = cleanMuni(f.properties.adm3_name);
      if (municipality && m !== municipality) return false;
      return enabledCategories[classifyFeature(f.properties, f.geometry.type)];
    }).length;
  }, [geojson, municipality, enabledCategories]);

  return (
    <>
      <SEO
        title="Siquijor waterways & watersheds map"
        description="Explore 1,058 OpenStreetMap-mapped rivers, streams, canals, drains, ponds, and waterfalls across Siquijor Province for watershed and flood-awareness context."
      />
      <Section>
        <Breadcrumbs className="mb-8" />
        <Heading>Siquijor waterways &amp; water bodies</Heading>
        <p className="text-gray-700 mb-5 max-w-3xl">
          Explore{' '}
          <strong>
            {waterwaysSummary.metadata.featureCount.toLocaleString('en-PH')}
          </strong>{' '}
          mapped rivers, streams, canals, drains, ponds, lagoons, and waterfalls
          across Siquijor’s six municipalities from the HOTOSM / OpenStreetMap
          Philippines dataset (15 November 2026 snapshot).
        </p>

        {/* Controls */}
        <div className="grid gap-4 md:grid-cols-2 max-w-3xl mb-4">
          <div>
            <label
              htmlFor="waterways-municipality"
              className="block text-sm font-medium mb-2"
            >
              Municipality
            </label>
            <select
              id="waterways-municipality"
              value={municipality}
              onChange={e => update('municipality', e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-sm"
            >
              <option value="">All six municipalities</option>
              {waterwaysSummary.municipalityCounts.map(m => (
                <option key={m.municipality} value={m.municipality}>
                  {m.municipality} ({m.total} mapped features)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="waterways-search"
              className="block text-sm font-medium mb-2"
            >
              Search named rivers, springs, or waterfalls
            </label>
            <input
              id="waterways-search"
              type="search"
              value={query}
              maxLength={120}
              onChange={e => update('q', e.target.value)}
              placeholder="e.g. Cambugahay, Gabayan, Señora, Lugnason"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-sm"
            />
          </div>
        </div>

        {/* Layer toggles */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {ALL_CATEGORIES.map(cat => {
            const meta = CATEGORY_META[cat];
            const count =
              (waterwaysSummary.categoryCounts as Record<string, number>)[
                cat
              ] || 0;
            return (
              <label
                key={cat}
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={enabledCategories[cat]}
                  onChange={() => toggleCategory(cat)}
                  className="rounded border-gray-300 text-primary-600"
                />
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: meta.color }}
                  aria-hidden="true"
                />
                {meta.label} ({count})
              </label>
            );
          })}
        </div>

        {/* Interactive Leaflet Map */}
        <section
          aria-label="Interactive Siquijor waterways map"
          className="rounded-lg border border-gray-300 bg-white overflow-hidden mb-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Interactive waterways map
              </h2>
              <p className="text-xs text-gray-600 mt-0.5" role="status">
                {loadError
                  ? `Map data error: ${loadError}`
                  : !geojson
                    ? 'Loading Siquijor waterways layer…'
                    : `Showing ${visibleCount.toLocaleString('en-PH')} of ${waterwaysSummary.metadata.featureCount.toLocaleString('en-PH')} mapped features · Click any line, pond, or pin for details`}
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetView}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 underline"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Reset island view
            </button>
          </div>
          <div className="relative isolate z-0 w-full h-[420px] sm:h-[500px] bg-blue-50">
            <div
              ref={mapContainerRef}
              className="w-full h-full"
              role="region"
              aria-label="OpenStreetMap of Siquijor waterways"
            />
          </div>
        </section>

        {/* Named waterways & waterfalls directory */}
        <section className="mb-10">
          <Heading level={2} className="mb-3">
            Named rivers, waterfalls, springs &amp; water bodies (
            {filteredNamed.length})
          </Heading>
          {filteredNamed.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredNamed.map(item => {
                const meta =
                  CATEGORY_META[item.category as CategoryKey] ||
                  CATEGORY_META.stream;
                return (
                  <article
                    key={item.id}
                    className="rounded-lg border border-gray-300 bg-white p-4 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-medium text-primary-700 flex items-center gap-1.5">
                        <Droplets className="w-3.5 h-3.5" aria-hidden="true" />
                        {meta.label} · {item.municipality}
                      </p>
                      <h3 className="text-base font-semibold text-gray-900 mt-1">
                        {item.name}
                      </h3>
                      {item.barangay ? (
                        <p className="text-xs text-gray-600 mt-0.5">
                          OSM area: {item.barangay}, {item.municipality}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => handleFocusFeature(item.lat, item.lon)}
                        className="inline-flex items-center gap-1 text-primary-700 underline font-medium"
                      >
                        <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                        Zoom on map
                      </button>
                      <a
                        href={item.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary-700 underline"
                      >
                        Google Maps
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </a>
                      <a
                        href={item.osmUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-gray-600 underline"
                      >
                        OSM ({item.osmId})
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="bg-gray-50 rounded-lg p-6 text-sm text-gray-700">
              No named waterways match your current filter.
            </p>
          )}
        </section>

        {/* Municipality breakdown table */}
        <section className="mb-10">
          <Heading level={2} className="mb-3">
            Mapped features by municipality
          </Heading>
          <div className="overflow-x-auto border border-gray-300 rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-primary-50 text-gray-900">
                <tr>
                  <th scope="col" className="p-3.5">
                    Municipality
                  </th>
                  <th scope="col" className="p-3.5 text-right">
                    Rivers
                  </th>
                  <th scope="col" className="p-3.5 text-right">
                    Streams
                  </th>
                  <th scope="col" className="p-3.5 text-right">
                    Canals / Drains
                  </th>
                  <th scope="col" className="p-3.5 text-right">
                    Water bodies
                  </th>
                  <th scope="col" className="p-3.5 text-right">
                    Waterfalls
                  </th>
                  <th scope="col" className="p-3.5 text-right">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {waterwaysSummary.municipalityCounts.map(m => (
                  <tr
                    key={m.municipality}
                    className="border-t border-gray-200 hover:bg-primary-50"
                  >
                    <th scope="row" className="p-3.5 font-medium">
                      <button
                        type="button"
                        onClick={() => update('municipality', m.municipality)}
                        className="text-primary-700 underline text-left"
                      >
                        {m.municipality}
                      </button>
                    </th>
                    <td className="p-3.5 text-right font-mono">{m.river}</td>
                    <td className="p-3.5 text-right font-mono">{m.stream}</td>
                    <td className="p-3.5 text-right font-mono">{m.drainage}</td>
                    <td className="p-3.5 text-right font-mono">
                      {m.waterbody}
                    </td>
                    <td className="p-3.5 text-right font-mono">
                      {m.waterfall}
                    </td>
                    <td className="p-3.5 text-right font-mono font-semibold">
                      {m.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Source attribution, caveats, and downloads */}
        <details className="border-t border-gray-300 pt-6" open>
          <summary className="cursor-pointer font-medium text-primary-700">
            Data source, coverage caveats, and open downloads
          </summary>
          <div className="mt-4 space-y-3 text-sm text-gray-700">
            <p>{waterwaysSummary.metadata.caveat}</p>
            <p>
              Source: <strong>OpenStreetMap contributors</strong> via HOTOSM /
              HDX Philippines Waterways extract (snapshot{' '}
              <strong>15 November 2026</strong>, exported 16 November 2026,
              filtered to <code>adm2_pcode == PH07061</code>), licensed under{' '}
              <a
                href={waterwaysSummary.metadata.licenseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-700 underline"
              >
                {waterwaysSummary.metadata.license}
              </a>
              . For flood emergencies, always follow official PAGASA, MGB, and{' '}
              <Link to="/hotlines" className="text-primary-700 underline">
                PDRRMO / MDRRMO advisories
              </Link>
              .
            </p>
            <div className="flex flex-wrap gap-5 pt-2">
              <a
                href="/data/waterways-osm.geojson"
                download
                className="inline-flex items-center gap-1.5 text-primary-700 underline font-medium"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                Download Siquijor waterways (GeoJSON · 1,058 features)
              </a>
              <a
                href="/data/waterways-osm.csv"
                download
                className="inline-flex items-center gap-1.5 text-primary-700 underline font-medium"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                Download waterways table (CSV)
              </a>
            </div>
          </div>
        </details>
      </Section>
    </>
  );
}
