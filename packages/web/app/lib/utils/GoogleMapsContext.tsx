import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

interface GoogleMapsContextType {
  isMapsApiLoaded: boolean;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isMapsApiLoaded: false,
});

export const useGoogleMaps = () => useContext(GoogleMapsContext);

interface GoogleMapsProviderProps {
  children: ReactNode;
}

const GOOGLE_MAPS_LIBRARIES: ('places' | 'marker')[] = ['places', 'marker'];

/**
 * Internal component that loads the Google Maps JS API.
 * Only rendered on the client to avoid SSR issues with useJsApiLoader.
 */
function GoogleMapsLoader({ setLoaded }: { setLoaded: (v: boolean) => void }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.NEXT_PUBLIC_MAP_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
    mapIds: [import.meta.env.NEXT_PUBLIC_MAP_ID || ''],
    id: 'google-map-script',
  });

  useEffect(() => {
    setLoaded(isLoaded);
  }, [isLoaded, setLoaded]);

  return null;
}

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ children }) => {
  const [isMapsApiLoaded, setIsMapsApiLoaded] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <GoogleMapsContext.Provider value={{ isMapsApiLoaded }}>
      {isClient && <GoogleMapsLoader setLoaded={setIsMapsApiLoaded} />}
      {children}
    </GoogleMapsContext.Provider>
  );
};
