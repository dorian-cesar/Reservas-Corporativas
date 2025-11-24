"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "user" | "controller" | "superuser";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId?: string;
  companyName?: string;
}

interface AuthState {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  _hasHydrated: boolean; // Nueva propiedad para controlar la hidratación
  setHasHydrated: (state: boolean) => void;
}

// Mock users for demo
const MOCK_USERS = [
  {
    id: "1",
    email: "user@empresa1.com",
    password: "user123",
    name: "Juan Pérez",
    role: "user" as UserRole,
    companyId: "emp1",
    companyName: "Empresa Tecnológica S.A.",
  },
  {
    id: "2",
    email: "controller@empresa1.com",
    password: "controller123",
    name: "María González",
    role: "controller" as UserRole,
    companyId: "emp1",
    companyName: "Empresa Tecnológica S.A.",
  },
  {
    id: "3",
    email: "admin@sistema.com",
    password: "admin123",
    name: "Carlos Administrador",
    role: "superuser" as UserRole,
  },
  {
    id: "4",
    email: "user@empresa2.com",
    password: "user123",
    name: "Ana Martínez",
    role: "user" as UserRole,
    companyId: "emp2",
    companyName: "Logística Global Corp.",
  },
  {
    id: "5",
    email: "controller@empresa2.com",
    password: "controller123",
    name: "Roberto Silva",
    role: "controller" as UserRole,
    companyId: "emp2",
    companyName: "Logística Global Corp.",
  },
];

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },
      login: async (email: string, password: string) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 800));

        const user = MOCK_USERS.find(
          (u) => u.email === email && u.password === password
        );

        if (user) {
          const { password: _, ...userWithoutPassword } = user;
          set({ user: userWithoutPassword, isAuthenticated: true });
          return true;
        }
        return false;
      },
      logout: () => {
        set({ user: null, isAuthenticated: false });
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

// Hook para verificar si la autenticación está hidratada
export const useAuthHydration = () => {
  return useAuth((state) => state._hasHydrated);
};
