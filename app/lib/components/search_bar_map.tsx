import React from 'react';
import SearchBarUI from './search_bar_ui'; // Assuming SearchBarUI is in the same directory

declare global {
  interface Window {
    google: any;
  }
}

type SearchBarMapProps = {
  onSearch: (address: string, lat?: number, lng?: number) => void;
  isLoaded: boolean;
};

type SearchBarMapState = {
  searchText: string;
  suggestions: google.maps.places.AutocompletePrediction[];
};

class SearchBarMap extends React.Component<SearchBarMapProps, SearchBarMapState> {
  private autocompleteService: google.maps.places.AutocompleteService | null = null;

  constructor(props: SearchBarMapProps) {
    super(props);
    this.state = {
      searchText: '',
      suggestions: [],
    };
  }

  componentDidMount() {
    if (window.google?.maps?.places && !this.autocompleteService) {
      this.autocompleteService = new window.google.maps.places.AutocompleteService();
    }
  }

  componentDidUpdate(prevProps: SearchBarMapProps) {
    if (this.props.isLoaded && !prevProps.isLoaded && !this.autocompleteService) {
      this.autocompleteService = new window.google.maps.places.AutocompleteService();
    }
  }

  handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    this.setState({ searchText: query });
  
    if (query.length > 2 && this.autocompleteService) {
      this.autocompleteService.getPlacePredictions({ input: query }, this.handlePredictions);
    } else {
      this.setState({ suggestions: [] });
      if (query.length === 0 && this.state.searchText.length > 0) {
        // Only reset search if transitioning from non-empty to empty
        this.props.onSearch(''); // Call the search handler with empty string or reset value
      }
    }
  
    // Keydown event listener for Enter key
    e.target.onkeydown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();  // Prevent default form submission behavior
        if (this.state.searchText.trim().length > 0) {
          this.props.onSearch(this.state.searchText);  // Trigger search when Enter is pressed
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
      const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));
      placesService.getDetails({ placeId }, this.handlePlaceDetails);
    }
  };

  handlePlaceDetails = (result: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && result?.geometry?.location) {
      const lat = result.geometry.location.lat();
      const lng = result.geometry.location.lng();
      this.props.onSearch(result.formatted_address || '', lat, lng);
      this.setState({ searchText: result.formatted_address || '', suggestions: [] });
    }
  };

  render() {
    const { searchText, suggestions } = this.state;

    return (
      <div className="flex flex-col w-full relative">
        <SearchBarUI searchText={searchText} onInputChange={this.handleInputChange} />
        { suggestions.length > 0 && (
  <ul id="autocomplete-suggestions" className="absolute z-10 w-full mt-1 rounded-md bg-white shadow-lg max-h-60 overflow-auto top-full">
    {suggestions.map((suggestion) => (
      <li
        key={suggestion.place_id}
        className="flex items-center px-4 py-2 hover:bg-blue-100 cursor-pointer transition-colors"
        onClick={() => this.handleSelectSuggestion(suggestion.place_id)}
        role="option"
        aria-selected="false"
      >
        <img src="/results_pin.png" alt="Map Pin" className="h-4 w-4 mr-2"/> 
        <span className="truncate"> 
          {suggestion.description}
        </span>
      </li>
    ))}
  </ul>
)}
      </div>
    );
  }
}

export default SearchBarMap;
