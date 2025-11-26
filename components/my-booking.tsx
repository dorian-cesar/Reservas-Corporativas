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
import { useUserStore } from "@/lib/user-store";
import {
  Ticket,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  Download,
  XCircle,
  AlertCircle,
  Building,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { generateTicketPDF } from "@/lib/ticket-generator";
import Swal from "sweetalert2";

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
}

export function MyBookings({
  showActiveOnly = false,
  limit,
  showCard = true,
}: MyBookingsProps) {
  const { user } = useUserStore();
  const { token } = useAuth();
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

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
        console.log("Raw data from API:", data);

        const mappedBookings = data.map((booking: Booking) => ({
          ...booking,
          _id: booking.id?.toString(),
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
        }));

        console.log("Mapped bookings:", mappedBookings);
        setUserBookings(mappedBookings);
      } catch (error) {
        console.error("Error cargando tickets", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al cargar las reservas",
          confirmButtonText: "Entendido",
        });
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, [user, token]);

  // const handleDownloadTicket = (booking: Booking) => {
  //   generateTicketPDF(booking);
  // };

  const handleCancelBooking = async (booking: Booking) => {
    const refundAmount = calculateRefundAmount(booking.monto_boleto);

    const result = await Swal.fire({
      title: "¿Estás seguro?",
      html: `
        <div class="text-left">
          <p>¿Deseas anular esta reserva? Esta acción no se puede deshacer.</p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, anular reserva",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    const bookingId = booking.id?.toString() || booking._id || "";
    setCancelingId(bookingId);

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
        const updateResponse = await fetch(`/api/cancel-db/${booking.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ticketStatus: "Anulado",
            monto_devolucion: cancelResult.refundAmount || 0,
          }),
        });

        const updateResult = await updateResponse.json();

        if (!updateResponse.ok) {
          console.error("Error actualizando BD:", updateResult.error);
          Swal.fire({
            icon: "warning",
            title: "Reserva anulada con observaciones",
            html: `
              <div class="text-center">
                <p>La reserva fue anulada en el sistema, pero hubo un problema al actualizar nuestros registros.</p>
                <p class="mt-2 text-sm">Por favor, contacte al administrador.</p>
                ${
                  cancelResult.refundAmount
                    ? `<p class="mt-2 font-semibold text-green-600">Monto a devolver: ${formatPrice(
                        cancelResult.refundAmount
                      )}</p>`
                    : ""
                }
              </div>
            `,
            confirmButtonText: "Entendido",
          });
        } else {
          Swal.fire({
            icon: "success",
            title: "¡Reserva anulada!",
            html: `
              <div class="text-center">
                <p>La reserva ha sido anulada exitosamente.</p>
                ${
                  cancelResult.refundAmount
                    ? `<p class="mt-2 font-semibold text-green-600">Monto a devolver: ${formatPrice(
                        cancelResult.refundAmount
                      )}</p>`
                    : ""
                }
              </div>
            `,
            confirmButtonText: "Entendido",
          });
        }

        setUserBookings((prevBookings) =>
          prevBookings.map((b) =>
            b.id?.toString() === bookingId || b._id === bookingId
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
        text:
          error instanceof Error ? error.message : "Error al anular la reserva",
        confirmButtonText: "Entendido",
      });
    } finally {
      setCancelingId(null);
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
    return monto_boleto * refundPercentage;
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

  const filteredBookings = showActiveOnly
    ? userBookings.filter((b) => b.ticketStatus?.toLowerCase() === "confirmed")
    : userBookings;

  const sortedBookings = [...filteredBookings].sort(
    (a, b) =>
      new Date(b.travelDate).getTime() - new Date(a.travelDate).getTime()
  );

  const finalBookings =
    limit && sortedBookings.length > limit
      ? sortedBookings.slice(0, limit)
      : sortedBookings;

  const content = (
    <>
      {finalBookings.length === 0 ? (
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
          {finalBookings.map((booking, index) => {
            const bookingId = booking.id?.toString() || booking._id || "";
            const isCanceling = cancelingId === bookingId;

            return (
              <div
                key={bookingId}
                className="p-4 sm:p-6 border-2 rounded-lg hover:border-primary transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-left-4 bg-card mx-2 sm:mx-0"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* HEADER */}
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
                    {booking.ticketStatus === "Confirmed"
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

                {/* INFO DEL VIAJE */}
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

                  <div className="flex flex-col items-start">
                    <div className="font-bold text-lg text-accent">
                      {formatPrice(booking.monto_boleto || booking.fare)}
                    </div>
                  </div>
                </div>

                {/* FECHA RESERVA */}
                <div className="text-xs text-muted-foreground mb-4">
                  Reservado el{" "}
                  {formatBookingDate(booking.confirmedAt || booking.created_at)}{" "}
                  a las{" "}
                  {formatBookingTime(booking.confirmedAt || booking.created_at)}{" "}
                  hrs
                </div>

                {/* BOTONES */}
                {booking.ticketStatus?.toLowerCase() === "confirmed" && (
                  <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2"
                      // onClick={() => handleDownloadTicket(booking)}
                    >
                      <Download className="h-4 w-4" />
                      Descargar Pasaje
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2 text-red-600 border-red-300"
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <Ticket className="h-6 w-6 text-primary" />
            Mis Reservas
          </CardTitle>

          <CardDescription>
            {showActiveOnly
              ? "Tus reservas activas"
              : "Historial completo de tus reservas"}

            {limit && ` - Mostrando ${finalBookings.length} reservas`}
          </CardDescription>
        </CardHeader>

        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return <>{content}</>;
}
