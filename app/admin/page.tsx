"use client"

import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Building2, BarChart, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { AdminStats } from "@/components/admin-stats"
import { AllCompanies } from "@/components/all-companies"
import { AllBookingsAdmin } from "@/components/all-bookings-admin"

export default function AdminPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <AuthGuard allowedRoles={["superuser"]}>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/dashboard")}
                  className="transition-all hover:scale-105"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-xl font-bold">Panel de Administración</h1>
                  <p className="text-sm text-muted-foreground">Super Usuario</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">Super Usuario</p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleLogout}
                  className="transition-all hover:scale-105 bg-transparent"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <AdminStats />

            <Tabs defaultValue="companies" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="companies" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Empresas
                </TabsTrigger>
                <TabsTrigger value="bookings" className="gap-2">
                  <BarChart className="h-4 w-4" />
                  Todas las Reservas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="companies" className="mt-6">
                <AllCompanies />
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
