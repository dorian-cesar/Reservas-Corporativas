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
  Search
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

export function AllBookingsAdmin() {
  const { token } = useAuth.getState();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const { toast } = useToast();

  type Ticket = {
    id: number;
    ticketNumber: string;
    ticketStatus: "Confirmed" | "Pending" | "Cancelled";
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
    fetchTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, statusFilter, dateFilter]);

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/confirm-db", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error fetching tickets");

      const data = await res.json();
      setTickets(data);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "No se pudieron cargar los tickets",
        variant: "destructive"
      });
    }
  };

  const filterTickets = () => {
    let filtered = tickets;

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
      // case "Pending":
      //   return (
      //     <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full flex items-center gap-1 w-fit">
      //       <Clock4 className="h-3 w-3" />
      //       Pendiente
      //     </span>
      //   );
      case "Anulado":
        return (
          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full flex items-center gap-1 w-fit">
            <XCircle className="h-3 w-3" />
            Cancelado
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
      // case "Pending":
      //   return <Clock4 className="h-5 w-5 text-yellow-600" />;
      case "Anulado":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const exportToCSV = () => {
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

    const csvData = filteredTickets.map(ticket => [
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
      description: `Se exportaron ${filteredTickets.length} tickets a CSV`,
    });
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(filteredTickets, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `tickets_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExportDialogOpen(false);
    toast({
      title: "Exportación exitosa",
      description: `Se exportaron ${filteredTickets.length} tickets a JSON`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Tickets</h2>
          <p className="text-muted-foreground">Visualice y exporte los tickets del sistema</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Toggle de Vista */}
          <div className="flex border rounded-lg p-1 bg-muted/50">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="h-8 px-3"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8 px-3"
            >
              <Table className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={() => fetchTickets()} className="bg-secondary hover:bg-secondary/90 justify-center">
            <RefreshCcw className="h-4 w-4" />
          </Button>

          <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
            <Button onClick={() => setIsExportDialogOpen(true)} className="bg-accent hover:bg-accent/90">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
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
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      CSV
                    </Button>
                    <Button
                      onClick={exportToJSON}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      JSON
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
        </div>
      </div>

      {/* Filtros */}
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
                <option value="Pending">Pendientes</option>
                <option value="Cancelled">Cancelados</option>
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

      {/* Vista de Tarjetas */}
      {viewMode === "cards" && (
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

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Confirmado: {formatDate(ticket.confirmedAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Vista de Tabla */}
      {viewMode === "table" && (
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