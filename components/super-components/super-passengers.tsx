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
    User,
    Key,
    Mail,
    FolderTree,
    Phone
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

export function CompanyPassengers() {
    const { token } = useAuth.getState();
    const [companies, setCompanies] = useState<{ id: string; nombre: string }[]>([]);
    const [passengers, setPassengers] = useState<Passenger[]>([]);
    const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<string>("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"cards" | "table">("table");
    const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);
    const { toast } = useToast();

    type Passenger = {
        id: number;
        nombre: string;
        rut: string;
        correo: string;
        telefono?: string;
        id_empresa: string;
        id_centro_costo: string;
        empresa?: Company;
        centroCosto?: CostCenter;
    };

    type Company = {
        id: number;
        nombre: string;
        rut: string;
        cuenta_corriente: string;
        estado: boolean;
    }

    type CostCenter = {
        id: number;
        nombre: string;
        estado: boolean;
    }

    const [formData, setFormData] = useState({
        nombre: "",
        rut: "",
        correo: "",
        telefono: "",
        id_empresa: "",
        id_centro_costo: ""
    });

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        if (selectedCompany) {
            fetchPassengers(selectedCompany);
            fetchCostCenters(selectedCompany);
            // Actualizar el formulario con la empresa seleccionada
            setFormData(prev => ({
                ...prev,
                id_empresa: selectedCompany,
                id_centro_costo: "" // Resetear centro de costo al cambiar empresa
            }));
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
            }));
            setCompanies(mapped);
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "No se pudieron cargar las empresas", variant: "destructive" });
        }
    };

    const fetchCostCenters = async (empresaId: string) => {
        if (!empresaId) return;

        try {
            const res = await fetch(`/api/centros-costo/empresa/${empresaId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                if (res.status === 404) {
                    setCostCenters([]);
                    return;
                }
                throw new Error(`Error ${res.status}: ${res.statusText}`);
            }

            const costCentersData = await res.json();
            const mapped = costCentersData.map((cc: any) => ({
                id: cc.id.toString(),
                nombre: cc.nombre
            }));

            setCostCenters(mapped);
        } catch (err) {
            console.error("Error fetching cost centers:", err);
            setCostCenters([]);
        }
    };

    const fetchPassengers = async (empresaId?: string, rut?: string, correo?: string) => {
        try {
            const params = new URLSearchParams();

            if (rut) {
                const rutClean = rut.replace(/\./g, "").toUpperCase();
                params.set("rut", rutClean);
            }

            if (empresaId) {
                params.set("id_empresa", empresaId);
            }

            if (correo) {
                params.set("correo", correo);
            }

            const queryString = params.toString();
            const url = queryString
                ? `/api/pasajeros?${queryString}`
                : `/api/pasajeros`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error("Error fetching pasajeros");

            const data = await res.json();
            setPassengers(data);
        } catch (err) {
            console.error(err);
            toast({
                title: "Error",
                description: "No se pudieron cargar los pasajeros",
                variant: "destructive",
            });
        }
    };

    const resetForm = () => {
        setFormData({
            nombre: "",
            rut: "",
            correo: "",
            telefono: "",
            id_empresa: selectedCompany,
            id_centro_costo: ""
        });
    };

    const handleAdd = async () => {
        if (!formData.nombre || !formData.rut || !formData.correo || !formData.telefono || !formData.id_empresa || !formData.id_centro_costo) {
            toast({
                title: "Error",
                description: "Por favor complete todos los campos requeridos",
                variant: "destructive",
            });
            return;
        }

        try {
            const res = await fetch("/api/pasajeros", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    nombre: formData.nombre,
                    rut: formData.rut,
                    correo: formData.correo,
                    telefono: formData.telefono,
                    id_empresa: Number(formData.id_empresa),
                    id_centro_costo: Number(formData.id_centro_costo)
                }),
            });

            if (!res.ok) throw new Error("Error al crear pasajero");

            setIsAddDialogOpen(false);
            resetForm();
            toast({
                title: "Éxito",
                description: "Pasajero agregado correctamente",
                variant: "default",
            });

            if (selectedCompany) {
                fetchPassengers(selectedCompany);
            }
        } catch (err) {
            console.error(err);
            toast({
                title: "Error",
                description: "No se pudo agregar el pasajero",
                variant: "destructive",
            });
        }
    };

    const handleEdit = async () => {
        if (!selectedPassenger || !formData.nombre || !formData.rut || !formData.correo || !formData.telefono || !formData.id_empresa || !formData.id_centro_costo) {
            toast({
                title: "Error",
                description: "Por favor complete todos los campos requeridos",
                variant: "destructive",
            });
            return;
        }

        try {
            const res = await fetch(`/api/pasajeros/${selectedPassenger.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    nombre: formData.nombre,
                    rut: formData.rut,
                    correo: formData.correo,
                    telefono: formData.telefono,
                    id_empresa: Number(formData.id_empresa),
                    id_centro_costo: Number(formData.id_centro_costo)
                }),
            });

            if (!res.ok) throw new Error("Error al actualizar pasajero");

            setIsEditDialogOpen(false);
            toast({
                title: "Éxito",
                description: "Pasajero actualizado correctamente",
                variant: "default",
            });

            if (selectedCompany) {
                fetchPassengers(selectedCompany);
            }
        } catch (err) {
            console.error(err);
            toast({
                title: "Error",
                description: "No se pudo actualizar el pasajero",
                variant: "destructive",
            });
        }
    };

    const openAddDialog = () => {
        resetForm();
        setIsAddDialogOpen(true);
    };

    const openEditDialog = (passenger: Passenger) => {
        setSelectedPassenger(passenger);
        setFormData({
            nombre: passenger.nombre,
            rut: passenger.rut,
            correo: passenger.correo,
            telefono: passenger.telefono || "",
            id_empresa: passenger.id_empresa,
            id_centro_costo: passenger.id_centro_costo
        });
        setIsEditDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <ToolBar
                title="Pasajeros"
                description="Administre los pasajeros de cada empresa"
                viewMode={viewMode}
                setViewMode={setViewMode}
                showCompanySelect
                companies={companies}
                selectedCompany={selectedCompany}
                onCompanyChange={(id) => setSelectedCompany(id)}
                refreshAction={() => selectedCompany && fetchPassengers(selectedCompany)}
                primaryAction={{
                    label: "Nuevo Pasajero",
                    icon: <Plus className="h-4 w-4" />,
                    onClick: openAddDialog,
                    disabled: !selectedCompany,
                }}
            />

            {/* Modal para Agregar Pasajero */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Agregar Nuevo Pasajero</DialogTitle>
                        <DialogDescription>Registre un nuevo pasajero en la empresa</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre *</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Juan Perez"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="rut">RUT *</Label>
                            <Input
                                id="rut"
                                type="text"
                                placeholder="12345678-9"
                                value={formData.rut}
                                onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="correo">Correo *</Label>
                            <Input
                                id="correo"
                                type="email"
                                placeholder="usuario@empresa.com"
                                value={formData.correo}
                                onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="telefono">Teléfono *</Label>
                            <Input
                                id="telefono"
                                type="text"
                                placeholder="+56 9 8122 6760"
                                value={formData.telefono}
                                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="empresa">Empresa</Label>
                            <select
                                id="empresa"
                                value={formData.id_empresa}
                                onChange={(e) => setFormData({ ...formData, id_empresa: e.target.value })}
                                className="w-full p-2 border rounded-md bg-gray-200 cursor-not-allowed"
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
                            <Label htmlFor="centroCosto">Centro de costo *</Label>
                            <select
                                id="centroCosto"
                                value={formData.id_centro_costo}
                                onChange={(e) => setFormData({ ...formData, id_centro_costo: e.target.value })}
                                className="w-full p-2 border rounded-md"
                                disabled={!formData.id_empresa || costCenters.length === 0}
                            >
                                <option value="">Seleccione un centro de costo</option>
                                {costCenters.map((centro) => (
                                    <option key={centro.id} value={centro.id}>
                                        {centro.nombre}
                                    </option>
                                ))}
                            </select>
                            {formData.id_empresa && costCenters.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No hay centros de costo disponibles para esta empresa
                                </p>
                            )}
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

            {/* Modal para Editar Pasajero */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Editar Pasajero</DialogTitle>
                        <DialogDescription>Modifique los datos del pasajero</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nombre *</Label>
                            <Input
                                id="edit-name"
                                type="text"
                                placeholder="Juan Perez"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-rut">RUT *</Label>
                            <Input
                                id="edit-rut"
                                type="text"
                                placeholder="12345678-9"
                                value={formData.rut}
                                onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-correo">Correo *</Label>
                            <Input
                                id="edit-correo"
                                type="email"
                                placeholder="usuario@empresa.com"
                                value={formData.correo}
                                onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-telefono">Teléfono *</Label>
                            <Input
                                id="edit-telefono"
                                type="text"
                                placeholder="+56 9 8122 6760"
                                value={formData.telefono}
                                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-empresa">Empresa *</Label>
                            <select
                                id="edit-empresa"
                                value={formData.id_empresa}
                                onChange={(e) => setFormData({ ...formData, id_empresa: e.target.value })}
                                className="w-full p-2 border rounded-md"
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
                            <Label htmlFor="edit-centroCosto">Centro de costo *</Label>
                            <select
                                id="edit-centroCosto"
                                value={formData.id_centro_costo}
                                onChange={(e) => setFormData({ ...formData, id_centro_costo: e.target.value })}
                                className="w-full p-2 border rounded-md"
                                disabled={!formData.id_empresa}
                            >
                                <option value="">Seleccione un centro de costo</option>
                                {costCenters.map((centro) => (
                                    <option key={centro.id} value={centro.id}>
                                        {centro.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleEdit} className="bg-accent hover:bg-accent/90">
                            Actualizar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {selectedCompany ? (
                <>
                    {/* Vista de Tarjetas */}
                    {viewMode === "cards" && (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {passengers.map((passenger, index) => (
                                <Card
                                    key={passenger.id}
                                    className="border-2 hover:border-primary transition-all duration-300 hover:shadow-xl animate-in fade-in zoom-in"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 bg-primary/10 rounded-lg">
                                                    <User className="h-6 w-6 text-primary" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg flex items-center gap-3">
                                                        {passenger.nombre}
                                                    </CardTitle>
                                                    <CardDescription className="flex items-center gap-2 mt-1">
                                                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                                                            Pasajero
                                                        </span>
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="p-3 bg-muted/50 rounded-lg">
                                                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                                    <Key className="h-3 w-3" />
                                                    RUT
                                                </div>
                                                <p className="text-sm font-medium">{passenger.rut}</p>
                                            </div>
                                            {passenger.correo && (
                                                <div className="p-3 bg-muted/50 rounded-lg">
                                                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                                        <Mail className="h-3 w-3" />
                                                        Email
                                                    </div>
                                                    <p className="text-sm font-medium truncate">{passenger.correo}</p>
                                                </div>
                                            )}
                                            {passenger.telefono && (
                                                <div className="p-3 bg-muted/50 rounded-lg">
                                                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                                        <Phone className="h-3 w-3" />
                                                        Teléfono
                                                    </div>
                                                    <p className="text-sm font-medium">{passenger.telefono}</p>
                                                </div>
                                            )}
                                            {passenger.empresa && (
                                                <div className="p-3 bg-muted/50 rounded-lg">
                                                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                                        <Building2 className="h-3 w-3" />
                                                        Empresa
                                                    </div>
                                                    <p className="text-sm font-medium">{passenger.empresa.nombre}</p>
                                                </div>
                                            )}
                                            {passenger.centroCosto && (
                                                <div className="p-3 bg-muted/50 rounded-lg">
                                                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                                        <FolderTree className="h-3 w-3" />
                                                        Centro de Costo
                                                    </div>
                                                    <p className="text-sm font-medium">{passenger.centroCosto.nombre}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 transition-all hover:scale-[1.02] bg-transparent"
                                                onClick={() => openEditDialog(passenger)}
                                            >
                                                <Pencil className="h-3 w-3 mr-2" />
                                                Editar
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
                                            <TableHead>Pasajero</TableHead>
                                            <TableHead>RUT</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Teléfono</TableHead>
                                            <TableHead>Empresa</TableHead>
                                            <TableHead>Centro Costo</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {passengers.map((passenger) => (
                                            <TableRow key={passenger.id} className="hover:bg-muted/50">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-primary/10 rounded-lg">
                                                            <User className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{passenger.nombre}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Key className="h-3 w-3 text-muted-foreground" />
                                                        {passenger.rut}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {passenger.correo ? (
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="h-3 w-3 text-muted-foreground" />
                                                            {passenger.correo}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {passenger.telefono ? (
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-3 w-3 text-muted-foreground" />
                                                            {passenger.telefono}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {passenger.empresa && (
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="h-3 w-3 text-muted-foreground" />
                                                            {passenger.empresa.nombre}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {passenger.centroCosto && (
                                                        <div className="flex items-center gap-2">
                                                            <FolderTree className="h-3 w-3 text-muted-foreground" />
                                                            {passenger.centroCosto.nombre}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openEditDialog(passenger)}
                                                            className="h-8 px-3"
                                                        >
                                                            <Pencil className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </UITable>
                                {passengers.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No hay pasajeros registrados</p>
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
                        <p>Seleccione una empresa para ver sus pasajeros</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}