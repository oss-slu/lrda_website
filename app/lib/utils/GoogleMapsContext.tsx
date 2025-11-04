"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

// Define the context shape
interface GoogleMapsContextType {
  isMapsApiLoaded: boolean;
}

// Create context with a default value
const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isMapsApiLoaded: false,
});

// Create a custom hook to use the GoogleMaps context
export const useGoogleMaps = () => useContext(GoogleMapsContext);

interface GoogleMapsProviderProps {
  children: ReactNode;
}

const GOOGLE_MAP_LIBRARIES = ["places", "marker"] as const;

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ children }) => {
  const [isMapsApiLoaded, setIsMapsApiLoaded] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_MAP_KEY || "",
    libraries: GOOGLE_MAP_LIBRARIES,
    mapIds: [process.env.NEXT_PUBLIC_MAP_ID || ""],
    id: "google-map-script",
  });

  useEffect(() => {
    setIsMapsApiLoaded(isLoaded);
  }, [isLoaded]);

  return <GoogleMapsContext.Provider value={{ isMapsApiLoaded }}>{children}</GoogleMapsContext.Provider>;
};
