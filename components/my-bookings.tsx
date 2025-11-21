"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BOOKINGS } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth"
import { Ticket, MapPin, Calendar, Clock, CheckCircle2, Download, XCircle } from "lucide-react"
import { generateTicketPDF } from "@/lib/ticket-generator"

export function MyBookings() {
  const { user } = useAuth()

  const userBookings = BOOKINGS.filter((b) => b.userId === user?.id)

  const handleDownloadTicket = (bookingId: string) => {
    const booking = BOOKINGS.find((b) => b.id === bookingId)
    if (booking) {
      generateTicketPDF(booking)
    }
  }

  const handleCancelBooking = (bookingId: string) => {
    const booking = BOOKINGS.find((b) => b.id === bookingId)
    if (booking && confirm("¿Estás seguro de que deseas cancelar esta reserva?")) {
      booking.status = "cancelled"
      window.location.reload()
    }
  }

  if (userBookings.length === 0) {
    return null
  }

  return (
    <Card className="border-2 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          Mis Reservas
        </CardTitle>
        <CardDescription>Historial de tus reservas confirmadas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {userBookings.map((booking, index) => (
            <div
              key={booking.id}
              className="p-4 border-2 rounded-lg hover:border-primary transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-left-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-bold">{booking.origin}</span>
                  <span className="text-muted-foreground">→</span>
                  <MapPin className="h-4 w-4 text-accent" />
                  <span className="font-bold">{booking.destination}</span>
                </div>
                <Badge
                  className={
                    booking.status === "confirmed"
                      ? "bg-green-500/10 text-green-700 border-green-500/20"
                      : "bg-red-500/10 text-red-700 border-red-500/20"
                  }
                >
                  {booking.status === "confirmed" ? (
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {booking.status === "confirmed" ? "Confirmada" : "Cancelada"}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(booking.date).toLocaleDateString("es-AR")}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {booking.departureTime}
                </div>
                <div className="text-right font-bold text-primary">Asiento: {booking.seatNumber}</div>
              </div>

              {booking.status === "confirmed" && (
                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-2 bg-transparent"
                    onClick={() => handleDownloadTicket(booking.id)}
                  >
                    <Download className="h-4 w-4" />
                    Descargar Pasaje
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                    onClick={() => handleCancelBooking(booking.id)}
                  >
                    <XCircle className="h-4 w-4" />
                    Liberar Reserva
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
