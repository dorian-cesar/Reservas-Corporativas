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
import { usePersistedTab } from "@/hooks/usePersistedTab"
import { usePermissions } from "@/hooks/usePermissions"

export default function AuditoriaPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { can } = usePermissions()

  const tabs = [
    { value: "companies-crud", label: "Empresas", icon: Building2, perm: "empresa_ver_informacion_de_empresa", component: <SuperCompanies /> },
    { value: "cost-center", label: "Centros de Costo", icon: Settings, perm: "centro_de_costo_ver_informacion_de_centro_de_costo", component: <SuperCostCenters /> },
    { value: "users", label: "Usuarios", icon: Users, perm: "usuarios_ver_informacion_de_usuarios", component: <CompanyUsers /> },
    { value: "esp", label: "Estado de pago", icon: AlertCircle, perm: "estados_de_pago_ver_informacion_de_estados_de_pago", component: <EstadoPago /> },
    { value: "cuenta-corriente", label: "Cuenta corriente", icon: Calendar, perm: "cuentas_corrientes_ver_informacion_de_cuentas_corrientes", component: <CurrentAccounts /> },
    { value: "tickets", label: "Boletos", icon: BarChart, perm: "tickets_ver_informacion_de_tickets", component: <SuperAllBookings /> },
    { value: "passengers", label: "Pasajeros", icon: IdCard, perm: "pasajeros_ver_informacion_de_pasajeros", component: <CompanyPassengers /> },
    { value: "cobranza", label: "Cobranza", icon: DollarSign, perm: "cobranza_ver_informacion_de_cobranza", component: <SuperCobranza /> },
  ];

  const allowedTabs = tabs.filter((t) => can(t.perm));

  const { activeTab, handleTabChange } = usePersistedTab(
    allowedTabs[0]?.value || "companies-crud",
    "auditoria-page-active-tab"
  )

  const currentTab = allowedTabs.some((t) => t.value === activeTab)
    ? activeTab
    : allowedTabs[0]?.value || activeTab;

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auditoria-page-active-tab")
    }
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
              <p className="text-sm text-muted-foreground">Auditoría</p>
            </div>

            <Tabs
              value={currentTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="
                  flex items-center gap-2
                  overflow-x-auto whitespace-nowrap
                  p-2 -mx-2 sm:mx-0
                  rounded-md
                ">
                {allowedTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {allowedTabs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value} className="mt-6">
                  {tab.component}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
