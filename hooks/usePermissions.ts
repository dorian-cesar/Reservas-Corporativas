"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";

let cachedPermissions: Record<string, boolean> | null = null;
let cachedRole: string | null = null;

export function usePermissions() {
  const { user, token } = useAuth();
  const [permisos, setPermisos] = useState<Record<string, boolean>>(
    cachedPermissions || {},
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
      if (permisos[clave]) return true;

      // Mapeo exhaustivo de alias y compatibilidad con base de datos
      const aliasMap: Record<string, string[]> = {
        // Estados de pago - Descuento
        estados_de_pago_aplicar_descuento_a_estado_de_pago: [
          "estados_de_pago_aplicar_descuento_en_edp",
        ],
        estados_de_pago_aplicar_descuento_en_edp: [
          "estados_de_pago_aplicar_descuento_a_estado_de_pago",
        ],

        // Cuentas corrientes - Pagar
        cuentas_corrientes_pagar_cargo_de_cuenta_corriente: [
          "cuentas_corrientes_pagar_linea_generada",
          "cuantas_corrientes_pagar_linea_generada",
        ],
        cuentas_corrientes_pagar_linea_generada: [
          "cuentas_corrientes_pagar_cargo_de_cuenta_corriente",
          "cuantas_corrientes_pagar_linea_generada",
        ],
        cuantas_corrientes_pagar_linea_generada: [
          "cuentas_corrientes_pagar_linea_generada",
          "cuentas_corrientes_pagar_cargo_de_cuenta_corriente",
        ],

        // Cuentas corrientes - Crear movimiento
        cuentas_corrientes_crear_movimiento_cargo_abono: [
          "cuentas_corrientes_crear_nuevo_movimiento",
          "cuantas_corrientes_crear_nuevo_movimiento",
        ],
        cuentas_corrientes_crear_nuevo_movimiento: [
          "cuentas_corrientes_crear_movimiento_cargo_abono",
          "cuantas_corrientes_crear_nuevo_movimiento",
        ],
        cuantas_corrientes_crear_nuevo_movimiento: [
          "cuentas_corrientes_crear_nuevo_movimiento",
          "cuentas_corrientes_crear_movimiento_cargo_abono",
        ],

        // Cuentas corrientes - Ver información
        cuentas_corrientes_ver_informacion_de_cuentas_corrientes: [
          "cuantas_corrientes_ver_informacion_de_cuentas_corrientes",
        ],
        cuantas_corrientes_ver_informacion_de_cuentas_corrientes: [
          "cuentas_corrientes_ver_informacion_de_cuentas_corrientes",
        ],

        // Cobranza
        cobranza_ver_informacion_de_cobranza: [
          "historial_de_cobranza_visualizar_modulo",
        ],
        cobranza_crear: [
          "historial_de_cobranza_crear",
        ],
        cobranza_eliminar: [
          "historial_de_cobranza_eliminar",
        ],
        historial_de_cobranza_visualizar_modulo: [
          "cobranza_ver_informacion_de_cobranza",
        ],
        historial_de_cobranza_crear: [
          "cobranza_crear",
        ],
        historial_de_cobranza_eliminar: [
          "cobranza_eliminar",
        ],

        // Reclamos
        reclamos_ver_informacion_de_reclamos: [
          "reclamos_visualizar_listado_de_reclamos",
        ],
        reclamos_visualizar_listado_de_reclamos: [
          "reclamos_ver_informacion_de_reclamos",
        ],
        reclamos_aprobar: [
          "reclamos_aprobar_reclamo",
        ],
        reclamos_rechazar: [
          "reclamos_rechazar_reclamo",
        ],

        // Centro de costo
        centro_de_costo_ver_informacion_de_centro_de_costo: [
          "centro_de_costo_ver_informacion_de_centros_de_costos",
        ],
        centro_de_costo_ver_informacion_de_centros_de_costos: [
          "centro_de_costo_ver_informacion_de_centro_de_costo",
        ],

        // Usuarios
        usuarios_ver_informacion_de_usuarios: [
          "usuarios_ver_informacion_de_usuario",
        ],
        usuarios_ver_informacion_de_usuario: [
          "usuarios_ver_informacion_de_usuarios",
        ],

        // Empresa - Morosidad
        empresa_modificar_morosidad_empresa: [
          "empresa_modicar_morocidad_empresa",
        ],
        empresa_modicar_morocidad_empresa: [
          "empresa_modificar_morosidad_empresa",
        ],

        // Boletos / Tickets
        tickets_ver_informacion_de_boletos: [
          "tickets_ver_informacion_de_tickets",
        ],
        tickets_ver_informacion_de_tickets: [
          "tickets_ver_informacion_de_boletos",
        ],

        // Reservas / Búsqueda
        reservas_ver_informacion_de_reservas: [
          "buscar_generar_busqueda_de_servicios",
          "buscar_generar_buequeda_de_servicios",
        ],
        buscar_generar_busqueda_de_servicios: [
          "buscar_generar_buequeda_de_servicios",
          "reservas_ver_informacion_de_reservas",
        ],
        buscar_generar_buequeda_de_servicios: [
          "buscar_generar_busqueda_de_servicios",
          "reservas_ver_informacion_de_reservas",
        ],
      };

      const aliases = aliasMap[clave];
      if (aliases) {
        for (const alt of aliases) {
          if (permisos[alt]) return true;
        }
      }

      // Alias general de compatibilidad cuentas <-> cuantas
      if (clave.startsWith("cuentas_corrientes_")) {
        const alt = clave.replace("cuentas_corrientes_", "cuantas_corrientes_");
        if (permisos[alt]) return true;
      }
      if (clave.startsWith("cuantas_corrientes_")) {
        const alt = clave.replace("cuantas_corrientes_", "cuentas_corrientes_");
        if (permisos[alt]) return true;
      }

      return false;
    },
    [role, permisos],
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
