import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';

const apiUrl = import.meta.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export const authClient = createAuthClient({
  baseURL: apiUrl,
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

// Verify email with token
export async function verifyEmail(token: string) {
  return authClient.verifyEmail({
    query: {
      token,
    },
  });
}

// Export the useSession hook for components that need reactive session state
export const useSession = authClient.useSession;
