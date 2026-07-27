import { TravelSearch } from "@/components/travel-search"
import { UserProvider } from "@/components/providers/user-provider";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmpresaDisponible {
    id: number;
    nombre: string;
    rut: string;
    cuenta_corriente: string;
    estado: boolean;
    es_actual: boolean;
    desde: string;
    morosidad?: boolean;
}

export default function Reserve() {
    const { user, token, changeCompany } = useAuth();
    const { toast } = useToast();
    const [companies, setCompanies] = useState<EmpresaDisponible[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [changingCompany, setChangingCompany] = useState(false);

    useEffect(() => {
        const fetchCompanies = async () => {
            if (!token) return;

            try {
                setLoading(true);
                const res = await fetch("/api/companies", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || "Error al cargar empresas");
                }

                const data = await res.json();

                if (Array.isArray(data)) {
                    const mapped = data.map((c: any) => ({
                        id: c.id.toString(),
                        nombre: c.nombre,
                        rut: c.rut,
                        cuenta_corriente: c.cuenta_corriente,
                        estado: c.estado,
                        es_actual: c.es_actual || false,
                        desde: c.desde || "empresa_principal",
                        morosidad: Boolean(c.morosidad),
                    }));

                    setCompanies(mapped);

                    const empresaActual = mapped.find((emp: EmpresaDisponible) => emp.es_actual);

                    if (!empresaActual && user?.companyId) {
                        const userCompany = mapped.find(emp => emp.id === user.companyId);
                        if (userCompany) {
                            setSelectedCompany(userCompany.id);
                        } else if (mapped.length === 1) {
                            // Si solo hay una empresa, seleccionarla
                            setSelectedCompany(mapped[0].id);
                        }
                    } else if (empresaActual) {
                        setSelectedCompany(empresaActual.id);
                    } else if (mapped.length === 1) {
                        // Si solo hay una empresa, seleccionarla
                        setSelectedCompany(mapped[0].id);
                    }
                } else if (data.empresas_disponibles && Array.isArray(data.empresas_disponibles)) {
                    const mapped = data.empresas_disponibles.map((c: any) => ({
                        id: c.id?.toString() || String(c.id),
                        nombre: c.nombre,
                        rut: c.rut,
                        cuenta_corriente: c.cuenta_corriente,
                        estado: c.estado,
                        es_actual: c.es_actual || false,
                        desde: c.desde || "empresa_principal",
                        morosidad: Boolean(c.morosidad),
                    }));

                    setCompanies(mapped);

                    const empresaActual = mapped.find((emp: EmpresaDisponible) => emp.es_actual);
                    if (empresaActual) {
                        setSelectedCompany(empresaActual.id);
                    } else if (mapped.length === 1) {
                        setSelectedCompany(mapped[0].id);
                    }
                } else {
                    console.error("Formato de datos inesperado:", data);
                    toast({
                        title: "Error",
                        description: "Formato de datos inválido",
                        variant: "destructive",
                    });
                }
            } catch (err) {
                console.error("Error al cargar empresas:", err);
                toast({
                    title: "Error",
                    description: "No se pudieron cargar las empresas",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchCompanies();
    }, [token, toast, user?.companyId]);

    const handleCompanyChange = async (newCompanyId: string) => {
        if (!newCompanyId || newCompanyId === selectedCompany) return;

        setChangingCompany(true);

        try {
            const result = await changeCompany(newCompanyId);

            if (result.success) {
                setSelectedCompany(newCompanyId);

                // Mostrar mensaje de éxito
                toast({
                    title: "Empresa cambiada",
                    description: `Ahora estás trabajando con ${result.user?.companyName || "la nueva empresa"}`,
                });

                // Forzar recarga de la página para aplicar nuevos permisos/token
                // O puedes actualizar el estado global sin recargar
                setTimeout(() => {
                    window.location.reload();
                }, 1000);

            } else {
                toast({
                    title: "Error",
                    description: result.message || "No se pudo cambiar la empresa",
                    variant: "destructive",
                });
                // Revertir selección
                setSelectedCompany(selectedCompany);
            }
        } catch (error) {
            console.error("Error al cambiar empresa:", error);
            toast({
                title: "Error",
                description: "Error al conectar con el servidor",
                variant: "destructive",
            });
            // Revertir selección
            setSelectedCompany(selectedCompany);
        } finally {
            setChangingCompany(false);
        }
    };

    const getCompanyName = (id: string) => {
        const company = companies.find(c => c.id.toString() === id);
        return company ? `${company.nombre}` : "Empresa no encontrada";
    };

    const canChangeCompany = user?.role === "admin" || user?.role === "superuser";

    return (
        <div className="container mx-auto px-4 py-8">
            <UserProvider />

            <Card className="mb-6 shadow-md">
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                <h2 className="text-xl font-bold">Selecciona una empresa</h2>
                            </div>

                            {changingCompany && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Cambiando empresa...
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <p className="text-muted-foreground">
                                {canChangeCompany
                                    ? "Puedes cambiar entre las empresas a las que tienes acceso."
                                    : "Esta es la empresa con la que puedes realizar reservas."
                                }
                            </p>

                            {!canChangeCompany && user?.companyName && (
                                <p className="text-sm bg-blue-50 p-2 rounded-md border border-blue-200">
                                    <span className="font-medium">Empresa asignada:</span> {user.companyName}
                                </p>
                            )}
                        </div>

                        {loading ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Cargando empresas disponibles...
                            </div>
                        ) : (
                            <Select
                                value={selectedCompany}
                                onValueChange={handleCompanyChange}
                                disabled={!canChangeCompany || changingCompany}
                            >
                                <SelectTrigger className="w-full md:w-1/2">
                                    <SelectValue placeholder="Selecciona una empresa">
                                        {selectedCompany ? (
                                            <div className="flex items-center gap-2">
                                                <span>{getCompanyName(selectedCompany)}</span>
                                                {companies.find(c => c.id.toString() === selectedCompany)?.es_actual && (
                                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                                        Actual
                                                    </span>
                                                )}
                                            </div>
                                        ) : "Selecciona una empresa"}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {companies.length === 0 ? (
                                        <SelectItem value="none" disabled>
                                            No tienes empresas asignadas
                                        </SelectItem>
                                    ) : (
                                        companies.map((company) => (
                                            <SelectItem
                                                key={company.id}
                                                value={company.id.toString()}
                                                className="flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span>{company.nombre}</span>
                                                    {company.es_actual && (
                                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                                            Actual
                                                        </span>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        )}

                        {!canChangeCompany && (
                            <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded-md">
                                Solo los administradores pueden cambiar de empresa.
                            </p>
                        )}

                        {selectedCompany && companies.length > 0 && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                                <p className="text-green-700 text-sm">
                                    {companies.find(c => c.id.toString() === selectedCompany)?.es_actual
                                        ? "Empresa actual: "
                                        : "Trabajando con: "}
                                    <span className="font-semibold">{getCompanyName(selectedCompany)}</span>
                                </p>
                                <p className="text-green-600 text-xs mt-1">
                                    Los pasajeros y tickets se filtrarán por esta empresa.
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Validar estado de Morosidad de la empresa seleccionada */}
            {companies.find(c => c.id.toString() === selectedCompany)?.morosidad ? (
                <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-200 shadow-md">
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                        <AlertTriangle className="h-14 w-14 text-red-600 dark:text-red-400" />
                        <h3 className="text-xl font-bold text-red-700 dark:text-red-300">
                            EMPRESA EN ESTADO DE MOROSIDAD
                        </h3>
                        <p className="max-w-md text-sm text-red-800 dark:text-red-300">
                            La empresa <span className="font-semibold underline">{getCompanyName(selectedCompany)}</span> se encuentra morosa.
                            Se han restringido las búsquedas y compras de nuevos pasajes hasta la regularización de la cuenta.
                        </p>
                    </CardContent>
                </Card>
            ) : selectedCompany && user?.companyId === selectedCompany ? (
                <TravelSearch />
            ) : (
                !loading && companies.length > 0 && (
                    <Card className="border-2 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium text-muted-foreground">
                                Por favor, selecciona una empresa para continuar
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Elige una empresa de la lista superior para buscar y reservar tus viajes.
                            </p>
                        </CardContent>
                    </Card>
                )
            )}

            {/* Mensaje si no hay empresas */}
            {!loading && companies.length === 0 && (
                <Card className="border-2 border-destructive/20 bg-destructive/5">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Building2 className="h-12 w-12 text-destructive/60 mb-4" />
                        <p className="text-lg font-medium text-destructive">
                            No tienes empresas asignadas
                        </p>
                        <p className="text-sm text-destructive/80 mt-2">
                            Contacta con el administrador para que te asigne una empresa.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}