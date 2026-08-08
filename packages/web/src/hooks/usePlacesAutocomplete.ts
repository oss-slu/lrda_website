import { useState, useRef, useCallback, useEffect } from 'react';
import { API_URL } from '@/services/api';

export interface PlaceSuggestion {
  description: string;
  place_id: string;
}

interface PlacesResult {
  address: string;
  lat: number;
  lng: number;
}

const DEBOUNCE_MS = 300;

// Requests go through our API proxy so the Google key stays server-side.
// A session token groups the keystrokes and the final details call into one
// billed Places session; it rotates after each selection.
export function usePlacesAutocomplete() {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionTokenRef = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length <= 2) {
      abortRef.current?.abort();
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const params = new URLSearchParams({
          input: query,
          sessiontoken: sessionTokenRef.current,
        });
        const res = await fetch(`${API_URL}/api/places/autocomplete?${params}`, {
          signal: controller.signal,
        });
        const data = res.ok ? await res.json() : { suggestions: [] };
        setSuggestions(data.suggestions ?? []);
        setLoading(false);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          setSuggestions([]);
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);
  }, []);

  const selectPlace = useCallback((placeId: string, onResult: (result: PlacesResult) => void) => {
    const params = new URLSearchParams({
      place_id: placeId,
      sessiontoken: sessionTokenRef.current,
    });
    sessionTokenRef.current = crypto.randomUUID();
    fetch(`${API_URL}/api/places/details?${params}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data) {
          onResult({ address: data.address, lat: data.lat, lng: data.lng });
        }
      })
      .catch(() => {});
  }, []);

  const clearSuggestions = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    setSuggestions([]);
    setLoading(false);
  }, []);

  return { suggestions, loading, search, selectPlace, clearSuggestions };
}
