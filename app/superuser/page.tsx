"use client"

import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/lib/auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Building2, BarChart, Settings, Users, Calendar, AlertCircle, AlbumIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { AdminStats } from "@/components/admin-stats"
import { CurrentAccounts } from "@/components/cuenta-corriente"
import { SuperAllBookings } from "@/components/super-components/super-bookings"
import { SuperCompanies } from "@/components/super-components/super-companies"
import { CompanyUsers } from "@/components/company-users"
import { SuperCostCenters } from "@/components/super-cost-center"
import { EstadoPago } from "@/components/estado-pago"
import { TravelSearch } from "@/components/travel-search"
import { UserProvider } from "@/components/providers/user-provider"

export default function SuperUserPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <AuthGuard allowedRoles={["superuser"]}>
      <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-accent/5">
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold">Panel de Administración</h1>
              <p className="text-sm text-muted-foreground">Super Usuario</p>
            </div>
            <AdminStats />

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
                  Tickets
                </TabsTrigger>
                {/* <TabsTrigger value="bookings" className="gap-2">
                  <AlbumIcon className="h-4 w-4" />
                  Reservas
                </TabsTrigger> */}
              </TabsList>

              <TabsContent value="companies-crud" className="mt-6">
                <SuperCompanies />
              </TabsContent>

              <TabsContent value="cost-center" className="mt-6">
                <SuperCostCenters />
              </TabsContent>

              <TabsContent value="users" className="mt-6">
                <CompanyUsers />
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
