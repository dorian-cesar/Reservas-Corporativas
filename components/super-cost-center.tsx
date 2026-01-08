"use client"

import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
    Search,
    Upload,
    ChevronsUpDown
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
import ToolBar from "./tool-bar";

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";


export function SuperCostCenters() {
    const { user, token } = useAuth.getState();
    const [costCenters, setCostCenters] = useState<CostCenter[]>([])
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [viewMode, setViewMode] = useState<"cards" | "table">("table")
    const [empresaId, setEmpresaId] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [companies, setCompanies] = useState<{ id: string; nombre: string }[]>([]);
    const [csvModalOpen, setCsvModalOpen] = useState(false);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [companyPopoverOpen, setCompanyPopoverOpen] = useState(false);
    const [loadingCompanies, setLoadingCompanies] = useState(false);
    const [showInactives, setShowInactives] = useState(false);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

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

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        if (!empresaId) return;
        fetchCostCenters(empresaId, showInactives);
    }, [empresaId]);

    const reloadCostCenters = () => {
        if (!empresaId) return;
        fetchCostCenters(empresaId, showInactives);
    };

    const fetchCompanies = async () => {
        try {
            setLoadingCompanies(true)
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
            setLoadingCompanies(false)
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "No se pudieron cargar las empresas", variant: "destructive" });
            setLoadingCompanies(false)
        } finally {
            setLoadingCompanies(false)
        }
    };

    const fetchCostCenters = async (targetEmpresaId: string, showInactives?: boolean) => {
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

            let url = `/api/centros-costo/empresa/${targetEmpresaId}`;

            if (showInactives) {
                url += "?showInactives=true";
            }

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
            console.log("✅ Cost centers data:", costCentersData);

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
            console.error("❌ Error fetching cost centers:", err);
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
        reloadCostCenters();
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

    const handleAdd = async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
        }

        if (!formData.nombre || !formData.empresa_id) {
            toast({ title: "Error", description: "Complete todos los campos", variant: "destructive" });
            return;
        }

        setIsLoading(true);

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

            if (empresaId && empresaId === formData.empresa_id) {
                fetchCostCenters(empresaId, showInactives);
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "No se pudo agregar", variant: "destructive" });
        } finally {
            setIsLoading(false);
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
                fetchCostCenters(empresaId, showInactives);
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

    const sendCSV = () => {
        resetCSVModal();
        setCsvModalOpen(true);
    };

    const openDetailsDialog = () => {
        setDetailsDialogOpen(true)
    }

    const changeVisibility = () => {
        const newShowInactives = !showInactives;
        setShowInactives(newShowInactives);
        setDetailsDialogOpen(false);

        // Usar reloadCostCenters en lugar de fetchCostCenters directamente
        reloadCostCenters();

        toast({
            title: "Filtro cambiado",
            description: newShowInactives
                ? "Mostrando TODOS los centros de costo (activos e inactivos)"
                : "Mostrando solo centros de costo activos",
            variant: "default",
        });
    };

    const handleUploadCSV = async () => {
        if (!csvFile) {
            alert("Selecciona un archivo CSV");
            return;
        }

        try {
            setLoading(true);

            const formData = new FormData();
            formData.append("file", csvFile);

            const response = await fetch("/api/csv/cost-centers", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Error al subir el CSV");
            }

            const data = await response.json();
            setResult(data);
            console.log("Resultado CSV:", data);

        } catch (err: any) {
            alert(err.message || "Error inesperado");
        } finally {
            setLoading(false);
        }
    };

    const resetCSVModal = () => {
        setCsvFile(null);
        setResult(null);
        setLoading(false);
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
            <ToolBar
                title="Centros de Costo"
                description="Gestione los centros de costo de las empresas"
                viewMode={viewMode}
                setViewMode={setViewMode}

                showCompanySelect
                companies={companies}
                selectedCompany={empresaId}
                onCompanyChange={(id) => setEmpresaId(id)}
                companySelectMode="combobox"
                companySelectPlaceholder="Selecciona una empresa..."
                loadingCompanies={loadingCompanies}

                refreshAction={() => handleSearch()}

                primaryAction={
                    (user?.role === "superuser" || user?.role === "admin") ? {
                        label: "Agregar Centro",
                        icon: <Plus className="h-4 w-4" />,
                        onClick: openAddDialog,
                        className: "bg-accent hover:bg-accent/90",
                    } : undefined
                }
                secondaryAction={
                    {
                        label: "Detalles",
                        onClick: openDetailsDialog,
                    }
                }
            />

            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Herramientas</DialogTitle>
                        <DialogDescription>
                            {isLoading ? (
                                "Cargando..."
                            ) : (
                                `Utilice la opcion de carga por CSV o ver centros de costo inactivos`
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                <p className="text-muted-foreground mt-2 ml-2">Cargando...</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Selecciona una acción</Label>
                                    <Button
                                        onClick={sendCSV}
                                        className="w-full bg-accent hover:bg-accent/90"
                                        disabled={isLoading}
                                    >
                                        <Upload className="h-4 w-4 mr-2" /> Subir CSV
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="show-inactives" className="text-base">
                                            Mostrar centros inactivos
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            {showInactives
                                                ? "Mostrando todos los centros (activos e inactivos)"
                                                : "Mostrando solo centros activos"}
                                        </p>
                                    </div>
                                    <Switch
                                        id="show-inactives"
                                        checked={showInactives}
                                        onCheckedChange={(checked) => {
                                            setShowInactives(checked);
                                            if (empresaId) {
                                                fetchCostCenters(empresaId, checked);
                                            }
                                            toast({
                                                title: "Filtro actualizado",
                                                description: checked
                                                    ? "Mostrando TODOS los centros de costo"
                                                    : "Mostrando solo centros activos",
                                                variant: "default",
                                            });
                                        }}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDetailsDialogOpen(false)}
                            disabled={isLoading}
                        >
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className={`space-y-4 p-4 border rounded-lg bg-card ${isAddDialogOpen ? '' : 'hidden'
                }`}>
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Agregar Nuevo Centro de Costo</h3>
                    <p className="text-sm text-muted-foreground">
                        Complete los datos del centro de costo
                    </p>
                </div>

                <form onSubmit={handleAdd} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre del Centro de Costo *</Label>
                        <Input
                            id="nombre"
                            placeholder="Ej: Departamento de Ventas"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="empresa_id">Empresa *</Label>

                        <Popover open={companyPopoverOpen} onOpenChange={setCompanyPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={companyPopoverOpen}
                                    className="w-full justify-between bg-white"
                                >
                                    {formData.empresa_id
                                        ? `${companies.find(c => c.id === formData.empresa_id)?.id || ''} - ${companies.find(c => c.id === formData.empresa_id)?.nombre || ''}`
                                        : "Selecciona una empresa"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                                <Command>
                                    <CommandInput placeholder="Buscar empresa..." />
                                    <CommandList>
                                        <CommandEmpty>No se encontró la empresa.</CommandEmpty>
                                        <CommandGroup>
                                            {companies.map((company) => (
                                                <CommandItem
                                                    key={company.id}
                                                    value={`${company.id} ${company.nombre}`}
                                                    onSelect={() => {
                                                        setFormData({ ...formData, empresa_id: company.id });
                                                        setCompanyPopoverOpen(false);
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    {company.id} - {company.nombre}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="estado">Estado</Label>
                        <select
                            id="estado"
                            value={formData.estado.toString()}
                            onChange={(e) => setFormData({ ...formData, estado: e.target.value === "true" })}
                            className="w-full p-2 border rounded-md"
                            disabled={isLoading}
                        >
                            <option value="true">Activo</option>
                            <option value="false">Inactivo</option>
                        </select>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => { setIsAddDialogOpen(false) }}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-accent hover:bg-accent/90"
                            disabled={isLoading}
                        >
                            {isLoading ? "Agregando..." : "Agregar"}
                        </Button>
                    </div>
                </form>
            </div>

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
                                <div className="flex items-center gap-4">
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="p-3 bg-muted/50 rounded-lg">
                                            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                                <FolderTree className="h-3 w-3" />
                                                Creado
                                            </div>
                                            <p className="text-sm font-medium">{formatDate(costCenter.created_at)}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="p-3 bg-muted/50 rounded-lg">
                                            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                                <FolderTree className="h-3 w-3" />
                                                Actualizado
                                            </div>
                                            <p className="text-sm font-medium">{formatDate(costCenter.updated_at)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {user?.role === "superuser" && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 transition-all hover:scale-[1.02] bg-transparent"
                                            onClick={() => openEditDialog(costCenter)}
                                        >
                                            <Pencil className="h-3 w-3 mr-2" />
                                            Editar
                                        </Button>
                                    )}
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
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Creado</TableHead>
                                    <TableHead>Actualizado</TableHead>
                                    {user?.role === "superuser" && <TableHead className="text-right">Acciones</TableHead>}
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
                                                {(user?.role === "superuser" || user?.role === "admin") && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openEditDialog(costCenter)}
                                                        className="h-8 px-3"
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                )}
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
                            <Label htmlFor="edit-empresa_id">Empresa *</Label>
                            <select
                                id="edit-empresa_id"
                                value={formData.empresa_id}
                                onChange={(e) => setFormData({ ...formData, empresa_id: e.target.value })}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="">Selecciona una empresa</option>
                                {companies.map((company) => (
                                    <option key={company.id} value={company.id}>
                                        {company.id} - {company.nombre}
                                    </option>
                                ))}
                            </select>
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

            <Dialog
                open={csvModalOpen}
                onOpenChange={(open) => {
                    setCsvModalOpen(open);
                    if (!open) {
                        resetCSVModal();
                    }
                }}
            >
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Importar centros de costo desde CSV</DialogTitle>
                        <DialogDescription>
                            Sube un archivo CSV con las columnas indicadas abajo.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <label className="text-sm font-medium mr-5">Archivo CSV</label>
                        <input
                            key={csvModalOpen ? "open" : "closed"}
                            type="file"
                            accept=".csv"
                            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                            className="border border-gray-300 rounded-lg py-2 px-2 cursor-pointer"
                        />
                    </div>

                    <div className="mt-4 rounded-md bg-muted p-3 text-sm">
                        <p className="font-medium mb-2">Ejemplo de CSV:</p>
                        <pre className="text-xs overflow-x-auto">
                            {`nombre,empresa_id,estado`}
                        </pre>
                    </div>
                    {result && (
                        <div className="mt-4 rounded-md bg-muted p-3 text-sm">
                            <p>
                                <strong>Datos cargados:</strong> {result.result?.success}
                            </p>

                            {result.result?.errors?.length > 0 && (
                                <>
                                    <p className="mt-2 font-medium text-red-600">
                                        Errores:
                                    </p>
                                    <ul className="list-disc list-inside text-xs text-red-500 max-h-32 overflow-auto">
                                        {result.result.errors.map((e: string, i: number) => (
                                            <li key={i}>{e}</li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                    )}

                    <DialogFooter className="mt-4">
                        <Button
                            variant="secondary"
                            onClick={() => setCsvModalOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleUploadCSV} disabled={loading || !csvFile}>
                            <Upload className="h-4 w-4 mr-2" />
                            {loading ? "Enviando..." : "Enviar CSV"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}