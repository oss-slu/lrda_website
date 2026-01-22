import { createAuthClient } from 'better-auth/react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export const authClient = createAuthClient({
  baseURL: apiUrl,
  basePath: '/api/auth',
});

// Typed wrapper for email sign in
export async function signInWithEmail(email: string, password: string) {
  return authClient.signIn.email({
    email,
    password,
  });
}

// Typed wrapper for email sign up
export async function signUpWithEmail(data: { email: string; password: string; name: string }) {
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

// Forgot password - sends reset email
export async function forgotPassword(email: string) {
  return authClient.forgetPassword({
    email,
    redirectTo: '/reset-password',
  });
}

// Reset password with token
export async function resetPassword(newPassword: string) {
  return authClient.resetPassword({
    newPassword,
  });
}

// Export the useSession hook for components that need reactive session state
export const useSession = authClient.useSession;
