"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit, Plus, Search, Trash, Shield } from "lucide-react"

export default function RolesPermisos() {
  const [searchTerm, setSearchTerm] = useState("")

  // Datos de ejemplo
  const roles = [
    {
      id: 1,
      nombre: "Administrador",
      descripcion: "Acceso completo al sistema",
      usuarios: 3,
      permisos: [
        "Gestión de usuarios",
        "Gestión de roles",
        "Configuración del sistema",
        "Reportes",
        "Auditoría",
        "Respaldos",
        "Gestión académica",
      ],
    },
    {
      id: 2,
      nombre: "Docente",
      descripcion: "Acceso a módulos académicos y de docencia",
      usuarios: 15,
      permisos: ["Portal docente", "Gestión de cursos", "Calificaciones", "Material didáctico", "Mensajería"],
    },
    {
      id: 3,
      nombre: "Estudiante",
      descripcion: "Acceso a módulos estudiantiles",
      usuarios: 120,
      permisos: ["Portal estudiante", "Consulta de calificaciones", "Documentos", "Pagos", "Calendario académico"],
    },
    {
      id: 4,
      nombre: "Administrativo",
      descripcion: "Acceso a módulos administrativos",
      usuarios: 8,
      permisos: ["Gestión de inscripciones", "Reportes básicos", "Documentación", "Seguimiento de pagos"],
    },
    {
      id: 5,
      nombre: "Finanzas",
      descripcion: "Acceso a módulos financieros",
      usuarios: 5,
      permisos: [
        "Gestión de pagos",
        "Reportes financieros",
        "Conciliación bancaria",
        "Estados de cuenta",
        "Seguimiento de cobros",
        "Configuración financiera",
      ],
    },
    {
      id: 6,
      nombre: "Seguridad",
      descripcion: "Acceso a módulos de seguridad",
      usuarios: 2,
      permisos: [
        "Auditoría",
        "Control de accesos",
        "Respaldos",
        "Políticas de seguridad",
        "Autenticación 2FA",
        "Sesiones activas",
      ],
    },
  ]

  // Filtrar roles según la búsqueda
  const filteredRoles = roles.filter(
    (rol) =>
      rol.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rol.descripcion.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Módulos del sistema para la matriz de permisos
  const modulos = [
    "Administración",
    "Académico",
    "Docentes",
    "Estudiantes",
    "Finanzas",
    "Seguridad",
    "Reportes",
    "Configuración",
  ]

  // Permisos por módulo
  const permisosPorModulo = {
    Administración: ["Ver", "Crear", "Editar", "Eliminar", "Exportar"],
    Académico: ["Ver", "Crear", "Editar", "Eliminar", "Exportar"],
    Docentes: ["Ver", "Crear", "Editar", "Eliminar", "Exportar"],
    Estudiantes: ["Ver", "Crear", "Editar", "Eliminar", "Exportar"],
    Finanzas: ["Ver", "Crear", "Editar", "Eliminar", "Exportar"],
    Seguridad: ["Ver", "Crear", "Editar", "Eliminar", "Exportar"],
    Reportes: ["Ver", "Crear", "Exportar"],
    Configuración: ["Ver", "Editar"],
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Roles y Permisos</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Rol
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Roles del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar roles..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Usuarios</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((rol) => (
                  <TableRow key={rol.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 mr-2 text-blue-600" />
                        {rol.nombre}
                      </div>
                    </TableCell>
                    <TableCell>{rol.descripcion}</TableCell>
                    <TableCell>{rol.usuarios}</TableCell>
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Matriz de Permisos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Ver</TableHead>
                    <TableHead>Crear</TableHead>
                    <TableHead>Editar</TableHead>
                    <TableHead>Eliminar</TableHead>
                    <TableHead>Exportar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modulos.map((modulo) => (
                    <TableRow key={modulo}>
                      <TableCell className="font-medium">{modulo}</TableCell>
                      {["Ver", "Crear", "Editar", "Eliminar", "Exportar"].map((permiso) => (
                        <TableCell key={`${modulo}-${permiso}`}>
                          {permisosPorModulo[modulo].includes(permiso) && (
                            <Checkbox defaultChecked={modulo === "Administración" || permiso === "Ver"} />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" className="mr-2">
                Cancelar
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">Guardar Cambios</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Permisos por Rol</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rol</TableHead>
                <TableHead>Permisos Asignados</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((rol) => (
                <TableRow key={rol.id}>
                  <TableCell className="font-medium">{rol.nombre}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {rol.permisos.map((permiso, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                          {permiso}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      Editar Permisos
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

