"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  Search,
  UserPlus,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";

interface PassengerUser {
  id?: number | string;
  companyId?: string | number;
  companyName?: string;
  companyRecargo?: number;
}

interface PassengerInfoProps {
  token: string | null;
  user: PassengerUser | null;
  swalConfig: any;
  onPassengerSelected: (passenger: any) => void;
  onPassengerCreated: (passenger: any) => void;
  initialMode?: "buscar" | "crear";
  requireCentroCosto?: boolean;
  initialPassenger?: any;
}

export function PassengerInfo({
  token,
  user,
  swalConfig,
  onPassengerSelected,
  onPassengerCreated,
  initialMode = "buscar",
  requireCentroCosto = true,
}: PassengerInfoProps) {
  const [modoPasajero, setModoPasajero] = useState<"buscar" | "crear">(
    initialMode
  );
  const [rutBusqueda, setRutBusqueda] = useState("");
  const [buscandoPasajero, setBuscandoPasajero] = useState(false);
  const [pasajeroEncontrado, setPasajeroEncontrado] = useState<any>(null);
  const [errorPasajero, setErrorPasajero] = useState<string | null>(null);
  const [passengerName, setPassengerName] = useState<string>("");
  const [passengerRut, setPassengerRut] = useState<string>("");
  const [passengerEmail, setPassengerEmail] = useState<string>("");
  const [passengerPhone, setPassengerPhone] = useState<string>("");
  const [passengerErrors, setPassengerErrors] = useState<{
    name?: string;
    rut?: string;
    email?: string;
  }>({});
  const [centroCostoSeleccionado, setCentroCostoSeleccionado] = useState<{
    id: number;
    nombre: string;
  } | null>(null);
  const [centrosCosto, setCentrosCosto] = useState<any[]>([]);
  const [cargandoCentros, setCargandoCentros] = useState(false);
  const [pasajeroSeleccionado, setPasajeroSeleccionado] =
    useState<boolean>(false);

  const formatRutInput = (value: string): string => {
    const clean = value.replace(/[^0-9kK]/g, "");
    if (clean.length === 0) return "";
    const cuerpo = clean.slice(0, -1);
    const dv = clean.slice(-1).toUpperCase();
    let cuerpoFormateado = cuerpo;
    if (cuerpo.length > 3) {
      cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    return `${cuerpoFormateado}-${dv}`;
  };

  const validarRut = (rut: string): boolean => {
    if (!rut) return false;
    const rutLimpio = rut.replace(/\./g, "").toUpperCase();
    return /^[0-9]{7,8}-[0-9kK]{1}$/.test(rutLimpio);
  };

  const cleanRut = (rut: string): string => {
    return rut.replace(/\./g, "").toUpperCase();
  };

  const formatearRutParaMostrar = (rut: string): string => {
    if (!rut) return "";
    const sinGuion = rut.replace(/-/g, "");
    if (sinGuion.length < 2) return rut;
    const cuerpo = sinGuion.slice(0, -1);
    const dv = sinGuion.slice(-1);
    return `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`;
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const getCompanyId = (): string | null => {
    if (!user?.companyId) return null;
    return String(user.companyId);
  };

  const buscarPasajeroPorRut = async (rut: string) => {
    if (!rut) {
      setErrorPasajero("Ingrese un RUT para buscar");
      return null;
    }

    if (!validarRut(rut)) {
      setErrorPasajero("RUT inválido");
      return null;
    }

    setBuscandoPasajero(true);
    setErrorPasajero(null);
    setPasajeroEncontrado(null);
    setPasajeroSeleccionado(false);

    try {
      const rutLimpio = cleanRut(rut);
      const response = await fetch(`/api/pasajeros?rut=${rutLimpio}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = data.error || `Error ${response.status}`;

        if (response.status === 401) {
          errorMessage =
            "No autorizado para buscar pasajeros. Verifique sus credenciales.";
        } else if (response.status === 404) {
          setModoPasajero("crear");
          setPassengerRut(rut);
          setPassengerName("");
          setPassengerEmail("");
          setPassengerPhone("");
          setCentroCostoSeleccionado(null);
          setPasajeroEncontrado(null);
          onPassengerSelected(null);
          return null;
        } else if (response.status >= 500) {
          errorMessage = "Error del servidor. Intente nuevamente más tarde.";
        }
        setErrorPasajero(errorMessage);
        if (response.status === 401) {
          Swal.fire({
            icon: "error",
            title: "Error de autorización",
            text: errorMessage,
            confirmButtonColor: "#3085d6",
            ...swalConfig,
          });
        }
        return null;
      }

      if (Array.isArray(data) && data.length > 0) {
        const pasajero = data[0];
        const userCompanyId = getCompanyId();

        if (pasajero.id_empresa.toString() !== userCompanyId) {
          setErrorPasajero(
            "Este pasajero no pertenece a su empresa. Solo puede buscar pasajeros de su propia empresa."
          );
          return null;
        }

        setModoPasajero("buscar");
        setPasajeroEncontrado(pasajero);
        setPasajeroSeleccionado(true);
        setPassengerErrors({});
        setErrorPasajero(null);
        setPassengerName(pasajero.nombre);
        setPassengerRut(pasajero.rut);
        setPassengerEmail(pasajero.correo || "");
        setPassengerPhone(pasajero.telefono || "");

        if (pasajero.id_centro_costo) {
          setCentroCostoSeleccionado({
            id: pasajero.id_centro_costo,
            nombre: pasajero.centroCosto?.nombre || "Centro de costo",
          });
        }

        onPassengerSelected(pasajero);
        return pasajero;
      } else {
        setErrorPasajero("No se encontró pasajero con ese RUT.");
        setModoPasajero("crear");
        setPassengerRut(rut);
        setPassengerName("");
        setPassengerEmail("");
        setPassengerPhone("");
        setCentroCostoSeleccionado(null);
        setPasajeroEncontrado(null);
        onPassengerSelected(null);
        return null;
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al buscar pasajero";
      setErrorPasajero(errorMsg);

      Swal.fire({
        icon: "warning",
        title: "Error de conexión",
        text: "No se pudo conectar con el servidor. Puede crear el pasajero manualmente.",
        confirmButtonColor: "#3085d6",
        ...swalConfig,
      });

      return null;
    } finally {
      setBuscandoPasajero(false);
    }
  };

  const handleCambiarAModoCrear = () => {
    setErrorPasajero(null);
    setPassengerErrors({});
    setModoPasajero("crear");
    if (!pasajeroEncontrado && rutBusqueda && validarRut(rutBusqueda)) {
      setPassengerRut(rutBusqueda);
    } else {
      setPassengerRut("");
    }
    setPassengerName("");
    setPassengerEmail("");
    setPassengerPhone("");
    setCentroCostoSeleccionado(null);
    onPassengerSelected(null);
  };

  const buscarOCrearPasajero = async () => {
    if (!validarRut(passengerRut)) {
      setPassengerErrors((prev) => ({ ...prev, rut: "RUT inválido" }));
      return null;
    }

    if (!passengerName || passengerName.trim().length < 3) {
      setPassengerErrors((prev) => ({
        ...prev,
        name: "Nombre es obligatorio (mín. 3 caracteres)",
      }));
      return null;
    }

    if (!passengerEmail || !validateEmail(passengerEmail)) {
      setPassengerErrors((prev) => ({
        ...prev,
        email: "Email inválido",
      }));
      return null;
    }

    if (requireCentroCosto && !centroCostoSeleccionado) {
      setErrorPasajero("Debe seleccionar un centro de costo");
      return null;
    }

    setPassengerErrors({});
    setBuscandoPasajero(true);
    setErrorPasajero(null);

    try {
      const id_empresa = getCompanyId();
      if (!id_empresa) {
        throw new Error("No se pudo determinar la empresa del usuario");
      }

      const response = await fetch("/api/pasajeros/buscar-o-crear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rut: passengerRut,
          nombre: passengerName,
          correo: passengerEmail,
          telefono: passengerPhone,
          id_empresa: id_empresa,
          id_centro_costo: centroCostoSeleccionado?.id || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        let errorMessage = "Error al procesar pasajero";
        if (result.error) {
          errorMessage = result.error;
          if (response.status === 401) {
            errorMessage =
              "No autorizado para crear pasajero. Verifique sus credenciales.";
          }
          if (result.details) {
            errorMessage += ` - ${JSON.stringify(result.details)}`;
          }
        } else {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      if (result.pasajero) {
        setPasajeroEncontrado(result.pasajero);
        setPasajeroSeleccionado(true);
        setPassengerName(result.pasajero.nombre);
        setPassengerEmail(result.pasajero.correo || "");
        setPassengerRut(result.pasajero.rut);
        setPassengerPhone(result.pasajero.telefono);

        if (result.pasajero.id_centro_costo) {
          setCentroCostoSeleccionado({
            id: result.pasajero.id_centro_costo,
            nombre: result.pasajero.centroCosto?.nombre || "Centro de costo",
          });
        }

        setPassengerErrors({});
        setErrorPasajero(null);

        onPassengerSelected(result.pasajero);

        if (result.creado) {
          onPassengerCreated(result.pasajero);

          Swal.fire({
            icon: "success",
            title: "Pasajero creado",
            html: `
              <div style="text-align: center; padding: 10px;">
                <div style="font-size: 1.2rem; font-weight: 600; color: #059669; margin-bottom: 10px;">
                  ${result.pasajero.nombre}
                </div>
                <div style="color: #6b7280; font-size: 0.9rem; margin-bottom: 8px;">
                  RUT: ${result.pasajero.rut}
                </div>
                <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; 
                      border-radius: 8px; padding: 12px; margin-top: 10px; margin-bottom: 15px;">
                  <p style="color: #166534; margin: 0; font-size: 0.9rem;">
                    ${result.mensaje || "Registrado exitosamente en su empresa"}
                  </p>
                </div>
                <div style="background-color: #dbeafe; border: 1px solid #93c5fd; 
                      border-radius: 8px; padding: 10px; margin-top: 10px;">
                  <p style="color: #1e40af; margin: 0; font-size: 0.9rem; font-weight: 500;">
                    ✓ El pasajero ha sido asignado para este asiento
                  </p>
                </div>
              </div>
            `,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: "#f9fafb",
          });
        }

        return result.pasajero;
      } else if (result.encontrado === false) {
        setErrorPasajero(
          result.mensaje ||
            "Pasajero no encontrado. Complete los datos y haga clic en 'Crear pasajero'"
        );
        return null;
      }

      return null;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al procesar pasajero";
      setErrorPasajero(errorMsg);

      if (errorMsg.includes("401") || errorMsg.includes("No autorizado")) {
        Swal.fire({
          icon: "error",
          title: "Error de autorización",
          text: "No tiene permisos para crear pasajeros. Contacte al administrador.",
          confirmButtonColor: "#3085d6",
          ...swalConfig,
        });
      }

      return null;
    } finally {
      setBuscandoPasajero(false);
    }
  };

  const cargarCentrosCosto = async () => {
    const companyId = getCompanyId();
    if (!companyId) return;

    setCargandoCentros(true);
    try {
      const response = await fetch(`/api/centros-costo/${companyId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCentrosCosto(data);
      } else {
        console.error("Error cargando centros de costo:", response.status);
      }
    } catch (error) {
      console.error("Error cargando centros de costo:", error);
    } finally {
      setCargandoCentros(false);
    }
  };

  useEffect(() => {
    if (getCompanyId()) {
      cargarCentrosCosto();
    }
  }, [user?.companyId]);

  useEffect(() => {
    if (modoPasajero === "buscar") {
      setPassengerErrors({});
      setErrorPasajero(null);
    }
  }, [modoPasajero]);

  return (
    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold">Datos del pasajero</h4>
          <p className="text-xs text-muted-foreground">
            Busque por RUT o complete manualmente
          </p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-muted-foreground">
              Empresa: {user?.companyName || "No especificada"}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant={modoPasajero === "buscar" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setModoPasajero("buscar");
              setErrorPasajero(null);
            }}
            className="h-8"
          >
            <Search className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant={modoPasajero === "crear" ? "default" : "outline"}
            size="sm"
            onClick={handleCambiarAModoCrear}
            className="h-8"
          >
            <UserPlus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Modo Búsqueda por RUT */}
      {modoPasajero === "buscar" && (
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium">
              Buscar pasajero por RUT
            </label>

            <div className="flex gap-2 items-start">
              <div className="flex-1 space-y-1">
                <input
                  type="text"
                  value={rutBusqueda}
                  onChange={(e) => {
                    const formatted = formatRutInput(e.target.value);
                    setRutBusqueda(formatted);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      buscarPasajeroPorRut(rutBusqueda);
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="12.345.678-9"
                />
                <p className="text-xs text-muted-foreground">
                  Solo se mostrarán pasajeros de su empresa
                </p>
              </div>

              <div className="shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => buscarPasajeroPorRut(rutBusqueda)}
                  disabled={buscandoPasajero || !rutBusqueda}
                  className="h-10"
                >
                  {buscandoPasajero ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Buscar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Mostrar errores en modo búsqueda */}
          {errorPasajero && modoPasajero === "buscar" && (
            <div
              className={`p-3 rounded-md ${
                errorPasajero.includes("no encontrado") ||
                errorPasajero.includes("Puede crear")
                  ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
                  : "bg-red-50 border border-red-200 text-red-600"
              }`}
            >
              <div className="flex items-start">
                {errorPasajero.includes("no encontrado") ||
                errorPasajero.includes("Puede crear") ? (
                  <Search className="h-4 w-4 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="text-sm font-medium">{errorPasajero}</p>
                  {(errorPasajero.includes("401") ||
                    errorPasajero.includes("autorizado")) && (
                    <p className="text-xs mt-1">
                      Contacte al administrador del sistema para obtener
                      permisos.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {pasajeroEncontrado && modoPasajero === "buscar" && (
            <div className="p-3 bg-orange-50/50 border border-orange-200 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">
                    Pasajero encontrado ✓
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  RUT: {formatearRutParaMostrar(pasajeroEncontrado.rut)}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Nombre:</span>
                  <p className="font-medium">{pasajeroEncontrado.nombre}</p>
                </div>
                {pasajeroEncontrado.correo && (
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium">{pasajeroEncontrado.correo}</p>
                  </div>
                )}
                {pasajeroEncontrado.telefono && (
                  <div>
                    <span className="text-gray-600">Teléfono:</span>
                    <p className="font-medium">{pasajeroEncontrado.telefono}</p>
                  </div>
                )}
                {pasajeroEncontrado.empresa && (
                  <div>
                    <span className="text-gray-600">Empresa:</span>
                    <p className="font-medium">
                      {pasajeroEncontrado.empresa.nombre}
                    </p>
                  </div>
                )}
                {pasajeroEncontrado.centroCosto && (
                  <div>
                    <span className="text-gray-600">Centro costo:</span>
                    <p className="font-medium">
                      {pasajeroEncontrado.centroCosto.nombre}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-2 flex justify-center">
                <Badge
                  variant="outline"
                  className="bg-orange-100 text-orange-700 rounded-lg border-orange-300 hover:bg-orange-100"
                >
                  El pasajero ha sido asignado para este asiento
                </Badge>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modo Crear/Editar Pasajero */}
      {modoPasajero === "crear" && (
        <div className="space-y-3">
          {errorPasajero &&
            !errorPasajero.includes("no encontrado") &&
            !errorPasajero.includes("Puede crear") && (
              <div
                className={`p-3 rounded-md ${
                  errorPasajero.includes("creado") ||
                  errorPasajero.includes("actualizado")
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : "bg-red-50 border border-red-200 text-red-600"
                }`}
              >
                <div className="flex items-start">
                  {errorPasajero.includes("creado") ||
                  errorPasajero.includes("actualizado") ? (
                    <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{errorPasajero}</p>
                    {(errorPasajero.includes("401") ||
                      errorPasajero.includes("autorizado")) && (
                      <p className="text-xs mt-1">
                        Contacte al administrador del sistema para obtener
                        permisos.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

          {!pasajeroEncontrado && modoPasajero === "crear" && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start">
                <Search className="h-4 w-4 mr-2 mt-0.5 shrink-0 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Crear nuevo pasajero
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Complete los datos para registrar un nuevo pasajero en su
                    empresa.
                  </p>
                  {passengerRut && (
                    <p className="text-xs text-blue-600 mt-1">
                      RUT: <strong>{passengerRut}</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">
                Nombre completo *
              </label>
              <input
                type="text"
                value={passengerName}
                onChange={(e) => setPassengerName(e.target.value)}
                onBlur={() => {
                  if (!passengerName || passengerName.trim().length < 3) {
                    setPassengerErrors((prev) => ({
                      ...prev,
                      name: "Nombre es obligatorio (mín. 3 caracteres)",
                    }));
                  } else {
                    setPassengerErrors((prev) => ({
                      ...prev,
                      name: undefined,
                    }));
                  }
                }}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="Ej: Juan Pérez González"
                aria-invalid={!!passengerErrors.name}
              />
              {passengerErrors.name && (
                <p className="text-xs text-destructive mt-1">
                  {passengerErrors.name}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium block mb-1">RUT *</label>
              <input
                type="text"
                value={passengerRut}
                onChange={(e) => {
                  const formatted = formatRutInput(e.target.value);
                  setPassengerRut(formatted);
                }}
                onBlur={() => {
                  if (!validarRut(passengerRut)) {
                    setPassengerErrors((prev) => ({
                      ...prev,
                      rut: "RUT inválido",
                    }));
                  } else {
                    setPassengerErrors((prev) => ({ ...prev, rut: undefined }));
                  }
                }}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="12.345.678-9"
                aria-invalid={!!passengerErrors.rut}
              />
              {passengerErrors.rut && (
                <p className="text-xs text-destructive mt-1">
                  {passengerErrors.rut}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium block mb-1">Email *</label>
              <input
                type="email"
                value={passengerEmail}
                onChange={(e) => setPassengerEmail(e.target.value)}
                onBlur={() => {
                  if (!passengerEmail || !validateEmail(passengerEmail)) {
                    setPassengerErrors((prev) => ({
                      ...prev,
                      email: "Email inválido",
                    }));
                  } else {
                    setPassengerErrors((prev) => ({
                      ...prev,
                      email: undefined,
                    }));
                  }
                }}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="email@dominio.cl"
                aria-invalid={!!passengerErrors.email}
              />
              {passengerErrors.email && (
                <p className="text-xs text-destructive mt-1">
                  {passengerErrors.email}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium block mb-1">
                Teléfono (opcional)
              </label>
              <input
                type="text"
                value={passengerPhone}
                onChange={(e) => setPassengerPhone(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="Ej: +56 9 1234 5678"
              />
            </div>

            {requireCentroCosto && (
              <div className="sm:col-span-2">
                <label className="text-xs font-medium block mb-1">
                  Centro de Costo *
                </label>
                <div className="flex gap-2">
                  <select
                    value={centroCostoSeleccionado?.id || ""}
                    onChange={(e) => {
                      const id = parseInt(e.target.value);
                      const centro = centrosCosto.find((c) => c.id === id);
                      setCentroCostoSeleccionado(
                        centro ? { id: centro.id, nombre: centro.nombre } : null
                      );
                    }}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    required
                  >
                    <option value="">Seleccionar centro de costo</option>
                    {centrosCosto.map((centro) => (
                      <option key={centro.id} value={centro.id}>
                        {centro.nombre}
                      </option>
                    ))}
                  </select>
                  {cargandoCentros && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Seleccione el centro de costo al que pertenece el pasajero.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={buscarOCrearPasajero}
              disabled={
                buscandoPasajero ||
                !passengerName ||
                !passengerRut ||
                !passengerEmail ||
                (requireCentroCosto && !centroCostoSeleccionado)
              }
              className="flex-1"
            >
              {buscandoPasajero ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Crear pasajero
                </>
              )}
            </Button>
          </div>

          {!pasajeroEncontrado &&
            errorPasajero &&
            errorPasajero.includes("no encontrado") && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Pasajero no encontrado:</strong> Complete los datos
                  para crear un nuevo pasajero.
                </p>
              </div>
            )}

          <div className="text-xs text-muted-foreground">
            <p>
              <strong>Nota:</strong> El pasajero será asociado automáticamente a
              su empresa.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
