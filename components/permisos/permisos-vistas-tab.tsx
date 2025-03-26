"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Save, X, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

// Datos de permisos basados en los módulos reales del sistema Blue Atlas
const permisosData = [
  {
    modulo: "Prospectos y Asesores",
    permisos: [
      { id: 1, menu: "Gestión de Prospectos", submenu: "Gestión de Prospectos", estado: 100 },
      { id: 2, menu: "Captura de Prospectos", submenu: "Captura de Prospectos", estado: 100 },
      { id: 3, menu: "Leads Asignados", submenu: "Leads Asignados", estado: 100 },
      { id: 4, menu: "Panel de Seguimiento", submenu: "Panel de Seguimiento", estado: 100 },
      { id: 5, menu: "Importar Leads", submenu: "Importar Leads", estado: 100 },
      { id: 6, menu: "Interacciones con Leads", submenu: "Interacciones con Leads", estado: 100 },
      { id: 7, menu: "Tareas del Asesor", submenu: "Tareas del Asesor", estado: 100 },
      { id: 8, menu: "Correos", submenu: "Correos", estado: 100 },
      { id: 9, menu: "Calendario", submenu: "Calendario", estado: 100 },
      { id: 10, menu: "Formulario de Correos", submenu: "Formulario de Correos", estado: 100 },
      { id: 11, menu: "Programación de Tareas", submenu: "Programación de Tareas", estado: 100 },
      { id: 12, menu: "Gestión de Leads", submenu: "Gestión de Leads", estado: 100 },
      { id: 13, menu: "Asesores", submenu: "Asesores", estado: 100 },
      { id: 14, menu: "Rendimiento", submenu: "Rendimiento", estado: 100 },
      { id: 15, menu: "Reportes", submenu: "Reportes", estado: 100 },
      { id: 16, menu: "Actividad Diaria", submenu: "Actividad Diaria", estado: 100 },
      { id: 17, menu: "Duplicados", submenu: "Duplicados", estado: 100 },
      { id: 18, menu: "Configuración", submenu: "Configuración", estado: 100 },
    ],
  },
  {
    modulo: "Inscripción",
    permisos: [
      { id: 1, menu: "Ficha de Inscripción", submenu: "Ficha de Inscripción", estado: 100 },
      { id: 2, menu: "Revisión de Fichas", submenu: "Revisión de Fichas", estado: 100 },
      { id: 3, menu: "Firma Digital", submenu: "Firma Digital", estado: 80 },
      { id: 4, menu: "Documentos", submenu: "Validación de Documentos", estado: 100 },
      { id: 5, menu: "Documentos", submenu: "Gestión de Documentos", estado: 100 },
      { id: 6, menu: "Reportes", submenu: "Reportes Avanzados", estado: 100 },
      { id: 7, menu: "Administración", submenu: "Periodos de Inscripción", estado: 100 },
      { id: 8, menu: "Administración", submenu: "Flujos de Aprobación", estado: 80 },
    ],
  },
  {
    modulo: "Académico",
    permisos: [
      { id: 1, menu: "Programas Académicos", submenu: "Programas Académicos", estado: 100 },
      { id: 2, menu: "Gestión de Usuarios", submenu: "Gestión de Usuarios", estado: 100 },
      { id: 3, menu: "Programación de Cursos", submenu: "Programación de Cursos", estado: 100 },
      { id: 4, menu: "Asignación de Cursos", submenu: "Asignación de Cursos", estado: 100 },
      { id: 5, menu: "Estatus Académico", submenu: "Estatus Académico", estado: 100 },
      { id: 6, menu: "Estatus General", submenu: "Estatus General", estado: 100 },
      { id: 7, menu: "Ranking Académico", submenu: "Ranking Académico", estado: 100 },
    ],
  },
  {
    modulo: "Docentes",
    permisos: [
      { id: 1, menu: "Portal Docente", submenu: "Portal Docente", estado: 100 },
      { id: 2, menu: "Mis Cursos", submenu: "Mis Cursos", estado: 100 },
      { id: 3, menu: "Alumnos", submenu: "Alumnos", estado: 100 },
      { id: 4, menu: "Material Didáctico", submenu: "Material Didáctico", estado: 100 },
      { id: 5, menu: "Mensajería e Invitaciones", submenu: "Mensajería e Invitaciones", estado: 100 },
      { id: 6, menu: "Medallero e Insignias", submenu: "Medallero e Insignias", estado: 80 },
      { id: 7, menu: "Mi Aprendizaje", submenu: "Mi Aprendizaje", estado: 100 },
      { id: 8, menu: "Calendario", submenu: "Calendario", estado: 100 },
      { id: 9, menu: "Notificaciones", submenu: "Notificaciones", estado: 100 },
      { id: 10, menu: "Certificaciones", submenu: "Certificaciones", estado: 80 },
    ],
  },
  {
    modulo: "Estudiantes",
    permisos: [
      { id: 1, menu: "Dashboard Estudiantil", submenu: "Dashboard Estudiantil", estado: 100 },
      { id: 2, menu: "Documentos", submenu: "Documentos", estado: 100 },
      { id: 3, menu: "Gestión de Pagos", submenu: "Gestión de Pagos", estado: 100 },
      { id: 4, menu: "Ranking Estudiantil", submenu: "Ranking Estudiantil", estado: 100 },
      { id: 5, menu: "Calendario Académico", submenu: "Calendario Académico", estado: 100 },
      { id: 6, menu: "Notificaciones", submenu: "Notificaciones", estado: 100 },
      { id: 7, menu: "Mi Perfil", submenu: "Mi Perfil", estado: 100 },
      { id: 8, menu: "Estado de Cuenta", submenu: "Estado de Cuenta", estado: 100 },
    ],
  },
  {
    modulo: "Finanzas y Pagos",
    permisos: [
      { id: 1, menu: "Dashboard Financiero", submenu: "Dashboard Financiero", estado: 100 },
      { id: 2, menu: "Estado de Cuenta", submenu: "Estado de Cuenta", estado: 100 },
      { id: 3, menu: "Gestión de Pagos", submenu: "Gestión de Pagos", estado: 100 },
      { id: 4, menu: "Conciliación Bancaria", submenu: "Conciliación Bancaria", estado: 80 },
      { id: 5, menu: "Seguimiento de Cobros", submenu: "Seguimiento de Cobros", estado: 100 },
      { id: 6, menu: "Reportes Financieros", submenu: "Reportes Financieros", estado: 100 },
      { id: 7, menu: "Configuración", submenu: "Configuración", estado: 100 },
    ],
  },
  {
    modulo: "Administración",
    permisos: [
      { id: 1, menu: "Dashboard Administrativo", submenu: "Dashboard Administrativo", estado: 100 },
      { id: 2, menu: "Programación de Cursos", submenu: "Programación de Cursos", estado: 100 },
      { id: 3, menu: "Reportes de Matrícula", submenu: "Reportes de Matrícula", estado: 100 },
      { id: 4, menu: "Reporte de Ingresos", submenu: "Reporte de Ingresos", estado: 100 },
      { id: 5, menu: "Plantillas y Mailing", submenu: "Plantillas y Mailing", estado: 100 },
      { id: 6, menu: "Configuración General", submenu: "Configuración General", estado: 100 },
    ],
  },
  {
    modulo: "Seguridad",
    permisos: [
      { id: 1, menu: "Usuarios", submenu: "Gestión de usuarios", estado: 100 },
      { id: 2, menu: "Roles", submenu: "Gestión de roles", estado: 100 },
      { id: 3, menu: "Permisos", submenu: "Asignación de permisos", estado: 100 },
      { id: 4, menu: "Auditoría", submenu: "Logs de auditoría", estado: 100 },
      { id: 5, menu: "Políticas", submenu: "Políticas de seguridad", estado: 100 },
    ],
  },
]

export default function PermisosVistasTab() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedModulo, setSelectedModulo] = useState("todos")
  const [selectedUsuario, setSelectedUsuario] = useState<string | null>(null)
  const [selectedPermisos, setSelectedPermisos] = useState<number[]>([])
  const [expandedModulos, setExpandedModulos] = useState<string[]>(["Prospectos y Asesores"])

  const modulos = ["todos", ...permisosData.map((m) => m.modulo)]

  // Usuarios del sistema
  const usuarios = [
    { id: "1", nombre: "Juan Pérez", cargo: "Administrador" },
    { id: "2", nombre: "María López", cargo: "Asesor" },
    { id: "3", nombre: "Carlos Rodríguez", cargo: "Docente" },
    { id: "4", nombre: "Ana Martínez", cargo: "Estudiante" },
    { id: "5", nombre: "Roberto Sánchez", cargo: "Administrativo" },
  ]

  const filteredPermisos = permisosData.filter(
    (moduloData) => selectedModulo === "todos" || moduloData.modulo === selectedModulo,
  )

  const handleToggleModulo = (modulo: string) => {
    setExpandedModulos((prev) => (prev.includes(modulo) ? prev.filter((m) => m !== modulo) : [...prev, modulo]))
  }

  const handleTogglePermiso = (id: number) => {
    setSelectedPermisos((prev) => (prev.includes(id) ? prev.filter((permId) => permId !== id) : [...prev, id]))
  }

  const handleSelectAllModulo = (modulo: string, checked: boolean) => {
    const moduloPermisos = permisosData.find((m) => m.modulo === modulo)?.permisos || []

    if (checked) {
      // Añadir todos los permisos del módulo que no estén ya seleccionados
      const permisosIds = moduloPermisos.map((p) => p.id)
      setSelectedPermisos((prev) => [...new Set([...prev, ...permisosIds])])
    } else {
      // Quitar todos los permisos del módulo
      const permisosIds = moduloPermisos.map((p) => p.id)
      setSelectedPermisos((prev) => prev.filter((id) => !permisosIds.includes(id)))
    }
  }

  const handleSavePermisos = () => {
    // Aquí iría la lógica para guardar los permisos asignados
    alert(`Permisos asignados al usuario ${selectedUsuario}: ${selectedPermisos.join(", ")}`)
  }

  const getEstadoBadge = (estado: number) => {
    if (estado === 100) {
      return <Badge className="bg-green-600 hover:bg-green-600">100%</Badge>
    } else if (estado === 0) {
      return <Badge variant="destructive">0%</Badge>
    } else if (estado >= 80) {
      return <Badge className="bg-yellow-600 hover:bg-yellow-600">{estado}%</Badge>
    } else {
      return <Badge className="bg-red-500 hover:bg-red-500">{estado}%</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información de usuario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Nombre de usuario</label>
              <Select value={selectedUsuario || ""} onValueChange={setSelectedUsuario}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id}>
                      {usuario.nombre} - {usuario.cargo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Cargo</label>
              <Input
                value={selectedUsuario ? usuarios.find((u) => u.id === selectedUsuario)?.cargo || "" : ""}
                readOnly
                className="mt-1 bg-muted"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Tipo de usuario</label>
              <Input value={selectedUsuario ? "Usuario del sistema" : ""} readOnly className="mt-1 bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permisos disponibles</CardTitle>
          <CardDescription>Asigna permisos al usuario seleccionado</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 flex flex-col md:flex-row justify-between gap-4">
            <div className="flex flex-col md:flex-row gap-2 w-full">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar permisos..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedModulo} onValueChange={setSelectedModulo}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por módulo" />
                  </SelectTrigger>
                  <SelectContent>
                    {modulos.map((modulo) => (
                      <SelectItem key={modulo} value={modulo}>
                        {modulo === "todos" ? "Todos los módulos" : modulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="todos-permisos"
                checked={
                  selectedPermisos.length > 0 &&
                  permisosData.flatMap((m) => m.permisos).every((p) => selectedPermisos.includes(p.id))
                }
                onCheckedChange={(checked) => {
                  if (checked) {
                    // Seleccionar todos los permisos
                    setSelectedPermisos(permisosData.flatMap((m) => m.permisos.map((p) => p.id)))
                  } else {
                    // Deseleccionar todos
                    setSelectedPermisos([])
                  }
                }}
              />
              <label htmlFor="todos-permisos" className="text-sm font-medium">
                Todos los permisos
              </label>
            </div>
          </div>

          <div className="border-t">
            {filteredPermisos.map((moduloData) => (
              <div key={moduloData.modulo} className="border-b">
                <div
                  className="bg-blue-600 text-white p-3 cursor-pointer flex justify-between items-center"
                  onClick={() => handleToggleModulo(moduloData.modulo)}
                >
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`modulo-${moduloData.modulo}`}
                      className="border-white data-[state=checked]:bg-white data-[state=checked]:text-blue-600"
                      checked={moduloData.permisos.every((p) => selectedPermisos.includes(p.id))}
                      onCheckedChange={(checked) => {
                        handleSelectAllModulo(moduloData.modulo, !!checked)
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <label htmlFor={`modulo-${moduloData.modulo}`} className="font-medium text-white">
                      Módulo de {moduloData.modulo}
                    </label>
                  </div>
                  <div className="text-white">
                    {expandedModulos.includes(moduloData.modulo) ? (
                      <X className="h-5 w-5" />
                    ) : (
                      <Filter className="h-5 w-5" />
                    )}
                  </div>
                </div>

                {expandedModulos.includes(moduloData.modulo) && (
                  <div className="p-0">
                    <Table>
                      <TableHeader className="bg-gray-100">
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox
                              id={`select-all-${moduloData.modulo}`}
                              checked={moduloData.permisos.every((p) => selectedPermisos.includes(p.id))}
                              onCheckedChange={(checked) => {
                                handleSelectAllModulo(moduloData.modulo, !!checked)
                              }}
                            />
                          </TableHead>
                          <TableHead className="w-[50px]">#</TableHead>
                          <TableHead>Módulo</TableHead>
                          <TableHead>Menú</TableHead>
                          <TableHead>Submenú</TableHead>
                          <TableHead className="text-center">Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {moduloData.permisos
                          .filter(
                            (permiso) =>
                              permiso.submenu.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              permiso.menu.toLowerCase().includes(searchTerm.toLowerCase()),
                          )
                          .map((permiso) => (
                            <TableRow key={permiso.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedPermisos.includes(permiso.id)}
                                  onCheckedChange={() => handleTogglePermiso(permiso.id)}
                                />
                              </TableCell>
                              <TableCell>{permiso.id}</TableCell>
                              <TableCell>{moduloData.modulo}</TableCell>
                              <TableCell>{permiso.menu}</TableCell>
                              <TableCell>{permiso.submenu}</TableCell>
                              <TableCell className="text-center">{getEstadoBadge(permiso.estado)}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="border-t p-4 flex justify-end space-x-2">
          <Button variant="outline">
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleSavePermisos} disabled={!selectedUsuario}>
            <Save className="mr-2 h-4 w-4" />
            Guardar Permisos
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

