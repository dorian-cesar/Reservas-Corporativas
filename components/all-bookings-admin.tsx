"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BOOKINGS, COMPANIES } from "@/lib/mock-data"
import { MapPin, Calendar, Clock, DollarSign, CheckCircle2, Search, Building2, User } from "lucide-react"

export function AllBookingsAdmin() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCompany, setSelectedCompany] = useState<string>("all")

  let filteredBookings = BOOKINGS

  // Filter by company
  if (selectedCompany !== "all") {
    filteredBookings = filteredBookings.filter((b) => b.companyId === selectedCompany)
  }

  // Filter by search term
  filteredBookings = filteredBookings.filter(
    (b) =>
      b.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.destination.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalRevenue = filteredBookings.reduce((sum, b) => sum + b.price, 0)

  return (
    <Card className="border-2 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Todas las Reservas del Sistema</CardTitle>
            <CardDescription>Vista completa de todas las reservas de todas las empresas</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-primary">${totalRevenue.toLocaleString()}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por usuario, empresa o destino..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Filtrar por empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las empresas</SelectItem>
              {COMPANIES.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No se encontraron reservas</div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredBookings.length} reserva{filteredBookings.length !== 1 ? "s" : ""}
            </p>
            {filteredBookings.map((booking, index) => (
              <div
                key={booking.id}
                className="p-4 border-2 rounded-lg hover:border-primary transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-left-4"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="font-bold text-primary">{booking.companyName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{booking.userName}</span>
                      <span className="text-muted-foreground">({booking.userEmail})</span>
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
                    {booking.status === "confirmed" ? "Confirmada" : "Cancelada"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm pt-3 border-t">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(booking.date).toLocaleDateString("es-AR")}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {booking.departureTime}
                  </div>
                  <div className="flex items-center gap-2 font-medium">Asiento: {booking.seatNumber}</div>
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
  )
}
