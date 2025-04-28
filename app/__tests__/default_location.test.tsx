// location_component.test.tsx

import { render, fireEvent, screen } from "@testing-library/react";
import LocationPicker from "../components/location_component"; // adjust this path to where your file is

describe("LocationPicker Component", () => {
  it("renders the location button", () => {
    render(<LocationPicker onLocationChange={() => {}} />);
    expect(screen.getByRole("button", { name: /location/i })).toBeInTheDocument();
  });

  it("expands the map when location button is clicked", () => {
    render(<LocationPicker onLocationChange={() => {}} />);
    const button = screen.getByRole("button", { name: /location/i });
    fireEvent.click(button);

    // Expect the map modal to be visible after clicking
    expect(screen.getByPlaceholderText("Search Location")).toBeInTheDocument();
  });

  it("tries to grab current location when the map is opened", () => {
    // Mock geolocation
    const getCurrentPositionMock = jest.fn();
    global.navigator.geolocation = {
      getCurrentPosition: getCurrentPositionMock,
    } as any;

    render(<LocationPicker onLocationChange={() => {}} />);
    const button = screen.getByRole("button", { name: /location/i });
    fireEvent.click(button);

    // Expect geolocation to have been called
    expect(getCurrentPositionMock).toHaveBeenCalled();
  });

  it("handles geolocation failure gracefully", () => {
    const errorMock = jest.fn();
    global.navigator.geolocation = {
      getCurrentPosition: (_, errorCallback) => {
        errorCallback({ message: "User denied Geolocation" });
      },
    } as any;

    render(<LocationPicker onLocationChange={() => {}} />);
    const button = screen.getByRole("button", { name: /location/i });
    fireEvent.click(button);

    // (Optional) Test: could add assertion for an error message if you show one
    // expect(screen.getByText(/unable to fetch your location/i)).toBeInTheDocument();
  });
});
