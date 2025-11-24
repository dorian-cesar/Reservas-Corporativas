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
  const [bookingData, setBookingData] = useState<any>(null);

  // Función para extraer solo el precio del string de cost
  const extractPrice = (costString: string): string => {
    if (!costString) return "0";

    const priceMatch = costString.match(/(\d+\.?\d*)/);

    if (priceMatch) {
      const price = parseFloat(priceMatch[1]);
      return price.toLocaleString("es-CL");
    }

    return "0";
  };

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

  const parseSeats = (): Seat[] => {
    if (!serviceDetail?.bus_layout?.available) return [];

    const seats: Seat[] = [];
    const availableSeats = serviceDetail.bus_layout.available.split(",");

    availableSeats.forEach((seatInfo) => {
      const [seatNumber, priceStr] = seatInfo.split("|");
      if (seatNumber && priceStr) {
        seats.push({
          number: seatNumber.trim(),
          price: parseFloat(priceStr),
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

  const handleBooking = async () => {
    if (!selectedSeat || !user || !serviceDetail) return;

    setLoading(true);
    setError(null);

    try {
      // Obtener boarding point dinámico del servicio
      const boardingPoint =
        serviceDetail.boarding_stages?.split("|")[0] || "224";

      // 1. Reservar el asiento con datos dinámicos
      const bookResponse = await fetch("/api/reserve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: serviceId.toString(),
          seatNumber: selectedSeat,
          price:
            availableSeats.find((s) => s.number === selectedSeat)?.price || 0,
          passengerName: user.name,
          passengerEmail: user.email,
          passengerPhone: "123456789",
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
        throw new Error(bookData.error || "Error al reservar el asiento");
      }

      // 2. Confirmar la reserva
      const confirmResponse = await fetch("/api/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pnrNumber: bookData.pnrNumber,
        }),
      });

      const confirmData = await confirmResponse.json();

      if (!confirmResponse.ok || !confirmData.success) {
        throw new Error(confirmData.error || "Error al confirmar la reserva");
      }

      // Combinar datos de booking y confirmación
      const completeBookingData = {
        ...bookData,
        ...confirmData,
      };

      setBookingData(completeBookingData);
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        setSelectedSeat(null);
        setBookingData(null);
        onOpenChange(false);
      }, 5000);
    } catch (err) {
      console.error("Error processing booking:", err);
      setError(
        err instanceof Error ? err.message : "Error al procesar la reserva"
      );
    } finally {
      setLoading(false);
    }
  };

  const availableSeats = parseSeats();
  const occupiedSeats = getOccupiedSeats();

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
            {bookingData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <p className="text-sm font-medium text-green-800">
                  PNR:{" "}
                  <span className="font-bold">{bookingData.operatorPnr}</span>
                </p>
                <p className="text-sm text-green-600">
                  Ticket: {bookingData.ticketNumber}
                </p>
                <p className="text-sm text-green-600">
                  Operador: {bookingData.travelName}
                </p>
                <p className="text-sm text-green-600">
                  Precio total: $
                  {bookingData.totalFare?.toLocaleString("es-CL")}
                </p>
              </div>
            )}
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
                  onSeatSelect={setSelectedSeat}
                  selectedSeat={selectedSeat}
                  seats={availableSeats}
                />

                {selectedSeat && (
                  <div className="text-center p-3 bg-primary/10 rounded-lg">
                    <p className="text-primary font-medium">
                      Asiento seleccionado: <strong>{selectedSeat}</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Precio: $
                      {availableSeats
                        .find((s) => s.number === selectedSeat)
                        ?.price.toLocaleString("es-CL")}
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
                    Confirmando su asiento...
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
