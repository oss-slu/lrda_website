"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { MapPin, Compass, X } from "lucide-react"; // Import MapPin and Compass icons
import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/tooltip";
import { useGoogleMaps } from "../../utils/GoogleMapsContext";
import SearchBarMap from "../search_bar_map";

interface LocationPickerProps {
  long?: string;
  lat?: string;
  onLocationChange: (newLongitude: number, newLatitude: number) => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  long,
  lat,
  onLocationChange,
}) => {
  const [longitude, setLongitude] = useState<number>(0);
  const [latitude, setLatitude] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState(false); 
  const mapRef = useRef<google.maps.Map>();
  const isLoaded = useGoogleMaps();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const searchBarRef = useRef<HTMLInputElement | null>(null);

  // Update map center when latitude or longitude changes
  useEffect(() => {
    if (mapRef.current && latitude && longitude) {
      const newCenter = new google.maps.LatLng(latitude, longitude);
      mapRef.current.panTo(newCenter);
      mapRef.current.setZoom(10);
    }
  }, [latitude, longitude]);

  // Handle getting the current geolocation
  const handleGetCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLongitude = position.coords.longitude;
          const newLatitude = position.coords.latitude;
          setLongitude(newLongitude);
          setLatitude(newLatitude);
          onLocationChange(newLongitude, newLatitude);
        },
        () => console.log("Error fetching location")
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  }, [onLocationChange]);

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
    }
  };
  
  const handleToggleMap = () => {
    setIsExpanded(!isExpanded);
  };

  useEffect (() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mapContainerRef.current && 
        !mapContainerRef.current.contains(event.target as Node) &&
        searchBarRef.current &&
        !searchBarRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false); //closes map
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      <button
        onClick={handleToggleMap}
        className="flex items-center justify-start w-full text-sm p-2"
      >
        <MapPin aria-label="map pin" className="mx-2 h-5 w-5" />
        <div>Location</div>
      </button>
      
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75">
          <div className="absolute top-2 left-2 z-50">
            <button
              onClick={handleToggleMap}
              className="text-xl text-black bg-white rounded-full p-2 shadow-md hover:bg-gray-200"
            >
              <X />
            </button>
          </div>

          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-4/5 md:w-2/5 z-60">
            <SearchBarMap
              onSearch={handleSearch}
              isLoaded={isLoaded !== null}
              onNotesSearch={() => {}}
              filteredNotes={[]}
            />
          </div>

          {isLoaded && (
            <div 
              ref={mapContainerRef}
              className="flex justify-center items-center w-full h-full absolute inset-0 z-40"
            >

              <GoogleMap
                mapContainerStyle={{
                  width: "80%",
                  height: "80%",
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
          )}
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
