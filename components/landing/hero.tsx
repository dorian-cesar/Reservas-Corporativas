"use client";

import { ArrowRight, LogIn, User2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useUserStore } from "@/lib/user-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

/** Decodifica el JWT localmente y verifica que no esté vencido. */
function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as { exp?: number };
    if (!payload?.exp) return false;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function getRoleDestination(role: string): string {
  if (role === "superuser") return "/superuser";
  if (role === "admin") return "/admin";
  if (role === "empresa") return "/empresa";
  if (role === "auditoria") return "/auditoria";
  if (role === "contralor") return "/controller";
  if (role === "admincc") return "/admincc";
  return "/dashboard";
}

function getRoleLabel(role: string): string {
  if (role === "superuser") return "Super Usuario";
  if (role === "admin") return "Administrador";
  if (role === "empresa") return "Empresa";
  if (role === "auditoria") return "Auditoría";
  if (role === "contralor") return "Contralor";
  if (role === "admincc") return "Admin Centro de Costos";
  return "Usuario";
}

export function Hero() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated, user, _hasHydrated, token, logout } =
    useAuth();

  // Estado de la verificación remota del usuario (API)
  const { user: verifiedUser, loading: userLoading } = useUserStore();

  // Verificar token de forma síncrona para evitar flash de card con sesión inválida
  // Y además esperar a que la verificación remota haya finalizado con éxito
  const isValidSession =
    _hasHydrated &&
    isAuthenticated &&
    isTokenValid(token) &&
    !userLoading &&
    verifiedUser !== null;

  // Limpiar store si el token venció o está corrupto
  useEffect(() => {
    if (_hasHydrated && isAuthenticated && !isTokenValid(token)) {
      logout();
    }
  }, [_hasHydrated, isAuthenticated, token, logout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);

      if (!result.success) {
        if (result.requiresPasswordUpdate) {
          router.push(
            `/change-password?userId=${result.passwordUpdateUserId}&reason=${result.passwordUpdateReason}&email=${encodeURIComponent(email)}`,
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
      router.push(getRoleDestination(role));
    } catch (err) {
      setError("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    const role = user?.role ?? "user";
    router.push(getRoleDestination(role));
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-24 md:pt-0">
      <div className="absolute inset-0">
        <img
          src="/images/hero-bus.png"
          alt="Bus Pullman en carretera chilena"
          className="h-full w-full object-cover object-[center_85%]"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-background to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-8rem)]">
          {/* Columna izquierda - Texto */}
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight text-balance drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
              Reservas corporativas{" "}
              <span className="text-white/70">simplificadas y controladas</span>
            </h1>

            <p className="mt-5 text-lg text-white/80 leading-relaxed max-w-xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
              Plataforma integral para gestionar viajes y reservas de tu
              empresa. Control presupuestario, reportes en tiempo real y
              beneficios exclusivos en un solo lugar.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="rounded-full bg-secondary-pullman hover:bg-secondary-pullman/90 text-white font-semibold px-8 cursor-pointer"
                onClick={() => scrollToSection("contacto")}
              >
                Solicitar información
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Columna derecha - Card de login o bienvenida */}
          <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
            <div className="backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/30 bg-white/10 shadow-xl">
              {/* Estado: aún hidratando el store → skeleton sutil */}
              {!_hasHydrated && (
                <div className="space-y-4 animate-pulse">
                  <div className="h-7 bg-white/20 rounded-lg w-3/4 mx-auto" />
                  <div className="h-4 bg-white/10 rounded w-2/3 mx-auto" />
                  <div className="h-10 bg-white/20 rounded-lg mt-6" />
                  <div className="h-10 bg-white/20 rounded-lg" />
                  <div className="h-10 bg-white/20 rounded-lg" />
                </div>
              )}

              {/* Estado: hidratado y autenticado con token válido → card de bienvenida */}
              {isValidSession && user && (
                <div className="flex flex-col items-center text-center gap-5">
                  {/* Avatar / icono */}
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/20 border border-white/30 shadow-inner">
                    <User2 className="w-8 h-8 text-white/90" />
                  </div>

                  <div>
                    <p className="text-sm text-white/70 uppercase tracking-widest font-medium">
                      Sesión activa
                    </p>
                    <h2 className="text-2xl font-bold text-white mt-1 leading-tight">
                      {user.name}
                    </h2>
                    <span className="inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full bg-white/20 border border-white/25 text-white/80">
                      {getRoleLabel(user.role)}
                    </span>
                    {user.companyName && (
                      <p className="mt-2 text-sm text-white/60">
                        {user.companyName}
                      </p>
                    )}
                  </div>

                  <Button
                    size="lg"
                    onClick={handleContinue}
                    className="w-full bg-primary-pullman hover:bg-primary-pullman/90 text-white font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] gap-2"
                  >
                    Ingresar a la plataforma
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Estado: hidratado y sin sesión válida (no autenticado o token vencido) → formulario de login */}
              {_hasHydrated && !isValidSession && (
                <>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      Iniciar Sesión
                    </h2>
                    <p className="text-sm text-white/80 mt-1">
                      Ingresa tus credenciales para acceder al sistema
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <Alert
                        variant="destructive"
                        className="animate-in fade-in slide-in-from-top-2 bg-red-500/10 border-red-500/30 text-white"
                      >
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white/90">
                        Correo Electrónico
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@empresa.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="transition-all duration-200 focus:scale-[1.01] bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white/90">
                        Contraseña
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="transition-all duration-200 focus:scale-[1.01] pr-10 bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/30"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/90"
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
                      className="w-full bg-primary-pullman hover:bg-primary-pullman/90 text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      disabled={loading}
                    >
                      {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
