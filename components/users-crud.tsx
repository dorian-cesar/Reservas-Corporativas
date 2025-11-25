"use client";

import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, Mail, User, CheckCircle2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ApiUser = {
  id?: string;
  _id?: string;
  nombre?: string;
  rut?: string;
  email?: string;
  rol?: string;
  activo?: boolean | number;
  empresa_id?: string | number;
  centro_costo_id?: string | number;
};

type UiUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  rut?: string;
  active: boolean;
  empresa_id?: string;
  centro_costo_id?: string;
};

type Company = {
  id: string;
  name: string;
};

export function UsersCrud() {
  // Obtener token y user desde el estado de auth
  const authState = useAuth.getState();
  const token = authState?.token;
  const currentUserRole = (authState?.user?.role ?? "") as string;

  const [users, setUsers] = useState<UiUser[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // form fields (ahora con password explícito)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rut, setRut] = useState("");
  const [role, setRole] = useState("user");
  const [empresaId, setEmpresaId] = useState<string | "">("");
  const [centroCostoId, setCentroCostoId] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { toast } = useToast();

  // mapeo de respuesta API a UI
  const mapApiToUi = (u: ApiUser): UiUser => {
    const id = (u._id ?? u.id ?? "") as string;
    return {
      id,
      name: u.nombre ?? "",
      email: u.email ?? "",
      role: (u.rol ?? "user") as string,
      rut: u.rut ?? "",
      active: u.activo === undefined ? true : !!(u.activo === 1 || u.activo === true),
      empresa_id: u.empresa_id ? String(u.empresa_id) : undefined,
      centro_costo_id: u.centro_costo_id ? String(u.centro_costo_id) : undefined,
    };
  };

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Error listando usuarios" }));
        toast({
          title: "Error",
          description: err?.message || "No se pudieron cargar los usuarios",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const data = await res.json();
      const items: ApiUser[] = Array.isArray(data) ? data : data?.data ?? [];
      const mapped = items.map(mapApiToUi);
      setUsers(mapped);
    } catch (err) {
      console.error("Error fetching users:", err);
      toast({
        title: "Error",
        description: "Error cargando usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/companies", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const mapped = (Array.isArray(data) ? data : data?.data ?? []).map((c: any) => ({
        id: String(c.id ?? c._id ?? c.id_empresa ?? ""),
        name: c.nombre ?? c.name ?? "Empresa",
      }));
      setCompanies(mapped);
    } catch (err) {
      console.error("Error fetching companies:", err);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setRut("");
    setRole("user");
    setEmpresaId("");
    setCentroCostoId("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleAdd = async () => {
    // Validaciones: nombre, email y password obligatorios
    if (!name || !email || !password) {
      toast({
        title: "Faltan datos",
        description: "Nombre, correo y contraseña son obligatorios",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Contraseñas no coinciden",
        description: "La contraseña y la confirmación deben coincidir",
        variant: "destructive",
      });
      return;
    }

    // Si el usuario actual no es superuser, no permitimos crear superuser desde UI
    if (role === "superuser" && currentUserRole !== "superuser") {
      toast({
        title: "No autorizado",
        description: "Solo un superuser puede asignar el rol superuser",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        nombre: name,
        rut: rut || null,
        email,
        password, // <-- enviado tal cual; el backend hará bcrypt.hash
        rol: role,
        empresa_id: empresaId || null,
        centro_costo_id: centroCostoId || null,
      };

      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Error creando usuario" }));
        throw new Error(err?.message || "Error creando usuario");
      }

      const created = await res.json();

      toast({
        title: "Usuario creado",
        description: `Usuario ${created.nombre ?? created.name} creado correctamente.`,
      });

      setIsAddDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      console.error("Error creating user:", err);
      toast({
        title: "Error",
        description: err?.message || "No se pudo crear el usuario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Error eliminando usuario" }));
        throw new Error(err?.message || "Error eliminando usuario");
      }

      toast({
        title: "Usuario eliminado",
        description: "El usuario fue eliminado correctamente",
      });

      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      console.error("Error deleting user:", err);
      toast({
        title: "Error",
        description: err?.message || "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Opciones de rol: ocultar superuser si el currentUserRole no es superuser
  const roleOptions = [
    { value: "user", label: "Usuario" },
    { value: "controller", label: "Controlador" },
    { value: "admin", label: "Admin" },
    ...(currentUserRole === "superuser" ? [{ value: "superuser", label: "Superuser" }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Usuarios del Sistema</h2>
          <p className="text-muted-foreground">Panel Superadmin — gestiona todos los usuarios</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-secondary hover:bg-secondary/90">
              <UserPlus className="h-4 w-4 mr-2" />
              Agregar Usuario
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
              <DialogDescription>Completa todos los campos. La contraseña será enviada tal cual al backend (se hará hash en servidor).</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico *</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rut">RUT *</Label>
                  <Input id="rut" value={rut} onChange={(e) => setRut(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa (empresa_id)</Label>
                  <select
                    id="empresa"
                    value={empresaId}
                    onChange={(e) => setEmpresaId(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">-- Sin empresa --</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    {roleOptions.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="centro">Centro de Costo (centro_costo_id)</Label>
                  <Input
                    id="centro"
                    value={centroCostoId}
                    onChange={(e) => setCentroCostoId(e.target.value)}
                    placeholder="ID centro de costo (opcional)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingrese contraseña"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme contraseña"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleAdd} className="bg-secondary hover:bg-secondary/90" disabled={loading}>
                {loading ? "Creando..." : "Crear Usuario"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {users.length === 0 ? (
          <Card className="border-2 p-6">
            <CardHeader>
              <CardTitle>No hay usuarios</CardTitle>
              <CardDescription>Agrega el primero usando el botón Agregar Usuario</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          users.map((u, i) => (
            <Card
              key={u.id}
              className="border-2 hover:border-primary transition-all duration-300 hover:shadow-xl animate-in fade-in zoom-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-3">
                        {u.name}
                        <span className="text-sm text-muted-foreground ml-2">{u.rut ? u.rut : ""}</span>
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {u.email}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-medium capitalize">{u.role}</span>
                    {u.active && (
                      <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Activo
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 transition-all hover:scale-[1.02] bg-transparent"
                    onClick={() => {
                      navigator.clipboard?.writeText(u.email);
                      toast({
                        title: "Copiado",
                        description: "Correo copiado al portapapeles",
                      });
                    }}
                  >
                    Copiar Email
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-destructive hover:bg-destructive/10 transition-all hover:scale-[1.02] bg-transparent"
                    onClick={() => handleDelete(u.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
