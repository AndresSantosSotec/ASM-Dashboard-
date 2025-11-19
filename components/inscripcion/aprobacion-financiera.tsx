// components/inscripcion/aprobacion-financiera.tsx
"use client"

import React, { useState, useEffect } from "react"
import Swal from "sweetalert2"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Eye, CheckCircle, XCircle, Calendar, Loader2, Download, ArrowLeft } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { FichaEstudiante } from "@/components/inscripcion/types"
import { API_BASE_URL } from "@/utils/apiConfig"
import AprobacionFinancieraModal from "./modal/AprobacionFinancieraModal"

const API_URL = process.env.NEXT_PUBLIC_API_URL || API_BASE_URL

export function AprobacionFinanciera() {
  const [fichas, setFichas] = useState<FichaEstudiante[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>("todas")

  const [selectedFicha, setSelectedFicha] = useState<FichaEstudiante | null>(null)
  const [isModalOpen, setModalOpen] = useState(false)
  const [processingId, setProcessingId] = useState<number | null>(null)

  useEffect(() => {
    async function fetchFichas() {
      try {
        const res = await fetch(
          `${API_URL}/prospectos/fichas/pendientes-financiera`,
          { headers: { Accept: "application/json" } }
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const { data } = await res.json()
        const mapped: FichaEstudiante[] = data.map((raw: any) => ({
          id: raw.id,
          nombre: raw.nombre_completo,
          telefono: raw.telefono,
          correo: raw.correo,
          departamento: raw.departamento,
          programa: raw.nombre_programa,
          fecha: raw.created_at?.split("T")[0] ?? "",
          estado: raw.status,
          prioridad: (raw.prioridad as "alta" | "media" | "baja") || "media",
          ultimaActualizacion: raw.updated_at ?? "",
          documentos: [],
        }))
        setFichas(mapped)
      } catch (err) {
        console.error("Error cargando fichas financieras:", err)
        Swal.fire("Error", "No se pudieron cargar las fichas pendientes de aprobación financiera", "error")
      }
    }
    fetchFichas()
  }, [])

  const handleViewDetalle = async (f: FichaEstudiante) => {
    setSelectedFicha(f)
    setModalOpen(true)
  }

  const handleAprobar = async (id: number) => {
    const result = await Swal.fire({
      title: "¿Aprobar financiamiento?",
      text: "Esta acción cambiará el estado a 'Pendiente de Aprobación Académica'",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, aprobar",
      cancelButtonText: "Cancelar",
    })

    if (!result.isConfirmed) return

    setProcessingId(id)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/prospectos/${id}/aprobar-financiero`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      
      setFichas(prev => prev.filter(f => f.id !== id))
      await Swal.fire({
        icon: "success",
        title: "Financiamiento aprobado",
        text: "La ficha ha sido enviada a Aprobación Académica",
        timer: 2000,
        showConfirmButton: false,
      })
    } catch (err) {
      console.error("Error al aprobar financiero", err)
      Swal.fire("Error", "No se pudo aprobar el financiamiento", "error")
    } finally {
      setProcessingId(null)
    }
  }

  const handleSolicitarCorreccion = async (id: number) => {
    const { value: comentario } = await Swal.fire({
      title: "Solicitar corrección",
      input: "textarea",
      inputLabel: "Comentario (obligatorio)",
      inputPlaceholder: "Describe las correcciones necesarias...",
      inputValidator: (value) => {
        if (!value || value.trim() === "") {
          return "Debes ingresar un comentario"
        }
      },
      showCancelButton: true,
      confirmButtonText: "Enviar",
      cancelButtonText: "Cancelar",
    })

    if (!comentario) return

    setProcessingId(id)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/prospectos/${id}/solicitar-correccion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ 
          comentario,
          estado_destino: "Pendiente de Aprobación"
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      
      setFichas(prev => prev.filter(f => f.id !== id))
      Swal.fire({ 
        icon: "info", 
        title: "Corrección solicitada", 
        text: "La ficha ha sido devuelta",
        timer: 2000, 
        showConfirmButton: false 
      })
    } catch (err) {
      console.error("Error al solicitar corrección", err)
      Swal.fire("Error", "No se pudo solicitar la corrección", "error")
    } finally {
      setProcessingId(null)
    }
  }

  const handleRetroceder = async (id: number, estadoDestino: string) => {
    const { value: comentario } = await Swal.fire({
      title: `Retroceder a: ${estadoDestino}`,
      input: "textarea",
      inputLabel: "Motivo del retroceso (obligatorio)",
      inputPlaceholder: "Explica por qué retrocedes esta ficha...",
      inputValidator: (value) => {
        if (!value || value.trim() === "") {
          return "Debes ingresar un motivo"
        }
      },
      showCancelButton: true,
      confirmButtonText: "Retroceder",
      cancelButtonText: "Cancelar",
    })

    if (!comentario) return

    setProcessingId(id)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/prospectos/${id}/retroceder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ 
          estado_destino: estadoDestino,
          comentario 
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      
      setFichas(prev => prev.filter(f => f.id !== id))
      Swal.fire({ 
        icon: "info", 
        title: "Ficha retrocedida", 
        text: `Estado cambiado a: ${estadoDestino}`,
        timer: 2000, 
        showConfirmButton: false 
      })
    } catch (err) {
      console.error("Error al retroceder ficha", err)
      Swal.fire("Error", "No se pudo retroceder la ficha", "error")
    } finally {
      setProcessingId(null)
    }
  }

  const filteredFichas = fichas.filter(f => {
    const term = searchTerm.toLowerCase()
    return (
      (f.nombre.toLowerCase().includes(term) ||
        f.programa.toLowerCase().includes(term) ||
        f.id.toString().includes(term)) &&
      (filtroPrioridad === "todas" || f.prioridad === filtroPrioridad)
    )
  })

  const getBadgeForPrioridad = (p?: string) => {
    switch (p) {
      case "alta":
        return <Badge className="bg-red-100 text-red-800">Alta</Badge>
      case "media":
        return <Badge className="bg-yellow-100 text-yellow-800">Media</Badge>
      case "baja":
        return <Badge className="bg-blue-100 text-blue-800">Baja</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <Label>Buscar</Label>
          <Input
            placeholder="Nombre, programa o ID"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Label>Prioridad</Label>
          <Select value={filtroPrioridad} onValueChange={setFiltroPrioridad}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="baja">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Aprobación Financiera</CardTitle>
            <Badge className="bg-blue-100 text-blue-800">
              <Calendar className="mr-1 h-3 w-3" /> {filteredFichas.length} Pendientes
            </Badge>
          </div>
          <CardDescription>
            Revisa y aprueba la información financiera de los estudiantes
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Programa</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Última Actualización</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFichas.map(f => (
                <TableRow key={f.id}>
                  <TableCell>{f.id}</TableCell>
                  <TableCell>{f.nombre}</TableCell>
                  <TableCell>{f.programa}</TableCell>
                  <TableCell>{f.fecha}</TableCell>
                  <TableCell>{getBadgeForPrioridad(f.prioridad)}</TableCell>
                  <TableCell>{f.ultimaActualizacion}</TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <div className="flex gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetalle(f)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ver ficha completa</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleAprobar(f.id)}
                              disabled={processingId === f.id}
                            >
                              {processingId === f.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Aprobar financiamiento</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSolicitarCorreccion(f.id)}
                              disabled={processingId === f.id}
                            >
                              <XCircle className="h-4 w-4 text-red-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Solicitar corrección</TooltipContent>
                        </Tooltip>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={processingId === f.id}
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => handleRetroceder(f.id, "Pendiente de Aprobación")}
                            >
                              Retroceder a Pendiente de Aprobación
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRetroceder(f.id, "Preinscripción")}
                            >
                              Retroceder a Preinscripción
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {filteredFichas.length} de {fichas.length} fichas
          </div>
        </CardFooter>
      </Card>

      {selectedFicha && (
        <AprobacionFinancieraModal
          isOpen={isModalOpen}
          onClose={() => {
            setModalOpen(false)
            setSelectedFicha(null)
          }}
          ficha={selectedFicha}
          onAprobar={() => selectedFicha && handleAprobar(selectedFicha.id)}
          onSolicitarCorreccion={() => selectedFicha && handleSolicitarCorreccion(selectedFicha.id)}
          onRetroceder={(estado) => selectedFicha && handleRetroceder(selectedFicha.id, estado)}
        />
      )}
    </div>
  )
}
