import React from "react";
import SearchBarUI from "./search_bar_ui"; // Assuming SearchBarUI is in the same directory

type SearchBarNotesProps = {
  onSearch: (query: string) => void;
};

type SearchBarNotesState = {
  searchText: string;
};

class SearchBarNotes extends React.Component<
  SearchBarNotesProps,
  SearchBarNotesState
> {
  constructor(props: SearchBarNotesProps) {
    super(props);
    this.state = {
      searchText: "",
    };
  }

  handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    this.setState({ searchText: query }, () => {
      this.props.onSearch(query);
    });
  };

  handleFocus = () => {
    console.log("Input focused!"); 
  };

  handleBlur = () => {
    console.log("input blurred");
  };

  render() {
    return (
      <SearchBarUI
        searchText={this.state.searchText}
        onInputChange={this.handleInputChange}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
      />
    );
  }
}

export default SearchBarNotes;
