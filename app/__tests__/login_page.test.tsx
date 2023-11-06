import { render, screen, fireEvent } from "@testing-library/react";
import Page from "../lib/pages/loginPage/page";

describe("Page Component", () => {

  it("renders the page component without crashing", () => {
    render(<Page />);
  });

  it("renders essential elements", () => {
    render(<Page />);
    expect(screen.getByPlaceholderText("Username...")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password...")).toBeInTheDocument();
    expect(screen.getByText("Forgot Password?")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });  

  it("captures username input", () => {
    render(<Page />);
    fireEvent.change(screen.getByPlaceholderText("Username..."), { target: { value: 'testuser' } });
    expect((screen.getByPlaceholderText("Username...") as HTMLInputElement).value).toBe('testuser');
  });
  
  it("captures password input", () => {
    render(<Page />);
    fireEvent.change(screen.getByPlaceholderText("Password..."), { target: { value: 'testpass' } });
    expect((screen.getByPlaceholderText("Password...") as HTMLInputElement).value).toBe('testpass');
  });
});
