'use client'
import React, { useState } from 'react';
import ApiService from '../utils/api_service';
import { Button } from "@/components/ui/button"

const SearchBar = () => {
  const [searchText, setSearchText] = useState("");

  const handleSearch = async () => {
    console.log("Search text:", searchText);
    if (!searchText) {  
      console.log("Search text is empty. Aborting search.");
      return;
    }
    try {
      const response = await ApiService.searchMessages(searchText);
      console.log('API Response:', response);
    } catch (error) {
      console.error('API Error:', error);
    }
  };

  return (
    <div className="flex items-center space-x-4 min-w-300">
      <input
        type="text"
        placeholder="Search..."
        className="border border-gray-300 rounded-md p-2 text-black"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onKeyPress={handleKeyPress} 
      />
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        onClick={handleSearch}
        data-testid="search-button"
        
      >
        Search
      </Button>
    </div>
  );
};

export default SearchBar;




