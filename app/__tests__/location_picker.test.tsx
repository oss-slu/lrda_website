import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LocationPicker from "../lib/components/noteElements/location_component";
import "@testing-library/jest-dom";

jest.mock("@react-google-maps/api", () => ({
  GoogleMap: ({ children }) => <div data-testid="google-map">{children}</div>,
  MarkerF: () => <div />,
  useJsApiLoader: () => ({ isLoaded: true }),
}));

describe("LocationPicker", () => {
  // Mock the geolocation service
  const originalGeolocation = navigator.geolocation;

  beforeEach(() => {
    navigator.geolocation = {
      getCurrentPosition: jest.fn().mockImplementation((success) =>
        Promise.resolve(
          success({
            coords: {
              latitude: 50,
              longitude: 30,
            },
          })
        )
      ),
      watchPosition: jest.fn(),
      clearWatch: jest.fn(),
    };
  });

  afterEach(() => {
    // Restore the original navigator.geolocation
    navigator.geolocation = originalGeolocation;
  });

  it("renders without crashing", () => {
    render(<LocationPicker onLocationChange={() => {}} />);
  });

  // it("displays the GoogleMap component when the popover is triggered", () => {
  //   render(<LocationPicker onLocationChange={() => {}} />);
  //   const mapPinButton = screen.getByRole("button", { name: /map pin/ });
  //   fireEvent.click(mapPinButton);
  //   expect(screen.getByTestId("google-map")).toBeInTheDocument();
  // });
});
