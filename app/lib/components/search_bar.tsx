"use client";
import React, { useState } from "react";
import ApiService from "../utils/api_service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

type SearchBarProps = {
  onSearch: (query: string) => void;
};

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [searchText, setSearchText] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchText(query);
    onSearch(query);
  };

  return (
    <div className="flex flex-col w-full"> 
      <div className="mb-4">
        <Input
          type="text"
          placeholder="🔍  Search..."
          className="border border-gray-300 rounded-full p-4 w-full bg-white" 
          value={searchText}
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
  
};

export default SearchBar;