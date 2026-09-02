"use client"

import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/lib/auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Building2, BarChart, Settings, Users, Calendar, AlertCircle, IdCard, AlbumIcon, DollarSign } from "lucide-react"
import { useRouter } from "next/navigation"
import { CurrentAccounts } from "@/components/cuenta-corriente"
import { AdminStats } from "@/components/admin-stats"
import { AuditoriaCurrentAccounts } from "@/components/auditoria-components/auditoria-cuenta-corriente"
import { AuditoriaBookings } from "@/components/auditoria-components/auditoria-bookings"
import { AuditoriaCompanies } from "@/components/auditoria-components/auditoria-companies"
import { CompanyUsers } from "@/components/company-users"
import { AuditoriaCostCenters } from "@/components/auditoria-components/auditoria-cost-center"
import { EstadoPago } from "@/components/estado-pago"
import { SuperAllBookings } from "@/components/super-components/super-bookings"
import { SuperCostCenters } from "@/components/super-cost-center"
import { CompanyPassengers } from "@/components/super-components/super-passengers"
import { UserProvider } from "@/components/providers/user-provider"
import { TravelSearch } from "@/components/travel-search"
import { SuperCompanies } from "@/components/super-components/super-companies"
import { SuperCobranza } from "@/components/super-components/super-cobranza"

export default function AuditoriaPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <AuthGuard allowedRoles={["auditoria"]}>
      <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-accent/5">
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold">Panel de Administración</h1>
              <p className="text-sm text-muted-foreground">Admin CC</p>
            </div>
            {/* <AdminStats /> */}

            <Tabs defaultValue="companies-crud" className="w-full">
              <TabsList className="
                  flex items-center gap-2
                  overflow-x-auto whitespace-nowrap
                  p-2 -mx-2 sm:mx-0
                  rounded-md
                ">
                <TabsTrigger value="companies-crud" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Empresas
                </TabsTrigger>
                <TabsTrigger value="cost-center" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Centros de Costo
                </TabsTrigger>
                <TabsTrigger value="users" className="gap-2">
                  <Users className="h-4 w-4" />
                  Usuarios
                </TabsTrigger>
                <TabsTrigger value="esp" className="gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Estado de pago
                </TabsTrigger>
                <TabsTrigger value="cuenta-corriente" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Cuenta corriente
                </TabsTrigger>
                <TabsTrigger value="tickets" className="gap-2">
                  <BarChart className="h-4 w-4" />
                  Boletos
                </TabsTrigger>

                <TabsTrigger value="passengers" className="gap-2">
                  <IdCard className="h-4 w-4" />
                  Pasajeros
                </TabsTrigger>
                <TabsTrigger value="cobranza" className="gap-2">
                  <DollarSign className="h-4 w-4" />
                  Cobranza
                </TabsTrigger>
              </TabsList>

              <TabsContent value="companies-crud" className="mt-6">
                {/* <AuditoriaCompanies /> */}
                <SuperCompanies />
              </TabsContent>
              <TabsContent value="users" className="mt-6">
                <CompanyUsers />
              </TabsContent>

              <TabsContent value="cost-center" className="mt-6">
                <SuperCostCenters />
              </TabsContent>

              <TabsContent value="esp" className="mt-6">
                <EstadoPago />
              </TabsContent>

              <TabsContent value="cuenta-corriente" className="mt-6">
                <CurrentAccounts />
              </TabsContent>

              <TabsContent value="tickets" className="mt-6">
                <SuperAllBookings />
              </TabsContent>

              <TabsContent value="passengers" className="mt-6">
                <CompanyPassengers />
              </TabsContent>

              <TabsContent value="cobranza" className="mt-6">
                <SuperCobranza />
              </TabsContent>

              {/* <TabsContent value="bookings" className="mt-6">
                <UserProvider />
                <TravelSearch />
              </TabsContent> */}
            </Tabs>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
