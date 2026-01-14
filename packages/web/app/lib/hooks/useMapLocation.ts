'use client';

import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { getItem, setItem } from '../utils/local_storage';

interface Location {
  lat: number;
  lng: number;
}

const DEFAULT_LOCATION: Location = { lat: 38.637334, lng: -90.286021 };
const DEFAULT_ZOOM = 10;

interface UseMapLocationProps {
  mapRef: React.MutableRefObject<google.maps.Map | null>;
  locationFound: boolean;
  setMapCenter: (center: Location) => void;
  setMapZoom: (zoom: number) => void;
  setLocationFound: (found: boolean) => void;
}

/**
 * Hook to manage map location - fetching from storage, geolocation, and manual location setting.
 */
export function useMapLocation({
  mapRef,
  locationFound,
  setMapCenter,
  setMapZoom,
  setLocationFound,
}: UseMapLocationProps) {
  const isSubscribedRef = useRef(true);

  // Helper to trigger map resize
  const triggerMapResize = useCallback(() => {
    setTimeout(() => {
      if (mapRef.current) {
        google.maps.event.trigger(mapRef.current, 'resize');
      }
    }, 100);
  }, [mapRef]);

  // Get current geolocation
  const getLocation = useCallback((): Promise<Location> => {
    toast('Fetching Location', {
      description: 'Getting your location. This can take a second.',
      duration: 3000,
    });

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        position => {
          const newCenter: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          resolve(newCenter);
        },
        error => {
          console.error('Error fetching location', error);
          reject(error);
        },
      );
    });
  }, []);

  // Handle manual location button click
  const handleSetLocation = useCallback(async () => {
    try {
      const newCenter = await getLocation();

      if (newCenter && typeof newCenter.lat === 'number' && typeof newCenter.lng === 'number') {
        setMapCenter(newCenter);
        mapRef.current?.panTo(newCenter);
        mapRef.current?.setZoom(13);
        triggerMapResize();
      } else {
        throw new Error('Failed to get valid coordinates from getLocation()');
      }
    } catch (error) {
      console.error('Failed to set location:', error);
    }
  }, [getLocation, setMapCenter, mapRef, triggerMapResize]);

  // Fetch last saved location on mount
  useEffect(() => {
    isSubscribedRef.current = true;

    const fetchLastLocation = async () => {
      try {
        const lastLocationString = await getItem('LastLocation');
        const lastLocation = lastLocationString ? JSON.parse(lastLocationString) : null;

        if (isSubscribedRef.current) {
          if (
            lastLocation &&
            typeof lastLocation.lat === 'number' &&
            typeof lastLocation.lng === 'number'
          ) {
            setMapCenter(lastLocation);
            setMapZoom(DEFAULT_ZOOM);
            setLocationFound(true);
            triggerMapResize();
          } else {
            setMapCenter(DEFAULT_LOCATION);
            setMapZoom(DEFAULT_ZOOM);
            setLocationFound(true);
          }
        }
      } catch (error) {
        setMapCenter(DEFAULT_LOCATION);
        setMapZoom(DEFAULT_ZOOM);
        setLocationFound(true);

        if (error instanceof Error && !error.message.includes('Invalid or missing last location')) {
          console.error('Failed to fetch the last location', error);
        }
      }
    };

    fetchLastLocation();

    return () => {
      isSubscribedRef.current = false;
    };
  }, [setMapCenter, setMapZoom, setLocationFound, triggerMapResize]);

  // Fetch current location and update if no location found yet
  useEffect(() => {
    let isComponentMounted = true;

    const fetchCurrentLocationAndUpdate = async () => {
      try {
        const currentLocation = await getLocation();

        if (
          currentLocation &&
          typeof currentLocation.lat === 'number' &&
          typeof currentLocation.lng === 'number'
        ) {
          if (!locationFound && isComponentMounted) {
            setMapCenter(currentLocation);
            setMapZoom(DEFAULT_ZOOM);
            triggerMapResize();
          }
          await setItem('LastLocation', JSON.stringify(currentLocation));
        } else {
          throw new Error('Failed to get valid coordinates from getLocation()');
        }
      } catch (error) {
        if (isComponentMounted) {
          setMapCenter(DEFAULT_LOCATION);
          setMapZoom(DEFAULT_ZOOM);
          setLocationFound(true);
          console.log('Using default location due to error:', error);
        }
      }
    };

    fetchCurrentLocationAndUpdate();

    return () => {
      isComponentMounted = false;
    };
  }, [locationFound, getLocation, setMapCenter, setMapZoom, setLocationFound, triggerMapResize]);

  return {
    handleSetLocation,
    triggerMapResize,
  };
}
