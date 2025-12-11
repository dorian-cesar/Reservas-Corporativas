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
  User,
  Plus,
  Pencil,
  Trash2,
  Mail,
  Key,
  Building2,
  RefreshCcw,
  Table,
  LayoutGrid,
  Badge,
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
import ToolBarAdmin from "../ToolBarAdmin";

export function AdminCompanyUsers() {
  const { token, user } = useAuth.getState(); // Obtener también el usuario
  const [users, setUsers] = useState<User[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"cards" | "table">("table")
  const [companies, setCompanies] = useState<{ id: string; nombre: string }[]>([]);
  const [costCenters, setCostCenters] = useState<{ id: string; nombre: string; empresa_id: string }[]>([]);
  const [isLoadingCostCenters, setIsLoadingCostCenters] = useState(false);
  const [userCompany, setUserCompany] = useState<{ id: string; nombre: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [emailSearch, setEmailSearch] = useState("");

  type User = {
    id: number;
    nombre: string;
    rut: string;
    email: string;
    rol: string;
    empresa_id: string;
    centro_costo_id?: string;
    estado: boolean;
  };

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    nombre: "",
    rut: "",
    email: "",
    password: "",
    rol: "subusuario",
    estado: true,
    empresa_id: "",
    centro_costo_id: ""
  })

  useEffect(() => {
    if (!userCompany?.id) return;

    fetchUsersByCompany({
      page: 1,
      limit: pagination.limit,
      empresaId: userCompany.id
    });

  }, [userCompany]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Obtener empresas
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

  // Cargar centros de costo cuando cambia la empresa seleccionada
  useEffect(() => {
    if (formData.empresa_id) {
      fetchCostCentersByCompany(formData.empresa_id);
    } else {
      setCostCenters([]);
      setFormData(prev => ({ ...prev, centro_costo_id: "" }));
    }
  }, [formData.empresa_id]);

  const fetchCostCentersByCompany = async (empresaId: string) => {
    if (!empresaId) return;

    setIsLoadingCostCenters(true);
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
        nombre: cc.nombre,
        empresa_id: cc.empresa_id?.toString() || "",
      }));

      setCostCenters(mapped);
    } catch (err) {
      console.error("Error fetching cost centers:", err);
      setCostCenters([]);
    } finally {
      setIsLoadingCostCenters(false);
    }
  };

  const fetchUsersByCompany = async (opts?: {
    page?: number;
    limit?: number;
    email?: string;
    empresaId?: string;
  }) => {
    if (!userCompany?.id) return;

    setIsLoading(true);
    try {
      const page = opts?.page ?? pagination.page;
      const limit = opts?.limit ?? pagination.limit;
      const email = opts?.email ?? emailSearch;
      const empresaId = opts?.empresaId ?? userCompany?.id;

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      // Agregar filtro por empresa
      params.set("empresa_id", empresaId);

      // Si viene email (no vacío), lo agregamos como filtro
      if (email && email.trim() !== "") {
        params.set("email", email.trim());
      }

      const res = await fetch(`/api/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 404) {
          setUsers([]);
          setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }));
          return;
        }
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const body = await res.json();

      // Manejar formato paginado
      let usersData, paginationData;

      if (body.users && body.pagination) {
        usersData = body.users;
        paginationData = body.pagination;
      } else if (Array.isArray(body)) {
        usersData = body;
        paginationData = {
          page: 1,
          limit: usersData.length,
          total: usersData.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        };
      } else {
        usersData = [];
        paginationData = {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        };
      }

      const usersMapped = usersData.map((user: any) => ({
        id: user.id?.toString?.() ?? String(user.id),
        nombre: user.nombre,
        rut: user.rut,
        email: user.email,
        rol: user.rol,
        empresa_id: user.empresa_id?.toString?.() || "",
        centro_costo_id: user.centro_costo_id?.toString?.() || "",
        estado: user.estado,
      }));

      setUsers(usersMapped);
      setPagination({
        page: paginationData.page || page,
        limit: paginationData.limit || limit,
        total: paginationData.total || usersMapped.length,
        totalPages: paginationData.totalPages || Math.ceil((paginationData.total || usersMapped.length) / (paginationData.limit || limit)),
        hasNextPage: Boolean(paginationData.hasNextPage),
        hasPrevPage: Boolean(paginationData.hasPrevPage),
      });

    } catch (err) {
      console.error("Error fetching users:", err);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: "",
      rut: "",
      email: "",
      password: "",
      rol: "subusuario",
      estado: true,
      empresa_id: userCompany?.id || "", // Pre-llenar con la empresa del admin
      centro_costo_id: ""
    });
    setCostCenters([]);
  };

  const handleAdd = async () => {
    if (!formData.nombre || !formData.rut || !formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          rut: formData.rut,
          email: formData.email,
          password: formData.password,
          rol: formData.rol,
          estado: formData.estado,
          empresa_id: formData.empresa_id || null,
          centro_costo_id: formData.centro_costo_id || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al crear usuario");
      }

      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Usuario agregado",
        description: `${formData.nombre} ha sido agregado exitosamente`,
      });

      // Recargar usuarios de la empresa
      if (userCompany) {
        fetchUsersByCompany({
          page: pagination.page,
          limit: pagination.limit
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.message || "No se pudo agregar el usuario",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;

    if (!formData.nombre || !formData.rut || !formData.email) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      const updateData: any = {
        nombre: formData.nombre,
        rut: formData.rut,
        email: formData.email,
        rol: formData.rol,
        estado: formData.estado,
        empresa_id: formData.empresa_id || null,
        centro_costo_id: formData.centro_costo_id || null,
      };

      // Solo incluir password si se proporcionó uno nuevo
      if (formData.password) {
        updateData.password = formData.password;
      }

      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al actualizar usuario");
      }

      setIsEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();

      // Recargar usuarios de la empresa
      if (userCompany) {
        fetchUsersByCompany({
          page: pagination.page,
          limit: pagination.limit
        });
      }

      toast({
        title: "Usuario actualizado",
        description: `${formData.nombre} ha sido actualizado exitosamente`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.message || "No se pudo actualizar el usuario",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (userId: string) => {
    const userToDelete = users.find((u) => u.id.toString() === userId);
    if (!userToDelete) return;

    if (!confirm(`¿Está seguro que desea eliminar a ${userToDelete.nombre}?`)) return;

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Error al eliminar usuario");

      setUsers(users.filter((u) => u.id.toString() !== userId));
      toast({
        title: "Usuario eliminado",
        description: `${userToDelete.nombre} ha sido eliminado exitosamente`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = async (userToEdit: User) => {
    setSelectedUser(userToEdit);
    setFormData({
      nombre: userToEdit.nombre,
      rut: userToEdit.rut,
      email: userToEdit.email,
      password: "", // No mostrar password actual por seguridad
      rol: userToEdit.rol,
      estado: Boolean(userToEdit.estado),
      empresa_id: userToEdit.empresa_id,
      centro_costo_id: userToEdit.centro_costo_id || "",
    });

    // Si el usuario tiene empresa, cargar sus centros de costo
    if (userToEdit.empresa_id) {
      await fetchCostCentersByCompany(userToEdit.empresa_id);
    } else {
      setCostCenters([]);
    }

    setIsEditDialogOpen(true);
  };

  const openAddDialog = () => {
    resetForm()
    setIsAddDialogOpen(true)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage === pagination.page || (pagination.totalPages && newPage > pagination.totalPages)) return;
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchUsersByCompany({
      page: newPage,
      limit: pagination.limit
    });
  };

  const handleLimitChange = (newLimit: number) => {
    if (newLimit === pagination.limit) return;
    setPagination(prev => ({ ...prev, page: 1, limit: newLimit }));
    fetchUsersByCompany({
      page: 1,
      limit: newLimit
    });
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsersByCompany({
      page: 1,
      limit: pagination.limit
    });
  };

  const handleClearSearch = () => {
    setEmailSearch("");
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsersByCompany({
      page: 1,
      limit: pagination.limit
    });
  };

  const getRoleBadgeColor = (rol: string) => {
    switch (rol) {
      case "superuser":
        return "px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full";

      case "admin":
        return "px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full";

      case "empresa":
        return "px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full";

      case "subusuario":
        return "px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full";

      case "auditoria":
        return "px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full";

      case "contralor":
        return "px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full";

      default:
        return "px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full";
    }
  };

  const getRoleDisplayName = (rol: string) => {
    switch (rol) {
      case "superuser": return "Super Usuario";
      case "admin": return "Administrador";
      case "subusuario": return "Usuario";
      default: return rol;
    }
  };

  const getStatusBadge = (estado: boolean) => {
    return estado ? (
      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Activo</span>
    ) : (
      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Inactivo</span>
    );
  };

  // Si el usuario no tiene empresa asignada
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
        title="Gestión de Usuarios"
        description="Administre los usuarios"
        viewMode={viewMode}
        setViewMode={setViewMode}
        companyInfo={userCompany ? {
          id: userCompany.id,
          nombre: userCompany.nombre
        } : undefined}
        refreshAction={() => userCompany && fetchUsersByCompany({
          page: pagination.page,
          limit: pagination.limit
        })}
        primaryAction={{
          label: "Agregar Usuario",
          icon: <Plus className="h-4 w-4" />,
          onClick: openAddDialog,
        }}
      />

      {/* Estado de carga */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Cargando usuarios...</p>
        </div>
      )}

      {/* Sin resultados */}
      {!isLoading && userCompany && users.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No hay usuarios</h3>
            <p className="text-muted-foreground mb-4">
              No se encontraron usuarios para {userCompany.nombre}
            </p>
            <Button onClick={openAddDialog} className="bg-accent hover:bg-accent/90">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Primer Usuario
            </Button>
          </CardContent>
        </Card>
      )}

      {userCompany && users.length > 0 && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="grid md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="search">Buscar por email</Label>
                <Input
                  id="search"
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

              <div className="flex gap-2">
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

      {/* Información y controles de paginación */}
      {!isLoading && users.length > 0 && (
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
                  de <strong>{pagination.total}</strong> usuarios
                </>
              ) : (
                <>No hay usuarios para mostrar</>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Selector de límite */}
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

              {/* Controles de página */}
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

                {/* Páginas numeradas (máx 5 visibles) */}
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

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
            <DialogDescription>Complete los datos del usuario</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo *</Label>
              <Input
                id="nombre"
                placeholder="Ej: Juan Pérez"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rut">RUT *</Label>
              <Input
                id="rut"
                placeholder="Ej: 12345678-9"
                value={formData.rut}
                onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Ej: usuario@empresa.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingrese la contraseña"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rol">Rol</Label>
              <select
                id="rol"
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="admin">Administrador</option>
                <option value="empresa">Empresa</option>
                <option value="subusuario">usuario</option>
                <option value="auditoria">Auditoria</option>
                <option value="contralor">Contralor</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresa_id">Empresa</Label>
              <select
                id="empresa_id"
                value={formData.empresa_id}
                onChange={(e) => setFormData({ ...formData, empresa_id: e.target.value })}
                className="w-full p-2 border rounded-md bg-muted"
                disabled
              >
                <option value={userCompany?.id}>
                  {userCompany?.id} - {userCompany?.nombre}
                </option>
              </select>
              <p className="text-xs text-muted-foreground">
                Solo puede crear usuarios para su empresa asignada
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="centro_costo_id">Centro de Costo</Label>
              <select
                id="centro_costo_id"
                value={formData.centro_costo_id}
                onChange={(e) => setFormData({ ...formData, centro_costo_id: e.target.value })}
                disabled={!formData.empresa_id || isLoadingCostCenters}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Selecciona un centro de costo</option>
                {isLoadingCostCenters ? (
                  <option value="" disabled>Cargando centros de costo...</option>
                ) : (
                  costCenters.map((costCenter) => (
                    <option key={costCenter.id} value={costCenter.id}>
                      {costCenter.nombre}
                    </option>
                  ))
                )}
              </select>
              {!formData.empresa_id && (
                <p className="text-xs text-muted-foreground">Selecciona una empresa primero</p>
              )}
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

      {/* Vista de Tarjetas */}
      {!isLoading && users.length > 0 && viewMode === "cards" && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user, index) => (
            <Card
              key={user.id}
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
                        {user.nombre}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <span className={getRoleBadgeColor(user.rol)}>
                          {getRoleDisplayName(user.rol)}
                        </span>
                        {getStatusBadge(user.estado)}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Mail className="h-3 w-3" />
                      Email
                    </div>
                    <p className="text-sm font-medium truncate">{user.email}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Key className="h-3 w-3" />
                      RUT
                    </div>
                    <p className="text-sm font-medium">{user.rut}</p>
                  </div>
                  {user.empresa_id && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                        <Building2 className="h-3 w-3" />
                        Empresa ID
                      </div>
                      <p className="text-sm font-medium">{user.empresa_id}</p>
                    </div>
                  )}
                  {user.centro_costo_id && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                        <FolderTree className="h-3 w-3" />
                        Centro de Costo ID
                      </div>
                      <p className="text-sm font-medium">{user.centro_costo_id}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 transition-all hover:scale-[1.02] bg-transparent"
                    onClick={() => openEditDialog(user)}
                  >
                    <Pencil className="h-3 w-3 mr-2" />
                    Editar
                  </Button>
                  {/* <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-destructive hover:bg-destructive/10 transition-all hover:scale-[1.02] bg-transparent"
                    onClick={() => handleDelete(user.id.toString())}
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Eliminar
                  </Button> */}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Vista de Tabla */}
      {!isLoading && users.length > 0 && viewMode === "table" && (
        <Card>
          <CardContent className="p-0">
            <UITable>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>RUT</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Empresa ID</TableHead>
                  <TableHead>Centro Costo ID</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{user.nombre}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Key className="h-3 w-3 text-muted-foreground" />
                        {user.rut}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={getRoleBadgeColor(user.rol)}>
                        {getRoleDisplayName(user.rol)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.estado)}
                    </TableCell>
                    <TableCell>
                      {user.empresa_id ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          {user.empresa_id}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.centro_costo_id ? (
                        <div className="flex items-center gap-2">
                          <FolderTree className="h-3 w-3 text-muted-foreground" />
                          {user.centro_costo_id}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                          className="h-8 px-3"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        {/* <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(user.id.toString())}
                          className="h-8 px-3 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button> */}
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
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Modifique los datos del usuario</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nombre">Nombre Completo *</Label>
              <Input
                id="edit-nombre"
                placeholder="Ej: Juan Pérez"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-rut">RUT *</Label>
              <Input
                id="edit-rut"
                placeholder="Ej: 12345678-9"
                value={formData.rut}
                onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="Ej: usuario@empresa.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Nueva Contraseña</Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="Dejar vacío para mantener la actual"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-rol">Rol</Label>
              <select
                id="edit-rol"
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="admin">Administrador</option>
                <option value="empresa">Empresa</option>
                <option value="subusuario">Usuario</option>
                <option value="auditoria">Auditoria</option>
                <option value="contralor">Contralor</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-empresa_id">Empresa</Label>
              <select
                id="edit-empresa_id"
                value={formData.empresa_id}
                onChange={(e) => setFormData({ ...formData, empresa_id: e.target.value })}
                className="w-full p-2 border rounded-md bg-muted"
                disabled
              >
                <option value={userCompany?.id}>
                  {userCompany?.id} - {userCompany?.nombre}
                </option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-centro_costo_id">Centro de Costo</Label>
              <select
                id="edit-centro_costo_id"
                value={formData.centro_costo_id}
                onChange={(e) => setFormData({ ...formData, centro_costo_id: e.target.value })}
                disabled={!formData.empresa_id || isLoadingCostCenters}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Selecciona un centro de costo</option>
                {isLoadingCostCenters ? (
                  <option value="" disabled>Cargando centros de costo...</option>
                ) : (
                  costCenters.map((costCenter) => (
                    <option key={costCenter.id} value={costCenter.id}>
                      {costCenter.nombre}
                    </option>
                  ))
                )}
              </select>
              {!formData.empresa_id && (
                <p className="text-xs text-muted-foreground">Selecciona una empresa primero</p>
              )}
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