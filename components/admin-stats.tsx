"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { COMPANIES, BOOKINGS } from "@/lib/mock-data"
import { Building2, Ticket, DollarSign, Users } from "lucide-react"

export function AdminStats() {
  const totalRevenue = BOOKINGS.reduce((sum, b) => sum + b.price, 0)
  const totalCompanies = COMPANIES.length
  const totalBookings = BOOKINGS.length

  // Calculate unique users
  const uniqueUsers = new Set(BOOKINGS.map((b) => b.userId)).size

  const stats = [
    {
      title: "Total Empresas",
      value: totalCompanies,
      icon: Building2,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Reservas",
      value: totalBookings,
      icon: Ticket,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Usuarios Activos",
      value: uniqueUsers,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Ingresos Totales",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card
          key={stat.title}
          className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg animate-in fade-in slide-in-from-top-4"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
