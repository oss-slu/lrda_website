"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { MapPin } from "lucide-react"; // Import only the MapPin icon
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

  useEffect(() => {
    if (mapRef.current && latitude && longitude) {
      const newCenter = new google.maps.LatLng(latitude, longitude);
      mapRef.current.panTo(newCenter);
      mapRef.current.setZoom(10);
    }
  }, [latitude, longitude]);

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

  const handleSearch = (address: string, lat?: number, lng?: number) => {
    if (lat != null && lng != null) {
      setLatitude(lat);
      setLongitude(lng);
      onLocationChange(lng, lat);
      mapRef.current?.panTo({ lat, lng });
      mapRef.current?.setZoom(10);
    }
  };

  return (
    <div className="flex flex-row items-center p-2 h-9">
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center justify-start w-full h-full text-sm">
            <MapPin aria-label="map pin" className="mx-2 h-5 w-5" />
            <div>Location</div>
            {/* <div>
              {longitude.toPrecision(8)}
              {"_"}
            </div>x
            <div>{latitude.toPrecision(8)}</div> */}
          </button>
        </PopoverTrigger>
        <PopoverContent className="z-30">
          <div className="flex justify-center items-center w-96 h-96 bg-white shadow-lg rounded-md">
            <div className="absolute top-2 left-2 z-50">
              <SearchBarMap onSearch={handleSearch} isLoaded={isLoaded !== null} onNotesSearch={() => {}} filteredNotes={[]} />
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
                  onDragEnd={onMarkerDragEnd}
                />
              </GoogleMap>
            )}
          </div>
        </PopoverContent>
      </Popover>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleGetCurrentLocation}
              aria-label="compass"
              className="h-9 flex justify-center items-center cursor-pointer"
            >
              <Compass className="h-5 w-5 mx-2" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to choose a location.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default LocationPicker;
