import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserData } from "../../types";
import { auth, db } from "../config/firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import ApiService from "../utils/api_service";

interface AuthState {
  // State
  user: UserData | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Getters (computed from state)
  getId: () => string | null;
  getName: () => string | null;
  getRoles: () => { administrator: boolean; contributor: boolean } | null;

  // Actions
  login: (email: string, password: string) => Promise<string>;
  logout: () => Promise<void>;
  setUser: (user: UserData | null) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      isLoading: true,
      isInitialized: false,

      getId: () => {
        const { user } = get();
        return user?.uid ?? null;
      },

      getName: () => {
        const { user } = get();
        return user?.name ?? null;
      },

      getRoles: () => {
        const { user } = get();
        return user?.roles ?? null;
      },

      setUser: (userData: UserData | null) => {
        set({
          user: userData,
          isLoggedIn: userData !== null,
          isLoading: false,
        });
      },

      login: async (email: string, password: string): Promise<string> => {
        if (!auth) throw new Error("Firebase auth is not initialized");

        set({ isLoading: true });

        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          const token = await firebaseUser.getIdToken();

          // Store token in localStorage and cookie
          localStorage.setItem("authToken", token);
          document.cookie = `authToken=${token}; path=/`;

          // Fetch user data from API or Firestore
          let userData = await ApiService.fetchUserData(firebaseUser.uid);

          if (!userData && db) {
            const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
            if (userDoc.exists()) {
              userData = userDoc.data() as UserData;
            }
          }

          if (userData) {
            set({ user: userData, isLoggedIn: true, isLoading: false });
          } else {
            set({ isLoading: false });
          }

          return "success";
        } catch (error) {
          set({ isLoading: false });
          console.error("Login error:", error);
          return Promise.reject(error);
        }
      },

      logout: async () => {
        if (!auth) return;

        try {
          await signOut(auth);

          // Clear storage
          localStorage.removeItem("authToken");
          localStorage.removeItem("userData");
          document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

          set({ user: null, isLoggedIn: false });
        } catch (error) {
          console.error("Logout error:", error);
        }
      },

      initialize: () => {
        if (get().isInitialized) return;

        if (!auth) {
          set({ isLoading: false, isInitialized: true });
          return;
        }

        // Set up Firebase auth state listener
        onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            // Try to fetch user data
            let userData = await ApiService.fetchUserData(firebaseUser.uid);

            if (!userData && db) {
              const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
              if (userDoc.exists()) {
                userData = userDoc.data() as UserData;
              }
            }

            set({
              user: userData,
              isLoggedIn: userData !== null,
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
        });
      },
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        // Only persist user data, not loading/initialized states
        user: state.user,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);

// Initialize auth listener when module loads (client-side only)
if (typeof window !== "undefined") {
  // Delay initialization to ensure Firebase is ready
  setTimeout(() => {
    useAuthStore.getState().initialize();
  }, 0);
}
