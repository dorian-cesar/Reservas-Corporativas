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
  Building2,
  Plus,
  Pencil,
  Trash2,
  Percent,
  RefreshCcw
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

import Swal from "sweetalert2";

import ToolBar from "../tool-bar";
import { count } from "console";

const backendToPercent = (val: any): number => {
  if (val === null || val === undefined || val === "") return 0;
  const n = Number(val);
  if (Number.isNaN(n)) return 0;
  if (n > 0 && n <= 1) return +(n * 100);
  return +n;
};

const percentToBackend = (percent: any): number => {
  const n = Number(percent);
  if (Number.isNaN(n)) return 0;
  return +(n / 100);
};

const formatPercent = (n: number) => {
  if (n % 1 === 0) return String(n);
  return n.toFixed(2).replace(/\.?0+$/, "");
};

export function SuperCompanies() {
  const { token } = useAuth.getState();
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [empresaId, setEmpresaId] = useState("")
  const [searchMode, setSearchMode] = useState<"all" | "single">("all")

  type Company = {
    id: string;
    name: string;
    state: boolean;
    surchargePercentage?: number;
    returnPercentage?: string;
    billingDay: number;
    expirationDay: number;
    max: number;
    count: number
  };

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

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    state: true,
    surchargePercentage: "20",
    returnPercentage: "80",
    billingDay: "5",
    expirationDay: "15",
    max: "100000",
    count: "0"
  })

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    setFilteredCompanies(companies);
  }, [companies]);

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/companies", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const empresas = await res.json();

      if (empresas) {
        const companiesMapped = empresas.map((empresa: any) => {
          const raw = empresa.porcentaje_devolucion;
          const percent = backendToPercent(raw);
          return {
            id: empresa.id.toString(),
            name: empresa.nombre,
            state: empresa.estado,
            surchargePercentage: empresa.recargo || 0,
            returnPercentage: percent,
            billingDay: empresa.dia_facturacion,
            expirationDay: empresa.dia_vencimiento,
            max: empresa.monto_maximo,
            count: empresa.monto_acumulado
          };
        });

        setCompanies(companiesMapped);
        setSearchMode("all");
      }
    } catch (err) {
      console.error("Error fetching companies:", err);
      toast({
        title: "Error",
        description: "No se pudieron cargar las empresas",
        variant: "destructive",
      });
    }
  }

  const handleSearch = async () => {
    if (!empresaId.trim()) {
      // Si el campo está vacío, mostrar todas las empresas
      setFilteredCompanies(companies);
      setSearchMode("all");
      return;
    }

    try {
      const res = await fetch(`/api/companies/${empresaId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 404) {
          toast({
            title: "No encontrado",
            description: "No se encontró ninguna empresa con ese ID",
            variant: "destructive",
          });
        } else {
          throw new Error("Error al buscar empresa");
        }
        return;
      }

      const empresa = await res.json();

      const companyMapped = {
        id: empresa.id.toString(),
        name: empresa.nombre,
        state: empresa.estado,
        surchargePercentage: empresa.recargo || 0,
        returnPercentage: backendToPercent(empresa.porcentaje_devolucion).toString(),
        billingDay: empresa.dia_facturacion,
        expirationDay: empresa.dia_vencimiento,
        max: empresa.monto_maximo,
        count: empresa.monto_acumulado
      };

      setFilteredCompanies([companyMapped]);
      setSearchMode("single");

      toast({
        title: "Búsqueda exitosa",
        description: `Empresa "${empresa.nombre}" encontrada`,
      });

    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "No se pudo realizar la búsqueda",
        variant: "destructive",
      });
    }
  };

  const handleClearSearch = () => {
    setEmpresaId("");
    setFilteredCompanies(companies);
    setSearchMode("all");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      state: true,
      surchargePercentage: "20",
      returnPercentage: "80",
      billingDay: "5",
      expirationDay: "15",
      max: "100000",
      count: "0"
    });
  };

  const handleAdd = async () => {
    if (!formData.name) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: formData.name,
          estado: formData.state,
          recargo: Number(formData.surchargePercentage),
          porcentaje_devolucion: String(percentToBackend(formData.returnPercentage)),
          dia_facturacion: Number(formData.billingDay),
          dia_vencimiento: Number(formData.expirationDay),
          monto_maximo: Number(formData.max),
          monto_acumulado: Number(formData.count)
        }),
      });

      if (!res.ok) throw new Error("Error al crear empresa");

      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Empresa agregada",
        description: `${formData.name} ha sido agregada exitosamente`,
      });
      fetchCompanies();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "No se pudo agregar la empresa",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    if (!selectedCompany) return;

    if (!formData.name) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch(`/api/companies/${selectedCompany.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: formData.name,
          estado: formData.state,
          recargo: Number(formData.surchargePercentage),
          porcentaje_devolucion: String(percentToBackend(formData.returnPercentage)),
          dia_facturacion: Number(formData.billingDay),
          dia_vencimiento: Number(formData.expirationDay),
          monto_maximo: Number(formData.max),
          monto_acumulado: Number(formData.count)
        }),
      });

      if (!res.ok) throw new Error("Error al actualizar empresa");

      setIsEditDialogOpen(false);
      setSelectedCompany(null);
      resetForm();

      // Recargar los datos según el modo actual
      if (searchMode === "single" && empresaId) {
        handleSearch();
      } else {
        fetchCompanies();
      }

      toast({
        title: "Empresa actualizada",
        description: `${formData.name} ha sido actualizada exitosamente`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "No se pudo actualizar la empresa",
        variant: "destructive",
      });
    }
  };

  const handleReset = async (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    if (!company) return;

        const result = await Swal.fire({
          title: "¿Estás seguro?",
          html: `
          <div class="text-left space-y-3">
            <p class="text-foreground text-center mb-2">¿Deseas reestablecer este monto acumulado?</p>
            <p class="text-foreground text-center">Esta acción no se puede deshacer.</p>
            <p class="text-sm text-muted-foreground text-center mt-2">El monto acumulado quedará en 0.</p>
          </div>
        `,
          icon: "warning",
          iconColor: "#f59e0b",
          showCancelButton: true,
          confirmButtonText: "Sí, reestablecer monto",
          cancelButtonText: "Cancelar",
          ...swalConfig,
        });
    
        if (!result.isConfirmed) {
          return;
        }

    try {
      const res = await fetch(`/api/companies/reset/${companyId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Error al reestablecer el monto acumulado");

        setSearchMode("all");
        fetchCompanies();

      toast({
        title: "Monto Reestablecido",
        description: `Se ha reestablecido el monto acumulado exitosamente`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Error al reestablecer el monto acumulado",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      state: Boolean(company.state),
      surchargePercentage: company.surchargePercentage?.toString() ?? "0",
      returnPercentage: company.returnPercentage?.toString() ?? "0",
      billingDay: company.billingDay?.toString() ?? "0",
      expirationDay: company.expirationDay?.toString() ?? "0",
      max: company.max?.toString() ?? "0",
      count: company.count?.toString() ?? "0",
    });
    setIsEditDialogOpen(true);
  };

  const openAddDialog = () => {
    resetForm()
    setIsAddDialogOpen(true)
  }

  const getStatusBadge = (state: boolean) => {
    return state ? (
      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Activa</span>
    ) : (
      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Inactiva</span>
    );
  };

  return (
    <div className="space-y-6">
      <ToolBar
        title="Empresas en Convenio"
        description="Gestione las empresas y sus porcentajes de recargo"
        viewMode={viewMode}
        setViewMode={setViewMode}
        refreshAction={fetchCompanies}
        showSearch
        searchValue={empresaId}
        onSearchChange={setEmpresaId}
        onSearch={handleSearch}
        searchPlaceholder="ID de empresa..."
        primaryAction={{
          label: "Agregar Empresa",
          icon: <Plus className="h-4 w-4" />,
          onClick: openAddDialog,
        }}
      />

      {/* Indicador de búsqueda */}
      {searchMode === "single" && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Viendo empresa específica</p>
                  <p className="text-sm text-blue-700">
                    Mostrando 1 de {companies.length} empresas
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleClearSearch}>
                Ver todas las empresas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agregar Nueva Empresa</DialogTitle>
            <DialogDescription>Complete los datos de la empresa en convenio</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Empresa *</Label>
              <Input
                id="name"
                placeholder="Ej: Empresa Ejemplo S.A."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <select
                name="estado"
                id="state"
                value={formData.state.toString()}
                onChange={(e) => setFormData({ ...formData, state: e.target.value === "true" })}
                className="w-full p-2 border rounded-md"
              >
                <option value="true">Activa</option>
                <option value="false">Inactiva</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="surcharge">Porcentaje de Recargo (%)</Label>
              <Input
                id="surcharge"
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={formData.surchargePercentage}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    surchargePercentage: e.target.value,
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="return">Porcentaje de Devolución (%)</Label>
              <Input
                id="return"
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={formData.returnPercentage}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    returnPercentage: e.target.value,
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingDay">Dia de Facturación</Label>
              <Input
                id="billingDay"
                type="number"
                min="0"
                max="31"
                placeholder="5"
                value={formData.billingDay}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    billingDay: e.target.value,
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expirationDay">Dia de Vencimiento</Label>
              <Input
                id="expirationDay"
                type="number"
                min="0"
                max="31"
                placeholder="15"
                value={formData.expirationDay}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    expirationDay: e.target.value,
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max">Monto Máximo</Label>
              <Input
                id="max"
                type="number"
                min="0"
                placeholder="100000"
                value={formData.max}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    max: e.target.value,
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="count">Monto Acumulado</Label>
              <Input
                id="count"
                type="number"
                min="0"
                placeholder="0"
                value={formData.count}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    count: e.target.value,
                  });
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdd} className="bg-accent hover:bg-accent/90">
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vista de Tarjetas */}
      {viewMode === "cards" && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCompanies.map((company, index) => (
            <Card
              key={company.id}
              className="border-2 hover:border-primary transition-all duration-300 hover:shadow-xl animate-in fade-in zoom-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{company.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        {getStatusBadge(company.state)}
                        <span className="text-xs text-muted-foreground">ID: {company.id}</span>
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Percent className="h-3 w-3" />
                      Recargo
                    </div>
                    <p className="text-2xl font-bold">{company.surchargePercentage}%</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Percent className="h-3 w-3" />
                      Devolución
                    </div>
                    <p className="text-2xl font-bold">{formatPercent(Number(company.returnPercentage) || 0)}%</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      Día de Facturación
                    </div>
                    <p className="text-2xl font-bold">{company.billingDay}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      Día de Vencimiento
                    </div>
                    <p className="text-2xl font-bold">{company.expirationDay}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      Monto Máximo
                    </div>
                    <p className="text-2xl font-bold">{company.max || "0"}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      Monto Acumulado
                    </div>
                    <p className="text-2xl font-bold">{company.count || "0"}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 transition-all hover:scale-[1.02] bg-transparent"
                    onClick={() => openEditDialog(company)}
                  >
                    <Pencil className="h-3 w-3 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-destructive hover:bg-destructive/10 hover:text-red-500 transition-all hover:scale-[1.02] bg-transparent"
                    onClick={() => handleReset(company.id)}
                  >
                    <RefreshCcw className="h-3 w-3 mr-2" />
                    Reestablecer
                  </Button>
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
                  <TableHead>ID</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Recargo</TableHead>
                  <TableHead>Devolución</TableHead>
                  <TableHead>Día Facturación</TableHead>
                  <TableHead>Día Vencimiento</TableHead>
                  <TableHead>Monto Máximo</TableHead>
                  <TableHead>Monto Acumulado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">
                      {company.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{company.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(company.state)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Percent className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{company.surchargePercentage}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Percent className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{formatPercent(Number(company.returnPercentage) || 0)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{company.billingDay || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{company.expirationDay || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{company.max || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{company.count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(company)}
                          className="h-8 px-3"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReset(company.id)}
                          className="h-8 px-3 text-destructive hover:bg-destructive/10 hover:text-red-500"
                        >
                          <RefreshCcw className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </UITable>
            {filteredCompanies.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay empresas que coincidan con la búsqueda</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>Modifique los datos de la empresa en convenio</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre de la Empresa *</Label>
              <Input
                id="edit-name"
                placeholder="Ej: Empresa Ejemplo S.A."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-state">Estado</Label>
              <select
                name="estado"
                id="edit-state"
                value={formData.state.toString()}
                onChange={(e) => setFormData({ ...formData, state: e.target.value === "true" })}
                className="w-full p-2 border rounded-md"
              >
                <option value="true">Activa</option>
                <option value="false">Inactiva</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-surcharge">Porcentaje de Recargo (%)</Label>
              <Input
                id="edit-surcharge"
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={formData.surchargePercentage}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    surchargePercentage: e.target.value,
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-return">Porcentaje de Devolución (%)</Label>
              <Input
                id="edit-return"
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={formData.returnPercentage}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    returnPercentage: e.target.value,
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-billingDay">Dia de Facturación</Label>
              <Input
                id="edit-billingDay"
                type="number"
                min="0"
                max="31"
                placeholder="5"
                value={formData.billingDay}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    billingDay: e.target.value,
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-expirationDay">Dia de Vencimiento</Label>
              <Input
                id="edit-expirationDay"
                type="number"
                min="0"
                max="31"
                placeholder="15"
                value={formData.expirationDay}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    expirationDay: e.target.value,
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-max">Monto Máximo</Label>
              <Input
                id="edit-max"
                type="number"
                min="0"
                placeholder="100000"
                value={formData.max}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    max: e.target.value,
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="count">Monto Acumulado</Label>
              <Input
                id="count"
                type="number"
                min="0"
                placeholder="0"
                value={formData.count}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    count: e.target.value,
                  });
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} className="bg-accent hover:bg-accent/90">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}