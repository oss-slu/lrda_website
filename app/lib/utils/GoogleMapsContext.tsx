"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

// Define the context shape
interface GoogleMapsContextType {
  isMapsApiLoaded: boolean;
}

// Create context with a default value
const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isMapsApiLoaded: false,
});

const GOOGLE_MAPS_LIBRARIES: Array<'places' | 'maps'> = ['places', 'maps'];

// Create a custom hook to use the GoogleMaps context
export const useGoogleMaps = () => useContext(GoogleMapsContext);

interface GoogleMapsProviderProps {
  children: ReactNode;
}

// Create the provider component
export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ children }) => {
  const [isMapsApiLoaded, setIsMapsApiLoaded] = useState(false);
  
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_MAP_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
    id: 'google-map-script',
  });

  useEffect(() => {
    setIsMapsApiLoaded(isLoaded);
  }, [isLoaded]);

  return (
    <GoogleMapsContext.Provider value={{ isMapsApiLoaded }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};
