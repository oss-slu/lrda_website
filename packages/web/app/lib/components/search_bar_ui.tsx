import React from 'react';
import { Search, X } from 'lucide-react';

type SearchBarUIProps = {
  searchText: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
  placeholder?: string;
};

const SearchBarUI: React.FC<SearchBarUIProps> = ({
  searchText,
  onInputChange,
  onClear,
  onFocus,
  onBlur,
  onKeyDown,
  placeholder = 'Search notes...',
}) => {
  const isActive = searchText.length > 0;

  return (
    <div className='relative w-full'>
      <Search
        className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${
          isActive ? 'text-blue-500' : 'text-muted-foreground'
        }`}
      />
      <input
        type='text'
        placeholder={placeholder}
        className={`h-10 w-full rounded-full border bg-white pl-10 pr-10 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 md:h-11 md:text-base ${
          isActive ? 'border-blue-300 bg-blue-50/50' : 'border-border'
        }`}
        value={searchText}
        onChange={onInputChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
      {isActive && onClear && (
        <button
          type='button'
          onClick={onClear}
          className='absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600'
          aria-label='Clear search'
        >
          <X className='h-4 w-4' />
        </button>
      )}
    </div>
  );
};

export default SearchBarUI;
