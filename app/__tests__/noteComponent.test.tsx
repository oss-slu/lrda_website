import React from "react";
import NoteComponent from "../lib/components/noteComponent";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { RichUtils } from 'draft-js';

jest.mock('draft-js', () => ({
  ...jest.requireActual('draft-js'),
  RichUtils: {
    ...jest.requireActual('draft-js').RichUtils,
    toggleInlineStyle: jest.fn(jest.requireActual('draft-js').RichUtils.toggleInlineStyle),
  },
}));

describe("NoteComponent Component", () => {
  
  it("renders without crashing", () => {
    render(<NoteComponent />);
    expect(screen.getByText("Draft.js Testing Environment")).toBeInTheDocument();
  });

  describe("Button interactions", () => {
    it("toggles bold style when Bold button is clicked", () => {
      render(<NoteComponent />);
      const boldButton = screen.getByText("Bold");
      fireEvent.click(boldButton);
      expect(RichUtils.toggleInlineStyle).toHaveBeenCalledWith(expect.anything(), 'BOLD');
    });

    it("toggles italic style when Italic button is clicked", () => {
      render(<NoteComponent />);
      const italicButton = screen.getByText("Italic");
      fireEvent.click(italicButton);
      expect(RichUtils.toggleInlineStyle).toHaveBeenCalledWith(expect.anything(), 'ITALIC');
    });
  });
});
