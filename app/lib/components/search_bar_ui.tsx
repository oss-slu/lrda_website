import React, {useRef, useEffect} from "react";
import { Input } from "@/components/ui/input";

import introJs from "intro.js"
import "intro.js/introjs.css" //look how to get this stuff on the map page

type SearchBarUIProps = {
  searchText: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const searchBarRef = useRef<HTMLButtonElement>(null);

class SearchBarUI extends React.Component<SearchBarUIProps> {
  render() {
    const { searchText, onInputChange } = this.props;

    useEffect(() => {
      if (searchBarRef.current) {
        const intro = introJs();
        intro.setOptions({
          steps: [
            {
              element: searchBarRef.current,  // Target the login button
              intro: "Click here to search."
            }
            
          ],
          showProgress: true,  // Option to show progress bar
          scrollToElement: true,  // Automatically scroll to element
        });
        
        intro.start();  // Start the intro tour
      }
    }, []);

    return (
      <div className="flex flex-col w-full">
        <Input
          ref = {searchBarRef}
          type="text"
          placeholder="🔍 Search..."
          className="border-2 border-gray-300 focus:border-blue-500 rounded-full py-2 px-4 w-full bg-white shadow-sm transition-all focus:ring-2 focus:ring-blue-300 outline-none"
          value={searchText}
          onChange={onInputChange}
        />
      </div>
    );
  }
}

export default SearchBarUI;
