import React from "react";
import SearchBarUI from "./search_bar_ui";
import { Note, CombinedResult } from "../../types";
import PlaceIcon from '@mui/icons-material/Place';
import ImageIcon from '@mui/icons-material/Image';

declare global {
  interface Window {
    google: any;
  }
}

type SearchBarMapProps = {
  onSearch: (
    address: string,
    lat?: number,
    lng?: number,
    isNoteClick?: boolean
  ) => void;
  onNotesSearch: (searchText: string) => void;
  isLoaded: boolean;
  filteredNotes: Note[];
};

type SearchBarMapState = {
  searchText: string;
  suggestions: google.maps.places.AutocompletePrediction[];
  isDropdownVisible: boolean; // Tracks whether the dropdown is visible
  loading: boolean; // loading indicator
};

class SearchBarMap extends React.Component<
  SearchBarMapProps,
  SearchBarMapState
> {
  private autocompleteService: google.maps.places.AutocompleteService | null =
    null;
  private dropdownRef = React.createRef<HTMLUListElement>();

  constructor(props: SearchBarMapProps) {
    super(props);
    this.state = {
      searchText: "",
      suggestions: [],
      isDropdownVisible: false,
      loading: false, //loading state
    };
  }

  componentDidMount() {
    if (window.google?.maps?.places && !this.autocompleteService) {
      this.autocompleteService =
        new window.google.maps.places.AutocompleteService();
    }
  }

  componentDidUpdate(prevProps: SearchBarMapProps) {
    if (
      this.props.isLoaded &&
      !prevProps.isLoaded &&
      !this.autocompleteService
    ) {
      this.autocompleteService =
        new window.google.maps.places.AutocompleteService();
    }
  }

  handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    this.setState({ searchText: query, isDropdownVisible: true, loading: true });
  
    if (query.length > 2 && this.autocompleteService) {
      this.autocompleteService.getPlacePredictions(
        { input: query },
        this.handlePredictions
      );
      this.props.onNotesSearch(query); // Trigger notes search
    } else {
      this.setState({ suggestions: [] });
      if (query.length === 0 && this.state.searchText.length > 0) {
        this.props.onSearch(""); // Clear search results
        this.props.onNotesSearch(""); // Reset notes search
      }
    }
  
  };

  // Handle "Enter" key press

  handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event?.preventDefault();
      const typedLocation = this.state.searchText.trim();
      if (typedLocation) {
        this.props.onSearch(typedLocation);
        this.setState({ isDropdownVisible: false});
      }
    }
  };

  handlePredictions = (
    predictions: google.maps.places.AutocompletePrediction[] | null,
    status: google.maps.places.PlacesServiceStatus
  ) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
      this.setState({ suggestions: predictions, loading: false });
    } else {
      this.setState({ suggestions: [], loading: false });
    }
  };

  handleSelectSuggestion = (placeId: string) => {
    if (this.props.isLoaded && window.google?.maps?.places) {
      const placesService = new window.google.maps.places.PlacesService(
        document.createElement("div")
      );
      placesService.getDetails({ placeId }, this.handlePlaceDetails);
    }
  };

  handlePlaceDetails = (
    result: google.maps.places.PlaceResult | null,
    status: google.maps.places.PlacesServiceStatus
  ) => {
    if (
      status === google.maps.places.PlacesServiceStatus.OK &&
      result?.geometry?.location
    ) {
      const lat = result.geometry.location.lat();
      const lng = result.geometry.location.lng();
      this.props.onSearch(result.formatted_address || "", lat, lng); // Route to location
      this.setState({
        searchText: result.formatted_address || "",
        suggestions: [],
        isDropdownVisible: false, // Hide dropdown after selection
      });
    }
  };
  

  handleNoteSelection = (note: CombinedResult) => {
    if (note.type === "note") {
      const lat = parseFloat(note.latitude);
      const lng = parseFloat(note.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        this.props.onSearch(note.title, lat, lng, true); // Route to the note's pin
        this.setState({
          searchText: note.title,
          isDropdownVisible: false, // Close the dropdown
        });
      }
    }
  };

  handleFocus = () => {
    this.setState({ isDropdownVisible: true });
  };

  handleBlur = () => {
    // Hide dropdown after a slight delay to allow clicks on suggestions
    setTimeout(() => this.setState({ isDropdownVisible: false }), 200);
  };

  render() {
    const { searchText, suggestions, isDropdownVisible, loading } = this.state;
    const { filteredNotes } = this.props;

    // Add typed location at the top of the combined list
    const typedLocation = searchText
      ? [
          {
            description: searchText,
            place_id: "typed-location",
            type: "suggestion" as const,
          },
        ]
      : [];

      const combinedResults: CombinedResult[] = [
        ...typedLocation.map((location) => ({
          ...location,
          matched_substrings: [],
          structured_formatting: {
            main_text: location.description,
            main_text_matched_substrings: [], // Add this to fulfill the requirement
            secondary_text: "",
          },
          terms: [],
          types: [],
          type: "suggestion" as const,
        })),
        ...suggestions.map((s) => ({
          ...s,
          type: "suggestion" as const,
        })),
        ...filteredNotes
          .filter((note) => note && note.title) // Ensure note is valid
          .map((note) => ({
            ...note,
            type: "note" as const,
          })),
      ];
      

    // Sort combined results alphabetically
    combinedResults.sort((a, b) => {
      const textA =
        "description" in a
          ? a.description || ""
          : a.title && typeof a.title === "string"
          ? a.title
          : "";
      const textB =
        "description" in b
          ? b.description || ""
          : b.title && typeof b.title === "string"
          ? b.title
          : "";
      return textA.localeCompare(textB);
    });

    return (
      <div className="flex flex-col w-full relative">
        <SearchBarUI
          searchText={this.state.searchText}
          onInputChange={this.handleInputChange}
          className="p-2 rounded-md border border-gray-300 focus:outline-none focus: ring-2 focus:ring-blue-500"
        />
        {isDropdownVisible &&  (
          <ul
            ref={this.dropdownRef}
            id="autocomplete-suggestions"
            className="absolute z-50 w-full mt-1 rounded-md bg-white shadow-lg max-h-60 overflow-auto top-full"
          >
            {loading && (
              <li className="flex items-center px-4 py-2 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-blue-500"></div>
                <span className="ml-2">Loading...</span>
              </li>
            )}
            {!loading && combinedResults.length > 0 && (
            combinedResults.map((result, index) => {
              const isSuggestion = result.type === "suggestion";
              const key = isSuggestion ? result.place_id : result.id;
              const onClickHandler = () => {
                if (isSuggestion) {
                  if (result.place_id === "typed-location") {
                    // Handle the typed location click
                    this.props.onSearch(result.description);
                    this.setState({
                      searchText: result.description,
                      isDropdownVisible: false,
                    });
                  } else {
                    this.handleSelectSuggestion(result.place_id);
                  }
                } else {
                  // Handle note selection
                  this.handleNoteSelection(result);
                }
              };

              const displayText = isSuggestion
                ? result.description
                : result.title;

              return (
                <li
                  key={key}
                  className="flex items-center px-4 py-2 hover:bg-blue-100 cursor-pointer transition-colors"
                  onClick={onClickHandler}
                  role="option"
                  aria-selected="false"
                >
                  {isSuggestion ? (
                    <PlaceIcon aria-hidden className="h-4 w-4 mr-2 md:h-5 md:w-5 lg:h-6 lg:w-6 text-blue-600" />
                  ) : (
                    <ImageIcon aria-hidden className="h-4 w-4 mr-2 md:h-5 md:w-5 lg:h-6 lg:w-6 text-gray-500" />
                  )}
                  {displayText}
                </li>
              );
            })
            )}
          </ul>
        )}
      </div>
    );
  }
}

export default SearchBarMap;


