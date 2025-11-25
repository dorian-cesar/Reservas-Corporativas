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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Building2, Plus, Pencil, Trash2, Mail, Users, Percent, RefreshCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
  if (n % 1 === 0) return String(n); // entero
  return n.toFixed(2).replace(/\.?0+$/, ""); // max 2 dec, trim zeros
};


export function CompaniesCRUD() {
  const { token } = useAuth.getState();
  const [companies, setCompanies] = useState<Company[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  type Company = {
    id: string;
    name: string;
    state: boolean;
    contactEmail?: string;
    surchargePercentage?: number;
    returnPercentage?: string;
  };

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    state: true,
    surchargePercentage: "20",
    returnPercentage: "80"
  })

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/companies", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const empresas = await res.json();

      const companiesMapped = empresas.map((empresa: any) => {
        const raw = empresa.porcentaje_devolucion;
        const percent = backendToPercent(raw); // ahora 80 en lugar de 0.8
        return {
          id: empresa.id.toString(),
          name: empresa.nombre,
          state: empresa.estado,
          contactEmail: empresa.email || "email@ejemplo.com",
          surchargePercentage: empresa.recargo || 0,
          returnPercentage: percent, // número 80
        };
      });

      setCompanies(companiesMapped);
    } catch (err) {
      console.error("Error fetching companies:", err);
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      state: true,
      surchargePercentage: "20",
      returnPercentage: "50",
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
          porcentaje_devolucion: String(percentToBackend(formData.returnPercentage))
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
          porcentaje_devolucion: String(percentToBackend(formData.returnPercentage))
        }),
      });

      if (!res.ok) throw new Error("Error al actualizar empresa");

      setIsEditDialogOpen(false);
      setSelectedCompany(null);
      resetForm();

      fetchCompanies();

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

  const handleDelete = async (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    if (!company) return;

    if (!confirm(`¿Está seguro que desea eliminar ${company.name}?`)) return;

    try {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Error al eliminar empresa");

      setCompanies(companies.filter((c) => c.id !== companyId));
      toast({
        title: "Empresa eliminada",
        description: `${company.name} ha sido eliminada exitosamente`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "No se pudo eliminar la empresa",
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
    });
    setIsEditDialogOpen(true);
  };

  const openAddDialog = () => {
    resetForm()
    setIsAddDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Empresas en Convenio</h2>
          <p className="text-muted-foreground">Gestione las empresas y sus porcentajes de recargo</p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => fetchCompanies()} className="bg-secondary hover:bg-secondary/90 justify-center">
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} className="bg-accent hover:bg-accent/90">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Empresa
              </Button>
            </DialogTrigger>
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
                        surchargePercentage: e.target.value, // ← permite string vacío
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="return">Porcentaje de Recargo (%)</Label>
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
                        returnPercentage: e.target.value, // ← permite string vacío
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
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company, index) => (
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
                    <CardTitle className="text-lg flex items-center gap-3">
                      {company.name} ·
                      <span className={company.state ? "text-green-600" : "text-red-600"}>
                        {company.state ? "Activa" : "Inactiva"}
                      </span>
                    </CardTitle>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  className="flex-1 text-destructive hover:bg-destructive/10 transition-all hover:scale-[1.02] bg-transparent"
                  onClick={() => handleDelete(company.id)}
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>Modifique los datos de la empresa en convenio</DialogDescription>
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
                    surchargePercentage: e.target.value, // ← permite string vacío
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="return">Porcentaje de Recargo (%)</Label>
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
                    returnPercentage: e.target.value, // ← permite string vacío
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