"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Upload, Wand2, Search, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

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

export default function GestionLeads() {
  const [leads, setLeads] = useState<Lead[]>(leadsIniciales)
  const [searchTerm, setSearchTerm] = useState("")

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

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Panel de Administración</h1>

      {/* Tabs de navegación */}
      <Tabs defaultValue="leads" className="mb-6">
        <TabsList className="w-full grid grid-cols-8 h-auto">
          <TabsTrigger value="leads" className="py-3 data-[state=active]:bg-gray-100">
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
          <TabsTrigger value="configuracion" className="py-3">
            Configuración
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Gestión de Leads</h2>

        {/* Barra de búsqueda y acciones */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar leads..."
              className="w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
      </div>
    </div>
  )
}

