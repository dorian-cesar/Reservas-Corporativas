"use client"

import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/lib/auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Building2, BarChart, Settings, Users, Calendar, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { AdminStats } from "@/components/admin-stats"
import { CurrentAccounts } from "@/components/cuenta-corriente"
import { AllBookingsAdmin } from "@/components/all-bookings-admin"
import { AdminCompanyUsers } from "@/components/admin-company-users"
import { AdminCostCentersCRUD } from "@/components/admin-cost-center-crud"
import { AdminEstadoPago } from "@/components/admin-estado-pago"

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
              <TabsList className="grid w-full grid-cols-6">
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
                <TabsTrigger value="bookings" className="gap-2">
                  <BarChart className="h-4 w-4" />
                  Tickets
                </TabsTrigger>
              </TabsList>


              <TabsContent value="cost-center" className="mt-6">
                <AdminCostCentersCRUD />
              </TabsContent>

              <TabsContent value="users" className="mt-6">
                <AdminCompanyUsers />
              </TabsContent>
              <TabsContent value="esp" className="mt-6">
                <AdminEstadoPago />
              </TabsContent>

              <TabsContent value="cuenta-corriente" className="mt-6">
                <CurrentAccounts />
              </TabsContent>

              <TabsContent value="bookings" className="mt-6">
                <AllBookingsAdmin />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
