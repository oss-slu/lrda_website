import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import PublishToggle from '../lib/components/noteElements/publish_toggle';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { User } from '../lib/models/user_class';


beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
   
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear all mocks
    jest.clearAllTimers(); // Clear all timers
    console.log("All mocks and timers have been cleared");
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

test('PublishToggle displays initial state', () => {
  const { getByText } = render(<PublishToggle isPublished={true} noteId={''} userId={null} />);
  const publishButton = getByText(/publish/i);
  expect(publishButton).toBeInTheDocument();
});

test('PublishToggle calls onPublishClick on click', () => {
  const onPublishClickMock = jest.fn();
  const { getByText } = render(<PublishToggle isPublished={false} onPublishClick={onPublishClickMock} noteId={''} userId={null} />);
  const publishButton = getByText(/publish/i);

  fireEvent.click(publishButton);
  expect(onPublishClickMock).toHaveBeenCalledTimes(1);
});

test('PublishToggle updates when isPublished prop changes', () => {
  const { getByText, rerender } = render(<PublishToggle isPublished={false} noteId={''} userId={null} />);
  const publishButton = getByText(/publish/i);

  expect(publishButton).toBeInTheDocument();
  rerender(<PublishToggle isPublished={true} noteId={''} userId={null} />);
  expect(publishButton).toBeInTheDocument();
});
