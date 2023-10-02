import React, { useState } from 'react';
import ApiService from '../lib/utils/ApiService';

const SearchBar = () => {
  const [searchText, setSearchText] = useState('');

  const handleSearch = async () => {
    try {
      const response = await ApiService.searchMessages(searchText);
      console.log('API Response:', response);
    } catch (error) {
      console.error('API Error:', error);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <input
        type="text"
        placeholder="Search..."
        className="border border-gray-300 rounded-md p-2"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        onClick={handleSearch}
      >
        Search
      </button>
    </div>
  );
};

export default SearchBar;




