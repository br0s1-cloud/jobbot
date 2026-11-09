// Geocoding happens once, when an office or home base is saved. Never at render time.
// Uses OpenStreetMap's Nominatim (free; low volume, results cached in this browser).

export type GeoResult = { lat: number; lng: number; display: string };

const KEY = 'jobbot.geocode.v1';
function readCache(): Record<string, GeoResult> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}

export async function geocode(query: string): Promise<GeoResult | null> {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const cache = readCache();
  if (cache[q]) return cache[q];
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=us&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Location lookup failed (${res.status})`);
  const rows = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  const hit = rows[0];
  if (!hit) return null;
  const out = { lat: Number(hit.lat), lng: Number(hit.lon), display: hit.display_name };
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...cache, [q]: out }));
  } catch {
    /* cache is a convenience only */
  }
  return out;
}
