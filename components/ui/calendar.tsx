"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

import "react-day-picker/dist/style.css";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, classNames, ...props }: CalendarProps) {
  return (
    <DayPicker
      fixedWeeks
      showOutsideDays
      className={cn("p-2", className)}
      weekStartsOn={1}
      formatters={{
        formatCaption: (date, options) => {
          const month = date.toLocaleString("es-ES", { month: "long" });
          const year = date.getFullYear();
          return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
        },
      }}
      classNames={{
        ...classNames,
        caption: "flex justify-center py-1 font-medium",
        nav: "flex items-center justify-between",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-7 font-normal text-[0.4rem]",
        row: "flex w-full mt-1",
        cell: "h-7 w-7 text-center text-xs p-0 relative",
        day: cn(
          "h-7 w-7 p-0 font-normal text-xs",
          "rounded-md",
          "hover:bg-accent hover:text-accent-foreground focus:outline-none"
        ),
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground text-xs",
        ...classNames,
      }}
      {...props}
    />
  );
}
