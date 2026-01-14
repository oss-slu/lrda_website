import { render, screen } from '@testing-library/react';
import React, { RefObject } from 'react';

jest.mock('firebase/auth'); // This mocks the Firebase authentication service, preventing real Firebase API calls
jest.mock('../lib/utils/api_service');
jest.mock('intro.js'); // Mock intro.js to control its behavior

// Define the SearchComponent with the correct typing for searchBarRef
function SearchComponent({ searchBarRef }: { searchBarRef: RefObject<HTMLInputElement> }) {
  return <input type='text' placeholder='Search' ref={searchBarRef} />;
}

test('search bar ref is assigned to the correct search bar element', () => {
  // Create a ref to pass to the search bar component
  const searchBarRef = React.createRef<HTMLInputElement>();

  // Render the search component with the ref passed as a prop
  render(<SearchComponent searchBarRef={searchBarRef} />);

  // Find the search bar element by its placeholder or role (e.g., role="searchbox")
  const searchBar = screen.getByPlaceholderText('Search') || screen.getByRole('searchbox');

  // Check that the ref points to the correct search bar element
  expect(searchBarRef.current).toBe(searchBar);
});
