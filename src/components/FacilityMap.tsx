import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ExternalLink, LocateFixed, MapPin, RotateCcw } from 'lucide-react';

export type FacilityMapPin = {
  id: string;
  targetId: string;
  name: string;
  municipality: string;
  badgeLabel: string;
  subtitle: string;
  color: string;
  lat: number;
  lon: number;
  osmId: string;
  osmName: string;
  osmUrl: string;
  googleMapsUrl: string;
};

type FacilityMapProps = {
  title: string;
  itemLabel: string;
  pins: FacilityMapPin[];
  totalFilteredCount: number;
  onJumpToItem?: (targetId: string) => void;
};

const SIQUIJOR_BOUNDS: L.LatLngBoundsExpression = [
  [9.09, 123.45],
  [9.305, 123.73],
];

/**
 * Interactive Leaflet + OpenStreetMap tile map for public facilities in Siquijor
 * (hospitals, RHUs, police stations, fire stations, and ports).
 */
export default function FacilityMap({
  title,
  itemLabel,
  pins,
  totalFilteredCount,
  onJumpToItem,
}: FacilityMapProps) {
  const [showMap, setShowMap] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const lastFitKeyRef = useRef<string>('');

  const selected = pins.find(p => p.id === selectedId) ?? pins[0] ?? null;

  useEffect(() => {
    if (!showMap || !mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
      minZoom: 10,
      maxZoom: 19,
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

    const esriStreetLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; World Street Map',
      }
    );

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
      }
    );

    osmLayer.addTo(map);
    L.control
      .layers(
        {
          OpenStreetMap: osmLayer,
          'Street & relief (Esri)': esriStreetLayer,
          Satellite: satelliteLayer,
        },
        undefined,
        { position: 'topright' }
      )
      .addTo(map);

    map.fitBounds(SIQUIJOR_BOUNDS, { padding: [16, 16] });
    const group = L.layerGroup().addTo(map);

    mapRef.current = map;
    layerGroupRef.current = group;
    lastFitKeyRef.current = '';

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, [showMap]);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    for (const pin of pins) {
      const isSelected = selected?.id === pin.id;
      if (isSelected) {
        L.circleMarker([pin.lat, pin.lon], {
          radius: 14,
          color: pin.color,
          weight: 2,
          fillColor: pin.color,
          fillOpacity: 0.2,
          interactive: false,
        }).addTo(group);
      }

      const marker = L.circleMarker([pin.lat, pin.lon], {
        radius: isSelected ? 8 : 6.5,
        color: '#ffffff',
        weight: 2,
        fillColor: pin.color,
        fillOpacity: 0.95,
      });

      marker.bindTooltip(`${pin.name} (${pin.municipality})`, {
        direction: 'top',
        offset: [0, -6],
      });
      marker.on('click', () => setSelectedId(pin.id));
      marker.addTo(group);
      if (isSelected) marker.bringToFront();
    }

    const fitKey = pins.map(p => p.id).join('|');
    if (fitKey !== lastFitKeyRef.current) {
      lastFitKeyRef.current = fitKey;
      if (pins.length === 0) {
        map.fitBounds(SIQUIJOR_BOUNDS, { padding: [16, 16] });
      } else if (pins.length === 1) {
        map.setView([pins[0].lat, pins[0].lon], 16);
      } else {
        const bounds = L.latLngBounds(
          pins.map(p => [p.lat, p.lon] as [number, number])
        );
        map.fitBounds(bounds, { padding: [28, 28], maxZoom: 15 });
      }
    }
  }, [pins, selected?.id, showMap]);

  function handleZoomToSelected() {
    if (!mapRef.current || !selected) return;
    mapRef.current.setView([selected.lat, selected.lon], 17, { animate: true });
  }

  function handleResetView() {
    if (!mapRef.current) return;
    if (pins.length > 1) {
      const bounds = L.latLngBounds(
        pins.map(p => [p.lat, p.lon] as [number, number])
      );
      mapRef.current.fitBounds(bounds, { padding: [28, 28], maxZoom: 15 });
    } else {
      mapRef.current.fitBounds(SIQUIJOR_BOUNDS, { padding: [16, 16] });
    }
  }

  return (
    <section
      aria-label={title}
      className="mb-8 rounded-lg border border-gray-300 bg-white overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-600 mt-0.5">
            {pins.length} of {totalFilteredCount} matching {itemLabel} mapped in
            OpenStreetMap
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {showMap ? (
            <button
              type="button"
              onClick={handleResetView}
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-primary-700 underline"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Reset view
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setShowMap(v => !v)}
            aria-expanded={showMap}
            className="text-sm font-medium text-primary-700 underline"
          >
            {showMap ? 'Hide map' : 'Show map'}
          </button>
        </div>
      </div>

      {showMap ? (
        <div className="grid lg:grid-cols-[1.55fr_1fr]">
          <div className="border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col">
            <div className="relative isolate z-0 w-full h-[340px] sm:h-[400px] bg-blue-50">
              <div
                ref={mapContainerRef}
                className="w-full h-full"
                role="region"
                aria-label={`Interactive OpenStreetMap of Siquijor showing ${pins.length} mapped ${itemLabel}`}
              />
            </div>
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
              Click any marker to inspect · Drag to pan, use +/− to zoom
            </div>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-between gap-4">
            {selected ? (
              <div className="space-y-3">
                <p className="text-xs font-medium text-primary-700">
                  {selected.badgeLabel}
                </p>
                <h3 className="text-lg font-semibold text-gray-900 leading-snug">
                  {selected.name}
                </h3>
                <p className="text-sm text-gray-700">{selected.subtitle}</p>
                <p className="flex items-start gap-2 text-xs text-gray-600">
                  <MapPin
                    className="w-4 h-4 shrink-0 mt-0.5 text-primary-600"
                    aria-hidden="true"
                  />
                  <span>
                    {selected.lat.toFixed(5)}, {selected.lon.toFixed(5)} ·
                    OpenStreetMap ({selected.osmId})
                  </span>
                </p>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleZoomToSelected}
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50"
                  >
                    <LocateFixed className="w-3.5 h-3.5" aria-hidden="true" />
                    Zoom in
                  </button>
                  <a
                    href={selected.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-2 text-xs font-medium text-white hover:bg-primary-700"
                  >
                    Google Maps
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                  <a
                    href={selected.osmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-primary-600 px-3 py-2 text-xs font-medium text-primary-700 hover:bg-primary-50"
                  >
                    OpenStreetMap
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </div>
                {onJumpToItem ? (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => onJumpToItem(selected.targetId)}
                      className="text-sm text-primary-700 underline font-medium"
                    >
                      Jump to facility card below
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-gray-700">
                No OpenStreetMap coordinates are available for the currently
                filtered facilities.
              </p>
            )}

            <p className="text-xs text-gray-600 border-t border-gray-200 pt-3">
              Coordinates queried from{' '}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-primary-700"
              >
                OpenStreetMap contributors
              </a>{' '}
              (ODbL 1.0, 21 November 2026). Unmapped facilities are omitted from
              the map rather than estimated.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
