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
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-muted-foreground">Cargando reservas...</p>
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
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">
            {showActiveOnly
              ? "No tienes reservas activas"
              : "No tienes reservas"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {userBookings.map((booking, index) => (
            <div
              key={booking.id}
              className="p-6 border-2 rounded-lg hover:border-primary transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-left-4 bg-card"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span className="font-bold text-lg">{booking.origin}</span>
                  </div>
                  <span className="text-muted-foreground">→</span>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-accent" />
                    <span className="font-bold text-lg">
                      {booking.destination}
                    </span>
                  </div>
                </div>
                <Badge
                  className={
                    booking.status === "confirmed"
                      ? "bg-green-500/10 text-green-700 border-green-500/20 text-sm py-1 px-3"
                      : "bg-red-500/10 text-red-700 border-red-500/20 text-sm py-1 px-3"
                  }
                >
                  {booking.status === "confirmed" ? (
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {booking.status === "confirmed" ? "Confirmada" : "Anulada"}
                </Badge>
              </div>

              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <Building className="h-4 w-4" />
                <span>{booking.companyName}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">
                      {formatDate(booking.date)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Fecha de viaje
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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

                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-primary">
                      Asiento {booking.seatNumber}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Número de asiento
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="font-bold text-lg text-accent">
                    {formatPrice(booking.price)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Precio final
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground mb-4">
                Reservado el{" "}
                {new Date(booking.bookedAt).toLocaleDateString("es-CL")} a las{" "}
                {new Date(booking.bookedAt).toLocaleTimeString("es-CL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                hrs
              </div>

              {booking.status === "confirmed" && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-2 bg-transparent hover:bg-primary hover:text-primary-foreground"
                    onClick={() => handleDownloadTicket(booking.id)}
                  >
                    <Download className="h-4 w-4" />
                    Descargar Pasaje
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent border-red-200"
                    onClick={() => handleCancelBooking(booking.id)}
                  >
                    <XCircle className="h-4 w-4" />
                    Anular Reserva
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
      <Card className="border-2 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Ticket className="h-6 w-6 text-primary" />
            Mis Reservas
          </CardTitle>
          <CardDescription className="text-base">
            {showActiveOnly
              ? "Tus reservas activas"
              : "Historial completo de tus reservas"}
            {limit &&
              ` - Mostrando ${userBookings.length} de ${
                BOOKINGS.filter((b) => b.userEmail === user.email).length
              } reservas`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">{content}</CardContent>
      </Card>
    );
  }

  return content;
}
