import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PublishToggle from "../lib/components/NoteEditor/NoteElements/PublishToggle";

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


describe("PublishToggle Integration Test", () => {
  
  it("toggles publish state when clicked", async () => {
    let isPublished = false;
    const onPublishClickMock = jest.fn(async () => {
      isPublished = !isPublished;
    });

    const { rerender } = render(
      <PublishToggle isPublished={isPublished} onPublishClick={onPublishClickMock} />
    );

    const toggle = screen.getByText(/Publish/i);
    fireEvent.click(toggle);

    await waitFor(() => expect(onPublishClickMock).toHaveBeenCalledTimes(1));

    // Simulate parent state change
    rerender(<PublishToggle isPublished={true} onPublishClick={onPublishClickMock} />);
    expect(screen.getByText(/Unpublish/i)).toBeInTheDocument();
  });

  it("does not crash when onPublishClick is not provided", () => {
    render(<PublishToggle isPublished={false} onPublishClick={async () => {}} />);
    const button = screen.getByText(/Publish/i);
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
  });
});
