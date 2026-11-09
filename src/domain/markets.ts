import type { Market, Settings } from './types';

export const DEFAULT_MARKETS: Market[] = [
  { id: 'dc', label: 'DC', lng: -77.12, lat: 38.92, zoom: 9.6, radius_km: 45 },
  { id: 'austin', label: 'Austin', lng: -97.72, lat: 30.35, zoom: 9.7, radius_km: 40 },
  { id: 'nyc', label: 'NYC', lng: -73.985, lat: 40.748, zoom: 11.2, radius_km: 35 },
  { id: 'seattle', label: 'Seattle', lng: -122.24, lat: 47.635, zoom: 9.9, radius_km: 40 },
];

export const DEFAULT_SETTINGS: Settings = {
  home_base: { label: 'Washington, DC', lat: 38.9072, lng: -77.0369 },
  markets: DEFAULT_MARKETS,
};

/** Continental-US view used for the "All" market. */
export const ALL_VIEW = { lng: -96.5, lat: 38.6, zoom: 3.3 };

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function inMarket(point: { lat: number; lng: number }, m: Market): boolean {
  return distanceKm(point, m) <= m.radius_km;
}
