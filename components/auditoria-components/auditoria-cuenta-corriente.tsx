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
  Badge
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

export function AuditoriaCurrentAccounts() {
  const { token } = useAuth.getState();
  const [companies, setCompanies] = useState<{ id: string; nombre: string; ente_facturador?: string }[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedEnte, setSelectedEnte] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const { toast } = useToast();

  type Movement = {
    id: number;
    empresa_id: string;
    fecha_movimiento: string;
    tipo_movimiento: 'abono' | 'cargo';
    monto: number;
    descripcion?: string;
    saldo: number;
    referencia?: string;
    mes_operacion?: string;
    periodo_operacion?: string;
    empresa?: {
      id: string;
      nombre: string;
      ente_facturador?: string;
    };
  };

  const [formData, setFormData] = useState({
    empresa_id: "",
    tipo_movimiento: "abono" as 'abono' | 'cargo',
    monto: "",
    descripcion: "",
    referencia: ""
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchMovements(selectedCompany);
    }
  }, [selectedCompany]);

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
        ente_facturador: c.ente_facturador || "",
      }));
      setCompanies(mapped);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "No se pudieron cargar las empresas", variant: "destructive" });
    }
  };

  const fetchMovements = async (empresaId: string) => {
    try {
      const res = await fetch(`/api/current-accounts/empresa/${empresaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error fetching movimientos");
      const data = await res.json();
      const movementsArray = Array.isArray(data.movimientos) ? data.movimientos : (Array.isArray(data) ? data : []);
      setMovements(movementsArray);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "No se pudieron cargar los movimientos", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      empresa_id: selectedCompany,
      tipo_movimiento: "abono",
      monto: "",
      descripcion: "",
      referencia: ""
    });
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

  const getMovementIcon = (tipo: 'abono' | 'cargo') => {
    return tipo === 'abono' ?
      <TrendingUp className="h-4 w-4 text-green-600" /> :
      <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const getMovementBadge = (tipo: 'abono' | 'cargo') => {
    return tipo === 'abono' ? (
      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Abono</span>
    ) : (
      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Cargo</span>
    );
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const displayedCompanies = selectedEnte
    ? companies.filter((c) => c.ente_facturador === selectedEnte)
    : companies;

  return (
    <div className="space-y-6">
      <ToolBar
        title="Cuenta corriente"
        description="Gestione los movimientos de cuenta corriente por empresa"
        viewMode={viewMode}
        setViewMode={setViewMode}
        showEnteFacturadorSelect
        selectedEnteFacturador={selectedEnte}
        onEnteFacturadorChange={(ente) => {
          setSelectedEnte(ente);
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
        refreshAction={() => selectedCompany && fetchMovements(selectedCompany)}
      />

      {selectedCompany ? (
        <>
          {/* Vista de Tarjetas */}
          {viewMode === "cards" && (
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
                          <p className="font-semibold">{movement.descripcion || "Movimiento"}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(movement.fecha_movimiento)}
                            {movement.mes_operacion && movement.mes_operacion !== "—" && ` • Mes: ${movement.mes_operacion}`}
                            {movement.referencia && ` • Ref: ${movement.referencia}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`text-lg font-bold ${movement.tipo_movimiento === 'abono' ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {movement.tipo_movimiento === 'abono' ? '+' : '-'}{formatCurrency(movement.monto)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Saldo: {formatCurrency(movement.saldo)}
                        </p>
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
          {viewMode === "table" && (
            <Card>
              <CardContent className="p-0">
                <UITable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Mes de Operación</TableHead>
                      <TableHead>Ente Facturador</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => (
                      <TableRow key={movement.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDate(movement.fecha_movimiento)}
                          </div>
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
                        <TableCell>
                          {movement.descripcion || "-"}
                        </TableCell>
                        <TableCell>
                          {movement.referencia || "-"}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${movement.tipo_movimiento === 'abono' ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {movement.tipo_movimiento === 'abono' ? '+' : '-'}{formatCurrency(movement.monto)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(movement.saldo)}
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
    </div>
  );
}