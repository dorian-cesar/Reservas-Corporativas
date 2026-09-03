"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  CheckCircle2,
  Building2,
  Users,
  CreditCard,
  Ticket,
  FileSpreadsheet,
  DollarSign,
  FolderLock,
  AlertCircle,
} from "lucide-react";

interface PermisoItem {
  id: number;
  modulo: string;
  accion: string;
  clave: string;
  subusuario: boolean;
  empresa: boolean;
  admin: boolean;
  auditoria: boolean;
  contralor: boolean;
  admincc: boolean;
  superuser: boolean;
  soporte: boolean;
}

const ROLES_COLUMNAS = [
  {
    key: "subusuario",
    label: "Subusuario",
    color: "bg-blue-100 text-blue-800",
  },
  { key: "admin", label: "Admin", color: "bg-amber-100 text-amber-800" },
  {
    key: "auditoria",
    label: "Auditoría",
    color: "bg-purple-100 text-purple-800",
  },
  {
    key: "contralor",
    label: "Contralor",
    color: "bg-indigo-100 text-indigo-800",
  },
  { key: "admincc", label: "AdminCC", color: "bg-teal-100 text-teal-800" },
  { key: "superuser", label: "Superuser", color: "bg-rose-100 text-rose-800" },
  {
    key: "soporte",
    label: "Soporte",
    color: "bg-emerald-100 text-emerald-800",
  },
] as const;

export function SuperPermisos() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [permisos, setPermisos] = useState<PermisoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [moduloFiltro, setModuloFiltro] = useState<string>("todos");
  const [updatingCell, setUpdatingCell] = useState<string | null>(null);

  const fetchPermisos = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch("/api/permisos", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Error al obtener matriz de permisos");

      const data = await res.json();
      setPermisos(data.permisos || []);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error al cargar permisos",
        description: err.message || "No se pudo cargar la matriz",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermisos();
  }, [token]);

  const handleToggle = async (
    permisoId: number,
    rol: string,
    valorActual: boolean,
  ) => {
    if (rol === "superuser") {
      toast({
        title: "Operación no permitida",
        description:
          "El rol Superuser siempre debe mantener todos los accesos activos.",
        variant: "destructive",
      });
      return;
    }

    const nuevoValor = !valorActual;
    const cellKey = `${permisoId}_${rol}`;
    setUpdatingCell(cellKey);

    // Actualización optimista en el estado local
    setPermisos((prev) =>
      prev.map((item) =>
        item.id === permisoId ? { ...item, [rol]: nuevoValor } : item,
      ),
    );

    try {
      const res = await fetch(`/api/permisos/${permisoId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rol,
          valor: nuevoValor,
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo actualizar en el servidor");
      }

      toast({
        title: "Permiso actualizado",
        description: `El rol '${rol}' ahora tiene ${nuevoValor ? "Habilitada" : "Deshabilitada"} esta acción.`,
      });
    } catch (err: any) {
      console.error(err);
      // Revertir en caso de error
      setPermisos((prev) =>
        prev.map((item) =>
          item.id === permisoId ? { ...item, [rol]: valorActual } : item,
        ),
      );
      toast({
        title: "Error al actualizar",
        description: err.message || "Hubo un fallo en el servidor",
        variant: "destructive",
      });
    } finally {
      setUpdatingCell(null);
    }
  };

  // Función para corregir nombres de módulos
  const formatModuloNombre = (nombre: string) => {
    if (nombre.toLowerCase().includes("cuanta")) {
      return "Cuentas Corrientes";
    }
    if (nombre.toLowerCase() === "tickets") {
      return "Boletos";
    }
    return nombre;
  };

  // Función para corregir nombres de acciones (Tickets -> Boletos)
  const formatAccionNombre = (accion: string) => {
    return accion
      .replace(/Tickets/g, "Boletos")
      .replace(/Ticket/g, "Boleto")
      .replace(/tickets/g, "boletos")
      .replace(/ticket/g, "boleto");
  };

  // Módulos únicos
  const modulosDisponibles = useMemo(() => {
    const list = Array.from(
      new Set(permisos.map((p) => formatModuloNombre(p.modulo))),
    );
    return list;
  }, [permisos]);

  // Filtrado de items
  const permisosFiltrados = useMemo(() => {
    return permisos.filter((item) => {
      const moduloFormateado = formatModuloNombre(item.modulo);
      const matchModulo =
        moduloFiltro === "todos" ||
        moduloFormateado.toLowerCase() === moduloFiltro.toLowerCase();
      const accionFormateada = formatAccionNombre(item.accion);
      const matchSearch =
        !search ||
        accionFormateada.toLowerCase().includes(search.toLowerCase()) ||
        item.accion.toLowerCase().includes(search.toLowerCase()) ||
        moduloFormateado.toLowerCase().includes(search.toLowerCase()) ||
        item.clave.toLowerCase().includes(search.toLowerCase());

      return matchModulo && matchSearch;
    });
  }, [permisos, moduloFiltro, search]);

  // Agrupados por módulo para renderizado ordenado
  const gruposPorModulo = useMemo(() => {
    const grupos: Record<string, PermisoItem[]> = {};
    permisosFiltrados.forEach((item) => {
      const moduloNombre = formatModuloNombre(item.modulo);
      if (!grupos[moduloNombre]) grupos[moduloNombre] = [];
      grupos[moduloNombre].push(item);
    });
    return grupos;
  }, [permisosFiltrados]);

  const getModuloIcon = (modulo: string) => {
    switch (modulo.toLowerCase()) {
      case "empresa":
        return <Building2 className="h-4 w-4 text-primary" />;
      case "usuarios":
        return <Users className="h-4 w-4 text-amber-500" />;
      case "centro de costo":
        return <FolderLock className="h-4 w-4 text-emerald-500" />;
      case "estados de pago":
        return <FileSpreadsheet className="h-4 w-4 text-indigo-500" />;
      case "cuentas corrientes":
      case "cuantas corrientes":
        return <CreditCard className="h-4 w-4 text-cyan-500" />;
      case "boletos":
      case "tickets":
        return <Ticket className="h-4 w-4 text-rose-500" />;
      case "historial de cobranza":
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case "reclamos":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <ShieldCheck className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header y Acciones Principales */}
      <Card className="border-2 shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">
                    Mantenedor de Roles y Permisos (RBAC)
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Administre dinámicamente las acciones permitidas para cada
                    perfil de usuario en el sistema.
                  </CardDescription>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPermisos}
                disabled={loading}
                className="h-9 gap-1.5"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Actualizar
              </Button>
            </div>
          </div>

          {/* Barra de Filtros y Estadísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-4 border-t mt-4">
            <div className="sm:col-span-6 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar acción o palabra clave..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <div className="sm:col-span-4">
              <select
                value={moduloFiltro}
                onChange={(e) => setModuloFiltro(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="todos">
                  Todos los módulos ({modulosDisponibles.length})
                </option>
                {modulosDisponibles.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 flex items-center justify-end">
              <Badge
                variant="outline"
                className="px-2.5 py-1 text-xs font-semibold"
              >
                {permisosFiltrados.length} Acciones
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Listado de Tablas agrupadas por Módulo */}
      {loading ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">
              Cargando matriz de roles y permisos...
            </p>
          </div>
        </Card>
      ) : Object.keys(gruposPorModulo).length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No se encontraron acciones</p>
          <p className="text-xs">
            Prueba cambiando el filtro de búsqueda o el módulo seleccionado.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(gruposPorModulo).map(([modulo, items]) => (
            <Card key={modulo} className="shadow-xs overflow-hidden border">
              <CardHeader className="py-3 px-4 bg-muted/40 border-b flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  {getModuloIcon(modulo)}
                  <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">
                    Módulo: {modulo}
                  </h3>
                </div>
                <Badge variant="secondary" className="text-xs font-medium">
                  {items.length} {items.length === 1 ? "acción" : "acciones"}
                </Badge>
              </CardHeader>

              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/20">
                      <TableHead className="min-w-[280px] text-xs font-bold uppercase">
                        Acción Funcional
                      </TableHead>
                      {ROLES_COLUMNAS.map((rol) => (
                        <TableHead
                          key={rol.key}
                          className="text-center min-w-[95px] text-xs font-bold"
                        >
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] ${rol.color}`}
                          >
                            {rol.label}
                          </span>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow
                        key={item.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="font-medium text-xs sm:text-sm py-2.5">
                          <span className="text-foreground">
                            {formatAccionNombre(item.accion)}
                          </span>
                        </TableCell>

                        {ROLES_COLUMNAS.map((rol) => {
                          const isSuperuser = rol.key === "superuser";
                          const isChecked = isSuperuser
                            ? true
                            : Boolean((item as any)[rol.key]);
                          const isBusy =
                            updatingCell === `${item.id}_${rol.key}`;

                          return (
                            <TableCell
                              key={rol.key}
                              className="text-center py-2.5"
                            >
                              <div className="flex items-center justify-center">
                                <Switch
                                  checked={isChecked}
                                  disabled={isSuperuser || isBusy}
                                  onCheckedChange={() =>
                                    handleToggle(item.id, rol.key, isChecked)
                                  }
                                  className={
                                    isSuperuser
                                      ? "opacity-75 cursor-not-allowed"
                                      : ""
                                  }
                                  title={
                                    isSuperuser
                                      ? "Superuser tiene acceso total por sistema"
                                      : `${rol.label}: ${isChecked ? "Permitido" : "Denegado"}`
                                  }
                                />
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
