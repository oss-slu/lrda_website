import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from '../components/SearchBar'; 


describe('SearchBar Component', () => {
  it('renders without crashing', () => {
    render(<SearchBar />);
    const searchBarElement = screen.getByText('Search');
    expect(searchBarElement).toBeInTheDocument();
  });

  it('initial input value is empty', () => {
    render(<SearchBar />);
    const inputElement = screen.getByPlaceholderText('Search...');
    expect(inputElement).toHaveValue('');
  });

  it('updates input value when typed into', () => {
    render(<SearchBar />);
    const inputElement = screen.getByPlaceholderText('Search...');
    fireEvent.change(inputElement, { target: { value: 'test input' } });
    expect(inputElement).toHaveValue('test input');
  });

  it('calls handleSearch when the search button is clicked', () => {
    const mockHandleSearch = jest.fn();
    jest.spyOn(SearchBar.prototype, 'handleSearch').mockImplementation(mockHandleSearch);

    render(<SearchBar />);
    const searchButton = screen.getByText('Search');
    fireEvent.click(searchButton);

    expect(mockHandleSearch).toHaveBeenCalled();
  });
});
