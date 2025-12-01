"use client"

import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react"
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

export function AllBookingsAdmin() {
  const { token } = useAuth.getState();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [empresaId, setEmpresaId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [companies, setCompanies] = useState<{ id: string; nombre: string }[]>([]);

  const { toast } = useToast();

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
    monto_devolucion: number;
    confirmedAt: string;
    id_User: number;
    created_at: string;
    updated_at: string;

    user: User;
  };

  type User = {
    id: number;
    nombre: string;
    rut: string;
    email: string;
    rol: string;
    empresa_id: number;
    centro_costo_id: number;
    estado: boolean;
    created_at: string;
    updated_at: string;
    centroCosto: {
      id: number;
      nombre: string;
      empresa_id: number;
    };
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (!Number(empresaId)) return;
    fetchTickets(Number(empresaId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

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

  const fetchTickets = async (targetEmpresaId: number) => {
    if (!targetEmpresaId) {
      toast({
        title: "Información",
        description: "Por favor selecciona una empresa",
        variant: "default",
      });
      return;
    }

    setIsLoading(true);
    try {
      const url = `/api/confirm-db/empresa/${targetEmpresaId}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 404) {
        // Manejar específicamente el 404 como "no hay tickets"
        const errorData = await res.json().catch(() => ({}));
        setTickets([]); // ← Asegurar que sea array vacío
        setFilteredTickets([]); // ← Asegurar que sea array vacío
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

      // Verificar si la respuesta es un objeto con propiedad 'empty'
      if (responseData && responseData.empty) {
        setTickets([]); // ← Asegurar que sea array vacío
        setFilteredTickets([]); // ← Asegurar que sea array vacío
        toast({
          title: "Información",
          description: responseData.message || "No se encontraron tickets para esta empresa",
          variant: "default",
        });
        return;
      }

      // Asegurar que siempre sea un array
      const ticketsArray = Array.isArray(responseData) ? responseData : [];

      setTickets(ticketsArray);
      setFilteredTickets(ticketsArray);

      if (ticketsArray.length === 0) {
        toast({
          title: "Información",
          description: "No se encontraron tickets para esta empresa",
          variant: "default",
        });
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudieron cargar los tickets",
        variant: "destructive",
      });
      setTickets([]);
      setFilteredTickets([]); // ← Asegurar que sea array vacío en caso de error
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, statusFilter, dateFilter]);

  const filterTickets = () => {
    // Asegurar que tickets sea siempre un array
    let filtered = Array.isArray(tickets) ? tickets : [];

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.seatNumbers.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (statusFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.ticketStatus === statusFilter);
    }

    // Filtro por fecha
    if (dateFilter) {
      filtered = filtered.filter(ticket => ticket.travelDate === dateFilter);
    }

    setFilteredTickets(filtered);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-AR');
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

    const ticketsToExport = Array.isArray(filteredTickets) ? filteredTickets : [];

    if (ticketsToExport.length === 0) return;

    const headers = [
      "Número de Ticket",
      "Nombre Usuario",
      "RUT Usuario",
      "Correo Usuario",
      "Centro Costo",
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

    const csvData = filteredTickets.map(ticket => [
      ticket.ticketNumber,
      ticket.user.nombre,
      ticket.user.rut,
      ticket.user.email,
      ticket.user.centroCosto.nombre,
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
      description: `Se exportaron ${filteredTickets.length} tickets a CSV`,
    });
  };

  const exportToXLSX = () => {

    const ticketsToExport = Array.isArray(filteredTickets) ? filteredTickets : [];

    if (ticketsToExport.length === 0) return;

    const data = filteredTickets.map(ticket => ({
      "Número de Ticket": ticket.ticketNumber,
      "Nombre Usuario": ticket.user.nombre,
      "RUT Usuario": ticket.user.rut,
      "Correo Usuario": ticket.user.email,
      "Centro Costo": ticket.user.centroCosto.nombre,
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
      description: `Se exportaron ${filteredTickets.length} tickets a XLSX`,
    });
  };

  return (
    <div className="space-y-6">
      <ToolBar
        title="Gestión de Tickets"
        description="Visualice y exporte los tickets del sistema"
        viewMode={viewMode}
        setViewMode={setViewMode}

        // company select
        showCompanySelect
        companies={companies}
        selectedCompany={empresaId}
        onCompanyChange={(id) => setEmpresaId(id)}

        refreshAction={() => empresaId && fetchTickets(Number(empresaId))}

        secondaryAction={{
          label: "Exportar",
          icon: <Download className="h-4 w-4" />,
          onClick: () => setIsExportDialogOpen(true),
          disabled: !empresaId || filteredTickets.length === 0
        }}
      />

      {/* Estado de carga */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Cargando tickets...</p>
        </div>
      )}

      {/* Estado inicial - Sin empresa seleccionada */}
      {!empresaId && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Selecciona una empresa</h3>
            <p className="text-muted-foreground">
              Selecciona una empresa para ver sus tickets
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sin resultados */}
      {empresaId && !isLoading && tickets.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No hay tickets</h3>
            <p className="text-muted-foreground mb-4">
              No se encontraron tickets para la empresa seleccionada
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filtros (solo se muestran cuando hay tickets) */}
      {!isLoading && tickets.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Número, origen, destino..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="all">Todos los estados</option>
                  <option value="Confirmed">Confirmados</option>
                  <option value="Anulado">Anulado</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Fecha de Viaje</Label>
                <Input
                  id="date"
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Resultados</Label>
                <div className="text-sm text-muted-foreground pt-2">
                  {filteredTickets.length} de {tickets.length} tickets
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Exportar Tickets</DialogTitle>
            <DialogDescription>
              Exporte los tickets filtrados ({filteredTickets.length} registros)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Formato de exportación</Label>
              <div className="flex gap-4">
                <Button
                  onClick={exportToCSV}
                  className="flex-1 bg-accent hover:bg-accent/90"
                >
                  CSV
                </Button>
                <Button
                  onClick={exportToXLSX}
                  className="flex-1 bg-accent hover:bg-accent/90"
                >
                  XLSX
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vista de Tarjetas */}
      {!isLoading && tickets.length > 0 && viewMode === "cards" && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTickets.map((ticket, index) => (
            <Card
              key={ticket.id}
              className="border-2 hover:border-primary transition-all duration-300 hover:shadow-xl animate-in fade-in zoom-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      {getStatusIcon(ticket.ticketStatus)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{ticket.ticketNumber}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        {getStatusBadge(ticket.ticketStatus)}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Bloque: Usuario / Centro de Costo */}
                <div className="p-3 bg-muted/10 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Usuario</p>
                      <p className="font-medium">{ticket.user?.nombre || "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">RUT</p>
                      <p className="font-medium">{ticket.user?.rut || "—"}</p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Correo</p>
                      <p className="text-sm">{ticket.user?.email || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Centro de Costo</p>
                      <p className="text-sm">{ticket.user?.centroCosto?.nombre || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Bloque: Origen / Destino / Fecha / Hora / Asiento */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{ticket.origin}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium">{ticket.destination}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(ticket.travelDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{ticket.departureTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Asiento: {ticket.seatNumbers}</span>
                    </div>
                  </div>
                </div>

                {/* Bloque: Valores */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <DollarSign className="h-3 w-3" />
                      Valor Asiento
                    </div>
                    <p className="text-lg font-bold">{formatCurrency(ticket.fare)}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <DollarSign className="h-3 w-3" />
                      Monto
                    </div>
                    <p className="text-lg font-bold">{formatCurrency(ticket.monto_boleto)}</p>
                  </div>
                </div>

                {/* Pie: Metadatos */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div>
                      <p>Confirmado: {ticket.confirmedAt ? formatDateTime(ticket.confirmedAt) : "—"}</p>
                    </div>
                    <div className="text-right">
                      <p>ID Usuario: {ticket.id_User ?? "—"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Vista de Tabla */}
      {!isLoading && tickets.length > 0 && viewMode === "table" && (
        <Card>
          <CardContent className="p-0">
            <UITable>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Nombre Usuario</TableHead>
                  <TableHead>RUT Usuario</TableHead>
                  <TableHead>Correo Usuario</TableHead>
                  <TableHead>Centro De Costo</TableHead>
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
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{ticket.ticketNumber}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <p className="text-sm">{ticket.user.nombre}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <p className="text-sm text-muted-foreground">{ticket.user.rut}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <p className="text-sm text-muted-foreground">{ticket.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <p className="text-sm">{ticket.user.centroCosto.nombre}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(ticket.ticketStatus)}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{ticket.origin}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{ticket.destination}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(ticket.travelDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {ticket.departureTime}
                      </div>
                    </TableCell>
                    <TableCell>
                      {ticket.seatNumbers}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(ticket.fare)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(ticket.monto_boleto)}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{formatDate(ticket.confirmedAt)}</p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </UITable>
            {filteredTickets.length === 0 && (
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