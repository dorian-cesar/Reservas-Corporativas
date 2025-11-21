"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { COMPANIES, BOOKINGS } from "@/lib/mock-data"
import { Building2, Users, Ticket, Mail, FileDown, TrendingUp } from "lucide-react"
import { generatePDF } from "@/lib/pdf-generator"

export function AllCompanies() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {COMPANIES.map((company, index) => {
        const companyBookings = BOOKINGS.filter((b) => b.companyId === company.id)
        const totalRevenue = companyBookings.reduce((sum, b) => sum + b.price, 0)

        const handleDownloadPDF = () => {
          const previousMonth = new Date()
          previousMonth.setMonth(previousMonth.getMonth() - 1)
          const monthName = previousMonth.toLocaleDateString("es-AR", { month: "long", year: "numeric" })

          const previousMonthBookings = companyBookings.filter((b) => {
            const bookingDate = new Date(b.bookedAt)
            return (
              bookingDate.getMonth() === previousMonth.getMonth() &&
              bookingDate.getFullYear() === previousMonth.getFullYear()
            )
          })

          generatePDF(previousMonthBookings, company.name, monthName)
        }

        return (
          <Card
            key={company.id}
            className="border-2 hover:border-primary transition-all duration-300 hover:shadow-xl animate-in fade-in zoom-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{company.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Mail className="h-3 w-3" />
                      {company.contactEmail}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Users className="h-3 w-3" />
                    Usuarios
                  </div>
                  <p className="text-2xl font-bold">{company.activeUsers}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Ticket className="h-3 w-3" />
                    Reservas
                  </div>
                  <p className="text-2xl font-bold">{companyBookings.length}</p>
                </div>
              </div>

              <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                <div className="flex items-center gap-2 text-accent text-sm mb-1">
                  <TrendingUp className="h-3 w-3" />
                  Ingresos Totales
                </div>
                <p className="text-2xl font-bold text-accent">${totalRevenue.toLocaleString()}</p>
              </div>

              <Button
                onClick={handleDownloadPDF}
                className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground transition-all hover:scale-[1.02]"
                size="sm"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Descargar Estado de Pago
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
