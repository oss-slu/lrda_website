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

interface LocationPickerProps {
  long?: string;
  lat?: string;
}

function getCurLocation(
  setLongitude: (value: number) => void,
  setLatitude: (value: number) => void
) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        setLongitude(position.coords.longitude);
        setLatitude(position.coords.latitude);
      },
      () => {
        console.log("Error fetching location");
      }
    );
  } else {
    console.log("Geolocation is not supported by this browser.");
  }
}

const mapAPIKey = process.env.NEXT_PUBLIC_MAP_KEY || "";

export default function LocationPicker({ long, lat }: LocationPickerProps) {
  const [longitude, setLongitude] = useState<number>(0);
  const [latitude, setLatitude] = useState<number>(0);
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: mapAPIKey,
  });

  const handleGetCurrentLocation = useCallback(() => {
    getCurLocation(setLongitude, setLatitude);
  }, []);

  const onMarkerDragEnd = (event: google.maps.MapMouseEvent) => {
    setLatitude(event?.latLng?.lat() || 0);
    setLongitude(event?.latLng?.lng() || 0);
  };

  useEffect(() => {
    const validLong =
      long && !isNaN(parseFloat(long)) && parseFloat(long) !== 0;
    const validLat = lat && !isNaN(parseFloat(lat)) && parseFloat(lat) !== 0;

    if (validLong && validLat) {
      setLongitude(parseFloat(long));
      setLatitude(parseFloat(lat));
    }
    console.log("lat: ", lat);
    if (lat == "0" || long == "0" || long == "" || lat == "") {
      handleGetCurrentLocation();
    }
  }, [long, lat]);

  return (
    <div className="flex flex-row items-center p-2 h-9 min-w-[90px] max-w-[280px] shadow-sm rounded-md border border-border bg-white">
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center justify-start w-full h-full text-sm">
            <MapPin className="mr-2 h-5 w-5" />
            <text>
              {longitude.toPrecision(8)}
              {"_"}
            </text>
            <text>{latitude.toPrecision(8)}</text>
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
            <div
              onClick={handleGetCurrentLocation}
              className="h-9 flex justify-center items-center cursor-pointer"
            >
              <Compass className="h-5 w-5" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to set as current location.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}