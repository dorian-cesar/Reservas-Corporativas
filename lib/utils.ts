import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMesOperacion(fecha?: string, mesFallback?: string): string {
  if (fecha) {
    const cleanDateStr = fecha.includes("T")
      ? fecha
      : fecha.includes("-") && fecha.length === 10
      ? `${fecha}T12:00:00`
      : fecha;
    const date = new Date(cleanDateStr);
    if (!isNaN(date.getTime())) {
      const monthName = date.toLocaleDateString("es-CL", { month: "long" });
      const year = date.getFullYear();
      const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      return `${capitalizedMonth} ${year}`;
    }
  }
  return mesFallback || "—";
}

