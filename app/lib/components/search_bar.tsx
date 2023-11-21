"use client";
import React, { useState } from "react";
import ApiService from "../utils/api_service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

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
      console.log("API Response:", response);
    } catch (error) {
      console.error("API Error:", error);
    }
  };

  return (

    <div className="flex items-center space-x-2">
      <input
        type="text"
        placeholder="Search..."
        className="bg-gray-800 border border-gray-700 text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 transition duration-300 ease-in-out"

        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />
      <Button
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition duration-300 ease-in-out"
        onClick={handleSearch}
        data-testid="search-button"
      >
          <MagnifyingGlassIcon className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default SearchBar;

