"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { AlertCircle, Mail, Shield, KeyRound, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function VerifyOtpPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const { verifyOtp, pendingUserId, pendingUserEmail, resendOtp } = useAuth();

  const RESEND_COOLDOWN = 120; // 2 minutos

  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    setCanResend(false);
    setResendCooldown(RESEND_COOLDOWN);

    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleVerify = async () => {
    if (!pendingUserId) return;

    setIsLoading(true);
    setError("");

    const result = await verifyOtp(code);

    if (!result.success) {
      setError(result.message ?? "Código inválido");
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
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
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError("");

    const result = await resendOtp();

    if (!result.success) {
      setError(result.message ?? "Error al reenviar código");
      setIsLoading(false);
      return;
    }

    setCanResend(false);
    setResendCooldown(RESEND_COOLDOWN);

    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setIsLoading(false);
  };

  const handleBackToLogin = () => {
    router.push("/login");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 overflow-hidden">
          <div className="h-2 bg-primary"></div>

          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-blue-600" />
              Verificación en Dos Pasos
            </CardTitle>
            <CardDescription className="text-gray-600">
              Hemos enviado un código de 6 dígitos a tu correo
              {pendingUserEmail && (
                <span className="block mt-1 font-medium text-gray-900 bg-blue-50 p-2 rounded-md">
                  <Mail className="inline h-4 w-4 mr-2" />
                  {pendingUserEmail}
                </span>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="animate-in fade-in">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Ingresa el código de 6 dígitos que recibiste
                </p>

                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={code}
                    onChange={(value) => {
                      setCode(value);
                      setError("");
                    }}
                  >
                    <InputOTPGroup className="gap-2">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <InputOTPSlot
                          key={index}
                          index={index}
                          className={`
                                                        w-14 h-14 text-2xl font-bold
                                                        border-2 transition-all duration-200
                                                        ${
                                                          code[index]
                                                            ? "bg-blue-50 border-blue-400"
                                                            : "bg-white border-gray-300"
                                                        }
                                                        rounded-xl
                                                        `}
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <p className="text-xs text-gray-500 mt-4">
                  El código expirará en 10 minutos
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleVerify}
                disabled={code.length !== 6 || isLoading}
                className="w-full py-6 text-base font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Verificando...
                  </span>
                ) : (
                  "Verificar y Continuar"
                )}
              </Button>

              <Button
                onClick={handleResendCode}
                variant="outline"
                disabled={!canResend || isLoading}
                className="w-full border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <Mail className="h-4 w-4 mr-2" />
                {canResend
                  ? "Reenviar código"
                  : `Reenviar disponible en ${formatTime(resendCooldown)}`}
              </Button>

              <Button
                onClick={handleBackToLogin}
                variant="ghost"
                disabled={isLoading}
                className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al inicio de sesión
              </Button>
            </div>
          </CardContent>

          <CardFooter className="pt-2 border-t">
            <div className="text-center w-full">
              <p className="text-xs text-gray-500">
                ¿Problemas para recibir el código?{" "}
                <a
                  href="mailto:soporte@empresa.com"
                  className="text-blue-600 hover:text-blue-800 font-medium underline"
                >
                  Contactar soporte
                </a>
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Este código es único y solo válido para esta sesión
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
