"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { BOOKINGS } from "@/lib/mock-data";
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle2,
  FileDown,
  Search,
  User,
} from "lucide-react";
import { generatePDF } from "@/lib/pdf-generator";

export function CompanyBookings() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const companyBookings = BOOKINGS.filter(
    (b) => b.companyId === user?.companyId
  );

  const filteredBookings = companyBookings.filter(
    (b) =>
      b.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadPDF = () => {
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const monthName = previousMonth.toLocaleDateString("es-CL", {
      month: "long",
      year: "numeric",
    });

    const previousMonthBookings = companyBookings.filter((b) => {
      const bookingDate = new Date(b.bookedAt);
      return (
        bookingDate.getMonth() === previousMonth.getMonth() &&
        bookingDate.getFullYear() === previousMonth.getFullYear()
      );
    });

    generatePDF(previousMonthBookings, user?.companyName || "", monthName);
  };

  return (
    <Card className="border-2 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Reservas de la Empresa</CardTitle>
            <CardDescription>
              Listado completo de todas las reservas realizadas
            </CardDescription>
          </div>
          <Button
            onClick={handleDownloadPDF}
            className="bg-accent hover:bg-accent/90 text-accent-foreground transition-all hover:scale-105"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Descargar PDF Mes Anterior
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por usuario, email o destino..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {filteredBookings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron reservas
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking, index) => (
              <div
                key={booking.id}
                className="p-4 border-2 rounded-lg hover:border-primary transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-left-4"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-bold">{booking.userName}</span>
                      <span className="text-sm text-muted-foreground">
                        ({booking.userEmail})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3 w-3 text-primary" />
                      <span>{booking.origin}</span>
                      <span className="text-muted-foreground">→</span>
                      <MapPin className="h-3 w-3 text-accent" />
                      <span>{booking.destination}</span>
                    </div>
                  </div>
                  <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {booking.status === "confirmed"
                      ? "Confirmada"
                      : "Cancelada"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(booking.date).toLocaleDateString("es-CL")}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {booking.departureTime}
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    Asiento: {booking.seatNumber}
                  </div>
                  <div className="flex items-center gap-1 font-bold text-primary justify-end">
                    <DollarSign className="h-3 w-3" />
                    {booking.price.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
