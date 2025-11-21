"use client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface SeatSelectorProps {
  totalSeats: number
  occupiedSeats: string[]
  onSeatSelect: (seat: string) => void
  selectedSeat: string | null
}

export function SeatSelector({ totalSeats, occupiedSeats, onSeatSelect, selectedSeat }: SeatSelectorProps) {
  const rows = Math.ceil(totalSeats / 4)
  const seatLabels = ["A", "B", "C", "D"]

  const generateSeats = () => {
    const seats = []
    for (let row = 1; row <= rows; row++) {
      for (const label of seatLabels) {
        const seatNumber = `${label}${row}`
        if (seats.length < totalSeats) {
          seats.push(seatNumber)
        }
      }
    }
    return seats
  }

  const seats = generateSeats()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border-2 border-muted-foreground bg-background" />
          <span className="text-muted-foreground">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary border-2 border-primary" />
          <span className="text-muted-foreground">Seleccionado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-muted border-2 border-muted" />
          <span className="text-muted-foreground">Ocupado</span>
        </div>
      </div>

      <div className="p-6 bg-muted/30 rounded-lg">
        <div className="mb-4 text-center">
          <div className="inline-block px-8 py-2 bg-muted rounded-t-lg text-sm font-medium text-muted-foreground">
            Conductor
          </div>
        </div>

        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
          {seats.map((seat, index) => {
            const isOccupied = occupiedSeats.includes(seat)
            const isSelected = selectedSeat === seat
            const isAisle = index % 4 === 1

            return (
              <div key={seat} className={cn("flex justify-center", isAisle && "mr-4")}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isOccupied}
                  onClick={() => onSeatSelect(seat)}
                  className={cn(
                    "w-12 h-12 p-0 text-xs font-bold transition-all duration-200",
                    isOccupied && "bg-muted opacity-50 cursor-not-allowed",
                    isSelected && "bg-primary text-primary-foreground border-primary hover:bg-primary/90",
                    !isOccupied && !isSelected && "hover:border-primary hover:scale-110",
                  )}
                >
                  {isSelected ? <Check className="h-4 w-4" /> : seat}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
