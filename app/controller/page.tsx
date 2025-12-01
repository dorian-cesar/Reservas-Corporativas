"use client";

import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Users, Ticket, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { CompanyUsers } from "@/components/company-users";
import { CompanyBookings } from "@/components/company-bookings";
import { CompanyStats } from "@/components/company-stats";

export default function ControllerPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <AuthGuard allowedRoles={["contralor"]}>
      <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-secondary/5">
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
                  <h1 className="text-xl font-bold">Panel de Controlador</h1>
                  <p className="text-sm text-muted-foreground">
                    {user?.companyName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">Controlador</p>
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
            <CompanyStats />

            <Tabs defaultValue="bookings" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="bookings" className="gap-2">
                  <Ticket className="h-4 w-4" />
                  Reservas
                </TabsTrigger>
                <TabsTrigger value="users" className="gap-2">
                  <Users className="h-4 w-4" />
                  Usuarios
                </TabsTrigger>
              </TabsList>

              <TabsContent value="bookings" className="mt-6">
                <CompanyBookings />
              </TabsContent>

              <TabsContent value="users" className="mt-6">
                <CompanyUsers />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
