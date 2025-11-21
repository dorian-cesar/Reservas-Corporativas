"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Trip, Route } from "@/lib/mock-data"
import { Clock, MapPin, DollarSign, Users, CheckCircle2 } from "lucide-react"
import { BookingDialog } from "@/components/booking-dialog"

interface TripCardProps {
  trip: Trip & { route: Route }
}

export function TripCard({ trip }: TripCardProps) {
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const availabilityPercentage = (trip.availableSeats / trip.totalSeats) * 100

  return (
    <>
      <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-lg font-bold">
                <MapPin className="h-5 w-5 text-primary" />
                {trip.route.origin}
                <span className="text-muted-foreground">→</span>
                <MapPin className="h-5 w-5 text-accent" />
                {trip.route.destination}
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Duración: {trip.route.duration}
              </p>
            </div>
            <Badge
              variant={availabilityPercentage > 50 ? "default" : "secondary"}
              className="transition-all duration-200"
            >
              {trip.availableSeats} asientos
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Salida</p>
              <p className="font-bold text-lg">{trip.departureTime}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Llegada</p>
              <p className="font-bold text-lg">{trip.arrivalTime}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm">
                {trip.totalSeats - trip.availableSeats} de {trip.totalSeats} ocupados
              </span>
            </div>
            <div className="flex items-center gap-1 text-2xl font-bold text-primary">
              <DollarSign className="h-5 w-5" />
              {trip.price.toLocaleString()}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-500 rounded-full"
              style={{ width: `${100 - availabilityPercentage}%` }}
            />
          </div>
        </CardContent>

        <CardFooter>
          <Button
            onClick={() => setShowBookingDialog(true)}
            disabled={trip.availableSeats === 0}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            {trip.availableSeats === 0 ? (
              "Agotado"
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Reservar Asiento
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <BookingDialog trip={trip} open={showBookingDialog} onOpenChange={setShowBookingDialog} />
    </>
  )
}
