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
  suggestions: google.maps.places.AutocompletePrediction[];
};

class SearchBarMap extends React.Component<
  SearchBarMapProps,
  SearchBarMapState
> {
  private autocompleteService: google.maps.places.AutocompleteService | null =
    null;

  constructor(props: SearchBarMapProps) {
    super(props);
    this.state = {
      searchText: "",
      suggestions: [],
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
    this.setState({ searchText: query });

    if (query.length > 2 && this.autocompleteService) {
      this.autocompleteService.getPlacePredictions(
        { input: query },
        this.handlePredictions
      );
      this.props.onNotesSearch(query); // Call the notes search when input changes
    } else {
      this.setState({ suggestions: [] });
      if (query.length === 0 && this.state.searchText.length > 0) {
        this.props.onSearch(""); // Call the search handler with empty string or reset value
        this.props.onNotesSearch(""); // Also reset notes search
      }
    }

    // Keydown event listener for Enter key
    e.target.onkeydown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault(); // Prevent default form submission behavior
        if (this.state.searchText.trim().length > 0) {
          this.props.onSearch(this.state.searchText); // Trigger search when Enter is pressed
        }
      }
    };
  };

  handlePredictions = (
    predictions: google.maps.places.AutocompletePrediction[] | null,
    status: google.maps.places.PlacesServiceStatus
  ) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
      this.setState({ suggestions: predictions });
    } else {
      this.setState({ suggestions: [] });
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
      this.props.onSearch(result.formatted_address || "", lat, lng);
      this.setState({
        searchText: result.formatted_address || "",
        suggestions: [],
      });
    }
  };

  render() {
    const { searchText, suggestions } = this.state;
    const { filteredNotes } = this.props;

    const combinedResults: CombinedResult[] = [
      ...suggestions.map((s) => ({ ...s, type: "suggestion" as const })),
      ...filteredNotes.map((n) => ({ ...n, type: "note" as const })),
    ];

    // Sort the combined list alphabetically
    combinedResults.sort((a, b) => {
      let textA = "description" in a ? a.description : a.title;
      let textB = "description" in b ? b.description : b.title;
      return textA.localeCompare(textB);
    });

    return (
      <div className="flex flex-col w-full relative">
        <SearchBarUI
          searchText={this.state.searchText}
          onInputChange={this.handleInputChange}
        />
        {combinedResults.length > 0 && suggestions.length > 0 && (
          <ul
            id="autocomplete-suggestions"
            className="absolute z-10 w-full mt-1 rounded-md bg-white shadow-lg max-h-60 overflow-auto top-full"
          >
            {combinedResults.map((result, index) => {
              const isSuggestion = result.type === "suggestion";
              const key = isSuggestion ? result.place_id : result.id;
              const onClickHandler = () => {
                if (isSuggestion) {
                  this.handleSelectSuggestion(
                    (result as google.maps.places.AutocompletePrediction)
                      .place_id
                  );
                } else {
                  const lat = parseFloat(result.latitude);
                  const lng = parseFloat(result.longitude);
                  if (!isNaN(lat) && !isNaN(lng)) {
                    // The additional boolean parameter `true` signifies that the click came from a note
                    this.props.onSearch(result.title, lat, lng, true);

                    // Update searchText to the title of the note
                    this.setState({
                      searchText: result.title,
                      suggestions: [],
                    });
                  } else {
                    this.props.onSearch(
                      result.title,
                      undefined,
                      undefined,
                      true
                    );

                    this.setState({
                      searchText: result.title,
                      suggestions: [],
                    });
                  }
                }
              };

              return (
                <li
                  key={key}
                  className="flex items-center px-4 py-2 hover:bg-blue-100 cursor-pointer transition-colors"
                  onClick={onClickHandler}
                  role="option"
                  aria-selected="false"
                >
                  <img
                    src={
                      isSuggestion
                        ? "/autocomplete_map_pin.png"
                        : "/autocomplete_search_icon.png"
                    }
                    alt={isSuggestion ? "Map Pin" : "Search Icon"}
                    className="h-4 w-4 mr-2"
                  />
                  {result.description || result.title}
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
