import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import TimePicker from "../lib/components/noteElements/time_picker";

describe("TimePicker", () => {
  const initialDate = new Date(2022, 5, 10, 15, 30); // June 10, 2022, 15:30

  it("initializes with the provided date", () => {
    render(<TimePicker initialDate={initialDate} />);
    // Since the time part has been removed, check only for the date part
    expect(screen.getByText(/Fri Jun 10 2022/)).toBeInTheDocument();
  });

  it("updates the date when a new day is selected", async () => {
    const mockOnTimeChange = jest.fn();
    render(
      <TimePicker initialDate={initialDate} onTimeChange={mockOnTimeChange} />
    );

    // Assuming your component correctly triggers the PopoverTrigger with a click
    // and your CalendarIcon or surrounding div acts as the trigger:
    const trigger = screen.getByRole('button'); // If this doesn't work, you might need to adjust based on your actual DOM structure
    fireEvent.click(trigger);

    // Simulate selecting a new day in the calendar
    // This part depends on how your Calendar component renders each day and might need adjustment
    // The code below assumes clicking a day directly changes the date
    const newDayCell = await screen.findByText("11"); // Adjust the selector if needed
    fireEvent.click(newDayCell);

    // Check if onTimeChange was called with a Date object
    expect(mockOnTimeChange).toHaveBeenCalled();
    expect(mockOnTimeChange.mock.calls[0][0]).toBeInstanceOf(Date);
  });

  // Updating the time test to match the new format and interactions
  // it("updates the time when the time input is changed", async () => {
  //   const mockOnTimeChange = jest.fn();
  //   render(
  //     <TimePicker initialDate={initialDate} onTimeChange={mockOnTimeChange} />
  //   );

  //   // Trigger the popover to open
  //   const trigger = screen.getByRole('button'); // Adjust based on your actual DOM
  //   fireEvent.click(trigger);

  //   // Adjust the value selection to match the input's format
  //   const timeInput = screen.getByDisplayValue("15:30");
  //   fireEvent.change(timeInput, { target: { value: "16:45" } });

  //   expect(mockOnTimeChange).toHaveBeenCalled();
  //   expect(mockOnTimeChange.mock.calls[0][0]).toBeInstanceOf(Date);
  // });
});
