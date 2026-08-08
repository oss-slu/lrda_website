import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { MapPin, StickyNote } from 'lucide-react';
import SearchBarUI from './search_bar_ui';
import { Note } from '@/types';
import { Card } from '@/components/ui/card';
import { usePlacesAutocomplete, type PlaceSuggestion } from '@/hooks/usePlacesAutocomplete';

type CombinedResult =
  | (PlaceSuggestion & { type: 'suggestion' })
  | (Note & { type: 'note' });

interface SearchBarMapProps {
  onSearch: (address: string, lat?: number, lng?: number, isNoteClick?: boolean) => void;
  onNotesSearch: (searchText: string) => void;
  filteredNotes: Note[];
}

const LISTBOX_ID = 'map-search-listbox';

const SearchBarMap: React.FC<SearchBarMapProps> = ({ onSearch, onNotesSearch, filteredNotes }) => {
  const [searchText, setSearchText] = useState('');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchTextRef = useRef('');
  const prevSearchTextRef = useRef('');

  const { suggestions, loading, search, selectPlace, clearSuggestions } = usePlacesAutocomplete();

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
    setActiveIndex(-1);
  }, []);

  const combinedResults = useMemo((): CombinedResult[] => {
    const typedLocation: CombinedResult[] =
      searchText ?
        [
          {
            description: searchText,
            place_id: 'typed-location',
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
        .filter(note => note.title)
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

  useEffect(() => {
    setActiveIndex(-1);
  }, [searchText]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setIsDropdownVisible(true);
          setActiveIndex(prev => (prev < combinedResults.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Escape':
          setIsDropdownVisible(false);
          setActiveIndex(-1);
          break;
        case 'Enter':
          event.preventDefault();
          if (activeIndex >= 0 && activeIndex < combinedResults.length) {
            handleResultClick(combinedResults[activeIndex]!);
            setActiveIndex(-1);
          } else {
            const typedLocation = searchTextRef.current.trim();
            if (typedLocation) {
              onSearch(typedLocation);
              setIsDropdownVisible(false);
            }
          }
          break;
      }
    },
    [onSearch, activeIndex, combinedResults, handleResultClick],
  );

  const activeOptionId = activeIndex >= 0 ? `map-search-option-${activeIndex}` : undefined;

  return (
    <div className='relative flex w-full flex-col'>
      <SearchBarUI
        searchText={searchText}
        onInputChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        ariaExpanded={isDropdownVisible && combinedResults.length > 0}
        ariaControls={LISTBOX_ID}
        ariaActiveDescendant={activeOptionId}
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
              <div role='listbox' id={LISTBOX_ID} className='divide-y'>
                {combinedResults.map((result, index) => {
                  const isSuggestion = result.type === 'suggestion';
                  const key = isSuggestion ? result.place_id : result.id;
                  const displayText = isSuggestion ? result.description : result.title;
                  const optionId = `map-search-option-${index}`;

                  return (
                    <button
                      key={key}
                      id={optionId}
                      role='option'
                      aria-selected={index === activeIndex}
                      className={`hover:bg-accent flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                        index === activeIndex ? 'bg-accent' : ''
                      }`}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => handleResultClick(result)}
                      onMouseEnter={() => setActiveIndex(index)}
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
