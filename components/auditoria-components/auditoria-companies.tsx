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

import ToolBar from "../tool-bar";

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

export function AuditoriaCompanies() {
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
  };

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    state: true,
    surchargePercentage: "20",
    returnPercentage: "80",
    billingDay: "5",
    expirationDay: "15"
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
            expirationDay: empresa.dia_vencimiento
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
        expirationDay: empresa.dia_vencimiento
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
      expirationDay: "15"
    });
  };


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
    </div>
  )
}