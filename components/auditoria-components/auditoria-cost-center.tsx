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
import ToolBar from "../tool-bar";

export function AuditoriaCostCenters() {
    const { token } = useAuth.getState();
    const [costCenters, setCostCenters] = useState<CostCenter[]>([])
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
    const [empresaId, setEmpresaId] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [companies, setCompanies] = useState<{ id: string; nombre: string }[]>([]);

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
        fetchCostCenters(empresaId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [empresaId]);

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
            console.log("🔄 Fetching from:", url); // ← Agregar log

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log("📡 Response status:", res.status); // ← Agregar log

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

                // company select (usa tu estado companies / empresaId)
                showCompanySelect
                companies={companies}
                selectedCompany={empresaId}
                onCompanyChange={(id) => setEmpresaId(id)}

                refreshAction={() => handleSearch()}
            />
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
                                                Creado
                                            </div>
                                            <p className="text-sm font-medium">{formatDate(costCenter.created_at)}</p>
                                        </div>
                                    </div>
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
                                    </TableRow>
                                ))}
                            </TableBody>
                        </UITable>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}