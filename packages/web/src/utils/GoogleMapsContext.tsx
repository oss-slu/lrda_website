import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

interface GoogleMapsContextType {
  isMapsApiLoaded: boolean;
  requestLoad: () => void;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isMapsApiLoaded: false,
  requestLoad: () => {},
});

/**
 * Returns { isMapsApiLoaded } and triggers Google Maps script loading on mount.
 * The script only loads when a component calling this hook mounts, so pages
 * without maps never pay the ~200KB cost.
 */
export function useGoogleMaps() {
  const { isMapsApiLoaded, requestLoad } = useContext(GoogleMapsContext);

  useEffect(() => {
    requestLoad();
  }, [requestLoad]);

  return { isMapsApiLoaded };
}

const GOOGLE_MAPS_LIBRARIES: ('places' | 'marker')[] = ['places', 'marker'];

/**
 * Internal component that loads the Google Maps JS API.
 * Only rendered on the client to avoid SSR issues with useJsApiLoader.
 */
function GoogleMapsLoader({ setLoaded }: { setLoaded: (v: boolean) => void }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_MAP_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
    mapIds: [import.meta.env.VITE_MAP_ID || ''],
    id: 'google-map-script',
  });

  useEffect(() => {
    setLoaded(isLoaded);
  }, [isLoaded, setLoaded]);

  return null;
}

/**
 * Provides Google Maps loading state to the component tree.
 * The Maps JS API is lazily loaded -- the ~200KB script is only fetched
 * when a descendant component calls useGoogleMaps().
 */
export const GoogleMapsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isMapsApiLoaded, setIsMapsApiLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const requestLoad = useCallback(() => {
    setShouldLoad(true);
  }, []);

  const value = useMemo(() => ({ isMapsApiLoaded, requestLoad }), [isMapsApiLoaded, requestLoad]);

  return (
    <GoogleMapsContext.Provider value={value}>
      {isClient && shouldLoad && <GoogleMapsLoader setLoaded={setIsMapsApiLoaded} />}
      {children}
    </GoogleMapsContext.Provider>
  );
};
