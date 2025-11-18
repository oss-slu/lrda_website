"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { MapPin, Compass, X } from "lucide-react"; // Import MapPin and Compass icons
import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";
import { GoogleMap, MarkerF, Autocomplete } from "@react-google-maps/api";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/tooltip";
import { useGoogleMaps } from "../../utils/GoogleMapsContext";
import SearchBarMap from "../search_bar_map";

interface LocationPickerProps {
  long?: string;
  lat?: string;
  onLocationChange: (newLongitude: number, newLatitude: number) => void;
  disabled?: boolean; // Whether the location picker is disabled (read-only)
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  long,
  lat,
  onLocationChange,
  disabled = false,
}) => {
  const [longitude, setLongitude] = useState<number>(0);
  const [latitude, setLatitude] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState(false); 
  const mapRef = useRef<google.maps.Map | null>(null);
  const isLoaded = useGoogleMaps();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const searchBarRef = useRef<HTMLInputElement | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null); 
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng(); 
        setLatitude(lat); 
        setLongitude(lng); 
        onLocationChange(lng, lat); 
        mapRef.current?.panTo({ lat, lng }); 
        mapRef.current?.setZoom(12); 
      }
    }
  };

  useEffect(() => {
    if (lat && long) {
      const parsedLat = parseFloat(lat);
      const parsedLong = parseFloat(long);
  
      if (!isNaN(parsedLat) && !isNaN(parsedLong)) {
        setLatitude(parsedLat);
        setLongitude(parsedLong);
      }
    }
  }, [lat, long]);
  

  // Handle getting the current geolocation
  const handleGetCurrentLocation = useCallback(() => { // this method should be used somewhere
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLongitude = position.coords.longitude;
          const newLatitude = position.coords.latitude;
          setLongitude(newLongitude);
          setLatitude(newLatitude);
          onLocationChange(newLongitude, newLatitude);
        },
        (error) => {
          console.error("Error fetching location", error);
          setGeoError("Unable to fetch your location. please check your browser settings.");
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  }, [onLocationChange]);

  {geoError && (
    <div className="absolute top-16 left-1/2 tranform -translate-x-1/2 bg-white px-4 py-2 rounded shadow text-red-600 z-50">
      {geoError}
    </div>
    )}

  // Handle search result click
  const handleSearch = (address: string, lat?: number, lng?: number) => {
    if (lat != null && lng != null) {
      setLatitude(lat);
      setLongitude(lng);
      onLocationChange(lng, lat);
      mapRef.current?.panTo({ lat, lng });
      mapRef.current?.setZoom(10);
    }
  };

  // Handle marker drag event
  const onMarkerDragEnd = (event: google.maps.MapMouseEvent) => {
    const lat = event.latLng?.lat();
    const lng = event.latLng?.lng();

    if (lat != null && lng != null) {
      setLatitude(lat);
      setLongitude(lng);
      onLocationChange(lng, lat); // Notify parent component of location change
      mapRef.current?.setZoom(12);
    }
  };
  
  const handleToggleMap = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (newState) {
      handleGetCurrentLocation(); // fetch location when map is opening
    }
  };
  // changes here

  useEffect (() => {
    // Close on Escape when expanded
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded]);

  return (
    <div className="relative">
      <button
        onClick={handleToggleMap}
        disabled={disabled}
        className={`inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors group ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        aria-label="Toggle map visibility"
      >
        <MapPin aria-label="map pin" className="h-4 w-4 text-gray-700 group-hover:text-blue-600" />
        <span>Location</span>
      </button>
      
      {isExpanded && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop closes on click */}
          <div
            className="absolute inset-0 bg-black/75"
            onClick={() => setIsExpanded(false)}
            aria-hidden="true"
          />
          
          <div className="absolute top-2 left-2 z-50">
            <button
              onClick={handleToggleMap}
              className="text-xl text-black bg-white rounded-full p-3 shadow-md hover:bg-gray-200"
              aria-label="Close map"
            >
              <X />
            </button>
          </div>

          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-4/5 md:w-2/5 z-50">
            <Autocomplete
              onLoad={(auto) => setAutocomplete(auto)}
              onPlaceChanged = {onPlaceChanged}
            >
              <input
                ref={searchBarRef}
                type="text"
                placeholder="Search Location"
                style={{ pointerEvents: "auto" }}
                className="w-full px-4 py-2 rounded shadow-md"
              />
            </Autocomplete>
          </div>

          {isLoaded && (
            <div
              className="absolute inset-0 z-40 flex justify-center items-center"
              onClick={() => setIsExpanded(false)}
            >
              {/* Map container: stop click propagation so inside clicks don't close */}
              <div
                ref={mapContainerRef}
                className="w-[80%] h-[80%]"
                onClick={(e) => e.stopPropagation()}
              >
                <GoogleMap
                  mapContainerStyle={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "8px",
                  }}
                  center={{ lat: latitude, lng: longitude }}
                  zoom={9}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                  }}
                >
                  <MarkerF
                    position={{ lat: latitude, lng: longitude }}
                    draggable={true}
                    onDragEnd={onMarkerDragEnd} // Handle marker drag event
                  />
                </GoogleMap>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default LocationPicker;