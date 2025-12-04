"use client"

import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/lib/auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Building2, BarChart, Settings, Users, Calendar, AlertCircle, AlbumIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { AdminStats } from "@/components/admin-stats"
import { AdminCurrentAccounts } from "@/components/admin-components/admin-cuenta-corriente"
import { AdminBookings } from "@/components/admin-components/admin-bookings"
import { AdminCompanyUsers } from "@/components/admin-components/admin-company-users"
import { AdminCostCenters } from "@/components/admin-components/admin-cost-center"
import { AdminEstadoPago } from "@/components/admin-components/admin-estado-pago"
import { TravelSearch } from "@/components/travel-search"
import { SuperTravelSearch } from "@/components/super-components/super-travel-search"
import { UserProvider } from "@/components/providers/user-provider";


export default function AdminPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
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

            <Tabs defaultValue="cost-center" className="w-full">
              <TabsList className="
                  flex items-center gap-2
                  overflow-x-auto whitespace-nowrap
                  p-2 -mx-2 sm:mx-0
                  rounded-md
                ">
                <TabsTrigger value="cost-center" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Centros de Costo
                </TabsTrigger>
                <TabsTrigger value="users" className="gap-2">
                  <Users className="h-4 w-4" />
                  Usuarios
                </TabsTrigger>
                {/* <TabsTrigger value="esp" className="gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Estado de pago
                </TabsTrigger> */}
                {/* <TabsTrigger value="cuenta-corriente" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Cuenta corriente
                </TabsTrigger> */}
                <TabsTrigger value="tickets" className="gap-2">
                  <BarChart className="h-4 w-4" />
                  Tickets
                </TabsTrigger>
                <TabsTrigger value="bookings" className="gap-2">
                  <AlbumIcon className="h-4 w-4" />
                  Reservas
                </TabsTrigger>
              </TabsList>


              <TabsContent value="cost-center" className="mt-6">
                <AdminCostCenters />
              </TabsContent>

              <TabsContent value="users" className="mt-6">
                <AdminCompanyUsers />
              </TabsContent>
              {/* <TabsContent value="esp" className="mt-6">
                <AdminEstadoPago />
              </TabsContent> */}

              {/* <TabsContent value="cuenta-corriente" className="mt-6">
                <AdminCurrentAccounts />
              </TabsContent> */}

              <TabsContent value="tickets" className="mt-6">
                <AdminBookings />
              </TabsContent>

              <TabsContent value="bookings" className="mt-6">
                <UserProvider />
                <TravelSearch />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
