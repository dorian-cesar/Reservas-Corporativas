"use client"

import { useAuth } from "@/lib/auth";
import { useState } from "react"
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
    Building2,
    Plus,
    Pencil,
    Trash2,
    RefreshCcw,
    Table,
    LayoutGrid,
    FolderTree,
    Search
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

export function CostCentersCRUD() {
    const { token } = useAuth.getState();
    const [costCenters, setCostCenters] = useState<CostCenter[]>([])
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
    const [empresaId, setEmpresaId] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    type CostCenter = {
        id: string;
        nombre: string;
        empresa_id: string;
        estado: boolean;
        created_at?: string;
        updated_at?: string;
        empresa?: {
            id: string;
            nombre: string;
        };
    };

    const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter | null>(null);
    const { toast } = useToast()

    const [formData, setFormData] = useState({
        nombre: "",
        empresa_id: "",
        estado: true
    })

    const fetchCostCenters = async (targetEmpresaId: string) => {
        if (!targetEmpresaId || targetEmpresaId === "") {
            toast({
                title: "Información",
                description: "Por favor ingresa un ID de empresa",
                variant: "default",
            });
            return;
        }

        setIsLoading(true);
        try {
            const url = `/api/centros-costo/empresa/${targetEmpresaId}`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error("No se encontraron centros de costo para esta empresa");
                }
                throw new Error(`Error ${res.status}: ${res.statusText}`);
            }

            const costCentersData = await res.json();

            const costCentersMapped = costCentersData.map((costCenter: any) => ({
                id: costCenter.id.toString(),
                nombre: costCenter.nombre,
                empresa_id: costCenter.empresa_id?.toString() || "",
                estado: costCenter.estado,
                created_at: costCenter.created_at,
                updated_at: costCenter.updated_at,
                empresa: costCenter.empresa ? {
                    id: costCenter.empresa.id.toString(),
                    nombre: costCenter.empresa.nombre
                } : undefined
            }));

            setCostCenters(costCentersMapped);
            
            if (costCentersMapped.length === 0) {
                toast({
                    title: "Información",
                    description: "No se encontraron centros de costo para esta empresa",
                    variant: "default",
                });
            }
        } catch (err) {
            console.error("Error fetching cost centers:", err);
            toast({
                title: "Error",
                description: err instanceof Error ? err.message : "No se pudieron cargar los centros de costo",
                variant: "destructive",
            });
            setCostCenters([]);
        } finally {
            setIsLoading(false);
        }
    }

    const handleSearch = () => {
        fetchCostCenters(empresaId);
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    }

    const resetForm = () => {
        setFormData({
            nombre: "",
            empresa_id: "",
            estado: true
        });
    };

    const handleAdd = async () => {
        if (!formData.nombre || !formData.empresa_id) {
            toast({ title: "Error", description: "Complete todos los campos", variant: "destructive" });
            return;
        }

        try {
            const res = await fetch("/api/centros-costo", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    nombre: formData.nombre,
                    empresa_id: Number(formData.empresa_id),
                    estado: formData.estado
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Error al crear centro de costo");
            }

            setIsAddDialogOpen(false);
            resetForm();
            toast({ title: "Centro de costo agregado", description: `${formData.nombre} agregado exitosamente` });
            
            // Recargar los centros si estamos viendo la misma empresa
            if (empresaId && empresaId === formData.empresa_id) {
                fetchCostCenters(empresaId);
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "No se pudo agregar", variant: "destructive" });
        }
    };

    const handleEdit = async () => {
        if (!selectedCostCenter) return;

        if (!formData.nombre || !formData.empresa_id) {
            toast({ title: "Error", description: "Complete todos los campos", variant: "destructive" });
            return;
        }

        try {
            const res = await fetch(`/api/centros-costo/${selectedCostCenter.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    nombre: formData.nombre,
                    empresa_id: Number(formData.empresa_id),
                    estado: formData.estado
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Error al actualizar");
            }

            setIsEditDialogOpen(false);
            setSelectedCostCenter(null);
            resetForm();
            
            // Recargar los centros si estamos viendo la misma empresa
            if (empresaId && empresaId === formData.empresa_id) {
                fetchCostCenters(empresaId);
            }

            toast({ title: "Centro de costo actualizado", description: `${formData.nombre} actualizado exitosamente` });
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "No se pudo actualizar", variant: "destructive" });
        }
    };

    const handleDelete = async (costCenterId: string) => {
        const costCenter = costCenters.find((c) => c.id === costCenterId);
        if (!costCenter) return;

        if (!confirm(`¿Está seguro que desea eliminar ${costCenter.nombre}?`)) return;

        try {
            const res = await fetch(`/api/centros-costo/${costCenterId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error("Error al eliminar centro de costo");

            setCostCenters(costCenters.filter((c) => c.id !== costCenterId));
            toast({ title: "Centro de costo eliminado", description: `${costCenter.nombre} eliminado exitosamente` });
        } catch (err) {
            toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" });
        }
    };

    const openEditDialog = (costCenter: CostCenter) => {
        setSelectedCostCenter(costCenter);
        setFormData({
            nombre: costCenter.nombre,
            empresa_id: costCenter.empresa_id,
            estado: Boolean(costCenter.estado)
        });
        setIsEditDialogOpen(true);
    };

    const openAddDialog = () => {
        // Pre-llenar el campo empresa_id con la empresa actual si existe
        setFormData({
            nombre: "",
            empresa_id: empresaId || "",
            estado: true
        });
        setIsAddDialogOpen(true);
    }

    const getStatusBadge = (estado: boolean) => {
        return estado ? (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Activo</span>
        ) : (
            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Inactivo</span>
        );
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString('es-ES');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Centros de Costo</h2>
                    <p className="text-muted-foreground">Gestione los centros de costo de las empresas</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Buscador de Empresa */}
                    <div className="flex items-center gap-2">
                        <Label htmlFor="empresa-id" className="text-sm font-medium">
                            ID Empresa
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="empresa-id"
                                type="number"
                                placeholder="Ingresa ID de empresa"
                                value={empresaId}
                                onChange={(e) => setEmpresaId(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="w-40"
                            />
                            <Button 
                                onClick={handleSearch}
                                disabled={isLoading || !empresaId}
                                className="bg-accent hover:bg-accent/90"
                            >
                                <Search className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Toggle de Vista - Solo mostrar si hay datos */}
                    {costCenters.length > 0 && (
                        <div className="flex border rounded-lg p-1 bg-muted/50">
                            <Button
                                variant={viewMode === "cards" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("cards")}
                                className="h-8 px-3"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === "table" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("table")}
                                className="h-8 px-3"
                            >
                                <Table className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Botón Actualizar - Solo mostrar si hay empresa seleccionada */}
                    {empresaId && (
                        <Button 
                            onClick={handleSearch} 
                            disabled={isLoading}
                            className="bg-secondary hover:bg-secondary/90 justify-center"
                        >
                            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    )}

                    {/* Botón Agregar - Solo mostrar si hay empresa seleccionada */}
                    {empresaId && (
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={openAddDialog} className="bg-accent hover:bg-accent/90">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Agregar Centro
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Agregar Nuevo Centro de Costo</DialogTitle>
                                    <DialogDescription>Complete los datos del centro de costo</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="nombre">Nombre del Centro de Costo *</Label>
                                        <Input
                                            id="nombre"
                                            placeholder="Ej: Departamento de Ventas"
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="empresa_id">ID Empresa *</Label>
                                        <Input
                                            id="empresa_id"
                                            type="number"
                                            placeholder="Ej: 1"
                                            value={formData.empresa_id}
                                            onChange={(e) => setFormData({ ...formData, empresa_id: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="estado">Estado</Label>
                                        <select
                                            id="estado"
                                            value={formData.estado.toString()}
                                            onChange={(e) => setFormData({ ...formData, estado: e.target.value === "true" })}
                                            className="w-full p-2 border rounded-md"
                                        >
                                            <option value="true">Activo</option>
                                            <option value="false">Inactivo</option>
                                        </select>
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
                    )}
                </div>
            </div>

            {/* Estado de carga */}
            {isLoading && (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Cargando centros de costo...</p>
                </div>
            )}

            {/* Estado inicial - Sin empresa seleccionada */}
            {!empresaId && !isLoading && (
                <Card>
                    <CardContent className="text-center py-12">
                        <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">Selecciona una empresa</h3>
                        <p className="text-muted-foreground">
                            Ingresa el ID de una empresa para ver sus centros de costo
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Sin resultados */}
            {empresaId && !isLoading && costCenters.length === 0 && (
                <Card>
                    <CardContent className="text-center py-12">
                        <FolderTree className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No hay centros de costo</h3>
                        <p className="text-muted-foreground mb-4">
                            No se encontraron centros de costo para la empresa ID: {empresaId}
                        </p>
                        <Button onClick={openAddDialog} className="bg-accent hover:bg-accent/90">
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Primer Centro
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Vista de Tarjetas */}
            {!isLoading && costCenters.length > 0 && viewMode === "cards" && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {costCenters.map((costCenter, index) => (
                        <Card
                            key={costCenter.id}
                            className="border-2 hover:border-primary transition-all duration-300 hover:shadow-xl animate-in fade-in zoom-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-primary/10 rounded-lg">
                                            <FolderTree className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{costCenter.nombre}</CardTitle>
                                            <CardDescription className="flex items-center gap-2 mt-1">
                                                {getStatusBadge(costCenter.estado)}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                            <Building2 className="h-3 w-3" />
                                            Empresa ID
                                        </div>
                                        <p className="text-sm font-medium">
                                            {costCenter.empresa_id}
                                            {costCenter.empresa && ` - ${costCenter.empresa.nombre}`}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                            <FolderTree className="h-3 w-3" />
                                            Creado
                                        </div>
                                        <p className="text-sm font-medium">{formatDate(costCenter.created_at)}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 transition-all hover:scale-[1.02] bg-transparent"
                                        onClick={() => openEditDialog(costCenter)}
                                    >
                                        <Pencil className="h-3 w-3 mr-2" />
                                        Editar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 text-destructive hover:bg-destructive/10 transition-all hover:scale-[1.02] bg-transparent"
                                        onClick={() => handleDelete(costCenter.id)}
                                    >
                                        <Trash2 className="h-3 w-3 mr-2" />
                                        Eliminar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Vista de Tabla */}
            {!isLoading && costCenters.length > 0 && viewMode === "table" && (
                <Card>
                    <CardContent className="p-0">
                        <UITable>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Centro de Costo</TableHead>
                                    <TableHead>Empresa</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Creado</TableHead>
                                    <TableHead>Actualizado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {costCenters.map((costCenter) => (
                                    <TableRow key={costCenter.id} className="hover:bg-muted/50">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-lg">
                                                    <FolderTree className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{costCenter.nombre}</p>
                                                    <p className="text-sm text-muted-foreground">ID: {costCenter.id}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium">ID: {costCenter.empresa_id}</p>
                                                    {costCenter.empresa && (
                                                        <p className="text-sm text-muted-foreground">{costCenter.empresa.nombre}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(costCenter.estado)}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">{formatDate(costCenter.created_at)}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">{formatDate(costCenter.updated_at)}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openEditDialog(costCenter)}
                                                    className="h-8 px-3"
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(costCenter.id)}
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
                    </CardContent>
                </Card>
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Editar Centro de Costo</DialogTitle>
                        <DialogDescription>Modifique los datos del centro de costo</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-nombre">Nombre del Centro de Costo *</Label>
                            <Input
                                id="edit-nombre"
                                placeholder="Ej: Departamento de Ventas"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-empresa_id">ID Empresa *</Label>
                            <Input
                                id="edit-empresa_id"
                                type="number"
                                placeholder="Ej: 1"
                                value={formData.empresa_id}
                                onChange={(e) => setFormData({ ...formData, empresa_id: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-estado">Estado</Label>
                            <select
                                id="edit-estado"
                                value={formData.estado.toString()}
                                onChange={(e) => setFormData({ ...formData, estado: e.target.value === "true" })}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="true">Activo</option>
                                <option value="false">Inactivo</option>
                            </select>
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