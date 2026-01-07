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
  DollarSign,
  CheckCircle,
  XCircle,
  Search,
  Building2,
  Loader2
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
import ToolBar from "../tool-bar";
import TicketPDFButton from "@/components/ticket-pdf";
import Swal from "sweetalert2";

export function SuperAllBookings() {
  const { user, token } = useAuth.getState();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [searchTerm, setSearchTerm] = useState(""); // será ticketNumber (string)
  const [empresaId, setEmpresaId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<{ id: string; nombre: string }[]>([]);
  const [dateDesde, setDateDesde] = useState<string>("");
  const [dateHasta, setDateHasta] = useState<string>("");
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const swalConfig = {
    customClass: {
      container: "swal-container",
      popup:
        "swal-popup bg-background border-2 border-border rounded-lg shadow-xl",
      header: "swal-header",
      title: "swal-title text-foreground font-bold text-xl",
      closeButton: "swal-close",
      icon: "swal-icon",
      image: "swal-image",
      content: "swal-content text-foreground",
      htmlContainer: "swal-html-container text-foreground",
      input: "swal-input",
      inputLabel: "swal-input-label",
      validationMessage: "swal-validation-message",
      actions: "swal-actions gap-3",
      confirmButton:
        "swal-confirm-btn inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-destructive/80 text-destructive-foreground hover:bg-destructive h-10 py-2 px-4 cursor-pointer",
      cancelButton:
        "swal-cancel-btn inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4 cursor-pointer",
      footer: "swal-footer",
    },
    buttonsStyling: false,
    reverseButtons: true,
  };

  const { toast } = useToast();

  type Ticket = {
    id: number;
    ticketNumber: string;
    pnrNumber?: string;
    ticketStatus: "Confirmed" | "Anulado" | string;
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
    pasajero?: Pasajero;
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
    centroCosto?: {
      id: number;
      nombre: string;
      empresa_id: number;
    };
  };

  type Pasajero = {
    id: number;
    nombre?: string;
    rut?: string;
    correo?: string;
    centroCosto?: {
      id: number;
      nombre: string;
    };
  }

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Cuando cambia empresa o fechas reiniciamos a página 1 y pedimos datos
  useEffect(() => {
    if (!Number(empresaId)) return;
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchTickets({
      targetEmpresaId: Number(empresaId),
      page: 1,
      limit: pagination.limit,
      ticketNumber: searchTerm.trim() || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, dateDesde, dateHasta]);

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true)
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
      setLoadingCompanies(false)
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "No se pudieron cargar las empresas", variant: "destructive" });
      setLoadingCompanies(false)
    } finally {
      setLoadingCompanies(false)
    }
  };


  const fetchTickets = async (opts: { targetEmpresaId: number; page?: number; limit?: number; ticketNumber?: string }) => {
    const { targetEmpresaId, page = pagination.page, limit = pagination.limit, ticketNumber } = opts;

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
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));

      if (dateDesde) params.set("travelDate_desde", dateDesde);
      if (dateHasta) params.set("travelDate_hasta", dateHasta);

      // ticketNumber como string (no validamos formato)
      if (ticketNumber && ticketNumber.trim() !== "") {
        params.set("ticketNumber", ticketNumber.trim());
      }

      const queryString = params.toString();
      const url = `/api/confirm-db/empresa/${targetEmpresaId}${queryString ? `?${queryString}` : ""}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (res.status === 404) {
        const errorData = await res.json().catch(() => ({}));
        setTickets([]);
        setPagination({ page: 1, limit, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false });
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
        setPagination({ page: 1, limit, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false });
        toast({
          title: "Información",
          description: responseData.message || "No se encontraron tickets para esta empresa",
          variant: "default",
        });
        return;
      }

      // aceptamos { tickets, pagination } o un array (en cuyo caso construimos pag)
      const ticketsArray = Array.isArray(responseData.tickets) ? responseData.tickets : (Array.isArray(responseData) ? responseData : []);
      const pag = responseData.pagination || {
        page,
        limit,
        total: ticketsArray.length,
        totalPages: Math.ceil((ticketsArray.length || 0) / limit),
        hasNextPage: false,
        hasPrevPage: page > 1
      };

      setTickets(ticketsArray);
      setPagination({
        page: pag.page ?? page,
        limit: pag.limit ?? limit,
        total: pag.total ?? ticketsArray.length,
        totalPages: pag.totalPages ?? Math.ceil((pag.total ?? ticketsArray.length) / (pag.limit ?? limit)),
        hasNextPage: Boolean(pag.hasNextPage),
        hasPrevPage: Boolean(pag.hasPrevPage),
      });

      if ((ticketsArray || []).length === 0) {
        let message = "No se encontraron tickets";
        if (dateDesde || dateHasta) message += " para el período seleccionado";
        toast({ title: "Información", description: message, variant: "default" });
      } else {
        toast({ title: "Éxito", description: `${ticketsArray.length} tickets cargados`, variant: "default" });
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudieron cargar los tickets",
        variant: "destructive",
      });
      setTickets([]);
      setPagination({ page: 1, limit, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllTicketsForExport = async (targetEmpresaId: number): Promise<Ticket[]> => {
    try {
      const params = new URLSearchParams();
      params.set("exportAll", "true");

      if (dateDesde) params.set("travelDate_desde", dateDesde);
      if (dateHasta) params.set("travelDate_hasta", dateHasta);

      const queryString = params.toString();
      const url = `/api/confirm-db/empresa/${targetEmpresaId}${queryString ? `?${queryString}` : ""}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const responseData = await res.json();

      if (Array.isArray(responseData)) {
        return responseData as Ticket[];
      }

      // Por compatibilidad, también manejar respuesta antigua
      if (responseData && Array.isArray(responseData.tickets)) {
        return responseData.tickets as Ticket[];
      }

      return [];
    } catch (err) {
      console.error("Error fetching all tickets for export:", err);
      throw err;
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

  const formatDateOnly = (dateString?: string) => {
    if (!dateString) return "—";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("es-CL");
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

  const exportToCSV = async () => {
    if (!empresaId) return;

    setIsLoading(true);
    try {
      // Obtener TODOS los tickets (sin paginación)
      const allTickets = await fetchAllTicketsForExport(Number(empresaId)) as Ticket[];

      if (!allTickets || allTickets.length === 0) {
        toast({
          title: "Sin datos",
          description: "No hay tickets para exportar",
          variant: "destructive",
        });
        return;
      }

      const headers = [
        "Número de Ticket",
        "PNR",
        "Estado",
        "Nombre Usuario",
        "RUT Usuario",
        "Correo Usuario",
        "Centro Costo",
        "Nombre Pasajero",
        "RUT Pasajero",
        "Origen",
        "Destino",
        "Fecha de Viaje",
        "Hora de Salida",
        "Asiento",
        "Valor Asiento",
        "Monto Boleto",
        "Monto Devolución",
        "Confirmado En",
        "ID Usuario",
        "Creado En",
        "Actualizado En"
      ];

      const csvData = allTickets.map(ticket => [
        ticket.ticketNumber || "",
        ticket.pnrNumber || "",
        ticket.ticketStatus || "",
        ticket.user?.nombre || "",
        ticket.user?.rut || "",
        ticket.user?.email || "",
        ticket.user?.centroCosto?.nombre || "",
        ticket.pasajero?.nombre || "",
        ticket.pasajero?.rut || "",
        ticket.origin || "",
        ticket.destination || "",
        ticket.travelDate || "",
        ticket.departureTime || "",
        ticket.seatNumbers || "",
        ticket.fare || 0,
        ticket.monto_boleto || 0,
        ticket.monto_devolucion || 0,
        ticket.confirmedAt || "",
        ticket.id_User || "",
        ticket.created_at || "",
        ticket.updated_at || ""
      ]);

      const csvContent = [
        headers.join(","),
        ...csvData.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `tickets_empresa_${empresaId}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsExportDialogOpen(false);
      toast({
        title: "Exportación exitosa",
        description: `Se exportaron ${allTickets.length} tickets a CSV`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "No se pudieron exportar los tickets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToXLSX = async () => {
    if (!empresaId) return;

    setIsLoading(true);
    try {
      // Obtener TODOS los tickets (sin paginación)
      const allTickets = await fetchAllTicketsForExport(Number(empresaId)) as Ticket[];

      if (!allTickets || allTickets.length === 0) {
        toast({
          title: "Sin datos",
          description: "No hay tickets para exportar",
          variant: "destructive",
        });
        return;
      }

      const data = allTickets.map(ticket => ({
        "Número de Ticket": ticket.ticketNumber || "",
        "PNR": ticket.pnrNumber || "",
        "Estado": ticket.ticketStatus || "",
        "Nombre Usuario": ticket.user?.nombre || "",
        "RUT Usuario": ticket.user?.rut || "",
        "Correo Usuario": ticket.user?.email || "",
        "Centro Costo": ticket.user?.centroCosto?.nombre || "",
        "Nombre Pasajero": ticket.pasajero?.nombre || "",
        "RUT Pasajero": ticket.pasajero?.rut || "",
        "Origen": ticket.origin || "",
        "Destino": ticket.destination || "",
        "Fecha de Viaje": ticket.travelDate || "",
        "Hora de Salida": ticket.departureTime || "",
        "Asiento": ticket.seatNumbers || "",
        "Valor Asiento": ticket.fare || 0,
        "Monto Boleto": ticket.monto_boleto || 0,
        "Monto Devolución": ticket.monto_devolucion || 0,
        "Confirmado En": ticket.confirmedAt || "",
        "ID Usuario": ticket.id_User || "",
        "Creado En": ticket.created_at || "",
        "Actualizado En": ticket.updated_at || ""
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");
      XLSX.writeFile(workbook, `tickets_empresa_${empresaId}_${new Date().toISOString().split('T')[0]}.xlsx`);

      setIsExportDialogOpen(false);
      toast({
        title: "Exportación exitosa",
        description: `Se exportaron ${allTickets.length} tickets a XLSX`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "No se pudieron exportar los tickets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRefundAmount = (monto_boleto: number): number => {
    const refundPercentage = Number(user?.companyPorcentajeDevolucion) || 0;
    const amount = monto_boleto * refundPercentage;
    return Math.round(amount);
  };


  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(price);

  const handleCancelBooking = async (ticket: Ticket) => {
    if (!canCancelBooking(ticket)) {
      Swal.fire({
        icon: "warning",
        title: "No es posible anular la reserva",
        html: `
        <p class="text-foreground mb-2">Solo puedes anular una reserva hasta 4 horas antes de la salida.</p>
        <p class="text-sm text-muted-foreground">Si necesitas ayuda, contacta a tu empresa.</p>
      `,
        confirmButtonText: "Entendido",
        ...swalConfig,
      });
      return;
    }

    const refundAmount = calculateRefundAmount(ticket.monto_boleto);

    const result = await Swal.fire({
      title: "¿Estás seguro?",
      html: `
        <div class="text-left space-y-3">
          <p class="text-foreground text-center mb-2">¿Deseas anular esta reserva?</p>
          <p class="text-foreground text-center">Esta acción no se puede deshacer.</p>
          <div class="bg-muted/50 p-3 rounded-lg border">
            <p class="text-sm text-muted-foreground mb-1">Detalles de la anulación:</p>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="text-foreground">Asiento:</div>
              <div class="font-medium">${ticket.seatNumbers}</div>
              <div class="text-foreground">Monto original:</div>
              <div class="font-medium">${formatPrice(
        ticket.monto_boleto || ticket.fare
      )}</div>
              <div class="text-foreground">Porcentaje reembolso:</div>
              <div class="font-medium">${(Number(user?.companyPorcentajeDevolucion) || 0) * 100
        }%</div>
              <div class="text-foreground font-semibold">Reembolso a Cuenta Corriente:</div>
              <div class="font-bold text-green-600">${formatPrice(
          refundAmount
        )}</div>
            </div>
          </div>
          <p class="text-sm text-muted-foreground mt-2">* El monto de reembolso será acreditado según las políticas de tu empresa.</p>
        </div>
      `,
      icon: "warning",
      iconColor: "#f59e0b",
      showCancelButton: true,
      confirmButtonText: "Sí, anular reserva",
      cancelButtonText: "Cancelar",
      ...swalConfig,
    });

    if (!result.isConfirmed) {
      return;
    }

    const bookingId = ticket.id;
    setCancelingId(String(bookingId));

    try {
      console.log("Cancelando ticket:", {
        ticketNumber: ticket.ticketNumber,
        seatNumbers: ticket.seatNumbers,
        fullTicket: ticket
      });
      const cancelResponse = await fetch("/api/tickets/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ticketNumber: ticket.ticketNumber,
          seatNumbers: ticket.seatNumbers,
        }),
      });

      const cancelResult = await cancelResponse.json();

      if (!cancelResponse.ok) {
        throw new Error(
          cancelResult.error || "Error al anular la reserva en Kupos"
        );
      }

      if (cancelResult.success) {
        const bookingId = ticket.id;
        const updateResponse = await fetch(`/api/cancel-db/${bookingId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ticketStatus: "Anulado",
            monto_devolucion: refundAmount,
          }),
        });

        const contentType = updateResponse.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          const htmlText = await updateResponse.text();
          console.error(
            "Se recibió HTML en lugar de JSON:",
            htmlText.substring(0, 500)
          );
          throw new Error("La ruta de API no existe (404)");
        }

        const updateResult = await updateResponse.json();

        if (!updateResponse.ok) {
          console.error("Error actualizando BD:", updateResult.error);
          Swal.fire({
            icon: "warning",
            title: "Reserva anulada con observaciones",
            html: `
              <div class="text-center space-y-3">
                <p class="text-foreground">La reserva fue anulada en el sistema, pero hubo un problema al actualizar nuestros registros.</p>
                <div class="bg-muted/50 p-3 rounded-lg border">
                  <p class="text-sm text-muted-foreground mb-2">Error técnico:</p>
                  <p class="text-sm font-medium text-foreground">${updateResult.error
              }</p>
                </div>
                <p class="text-sm text-muted-foreground">Por favor, contacte al administrador.</p>
                ${refundAmount
                ? `<div class="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p class="font-semibold text-orange-800">Reembolso a Cuenta Corriente: ${formatPrice(
                  refundAmount
                )}</p>
                      </div>`
                : ""
              }
              </div>
            `,
            confirmButtonText: "Entendido",
            ...swalConfig,
          });
        } else {
          Swal.fire({
            icon: "success",
            title: "¡Reserva anulada!",
            html: `
              <div class="text-center space-y-3">
                <p class="text-foreground">La reserva ha sido anulada exitosamente.</p>
                ${refundAmount
                ? `<div class="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <p class="text-sm text-orange-700 mb-1">Se ha procesado el reembolso:</p>
                        <p class="text-xl font-bold text-orange-800">${formatPrice(
                  refundAmount
                )}</p>
                        <p class="text-xs text-orange-600 mt-1">Este monto será acreditado según las políticas de tu empresa.</p>
                      </div>`
                : ""
              }
              </div>
            `,
            confirmButtonText: "Entendido",
            ...swalConfig,
          });
        }

        setTickets((prevBookings) =>
          prevBookings.map((b) =>
            b.id === bookingId
              ? {
                ...b,
                ticketStatus: "Anulado",
                status: "anulado",
                monto_devolucion: cancelResult.refundAmount || 0,
              }
              : b
          )
        );
      } else {
        throw new Error(cancelResult.error || "Error al anular la reserva");
      }
    } catch (error) {
      console.error("Error anulando reserva:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        html: `
          <div class="text-center">
            <p class="text-foreground mb-3">${error instanceof Error
            ? error.message
            : "Error al anular la reserva"
          }</p>
            <p class="text-sm text-muted-foreground">Por favor, intente nuevamente o contacte al administrador.</p>
          </div>
        `,
        confirmButtonText: "Entendido",
        ...swalConfig,
      });
    } finally {
      setCancelingId(null);
    }
  };


  const canCancelBooking = (ticket: Ticket) => {
    try {
      const date = ticket.travelDate;
      const time = ticket.departureTime;
      if (!date || !time) return false;
      const travelDateTime = new Date(`${date}T${time}:00-03:00`);
      const now = new Date();
      const diffHours =
        (travelDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      return diffHours >= 4;
    } catch (err) {
      console.error("Error calculando horas restantes:", err);
      return false;
    }
  };

  const isPastTrip = (ticket: Ticket) => {
    try {
      const date = ticket.travelDate;
      const time = ticket.departureTime;
      if (!date || !time) return true;
      const travelDateTime = new Date(`${date}T${time}:00-03:00`);
      const now = new Date();
      return travelDateTime < now;
    } catch (err) {
      console.error("Error verificando viaje pasado:", err);
      return true;
    }
  };

  const clearDateFilters = () => {
    setDateDesde("");
    setDateHasta("");
  };

  // Paginación: solicita al servidor preservando ticketNumber y fechas
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage === pagination.page || (pagination.totalPages && newPage > pagination.totalPages)) return;
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchTickets({
      targetEmpresaId: Number(empresaId),
      page: newPage,
      limit: pagination.limit,
      ticketNumber: searchTerm.trim() || undefined,
    });
  };

  const handleLimitChange = (newLimit: number) => {
    if (newLimit === pagination.limit) return;
    setPagination(prev => ({ ...prev, page: 1, limit: newLimit }));
    fetchTickets({
      targetEmpresaId: Number(empresaId),
      page: 1,
      limit: newLimit,
      ticketNumber: searchTerm.trim() || undefined,
    });
  };

  // Ejecutar búsqueda: pide la página 1 al servidor con ticketNumber (string) y fechas
  const doSearch = () => {
    if (!empresaId) {
      toast({ title: "Información", description: "Selecciona una empresa primero", variant: "default" });
      return;
    }
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchTickets({
      targetEmpresaId: Number(empresaId),
      page: 1,
      limit: pagination.limit,
      ticketNumber: searchTerm.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <ToolBar
        title="Gestión de Tickets"
        description="Visualice y exporte los tickets del sistema"
        viewMode={viewMode}
        setViewMode={setViewMode}
        showCompanySelect
        companies={companies}
        selectedCompany={empresaId}
        onCompanyChange={(id) => setEmpresaId(id)}
        companySelectMode="combobox"
        companySelectPlaceholder="Selecciona una empresa..."
        loadingCompanies={loadingCompanies}

        refreshAction={() => empresaId && fetchTickets({
          targetEmpresaId: Number(empresaId),
          page: pagination.page,
          limit: pagination.limit,
          ticketNumber: searchTerm.trim() || undefined,
        })}
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

      {!isLoading && empresaId && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar por número de ticket</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Código de ticket (se busca en servidor)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") doSearch(); }}
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">La búsqueda por número se realiza en el servidor.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateDesde">Fecha Desde</Label>
                <Input id="dateDesde" type="date" value={dateDesde} onChange={(e) => setDateDesde(e.target.value)} max={dateHasta || undefined} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateHasta">Fecha Hasta</Label>
                <Input id="dateHasta" type="date" value={dateHasta} onChange={(e) => setDateHasta(e.target.value)} min={dateDesde || undefined} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Acciones</Label>
                <div className="flex gap-2">
                  <Button onClick={doSearch} className="bg-accent hover:bg-accent/90">Buscar</Button>
                  <Button variant="outline" onClick={() => {
                    setSearchTerm("");
                    clearDateFilters();
                    setPagination(prev => ({ ...prev, page: 1 }));
                    fetchTickets({ targetEmpresaId: Number(empresaId), page: 1, limit: pagination.limit });
                  }}>Limpiar</Button>
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {pagination.total} tickets — página {pagination.page} de {pagination.totalPages || 1}
                </div>
              </div>
            </div>

            {/* Paginación */}
            <div className="mt-4 flex items-center justify-end gap-2">
              <div className="flex items-center gap-2 text-sm">
                <label className="text-muted-foreground">Resultados por página:</label>
                <select value={pagination.limit} onChange={(e) => handleLimitChange(parseInt(e.target.value))} className="p-2 border rounded-md bg-background">
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => handlePageChange(1)} disabled={!pagination.hasPrevPage} className="h-8 w-8 p-0">«</Button>
                <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.page - 1)} disabled={!pagination.hasPrevPage} className="h-8 w-8 p-0">‹</Button>

                {Array.from({ length: Math.min(5, pagination.totalPages || 1) }, (_, i) => {
                  let pageNum;
                  const totalPages = pagination.totalPages || 1;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (pagination.page <= 3) pageNum = i + 1;
                  else if (pagination.page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = pagination.page - 2 + i;
                  if (pageNum < 1 || pageNum > totalPages) return null;
                  return (
                    <Button key={pageNum} variant={pagination.page === pageNum ? "default" : "outline"} size="sm" onClick={() => handlePageChange(pageNum)} className="h-8 w-8 p-0">
                      {pageNum}
                    </Button>
                  );
                })}

                <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.page + 1)} disabled={!pagination.hasNextPage} className="h-8 w-8 p-0">›</Button>
                <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.totalPages)} disabled={!pagination.hasNextPage} className="h-8 w-8 p-0">»</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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


      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Exportar Tickets</DialogTitle>
            <DialogDescription>
              {isLoading ? (
                "Cargando todos los tickets para exportar..."
              ) : (
                `Exporte todos los tickets de la empresa (sin límite de paginación)`
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2 ml-2">Cargando todos los tickets...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Formato de exportación</Label>
                <div className="flex gap-4">
                  <Button
                    onClick={exportToCSV}
                    className="flex-1 bg-accent hover:bg-accent/90"
                    disabled={isLoading}
                  >
                    CSV
                  </Button>
                  <Button
                    onClick={exportToXLSX}
                    className="flex-1 bg-accent hover:bg-accent/90"
                    disabled={isLoading}
                  >
                    XLSX
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsExportDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Render usamos tickets (respuesta del servidor) */}
      {!isLoading && tickets.length > 0 && viewMode === "cards" && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tickets.map((ticket, index) => {
            const isCanceling = cancelingId === String(ticket.id);
            return (
              <Card key={ticket.id} className="border-2 hover:border-primary transition-all duration-300 hover:shadow-xl animate-in fade-in zoom-in" style={{ animationDelay: `${index * 100}ms` }}>
                <CardHeader>
                  <div className="flex flex-col gap-5 justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-lg">{getStatusIcon(ticket.ticketStatus)}</div>
                      <div>
                        <CardTitle className="text-lg">{ticket.pnrNumber ?? "-"}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">{getStatusBadge(ticket.ticketStatus)}</CardDescription>
                      </div>
                    </div>
                    {ticket.ticketStatus === "Confirmed" && <TicketPDFButton ticketNumber={ticket.ticketNumber} />}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Información del usuario y pasajero */}
                  <div className="p-3 bg-muted/10 rounded-md space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Usuario</p>
                        <p className="text-sm font-medium">{ticket.user?.nombre || "—"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">RUT Usuario</p>
                        <p className="text-sm font-medium">{ticket.user?.rut || "—"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Pasajero</p>
                        <p className="text-sm font-medium">{ticket.pasajero?.nombre || "—"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">RUT Pasajero</p>
                        <p className="text-sm font-medium">{ticket.pasajero?.rut || "—"}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Centro de Costo</p>
                      <p className="text-sm">{ticket.user?.centroCosto?.nombre || "—"}</p>
                    </div>
                  </div>

                  {/* Información del viaje */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{ticket.origin || "—"}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{ticket.destination || "—"}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDateOnly(ticket.travelDate)}</span>
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

                  {/* Monto */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <DollarSign className="h-3 w-3" />
                      Monto
                    </div>
                    <p className="text-lg font-bold">{formatCurrency(ticket.monto_boleto)}</p>
                  </div>

                  {/* Información de confirmación */}
                  <div className="pt-2 border-t">
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      <div>
                        <p>Confirmado: {ticket.confirmedAt ? formatDateTime(ticket.confirmedAt) : "—"}</p>
                      </div>
                      <div>
                        <p>ID Usuario: {ticket.id_User ?? "—"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Botón de anular */}
                  {ticket.ticketStatus === "Confirmed" && user?.role !== "contralor" && user?.role !== "auditoria" && !isPastTrip(ticket) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2 text-red-600 border-red-300 hover:bg-red-600 hover:text-white hover:border-red-400"
                      onClick={() => handleCancelBooking(ticket)}
                      disabled={isCanceling}
                    >
                      {isCanceling ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Anulando...
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" />
                          Anular Reserva
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && tickets.length > 0 && viewMode === "table" && (
        <Card>
          <CardContent className="p-0">
            <UITable>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Nombre Usuario</TableHead>
                  <TableHead>RUT Usuario</TableHead>
                  <TableHead>Nombre Pasajero</TableHead>
                  <TableHead>RUT Pasajero</TableHead>
                  <TableHead>Centro De Costo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Asiento</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Confirmado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => {
                  const isCanceling = cancelingId === String(ticket.id);
                  return (
                    <TableRow key={ticket.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg"><FileText className="h-4 w-4 text-primary" /></div>
                          <div><p className="text-sm text-muted-foreground">{ticket.pnrNumber ?? "-"}</p></div>
                        </div>
                      </TableCell>
                      <TableCell><p className="text-sm">{ticket.user?.nombre || "—"}</p></TableCell>
                      <TableCell><p className="text-sm text-muted-foreground">{ticket.user?.rut || "—"}</p></TableCell>
                      <TableCell><p className="text-sm ">{ticket.pasajero?.nombre || "—"}</p></TableCell>
                      <TableCell><p className="text-sm text-muted-foreground">{ticket.pasajero?.rut || "—"}</p></TableCell>
                      <TableCell><p className="text-sm">{ticket.user?.centroCosto?.nombre ?? "—"}</p></TableCell>
                      <TableCell>{getStatusBadge(ticket.ticketStatus)}</TableCell>
                      <TableCell><p className="font-medium">{ticket.origin || "—"}</p></TableCell>
                      <TableCell><p className="font-medium">{ticket.destination || "—"}</p></TableCell>
                      <TableCell><div className="flex items-center gap-2"><Calendar className="h-3 w-3 text-muted-foreground" />{formatDateOnly(ticket.travelDate)}</div></TableCell>
                      <TableCell><div className="flex items-center gap-2"><Clock className="h-3 w-3 text-muted-foreground" />{ticket.departureTime}</div></TableCell>
                      <TableCell>{ticket.seatNumbers}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(ticket.monto_boleto)}</TableCell>
                      <TableCell><p className="text-sm">{ticket.confirmedAt ? formatDateTime(ticket.confirmedAt) : "—"}</p></TableCell>
                      <TableCell>{ticket.ticketStatus === "Confirmed" && <TicketPDFButton ticketNumber={ticket.ticketNumber} />}
                        {ticket.ticketStatus === "Confirmed" && user?.role !== "contralor" && user?.role !== "auditoria" && !isPastTrip(ticket) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 gap-2 text-red-600 border-red-300 hover:bg-red-600 hover:text-white hover:border-red-400"
                            onClick={() => handleCancelBooking(ticket)}
                            disabled={isCanceling}
                          >
                            {isCanceling ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Anulando...
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4" />
                                Anular Reserva
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </UITable>
          </CardContent>
        </Card>
      )}
    </div>
  );
}