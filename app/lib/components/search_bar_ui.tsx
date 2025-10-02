import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type SearchBarUIProps = {
  searchText: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  className?: string; //accepts className as prop
};

class SearchBarUI extends React.Component<SearchBarUIProps> {
  render() {
    const { searchText, onInputChange, onFocus, onBlur, className } = this.props;

    return (
      <div className="flex flex-col w-full">
        <Input
          type="text"
          placeholder="🔍 Search..."
          className="border-2 border-gray-300 focus:border-blue-500 rounded-full py-1.5 sm:py-2 px-3 sm:px-4 w-full bg-white shadow-sm transition-all focus:ring-2 focus:ring-blue-300 outline-none text-sm sm:text-base"
          value={searchText}
          onChange={onInputChange}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </div>
    );
  }
}

export default SearchBarUI;
