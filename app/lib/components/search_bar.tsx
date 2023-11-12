'use client'
import React, { useState } from 'react';
import ApiService from '../utils/api_service';
import { Button } from "@/components/ui/button";

const SearchBar = () => {
  const [searchText, setSearchText] = typeof window !== 'undefined' ? useState('') : [''];

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

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      // If Enter key is pressed, trigger the search
      handleSearch();
    }
  };

  

  return (
    <div className="flex items-center space-x-4">
      <input
        type="text"
        placeholder="Search..."
        className="border border-gray-300 rounded-md p-2 text-black"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onKeyPress={handleKeyPress} 
      />
      <Button
        onClick={handleSearch}
        data-testid="search-button"
        
      >
        Search
      </Button>
    </div>
  );
};

export default SearchBar;




