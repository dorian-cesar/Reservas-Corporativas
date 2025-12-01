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
    FileText,
    Download,
    Calendar,
    MapPin,
    Clock,
    User,
    Hash,
    DollarSign,
    RefreshCcw,
    Table,
    LayoutGrid,
    CheckCircle,
    XCircle,
    Clock4,
    Search,
    Building2
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

export function EstadoPago() {
    const { token } = useAuth.getState();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"cards" | "table">("table");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [dateDesde, setDateDesde] = useState<string>("");
    const [dateHasta, setDateHasta] = useState<string>("");
    const [empresaId, setEmpresaId] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [companies, setCompanies] = useState<{ id: string; nombre: string }[]>([]);

    const { toast } = useToast();

    const fetchTimeoutRef = useRef<number | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    type Ticket = {
        id: number;
        ticketNumber: string;
        ticketStatus: "Confirmed" | "Anulado";
        origin: string;
        destination: string;
        travelDate: string;
        departureTime: string;
        seatNumbers: string;
        fare: number;
        monto_boleto: number;
        confirmedAt: string;
        id_User: number;
        created_at: string;
        updated_at: string;
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        if (!empresaId) {
            setTickets([]);
            return;
        }

        if (fetchTimeoutRef.current) {
            window.clearTimeout(fetchTimeoutRef.current);
        }

        fetchTimeoutRef.current = window.setTimeout(() => {
            fetchTickets(Number(empresaId), { desde: dateDesde, hasta: dateHasta });
        }, 500);

        return () => {
            if (fetchTimeoutRef.current) {
                window.clearTimeout(fetchTimeoutRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [empresaId, dateDesde, dateHasta, statusFilter, searchTerm]);

    const fetchCompanies = async () => {
        try {
            const res = await fetch("/api/companies", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Error fetching companies");
            const data = await res.json();
            const mapped = data.map((c: any) => ({
                id: c.id.toString(),
                nombre: c.nombre,
            }));
            setCompanies(mapped);
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "No se pudieron cargar las empresas", variant: "destructive" });
        }
    };

    const fetchTickets = async (targetEmpresaId: number, opts?: { desde?: string; hasta?: string; }) => {
        if (!targetEmpresaId) {
            toast({
                title: "Información",
                description: "Por favor selecciona una empresa",
                variant: "default",
            });
            return;
        }

        if (abortControllerRef.current) {
            try { abortControllerRef.current.abort(); } catch { }
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsLoading(true);
        try {
            let url = `/api/confirm-db/empresa/${targetEmpresaId}`;

            const params: string[] = [];
            if (opts?.desde && opts?.hasta) {
                params.push(`travelDate_desde=${encodeURIComponent(opts.desde)}`);
                params.push(`travelDate_hasta=${encodeURIComponent(opts.hasta)}`);
            } else if (opts?.desde) {
                params.push(`travelDate_desde=${encodeURIComponent(opts.desde)}`);
            } else if (opts?.hasta) {
                params.push(`travelDate_hasta=${encodeURIComponent(opts.hasta)}`);
            }

            if (params.length) {
                url += `?${params.join("&")}`;
            }

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
                signal: controller.signal,
            });

            if (res.status === 404) {
                const errorData = await res.json().catch(() => ({}));
                setTickets([]);
                toast({
                    title: "Información",
                    description: errorData.message || "No se encontraron tickets para esta empresa",
                    variant: "default",
                });
                return;
            }

            if (!res.ok) {
                throw new Error(`Error ${res.status}: ${res.statusText}`);
            }

            const responseData = await res.json();

            if (responseData && responseData.empty) {
                setTickets([]);
                toast({
                    title: "Información",
                    description: responseData.message || "No se encontraron tickets para esta empresa",
                    variant: "default",
                });
                return;
            }

            const ticketsArray = Array.isArray(responseData) ? responseData : [];

            setTickets(ticketsArray);

            if (ticketsArray.length === 0) {
                toast({
                    title: "Información",
                    description: "No se encontraron tickets para esta empresa",
                    variant: "default",
                });
            }
        } catch (err) {
            if ((err as any)?.name === "AbortError") {
                console.debug("Petición de tickets abortada");
                return;
            }

            console.error("Error fetching tickets:", err);
            toast({
                title: "Error",
                description: err instanceof Error ? err.message : "No se pudieron cargar los tickets",
                variant: "destructive",
            });
            setTickets([]);
        } finally {
            setIsLoading(false);
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-CL');
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('es-CL');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Confirmed":
                return (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex items-center gap-1 w-fit">
                        <CheckCircle className="h-3 w-3" />
                        Confirmado
                    </span>
                );
            case "Anulado":
                return (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full flex items-center gap-1 w-fit">
                        <XCircle className="h-3 w-3" />
                        Anulado
                    </span>
                );
            default:
                return (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                        {status}
                    </span>
                );
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "Confirmed":
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case "Anulado":
                return <XCircle className="h-5 w-5 text-red-600" />;
            default:
                return <FileText className="h-5 w-5 text-gray-600" />;
        }
    };

    const exportToCSV = () => {
        const ticketsToExport = Array.isArray(tickets) ? tickets : [];
        if (ticketsToExport.length === 0) return;

        const headers = [
            "Número de Ticket",
            "Estado",
            "Origen",
            "Destino",
            "Fecha de Viaje",
            "Hora de Salida",
            "Asiento",
            "Valor Asiento",
            "Monto Boleto",
            "Confirmado En",
            "ID Usuario",
            "Creado En",
            "Actualizado En"
        ];

        const csvData = ticketsToExport.map(ticket => [
            ticket.ticketNumber,
            ticket.ticketStatus,
            ticket.origin,
            ticket.destination,
            ticket.travelDate,
            ticket.departureTime,
            ticket.seatNumbers,
            ticket.fare,
            ticket.monto_boleto,
            ticket.confirmedAt,
            ticket.id_User,
            ticket.created_at,
            ticket.updated_at
        ]);

        const csvContent = [
            headers.join(","),
            ...csvData.map(row => row.map(field => `"${field}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `tickets_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setIsExportDialogOpen(false);
        toast({
            title: "Exportación exitosa",
            description: `Se exportaron ${ticketsToExport.length} tickets a CSV`,
        });
    };

    const exportToXLSX = () => {
        const ticketsToExport = Array.isArray(tickets) ? tickets : [];
        if (ticketsToExport.length === 0) return;

        const data = ticketsToExport.map(ticket => ({
            "Número de Ticket": ticket.ticketNumber,
            "Estado": ticket.ticketStatus,
            "Origen": ticket.origin,
            "Destino": ticket.destination,
            "Fecha de Viaje": ticket.travelDate,
            "Hora de Salida": ticket.departureTime,
            "Asiento": ticket.seatNumbers,
            "Valor Asiento": ticket.fare,
            "Monto Boleto": ticket.monto_boleto,
            "Confirmado En": ticket.confirmedAt,
            "ID Usuario": ticket.id_User,
            "Creado En": ticket.created_at,
            "Actualizado En": ticket.updated_at
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");
        XLSX.writeFile(workbook, `tickets_${new Date().toISOString().split('T')[0]}.xlsx`);

        setIsExportDialogOpen(false);
        toast({
            title: "Exportación exitosa",
            description: `Se exportaron ${ticketsToExport.length} tickets a XLSX`,
        });
    };

    return (
        <div className="space-y-6">
            <ToolBar
                title="Estado de pago"
                description="Visualice los estados de pago"
                viewMode={viewMode}
                setViewMode={setViewMode}
                showCompanySelect
                companies={companies}
                selectedCompany={empresaId}
                onCompanyChange={(id) => setEmpresaId(id)}
                refreshAction={() => empresaId && fetchTickets(Number(empresaId), { desde: dateDesde, hasta: dateHasta })}
                secondaryAction={{
                    label: "Exportar",
                    icon: <Download className="h-4 w-4" />,
                    onClick: () => setIsExportDialogOpen(true),
                    disabled: !empresaId || tickets.length === 0
                }}
            />

            {isLoading && (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Cargando tickets...</p>
                </div>
            )}

            {!isLoading && empresaId && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="desde">Fecha Desde</Label>
                                <Input
                                    id="desde"
                                    type="date"
                                    value={dateDesde}
                                    onChange={(e) => setDateDesde(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="hasta">Fecha Hasta</Label>
                                <Input
                                    id="hasta"
                                    type="date"
                                    value={dateHasta}
                                    onChange={(e) => setDateHasta(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Resultados</Label>
                                <div className="text-sm text-muted-foreground pt-2">
                                    {tickets.length} tickets
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {!empresaId && !isLoading && (
                <Card>
                    <CardContent className="text-center py-12">
                        <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">Selecciona una empresa</h3>
                        <p className="text-muted-foreground">Selecciona una empresa para ver sus tickets</p>
                    </CardContent>
                </Card>
            )}


            {empresaId && !isLoading && tickets.length === 0 && (
                <Card>
                    <CardContent className="text-center py-12">
                        <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No hay tickets</h3>
                        <p className="text-muted-foreground mb-4">No se encontraron tickets para la empresa seleccionada</p>
                    </CardContent>
                </Card>
            )}


            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Exportar Tickets</DialogTitle>
                        <DialogDescription>Exporte los tickets ({tickets.length} registros)</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Formato de exportación</Label>
                            <div className="flex gap-4">
                                <Button onClick={exportToCSV} className="flex-1 bg-green-600 hover:bg-green-700">CSV</Button>
                                <Button onClick={exportToXLSX} className="flex-1 bg-blue-600 hover:bg-blue-700">XLSX</Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>Cancelar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {!isLoading && tickets.length > 0 && viewMode === "cards" && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {tickets.map((ticket, index) => (
                        <Card key={ticket.id} className="border-2 hover:border-primary transition-all duration-300 hover:shadow-xl animate-in fade-in zoom-in" style={{ animationDelay: `${index * 100}ms` }}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-primary/10 rounded-lg">{getStatusIcon(ticket.ticketStatus)}</div>
                                        <div>
                                            <CardTitle className="text-lg">{ticket.ticketNumber}</CardTitle>
                                            <CardDescription className="flex items-center gap-2 mt-1">{getStatusBadge(ticket.ticketStatus)}</CardDescription>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{ticket.origin}</span>
                                        <span className="text-muted-foreground">→</span>
                                        <span className="font-medium">{ticket.destination}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>{formatDate(ticket.travelDate)}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span>{ticket.departureTime}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span>Asiento: {ticket.seatNumbers}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><DollarSign className="h-3 w-3" />Valor Asiento</div>
                                        <p className="text-lg font-bold">{formatCurrency(ticket.fare)}</p>
                                    </div>
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><DollarSign className="h-3 w-3" />Monto</div>
                                        <p className="text-lg font-bold">{formatCurrency(ticket.monto_boleto)}</p>
                                    </div>
                                </div>

                                <div className="pt-2 border-t">
                                    <p className="text-xs text-muted-foreground">Confirmado: {formatDate(ticket.confirmedAt)}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {!isLoading && tickets.length > 0 && viewMode === "table" && (
                <Card>
                    <CardContent className="p-0">
                        <UITable>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ticket</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Origen</TableHead>
                                    <TableHead>Destino</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Hora</TableHead>
                                    <TableHead>Asiento</TableHead>
                                    <TableHead className="text-right">Valor Asiento</TableHead>
                                    <TableHead className="text-right">Monto</TableHead>
                                    <TableHead>Confirmado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tickets.map((ticket) => (
                                    <TableRow key={ticket.id} className="hover:bg-muted/50">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-lg"><FileText className="h-4 w-4 text-primary" /></div>
                                                <div><p className="text-sm text-muted-foreground">{ticket.ticketNumber}</p></div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(ticket.ticketStatus)}</TableCell>
                                        <TableCell><p className="font-medium">{ticket.origin}</p></TableCell>
                                        <TableCell><p className="font-medium">{ticket.destination}</p></TableCell>
                                        <TableCell><div className="flex items-center gap-2"><Calendar className="h-3 w-3 text-muted-foreground" />{formatDate(ticket.travelDate)}</div></TableCell>
                                        <TableCell><div className="flex items-center gap-2"><Clock className="h-3 w-3 text-muted-foreground" />{ticket.departureTime}</div></TableCell>
                                        <TableCell>{ticket.seatNumbers}</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(ticket.fare)}</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(ticket.monto_boleto)}</TableCell>
                                        <TableCell><p className="text-sm">{formatDate(ticket.confirmedAt)}</p></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </UITable>
                        {tickets.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No hay tickets que coincidan con los filtros</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
