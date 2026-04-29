// frontend/src/lib/auth-store.ts
//
// Global auth state using Zustand.
//
// WHY ZUSTAND OVER REACT CONTEXT?
// Context causes unnecessary re-renders in large trees.
// Zustand is a tiny (1KB) state manager — components only re-render
// when the specific slice of state they subscribe to changes.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  // persist middleware: saves state to localStorage automatically
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        // Also save token to localStorage for the API interceptor
        localStorage.setItem("access_token", token);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem("access_token");
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: "mindguard-auth",              // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({            // only persist these fields
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
