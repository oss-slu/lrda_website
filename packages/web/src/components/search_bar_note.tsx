import { useState } from 'react';
import SearchBarUI from './search_bar_ui';

type SearchBarNotesProps = {
  onSearch: (query: string) => void;
};

export default function SearchBarNotes({ onSearch }: SearchBarNotesProps) {
  const [searchText, setSearchText] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchText(query);
    onSearch(query);
  };

  const handleClear = () => {
    setSearchText('');
    onSearch('');
  };

  return (
    <SearchBarUI
      searchText={searchText}
      onInputChange={handleInputChange}
      onClear={handleClear}
    />
  );
}
