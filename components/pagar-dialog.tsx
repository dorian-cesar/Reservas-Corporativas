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
        tipo_movimiento?: 'abono' | 'cargo';
    } | null;
    token: string | null;
    onSuccess: () => void;
}

export function PagarDialog({ open, onOpenChange, movimiento, token, onSuccess }: Props) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [referenciaPago, setReferenciaPago] = useState("");

    const getReferenciaCuenta = () => {
        if (!movimiento) return "";
        if (movimiento.referencia) return movimiento.referencia;

        const tipo = movimiento.tipo_movimiento === 'abono' ? 'AB' : 'CA';
        return `${tipo}-${movimiento.id.toString().padStart(4, '0')}`;
    };

    const handlePagar = async () => {
        if (!movimiento) return;

        try {
            setLoading(true);

            const res = await fetch("/api/current-accounts/pagar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    movimientoId: movimiento.id,
                    monto: movimiento.monto,
                    referenciaPago: referenciaPago || undefined
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
            setConfirmOpen(false);
            setReferenciaPago("");
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
        <>
            <Dialog open={open} onOpenChange={(isOpen) => {
                if (!isOpen) {
                    setReferenciaPago("");
                }
                onOpenChange(isOpen);
            }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Registrar Pago</DialogTitle>
                        <DialogDescription>
                            Complete los detalles para registrar el pago del cargo
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="p-3 bg-gray-50 rounded-md space-y-2">
                            <p className="text-sm font-medium">
                                {movimiento.descripcion || "Cargo sin descripción"}
                            </p>
                            <p className="text-sm text-gray-600">
                                Monto: <span className="font-bold">{formatCurrency(movimiento.monto)}</span>
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="referencia-cuenta">Referencia de cuenta</Label>
                            <Input
                                id="referencia-cuenta"
                                value={getReferenciaCuenta()}
                                disabled
                                className="bg-gray-100 cursor-not-allowed"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="monto">Monto a pagar</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="monto"
                                    type="text"
                                    value={formatCurrency(movimiento.monto)}
                                    disabled
                                    className="pl-10 bg-gray-100 cursor-not-allowed font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="referencia-pago">Referencia del pago *</Label>
                            <Input
                                id="referencia-pago"
                                placeholder="Ej: TRANSFER-001, CHEQUE-456, DEPOSITO-789"
                                value={referenciaPago}
                                onChange={(e) => setReferenciaPago(e.target.value)}
                                className="font-medium"
                            />
                            <p className="text-xs text-gray-500">
                                Ingrese una referencia para identificar este pago (ej: número de transferencia, cheque, etc.)
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
                            onClick={() => setConfirmOpen(true)}
                            disabled={loading || !referenciaPago.trim()}
                        >
                            {loading ? "Procesando..." : "Continuar con el pago"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Confirmar Pago</DialogTitle>
                        <DialogDescription>
                            ¿Está seguro de que desea registrar este pago?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-sm font-medium text-yellow-800">
                                Monto: {formatCurrency(movimiento.monto)}
                            </p>
                            <p className="text-sm text-yellow-700 mt-1">
                                Referencia: {referenciaPago}
                            </p>
                        </div>
                        <p className="text-sm text-gray-600 mt-3">
                            Esta acción marcará el cargo como pagado y creará un abono correspondiente.
                        </p>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setConfirmOpen(false)}
                            disabled={loading}
                        >
                            No, cancelar
                        </Button>
                        <Button
                            onClick={handlePagar}
                            disabled={loading}
                        >
                            {loading ? "Procesando..." : "Sí, registrar pago"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}