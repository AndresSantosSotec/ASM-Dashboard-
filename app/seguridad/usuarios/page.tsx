"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow,} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {Card,CardContent,CardHeader,CardTitle,CardDescription,} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, Search, UserPlus, Users, Shield, Save, X, XCircle, CheckCircle } from "lucide-react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { API_BASE_URL } from "@/utils/apiConfig"

// Esquema para crear/editar usuario basado en el controlador de Laravel
const usuarioSchema = z.object({
  username: z.string().min(1, "El username es requerido"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  rol: z.string().min(1, "El rol es requerido"),
  is_active: z.boolean().default(true),
  email_verified: z.boolean().default(false),
  mfa_enabled: z.boolean().default(false),
})

type Usuario = z.infer<typeof usuarioSchema>

// Datos de ejemplo (mientras se obtienen los datos reales)
const initialUsuarios = [
  {
    id: 1,
    username: "juanperez",
    email: "juan.perez@ejemplo.com",
    rol: "Administrador",
    is_active: false,
    last_login: "2023-05-15 10:30",
    first_name: "Juan",
    last_name: "Pérez",
    created_at: "2023-05-15T10:30:00Z",
  },
]

export default function GestionUsuarios() {
  // Estados para usuarios, roles y filtros
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [fullNameFilter, setFullNameFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [activeTab, setActiveTab] = useState("todos")
  const [roleFilter, setRoleFilter] = useState("todos")
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  // Estados para edición
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [roles, setRoles] = useState<any[]>([])

  // Estado para selección masiva (IDs de usuarios seleccionados)
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState<number>(10)

  // Formulario para crear usuario
  const userForm = useForm<Usuario>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      rol: "",
      is_active: true,
      email_verified: false,
      mfa_enabled: false,
    },
  })

  // Formulario para editar usuario
  const editForm = useForm<Usuario>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      rol: "",
      is_active: true,
      email_verified: false,
      mfa_enabled: false,
    },
  })

  // Obtener roles desde la API
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/roles`)
        setRoles(response.data)
      } catch (error) {
        console.error("Error fetching roles:", error)
      }
    }
    fetchRoles()
  }, [])

  // Obtener usuarios desde la API
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/users`)
        setUsuarios(response.data)
      } catch (error) {
        console.error("Error fetching users:", error)
      }
    }
    fetchUsuarios()
  }, [])

  // Filtrar usuarios con múltiples criterios
  const filteredUsuarios = usuarios.filter((usuario) => {
    const matchesSearch =
      usuario.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.rol.toLowerCase().includes(searchTerm.toLowerCase())

    const fullName = `${usuario.first_name || ""} ${usuario.last_name || ""}`.trim().toLowerCase()
    const matchesFullName = fullName.includes(fullNameFilter.toLowerCase())

    const matchesTab =
      activeTab === "todos" ||
      (activeTab === "activos" && usuario.is_active) ||
      (activeTab === "inactivos" && !usuario.is_active)

    const matchesRole =
      roleFilter === "todos" ||
      usuario.rol.toLowerCase() === roleFilter.toLowerCase()

    let matchesDate = true
    if (startDate && usuario.created_at) {
      matchesDate = matchesDate && new Date(usuario.created_at) >= new Date(startDate)
    }
    if (endDate && usuario.created_at) {
      matchesDate = matchesDate && new Date(usuario.created_at) <= new Date(endDate)
    }

    return matchesSearch && matchesFullName && matchesTab && matchesRole && matchesDate
  })

  // Cálculos de paginación
  const totalPages = rowsPerPage === 0 ? 1 : Math.ceil(filteredUsuarios.length / rowsPerPage)
  const displayedUsuarios =
    rowsPerPage === 0
      ? filteredUsuarios
      : filteredUsuarios.slice(
          (currentPage - 1) * rowsPerPage,
          currentPage * rowsPerPage
        )

  // Función para crear usuario
  const handleUserSubmit = async (data: Usuario) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/users`, data)
      setUsuarios((prev) => [...prev, response.data])
      setIsUserDialogOpen(false)
      userForm.reset()
      Swal.fire({
        icon: "success",
        title: "Usuario creado",
        text: "El usuario se ha creado correctamente.",
      })
    } catch (error: any) {
      console.error("Error creating user:", error)
      let errorMessage = "Ocurrió un error al crear el usuario."
      if (error.response && error.response.data) {
        if (error.response.data.errors) {
          errorMessage = Object.entries(error.response.data.errors)
            .map(([field, messages]: [string, any]) => `${field}: ${messages.join(", ")}`)
            .join("\n")
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message
        }
      }
      Swal.fire({
        icon: "error",
        title: "Error al crear usuario",
        text: errorMessage,
      })
    }
  }

  // Función para abrir el modal de edición y precargar datos
  const handleEditUser = (usuario: any) => {
    setSelectedUser(usuario)
    editForm.reset({
      username: usuario.username,
      email: usuario.email,
      password: "", // Dejar vacío para no cambiar la contraseña
      first_name: usuario.first_name || "",
      last_name: usuario.last_name || "",
      rol: usuario.rol_id ? usuario.rol_id.toString() : "",
      is_active: usuario.is_active,
      email_verified: usuario.email_verified,
      mfa_enabled: usuario.mfa_enabled,
    })
    setIsEditDialogOpen(true)
  }

  // Función para enviar la edición
  const handleEditSubmit = async (data: Usuario) => {
    if (!selectedUser) return
    try {
      const response = await axios.put(`${API_BASE_URL}/api/users/${selectedUser.id}`, data)
      setUsuarios((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? response.data : u))
      )
      setIsEditDialogOpen(false)
      Swal.fire({
        icon: "success",
        title: "Usuario actualizado",
        text: "El usuario se ha actualizado correctamente.",
      }).then(() => window.location.reload())
    } catch (error: any) {
      console.error("Error editing user:", error)
      let errorMessage = "Ocurrió un error al actualizar el usuario."
      if (error.response && error.response.data) {
        if (error.response.data.errors) {
          errorMessage = Object.entries(error.response.data.errors)
            .map(([field, messages]: [string, any]) => `${field}: ${messages.join(", ")}`)
            .join("\n")
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message
        }
      }
      Swal.fire({
        icon: "error",
        title: "Error al actualizar usuario",
        text: errorMessage,
      })
    }
  }

  // Función para inactivar o reactivar un usuario individual
  const handleToggleActiveUser = async (usuario: any) => {
    if (usuario.is_active) {
      // Inactivar usuario
      const result = await Swal.fire({
        icon: "warning",
        title: "¿Inactivar usuario?",
        text: "¿Estás seguro de que deseas inactivar este usuario?",
        showCancelButton: true,
        confirmButtonText: "Sí, inactivar",
        cancelButtonText: "Cancelar"
      })
      if (result.isConfirmed) {
        try {
          const updatedData = { is_active: false }
          const response = await axios.put(`${API_BASE_URL}/api/users/${usuario.id}`, updatedData)
          setUsuarios((prev) =>
            prev.map((u) => (u.id === usuario.id ? response.data : u))
          )
          Swal.fire({
            icon: "success",
            title: "Usuario inactivado",
            text: "El usuario ha sido marcado como inactivo.",
          }).then(() => window.location.reload())
        } catch (error: any) {
          console.error("Error inactivating user:", error)
          let errorMessage = "Ocurrió un error al inactivar el usuario."
          if (error.response && error.response.data) {
            if (error.response.data.errors) {
              errorMessage = Object.entries(error.response.data.errors)
                .map(([field, messages]: [string, any]) => `${field}: ${messages.join(", ")}`)
                .join("\n")
            } else if (error.response.data.message) {
              errorMessage = error.response.data.message
            }
          }
          Swal.fire({
            icon: "error",
            title: "Error",
            text: errorMessage,
          })
        }
      }
    } else {
      // Reactivar usuario
      const result = await Swal.fire({
        icon: "question",
        title: "¿Reactivar usuario?",
        text: "¿Estás seguro de que deseas reactivar este usuario?",
        showCancelButton: true,
        confirmButtonText: "Sí, reactivar",
        cancelButtonText: "Cancelar"
      })
      if (result.isConfirmed) {
        try {
          const response = await axios.put(`${API_BASE_URL}/api/users/${usuario.id}`, { is_active: true })
          setUsuarios((prev) =>
            prev.map((u) => (u.id === usuario.id ? response.data : u))
          )
          Swal.fire({
            icon: "success",
            title: "Usuario reactivado",
            text: "El usuario ha sido reactivado correctamente.",
          }).then(() => window.location.reload())
        } catch (error: any) {
          console.error("Error reactivating user:", error)
          let errorMessage = "Ocurrió un error al reactivar el usuario."
          if (error.response && error.response.data) {
            if (error.response.data.errors) {
              errorMessage = Object.entries(error.response.data.errors)
                .map(([field, messages]: [string, any]) => `${field}: ${messages.join(", ")}`)
                .join("\n")
            } else if (error.response.data.message) {
              errorMessage = error.response.data.message
            }
          }
          Swal.fire({
            icon: "error",
            title: "Error",
            text: errorMessage,
          })
        }
      }
    }
  }

  // Función para manejar cambios en la selección de usuarios
  const handleCheckboxChange = (userId: number, isChecked: boolean) => {
    setSelectedUserIds((prev) =>
      isChecked ? [...prev, userId] : prev.filter((id) => id !== userId)
    );
  };

  // Función para ejecutar acción masiva sobre usuarios seleccionados
  const handleMassAction = async (action: "inactivate" | "reactivate") => {
    if (selectedUserIds.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No hay usuarios seleccionados",
        text: "Por favor, selecciona al menos un usuario para realizar esta acción.",
      })
      return
    }
    const confirmResult = await Swal.fire({
      icon: action === "inactivate" ? "warning" : "question",
      title: action === "inactivate" ? "¿Inactivar usuarios?" : "¿Reactivar usuarios?",
      text: `¿Estás seguro de que deseas ${action === "inactivate" ? "inactivar" : "reactivar"} los usuarios seleccionados?`,
      showCancelButton: true,
      confirmButtonText: action === "inactivate" ? "Sí, inactivar" : "Sí, reactivar",
      cancelButtonText: "Cancelar"
    })
    if (confirmResult.isConfirmed) {
      try {
        await Promise.all(
          selectedUserIds.map((userId: number) =>
            axios.put(`${API_BASE_URL}/api/users/${userId}`, {
              is_active: action === "inactivate" ? false : true
            })
          )
        )
        Swal.fire({
          icon: "success",
          title: action === "inactivate" ? "Usuarios inactivados" : "Usuarios reactivados",
          text: `Los usuarios seleccionados han sido ${action === "inactivate" ? "inactivados" : "reactivados"} correctamente.`,
        }).then(() => window.location.reload())
      } catch (error: any) {
        console.error("Error en acción masiva:", error)
        let errorMessage = "Ocurrió un error al realizar la acción masiva."
        if (error.response && error.response.data) {
          if (error.response.data.errors) {
            errorMessage = Object.entries(error.response.data.errors)
              .map(([field, messages]: [string, any]) => `${field}: ${messages.join(", ")}`)
              .join("\n")
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message
          }
        }
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
        })
      }
    }
  }

  return (
    <div className="container mx-auto py-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsUserDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Botones para acción masiva */}
      <div className="mb-4 flex gap-4">
        <Button variant="outline" onClick={() => handleMassAction("inactivate")}>
          Inactivar Seleccionados
        </Button>
        <Button variant="outline" onClick={() => handleMassAction("reactivate")}>
          Reactivar Seleccionados
        </Button>
      </div>

      {/* Resumen de Usuarios */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Resumen de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Total Usuarios</p>
                  <p className="text-2xl font-bold">{usuarios.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Usuarios Activos</p>
                  <p className="text-2xl font-bold">{usuarios.filter((u) => u.is_active).length}</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Usuarios Inactivos</p>
                  <p className="text-2xl font-bold">{usuarios.filter((u) => !u.is_active).length}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Roles Asignados</p>
                  <p className="text-2xl font-bold">{new Set(usuarios.map((u) => u.rol)).size}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros y configuración */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <div className="flex items-center gap-4">
          <Input
            type="search"
            placeholder="Buscar usuarios..."
            className="pl-8 w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Buscar por nombre completo..."
            className="w-[300px]"
            value={fullNameFilter}
            onChange={(e) => setFullNameFilter(e.target.value)}
          />
          <Select value={roleFilter} onValueChange={(val: string) => setRoleFilter(val)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filtrar por rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.name}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span>Fecha inicio:</span>
          <Input
            type="date"
            className="w-[150px]"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span>Fecha fin:</span>
          <Input
            type="date"
            className="w-[150px]"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <span>Mostrar:</span>
          <select
            className="border rounded p-1"
            value={rowsPerPage === filteredUsuarios.length ? "todos" : rowsPerPage}
            onChange={(e) =>
              setRowsPerPage(
                e.target.value === "todos" ? filteredUsuarios.length : parseInt(e.target.value)
              )
            }
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="100">100</option>
            <option value="todos">Todos</option>
          </select>
        </div>
      </div>

      {/* Tabla de usuarios con paginación y selección múltiple */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {/* Checkbox de cabecera para seleccionar todos los usuarios de la página */}
                  <input
                    type="checkbox"
                    onChange={(e) =>
                      setSelectedUserIds(
                        e.target.checked
                          ? displayedUsuarios.map((usuario) => usuario.id)
                          : []
                      )
                    }
                    checked={
                      displayedUsuarios.length > 0 &&
                      displayedUsuarios.every((usuario) =>
                        selectedUserIds.includes(usuario.id)
                      )
                    }
                  />
                </TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último Acceso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedUsuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      onChange={(e) => handleCheckboxChange(usuario.id, e.target.checked)}
                      checked={selectedUserIds.includes(usuario.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{usuario.username}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>{usuario.rol}</TableCell>
                  <TableCell>
                    <Badge variant={usuario.is_active ? "default" : "destructive"}>
                      {usuario.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>{usuario.last_login || "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEditUser(usuario)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    {usuario.is_active ? (
                      <Button variant="ghost" size="icon" onClick={() => handleToggleActiveUser(usuario)}>
                        <XCircle className="h-4 w-4 text-red-600" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" onClick={() => handleToggleActiveUser(usuario)}>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Anterior
            </Button>
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Siguiente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal para crear usuario */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Usuario</DialogTitle>
            <DialogDescription>
              Completa el formulario para crear un nuevo usuario.
            </DialogDescription>
          </DialogHeader>
          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(handleUserSubmit)} className="space-y-4">
              <FormField
                control={userForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Correo electrónico" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Contraseña" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primer Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Primer Nombre" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input placeholder="Apellido" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="rol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Save className="mr-2 h-4 w-4" />
                  Crear Usuario
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal para editar usuario */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica los datos del usuario seleccionado.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Correo electrónico" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña (opcional)</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Nueva contraseña (opcional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primer Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Primer Nombre" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input placeholder="Apellido" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="rol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                {/* Si el usuario está inactivo se muestra botón para reactivar, de lo contrario el de actualizar */}
                {!selectedUser?.is_active ? (
                  <Button type="button" className="bg-green-600 hover:bg-green-700" onClick={() => handleReactivateUser(selectedUser)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Reactivar Usuario
                  </Button>
                ) : (
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    <Save className="mr-2 h-4 w-4" />
                    Actualizar Usuario
                  </Button>
                )}
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Función para inactivar o reactivar un usuario individual
const handleToggleActiveUser = async (usuario: any) => {
  if (usuario.is_active) {
    // Inactivar usuario
    const result = await Swal.fire({
      icon: "warning",
      title: "¿Inactivar usuario?",
      text: "¿Estás seguro de que deseas inactivar este usuario?",
      showCancelButton: true,
      confirmButtonText: "Sí, inactivar",
      cancelButtonText: "Cancelar"
    })
    if (result.isConfirmed) {
      try {
        const updatedData = { is_active: false }
        const response = await axios.put(`${API_BASE_URL}/api/users/${usuario.id}`, updatedData)
        window.location.reload()
      } catch (error: any) {
        console.error("Error inactivating user:", error)
        let errorMessage = "Ocurrió un error al inactivar el usuario."
        if (error.response && error.response.data) {
          if (error.response.data.errors) {
            errorMessage = Object.entries(error.response.data.errors)
              .map(([field, messages]: [string, any]) => `${field}: ${messages.join(", ")}`)
              .join("\n")
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message
          }
        }
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
        })
      }
    }
  } else {
    // Reactivar usuario
    const result = await Swal.fire({
      icon: "question",
      title: "¿Reactivar usuario?",
      text: "¿Estás seguro de que deseas reactivar este usuario?",
      showCancelButton: true,
      confirmButtonText: "Sí, reactivar",
      cancelButtonText: "Cancelar"
    })
    if (result.isConfirmed) {
      try {
        const response = await axios.put(`${API_BASE_URL}/api/users/${usuario.id}`, { is_active: true })
        window.location.reload()
      } catch (error: any) {
        console.error("Error reactivating user:", error)
        let errorMessage = "Ocurrió un error al reactivar el usuario."
        if (error.response && error.response.data) {
          if (error.response.data.errors) {
            errorMessage = Object.entries(error.response.data.errors)
              .map(([field, messages]: [string, any]) => `${field}: ${messages.join(", ")}`)
              .join("\n")
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message
          }
        }
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
        })
      }
    }
  }
}

// Función para reactivar un usuario (desde el modal de edición)
const handleReactivateUser = async (usuario: any) => {
  const result = await Swal.fire({
    icon: "question",
    title: "¿Reactivar usuario?",
    text: "¿Estás seguro de que deseas reactivar este usuario?",
    showCancelButton: true,
    confirmButtonText: "Sí, reactivar",
    cancelButtonText: "Cancelar"
  })
  if (result.isConfirmed) {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/users/${usuario.id}`, { is_active: true })
      window.location.reload()
    } catch (error: any) {
      console.error("Error reactivating user:", error)
      let errorMessage = "Ocurrió un error al reactivar el usuario."
      if (error.response && error.response.data) {
        if (error.response.data.errors) {
          errorMessage = Object.entries(error.response.data.errors)
            .map(([field, messages]: [string, any]) => `${field}: ${messages.join(", ")}`)
            .join("\n")
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message
        }
      }
      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
      })
    }
  }
}
