import React from 'react';
import { Search } from 'lucide-react';

type SearchBarUIProps = {
  searchText: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
};

const SearchBarUI: React.FC<SearchBarUIProps> = ({
  searchText,
  onInputChange,
  onFocus,
  onBlur,
  onKeyDown,
}) => {
  return (
    <div className='relative w-full'>
      <Search className='absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
      <input
        type='text'
        placeholder='Search places or notes...'
        className='h-10 w-full rounded-full border border-border bg-white pl-10 pr-4 text-sm shadow-lg transition-shadow placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 md:h-11 md:text-base'
        value={searchText}
        onChange={onInputChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
    </div>
  );
};

export default SearchBarUI;
