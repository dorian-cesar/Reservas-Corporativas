"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  Ticket,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building,
  ArrowRight,
  Loader2,
  Search,
  User,
  X,
  RefreshCw,
} from "lucide-react";
import Swal from "sweetalert2";
import TicketPDFButton from "@/components/ticket-pdf";
import { ModernDatePicker } from "@/components/ui/modern-date-picker";

interface MyBookingsProps {
  showActiveOnly?: boolean;
  limit?: number;
  showCard?: boolean;
}

interface Booking {
  id: number;
  ticketNumber: string;
  ticketStatus: string;
  origin: string;
  destination: string;
  travelDate: string;
  departureTime: string;
  seatNumbers: string;
  fare: number;
  monto_boleto: number;
  monto_devolucion: number;
  confirmedAt: string;
  id_User: number;
  created_at: string;
  updated_at: string;
  _id?: string;
  status?: string;
  date?: string;
  seatNumber?: string;
  price?: number;
  bookedAt?: string;
  companyName?: string;
  nombre_pasajero?: string;
  rut_pasajero?: string;
}

export function MyBookings({
  showActiveOnly = false,
  limit,
  showCard = true,
}: MyBookingsProps) {
  const { user, token } = useAuth();
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedDateFrom, setSelectedDateFrom] = useState<Date | null>(null);
  const [selectedDateTo, setSelectedDateTo] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, dateFrom, dateTo]);

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
  };

  const handleDateFromChange = (selectedDate: Date | null) => {
    setSelectedDateFrom(selectedDate);

    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      setDateFrom(formattedDate);
    } else {
      setDateFrom("");
    }
  };

  const handleDateToChange = (selectedDate: Date | null) => {
    setSelectedDateTo(selectedDate);

    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      setDateTo(formattedDate);
    } else {
      setDateTo("");
    }
  };

  useEffect(() => {
    if (!user || !token) {
      console.log("No user or token:", { user, token });
      return;
    }

    const userId = user?.id;

    async function loadTickets() {
      try {
        const res = await fetch(`/api/tickets/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
        }

        const data = await res.json();

        const mappedBookings = data.map((booking: Booking) => ({
          ...booking,
          status:
            booking.ticketStatus?.toLowerCase() === "confirmed"
              ? "confirmed"
              : "anulado",
          date: booking.travelDate,
          seatNumber: booking.seatNumbers,
          price: booking.monto_boleto || booking.fare,
          bookedAt: booking.confirmedAt || booking.created_at,
          companyName: user?.companyName,
          departureTime: booking.departureTime,
          nombre_pasajero: booking.nombre_pasajero,
          rut_pasajero: booking.rut_pasajero,
        }));

        setUserBookings(mappedBookings);
      } catch (error) {
        console.error("Error cargando tickets", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al cargar las reservas",
          confirmButtonText: "Entendido",
          ...swalConfig,
        });
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, [user, token]);

  const handleCancelBooking = async (booking: Booking) => {
    if (!canCancelBooking(booking)) {
      Swal.fire({
        icon: "warning",
        title: "No es posible anular la reserva",
        html: `
      <p class="text-foreground mb-2">Solo puedes anular una reserva hasta 4 horas antes de la salida.</p>
      <p class="text-sm text-muted-foreground">Si necesitas ayuda, contacta a tu empresa.</p>
    `,
        confirmButtonText: "Entendido",
        ...swalConfig,
      });
      return;
    }

    const refundAmount = calculateRefundAmount(booking.monto_boleto);

    const result = await Swal.fire({
      title: "¿Estás seguro?",
      html: `
      <div class="text-left space-y-3">
        <p class="text-foreground text-center mb-2">¿Deseas anular esta reserva?</p>
        <p class="text-foreground text-center">Esta acción no se puede deshacer.</p>
        <div class="bg-muted/50 p-3 rounded-lg border">
          <p class="text-sm text-muted-foreground mb-1">Detalles de la anulación:</p>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="text-foreground">Asiento:</div>
            <div class="font-medium">${booking.seatNumbers}</div>
            <div class="text-foreground">Monto original:</div>
            <div class="font-medium">${formatPrice(
              booking.monto_boleto || booking.fare
            )}</div>
            <div class="text-foreground">Porcentaje reembolso:</div>
            <div class="font-medium">${
              (Number(user?.companyPorcentajeDevolucion) || 0) * 100
            }%</div>
            <div class="text-foreground font-semibold">Reembolso a Cuenta Corriente:</div>
            <div class="font-bold text-green-600">${formatPrice(
              refundAmount
            )}</div>
          </div>
        </div>
        <p class="text-sm text-muted-foreground mt-2">* El monto de reembolso será acreditado según las políticas de tu empresa.</p>
      </div>
    `,
      icon: "warning",
      iconColor: "#f59e0b",
      showCancelButton: true,
      confirmButtonText: "Sí, anular reserva",
      cancelButtonText: "Cancelar",
      ...swalConfig,
    });

    if (!result.isConfirmed) {
      return;
    }

    const bookingId = booking.id;
    setCancelingId(String(bookingId));

    try {
      const cancelResponse = await fetch("/api/tickets/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ticketNumber: booking.ticketNumber,
          seatNumbers: booking.seatNumbers,
        }),
      });

      const cancelResult = await cancelResponse.json();

      if (!cancelResponse.ok) {
        throw new Error(
          cancelResult.error || "Error al anular la reserva en Kupos"
        );
      }

      if (cancelResult.success) {
        const bookingId = booking.id;
        const updateResponse = await fetch(`/api/cancel-db/${bookingId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ticketStatus: "Anulado",
            monto_devolucion: refundAmount,
          }),
        });

        const contentType = updateResponse.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          const htmlText = await updateResponse.text();
          console.error(
            "Se recibió HTML en lugar de JSON:",
            htmlText.substring(0, 500)
          );
          throw new Error("La ruta de API no existe (404)");
        }

        const updateResult = await updateResponse.json();

        if (!updateResponse.ok) {
          console.error("Error actualizando BD:", updateResult.error);
          Swal.fire({
            icon: "warning",
            title: "Reserva anulada con observaciones",
            html: `
            <div class="text-center space-y-3">
              <p class="text-foreground">La reserva fue anulada en el sistema, pero hubo un problema al actualizar nuestros registros.</p>
              <div class="bg-muted/50 p-3 rounded-lg border">
                <p class="text-sm text-muted-foreground mb-2">Error técnico:</p>
                <p class="text-sm font-medium text-foreground">${
                  updateResult.error
                }</p>
              </div>
              <p class="text-sm text-muted-foreground">Por favor, contacte al administrador.</p>
              ${
                refundAmount
                  ? `<div class="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p class="font-semibold text-orange-800">Reembolso a Cuenta Corriente: ${formatPrice(
                        refundAmount
                      )}</p>
                    </div>`
                  : ""
              }
            </div>
          `,
            confirmButtonText: "Entendido",
            ...swalConfig,
          });
        } else {
          Swal.fire({
            icon: "success",
            title: "¡Reserva anulada!",
            html: `
            <div class="text-center space-y-3">
              <p class="text-foreground">La reserva ha sido anulada exitosamente.</p>
              ${
                refundAmount
                  ? `<div class="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p class="text-sm text-orange-700 mb-1">Se ha procesado el reembolso:</p>
                      <p class="text-xl font-bold text-orange-800">${formatPrice(
                        refundAmount
                      )}</p>
                      <p class="text-xs text-orange-600 mt-1">Este monto será acreditado según las políticas de tu empresa.</p>
                    </div>`
                  : ""
              }
            </div>
          `,
            confirmButtonText: "Entendido",
            ...swalConfig,
          });
        }

        setUserBookings((prevBookings) =>
          prevBookings.map((b) =>
            b.id === bookingId
              ? {
                  ...b,
                  ticketStatus: "Anulado",
                  status: "anulado",
                  monto_devolucion: cancelResult.refundAmount || 0,
                }
              : b
          )
        );
      } else {
        throw new Error(cancelResult.error || "Error al anular la reserva");
      }
    } catch (error) {
      console.error("Error anulando reserva:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        html: `
        <div class="text-center">
          <p class="text-foreground mb-3">${
            error instanceof Error
              ? error.message
              : "Error al anular la reserva"
          }</p>
          <p class="text-sm text-muted-foreground">Por favor, intente nuevamente o contacte al administrador.</p>
        </div>
      `,
        confirmButtonText: "Entendido",
        ...swalConfig,
      });
    } finally {
      setCancelingId(null);
    }
  };

  const canCancelBooking = (booking: Booking) => {
    try {
      const date = booking.travelDate;
      const time = booking.departureTime;
      if (!date || !time) return false;
      const travelDateTime = new Date(`${date}T${time}:00-03:00`);
      const now = new Date();
      const diffHours =
        (travelDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      return diffHours >= 4;
    } catch (err) {
      console.error("Error calculando horas restantes:", err);
      return false;
    }
  };

  const isPastTrip = (booking: Booking) => {
    try {
      const date = booking.travelDate;
      const time = booking.departureTime;
      if (!date || !time) return true;
      const travelDateTime = new Date(`${date}T${time}:00-03:00`);
      const now = new Date();
      return travelDateTime < now;
    } catch (err) {
      console.error("Error verificando viaje pasado:", err);
      return true;
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(price);

  const formatTravelDate = (date: string) => {
    try {
      const [year, month, day] = date.split("-").map(Number);

      const weekdays = [
        "Domingo",
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado",
      ];
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

      const localDate = new Date(year, month - 1, day);
      const weekday = weekdays[localDate.getDay()];
      const monthName = months[month - 1];

      return `${weekday} ${day} de ${monthName} de ${year}`;
    } catch (error) {
      console.error("Error formateando fecha de viaje:", error);
      return date;
    }
  };

  const formatBookingDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-CL", {
        timeZone: "America/Santiago",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formateando fecha de reserva:", error);
      return dateString;
    }
  };

  const formatBookingTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("es-CL", {
        timeZone: "America/Santiago",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (error) {
      console.error("Error formateando hora de reserva:", error);
      return dateString;
    }
  };

  const calculateRefundAmount = (monto_boleto: number): number => {
    const refundPercentage = Number(user?.companyPorcentajeDevolucion) || 0;
    const amount = monto_boleto * refundPercentage;
    return Math.round(amount);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-sm sm:text-base text-muted-foreground">
          Cargando reservas...
        </p>
      </div>
    );
  }

  const filteredBookings = userBookings.filter((b) => {
    const matchesSearch =
      b.origin.toLowerCase().includes(search.toLowerCase()) ||
      b.destination.toLowerCase().includes(search.toLowerCase()) ||
      String(b.departureTime).includes(search) ||
      b.seatNumbers?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === "all"
        ? true
        : b.ticketStatus?.toLowerCase() === filterStatus;
    const travelDate = new Date(b.travelDate);
    const matchesFrom = dateFrom ? travelDate >= new Date(dateFrom) : true;
    const matchesTo = dateTo ? travelDate <= new Date(dateTo) : true;
    return matchesSearch && matchesStatus && matchesFrom && matchesTo;
  });

  const sortedBookings = filteredBookings.sort((a, b) => {
    const dateA = new Date(a.confirmedAt || a.created_at).getTime();
    const dateB = new Date(b.confirmedAt || b.created_at).getTime();
    return dateB - dateA;
  });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const paginatedBookings = sortedBookings.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(sortedBookings.length / itemsPerPage);

  const content = (
    <>
      {paginatedBookings.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm sm:text-base text-muted-foreground">
            {showActiveOnly
              ? "No tienes reservas activas"
              : "No tienes reservas"}
          </p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {paginatedBookings.map((booking, index) => {
            const bookingId = booking.id?.toString() || booking._id || "";
            const isCanceling = cancelingId === bookingId;

            return (
              <div
                key={bookingId}
                className="mx-2 sm:mx-0 p-4 sm:p-6 border-2 rounded-lg bg-card 
                         hover:border-primary hover:shadow-md 
                         transition-all duration-300 
                         animate-in fade-in slide-in-from-left-4"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-bold text-base sm:text-lg">
                        {booking.origin}
                      </span>
                    </div>
                    <ArrowRight className="hidden sm:block text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-accent" />
                      <span className="font-bold text-base sm:text-lg">
                        {booking.destination}
                      </span>
                    </div>
                  </div>
                  <Badge
                    className={
                      booking.ticketStatus?.toLowerCase() === "confirmed"
                        ? "bg-green-500/10 text-green-700 border-green-500/20"
                        : "bg-red-500/10 text-red-700 border-red-500/20"
                    }
                  >
                    {booking.ticketStatus?.toLowerCase() === "confirmed" ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {booking.ticketStatus.toLowerCase() === "confirmed"
                      ? "Confirmado"
                      : "Anulado"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-4 text-xs sm:text-sm text-muted-foreground">
                  <Building className="h-4 w-4" />
                  {booking.companyName ||
                    user?.companyName ||
                    "Empresa de Transportes"}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 text-sm">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {formatTravelDate(booking.travelDate)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Fecha de viaje
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {booking.departureTime} hrs
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Hora de salida
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {booking.nombre_pasajero}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        RUT: {booking.rut_pasajero}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Ticket className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-primary">
                        Asiento {booking.seatNumbers}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Número de asiento
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <div className="font-bold text-lg text-accent">
                      {formatPrice(booking.monto_boleto || booking.fare)}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mb-4">
                  Reservado el{" "}
                  {formatBookingDate(booking.confirmedAt || booking.created_at)}{" "}
                  a las{" "}
                  {formatBookingTime(booking.confirmedAt || booking.created_at)}{" "}
                  hrs
                </div>
                {booking.ticketStatus?.toLowerCase() === "confirmed" && (
                  <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                    <TicketPDFButton ticketNumber={booking.ticketNumber} />

                    {!isPastTrip(booking) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-2 text-red-600 border-red-300 hover:bg-red-600 hover:text-white hover:border-red-400"
                        onClick={() => handleCancelBooking(booking)}
                        disabled={isCanceling}
                      >
                        {isCanceling ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Anulando...
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" />
                            Anular Reserva
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  if (showCard) {
    return (
      <Card className="border-2 shadow-lg mx-2 sm:mx-0">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <Ticket className="h-6 w-6 text-primary" />
              Mis Reservas
            </CardTitle>
            <CardDescription>
              {showActiveOnly
                ? "Tus reservas activas"
                : "Historial completo de tus reservas"}
              {limit && ` - Mostrando ${paginatedBookings.length} reservas`}
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar Reservas
          </Button>
        </CardHeader>

        {/* FILTROS */}
        <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Buscar */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full pl-10 pr-3 border rounded-md bg-background"
              />
            </div>
          </div>

          {/* Estado */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Estado</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-10 px-3 border rounded-md bg-background"
            >
              <option value="all">Todos</option>
              <option value="confirmed">Confirmados</option>
              <option value="anulado">Anulados</option>
            </select>
          </div>

          {/* Fecha desde */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Desde</label>
            <div className="relative">
              <ModernDatePicker
                selected={selectedDateFrom}
                onChange={handleDateFromChange}
              />
              {selectedDateFrom && (
                <button
                  type="button"
                  onClick={() => handleDateFromChange(null)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                  aria-label="Limpiar fecha"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {/* Fecha hasta */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Hasta</label>
            <div className="relative">
              <ModernDatePicker
                selected={selectedDateTo}
                onChange={handleDateToChange}
              />
              {selectedDateTo && (
                <button
                  type="button"
                  onClick={() => handleDateToChange(null)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                  aria-label="Limpiar fecha"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>

        <CardContent>{content}</CardContent>

        {/* PAGINACIÓN */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Anterior
            </Button>

            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>

            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        )}
      </Card>
    );
  }

  return <>{content}</>;
}
