"use client"

import { useState, useRef } from "react"
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
import { DollarSign, Paperclip, Upload, CheckCircle2, X } from "lucide-react"

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
        monto_a_pagar?: number;
        descuento_aplicado?: {
            porcentaje: number;
            monto_descuento: number;
            monto_original: number;
            monto_final: number;
        } | null;
    } | null;
    token: string | null;
    onSuccess: () => void;
}

export function PagarDialog({ open, onOpenChange, movimiento, token, onSuccess }: Props) {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [metodoPago, setMetodoPago] = useState<string>("Transferencia");
    const [numeroReferencia, setNumeroReferencia] = useState("");
    const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);

    const tieneDescuento = Boolean(
        movimiento?.descuento_aplicado || 
        (movimiento?.monto_a_pagar !== undefined && movimiento.monto_a_pagar < movimiento.monto)
    );

    const montoOriginal = movimiento?.descuento_aplicado?.monto_original ?? movimiento?.monto ?? 0;
    const montoDescuento = movimiento?.descuento_aplicado?.monto_descuento ?? (tieneDescuento ? montoOriginal - (movimiento?.monto_a_pagar ?? 0) : 0);
    const porcentajeDescuento = movimiento?.descuento_aplicado?.porcentaje ?? (montoOriginal > 0 ? Math.round((montoDescuento / montoOriginal) * 100) : 0);
    const montoEfectivoPagar = movimiento?.monto_a_pagar ?? (tieneDescuento ? montoOriginal - montoDescuento : movimiento?.monto ?? 0);

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 25 * 1024 * 1024) {
                toast({
                    title: "Archivo muy pesado",
                    description: "El comprobante no debe superar los 25 MB",
                    variant: "destructive",
                });
                return;
            }
            setComprobanteFile(file);
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
                    monto: montoEfectivoPagar,
                    referenciaPago: refPagoFinal,
                    tipo_pago: metodoPago,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Error al procesar el pago");
            }

            // Si se adjuntó un archivo comprobante, subirlo al S3 (1 sola vez vinculado al abono o cargo)
            if (comprobanteFile) {
                const targetId = data?.pago?.id || movimiento.id;
                try {
                    const formDataPago = new FormData();
                    formDataPago.append("file", comprobanteFile);
                    formDataPago.append("tipo_documento", "Comprobante de Pago");
                    await fetch(`/api/current-accounts/${targetId}/adjuntos`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                        body: formDataPago,
                    });
                } catch (attachErr) {
                    console.warn("Advertencia al subir comprobante a S3:", attachErr);
                }
            }

            toast({
                title: "✅ Pago registrado",
                description: "El cargo ha sido marcado como pagado y se creó el abono correspondiente",
            });

            onOpenChange(false);
            setConfirmOpen(false);
            setNumeroReferencia("");
            setComprobanteFile(null);
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
                    setComprobanteFile(null);
                    setMetodoPago("Transferencia");
                }
                onOpenChange(isOpen);
            }}>
                <DialogContent className="sm:max-w-[520px] max-w-[95vw] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>Registrar Pago</DialogTitle>
                        <DialogDescription>
                            Complete los detalles para registrar el pago del cargo
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="p-3 bg-gray-50 rounded-md space-y-2 border border-gray-200">
                            <p className="text-sm font-medium">
                                {movimiento.descripcion || "Cargo sin descripción"}
                            </p>
                            <p className="text-sm text-gray-600">
                                Monto Cargo: <span className="font-bold">{formatCurrency(montoOriginal)}</span>
                            </p>
                        </div>

                        {/* Banner Informativo de Descuento si aplica */}
                        {tieneDescuento && (
                            <div className="p-3 bg-emerald-50/90 border border-emerald-300 rounded-lg space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        Descuento Aplicado ({porcentajeDescuento}%)
                                    </span>
                                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300">
                                        Ahorro: -{formatCurrency(montoDescuento)}
                                    </span>
                                </div>
                                <div className="text-xs text-emerald-950 divide-y divide-emerald-200/70 pt-1">
                                    <div className="flex justify-between py-1 text-muted-foreground">
                                        <span>Monto base original:</span>
                                        <span className="line-through">{formatCurrency(montoOriginal)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 text-emerald-700 font-semibold">
                                        <span>Descuento acordado ({porcentajeDescuento}%):</span>
                                        <span>-{formatCurrency(montoDescuento)}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 text-sm font-bold text-emerald-950">
                                        <span>Total Final con Descuento:</span>
                                        <span className="text-emerald-800 text-base">{formatCurrency(montoEfectivoPagar)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

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
                            <div className="flex justify-between items-center">
                                <Label htmlFor="monto">Monto a pagar</Label>
                                {tieneDescuento && (
                                    <span className="text-xs text-emerald-700 font-semibold">
                                        (Con {porcentajeDescuento}% de descuento incluido)
                                    </span>
                                )}
                            </div>
                            <div className="relative">
                                <DollarSign className={`absolute left-3 top-3 h-4 w-4 ${tieneDescuento ? "text-emerald-600 font-bold" : "text-gray-400"}`} />
                                <Input
                                    id="monto"
                                    type="text"
                                    value={formatCurrency(montoEfectivoPagar)}
                                    disabled
                                    className={`pl-10 bg-gray-100 cursor-not-allowed font-bold text-base ${tieneDescuento ? "text-emerald-900 border-emerald-200" : "font-medium"}`}
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

                        {/* Adjuntar Comprobante de Pago Opcional */}
                        <div className="space-y-2 pt-1">
                            <Label className="text-xs font-semibold flex items-center gap-1.5 text-slate-700">
                                <Paperclip className="h-3.5 w-3.5 text-primary" />
                                Adjuntar Comprobante / Respaldo (Opcional)
                            </Label>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
                            />

                            {comprobanteFile ? (
                                <div className="flex items-center justify-between p-2.5 bg-green-50/70 border border-green-200 rounded-lg text-xs gap-2 w-full max-w-full overflow-hidden">
                                    <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                        <span
                                            className="font-medium text-green-950 truncate block max-w-[260px] sm:max-w-[380px]"
                                            title={comprobanteFile.name}
                                        >
                                            {comprobanteFile.name}
                                        </span>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setComprobanteFile(null);
                                            if (fileInputRef.current) fileInputRef.current.value = "";
                                        }}
                                        className="h-6 w-6 p-0 text-red-500 hover:bg-red-100 hover:text-red-700 shrink-0"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full justify-center h-9 text-xs border-dashed border-slate-300 text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-900"
                                >
                                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                                    Seleccionar archivo de comprobante (PDF, Imagen, etc.)
                                </Button>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                            className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
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
                <DialogContent className="sm:max-w-[400px] max-w-[95vw] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>Confirmar Pago</DialogTitle>
                        <DialogDescription>
                            ¿Está seguro de que desea registrar este pago?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md space-y-1">
                            <p className="text-sm font-bold text-yellow-900">
                                Monto a Pagar: {formatCurrency(montoEfectivoPagar)}
                            </p>
                            {tieneDescuento && (
                                <p className="text-xs text-emerald-800 font-semibold">
                                    Descuento aplicado: -{formatCurrency(montoDescuento)} ({porcentajeDescuento}%)
                                </p>
                            )}
                            <p className="text-sm text-yellow-800">
                                Método: <span className="font-semibold">{metodoPago}</span>
                            </p>
                            <p className="text-sm text-yellow-700">
                                Referencia: {numeroReferencia}
                            </p>
                            {comprobanteFile && (
                                <p className="text-xs text-green-700 font-medium pt-1 flex items-center gap-1 min-w-0 max-w-full overflow-hidden">
                                    <Paperclip className="h-3 w-3 shrink-0" />
                                    <span
                                        className="truncate block max-w-[230px] sm:max-w-[290px]"
                                        title={comprobanteFile.name}
                                    >
                                        Comprobante adjunto: {comprobanteFile.name}
                                    </span>
                                </p>
                            )}
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
                            className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
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