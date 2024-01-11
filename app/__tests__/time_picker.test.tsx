import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import TimePicker from "../lib/components/noteElements/time_picker";

describe("TimePicker", () => {
  const initialDate = new Date(2022, 5, 10, 15, 30); // June 10, 2022, 15:30

  it("initializes with the provided date", () => {
    render(<TimePicker initialDate={initialDate} />);
    expect(screen.getByText(/Fri Jun 10 2022 3:30 PM/)).toBeInTheDocument();
  });

  it("updates the date when a new day is selected", () => {
    const mockOnTimeChange = jest.fn();
    render(
      <TimePicker initialDate={initialDate} onTimeChange={mockOnTimeChange} />
    );

    // Open the popover
    const button = screen.getByRole("button", {
      name: /Fri Jun 10 2022 3:30 PM/,
    });
    fireEvent.click(button);

    // Find the day cell and click it
    // This assumes the calendar day cells contain the day number as text content
    const newDayCell = screen.getByText("11", {
      selector: "[role='gridcell']",
    });
    fireEvent.click(newDayCell);

    expect(mockOnTimeChange).toHaveBeenCalled();
    expect(mockOnTimeChange.mock.calls[0][0]).toBeInstanceOf(Date);
  });

  it("updates the time when the time input is changed", () => {
    const mockOnTimeChange = jest.fn();
    render(
      <TimePicker initialDate={initialDate} onTimeChange={mockOnTimeChange} />
    );

    // Open the popover
    const button = screen.getByRole("button");
    fireEvent.click(button);

    const timeInput = screen.getByDisplayValue(/15:30/);
    fireEvent.change(timeInput, { target: { value: "16:45" } });

    expect(mockOnTimeChange).toHaveBeenCalled();
    expect(mockOnTimeChange.mock.calls[0][0]).toBeInstanceOf(Date);
  });
});
