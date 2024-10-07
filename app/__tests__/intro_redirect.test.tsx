// __tests__/mapPage.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryHistory } from 'history'; // Allows us to mock the browser's history object
import { MemoryRouter, Route, Routes } from 'react-router-dom'; // Allows us to test components that use React Router
import MapPage from '../lib/pages/map/page'; // Import the MapPage component
import NotePage from '../lib/pages/notes/page';
import introJs from 'intro.js'; // Mock intro.js

jest.mock('firebase/auth'); // This mocks the Firebase authentication service, preventing real Firebase API calls
jest.mock('../lib/utils/api_service');

jest.mock('intro.js', () => {
    return jest.fn(() => ({
        setOptions: jest.fn(), 
        start: jest.fn(() => {
            const tooltip = document.createElement('div'); // Create a new div element
            tooltip.className = 'introjs-tooltip'; // Set the class name to simulate an Intro.js tooltip
            document.body.appendChild(tooltip); // Append the tooltip div to the body to mimic the behavior of Intro.js
        }),
        oncomplete: jest.fn()
    }));
});

jest.mock('../lib/utils/data_conversion', () => ({
    convertMediaTypes: jest.fn(() => []), // Mock with an empty array
  }));

beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers(); // Ensure fake timers are used globally
  
    // Mock the geolocation API
    const mockGeolocation = {
      getCurrentPosition: jest.fn().mockImplementation((success) => {
        success({
          coords: {
            latitude: 51.1,
            longitude: 45.3,
          },
        });
      }),
      watchPosition: jest.fn(),
      clearWatch: jest.fn(),
    };
  
    Object.defineProperty(global.navigator, "geolocation", {
      value: mockGeolocation,
      writable: true,
    });
  
    // Mock window.location methods
    Object.defineProperty(window, 'location', {
      value: {
        href: "http://localhost/",
        assign: jest.fn(),
        reload: jest.fn(),
        replace: jest.fn(),
      },
      writable: true,
    });
  });

describe('MapPage Tour', () => {
  it('redirects to next page after completing the tour', async () => {
    const history = createMemoryHistory(); // Create a mock history object for testing
    history.push = jest.fn(); // Mock the push method of the history object (this is used to simulate navigation)

    // Mock the introJs instance to simulate its behavior
    const mockIntroJsInstance = {
      setOptions: jest.fn(), // Mock setOptions function
      start: jest.fn(() => {
        const tooltip = document.createElement('div'); // Create a new div element
        tooltip.className = 'introjs-tooltip'; // Set the class name to simulate an Intro.js tooltip
        document.body.appendChild(tooltip); // Append the tooltip div to the body to mimic the behavior of Intro.js
      }),
      oncomplete: jest.fn((cb) => cb()), // Mock oncomplete, simulate instant callback
    };

    introJs.mockReturnValue(mockIntroJsInstance); // Make introJs return the mock instance

    // Render the MapPage component wrapped in Router to provide history
        // Simulate routing between pages using MemoryRouter
    render(
        <MemoryRouter initialEntries={['/map']}>
            <Routes>
            <Route path="/map" element={<MapPage />} />  {/* Map page route */}
            <Route path="/notes/page" element={<NotePage />} />  {/* Notes page route */}
            </Routes>
        </MemoryRouter>
    );

    // Wait for the mock introJs methods to be called
    await waitFor(() => {
      expect(mockIntroJsInstance.start).toHaveBeenCalled(); // Ensure the tour was started
      expect(mockIntroJsInstance.oncomplete).toHaveBeenCalled(); // Ensure the oncomplete callback was invoked
    });

    // Ensure the user is redirected to the next page
    expect(history.push).toHaveBeenCalledWith('/lib/pages/notes'); // Check if navigation happened
  });
});
