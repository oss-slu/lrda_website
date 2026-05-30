export interface Location {
  lat: number;
  lng: number;
}

export interface BoundsParams {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * Extract serializable bounding box params from a Google Maps LatLngBounds.
 * Returns null if bounds is null.
 */
export function boundsToParams(bounds: google.maps.LatLngBounds | null): BoundsParams | null {
  if (!bounds) return null;
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  return {
    minLat: sw.lat(),
    maxLat: ne.lat(),
    minLng: sw.lng(),
    maxLng: ne.lng(),
  };
}

/**
 * Snap bounding box to a grid so that small pans produce the same
 * query key and hit TanStack Query's cache instead of re-fetching.
 * The grid step is based on the viewport size -- snaps to ~25% increments
 * of the current view, so you need to pan about a quarter of the screen
 * before a new fetch triggers.
 */
export function snapBounds(bounds: BoundsParams): BoundsParams {
  const latRange = bounds.maxLat - bounds.minLat;
  const lngRange = bounds.maxLng - bounds.minLng;
  // Use a step of ~25% of the viewport, minimum 0.01 degrees
  const latStep = Math.max(0.01, latRange * 0.25);
  const lngStep = Math.max(0.01, lngRange * 0.25);
  return {
    minLat: Math.floor(bounds.minLat / latStep) * latStep,
    maxLat: Math.ceil(bounds.maxLat / latStep) * latStep,
    minLng: Math.floor(bounds.minLng / lngStep) * lngStep,
    maxLng: Math.ceil(bounds.maxLng / lngStep) * lngStep,
  };
}
