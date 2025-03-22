"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Plus,
  Upload,
  Wand2,
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  Users,
  FileText,
  Calendar,
  Activity,
  Settings,
  LayoutDashboard,
  BookOpen,
  Mail,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Check,
  UserPlus,
  Shield,
  Bell,
  BookOpenIcon,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"

// Tipos para los leads
type LeadStatus = "Nuevo" | "En seguimiento" | "Convertido" | "No interesado"

interface Lead {
  id: string
  nombre: string
  email: string
  telefono: string
  estado: LeadStatus
  asignado: string | null
}

// Datos de ejemplo
const leadsIniciales: Lead[] = [
  {
    id: "1",
    nombre: "Juan Pérez",
    email: "juan@example.com",
    telefono: "1234567890",
    estado: "Nuevo",
    asignado: "Carlos Rodríguez",
  },
  {
    id: "2",
    nombre: "María García",
    email: "maria@example.com",
    telefono: "9876543210",
    estado: "En seguimiento",
    asignado: "Ana López",
  },
  {
    id: "3",
    nombre: "Pedro Sánchez",
    email: "pedro@example.com",
    telefono: "5555555555",
    estado: "Convertido",
    asignado: "Carlos Rodríguez",
  },
  {
    id: "4",
    nombre: "Ana Martínez",
    email: "ana@example.com",
    telefono: "1112223333",
    estado: "No interesado",
    asignado: null,
  },
]

// Datos para asesores
const asesoresData = [
  {
    id: "1",
    nombre: "Carlos Rodríguez",
    email: "carlos@example.com",
    telefono: "1234567890",
    especialidad: "Cursos Técnicos",
    leads: 45,
    conversiones: 12,
    ingresos: "Q24500",
    estado: "Activo",
  },
  {
    id: "2",
    nombre: "Ana López",
    email: "ana.lopez@example.com",
    telefono: "9876543210",
    especialidad: "Diplomados",
    leads: 38,
    conversiones: 9,
    ingresos: "Q18200",
    estado: "Activo",
  },
  {
    id: "3",
    nombre: "Miguel Hernández",
    email: "miguel@example.com",
    telefono: "5555555555",
    especialidad: "Maestrías",
    leads: 52,
    conversiones: 15,
    ingresos: "Q31000",
    estado: "Activo",
  },
  {
    id: "4",
    nombre: "Laura Martínez",
    email: "laura@example.com",
    telefono: "1112223333",
    especialidad: "Cursos Cortos",
    leads: 29,
    conversiones: 7,
    ingresos: "Q14300",
    estado: "Activo",
  },
]

// Datos para actividad diaria
const actividadDiariaData = [
  {
    id: "1",
    asesor: "Carlos Rodríguez",
    inscritos: 3,
    posiblesCierres: 5,
    llamadas: 18,
    telemercadeo: 25,
    seguimientos: 22,
    estado: "Cumplido",
  },
  {
    id: "2",
    asesor: "Ana López",
    inscritos: 2,
    posiblesCierres: 4,
    llamadas: 15,
    telemercadeo: 22,
    seguimientos: 20,
    estado: "Cumplido",
  },
  {
    id: "3",
    asesor: "Miguel Hernández",
    inscritos: 1,
    posiblesCierres: 3,
    llamadas: 12,
    telemercadeo: 18,
    seguimientos: 15,
    estado: "En proceso",
    alertaInscritos: true,
    alertaSeguimientos: true,
  },
  {
    id: "4",
    asesor: "Laura Martínez",
    inscritos: 0,
    posiblesCierres: 2,
    llamadas: 10,
    telemercadeo: 15,
    seguimientos: 12,
    estado: "En proceso",
    alertaInscritos: true,
    alertaSeguimientos: true,
  },
]

// Datos para alertas
const alertasData = [
  {
    id: "1",
    prospecto: "Juan Pérez",
    asesor: "Carlos Rodríguez",
    tipo: "Seguimiento",
    diasSinContacto: 8,
    prioridad: "Alta",
    estado: "Pendiente",
  },
  {
    id: "2",
    prospecto: "María García",
    asesor: "Ana López",
    tipo: "Información",
    diasSinContacto: 6,
    prioridad: "Media",
    estado: "Pendiente",
  },
  {
    id: "3",
    prospecto: "Pedro Sánchez",
    asesor: "Miguel Hernández",
    tipo: "Reunión",
    diasSinContacto: 5,
    prioridad: "Media",
    estado: "Pendiente",
  },
  {
    id: "4",
    prospecto: "Ana Martínez",
    asesor: "Laura Martínez",
    tipo: "Seguimiento",
    diasSinContacto: 3,
    prioridad: "Baja",
    estado: "Pendiente",
  },
]

// Datos para duplicados
const duplicadosData = [
  {
    id: "1",
    original: {
      nombre: "Juan Pérez",
      email: "juan@example.com",
      telefono: "1234567890",
      asesor: "Carlos Rodríguez",
      ingreso: "15/02/2025",
    },
    duplicado: {
      nombre: "Juan Pérez González",
      email: "juan.perez@example.com",
      telefono: "1234567890",
      asesor: "Ana López",
      ingreso: "18/02/2025",
    },
    similitud: 85,
    estado: "Pendiente",
  },
  {
    id: "2",
    original: {
      nombre: "María García",
      email: "maria@example.com",
      telefono: "9876543210",
      asesor: "Miguel Hernández",
      ingreso: "10/02/2025",
    },
    duplicado: {
      nombre: "María García López",
      email: "maria.garcia@example.com",
      telefono: "9876543210",
      asesor: "Laura Martínez",
      ingreso: "20/02/2025",
    },
    similitud: 80,
    estado: "Pendiente",
  },
]

// Datos para cursos
const cursosData = [
  {
    id: "1",
    nombre: "Desarrollo Web Full Stack",
    categoria: "Tecnología",
    duracion: "6 meses",
    modalidad: "Virtual",
    precio: "Q8,500",
    inscritos: 45,
    estado: "Activo",
    proximoInicio: "15/04/2025",
  },
  {
    id: "2",
    nombre: "Marketing Digital",
    categoria: "Negocios",
    duracion: "3 meses",
    modalidad: "Híbrido",
    precio: "Q5,200",
    inscritos: 38,
    estado: "Activo",
    proximoInicio: "10/04/2025",
  },
  {
    id: "3",
    nombre: "Inteligencia Artificial",
    categoria: "Tecnología",
    duracion: "4 meses",
    modalidad: "Virtual",
    precio: "Q7,800",
    inscritos: 32,
    estado: "Activo",
    proximoInicio: "20/04/2025",
  },
  {
    id: "4",
    nombre: "Gestión de Proyectos",
    categoria: "Negocios",
    duracion: "2 meses",
    modalidad: "Presencial",
    precio: "Q4,500",
    inscritos: 25,
    estado: "Activo",
    proximoInicio: "05/04/2025",
  },
]

export default function AdminPanel() {
  const [leads, setLeads] = useState<Lead[]>(leadsIniciales)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("general")
  const [activeAdminTab, setActiveAdminTab] = useState("leads")
  const [fecha, setFecha] = useState("08/03/2025")

  // Función para manejar la búsqueda
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setLeads(leadsIniciales)
      return
    }

    const filteredLeads = leadsIniciales.filter(
      (lead) =>
        lead.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.telefono.includes(searchTerm),
    )

    setLeads(filteredLeads)
  }

  // Función para manejar cambios en el campo de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  // Función para manejar cambios en la fecha
  const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFecha(e.target.value)
  }

  // Función para renderizar el badge de estado con el color correcto
  const renderStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case "Nuevo":
        return <Badge className="bg-black text-white">Nuevo</Badge>
      case "En seguimiento":
        return <Badge className="bg-blue-500">En seguimiento</Badge>
      case "Convertido":
        return <Badge className="bg-green-600">Convertido</Badge>
      case "No interesado":
        return <Badge className="bg-gray-500">No interesado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Función para renderizar el badge de prioridad
  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Alta":
        return <Badge className="bg-red-500">Alta</Badge>
      case "Media":
        return <Badge className="bg-yellow-500">Media</Badge>
      case "Baja":
        return <Badge className="bg-blue-500">Baja</Badge>
      default:
        return <Badge>{priority}</Badge>
    }
  }

  // Función para renderizar el badge de días sin contacto
  const renderDaysBadge = (days: number) => {
    if (days >= 7) {
      return <Badge className="bg-red-500 rounded-full">{days} días</Badge>
    } else if (days >= 5) {
      return <Badge className="bg-yellow-500 rounded-full">{days} días</Badge>
    } else {
      return <span>{days} días</span>
    }
  }

  return (
    <div className="p-6 bg-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Panel de Administración</h1>
        <Button variant="outline" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Configuración
        </Button>
      </div>

      {/* Tabs principales del panel de administración */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="w-full grid grid-cols-5 h-auto">
          <TabsTrigger value="general" className="py-3 flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="reportes" className="py-3 flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Reportes
          </TabsTrigger>
          <TabsTrigger value="academico" className="py-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Académico
          </TabsTrigger>
          <TabsTrigger value="comunicaciones" className="py-3 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Comunicaciones
          </TabsTrigger>
          <TabsTrigger value="estudiantes" className="py-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Estudiantes
          </TabsTrigger>
        </TabsList>



        {/* Contenido de la pestaña Reportes */}
        <TabsContent value="reportes">
          <div className="p-4 text-center">
            <h2 className="text-xl font-semibold mb-2">Sección de Reportes</h2>
            <p className="text-gray-500">Aquí se mostrarán los reportes del sistema.</p>
          </div>
        </TabsContent>

        {/* Contenido de la pestaña Académico */}
        <TabsContent value="academico">
          <div className="p-4 text-center">
            <h2 className="text-xl font-semibold mb-2">Sección Académica</h2>
            <p className="text-gray-500">Aquí se mostrarán los datos académicos.</p>
          </div>
        </TabsContent>

        {/* Contenido de la pestaña Comunicaciones */}
        <TabsContent value="comunicaciones">
          <div className="p-4 text-center">
            <h2 className="text-xl font-semibold mb-2">Sección de Comunicaciones</h2>
            <p className="text-gray-500">Aquí se mostrarán las comunicaciones del sistema.</p>
          </div>
        </TabsContent>

        {/* Contenido de la pestaña Estudiantes */}
        <TabsContent value="estudiantes">
          <div className="p-4 text-center">
            <h2 className="text-xl font-semibold mb-2">Sección de Estudiantes</h2>
            <p className="text-gray-500">Aquí se mostrarán los datos de estudiantes.</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Panel de Administración de Leads y otras opciones */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Panel de Administración de Prospectos</h2>

        {/* Tabs para las opciones de administración de leads */}
        <Tabs value={activeAdminTab} onValueChange={setActiveAdminTab} className="mb-6">
          <TabsList className="w-full grid grid-cols-8 h-auto">
            <TabsTrigger value="leads" className="py-3">
              Gestión de Leads
            </TabsTrigger>
            <TabsTrigger value="asesores" className="py-3">
              Asesores
            </TabsTrigger>
            <TabsTrigger value="rendimiento" className="py-3">
              Rendimiento
            </TabsTrigger>
            <TabsTrigger value="reportes" className="py-3">
              Reportes
            </TabsTrigger>
            <TabsTrigger value="actividad" className="py-3">
              Actividad Diaria
            </TabsTrigger>
            <TabsTrigger value="alertas" className="py-3">
              Gestión de Alertas
            </TabsTrigger>
            <TabsTrigger value="duplicados" className="py-3">
              Duplicados
            </TabsTrigger>
            <TabsTrigger value="cursos" className="py-3">
              Cursos
            </TabsTrigger>
            <TabsTrigger value="configuracion" className="py-3">
              Configuración
            </TabsTrigger>
          </TabsList>

          {/* Contenido de la pestaña Gestión de Leads */}
          <TabsContent value="leads" className="border rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">Gestión de Leads</h3>

            {/* Barra de búsqueda y acciones */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar leads..."
                  className="w-64"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <Button variant="outline" onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="default" className="bg-black hover:bg-gray-800">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Lead
                </Button>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Leads
                </Button>
                <Button variant="outline">
                  <Wand2 className="h-4 w-4 mr-2" />
                  Asignación Automática
                </Button>
              </div>
            </div>

            {/* Tabla de leads */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Nombre</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Teléfono</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Asignado a</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-blue-600">{lead.nombre}</td>
                      <td className="py-3 px-4 text-gray-600">{lead.email}</td>
                      <td className="py-3 px-4">{lead.telefono}</td>
                      <td className="py-3 px-4">{renderStatusBadge(lead.estado)}</td>
                      <td className="py-3 px-4">
                        {lead.asignado ? (
                          <span className="text-blue-600">{lead.asignado}</span>
                        ) : (
                          <span className="text-gray-500">Sin asignar</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem>Asignar</DropdownMenuItem>
                            <DropdownMenuItem>Cambiar estado</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Eliminar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="flex justify-end mt-4 gap-2">
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <Button variant="outline" size="sm">
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </TabsContent>

          {/* Contenido de la pestaña Asesores */}
          <TabsContent value="asesores" className="border rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Gestión de Asesores</h3>
              <Button variant="default" className="bg-black hover:bg-gray-800">
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Asesor
              </Button>
            </div>

            {/* Tabla de asesores */}
            <div className="overflow-x-auto mb-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Nombre</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Teléfono</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Especialidad</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {asesoresData.map((asesor) => (
                    <tr key={asesor.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-blue-600">{asesor.nombre}</td>
                      <td className="py-3 px-4">{asesor.email}</td>
                      <td className="py-3 px-4">{asesor.telefono}</td>
                      <td className="py-3 px-4">{asesor.especialidad}</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-600">Activo</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Ver perfil</DropdownMenuItem>
                            <DropdownMenuItem>Editar información</DropdownMenuItem>
                            <DropdownMenuItem>Ver leads asignados</DropdownMenuItem>
                            <DropdownMenuItem>Ver rendimiento</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Desactivar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Estadísticas de asesores */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Total Asesores</h4>
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold">4</p>
                  <p className="text-sm text-gray-500 mt-1">Activos en el sistema</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Promedio Leads</h4>
                    <BarChart2 className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold">41</p>
                  <p className="text-sm text-gray-500 mt-1">Leads por asesor</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Tasa Conversión</h4>
                    <Activity className="h-5 w-5 text-yellow-600" />
                  </div>
                  <p className="text-3xl font-bold">26%</p>
                  <p className="text-sm text-gray-500 mt-1">Promedio del equipo</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Ingresos</h4>
                    <BarChart2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold">Q88K</p>
                  <p className="text-sm text-gray-500 mt-1">Total generado</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contenido de la pestaña Rendimiento */}
          <TabsContent value="rendimiento">
            <div className="border rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Rendimiento de Asesores</h3>
                <Select defaultValue="mes">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Seleccionar período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semana">Esta semana</SelectItem>
                    <SelectItem value="mes">Este mes</SelectItem>
                    <SelectItem value="trimestre">Este trimestre</SelectItem>
                    <SelectItem value="anio">Este año</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tabla de rendimiento de asesores */}
              <div className="overflow-x-auto mb-8">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Nombre</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Leads</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Conversiones</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Ingresos</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asesoresData.map((asesor) => (
                      <tr key={asesor.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-blue-600">{asesor.nombre}</td>
                        <td className="py-3 px-4">{asesor.leads}</td>
                        <td className="py-3 px-4">{asesor.conversiones}</td>
                        <td className="py-3 px-4 font-medium">{asesor.ingresos}</td>
                        <td className="py-3 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                              <DropdownMenuItem>Ver historial</DropdownMenuItem>
                              <DropdownMenuItem>Exportar datos</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Métricas de Rendimiento */}
              <div className="border rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium">Métricas de Rendimiento</h4>
                  <Select defaultValue="leads">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Seleccionar métrica" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leads">Leads</SelectItem>
                      <SelectItem value="conversiones">Conversiones</SelectItem>
                      <SelectItem value="ingresos">Ingresos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Gráfico de barras */}
                <div className="flex justify-center items-end h-64 gap-8 mt-8 mb-4">
                  <div className="flex flex-col items-center">
                    <div className="bg-blue-500 w-16 h-48"></div>
                    <p className="mt-2 font-medium">Carlos</p>
                    <p className="text-sm text-gray-500">45</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="bg-blue-500 w-16 h-40"></div>
                    <p className="mt-2 font-medium">Ana</p>
                    <p className="text-sm text-gray-500">38</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="bg-blue-500 w-16 h-56"></div>
                    <p className="mt-2 font-medium">Miguel</p>
                    <p className="text-sm text-gray-500">52</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="bg-blue-500 w-16 h-32"></div>
                    <p className="mt-2 font-medium">Laura</p>
                    <p className="text-sm text-gray-500">29</p>
                  </div>
                </div>
                <p className="text-center text-gray-500 mt-4">Gráfico de barras mostrando leads por asesor</p>
              </div>

              {/* KPIs y Metas */}
              <div className="border rounded-lg p-6">
                <h4 className="text-lg font-medium mb-4">KPIs y Metas</h4>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Leads Captados (Meta: 40)</span>
                      <span className="font-medium">103%</span>
                    </div>
                    <Progress value={103} className="h-2 bg-gray-200" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Tasa de Conversión (Meta: 25%)</span>
                      <span className="font-medium">86%</span>
                    </div>
                    <Progress value={86} className="h-2 bg-gray-200" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Ingresos (Meta: Q100K)</span>
                      <span className="font-medium">88%</span>
                    </div>
                    <Progress value={88} className="h-2 bg-gray-200" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Satisfacción del Cliente (Meta: 90%)</span>
                      <span className="font-medium">95%</span>
                    </div>
                    <Progress value={95} className="h-2 bg-gray-200" />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Contenido de la pestaña Reportes */}
          <TabsContent value="reportes">
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-bold mb-6">Reportes</h3>

              <div className="flex flex-wrap gap-2 mb-8">
                <Button variant="default" className="bg-black hover:bg-gray-800">
                  <FileText className="h-4 w-4 mr-2" />
                  Generar Reporte de Leads
                </Button>
                <Button variant="default" className="bg-black hover:bg-gray-800">
                  <FileText className="h-4 w-4 mr-2" />
                  Generar Reporte de Conversiones
                </Button>
                <Button variant="default" className="bg-black hover:bg-gray-800">
                  <FileText className="h-4 w-4 mr-2" />
                  Generar Reporte de Ingresos
                </Button>
                <Button variant="default" className="bg-black hover:bg-gray-800">
                  <FileText className="h-4 w-4 mr-2" />
                  Generar Reporte de Rendimiento de Asesores
                </Button>
              </div>

              <div className="text-center py-12 border rounded-lg bg-gray-50">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h4 className="text-lg font-medium mb-2">Selecciona un reporte para generar</h4>
                <p className="text-gray-500">Los reportes se generarán en formato PDF y podrán ser descargados.</p>
              </div>
            </div>
          </TabsContent>

          {/* Contenido de la pestaña Actividad Diaria */}
          <TabsContent value="actividad">
            <div className="border rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Actividad Diaria de Asesores</h3>
                <div className="flex items-center gap-2">
                  <Input type="date" defaultValue="2025-03-08" className="w-40" onChange={handleFechaChange} />
                  <Button variant="default" className="bg-black hover:bg-gray-800">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar
                  </Button>
                </div>
              </div>

              {/* Tabla de actividad diaria */}
              <div className="overflow-x-auto mb-8">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Asesor</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Inscritos</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Posibles Cierres</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Llamadas</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Telemercadeo</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Seguimientos</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Estado</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actividadDiariaData.map((actividad) => (
                      <tr key={actividad.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-blue-600">{actividad.asesor}</td>
                        <td className="py-3 px-4">
                          {actividad.alertaInscritos ? (
                            <Badge className="bg-red-500 rounded-full">{actividad.inscritos}</Badge>
                          ) : (
                            actividad.inscritos
                          )}
                        </td>
                        <td className="py-3 px-4">{actividad.posiblesCierres}</td>
                        <td className="py-3 px-4">{actividad.llamadas}</td>
                        <td className="py-3 px-4">{actividad.telemercadeo}</td>
                        <td className="py-3 px-4">
                          {actividad.alertaSeguimientos ? (
                            <Badge className="bg-red-500 rounded-full">{actividad.seguimientos}</Badge>
                          ) : (
                            actividad.seguimientos
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {actividad.estado === "Cumplido" ? (
                            <Badge className="bg-green-500">Cumplido</Badge>
                          ) : (
                            <Badge className="bg-yellow-500">En proceso</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                              <DropdownMenuItem>Editar</DropdownMenuItem>
                              <DropdownMenuItem>Enviar recordatorio</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sección de KPIs y Resumen */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-6">
                  <h4 className="text-lg font-medium mb-4">Cumplimiento de KPIs</h4>

                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">Cierres (mín. 2 diarios)</span>
                        <span className="font-medium">100%</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">Promedio equipo: 2.0</p>
                      <Progress value={100} className="h-2 bg-gray-200" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">Seguimientos (mín. 20 diarios)</span>
                        <span className="font-medium">107%</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">Promedio equipo: 21.3</p>
                      <Progress value={107} className="h-2 bg-gray-200" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">Llamadas diarias</span>
                        <span className="font-medium">92%</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">Promedio equipo: 18.3</p>
                      <Progress value={92} className="h-2 bg-gray-200" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">Telemercadeo</span>
                        <span className="font-medium">97%</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">Promedio equipo: 24.3</p>
                      <Progress value={97} className="h-2 bg-gray-200" />
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-6">
                  <h4 className="text-lg font-medium mb-4">Resumen de Actividad</h4>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold text-blue-600 mb-1">6</p>
                      <p className="text-sm text-gray-600">Inscritos hoy</p>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold text-green-600 mb-1">14</p>
                      <p className="text-sm text-gray-600">Posibles cierres</p>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold text-purple-600 mb-1">55</p>
                      <p className="text-sm text-gray-600">Llamadas</p>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold text-yellow-600 mb-1">73</p>
                      <p className="text-sm text-gray-600">Seguimientos</p>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Generar reporte completo
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Contenido de la pestaña Alertas */}
          <TabsContent value="alertas">
            <div className="border rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Alertas por Tiempo de Seguimiento</h3>
                <div className="flex items-center gap-2">
                  <Select defaultValue="todas">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar alertas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas las alertas</SelectItem>
                      <SelectItem value="alta">Prioridad alta</SelectItem>
                      <SelectItem value="media">Prioridad media</SelectItem>
                      <SelectItem value="baja">Prioridad baja</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="default" className="bg-black hover:bg-gray-800">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar
                  </Button>
                </div>
              </div>

              {/* Tabla de alertas */}
              <div className="overflow-x-auto mb-8">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Prospecto</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Asesor</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Tipo</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Días sin contacto</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Prioridad</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Estado</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertasData.map((alerta) => (
                      <tr key={alerta.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-blue-600">{alerta.prospecto}</td>
                        <td className="py-3 px-4">{alerta.asesor}</td>
                        <td className="py-3 px-4">{alerta.tipo}</td>
                        <td className="py-3 px-4">{renderDaysBadge(alerta.diasSinContacto)}</td>
                        <td className="py-3 px-4">{renderPriorityBadge(alerta.prioridad)}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Pendiente
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="text-green-600">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-blue-600">
                              <UserPlus className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Resumen de alertas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border rounded-lg p-6 bg-red-50">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <h4 className="text-lg font-medium text-red-700">Alertas Rojas</h4>
                  </div>
                  <p className="text-3xl font-bold mb-2">5</p>
                  <p className="text-sm text-gray-600">Prospectos sin seguimiento por más de 7 días</p>
                  <Button variant="outline" className="w-full mt-4 border-red-200 text-red-700 hover:bg-red-100">
                    Ver todos
                  </Button>
                </div>

                <div className="border rounded-lg p-6 bg-yellow-50">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <h4 className="text-lg font-medium text-yellow-700">Alertas Amarillas</h4>
                  </div>
                  <p className="text-3xl font-bold mb-2">12</p>
                  <p className="text-sm text-gray-600">Prospectos sin seguimiento por 5-6 días</p>
                  <Button
                    variant="outline"
                    className="w-full mt-4 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                  >
                    Ver todos
                  </Button>
                </div>

                <div className="border rounded-lg p-6 bg-green-50">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h4 className="text-lg font-medium text-green-700">Alertas Verdes</h4>
                  </div>
                  <p className="text-3xl font-bold mb-2">27</p>
                  <p className="text-sm text-gray-600">Prospectos con seguimiento regular (1-4 días)</p>
                  <Button variant="outline" className="w-full mt-4 border-green-200 text-green-700 hover:bg-green-100">
                    Ver todos
                  </Button>
                </div>
              </div>

              {/* Configuración de tiempos de alerta */}
              <div className="mt-8 border-t pt-6">
                <h4 className="text-lg font-medium mb-4">Configuración de Tiempos de Alerta</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                  <div>
                    <p className="mb-2">Alerta Verde (días)</p>
                    <div className="flex items-center gap-2">
                      <Input type="number" defaultValue="1" className="w-20" />
                      <span>a</span>
                      <Input type="number" defaultValue="4" className="w-20" />
                    </div>
                  </div>

                  <div>
                    <p className="mb-2">Alerta Amarilla (días)</p>
                    <div className="flex items-center gap-2">
                      <Input type="number" defaultValue="5" className="w-20" />
                      <span>a</span>
                      <Input type="number" defaultValue="6" className="w-20" />
                    </div>
                  </div>

                  <div>
                    <p className="mb-2">Alerta Roja (días)</p>
                    <div className="flex items-center gap-2">
                      <Input type="number" defaultValue="7" className="w-20" />
                      <span>o más</span>
                    </div>
                  </div>
                </div>

                <Button variant="default" className="bg-black hover:bg-gray-800">
                  Guardar configuración
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Contenido de la pestaña Duplicados */}
          <TabsContent value="duplicados">
            <div className="border rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Detección de Registros Duplicados</h3>
                <Button variant="default" className="bg-black hover:bg-gray-800">
                  <Search className="h-4 w-4 mr-2" />
                  Buscar duplicados
                </Button>
              </div>

              {/* Tabla de duplicados */}
              <div className="overflow-x-auto mb-8">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Registro original</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Registro duplicado</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Similitud</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Estado</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {duplicadosData.map((duplicado) => (
                      <tr key={duplicado.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-blue-600">{duplicado.original.nombre}</div>
                          <div className="text-sm text-gray-500">{duplicado.original.email}</div>
                          <div className="text-sm text-gray-500">{duplicado.original.telefono}</div>
                          <div className="text-sm text-gray-500">Asesor: {duplicado.original.asesor}</div>
                          <div className="text-sm text-gray-500">Ingreso: {duplicado.original.ingreso}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{duplicado.duplicado.nombre}</div>
                          <div className="text-sm text-gray-500">{duplicado.duplicado.email}</div>
                          <div className="text-sm text-gray-500">{duplicado.duplicado.telefono}</div>
                          <div className="text-sm text-gray-500">Asesor: {duplicado.duplicado.asesor}</div>
                          <div className="text-sm text-gray-500">Ingreso: {duplicado.duplicado.ingreso}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className="bg-red-500 rounded-full">{duplicado.similitud}%</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Pendiente
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-2">
                            <Button variant="default" className="w-full bg-green-600 hover:bg-green-700">
                              Mantener original
                            </Button>
                            <Button variant="outline" className="w-full">
                              Mantener duplicado
                            </Button>
                            <Button variant="default" className="w-full bg-red-600 hover:bg-red-700">
                              Eliminar duplicado
                            </Button>
                            <Button variant="outline" className="w-full">
                              Marcar como revisado
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sección de reasignación y integración */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-6">
                  <h4 className="text-lg font-medium mb-4">Reasignación de Prospectos</h4>

                  <div className="space-y-4">
                    <div>
                      <p className="mb-2">Asesor origen</p>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar asesor origen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="carlos">Carlos Rodríguez</SelectItem>
                          <SelectItem value="ana">Ana López</SelectItem>
                          <SelectItem value="miguel">Miguel Hernández</SelectItem>
                          <SelectItem value="laura">Laura Martínez</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <p className="mb-2">Asesor destino</p>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar asesor destino" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="carlos">Carlos Rodríguez</SelectItem>
                          <SelectItem value="ana">Ana López</SelectItem>
                          <SelectItem value="miguel">Miguel Hernández</SelectItem>
                          <SelectItem value="laura">Laura Martínez</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <p className="mb-2">Motivo de reasignación</p>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar motivo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vacaciones">Vacaciones</SelectItem>
                          <SelectItem value="carga">Balanceo de carga</SelectItem>
                          <SelectItem value="especialidad">Especialidad</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button variant="default" className="w-full bg-black hover:bg-gray-800">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Reasignar prospectos
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-6">
                  <h4 className="text-lg font-medium mb-4">Integración con ManyChat</h4>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <p className="font-medium">Conexión activa</p>
                    <Badge className="ml-auto">Sincronizado</Badge>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Última sincronización</p>
                    <p className="font-medium">2025-03-08 10:45:23</p>
                  </div>

                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-1">Leads importados hoy</p>
                    <p className="text-3xl font-bold">15</p>
                  </div>

                  <div className="space-y-2">
                    <Button variant="default" className="w-full bg-black hover:bg-gray-800">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sincronizar ahora
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar integración
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Contenido de la pestaña Cursos */}
          <TabsContent value="cursos">
            <div className="border rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Gestión de Cursos</h3>
                <div className="flex gap-2">
                  <Button variant="default" className="bg-black hover:bg-gray-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Curso
                  </Button>
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar Catálogo
                  </Button>
                </div>
              </div>

              {/* Filtros de cursos */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <Select defaultValue="todos">
                    <SelectTrigger>
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas las categorías</SelectItem>
                      <SelectItem value="tecnologia">Tecnología</SelectItem>
                      <SelectItem value="negocios">Negocios</SelectItem>
                      <SelectItem value="idiomas">Idiomas</SelectItem>
                      <SelectItem value="salud">Salud</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <Select defaultValue="todos">
                    <SelectTrigger>
                      <SelectValue placeholder="Modalidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas las modalidades</SelectItem>
                      <SelectItem value="virtual">Virtual</SelectItem>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="hibrido">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <Select defaultValue="activo">
                    <SelectTrigger>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los estados</SelectItem>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                      <SelectItem value="proximamente">Próximamente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <Input placeholder="Buscar curso..." />
                </div>
              </div>

              {/* Tabla de cursos */}
              <div className="overflow-x-auto mb-8">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Nombre</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Categoría</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Duración</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Modalidad</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Precio</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Inscritos</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Próximo Inicio</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Estado</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cursosData.map((curso) => (
                      <tr key={curso.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-blue-600">{curso.nombre}</td>
                        <td className="py-3 px-4">{curso.categoria}</td>
                        <td className="py-3 px-4">{curso.duracion}</td>
                        <td className="py-3 px-4">{curso.modalidad}</td>
                        <td className="py-3 px-4 font-medium">{curso.precio}</td>
                        <td className="py-3 px-4">{curso.inscritos}</td>
                        <td className="py-3 px-4">{curso.proximoInicio}</td>
                        <td className="py-3 px-4">
                          <Badge className="bg-green-600">Activo</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                              <DropdownMenuItem>Editar curso</DropdownMenuItem>
                              <DropdownMenuItem>Ver estudiantes</DropdownMenuItem>
                              <DropdownMenuItem>Programar sesiones</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">Desactivar</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Estadísticas de cursos */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Total Cursos</h4>
                      <BookOpenIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold">24</p>
                    <p className="text-sm text-gray-500 mt-1">Activos en el sistema</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Estudiantes</h4>
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold">568</p>
                    <p className="text-sm text-gray-500 mt-1">Inscritos actualmente</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Próximos Inicios</h4>
                      <Calendar className="h-5 w-5 text-yellow-600" />
                    </div>
                    <p className="text-3xl font-bold">8</p>
                    <p className="text-sm text-gray-500 mt-1">En los próximos 30 días</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Ingresos</h4>
                      <BarChart2 className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-3xl font-bold">Q1.2M</p>
                    <p className="text-sm text-gray-500 mt-1">Total generado</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Contenido de la pestaña Configuración */}
          <TabsContent value="configuracion">
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-bold mb-6">Configuración del Sistema</h3>

              {/* Gestión de Usuarios */}
              <div className="mb-8">
                <h4 className="text-lg font-medium mb-4">Gestión de Usuarios</h4>

                <div className="flex gap-2 mb-6">
                  <Button variant="default" className="bg-black hover:bg-gray-800">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Agregar Nuevo Usuario
                  </Button>
                  <Button variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    Gestionar Roles y Permisos
                  </Button>
                </div>
              </div>

              {/* Configuración de Seguimiento */}
              <div className="mb-8 border-t pt-6">
                <h4 className="text-lg font-medium mb-4">Configuración de Seguimiento</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h5 className="font-medium mb-3">Estatus por Colores</h5>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-green-500"></div>
                        <p>Interesado</p>
                        <Input defaultValue="#10B981" className="w-32 ml-auto" />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
                        <p>En seguimiento</p>
                        <Input defaultValue="#F59E0B" className="w-32 ml-auto" />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                        <p>Inscrito</p>
                        <Input defaultValue="#3B82F6" className="w-32 ml-auto" />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-red-500"></div>
                        <p>No interesado</p>
                        <Input defaultValue="#EF4444" className="w-32 ml-auto" />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-gray-500"></div>
                        <p>No contactar</p>
                        <Input defaultValue="#6B7280" className="w-32 ml-auto" />
                      </div>
                    </div>

                    <Button variant="default" className="mt-4 bg-black hover:bg-gray-800">
                      Guardar Colores
                    </Button>
                  </div>

                  <div>
                    <h5 className="font-medium mb-3">Tiempos de Alerta</h5>

                    <div className="space-y-4">
                      <div>
                        <p className="mb-2">Alerta Verde (días)</p>
                        <div className="flex items-center gap-2">
                          <Input type="number" defaultValue="1" className="w-20" />
                          <span>a</span>
                          <Input type="number" defaultValue="4" className="w-20" />
                        </div>
                      </div>

                      <div>
                        <p className="mb-2">Alerta Amarilla (días)</p>
                        <div className="flex items-center gap-2">
                          <Input type="number" defaultValue="5" className="w-20" />
                          <span>a</span>
                          <Input type="number" defaultValue="6" className="w-20" />
                        </div>
                      </div>

                      <div>
                        <p className="mb-2">Alerta Roja (días)</p>
                        <div className="flex items-center gap-2">
                          <Input type="number" defaultValue="7" className="w-20" />
                          <span>o más</span>
                        </div>
                      </div>
                    </div>

                    <Button variant="default" className="mt-4 bg-black hover:bg-gray-800">
                      Guardar Tiempos
                    </Button>
                  </div>
                </div>
              </div>

              {/* Notificaciones y Alertas */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-medium mb-4">Notificaciones y Alertas</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h5 className="font-medium mb-3">Notificaciones Automáticas</h5>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Checkbox id="notif1" defaultChecked />
                        <label htmlFor="notif1">Notificaciones semanales de seguimiento</label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox id="notif2" defaultChecked />
                        <label htmlFor="notif2">Notificaciones de asignación de asesorías</label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox id="notif3" defaultChecked />
                        <label htmlFor="notif3">Alertar al supervisor cuando un lead no recibe seguimiento</label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox id="notif4" defaultChecked />
                        <label htmlFor="notif4">Enviar reporte de actividad diaria</label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-3">Canales de Notificación</h5>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Checkbox id="canal1" defaultChecked />
                        <label htmlFor="canal1">Correo electrónico</label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox id="canal2" defaultChecked />
                        <label htmlFor="canal2">Notificaciones en el sistema</label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox id="canal3" />
                        <label htmlFor="canal3">SMS (requiere configuración adicional)</label>
                      </div>
                    </div>

                    <div>
                      <p className="mb-2">Hora de envío de reportes diarios</p>
                      <Input type="time" defaultValue="18:00" className="w-32" />
                    </div>
                  </div>
                </div>

                <Button variant="default" className="bg-black hover:bg-gray-800">
                  <Bell className="h-4 w-4 mr-2" />
                  Guardar Configuración de Notificaciones
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

