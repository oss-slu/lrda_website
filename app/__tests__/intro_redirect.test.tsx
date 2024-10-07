import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryHistory } from 'history'; // Allows us to mock the browser's history object
import { MemoryRouter, Route, Routes } from 'react-router-dom'; // Allows us to test components that use React Router
import MapPage from '../lib/pages/map/page'; // Import the MapPage component
import NotePage from '../lib/pages/notes/page';
import introJs from 'intro.js'; // Mock intro.js
jest.mock('firebase/auth'); // This mocks the Firebase authentication service, preventing real Firebase API calls
jest.mock('../lib/utils/api_service');
jest.mock('intro.js'); // Mock intro.js to control its behavior
describe('MapPage Tour', () => {
  it('does not start the tour or complete it', async () => {
    const history = createMemoryHistory(); // Create a mock history object for testing
    history.push = jest.fn(); // Mock the push method of the history object (this is used to simulate navigation)
    // Mock the introJs instance to simulate its behavior
    const mockIntroJsInstance = {
      setOptions: jest.fn(), // Mock setOptions function
      start: jest.fn(), // Mock start function without any behavior
      oncomplete: jest.fn(), // Mock oncomplete function without any behavior
    };
    introJs.mockReturnValue(mockIntroJsInstance); // Make introJs return the mock instance
    // Render the MapPage component wrapped in Router to provide history
    render(
      <MemoryRouter initialEntries={['/map']}>
        <Routes>
          <Route path="/map" element={<MapPage />} /> {/* Map page route */}
          <Route path="/notes/page" element={<NotePage />} /> {/* Notes page route */}
        </Routes>
      </MemoryRouter>
    );
    // Wait for any potential changes or effects
    await waitFor(() => {
      expect(mockIntroJsInstance.start).not.toHaveBeenCalled(); // Ensure the tour was not started
      expect(mockIntroJsInstance.oncomplete).not.toHaveBeenCalled(); // Ensure the oncomplete callback was not invoked
    });
    // Ensure the user is not redirected to the next page
    expect(history.push).not.toHaveBeenCalledWith('/next-page'); // Check if navigation did not happen
  });
});