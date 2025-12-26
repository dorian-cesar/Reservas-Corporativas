"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MapPin, Calendar, Clock } from "lucide-react";

interface SuccessReservationModalProps {
  tripType: "departure" | "return";
  bookingData: any[];
  serviceDetail: any;
  displayOrigin: string;
  displayDestination: string;
  terminalOrigen: string | null;
  terminalDestino: string | null;
  selectedSeats: string[];
  passengersData: any[];
  savedPassengers: any[];
  onClose: () => void;
}

const formatTravelDate = (date: string) => {
  try {
    const [year, month, day] = date.split("-").map(Number);
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
    const monthName = months[month - 1];
    return `${day} de ${monthName} de ${year}`;
  } catch (error) {
    console.error("Error formateando fecha de viaje:", error);
    return date;
  }
};

export function SuccessReservationModal({
  tripType,
  bookingData,
  serviceDetail,
  displayOrigin,
  displayDestination,
  terminalOrigen,
  terminalDestino,
  selectedSeats,
  passengersData,
  savedPassengers,
  onClose,
}: SuccessReservationModalProps) {
  // Obtener las reservas de ida del localStorage
  const [departureBookings, setDepartureBookings] = useState<any[]>([]);

  useEffect(() => {
    if (tripType === "return") {
      const storedBookings = JSON.parse(
        localStorage.getItem("completedBookings") || "[]"
      );
      const departureBookings = storedBookings.filter(
        (booking: any) => booking.tripType === "departure"
      );
      setDepartureBookings(departureBookings);
    }
  }, [tripType]);

  function formatRut(rut: string): string {
    if (!rut) return "";
    const cleanRut = rut.replace(/[^0-9kK]/g, "");
    if (cleanRut.length < 2) return rut;
    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1).toUpperCase();
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${formattedBody}-${dv}`;
  }

  const renderDepartureSection = () => {
    if (tripType !== "return" || departureBookings.length === 0) return null;

    return departureBookings.map((departure, idx) => (
      <div key={`departure-${idx}`} className="mb-6 last:mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-300 text-xs"
          >
            Viaje de Ida
          </Badge>
          <div className="flex-1 h-px bg-linear-to-r from-green-200 to-transparent"></div>
        </div>

        <div className="bg-white/90 rounded-lg p-4 mb-3 border border-green-100 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-left">
              <div className="flex items-center gap-2 text-gray-700 mb-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="font-medium text-sm truncate">
                  {departure.origin} → {departure.destination}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-gray-500" />
                <span className="font-medium text-sm">
                  {departure.date ? formatTravelDate(departure.date) : "N/A"}
                </span>
              </div>
            </div>
            <Badge
              variant="outline"
              className="bg-green-100 text-green-800 text-xs"
            >
              {departure.seats?.length || 0} asiento(s)
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm mt-3 text-left">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-gray-500" />
                <span className="text-gray-600 text-xs">Salida:</span>
              </div>
              <p className="font-medium text-gray-900 text-left">
                {departure.dep_time || "N/A"}
              </p>
              {departure.terminalOrigen && (
                <p className="text-xs text-gray-500 truncate text-left">
                  {departure.terminalOrigen}
                </p>
              )}
            </div>

            <div className="space-y-1 text-left">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-gray-500" />
                <span className="text-gray-600 text-xs">Llegada:</span>
              </div>
              <p className="font-medium text-gray-900 text-left">
                {departure.arr_time || "N/A"}
              </p>
              {departure.terminalDestino && (
                <p className="text-xs text-gray-500 truncate text-left">
                  {departure.terminalDestino}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    ));
  };

  const renderReturnSection = () => (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Badge
          variant="outline"
          className="bg-blue-100 text-blue-800 border-blue-300 text-xs"
        >
          Viaje de Vuelta
        </Badge>
        <div className="flex-1 h-px bg-linear-to-r from-blue-200 to-transparent"></div>
      </div>

      <div className="bg-white/90 rounded-lg p-4 mb-3 border border-blue-100 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-left">
            <div className="flex items-center gap-2 text-gray-700 mb-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="font-medium text-sm truncate">
                {displayOrigin} → {displayDestination}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-gray-500" />
              <span className="font-medium text-sm">
                {serviceDetail?.travel_date
                  ? formatTravelDate(serviceDetail.travel_date)
                  : "N/A"}
              </span>
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 text-xs"
          >
            {selectedSeats.length} asiento(s)
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mt-3 text-left">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-gray-500" />
              <span className="text-gray-600 text-xs">Salida:</span>
            </div>
            <p className="font-medium text-gray-900 text-left">
              {serviceDetail?.dep_time || "N/A"}
            </p>
            {terminalOrigen && (
              <p className="text-xs text-gray-500 truncate text-left">
                {terminalOrigen}
              </p>
            )}
          </div>

          <div className="space-y-1 text-left">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-gray-500" />
              <span className="text-gray-600 text-xs">Llegada:</span>
            </div>
            <p className="font-medium text-gray-900 text-left">
              {serviceDetail?.arr_time || "N/A"}
            </p>
            {terminalDestino && (
              <p className="text-xs text-gray-500 truncate text-left">
                {terminalDestino}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPassengersSection = () => (
    <div className="mb-4">
      <h4 className="font-bold text-blue-800 text-sm mb-3 pb-2 border-b border-blue-200">
        Pasajeros ({bookingData.length})
      </h4>
      <div className="space-y-2">
        {bookingData.map((booking: any, index: number) => {
          // Buscar el pasajero correspondiente en las reservas de ida
          const departurePassenger = departureBookings[0]?.passengers?.[index];

          return (
            <div
              key={index}
              className="bg-white/90 rounded p-3 border border-blue-100 text-left backdrop-blur-sm"
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-blue-800 truncate text-sm">
                    {booking.passenger?.nombre || "Pasajero"}
                  </h5>
                  <div className="space-y-1 mt-1">
                    <p className="text-xs text-gray-600 truncate">
                      RUT:{" "}
                      {booking.passenger?.rut
                        ? formatRut(booking.passenger.rut)
                        : "N/A"}
                    </p>
                    {/* Mostrar información del viaje de ida si existe */}
                    {departurePassenger && tripType === "return" && (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-green-600 font-medium">Ida:</span>
                        <span className="text-gray-500 truncate">
                          {departureBookings[0]?.origin} →{" "}
                          {departureBookings[0]?.destination}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 ml-2 shrink-0 items-end">
                  <div className="flex flex-col items-end gap-1">
                    {tripType === "return" && departurePassenger && (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-800 border-green-300 text-xs"
                      >
                        Ida: Asiento {departurePassenger?.seatNumber || "N/A"}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={
                        tripType === "return"
                          ? "bg-blue-50 text-blue-800 border-blue-300 text-xs"
                          : "bg-orange-50 text-orange-800 border-orange-300 text-xs"
                      }
                    >
                      {tripType === "return" ? "Vuelta" : "Ida"}: Asiento{" "}
                      {booking.seat}
                    </Badge>
                  </div>
                  <span className="font-medium text-blue-700 text-xs mt-1">
                    Total: $
                    {booking.monto_boleto?.toLocaleString("es-CL") || "0"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderTotalsSection = () => {
    const departureTotal = departureBookings[0]?.totalPrice || 0;
    const returnTotal = bookingData.reduce(
      (total: number, booking: any) => total + (booking.monto_boleto || 0),
      0
    );
    const grandTotal = departureTotal + returnTotal;

    if (tripType !== "return") {
      return (
        <div className="flex items-center justify-between pt-3 mt-3 border-t">
          <span className="text-gray-600 text-sm">Total reserva:</span>
          <span className="text-lg font-bold text-blue-700">
            ${returnTotal.toLocaleString("es-CL")}
          </span>
        </div>
      );
    }

    return (
      <div className="bg-linear-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-left">
            <p className="text-gray-600 mb-1">Viaje de Ida:</p>
            <p className="font-bold text-green-700">
              ${departureTotal.toLocaleString("es-CL")}
            </p>
          </div>
          <div className="text-left">
            <p className="text-gray-600 mb-1">Viaje de Vuelta:</p>
            <p className="font-bold text-blue-700">
              ${returnTotal.toLocaleString("es-CL")}
            </p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Total general:</span>
            <span className="text-lg font-bold text-purple-700">
              ${grandTotal.toLocaleString("es-CL")}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderSingleTripSummary = () => (
    <div className="w-full bg-linear-to-br from-blue-50/80 to-blue-100/80 border border-blue-200 rounded-xl p-4 shadow-sm backdrop-blur-sm">
      <div className="text-center mb-4">
        <Badge
          variant="outline"
          className="bg-blue-500 text-white border-blue-600 mb-2"
        >
          Resumen de Reserva
        </Badge>
      </div>

      <div className="bg-white/90 rounded-lg p-4 mb-4 border border-green-100 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-left">
            <div className="flex items-center gap-2 text-gray-700 mb-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="font-medium text-sm truncate">
                {displayOrigin} → {displayDestination}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-gray-500" />
              <span className="font-medium text-sm">
                {serviceDetail?.travel_date
                  ? formatTravelDate(serviceDetail.travel_date)
                  : "N/A"}
              </span>
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 text-xs"
          >
            {selectedSeats.length} asiento(s)
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mt-3 text-left">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-gray-500" />
              <span className="text-gray-600 text-xs">Salida:</span>
            </div>
            <p className="font-medium text-gray-900 text-left">
              {serviceDetail?.dep_time || "N/A"}
            </p>
            {terminalOrigen && (
              <p className="text-xs text-gray-500 truncate text-left">
                {terminalOrigen}
              </p>
            )}
          </div>

          <div className="space-y-1 text-left">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-gray-500" />
              <span className="text-gray-600 text-xs">Llegada:</span>
            </div>
            <p className="font-medium text-gray-900 text-left">
              {serviceDetail?.arr_time || "N/A"}
            </p>
            {terminalDestino && (
              <p className="text-xs text-gray-500 truncate text-left">
                {terminalDestino}
              </p>
            )}
          </div>
        </div>

        {renderTotalsSection()}
      </div>

      {renderPassengersSection()}
    </div>
  );

  const renderRoundTripSummary = () => (
    <div className="w-full bg-linear-to-br from-blue-50/80 to-indigo-50/80 border border-blue-200 rounded-xl p-4 shadow-sm backdrop-blur-sm">
      <div className="text-center mb-4">
        <Badge
          variant="outline"
          className="bg-blue-500 text-white border-blue-600 mb-2"
        >
          Resumen Completo de Viaje
        </Badge>
      </div>

      {renderDepartureSection()}
      {renderReturnSection()}
      {renderPassengersSection()}
      {renderTotalsSection()}
    </div>
  );

  return (
    <div className="pt-6 text-center animate-in fade-in zoom-in duration-300">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
          <CheckCircle2 className="h-16 w-16 text-green-500 relative z-10" />
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold text-green-600">
            ¡Reserva Confirmada!
          </h3>
          <p className="text-sm text-muted-foreground">
            El viaje ha sido reservado exitosamente.
          </p>
        </div>

        <div className="w-full space-y-4">
          {tripType === "return" && departureBookings.length > 0
            ? renderRoundTripSummary()
            : renderSingleTripSummary()}
        </div>

        <div className="pt-3">
          <div className="flex justify-center">
            <Button
              onClick={onClose}
              className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white inline-flex items-center shadow-md"
              size="sm"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {tripType === "return" ? "Finalizar Reservas" : "Finalizar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
