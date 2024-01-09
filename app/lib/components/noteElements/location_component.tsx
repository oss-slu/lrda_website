"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Compass, MapPin } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/tooltip";

// Including onLocationChange in the props interface
interface LocationPickerProps {
  long?: string;
  lat?: string;
  onLocationChange: (newLongitude: number, newLatitude: number) => void; // This is the callback function
}

const mapAPIKey = process.env.NEXT_PUBLIC_MAP_KEY || "";

export default function LocationPicker({
  long,
  lat,
  onLocationChange, // Destructuring the onLocationChange from props
}: LocationPickerProps) {
  const [longitude, setLongitude] = useState<number>(0);
  const [latitude, setLatitude] = useState<number>(0);
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: mapAPIKey,
  });

  const handleGetCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
          const newLongitude = position.coords.longitude;
          const newLatitude = position.coords.latitude;
          setLongitude(newLongitude);
          setLatitude(newLatitude);
          onLocationChange(newLongitude, newLatitude); // Notify parent about the change
        },
        () => {
          console.log("Error fetching location");
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  }, [onLocationChange]); // Adding onLocationChange to dependency array

  const onMarkerDragEnd = (event: google.maps.MapMouseEvent) => {
    const newLat = event?.latLng?.lat() || 0;
    const newLng = event?.latLng?.lng() || 0;
    setLatitude(newLat);
    setLongitude(newLng);
    onLocationChange(newLng, newLat); // Notify parent component about the change
  };

  useEffect(() => {
    const validLong = long && !isNaN(parseFloat(long)) && parseFloat(long) !== 0;
    const validLat = lat && !isNaN(parseFloat(lat)) && parseFloat(lat) !== 0;

    if (validLong && validLat) {
      setLongitude(parseFloat(long));
      setLatitude(parseFloat(lat));
    }
    if (lat == "0" || long == "0" || long == "" || lat == "") {
      handleGetCurrentLocation();
    }
  }, [long, lat, handleGetCurrentLocation]); 
  
  return (
    <div className="flex flex-row items-center p-2 h-9 min-w-[90px] max-w-[280px] shadow-sm rounded-md border border-border bg-white">
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center justify-start w-full h-full text-sm">
            <MapPin aria-label="map pin" className="mr-2 h-5 w-5" />
            <div>
              {longitude.toPrecision(8)}
              {"_"}
            </div>
            <div>{latitude.toPrecision(8)}</div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="z-30">
          <div className="flex justify-center items-center w-96 h-96 bg-white shadow-lg rounded-md">
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
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleGetCurrentLocation}
              aria-label="compass"
              className="h-9 flex justify-center items-center cursor-pointer"
            >
              <Compass className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to set as current location.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}