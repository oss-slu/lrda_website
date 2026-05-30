import React, { useState, useRef, useMemo, useCallback } from 'react';
import { MapPin, StickyNote } from 'lucide-react';
import SearchBarUI from './search_bar_ui';
import { Note } from '@/types';
import { Card } from '@/components/ui/card';
import { usePlacesAutocomplete } from '@/hooks/usePlacesAutocomplete';

type CombinedResult =
  | (google.maps.places.AutocompletePrediction & { type: 'suggestion' })
  | (Note & { type: 'note' });

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
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const searchTextRef = useRef('');
  const prevSearchTextRef = useRef('');

  const { suggestions, loading, search, selectPlace, clearSuggestions } =
    usePlacesAutocomplete(isLoaded);

  searchTextRef.current = searchText;

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      const prevText = prevSearchTextRef.current;
      prevSearchTextRef.current = query;
      setSearchText(query);
      setIsDropdownVisible(true);

      search(query);

      if (query.length > 2) {
        onNotesSearch(query);
      } else if (query.length === 0 && prevText.length > 0) {
        onSearch('');
        onNotesSearch('');
      }
    },
    [onSearch, onNotesSearch, search],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        const typedLocation = searchTextRef.current.trim();
        if (typedLocation) {
          onSearch(typedLocation);
          setIsDropdownVisible(false);
        }
      }
    },
    [onSearch],
  );

  const handleResultClick = useCallback(
    (result: CombinedResult) => {
      if (result.type === 'suggestion') {
        if (result.place_id === 'typed-location') {
          onSearch(result.description);
          setSearchText(result.description);
          setIsDropdownVisible(false);
        } else {
          selectPlace(result.place_id, ({ address, lat, lng }) => {
            onSearch(address, lat, lng);
            setSearchText(address);
            clearSuggestions();
            setIsDropdownVisible(false);
          });
        }
      } else if (result.latitude != null && result.longitude != null) {
        onSearch(result.title, result.latitude, result.longitude, true);
        setSearchText(result.title);
        setIsDropdownVisible(false);
      }
    },
    [onSearch, selectPlace, clearSuggestions],
  );

  const handleFocus = useCallback(() => {
    setIsDropdownVisible(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsDropdownVisible(false);
  }, []);

  const combinedResults = useMemo((): CombinedResult[] => {
    const typedLocation: CombinedResult[] =
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

  return (
    <div className='relative flex w-full flex-col'>
      <SearchBarUI
        searchText={searchText}
        onInputChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className='rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none'
      />
      {isDropdownVisible && (
        <div className='absolute top-full z-50 mt-2 w-full'>
          <Card className='max-h-60 overflow-auto border-2 shadow-xl'>
            {loading && (
              <div className='text-muted-foreground flex items-center gap-2 px-4 py-3'>
                <div className='border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent' />
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
                      className='hover:bg-accent flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors'
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => handleResultClick(result)}
                      type='button'
                    >
                      {isSuggestion ?
                        <MapPin className='text-muted-foreground h-4 w-4 shrink-0' />
                      : <StickyNote className='text-primary h-4 w-4 shrink-0' />}
                      <span className='truncate'>{displayText}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {!loading && combinedResults.length === 0 && searchText.length > 2 && (
              <div className='text-muted-foreground px-4 py-3 text-center text-sm'>
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
