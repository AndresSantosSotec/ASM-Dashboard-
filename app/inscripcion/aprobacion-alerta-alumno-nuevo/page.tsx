"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { API_BASE_URL } from "@/utils/apiConfig"
import Swal from "sweetalert2"
import { CheckCircle, Clock, User, Calendar, GraduationCap, Eye, XCircle, ArrowLeft, Loader2 } from "lucide-react"

interface Alerta {
  id: number
  id_prospecto: number
  id_asesor: number
  estado: string
  fecha_creacion: string
  fecha_limite: string
  dias_restantes: number | null
  asesor: {
    first_name: string
    last_name: string
    email: string
  }
}

interface Prospecto {
  id: number
  nombre_completo: string
  carnet: string | null
  correo_electronico: string
  telefono: string
  status: string
  alerta: Alerta | null
  programas?: Array<{
    programa: {
      nombre: string
      abreviatura: string
    }
    cuota_mensual: number
    inscripcion: number
    duracion_meses: number
  }>
}

export default function AprobacionAlertaAlumnoNuevoPage() {
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>("todas")
  const [selectedProspecto, setSelectedProspecto] = useState<Prospecto | null>(null)
  const [isModalOpen, setModalOpen] = useState(false)
  const [processingId, setProcessingId] = useState<number | null>(null)

  useEffect(() => {
    cargarPendientes()
  }, [])

  const cargarPendientes = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/api/alerta-alumno-nuevo/pendientes-aprobacion`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error("Error al cargar prospectos pendientes")

      const data = await res.json()
      
      // Filtrar prospectos válidos y con estructura correcta
      const prospectosValidos = (data.data || []).filter((p: any) => {
        // Validación nivel 1: Datos básicos
        if (!p || typeof p !== 'object') {
          console.error("❌ Elemento no es un objeto:", p)
          return false
        }
        
        if (!p.id || !p.nombre_completo) {
          console.error("❌ Prospecto sin ID o nombre:", p)
          return false
        }
        
        // Validación nivel 2: Estructura de alerta
        if (p.alerta) {
          if (typeof p.alerta !== 'object') {
            console.error("❌ Alerta no es objeto:", p.alerta)
            p.alerta = null
          } else if (!p.alerta.asesor || typeof p.alerta.asesor !== 'object') {
            console.warn("⚠️ Alerta sin asesor válido:", p.alerta)
            p.alerta.asesor = { first_name: 'N/A', last_name: '', email: '' }
          }
        }
        
        // Validación nivel 3: Estructura de programas (CRÍTICO)
        if (p.programas && Array.isArray(p.programas)) {
          p.programas = p.programas.filter((prog: any) => {
            if (!prog || typeof prog !== 'object') {
              console.error("❌ Programa no es objeto:", prog)
              return false
            }
            
            // VALIDACIÓN CRÍTICA: programa debe existir y ser objeto
            if (!prog.programa || typeof prog.programa !== 'object') {
              console.error("❌ CRÍTICO: programa.programa no existe o no es objeto:", prog)
              console.error("   Prospecto ID:", p.id, "Nombre:", p.nombre_completo)
              console.error("   Estructura recibida:", JSON.stringify(prog, null, 2))
              return false
            }
            
            // Validar que tenga al menos nombre o abreviatura
            if (!prog.programa.nombre && !prog.programa.abreviatura) {
              console.warn("⚠️ Programa sin nombre ni abreviatura:", prog.programa)
              prog.programa.nombre = 'Programa sin nombre'
            }
            
            return true
          })
          
          // Si no quedó ningún programa válido, advertir
          if (p.programas.length === 0) {
            console.warn("⚠️ Prospecto sin programas válidos:", p.id, p.nombre_completo)
          }
        } else if (p.programas) {
          console.error("❌ programas no es array:", p.programas)
          p.programas = []
        }
        
        return true
      })
      
      setProspectos(prospectosValidos)
      
      if (prospectosValidos.length !== (data.data || []).length) {
        console.warn(`Se filtraron ${(data.data || []).length - prospectosValidos.length} prospectos inválidos`)
      }
    } catch (err) {
      console.error("Error:", err)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los prospectos pendientes",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetalle = (prospecto: Prospecto) => {
    setSelectedProspecto(prospecto)
    setModalOpen(true)
  }

  const handleAprobar = async (alerta: Alerta, prospectoId: number) => {
    const { value: comentarios } = await Swal.fire({
      title: "Aprobar Alerta de Alumno Nuevo",
      html: `
        <p class="mb-4">¿Confirmas que deseas aprobar esta alerta?</p>
        <p class="text-sm text-gray-600">El prospecto pasará al módulo de Generación de Credenciales.</p>
      `,
      input: "textarea",
      inputLabel: "Comentarios (opcional)",
      inputPlaceholder: "Agrega comentarios sobre la aprobación...",
      showCancelButton: true,
      confirmButtonText: "Aprobar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#059669",
    })

    if (comentarios === undefined) return // Usuario canceló

    setProcessingId(prospectoId)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/api/alerta-alumno-nuevo/${alerta.id}/aprobar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comentarios: comentarios || null }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.message || "Error al aprobar")

      await Swal.fire({
        icon: "success",
        title: "¡Aprobado!",
        text: "La alerta ha sido aprobada. El prospecto puede proceder a generar credenciales.",
        timer: 2000,
        showConfirmButton: false,
      })

      cargarPendientes()
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo aprobar la alerta",
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleSolicitarCorreccion = async (alerta: Alerta, prospectoId: number) => {
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

    setProcessingId(prospectoId)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/api/alerta-alumno-nuevo/${alerta.id}/rechazar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comentarios: comentario }),
      })

      if (!res.ok) throw new Error("Error al solicitar corrección")

      Swal.fire({
        icon: "info",
        title: "Corrección solicitada",
        text: "La alerta ha sido rechazada y se notificará al asesor",
        timer: 2000,
        showConfirmButton: false,
      })

      cargarPendientes()
    } catch (err) {
      console.error("Error:", err)
      Swal.fire("Error", "No se pudo solicitar la corrección", "error")
    } finally {
      setProcessingId(null)
    }
  }

  const handleRetroceder = async (prospectoId: number, estadoDestino: string) => {
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

    setProcessingId(prospectoId)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/prospectos/${prospectoId}/retroceder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          estado_destino: estadoDestino,
          comentario 
        }),
      })
      if (!res.ok) throw new Error("Error al retroceder")
      
      Swal.fire({ 
        icon: "info", 
        title: "Ficha retrocedida", 
        text: `Estado cambiado a: ${estadoDestino}`,
        timer: 2000, 
        showConfirmButton: false 
      })
      
      cargarPendientes()
    } catch (err) {
      console.error("Error:", err)
      Swal.fire("Error", "No se pudo retroceder la ficha", "error")
    } finally {
      setProcessingId(null)
    }
  }

  const filteredProspectos = prospectos.filter(p => {
    // Validar que el prospecto tenga los datos mínimos necesarios
    if (!p || !p.id || !p.nombre_completo) return false
    
    const term = searchTerm.toLowerCase()
    const matchSearch = 
      p.nombre_completo.toLowerCase().includes(term) ||
      p.correo_electronico?.toLowerCase().includes(term) ||
      p.id.toString().includes(term) ||
      (p.carnet && p.carnet.toLowerCase().includes(term))
    
    // Por ahora todos tienen prioridad media, pero preparado para futuro
    const matchPrioridad = filtroPrioridad === "todas" || filtroPrioridad === "media"
    
    return matchSearch && matchPrioridad
  })

  const getBadgeForDiasRestantes = (dias: number | null) => {
    if (dias === null) return null
    if (dias <= 3) return <Badge className="bg-red-100 text-red-800">Urgente - {dias} días</Badge>
    if (dias <= 5) return <Badge className="bg-yellow-100 text-yellow-800">{dias} días</Badge>
    return <Badge className="bg-blue-100 text-blue-800">{dias} días</Badge>
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <Label>Buscar</Label>
          <Input
            placeholder="Nombre, correo, carnet o ID"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Label>Prioridad</Label>
          <Select value={filtroPrioridad} onValueChange={setFiltroPrioridad}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="baja">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Card principal */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Aprobación Alerta Alumno Nuevo</CardTitle>
            <Badge className="bg-yellow-100 text-yellow-800">
              <Calendar className="mr-1 h-3 w-3" /> {filteredProspectos.length} Pendientes
            </Badge>
          </div>
          <CardDescription>
            Prospectos con plan de pagos generado, listos para aprobación y generación de credenciales
          </CardDescription>
        </CardHeader>

        <CardContent>
          {filteredProspectos.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              ✅ No hay alertas pendientes de aprobación
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Carnet</TableHead>
                  <TableHead>Programa</TableHead>
                  <TableHead>Asesor</TableHead>
                  <TableHead>Tiempo Restante</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProspectos.filter(p => p && p.id).map((prospecto) => (
                  <TableRow key={prospecto.id}>
                    <TableCell>{prospecto.id}</TableCell>
                    <TableCell>{prospecto.nombre_completo}</TableCell>
                    <TableCell>{prospecto.carnet || "Sin carnet"}</TableCell>
                    <TableCell>
                      {(() => {
                        const programa = prospecto.programas?.[0]?.programa
                        if (!programa || typeof programa !== 'object') return "N/A"
                        return programa.nombre || programa.abreviatura || "Sin nombre"
                      })()}
                    </TableCell>
                    <TableCell>
                      {prospecto.alerta?.asesor
                        ? `${prospecto.alerta.asesor.first_name} ${prospecto.alerta.asesor.last_name}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {prospecto.alerta && getBadgeForDiasRestantes(prospecto.alerta.dias_restantes)}
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <div className="flex gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewDetalle(prospecto)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver detalle completo</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => prospecto.alerta && handleAprobar(prospecto.alerta, prospecto.id)}
                                disabled={processingId === prospecto.id || !prospecto.alerta}
                              >
                                {processingId === prospecto.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Aprobar y enviar a credenciales</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => prospecto.alerta && handleSolicitarCorreccion(prospecto.alerta, prospecto.id)}
                                disabled={processingId === prospecto.id || !prospecto.alerta}
                              >
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Rechazar alerta</TooltipContent>
                          </Tooltip>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={processingId === prospecto.id}
                              >
                                <ArrowLeft className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => handleRetroceder(prospecto.id, "Pendiente de Aprobación Financiera")}
                              >
                                Retroceder a Aprobación Financiera
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRetroceder(prospecto.id, "Pendiente de Aprobación Académica")}
                              >
                                Retroceder a Aprobación Académica
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRetroceder(prospecto.id, "Pendiente de Aprobación")}
                              >
                                Retroceder a Pendiente de Aprobación
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
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {filteredProspectos.length} de {prospectos.length} alertas
          </div>
          <Button onClick={cargarPendientes} variant="outline" size="sm">
            Actualizar
          </Button>
        </CardFooter>
      </Card>

      {/* Modal de detalle - Simple por ahora */}
      {selectedProspecto && isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-auto">
            <CardHeader>
              <CardTitle>Detalle del Prospecto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre Completo</Label>
                  <p className="text-sm">{selectedProspecto.nombre_completo}</p>
                </div>
                <div>
                  <Label>Carnet</Label>
                  <p className="text-sm">{selectedProspecto.carnet || "Sin carnet"}</p>
                </div>
                <div>
                  <Label>Correo</Label>
                  <p className="text-sm">{selectedProspecto.correo_electronico}</p>
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <p className="text-sm">{selectedProspecto.telefono || "N/A"}</p>
                </div>
              </div>

              {selectedProspecto.programas?.[0]?.programa && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Información del Programa</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Programa</Label>
                      <p className="text-sm">
                        {selectedProspecto.programas[0].programa.nombre || 
                         selectedProspecto.programas[0].programa.abreviatura || 
                         "Sin nombre"}
                      </p>
                    </div>
                    <div>
                      <Label>Duración</Label>
                      <p className="text-sm">{selectedProspecto.programas[0].duracion_meses} meses</p>
                    </div>
                    <div>
                      <Label>Inscripción</Label>
                      <p className="text-sm">Q{selectedProspecto.programas[0].inscripcion}</p>
                    </div>
                    <div>
                      <Label>Cuota Mensual</Label>
                      <p className="text-sm">Q{selectedProspecto.programas[0].cuota_mensual}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedProspecto.alerta && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Información de la Alerta</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Creado por</Label>
                      <p className="text-sm">
                        {selectedProspecto.alerta?.asesor
                          ? `${selectedProspecto.alerta.asesor.first_name} ${selectedProspecto.alerta.asesor.last_name}`
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label>Fecha de Creación</Label>
                      <p className="text-sm">
                        {selectedProspecto.alerta?.fecha_creacion
                          ? new Date(selectedProspecto.alerta.fecha_creacion).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label>Fecha Límite</Label>
                      <p className="text-sm">
                        {selectedProspecto.alerta?.fecha_limite
                          ? new Date(selectedProspecto.alerta.fecha_limite).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label>Días Restantes</Label>
                      <p className="text-sm font-semibold">
                        {selectedProspecto.alerta.dias_restantes !== null
                          ? `${selectedProspecto.alerta.dias_restantes} días`
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cerrar
              </Button>
              {selectedProspecto.alerta && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setModalOpen(false)
                      handleSolicitarCorreccion(selectedProspecto.alerta!, selectedProspecto.id)
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Rechazar
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setModalOpen(false)
                      handleAprobar(selectedProspecto.alerta!, selectedProspecto.id)
                    }}
                    disabled={processingId === selectedProspecto.id}
                  >
                    {processingId === selectedProspecto.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Aprobar
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}
