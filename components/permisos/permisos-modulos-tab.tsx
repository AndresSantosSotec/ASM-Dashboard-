"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Save, X, Plus, Edit, Trash, CheckCircle, XCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

// Módulos reales del sistema Blue Atlas
const modulosData = [
  {
    id: 1,
    nombre: "Prospectos y Asesores",
    descripcion: "Gestión de prospectos, leads y asesores",
    vistas: 18,
    activo: true,
  },
  {
    id: 2,
    nombre: "Inscripción",
    descripcion: "Proceso de inscripción y documentación",
    vistas: 8,
    activo: true,
  },
  {
    id: 3,
    nombre: "Académico",
    descripcion: "Gestión académica y programas",
    vistas: 7,
    activo: true,
  },
  {
    id: 4,
    nombre: "Docentes",
    descripcion: "Portal y gestión de docentes",
    vistas: 10,
    activo: true,
  },
  {
    id: 5,
    nombre: "Estudiantes",
    descripcion: "Portal y gestión de estudiantes",
    vistas: 8,
    activo: true,
  },
  {
    id: 6,
    nombre: "Finanzas y Pagos",
    descripcion: "Gestión financiera y pagos",
    vistas: 7,
    activo: true,
  },
  {
    id: 7,
    nombre: "Administración",
    descripcion: "Administración general del sistema",
    vistas: 6,
    activo: true,
  },
  {
    id: 8,
    nombre: "Seguridad",
    descripcion: "Gestión de seguridad y permisos",
    vistas: 5,
    activo: true,
  },
]

const moduloSchema = z.object({
  nombre: z.string().min(2, "El nombre es requerido"),
  descripcion: z.string().min(2, "La descripción es requerida"),
  activo: z.boolean().default(true),
})

export default function PermisosModulosTab() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentModulo, setCurrentModulo] = useState<{
    id: number
    nombre: string
    descripcion: string
    vistas: number
    activo: boolean
  } | null>(null)
  const [modulos, setModulos] = useState(modulosData)

  const form = useForm<z.infer<typeof moduloSchema>>({
    resolver: zodResolver(moduloSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      activo: true,
    },
  })

  const filteredModulos = modulos.filter(
    (modulo) =>
      modulo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      modulo.descripcion.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleOpenDialog = (
    modulo: { id: number; nombre: string; descripcion: string; vistas: number; activo: boolean } | null = null,
    editing = false,
  ) => {
    setCurrentModulo(modulo)
    setIsEditing(editing)

    if (editing && modulo) {
      form.reset({
        nombre: modulo.nombre,
        descripcion: modulo.descripcion,
        activo: modulo.activo,
      })
    } else {
      form.reset({
        nombre: "",
        descripcion: "",
        activo: true,
      })
    }

    setIsDialogOpen(true)
  }

  const onSubmit = (data: z.infer<typeof moduloSchema>) => {
    if (isEditing) {
      if (currentModulo) {
        setModulos(modulos.map((m) => (m.id === currentModulo.id ? { ...m, ...data } : m)))
      }
    } else {
      setModulos([...modulos, { ...data, id: modulos.length + 1, vistas: 0 }])
    }
    setIsDialogOpen(false)
  }

  const handleToggleStatus = (id: number) => {
    setModulos(modulos.map((modulo) => (modulo.id === id ? { ...modulo, activo: !modulo.activo } : modulo)))
  }

  const handleDeleteModulo = (id: number) => {
    setModulos(modulos.filter((modulo) => modulo.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar módulos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => handleOpenDialog(null, false)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Módulo
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px] text-center">Acciones</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-center">Vistas</TableHead>
              <TableHead className="text-center">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredModulos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No se encontraron módulos
                </TableCell>
              </TableRow>
            ) : (
              filteredModulos.map((modulo) => (
                <TableRow key={modulo.id}>
                  <TableCell className="p-2 text-center">
                    <div className="flex justify-center space-x-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleOpenDialog(modulo, true)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="default"
                        size="icon"
                        className={`h-7 w-7 ${modulo.activo ? "" : "bg-green-600 hover:bg-green-700"}`}
                        onClick={() => handleToggleStatus(modulo.id)}
                      >
                        {modulo.activo ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDeleteModulo(modulo.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{modulo.id}</TableCell>
                  <TableCell className="font-medium">{modulo.nombre}</TableCell>
                  <TableCell>{modulo.descripcion}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-blue-50">
                      {modulo.vistas}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {modulo.activo ? (
                      <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-100">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
                        <XCircle className="mr-1 h-3 w-3" />
                        Inactivo
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Módulo" : "Nuevo Módulo"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modifica los datos del módulo existente."
                : "Completa el formulario para crear un nuevo módulo."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del módulo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Input placeholder="Descripción del módulo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="activo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Módulo Activo</FormLabel>
                      <FormDescription>El módulo estará disponible en el sistema</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? "Guardar Cambios" : "Crear Módulo"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

