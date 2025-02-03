"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { MapPin, Compass } from "lucide-react"; // Import MapPin and Compass icons
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
  const mapRef = useRef<google.maps.Map>();
  const isLoaded = useGoogleMaps();

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

  return (
    <div className="flex flex-row items-center pr-6 pl-2 h-8 w-full">
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center justify-center px-12 h-full text-sm">
            <MapPin aria-label="map pin" className="mx-2 h-5 w-5" />
            <div>Location</div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="z-30">
          <div className="flex justify-center items-center w-96 h-96 bg-white shadow-lg rounded-md">
            <div className="absolute top-2 left-2 z-50">
              <SearchBarMap
                onSearch={handleSearch}
                isLoaded={isLoaded !== null}
                onNotesSearch={() => {}}
                filteredNotes={[]}
              />
            </div>
            {isLoaded && (
              <GoogleMap
                mapContainerStyle={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "calc(var(--radius) - 2px)",
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
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default LocationPicker;
