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
    Plus,
    User,
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
import ToolBarAdmin from "./ToolBarAdmin";

import { Eye } from "lucide-react";

type EstadoCuentaType = {
    id: number;
    empresa_id: number;
    periodo: string;
    fecha_generacion: string;
    fecha_vencimiento?: string;
    fecha_facturacion?: string;
    total_tickets: number;
    total_tickets_anulados: number;
    monto_facturado: string;
    detalle_por_cc: string;
    pagado: boolean;
    fecha_pago?: string;
};

export function AdminEstadoPago() {
    const { token, user } = useAuth.getState();
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
    const [userCompany, setUserCompany] = useState<{ id: string; nombre: string } | null>(null);

    const { toast } = useToast();

    const fetchTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (user?.companyId) {
            fetchUserCompanyInfo();
        } else {
            fetchCompanies();
        }
    }, [user]);

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
            const res = await fetch("/api/companies", { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            setCompanies(data.map((c: any) => ({ id: c.id.toString(), nombre: c.nombre })));
        } catch {
            toast({ title: "Error", description: "No se pudieron cargar las empresas", variant: "destructive" });
        }
    };

    const fetchUserCompanyInfo = async () => {
        if (!user?.companyId || !token) return;
      
        try {
          const res = await fetch(`/api/companies/${user.companyId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
      
          if (res.ok) {
            const companyData = await res.json();
            const company = {
              id: companyData.id.toString(),
              nombre: companyData.nombre
            };
            
            setUserCompany(company);
            setEmpresaId(company.id.toString());
            setCompanies([company]);
          }
        } catch (err) {
          console.error("Error fetching user company:", err);
          toast({ 
            title: "Error", 
            description: "No se pudo cargar la empresa del usuario", 
            variant: "destructive" 
          });
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

    const fetchTicketsDeEstadoCuenta = async (estadoCuentaId: number) => {
        setIsLoadingTickets(true);
        try {
            const res = await fetch(`/api/estado-cuenta/${estadoCuentaId}/tickets`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Error al obtener tickets");

            const data = await res.json();
            setTickets(data);
            return data;
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
    }

    const openDetailDialog = async (cuentaId: number) => {
        const cuentaSeleccionada = estadosCuenta.find(ec => ec.id === cuentaId);
        if (!cuentaSeleccionada) return;

        setSelectedCuenta(cuentaSeleccionada);
        setIsDetailDialogOpen(true);

        await fetchTicketsDeEstadoCuenta(cuentaId);
    };

    const formatCurrency = (amount: string | number) =>
        new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(Number(amount));

    const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString("es-CL") : "-";

    const exportToCSV = () => {
        if (estadosCuenta.length === 0) return;
        const headers = ["Periodo", "Fecha Generación", "Fecha Vencimiento", "Total Tickets", "Total Anulados", "Monto Facturado", "Pagado", "Fecha Pago"];
        const csvData = estadosCuenta.map(ec => [
            ec.periodo,
            formatDate(ec.fecha_generacion),
            formatDate(ec.fecha_vencimiento),
            ec.total_tickets,
            ec.total_tickets_anulados,
            formatCurrency(ec.monto_facturado),
            ec.pagado ? "Sí" : "No",
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
        const data = estadosCuenta.map(ec => ({
            "Periodo": ec.periodo,
            "Fecha Generación": formatDate(ec.fecha_generacion),
            "Fecha Vencimiento": formatDate(ec.fecha_vencimiento),
            "Total Tickets": ec.total_tickets,
            "Total Anulados": ec.total_tickets_anulados,
            "Monto Facturado": formatCurrency(ec.monto_facturado),
            "Pagado": ec.pagado ? "Sí" : "No",
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

        const headers = ["Ticket #", "Estado", "Origen", "Destino", "Fecha Viaje", "Hora Salida", "Monto"];
        const csvData = ticketsData.map(ticket => [
            ticket.ticketNumber,
            ticket.ticketStatus,
            ticket.origin,
            ticket.destination,
            new Date(ticket.travelDate).toLocaleDateString('es-CL'),
            ticket.departureTime,
            `$${ticket.monto_boleto.toLocaleString('es-CL')}`
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
            "Ticket #": ticket.ticketNumber,
            "Estado": ticket.ticketStatus,
            "Origen": ticket.origin,
            "Destino": ticket.destination,
            "Fecha Viaje": new Date(ticket.travelDate).toLocaleDateString('es-CL'),
            "Hora Salida": ticket.departureTime,
            "Monto": `$${ticket.monto_boleto.toLocaleString('es-CL')}`
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

    if (!user?.companyId) {
        return (
            <div className="space-y-6">
                <ToolBarAdmin
                    title="Centros de Costo"
                    description="Gestione los centros de costo de las empresas"
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    refreshAction={() => userCompany && fetchUserCompanyInfo()}
                    primaryAction={{
                        label: "Agregar Centro",
                        icon: <Plus className="h-4 w-4" />,
                        onClick: () => setIsExportDialogOpen(true),
                        className: "bg-accent hover:bg-accent/90",
                    }}
                />
                <Card>
                    <CardContent className="text-center py-12">
                        <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">Usuario sin empresa asignada</h3>
                        <p className="text-muted-foreground">
                            Tu usuario no tiene una empresa asignada. Contacta al administrador.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            
            <ToolBarAdmin
                title="Estados de Cuenta"
                description={`Visualice los estados de cuenta de ${userCompany?.nombre || 'su empresa'}`}
                viewMode={viewMode}
                setViewMode={setViewMode}
                companyInfo={userCompany ? {
                    id: userCompany.id,
                    nombre: userCompany.nombre
                } : undefined}
                refreshAction={() => userCompany && fetchEstadosCuenta(Number(userCompany.id))}
                primaryAction={{
                    label: "Agregar Centro",
                    icon: <Plus className="h-4 w-4" />,
                    onClick: () => setIsExportDialogOpen(true),
                    className: "bg-accent hover:bg-accent/90",
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
                                    <TableHead>Periodo</TableHead>
                                    <TableHead>Fecha Generación</TableHead>
                                    <TableHead>Fecha Vencimiento</TableHead>
                                    <TableHead>Total Tickets</TableHead>
                                    <TableHead>Total Anulados</TableHead>
                                    <TableHead>Monto Facturado</TableHead>
                                    <TableHead>Pagado</TableHead>
                                    <TableHead>Detalles</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {estadosCuenta.map(ec => (
                                    <TableRow key={ec.id} className="hover:bg-muted/50">
                                        <TableCell>{ec.periodo}</TableCell>
                                        <TableCell>{formatDate(ec.fecha_generacion)}</TableCell>
                                        <TableCell>{formatDate(ec.fecha_vencimiento)}</TableCell>
                                        <TableCell>{ec.total_tickets}</TableCell>
                                        <TableCell>{ec.total_tickets_anulados}</TableCell>
                                        <TableCell>{formatCurrency(ec.monto_facturado)}</TableCell>
                                        <TableCell>{ec.pagado ? "Sí" : "No"}</TableCell>
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
                                <p>Vencimiento: {formatDate(ec.fecha_vencimiento)}</p>
                                <p>Total Tickets: {ec.total_tickets}</p>
                                <p>Anulados: {ec.total_tickets_anulados}</p>
                                <p>Monto: {formatCurrency(ec.monto_facturado)}</p>
                                <p>Pagado: {ec.pagado ? "Sí" : "No"}</p>
                                <p>Fecha Pago: {formatDate(ec.fecha_pago)}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Tickets del Estado de Cuenta
                            {selectedCuenta && ` - Período ${selectedCuenta.periodo}`}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedCuenta && `Empresa ID: ${selectedCuenta.empresa_id}`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
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
                                <div className="text-sm text-muted-foreground">
                                    Mostrando {tickets.length} tickets
                                </div>

                                <div className="border rounded-md">
                                    <UITable>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Ticket #</TableHead>
                                                <TableHead>Estado</TableHead>
                                                <TableHead>Origen</TableHead>
                                                <TableHead>Destino</TableHead>
                                                <TableHead>Fecha Viaje</TableHead>
                                                <TableHead>Monto</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {tickets.map((ticket) => (
                                                <TableRow key={ticket.id}>
                                                    <TableCell>{ticket.ticketNumber}</TableCell>
                                                    <TableCell>
                                                        <span className={`px-2 py-1 rounded text-xs ${ticket.ticketStatus === 'Confirmed'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {ticket.ticketStatus}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>{ticket.origin}</TableCell>
                                                    <TableCell>{ticket.destination}</TableCell>
                                                    <TableCell>
                                                        {new Date(ticket.travelDate).toLocaleDateString('es-CL')}
                                                    </TableCell>
                                                    <TableCell>
                                                        ${ticket.monto_boleto.toLocaleString('es-CL')}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </UITable>
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                            Cerrar
                        </Button>
                        {tickets.length > 0 && (
                            <>
                                <Button
                                    onClick={() => exportTicketsToCSV(tickets, selectedCuenta)}
                                    className="bg-accent hover:bg-accent/90"
                                >
                                    Exportar CSV
                                </Button>
                                <Button
                                    onClick={() => exportTicketsToXLSX(tickets, selectedCuenta)}
                                    className="bg-accent hover:bg-accent/90"
                                >
                                    Exportar XLSX
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
