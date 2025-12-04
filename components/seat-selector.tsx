"use client";

import { cn } from "@/lib/utils";
import type { Seat } from "@/types/service-detail";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface SeatSelectorProps {
  totalSeats: number;
  occupiedSeats: string[];
  onSeatSelect: (seatNumber: string) => void;
  selectedSeat: string | null;
  seats?: Seat[];
  coachDetails?: string;
  floor?: string;
  disabled: boolean;
}

interface BusLayout {
  rows: (string | null)[][];
  isTwoFloor: boolean;
  floors: {
    first: (string | null)[][];
    second: (string | null)[][];
  } | null;
}

interface ProcessedSeat {
  num: string;
  type: string | null;
  status: string;
  floor: number;
}

export function SeatSelector({
  totalSeats,
  occupiedSeats,
  onSeatSelect,
  selectedSeat,
  seats = [],
  coachDetails = "",
  floor = "",
}: SeatSelectorProps) {
  const [currentFloor, setCurrentFloor] = useState<"first" | "second">("first");
  const [processedLayout, setProcessedLayout] = useState<BusLayout>({
    rows: [],
    isTwoFloor: false,
    floors: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    processBusLayout();
  }, [coachDetails, floor, totalSeats]);

  const processBusLayout = () => {
    if (!coachDetails) {
      setProcessedLayout({
        rows: createBasicLayout(totalSeats),
        isTwoFloor: false,
        floors: null,
      });
      setLoading(false);
      return;
    }

    try {
      let rows = coachDetails.split(",").filter((row) => row !== "DR_IMG|.GY");

      let seats_rows: ProcessedSeat[][] = [];
      const seat_null: ProcessedSeat = {
        num: "blank-seat",
        type: null,
        status: "busy",
        floor: 0,
      };

      for (let row of rows) {
        let row_seats = row.split("-");
        let seats: ProcessedSeat[] = [];

        for (let row_seat of row_seats) {
          let seat_info = row_seat.split("|");
          let seat = seat_null;

          if (seat_info[0] !== "" && !isNaN(Number(seat_info[0]))) {
            seat = {
              num: seat_info[0],
              type: seat_info[1] || null,
              status: "busy",
              floor: 0,
            };
          } else if (seat_info[0] === ".GY" || seat_info[0].includes("_IMG")) {
            seat = {
              num: "%",
              type: seat_info[0],
              status: "%",
              floor: 0,
            };
          }
          seats.push(seat);
        }
        seats_rows.push(seats);
      }

      let seats_floor_1: ProcessedSeat[][] = [];
      let seats_floor_2: ProcessedSeat[][] = [];
      let floors: ProcessedSeat[][][] = [];

      if (floor && floor.trim() !== "" && floor.includes("@")) {
        const floor_available = floor.split("@");
        const floor_1 = floor_available[0]
          .split(",")
          .filter((num) => num && num !== "DR_IMG" && !isNaN(Number(num)));
        const floor_2 = floor_available[1]
          .split(",")
          .filter((num) => num && !isNaN(Number(num)));

        for (let sr of seats_rows) {
          let row_floor_1: ProcessedSeat[] = [];
          let row_floor_2: ProcessedSeat[] = [];

          for (let s of sr) {
            if (s.num === "%" || s.num === "blank-seat") {
              row_floor_1.push({ ...s, floor: 0 });
              row_floor_2.push({ ...s, floor: 1 });
            } else if (floor_1.includes(s.num)) {
              row_floor_1.push({ ...s, floor: 0 });
            } else if (floor_2.includes(s.num)) {
              row_floor_2.push({ ...s, floor: 1 });
            }
          }

          if (row_floor_1.length > 0) seats_floor_1.push(row_floor_1);
          if (row_floor_2.length > 0) seats_floor_2.push(row_floor_2);
        }

        floors = [seats_floor_1, seats_floor_2];
      } else {
        floors = [
          seats_rows.map((row) => row.map((seat) => ({ ...seat, floor: 0 }))),
        ];
      }

      const availableSeatNumbers = seats.map((s) => s.number);

      const updateSeatAvailability = (floorSeats: ProcessedSeat[][]) => {
        for (let row of floorSeats) {
          for (let seat of row) {
            if (!seat.num || seat.num === "blank-seat" || seat.num === "%")
              continue;

            const isAvailable = availableSeatNumbers.includes(seat.num);
            if (isAvailable) {
              seat.status = "available";
            } else {
              seat.status = "busy";
            }
          }
        }
      };

      if (floors.length > 0) updateSeatAvailability(floors[0]);
      if (floors.length > 1) updateSeatAvailability(floors[1]);

      const createVerticalLayout = (
        floorSeats: ProcessedSeat[][]
      ): (string | null)[][] => {
        const verticalRows: (string | null)[][] = [];

        for (let row of floorSeats) {
          const verticalRow: (string | null)[] = [];

          for (let i = 0; i < row.length; i++) {
            const seat = row[i];

            if (seat.num === "%") {
              verticalRow.push(null);
            } else if (seat.num !== "blank-seat") {
              verticalRow.push(seat.num);
            } else {
              verticalRow.push(null);
            }
          }

          while (verticalRow.length < 4) {
            verticalRow.push(null);
          }

          if (verticalRow.length === 4) {
            const pasilloIndex = verticalRow.findIndex((seat) => seat === null);
            let reorderedRow = [...verticalRow];

            if (pasilloIndex !== -1 && pasilloIndex !== 2) {
              const temp = reorderedRow[2];
              reorderedRow[2] = reorderedRow[pasilloIndex];
              reorderedRow[pasilloIndex] = temp;
            }

            verticalRows.push(reorderedRow);
          } else {
            verticalRows.push(verticalRow);
          }
        }

        return verticalRows.filter((row) => row.some((seat) => seat !== null));
      };

      const isTwoFloor = floor && floor.trim() !== "" && floor.includes("@");

      if (isTwoFloor && floors.length >= 2) {
        const firstFloorGrid = createVerticalLayout(floors[0]);
        const secondFloorGrid = createVerticalLayout(floors[1]);

        setProcessedLayout({
          rows: firstFloorGrid,
          isTwoFloor: true,
          floors: {
            first: firstFloorGrid,
            second: secondFloorGrid,
          },
        });
      } else {
        const singleFloorGrid = createVerticalLayout(floors[0]);
        setProcessedLayout({
          rows: singleFloorGrid,
          isTwoFloor: false,
          floors: null,
        });
      }

      setLoading(false);
    } catch (error) {
      console.error("Error processing bus layout:", error);
      setProcessedLayout({
        rows: createBasicLayout(totalSeats),
        isTwoFloor: false,
        floors: null,
      });
      setLoading(false);
    }
  };

  const createBasicLayout = (total: number): (string | null)[][] => {
    const rows: (string | null)[][] = [];
    const seatsPerRow = 4;
    const totalRows = Math.ceil(total / (seatsPerRow - 1));

    for (let i = 0; i < totalRows; i++) {
      const row: (string | null)[] = [];
      const startSeat = i * (seatsPerRow - 1) + 1;
      if (startSeat <= total) row.push(startSeat.toString());
      else row.push(null);
      if (startSeat + 1 <= total) row.push((startSeat + 1).toString());
      else row.push(null);
      row.push(null);
      if (startSeat + 2 <= total) row.push((startSeat + 2).toString());
      else row.push(null);
      rows.push(row);
    }

    return rows;
  };

  const currentRows =
    processedLayout.isTwoFloor && processedLayout.floors
      ? processedLayout.floors[currentFloor]
      : processedLayout.rows;

  const getSeatPrice = (seatNumber: string): number => {
    return seats.find((s) => s.number === seatNumber)?.price || 0;
  };

  const isSeatAvailable = (seatNumber: string): boolean => {
    return !occupiedSeats.includes(seatNumber);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 sm:py-12">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-sm sm:text-base">
          Cargando distribución del bus...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 sm:mx-4 md:mx-6">
      {processedLayout.isTwoFloor && processedLayout.floors && (
        <div className="flex justify-center gap-2 sm:gap-4">
          <Button
            variant={currentFloor === "first" ? "default" : "outline"}
            onClick={() => setCurrentFloor("first")}
            size="sm"
            className="text-xs sm:text-sm"
          >
            Primer Piso
          </Button>
          <Button
            variant={currentFloor === "second" ? "default" : "outline"}
            onClick={() => setCurrentFloor("second")}
            size="sm"
            className="text-xs sm:text-sm"
          >
            Segundo Piso
          </Button>
        </div>
      )}
      {/* Indicador del frente */}
      <div className="flex flex-col items-center gap-1 sm:gap-2">
        <div className="flex flex-col items-center gap-1">
          <div className="text-xs sm:text-sm text-gray-500 font-medium">
            Frente del Bus
          </div>
          <div className="w-8 sm:w-12 h-0.5 bg-gray-300 rounded-full"></div>
          <ArrowUp className="h-3 w-3 text-gray-400" />
        </div>
      </div>
      {/* Mapa de asientos */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-6 sm:mx-2 md:mx-4">
        <div className="space-y-2 sm:space-y-3">
          {currentRows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-1 sm:gap-2">
              {row.map((seat, seatIndex) => (
                <div key={seatIndex} className="flex items-center">
                  {seat ? (
                    <button
                      onClick={() =>
                        isSeatAvailable(seat) && onSeatSelect(seat)
                      }
                      disabled={!isSeatAvailable(seat)}
                      className={cn(
                        "h-10 w-10 sm:h-12 sm:w-12 rounded-lg border-2 flex items-center justify-center transition-all duration-200 font-bold text-xs sm:text-sm",
                        selectedSeat === seat
                          ? "bg-accent border-orange-600 text-accent-foreground scale-105 shadow-md"
                          : isSeatAvailable(seat)
                          ? "bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200 hover:border-blue-400 hover:scale-105 cursor-pointer shadow-sm"
                          : "bg-red-100 border-red-300 text-red-800 cursor-not-allowed opacity-80"
                      )}
                      title={
                        isSeatAvailable(seat)
                          ? `Asiento ${seat} - $${getSeatPrice(
                              seat
                            ).toLocaleString("es-CL")}`
                          : "Asiento ocupado - No disponible"
                      }
                    >
                      {seat}
                    </button>
                  ) : (
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gray-100 border border-gray-300 rounded flex items-center justify-center">
                      <div className="w-1 h-6 sm:h-8 bg-gray-300 rounded"></div>
                    </div>
                  )}
                  {seatIndex === 1 && (
                    <div className="w-1 sm:w-2 bg-transparent"></div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Indicador de la parte trasera */}
      <div className="flex flex-col items-center gap-1 sm:gap-2">
        <div className="w-12 sm:w-16 h-1 bg-gray-400 rounded-full"></div>
        <div className="text-xs sm:text-sm text-gray-600 font-medium">
          Parte Trasera
        </div>
      </div>
      {/* Leyenda */}
      <div className="flex justify-center gap-4 sm:gap-6 text-xs sm:px-4 md:px-6">
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-100 border-2 border-blue-300 rounded"></div>
          <span className="text-xs">Disponible</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-100 border-2 border-red-300 rounded"></div>
          <span className="text-xs">Ocupado</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-accent border-2 border-orange-600 rounded"></div>
          <span className="text-xs">Seleccionado</span>
        </div>
      </div>
      {/* Información adicional */}
      <div className="text-center text-xs sm:text-sm text-muted-foreground px-2 sm:px-6 md:px-8">
        <p>
          Total: {totalSeats} | Disp: {seats.filter((s) => s.available).length}{" "}
          | Ocup: {occupiedSeats.length}
          {processedLayout.isTwoFloor &&
            ` | Piso: ${currentFloor === "first" ? "1" : "2"}`}
        </p>
      </div>
      {/* Información del asiento seleccionado */}
      {selectedSeat && (
        <div className="text-center p-3 sm:p-4 bg-primary/10 border border-primary/20 rounded-lg mx-2 sm:mx-6 md:mx-8">
          <p className="text-base sm:text-lg font-bold text-primary">
            Asiento seleccionado:{" "}
            <span className="text-xl sm:text-2xl">{selectedSeat}</span>
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Precio: ${getSeatPrice(selectedSeat).toLocaleString("es-CL")}
            {processedLayout.isTwoFloor &&
              ` | Piso: ${currentFloor === "first" ? "1" : "2"}`}
          </p>
        </div>
      )}
    </div>
  );
}
