import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LocationPicker from '../lib/components/NoteEditor/NoteElements/LocationPicker';
import '@testing-library/jest-dom';

jest.mock('@react-google-maps/api', () => ({
  GoogleMap: ({ children }: any) => <div data-testid='google-map'>{children}</div>,
  MarkerF: () => <div />,
  Autocomplete: ({ children }: any) => <div data-testid='autocomplete'>{children}</div>,
  useJsApiLoader: () => ({ isLoaded: true }),
}));

jest.mock('../lib/utils/GoogleMapsContext', () => ({
  useGoogleMaps: () => true,
}));

jest.mock('../lib/utils/location_cache', () => ({
  getCachedLocation: jest.fn().mockResolvedValue('Test City'),
}));

jest.mock('../lib/components/search_bar_map', () => ({
  __esModule: true,
  default: () => <div data-testid='search-bar-map' />,
}));

describe('LocationPicker', () => {
  // Mock the geolocation service
  const originalGeolocation = navigator.geolocation;

  beforeEach(() => {
    navigator.geolocation = {
      getCurrentPosition: jest.fn().mockImplementation(success =>
        Promise.resolve(
          success({
            coords: {
              latitude: 50,
              longitude: 30,
            },
          }),
        ),
      ),
      watchPosition: jest.fn(),
      clearWatch: jest.fn(),
    };
  });

  afterEach(() => {
    // Restore the original navigator.geolocation
    navigator.geolocation = originalGeolocation;
  });

  it('renders without crashing', () => {
    render(<LocationPicker onLocationChange={() => {}} />);
  });

  // it("displays the GoogleMap component when the popover is triggered", () => {
  //   render(<LocationPicker onLocationChange={() => {}} />);
  //   const mapPinButton = screen.getByRole("button", { name: /map pin/ });
  //   fireEvent.click(mapPinButton);
  //   expect(screen.getByTestId("google-map")).toBeInTheDocument();
  // });

  it('allows viewing location when disabled prop is true (read-only mode)', () => {
    const mockOnLocationChange = jest.fn();
    render(
      <LocationPicker
        onLocationChange={mockOnLocationChange}
        disabled={true}
        lat='40.7128'
        long='-74.0060'
      />,
    );

    // When disabled, aria-label is "View location (read-only)", when enabled it's "Toggle map visibility"
    const locationButton = screen.getByRole('button', {
      name: /view location|toggle map visibility/i,
    });

    // Button is not disabled - it's clickable for viewing (read-only mode for instructors)
    expect(locationButton).not.toBeDisabled();

    // Button should have the read-only aria-label
    expect(locationButton).toHaveAttribute('aria-label', 'View location (read-only)');

    // Clicking should open the map for viewing
    fireEvent.click(locationButton);

    // The map should be visible after clicking
    expect(screen.getByTestId('google-map')).toBeInTheDocument();

    // The map opens for viewing, but location changes are prevented by the disabled prop on marker
    // onLocationChange should not be called when marker is dragged (handled by draggable={!disabled})
  });

  it('allows interaction when disabled prop is false', () => {
    const mockOnLocationChange = jest.fn();
    render(<LocationPicker onLocationChange={mockOnLocationChange} disabled={false} />);

    const locationButton = screen.getByRole('button', {
      name: /toggle map visibility|view location/i,
    });

    // Assert that button is not disabled
    expect(locationButton).not.toBeDisabled();
  });
});
