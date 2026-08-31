"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { DollarSign } from "lucide-react"

const METODOS_PAGO = [
    "Transferencia",
    "Efectivo",
    "Factorial",
    "Cheque",
    "Vale Vista",
    "Pagaré",
] as const;

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
    const [metodoPago, setMetodoPago] = useState<string>("Transferencia");
    const [numeroReferencia, setNumeroReferencia] = useState("");

    const getReferenciaCuenta = () => {
        if (!movimiento) return "";
        if (movimiento.referencia) return movimiento.referencia;

        const tipo = movimiento.tipo_movimiento === 'abono' ? 'AB' : 'CA';
        return `${tipo}-${movimiento.id.toString().padStart(4, '0')}`;
    };

    const getReferenciaLabel = (metodo: string) => {
        switch (metodo) {
            case "Transferencia":
                return "Número de Referencia Transferencia *";
            case "Efectivo":
                return "Número de Referencia Comprobante Efectivo *";
            case "Factorial":
                return "Número de Referencia Factorial *";
            case "Cheque":
                return "Número de Referencia Cheque *";
            case "Vale Vista":
                return "Número de Referencia Vale Vista *";
            case "Pagaré":
                return "Número de Referencia Pagaré *";
            default:
                return `Número de Referencia ${metodo} *`;
        }
    };

    const getReferenciaPlaceholder = (metodo: string) => {
        switch (metodo) {
            case "Transferencia":
                return "Ej: N° de transferencia bancaria";
            case "Efectivo":
                return "Ej: N° de recibo o comprobante";
            case "Factorial":
                return "Ej: N° de operación factorial";
            case "Cheque":
                return "Ej: N° de cheque";
            case "Vale Vista":
                return "Ej: N° de vale vista";
            case "Pagaré":
                return "Ej: N° de pagaré";
            default:
                return "Ingrese el número de referencia";
        }
    };

    const handlePagar = async () => {
        if (!movimiento) return;

        try {
            setLoading(true);

            const refPagoFinal = `${metodoPago}: ${numeroReferencia.trim().toUpperCase()}`;

            const res = await fetch("/api/current-accounts/pagar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    movimientoId: movimiento.id,
                    monto: movimiento.monto,
                    referenciaPago: refPagoFinal,
                    tipo_pago: metodoPago,
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
            setNumeroReferencia("");
            setMetodoPago("Transferencia");
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
                    setNumeroReferencia("");
                    setMetodoPago("Transferencia");
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

                        {/* Selector de Método de Pago */}
                        <div className="space-y-2">
                            <Label htmlFor="metodo-pago">Método de Pago *</Label>
                            <Select
                                value={metodoPago}
                                onValueChange={(val) => setMetodoPago(val)}
                            >
                                <SelectTrigger id="metodo-pago" className="w-full bg-white font-normal">
                                    <SelectValue placeholder="Seleccione método de pago" />
                                </SelectTrigger>
                                <SelectContent>
                                    {METODOS_PAGO.map((metodo) => (
                                        <SelectItem key={metodo} value={metodo}>
                                            {metodo}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Input dinámico para Número de Referencia */}
                        <div className="space-y-2">
                            <Label htmlFor="numero-referencia">
                                {getReferenciaLabel(metodoPago)}
                            </Label>
                            <Input
                                id="numero-referencia"
                                placeholder={getReferenciaPlaceholder(metodoPago)}
                                value={numeroReferencia}
                                onChange={(e) => setNumeroReferencia(e.target.value.toUpperCase())}
                                className="font-medium uppercase"
                            />
                            <p className="text-xs text-gray-500">
                                Ingrese el número de respaldo para el pago ({metodoPago.toLowerCase()})
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
                            disabled={loading || !numeroReferencia.trim()}
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
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md space-y-1">
                            <p className="text-sm font-medium text-yellow-800">
                                Monto: {formatCurrency(movimiento.monto)}
                            </p>
                            <p className="text-sm text-yellow-800">
                                Método: <span className="font-semibold">{metodoPago}</span>
                            </p>
                            <p className="text-sm text-yellow-700">
                                Referencia: {numeroReferencia}
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