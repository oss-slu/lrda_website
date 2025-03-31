import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TimePicker from "../lib/components/noteElements/time_picker";

describe("TimePicker", () => {
  const initialDate = new Date(2022, 5, 10, 15, 30); // June 10, 2022

  it("initializes with the provided date", () => {
    render(<TimePicker initialDate={initialDate} />);
    expect(screen.getByText(/Fri Jun 10 2022/)).toBeInTheDocument();
  });

  it("updates the date when a new day is selected", async () => {
    const mockOnTimeChange = jest.fn();
    render(<TimePicker initialDate={initialDate} onTimeChange={mockOnTimeChange} />);

    const trigger = screen.getByRole("button", { name: /open calendar/i });
    fireEvent.click(trigger);

    // Find day "11" and simulate click
    const day11 = await screen.findByText("11");
    fireEvent.click(day11);

    expect(mockOnTimeChange).toHaveBeenCalled();
    const selected = mockOnTimeChange.mock.calls[0][0];
    expect(selected).toBeInstanceOf(Date);
    expect(selected.getDate()).toBe(11);
  });

  it("updates the time when the time input is changed", async () => {
    const mockOnTimeChange = jest.fn();
    render(<TimePicker initialDate={initialDate} onTimeChange={mockOnTimeChange} />);

    const trigger = screen.getByRole("button", { name: /open calendar/i });
    fireEvent.click(trigger);

    const timeInput = screen.getByDisplayValue("15:30");
    fireEvent.change(timeInput, { target: { value: "16:45" } });

    expect(mockOnTimeChange).toHaveBeenCalled();
    const updated = mockOnTimeChange.mock.calls[0][0];
    expect(updated.getHours()).toBe(16);
    expect(updated.getMinutes()).toBe(45);
  });

  it("updates the date when month and year dropdowns change", async () => {
    const mockOnTimeChange = jest.fn();
    render(<TimePicker initialDate={initialDate} onTimeChange={mockOnTimeChange} />);

    const trigger = screen.getByRole("button", { name: /open calendar/i });
    fireEvent.click(trigger);

    const dropdowns = await screen.findAllByRole("combobox");
    const [monthDropdown, yearDropdown] = dropdowns;

    fireEvent.change(monthDropdown, { target: { value: "0" } }); // January
    fireEvent.change(yearDropdown, { target: { value: "2023" } }); // 2023

    await waitFor(() => {
      expect(mockOnTimeChange).toHaveBeenCalled();
    });

    const updatedDate = mockOnTimeChange.mock.calls.at(-1)[0];
    expect(updatedDate).toBeInstanceOf(Date);
    expect(updatedDate.getFullYear()).toBe(2022);
    expect(updatedDate.getMonth()).toBe(0); // January
    expect(updatedDate.getDate()).toBe(1); // defaulted to 1st
  });
});
