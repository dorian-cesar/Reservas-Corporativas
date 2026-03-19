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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  Bus,
  MapPin,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Download,
  Printer,
  Mail,
  ArrowLeft,
  FileText,
  Home,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface BookingSummaryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BookingItem {
  tripType: "departure" | "return";
  origin: string;
  destination: string;
  date: string;
  dep_time: string;
  arr_time: string;
  travel_name: string;
  seats: string[];
  passengers: any[];
  totalPrice: number;
  pnrNumbers: string[];
  ticketNumbers: string[];
  terminalOrigen: string | null;
  terminalDestino: string | null;
  bookingData: any[];
}

export function BookingSummary({ open, onOpenChange }: BookingSummaryProps) {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      // Cargar reservas desde localStorage
      const storedBookings = JSON.parse(
        localStorage.getItem("completedBookings") || "[]",
      );
      setBookings(storedBookings);

      // También puedes verificar si hay datos en sessionStorage como respaldo
      const sessionBookings = JSON.parse(
        sessionStorage.getItem("completedBookings") || "[]",
      );
      if (sessionBookings.length > 0 && storedBookings.length === 0) {
        setBookings(sessionBookings);
      }
    }
  }, [open]);

  const formatDate = (date: string) => {
    try {
      const [year, month, day] = date.split("-");
      return `${day}/${month}/${year}`;
    } catch (error) {
      return date;
    }
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    return time.includes(":") ? time : `${time.slice(0, 2)}:${time.slice(2)}`;
  };

  const getTotalPrice = () => {
    return bookings.reduce((total, booking) => total + booking.totalPrice, 0);
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      const printContent = document.getElementById("booking-summary-content");
      if (printContent) {
        const originalContents = document.body.innerHTML;
        document.body.innerHTML = printContent.innerHTML;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload();
      }
      setIsPrinting(false);
    }, 100);
  };

  const handleEmail = async () => {
    // Simular envío de email
    alert("Se ha enviado un correo con los detalles de tu reserva");
  };

  const handleDownload = () => {
    // Crear contenido para PDF
    const content = `
      <html>
        <head>
          <title>Resumen de Reservas</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            .booking { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; }
            .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Resumen de Reservas</h1>
          ${bookings
            .map(
              (booking) => `
            <div class="booking">
              <h2>${
                booking.tripType === "departure"
                  ? "Viaje de Ida"
                  : "Viaje de Vuelta"
              }</h2>
              <p><strong>Ruta:</strong> ${booking.origin} → ${
                booking.destination
              }</p>
              <p><strong>Fecha:</strong> ${formatDate(booking.date)}</p>
              <p><strong>Horario:</strong> ${formatTime(
                booking.dep_time,
              )} - ${formatTime(booking.arr_time)}</p>
              <p><strong>Empresa:</strong> ${booking.travel_name}</p>
              <p><strong>Asientos:</strong> ${booking.seats.join(", ")}</p>
              <p><strong>Total:</strong> $${booking.totalPrice.toLocaleString(
                "es-CL",
              )}</p>
            </div>
          `,
            )
            .join("")}
          <div class="total">
            Total General: $${getTotalPrice().toLocaleString("es-CL")}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reservas_${new Date().toISOString().split("T")[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFinish = () => {
    // Limpiar localStorage y sessionStorage
    localStorage.removeItem("completedBookings");
    sessionStorage.removeItem("completedBookings");
    setBookings([]);
    onOpenChange(false);

    // Redirigir a la página principal
    router.push("/portal");
  };

  const handleNewSearch = () => {
    // Limpiar storage
    localStorage.removeItem("completedBookings");
    sessionStorage.removeItem("completedBookings");
    setBookings([]);
    onOpenChange(false);

    // Mantener al usuario en la misma página para nueva búsqueda
    // La página ya debería estar en el estado inicial
    window.location.reload(); // O usar router.refresh() si usas Next.js 13+
  };

  const departureBooking = bookings.find((b) => b.tripType === "departure");
  const returnBooking = bookings.find((b) => b.tripType === "return");

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              ¡Reservas Completadas Exitosamente!
            </DialogTitle>
            <DialogDescription>
              Resumen de tus reservas de ida y vuelta
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Resumen de ida */}
            {departureBooking && (
              <Card className="border-2 border-blue-100">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bus className="h-5 w-5 text-blue-600" />
                      Viaje de Ida
                      <Badge variant="outline" className="ml-2 bg-blue-100">
                        Confirmado
                      </Badge>
                    </div>
                    <span className="text-lg font-bold text-blue-700">
                      ${departureBooking.totalPrice.toLocaleString("es-CL")}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Ruta:</span>
                        <span className="ml-2">
                          {departureBooking.origin} →{" "}
                          {departureBooking.destination}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Fecha:</span>
                        <span className="ml-2">
                          {formatDate(departureBooking.date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Horario:</span>
                        <span className="ml-2">
                          {formatTime(departureBooking.dep_time)} -{" "}
                          {formatTime(departureBooking.arr_time)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Bus className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Empresa:</span>
                        <span className="ml-2">
                          {departureBooking.travel_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Asientos:</span>
                        <span className="ml-2">
                          {departureBooking.seats.join(", ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">PNRs:</span>
                        <span className="ml-2">
                          {departureBooking.pnrNumbers?.join(", ") || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pasajeros */}
                  {departureBooking.passengers?.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Pasajeros:</h4>
                      <div className="space-y-2">
                        {departureBooking.passengers.map((passenger, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-2 bg-gray-50 rounded"
                          >
                            <div>
                              <span className="font-medium">
                                {passenger.nombre}
                              </span>
                              <span className="text-sm text-muted-foreground ml-2">
                                ({passenger.rut})
                              </span>
                            </div>
                            <Badge variant="outline">
                              Asiento: {departureBooking.seats[index]}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Resumen de vuelta */}
            {returnBooking && (
              <Card className="border-2 border-green-100">
                <CardHeader className="bg-green-50">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bus className="h-5 w-5 text-green-600" />
                      Viaje de Vuelta
                      <Badge variant="outline" className="ml-2 bg-green-100">
                        Confirmado
                      </Badge>
                    </div>
                    <span className="text-lg font-bold text-green-700">
                      ${returnBooking.totalPrice.toLocaleString("es-CL")}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Ruta:</span>
                        <span className="ml-2">
                          {returnBooking.origin} → {returnBooking.destination}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Fecha:</span>
                        <span className="ml-2">
                          {formatDate(returnBooking.date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Horario:</span>
                        <span className="ml-2">
                          {formatTime(returnBooking.dep_time)} -{" "}
                          {formatTime(returnBooking.arr_time)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Bus className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Empresa:</span>
                        <span className="ml-2">
                          {returnBooking.travel_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Asientos:</span>
                        <span className="ml-2">
                          {returnBooking.seats.join(", ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">PNRs:</span>
                        <span className="ml-2">
                          {returnBooking.pnrNumbers?.join(", ") || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pasajeros */}
                  {returnBooking.passengers?.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Pasajeros:</h4>
                      <div className="space-y-2">
                        {returnBooking.passengers.map((passenger, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-2 bg-gray-50 rounded"
                          >
                            <div>
                              <span className="font-medium">
                                {passenger.nombre}
                              </span>
                              <span className="text-sm text-muted-foreground ml-2">
                                ({passenger.rut})
                              </span>
                            </div>
                            <Badge variant="outline">
                              Asiento: {returnBooking.seats[index]}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Resumen total */}
            {(departureBooking || returnBooking) && (
              <Card className="bg-linear-to-r from-purple-50 to-indigo-50 border-2 border-purple-200">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-purple-800">
                        Resumen Total
                      </h3>
                      <p className="text-muted-foreground">
                        {departureBooking && returnBooking
                          ? "2 reservas completadas"
                          : departureBooking || returnBooking
                            ? "1 reserva completada"
                            : "Sin reservas"}
                      </p>
                    </div>
                    <div className="text-right mt-4 md:mt-0">
                      <div className="text-3xl font-bold text-purple-700">
                        ${getTotalPrice().toLocaleString("es-CL")}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Total pagado
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {bookings.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay reservas para mostrar</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handlePrint}
                disabled={isPrinting || bookings.length === 0}
                className="flex-1"
              >
                <Printer className="h-4 w-4 mr-2" />
                {isPrinting ? "Imprimiendo..." : "Imprimir"}
              </Button>
              <Button
                variant="outline"
                onClick={handleEmail}
                disabled={bookings.length === 0}
                className="flex-1"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={bookings.length === 0}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleNewSearch}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Nueva Búsqueda
              </Button>
              <Button
                onClick={handleFinish}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Home className="h-4 w-4 mr-2" />
                Ir al Inicio
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contenido oculto para impresión */}
      <div id="booking-summary-content" className="hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-center mb-8">
            Resumen de Reservas
          </h1>

          {departureBooking && (
            <div className="mb-8 p-6 border border-gray-300 rounded-lg">
              <h2 className="text-2xl font-bold text-blue-600 mb-4">
                Viaje de Ida
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p>
                    <strong>Ruta:</strong> {departureBooking.origin} →{" "}
                    {departureBooking.destination}
                  </p>
                  <p>
                    <strong>Fecha:</strong> {formatDate(departureBooking.date)}
                  </p>
                  <p>
                    <strong>Horario:</strong>{" "}
                    {formatTime(departureBooking.dep_time)} -{" "}
                    {formatTime(departureBooking.arr_time)}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Empresa:</strong> {departureBooking.travel_name}
                  </p>
                  <p>
                    <strong>Asientos:</strong>{" "}
                    {departureBooking.seats.join(", ")}
                  </p>
                  <p>
                    <strong>Total:</strong> $
                    {departureBooking.totalPrice.toLocaleString("es-CL")}
                  </p>
                </div>
              </div>
              {departureBooking.passengers?.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-bold">Pasajeros:</h3>
                  <ul>
                    {departureBooking.passengers.map((passenger, index) => (
                      <li key={index}>
                        {passenger.nombre} ({passenger.rut}) - Asiento:{" "}
                        {departureBooking.seats[index]}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {returnBooking && (
            <div className="mb-8 p-6 border border-gray-300 rounded-lg">
              <h2 className="text-2xl font-bold text-green-600 mb-4">
                Viaje de Vuelta
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p>
                    <strong>Ruta:</strong> {returnBooking.origin} →{" "}
                    {returnBooking.destination}
                  </p>
                  <p>
                    <strong>Fecha:</strong> {formatDate(returnBooking.date)}
                  </p>
                  <p>
                    <strong>Horario:</strong>{" "}
                    {formatTime(returnBooking.dep_time)} -{" "}
                    {formatTime(returnBooking.arr_time)}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Empresa:</strong> {returnBooking.travel_name}
                  </p>
                  <p>
                    <strong>Asientos:</strong> {returnBooking.seats.join(", ")}
                  </p>
                  <p>
                    <strong>Total:</strong> $
                    {returnBooking.totalPrice.toLocaleString("es-CL")}
                  </p>
                </div>
              </div>
              {returnBooking.passengers?.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-bold">Pasajeros:</h3>
                  <ul>
                    {returnBooking.passengers.map((passenger, index) => (
                      <li key={index}>
                        {passenger.nombre} ({passenger.rut}) - Asiento:{" "}
                        {returnBooking.seats[index]}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {(departureBooking || returnBooking) && (
            <div className="mt-8 p-6 bg-gray-100 rounded-lg">
              <h2 className="text-2xl font-bold text-center">Resumen Total</h2>
              <p className="text-center text-xl mt-4">
                <strong>Total General:</strong> $
                {getTotalPrice().toLocaleString("es-CL")}
              </p>
              <p className="text-center mt-2">
                {departureBooking && returnBooking
                  ? "2 reservas completadas"
                  : "1 reserva completada"}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
