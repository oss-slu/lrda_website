// app/__tests__/default_location.test.tsx
import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import LocationPicker from '../lib/components/NoteEditor/NoteElements/LocationPicker';

// ✅ Mock Google Maps API-related components
jest.mock('@react-google-maps/api', () => ({
  GoogleMap: ({ children }: any) => <div>{children}</div>,
  MarkerF: () => <div>Marker</div>,
  Autocomplete: ({ children, onLoad }: any) => {
    React.useEffect(() => {
      onLoad({ getPlace: jest.fn() }); // Mock the autocomplete API
    }, []);
    return <div>{children}</div>;
  },
}));

// ✅ Mock useGoogleMaps hook
jest.mock('../lib/utils/GoogleMapsContext', () => ({
  useGoogleMaps: () => true,
}));

// ✅ Setup mock for navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
};

global.navigator.geolocation = mockGeolocation as any;

describe('LocationPicker Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the location button', () => {
    render(<LocationPicker onLocationChange={() => {}} />);
    expect(screen.getByRole('button', { name: /toggle map visibility/i })).toBeInTheDocument();
  });

  it('calls geolocation and updates location when map is opened', async () => {
    const onLocationChangeMock = jest.fn();

    const fakePosition = {
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
      },
    };

    mockGeolocation.getCurrentPosition.mockImplementationOnce(success => success(fakePosition));

    render(<LocationPicker onLocationChange={onLocationChangeMock} />);

    // Click the button to open the map
    fireEvent.click(screen.getByRole('button', { name: /toggle map visibility/i }));

    // Check that onLocationChange was called with the mocked coordinates
    await waitFor(() => {
      expect(onLocationChangeMock).toHaveBeenCalledWith(-122.4194, 37.7749);
    });
  });
});
