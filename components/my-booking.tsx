"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BOOKINGS } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
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
} from "lucide-react";
import { generateTicketPDF } from "@/lib/ticket-generator";

interface MyBookingsProps {
  showActiveOnly?: boolean;
  limit?: number;
  showCard?: boolean;
}

export function MyBookings({
  showActiveOnly = false,
  limit,
  showCard = true,
}: MyBookingsProps) {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-sm sm:text-base text-muted-foreground">
          Cargando reservas...
        </p>
      </div>
    );
  }

  let userBookings = BOOKINGS.filter((b) => b.userEmail === user.email);

  if (showActiveOnly) {
    userBookings = userBookings.filter((b) => b.status === "confirmed");
  }

  userBookings.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (limit && userBookings.length > limit) {
    userBookings = userBookings.slice(0, limit);
  }

  const handleDownloadTicket = (bookingId: string) => {
    const booking = BOOKINGS.find((b) => b.id === bookingId);
    if (booking) {
      generateTicketPDF(booking);
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    const booking = BOOKINGS.find((b) => b.id === bookingId);
    if (
      booking &&
      confirm("¿Estás seguro de que deseas anular esta reserva?")
    ) {
      console.log("Anulando reserva:", bookingId);
      alert("Funcionalidad de anulación en desarrollo");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const content = (
    <>
      {userBookings.length === 0 ? (
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
          {userBookings.map((booking, index) => (
            <div
              key={booking.id}
              className="p-4 sm:p-6 border-2 rounded-lg hover:border-primary transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-left-4 bg-card mx-2 sm:mx-0"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Header - Ruta y Estado */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                    <span className="font-bold text-base sm:text-lg wrap-break-word">
                      {booking.origin}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block shrink-0" />
                  <div className="flex items-center gap-2 sm:ml-0 ml-6">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0" />
                    <span className="font-bold text-base sm:text-lg wrap-break-word">
                      {booking.destination}
                    </span>
                  </div>
                </div>
                <Badge
                  className={
                    booking.status === "confirmed"
                      ? "bg-green-500/10 text-green-700 border-green-500/20 text-xs sm:text-sm py-1 px-2 sm:px-3 self-start sm:self-auto"
                      : "bg-red-500/10 text-red-700 border-red-500/20 text-xs sm:text-sm py-1 px-2 sm:px-3 self-start sm:self-auto"
                  }
                >
                  {booking.status === "confirmed" ? (
                    <CheckCircle2 className="h-3 w-3 mr-1 shrink-0" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1 shrink-0" />
                  )}
                  {booking.status === "confirmed" ? "Confirmada" : "Anulada"}
                </Badge>
              </div>

              {/* Empresa */}
              <div className="flex items-center gap-2 mb-4 text-xs sm:text-sm text-muted-foreground">
                <Building className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="wrap-break-word">{booking.companyName}</span>
              </div>

              {/* Información del viaje */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 text-sm">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-medium text-xs sm:text-sm warp-break-word">
                      {formatDate(booking.date)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Fecha de viaje
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-medium text-xs sm:text-sm">
                      {booking.departureTime} hrs
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Hora de salida
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Ticket className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-medium text-primary text-xs sm:text-sm">
                      Asiento {booking.seatNumber}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Número de asiento
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="font-bold text-base sm:text-lg text-accent whitespace-nowrap">
                    {formatPrice(booking.price)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Precio final
                  </div>
                </div>
              </div>

              {/* Fecha de reserva */}
              <div className="text-xs text-muted-foreground mb-4">
                Reservado el{" "}
                {new Date(booking.bookedAt).toLocaleDateString("es-CL")} a las{" "}
                {new Date(booking.bookedAt).toLocaleTimeString("es-CL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                hrs
              </div>

              {/* Botones de acción */}
              {booking.status === "confirmed" && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-2 bg-transparent hover:bg-primary hover:text-primary-foreground text-xs sm:text-sm h-9 sm:h-10"
                    onClick={() => handleDownloadTicket(booking.id)}
                  >
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                    <span className="truncate">Descargar Pasaje</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent border-red-200 text-xs sm:text-sm h-9 sm:h-10"
                    onClick={() => handleCancelBooking(booking.id)}
                  >
                    <XCircle className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                    <span className="truncate">Anular Reserva</span>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );

  if (showCard) {
    return (
      <Card className="border-2 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 mx-2 sm:mx-0">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <Ticket className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
            Mis Reservas
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {showActiveOnly
              ? "Tus reservas activas"
              : "Historial completo de tus reservas"}
            {limit &&
              ` - Mostrando ${userBookings.length} de ${
                BOOKINGS.filter((b) => b.userEmail === user.email).length
              } reservas`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
          {content}
        </CardContent>
      </Card>
    );
  }

  return <div className="mx-2 sm:mx-0">{content}</div>;
}
