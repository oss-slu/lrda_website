import { env } from '../env';

/**
 * Perform reverse geocoding using Google Maps Geocoding API.
 * Returns the first formatted address or null if unavailable.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const key = env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn('reverseGeocode request failed', res.status, res.statusText);
      return null;
    }

    const data = (await res.json()) as { results?: { formatted_address?: string }[] };
    return data.results?.[0]?.formatted_address ?? null;
  } catch (err) {
    console.error('reverseGeocode error', err);
    return null;
  }
}
