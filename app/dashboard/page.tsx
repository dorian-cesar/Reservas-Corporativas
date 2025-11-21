"use client"

import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/lib/auth"
import { TravelSearch } from "@/components/travel-search"
import { MyBookings } from "@/components/my-bookings"
import { Button } from "@/components/ui/button"
import { Plane, LogOut, Users, BarChart } from "lucide-react"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary rounded-lg">
                  <Plane className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">TravelBook</h1>
                  <p className="text-sm text-muted-foreground">Reservas Corporativas</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {user?.role === "user" && "Usuario"}
                    {user?.role === "controller" && "Controlador"}
                    {user?.role === "superuser" && "Super Usuario"}
                    {user?.companyName && ` - ${user.companyName}`}
                  </p>
                </div>

                <div className="flex gap-2">
                  {user?.role === "controller" && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => router.push("/controller")}
                      className="transition-all hover:scale-105"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  )}

                  {user?.role === "superuser" && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => router.push("/admin")}
                      className="transition-all hover:scale-105"
                    >
                      <BarChart className="h-4 w-4" />
                    </Button>
                  )}

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
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <TravelSearch />
            <MyBookings />
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
