import React from "react";
import SearchBarUI from "./search_bar_ui";
import { Note, CombinedResult } from "../../types";

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
  suggestions: CombinedResult[];
  isDropdownVisible: boolean;
  loading: boolean;
};

class SearchBarMap extends React.Component<SearchBarMapProps, SearchBarMapState> {
  private sessionToken: any = null;
  private AutocompleteSuggestion: any = null;
  private dropdownRef = React.createRef<HTMLUListElement>();

  constructor(props: SearchBarMapProps) {
    super(props);
    this.state = {
      searchText: "",
      suggestions: [],
      isDropdownVisible: false,
      loading: false,
    };
  }

  async componentDidMount() {
    if (window.google?.maps) {
      const { AutocompleteSuggestion } = await window.google.maps.importLibrary("places");
      this.AutocompleteSuggestion = AutocompleteSuggestion;
      this.sessionToken = new window.google.maps.places.AutocompleteSessionToken();
    }
  }

  handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    this.setState({ searchText: query, isDropdownVisible: true, loading: true });

    if (query.length > 2 && this.AutocompleteSuggestion) {
      const sessionToken =
        this.sessionToken || new window.google.maps.places.AutocompleteSessionToken();

      try {
        const res = await this.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: query,
          sessionToken,
        });

        const suggestions: CombinedResult[] = res.suggestions.map((s: any) => ({
          type: "suggestion",
          place_id: s.placePrediction?.placeId || "",
          description: s.placePrediction
            ? `${s.placePrediction.mainText.text}${
                s.placePrediction.secondaryText
                  ? ", " + s.placePrediction.secondaryText.text
                  : ""
              }`
            : "",
          matched_substrings: s.placePrediction?.matchedSubstrings || [],
          structured_formatting: s.placePrediction?.structuredFormatting || {
            main_text: "",
            main_text_matched_substrings: [],
            secondary_text: "",
          },
          terms: s.placePrediction?.terms || [],
          types: s.placePrediction?.types || [],
        }));

        this.setState({ suggestions, loading: false });
        this.props.onNotesSearch(query);
      } catch {
        this.setState({ suggestions: [], loading: false });
      }
    } else {
      this.setState({ suggestions: [], loading: false });
      if (query.length === 0) {
        this.props.onSearch("");
        this.props.onNotesSearch("");
      }
    }
  };

  handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const typedLocation = this.state.searchText.trim();
      if (typedLocation) {
        this.props.onSearch(typedLocation);
        this.setState({ isDropdownVisible: false });
      }
    }
  };

  handleSelectSuggestion = (placeId: string) => {
    if (this.props.isLoaded && window.google?.maps?.places) {
      const placesService = new window.google.maps.places.PlacesService(document.createElement("div"));
      placesService.getDetails({ placeId }, this.handlePlaceDetails);
    }
  };

  handlePlaceDetails = (
    result: google.maps.places.PlaceResult | null,
    status: google.maps.places.PlacesServiceStatus
  ) => {
    if (
      status === window.google.maps.places.PlacesServiceStatus.OK &&
      result?.geometry?.location
    ) {
      const lat = result.geometry.location.lat();
      const lng = result.geometry.location.lng();
      this.props.onSearch(result.formatted_address || "", lat, lng);
      this.setState({
        searchText: result.formatted_address || "",
        suggestions: [],
        isDropdownVisible: false,
      });
    }
  };

  handleNoteSelection = (note: CombinedResult) => {
    if (note.type === "note") {
      const lat = parseFloat(note.latitude);
      const lng = parseFloat(note.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        this.props.onSearch(note.title, lat, lng, true);
        this.setState({ searchText: note.title, isDropdownVisible: false });
      }
    }
  };

  handleFocus = () => this.setState({ isDropdownVisible: true });
  handleBlur = () => setTimeout(() => this.setState({ isDropdownVisible: false }), 200);

  render() {
    const { searchText, suggestions, isDropdownVisible, loading } = this.state;
    const { filteredNotes } = this.props;

    const noteMatches = filteredNotes
      .filter((note) =>
        note.title.toLowerCase().includes(searchText.toLowerCase())
      )
      .map((note) => ({ ...note, type: "note" as const }));

    const combinedResults: CombinedResult[] = [
      ...noteMatches,
      ...suggestions,
    ];

    return (
      <div className="flex flex-col w-full relative">
        <SearchBarUI
          searchText={searchText}
          onInputChange={this.handleInputChange}
          onKeyDown={this.handleKeyDown}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          className="p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {isDropdownVisible && (
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
            {!loading &&
              combinedResults.map((result) => {
                const isSuggestion = result.type === "suggestion";
                const key = isSuggestion ? result.place_id : result.id;
                const displayText = isSuggestion
                  ? result.description
                  : result.title;

                const onClickHandler = () => {
                  if (isSuggestion) {
                    this.handleSelectSuggestion(result.place_id);
                  } else {
                    this.handleNoteSelection(result);
                  }
                };

                return (
                  <li
                    key={key}
                    className="flex items-center px-4 py-2 hover:bg-blue-100 cursor-pointer transition-colors"
                    onClick={onClickHandler}
                  >
                    <img
                      src={isSuggestion ? "/autocomplete_map_pin.png" : "/autocomplete_search_icon.png"}
                      alt={isSuggestion ? "Map Pin" : "Search Icon"}
                      className="h-4 w-4 mr-2"
                    />
                    {displayText}
                  </li>
                );
              })}
          </ul>
        )}
      </div>
    );
  }
}

export default SearchBarMap;













