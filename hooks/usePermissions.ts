"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";

let cachedPermissions: Record<string, boolean> | null = null;
let cachedRole: string | null = null;

export function usePermissions() {
  const { user, token } = useAuth();
  const [permisos, setPermisos] = useState<Record<string, boolean>>(
    cachedPermissions || {}
  );
  const [loading, setLoading] = useState<boolean>(!cachedPermissions);

  const role = user?.role;

  const fetchPermisos = useCallback(async () => {
    if (!token || !role) {
      setPermisos({});
      setLoading(false);
      return;
    }

    // Superuser siempre tiene todos los permisos activos
    if (role === "superuser") {
      setPermisos({});
      setLoading(false);
      return;
    }

    // Usar caché de sesión si coincide el rol
    if (cachedPermissions && cachedRole === role) {
      setPermisos(cachedPermissions);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/permisos/mis-permisos", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        const map = data.permisos || {};
        cachedPermissions = map;
        cachedRole = role;
        setPermisos(map);
      }
    } catch (err) {
      console.error("Error al cargar permisos:", err);
    } finally {
      setLoading(false);
    }
  }, [token, role]);

  useEffect(() => {
    fetchPermisos();
  }, [fetchPermisos]);

  /**
   * Valida si el usuario actual tiene una acción permitida.
   * - Si es superuser, siempre retorna true.
   * - Si no se especifica clave, retorna false.
   * - En cualquier otro caso, consulta el mapa de permisos.
   */
  const hasPermission = useCallback(
    (clave: string): boolean => {
      if (!role) return false;
      if (role === "superuser") return true; // Superuser bypass total
      return Boolean(permisos[clave]);
    },
    [role, permisos]
  );

  const reloadPermissions = useCallback(async () => {
    cachedPermissions = null;
    cachedRole = null;
    await fetchPermisos();
  }, [fetchPermisos]);

  return {
    hasPermission,
    can: hasPermission,
    permisos,
    loading,
    reloadPermissions,
  };
}
