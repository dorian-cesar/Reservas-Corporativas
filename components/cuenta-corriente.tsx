"use client";

import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
  FileText,
  Hash,
  Building2,
  RefreshCcw,
  Table,
  LayoutGrid,
  TrendingUp,
  TrendingDown,
  Badge,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Paperclip,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ToolBar from "./tool-bar";
import { PagarDialog } from "./pagar-dialog";
import { AdjuntosDialog } from "./adjuntos-dialog";
import { usePermissions } from "@/hooks/usePermissions";

export function CurrentAccounts() {
  const { user, token } = useAuth.getState();
  const { can } = usePermissions();
  const [companies, setCompanies] = useState<
    { id: string; nombre: string; ente_facturador?: string }[]
  >([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [pagarDialogOpen, setPagarDialogOpen] = useState(false);
  const [movimientoAPagar, setMovimientoAPagar] = useState<Movement | null>(
    null,
  );
  const [adjuntosDialogOpen, setAdjuntosDialogOpen] = useState(false);
  const [selectedMovementForAdjuntos, setSelectedMovementForAdjuntos] =
    useState<Movement | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    tipo: "",
    pagado: "",
    desde: "",
    hasta: "",
    ente_facturador: "",
  });

  // Estados de paginación
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [saldoActual, setSaldoActual] = useState<number>(0);

  const { toast } = useToast();

  type Movement = {
    id: number;
    empresa_id: string;
    fecha_movimiento: string;
    tipo_movimiento: "abono" | "cargo";
    monto: number;
    descripcion?: string;
    saldo: number;
    referencia?: string;
    mes_operacion?: string;
    periodo_operacion?: string;
    pagado?: boolean;
    empresa?: {
      id: string;
      nombre: string;
      ente_facturador?: string;
    };
  };

  const [formData, setFormData] = useState({
    empresa_id: "",
    tipo_movimiento: "abono" as "abono" | "cargo",
    monto: "",
    descripcion: "",
    referencia: "",
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchMovements(selectedCompany, 1, pagination.limit);
    } else {
      setMovements([]);
      setPagination({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      });
    }
  }, [selectedCompany]);

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const res = await fetch("/api/companies", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error fetching companies");
      const data = await res.json();
      const mapped = data.map((c: any) => ({
        id: c.id.toString(),
        nombre: c.nombre,
        ente_facturador: c.ente_facturador || "",
      }));
      setCompanies(mapped);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "No se pudieron cargar las empresas",
        variant: "destructive",
      });
    } finally {
      setLoadingCompanies(false);
    }
  };

  const buildQueryParams = (page: number, limit: number) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (searchFilters.tipo) params.append("tipo", searchFilters.tipo);
    if (searchFilters.pagado) params.append("pagado", searchFilters.pagado);
    if (searchFilters.desde) params.append("desde", searchFilters.desde);
    if (searchFilters.hasta) params.append("hasta", searchFilters.hasta);
    if (searchFilters.ente_facturador)
      params.append("ente_facturador", searchFilters.ente_facturador);

    return params.toString();
  };

  const fetchMovements = async (
    empresaId: string,
    page: number,
    limit: number,
  ) => {
    if (!empresaId) return;

    try {
      setLoadingMovements(true);
      const queryParams = buildQueryParams(page, limit);
      const res = await fetch(
        `/api/current-accounts/empresa/${empresaId}?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        if (res.status === 404) {
          setMovements([]);
          setPagination({
            page: 1,
            limit,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          });
          return;
        }
        throw new Error("Error fetching movimientos");
      }

      const data = await res.json();

      // Asegurarse de que data tenga el formato correcto
      const movementsArray = Array.isArray(data.movimientos)
        ? data.movimientos
        : Array.isArray(data)
          ? data
          : [];

      const paginationData = data.pagination || {
        page,
        limit,
        total: movementsArray.length,
        totalPages: Math.ceil(movementsArray.length / limit),
        hasNextPage: false,
        hasPrevPage: page > 1,
      };

      setSaldoActual(
        data.saldo_actual !== undefined
          ? Number(data.saldo_actual)
          : movementsArray[0]?.saldo || 0,
      );
      setMovements(movementsArray);
      setPagination({
        page: paginationData.page || page,
        limit: paginationData.limit || limit,
        total: paginationData.total || movementsArray.length,
        totalPages:
          paginationData.totalPages ||
          Math.ceil(
            (paginationData.total || movementsArray.length) /
              (paginationData.limit || limit),
          ),
        hasNextPage: Boolean(paginationData.hasNextPage),
        hasPrevPage: Boolean(paginationData.hasPrevPage),
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "No se pudieron cargar los movimientos",
        variant: "destructive",
      });
      setMovements([]);
    } finally {
      setLoadingMovements(false);
    }
  };

  const handleSearch = () => {
    if (selectedCompany) {
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchMovements(selectedCompany, 1, pagination.limit);
    }
  };

  const handleClearFilters = () => {
    setSearchFilters({
      tipo: "",
      pagado: "",
      desde: "",
      hasta: "",
      ente_facturador: "",
    });
    if (selectedCompany) {
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchMovements(selectedCompany, 1, pagination.limit);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
    fetchMovements(selectedCompany, newPage, pagination.limit);
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination((prev) => ({ ...prev, page: 1, limit: newLimit }));
    fetchMovements(selectedCompany, 1, newLimit);
  };

  const resetForm = () => {
    setFormData({
      empresa_id: selectedCompany,
      tipo_movimiento: "abono",
      monto: "",
      descripcion: "",
      referencia: "",
    });
  };

  const handleAdd = async () => {
    if (!formData.empresa_id || !formData.monto) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch("/api/current-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          empresa_id: parseInt(formData.empresa_id),
          tipo_movimiento: formData.tipo_movimiento,
          monto: parseFloat(formData.monto),
          descripcion: formData.descripcion,
          referencia: formData.referencia,
        }),
      });

      if (!res.ok) throw new Error("Error al crear movimiento");

      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Abono agregado",
        description: "El abono ha sido agregado exitosamente",
      });

      if (selectedCompany) {
        fetchMovements(selectedCompany, pagination.page, pagination.limit);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "No se pudo agregar el abono",
        variant: "destructive",
      });
    }
  };

  const handlePagarClick = (movement: Movement) => {
    setMovimientoAPagar(movement);
    setPagarDialogOpen(true);
  };

  const handleOpenAdjuntos = (movement: Movement) => {
    setSelectedMovementForAdjuntos(movement);
    setAdjuntosDialogOpen(true);
  };

  const handlePagoSuccess = () => {
    if (selectedCompany) {
      fetchMovements(selectedCompany, pagination.page, pagination.limit);
    }
    setPagarDialogOpen(false);
    setMovimientoAPagar(null);
  };

  const getCurrentBalance = () => {
    return saldoActual;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR");
  };

  const getMovementIcon = (tipo: "abono" | "cargo") => {
    return tipo === "abono" ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getMovementBadge = (tipo: "abono" | "cargo") => {
    return tipo === "abono" ? (
      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
        Abono
      </span>
    ) : (
      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
        Cargo
      </span>
    );
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const displayedCompanies = searchFilters.ente_facturador
    ? companies.filter(
        (c) => c.ente_facturador === searchFilters.ente_facturador,
      )
    : companies;

  return (
    <div className="space-y-6">
      <ToolBar
        title="Cuenta corriente"
        description="Gestione los movimientos de cuenta corriente por empresa"
        viewMode={viewMode}
        setViewMode={setViewMode}
        showEnteFacturadorSelect
        selectedEnteFacturador={searchFilters.ente_facturador}
        onEnteFacturadorChange={(ente) => {
          setSearchFilters((prev) => ({ ...prev, ente_facturador: ente }));
          if (ente && selectedCompany) {
            const emp = companies.find((c) => c.id === selectedCompany);
            if (emp && emp.ente_facturador && emp.ente_facturador !== ente) {
              setSelectedCompany("");
            }
          }
        }}
        showCompanySelect
        companies={displayedCompanies}
        selectedCompany={selectedCompany}
        onCompanyChange={(id) => setSelectedCompany(id)}
        companySelectMode="combobox"
        companySelectPlaceholder="Selecciona una empresa..."
        loadingCompanies={loadingCompanies}
        refreshAction={() =>
          selectedCompany &&
          fetchMovements(selectedCompany, pagination.page, pagination.limit)
        }
        primaryAction={
          can("cuentas_corrientes_crear_nuevo_movimiento")
            ? {
                label: "Nuevo Movimiento",
                icon: <Plus className="h-4 w-4" />,
                onClick: openAddDialog,
                disabled: !selectedCompany,
              }
            : undefined
        }
      />

      {selectedCompany && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Filtro por tipo */}
              <div className="space-y-2">
                <Label htmlFor="tipo-filtro">Tipo</Label>
                <select
                  id="tipo-filtro"
                  value={searchFilters.tipo}
                  onChange={(e) =>
                    setSearchFilters({ ...searchFilters, tipo: e.target.value })
                  }
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="">Todos</option>
                  <option value="abono">Abono</option>
                  <option value="cargo">Cargo</option>
                </select>
              </div>

              {/* Filtro por estado de pago */}
              <div className="space-y-2">
                <Label htmlFor="pagado-filtro">Estado de pago</Label>
                <select
                  id="pagado-filtro"
                  value={searchFilters.pagado}
                  onChange={(e) =>
                    setSearchFilters({
                      ...searchFilters,
                      pagado: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="">Todos</option>
                  <option value="true">Pagado</option>
                  <option value="false">Pendiente</option>
                </select>
              </div>

              {/* Filtro por fecha Desde */}
              <div className="space-y-2">
                <Label htmlFor="desde-filtro">Desde</Label>
                <Input
                  id="desde-filtro"
                  type="date"
                  value={searchFilters.desde}
                  onChange={(e) =>
                    setSearchFilters({
                      ...searchFilters,
                      desde: e.target.value,
                    })
                  }
                />
              </div>

              {/* Filtro por fecha Hasta */}
              <div className="space-y-2">
                <Label htmlFor="hasta-filtro">Hasta</Label>
                <Input
                  id="hasta-filtro"
                  type="date"
                  value={searchFilters.hasta}
                  onChange={(e) =>
                    setSearchFilters({
                      ...searchFilters,
                      hasta: e.target.value,
                    })
                  }
                />
              </div>

              {/* Botones de acción */}
              <div className="flex items-end gap-2">
                <Button
                  onClick={handleSearch}
                  className="bg-accent hover:bg-accent/90 flex-1"
                  disabled={loadingMovements}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  disabled={loadingMovements}
                >
                  Limpiar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal para agregar movimiento */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Abono</DialogTitle>
            <DialogDescription>
              Registre un nuevo abono en la cuenta corriente
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa</Label>
              <select
                id="empresa"
                value={formData.empresa_id}
                onChange={(e) =>
                  setFormData({ ...formData, empresa_id: e.target.value })
                }
                className="w-full p-2 border rounded-md"
                disabled
              >
                <option value="">Seleccione una empresa</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <input
                type="hidden"
                value="abono"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tipo_movimiento: e.target.value as "abono" | "cargo",
                  })
                }
              />
              <p className="text-xs text-gray-500">
                Nota: Solo se pueden crear abonos directamente. Los cargos se
                crean automáticamente al registrar facturas.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monto">Monto *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="monto"
                  type="number"
                  step="1"
                  placeholder="0"
                  value={formData.monto}
                  onChange={(e) =>
                    setFormData({ ...formData, monto: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input
                id="descripcion"
                placeholder="Descripción del abono (ej: Pago de factura, Transferencia, etc.)"
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referencia">Referencia</Label>
              <Input
                id="referencia"
                placeholder="Número de referencia (ej: N° de transferencia, cheque, etc.)"
                value={formData.referencia}
                onChange={(e) =>
                  setFormData({ ...formData, referencia: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAdd}
              disabled={
                !formData.empresa_id ||
                !formData.monto ||
                parseFloat(formData.monto) <= 0
              }
            >
              Agregar Abono
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedCompany ? (
        <>
          {/* Información de paginación */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              {pagination.total > 0 ? (
                <>
                  Mostrando{" "}
                  <strong>
                    {(pagination.page - 1) * pagination.limit + 1}
                    {" - "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total,
                    )}
                  </strong>{" "}
                  de <strong>{pagination.total}</strong> movimientos
                </>
              ) : (
                <>No hay movimientos para mostrar</>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Selector de límite por página */}
              <div className="flex items-center gap-2 text-sm">
                <label className="text-muted-foreground">Mostrar:</label>
                <select
                  value={pagination.limit}
                  onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                  className="p-2 border rounded-md bg-background"
                  disabled={loadingMovements}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Controles de página */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={!pagination.hasPrevPage || loadingMovements}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage || loadingMovements}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Números de página */}
                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages || 1) },
                    (_, i) => {
                      let pageNum;
                      const totalPages = pagination.totalPages || 1;

                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }

                      if (pageNum < 1 || pageNum > totalPages) return null;

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pagination.page === pageNum ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          disabled={loadingMovements}
                          className="h-8 w-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    },
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage || loadingMovements}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={!pagination.hasNextPage || loadingMovements}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Separador */}
          <div className="my-4 border-t" />

          {/* Indicador de carga */}
          {loadingMovements && (
            <div className="flex items-center justify-center py-8">
              <RefreshCcw className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Cargando movimientos...
              </span>
            </div>
          )}

          {/* Vista de Tarjetas */}
          {!loadingMovements && viewMode === "cards" && (
            <div className="grid gap-4">
              {movements.map((movement, index) => (
                <Card
                  key={movement.id}
                  className="border-2 hover:border-primary transition-all duration-300 hover:shadow-xl animate-in fade-in zoom-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getMovementIcon(movement.tipo_movimiento)}
                        <div>
                          <p className="font-semibold">
                            {movement.descripcion || "Movimiento"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(movement.fecha_movimiento)}
                            {movement.mes_operacion &&
                              movement.mes_operacion !== "—" &&
                              ` • Mes: ${movement.mes_operacion}`}
                            {movement.referencia &&
                              ` • Ref: ${movement.referencia}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className={`text-lg font-bold ${
                            movement.tipo_movimiento === "abono"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {movement.tipo_movimiento === "abono" ? "+" : "-"}
                          {formatCurrency(movement.monto)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Saldo: {formatCurrency(movement.saldo)}
                        </p>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAdjuntos(movement)}
                          className="h-8 px-2.5 text-xs text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-1.5"
                        >
                          <Paperclip className="h-3.5 w-3.5" />
                          Adjuntos
                        </Button>

                        {movement.tipo_movimiento === "cargo" &&
                          !movement.pagado &&
                          can("cuentas_corrientes_pagar_linea_generada") && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handlePagarClick(movement)}
                              className="bg-green-600 hover:bg-green-700 h-8"
                            >
                              <DollarSign className="h-3.5 w-3.5 mr-1" />
                              Pagar Cargo
                            </Button>
                          )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {movements.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay movimientos registrados para esta empresa</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Vista de Tabla */}
          {!loadingMovements && viewMode === "table" && (
            <Card>
              <CardContent className="p-0">
                <UITable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Mes de Operación</TableHead>
                      <TableHead>Ente Facturador</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => (
                      <TableRow key={movement.id} className="hover:bg-muted/50">
                        <TableCell>
                          {formatDate(movement.fecha_movimiento)}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {movement.mes_operacion || "—"}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {movement.empresa?.ente_facturador || "—"}
                        </TableCell>
                        <TableCell>
                          {getMovementBadge(movement.tipo_movimiento)}
                        </TableCell>

                        {/* COLUMNA ESTADO */}
                        <TableCell>
                          {movement.tipo_movimiento === "cargo" ? (
                            movement.pagado ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                <span className="h-1.5 w-1.5 bg-green-500 rounded-full"></span>
                                Pagado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                Pendiente
                              </span>
                            )
                          ) : (
                            <span className="text-xs text-gray-500">-</span>
                          )}
                        </TableCell>

                        <TableCell>{movement.descripcion || "-"}</TableCell>
                        <TableCell>{movement.referencia || "-"}</TableCell>
                        <TableCell
                          className={`text-right font-medium ${movement.tipo_movimiento === "abono" ? "text-green-600" : "text-red-600"}`}
                        >
                          {movement.tipo_movimiento === "abono" ? "+" : "-"}
                          {formatCurrency(movement.monto)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(movement.saldo)}
                        </TableCell>

                        {/* COLUMNA ACCIONES */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenAdjuntos(movement)}
                              className="h-7 px-2 text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-1"
                              title="Ver y adjuntar archivos"
                            >
                              <Paperclip className="h-3 w-3" />
                              Adjuntos
                            </Button>

                            {can("cuentas_corrientes_pagar_linea_generada") && (
                              <>
                                {movement.tipo_movimiento === "cargo" &&
                                !movement.pagado ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePagarClick(movement)}
                                    className="h-7 px-2 text-green-700 border-green-300 hover:bg-green-50 hover:text-green-800 hover:border-green-400"
                                  >
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    Pagar
                                  </Button>
                                ) : movement.tipo_movimiento === "cargo" &&
                                  movement.pagado ? (
                                  <span className="text-xs text-green-600 font-semibold px-1">
                                    ✓
                                  </span>
                                ) : null}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </UITable>
                {movements.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay movimientos registrados para esta empresa</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Seleccione una empresa para ver sus movimientos</p>
          </CardContent>
        </Card>
      )}
      <PagarDialog
        open={pagarDialogOpen}
        onOpenChange={setPagarDialogOpen}
        movimiento={movimientoAPagar}
        token={token}
        onSuccess={handlePagoSuccess}
      />
      <AdjuntosDialog
        open={adjuntosDialogOpen}
        onOpenChange={setAdjuntosDialogOpen}
        movimiento={selectedMovementForAdjuntos}
        token={token}
        onAdjuntosChange={() =>
          selectedCompany &&
          fetchMovements(selectedCompany, pagination.page, pagination.limit)
        }
      />
    </div>
  );
}
