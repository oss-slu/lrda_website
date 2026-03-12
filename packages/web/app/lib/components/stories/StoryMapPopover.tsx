import React, { useRef, useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { GoogleMap } from '@react-google-maps/api';
import { useGoogleMaps } from '../../utils/GoogleMapsContext';
import { MapPin } from 'lucide-react';

interface StoryMapPopoverProps {
  location: string;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  children?: React.ReactNode;
  className?: string;
  triggerClassName?: string;
}

export const StoryMapPopover: React.FC<StoryMapPopoverProps> = ({
  location,
  latitude,
  longitude,
  children,
  className = '',
  triggerClassName = '',
}) => {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const markerRef = useRef<any>(null);
  const { isMapsApiLoaded } = useGoogleMaps();

  const hasValidCoordinates = latitude != null && longitude != null;
  const noteLat = hasValidCoordinates ? latitude : null;
  const noteLng = hasValidCoordinates ? longitude : null;

  // Set up marker when map loads
  useEffect(() => {
    if (!mapInstance || !hasValidCoordinates || !isMapsApiLoaded) return;

    // Clear previous marker
    if (markerRef.current) {
      markerRef.current.map = null;
      markerRef.current = null;
    }

    // Create new AdvancedMarkerElement
    if ((window as any).google?.maps?.marker) {
      const google = (window as any).google;
      const position = new google.maps.LatLng(noteLat!, noteLng!);

      const pinElement = document.createElement('div');
      pinElement.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C10.477 0 6 4.477 6 10c0 8 10 22 10 22s10-14 10-22c0-5.523-4.477-10-10-10z" fill="#EA4335"/>
          <circle cx="16" cy="10" r="4" fill="white"/>
        </svg>
      `;
      pinElement.style.width = '32px';
      pinElement.style.height = '32px';
      pinElement.style.cursor = 'pointer';

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position,
        map: mapInstance,
        content: pinElement,
        title: location,
      });

      markerRef.current = marker;
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.map = null;
        markerRef.current = null;
      }
    };
  }, [isMapsApiLoaded, mapInstance, hasValidCoordinates, noteLat, noteLng, location, isMapOpen]);

  if (!hasValidCoordinates) {
    return <>{children}</>;
  }

  return (
    <Popover open={isMapOpen} onOpenChange={setIsMapOpen}>
      <PopoverTrigger asChild className={triggerClassName}>
        {children || (
          <button
            type='button'
            className='flex cursor-pointer items-center gap-2 transition-colors hover:text-gray-700'
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseDown={(e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <MapPin size={16} /> {location}
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className={`!z-[9999] h-[300px] w-[400px] p-0 ${className}`}
        style={{ zIndex: 9999 }}
        align='start'
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {isMapsApiLoaded && hasValidCoordinates ?
          <GoogleMap
            mapContainerStyle={{
              width: '100%',
              height: '100%',
              borderRadius: '8px',
            }}
            center={{ lat: noteLat!, lng: noteLng! }}
            zoom={15}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              zoomControl: true,
              mapId: import.meta.env.NEXT_PUBLIC_MAP_ID,
              mapTypeId: 'satellite',
            }}
            onLoad={(map: any) => setMapInstance(map)}
            onUnmount={() => {
              if (markerRef.current) {
                markerRef.current.map = null;
                markerRef.current = null;
              }
              setMapInstance(null);
            }}
          />
        : <div className='flex h-full w-full items-center justify-center rounded-lg bg-gray-100'>
            <p className='text-gray-500'>Loading map...</p>
          </div>
        }
      </PopoverContent>
    </Popover>
  );
};

export default StoryMapPopover;
