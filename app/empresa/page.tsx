"use client";

import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Users,
  Calendar,
  AlertCircle,
  AlbumIcon,
  IdCard,
  Settings,
  PlusCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminCurrentAccounts } from "@/components/admin-components/admin-cuenta-corriente";
import { AdminBookings } from "@/components/admin-components/admin-bookings";
import { AdminCompanyUsers } from "@/components/admin-components/admin-company-users";
import { AdminCostCenters } from "@/components/admin-components/admin-cost-center";
import { AdminEstadoPago } from "@/components/admin-components/admin-estado-pago";
import { AdminPassengers } from "@/components/admin-components/admin-passengers";
import Reserve from "@/components/admin-components/reserve";
import { usePersistedTab } from "@/hooks/usePersistedTab";

export default function EmpresaPage() {
  const { user } = useAuth();

  const { activeTab, handleTabChange } = usePersistedTab(
    "reserve",
    "empresa-page-active-tab"
  );

  return (
    <AuthGuard allowedRoles={["empresa", "superuser", "admin"]}>
      <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-accent/5">
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Panel de Gestión Corporativa
                </h1>
                <p className="text-sm text-muted-foreground">
                  Empresa: <span className="font-semibold text-foreground">{user?.companyName || "—"}</span>
                </p>
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 text-sm text-primary font-medium self-start md:self-center">
                Rol: {user?.role === "empresa" ? "Administrador de Empresa" : user?.role}
              </div>
            </div>

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
                <TabsTrigger value="reserve" className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Nueva Reserva
                </TabsTrigger>
                <TabsTrigger value="bookings" className="gap-2">
                  <AlbumIcon className="h-4 w-4" />
                  Mis Reservas
                </TabsTrigger>
                <TabsTrigger value="users" className="gap-2">
                  <Users className="h-4 w-4" />
                  Usuarios
                </TabsTrigger>
                <TabsTrigger value="cost-center" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Centros de Costo
                </TabsTrigger>
                <TabsTrigger value="passengers" className="gap-2">
                  <IdCard className="h-4 w-4" />
                  Pasajeros
                </TabsTrigger>
                <TabsTrigger value="cuenta-corriente" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Cuenta Corriente
                </TabsTrigger>
                <TabsTrigger value="esp" className="gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Estados de Pago
                </TabsTrigger>
              </TabsList>

              <TabsContent value="reserve" className="mt-6">
                <Reserve />
              </TabsContent>

              <TabsContent value="bookings" className="mt-6">
                <AdminBookings />
              </TabsContent>

              <TabsContent value="users" className="mt-6">
                <AdminCompanyUsers />
              </TabsContent>

              <TabsContent value="cost-center" className="mt-6">
                <AdminCostCenters />
              </TabsContent>

              <TabsContent value="passengers" className="mt-6">
                <AdminPassengers />
              </TabsContent>

              <TabsContent value="cuenta-corriente" className="mt-6">
                <AdminCurrentAccounts />
              </TabsContent>

              <TabsContent value="esp" className="mt-6">
                <AdminEstadoPago />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}