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
    Phone,
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
import ToolBarAdmin from "../ToolBarAdmin";

export function AdminPassengers() {
    const { token, user } = useAuth.getState();
    const [companies, setCompanies] = useState<{ id: string; nombre: string }[]>([]);
    const [passengers, setPassengers] = useState<Passenger[]>([]);
    const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"cards" | "table">("table");
    const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);
    const [userCompany, setUserCompany] = useState<{ id: string; nombre: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const [emailSearch, setEmailSearch] = useState("");
    const [rutSearch, setRutSearch] = useState("");

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
    });

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
        if (!userCompany?.id) return;

        fetchPassengers({
            page: 1,
            limit: pagination.limit,
            company: userCompany.id
        });
        fetchCostCenters(userCompany.id);

        setFormData(prev => ({
            ...prev,
            id_empresa: userCompany.id,
            id_centro_costo: "" // Resetear centro de costo
        }));

    }, [userCompany]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const res = await fetch("/api/companies", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    const mapped = data.map((c: any) => ({
                        id: c.id.toString(),
                        nombre: c.nombre,
                    }));
                    setCompanies(mapped);

                    // Si el usuario tiene empresa_id, establecerla automáticamente
                    if (user?.companyId) {
                        const userCompany = mapped.find((c: any) => c.id === user?.companyId?.toString());
                        if (userCompany) {
                            setUserCompany(userCompany);
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching companies:", err);
                toast({
                    title: "Error",
                    description: "No se pudieron cargar las empresas",
                    variant: "destructive"
                });
            }
        };

        fetchInitialData();
    }, [user, token]);

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

    const fetchPassengers = async (opts?: {
        page?: number;
        limit?: number;
        email?: string;
        rut?: string;
        company?: string;
    }) => {
        if (!userCompany?.id) return;

        setIsLoading(true);
        try {
            const page = opts?.page ?? pagination.page;
            const limit = opts?.limit ?? pagination.limit;
            const email = opts?.email ?? emailSearch;
            const rut = opts?.rut ?? rutSearch;
            const company = opts?.company ?? userCompany?.id;

            const params = new URLSearchParams({
                page: String(page),
                limit: String(limit),
            });

            params.set("id_empresa", company);

            if (email && email.trim() !== "") {
                params.set("correo", email.trim());
            }

            if (rut && rut.trim() !== "") {
                const rutClean = rut.replace(/\./g, "").toUpperCase();
                params.set("rut", rutClean);
            }

            const res = await fetch(`/api/pasajeros?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            });

            if (!res.ok) {
                if (res.status === 404) {
                    setPassengers([]);
                    setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }));
                    return;
                }
                const errBody = await res.json().catch(() => null);
                console.error("Error fetching passengers:", res.status, errBody);
                throw new Error(errBody?.message || "Error fetching passengers");
            }

            const body = await res.json();

            let passengersData, paginationData;

            if (body.pasajeros && body.pagination) {
                passengersData = body.pasajeros;
                paginationData = body.pagination;
            } else if (Array.isArray(body)) {
                passengersData = body;
                paginationData = {
                    page: 1,
                    limit: passengersData.length,
                    total: passengersData.length,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false,
                };
            } else if (body.passengers) {
                passengersData = body.passengers;
                paginationData = body.pagination;
            } else {
                passengersData = [];
                paginationData = {
                    page,
                    limit,
                    total: 0,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPrevPage: false,
                };
            }

            const passengersMapped = passengersData.map((passenger: any) => ({
                id: passenger.id,
                nombre: passenger.nombre,
                rut: passenger.rut,
                correo: passenger.correo,
                telefono: passenger.telefono || "",
                id_empresa: passenger.id_empresa?.toString?.() || passenger.empresa_id?.toString?.() || "",
                id_centro_costo: passenger.id_centro_costo?.toString?.() || passenger.centro_costo_id?.toString?.() || "",
                empresa: passenger.empresa,
                centroCosto: passenger.centroCosto || passenger.centro_costo,
            }));

            setPassengers(passengersMapped);
            setPagination({
                page: paginationData.page || page,
                limit: paginationData.limit || limit,
                total: paginationData.total || passengersMapped.length,
                totalPages: paginationData.totalPages || Math.ceil((paginationData.total || passengersMapped.length) / (paginationData.limit || limit)),
                hasNextPage: Boolean(paginationData.hasNextPage),
                hasPrevPage: Boolean(paginationData.hasPrevPage),
            });

        } catch (err: any) {
            console.error("Error fetching passengers:", err);
            toast({
                title: "Error",
                description: err.message || "No se pudieron cargar los pasajeros",
                variant: "destructive",
            });
            setPassengers([]);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            nombre: "",
            rut: "",
            correo: "",
            telefono: "",
            id_empresa: userCompany?.id || "",
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

            fetchPassengers({
                page: pagination.page,
                limit: pagination.limit
            });
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

            fetchPassengers({
                page: pagination.page,
                limit: pagination.limit
            });
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

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage === pagination.page || (pagination.totalPages && newPage > pagination.totalPages)) return;
        setPagination(prev => ({ ...prev, page: newPage }));
        fetchPassengers({
            page: newPage,
            limit: pagination.limit
        });
    };

    const handleLimitChange = (newLimit: number) => {
        if (newLimit === pagination.limit) return;
        setPagination(prev => ({ ...prev, page: 1, limit: newLimit }));
        fetchPassengers({
            page: 1,
            limit: newLimit
        });
    };

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchPassengers({
            page: 1,
            limit: pagination.limit
        });
    };

    const handleClearSearch = () => {
        setEmailSearch("");
        setRutSearch("");
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchPassengers({
            page: 1,
            limit: pagination.limit
        });
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
                title="Gestión de Pasajeros"
                description="Administre los pasajeros de su empresa"
                viewMode={viewMode}
                setViewMode={setViewMode}
                companyInfo={userCompany ? {
                    id: userCompany.id,
                    nombre: userCompany.nombre
                } : undefined}
                refreshAction={() => userCompany && fetchPassengers({
                    page: pagination.page,
                    limit: pagination.limit
                })}
                primaryAction={{
                    label: "Nuevo Pasajero",
                    icon: <Plus className="h-4 w-4" />,
                    onClick: openAddDialog,
                }}
            />

            {isLoading && (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Cargando pasajeros...</p>
                </div>
            )}

            {!isLoading && userCompany && passengers.length === 0 && (
                <Card>
                    <CardContent className="text-center py-12">
                        <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No hay pasajeros</h3>
                        <p className="text-muted-foreground mb-4">
                            No se encontraron pasajeros para {userCompany.nombre}
                        </p>
                        <Button onClick={openAddDialog} className="bg-accent hover:bg-accent/90">
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Primer Pasajero
                        </Button>
                    </CardContent>
                </Card>
            )}

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
                                className="w-full p-2 border rounded-md bg-muted"
                                disabled
                            >
                                <option value={userCompany?.id}>
                                    {userCompany?.id} - {userCompany?.nombre}
                                </option>
                            </select>
                            <p className="text-xs text-muted-foreground">
                                Solo puede crear pasajeros para su empresa asignada
                            </p>
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
                                className="w-full p-2 border rounded-md bg-muted"
                                disabled
                            >
                                <option value={userCompany?.id}>
                                    {userCompany?.id} - {userCompany?.nombre}
                                </option>
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

            {userCompany && passengers.length > 0 && (
                <Card className="mb-4">
                    <CardContent className="p-4">
                        <div className="grid md:grid-cols-4 gap-4 items-end">
                            <div className="space-y-2">
                                <Label htmlFor="email-search">Buscar por correo</Label>
                                <Input
                                    id="email-search"
                                    placeholder="Ej: usuario@empresa.com"
                                    value={emailSearch}
                                    onChange={(e) => setEmailSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleSearch();
                                        }
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="rut-search">Buscar por RUT</Label>
                                <Input
                                    id="rut-search"
                                    placeholder="Ej: 12345678-9"
                                    value={rutSearch}
                                    onChange={(e) => setRutSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleSearch();
                                        }
                                    }}
                                />
                            </div>

                            <div className="flex gap-2 md:col-span-2">
                                <Button
                                    onClick={handleSearch}
                                    className="bg-accent hover:bg-accent/90"
                                >
                                    <Search className="h-4 w-4 mr-2" />
                                    Buscar
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={handleClearSearch}
                                >
                                    Limpiar
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {!isLoading && passengers.length > 0 && (
                <>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="text-sm text-muted-foreground">
                            {pagination.total > 0 ? (
                                <>
                                    Mostrando{" "}
                                    <strong>
                                        {(pagination.page - 1) * pagination.limit + 1}
                                        {" - "}
                                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                                    </strong>{" "}
                                    de <strong>{pagination.total}</strong> pasajeros
                                </>
                            ) : (
                                <>No hay pasajeros para mostrar</>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-sm">
                                <label className="text-muted-foreground">Resultados:</label>
                                <select
                                    value={pagination.limit}
                                    onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                                    className="p-2 border rounded-md bg-background"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(1)}
                                    disabled={!pagination.hasPrevPage}
                                    className="h-8 w-8 p-0"
                                >
                                    «
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={!pagination.hasPrevPage}
                                    className="h-8 w-8 p-0"
                                >
                                    ‹
                                </Button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, pagination.totalPages || 1) }, (_, i) => {
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
                                                variant={pagination.page === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handlePageChange(pageNum)}
                                                className="h-8 w-8 p-0"
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={!pagination.hasNextPage}
                                    className="h-8 w-8 p-0"
                                >
                                    ›
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.totalPages)}
                                    disabled={!pagination.hasNextPage}
                                    className="h-8 w-8 p-0"
                                >
                                    »
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="my-4 border-t" />
                </>
            )}

            {!isLoading && passengers.length > 0 && viewMode === "cards" && (
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
            {!isLoading && passengers.length > 0 && viewMode === "table" && (
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
                    </CardContent>
                </Card>
            )}
        </div>
    );
}