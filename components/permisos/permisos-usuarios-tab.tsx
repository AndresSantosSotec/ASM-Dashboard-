"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, UserCog, Lock, CheckCircle, XCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

// Datos de ejemplo adaptados al sistema actual Blue Atlas
const usuariosData = [
  {
    id: 1,
    nombre: "Juan Pérez",
    email: "juan.perez@example.com",
    tipoUsuario: "admin",
    activo: true,
    fechaCreacion: "2023-05-15",
    ultimaConexion: "2023-06-20 14:30",
  },
  {
    id: 2,
    nombre: "María López",
    email: "maria.lopez@example.com",
    tipoUsuario: "asesor",
    activo: true,
    fechaCreacion: "2023-04-10",
    ultimaConexion: "2023-06-19 09:15",
  },
  {
    id: 3,
    nombre: "Carlos Rodríguez",
    email: "carlos.rodriguez@example.com",
    tipoUsuario: "docente",
    activo: false,
    fechaCreacion: "2023-03-22",
    ultimaConexion: "2023-05-30 16:45",
  },
  {
    id: 4,
    nombre: "Ana Martínez",
    email: "ana.martinez@example.com",
    tipoUsuario: "estudiante",
    activo: true,
    fechaCreacion: "2023-06-01",
    ultimaConexion: "2023-06-18 11:20",
  },
  {
    id: 5,
    nombre: "Roberto Sánchez",
    email: "roberto.sanchez@example.com",
    tipoUsuario: "administrativo",
    activo: true,
    fechaCreacion: "2023-02-14",
    ultimaConexion: "2023-06-15 13:10",
  },
]

export default function PermisosUsuariosTab() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTipo, setSelectedTipo] = useState("todos")
  const [selectedEstado, setSelectedEstado] = useState("todos")
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const tiposUsuario = ["todos", "admin", "asesor", "docente", "estudiante", "administrativo"]
  const estados = ["todos", "activo", "inactivo"]

  const filteredUsuarios = usuariosData.filter((usuario) => {
    const matchesSearch =
      usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTipo = selectedTipo === "todos" || usuario.tipoUsuario === selectedTipo
    const matchesEstado =
      selectedEstado === "todos" ||
      (selectedEstado === "activo" && usuario.activo) ||
      (selectedEstado === "inactivo" && !usuario.activo)

    return matchesSearch && matchesTipo && matchesEstado
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuarios..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Select value={selectedTipo} onValueChange={setSelectedTipo}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {tiposUsuario.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo === "todos" ? "Todos los tipos" : tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedEstado} onValueChange={setSelectedEstado}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                {estados.map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {estado === "todos" ? "Todos los estados" : estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Mostrar
          <Select defaultValue="5">
            <SelectTrigger className="h-8 w-[70px] mx-2 border-none">
              <SelectValue placeholder="5" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          registros
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] text-center">Acciones</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha Creación</TableHead>
              <TableHead>Última Conexión</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No se encontraron usuarios
                </TableCell>
              </TableRow>
            ) : (
              filteredUsuarios.map((usuario) => (
                <TableRow key={usuario.id} className={selectedUser?.id === usuario.id ? "bg-blue-50" : ""}>
                  <TableCell className="p-2 text-center">
                    <div className="flex justify-center space-x-1">
                      <Button
                        variant="default"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setSelectedUser(usuario)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-7 w-7">
                        <Lock className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{usuario.nombre}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {usuario.tipoUsuario}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {usuario.activo ? (
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
                  <TableCell>{usuario.fechaCreacion}</TableCell>
                  <TableCell>{usuario.ultimaConexion}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredUsuarios.length} de {usuariosData.length} registros
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle>Información de usuario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Nombre de usuario</label>
                <Input value={selectedUser.nombre} readOnly className="mt-1 bg-muted" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                <Input value={selectedUser.email} readOnly className="mt-1 bg-muted" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Tipo de usuario</label>
                <Input value={selectedUser.tipoUsuario} readOnly className="mt-1 bg-muted capitalize" />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                Cancelar
              </Button>
              <Button>
                <UserCog className="mr-2 h-4 w-4" />
                Asignar Permisos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

