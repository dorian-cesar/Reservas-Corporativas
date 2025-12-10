"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle2,
  Bus,
  Users,
  Search,
  UserPlus,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { SeatSelector } from "@/components/seat-selector";
import type { ServiceDetail, Seat } from "@/types/service-detail";
import { useTravel } from "@/components/context/travel-context";
import { useUserStore } from "@/lib/user-store";
import Swal from "sweetalert2";

interface ServiceDetailDialogProps {
  serviceId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  terminalOrigen: string | null;
  terminalDestino: string | null;
}

export function ServiceDetailDialog({
  serviceId,
  open,
  onOpenChange,
  terminalOrigen,
  terminalDestino,
}: ServiceDetailDialogProps) {
  const { user } = useUserStore();
  const { token } = useAuth();
  const [serviceDetail, setServiceDetail] = useState<ServiceDetail | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const { origin, destination } = useTravel();
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [passengerName, setPassengerName] = useState<string>("");
  const [passengerRut, setPassengerRut] = useState<string>("");
  const [passengerEmail, setPassengerEmail] = useState<string>("");
  const [passengerErrors, setPassengerErrors] = useState<{
    name?: string;
    rut?: string;
    email?: string;
  }>({});
  const [disponibilidadVerificada, setDisponibilidadVerificada] =
    useState<boolean>(false);
  const [modoPasajero, setModoPasajero] = useState<"buscar" | "crear">(
    "buscar"
  );
  const [rutBusqueda, setRutBusqueda] = useState("");
  const [buscandoPasajero, setBuscandoPasajero] = useState(false);
  const [pasajeroEncontrado, setPasajeroEncontrado] = useState<any>(null);
  const [errorPasajero, setErrorPasajero] = useState<string | null>(null);
  const [centroCostoSeleccionado, setCentroCostoSeleccionado] = useState<{
    id: number;
    nombre: string;
  } | null>(null);
  const [centrosCosto, setCentrosCosto] = useState<any[]>([]);
  const [cargandoCentros, setCargandoCentros] = useState(false);
  const [pasajeroSeleccionado, setPasajeroSeleccionado] =
    useState<boolean>(false);
  const [passengerPhone, setPassengerPhone] = useState<string>("");

  const swalConfig = {
    customClass: {
      container: "swal-container",
      popup:
        "swal-popup bg-background border-2 border-border rounded-lg shadow-xl",
      header: "swal-header",
      title: "swal-title text-foreground font-bold text-xl",
      closeButton: "swal-close",
      icon: "swal-icon",
      image: "swal-image",
      content: "swal-content text-foreground",
      htmlContainer: "swal-html-container text-foreground",
      input: "swal-input",
      inputLabel: "swal-input-label",
      validationMessage: "swal-validation-message",
      actions: "swal-actions gap-3",
      confirmButton:
        "swal-confirm-btn inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-destructive/80 text-destructive-foreground hover:bg-destructive h-10 py-2 px-4 cursor-pointer",
      cancelButton:
        "swal-cancel-btn inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4 cursor-pointer",
      footer: "swal-footer",
    },
    buttonsStyling: false,
    reverseButtons: true,
    allowOutsideClick: false,
    allowEscapeKey: false,
    backdrop: true,
    didOpen: () => {
      const container = document.querySelector(
        ".swal-container"
      ) as HTMLElement;
      const popup = document.querySelector(".swal-popup") as HTMLElement;
      const modal = document.querySelector('[role="dialog"]') as HTMLElement;
      if (container) {
        container.style.zIndex = "999999";
        container.style.position = "fixed";
        container.style.top = "0";
        container.style.left = "0";
        container.style.width = "100%";
        container.style.height = "100%";
      }
      if (popup) {
        popup.style.zIndex = "1000000";
      }
      if (modal) {
        modal.style.zIndex = "1";
      }
    },
    willClose: () => {
      const modal = document.querySelector('[role="dialog"]') as HTMLElement;
      if (modal) {
        modal.style.zIndex = "";
      }
    },
  };

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
          setPassengerRut("");
          setPassengerName("");
          setPassengerEmail("");
          setCentroCostoSeleccionado(null);
          setPasajeroEncontrado(null);

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

        if (pasajero.id_empresa.toString() !== user?.companyId) {
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

        if (pasajero.id_centro_costo) {
          setCentroCostoSeleccionado({
            id: pasajero.id_centro_costo,
            nombre: pasajero.centroCosto?.nombre || "Centro de costo",
          });
        }

        if (pasajero.telefono) {
          setPassengerPhone(pasajero.telefono);
        }

        return pasajero;
      } else {
        setErrorPasajero("No se encontró pasajero con ese RUT.");
        setModoPasajero("crear");
        setPassengerRut(rutBusqueda);
        setPassengerName("");
        setPassengerEmail("");
        setCentroCostoSeleccionado(null);
        setPasajeroEncontrado(null);

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

    setPassengerErrors({});
    setBuscandoPasajero(true);
    setErrorPasajero(null);

    try {
      const id_empresa = user?.companyId;
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

        if (result.creado) {
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
                        ${
                          result.mensaje ||
                          "Registrado exitosamente en su empresa"
                        }
                      </p>
                    </div>
                    <div style="background-color: #dbeafe; border: 1px solid #93c5fd; 
                          border-radius: 8px; padding: 10px; margin-top: 10px;">
                      <p style="color: #1e40af; margin: 0; font-size: 0.9rem; font-weight: 500;">
                        ✓ El pasajero ha sido asignado para la reserva
                      </p>
                    </div>
                    <div style="margin-top: 15px; padding: 10px; background-color: #f3f4f6; border-radius: 6px;">
                      <p style="color: #4b5563; font-size: 0.8rem; margin: 0;">
                        Esta ventana se cerrará en <span id="swal-timer" style="font-weight: bold; color: #059669;">5</span> segundos
                      </p>
                    </div>
                  </div>
                `,
            showConfirmButton: false,
            timer: 5000,
            timerProgressBar: true,
            background: "#f9fafb",
            willClose: () => {
              console.log("Alert cerrada automáticamente");
            },
            didOpen: () => {
              const timerElement = document.getElementById("swal-timer");
              let secondsLeft = 5;
              const timerInterval = setInterval(() => {
                secondsLeft--;
                if (timerElement) {
                  timerElement.textContent = secondsLeft.toString();
                }
                if (secondsLeft <= 0) {
                  clearInterval(timerInterval);
                }
              }, 1000);
            },
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

  const validateRut = (rut: string) => {
    const cleaned = rut.replace(/\./g, "").replace(/-/g, "");
    return /^[0-9kK]{7,9}$/.test(cleaned);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassenger = () => {
    const errs: { name?: string; rut?: string; email?: string } = {};
    if (!passengerName || passengerName.trim().length < 3) {
      errs.name = "Nombre del pasajero es obligatorio (mín. 3 caracteres).";
    }
    if (!passengerRut) {
      errs.rut = "RUT es obligatorio.";
    } else if (!validateRut(passengerRut)) {
      errs.rut = "RUT inválido.";
    }
    if (!passengerEmail) {
      errs.email = "Email es obligatorio.";
    } else if (!validateEmail(passengerEmail)) {
      errs.email = "Email inválido.";
    }
    setPassengerErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const extractPrice = (costString: string): string => {
    if (!costString) return "0";
    const priceMatch = costString.match(/(\d+\.?\d*)/);
    if (!priceMatch) return "0";
    const base = parseFloat(priceMatch[1]);
    const recargo = (base * (user?.companyRecargo || 0)) / 100;
    const finalPrice = base + recargo;
    return finalPrice.toLocaleString("es-CL");
  };

  const getMainBusType = (busType: string | null | undefined): string => {
    if (!busType) return "";
    const parts = busType.split(",").map((p) => p.trim());
    const ignore = ["2+2", "2+1", "AC", "Video", "WiFi", "Baño"];
    const main = parts.find((p) => !ignore.includes(p));
    return main || parts[0];
  };

  useEffect(() => {
    if (open && serviceId) {
      loadServiceDetail();
      if (user?.companyId) {
        cargarCentrosCosto();
      }
    } else {
      setServiceDetail(null);
      setSelectedSeat(null);
      setError(null);
      setDisponibilidadVerificada(false);
      setPassengerName("");
      setPassengerRut("");
      setPassengerPhone("");
      setPassengerEmail("");
      setPassengerErrors({});
      setModoPasajero("buscar");
      setRutBusqueda("");
      setPasajeroEncontrado(null);
      setErrorPasajero(null);
      setCentroCostoSeleccionado(null);
      setPasajeroSeleccionado(false);
      setCentrosCosto([]);
    }
  }, [open, serviceId]);

  const cargarCentrosCosto = async () => {
    if (!user?.companyId) return;

    setCargandoCentros(true);
    try {
      const response = await fetch(`/api/centros-costo/${user.companyId}`, {
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

  const loadServiceDetail = async () => {
    setLoadingDetail(true);
    setError(null);
    setDisponibilidadVerificada(false);

    try {
      const res = await fetch(`/api/service-detail/${serviceId}`);

      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setServiceDetail(data.service);

      await verificarDisponibilidadEmpresa(data.service);
    } catch (err) {
      console.error("Error loading service detail:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error al cargar detalles del servicio"
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  const verificarDisponibilidadEmpresa = async (service: ServiceDetail) => {
    try {
      const extractPriceForVerification = (costString: string): number => {
        if (!costString) return 0;
        const priceMatch = costString.match(/(\d+\.?\d*)/);
        if (!priceMatch) return 0;
        const base = parseFloat(priceMatch[1]);
        const recargo = (base * (user?.companyRecargo || 0)) / 100;
        const finalPrice = base + recargo;
        return finalPrice;
      };

      const precioConRecargo = extractPriceForVerification(service.cost);

      const res = await fetch("/api/disponibilidad", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_User: user?.id ?? 1,
          monto_boleto: precioConRecargo,
        }),
      });

      const data = await res.json();

      if (!data.disponible) {
        await showSweetAlert({
          icon: "error",
          title: "Sin disponibilidad",
          html: `
          <b>La empresa ha excedido su límite de gasto.</b><br><br>
          Monto máximo: $${data.detalles.monto_maximo.toLocaleString(
            "es-CL"
          )}<br>
          Acumulado: $${data.detalles.monto_acumulado.toLocaleString(
            "es-CL"
          )}<br>
          Nuevo ticket: $${data.detalles.monto_ticket.toLocaleString("es-CL")}
        `,
          confirmButtonText: "Entendido",
          confirmButtonColor: "#d33",
          showCancelButton: false,
          focusConfirm: true,
          willClose: () => {
            onOpenChange(false);
          },
        });

        return false;
      }

      setDisponibilidadVerificada(true);
      return true;
    } catch (err) {
      console.error("Error verificando disponibilidad:", err);
      setDisponibilidadVerificada(true);
      return true;
    }
  };

  const parseSeats = (): Seat[] => {
    if (!serviceDetail?.bus_layout?.available) return [];

    const seats: Seat[] = [];
    const availableSeats = serviceDetail.bus_layout.available.split(",");
    const companyRecargo = user?.companyRecargo || 0;

    availableSeats.forEach((seatInfo) => {
      const [seatNumber, priceStr] = seatInfo.split("|");

      if (seatNumber && priceStr) {
        const base = parseFloat(priceStr.trim());
        const recargo = (base * companyRecargo) / 100;
        const finalPrice = base + recargo;

        seats.push({
          number: seatNumber.trim(),
          price: finalPrice,
          basePrice: base,
          available: true,
          row: Math.ceil(parseInt(seatNumber) / 4),
          position: (parseInt(seatNumber) - 1) % 4,
        });
      }
    });

    return seats.sort((a, b) => parseInt(a.number) - parseInt(b.number));
  };

  const getOccupiedSeats = (): string[] => {
    if (!serviceDetail) return [];

    const totalSeats = serviceDetail.bus_layout.total_seats;
    const availableSeats = parseSeats().map((seat) => seat.number);
    const allSeats = Array.from({ length: totalSeats }, (_, i) =>
      (i + 1).toString()
    );

    return allSeats.filter((seat) => !availableSeats.includes(seat));
  };

  const markSeatAsUnavailable = (seatNumber: string) => {
    if (!serviceDetail) return;

    const available = serviceDetail.bus_layout.available
      .split(",")
      .filter((s) => !s.startsWith(seatNumber + "|"))
      .join(",");

    setServiceDetail({
      ...serviceDetail,
      bus_layout: {
        ...serviceDetail.bus_layout,
        available,
      },
    });
  };

  const showSweetAlert = async (config: any) => {
    const modalBackdrops = document.querySelectorAll(
      '[data-state="open"][data-aria-hidden="true"]'
    );
    const dialogBackdrops = document.querySelectorAll(
      '[data-aria-hidden="true"]'
    );
    const allBackdrops = [...modalBackdrops, ...dialogBackdrops];
    const originalStyles: any[] = [];
    allBackdrops.forEach((backdrop) => {
      originalStyles.push({
        element: backdrop,
        style: (backdrop as HTMLElement).style.cssText,
      });
      (backdrop as HTMLElement).style.display = "none";
    });
    const overlays = document.querySelectorAll(".fixed, .absolute");
    const problematicOverlays: any[] = [];
    overlays.forEach((overlay) => {
      const el = overlay as HTMLElement;
      const zIndex = parseInt(el.style.zIndex || getComputedStyle(el).zIndex);
      if (zIndex > 1000 && el.style.display !== "none") {
        problematicOverlays.push({
          element: el,
          style: el.style.cssText,
        });
        el.style.visibility = "hidden";
      }
    });
    try {
      await new Promise((resolve) => setTimeout(resolve, 0));
      const result = await Swal.fire({
        ...config,
        customClass: swalConfig.customClass,
        buttonsStyling: false,
        reverseButtons: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
        backdrop: true,
        didOpen: () => {
          const container = document.querySelector(".swal2-container");
          if (container) {
            (container as HTMLElement).style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 999999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          `;
          }

          const popup = document.querySelector(".swal2-popup");
          if (popup) {
            (popup as HTMLElement).style.zIndex = "1000000 !important";
          }
        },
      });
      return result;
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 100));
      allBackdrops.forEach((_, index) => {
        if (originalStyles[index]) {
          const { element, style } = originalStyles[index];
          (element as HTMLElement).style.cssText = style;
        }
      });
      problematicOverlays.forEach((item) => {
        if (item.element) {
          item.element.style.cssText = item.style;
        }
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const swalContainer = document.querySelector(".swal2-container");
      if (swalContainer && swalContainer.hasAttribute("aria-modal")) {
        if (e.key === "Enter") {
          const confirmBtn = document.querySelector(".swal2-confirm");
          if (confirmBtn) {
            (confirmBtn as HTMLElement).click();
          }
        } else if (e.key === "Escape") {
          const cancelBtn =
            document.querySelector(".swal2-cancel") ||
            document.querySelector(".swal2-close");
          if (cancelBtn) {
            (cancelBtn as HTMLElement).click();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSeatSelection = (seat: string) => {
    if (!disponibilidadVerificada) {
      return;
    }
    setSelectedSeat(seat);
  };

  const handleBooking = async () => {
    if (!selectedSeat || !serviceDetail) return;

    let pasajeroParaReserva = null;
    let nombreParaReserva = "";
    let emailParaReserva = "";
    let rutParaReserva = "";

    if (pasajeroEncontrado && pasajeroSeleccionado) {
      pasajeroParaReserva = pasajeroEncontrado;
      nombreParaReserva = pasajeroEncontrado.nombre;
      emailParaReserva = pasajeroEncontrado.correo || "";
      rutParaReserva = pasajeroEncontrado.rut;
    } else {
      if (!validatePassenger()) {
        setBookingError(
          "Por favor corrige los errores del formulario de pasajero."
        );
        return;
      }

      const nuevoPasajero = await buscarOCrearPasajero();
      if (!nuevoPasajero) {
        setBookingError("Error al procesar datos del pasajero");
        return;
      }

      pasajeroParaReserva = nuevoPasajero;
      nombreParaReserva = passengerName;
      emailParaReserva = passengerEmail;
      rutParaReserva = passengerRut;
    }

    setPassengerErrors({});
    setLoading(true);
    setBookingError(null);

    try {
      const boardingPoint = serviceDetail.boarding_stages?.split("|")[0];
      const seatObj = availableSeats.find((s) => s.number === selectedSeat);
      const seatPrice = seatObj?.basePrice || 0;

      const bookResponse = await fetch("/api/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: serviceId.toString(),
          seatNumber: selectedSeat,
          price: seatPrice,
          originId: serviceDetail.origin_id,
          destinationId: serviceDetail.destination_id,
          travelDate: serviceDetail.travel_date,
          busType: serviceDetail.bus_type,
          routeId: serviceDetail.route_id,
          availableSeats: serviceDetail.available_seats,
          cost: serviceDetail.cost,
          boardingAt: boardingPoint,
          passengerName: nombreParaReserva,
          passengerEmail: emailParaReserva,
          passengerRut: rutParaReserva,
        }),
      });

      const bookData = await bookResponse.json();

      if (!bookResponse.ok || !bookData.success) {
        console.error("Error booking:", bookData);

        let errorMessage = bookData?.error || "No se pudo reservar el asiento.";
        let shouldMarkUnavailable = false;

        const apiMessage =
          bookData?.details?.response?.message || bookData?.error || "";

        if (
          apiMessage.includes("Seat Number not Found") ||
          apiMessage.includes("Seat Fare mismatched") ||
          apiMessage.includes("434") ||
          apiMessage.toLowerCase().includes("seat")
        ) {
          shouldMarkUnavailable = true;
          errorMessage =
            "El asiento ya no está disponible. Por favor selecciona otro.";
        }

        if (shouldMarkUnavailable) {
          markSeatAsUnavailable(selectedSeat);
          setSelectedSeat(null);
        }

        setBookingError(errorMessage);
        setLoading(false);
        return;
      }

      const confirmResponse = await fetch("/api/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pnrNumber: bookData.pnrNumber }),
      });

      const confirmData = await confirmResponse.json();

      if (!confirmResponse.ok || !confirmData.success) {
        setError(confirmData.error || "Error al confirmar la reserva");
        setLoading(false);
        return;
      }

      const baseFare = confirmData.totalFare || 0;
      const recargo =
        user?.companyRecargo && !isNaN(user.companyRecargo)
          ? (baseFare * user.companyRecargo) / 100
          : 0;
      const monto_boleto = baseFare + recargo;

      const payload = {
        ticketNumber: confirmData.ticketNumber,
        pnrNumber: confirmData.operatorPnr,
        ticketStatus: confirmData.ticketStatus,
        origin: confirmData.origin,
        destination: confirmData.destination,
        travelDate: confirmData.travelDate,
        departureTime: serviceDetail.dep_time,
        seatNumbers: confirmData.seatNumbers,
        fare: baseFare,
        confirmedAt: confirmData.confirmedAt,
        monto_boleto,
        id_User: user?.id,
        nombre_pasajero: nombreParaReserva,
        rut_pasajero: rutParaReserva,
        email_pasajero: emailParaReserva,
        id_pasajero: pasajeroParaReserva.id,
        id_centro_costo:
          pasajeroParaReserva.id_centro_costo ||
          centroCostoSeleccionado?.id ||
          null,
        terminal_origen: terminalOrigen,
        terminal_destino: terminalDestino,
      };

      try {
        const saveRes = await fetch("/api/confirm-db", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const saveData = await saveRes.json();

        if (!saveData.success) {
          console.error("Error al guardar ticket:", saveData.error);
        } else {
          console.log("Ticket guardado exitosamente");
        }
      } catch (e) {
        console.error("Error al enviar ticket:", e);
      }

      setBookingData({
        ...bookData,
        ...confirmData,
        monto_boleto,
      });

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        setSelectedSeat(null);
        setBookingData(null);
        onOpenChange(false);
      }, 10000);
    } catch (err) {
      console.error("Error inesperado:", err);
      setBookingError("Error inesperado al procesar la reserva");
    } finally {
      setLoading(false);
    }
  };

  const availableSeats = parseSeats();
  const occupiedSeats = getOccupiedSeats();

  const formatTravelDate = (date: string) => {
    try {
      const [year, month, day] = date.split("-").map(Number);

      const months = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ];

      const monthName = months[month - 1];

      return `${day} de ${monthName} de ${year}`;
    } catch (error) {
      console.error("Error formateando fecha de viaje:", error);
      return date;
    }
  };

  const formatearRutParaMostrar = (rut: string): string => {
    if (!rut) return "";
    const sinGuion = rut.replace(/-/g, "");
    if (sinGuion.length < 2) return rut;
    const cuerpo = sinGuion.slice(0, -1);
    const dv = sinGuion.slice(-1);
    return `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`;
  };

  const canConfirm =
    disponibilidadVerificada &&
    selectedSeat !== null &&
    ((pasajeroEncontrado && pasajeroSeleccionado) ||
      (passengerName.trim().length >= 3 &&
        validarRut(passengerRut) &&
        validateEmail(passengerEmail) &&
        centroCostoSeleccionado !== null));

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!state && success) {
          setSuccess(false);
          setSelectedSeat(null);
          setBookingData(null);
          onOpenChange(false);
          return;
        }
        if (!loading && !loadingDetail) {
          onOpenChange(state);
        }
      }}
    >
      <DialogContent
        className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto z-51"
        onEscapeKeyDown={(e) => {
          if (loading || loadingDetail) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (loading || loadingDetail) e.preventDefault();
        }}
      >
        {!success && (
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Detalles del Servicio
            </DialogTitle>
            <DialogDescription>
              Revisa los detalles completos y selecciona tu asiento
            </DialogDescription>
          </DialogHeader>
        )}

        {loadingDetail ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Cargando detalles del servicio...</span>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : success ? (
          <div className="py-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-orange-100 rounded-full animate-ping opacity-75"></div>
                <CheckCircle2 className="h-20 w-20 text-orange-500 relative z-10" />
              </div>

              {/* Título y mensaje */}
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-blue-600">
                  Reserva Confirmada
                </h3>
                <p className="text-muted-foreground text-lg">
                  ¡Tu asiento ha sido reservado!
                </p>
              </div>

              {bookingData && (
                <div className="w-full max-w-md bg-linear-to-br from-blue-50 to-sky-50 border border-blue-200 rounded-xl p-6 shadow-lg">
                  {/* Header de la tarjeta */}
                  <div className="text-center mb-4">
                    <Badge
                      variant="outline"
                      className="bg-blue-500 text-white border-blue-600 mb-2"
                    >
                      Confirmado
                    </Badge>
                    <p className="text-sm text-blue-600">
                      Reserva realizada exitosamente
                    </p>
                  </div>

                  {/* Información principal */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
                      <p className="text-xs text-muted-foreground">N° de PNR</p>
                      <p className="font-bold text-blue-800 text-sm">
                        {bookingData.operatorPnr}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
                      <p className="text-xs text-muted-foreground">Asiento</p>
                      <p className="font-bold text-blue-800 text-lg">
                        {selectedSeat}
                      </p>
                    </div>
                  </div>

                  {/* Detalles del viaje */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Operador:</span>
                      <span className="font-medium text-blue-800">
                        {bookingData.travelName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Origen - Destino:
                      </span>
                      <span className="font-medium text-blue-800">
                        {origin} - {destination}
                      </span>
                    </div>

                    {serviceDetail && (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Fecha:</span>
                          <span className="font-medium text-blue-800">
                            {formatTravelDate(serviceDetail.travel_date)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Hora salida:
                          </span>
                          <span className="font-medium text-blue-800">
                            {serviceDetail.dep_time}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Precio total */}
                  <div className="border-t border-blue-200 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Precio total:
                      </span>
                      <span className="text-xl font-bold text-blue-700">
                        ${bookingData.monto_boleto.toLocaleString("es-CL")}
                      </span>
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-700 text-center">
                      Recibirás un email de confirmación con los detalles de tu
                      reserva
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-600">
                  Esta ventana se cerrará automáticamente en{" "}
                  <span className="font-bold">10 segundos</span>
                </p>
              </div>
            </div>
          </div>
        ) : serviceDetail ? (
          <>
            <div className="space-y-6">
              {/* Información del servicio */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bus className="h-5 w-5 text-primary" />
                    <span className="font-bold text-lg">
                      {serviceDetail.travels_name}
                    </span>
                  </div>
                  <Badge
                    variant={
                      availableSeats.length > 0 ? "default" : "destructive"
                    }
                  >
                    {availableSeats.length} asientos disponibles
                  </Badge>
                </div>

                <div className="flex items-center gap-2 whitespace-nowrap">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium flex items-center gap-1">
                    {origin}
                    <ArrowRight className="h-3 w-3 opacity-60" />
                    {destination}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-start gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatTravelDate(serviceDetail.travel_date)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Salida: {serviceDetail.dep_time}</span>
                    </div>
                    {terminalOrigen && (
                      <p className="text-xs text-muted-foreground ml-6">
                        {terminalOrigen}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Llegada: {serviceDetail.arr_time}</span>
                    </div>
                    {terminalDestino && (
                      <p className="text-xs text-muted-foreground ml-6">
                        {terminalDestino}
                      </p>
                    )}
                  </div>
                </div>

                {serviceDetail.bus_type && (
                  <div className="text-sm">
                    <strong>Tipo de bus:</strong>{" "}
                    {getMainBusType(serviceDetail.bus_type)}
                  </div>
                )}

                <div className="pt-3 border-t flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Precio por asiento:
                  </span>
                  <div className="flex items-center gap-1 text-xl font-bold text-primary">
                    <DollarSign className="h-4 w-4" />
                    {extractPrice(serviceDetail.cost)}
                  </div>
                </div>
              </div>

              {/* Selector de asientos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">
                    Selecciona tu Asiento
                  </h3>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span>
                      {availableSeats.length} de{" "}
                      {serviceDetail.bus_layout.total_seats} disponibles
                    </span>
                  </div>
                </div>

                <SeatSelector
                  totalSeats={serviceDetail.bus_layout.total_seats}
                  occupiedSeats={occupiedSeats}
                  onSeatSelect={(seat) => {
                    handleSeatSelection(seat);
                  }}
                  selectedSeat={selectedSeat}
                  seats={availableSeats}
                  coachDetails={serviceDetail.bus_layout.coach_details}
                  floor={serviceDetail.bus_layout.floor}
                  disabled={!disponibilidadVerificada}
                />
              </div>

              {/* Información del pasajero */}
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
                      variant={
                        modoPasajero === "buscar" ? "default" : "outline"
                      }
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
                            <p className="text-sm font-medium">
                              {errorPasajero}
                            </p>
                            {(errorPasajero.includes("401") ||
                              errorPasajero.includes("autorizado")) && (
                              <p className="text-xs mt-1">
                                Contacte al administrador del sistema para
                                obtener permisos.
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
                            RUT:{" "}
                            {formatearRutParaMostrar(pasajeroEncontrado.rut)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Nombre:</span>
                            <p className="font-medium">
                              {pasajeroEncontrado.nombre}
                            </p>
                          </div>
                          {pasajeroEncontrado.correo && (
                            <div>
                              <span className="text-gray-600">Email:</span>
                              <p className="font-medium">
                                {pasajeroEncontrado.correo}
                              </p>
                            </div>
                          )}
                          {pasajeroEncontrado.telefono && (
                            <div>
                              <span className="text-gray-600">Teléfono:</span>
                              <p className="font-medium">
                                {pasajeroEncontrado.telefono}
                              </p>
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
                              <span className="text-gray-600">
                                Centro costo:
                              </span>
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
                            El pasajero ha sido asignado para la reserva
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
                              <p className="text-sm font-medium">
                                {errorPasajero}
                              </p>
                              {(errorPasajero.includes("401") ||
                                errorPasajero.includes("autorizado")) && (
                                <p className="text-xs mt-1">
                                  Contacte al administrador del sistema para
                                  obtener permisos.
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
                              Complete los datos para registrar un nuevo
                              pasajero en su empresa.
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
                          onBlur={() => validatePassenger()}
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
                        <label className="text-xs font-medium block mb-1">
                          RUT *
                        </label>
                        <input
                          type="text"
                          value={passengerRut}
                          onChange={(e) => {
                            const formatted = formatRutInput(e.target.value);
                            setPassengerRut(formatted);
                          }}
                          onBlur={() => validatePassenger()}
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
                        <label className="text-xs font-medium block mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={passengerEmail}
                          onChange={(e) => setPassengerEmail(e.target.value)}
                          onBlur={() => validatePassenger()}
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

                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium block mb-1">
                          Centro de Costo *
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={centroCostoSeleccionado?.id || ""}
                            onChange={(e) => {
                              const id = parseInt(e.target.value);
                              const centro = centrosCosto.find(
                                (c) => c.id === id
                              );
                              setCentroCostoSeleccionado(
                                centro
                                  ? { id: centro.id, nombre: centro.nombre }
                                  : null
                              );
                            }}
                            className="w-full px-3 py-2 border rounded-md bg-background"
                            required
                          >
                            <option value="">
                              Seleccionar centro de costo
                            </option>
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
                          Seleccione el centro de costo al que pertenece el
                          pasajero.
                        </p>
                      </div>
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
                          !centroCostoSeleccionado
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
                            <strong>Pasajero no encontrado:</strong> Complete
                            los datos para crear un nuevo pasajero.
                          </p>
                        </div>
                      )}

                    <div className="text-xs text-muted-foreground">
                      <p>
                        <strong>Nota:</strong> El pasajero será asociado
                        automáticamente a su empresa.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {bookingError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription className="flex justify-center items-center">
                  {bookingError}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleBooking}
                disabled={!canConfirm || loading}
                className={
                  !canConfirm
                    ? "opacity-50 cursor-not-allowed bg-accent hover:bg-accent/90 text-accent-foreground"
                    : "bg-accent hover:bg-accent/90 text-accent-foreground"
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Confirmar Reserva
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
