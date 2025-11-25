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
import { useTravel } from "@/components/context/travel-context";

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
  const { origin, destination } = useTravel();
  const [bookingError, setBookingError] = useState<string | null>(null);

  const extractPrice = (costString: string): string => {
    if (!costString) return "0";
    const priceMatch = costString.match(/(\d+\.?\d*)/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1]);
      return price.toLocaleString("es-CL");
    }
    return "0";
  };

  const getMainBusType = (busType: string | null | undefined): string => {
    if (!busType) return "";
    const parts = busType.split(",").map((p) => p.trim());
    const ignore = ["2+2", "2+1", "AC", "Video", "WiFi", "Baño"];
    const main = parts.find((p) => !ignore.includes(p));
    return main || parts[0];
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

  const markSeatAsUnavailable = (seatNumber: string) => {
    if (!serviceDetail) return;

    const available = serviceDetail.bus_layout.available
      .split(",")
      .filter((s) => !s.startsWith(seatNumber + "|"))
      .join(",");

    setServiceDetail({
      ...serviceDetail,
      bus_layout: {
        ...serviceDetail.bus_layout,
        available,
      },
    });
  };

  const handleBooking = async () => {
    if (!selectedSeat || !serviceDetail) return;

    setLoading(true);
    setBookingError(null);

    try {
      const boardingPoint = serviceDetail.boarding_stages?.split("|")[0];
      const seatPrice =
        availableSeats.find((s) => s.number === selectedSeat)?.price || 0;

      const bookResponse = await fetch("/api/reserve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: serviceId.toString(),
          seatNumber: selectedSeat,
          price: seatPrice,
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
        console.error("Error booking:", bookData);

        let errorMessage = bookData?.error || "No se pudo reservar el asiento.";
        let shouldMarkUnavailable = false;

        if (
          bookData.type === "INTERNAL_ERROR" &&
          bookData.details?.response?.message
        ) {
          const message = bookData.details.response.message;
          if (
            message.includes("Seat Number not Found") ||
            message.includes("Seat Fare mismatched") ||
            message.includes("434")
          ) {
            shouldMarkUnavailable = true;
            errorMessage =
              "El asiento ya no está disponible. Por favor selecciona otro.";
          }
        }

        if (
          !shouldMarkUnavailable &&
          errorMessage.toLowerCase().includes("seat")
        ) {
          shouldMarkUnavailable = true;
          errorMessage =
            "El asiento ya no está disponible. Por favor selecciona otro.";
        }

        if (shouldMarkUnavailable) {
          markSeatAsUnavailable(selectedSeat);
          setSelectedSeat(null);
          setBookingError(errorMessage);
          setLoading(false);
          return;
        }

        setBookingError(errorMessage);
        setLoading(false);
        return;
      }

      const confirmResponse = await fetch("/api/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pnrNumber: bookData.pnrNumber }),
      });

      const confirmData = await confirmResponse.json();

      if (!confirmResponse.ok || !confirmData.success) {
        setError(confirmData.error || "Error al confirmar la reserva");
        setLoading(false);
        return;
      }

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
      console.error("Error inesperado:", err);
      setBookingError("Error inesperado al procesar la reserva");
    } finally {
      setLoading(false);
    }
  };

  const availableSeats = parseSeats();
  const occupiedSeats = getOccupiedSeats();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        {/* Mostrar header solo cuando NO está en estado success */}
        {!success && (
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Detalles del Servicio
            </DialogTitle>
            <DialogDescription>
              Revisa los detalles completos y selecciona tu asiento
            </DialogDescription>
          </DialogHeader>
        )}

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
            <div className="flex flex-col items-center justify-center space-y-6">
              {/* Icono de éxito animado */}
              <div className="relative">
                <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
                <CheckCircle2 className="h-20 w-20 text-green-500 relative z-10" />
              </div>

              {/* Título y mensaje */}
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-green-600">
                  Reserva Confirmada
                </h3>
                <p className="text-muted-foreground text-lg">
                  ¡Tu asiento ha sido reservado!
                </p>
              </div>

              {bookingData && (
                <div className="w-full max-w-md bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-lg">
                  {/* Header de la tarjeta */}
                  <div className="text-center mb-4">
                    <Badge
                      variant="outline"
                      className="bg-green-500 text-white border-green-600 mb-2"
                    >
                      Confirmado
                    </Badge>
                    <p className="text-sm text-green-600">
                      Reserva realizada exitosamente
                    </p>
                  </div>

                  {/* Información principal */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-white rounded-lg border border-green-100">
                      <p className="text-xs text-muted-foreground">N° de PNR</p>
                      <p className="font-bold text-green-800 text-sm">
                        {bookingData.operatorPnr}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-green-100">
                      <p className="text-xs text-muted-foreground">Asiento</p>
                      <p className="font-bold text-green-800 text-lg">
                        {selectedSeat}
                      </p>
                    </div>
                  </div>

                  {/* Detalles del viaje */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Operador:</span>
                      <span className="font-medium text-green-800">
                        {bookingData.travelName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Origen - Destino:
                      </span>
                      <span className="font-medium text-green-800">
                        {origin} - {destination}
                      </span>
                    </div>
                    {serviceDetail && (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Fecha:</span>
                          <span className="font-medium text-green-800">
                            {new Date(
                              serviceDetail.travel_date
                            ).toLocaleDateString("es-CL")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Hora salida:
                          </span>
                          <span className="font-medium text-green-800">
                            {serviceDetail.dep_time}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Precio total destacado */}
                  <div className="border-t border-green-200 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Precio total:
                      </span>
                      <span className="text-xl font-bold text-green-700">
                        $
                        {bookingData.totalFare?.toLocaleString("es-CL") ||
                          availableSeats
                            .find((s) => s.number === selectedSeat)
                            ?.price.toLocaleString("es-CL")}
                      </span>
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-200">
                    <p className="text-xs text-green-700 text-center">
                      Recibirás un email de confirmación con los detalles de tu
                      reserva
                    </p>
                  </div>
                </div>
              )}
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-600">
                  Esta ventana se cerrará automáticamente en{" "}
                  <span className="font-bold">5 segundos</span>
                </p>
              </div>
            </div>
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
                    {origin} - {destination}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(serviceDetail.travel_date).toLocaleDateString(
                        "es-CL",
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
                    <strong>Tipo de bus:</strong>{" "}
                    {getMainBusType(serviceDetail.bus_type)}
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
                  coachDetails={serviceDetail.bus_layout.coach_details}
                  floor={serviceDetail.bus_layout.floor}
                />
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

            {bookingError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription className="flex justify-center items-center">
                  {bookingError}
                </AlertDescription>
              </Alert>
            )}

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
