import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

type SearchBarUIProps = {
  searchText: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string; //accepts className as prop
};

class SearchBarUI extends React.Component<SearchBarUIProps> {
  render() {
    const { searchText, onInputChange, onFocus, onBlur, onKeyDown, className } = this.props;

    return (
      <div className='flex w-full flex-col'>
        <div className='relative w-full'>
          <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'>
            <Search className='h-4 w-4 text-gray-400 md:h-5 md:w-5 xl:h-6 xl:w-6' />
          </span>
          <Input
            type='text'
            placeholder='Search...'
            className='w-full rounded-full border-2 border-gray-300 bg-white py-2 pl-10 pr-4 text-sm shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-300 sm:py-3 sm:text-base md:h-10 md:text-lg xl:h-12'
            value={searchText}
            onChange={onInputChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
          />
        </div>
      </div>
    );
  }
}

export default SearchBarUI;
