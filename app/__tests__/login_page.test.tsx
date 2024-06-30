import React from 'react';
import { render, screen, fireEvent } from "@testing-library/react";
import Page from "../lib/pages/loginPage/page";
import moxios from 'moxios';

jest.mock('firebase/auth', () => {
  const originalModule = jest.requireActual('firebase/auth');
  return {
    ...originalModule,
    getAuth: jest.fn(() => ({
      currentUser: {
        uid: 'mockUserId',
        email: 'mock@example.com',
      },
    })),
    signInWithEmailAndPassword: jest.fn((auth, email, password) => {
      return Promise.resolve({
        user: {
          uid: 'mockUserId',
          email,
        },
      });
    }),
    signOut: jest.fn(() => Promise.resolve()),
    onAuthStateChanged: jest.fn((auth, callback) => {
      callback({
        uid: 'mockUserId',
        email: 'mock@example.com',
      });
    }),
  };
});

describe("Page Component", () => {
  let originalError: any;

  beforeEach(() => {
    // Save the original console.error method
    originalError = console.error;
    // Mock the console.error method to suppress error messages
    console.error = jest.fn();

    // Initialize moxios before each test
    moxios.install();
    moxios.stubRequest(/.*/, {
      status: 200,
      response: {
        "@id": "mockId123",
        name: "JohnDoe",
        roles: {
          administrator: true,
          contributor: false,
        },
        uid: "mockUserId",
      },
    });
  });

  afterEach(() => {
    // Restore the original console.error method
    console.error = originalError;

    // Uninstall moxios after each test
    moxios.uninstall();
  });

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
