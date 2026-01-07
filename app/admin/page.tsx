"use client"

import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/lib/auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Building2, BarChart, Settings, Users, Calendar, AlertCircle, AlbumIcon, IdCard } from "lucide-react"
import { useRouter } from "next/navigation"
import { AdminStats } from "@/components/admin-stats"
import { AdminCurrentAccounts } from "@/components/admin-components/admin-cuenta-corriente"
import { AdminBookings } from "@/components/admin-components/admin-bookings"
import { AdminCompanyUsers } from "@/components/admin-components/admin-company-users"
import { CompanyUsers } from "@/components/company-users"
import { AdminCostCenters } from "@/components/admin-components/admin-cost-center"
import { AdminEstadoPago } from "@/components/admin-components/admin-estado-pago"
import { TravelSearch } from "@/components/travel-search"
import { UserProvider } from "@/components/providers/user-provider";
import { AdminPassengers } from "@/components/admin-components/admin-passengers"
import { SuperCompanies } from "@/components/super-components/super-companies"
import { SuperCostCenters } from "@/components/super-cost-center"
import { SuperAllBookings } from "@/components/super-components/super-bookings"
import { CompanyPassengers } from "@/components/super-components/super-passengers"
import Reserve from "@/components/admin-components/reserve"
import { usePersistedTab } from "@/hooks/usePersistedTab" // Importa el hook

export default function AdminPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const { activeTab, handleTabChange } = usePersistedTab(
    "companies-crud",
    "admin-page-active-tab"
  )

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin-page-active-tab")
    }
    logout()
    router.push("/login")
  }

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-accent/5">
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold">Panel de Administración</h1>
              <p className="text-sm text-muted-foreground">Administrador</p>
            </div>
            <AdminStats />

            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
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
                <TabsTrigger value="tickets" className="gap-2">
                  <BarChart className="h-4 w-4" />
                  Tickets
                </TabsTrigger>
                <TabsTrigger value="passengers" className="gap-2">
                  <IdCard className="h-4 w-4" />
                  Pasajeros
                </TabsTrigger>
                <TabsTrigger value="bookings" className="gap-2">
                  <AlbumIcon className="h-4 w-4" />
                  Reservas
                </TabsTrigger>
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
              <TabsContent value="tickets" className="mt-6">
                <SuperAllBookings />
              </TabsContent>
              <TabsContent value="passengers" className="mt-6">
                <CompanyPassengers />
              </TabsContent>
              <TabsContent value="bookings" className="mt-6">
                <Reserve />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}