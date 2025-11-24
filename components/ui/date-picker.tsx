"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export function DatePicker({
  date,
  onChange,
}: {
  date: Date | undefined;
  onChange: (date: Date | undefined) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal text-sm py-1 h-8",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-3 w-3" />
          {date ? format(date, "yyyy-MM-dd") : "Selecciona una fecha"}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0 w-auto" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            onChange(d);
            setOpen(false);
          }}
          disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
          weekStartsOn={1}
          locale={es}
          formatters={{
            formatCaption: (date, options) => {
              const month = date.toLocaleString("es-ES", { month: "long" });
              const year = date.getFullYear();
              return `${
                month.charAt(0).toUpperCase() + month.slice(1)
              } ${year}`;
            },
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
