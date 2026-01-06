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
  Upload,
  MoreHorizontal,
  Check,
  X,
  ChevronRight,
  ChevronsUpDown
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
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
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import ToolBar from "./tool-bar";

export function CompanyUsers() {
  const { user, token } = useAuth.getState();
  const [users, setUsers] = useState<User[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"cards" | "table">("table")
  const [companies, setCompanies] = useState<{ id: string; nombre: string }[]>([]);
  const [costCenters, setCostCenters] = useState<{ id: string; nombre: string; empresa_id: string }[]>([]);
  const [isLoadingCostCenters, setIsLoadingCostCenters] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Nuevos estados para el diálogo de asignación de empresas
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [userToAssign, setUserToAssign] = useState<User | null>(null);
  const [availableCompanies, setAvailableCompanies] = useState<{ id: string; nombre: string }[]>([]);
  const [assignedCompanies, setAssignedCompanies] = useState<string[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [companyPopoverOpen, setCompanyPopoverOpen] = useState(false);
  const [costCenterPopoverOpen, setCostCenterPopoverOpen] = useState(false);

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

  const [superUser, setSuperUser] = useState(false);
  const currentUser = user;

  useEffect(() => { setSuperUser(user?.role === "superuser") }, []);

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
    fetchCompanies();
  }, []);

  // Cargar centros de costo cuando cambia la empresa seleccionada
  useEffect(() => {
    if (formData.empresa_id) {
      fetchCostCentersByCompany(formData.empresa_id);
    } else {
      setCostCenters([]);
      setFormData(prev => ({ ...prev, centro_costo_id: "" }));
    }
  }, [formData.empresa_id]);

  useEffect(() => {
    // cuando cambia la compañía volvemos a la primera página y solicitamos los usuarios
    if (selectedCompany === "") {
      // opcional: limpiar lista si no hay compañía seleccionada
      setUsers([]);
      setPagination(prev => ({ ...prev, page: 1, total: 0, totalPages: 0 }));
      return;
    }

    // poner página 1 y pedir usuarios de la nueva compañía
    setPagination(prev => ({ ...prev, page: 1 }));
    // pasar company explícito para evitar depender del estado interno dentro de fetchUsers
    fetchUsers({ page: 1, limit: pagination.limit, company: Number(selectedCompany) });
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

  const fetchAllCompanies = async () => {
    try {
      setIsLoadingCompanies(true);
      const res = await fetch("/api/companies", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error fetching all companies");
      const data = await res.json();
      const mapped = data.map((c: any) => ({
        id: c.id.toString(),
        nombre: c.nombre,
      }));
      setAvailableCompanies(mapped);
      return mapped;
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "No se pudieron cargar las empresas", variant: "destructive" });
      return [];
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  const fetchUserEmpresas = async (userId: string) => {
    try {
      const res = await fetch(`/api/assign?user_id=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 404) {
          return [];
        }
        throw new Error("Error fetching user companies");
      }

      const data = await res.json();

      if (data && Array.isArray(data.empresas)) {
        return data.empresas.map((empresa: any) =>
          empresa.id?.toString() || empresa.id
        );
      }

      return [];
    } catch (err) {
      console.error("Error fetching user empresas:", err);
      return [];
    }
  };

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

  const fetchUsers = async (opts?: { page?: number; limit?: number; email?: string; company?: number; }) => {
    try {
      const page = opts?.page ?? pagination.page;
      const limit = opts?.limit ?? pagination.limit;
      const email = opts?.email ?? undefined;
      const company = opts?.company ?? selectedCompany;

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      // Si viene email (no vacío), lo agregamos como filtro exacto
      if (email && email.trim() !== "") {
        params.set("email", email.trim());
      }

      if (company && String(company).trim() !== "") {
        params.set("empresa_id", String(company))
      }

      const res = await fetch(`/api/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        console.error("Error fetching users:", res.status, errBody);
        throw new Error(errBody?.message || "Error fetching users");
      }

      const body = await res.json();

      // asumimos exclusivamente el formato { users, pagination }
      const usersArray = Array.isArray(body.users) ? body.users : [];
      const pag = body.pagination || {
        page,
        limit,
        total: usersArray.length,
        totalPages: Math.ceil((usersArray.length || 0) / limit),
        hasNextPage: false,
        hasPrevPage: page > 1,
      };

      const usersMapped = usersArray.map((user: any) => ({
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
        page: pag.page ?? page,
        limit: pag.limit ?? limit,
        total: pag.total ?? usersMapped.length,
        totalPages: pag.totalPages ?? Math.ceil((pag.total ?? usersMapped.length) / (pag.limit ?? limit)),
        hasNextPage: Boolean(pag.hasNextPage),
        hasPrevPage: Boolean(pag.hasPrevPage),
      });

    } catch (err: any) {
      console.error("Error fetching users:", err);
      toast({
        title: "Error",
        description: err.message || "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      rut: "",
      email: "",
      password: "",
      rol: "subusuario",
      estado: true,
      empresa_id: "",
      centro_costo_id: ""
    });
    setCostCenters([]);
  };

  const handleAdd = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

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

      if (selectedCompany) {
        fetchUsers();
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

      fetchUsers();

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

  // Función para abrir el diálogo de asignación de empresas
  const openAssignDialog = async (user: User) => {
    setUserToAssign(user);

    // Cargar todas las empresas disponibles
    const allCompanies = await fetchAllCompanies();

    // Cargar empresas ya asignadas al usuario
    const userAssignedCompanies = await fetchUserEmpresas(user.id.toString());

    setAssignedCompanies(userAssignedCompanies);
    setAvailableCompanies(allCompanies);
    setAssignDialogOpen(true);
  };

  // Función para asignar/desasignar una empresa
  const toggleCompanyAssignment = (companyId: string) => {
    if (assignedCompanies.includes(companyId)) {
      // Quitar empresa
      setAssignedCompanies(prev => prev.filter(id => id !== companyId));
    } else {
      // Agregar empresa
      setAssignedCompanies(prev => [...prev, companyId]);
    }
  };

  // Función para guardar los cambios de asignación
  const handleSaveAssignments = async () => {
    if (!userToAssign) return;

    try {
      const payload = {
        bulk: true,
        user_id: userToAssign.id.toString(),
        empresa_ids: assignedCompanies
      };

      const res = await fetch("/api/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al actualizar asignaciones");
      }

      setAssignDialogOpen(false);
      setUserToAssign(null);

      toast({
        title: "Asignaciones actualizadas",
        description: `Las empresas asignadas a ${userToAssign.nombre} han sido actualizadas`,
      });

      // Recargar usuarios si estamos viendo una empresa específica
      if (selectedCompany) {
        fetchUsers();
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.message || "No se pudieron guardar las asignaciones",
        variant: "destructive",
      });
    }
  };

  const sendCSV = () => {
    resetCSVModal();
    setCsvModalOpen(true);
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

      const response = await fetch("/api/csv/users", {
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

  const openEditDialog = async (user: User) => {
    setSelectedUser(user);
    setFormData({
      nombre: user.nombre,
      rut: user.rut,
      email: user.email,
      password: "", // No mostrar password actual por seguridad
      rol: user.rol,
      estado: Boolean(user.estado),
      empresa_id: user.empresa_id,
      centro_costo_id: user.centro_costo_id || "",
    });

    // Si el usuario tiene empresa, cargar sus centros de costo
    if (user.empresa_id) {
      await fetchCostCentersByCompany(user.empresa_id);
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
    fetchUsers({ page: newPage, limit: pagination.limit, email: emailSearch || undefined });
  };

  const handleLimitChange = (newLimit: number) => {
    if (newLimit === pagination.limit) return;
    setPagination(prev => ({ ...prev, page: 1, limit: newLimit }));
    fetchUsers({ page: 1, limit: newLimit, email: emailSearch || undefined });
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

  // Filtrar empresas disponibles (las que no están asignadas)
  const unassignedCompanies = availableCompanies.filter(
    company => !assignedCompanies.includes(company.id)
  );

  // Obtener empresas asignadas con su información completa
  const assignedCompaniesFull = availableCompanies.filter(
    company => assignedCompanies.includes(company.id)
  );

  function canEditUser(editorRol: string, targetRol: string) {
    if (editorRol === "admin") {
      return targetRol === "subusuario";
    }

    return true;
  }


  return (
    <div className="space-y-6">
      <ToolBar
        title="Gestión de Usuarios"
        description="Administre los usuarios del sistema"
        viewMode={viewMode}
        setViewMode={setViewMode}

        showCompanySelect
        companies={companies}
        selectedCompany={selectedCompany}
        onCompanyChange={(id) => setSelectedCompany(id)}
        companySelectMode="combobox"
        companySelectPlaceholder="Selecciona una empresa..."

        refreshAction={() => selectedCompany && fetchUsers()}
        primaryAction={{
          label: "Agregar Usuario",
          icon: <Plus className="h-4 w-4" />,
          onClick: openAddDialog,
        }}
        secondaryAction={
          user?.role === "superuser"
            ? {
              label: "Subir CSV",
              icon: <Upload className="h-4 w-4" />,
              onClick: sendCSV,
            }
            : undefined
        }
      />

      {isAddDialogOpen && (
        <div className="space-y-4 p-4 border rounded-lg bg-card mb-6 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Agregar Nuevo Usuario</h3> {/* Cambiado el título */}
            <p className="text-sm text-muted-foreground">
              Complete los datos del usuario
            </p>
          </div>

          <form onSubmit={handleAdd} className="space-y-6">

            {/* GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

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
                  {user?.role !== "admin" && <option value="admin">Administrador</option>}
                  {user?.role !== "admin" && <option value="empresa">Empresa</option>}
                  {user?.role !== "admin" && <option value="auditoria">Auditoría</option>}
                  {user?.role !== "admin" && <option value="contralor">Contralor</option>}
                  <option value="subusuario">Usuario</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="empresa_id">Empresa</Label>
                <Popover open={companyPopoverOpen} onOpenChange={setCompanyPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between bg-white"
                    >
                      {formData.empresa_id
                        ? `${companies.find(c => c.id === formData.empresa_id)?.id || ""} - ${companies.find(c => c.id === formData.empresa_id)?.nombre || ""}`
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
                <Label htmlFor="centro_costo_id">Centro de Costo</Label>
                <Popover
                  open={costCenterPopoverOpen}
                  onOpenChange={setCostCenterPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      disabled={!formData.empresa_id || isLoadingCostCenters}
                      className="w-full justify-between bg-white"
                    >
                      {formData.centro_costo_id
                        ? costCenters.find(cc => cc.id === formData.centro_costo_id)?.nombre
                        : isLoadingCostCenters
                          ? "Cargando centros de costo..."
                          : "Selecciona un centro de costo"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buscar centro de costo..." />
                      <CommandList>
                        <CommandEmpty>No se encontró el centro de costo.</CommandEmpty>
                        <CommandGroup>
                          {costCenters.map((cc) => (
                            <CommandItem
                              key={cc.id}
                              value={`${cc.id} ${cc.nombre}`}
                              onSelect={() => {
                                setFormData({ ...formData, centro_costo_id: cc.id });
                                setCostCenterPopoverOpen(false);
                              }}
                            >
                              {cc.nombre}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {!formData.empresa_id && (
                  <p className="text-xs text-muted-foreground">
                    Selecciona una empresa primero
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <select
                  id="estado"
                  value={formData.estado.toString()}
                  onChange={(e) =>
                    setFormData({ ...formData, estado: e.target.value === "true" })
                  }
                  className="w-full p-2 border rounded-md"
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>

            </div>

            {/* BOTONES */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>

              <Button type="submit" className="bg-accent hover:bg-accent/90">
                Agregar
              </Button>
            </div>

          </form>

        </div>
      )}

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Asignar Empresas</DialogTitle>
            <DialogDescription>Gestiona las empresas asignadas a {userToAssign?.nombre}</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {isLoadingCompanies ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCcw className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Cargando empresas...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Empresas Asignadas */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Empresas Asignadas ({assignedCompanies.length})</Label>
                  <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto">
                    {assignedCompanies.length === 0 ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">No hay empresas asignadas</div>
                    ) : (
                      assignedCompaniesFull.map((company) => (
                        <div
                          key={company.id}
                          className="flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                              <Check className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{company.nombre}</p>
                              <p className="text-xs text-muted-foreground">ID: {company.id}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCompanyAssignment(company.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Empresas Disponibles */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Empresas Disponibles ({unassignedCompanies.length})</Label>
                  <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto">
                    {unassignedCompanies.length === 0 ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        Todas las empresas están asignadas
                      </div>
                    ) : (
                      unassignedCompanies.map((company) => (
                        <div
                          key={company.id}
                          className="flex items-center justify-between p-3 hover:bg-accent/50 transition-colors cursor-pointer"
                          onClick={() => toggleCompanyAssignment(company.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{company.nombre}</p>
                              <p className="text-xs text-muted-foreground">ID: {company.id}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleCompanyAssignment(company.id)
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAssignments} className="bg-accent hover:bg-accent/90">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {selectedCompany ? (
        <>
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="grid md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="search">Buscar por email (búsqueda exacta)</Label>
                  <Input
                    id="search"
                    placeholder="Ej: usuario@empresa.com"
                    value={emailSearch}
                    onChange={(e) => setEmailSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setPagination(prev => ({ ...prev, page: 1 }));
                        fetchUsers({ page: 1, limit: pagination.limit, email: emailSearch });
                      }
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setPagination(prev => ({ ...prev, page: 1 }));
                      fetchUsers({ page: 1, limit: pagination.limit, email: emailSearch });
                    }}
                    className="bg-accent hover:bg-accent/90"
                  >
                    Buscar
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setEmailSearch("");
                      // traer primera página sin filtro email
                      setPagination(prev => ({ ...prev, page: 1 }));
                      fetchUsers({ page: 1, limit: pagination.limit });
                    }}
                  >
                    Limpiar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>


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
              {/* Limit selector */}
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

              {/* Page controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={!pagination.hasPrevPage}
                  className="h-8 w-8 p-0"
                >
                  {/* icon o texto */}
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

                {/* páginas numeradas (máx 5 visibles) */}
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

          {/* pequeño separador */}
          <div className="my-4 border-t" />

          {/* Vista de Tarjetas */}
          {viewMode === "cards" && (
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

                    {canEditUser(currentUser?.role || "", user.rol) && (
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


                        {(superUser && user.rol === "admin") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 transition-all hover:scale-[1.02] bg-transparent"
                            onClick={() => openAssignDialog(user)}
                          >
                            <Plus className="h-3 w-3 mr-2" />
                            Asignar empresas
                          </Button>
                        )}
                      </div>
                    )}
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
                          {canEditUser(currentUser?.role || "", user.rol) && (
                            <div className="flex justify-end">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuItem
                                    onClick={() => openEditDialog(user)}
                                    className="cursor-pointer"
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>

                                  {(superUser && user.rol === "admin") && (
                                    <DropdownMenuItem
                                      onClick={() => openAssignDialog(user)}
                                      className="cursor-pointer"
                                    >
                                      <Plus className="mr-2 h-4 w-4" />
                                      Asignar empresas
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </TableCell>


                      </TableRow>
                    ))}
                  </TableBody>
                </UITable>
                {users.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay usuarios registrados</p>
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
            <p>Seleccione una empresa para ver sus usuarios</p>
          </CardContent>
        </Card>
      )}


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
                {
                  user?.role !== "admin" && (
                    <option value="admin">Administrador</option>
                  )
                }
                {
                  user?.role !== "admin" && (
                    <option value="empresa">Empresa</option>
                  )
                }
                {
                  user?.role !== "admin" && (
                    <option value="auditoria">Auditoria</option>
                  )
                }
                {
                  user?.role !== "admin" && (
                    <option value="contralor">Contralor</option>
                  )
                }
                <option value="subusuario">usuario</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-empresa_id">Empresa</Label>
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
            <DialogTitle>Importar usuarios desde CSV</DialogTitle>
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
              {`nombre,rut,email,rol,empresa_id,centro_costo_id,estado`}
            </pre>
          </div>
          {result && (
            <div className="mt-4 rounded-md bg-muted p-3 text-sm">
              <p>
                <strong>Usuarios cargados:</strong> {result.result?.success}
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