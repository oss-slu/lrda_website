import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import PublishToggle from "../lib/components/noteElements/publish_toggle";

// 1. MOCK out User.getInstance() so it never tries to hit Firebase:
jest.mock("../lib/models/user_class", () => {
  return {
    User: {
      getInstance: () => ({
        // student=false, instructor=true
        getRoles: jest.fn().mockResolvedValue({ contributor: false, administrator: true }),
        getId:    jest.fn().mockResolvedValue("mock-user-id"),
      }),
    },
  };
});

// 2. MOCK out your ApiService.overwriteNote to always succeed
jest.mock("../lib/utils/api_service", () => ({
  overwriteNote: jest.fn().mockResolvedValue({ ok: true }),
}));

afterEach(() => {
  jest.clearAllMocks();
  cleanup();
});

jest.mock("firebase/database", () => ({
  getDatabase: jest.fn(), // Mock Realtime Database
}));

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
        email: 'test@gmail.com',
      });
    }),
  };
});

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

describe("PublishToggle Component", () => {
  it("renders the publish button with correct initial state", () => {
    render(<PublishToggle isPublished={false} onPublishClick={jest.fn()} noteId={""} userId={null} />);
    const publishButton = screen.getByText(/Publish/i);
    expect(publishButton).toBeInTheDocument();
    expect(publishButton).toHaveClass("text-black");
  });

  it("renders as published when isPublished is true", () => {
    render(<PublishToggle isPublished={true} onPublishClick={jest.fn()} />);
    const publishButton = screen.getByText(/Unpublish/i);
    expect(publishButton).toBeInTheDocument();
    expect(publishButton).toHaveClass("text-green-500");
  });

  it("calls onPublishClick when clicked", async () => {
    const onPublishClickMock = jest.fn().mockResolvedValue(undefined);
    render(<PublishToggle isPublished={false} onPublishClick={onPublishClickMock} />);
    const button = screen.getByText(/Publish/i);
    fireEvent.click(button);
    await waitFor(() => expect(onPublishClickMock).toHaveBeenCalledTimes(1));
  });

  it("displays publish notification on click and hides after timeout", async () => {
    let isPublished = false;
    const onPublishClickMock = jest.fn(async () => {
      isPublished = !isPublished;
    });
  
    const { rerender } = render(
      <PublishToggle isPublished={isPublished} onPublishClick={onPublishClickMock} />
    );
  
    const button = screen.getByText(/Publish/i);
    fireEvent.click(button);
  
    // Simulate prop change after async action
    await waitFor(() => expect(onPublishClickMock).toHaveBeenCalled());
  
    // Re-render with new publish state
    rerender(<PublishToggle isPublished={true} onPublishClick={onPublishClickMock} />);
  
    const notification = await screen.findByText(/Note published successfully!/i);
    expect(notification).toBeInTheDocument();
  
    await waitFor(
      () => {
        expect(screen.queryByText(/Note published successfully!/i)).not.toBeInTheDocument();
      },
      { timeout: 3500 }
    );
  });  

  it("updates correctly when isPublished prop changes", () => {
    const { rerender } = render(<PublishToggle isPublished={false} onPublishClick={jest.fn()} />);
    const button = screen.getByText(/Publish/i);
    expect(button).toHaveClass("text-black");

    rerender(<PublishToggle isPublished={true} onPublishClick={jest.fn()} />);
    const updatedButton = screen.getByText(/Unpublish/i);
    expect(updatedButton).toHaveClass("text-green-500");
  });
});
