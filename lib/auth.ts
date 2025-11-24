"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "user" | "admin" | "superuser";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId?: string;
  companyName?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  getToken?: () => string | null;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },

      login: async (email: string, password: string) => {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          if (!res.ok) {
            return false;
          }

          const data = await res.json();
          const token = data.token ?? null;
          const rawUser = data.user ?? null;

          if (!token || !rawUser) return false;

          const user: User = {
            id: String(rawUser.id ?? rawUser._id ?? ""),
            email: rawUser.email ?? rawUser.correo ?? "",
            name: rawUser.nombre ?? rawUser.name ?? "",
            role: (rawUser.rol ?? rawUser.role ?? "user") as UserRole,
            companyId: rawUser.empresa ? String(rawUser.empresa) : undefined,
            companyName: rawUser.empresa_nombre ?? rawUser.companyName ?? undefined,
          };

          set({ token, user, isAuthenticated: true });
          return true;
        } catch (err) {
          console.error("login error:", err);
          return false;
        }
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
      },

      getToken: () => {
        return get().token ?? null;
      },
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export const useAuthHydration = () => {
  return useAuth((state) => state._hasHydrated);
};
