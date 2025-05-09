
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

// Mock Realtime Database (if needed by imports)
jest.mock("firebase/database", () => ({
  getDatabase: jest.fn(),
}));

// Mock Firebase Auth
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
    signInWithEmailAndPassword: jest.fn((auth, email, password) =>
      Promise.resolve({ user: { uid: 'mockUserId', email } })
    ),
    signOut: jest.fn(() => Promise.resolve()),
    onAuthStateChanged: jest.fn((auth, callback) => {
      callback({ uid: 'mockUserId', email: 'test@gmail.com' });
    }),
  };
});

// Mock Next.js router (if next/router is imported)
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

afterEach(() => {
  jest.clearAllMocks();
  cleanup();
});

describe("PublishToggle Component", () => {
  it("renders the publish button with correct initial state", () => {
    render(
      <PublishToggle
        isPublished={false}
        onPublishClick={jest.fn()}
        noteId=""
        userId={null}
      />
    );
    const publishButton = screen.getByText(/Publish/i);
    expect(publishButton).toBeInTheDocument();
    expect(publishButton).toHaveClass("text-black");
  });

  it("renders as published when isPublished is true", () => {
    render(
      <PublishToggle
        isPublished={true}
        onPublishClick={jest.fn()}
        noteId=""
        userId={null}
      />
    );
    const unpublishButton = screen.getByText(/Unpublish/i);
    expect(unpublishButton).toBeInTheDocument();
    expect(unpublishButton).toHaveClass("text-green-500");
  });

  it("calls onPublishClick when clicked", async () => {
    const onPublishClickMock = jest.fn().mockResolvedValue(undefined);
    render(
      <PublishToggle
        isPublished={false}
        onPublishClick={onPublishClickMock}
        noteId=""
        userId={null}
      />
    );
    fireEvent.click(screen.getByText(/Publish/i));
    await waitFor(() => expect(onPublishClickMock).toHaveBeenCalledTimes(1));
  });

  it("toggles from Publish to Unpublish when clicked", async () => {
    let isPublished = false;
    const onPublishClickMock = jest.fn(async () => {
      isPublished = !isPublished;
    });

    const { rerender } = render(
      <PublishToggle
        isPublished={isPublished}
        onPublishClick={onPublishClickMock}
        noteId=""
        userId={null}
      />
    );

    // Before click
    expect(screen.getByText(/Publish/i)).toBeInTheDocument();

    // Click to publish
    fireEvent.click(screen.getByText(/Publish/i));
    await waitFor(() => expect(onPublishClickMock).toHaveBeenCalled());

    // Re-render as published
    rerender(
      <PublishToggle
        isPublished={true}
        onPublishClick={onPublishClickMock}
        noteId=""
        userId={null}
      />
    );

    // After click
    expect(screen.getByText(/Unpublish/i)).toBeInTheDocument();
  });

  it("updates correctly when isPublished prop changes", () => {
    const { rerender } = render(
      <PublishToggle
        isPublished={false}
        onPublishClick={jest.fn()}
        noteId=""
        userId={null}
      />
    );
    expect(screen.getByText(/Publish/i)).toHaveClass("text-black");

    rerender(
      <PublishToggle
        isPublished={true}
        onPublishClick={jest.fn()}
        noteId=""
        userId={null}
      />
    );
    expect(screen.getByText(/Unpublish/i)).toHaveClass("text-green-500");
  });
});
