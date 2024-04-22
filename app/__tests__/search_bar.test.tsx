import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import "@testing-library/jest-dom";
import SearchBarMap from '../lib/components/search_bar_map';

describe('SearchBarMap Component', () => {
  let mockOnSearch: jest.Mock<any, any>;
  let mockOnNotesSearch: jest.Mock<any, any>;

  // Setup some default props with the necessary fields initialized
  const defaultProps = {
    onSearch: jest.fn(),
    onNotesSearch: jest.fn(),
    isLoaded: true, // Assuming the component needs this to be true to function properly
    filteredNotes: [] // An empty array to ensure it's not undefined
  };

  beforeEach(() => {
    // Setup mock functions
    mockOnSearch = jest.fn();
    mockOnNotesSearch = jest.fn();
  });

  it('renders the SearchBarMap component without crashing', () => {
    // Render the component with all required props
    render(
      <SearchBarMap 
        onSearch={mockOnSearch} 
        onNotesSearch={mockOnNotesSearch}
        isLoaded={defaultProps.isLoaded}
        filteredNotes={defaultProps.filteredNotes}
      />
    );
  });

});
