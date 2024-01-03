import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import "@testing-library/jest-dom";
import SearchBar from '../lib/components/search_bar'; 

describe('SearchBar Component', () => {
  let mockOnSearch: jest.Mock<any, any>;

  beforeEach(() => {
    mockOnSearch = jest.fn();
  });

  it('renders the SearchBar component', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
  });

});
