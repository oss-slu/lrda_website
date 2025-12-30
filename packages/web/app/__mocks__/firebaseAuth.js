// __mocks__/firebaseAuth.js

export const signInWithEmailAndPassword = jest.fn((auth, email, password) => {
  return Promise.resolve({
    user: {
      uid: 'mockUserId',
      email,
    },
  });
});

export const signOut = jest.fn(() => Promise.resolve());

// Improved onAuthStateChanged with cleanup function
export const onAuthStateChanged = jest.fn((auth, callback) => {
  callback({
    uid: 'mockUserId',
    email: 'mock@example.com',
  });

  // Return a function to simulate unsubscribing from the listener
  return jest.fn();
});

export const getAuth = jest.fn(() => ({
  currentUser: {
    uid: 'mockUserId',
    email: 'mock@example.com',
  },
}));
