import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ExternalLink, LocateFixed, MapPin, RotateCcw } from 'lucide-react';

export type EducationMapPin = {
  id: string;
  targetId?: string;
  name: string;
  municipality: string;
  barangay?: string | null;
  category: 'Public' | 'Private' | 'Community';
  badgeLabel: string;
  subtitle: string;
  lat: number;
  lon: number;
  osmId: string;
  osmName: string;
  osmUrl: string;
  googleMapsUrl: string;
  osmMunicipality: string;
  municipalityDiffers?: boolean;
};

type EducationMapProps = {
  title: string;
  itemLabel: string;
  pins: EducationMapPin[];
  additionalPins?: EducationMapPin[];
  additionalToggleLabel?: string;
  totalFilteredCount: number;
  jumpLabel: string;
  onJumpToItem?: (targetId: string) => void;
};

const SIQUIJOR_BOUNDS: L.LatLngBoundsExpression = [
  [9.09, 123.45],
  [9.305, 123.73],
];

const PIN_FILL: Record<EducationMapPin['category'], string> = {
  Public: '#0066eb',
  Private: '#0f766e',
  Community: '#b45309',
};

/**
 * Interactive Leaflet + OpenStreetMap tile map plotting Siquijor education facilities
 * with live filter synchronization, zoom-to-campus controls, and ODbL attribution.
 */
export default function EducationMap({
  title,
  itemLabel,
  pins,
  additionalPins = [],
  additionalToggleLabel = 'Show day care & technical',
  totalFilteredCount,
  jumpLabel,
  onJumpToItem,
}: EducationMapProps) {
  const [showMap, setShowMap] = useState(true);
  const [showAdditional, setShowAdditional] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const lastFitKeyRef = useRef<string>('');

  const visiblePins = useMemo(
    () => (showAdditional ? [...pins, ...additionalPins] : pins),
    [pins, additionalPins, showAdditional]
  );

  const selected =
    visiblePins.find(pin => pin.id === selectedId) ?? visiblePins[0] ?? null;

  // Initialize Leaflet map when map container is visible.
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

  // Render markers and fit bounds when filtered pins or active selection change.
  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    for (const pin of visiblePins) {
      const isSelected = selected?.id === pin.id;
      const fill = PIN_FILL[pin.category];

      if (isSelected) {
        L.circleMarker([pin.lat, pin.lon], {
          radius: 13,
          color: fill,
          weight: 2,
          fillColor: fill,
          fillOpacity: 0.2,
          interactive: false,
        }).addTo(group);
      }

      const marker = L.circleMarker([pin.lat, pin.lon], {
        radius: isSelected ? 8 : 6,
        color: '#ffffff',
        weight: 2,
        fillColor: fill,
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

    const fitKey = visiblePins.map(p => p.id).join('|');
    if (fitKey !== lastFitKeyRef.current) {
      lastFitKeyRef.current = fitKey;
      if (visiblePins.length === 0) {
        map.fitBounds(SIQUIJOR_BOUNDS, { padding: [16, 16] });
      } else if (visiblePins.length === 1) {
        map.setView([visiblePins[0].lat, visiblePins[0].lon], 16);
      } else {
        const bounds = L.latLngBounds(
          visiblePins.map(p => [p.lat, p.lon] as [number, number])
        );
        map.fitBounds(bounds, { padding: [28, 28], maxZoom: 15 });
      }
    }
  }, [visiblePins, selected?.id, showMap]);

  function handleZoomToSelected() {
    if (!mapRef.current || !selected) return;
    mapRef.current.setView([selected.lat, selected.lon], 17, { animate: true });
  }

  function handleResetView() {
    if (!mapRef.current) return;
    if (visiblePins.length > 1) {
      const bounds = L.latLngBounds(
        visiblePins.map(p => [p.lat, p.lon] as [number, number])
      );
      mapRef.current.fitBounds(bounds, { padding: [28, 28], maxZoom: 15 });
    } else {
      mapRef.current.fitBounds(SIQUIJOR_BOUNDS, { padding: [16, 16] });
    }
  }

  const hasCommunityPins =
    showAdditional && additionalPins.some(p => p.category === 'Community');

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
            {showAdditional && additionalPins.length > 0
              ? ` · plus ${additionalPins.length} additional mapped sites`
              : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {additionalPins.length > 0 ? (
            <label className="inline-flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showAdditional}
                onChange={e => setShowAdditional(e.target.checked)}
                className="rounded border-gray-300 text-primary-600"
              />
              {additionalToggleLabel} ({additionalPins.length})
            </label>
          ) : null}
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
            <div className="relative isolate z-0 w-full h-[360px] sm:h-[420px] bg-blue-50">
              <div
                ref={mapContainerRef}
                className="w-full h-full"
                role="region"
                aria-label={`Interactive OpenStreetMap of Siquijor showing ${visiblePins.length} mapped locations`}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-gray-50 border-t border-gray-200 text-xs text-gray-700">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: PIN_FILL.Public }}
                    aria-hidden="true"
                  />
                  Public
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: PIN_FILL.Private }}
                    aria-hidden="true"
                  />
                  Private
                </span>
                {hasCommunityPins ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ backgroundColor: PIN_FILL.Community }}
                      aria-hidden="true"
                    />
                    Day care / technical (OSM)
                  </span>
                ) : null}
              </div>
              <span className="text-gray-600">
                Click any marker to inspect · Drag to pan, use +/− to zoom
              </span>
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
                    Coordinates: {selected.lat.toFixed(5)},{' '}
                    {selected.lon.toFixed(5)} · OpenStreetMap ({selected.osmId})
                  </span>
                </p>
                {selected.osmName !== selected.name ? (
                  <p className="text-xs text-gray-600">
                    OpenStreetMap label: “{selected.osmName}”
                  </p>
                ) : null}
                {selected.municipalityDiffers ? (
                  <p className="text-xs text-gray-600">
                    Note: HOTOSM’s administrative border polygon tags this point
                    under {selected.osmMunicipality}; DepEd lists{' '}
                    {selected.municipality}.
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleZoomToSelected}
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50"
                  >
                    <LocateFixed className="w-3.5 h-3.5" aria-hidden="true" />
                    Zoom to campus
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
                {selected.targetId && onJumpToItem ? (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => onJumpToItem(selected.targetId!)}
                      className="text-sm text-primary-700 underline font-medium"
                    >
                      {jumpLabel}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-gray-700">
                No mapped facilities match your current filters. Clear filters
                to view all mapped locations.
              </p>
            )}

            <p className="text-xs text-gray-600 border-t border-gray-200 pt-3">
              Map tiles by OpenStreetMap France / Esri; facility locations from{' '}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-primary-700"
              >
                OpenStreetMap contributors
              </a>{' '}
              (ODbL 1.0) via the HOTOSM Philippines extract (15 November 2026
              snapshot). Community-mapped locations are not exhaustive.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
