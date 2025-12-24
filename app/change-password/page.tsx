"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, AlertCircle, ShieldCheck, InfoIcon, X } from "lucide-react";
import Image from "next/image";
import { usePasswordUpdateState, useAuth } from "@/lib/auth";

export default function ChangePasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showNotification, setShowNotification] = useState(true);

    const { clearPasswordUpdateState } = usePasswordUpdateState();
    const { login } = useAuth();

    const userId = searchParams.get("userId");
    const reason = searchParams.get("reason");
    const email = searchParams.get("email");

    useEffect(() => {
        clearPasswordUpdateState();

        if (!userId || !reason) {
            router.push("/login");
        }
    }, [userId, reason, router, clearPasswordUpdateState]);

    const getReasonMessage = () => {
        switch (reason) {
            case "new_login_policy":
                return {
                    title: "Nueva política de seguridad",
                    description: "Tu empresa ha implementado una nueva política de seguridad que requiere actualizar tu contraseña por una más segura.",
                    type: "info"
                };
            case "password_expired":
                return {
                    title: "Contraseña expirada",
                    description: "Por motivos de seguridad, tu contraseña ha expirado después de 90 días. Debes crear una nueva.",
                    type: "warning"
                };
            case "suspicious_activity":
                return {
                    title: "Actividad sospechosa detectada",
                    description: "Por seguridad, debes cambiar tu contraseña debido a actividad inusual detectada en tu cuenta.",
                    type: "destructive"
                };
            default:
                return {
                    title: "Actualización requerida",
                    description: "Se requiere actualizar tu contraseña por motivos de seguridad.",
                    type: "info"
                };
        }
    };


    const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
        const errors: string[] = [];

        // Longitud mínima: 14 caracteres
        if (password.length < 14) {
            errors.push("Debe tener al menos 14 caracteres");
        }

        // Debe incluir letras mayúsculas
        if (!/[A-Z]/.test(password)) {
            errors.push("Debe incluir al menos una letra mayúscula");
        }

        // Debe incluir letras minúsculas
        if (!/[a-z]/.test(password)) {
            errors.push("Debe incluir al menos una letra minúscula");
        }

        // Debe incluir números
        if (!/\d/.test(password)) {
            errors.push("Debe incluir al menos un número");
        }

        // Debe incluir símbolos
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push("Debe incluir al menos un símbolo especial");
        }

        // No permitir secuencias simples
        const sequences = ["123456", "234567", "345678", "456789", "567890", "abcdef", "bcdefg"];
        if (sequences.some(seq => password.toLowerCase().includes(seq))) {
            errors.push("No puede contener secuencias simples");
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    };

    const reasonMessage = getReasonMessage();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            // Validar que las contraseñas coincidan
            if (newPassword !== confirmPassword) {
                setError("Las contraseñas no coinciden");
                setLoading(false);
                return;
            }

            // Validar requisitos de la nueva contraseña
            const validation = validatePassword(newPassword);
            if (!validation.isValid) {
                setError(`La contraseña no cumple los requisitos: ${validation.errors.join(", ")}`);
                setLoading(false);
                return;
            }

            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    currentPassword,
                    newPassword
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Error al cambiar la contraseña");
                setLoading(false);
                return;
            }

            setSuccess("Contraseña actualizada exitosamente");
            router.replace("/login");

        } catch (err) {
            setError("Error de conexión con el servidor");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!userId || !reason) {
        return null;
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-purple-50 p-4">
            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
                {showNotification && (
                    <Alert className="bg-blue-50 border-blue-200 text-blue-800 mb-5">
                        <InfoIcon className="h-4 w-4 text-blue-600" />

                        <div>
                            <p className="font-semibold text-sm">
                                {reasonMessage.title}
                            </p>
                            <p className="text-sm mt-1">
                                {reasonMessage.description}
                            </p>
                        </div>

                        <button
                            onClick={() => setShowNotification(false)}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </Alert>

                )}
                <Card className="border-2 shadow-xl">
                    <div className="h-2 bg-primary"></div>

                    <CardHeader>
                        <CardTitle className="text-center">Actualizar Contraseña</CardTitle>
                        <CardDescription className="text-center">

                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive" className="animate-in fade-in">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {success && (
                                <Alert className="bg-green-50 border-green-200 animate-in fade-in">
                                    <ShieldCheck className="h-4 w-4 text-green-600" />
                                    <AlertDescription className="text-green-700">
                                        {success}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Contraseña Actual</Label>
                                <div className="relative">
                                    <Input
                                        id="currentPassword"
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showCurrentPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showNewPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                                <div className="flex items-center gap-2 text-blue-800">
                                    <InfoIcon className="h-4 w-4" />
                                    <p className="font-medium text-sm">Requisitos de Contraseña</p>
                                </div>
                                <ul className="text-xs text-blue-700 space-y-1">
                                    <li className="flex items-start gap-1">
                                        <span className={`inline-block h-1.5 w-1.5 rounded-full mt-1 ${newPassword.length >= 14 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        Mínimo 14 caracteres
                                    </li>
                                    <li className="flex items-start gap-1">
                                        <span className={`inline-block h-1.5 w-1.5 rounded-full mt-1 ${/[A-Z]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        Al menos una mayúscula
                                    </li>
                                    <li className="flex items-start gap-1">
                                        <span className={`inline-block h-1.5 w-1.5 rounded-full mt-1 ${/[a-z]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        Al menos una minúscula
                                    </li>
                                    <li className="flex items-start gap-1">
                                        <span className={`inline-block h-1.5 w-1.5 rounded-full mt-1 ${/\d/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        Al menos un número
                                    </li>
                                    <li className="flex items-start gap-1">
                                        <span className={`inline-block h-1.5 w-1.5 rounded-full mt-1 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        Al menos un símbolo especial
                                    </li>
                                </ul>
                            </div>

                            <Button
                                type="submit"
                                className="w-full text-white"
                                disabled={loading}
                            >
                                {loading ? "Actualizando..." : "Actualizar Contraseña"}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-2">
                        <p className="text-xs text-gray-500 text-center">
                            Después de actualizar tu contraseña, serás redirigido automáticamente
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => router.push("/login")}
                        >
                            Volver al Login
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}