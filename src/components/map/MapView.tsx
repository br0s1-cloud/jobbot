import { useEffect, useMemo, useRef, useState } from 'react';
import { Map as MlMap, Popup, NavigationControl, AttributionControl, setWorkerUrl, type GeoJSONSource, type MapLayerMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// MapLibre 6 finds its worker relative to its own file, which breaks once Vite bundles it.
// Importing the (self-contained) worker with ?worker&url makes Vite bundle it as a worker and hands MapLibre the right URL.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

setWorkerUrl(workerUrl);
import { useAtlas } from '../../store/atlas';
import { useFilters } from '../../lib/useFilters';
import { officePins, type OfficePin } from '../../domain/derive';
import { ALL_VIEW } from '../../domain/markets';
import { ACTIVE_STAGES, STAGE_COLOR, CLOSED_COLOR, stageRank } from '../../domain/stages';
import { MapPlaceholder } from '../AtlasShell';

const STYLE = {
  dark: 'https://tiles.openfreemap.org/styles/dark',
  light: 'https://tiles.openfreemap.org/styles/positron',
};
const SRC = 'offices';

function toGeoJSON(pins: OfficePin[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: pins.map((p) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: { id: p.id, color: p.color, open: p.openCount, rank: p.stage ? stageRank(p.stage) : -1, company: p.company, label: p.label, total: p.totalCount, next: p.nextStep, stage: p.stage ?? 'Closed' },
    })),
  };
}

function popupContent(p: Record<string, unknown>): HTMLElement {
  // Built with DOM APIs (not innerHTML) so user-entered names can never inject markup.
  const root = document.createElement('div');
  const title = document.createElement('div');
  title.style.fontWeight = '600';
  title.textContent = String(p.company);
  const sub = document.createElement('div');
  sub.style.color = 'var(--muted)';
  sub.textContent = `${p.label} · ${p.open} open role${p.open === 1 ? '' : 's'} · ${p.stage}`;
  root.append(title, sub);
  if (p.next) {
    const next = document.createElement('div');
    next.style.marginTop = '4px';
    next.textContent = `Next: ${p.next}`;
    root.append(next);
  }
  return root;
}

export default function MapView() {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  const data = useAtlas((s) => s.data);
  const theme = useAtlas((s) => s.theme);
  const hovered = useAtlas((s) => s.hoveredOfficeId);
  const set = useAtlas((s) => s.set);
  const [filters, setFilters] = useFilters();

  const pins = useMemo(() => officePins(data, filters.track), [data, filters.track]);
  const geojson = useMemo(() => toGeoJSON(pins), [pins]);
  const latest = useRef({ geojson, filters, setFilters });
  latest.current = { geojson, filters, setFilters };

  // Create the map once.
  useEffect(() => {
    if (!container.current) return;
    let map: MlMap;
    try {
      map = new MlMap({
        container: container.current,
        style: STYLE[useAtlas.getState().theme],
        center: [ALL_VIEW.lng, ALL_VIEW.lat],
        zoom: ALL_VIEW.zoom,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
      });
    } catch (e) {
      setFailed(e instanceof Error ? e.message : 'WebGL unavailable');
      return;
    }
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new AttributionControl({ compact: true }), 'top-left');
    map.touchZoomRotate.disableRotation();

    const popup = new Popup({ closeButton: false, closeOnClick: false, offset: 12 });

    const addLayers = () => {
      if (!map.getSource(SRC)) {
        // Zoomed out, nearby offices merge into one bubble per metro (count = open roles, color = furthest stage).
        map.addSource(SRC, {
          type: 'geojson',
          data: latest.current.geojson,
          cluster: true,
          clusterRadius: 40,
          clusterMaxZoom: 7,
          clusterProperties: { open: ['+', ['get', 'open']], rank: ['max', ['get', 'rank']] },
        });
      }
      const rankColor = ['match', ['get', 'rank'], ...ACTIVE_STAGES.flatMap((st) => [stageRank(st), STAGE_COLOR[st]]), CLOSED_COLOR] as unknown as string;
      if (!map.getLayer('clusters')) {
        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: SRC,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': rankColor,
            'circle-radius': ['interpolate', ['linear'], ['get', 'open'], 0, 11, 5, 16, 15, 24],
            'circle-stroke-color': getComputedStyle(document.documentElement).getPropertyValue('--pin-stroke').trim() || '#0b0f14',
            'circle-stroke-width': 2,
          },
        });
        map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: SRC,
          filter: ['has', 'point_count'],
          layout: { 'text-field': ['to-string', ['get', 'open']], 'text-font': ['Noto Sans Regular'], 'text-size': 12, 'text-allow-overlap': true },
          paint: { 'text-color': ['case', ['>=', ['get', 'rank'], 4], '#0b0f14', '#ffffff'] },
        });
      }
      if (!map.getLayer('office-pulse')) {
        map.addLayer({
          id: 'office-pulse',
          type: 'circle',
          source: SRC,
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'id'], '']],
          paint: { 'circle-color': ['get', 'color'], 'circle-radius': 10, 'circle-opacity': 0.5 },
        });
      }
      if (!map.getLayer('office-pins')) {
        map.addLayer({
          id: 'office-pins',
          type: 'circle',
          source: SRC,
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': ['get', 'color'],
            'circle-radius': ['interpolate', ['linear'], ['get', 'open'], 0, 4.5, 1, 6.5, 3, 10, 6, 14],
            'circle-stroke-color': getComputedStyle(document.documentElement).getPropertyValue('--pin-stroke').trim() || '#0b0f14',
            'circle-stroke-width': 1.5,
            'circle-opacity': 0.95,
          },
        });
      }
      setReady(true);
    };
    map.on('style.load', addLayers);
    map.on('error', (e) => console.warn('[jobbot] map error', e.error?.message));

    map.on('mousemove', 'office-pins', (e: MapLayerMouseEvent) => {
      const f = e.features?.[0];
      if (!f) return;
      map.getCanvas().style.cursor = 'pointer';
      const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
      popup.setLngLat(coords).setDOMContent(popupContent(f.properties)).addTo(map);
      if (useAtlas.getState().hoveredOfficeId !== f.properties.id) set({ hoveredOfficeId: String(f.properties.id) });
    });
    map.on('mouseleave', 'office-pins', () => {
      map.getCanvas().style.cursor = '';
      popup.remove();
      set({ hoveredOfficeId: null });
    });
    map.on('click', 'clusters', async (e: MapLayerMouseEvent) => {
      const f = e.features?.[0];
      if (!f) return;
      const zoom = await (map.getSource(SRC) as GeoJSONSource).getClusterExpansionZoom(Number(f.properties.cluster_id));
      map.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom: zoom + 0.5 });
    });
    map.on('mouseenter', 'clusters', () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', 'clusters', () => (map.getCanvas().style.cursor = ''));
    map.on('click', 'office-pins', (e: MapLayerMouseEvent) => {
      const f = e.features?.[0];
      if (!f) return;
      const id = String(f.properties.id);
      const { filters: cur, setFilters: setF } = latest.current;
      setF({ officeId: cur.officeId === id ? null : id });
      if (cur.officeId !== id) map.flyTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom: Math.max(map.getZoom(), 11), duration: 900 });
    });

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(container.current);
    return () => {
      ro.disconnect();
      popup.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [set]);

  // Theme → basemap style (layers are re-added on style.load).
  const firstTheme = useRef(true);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (firstTheme.current) {
      firstTheme.current = false;
      return;
    }
    setReady(false);
    map.setStyle(STYLE[theme]);
  }, [theme]);

  // Data → pins.
  useEffect(() => {
    if (!ready) return;
    (mapRef.current?.getSource(SRC) as GeoJSONSource | undefined)?.setData(geojson);
  }, [geojson, ready]);

  // Office filter → dim everything else.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const focus = filters.officeId;
    map.setPaintProperty('office-pins', 'circle-opacity', focus ? ['case', ['==', ['get', 'id'], focus], 1, 0.22] : 0.95);
    map.setPaintProperty('office-pins', 'circle-stroke-opacity', focus ? ['case', ['==', ['get', 'id'], focus], 1, 0.3] : 1);
  }, [filters.officeId, ready]);

  // Market → camera.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const m = data.settings.markets.find((x) => x.id === filters.market);
    const view = m ? { center: [m.lng, m.lat] as [number, number], zoom: m.zoom } : { center: [ALL_VIEW.lng, ALL_VIEW.lat] as [number, number], zoom: ALL_VIEW.zoom };
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    map.flyTo({ ...view, duration: reduce ? 0 : 1200, essential: true });
  }, [filters.market, data.settings.markets]);

  // Hovered card or pin → pulse ring on that office.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.setFilter('office-pulse', ['all', ['!', ['has', 'point_count']], ['==', ['get', 'id'], hovered ?? '']]);
    if (!hovered || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const phase = ((t - start) % 1200) / 1200;
      map.setPaintProperty('office-pulse', 'circle-radius', 8 + phase * 18);
      map.setPaintProperty('office-pulse', 'circle-opacity', 0.55 * (1 - phase));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hovered, ready]);

  if (failed) return <MapPlaceholder text={`The map couldn't start (${failed}). The board still works.`} />;
  // MapLibre's stylesheet forces position:relative on the map element, so the sizing lives on a wrapper.
  return (
    <div className="absolute inset-0">
      <div ref={container} className="h-full w-full" role="region" aria-label="Map of offices; pins sized by open roles and colored by furthest stage" />
    </div>
  );
}
