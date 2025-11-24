"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type Trip, type Route, BOOKINGS } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SeatSelector } from "./seat-selector";

interface BookingDialogProps {
  trip: Trip & { route: Route };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingDialog({
  trip,
  open,
  onOpenChange,
}: BookingDialogProps) {
  const { user } = useAuth();
  const [seatNumber, setSeatNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const occupiedSeats = BOOKINGS.filter(
    (b) => b.tripId === trip.id && b.status === "confirmed"
  ).map((b) => b.seatNumber);

  const handleBooking = async () => {
    if (!seatNumber || !user) return;

    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newBooking = {
      id: `b${BOOKINGS.length + 1}`,
      tripId: trip.id,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      companyId: user.companyId || "",
      companyName: user.companyName || "",
      seatNumber,
      origin: trip.route.origin,
      destination: trip.route.destination,
      date: trip.date,
      departureTime: trip.departureTime,
      price: trip.price,
      status: "confirmed" as const,
      bookedAt: new Date().toISOString(),
    };

    BOOKINGS.push(newBooking);

    setLoading(false);
    setSuccess(true);

    setTimeout(() => {
      setSuccess(false);
      setSeatNumber(null);
      onOpenChange(false);
      window.location.reload();
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Confirmar Reserva</DialogTitle>
          <DialogDescription>
            Revisa los detalles de tu viaje y selecciona tu asiento
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-600 mb-2">
              ¡Reserva Confirmada!
            </h3>
            <p className="text-muted-foreground">
              Tu asiento ha sido reservado exitosamente
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium">{trip.route.origin}</span>
                  <span className="text-muted-foreground">→</span>
                  <MapPin className="h-4 w-4 text-accent" />
                  <span className="font-medium">{trip.route.destination}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(trip.date).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{trip.departureTime}</span>
                  </div>
                </div>

                <div className="pt-3 border-t flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Precio:</span>
                  <div className="flex items-center gap-1 text-xl font-bold text-primary">
                    <DollarSign className="h-4 w-4" />
                    {trip.price.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Selecciona tu Asiento</h3>
                <SeatSelector
                  totalSeats={trip.totalSeats}
                  occupiedSeats={occupiedSeats}
                  onSeatSelect={setSeatNumber}
                  selectedSeat={seatNumber}
                />
                {seatNumber && (
                  <p className="text-sm text-center text-primary font-medium">
                    Asiento seleccionado: {seatNumber}
                  </p>
                )}
              </div>

              <Alert className="bg-primary/10 border-primary/20">
                <AlertDescription className="text-sm">
                  <strong>Usuario:</strong> {user?.name}
                  <br />
                  <strong>Empresa:</strong> {user?.companyName || "N/A"}
                </AlertDescription>
              </Alert>
            </div>

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
                disabled={!seatNumber || loading}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {loading ? "Procesando..." : "Confirmar Reserva"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
