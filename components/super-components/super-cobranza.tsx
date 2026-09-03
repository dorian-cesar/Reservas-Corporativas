"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/hooks/usePermissions";
import {
  PhoneCall,
  Mail,
  Users,
  Video,
  MessageSquare,
  DollarSign,
  FileText,
  MapPin,
  Clock,
  Calendar,
  HelpCircle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Download,
  Eye,
  Edit2,
  Trash2,
  Building2,
  UserCheck,
  TrendingUp,
  History,
  LayoutList,
  CalendarDays,
  CheckCircle2,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import Swal from "sweetalert2";
import { format } from "date-fns";

interface EmpresaOption {
  id: number;
  nombre: string;
  rut?: string;
  contacto_fact_nombre?: string;
  contacto_fact_email?: string;
  contacto_fact_telefono?: string;
  ejecutivo_com_nombre?: string;
  ejecutivo_com_email?: string;
  ejecutivo_com_telefono?: string;
}

interface CobranzaGestion {
  id: number;
  empresa_id: number;
  user_id: number;
  tipo_gestion: string;
  estado_gestion: string;
  contacto_nombre?: string | null;
  contacto_telefono?: string | null;
  contacto_email?: string | null;
  monto_compromiso?: number | null;
  fecha_compromiso?: string | null;
  observaciones?: string | null;
  proxima_accion?: string | null;
  fecha_proxima_accion?: string | null;
  fecha_gestion: string;
  created_at: string;
  updated_at: string;
  empresa?: {
    id: number;
    nombre: string;
    rut?: string;
    cuenta_corriente?: string;
  };
  user?: {
    id: number;
    nombre: string;
    email: string;
    rol?: string;
  };
}

interface CobranzaStats {
  totalGestiones: number;
  gestionesMes: number;
  compromisosPago: number;
  enSeguimiento: number;
  totalCompromisosMonto: number;
}

const TIPOS_GESTION = [
  {
    value: "Llamada Telefónica",
    label: "Llamada Telefónica",
    icon: PhoneCall,
    color:
      "text-blue-500 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800",
  },
  {
    value: "Envío de Email",
    label: "Envío de Email",
    icon: Mail,
    color:
      "text-indigo-500 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800",
  },
  {
    value: "Videollamada / Meet",
    label: "Videollamada / Meet",
    icon: Video,
    color:
      "text-violet-500 bg-violet-50 border-violet-200 dark:bg-violet-950/40 dark:border-violet-800",
  },
  {
    value: "Reunión Presencial",
    label: "Reunión Presencial",
    icon: Users,
    color:
      "text-purple-500 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800",
  },
  {
    value: "WhatsApp / Mensajería",
    label: "WhatsApp / Mensajería",
    icon: MessageSquare,
    color:
      "text-emerald-500 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800",
  },
  {
    value: "Compromiso de Pago",
    label: "Compromiso de Pago",
    icon: DollarSign,
    color:
      "text-amber-500 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800",
  },
  {
    value: "Envío de Carta Notificación",
    label: "Carta / Notificación",
    icon: FileText,
    color:
      "text-orange-500 bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-800",
  },
  {
    value: "Visita a Terreno",
    label: "Visita a Terreno",
    icon: MapPin,
    color:
      "text-rose-500 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800",
  },
  {
    value: "Otro",
    label: "Otro",
    icon: HelpCircle,
    color:
      "text-slate-500 bg-slate-50 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800",
  },
];

const ESTADOS_GESTION = [
  {
    value: "Contactado",
    label: "Contactado",
    badgeClass:
      "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300",
  },
  {
    value: "No Contesta",
    label: "No Contesta",
    badgeClass:
      "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300",
  },
  {
    value: "Compromiso de Pago",
    label: "Compromiso de Pago",
    badgeClass:
      "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300",
  },
  {
    value: "Pagado / Comprobante",
    label: "Pagado / Comprobante",
    badgeClass:
      "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300",
  },
  {
    value: "En Seguimiento",
    label: "En Seguimiento",
    badgeClass:
      "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300",
  },
  {
    value: "Rechaza Pago / Disputa",
    label: "Rechaza Pago / Disputa",
    badgeClass:
      "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300",
  },
  {
    value: "Datos Incorrectos",
    label: "Datos Incorrectos",
    badgeClass:
      "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300",
  },
  {
    value: "Finalizado",
    label: "Finalizado",
    badgeClass:
      "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300",
  },
];

export function SuperCobranza() {
  const { token } = useAuth();
  const { can } = usePermissions();

  // Estados de datos
  const [gestiones, setGestiones] = useState<CobranzaGestion[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaOption[]>([]);
  const [stats, setStats] = useState<CobranzaStats | null>(null);

  // Estados de paginación y carga
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(15);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);

  const [selectedEmpresaFilter, setSelectedEmpresaFilter] =
    useState<string>("all");
  const [selectedTipoFilter, setSelectedTipoFilter] = useState<string>("all");
  const [selectedEstadoFilter, setSelectedEstadoFilter] =
    useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [fechaDesde, setFechaDesde] = useState<string>("");
  const [fechaHasta, setFechaHasta] = useState<string>("");

  const [openFilterEmpresaCombo, setOpenFilterEmpresaCombo] =
    useState<boolean>(false);
  const [openCreateEmpresaCombo, setOpenCreateEmpresaCombo] =
    useState<boolean>(false);

  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [selectedGestion, setSelectedGestion] =
    useState<CobranzaGestion | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Formulario nuevo / edición
  const [formData, setFormData] = useState({
    empresa_id: "",
    tipo_gestion: "Llamada Telefónica",
    estado_gestion: "Contactado",
    contacto_nombre: "",
    contacto_telefono: "",
    contacto_email: "",
    monto_compromiso: "",
    fecha_compromiso: "",
    observaciones: "",
    proxima_accion: "",
    fecha_proxima_accion: "",
    fecha_gestion: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  });

  // Cargar lista de empresas para selects y combobox
  const fetchEmpresas = async () => {
    try {
      const res = await fetch("/api/companies", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : data.data || data.empresas || data.companies || [];
        setEmpresas(list);
      }
    } catch (err) {
      console.error("Error al cargar empresas:", err);
    }
  };

  // Cargar estadísticas
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/cobranzas/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error al cargar estadísticas:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Cargar listado de gestiones
  const fetchGestiones = async (currentPage = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(limit),
      });

      if (selectedEmpresaFilter !== "all")
        params.append("empresa_id", selectedEmpresaFilter);
      if (selectedTipoFilter !== "all")
        params.append("tipo_gestion", selectedTipoFilter);
      if (selectedEstadoFilter !== "all")
        params.append("estado_gestion", selectedEstadoFilter);
      if (searchTerm.trim()) params.append("search", searchTerm.trim());
      if (fechaDesde) params.append("fecha_desde", fechaDesde);
      if (fechaHasta) params.append("fecha_hasta", fechaHasta);

      const res = await fetch(`/api/cobranzas?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const incoming = data.gestiones || [];
        if (append) {
          setGestiones((prev) => [...prev, ...incoming]);
        } else {
          setGestiones(incoming);
        }
        setPage(currentPage);
        setTotalPages(data.totalPages || 1);
        setTotalRecords(data.total || 0);
      } else {
        const error = await res.json();
        console.error("Error al obtener gestiones:", error);
      }
    } catch (err) {
      console.error("Error en petición de gestiones:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchEmpresas();
      fetchStats();
      fetchGestiones(1);
    }
  }, [token]);

  // Manejar cambio de filtros
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchGestiones(1);
  };

  const handleResetFilters = () => {
    setSelectedEmpresaFilter("all");
    setSelectedTipoFilter("all");
    setSelectedEstadoFilter("all");
    setSearchTerm("");
    setFechaDesde("");
    setFechaHasta("");
    setPage(1);
    setTimeout(() => {
      fetchGestiones(1);
    }, 50);
  };

  // Autocompletar datos del contacto de facturación al seleccionar empresa en el form
  const handleEmpresaChange = (empresaId: string) => {
    const selected = empresas.find((e) => String(e.id) === String(empresaId));
    setFormData((prev) => ({
      ...prev,
      empresa_id: empresaId,
      contacto_nombre: selected?.contacto_fact_nombre || "",
      contacto_email: selected?.contacto_fact_email || "",
      contacto_telefono: selected?.contacto_fact_telefono || "",
    }));
  };

  // Abrir modal de creación
  const handleOpenCreate = () => {
    setFormData({
      empresa_id: "",
      tipo_gestion: "Llamada Telefónica",
      estado_gestion: "Contactado",
      contacto_nombre: "",
      contacto_telefono: "",
      contacto_email: "",
      monto_compromiso: "",
      fecha_compromiso: "",
      observaciones: "",
      proxima_accion: "",
      fecha_proxima_accion: "",
      fecha_gestion: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    });
    setIsCreateOpen(true);
  };

  // Guardar nueva gestión
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.empresa_id) {
      Swal.fire({
        icon: "warning",
        title: "Empresa requerida",
        text: "Por favor selecciona una empresa para registrar la gestión.",
      });
      return;
    }

    const todayStr = format(new Date(), "yyyy-MM-dd");
    if (formData.fecha_compromiso && formData.fecha_compromiso < todayStr) {
      Swal.fire({
        icon: "warning",
        title: "Fecha de pago inválida",
        text: "La fecha de compromiso de pago no puede ser anterior al día de hoy.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        empresa_id: Number(formData.empresa_id),
        tipo_gestion: formData.tipo_gestion,
        estado_gestion: formData.estado_gestion,
        contacto_nombre: formData.contacto_nombre.trim() || null,
        contacto_telefono: formData.contacto_telefono.trim() || null,
        contacto_email: formData.contacto_email.trim() || null,
        monto_compromiso: formData.monto_compromiso
          ? Number(formData.monto_compromiso)
          : null,
        fecha_compromiso: formData.fecha_compromiso || null,
        observaciones: formData.observaciones.trim() || null,
        proxima_accion: formData.proxima_accion.trim() || null,
        fecha_proxima_accion: formData.fecha_proxima_accion || null,
        fecha_gestion: formData.fecha_gestion
          ? new Date(formData.fecha_gestion)
          : new Date(),
      };

      const res = await fetch("/api/cobranzas", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setIsCreateOpen(false);
        Swal.fire({
          icon: "success",
          title: "¡Gestión Registrada!",
          text: "La actividad de cobranza ha sido registrada exitosamente.",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchGestiones(1);
        fetchStats();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message || "No se pudo registrar la gestión.",
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: err.message || "Error al conectar con el servidor.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Abrir modal de edición
  const handleOpenEdit = (gestion: CobranzaGestion) => {
    setSelectedGestion(gestion);
    setFormData({
      empresa_id: String(gestion.empresa_id),
      tipo_gestion: gestion.tipo_gestion,
      estado_gestion: gestion.estado_gestion,
      contacto_nombre: gestion.contacto_nombre || "",
      contacto_telefono: gestion.contacto_telefono || "",
      contacto_email: gestion.contacto_email || "",
      monto_compromiso: gestion.monto_compromiso
        ? String(gestion.monto_compromiso)
        : "",
      fecha_compromiso: gestion.fecha_compromiso
        ? gestion.fecha_compromiso.substring(0, 10)
        : "",
      observaciones: gestion.observaciones || "",
      proxima_accion: gestion.proxima_accion || "",
      fecha_proxima_accion: gestion.fecha_proxima_accion
        ? gestion.fecha_proxima_accion.substring(0, 10)
        : "",
      fecha_gestion: gestion.fecha_gestion
        ? format(new Date(gestion.fecha_gestion), "yyyy-MM-dd'T'HH:mm")
        : "",
    });
    setIsEditOpen(true);
  };

  // Guardar edición
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGestion) return;

    const todayStr = format(new Date(), "yyyy-MM-dd");
    if (formData.fecha_compromiso && formData.fecha_compromiso < todayStr) {
      Swal.fire({
        icon: "warning",
        title: "Fecha de pago inválida",
        text: "La fecha de compromiso de pago no puede ser anterior al día de hoy.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        tipo_gestion: formData.tipo_gestion,
        estado_gestion: formData.estado_gestion,
        contacto_nombre: formData.contacto_nombre.trim() || null,
        contacto_telefono: formData.contacto_telefono.trim() || null,
        contacto_email: formData.contacto_email.trim() || null,
        monto_compromiso: formData.monto_compromiso
          ? Number(formData.monto_compromiso)
          : null,
        fecha_compromiso: formData.fecha_compromiso || null,
        observaciones: formData.observaciones.trim() || null,
        proxima_accion: formData.proxima_accion.trim() || null,
        fecha_proxima_accion: formData.fecha_proxima_accion || null,
        fecha_gestion: formData.fecha_gestion
          ? new Date(formData.fecha_gestion)
          : new Date(),
      };

      const res = await fetch(`/api/cobranzas/${selectedGestion.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setIsEditOpen(false);
        setSelectedGestion(null);
        Swal.fire({
          icon: "success",
          title: "¡Gestión Actualizada!",
          text: "Los cambios han sido guardados correctamente.",
          timer: 1800,
          showConfirmButton: false,
        });
        fetchGestiones(page);
        fetchStats();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message || "No se pudo actualizar la gestión.",
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Error al conectar con el servidor.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Eliminar gestión
  const handleDelete = async (gestion: CobranzaGestion) => {
    const result = await Swal.fire({
      title: "¿Eliminar gestión?",
      text: `Se eliminará el registro de actividad para "${gestion.empresa?.nombre || "la empresa"}". Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/cobranzas/${gestion.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          Swal.fire({
            icon: "success",
            title: "Eliminado",
            text: "El registro ha sido eliminado.",
            timer: 1500,
            showConfirmButton: false,
          });
          fetchGestiones(page);
          fetchStats();
        } else {
          const data = await res.json();
          Swal.fire({
            icon: "error",
            title: "Error",
            text: data.message || "No se pudo eliminar.",
          });
        }
      } catch (err: any) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.message || "Error al conectar con el servidor.",
        });
      }
    }
  };

  // Exportar a CSV
  const handleExportCSV = () => {
    if (gestiones.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Sin datos",
        text: "No hay registros disponibles para exportar.",
      });
      return;
    }

    const headers = [
      "ID",
      "Fecha Gestión",
      "Empresa",
      "RUT Empresa",
      "Tipo Gestión",
      "Estado / Resultado",
      "Contacto Nombre",
      "Contacto Teléfono",
      "Contacto Email",
      "Monto Compromiso",
      "Fecha Compromiso",
      "Próxima Acción",
      "Fecha Próxima Acción",
      "Usuario Registro",
      "Observaciones",
    ];

    const rows = gestiones.map((g) => [
      g.id,
      g.fecha_gestion
        ? format(new Date(g.fecha_gestion), "dd/MM/yyyy HH:mm")
        : "",
      `"${(g.empresa?.nombre || "").replace(/"/g, '""')}"`,
      `"${g.empresa?.rut || ""}"`,
      `"${g.tipo_gestion}"`,
      `"${g.estado_gestion}"`,
      `"${(g.contacto_nombre || "").replace(/"/g, '""')}"`,
      `"${g.contacto_telefono || ""}"`,
      `"${g.contacto_email || ""}"`,
      g.monto_compromiso || "",
      g.fecha_compromiso || "",
      `"${(g.proxima_accion || "").replace(/"/g, '""')}"`,
      g.fecha_proxima_accion || "",
      `"${(g.user?.nombre || "").replace(/"/g, '""')}"`,
      `"${(g.observaciones || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `crm_cobranzas_${format(new Date(), "yyyyMMdd_HHmm")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper para renderizar icono del tipo de gestión
  const renderTipoBadge = (tipo: string) => {
    const item = TIPOS_GESTION.find((t) => t.value === tipo);
    const IconComponent = item?.icon || PhoneCall;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
          item?.color || "bg-muted text-muted-foreground border-border"
        }`}
      >
        <IconComponent className="h-3.5 w-3.5" />
        {tipo}
      </span>
    );
  };

  // Helper para renderizar badge del estado
  const renderEstadoBadge = (estado: string) => {
    const item = ESTADOS_GESTION.find((e) => e.value === estado);
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
          item?.badgeClass || "bg-secondary text-secondary-foreground"
        }`}
      >
        {estado}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Encabezado del Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            CRM de Cobranza y Gestión de Clientes
          </h2>
          <p className="text-sm text-muted-foreground">
            Registro, historial y seguimiento de interacciones de cobranza con
            empresas clientes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchGestiones(page);
              fetchStats();
            }}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          {can("cobranza_crear") && (
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
            >
              <Plus className="h-4 w-4" />
              Registrar Gestión
            </Button>
          )}
        </div>
      </div>

      {/* Tarjetas de Métricas / KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-xs border-primary/20 bg-linear-to-br from-card to-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Gestiones
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading
                ? "..."
                : stats?.totalGestiones.toLocaleString("es-CL") || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Actividades históricas registradas
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-blue-500/20 bg-linear-to-br from-card to-blue-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gestiones este Mes
            </CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-full text-blue-500">
              <CalendarDays className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {statsLoading
                ? "..."
                : stats?.gestionesMes.toLocaleString("es-CL") || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              En el mes en curso
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-amber-500/20 bg-linear-to-br from-card to-amber-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Compromisos de Pago
            </CardTitle>
            <div className="p-2 bg-amber-500/10 rounded-full text-amber-500">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {statsLoading
                ? "..."
                : stats?.compromisosPago.toLocaleString("es-CL") || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Monto:{" "}
              <span className="font-semibold text-foreground">
                $
                {Number(stats?.totalCompromisosMonto || 0).toLocaleString(
                  "es-CL",
                )}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-purple-500/20 bg-linear-to-br from-card to-purple-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En Seguimiento
            </CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-full text-purple-500">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {statsLoading
                ? "..."
                : stats?.enSeguimiento.toLocaleString("es-CL") || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Casos con acciones pendientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros de Búsqueda */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              Filtros y Búsqueda
            </CardTitle>
            <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/40">
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs gap-1"
                onClick={() => setViewMode("table")}
              >
                <LayoutList className="h-3.5 w-3.5" />
                Tabla
              </Button>
              <Button
                variant={viewMode === "timeline" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs gap-1"
                onClick={() => setViewMode("timeline")}
              >
                <History className="h-3.5 w-3.5" />
                Línea de Tiempo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFilterSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Filtro Empresa con ComboBox */}
              <div className="space-y-1">
                <Label className="text-xs">Empresa</Label>
                <Popover
                  open={openFilterEmpresaCombo}
                  onOpenChange={setOpenFilterEmpresaCombo}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openFilterEmpresaCombo}
                      className="h-9 text-xs w-full justify-between font-normal bg-background px-2.5 overflow-hidden"
                    >
                      <span className="truncate">
                        {selectedEmpresaFilter === "all"
                          ? "Todas las empresas"
                          : empresas.find(
                              (e) => String(e.id) === selectedEmpresaFilter,
                            )?.nombre || "Empresa seleccionada"}
                      </span>
                      <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[300px] p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput placeholder="Buscar empresa o RUT..." />
                      <CommandList>
                        <CommandEmpty>No se encontró la empresa.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="all Todas las empresas"
                            onSelect={() => {
                              setSelectedEmpresaFilter("all");
                              setOpenFilterEmpresaCombo(false);
                            }}
                            className="cursor-pointer text-xs"
                          >
                            <Check
                              className={`mr-2 h-3.5 w-3.5 ${
                                selectedEmpresaFilter === "all"
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            Todas las empresas
                          </CommandItem>
                          {empresas.map((emp) => (
                            <CommandItem
                              key={emp.id}
                              value={`${emp.id} ${emp.nombre} ${emp.rut || ""}`}
                              onSelect={() => {
                                setSelectedEmpresaFilter(String(emp.id));
                                setOpenFilterEmpresaCombo(false);
                              }}
                              className="cursor-pointer text-xs"
                            >
                              <Check
                                className={`mr-2 h-3.5 w-3.5 ${
                                  selectedEmpresaFilter === String(emp.id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              <span className="truncate font-medium">
                                {emp.nombre}
                              </span>
                              {emp.rut && (
                                <span className="ml-1 text-muted-foreground text-[11px] shrink-0">
                                  ({emp.rut})
                                </span>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Filtro Tipo */}
              <div className="space-y-1">
                <Label className="text-xs">Tipo de Gestión</Label>
                <Select
                  value={selectedTipoFilter}
                  onValueChange={setSelectedTipoFilter}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    {TIPOS_GESTION.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro Estado */}
              <div className="space-y-1">
                <Label className="text-xs">Resultado / Estado</Label>
                <Select
                  value={selectedEstadoFilter}
                  onValueChange={setSelectedEstadoFilter}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    {ESTADOS_GESTION.map((est) => (
                      <SelectItem key={est.value} value={est.value}>
                        {est.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fecha Desde */}
              <div className="space-y-1">
                <Label className="text-xs">Desde</Label>
                <Input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Fecha Hasta */}
              <div className="space-y-1">
                <Label className="text-xs">Hasta</Label>
                <Input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Buscar texto */}
              <div className="space-y-1">
                <Label className="text-xs">Búsqueda rápida</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Contacto, nota, RUT..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 pl-8 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 text-xs"
              >
                Limpiar Filtros
              </Button>
              <Button type="submit" size="sm" className="h-8 text-xs gap-1.5">
                <Search className="h-3.5 w-3.5" />
                Aplicar Filtros
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Contenedor Principal: Vista Tabla o Vista Timeline */}
      {viewMode === "table" ? (
        <Card className="shadow-xs overflow-hidden">
          <CardHeader className="py-4 px-6 border-b bg-muted/20 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Historial de Gestiones
              </CardTitle>
              <CardDescription className="text-xs">
                {totalRecords} registro(s) encontrado(s)
              </CardDescription>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-28">Fecha / Hora</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="w-36">Tipo de Gestión</TableHead>
                  <TableHead className="w-32">Resultado</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Compromiso / Próx. Acción</TableHead>
                  <TableHead className="w-32">Registrado por</TableHead>
                  <TableHead className="text-right w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-sm">
                          Cargando gestiones de cobranza...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : gestiones.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <DollarSign className="h-8 w-8 text-muted-foreground/50" />
                        <span className="font-medium text-foreground">
                          No se encontraron gestiones
                        </span>
                        <p className="text-xs text-muted-foreground">
                          Comienza registrando una nueva actividad usando el
                          botón superior "Registrar Gestión".
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  gestiones.map((gestion) => (
                    <TableRow
                      key={gestion.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Fecha */}
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        <div className="font-semibold text-foreground">
                          {format(
                            new Date(gestion.fecha_gestion),
                            "dd/MM/yyyy",
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3 inline" />
                          {format(new Date(gestion.fecha_gestion), "HH:mm")} hrs
                        </div>
                      </TableCell>

                      {/* Empresa */}
                      <TableCell className="whitespace-normal break-words">
                        <div className="font-medium text-xs sm:text-sm text-foreground flex items-start gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                          <span className="break-words leading-snug">
                            {gestion.empresa?.nombre ||
                              `Empresa #${gestion.empresa_id}`}
                          </span>
                        </div>
                        {gestion.empresa?.rut && (
                          <div className="text-[11px] text-muted-foreground pl-5 mt-0.5">
                            RUT: {gestion.empresa.rut}
                          </div>
                        )}
                      </TableCell>

                      {/* Tipo */}
                      <TableCell className="whitespace-nowrap">
                        {renderTipoBadge(gestion.tipo_gestion)}
                      </TableCell>

                      {/* Estado */}
                      <TableCell className="whitespace-nowrap">
                        {renderEstadoBadge(gestion.estado_gestion)}
                      </TableCell>

                      {/* Contacto */}
                      <TableCell className="text-xs whitespace-normal break-words">
                        {gestion.contacto_nombre ? (
                          <div className="space-y-0.5">
                            <div className="font-medium text-foreground break-words leading-tight">
                              {gestion.contacto_nombre}
                            </div>
                            <div className="text-[11px] text-muted-foreground break-all">
                              {gestion.contacto_telefono ||
                                gestion.contacto_email ||
                                "Sin datos de contacto"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">
                            No especificado
                          </span>
                        )}
                      </TableCell>

                      {/* Compromiso / Próx Acción */}
                      <TableCell className="text-xs whitespace-normal break-words">
                        {gestion.monto_compromiso ? (
                          <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                            <span className="font-semibold text-xs">
                              $
                              {Number(gestion.monto_compromiso).toLocaleString(
                                "es-CL",
                              )}
                            </span>
                            {gestion.fecha_compromiso && (
                              <span className="text-[11px] text-muted-foreground block">
                                Límite:{" "}
                                {format(
                                  new Date(gestion.fecha_compromiso),
                                  "dd/MM/yyyy",
                                )}
                              </span>
                            )}
                          </div>
                        ) : gestion.proxima_accion ? (
                          <div className="text-purple-600 dark:text-purple-400">
                            <span className="font-medium block leading-tight break-words">
                              {gestion.proxima_accion}
                            </span>
                            {gestion.fecha_proxima_accion && (
                              <span className="text-[11px] text-muted-foreground block mt-0.5">
                                Fecha:{" "}
                                {format(
                                  new Date(gestion.fecha_proxima_accion),
                                  "dd/MM/yyyy",
                                )}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            -
                          </span>
                        )}
                      </TableCell>

                      {/* Usuario */}
                      <TableCell className="text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <UserCheck className="h-3.5 w-3.5 text-primary" />
                          <span>{gestion.user?.nombre || "Usuario"}</span>
                        </div>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Ver Detalle"
                            onClick={() => {
                              setSelectedGestion(gestion);
                              setIsDetailOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            title="Editar"
                            onClick={() => handleOpenEdit(gestion)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {can("cobranza_eliminar") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Eliminar"
                              onClick={() => handleDelete(gestion)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="py-3 px-6 border-t flex items-center justify-between text-xs text-muted-foreground">
              <div>
                Página{" "}
                <span className="font-semibold text-foreground">{page}</span> de{" "}
                <span className="font-semibold text-foreground">
                  {totalPages}
                </span>{" "}
                ({totalRecords} total)
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => {
                    const newPage = page - 1;
                    setPage(newPage);
                    fetchGestiones(newPage);
                  }}
                  className="h-7 text-xs"
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => {
                    const newPage = page + 1;
                    setPage(newPage);
                    fetchGestiones(newPage);
                  }}
                  className="h-7 text-xs"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </Card>
      ) : (
        /* Vista Línea de Tiempo / CRM */
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
              Cargando historial de actividades...
            </div>
          ) : gestiones.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No hay actividades para mostrar en este criterio.
            </Card>
          ) : (
            <div className="relative border-l-2 border-primary/20 ml-3 pl-5 space-y-3">
              {gestiones.map((gestion) => (
                <div key={gestion.id} className="relative group">
                  {/* Punto en la línea de tiempo */}
                  <div className="absolute -left-[27px] top-2.5 h-4 w-4 rounded-full border-2 border-primary bg-background flex items-center justify-center text-primary group-hover:scale-125 transition-transform">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </div>

                  <Card className="shadow-xs hover:border-primary/40 transition-colors gap-2.5 p-3.5 text-xs">
                    {/* Fila superior: Empresa, RUT, Badges, Fecha */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-semibold text-xs sm:text-sm text-foreground">
                          {gestion.empresa?.nombre ||
                            `Empresa #${gestion.empresa_id}`}
                        </span>
                        {gestion.empresa?.rut && (
                          <span className="text-[11px] text-muted-foreground font-mono">
                            ({gestion.empresa.rut})
                          </span>
                        )}
                        {renderTipoBadge(gestion.tipo_gestion)}
                        {renderEstadoBadge(gestion.estado_gestion)}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono shrink-0">
                        <Calendar className="h-3 w-3" />
                        {format(
                          new Date(gestion.fecha_gestion),
                          "dd/MM/yyyy HH:mm",
                        )}
                        {" hrs"}
                      </div>
                    </div>

                    {/* Observación / Minuta directa */}
                    {gestion.observaciones && (
                      <p className="text-muted-foreground bg-muted/25 border border-muted/40 p-2 px-2.5 rounded-md text-xs whitespace-pre-wrap break-all leading-relaxed">
                        {gestion.observaciones}
                      </p>
                    )}

                    {/* Metadatos en flex wrap compacto */}
                    {(gestion.contacto_nombre ||
                      gestion.monto_compromiso ||
                      gestion.proxima_accion) && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pt-0.5">
                        {gestion.contacto_nombre && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-3 w-3 text-primary shrink-0" />
                            <span className="font-medium text-foreground">
                              {gestion.contacto_nombre}
                            </span>
                            {gestion.contacto_telefono && (
                              <span className="text-[11px]">
                                ({gestion.contacto_telefono})
                              </span>
                            )}
                          </div>
                        )}
                        {gestion.monto_compromiso && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-emerald-600 shrink-0" />
                            <span className="text-muted-foreground">
                              Compromiso:
                            </span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              $
                              {Number(gestion.monto_compromiso).toLocaleString(
                                "es-CL",
                              )}
                            </span>
                            {gestion.fecha_compromiso && (
                              <span className="text-[11px] text-muted-foreground">
                                (Límite:{" "}
                                {format(
                                  new Date(gestion.fecha_compromiso),
                                  "dd/MM/yyyy",
                                )}
                                )
                              </span>
                            )}
                          </div>
                        )}
                        {gestion.proxima_accion && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-purple-600 shrink-0" />
                            <span className="text-muted-foreground">Próx:</span>
                            <span className="font-medium text-purple-600 dark:text-purple-400">
                              {gestion.proxima_accion}
                            </span>
                            {gestion.fecha_proxima_accion && (
                              <span className="text-[11px] text-muted-foreground">
                                (
                                {format(
                                  new Date(gestion.fecha_proxima_accion),
                                  "dd/MM/yyyy",
                                )}
                                )
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pie con usuario y acciones */}
                    <div className="flex items-center justify-between pt-1.5 border-t text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3 text-primary shrink-0" />
                        <span>
                          Por:{" "}
                          <strong className="text-foreground">
                            {gestion.user?.nombre}
                          </strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => {
                            setSelectedGestion(gestion);
                            setIsDetailOpen(true);
                          }}
                        >
                          Ver detalle
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          onClick={() => handleOpenEdit(gestion)}
                        >
                          Editar
                        </Button>
                        {can("cobranza_eliminar") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(gestion)}
                          >
                            Eliminar
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              ))}

              {/* Botón Cargar Más en Vista Línea de Tiempo */}
              {page < totalPages ? (
                <div className="pt-2 flex flex-col items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loadingMore}
                    onClick={() => fetchGestiones(page + 1, true)}
                    className="h-8 px-5 text-xs gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary transition-colors shadow-xs"
                  >
                    {loadingMore ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Cargando actividades...
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        Cargar más actividades
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                gestiones.length > 0 && (
                  <div className="pt-2 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Has llegado al final del historial
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR NUEVA GESTIÓN (MÁS ANCHO: max-w-4xl)                      */}
      {/* ========================================================================= */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-4xl lg:max-w-5xl w-[95vw] max-h-[92vh] overflow-y-auto">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Plus className="h-5 w-5" />
              </div>
              Registrar Nueva Actividad de Cobranza
            </DialogTitle>
            <DialogDescription className="text-sm">
              Ingresa el detalle de la interacción realizada con la empresa
              cliente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-5 pt-2">
            {/* Empresa y Fecha */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="empresa_select"
                  className="text-xs font-semibold"
                >
                  Empresa Cliente <span className="text-red-500">*</span>
                </Label>
                <Popover
                  open={openCreateEmpresaCombo}
                  onOpenChange={setOpenCreateEmpresaCombo}
                >
                  <PopoverTrigger asChild>
                    <Button
                      id="empresa_select"
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCreateEmpresaCombo}
                      className="h-10 text-xs w-full justify-between font-normal bg-background px-3 overflow-hidden"
                    >
                      <span className="truncate">
                        {formData.empresa_id
                          ? (() => {
                              const emp = empresas.find(
                                (e) => String(e.id) === formData.empresa_id,
                              );
                              return emp
                                ? `${emp.nombre} ${emp.rut ? `(${emp.rut})` : ""}`
                                : "Selecciona una empresa cliente...";
                            })()
                          : "Selecciona una empresa cliente..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    portal={false}
                    className="w-[var(--radix-popover-trigger-width)] min-w-[320px] max-w-[500px] p-0 z-[70]"
                    align="start"
                  >
                    <Command>
                      <CommandInput placeholder="Buscar por nombre, RUT o ID..." />
                      <CommandList>
                        <CommandEmpty>No se encontró la empresa.</CommandEmpty>
                        <CommandGroup>
                          {empresas.map((emp) => (
                            <CommandItem
                              key={emp.id}
                              value={`${emp.id} ${emp.nombre} ${emp.rut || ""}`}
                              onSelect={() => {
                                handleEmpresaChange(String(emp.id));
                                setOpenCreateEmpresaCombo(false);
                              }}
                              onClick={() => {
                                handleEmpresaChange(String(emp.id));
                                setOpenCreateEmpresaCombo(false);
                              }}
                              className="cursor-pointer text-xs"
                            >
                              <Check
                                className={`mr-2 h-3.5 w-3.5 ${
                                  formData.empresa_id === String(emp.id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              <span className="font-medium truncate">
                                {emp.nombre}
                              </span>
                              {emp.rut && (
                                <span className="ml-1 text-muted-foreground text-[11px] shrink-0">
                                  ({emp.rut})
                                </span>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="fecha_gestion"
                  className="text-xs font-semibold"
                >
                  Fecha y Hora de la Gestión{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fecha_gestion"
                  type="datetime-local"
                  value={formData.fecha_gestion}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fecha_gestion: e.target.value,
                    }))
                  }
                  required
                  className="text-xs h-10"
                />
              </div>
            </div>

            {/* Tipo de Gestión y Resultado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Tipo de Actividad / Canal{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.tipo_gestion}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, tipo_gestion: val }))
                  }
                  required
                >
                  <SelectTrigger className="text-xs h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_GESTION.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <t.icon className="h-4 w-4 text-muted-foreground" />
                          <span>{t.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Resultado / Estado de la Gestión{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.estado_gestion}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, estado_gestion: val }))
                  }
                  required
                >
                  <SelectTrigger className="text-xs h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_GESTION.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Datos del Contacto en la Empresa */}
            <div className="p-4 bg-muted/40 rounded-xl border space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Users className="h-4 w-4 text-primary" />
                Datos de la Persona Contactada en la Empresa
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="contacto_nombre" className="text-xs">
                    Nombre Completo
                  </Label>
                  <Input
                    id="contacto_nombre"
                    placeholder="Ej: Juan Pérez"
                    value={formData.contacto_nombre}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contacto_nombre: e.target.value,
                      }))
                    }
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contacto_telefono" className="text-xs">
                    Teléfono directo / Celular
                  </Label>
                  <Input
                    id="contacto_telefono"
                    placeholder="+56 9 1234 5678"
                    value={formData.contacto_telefono}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contacto_telefono: e.target.value,
                      }))
                    }
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contacto_email" className="text-xs">
                    Correo Electrónico
                  </Label>
                  <Input
                    id="contacto_email"
                    type="email"
                    placeholder="contacto@empresa.cl"
                    value={formData.contacto_email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contacto_email: e.target.value,
                      }))
                    }
                    className="text-xs h-9"
                  />
                </div>
              </div>
            </div>

            {/* Compromiso de Pago y Próxima Acción en 2 Columnas Grandes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Compromiso de Pago (Opcional) */}
              <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20 space-y-3">
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4" />
                  Compromiso de Pago
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="monto_compromiso" className="text-xs">
                      Monto Acordado ($CLP)
                    </Label>
                    <Input
                      id="monto_compromiso"
                      type="number"
                      min="0"
                      placeholder="Ej: 500000"
                      value={formData.monto_compromiso}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          monto_compromiso: e.target.value,
                        }))
                      }
                      className="text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="fecha_compromiso" className="text-xs">
                      Fecha de Pago
                    </Label>
                    <Input
                      id="fecha_compromiso"
                      type="date"
                      min={format(new Date(), "yyyy-MM-dd")}
                      value={formData.fecha_compromiso}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          fecha_compromiso: e.target.value,
                        }))
                      }
                      className="text-xs h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Próxima Acción y Seguimiento */}
              <div className="p-4 bg-purple-500/5 rounded-xl border border-purple-500/20 space-y-3">
                <span className="text-xs font-semibold text-purple-800 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Próxima Acción / Seguimiento
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="proxima_accion" className="text-xs">
                      Tarea / Acción
                    </Label>
                    <Input
                      id="proxima_accion"
                      placeholder="Ej: Volver a llamar..."
                      value={formData.proxima_accion}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          proxima_accion: e.target.value,
                        }))
                      }
                      className="text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="fecha_proxima_accion" className="text-xs">
                      Fecha Seguimiento
                    </Label>
                    <Input
                      id="fecha_proxima_accion"
                      type="date"
                      value={formData.fecha_proxima_accion}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          fecha_proxima_accion: e.target.value,
                        }))
                      }
                      className="text-xs h-9"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Observaciones y Notas */}
            <div className="space-y-1.5">
              <Label htmlFor="observaciones" className="text-xs font-semibold">
                Observaciones y Minuta de la Gestión
              </Label>
              <Textarea
                id="observaciones"
                rows={4}
                placeholder="Detalla lo conversado con el cliente, acuerdos alcanzados, objeciones planteadas o notas importantes para su revisión..."
                value={formData.observaciones}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    observaciones: e.target.value,
                  }))
                }
                className="text-xs min-h-[110px] w-full resize-y break-words leading-relaxed"
              />
            </div>

            <DialogFooter className="pt-3 border-t flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={submitting}
                className="text-xs h-9"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="text-xs h-9 gap-1.5 bg-primary text-primary-foreground px-5 shadow-xs"
              >
                {submitting && (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                )}
                Guardar Gestión
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: EDITAR GESTIÓN (MÁS ANCHO: max-w-4xl)                               */}
      {/* ========================================================================= */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-4xl lg:max-w-5xl w-[95vw] max-h-[92vh] overflow-y-auto">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600">
                <Edit2 className="h-5 w-5" />
              </div>
              Editar Gestión de Cobranza #{selectedGestion?.id}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Empresa: <strong>{selectedGestion?.empresa?.nombre}</strong> (
              {selectedGestion?.empresa?.rut || "Sin RUT"})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-5 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Tipo de Actividad
                </Label>
                <Select
                  value={formData.tipo_gestion}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, tipo_gestion: val }))
                  }
                  required
                >
                  <SelectTrigger className="text-xs h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_GESTION.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <t.icon className="h-4 w-4 text-muted-foreground" />
                          <span>{t.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Resultado / Estado
                </Label>
                <Select
                  value={formData.estado_gestion}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, estado_gestion: val }))
                  }
                  required
                >
                  <SelectTrigger className="text-xs h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_GESTION.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-4 bg-muted/40 rounded-xl border space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Users className="h-4 w-4 text-primary" />
                Datos de la Persona Contactada
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre Contacto</Label>
                  <Input
                    value={formData.contacto_nombre}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contacto_nombre: e.target.value,
                      }))
                    }
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Teléfono</Label>
                  <Input
                    value={formData.contacto_telefono}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contacto_telefono: e.target.value,
                      }))
                    }
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Correo</Label>
                  <Input
                    type="email"
                    value={formData.contacto_email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contacto_email: e.target.value,
                      }))
                    }
                    className="text-xs h-9"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20 space-y-3">
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4" />
                  Compromiso de Pago
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Monto Compromiso ($CLP)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.monto_compromiso}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          monto_compromiso: e.target.value,
                        }))
                      }
                      className="text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fecha Compromiso</Label>
                    <Input
                      type="date"
                      min={format(new Date(), "yyyy-MM-dd")}
                      value={formData.fecha_compromiso}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          fecha_compromiso: e.target.value,
                        }))
                      }
                      className="text-xs h-9"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-purple-500/5 rounded-xl border border-purple-500/20 space-y-3">
                <span className="text-xs font-semibold text-purple-800 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Próxima Acción
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Próxima Acción</Label>
                    <Input
                      value={formData.proxima_accion}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          proxima_accion: e.target.value,
                        }))
                      }
                      className="text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fecha Próx. Acción</Label>
                    <Input
                      type="date"
                      value={formData.fecha_proxima_accion}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          fecha_proxima_accion: e.target.value,
                        }))
                      }
                      className="text-xs h-9"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Observaciones y Minuta de la Gestión
              </Label>
              <Textarea
                rows={4}
                placeholder="Detalla lo conversado con el cliente, acuerdos alcanzados, notas importantes..."
                value={formData.observaciones}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    observaciones: e.target.value,
                  }))
                }
                className="text-xs min-h-[110px] w-full resize-y break-words leading-relaxed"
              />
            </div>

            <DialogFooter className="pt-3 border-t flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={submitting}
                className="text-xs h-9"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="text-xs h-9 gap-1.5 bg-primary text-primary-foreground px-5 shadow-xs"
              >
                {submitting && (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                )}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: VER DETALLE COMPLETO (max-w-2xl)                                   */}
      {/* ========================================================================= */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-2xl lg:max-w-3xl w-[95vw] max-h-[92vh] overflow-y-auto">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Eye className="h-5 w-5" />
              </div>
              Detalle de Gestión de Cobranza #{selectedGestion?.id}
            </DialogTitle>
          </DialogHeader>

          {selectedGestion && (
            <div className="space-y-4 text-xs pt-2">
              <div className="p-4 bg-muted/40 rounded-xl space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">
                    Empresa Cliente:
                  </span>
                  <span className="font-bold text-sm text-foreground">
                    {selectedGestion.empresa?.nombre} (
                    {selectedGestion.empresa?.rut || "Sin RUT"})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">
                    Fecha y Hora de Gestión:
                  </span>
                  <span className="font-semibold font-mono text-xs">
                    {format(
                      new Date(selectedGestion.fecha_gestion),
                      "dd/MM/yyyy HH:mm",
                    )}{" "}
                    hrs
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">
                    Tipo de Actividad:
                  </span>
                  <div>{renderTipoBadge(selectedGestion.tipo_gestion)}</div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">
                    Resultado / Estado:
                  </span>
                  <div>{renderEstadoBadge(selectedGestion.estado_gestion)}</div>
                </div>
              </div>

              <div className="p-4 border rounded-xl space-y-2 bg-card">
                <span className="font-semibold text-foreground block border-b pb-1 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  Persona Contactada
                </span>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Nombre:
                    </span>
                    <span className="font-medium text-xs">
                      {selectedGestion.contacto_nombre || "No especificado"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Teléfono:
                    </span>
                    <span className="font-medium text-xs">
                      {selectedGestion.contacto_telefono || "No especificado"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground block text-[11px]">
                      Correo Electrónico:
                    </span>
                    <span className="font-medium text-xs break-all">
                      {selectedGestion.contacto_email || "No especificado"}
                    </span>
                  </div>
                </div>
              </div>

              {(selectedGestion.monto_compromiso ||
                selectedGestion.fecha_compromiso) && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5">
                  <span className="font-semibold text-amber-800 dark:text-amber-300 block flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4" />
                    Compromiso de Pago Acordado
                  </span>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Monto:</span>
                    <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                      $
                      {Number(
                        selectedGestion.monto_compromiso || 0,
                      ).toLocaleString("es-CL")}
                    </span>
                  </div>
                  {selectedGestion.fecha_compromiso && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Fecha Límite:
                      </span>
                      <span className="font-semibold font-mono">
                        {format(
                          new Date(selectedGestion.fecha_compromiso),
                          "dd/MM/yyyy",
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {selectedGestion.observaciones && (
                <div className="p-4 bg-muted/20 border rounded-xl space-y-1 overflow-hidden">
                  <span className="font-semibold text-foreground block">
                    Observaciones y Minuta:
                  </span>
                  <p className="text-muted-foreground whitespace-pre-wrap break-all text-xs leading-relaxed">
                    {selectedGestion.observaciones}
                  </p>
                </div>
              )}

              {selectedGestion.proxima_accion && (
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Próxima Acción:
                    </span>
                    <span className="font-semibold text-purple-700 dark:text-purple-300 text-xs break-all">
                      {selectedGestion.proxima_accion}
                    </span>
                  </div>
                  {selectedGestion.fecha_proxima_accion && (
                    <div className="text-right">
                      <span className="text-muted-foreground block text-[11px]">
                        Fecha Seguimiento:
                      </span>
                      <span className="font-mono font-semibold text-xs">
                        {format(
                          new Date(selectedGestion.fecha_proxima_accion),
                          "dd/MM/yyyy",
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="text-right text-[11px] text-muted-foreground pt-2 border-t">
                Registrado por: <strong>{selectedGestion.user?.nombre}</strong>{" "}
                ({selectedGestion.user?.email})
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDetailOpen(false)}
              className="text-xs"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
