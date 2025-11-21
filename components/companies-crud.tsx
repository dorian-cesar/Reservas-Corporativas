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
  DialogTrigger,
} from "@/components/ui/dialog"
import { COMPANIES, type Company } from "@/lib/mock-data"
import { Building2, Plus, Pencil, Trash2, Mail, Users, Percent } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function CompaniesCRUD() {
  const [companies, setCompanies] = useState<Company[]>(COMPANIES)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    contactEmail: "",
    surchargePercentage: 0,
  })

  const resetForm = () => {
    setFormData({
      name: "",
      contactEmail: "",
      surchargePercentage: 0,
    })
  }

  const handleAdd = () => {
    if (!formData.name || !formData.contactEmail) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    const newCompany: Company = {
      id: `emp${companies.length + 1}`,
      name: formData.name,
      contactEmail: formData.contactEmail,
      activeUsers: 0,
      totalBookings: 0,
      surchargePercentage: formData.surchargePercentage,
    }

    setCompanies([...companies, newCompany])
    setIsAddDialogOpen(false)
    resetForm()
    toast({
      title: "Empresa agregada",
      description: `${formData.name} ha sido agregada exitosamente`,
    })
  }

  const handleEdit = () => {
    if (!selectedCompany) return

    if (!formData.name || !formData.contactEmail) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    const updatedCompanies = companies.map((company) =>
      company.id === selectedCompany.id
        ? {
            ...company,
            name: formData.name,
            contactEmail: formData.contactEmail,
            surchargePercentage: formData.surchargePercentage,
          }
        : company,
    )

    setCompanies(updatedCompanies)
    setIsEditDialogOpen(false)
    setSelectedCompany(null)
    resetForm()
    toast({
      title: "Empresa actualizada",
      description: `${formData.name} ha sido actualizada exitosamente`,
    })
  }

  const handleDelete = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId)
    if (!company) return

    if (confirm(`¿Está seguro que desea eliminar ${company.name}?`)) {
      setCompanies(companies.filter((c) => c.id !== companyId))
      toast({
        title: "Empresa eliminada",
        description: `${company.name} ha sido eliminada exitosamente`,
      })
    }
  }

  const openEditDialog = (company: Company) => {
    setSelectedCompany(company)
    setFormData({
      name: company.name,
      contactEmail: company.contactEmail,
      surchargePercentage: company.surchargePercentage,
    })
    setIsEditDialogOpen(true)
  }

  const openAddDialog = () => {
    resetForm()
    setIsAddDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Empresas en Convenio</h2>
          <p className="text-muted-foreground">Gestione las empresas y sus porcentajes de recargo</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} className="bg-accent hover:bg-accent/90">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Agregar Nueva Empresa</DialogTitle>
              <DialogDescription>Complete los datos de la empresa en convenio</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Empresa *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Empresa Ejemplo S.A."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email de Contacto *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="controller@empresa.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surcharge">Porcentaje de Recargo (%)</Label>
                <Input
                  id="surcharge"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={formData.surchargePercentage}
                  onChange={(e) => setFormData({ ...formData, surchargePercentage: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Recargo aplicado sobre el precio base de los pasajes</p>
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
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company, index) => (
          <Card
            key={company.id}
            className="border-2 hover:border-primary transition-all duration-300 hover:shadow-xl animate-in fade-in zoom-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{company.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Mail className="h-3 w-3" />
                      {company.contactEmail}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Users className="h-3 w-3" />
                    Usuarios
                  </div>
                  <p className="text-2xl font-bold">{company.activeUsers}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Percent className="h-3 w-3" />
                    Recargo
                  </div>
                  <p className="text-2xl font-bold">{company.surchargePercentage}%</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 transition-all hover:scale-[1.02] bg-transparent"
                  onClick={() => openEditDialog(company)}
                >
                  <Pencil className="h-3 w-3 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-destructive hover:bg-destructive/10 transition-all hover:scale-[1.02] bg-transparent"
                  onClick={() => handleDelete(company.id)}
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>Modifique los datos de la empresa en convenio</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre de la Empresa *</Label>
              <Input
                id="edit-name"
                placeholder="Ej: Empresa Ejemplo S.A."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email de Contacto *</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="controller@empresa.com"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-surcharge">Porcentaje de Recargo (%)</Label>
              <Input
                id="edit-surcharge"
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={formData.surchargePercentage}
                onChange={(e) => setFormData({ ...formData, surchargePercentage: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">Recargo aplicado sobre el precio base de los pasajes</p>
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
