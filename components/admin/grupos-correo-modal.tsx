"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlusCircle, Search, Trash2, Edit, Save, X, Check, Mail } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

type Contacto = {
  id: string
  nombre: string
  email: string
  tipo: string
  seleccionado?: boolean
}

type Grupo = {
  id: string
  nombre: string
  descripcion: string
  contactos: number
}

export function GruposCorreoModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [activeTab, setActiveTab] = useState("grupos")
  const [grupos, setGrupos] = useState<Grupo[]>([
    {
      id: "1",
      nombre: "Estudiantes Activos",
      descripcion: "Todos los estudiantes actualmente matriculados",
      contactos: 245,
    },
    { id: "2", nombre: "Docentes", descripcion: "Todos los docentes activos", contactos: 32 },
    { id: "3", nombre: "Prospectos Recientes", descripcion: "Leads captados en los últimos 30 días", contactos: 78 },
    { id: "4", nombre: "Administrativos", descripcion: "Personal administrativo", contactos: 18 },
    { id: "5", nombre: "Graduados", descripcion: "Estudiantes graduados", contactos: 156 },
  ])

  const [contactos, setContactos] = useState<Contacto[]>([
    { id: "1", nombre: "Juan Pérez", email: "juan.perez@ejemplo.com", tipo: "Estudiante" },
    { id: "2", nombre: "María López", email: "maria.lopez@ejemplo.com", tipo: "Estudiante" },
    { id: "3", nombre: "Carlos Rodríguez", email: "carlos.rodriguez@ejemplo.com", tipo: "Docente" },
    { id: "4", nombre: "Ana Martínez", email: "ana.martinez@ejemplo.com", tipo: "Administrativo" },
    { id: "5", nombre: "Roberto Gómez", email: "roberto.gomez@ejemplo.com", tipo: "Prospecto" },
    { id: "6", nombre: "Laura Sánchez", email: "laura.sanchez@ejemplo.com", tipo: "Estudiante" },
    { id: "7", nombre: "Pedro Díaz", email: "pedro.diaz@ejemplo.com", tipo: "Graduado" },
    { id: "8", nombre: "Sofía Hernández", email: "sofia.hernandez@ejemplo.com", tipo: "Estudiante" },
    { id: "9", nombre: "Miguel Torres", email: "miguel.torres@ejemplo.com", tipo: "Docente" },
    { id: "10", nombre: "Carmen Flores", email: "carmen.flores@ejemplo.com", tipo: "Prospecto" },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null)
  const [newGrupo, setNewGrupo] = useState<Partial<Grupo>>({ nombre: "", descripcion: "" })
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null)
  const [isCreatingGrupo, setIsCreatingGrupo] = useState(false)

  // Filtrar contactos según término de búsqueda
  const filteredContactos = contactos.filter(
    (contacto) =>
      contacto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contacto.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contacto.tipo.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Crear nuevo grupo
  const handleCreateGrupo = () => {
    if (!newGrupo.nombre) {
      toast({
        title: "Error",
        description: "El nombre del grupo es obligatorio",
        variant: "destructive",
      })
      return
    }

    const nuevoGrupo: Grupo = {
      id: Date.now().toString(),
      nombre: newGrupo.nombre,
      descripcion: newGrupo.descripcion || "",
      contactos: 0,
    }

    setGrupos([...grupos, nuevoGrupo])
    setNewGrupo({ nombre: "", descripcion: "" })
    setIsCreatingGrupo(false)

    toast({
      title: "Grupo creado",
      description: `El grupo "${nuevoGrupo.nombre}" ha sido creado correctamente.`,
    })
  }

  // Actualizar grupo existente
  const handleUpdateGrupo = () => {
    if (!editingGrupo) return

    setGrupos(grupos.map((g) => (g.id === editingGrupo.id ? editingGrupo : g)))
    setEditingGrupo(null)

    toast({
      title: "Grupo actualizado",
      description: `El grupo "${editingGrupo.nombre}" ha sido actualizado correctamente.`,
    })
  }

  // Eliminar grupo
  const handleDeleteGrupo = (id: string) => {
    setGrupos(grupos.filter((g) => g.id !== id))

    toast({
      title: "Grupo eliminado",
      description: "El grupo ha sido eliminado correctamente.",
    })
  }

  // Seleccionar grupo para ver/editar sus contactos
  const handleSelectGrupo = (grupo: Grupo) => {
    setSelectedGrupo(grupo)
    setActiveTab("contactos")

    // Simular que marcamos algunos contactos como seleccionados para este grupo
    setContactos(
      contactos.map((c) => ({
        ...c,
        seleccionado: Math.random() > 0.5, // Simulación: algunos contactos pertenecen al grupo
      })),
    )
  }

  // Guardar cambios en los contactos del grupo
  const handleSaveContactos = () => {
    if (!selectedGrupo) return

    const seleccionados = contactos.filter((c) => c.seleccionado).length

    setGrupos(grupos.map((g) => (g.id === selectedGrupo.id ? { ...g, contactos: seleccionados } : g)))

    toast({
      title: "Contactos actualizados",
      description: `Se han actualizado los contactos del grupo "${selectedGrupo.nombre}".`,
    })

    setActiveTab("grupos")
    setSelectedGrupo(null)
  }

  // Enviar correo al grupo
  const handleSendEmail = (grupo: Grupo) => {
    toast({
      title: "Preparando envío",
      description: `Preparando envío para ${grupo.contactos} contactos del grupo "${grupo.nombre}".`,
    })

    // Aquí se redigiría a la página de composición de correo con el grupo seleccionado
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Gestión de Grupos para Correos Masivos</DialogTitle>
          <DialogDescription>Crea y administra grupos de contactos para envíos de correos masivos</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="grupos">Grupos</TabsTrigger>
            <TabsTrigger value="contactos" disabled={!selectedGrupo}>
              {selectedGrupo ? `Contactos: ${selectedGrupo.nombre}` : "Contactos"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grupos" className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Buscar grupos..."
                  className="w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={() => setIsCreatingGrupo(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Nuevo Grupo
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center">Contactos</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isCreatingGrupo && (
                    <TableRow>
                      <TableCell>
                        <Input
                          placeholder="Nombre del grupo"
                          value={newGrupo.nombre}
                          onChange={(e) => setNewGrupo({ ...newGrupo, nombre: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Descripción (opcional)"
                          value={newGrupo.descripcion}
                          onChange={(e) => setNewGrupo({ ...newGrupo, descripcion: e.target.value })}
                        />
                      </TableCell>
                      <TableCell className="text-center">0</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={handleCreateGrupo}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setIsCreatingGrupo(false)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {grupos
                    .filter((g) => g.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((grupo) => (
                      <TableRow key={grupo.id}>
                        <TableCell>
                          {editingGrupo?.id === grupo.id ? (
                            <Input
                              value={editingGrupo.nombre}
                              onChange={(e) => setEditingGrupo({ ...editingGrupo, nombre: e.target.value })}
                            />
                          ) : (
                            <div className="font-medium">{grupo.nombre}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingGrupo?.id === grupo.id ? (
                            <Input
                              value={editingGrupo.descripcion}
                              onChange={(e) => setEditingGrupo({ ...editingGrupo, descripcion: e.target.value })}
                            />
                          ) : (
                            grupo.descripcion
                          )}
                        </TableCell>
                        <TableCell className="text-center">{grupo.contactos}</TableCell>
                        <TableCell className="text-right">
                          {editingGrupo?.id === grupo.id ? (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" onClick={handleUpdateGrupo}>
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingGrupo(null)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleSelectGrupo(grupo)}>
                                Editar Contactos
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingGrupo(grupo)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDeleteGrupo(grupo.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleSendEmail(grupo)}>
                                <Mail className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="contactos" className="flex-1 flex flex-col">
            {selectedGrupo && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Buscar contactos..."
                      className="w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button variant="outline" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setActiveTab("grupos")
                        setSelectedGrupo(null)
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveContactos}>Guardar Cambios</Button>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={filteredContactos.every((c) => c.seleccionado)}
                            onCheckedChange={(checked) => {
                              setContactos(
                                contactos.map((c) => ({
                                  ...c,
                                  seleccionado: checked === true,
                                })),
                              )
                            }}
                          />
                        </TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Tipo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContactos.map((contacto) => (
                        <TableRow key={contacto.id}>
                          <TableCell>
                            <Checkbox
                              checked={contacto.seleccionado}
                              onCheckedChange={(checked) => {
                                setContactos(
                                  contactos.map((c) =>
                                    c.id === contacto.id ? { ...c, seleccionado: checked === true } : c,
                                  ),
                                )
                              }}
                            />
                          </TableCell>
                          <TableCell>{contacto.nombre}</TableCell>
                          <TableCell>{contacto.email}</TableCell>
                          <TableCell>{contacto.tipo}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

