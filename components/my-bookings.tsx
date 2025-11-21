"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BOOKINGS } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth"
import { Ticket, MapPin, Calendar, Clock, CheckCircle2 } from "lucide-react"

export function MyBookings() {
  const { user } = useAuth()

  const userBookings = BOOKINGS.filter((b) => b.userId === user?.id)

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
                <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {booking.status === "confirmed" ? "Confirmada" : "Cancelada"}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
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
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
