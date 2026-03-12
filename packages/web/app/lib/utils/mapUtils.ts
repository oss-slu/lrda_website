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
