"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth"
import { BOOKINGS } from "@/lib/mock-data"
import { Users, Ticket, DollarSign, TrendingUp } from "lucide-react"

export function CompanyStats() {
  const { user } = useAuth()

  const companyBookings = BOOKINGS.filter((b) => b.companyId === user?.companyId)
  const totalRevenue = companyBookings.reduce((sum, b) => sum + b.price, 0)
  const confirmedBookings = companyBookings.filter((b) => b.status === "confirmed").length

  // Get current month bookings
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthBookings = companyBookings.filter((b) => {
    const bookingDate = new Date(b.bookedAt)
    return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear
  })

  const stats = [
    {
      title: "Total Reservas",
      value: companyBookings.length,
      icon: Ticket,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Reservas Confirmadas",
      value: confirmedBookings,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Reservas del Mes",
      value: monthBookings.length,
      icon: Users,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
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
