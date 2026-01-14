/**
 * Location cache utility to avoid redundant geocoding API calls
 * Shared across all components that need to fetch location data
 */

// Location cache: Key: "lat,lng" string, Value: location string or "Location not found"
const locationCache = new Map<string, string>();

/**
 * Helper function to create a cache key from coordinates
 * Rounds to 6 decimal places (~0.1m precision) to cache nearby coordinates together
 */
const getCacheKey = (lat: number, lng: number): string => {
  return `${lat.toFixed(6)},${lng.toFixed(6)}`;
};

/**
 * Fetches location from cache or API
 * @param lat - Latitude
 * @param lng - Longitude
 * @param apiKey - Google Maps API key
 * @returns Promise<string> - Location string or "Location not found" or empty string
 */
export const getCachedLocation = async (
  lat: number,
  lng: number,
  apiKey: string,
): Promise<string> => {
  // Validate coordinates
  if (isNaN(lat) || isNaN(lng)) {
    return '';
  }

  // Check cache first
  const cacheKey = getCacheKey(lat, lng);
  const cachedLocation = locationCache.get(cacheKey);

  if (cachedLocation !== undefined) {
    // Use cached location
    return cachedLocation;
  }

  // Not in cache, fetch from API
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`,
    );

    const data = await response.json();

    // Use the first result's formatted_address
    const loc = data.results?.[0]?.formatted_address;
    if (loc) {
      // Cache the successful result
      locationCache.set(cacheKey, loc);
      return loc;
    } else {
      // Cache "Location not found" to avoid repeated API calls for invalid coordinates
      const notFound = 'Location not found';
      locationCache.set(cacheKey, notFound);
      return notFound;
    }
  } catch (error) {
    // Silently handle errors - location not found is expected for some coordinates
    // Cache "Location not found" to avoid repeated failed API calls
    const notFound = 'Location not found';
    locationCache.set(cacheKey, notFound);
    return notFound;
  }
};

/**
 * Clears the location cache (useful for testing or manual cache invalidation)
 */
export const clearLocationCache = (): void => {
  locationCache.clear();
};

/**
 * Gets the current cache size (useful for debugging)
 */
export const getCacheSize = (): number => {
  return locationCache.size;
};
