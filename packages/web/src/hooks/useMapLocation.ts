import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { Location } from '../utils/mapUtils';

const DEFAULT_LOCATION: Location = { lat: 38.637334, lng: -90.286021 };
const DEFAULT_ZOOM = 10;

interface UseMapLocationProps {
  mapRef: React.MutableRefObject<google.maps.Map | null>;
  locationFound: boolean;
  setMapCenter: (center: Location) => void;
  setMapZoom: (zoom: number) => void;
  setLocationFound: (found: boolean) => void;
}

export function useMapLocation({
  mapRef,
  locationFound,
  setMapCenter,
  setMapZoom,
  setLocationFound,
}: UseMapLocationProps) {
  // Set initial position from localStorage or default, then save
  // current geolocation in the background for next visit.
  useEffect(() => {
    if (locationFound) return;

    let center = DEFAULT_LOCATION;
    try {
      const saved = localStorage.getItem('LastLocation');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
          center = parsed;
        }
      }
    } catch {
      // Corrupted localStorage entry -- use default
    }

    setMapCenter(center);
    setMapZoom(DEFAULT_ZOOM);
    setLocationFound(true);

    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      position => {
        const loc: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        localStorage.setItem('LastLocation', JSON.stringify(loc));
        if (!cancelled) {
          setMapCenter(loc);
          mapRef.current?.panTo(loc);
        }
      },
      () => {},
    );

    return () => {
      cancelled = true;
    };
  }, [locationFound, setMapCenter, setMapZoom, setLocationFound, mapRef]);

  const handleSetLocation = useCallback(() => {
    toast('Fetching Location', {
      description: 'Getting your location. This can take a second.',
      duration: 3000,
    });

    navigator.geolocation.getCurrentPosition(
      position => {
        const loc: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setMapCenter(loc);
        mapRef.current?.panTo(loc);
        mapRef.current?.setZoom(13);
        localStorage.setItem('LastLocation', JSON.stringify(loc));
      },
      error => {
        console.error('Failed to get location:', error);
      },
    );
  }, [setMapCenter, mapRef]);

  return { handleSetLocation };
}
