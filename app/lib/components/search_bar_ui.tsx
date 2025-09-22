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
        <div className="relative w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search className="w-4 h-4 md:w-5 md:h-5 xl:w-6 xl:h-6 text-gray-400" />
          </span>
          <Input
            type="text"
            placeholder="Search..."
            className="border-2 border-gray-300 focus:border-blue-500 rounded-full py-2 pl-10 pr-4 w-full bg-white shadow-sm md:h-10 xl:h-12 transition-all focus:ring-2 focus:ring-blue-300 outline-none text-sm sm:text-base md:text-lg sm:py-3"
            value={searchText}
            onChange={onInputChange}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </div>
      </div>
    );
  }
}

export default SearchBarUI;
