// frontend/src/lib/auth-store.ts
//
// Same as before but now also sets/clears a cookie when logging in/out.
// The cookie is needed by Next.js middleware (which can't read localStorage).

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        localStorage.setItem("access_token", token);
        setCookie("access_token", token, 1); // 1 day cookie for middleware
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem("access_token");
        deleteCookie("access_token");
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: "mindguard-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
