import React, { ReactNode } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LocationPicker from "../lib/components/location_component";
import "@testing-library/jest-dom";

jest.mock("@react-google-maps/api", () => ({
  GoogleMap: ({ children }: { children: ReactNode }) => (
    <div data-testid="google-map">{children}</div>
  ),
  MarkerF: () => <div />,
  useJsApiLoader: () => ({ isLoaded: true }),
}));

const mockGeolocation = {
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
};

describe("LocationPicker", () => {
  it("renders without crashing", () => {
    render(<LocationPicker />);
  });

  it("displays the initial longitude and latitude", () => {
    render(<LocationPicker />);
    const longitude = screen.getByText("0.0000000");
    const latitude = screen.getByText("0.0000000");
    expect(longitude).toBeInTheDocument();
    expect(latitude).toBeInTheDocument();
  });

  it("displays the GoogleMap component when the popover is triggered", () => {
    render(<LocationPicker />);
    const mapPinButton = screen.getByRole("button", { name: /map pin/ });
    fireEvent.click(mapPinButton);
    expect(screen.getByTestId("google-map")).toBeInTheDocument();
  });
});
