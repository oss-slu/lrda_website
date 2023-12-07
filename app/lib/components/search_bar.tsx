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
    <div className="flex items-center w-min min-w-max">
      <Input
        type="text"
        placeholder="Search..."
        className="border border-gray-300 rounded-md p-2 flex-grow"
        value={searchText}
        onChange={handleInputChange}
      />
      <Button className="px-4 py-2 rounded-md" data-testid="search-button">
        <MagnifyingGlassIcon className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default SearchBar;