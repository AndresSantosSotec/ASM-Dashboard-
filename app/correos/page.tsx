"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Mail } from "lucide-react"
import { API_BASE_URL } from "@/utils/apiConfig"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import Swal from "sweetalert2"  // Importa SweetAlert2

// Interfaz para prospecto (ajustable a tus campos)
interface Prospecto {
  id: string
  nombre: string
  email: string
  telefono: string
  departamento: string
  estado: string
  ultimoCambio: string
}

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

export default function GestionProspectosEmail() {
  // Estados para manejo de prospectos obtenidos de la API
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")

  // Estados para filtros de búsqueda y estado
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [estadoFilter, setEstadoFilter] = useState<string>("todos")

  // Estados para el envío de correo individual o masivo
  const [selectedProspecto, setSelectedProspecto] = useState<Prospecto | null>(null)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [emailData, setEmailData] = useState({
    para: "",
    asunto: "",
    mensaje: "",
  })
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  // Flag para saber si se está enviando correo masivo
  const [isBulkEmail, setIsBulkEmail] = useState(false)
  // Estados para selección múltiple en el data table
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Estados para la paginación
  const [pageSize, setPageSize] = useState<string>("5")
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Fetch de prospectos (usar token almacenado en localStorage)
  useEffect(() => {
    const fetchProspectos = async () => {
      setLoading(true)
      setError("")
      try {
        const token = localStorage.getItem("token")
        const url = `${API_BASE_URL}/api/prospectos`
        const res = await fetch(url, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        if (!res.ok) {
          throw new Error(`Error al obtener prospectos: status ${res.status}`)
        }
        const json = await res.json()
        // Mapear los datos obtenidos al modelo de prospecto
        const prospectosTransformados = json.data.map((item: any) => ({
          id: String(item.id),
          nombre: item.nombre_completo,
          email: item.correo_electronico,
          telefono: item.telefono,
          departamento: item.empresa_donde_labora_actualmente ?? "Sin Departamento",
          estado: item.status || "No contactado",
          ultimoCambio: item.updated_at ?? "N/A",
        }))
        setProspectos(prospectosTransformados)
      } catch (err: any) {
        console.error("Error al obtener prospectos:", err)
        setError(err.message || "Error inesperado")
      } finally {
        setLoading(false)
      }
    }
    fetchProspectos()
  }, [])

  // Filtrado de prospectos según búsqueda y filtro de estado
  const filteredProspectos = useMemo(() => {
    return prospectos.filter((p) => {
      const matchesSearch =
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.telefono.toLowerCase().includes(searchTerm)
      const matchesEstado =
        estadoFilter === "todos"
          ? true
          : p.estado.toLowerCase() === estadoFilter.toLowerCase()
      return matchesSearch && matchesEstado
    })
  }, [prospectos, searchTerm, estadoFilter])

  // Paginación
  const paginatedProspectos = useMemo(() => {
    if (pageSize === "all") return filteredProspectos
    const size = Number(pageSize)
    const startIndex = (currentPage - 1) * size
    const endIndex = startIndex + size
    return filteredProspectos.slice(startIndex, endIndex)
  }, [filteredProspectos, currentPage, pageSize])

  const totalPages = useMemo(() => {
    if (pageSize === "all") return 1
    return Math.ceil(filteredProspectos.length / Number(pageSize))
  }, [filteredProspectos, pageSize])

  // Selección múltiple de prospectos
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredProspectos.map((p) => p.id))
    } else {
      setSelectedIds([])
    }
  }
  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id))
    }
  }

  // Envío individual: asignar el correo del prospecto y abrir el modal
  const handleSelectProspecto = (prospecto: Prospecto) => {
    setIsBulkEmail(false)
    setSelectedProspecto(prospecto)
    setEmailData({
      para: prospecto.email,
      asunto: "",
      mensaje: "",
    })
    setSelectedTemplate(null)
    setEmailModalOpen(true)
  }

  // Envío masivo: concatenar emails y abrir el modal
  const handleBulkEmail = () => {
    if (selectedIds.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Atención",
        text: "Seleccione al menos un prospecto para envío masivo.",
      })
      return
    }
    const recipients = prospectos.filter((p) => selectedIds.includes(p.id))
    const emails = recipients.map((p) => p.email).join(", ")
    setIsBulkEmail(true)
    setSelectedProspecto(null)
    setEmailData({
      para: emails,
      asunto: "",
      mensaje: "",
    })
    setSelectedTemplate(null)
    setEmailModalOpen(true)
  }

  // Aplicar plantilla: en envíos individuales se reemplaza "[nombre]"
  const applyTemplate = (templateId: number) => {
    const template = plantillasCorreo.find((t) => t.id === templateId)
    if (template) {
      setEmailData((prevData) => ({
        para: prevData.para,
        asunto: template.asunto,
        mensaje: isBulkEmail
          ? template.cuerpo
          : template.cuerpo.replace("[nombre]", selectedProspecto?.nombre || ""),
      }))
      setSelectedTemplate(templateId)
    }
  }

  // Envío de correo: envía los datos al backend
  const handleSendEmail = async () => {
    try {
      const requestBody = {
        para: emailData.para,
        asunto: emailData.asunto,
        mensaje: emailData.mensaje,
      }

      const response = await fetch(`${API_BASE_URL}/api/enviar-correo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Status ${response.status}. ${errorText}`)
      }

      const result = await response.json()
      console.log("Correo enviado:", result)
      Swal.fire({
        icon: "success",
        title: "¡Correo enviado!",
        text: isBulkEmail
          ? `Correo masivo enviado a: ${emailData.para}`
          : `Correo enviado exitosamente a ${selectedProspecto?.nombre}`,
        timer: 3000,
      })

      // Reiniciar estados
      setEmailModalOpen(false)
      setSelectedProspecto(null)
      setSelectedTemplate(null)
      if (isBulkEmail) {
        setIsBulkEmail(false)
        setSelectedIds([])
      }
    } catch (error: any) {
      console.error("Error al enviar correo:", error)
      Swal.fire({
        icon: "error",
        title: "Error al enviar correo",
        text: error.message || "Ocurrió un error inesperado.",
        footer: `<pre>${error.stack || ""}</pre>`,
        width: "600px",
      })
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-4">Gestión de Prospectos y Envío de Correo</h1>

      {/* Filtros y botón para envío masivo */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
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
        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="No contactado">No contactado</SelectItem>
            <SelectItem value="En seguimiento">En seguimiento</SelectItem>
            <SelectItem value="Le interesa a futuro">Le interesa a futuro</SelectItem>
            <SelectItem value="Inscrito">Inscrito</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="default" onClick={handleBulkEmail}>
          Enviar correo masivo
        </Button>
      </div>

      {loading && <p>Cargando prospectos...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Tabla de prospectos */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={filteredProspectos.length > 0 && selectedIds.length === filteredProspectos.length}
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                />
              </TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProspectos.length > 0 ? (
              paginatedProspectos.map((prospecto) => (
                <TableRow key={prospecto.id}>
                  <TableCell className="w-10">
                    <Checkbox
                      checked={selectedIds.includes(prospecto.id)}
                      onCheckedChange={(checked) => handleSelectOne(prospecto.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{prospecto.nombre}</TableCell>
                  <TableCell>{prospecto.email}</TableCell>
                  <TableCell>{prospecto.telefono}</TableCell>
                  <TableCell>{prospecto.departamento}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        prospecto.estado.toLowerCase() === "no contactado"
                          ? "bg-gray-100 text-gray-800 border-gray-200"
                          : prospecto.estado.toLowerCase() === "en seguimiento"
                          ? "bg-blue-100 text-blue-800 border-blue-200"
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
                <TableCell colSpan={7} className="h-24 text-center">
                  No se encontraron prospectos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {pageSize !== "all" && (
        <div className="flex items-center justify-end gap-2 p-4">
          <Select
            value={pageSize}
            onValueChange={(value) => {
              setPageSize(value)
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Paginación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-600">Página {currentPage} de {totalPages}</span>
          <Button
            variant="outline"
            onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Modal de envío de correo */}
      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isBulkEmail ? "Enviar correo masivo" : "Enviar correo electrónico"}
            </DialogTitle>
            <DialogDescription>
              {isBulkEmail ? (
                <span>Enviar correo a los prospectos seleccionados</span>
              ) : (
                selectedProspecto && (
                  <span>
                    Enviar correo a <strong>{selectedProspecto.nombre}</strong>
                  </span>
                )
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">Plantilla</label>
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

            <div>
              <label className="block text-sm font-medium mb-1">Para:</label>
              <Input
                value={emailData.para}
                onChange={(e) => setEmailData({ ...emailData, para: e.target.value })}
                readOnly={!isBulkEmail}  // Editable solo en envío masivo
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Asunto:</label>
              <Input
                value={emailData.asunto}
                onChange={(e) => setEmailData({ ...emailData, asunto: e.target.value })}
                placeholder="Ingrese el asunto del correo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mensaje:</label>
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
