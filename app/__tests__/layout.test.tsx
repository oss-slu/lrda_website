import Layout from "../layout";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

describe("Layout for the front page", () => {
    it("Renders the component", () => {
      render(<Layout/>);
    });
  });