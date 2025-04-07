"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Mail } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Tipos de datos
interface Prospecto {
  id: number
  nombre: string
  email: string
  telefono: string
  departamento: string
  estado: "Nuevo" | "En proceso" | "Contactado" | "Calificado"
}

// Datos de ejemplo
const prospectos: Prospecto[] = [
  {
    id: 1,
    nombre: "Juan Pérez",
    email: "juan.perez@example.com",
    telefono: "12345678",
    departamento: "Guatemala",
    estado: "Nuevo",
  },
  {
    id: 2,
    nombre: "María García",
    email: "maria.garcia@example.com",
    telefono: "55551234",
    departamento: "Quetzaltenango",
    estado: "En proceso",
  },
  {
    id: 3,
    nombre: "Carlos López",
    email: "carlos.lopez@example.com",
    telefono: "33334444",
    departamento: "Escuintla",
    estado: "Contactado",
  },
  {
    id: 4,
    nombre: "Ana Martínez",
    email: "ana.martinez@example.com",
    telefono: "77778888",
    departamento: "Sacatepéquez",
    estado: "Calificado",
  },
  {
    id: 5,
    nombre: "Roberto Gómez",
    email: "roberto.gomez@example.com",
    telefono: "99991111",
    departamento: "Petén",
    estado: "Nuevo",
  },
  {
    id: 6,
    nombre: "Laura Sánchez",
    email: "laura.sanchez@example.com",
    telefono: "44442222",
    departamento: "Izabal",
    estado: "En proceso",
  },
]

// Plantillas de correo predefinidas
const plantillasCorreo = [
  {
    id: 1,
    nombre: "Bienvenida",
    asunto: "Bienvenido a American School of Management",
    cuerpo:
      "Estimado/a [nombre],\n\nEs un placer darle la bienvenida a American School of Management. Estamos emocionados de tenerle como parte de nuestra comunidad educativa...\n\nSaludos cordiales,\nEquipo ASM",
  },
  {
    id: 2,
    nombre: "Seguimiento",
    asunto: "Seguimiento a su interés en nuestros programas",
    cuerpo:
      "Estimado/a [nombre],\n\nEsperamos que se encuentre bien. Nos comunicamos para dar seguimiento a su interés en nuestros programas académicos...\n\nQuedamos atentos,\nEquipo ASM",
  },
  {
    id: 3,
    nombre: "Información de matrícula",
    asunto: "Información sobre proceso de matrícula",
    cuerpo:
      "Estimado/a [nombre],\n\nA continuación le compartimos la información detallada sobre nuestro proceso de matrícula...\n\nSaludos cordiales,\nEquipo ASM",
  },
]

export default function EmailSystem() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProspecto, setSelectedProspecto] = useState<Prospecto | null>(null)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [emailData, setEmailData] = useState({
    para: "",
    asunto: "",
    mensaje: "",
  })
  const [selectedFilter, setSelectedFilter] = useState("todos")
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)

  // Filtrar prospectos por término de búsqueda y filtro seleccionado
  const filteredProspectos = prospectos.filter((prospecto) => {
    const matchesSearch =
      prospecto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospecto.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospecto.telefono.includes(searchTerm)

    if (selectedFilter === "todos") return matchesSearch
    return matchesSearch && prospecto.estado.toLowerCase() === selectedFilter.toLowerCase()
  })

  // Manejar la selección de un prospecto
  const handleSelectProspecto = (prospecto: Prospecto) => {
    setSelectedProspecto(prospecto)
    setEmailData({
      para: prospecto.email,
      asunto: "",
      mensaje: "",
    })
    setEmailModalOpen(true)
  }

  // Aplicar plantilla de correo
  const applyTemplate = (templateId: number) => {
    const template = plantillasCorreo.find((t) => t.id === templateId)
    if (template && selectedProspecto) {
      setEmailData({
        para: selectedProspecto.email,
        asunto: template.asunto,
        mensaje: template.cuerpo.replace("[nombre]", selectedProspecto.nombre),
      })
      setSelectedTemplate(templateId)
    }
  }

  // Enviar correo (simulado)
  const handleSendEmail = () => {
    // Aquí iría la lógica para enviar el correo
    console.log("Enviando correo:", emailData)
    // Mostrar mensaje de éxito
    alert(`Correo enviado exitosamente a ${selectedProspecto?.nombre}`)
    // Cerrar modal
    setEmailModalOpen(false)
    setSelectedProspecto(null)
    setSelectedTemplate(null)
  }

  return (
    <div className="container mx-auto py-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="bg-[#1e3a8a] text-white rounded-t-lg">
          <CardTitle className="text-2xl">Sistema de Comunicación</CardTitle>
          <CardDescription className="text-gray-200">
            Gestione la comunicación con sus prospectos y estudiantes
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="prospectos" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="prospectos">Prospectos</TabsTrigger>
              <TabsTrigger value="estudiantes">Estudiantes</TabsTrigger>
              <TabsTrigger value="plantillas">Plantillas</TabsTrigger>
            </TabsList>

            <TabsContent value="prospectos" className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Buscar por nombre, email o teléfono..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="nuevo">Nuevo</SelectItem>
                    <SelectItem value="en proceso">En proceso</SelectItem>
                    <SelectItem value="contactado">Contactado</SelectItem>
                    <SelectItem value="calificado">Calificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProspectos.length > 0 ? (
                      filteredProspectos.map((prospecto) => (
                        <TableRow key={prospecto.id}>
                          <TableCell className="font-medium">{prospecto.nombre}</TableCell>
                          <TableCell>{prospecto.email}</TableCell>
                          <TableCell>{prospecto.telefono}</TableCell>
                          <TableCell>{prospecto.departamento}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                prospecto.estado === "Nuevo"
                                  ? "bg-blue-100 text-blue-800 border-blue-200"
                                  : prospecto.estado === "En proceso"
                                    ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                    : prospecto.estado === "Contactado"
                                      ? "bg-purple-100 text-purple-800 border-purple-200"
                                      : "bg-green-100 text-green-800 border-green-200"
                              }
                            >
                              {prospecto.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-[#1e3a8a] hover:bg-[#152b67]"
                              onClick={() => handleSelectProspecto(prospecto)}
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              Enviar correo
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No se encontraron resultados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="estudiantes">
              <div className="flex items-center justify-center h-40 border rounded-md bg-gray-50">
                <p className="text-gray-500">Módulo de estudiantes en desarrollo</p>
              </div>
            </TabsContent>

            <TabsContent value="plantillas">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plantillasCorreo.map((plantilla) => (
                  <Card key={plantilla.id} className="overflow-hidden">
                    <CardHeader className="bg-gray-50 p-4">
                      <CardTitle className="text-lg">{plantilla.nombre}</CardTitle>
                      <CardDescription className="line-clamp-1">{plantilla.asunto}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 line-clamp-3">{plantilla.cuerpo}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal de envío de correo */}
      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Enviar correo electrónico</DialogTitle>
            <DialogDescription>
              {selectedProspecto && (
                <span>
                  Enviar correo a <strong>{selectedProspecto.nombre}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Plantillas</label>
                <Select
                  value={selectedTemplate?.toString() || ""}
                  onValueChange={(value) => applyTemplate(Number.parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar plantilla" />
                  </SelectTrigger>
                  <SelectContent>
                    {plantillasCorreo.map((plantilla) => (
                      <SelectItem key={plantilla.id} value={plantilla.id.toString()}>
                        {plantilla.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Para:</label>
              <Input
                value={emailData.para}
                onChange={(e) => setEmailData({ ...emailData, para: e.target.value })}
                readOnly
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Asunto:</label>
              <Input
                value={emailData.asunto}
                onChange={(e) => setEmailData({ ...emailData, asunto: e.target.value })}
                placeholder="Ingrese el asunto del correo"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mensaje:</label>
              <Textarea
                value={emailData.mensaje}
                onChange={(e) => setEmailData({ ...emailData, mensaje: e.target.value })}
                placeholder="Escriba su mensaje aquí..."
                className="min-h-[200px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendEmail} className="bg-[#1e3a8a] hover:bg-[#152b67]">
              Enviar correo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

