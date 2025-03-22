"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, Search, Trash, UserPlus, Users, Shield } from "lucide-react"

export default function GestionUsuarios() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("todos")

  // Datos de ejemplo
  const usuarios = [
    {
      id: 1,
      nombre: "Juan Pérez",
      email: "juan.perez@ejemplo.com",
      rol: "Administrador",
      estado: "Activo",
      ultimoAcceso: "2023-05-15 10:30",
    },
    {
      id: 2,
      nombre: "María López",
      email: "maria.lopez@ejemplo.com",
      rol: "Docente",
      estado: "Activo",
      ultimoAcceso: "2023-05-14 15:45",
    },
    {
      id: 3,
      nombre: "Carlos Rodríguez",
      email: "carlos.rodriguez@ejemplo.com",
      rol: "Estudiante",
      estado: "Inactivo",
      ultimoAcceso: "2023-05-10 09:15",
    },
    {
      id: 4,
      nombre: "Ana Martínez",
      email: "ana.martinez@ejemplo.com",
      rol: "Administrativo",
      estado: "Activo",
      ultimoAcceso: "2023-05-15 08:20",
    },
    {
      id: 5,
      nombre: "Roberto Sánchez",
      email: "roberto.sanchez@ejemplo.com",
      rol: "Docente",
      estado: "Activo",
      ultimoAcceso: "2023-05-13 14:10",
    },
    {
      id: 6,
      nombre: "Laura Gómez",
      email: "laura.gomez@ejemplo.com",
      rol: "Estudiante",
      estado: "Activo",
      ultimoAcceso: "2023-05-12 11:30",
    },
    {
      id: 7,
      nombre: "Pedro Díaz",
      email: "pedro.diaz@ejemplo.com",
      rol: "Administrativo",
      estado: "Inactivo",
      ultimoAcceso: "2023-05-08 16:45",
    },
    {
      id: 8,
      nombre: "Sofía Hernández",
      email: "sofia.hernandez@ejemplo.com",
      rol: "Docente",
      estado: "Activo",
      ultimoAcceso: "2023-05-14 10:20",
    },
  ]

  // Filtrar usuarios según la búsqueda y la pestaña activa
  const filteredUsuarios = usuarios.filter((usuario) => {
    const matchesSearch =
      usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.rol.toLowerCase().includes(searchTerm.toLowerCase())

    if (activeTab === "todos") return matchesSearch
    if (activeTab === "activos") return matchesSearch && usuario.estado === "Activo"
    if (activeTab === "inactivos") return matchesSearch && usuario.estado === "Inactivo"
    return matchesSearch
  })

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

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
                  <p className="text-2xl font-bold">{usuarios.filter((u) => u.estado === "Activo").length}</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Usuarios Inactivos</p>
                  <p className="text-2xl font-bold">{usuarios.filter((u) => u.estado === "Inactivo").length}</p>
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

      <div className="flex justify-between items-center mb-4">
        <Tabs defaultValue="todos" className="w-[400px]" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="activos">Activos</TabsTrigger>
            <TabsTrigger value="inactivos">Inactivos</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Buscar usuarios..."
            className="pl-8 w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último Acceso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium">{usuario.nombre}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>{usuario.rol}</TableCell>
                  <TableCell>
                    <Badge variant={usuario.estado === "Activo" ? "default" : "destructive"}>{usuario.estado}</Badge>
                  </TableCell>
                  <TableCell>{usuario.ultimoAcceso}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

