"use client";

import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EmpresaPage() {
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <AuthGuard allowedRoles={["empresa"]}>
      <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-600 animate-pulse">
              <AlertCircle className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">
              Rol No Asignado
            </CardTitle>
            <CardDescription>Configuración de cuenta pendiente</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6 pt-4">
            <p className="text-muted-foreground text-sm leading-relaxed">
              El Administrador tiene que asignarle un rol y una empresa asociada
              para poder acceder a las herramientas corporativas.
            </p>
            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full gap-2 hover:bg-accent"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
              >
                Cerrar Sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
