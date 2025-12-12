"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect } from "react";

export type UserRole =
  | "superuser"
  | "admin"
  | "empresa"
  | "subusuario"
  | "auditoria"
  | "contralor";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId?: string;
  companyName?: string;
  companyEstado?: boolean;
  companyRecargo?: number;
  companyPorcentajeDevolucion?: string;
  centroCostoId?: string;
  centroCostoName?: string;
  centroCostoEstado?: boolean;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  getToken: () => string | null;
}

export interface TokenPayload {
  exp: number;
  iat: number;
  id: number;
  email: string;
  rol: string;
  empresa_id?: number;
  centro_costo_id?: number;
}

export const useTokenExpiration = (
  checkInterval: number = 30_000,
  logoutThresholdMs: number = 15 * 60 * 1000
) => {
  const { token, logout, getToken } = useAuth();

  useEffect(() => {
    let mounted = true;

    const getCurrentToken = () => {
      try {
        return getToken ? getToken() : token;
      } catch {
        return token;
      }
    };

    const decodeTokenSafe = (t: string | null) => {
      if (!t) return null;
      try {
        const payloadB64 = t.split(".")[1];
        if (!payloadB64) return null;
        const json =
          typeof window !== "undefined"
            ? atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"))
            : Buffer.from(payloadB64, "base64").toString("utf8");
        return JSON.parse(json) as { exp?: number };
      } catch (e) {
        console.error("decode token error", e);
        return null;
      }
    };

    const checkToken = () => {
      if (!mounted) return;
      const t = getCurrentToken();
      if (!t) {
        return;
      }

      const payload = decodeTokenSafe(t);
      if (!payload || !payload.exp) {
        logout();
        return;
      }

      const expirationMs = payload.exp * 1000;
      const now = Date.now();
      const msLeft = expirationMs - now;

      if (msLeft <= 0 || msLeft < logoutThresholdMs) {
        logout();
      }
    };

    checkToken();
    const id = setInterval(checkToken, checkInterval);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [token, logout, getToken, checkInterval, logoutThresholdMs]);
};

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

          const data = await res.json().catch(() => ({}));

          if (!res.ok) {
            return {
              success: false,
              message: data.message || "Error al iniciar sesión",
            };
          }

          const token = data.token ?? null;
          const rawUser = data.user ?? null;

          if (!token || !rawUser) {
            return {
              success: false,
              message: "Respuesta inválida del servidor",
            };
          }

          const user: User = {
            id: String(rawUser.id),
            email: rawUser.email,
            name: rawUser.nombre,
            role: (rawUser.rol?.trim() || "user") as UserRole,
            companyId: data.empresa ? String(data.empresa.id) : undefined,
            companyName: data.empresa?.nombre,
            companyEstado: data.empresa?.estado,
            companyRecargo: data.empresa?.recargo,
            companyPorcentajeDevolucion: data.empresa?.porcentaje_devolucion,
            centroCostoId: data.centroCosto
              ? String(data.centroCosto.id)
              : undefined,
            centroCostoName: data.centroCosto?.nombre,
            centroCostoEstado: data.centroCosto?.estado,
          };

          set({ token, user, isAuthenticated: true });

          return { success: true };
        } catch (err) {
          console.error("login error:", err);
          return {
            success: false,
            message: "No hay conexión con el servidor",
          };
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

export const decodeToken = (token: string | null): TokenPayload | null => {
  if (!token) return null;

  try {
    // Los tokens JWT tienen 3 partes separadas por puntos: header.payload.signature
    const payload = token.split(".")[1];

    const decodedPayload = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    ) as TokenPayload;

    return decodedPayload;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

export const getTokenExpirationTime = (token: string | null): number | null => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return null;

  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();

  return expirationTime - currentTime;
};

export const isTokenExpired = (token: string | null): boolean => {
  const timeRemaining = getTokenExpirationTime(token);
  return timeRemaining !== null && timeRemaining <= 0;
};

export const getTokenTimeRemaining = (token: string | null): string => {
  const timeRemaining = getTokenExpirationTime(token);

  if (timeRemaining === null) return "Token inválido";
  if (timeRemaining <= 0) return "Token expirado";

  const minutes = Math.floor(timeRemaining / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }

  return `${minutes}m`;
};
