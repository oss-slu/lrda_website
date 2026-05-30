import { useState, useRef, useCallback, useEffect } from 'react';

interface PlacesResult {
  address: string;
  lat: number;
  lng: number;
}

export function usePlacesAutocomplete(isLoaded: boolean) {
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [loading, setLoading] = useState(false);

  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    if (isLoaded && window.google?.maps?.places) {
      if (!autocompleteServiceRef.current) {
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      }
      if (!placesServiceRef.current) {
        placesServiceRef.current = new window.google.maps.places.PlacesService(
          document.createElement('div'),
        );
      }
    }
  }, [isLoaded]);

  const search = useCallback((query: string) => {
    if (query.length <= 2 || !autocompleteServiceRef.current) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    autocompleteServiceRef.current.getPlacePredictions(
      { input: query },
      (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
        } else {
          setSuggestions([]);
        }
        setLoading(false);
      },
    );
  }, []);

  const selectPlace = useCallback(
    (placeId: string, onResult: (result: PlacesResult) => void) => {
      if (!placesServiceRef.current) return;
      placesServiceRef.current.getDetails({ placeId }, (result, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && result?.geometry?.location) {
          onResult({
            address: result.formatted_address || '',
            lat: result.geometry.location.lat(),
            lng: result.geometry.location.lng(),
          });
        }
      });
    },
    [],
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return { suggestions, loading, search, selectPlace, clearSuggestions };
}
