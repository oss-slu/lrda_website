import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserData, UserProfile } from '@/app/types';
import { toUserData } from '@/app/types';
import {
  signInWithEmail,
  signUpWithEmail,
  signOut as authSignOut,
  getCurrentSession,
} from '@/app/lib/auth/client';
import { fetchMe } from '@/app/lib/services';

interface AuthState {
  // State
  user: UserData | null;
  profile: UserProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Getters (computed from state) - maintain backward compatibility
  getId: () => string | null;
  getName: () => string | null;
  getRoles: () => { administrator: boolean; contributor: boolean } | null;

  // New getters for clean architecture
  isInstructor: () => boolean;
  isAdmin: () => boolean;

  // Actions
  login: (email: string, password: string) => Promise<string>;
  signup: (data: { email: string; password: string; name: string }) => Promise<string>;
  logout: () => Promise<void>;
  setUser: (user: UserData | null) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isLoggedIn: false,
      isLoading: true,
      isInitialized: false,

      // Legacy getters for backward compatibility
      getId: () => {
        const { user, profile } = get();
        return profile?.id ?? user?.uid ?? null;
      },

      getName: () => {
        const { user, profile } = get();
        return profile?.name ?? user?.name ?? null;
      },

      getRoles: () => {
        const { user, profile } = get();
        if (profile) {
          return {
            administrator: profile.role === 'admin',
            contributor: true,
          };
        }
        return user?.roles ?? null;
      },

      // New getters
      isInstructor: () => {
        const { profile, user } = get();
        return profile?.isInstructor ?? user?.isInstructor ?? false;
      },

      isAdmin: () => {
        const { profile, user } = get();
        return profile?.role === 'admin' || user?.roles?.administrator === true;
      },

      setUser: (userData: UserData | null) => {
        set({
          user: userData,
          isLoggedIn: userData !== null,
          isLoading: false,
        });
      },

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
            const userData = toUserData(profile);
            set({
              profile,
              user: userData,
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

      signup: async (data: { email: string; password: string; name: string }): Promise<string> => {
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
            const userData = toUserData(profile);
            set({
              profile,
              user: userData,
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
            profile: null,
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
                const userData = toUserData(profile);
                set({
                  profile,
                  user: userData,
                  isLoggedIn: true,
                  isLoading: false,
                  isInitialized: true,
                });
              } else {
                set({
                  user: null,
                  profile: null,
                  isLoggedIn: false,
                  isLoading: false,
                  isInitialized: true,
                });
              }
            } else {
              set({
                user: null,
                profile: null,
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
              profile: null,
              isLoggedIn: false,
              isLoading: false,
              isInitialized: true,
            });
          });
      },
    }),
    {
      name: 'auth-store',
      partialize: state => ({
        // Only persist user data, not loading/initialized states
        user: state.user,
        profile: state.profile,
        isLoggedIn: state.isLoggedIn,
      }),
    },
  ),
);

// Initialize auth when module loads (client-side only)
if (typeof window !== 'undefined') {
  // Delay initialization to ensure everything is ready
  setTimeout(() => {
    useAuthStore.getState().initialize();
  }, 0);
}
