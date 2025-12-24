"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);

      if (!result.success) {
        if (result.requiresPasswordUpdate) {
          router.push(
            `/change-password?userId=${result.passwordUpdateUserId}&reason=${result.passwordUpdateReason}&email=${encodeURIComponent(email)}`
          );
          return;
        }

        setError(result.message ?? "Credenciales inválidas");
        return;
      }

      if (result.requiresVerification) {
        router.push("/verify-otp");
        return;
      }

      const currentUser = useAuth.getState().user;
      const role = currentUser?.role ?? "user";

      if (role === "superuser") {
        router.push("/superuser");
      } else if (role === "admin") {
        router.push("/admin");
      } else if (role === "empresa") {
        router.push("/empresa");
      } else if (role === "auditoria") {
        router.push("/auditoria");
      } else if (role === "contralor") {
        router.push("/controller");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-linear-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-center mb-8">
          <div className="flex flex-col items-center gap-2 text-primary">
            <Image
              src="/logo-pullman.png"
              alt="Logo Pullman"
              width={300}
              height={100}
              className="object-contain"
            />
            <div>
              <p className="text-sm text-muted-foreground">
                Reservas Corporativas
              </p>
            </div>
          </div>
        </div>

        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert
                  variant="destructive"
                  className="animate-in fade-in slide-in-from-top-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="transition-all duration-200 focus:scale-[1.01]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>

                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="transition-all duration-200 focus:scale-[1.01] pr-10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>

            {/* <div className="mt-6 p-4 bg-muted rounded-lg space-y-2 text-sm">
              <p className="font-medium text-foreground">Usuarios de prueba:</p>
              <div className="space-y-1 text-muted-foreground">
                <p>👤 Usuario: user@wit.la / 123456</p>
                <p>👔 Controlador: controlador@wit.la / 123456</p>
                <p>⚡ SuperUser: super@wit.la / 123456</p>
              </div>
            </div> */}
          </CardContent>
        </Card>
      </div>

      <img
        src="/logo-wit-dark.png"
        alt="Logo Wit"
        className="absolute bottom-5 right-5 h-12 w-auto"
      />
    </div>
  );
}
