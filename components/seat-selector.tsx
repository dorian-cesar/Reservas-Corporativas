"use client";

import { cn } from "@/lib/utils";
import type { Seat } from "@/types/service-detail";
import { ArrowUp } from "lucide-react";

interface SeatSelectorProps {
  totalSeats: number;
  occupiedSeats: string[];
  onSeatSelect: (seatNumber: string) => void;
  selectedSeat: string | null;
  seats?: Seat[];
}

export function SeatSelector({
  totalSeats,
  occupiedSeats,
  onSeatSelect,
  selectedSeat,
  seats = [],
}: SeatSelectorProps) {
  // Crear array completo de todos los asientos
  const allSeats: Seat[] = Array.from({ length: totalSeats }, (_, i) => {
    const seatNumber = (i + 1).toString();
    const existingSeat = seats.find((s) => s.number === seatNumber);

    if (existingSeat) {
      return {
        ...existingSeat,
        available: !occupiedSeats.includes(seatNumber),
      };
    }

    return {
      number: seatNumber,
      price: 0,
      available: !occupiedSeats.includes(seatNumber),
      row: Math.ceil((i + 1) / 4),
      position: i % 4,
    };
  });

  const rows = Math.ceil(totalSeats / 4);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-2">
        <div className="flex flex-col items-center gap-1">
          <div className="text-sm text-gray-500 font-medium">
            Frente del Bus
          </div>
          <div className="w-12 h-0.5 bg-gray-300 rounded-full"></div>
          <ArrowUp className="h-3 w-3 text-gray-400" />
        </div>
      </div>

      {/* Mapa de asientos */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: rows }, (_, rowIndex) => (
            <div key={rowIndex} className="contents">
              {allSeats
                .filter((seat) => seat.row === rowIndex + 1)
                .map((seat) => (
                  <button
                    key={seat.number}
                    onClick={() => seat.available && onSeatSelect(seat.number)}
                    disabled={!seat.available}
                    className={cn(
                      "h-12 w-12 rounded-lg border-2 flex items-center justify-center transition-all duration-200",
                      selectedSeat === seat.number
                        ? "bg-accent border-accent text-accent-foreground scale-105 shadow-md"
                        : seat.available
                        ? "bg-green-100 border-green-300 text-green-800 hover:bg-green-200 hover:border-green-400 hover:scale-105 cursor-pointer shadow-sm"
                        : "bg-red-100 border-red-300 text-red-800 cursor-not-allowed opacity-80"
                    )}
                    title={
                      seat.available
                        ? `Asiento ${
                            seat.number
                          } - $${seat.price.toLocaleString("es-CL")}`
                        : "Asiento ocupado - No disponible"
                    }
                  >
                    <span className="text-sm font-bold">{seat.number}</span>
                  </button>
                ))}
            </div>
          ))}
        </div>
      </div>

      {/* Indicador de la parte trasera */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-1 bg-gray-400 rounded-full"></div>
        <div className="text-sm text-gray-600 font-medium">Parte Trasera</div>
      </div>

      {/* Leyenda */}
      <div className="flex justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
          <span>Ocupado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-accent border-2 border-accent rounded"></div>
          <span>Seleccionado</span>
        </div>
      </div>

      {/* Información adicional */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Total de asientos: {totalSeats} | Disponibles:{" "}
          {allSeats.filter((s) => s.available).length} | Ocupados:{" "}
          {occupiedSeats.length}
        </p>
      </div>

      {/* Información del asiento seleccionado */}
      {selectedSeat && (
        <div className="text-center p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-lg font-bold text-primary">
            Asiento seleccionado:{" "}
            <span className="text-2xl">{selectedSeat}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Precio: $
            {allSeats
              .find((s) => s.number === selectedSeat)
              ?.price.toLocaleString("es-CL")}
          </p>
        </div>
      )}
    </div>
  );
}
