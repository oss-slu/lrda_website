import React, { ReactNode } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LocationPicker from '../lib/components/location_component';
import '@testing-library/jest-dom';

beforeAll(() => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn().mockImplementation((success) => {
          return Promise.resolve(success({
            coords: {
              latitude: 50,
              longitude: 30,
            },
          }));
        }),
      },
      writable: true,
    });
  });
  
  afterAll(() => {
    jest.resetAllMocks();
  });

jest.mock('@react-google-maps/api', () => ({
    GoogleMap: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    MarkerF: () => <div />,
    useJsApiLoader: () => ({ isLoaded: true }),
  }));

const mockGeolocation = {
  getCurrentPosition: jest.fn()
    .mockImplementation((success) => Promise.resolve(success({
      coords: {
        latitude: 50,
        longitude: 30,
      }
    })))
};

describe('LocationPicker', () => {
  it('renders without crashing', () => {
    render(<LocationPicker />);
  });

  it('displays the initial longitude and latitude', () => {
    render(<LocationPicker />);
    expect(screen.getByText(/0.00000000_0.00000000/)).toBeInTheDocument();
  });

  it('updates the location when clicking the compass icon', async () => {
    render(<LocationPicker />);
    const compassIcon = screen.getByRole('button', { name: /compass/ });
    fireEvent.click(compassIcon);

    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
  });

  it('displays the GoogleMap component when the popover is triggered', () => {
    render(<LocationPicker />);
    const mapPinButton = screen.getByRole('button', { name: /map pin/ });
    fireEvent.click(mapPinButton);

    expect(screen.getByText(/GoogleMap/)).toBeInTheDocument();
  });

});
