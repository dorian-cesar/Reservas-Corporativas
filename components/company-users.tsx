"use client"

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
} from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth"
import { UserPlus, Mail, User, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Mock users for the company
const COMPANY_USERS = [
  { id: "1", name: "Juan Pérez", email: "user@empresa1.com", role: "user", active: true },
  { id: "2", name: "María González", email: "controller@empresa1.com", role: "controller", active: true },
]

export function CompanyUsers() {
  const { user } = useAuth()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newUserName, setNewUserName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const companyUsers = COMPANY_USERS.filter(
    (u) => user?.companyId === "emp1", // Mock filter
  )

  const handleAddUser = async () => {
    if (!newUserName || !newUserEmail) return

    setLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setLoading(false)
    setSuccess(true)

    setTimeout(() => {
      setSuccess(false)
      setNewUserName("")
      setNewUserEmail("")
      setShowAddDialog(false)
    }, 2000)
  }

  return (
    <>
      <Card className="border-2 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Usuarios de la Empresa</CardTitle>
              <CardDescription>Gestiona los usuarios que tienen acceso al sistema</CardDescription>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground transition-all hover:scale-105"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Agregar Usuario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {companyUsers.map((companyUser, index) => (
              <div
                key={companyUser.id}
                className="p-4 border-2 rounded-lg hover:border-primary transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-left-4"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold">{companyUser.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {companyUser.email}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium capitalize">
                      {companyUser.role === "user" ? "Usuario" : "Controlador"}
                    </span>
                    {companyUser.active && (
                      <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Activo
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
            <DialogDescription>Crea un nuevo usuario para tu empresa</DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="py-8 text-center animate-in fade-in zoom-in duration-300">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-600 mb-2">¡Usuario Creado!</h3>
              <p className="text-muted-foreground">Se ha enviado un correo con las credenciales</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userName">Nombre Completo</Label>
                  <Input
                    id="userName"
                    placeholder="Juan Pérez"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userEmail">Correo Electrónico</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    placeholder="juan@empresa.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>

                <Alert className="bg-primary/10 border-primary/20">
                  <AlertDescription className="text-sm">
                    El usuario recibirá un correo con sus credenciales de acceso
                  </AlertDescription>
                </Alert>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={loading}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddUser}
                  disabled={!newUserName || !newUserEmail || loading}
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                >
                  {loading ? "Creando..." : "Crear Usuario"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
