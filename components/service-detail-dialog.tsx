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
}

export function ServiceDetailDialog({
  serviceId,
  open,
  onOpenChange,
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
    if (passengerRut && !validateRut(passengerRut)) {
      errs.rut = "RUT inválido.";
    }
    if (passengerEmail && !validateEmail(passengerEmail)) {
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
    } else {
      setServiceDetail(null);
      setSelectedSeat(null);
      setError(null);
      setDisponibilidadVerificada(false);
    }
  }, [open, serviceId]);

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

    if (!validatePassenger()) {
      setBookingError(
        "Por favor corrige los errores del formulario de pasajero."
      );
      return;
    }

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
        nombre_pasajero: passengerName,
        rut_pasajero: passengerRut,
        email_pasajero: passengerEmail,
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

  const canConfirm =
    disponibilidadVerificada &&
    selectedSeat !== null &&
    passengerName.trim().length >= 3 &&
    validateRut(passengerRut) &&
    validateEmail(passengerEmail);

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

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    {origin} - {destination}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatTravelDate(serviceDetail.travel_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Salida: {serviceDetail.dep_time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Llegada: {serviceDetail.arr_time}</span>
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
              <div className="p-4 bg-muted/50 rounded-lg space-y-3 border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Datos del pasajero</h4>
                    <p className="text-xs text-muted-foreground">
                      Completa los datos del pasajero que viajará. Nombre es
                      obligatorio.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium block mb-1">
                      Nombre del pasajero *
                    </label>
                    <input
                      type="text"
                      value={passengerName}
                      onChange={(e) => setPassengerName(e.target.value)}
                      onBlur={() => validatePassenger()}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                      placeholder="Ej: Juan Pérez"
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
                      RUT pasajero
                    </label>
                    <input
                      type="text"
                      value={passengerRut}
                      onChange={(e) => setPassengerRut(e.target.value)}
                      onBlur={() => validatePassenger()}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                      placeholder="Ej: 12.345.678-5"
                      aria-invalid={!!passengerErrors.rut}
                    />
                    {passengerErrors.rut && (
                      <p className="text-xs text-destructive mt-1">
                        {passengerErrors.rut}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium block mb-1">
                      Email pasajero
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
                </div>
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Confirmar Reserva"
                )}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
