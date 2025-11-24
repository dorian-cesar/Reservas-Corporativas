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
  const { user } = useAuth();
  const [serviceDetail, setServiceDetail] = useState<ServiceDetail | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && serviceId) {
      loadServiceDetail();
    } else {
      setServiceDetail(null);
      setSelectedSeat(null);
      setError(null);
    }
  }, [open, serviceId]);

  const loadServiceDetail = async () => {
    setLoadingDetail(true);
    setError(null);

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

  const parseAllSeats = (): Seat[] => {
    if (!serviceDetail?.bus_layout) return [];

    const totalSeats = serviceDetail.bus_layout.total_seats;
    const allSeats: Seat[] = [];

    // Crear todos los asientos inicialmente como no disponibles
    for (let i = 1; i <= totalSeats; i++) {
      allSeats.push({
        number: i.toString(),
        price: 0,
        available: false,
        row: Math.ceil(i / 4),
        position: (i - 1) % 4,
      });
    }

    // Marcar como disponibles los asientos que están en "available"
    if (serviceDetail.bus_layout.available) {
      const availableSeats = serviceDetail.bus_layout.available.split(",");

      availableSeats.forEach((seatInfo) => {
        const [seatNumber, priceStr] = seatInfo.split("|");
        if (seatNumber && priceStr) {
          const seatIndex = allSeats.findIndex(
            (s) => s.number === seatNumber.trim()
          );
          if (seatIndex !== -1) {
            allSeats[seatIndex] = {
              ...allSeats[seatIndex],
              price: parseFloat(priceStr),
              available: true,
            };
          }
        }
      });
    }

    return allSeats.sort((a, b) => parseInt(a.number) - parseInt(b.number));
  };

  const getOccupiedSeats = (): string[] => {
    if (!serviceDetail) return [];

    const allSeats = parseAllSeats();
    return allSeats
      .filter((seat) => !seat.available)
      .map((seat) => seat.number);
  };

  const handleBooking = async () => {
    if (!selectedSeat || !user || !serviceDetail) return;

    setLoading(true);

    try {
      // Aquí iría tu lógica de reserva real
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedSeat(null);
        onOpenChange(false);
      }, 2000);
    } catch (err) {
      setError("Error al procesar la reserva");
    } finally {
      setLoading(false);
    }
  };

  const allSeats = parseAllSeats();
  const occupiedSeats = getOccupiedSeats();
  const availableSeatsCount = allSeats.filter((seat) => seat.available).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Detalles del Servicio</DialogTitle>
          <DialogDescription>
            Revisa los detalles completos y selecciona tu asiento
          </DialogDescription>
        </DialogHeader>

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
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-600 mb-2">
              ¡Reserva Confirmada!
            </h3>
            <p className="text-muted-foreground">
              Tu asiento {selectedSeat} ha sido reservado exitosamente
            </p>
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
                      availableSeatsCount > 0 ? "default" : "destructive"
                    }
                  >
                    {availableSeatsCount} asientos disponibles
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    Servicio: {serviceDetail.number}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(serviceDetail.travel_date).toLocaleDateString(
                        "es-AR",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </span>
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
                    <strong>Tipo de bus:</strong> {serviceDetail.bus_type}
                  </div>
                )}

                <div className="pt-3 border-t flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Precio por asiento:
                  </span>
                  <div className="flex items-center gap-1 text-xl font-bold text-primary">
                    <DollarSign className="h-4 w-4" />
                    {serviceDetail.cost.split(":")[1]?.replace(".0", "") || "0"}
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
                      {availableSeatsCount} de{" "}
                      {serviceDetail.bus_layout.total_seats} disponibles
                    </span>
                  </div>
                </div>

                <SeatSelector
                  totalSeats={serviceDetail.bus_layout.total_seats}
                  occupiedSeats={occupiedSeats}
                  onSeatSelect={setSelectedSeat}
                  selectedSeat={selectedSeat}
                  seats={allSeats}
                />

                {selectedSeat && (
                  <div className="text-center p-3 bg-primary/10 rounded-lg">
                    <p className="text-primary font-medium">
                      Asiento seleccionado: <strong>{selectedSeat}</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Precio: $
                      {allSeats
                        .find((s) => s.number === selectedSeat)
                        ?.price.toLocaleString("es-AR")}
                    </p>
                  </div>
                )}
              </div>

              {/* Información del usuario */}
              <Alert className="bg-primary/10 border-primary/20">
                <AlertDescription className="text-sm">
                  <strong>Usuario:</strong> {user?.name}
                  <br />
                  <strong>Empresa:</strong> {user?.companyName || "N/A"}
                  <br />
                  <strong>Email:</strong> {user?.email}
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
                disabled={!selectedSeat || loading}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
