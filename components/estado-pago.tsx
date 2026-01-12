"use client"

import { useAuth } from "@/lib/auth";
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Download,
    Calendar,
    Building2,
    CheckCircle,
    XCircle,
    FileText,
    DollarSign,
    RefreshCcw,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
    Table as UITable,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import * as XLSX from "xlsx";
import ToolBar from "./tool-bar";

import { Eye } from "lucide-react";

type EstadoCuentaType = {
    id: number;
    empresa_id: number;
    periodo: string;
    fecha_inicio?: string;  // CAMBIO: De fecha_vencimiento a fecha_inicio
    fecha_fin?: string;     // CAMBIO: De fecha_facturacion a fecha_fin
    fecha_generacion: string;
    total_tickets: number;
    total_tickets_anulados: number;
    monto_facturado: string;
    detalle_por_cc: string;
    pagado: boolean;
    fecha_pago?: string;
    suma_devoluciones?: number; // NUEVO: Campo añadido
};

export function EstadoPago() {
    const { token } = useAuth.getState();
    const [estadosCuenta, setEstadosCuenta] = useState<EstadoCuentaType[]>([]);
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"cards" | "table">("table");
    const [dateDesde, setDateDesde] = useState<string>("");
    const [dateHasta, setDateHasta] = useState<string>("");
    const [empresaId, setEmpresaId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [companies, setCompanies] = useState<{ id: string; nombre: string }[]>([]);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
    const [selectedCuenta, setSelectedCuenta] = useState<EstadoCuentaType | null>(null);
    const [tickets, setTickets] = useState<any[]>([]);
    const [isLoadingTickets, setIsLoadingTickets] = useState(false);
    const [loadingCompanies, setLoadingCompanies] = useState(false);

    const [ticketsPagination, setTicketsPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
    });


    const { toast } = useToast();

    const fetchTimeoutRef = useRef<number | null>(null);

    useEffect(() => { fetchCompanies(); }, []);

    useEffect(() => {
        if (!empresaId) { setEstadosCuenta([]); return; }
        if (fetchTimeoutRef.current) window.clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = window.setTimeout(() => {
            fetchEstadosCuenta(Number(empresaId), { desde: dateDesde, hasta: dateHasta });
        }, 500);
        return () => { if (fetchTimeoutRef.current) window.clearTimeout(fetchTimeoutRef.current); }
    }, [empresaId, dateDesde, dateHasta]);

    useEffect(() => {
        if (!isDetailDialogOpen) {
            setTickets([]);
            setSelectedCuenta(null);
        }
    }, [isDetailDialogOpen]);

    const fetchCompanies = async () => {
        try {
            setLoadingCompanies(true)
            const res = await fetch("/api/companies", { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            setCompanies(data.map((c: any) => ({ id: c.id.toString(), nombre: c.nombre })));
            setLoadingCompanies(false)
        } catch {
            toast({ title: "Error", description: "No se pudieron cargar las empresas", variant: "destructive" });
            setLoadingCompanies(false)
        } finally {
            setLoadingCompanies(false)
        }
    };

    const fetchEstadosCuenta = async (targetEmpresaId: number, opts?: { desde?: string; hasta?: string }) => {
        setIsLoading(true);
        try {
            let url = `/api/estado-cuenta?empresaId=${targetEmpresaId}`;

            if (opts?.desde) url += `&desde=${opts.desde}`;
            if (opts?.hasta) url += `&hasta=${opts.hasta}`;

            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error("Error al obtener estados de cuenta");
            const data: EstadoCuentaType[] = await res.json();
            setEstadosCuenta(data);
        } catch (err) {
            toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
            setEstadosCuenta([]);
        } finally { setIsLoading(false); }
    };

    const fetchTicketsDeEstadoCuenta = async (estadoCuentaId: number, page?: number, limit?: number) => {
        setIsLoadingTickets(true);
        try {
            const pageToUse = page ?? ticketsPagination.page;
            const limitToUse = limit ?? ticketsPagination.limit;

            const res = await fetch(`/api/estado-cuenta/${estadoCuentaId}/tickets?page=${pageToUse}&limit=${limitToUse}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Error al obtener tickets");

            const response = await res.json();

            if (response.pagination) {
                setTickets(response.data || []);
                setTicketsPagination(prev => ({
                    ...prev,
                    page: response.pagination.page,
                    limit: response.pagination.limit,
                    total: response.pagination.total,
                    totalPages: response.pagination.totalPages,
                    hasNextPage: response.pagination.page < response.pagination.totalPages,
                    hasPrevPage: response.pagination.page > 1,
                }));
            } else {
                setTickets(response || []);
                setTicketsPagination(prev => ({
                    ...prev,
                    page: 1,
                    total: response.length,
                    totalPages: Math.ceil(response.length / prev.limit),
                    hasNextPage: false,
                    hasPrevPage: false,
                }));
            }

            return response;
        } catch (err) {
            toast({
                title: "Error",
                description: (err as Error).message,
                variant: "destructive"
            });
            setTickets([]);
            return [];
        } finally {
            setIsLoadingTickets(false);
        }
    };

    const openDetailDialog = async (cuentaId: number) => {
        const cuentaSeleccionada = estadosCuenta.find(ec => ec.id === cuentaId);
        if (!cuentaSeleccionada) return;

        setSelectedCuenta(cuentaSeleccionada);
        setIsDetailDialogOpen(true);

        setTicketsPagination(prev => ({
            ...prev,
            page: 1,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
        }));

        await fetchTicketsDeEstadoCuenta(cuentaId, 1, ticketsPagination.limit);
    };

    const handleTicketsPageChange = (newPage: number) => {
        if (!selectedCuenta) return;
        if (newPage < 1 || newPage > ticketsPagination.totalPages) return;

        setTicketsPagination(prev => ({ ...prev, page: newPage }));
        fetchTicketsDeEstadoCuenta(selectedCuenta.id, newPage, ticketsPagination.limit);
    };

    const handleTicketsLimitChange = (newLimit: number) => {
        if (!selectedCuenta) return;
        if (newLimit === ticketsPagination.limit) return;

        setTicketsPagination(prev => ({
            ...prev,
            page: 1,
            limit: newLimit
        }));
        fetchTicketsDeEstadoCuenta(selectedCuenta.id, 1, newLimit);
    };

    const formatCurrency = (amount: string | number) =>
        new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(Number(amount));

    const parseYMDLocal = (ymd: string): Date => {
        const parts = ymd.split('-').map(p => Number(p));
        if (parts.length !== 3 || parts.some(isNaN)) {
            // fallback: let the Date constructor try
            return new Date(ymd);
        }
        const [year, month, day] = parts;
        // new Date(year, monthIndex, day) crea la fecha en la zona local
        return new Date(year, month - 1, day);
    };

    const formatDate = (date?: string) => {
        if (!date) return "-";

        // Extrae solo YYYY-MM-DD desde cualquier formato común
        const match = date.match(/^(\d{4}-\d{2}-\d{2})/);
        if (!match) return date;

        const [year, month, day] = match[1].split("-");
        return `${day}-${month}-${year}`;
    };


    const exportToCSV = () => {
        if (estadosCuenta.length === 0) return;

        // ACTUALIZADO: Headers con nuevos campos
        const headers = ["Periodo", "Fecha Generación", "Fecha Inicio", "Fecha Fin", "Total Tickets", "Total Anulados", "Monto Facturado", "Devoluciones", "Fecha Pago"];

        const csvData = estadosCuenta.map(ec => [
            ec.periodo,
            formatDate(ec.fecha_generacion),
            formatDate(ec.fecha_inicio),
            formatDate(ec.fecha_fin),
            ec.total_tickets,
            ec.total_tickets_anulados,
            formatCurrency(ec.monto_facturado),
            formatCurrency(ec.suma_devoluciones || 0),
            // ec.pagado ? "Sí" : "No",
            formatDate(ec.fecha_pago)
        ]);

        const csvContent = [headers.join(","), ...csvData.map(row => row.map(f => `"${f}"`).join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `estados_cuenta_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        setIsExportDialogOpen(false);
        toast({ title: "Exportación exitosa", description: `Se exportaron ${estadosCuenta.length} registros a CSV` });
    };

    const exportToXLSX = () => {
        if (estadosCuenta.length === 0) return;

        // ACTUALIZADO: Datos con nuevos campos
        const data = estadosCuenta.map(ec => ({
            "Periodo": ec.periodo,
            "Fecha Generación": formatDate(ec.fecha_generacion),
            "Fecha Inicio": formatDate(ec.fecha_inicio),
            "Fecha Fin": formatDate(ec.fecha_fin),
            "Total Tickets": ec.total_tickets,
            "Total Anulados": ec.total_tickets_anulados,
            "Monto Facturado": formatCurrency(ec.monto_facturado),
            "Devoluciones": formatCurrency(ec.suma_devoluciones || 0),
            // "Pagado": ec.pagado ? "Sí" : "No",
            "Fecha Pago": formatDate(ec.fecha_pago)
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "EstadosCuenta");
        XLSX.writeFile(workbook, `estados_cuenta_${new Date().toISOString().split('T')[0]}.xlsx`);
        setIsExportDialogOpen(false);
        toast({ title: "Exportación exitosa", description: `Se exportaron ${estadosCuenta.length} registros a XLSX` });
    };
    const exportTicketsToCSV = (ticketsData: any[], cuenta: EstadoCuentaType | null) => {
        if (ticketsData.length === 0) return;

        const headers = ["Ticket #", "Fecha Compra", "Estado", "Origen", "Destino", "Fecha Viaje", "RUT Pasajero", "Nombre Pasajero", "Monto", "Centro De Costo", "Cta. Cte", "RUT Comprador", "Nombre Comprador"];
        const csvData = ticketsData.map(ticket => [
            ticket.pnrNumber || "",
            formatDate(ticket.confirmedAt) || "-",
            ticket.ticketStatus,
            ticket.terminal_origen || "",
            ticket.terminal_destino || "",
            `${formatDate(ticket.travelDate)} ${ticket.departureTime}`,
            ticket?.pasajero.rut || "",
            ticket?.pasajero.nombre || "",
            `$${ticket.monto_boleto.toLocaleString('es-CL')}`,
            ticket?.pasajero.id_centro_costo || "",
            ticket?.empresa.cuenta_corriente || "",
            ticket?.user.rut || "",
            ticket?.user.nombre || ""
        ]);

        const csvContent = [headers.join(","), ...csvData.map(row => row.map(f => `"${f}"`).join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `tickets_estado_cuenta_${cuenta?.periodo || 'sin_periodo'}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        toast({
            title: "Exportación exitosa",
            description: `Se exportaron ${ticketsData.length} tickets a CSV`
        });
    };

    const exportTicketsToXLSX = (ticketsData: any[], cuenta: EstadoCuentaType | null) => {
        if (ticketsData.length === 0) return;

        const data = ticketsData.map(ticket => ({
            "Ticket #": ticket.pnrNumber || "",
            "Fecha Compra": formatDate(ticket.confirmedAt) || "-",
            "Estado": ticket.ticketStatus,
            "Origen": ticket.terminal_origen || "",
            "Destino": ticket.terminal_destino || "",
            "Fecha Viaje": `${formatDate(ticket.travelDate)} ${ticket.departureTime}`,
            "RUT Pasajero": ticket?.pasajero.rut || "",
            "Nombre Pasajero": ticket?.pasajero.nombre || "",
            "Monto": `$${ticket.monto_boleto.toLocaleString('es-CL')}`,
            "Centro De Costo": ticket?.pasajero.id_centro_costo || "",
            "Cta. Cte": ticket?.empresa.cuenta_corriente || "",
            "RUT Comprador": ticket?.user.rut || "",
            "Nombre Comprador": ticket?.user.nombre || "",
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");
        XLSX.writeFile(workbook, `tickets_estado_cuenta_${cuenta?.periodo || 'sin_periodo'}_${new Date().toISOString().split('T')[0]}.xlsx`);

        toast({
            title: "Exportación exitosa",
            description: `Se exportaron ${ticketsData.length} tickets a XLSX`
        });
    };

    const exportAllTicketsToCSV = async (cuenta: EstadoCuentaType | null) => {
        if (!cuenta) return;

        try {
            // Obtener todos los tickets sin paginación
            const res = await fetch(`/api/estado-cuenta/${cuenta.id}/tickets`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Error al obtener tickets para exportación");

            const response = await res.json();
            const allTickets = response.data || response || [];

            if (allTickets.length === 0) {
                toast({
                    title: "Sin datos",
                    description: "No hay tickets para exportar",
                    variant: "destructive"
                });
                return;
            }

            const headers = ["Ticket #", "Fecha Compra", "Estado", "Origen", "Destino", "Fecha Viaje", "RUT Pasajero", "Nombre Pasajero", "Monto", "Centro De Costo", "Cta. Cte", "RUT Comprador", "Nombre Comprador"];
            const csvData = allTickets.map((ticket: any) => [
                ticket.pnrNumber || "",
                formatDate(ticket.confirmedAt) || "-",
                ticket.ticketStatus,
                ticket.terminal_origen || "",
                ticket.terminal_destino || "",
                `${formatDate(ticket.travelDate)} ${ticket.departureTime}`,
                ticket?.pasajero?.rut || "",
                ticket?.pasajero?.nombre || "",
                `$${ticket.monto_boleto?.toLocaleString('es-CL') || '0'}`,
                ticket?.pasajero?.id_centro_costo || "",
                ticket?.empresa?.cuenta_corriente || "",
                ticket?.user?.rut || "",
                ticket?.user?.nombre || ""
            ]);

            const csvContent = [headers.join(","), ...csvData.map((row: any[]) => row.map(f => `"${f}"`).join(","))].join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `tickets_estado_cuenta_${cuenta.periodo || 'sin_periodo'}_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();

            toast({
                title: "Exportación exitosa",
                description: `Se exportaron ${allTickets.length} tickets a CSV`
            });
        } catch (err) {
            toast({
                title: "Error",
                description: (err as Error).message,
                variant: "destructive"
            });
        }
    };

    const exportAllTicketsToXLSX = async (cuenta: EstadoCuentaType | null) => {
        if (!cuenta) return;

        try {
            // Obtener todos los tickets sin paginación
            const res = await fetch(`/api/estado-cuenta/${cuenta.id}/tickets`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Error al obtener tickets para exportación");

            const response = await res.json();
            const allTickets = response.data || response || [];

            if (allTickets.length === 0) {
                toast({
                    title: "Sin datos",
                    description: "No hay tickets para exportar",
                    variant: "destructive"
                });
                return;
            }

            const data = allTickets.map((ticket: any) => ({
                "Ticket #": ticket.pnrNumber || "",
                "Fecha Compra": formatDate(ticket.confirmedAt) || "-",
                "Estado": ticket.ticketStatus,
                "Origen": ticket.terminal_origen || "",
                "Destino": ticket.terminal_destino || "",
                "Fecha Viaje": `${formatDate(ticket.travelDate)} ${ticket.departureTime}`,
                "RUT Pasajero": ticket?.pasajero?.rut || "",
                "Nombre Pasajero": ticket?.pasajero?.nombre || "",
                "Monto": `$${ticket.monto_boleto?.toLocaleString('es-CL') || '0'}`,
                "Centro De Costo": ticket?.pasajero?.id_centro_costo || "",
                "Cta. Cte": ticket?.empresa?.cuenta_corriente || "",
                "RUT Comprador": ticket?.user?.rut || "",
                "Nombre Comprador": ticket?.user?.nombre || "",
            }));

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");
            XLSX.writeFile(workbook, `tickets_estado_cuenta_${cuenta.periodo || 'sin_periodo'}_${new Date().toISOString().split('T')[0]}.xlsx`);

            toast({
                title: "Exportación exitosa",
                description: `Se exportaron ${allTickets.length} tickets a XLSX`
            });
        } catch (err) {
            toast({
                title: "Error",
                description: (err as Error).message,
                variant: "destructive"
            });
        }
    };

    return (
        <div className="space-y-6">
            <ToolBar
                title="Estados de Cuenta"
                description="Visualice los estados de cuenta de cada empresa"
                viewMode={viewMode}
                setViewMode={setViewMode}
                showCompanySelect
                companies={companies}
                selectedCompany={empresaId}
                onCompanyChange={setEmpresaId}
                companySelectMode="combobox"
                companySelectPlaceholder="Selecciona una empresa..."
                loadingCompanies={loadingCompanies}

                refreshAction={() => empresaId && fetchEstadosCuenta(Number(empresaId), { desde: dateDesde, hasta: dateHasta })}
                secondaryAction={{
                    label: "Exportar",
                    icon: <Download className="h-4 w-4" />,
                    onClick: () => setIsExportDialogOpen(true),
                    disabled: !empresaId || estadosCuenta.length === 0
                }}
            />

            {!isLoading && !empresaId && (
                <Card>
                    <CardContent className="text-center py-12">
                        <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">Selecciona una empresa</h3>
                        <p className="text-muted-foreground">Selecciona una empresa para ver sus estados de cuenta</p>
                    </CardContent>
                </Card>
            )}
            {empresaId && !isLoading && (
                <Card>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="desde">Fecha Desde</Label>
                            <Input
                                id="desde"
                                type="date"
                                value={dateDesde}
                                onChange={(e) => setDateDesde(e.target.value)}
                                max={dateHasta || undefined} // Evita que desde sea mayor que hasta
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hasta">Fecha Hasta</Label>
                            <Input
                                id="hasta"
                                type="date"
                                value={dateHasta}
                                onChange={(e) => setDateHasta(e.target.value)}
                                min={dateDesde || undefined} // Evita que hasta sea menor que desde
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Resultados</Label>
                            <div className="text-sm text-muted-foreground pt-2">
                                {estadosCuenta.length} registros
                                {(dateDesde || dateHasta) && (
                                    <div className="text-xs">
                                        Filtrado por fecha
                                        {dateDesde && ` desde ${dateDesde}`}
                                        {dateHasta && ` hasta ${dateHasta}`}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {isLoading && (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Cargando estados de cuenta...</p>
                </div>
            )}

            {!isLoading && empresaId && estadosCuenta.length === 0 && (
                <Card>
                    <CardContent className="text-center py-12">
                        <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No hay estados de cuenta</h3>
                        <p className="text-muted-foreground mb-4">No se encontraron registros para la empresa seleccionada</p>
                    </CardContent>
                </Card>
            )}



            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Exportar Estados de Cuenta</DialogTitle>
                        <DialogDescription>Exporte los estados de cuenta ({estadosCuenta.length} registros)</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex gap-4">
                            <Button onClick={exportToCSV} className="flex-1 bg-accent hover:bg-accent/90">CSV</Button>
                            <Button onClick={exportToXLSX} className="flex-1 bg-accent hover:bg-accent/90">XLSX</Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>Cancelar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {!isLoading && estadosCuenta.length > 0 && viewMode === "table" && (
                <Card>
                    <CardContent className="p-0">
                        <UITable>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha Generación</TableHead>
                                    <TableHead>Período Facturación</TableHead>
                                    <TableHead>Total Tickets</TableHead>
                                    <TableHead>Total Anulados</TableHead>
                                    <TableHead>Monto Facturado</TableHead>
                                    <TableHead>Suma Devoluciones</TableHead>
                                    {/* <TableHead>Pagado</TableHead> */}
                                    <TableHead>Detalles</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {estadosCuenta.map(ec => (
                                    <TableRow key={ec.id} className="hover:bg-muted/50">
                                        <TableCell>{formatDate(ec.fecha_generacion)}</TableCell>
                                        <TableCell>
                                            {ec.fecha_inicio || ec.fecha_fin
                                                ? `${formatDate(ec.fecha_inicio)} - ${formatDate(ec.fecha_fin)}`
                                                : 'No definido'}
                                        </TableCell>
                                        <TableCell>{ec.total_tickets}</TableCell>
                                        <TableCell>{ec.total_tickets_anulados}</TableCell>
                                        <TableCell>{formatCurrency(ec.monto_facturado)}</TableCell>
                                        <TableCell>{formatCurrency(ec.suma_devoluciones ?? 0)}</TableCell>
                                        {/* <TableCell>{ec.pagado ? "Sí" : "No"}</TableCell> */}
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openDetailDialog(ec.id)}
                                                    className="h-8 px-3"
                                                >
                                                    <Eye className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </UITable>
                    </CardContent>
                </Card>
            )}

            {!isLoading && estadosCuenta.length > 0 && viewMode === "cards" && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {estadosCuenta.map((ec) => (
                        <Card key={ec.id} className="border-2 hover:border-primary transition-all duration-300 hover:shadow-xl">
                            <CardHeader>
                                <CardTitle>Periodo: {ec.periodo}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <p>Generación: {formatDate(ec.fecha_generacion)}</p>
                                <p>Período: {ec.fecha_inicio && ec.fecha_fin
                                    ? `${formatDate(ec.fecha_inicio)} - ${formatDate(ec.fecha_fin)}`
                                    : 'No definido'}</p>
                                <p>Total Tickets: {ec.total_tickets}</p>
                                <p>Anulados: {ec.total_tickets_anulados}</p>
                                <p>Monto: {formatCurrency(ec.monto_facturado)}</p>
                                <p>Devoluciones: {ec.suma_devoluciones ? formatCurrency(ec.suma_devoluciones) : '$0'}</p>
                                {/* <p>Pagado: {ec.pagado ? "Sí" : "No"}</p> */}
                                <p>Fecha Pago: {formatDate(ec.fecha_pago)}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="sm:max-w-[1200px] max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>
                            Tickets del Estado de Cuenta
                            {selectedCuenta && ` - Período ${selectedCuenta.periodo}`}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedCuenta && `Empresa ID: ${selectedCuenta.empresa_id}`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 overflow-auto">
                        {isLoadingTickets ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                <p className="text-muted-foreground mt-2">Cargando tickets...</p>
                            </div>
                        ) : tickets.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No hay tickets para este período
                            </div>
                        ) : (
                            <>
                                <div className="border rounded-md">
                                    <UITable>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Ticket #</TableHead>
                                                <TableHead>Fecha Compra</TableHead>
                                                <TableHead>Estado</TableHead>
                                                <TableHead>Origen</TableHead>
                                                <TableHead>Destino</TableHead>
                                                <TableHead>Fecha Viaje</TableHead>
                                                <TableHead>RUT Pasajero</TableHead>
                                                <TableHead>Nombre Pasajero</TableHead>
                                                <TableHead>Monto</TableHead>
                                                <TableHead>Centro De Costo</TableHead>
                                                <TableHead>Cta. Cte</TableHead>
                                                <TableHead>RUT Comprador</TableHead>
                                                <TableHead>Nombre Comprador</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {tickets.map((ticket) => (
                                                <TableRow key={ticket.id}>
                                                    <TableCell>{ticket.pnrNumber ?? "-"}</TableCell>
                                                    <TableCell>{formatDate(ticket.confirmedAt ?? "-")}</TableCell>
                                                    <TableCell>
                                                        <span className={`px-2 py-1 rounded text-xs ${ticket.ticketStatus === 'Confirmed'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {ticket.ticketStatus}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>{ticket.terminal_origen ?? "-"}</TableCell>
                                                    <TableCell>{ticket.terminal_destino ?? "-"}</TableCell>
                                                    <TableCell>{formatDate(ticket.travelDate)} {ticket.departureTime}</TableCell>
                                                    <TableCell>{ticket?.pasajero.rut ?? "-"}</TableCell>
                                                    <TableCell>{ticket?.pasajero.nombre ?? "-"}</TableCell>
                                                    <TableCell>
                                                        ${ticket.monto_boleto ? ticket.monto_boleto.toLocaleString('es-CL') : '0'}
                                                    </TableCell>
                                                    <TableCell>{ticket?.pasajero.id_centro_costo ?? "-"}</TableCell>
                                                    <TableCell>{ticket?.empresa.cuenta_corriente ?? "-"}</TableCell>
                                                    <TableCell>{ticket?.user.rut ?? "-"}</TableCell>
                                                    <TableCell>{ticket?.user.nombre ?? "-"}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </UITable>
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter className="gap-2 flex items-center justify-between w-full">
                        <div className="flex gap-2 items-center">
                            <div className="text-sm text-muted-foreground">
                                Mostrando {tickets.length} de {ticketsPagination.total} tickets
                            </div>

                            {ticketsPagination.totalPages > 0 && (
                                <div className="flex items-center gap-3">
                                    {/* Limit selector */}
                                    <div className="flex items-center gap-2 text-sm">
                                        <select
                                            value={ticketsPagination.limit}
                                            onChange={(e) => handleTicketsLimitChange(parseInt(e.target.value))}
                                            className="p-2 border rounded-md bg-background text-sm"
                                            disabled={isLoadingTickets}
                                        >
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleTicketsPageChange(1)}
                                            disabled={!ticketsPagination.hasPrevPage || isLoadingTickets}
                                            className="h-8 w-8 p-0 text-xs"
                                        >
                                            «
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleTicketsPageChange(ticketsPagination.page - 1)}
                                            disabled={!ticketsPagination.hasPrevPage || isLoadingTickets}
                                            className="h-8 w-8 p-0 text-xs"
                                        >
                                            ‹
                                        </Button>

                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(5, ticketsPagination.totalPages || 1) }, (_, i) => {
                                                let pageNum;
                                                const totalPages = ticketsPagination.totalPages || 1;

                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (ticketsPagination.page <= 3) {
                                                    pageNum = i + 1;
                                                } else if (ticketsPagination.page >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = ticketsPagination.page - 2 + i;
                                                }

                                                if (pageNum < 1 || pageNum > totalPages) return null;

                                                return (
                                                    <Button
                                                        key={pageNum}
                                                        variant={ticketsPagination.page === pageNum ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => handleTicketsPageChange(pageNum)}
                                                        disabled={isLoadingTickets}
                                                        className="h-8 w-8 p-0 text-xs"
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                );
                                            })}
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleTicketsPageChange(ticketsPagination.page + 1)}
                                            disabled={!ticketsPagination.hasNextPage || isLoadingTickets}
                                            className="h-8 w-8 p-0 text-xs"
                                        >
                                            ›
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleTicketsPageChange(ticketsPagination.totalPages)}
                                            disabled={!ticketsPagination.hasNextPage || isLoadingTickets}
                                            className="h-8 w-8 p-0 text-xs"
                                        >
                                            »
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                                Cerrar
                            </Button>
                            {tickets.length > 0 && (
                                <>
                                    <Button
                                        onClick={() => exportAllTicketsToCSV(selectedCuenta)}
                                        className="bg-accent hover:bg-accent/90"
                                    >
                                        Exportar CSV
                                    </Button>
                                    <Button
                                        onClick={() => exportAllTicketsToXLSX(selectedCuenta)}
                                        className="bg-accent hover:bg-accent/90"
                                    >
                                        Exportar XLSX
                                    </Button>
                                </>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
