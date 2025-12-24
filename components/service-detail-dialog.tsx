"use client";

import { useState, useEffect, useRef } from "react";
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
  ArrowRight,
  X,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { SeatSelector } from "@/components/seat-selector";
import { PassengerInfo } from "@/components/passenger-info";
import type { ServiceDetail, Seat } from "@/types/service-detail";
import { useTravel } from "@/components/context/travel-context";
import { useUserStore } from "@/lib/user-store";
import Swal from "sweetalert2";
import { BUILD_ID_FILE } from "next/dist/shared/lib/constants";

interface ServiceDetailDialogProps {
  serviceId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  terminalOrigen: string | null;
  terminalDestino: string | null;
  tripType?: "departure" | "return";
}

interface PassengerData {
  id: string;
  seat: string;
  passenger: any | null;
  completed: boolean;
}

export function ServiceDetailDialog({
  serviceId,
  open,
  onOpenChange,
  terminalOrigen,
  terminalDestino,
  tripType = "departure",
}: ServiceDetailDialogProps) {
  const { user } = useUserStore();
  const { token } = useAuth();
  const [serviceDetail, setServiceDetail] = useState<ServiceDetail | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<any[]>([]);
  const { origin, destination } = useTravel();
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [disponibilidadVerificada, setDisponibilidadVerificada] =
    useState<boolean>(false);
  const [passengersData, setPassengersData] = useState<PassengerData[]>([]);
  const bookingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_SEATS = 5;

  // Estados para guardar y usar pasajeros de la ida
  const [savedPassengers, setSavedPassengers] = useState<any[]>([]);
  const [usingSavedPassengers, setUsingSavedPassengers] = useState(false);

  // Ref para trackear si ya se limpiaron las reservas antiguas
  const oldBookingsCleaned = useRef(false);

  // Estados para las ciudades a mostrar
  const [displayOrigin, setDisplayOrigin] = useState<string>("");
  const [displayDestination, setDisplayDestination] = useState<string>("");

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

  // Efecto para actualizar las ciudades a mostrar
  useEffect(() => {
    console.log("ServiceDetailDialog - Actualizando ciudades:", {
      tripType,
      origin,
      destination,
    });

    if (tripType === "departure") {
      // Para ida: mostrar origen → destino
      setDisplayOrigin(origin || "");
      setDisplayDestination(destination || "");
    } else {
      // Para vuelta: mostrar las ciudades INTERCAMBIADAS
      // El origen visual es el destino real, y viceversa
      setDisplayOrigin(destination || "");
      setDisplayDestination(origin || "");
    }
  }, [tripType, origin, destination]);

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
    } else {
      setServiceDetail(null);
      setSelectedSeats([]);
      setError(null);
      setDisponibilidadVerificada(false);
      setPassengersData([]);
      setSuccess(false);
      setBookingData([]);
      setBookingError(null);
      setSavedPassengers([]);
      setUsingSavedPassengers(false);
    }
  }, [open, serviceId]);

  // Cargar pasajeros guardados cuando se abre el modal de vuelta
  useEffect(() => {
    if (open && tripType === "return") {
      // Obtener las reservas de ida del localStorage
      const storedBookings = JSON.parse(
        localStorage.getItem("completedBookings") || "[]"
      );

      // Buscar la reserva de ida
      const departureBooking = storedBookings.find(
        (booking: any) => booking.tripType === "departure"
      );

      if (departureBooking?.passengers?.length > 0) {
        setSavedPassengers(departureBooking.passengers);
        console.log(
          "Pasajeros guardados encontrados:",
          departureBooking.passengers
        );
      }
    }
  }, [open, tripType]);

  useEffect(() => {
    // Validación: No puede seleccionar más asientos que pasajeros guardados (solo en vuelta)
    if (
      tripType === "return" &&
      savedPassengers.length > 0 &&
      selectedSeats.length > savedPassengers.length
    ) {
      setBookingError(
        `Para el viaje de vuelta, solo puedes seleccionar hasta ${savedPassengers.length} asiento(s) 
        (el mismo número de pasajeros del viaje de ida)`
      );

      // Remover asientos extras
      const validSeats = selectedSeats.slice(0, savedPassengers.length);
      setSelectedSeats(validSeats);
      return;
    }

    const newPassengersData: PassengerData[] = [];

    selectedSeats.forEach((seat) => {
      const existingPassenger = passengersData.find((p) => p.seat === seat);
      if (existingPassenger) {
        newPassengersData.push(existingPassenger);
      } else {
        // PARA LA VUELTA: Intentar asignar pasajeros guardados en orden
        if (tripType === "return" && savedPassengers.length > 0) {
          const passengerIndex = newPassengersData.length;
          const savedPassenger = savedPassengers[passengerIndex] || null;

          if (savedPassenger) {
            console.log(
              `Asignando pasajero guardado al asiento ${seat}:`,
              savedPassenger
            );
          }

          newPassengersData.push({
            id: `passenger-${Date.now()}-${Math.random()}`,
            seat,
            passenger: savedPassenger || null,
            completed: !!savedPassenger,
          });
        } else {
          // Para ida o si no hay pasajeros guardados
          newPassengersData.push({
            id: `passenger-${Date.now()}-${Math.random()}`,
            seat,
            passenger: null,
            completed: false,
          });
        }
      }
    });

    setPassengersData(newPassengersData);
  }, [selectedSeats, tripType, savedPassengers]);

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
      const precioTotal = precioConRecargo * Math.min(MAX_SEATS, 5);

      const res = await fetch("/api/disponibilidad", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_User: user?.id ?? 1,
          monto_boleto: precioTotal,
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

  const markSeatsAsUnavailable = (seatNumbers: string[]) => {
    if (!serviceDetail) return;

    const seatMap = new Map();
    serviceDetail.bus_layout.available
      .split(",")
      .filter((s) => s.trim())
      .forEach((seatInfo) => {
        const [seatNumber] = seatInfo.split("|");
        if (seatNumber) {
          seatMap.set(seatNumber.trim(), seatInfo);
        }
      });

    seatNumbers.forEach((seat) => {
      seatMap.delete(seat);
    });

    const available = Array.from(seatMap.values()).join(",");

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

  const handleSeatSelection = (seats: string[]) => {
    if (!disponibilidadVerificada) {
      return;
    }
    setSelectedSeats(seats);
  };

  const handleRemoveSeat = (seatToRemove: string) => {
    setSelectedSeats(selectedSeats.filter((seat) => seat !== seatToRemove));
  };

  const handlePassengerSelected = (passengerId: string, passenger: any) => {
    setPassengersData((prev) =>
      prev.map((p) =>
        p.id === passengerId ? { ...p, passenger, completed: !!passenger } : p
      )
    );
  };

  const handlePassengerCreated = (passengerId: string, passenger: any) => {
    setPassengersData((prev) =>
      prev.map((p) =>
        p.id === passengerId ? { ...p, passenger, completed: !!passenger } : p
      )
    );
  };

  const getTotalPrice = (): number => {
    const availableSeats = parseSeats();
    return selectedSeats.reduce((total, seatNumber) => {
      const seat = availableSeats.find((s) => s.number === seatNumber);
      return total + (seat?.price || 0);
    }, 0);
  };

  const allPassengersCompleted = (): boolean => {
    // Si estamos usando pasajeros guardados y todos están completos
    if (usingSavedPassengers) {
      return passengersData.every((p) => p.completed && p.passenger);
    }

    // Validación normal
    return (
      passengersData.length > 0 && passengersData.every((p) => p.completed)
    );
  };

  const handleUseSavedPassengers = () => {
    if (savedPassengers.length === 0) return;

    // Asignar pasajeros guardados a los asientos seleccionados
    const updatedPassengersData = passengersData.map((pData, index) => {
      const savedPassenger = savedPassengers[index] || null;
      if (savedPassenger) {
        return {
          ...pData,
          passenger: savedPassenger,
          completed: true,
        };
      }
      return pData;
    });

    setPassengersData(updatedPassengersData);
    setUsingSavedPassengers(true);

    // Mostrar mensaje de éxito
    setBookingError(null);
  };

  const handleBooking = async () => {
    if (!selectedSeats.length || !serviceDetail) {
      setBookingError("Debe seleccionar al menos un asiento");
      return;
    }

    if (!allPassengersCompleted()) {
      setBookingError("Debe completar los datos de todos los pasajeros");
      return;
    }

    setBookingError(null);
    setLoading(true);

    try {
      const boardingPoint = serviceDetail.boarding_stages?.split("|")[0];
      const availableSeats = parseSeats();
      const bookings = [];

      // Reservar cada asiento
      for (const passengerData of passengersData) {
        const seatObj = availableSeats.find(
          (s) => s.number === passengerData.seat
        );
        const seatPrice = seatObj?.basePrice || 0;

        const bookResponse = await fetch("/api/reserve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceId: serviceId.toString(),
            seatNumber: passengerData.seat,
            price: seatPrice,
            originId: serviceDetail.origin_id,
            destinationId: serviceDetail.destination_id,
            travelDate: serviceDetail.travel_date,
            busType: serviceDetail.bus_type,
            routeId: serviceDetail.route_id,
            availableSeats: serviceDetail.available_seats,
            cost: serviceDetail.cost,
            boardingAt: boardingPoint,
            passengerName: passengerData.passenger.nombre,
            passengerEmail: passengerData.passenger.correo || "",
            passengerRut: passengerData.passenger.rut,
          }),
        });

        const bookData = await bookResponse.json();

        if (!bookResponse.ok || !bookData.success) {
          console.error("Error booking seat:", passengerData.seat, bookData);

          const isSeatAlreadyReserved =
            bookData?.error?.includes?.("El asiento ya está reservado") ||
            bookData?.error?.includes?.("no está disponible");

          if (isSeatAlreadyReserved) {
            markSeatsAsUnavailable([passengerData.seat]);

            setSelectedSeats((prev) =>
              prev.filter((seat) => seat !== passengerData.seat)
            );

            setPassengersData((prev) =>
              prev.filter((p) => p.seat !== passengerData.seat)
            );

            setBookingError(
              `El asiento ${passengerData.seat} ya no está disponible. Posiblemente fue reservado por otro usuario. El asiento ha sido removido de tu selección.`
            );

            if (passengersData.length > 1) {
              continue;
            } else {
              setLoading(false);
              return;
            }
          }

          throw new Error(
            `Error al reservar el asiento ${passengerData.seat}: ${
              bookData?.error || "Error desconocido"
            }`
          );
        }

        bookings.push({
          seat: passengerData.seat,
          pnrNumber: bookData.pnrNumber,
          passenger: passengerData.passenger,
        });
      }

      setBookingError(null);

      const confirmations = [];
      for (const booking of bookings) {
        const confirmResponse = await fetch("/api/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pnrNumber: booking.pnrNumber }),
        });

        const confirmData = await confirmResponse.json();

        if (!confirmResponse.ok || !confirmData.success) {
          throw new Error(
            `Error al confirmar reserva para asiento ${booking.seat}: ${
              confirmData.error || "Error desconocido"
            }`
          );
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
          nombre_pasajero: booking.passenger.nombre,
          rut_pasajero: booking.passenger.rut,
          email_pasajero: booking.passenger.correo || "",
          id_pasajero: booking.passenger.id,
          id_centro_costo: booking.passenger.id_centro_costo || null,
          terminal_origen: terminalOrigen,
          terminal_destino: terminalDestino,
          // id_empresa: user?.companyId || null,
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
          }
        } catch (e) {
          console.error("Error al enviar ticket:", e);
        }

        confirmations.push({
          ...confirmData,
          monto_boleto,
          seat: booking.seat,
          passenger: booking.passenger,
        });
      }

      // Guardar esta reserva
      const currentBooking = {
        tripType,
        origin: displayOrigin,
        destination: displayDestination,
        date: serviceDetail.travel_date,
        dep_time: serviceDetail.dep_time,
        arr_time: serviceDetail.arr_time,
        travel_name: serviceDetail.travels_name,
        seats: selectedSeats,
        passengers: passengersData.map((p) => p.passenger),
        totalPrice: getTotalPrice(),
        pnrNumbers: confirmations.map((c) => c.operatorPnr),
        ticketNumbers: confirmations.map((c) => c.ticketNumber),
        terminalOrigen,
        terminalDestino,
        bookingData: confirmations,
      };

      // IMPORTANTE: Limpiar reservas antiguas solo la primera vez que se reserva la IDA
      if (tripType === "departure" && !oldBookingsCleaned.current) {
        localStorage.removeItem("completedBookings");
        oldBookingsCleaned.current = true;
        console.log("Reservas antiguas limpiadas al reservar la ida");
      }

      // Guardar en localStorage
      const storedBookings = JSON.parse(
        localStorage.getItem("completedBookings") || "[]"
      );
      storedBookings.push(currentBooking);
      localStorage.setItem("completedBookings", JSON.stringify(storedBookings));

      // Disparar eventos según el tipo de viaje
      if (tripType === "departure") {
        // Evento para notificar que la ida fue reservada
        window.dispatchEvent(new CustomEvent("departureBooked"));
        // Evento para nueva reserva
        window.dispatchEvent(new Event("newBooking"));
      } else {
        // Evento para nueva reserva (vuelta)
        window.dispatchEvent(new Event("newBooking"));
      }

      setBookingData(confirmations);
      markSeatsAsUnavailable(selectedSeats);
      setSuccess(true);

      // No cerrar automáticamente
      if (bookingTimeoutRef.current) {
        clearTimeout(bookingTimeoutRef.current);
      }
    } catch (err) {
      console.error("Error inesperado:", err);
      setBookingError(
        err instanceof Error
          ? err.message
          : "Error inesperado al procesar las reservas"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToReturn = () => {
    setSuccess(false);
    setSelectedSeats([]);
    setBookingData([]);
    setPassengersData([]);
    setSavedPassengers([]);
    setUsingSavedPassengers(false);
    onOpenChange(false);

    // Disparar evento para continuar con la vuelta
    window.dispatchEvent(new CustomEvent("continueToReturn"));
  };

  const handleClose = () => {
    // Limpiar estados específicos de pasajeros guardados
    setSavedPassengers([]);
    setUsingSavedPassengers(false);

    // Si es la vuelta y está en éxito, resetear el flag
    if (tripType === "return" && success) {
      oldBookingsCleaned.current = false;
    }

    setSuccess(false);
    setSelectedSeats([]);
    setBookingData([]);
    setPassengersData([]);
    onOpenChange(false);
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

  const handleModalClose = (state: boolean) => {
    if (!state && success) {
      if (bookingTimeoutRef.current) {
        clearTimeout(bookingTimeoutRef.current);
      }
      onOpenChange(false);
      return;
    }
    if (!loading && !loadingDetail) {
      onOpenChange(state);
    }
  };

  const canConfirm =
    disponibilidadVerificada &&
    selectedSeats.length > 0 &&
    allPassengersCompleted();

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent
        className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto z-51 p-4 sm:p-6"
        onEscapeKeyDown={(e) => {
          if (loading || loadingDetail) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (loading || loadingDetail) e.preventDefault();
        }}
      >
        {!success && (
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
              Detalles del Servicio
              <Badge variant="outline">
                {tripType === "departure" ? "Viaje de Ida" : "Viaje de Vuelta"}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {tripType === "departure"
                ? `Paso 1 de 2: Reserva tu viaje de ida`
                : `Paso 2 de 2: Reserva tu viaje de vuelta`}
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
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                <CheckCircle2 className="h-20 w-20 text-blue-500 relative z-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-blue-600">
                  {tripType === "departure"
                    ? "¡Viaje de Ida Reservado!"
                    : "¡Reservas Completadas!"}
                </h3>
                {tripType === "departure" ? (
                  <p className="text-sm text-muted-foreground mt-4">
                    Ahora puedes proceder a reservar tu viaje de vuelta
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-4">
                    ¡Ambas reservas han sido confirmadas!
                  </p>
                )}
              </div>

              {bookingData.length > 0 && (
                <div className="w-full max-w-4xl bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-lg">
                  <div className="text-center mb-6">
                    <Badge
                      variant="outline"
                      className="bg-blue-500 text-white border-blue-600 mb-2"
                    >
                      {tripType === "departure"
                        ? "Confirmado"
                        : "Todas Confirmadas"}
                    </Badge>
                    <p className="text-sm text-blue-600">
                      {tripType === "departure"
                        ? "Reserva de ida exitosa"
                        : "Resumen completo de reservas"}
                    </p>
                  </div>

                  {/* Si es la vuelta, mostrar TODAS las reservas en orden IDA primero */}
                  {tripType === "return" ? (
                    <>
                      {/* PRIMERO: Mostrar las reservas de IDA del localStorage */}
                      <div className="mb-8">
                        <h4 className="font-bold text-blue-800 text-lg mb-4 pb-2 border-b border-blue-200 flex items-center gap-2">
                          <ArrowRight className="h-5 w-5" />
                          Viaje de Ida
                        </h4>
                        {(() => {
                          // Cargar todas las reservas del localStorage
                          const allBookings = JSON.parse(
                            localStorage.getItem("completedBookings") || "[]"
                          );

                          // Filtrar solo las de ida
                          const departureBookings = allBookings.filter(
                            (b: any) => b.tripType === "departure"
                          );

                          if (departureBookings.length === 0) {
                            return (
                              <div className="text-center py-4 text-gray-500">
                                No se encontraron reservas de ida
                              </div>
                            );
                          }

                          return departureBookings.map(
                            (depBooking: any, index: number) => (
                              <div key={index} className="mb-6">
                                {/* Información general de la reserva de ida */}
                                <div className="p-4 bg-blue-50 rounded-lg mb-3">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">
                                        Ruta:
                                      </span>
                                      <p className="font-medium">
                                        {depBooking.origin} →{" "}
                                        {depBooking.destination}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">
                                        Fecha:
                                      </span>
                                      <p className="font-medium">
                                        {depBooking.date}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">
                                        Empresa:
                                      </span>
                                      <p className="font-medium">
                                        {depBooking.travel_name}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">
                                        Horario:
                                      </span>
                                      <p className="font-medium">
                                        {depBooking.dep_time} -{" "}
                                        {depBooking.arr_time}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Pasajeros de la ida */}
                                <div className="space-y-3">
                                  <h5 className="font-medium text-blue-700 text-sm mb-2">
                                    Pasajeros:
                                  </h5>
                                  {depBooking.passengers?.map(
                                    (passenger: any, pIndex: number) => (
                                      <div
                                        key={pIndex}
                                        className="p-3 bg-white rounded-lg border border-blue-100"
                                      >
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <h6 className="font-medium text-blue-800">
                                              {passenger.nombre}
                                            </h6>
                                            <p className="text-xs text-muted-foreground">
                                              RUT: {passenger.rut}
                                            </p>
                                          </div>
                                          <Badge
                                            variant="outline"
                                            className="bg-blue-100 text-blue-800"
                                          >
                                            Asiento: {depBooking.seats[pIndex]}
                                          </Badge>
                                        </div>
                                        {depBooking.pnrNumbers?.[pIndex] && (
                                          <div className="mt-2 text-sm">
                                            <span className="text-muted-foreground">
                                              PNR:{" "}
                                              {depBooking.pnrNumbers[pIndex]}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  )}
                                </div>

                                <div className="mt-4 pt-3 border-t border-blue-100 text-right">
                                  <span className="font-bold text-blue-700">
                                    Total Ida: $
                                    {depBooking.totalPrice.toLocaleString(
                                      "es-CL"
                                    )}
                                  </span>
                                </div>
                              </div>
                            )
                          );
                        })()}
                      </div>

                      {/* SEGUNDO: Mostrar la reserva actual (vuelta) */}
                      <div className="mb-8">
                        <h4 className="font-bold text-blue-800 text-lg mb-4 pb-2 border-b border-blue-200 flex items-center gap-2">
                          <ArrowLeft className="h-5 w-5" />
                          Viaje de Vuelta
                        </h4>
                        <div className="space-y-4">
                          {bookingData.map((booking, index) => (
                            <div
                              key={index}
                              className="p-4 bg-white rounded-lg border border-blue-100"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-bold text-blue-800">
                                    {booking.passenger?.nombre || "Pasajero"}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    RUT: {booking.passenger?.rut || "N/A"}
                                  </p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="bg-blue-100 text-blue-800"
                                >
                                  Asiento: {booking.seat}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                                <div>
                                  <span className="text-muted-foreground">
                                    N° de PNR:
                                  </span>
                                  <p className="font-medium">
                                    {booking.operatorPnr}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Precio:
                                  </span>
                                  <p className="font-bold text-blue-700">
                                    $
                                    {booking.monto_boleto.toLocaleString(
                                      "es-CL"
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 pt-3 border-t border-blue-100 text-right">
                          <span className="font-bold text-blue-700">
                            Total Vuelta: $
                            {bookingData
                              .reduce(
                                (total: number, booking: any) =>
                                  total + booking.monto_boleto,
                                0
                              )
                              .toLocaleString("es-CL")}
                          </span>
                        </div>
                      </div>

                      {/* Resumen total */}
                      <div className="mt-8 pt-6 border-t border-blue-200 bg-blue-50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h4 className="text-lg font-bold text-blue-800 mb-2">
                              Resumen Total
                            </h4>
                            <div className="text-sm text-blue-600">
                              <div className="flex gap-4">
                                <span>
                                  <Badge
                                    variant="outline"
                                    className="bg-blue-100"
                                  >
                                    Ida:{" "}
                                    {(() => {
                                      const allBookings = JSON.parse(
                                        localStorage.getItem(
                                          "completedBookings"
                                        ) || "[]"
                                      );
                                      const departureBookings =
                                        allBookings.filter(
                                          (b: any) => b.tripType === "departure"
                                        );
                                      return departureBookings.reduce(
                                        (total: number, b: any) =>
                                          total + b.seats.length,
                                        0
                                      );
                                    })()}{" "}
                                    asiento(s)
                                  </Badge>
                                </span>
                                <span>
                                  <Badge
                                    variant="outline"
                                    className="bg-blue-100"
                                  >
                                    Vuelta: {selectedSeats.length} asiento(s)
                                  </Badge>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-700">
                              $
                              {(() => {
                                // Calcular total de todas las reservas
                                const allBookings = JSON.parse(
                                  localStorage.getItem("completedBookings") ||
                                    "[]"
                                );
                                const totalIda = allBookings
                                  .filter(
                                    (b: any) => b.tripType === "departure"
                                  )
                                  .reduce(
                                    (total: number, b: any) =>
                                      total + b.totalPrice,
                                    0
                                  );
                                const totalVuelta = bookingData.reduce(
                                  (total: number, booking: any) =>
                                    total + booking.monto_boleto,
                                  0
                                );
                                return (totalIda + totalVuelta).toLocaleString(
                                  "es-CL"
                                );
                              })()}
                            </div>
                            <p className="text-sm text-blue-600">
                              Total general
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                          <div className="text-center p-2 bg-white rounded border border-blue-100">
                            <div className="text-blue-700 font-medium">
                              Reservas Totales
                            </div>
                            <div className="text-xl font-bold text-blue-800">
                              {(() => {
                                const allBookings = JSON.parse(
                                  localStorage.getItem("completedBookings") ||
                                    "[]"
                                );
                                return (
                                  allBookings.filter(
                                    (b: any) => b.tripType === "departure"
                                  ).length + 1
                                );
                              })()}
                            </div>
                          </div>
                          <div className="text-center p-2 bg-white rounded border border-blue-100">
                            <div className="text-blue-700 font-medium">
                              Asientos Totales
                            </div>
                            <div className="text-xl font-bold text-blue-800">
                              {(() => {
                                const allBookings = JSON.parse(
                                  localStorage.getItem("completedBookings") ||
                                    "[]"
                                );
                                const departureSeats = allBookings
                                  .filter(
                                    (b: any) => b.tripType === "departure"
                                  )
                                  .reduce(
                                    (total: number, b: any) =>
                                      total + b.seats.length,
                                    0
                                  );
                                return departureSeats + selectedSeats.length;
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    // Si es solo ida, mostrar solo esta reserva
                    <div className="space-y-4">
                      {bookingData.map((booking, index) => (
                        <div
                          key={index}
                          className="p-4 bg-white rounded-lg border border-blue-100"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-bold text-blue-800">
                                {booking.passenger?.nombre || "Pasajero"}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                RUT: {booking.passenger?.rut || "N/A"}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="bg-blue-100 text-blue-800"
                            >
                              Asiento: {booking.seat}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                            <div>
                              <span className="text-muted-foreground">
                                N° de PNR:
                              </span>
                              <p className="font-medium">
                                {booking.operatorPnr}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Precio:
                              </span>
                              <p className="font-bold text-blue-700">
                                ${booking.monto_boleto.toLocaleString("es-CL")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Totales (siempre visible) */}
                  <div className="mt-6 pt-4 border-t border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">
                        {tripType === "return"
                          ? "Total de todas las reservas:"
                          : "Total reservas:"}
                      </span>
                      <span className="text-lg font-bold text-blue-700">
                        {tripType === "return"
                          ? (() => {
                              const allBookings = JSON.parse(
                                localStorage.getItem("completedBookings") ||
                                  "[]"
                              );
                              const departureSeats = allBookings
                                .filter((b: any) => b.tripType === "departure")
                                .reduce(
                                  (total: number, b: any) =>
                                    total + b.seats.length,
                                  0
                                );
                              return `${
                                departureSeats + selectedSeats.length
                              } asiento(s)`;
                            })()
                          : `${bookingData.length} asiento(s)`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Monto total:
                      </span>
                      <span className="text-xl font-bold text-blue-700">
                        $
                        {tripType === "return"
                          ? (() => {
                              const allBookings = JSON.parse(
                                localStorage.getItem("completedBookings") ||
                                  "[]"
                              );
                              const totalIda = allBookings
                                .filter((b: any) => b.tripType === "departure")
                                .reduce(
                                  (total: number, b: any) =>
                                    total + b.totalPrice,
                                  0
                                );
                              const totalVuelta = bookingData.reduce(
                                (total: number, booking: any) =>
                                  total + booking.monto_boleto,
                                0
                              );
                              return (totalIda + totalVuelta).toLocaleString(
                                "es-CL"
                              );
                            })()
                          : bookingData
                              .reduce(
                                (total: number, booking: any) =>
                                  total + booking.monto_boleto,
                                0
                              )
                              .toLocaleString("es-CL")}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 mt-6">
                {tripType === "departure" ? (
                  <>
                    <Button
                      onClick={handleContinueToReturn}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Continuar con la Vuelta
                    </Button>
                    <Button variant="outline" onClick={handleClose}>
                      Cerrar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleClose}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Finalizar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : serviceDetail ? (
          <>
            <div className="space-y-6">
              {/* Información del servicio */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Bus className="h-5 w-5 text-primary" />
                    <span className="font-bold text-lg">
                      {serviceDetail.travels_name}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={
                        availableSeats.length > 0 ? "default" : "destructive"
                      }
                      className="text-xs sm:text-sm"
                    >
                      {availableSeats.length} asientos disponibles
                    </Badge>
                    {selectedSeats.length > 0 && (
                      <Badge variant="secondary" className="text-xs sm:text-sm">
                        {selectedSeats.length} seleccionados
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-medium flex items-center gap-1 text-sm sm:text-base truncate">
                    {displayOrigin}
                    <ArrowRight className="h-3 w-3 opacity-60 shrink-0" />
                    {displayDestination}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-start gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{formatTravelDate(serviceDetail.travel_date)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
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
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
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

                <div className="pt-3 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="text-sm text-muted-foreground">
                    Precio por asiento:
                  </span>
                  <div className="flex items-center gap-1 text-lg sm:text-xl font-bold text-primary">
                    <DollarSign className="h-4 w-4" />
                    {extractPrice(serviceDetail.cost)}
                  </div>
                </div>
              </div>

              {/* Selector de asientos */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h3 className="font-semibold text-lg">
                    Selecciona tus Asientos (máximo {MAX_SEATS})
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
                  onSeatSelect={handleSeatSelection}
                  selectedSeats={selectedSeats}
                  seats={availableSeats}
                  coachDetails={serviceDetail.bus_layout.coach_details}
                  floor={serviceDetail.bus_layout.floor}
                  disabled={!disponibilidadVerificada}
                  maxSeats={MAX_SEATS}
                />

                {selectedSeats.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="bg-white text-xs">
                            {selectedSeats.length} seleccionados
                          </Badge>
                          <span className="text-sm font-medium text-blue-800">
                            ${getTotalPrice().toLocaleString("es-CL")}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-blue-600 truncate">
                          Asientos: {selectedSeats.join(", ")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSeats([])}
                        className="h-8 px-2 text-red-600 border border-red-300 hover:text-red-800 hover:bg-red-50 shrink-0 w-full sm:w-auto"
                      >
                        <Trash2 className="h-4 w-4 sm:mr-1 inline" />
                        <span className="hidden sm:inline">
                          Limpiar selección
                        </span>
                        <span className="sm:hidden">Limpiar</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Componentes de información del pasajero para cada asiento */}
              {selectedSeats.length > 0 && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">
                        Datos de los Pasajeros
                      </h3>

                      {/* BOTÓN PARA USAR PASAJEROS GUARDADOS (solo en vuelta) */}
                      {tripType === "return" &&
                        savedPassengers.length > 0 &&
                        !usingSavedPassengers && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleUseSavedPassengers}
                            className="bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Usar pasajeros de la ida ({savedPassengers.length})
                          </Button>
                        )}

                      {/* Indicador de pasajeros cargados automáticamente */}
                      {tripType === "return" && usingSavedPassengers && (
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-800 border-green-300"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Pasajeros cargados automáticamente
                        </Badge>
                      )}
                    </div>

                    <Badge variant="outline" className="text-xs sm:text-sm">
                      {passengersData.filter((p) => p.completed).length} de{" "}
                      {selectedSeats.length} completados
                    </Badge>
                  </div>

                  {/* Mensaje informativo para la vuelta */}
                  {tripType === "return" &&
                    savedPassengers.length > 0 &&
                    !usingSavedPassengers && (
                      <Alert className="bg-blue-50 border-blue-200">
                        <AlertDescription className="text-sm text-blue-800">
                          <strong>
                            ✓ Tienes {savedPassengers.length} pasajero(s)
                            guardado(s) del viaje de ida.
                          </strong>
                          <br />
                          Haz clic en "Usar pasajeros de la ida" para cargarlos
                          automáticamente.
                        </AlertDescription>
                      </Alert>
                    )}

                  <div className="space-y-4">
                    {passengersData.map((passengerData) => (
                      <div
                        key={passengerData.id}
                        className="border rounded-lg overflow-hidden"
                      >
                        <div className="bg-muted/50 px-4 py-3 flex justify-between items-center border-b">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              Asiento {passengerData.seat}
                            </Badge>
                            {passengerData.completed && (
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-800 border-green-300 text-xs"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                                Completado
                              </Badge>
                            )}
                            {/* Indicar si es pasajero cargado automáticamente */}
                            {passengerData.passenger &&
                              passengerData.completed &&
                              usingSavedPassengers && (
                                <Badge
                                  variant="outline"
                                  className="bg-blue-100 text-blue-800 border-blue-300 text-xs"
                                >
                                  Cargado automáticamente
                                </Badge>
                              )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSeat(passengerData.seat)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="p-4">
                          <PassengerInfo
                            token={token}
                            user={user}
                            swalConfig={swalConfig}
                            onPassengerSelected={(passenger) =>
                              handlePassengerSelected(
                                passengerData.id,
                                passenger
                              )
                            }
                            onPassengerCreated={(passenger) =>
                              handlePassengerCreated(
                                passengerData.id,
                                passenger
                              )
                            }
                            initialMode="buscar"
                            requireCentroCosto={true}
                            initialPassenger={passengerData.passenger}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>Nota:</strong> Debe completar los datos de cada
                      pasajero antes de confirmar la reserva.
                      {selectedSeats.length > 1 &&
                        " Puede asignar diferentes pasajeros a cada asiento."}
                      {tripType === "return" &&
                        savedPassengers.length > 0 &&
                        " También puedes usar los pasajeros guardados del viaje de ida."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {bookingError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription className="flex justify-center items-center">
                  {bookingError}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter className="gap-2 flex-col sm:flex-row">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <Button
                onClick={handleBooking}
                disabled={!canConfirm || loading}
                className={`w-full sm:w-auto order-1 sm:order-2 ${
                  !canConfirm
                    ? "opacity-50 cursor-not-allowed bg-accent hover:bg-accent/90 text-accent-foreground"
                    : "bg-accent hover:bg-accent/90 text-accent-foreground"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Confirmando Reserva(s)...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {tripType === "departure"
                      ? `Confirmar Ida (${selectedSeats.length} asiento(s))`
                      : `Confirmar Vuelta (${selectedSeats.length} asiento(s))`}
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
