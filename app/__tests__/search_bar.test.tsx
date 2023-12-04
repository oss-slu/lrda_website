import React from 'react';
import SearchBar from '../lib/components/search_bar'; // Make sure to adjust the import path
import "@testing-library/jest-dom";
import { render, fireEvent } from '@testing-library/react';

describe('SearchBar Component', () => {
  let originalConsoleError: jest.Mock;
  let mockOnSearch: jest.Mock;

  beforeEach(() => {
    // Mock console.error
    originalConsoleError = console.error;
    console.error = jest.fn();

    // Create a mock function for onSearch
    mockOnSearch = jest.fn();
  });

  afterEach(() => {
    // Restore original console.error
    console.error = originalConsoleError;
  });

  test('renders the SearchBar component', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
  });

  test('updates the search input when the user types', () => {
    const { getByPlaceholderText } = render(<SearchBar onSearch={mockOnSearch} />);
    const searchInput = getByPlaceholderText('Search...'); // Assuming 'Search...' is the placeholder text

    fireEvent.change(searchInput, { target: { value: 'Sample Query' } });
    expect(searchInput).toHaveValue('Sample Query');
    expect(mockOnSearch).toHaveBeenCalledWith('Sample Query');
  });

  test('triggers search on pressing Enter key', () => {
    const { getByPlaceholderText } = render(<SearchBar onSearch={mockOnSearch} />);
    const searchInput = getByPlaceholderText('Search...'); // Assuming 'Search...' is the placeholder text

    fireEvent.change(searchInput, { target: { value: 'Sample Query' } });
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter', charCode: 13 });
    expect(mockOnSearch).toHaveBeenCalledWith('Sample Query');
  });

  test('handles large amount of search input', () => {
    const { getByPlaceholderText } = render(<SearchBar onSearch={mockOnSearch} />);
    const searchInput = getByPlaceholderText('Search...'); // Assuming 'Search...' is the placeholder text
    const largeText = 'Lorem ipsum '.repeat(1000); // Creating a large text

    fireEvent.change(searchInput, { target: { value: largeText } });
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter', charCode: 13 });
    expect(mockOnSearch).toHaveBeenCalledWith(largeText);
  });

  test('handles search input with special characters', () => {
    const { getByPlaceholderText } = render(<SearchBar onSearch={mockOnSearch} />);
    const searchInput = getByPlaceholderText('Search...'); // Assuming 'Search...' is the placeholder text
    const specialCharacters = '!@#$%^&*()';

    fireEvent.change(searchInput, { target: { value: specialCharacters } });
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter', charCode: 13 });
    expect(mockOnSearch).toHaveBeenCalledWith(specialCharacters);
  });

});
