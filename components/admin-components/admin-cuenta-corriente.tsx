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
  Badge,
  User
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
import ToolBarAdmin from "../ToolBarAdmin";

export function AdminCurrentAccounts() {
  const { token, user } = useAuth.getState();
  const [companies, setCompanies] = useState<{ id: string; nombre: string }[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const { toast } = useToast();
  const [empresaId, setEmpresaId] = useState("");
  const [userCompany, setUserCompany] = useState<{ id: string; nombre: string } | null>(null);


  type Movement = {
    id: number;
    empresa_id: string;
    fecha_movimiento: string;
    tipo_movimiento: 'abono' | 'cargo';
    monto: number;
    descripcion?: string;
    saldo: number;
    referencia?: string;
    empresa?: {
      id: string;
      nombre: string;
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
    if (user?.companyId) {
      fetchUserCompanyInfo();
    } else {
      fetchCompanies();
    }
  }, [user]);

  useEffect(() => {
    const id = empresaId || userCompany?.id;
    if (id) {
      // sincronizar selectedCompany y formData
      setSelectedCompany(id.toString());
      setFormData(prev => ({ ...prev, empresa_id: id.toString() }));
      fetchMovements(id.toString());
    } else {
      setMovements([]);
    }
  }, [empresaId, userCompany]);

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/companies", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setCompanies(data.map((c: any) => ({ id: c.id.toString(), nombre: c.nombre })));
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar las empresas", variant: "destructive" });
    }
  };

  const fetchUserCompanyInfo = async () => {
    if (!user?.companyId || !token) return;

    try {
      const res = await fetch(`/api/companies/${user.companyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const companyData = await res.json();
        const company = {
          id: companyData.id.toString(),
          nombre: companyData.nombre
        };

        setUserCompany(company);
        setEmpresaId(company.id.toString());
        setCompanies([company]);
      }
    } catch (err) {
      console.error("Error fetching user company:", err);
      toast({
        title: "Error",
        description: "No se pudo cargar la empresa del usuario",
        variant: "destructive"
      });
    }
  };

  const fetchMovements = async (empresaId: string) => {
    try {
      const res = await fetch(`/api/current-accounts/empresa/${empresaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error fetching movimientos");
      const data = await res.json();
      setMovements(data);
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
          referencia: formData.referencia
        }),
      });

      if (!res.ok) throw new Error("Error al crear movimiento");

      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Movimiento agregado",
        description: "El movimiento ha sido agregado exitosamente",
      });

      if (selectedCompany) {
        fetchMovements(selectedCompany);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "No se pudo agregar el movimiento",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (movementId: number) => {
    if (!confirm("¿Está seguro que desea eliminar este movimiento?")) return;

    try {
      const res = await fetch(`/api/current-accounts/${movementId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Error al eliminar movimiento");

      setMovements(movements.filter((m) => m.id !== movementId));
      toast({
        title: "Movimiento eliminado",
        description: "El movimiento ha sido eliminado exitosamente",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "No se pudo eliminar el movimiento",
        variant: "destructive",
      });
    }
  };

  const getCurrentBalance = () => {
    if (movements.length === 0) return 0;
    return movements[movements.length - 1].saldo;
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

  if (!user?.companyId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Usuario sin empresa asignada</h3>
            <p className="text-muted-foreground">
              Tu usuario no tiene una empresa asignada. Contacta al administrador.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToolBarAdmin
        title="Cuenta corriente"
        description={`Gestione los movimientos de cuenta corriente ${userCompany?.nombre || 'su empresa'}`}
        viewMode={viewMode}
        setViewMode={setViewMode}
        companyInfo={userCompany ? {
          id: userCompany.id,
          nombre: userCompany.nombre
        } : undefined}
        refreshAction={() => userCompany && fetchMovements(userCompany.id)}
        primaryAction={{
          label: "Nuevo Movimiento",
          icon: <Plus className="h-4 w-4" />,
          onClick: openAddDialog,
          className: "bg-accent hover:bg-accent/90",
        }}
      />
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Movimiento</DialogTitle>
            <DialogDescription>Registre un nuevo movimiento en la cuenta corriente</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa</Label>
              <select
                id="empresa"
                value={formData.empresa_id}
                onChange={(e) => setFormData({ ...formData, empresa_id: e.target.value })}
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
              <Label htmlFor="tipo">Tipo de Movimiento</Label>
              <select
                id="tipo"
                value={formData.tipo_movimiento}
                onChange={(e) => setFormData({ ...formData, tipo_movimiento: e.target.value as 'abono' | 'cargo' })}
                className="w-full p-2 border rounded-md"
              >
                <option value="abono">Abono</option>
                <option value="cargo">Cargo</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monto">Monto *</Label>
              <Input
                id="monto"
                type="number"
                step="1"
                placeholder="0"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input
                id="descripcion"
                placeholder="Descripción del movimiento"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referencia">Referencia</Label>
              <Input
                id="referencia"
                placeholder="Número de referencia"
                value={formData.referencia}
                onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
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

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 transition-all hover:scale-[1.02] bg-transparent"
                        onClick={() => handleDelete(movement.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
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
                    <TableHead>Tipo</TableHead>
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
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(movement.fecha_movimiento)}
                        </div>
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
                      <TableCell>
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(movement.id)}
                            className="h-8 px-3 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
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
    </div>
  );
}