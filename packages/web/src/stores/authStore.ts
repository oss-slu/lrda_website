import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserProfile } from '@/types';
import {
  signInWithEmail,
  signUpWithEmail,
  signOut as authSignOut,
  getCurrentSession,
} from '@/auth/client';
import { fetchMe } from '@/services';

interface AuthState {
  // State
  user: UserProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  login: (email: string, password: string) => Promise<string>;
  signup: (data: {
    email: string;
    password: string;
    name: string;
    pendingInstructorDescription?: string;
    instructorId?: string;
  }) => Promise<string>;
  logout: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      isLoading: true,
      isInitialized: false,

      login: async (email: string, password: string): Promise<string> => {
        set({ isLoading: true });

        try {
          const response = await signInWithEmail(email, password);

          if (response.error) {
            set({ isLoading: false });
            throw new Error(response.error.message || 'Login failed');
          }

          // Fetch full user profile from API
          const profile = await fetchMe();

          if (profile) {
            set({
              user: profile,
              isLoggedIn: true,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }

          return 'success';
        } catch (error) {
          set({ isLoading: false });
          console.error('Login error:', error);
          return Promise.reject(error);
        }
      },

      signup: async (data: {
        email: string;
        password: string;
        name: string;
        pendingInstructorDescription?: string;
        instructorId?: string;
      }): Promise<string> => {
        set({ isLoading: true });

        try {
          const response = await signUpWithEmail(data);

          if (response.error) {
            set({ isLoading: false });
            throw new Error(response.error.message || 'Signup failed');
          }

          // Fetch full user profile from API
          const profile = await fetchMe();

          if (profile) {
            set({
              user: profile,
              isLoggedIn: true,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }

          return 'success';
        } catch (error) {
          set({ isLoading: false });
          console.error('Signup error:', error);
          return Promise.reject(error);
        }
      },

      logout: async () => {
        try {
          await authSignOut();
          set({
            user: null,
            isLoggedIn: false,
          });
        } catch (error) {
          console.error('Logout error:', error);
        }
      },

      initialize: () => {
        if (get().isInitialized) return;

        // Check for existing session
        getCurrentSession()
          .then(async response => {
            if (response.data?.session) {
              // Session exists, fetch user profile
              const profile = await fetchMe();

              if (profile) {
                set({
                  user: profile,
                  isLoggedIn: true,
                  isLoading: false,
                  isInitialized: true,
                });
              } else {
                set({
                  user: null,
                  isLoggedIn: false,
                  isLoading: false,
                  isInitialized: true,
                });
              }
            } else {
              set({
                user: null,
                isLoggedIn: false,
                isLoading: false,
                isInitialized: true,
              });
            }
          })
          .catch(error => {
            console.error('Session check error:', error);
            set({
              user: null,
              isLoggedIn: false,
              isLoading: false,
              isInitialized: true,
            });
          });
      },
    }),
    {
      name: 'auth-store',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        // Only persist user data, not loading/initialized states
        user: state.user,
        isLoggedIn: state.isLoggedIn,
      }),
      migrate: (persisted, version) => {
        if (version === 0) {
          // v0 -> v1: no schema change, just adding versioning
          return persisted as Pick<AuthState, 'user' | 'isLoggedIn'>;
        }
        return persisted as Pick<AuthState, 'user' | 'isLoggedIn'>;
      },
    },
  ),
);
