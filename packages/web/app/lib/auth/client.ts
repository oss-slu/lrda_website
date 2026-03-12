import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';
import { API_URL } from '../services/api';

export const authClient = createAuthClient({
  baseURL: API_URL,
  basePath: '/api/auth',
  plugins: [adminClient()],
});

// Typed wrapper for email sign in
export async function signInWithEmail(email: string, password: string) {
  return authClient.signIn.email({
    email,
    password,
  });
}

// Typed wrapper for email sign up
export async function signUpWithEmail(data: {
  email: string;
  password: string;
  name: string;
  isInstructor?: boolean;
  pendingInstructorDescription?: string;
  instructorId?: string;
}) {
  return authClient.signUp.email(data);
}

// Get current session
export async function getCurrentSession() {
  return authClient.getSession();
}

// Sign out
export async function signOut() {
  return authClient.signOut();
}
