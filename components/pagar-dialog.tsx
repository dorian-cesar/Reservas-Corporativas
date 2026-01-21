"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { DollarSign } from "lucide-react"

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    movimiento: {
        id: number;
        descripcion?: string;
        monto: number;
        referencia?: string;
        pagado?: boolean;
    } | null;
    token: string | null;
    onSuccess: () => void;
}

export function SimplePagarDialog({ open, onOpenChange, movimiento, token, onSuccess }: Props) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [monto, setMonto] = useState(movimiento?.monto.toString() || "");

    const handlePagar = async () => {
        if (!movimiento || !monto) {
            toast({
                title: "Error",
                description: "Por favor ingrese un monto",
                variant: "destructive",
            });
            return;
        }

        // Verificar si ya está pagado
        if (movimiento.pagado) {
            toast({
                title: "Atención",
                description: "Este movimiento ya está marcado como pagado",
                variant: "destructive",
            });
            return;
        }

        const montoNumerico = parseFloat(monto);
        if (montoNumerico <= 0) {
            toast({
                title: "Error",
                description: "El monto debe ser mayor a 0",
                variant: "destructive",
            });
            return;
        }

        // Verificar que el monto no supere el monto del cargo
        if (montoNumerico > movimiento.monto) {
            toast({
                title: "Error",
                description: `El monto no puede superar ${movimiento.monto.toLocaleString('es-CL')}`,
                variant: "destructive",
            });
            return;
        }

        try {
            setLoading(true);

            // Llamar al endpoint simple
            const res = await fetch("/api/current-accounts/pagar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    movimientoId: movimiento.id,
                    monto: montoNumerico
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Error al procesar el pago");
            }

            toast({
                title: "✅ Pago registrado",
                description: "El cargo ha sido marcado como pagado y se creó un abono correspondiente",
            });

            onOpenChange(false);
            onSuccess();
        } catch (err) {
            console.error(err);
            toast({
                title: "Error",
                description: (err as Error).message || "No se pudo procesar el pago",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (!movimiento) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Marcar Cargo como Pagado</DialogTitle>
                    <DialogDescription>
                        Cargo #{movimiento.id} - Monto: {formatCurrency(movimiento.monto)}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Info simple */}
                    <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-600">
                            {movimiento.descripcion || "Cargo sin descripción"}
                        </p>
                        {movimiento.referencia && (
                            <p className="text-xs text-gray-500 mt-1">
                                Ref: {movimiento.referencia}
                            </p>
                        )}
                    </div>

                    {/* Monto a pagar */}
                    <div className="space-y-2">
                        <Label>Monto pagado</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                type="number"
                                value={monto}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    const maxMonto = Math.trunc(movimiento.monto);
                                    const numValue = Math.trunc(Number(value));

                                    if (!isNaN(numValue) && numValue > maxMonto) {
                                        setMonto(maxMonto.toString());
                                    } else {
                                        setMonto(value === "" ? "" : numValue.toString());
                                    }
                                }}
                                className="pl-10 text-lg"
                                placeholder="0"
                                min="1"
                                max={Math.trunc(movimiento.monto)}
                                step="1"
                            />
                        </div>
                        <p className="text-xs text-gray-500">
                            Máximo permitido: {formatCurrency(movimiento.monto)}
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handlePagar}
                        disabled={loading || !monto || parseFloat(monto) <= 0}
                    >
                        {loading ? "Procesando..." : "Marcar como Pagado"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}