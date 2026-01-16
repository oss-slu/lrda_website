import { render, screen, waitFor } from '@testing-library/react';
import MapPage from '../map/page'; // Import the MapPage component
import NotePage from '../notes/page';
import introJs from 'intro.js'; // Mock intro.js
import { createTestWrapper } from './utils/testQueryClient';
jest.mock('firebase/auth'); // Mock Firebase Auth
jest.mock('firebase/database', () => ({
  getDatabase: jest.fn(), // Mock Realtime Database
}));
jest.mock('../lib/utils/api_service');
jest.mock('intro.js'); // Mock intro.js to control its behavior

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/map',
  useSearchParams: () => new URLSearchParams(),
}));

const TestQueryWrapper = createTestWrapper();

describe('MapPage Tour', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('does not start the tour or complete it', async () => {
    // Mock the introJs instance to simulate its behavior
    const mockIntroJsInstance = {
      setOptions: jest.fn(), // Mock setOptions function
      start: jest.fn(), // Mock start function without any behavior
      oncomplete: jest.fn(), // Mock oncomplete function without any behavior
    };
    (introJs as jest.Mock).mockReturnValue(mockIntroJsInstance); // Make introJs return the mock instance
    // Render the MapPage component
    render(
      <TestQueryWrapper>
        <MapPage />
      </TestQueryWrapper>,
    );
    // Wait for any potential changes or effects
    await waitFor(() => {
      expect(mockIntroJsInstance.start).not.toHaveBeenCalled(); // Ensure the tour was not started
      expect(mockIntroJsInstance.oncomplete).not.toHaveBeenCalled(); // Ensure the oncomplete callback was not invoked
    });
    // Ensure the user is not redirected to the next page
    expect(mockPush).not.toHaveBeenCalledWith('/next-page'); // Check if navigation did not happen
  });
});
