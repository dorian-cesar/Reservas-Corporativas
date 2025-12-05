import { useState } from "react";

interface Pasajero {
  id: number;
  nombre: string;
  rut: string;
  correo: string;
  id_empresa: number;
  id_centro_costo: number;
  empresa: {
    id: number;
    nombre: string;
    rut: string;
    cuenta_corriente: string;
    estado: boolean;
  };
  centroCosto: {
    id: number;
    nombre: string;
    estado: boolean;
  };
}

export const usePasajero = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasajero, setPasajero] = useState<Pasajero | null>(null);

  // Formatear RUT para mostrar
  const formatearRut = (rut: string): string => {
    if (!rut) return "";
    const rutLimpio = rut.replace(/\./g, "");
    if (rutLimpio.length < 2) return rut;

    const cuerpo = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1);

    return `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`;
  };

  // Validar RUT usando la API de Next.js
  const validarRut = async (rut: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/pasajeros/validar-rut", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rut }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      return data.valido || false;
    } catch {
      return false;
    }
  };

  // Buscar pasajero por RUT
  const buscarPasajero = async (rut: string) => {
    if (!rut) {
      setError("Ingrese un RUT para buscar");
      return null;
    }

    setLoading(true);
    setError(null);
    setPasajero(null);

    try {
      // Llamar a la API de Next.js
      const response = await fetch(
        `/api/pasajeros?rut=${encodeURIComponent(rut)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const pasajeroEncontrado = data[0];
        setPasajero(pasajeroEncontrado);
        return pasajeroEncontrado;
      } else {
        setError("Pasajero no encontrado");
        return null;
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al buscar pasajero";
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Crear nuevo pasajero
  const crearPasajero = async (datos: {
    nombre: string;
    rut: string;
    correo: string;
    id_empresa: number;
    id_centro_costo: number;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/pasajeros", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datos),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const nuevoPasajero = await response.json();
      setPasajero(nuevoPasajero);
      return nuevoPasajero;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al crear pasajero";
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Buscar o crear pasajero
  const buscarOCrearPasajero = async (datos: {
    nombre: string;
    rut: string;
    correo: string;
    id_empresa: number;
    id_centro_costo: number;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/pasajeros/buscar-o-crear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datos),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const result = await response.json();

      if (result.pasajero) {
        setPasajero(result.pasajero);
        return result;
      }

      return result;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al procesar pasajero";
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPasajero(null);
    setError(null);
    setLoading(false);
  };

  return {
    loading,
    error,
    pasajero,
    buscarPasajero,
    crearPasajero,
    buscarOCrearPasajero,
    validarRut,
    formatearRut,
    reset,
  };
};
