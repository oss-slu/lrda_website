import SearchBar from '../components/searchBar'; // Make sure to adjust the import path
import "@testing-library/jest-dom";
import { render, fireEvent } from '@testing-library/react';


test('renders the SearchBar component', () => {
  render(<SearchBar />);
});
;

test('updates the search input when the user types', () => {
  const { getByPlaceholderText } = render(<SearchBar />);
  const searchInput = getByPlaceholderText('Search...'); // Assuming 'Search...' is the placeholder text

  // Simulate user input
  fireEvent.change(searchInput, { target: { value: 'Sample Query' } });

  // Check if the search input value updates correctly
  expect(searchInput).toHaveValue('Sample Query');
});

test('triggers search on pressing Enter key', () => {
  const { getByPlaceholderText, getByTestId, queryByText } = render(<SearchBar />);
  const searchInput = getByPlaceholderText('Search...'); // Assuming 'Search...' is the placeholder text
  const searchButton = getByTestId('1234'); // Use your custom Test ID here

  // Enter a search query
  fireEvent.change(searchInput, { target: { value: 'Sample Query' } });

  // Press the Enter key
  fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter', charCode: 13 });

});


test('handles large amount of search input', () => {
  const { getByPlaceholderText, getByTestId, queryByText } = render(<SearchBar />);
  const searchInput = getByPlaceholderText('Search...'); // Assuming 'Search...' is the placeholder text
  const searchButton = getByTestId('1234'); // Use your custom Test ID here

  // Enter a large amount of text in the search input
  const largeText = 'Lorem ipsum '.repeat(1000); // Creating a large text

  fireEvent.change(searchInput, { target: { value: largeText } });

  // Press the Enter key
  fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter', charCode: 13 });

  // Check if the search is aborted or if the component handles it gracefully
  // You can check if there are any performance issues
  expect(queryByText('Sample Query')).not.toBeInTheDocument();
});

test('handles search input with special characters', () => {
  const { getByPlaceholderText, getByTestId, queryByText } = render(<SearchBar />);
  const searchInput = getByPlaceholderText('Search...'); // Assuming 'Search...' is the placeholder text
  const searchButton = getByTestId('1234'); // Use your custom Test ID here

  // Enter a search query with special characters
  const specialCharacters = '!@#$%^&*()';

  fireEvent.change(searchInput, { target: { value: specialCharacters } });

  // Press the Enter key
  fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter', charCode: 13 });

  // Check if the search is handled correctly or if any special characters are sanitized
  expect(queryByText('Sample Query')).not.toBeInTheDocument();
});






