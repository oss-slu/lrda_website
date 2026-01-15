'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapPin, StickyNote } from 'lucide-react';
import SearchBarUI from './search_bar_ui';
import { Note, CombinedResult } from '../../types';
import { Card } from '@/components/ui/card';

declare global {
  interface Window {
    google: typeof google;
  }
}

interface SearchBarMapProps {
  onSearch: (address: string, lat?: number, lng?: number, isNoteClick?: boolean) => void;
  onNotesSearch: (searchText: string) => void;
  isLoaded: boolean;
  filteredNotes: Note[];
}

const SearchBarMap: React.FC<SearchBarMapProps> = ({
  onSearch,
  onNotesSearch,
  isLoaded,
  filteredNotes,
}) => {
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const prevSearchTextRef = useRef('');

  // Initialize autocomplete service when Google Maps API is loaded
  useEffect(() => {
    if (isLoaded && window.google?.maps?.places && !autocompleteServiceRef.current) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
    }
  }, [isLoaded]);

  // Handle predictions callback
  const handlePredictions = useCallback(
    (
      predictions: google.maps.places.AutocompletePrediction[] | null,
      status: google.maps.places.PlacesServiceStatus,
    ) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        setSuggestions(predictions);
      } else {
        setSuggestions([]);
      }
      setLoading(false);
    },
    [],
  );

  // Handle place details callback
  const handlePlaceDetails = useCallback(
    (
      result: google.maps.places.PlaceResult | null,
      status: google.maps.places.PlacesServiceStatus,
    ) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && result?.geometry?.location) {
        const lat = result.geometry.location.lat();
        const lng = result.geometry.location.lng();
        onSearch(result.formatted_address || '', lat, lng);
        setSearchText(result.formatted_address || '');
        setSuggestions([]);
        setIsDropdownVisible(false);
      }
    },
    [onSearch],
  );

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      prevSearchTextRef.current = searchText;
      setSearchText(query);
      setIsDropdownVisible(true);
      setLoading(true);

      if (query.length > 2 && autocompleteServiceRef.current) {
        autocompleteServiceRef.current.getPlacePredictions({ input: query }, handlePredictions);
        onNotesSearch(query);
      } else {
        setSuggestions([]);
        setLoading(false);
        if (query.length === 0 && prevSearchTextRef.current.length > 0) {
          onSearch('');
          onNotesSearch('');
        }
      }
    },
    [searchText, onSearch, onNotesSearch, handlePredictions],
  );

  // Handle Enter key press
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        const typedLocation = searchText.trim();
        if (typedLocation) {
          onSearch(typedLocation);
          setIsDropdownVisible(false);
        }
      }
    },
    [searchText, onSearch],
  );

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback(
    (placeId: string) => {
      if (isLoaded && window.google?.maps?.places) {
        const placesService = new window.google.maps.places.PlacesService(
          document.createElement('div'),
        );
        placesService.getDetails({ placeId }, handlePlaceDetails);
      }
    },
    [isLoaded, handlePlaceDetails],
  );

  // Handle note selection
  const handleNoteSelection = useCallback(
    (note: CombinedResult) => {
      if (note.type === 'note') {
        const lat = parseFloat(note.latitude);
        const lng = parseFloat(note.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          onSearch(note.title, lat, lng, true);
          setSearchText(note.title);
          setIsDropdownVisible(false);
        }
      }
    },
    [onSearch],
  );

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsDropdownVisible(true);
  }, []);

  // Handle blur
  const handleBlur = useCallback(() => {
    // Hide dropdown after a slight delay to allow clicks on suggestions
    setTimeout(() => setIsDropdownVisible(false), 200);
  }, []);

  // Compute combined results
  const combinedResults = useMemo((): CombinedResult[] => {
    // Add typed location at the top of the combined list
    const typedLocation =
      searchText ?
        [
          {
            description: searchText,
            place_id: 'typed-location',
            matched_substrings: [],
            structured_formatting: {
              main_text: searchText,
              main_text_matched_substrings: [],
              secondary_text: '',
            },
            terms: [],
            types: [],
            type: 'suggestion' as const,
          },
        ]
      : [];

    const results: CombinedResult[] = [
      ...typedLocation,
      ...suggestions.map(s => ({
        ...s,
        type: 'suggestion' as const,
      })),
      ...filteredNotes
        .filter(note => note && note.title)
        .map(note => ({
          ...note,
          type: 'note' as const,
        })),
    ];

    // Sort combined results alphabetically
    results.sort((a, b) => {
      const textA =
        'description' in a ? a.description || ''
        : a.title && typeof a.title === 'string' ? a.title
        : '';
      const textB =
        'description' in b ? b.description || ''
        : b.title && typeof b.title === 'string' ? b.title
        : '';
      return textA.localeCompare(textB);
    });

    return results;
  }, [searchText, suggestions, filteredNotes]);

  // Handle result click
  const handleResultClick = useCallback(
    (result: CombinedResult) => {
      if (result.type === 'suggestion') {
        if (result.place_id === 'typed-location') {
          onSearch(result.description);
          setSearchText(result.description);
          setIsDropdownVisible(false);
        } else {
          handleSelectSuggestion(result.place_id);
        }
      } else {
        handleNoteSelection(result);
      }
    },
    [onSearch, handleSelectSuggestion, handleNoteSelection],
  );

  return (
    <div className='relative flex w-full flex-col'>
      <SearchBarUI
        searchText={searchText}
        onInputChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className='rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
      />
      {isDropdownVisible && (
        <div className='absolute top-full z-50 mt-2 w-full'>
          <Card className='max-h-60 overflow-auto border-2 shadow-xl'>
            {loading && (
              <div className='flex items-center gap-2 px-4 py-3 text-muted-foreground'>
                <div className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                <span className='text-sm'>Searching...</span>
              </div>
            )}
            {!loading && combinedResults.length > 0 && (
              <div className='divide-y'>
                {combinedResults.map(result => {
                  const isSuggestion = result.type === 'suggestion';
                  const key = isSuggestion ? result.place_id : result.id;
                  const displayText = isSuggestion ? result.description : result.title;

                  return (
                    <button
                      key={key}
                      className='flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-accent'
                      onClick={() => handleResultClick(result)}
                      type='button'
                    >
                      {isSuggestion ?
                        <MapPin className='h-4 w-4 flex-shrink-0 text-muted-foreground' />
                      : <StickyNote className='h-4 w-4 flex-shrink-0 text-primary' />}
                      <span className='truncate'>{displayText}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {!loading && combinedResults.length === 0 && searchText.length > 2 && (
              <div className='px-4 py-3 text-center text-sm text-muted-foreground'>
                No results found
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default SearchBarMap;
