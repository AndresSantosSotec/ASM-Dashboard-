"use client"

import React, { useState, useEffect, useMemo } from "react"
import { toast } from "@/hooks/use-toast"
import { Search, Plus, Edit, Trash2, User, Mail, Phone, FileText, AlertCircle, ChevronDown, ChevronRight, Eye, CheckCircle2, Receipt, ChevronLeft } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { API_BASE_URL } from "@/utils/apiConfig"

const API_BASE = `${API_BASE_URL}/api`
const API_NOTAS = `${API_BASE}/notas-pago`

// Wrapper para fetch con autenticación
const safeFetch = async (input: RequestInfo, init?: RequestInit) => {
  const token = localStorage.getItem("token")
  try {
    const res = await fetch(input, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(init?.headers as any),
      },
    })

    if (!res.ok) {
      const txt = await res.text()
      throw new Error(`HTTP ${res.status}: ${txt}`)
    }

    return res
  } catch (err) {
    console.error("Fetch failed:", err)
    throw err
  }
}

interface NotaPago {
  id: number
  nomenclatura: string | null
  nota: string
  fecha: string
  fecha_formateada: string
}

interface EstudianteConNotas {
  carnet: string
  id: number | null
  nombre_completo: string
  correo_electronico: string | null
  telefono: string | null
  status: string | null
  programa: {
    nombre: string
    abreviatura: string
  } | null
  total_notas: number
  ultima_nota_fecha: string | null
  ultima_nota_preview: string | null
  ultima_nota_nomenclatura: string | null
  ultima_fecha_pago: string | null
  ultimo_monto_pago: number | null
  factura_emitida: boolean
  fecha_factura_emitida: string | null
}

interface EstudianteBusqueda {
  id: number
  carnet: string
  nombre_completo: string
  correo_electronico: string
  telefono: string
  status: string
  programa: string
  tiene_notas: boolean
  total_notas: number
}

export default function NotasPagoPage() {
  const [estudiantes, setEstudiantes] = useState<EstudianteConNotas[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [notasPorCarnet, setNotasPorCarnet] = useState<Record<string, NotaPago[]>>({})
  const [loadingNotas, setLoadingNotas] = useState<Set<string>>(new Set())
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage] = useState(50)
  const [pagination, setPagination] = useState<{
    current_page: number
    per_page: number
    total: number
    total_pages: number
    from: number
    to: number
  } | null>(null)
  
  // Estados para modal de crear/editar nota
  const [modalOpen, setModalOpen] = useState(false)
  const [editingNota, setEditingNota] = useState<NotaPago | null>(null)
  const [selectedCarnet, setSelectedCarnet] = useState<string | null>(null)
  const [notaText, setNotaText] = useState("")
  const [nomenclatura, setNomenclatura] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Estados para seleccionar estudiante en el modal
  const [selectedEstudianteModal, setSelectedEstudianteModal] = useState<EstudianteBusqueda | null>(null)
  const [searchQueryModal, setSearchQueryModal] = useState("")
  const [searchResultsModal, setSearchResultsModal] = useState<EstudianteBusqueda[]>([])
  const [searchingModal, setSearchingModal] = useState(false)

  // Estado para confirmación de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [notaToDelete, setNotaToDelete] = useState<{ nota: NotaPago; carnet: string } | null>(null)

  // Nomenclaturas predefinidas
  const nomenclaturas = [
    "Recordatorio",
    "Cobro especial",
    "Pago fraccionado",
    "Excepción",
    "Observación",
    "Seguimiento",
    "Urgente",
    "Otro"
  ]

  // Cargar lista de estudiantes con notas
  const loadEstudiantes = async (page: number = currentPage) => {
    setLoading(true)
    try {
      const r = await safeFetch(`${API_NOTAS}?page=${page}&per_page=${perPage}`)
      const json = await r.json()
      if (json.success) {
        setEstudiantes(json.data || [])
        if (json.pagination) {
          setPagination(json.pagination)
        }
      } else {
        throw new Error(json.message || "Error al cargar estudiantes")
      }
    } catch (err: any) {
      console.error("Error cargando estudiantes:", err)
      toast({
        title: "Error",
        description: "No se pudieron cargar los estudiantes: " + err.message,
        variant: "destructive",
      })
      setEstudiantes([])
    } finally {
      setLoading(false)
    }
  }

  // Cargar notas de un estudiante
  const loadNotas = async (carnet: string) => {
    if (notasPorCarnet[carnet]) {
      // Ya están cargadas
      return
    }

    setLoadingNotas(prev => new Set(prev).add(carnet))
    try {
      const r = await safeFetch(`${API_NOTAS}/${carnet}`)
      const json = await r.json()
      if (json.success) {
        setNotasPorCarnet(prev => ({
          ...prev,
          [carnet]: json.data.notas || []
        }))
      } else {
        throw new Error(json.message || "Error al cargar notas")
      }
    } catch (err: any) {
      console.error("Error cargando notas:", err)
      setNotasPorCarnet(prev => ({
        ...prev,
        [carnet]: []
      }))
    } finally {
      setLoadingNotas(prev => {
        const next = new Set(prev)
        next.delete(carnet)
        return next
      })
    }
  }

  // Toggle expandir fila
  const toggleExpand = async (carnet: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(carnet)) {
      newExpanded.delete(carnet)
    } else {
      newExpanded.add(carnet)
      await loadNotas(carnet)
    }
    setExpandedRows(newExpanded)
  }

  // Buscar estudiantes en el modal
  const handleSearchModal = async (query: string) => {
    if (query.length < 2) {
      setSearchResultsModal([])
      return
    }

    setSearchingModal(true)
    try {
      const r = await safeFetch(`${API_NOTAS}/search?q=${encodeURIComponent(query)}`)
      const json = await r.json()
      if (json.success) {
        setSearchResultsModal(json.data || [])
      } else {
        throw new Error(json.message || "Error en la búsqueda")
      }
    } catch (err: any) {
      console.error("Error buscando estudiantes:", err)
      setSearchResultsModal([])
    } finally {
      setSearchingModal(false)
    }
  }

  // Debounce para búsqueda en modal
  useEffect(() => {
    if (!modalOpen) return
    
    const timer = setTimeout(() => {
      if (searchQueryModal) {
        handleSearchModal(searchQueryModal)
      } else {
        setSearchResultsModal([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQueryModal, modalOpen])

  // Abrir modal para crear nota
  const openCreateModal = (carnet?: string) => {
    setEditingNota(null)
    setSelectedCarnet(carnet || null)
    setNotaText("")
    setNomenclatura(null)
    setSelectedEstudianteModal(null)
    setSearchQueryModal("")
    setSearchResultsModal([])
    setModalOpen(true)
  }

  // Abrir modal para editar nota
  const openEditModal = (nota: NotaPago, carnet: string) => {
    setEditingNota(nota)
    setSelectedCarnet(carnet)
    setNotaText(nota.nota)
    setNomenclatura(nota.nomenclatura || null)
    setModalOpen(true)
  }

  // Guardar nota (crear o editar)
  const handleSaveNota = async () => {
    if (!notaText.trim()) {
      toast({
        title: "Error",
        description: "La nota no puede estar vacía",
        variant: "destructive",
      })
      return
    }

    let carnetFinal: string | null = null

    if (editingNota) {
      // Editar: usar el carnet del estudiante seleccionado
      carnetFinal = selectedCarnet
    } else {
      // Crear: usar el carnet del modal o del estudiante seleccionado
      if (selectedCarnet) {
        carnetFinal = selectedCarnet
      } else if (selectedEstudianteModal) {
        carnetFinal = selectedEstudianteModal.carnet
      }
    }

    if (!carnetFinal) {
      toast({
        title: "Error",
        description: "Debes seleccionar un estudiante",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      if (editingNota) {
        // Editar nota existente
        const r = await safeFetch(`${API_NOTAS}/${editingNota.id}`, {
          method: "PUT",
          body: JSON.stringify({
            nota: notaText.trim(),
            nomenclatura: nomenclatura || null,
          }),
        })
        const json = await r.json()
        if (json.success) {
          toast({
            title: "Nota actualizada",
            description: "La nota se ha actualizado correctamente",
            variant: "default",
          })
          setModalOpen(false)
          // Recargar notas del estudiante
          await loadNotas(carnetFinal)
          // Recargar lista de estudiantes
          await loadEstudiantes(currentPage)
        } else {
          throw new Error(json.message || "Error al actualizar nota")
        }
      } else {
        // Crear nueva nota
        const r = await safeFetch(`${API_NOTAS}`, {
          method: "POST",
          body: JSON.stringify({
            carnet: carnetFinal,
            nota: notaText.trim(),
            nomenclatura: nomenclatura || null,
          }),
        })
        const json = await r.json()
        if (json.success) {
          toast({
            title: "Nota creada",
            description: "La nota se ha creado correctamente",
            variant: "default",
          })
          setModalOpen(false)
          // Recargar notas del estudiante si está expandido
          if (expandedRows.has(carnetFinal)) {
            await loadNotas(carnetFinal)
          }
          // Recargar lista de estudiantes
          await loadEstudiantes(currentPage)
        } else {
          throw new Error(json.message || "Error al crear nota")
        }
      }
    } catch (err: any) {
      console.error("Error guardando nota:", err)
      toast({
        title: "Error",
        description: "No se pudo guardar la nota: " + err.message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Toggle factura emitida
  const handleToggleFactura = async (carnet: string, checked: boolean) => {
    try {
      const r = await safeFetch(`${API_NOTAS}/${carnet}/factura-emitida`, {
        method: "POST",
        body: JSON.stringify({
          factura_emitida: checked,
        }),
      })
      const json = await r.json()
      if (json.success) {
        // Recargar lista de estudiantes (mantener página actual)
        await loadEstudiantes(currentPage)
        toast({
          title: checked ? "Factura marcada como emitida" : "Factura desmarcada",
          description: json.message,
          variant: "default",
        })
      } else {
        throw new Error(json.message || "Error al actualizar factura")
      }
    } catch (err: any) {
      console.error("Error actualizando factura:", err)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la factura: " + err.message,
        variant: "destructive",
      })
      // Recargar para revertir el cambio visual
      await loadEstudiantes(currentPage)
    }
  }

  // Abrir diálogo de confirmación para eliminar nota
  const handleDeleteNota = (nota: NotaPago, carnet: string) => {
    setNotaToDelete({ nota, carnet })
    setDeleteDialogOpen(true)
  }

  // Confirmar eliminación de nota
  const confirmDeleteNota = async () => {
    if (!notaToDelete) return

    try {
      const r = await safeFetch(`${API_NOTAS}/${notaToDelete.nota.id}`, {
        method: "DELETE",
      })
      const json = await r.json()
      if (json.success) {
        toast({
          title: "Nota eliminada",
          description: "La nota se ha eliminado correctamente",
          variant: "default",
        })
        // Recargar notas del estudiante
        await loadNotas(notaToDelete.carnet)
        // Recargar lista de estudiantes (mantener página actual)
        await loadEstudiantes(currentPage)
      } else {
        throw new Error(json.message || "Error al eliminar nota")
      }
    } catch (err: any) {
      console.error("Error eliminando nota:", err)
      toast({
        title: "Error",
        description: "No se pudo eliminar la nota: " + err.message,
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setNotaToDelete(null)
    }
  }

  // Cargar al inicio y cuando cambie la página
  useEffect(() => {
    loadEstudiantes(currentPage)
  }, [currentPage])

  // Filtrar estudiantes
  const estudiantesFiltrados = useMemo(() => {
    if (!searchQuery.trim()) return estudiantes

    const query = searchQuery.toLowerCase()
    return estudiantes.filter(est => 
      est.carnet.toLowerCase().includes(query) ||
      est.nombre_completo.toLowerCase().includes(query) ||
      (est.correo_electronico && est.correo_electronico.toLowerCase().includes(query)) ||
      (est.programa && est.programa.abreviatura.toLowerCase().includes(query))
    )
  }, [estudiantes, searchQuery])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-6">
        <Card className="shadow-lg border-2">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Notas de Pago por Estudiante
                </CardTitle>
                <CardDescription className="mt-2 text-sm">
                  Gestiona las notas de pago de los estudiantes. Solo se muestran estudiantes que tienen notas registradas.
                  {pagination && (
                    <span className="ml-2 font-medium text-blue-600 dark:text-blue-400">
                      Total: {pagination.total} estudiantes
                    </span>
                  )}
                </CardDescription>
              </div>
              <Button onClick={() => openCreateModal()} className="shadow-md hover:shadow-lg transition-shadow">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Nota
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Buscador mejorado */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Buscar por carnet, nombre, correo o programa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 text-base border-2 focus:border-blue-500 rounded-lg"
                />
              </div>
            </div>

          {/* Tabla de estudiantes */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-muted-foreground">Cargando estudiantes...</p>
            </div>
          ) : estudiantesFiltrados.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed">
              <FileText className="h-20 w-20 mx-auto mb-4 opacity-30 text-gray-400" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                {searchQuery ? "No se encontraron estudiantes con los filtros aplicados" : "No hay estudiantes con notas registradas"}
              </p>
              {!searchQuery && (
                <Button onClick={() => openCreateModal()} variant="outline" className="mt-4 shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear primera nota
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-800">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[50px] font-semibold"></TableHead>
                    <TableHead className="font-semibold">Estudiante</TableHead>
                    <TableHead className="font-semibold">Programa</TableHead>
                    <TableHead className="font-semibold">Total Notas</TableHead>
                    <TableHead className="font-semibold">Última Fecha Pago</TableHead>
                    <TableHead className="font-semibold">Factura Emitida</TableHead>
                    <TableHead className="font-semibold">Última Nota</TableHead>
                    <TableHead className="text-right font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {estudiantesFiltrados.map((estudiante) => {
                  const isExpanded = expandedRows.has(estudiante.carnet)
                  const notas = notasPorCarnet[estudiante.carnet] || []
                  const isLoadingNotas = loadingNotas.has(estudiante.carnet)

                  return (
                    <React.Fragment key={estudiante.carnet}>
                      <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(estudiante.carnet)}
                            className="hover:bg-blue-100 dark:hover:bg-blue-900/30"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{estudiante.nombre_completo}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1.5">
                            <span className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5" />
                              <span className="font-mono">{estudiante.carnet}</span>
                            </span>
                            {estudiante.correo_electronico && (
                              <span className="flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5" />
                                <span className="truncate max-w-[200px]">{estudiante.correo_electronico}</span>
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {estudiante.programa ? (
                            <Badge variant="outline" className="font-medium">{estudiante.programa.abreviatura}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-semibold">{estudiante.total_notas}</Badge>
                        </TableCell>
                        <TableCell>
                          {estudiante.ultima_fecha_pago ? (
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-green-600 dark:text-green-400">
                                {new Date(estudiante.ultima_fecha_pago).toLocaleDateString('es-GT')}
                              </div>
                              {estudiante.ultimo_monto_pago && (
                                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                  Q{estudiante.ultimo_monto_pago.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Sin pagos</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={estudiante.factura_emitida}
                              onCheckedChange={(checked) => handleToggleFactura(estudiante.carnet, checked as boolean)}
                              className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                            />
                            <span className="text-sm">
                              {estudiante.factura_emitida ? (
                                <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Emitida
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-gray-300">
                                  <Receipt className="h-3 w-3 mr-1" />
                                  Pendiente
                                </Badge>
                              )}
                            </span>
                          </div>
                          {estudiante.fecha_factura_emitida && (
                            <div className="text-xs text-muted-foreground mt-1.5">
                              {new Date(estudiante.fecha_factura_emitida).toLocaleDateString('es-GT')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {estudiante.ultima_nota_fecha ? (
                            <div className="space-y-1.5">
                              <div className="text-sm font-medium">
                                {new Date(estudiante.ultima_nota_fecha).toLocaleDateString('es-GT')}
                              </div>
                              {estudiante.ultima_nota_nomenclatura && (
                                <Badge variant="outline" className="text-xs">
                                  {estudiante.ultima_nota_nomenclatura}
                                </Badge>
                              )}
                              {estudiante.ultima_nota_preview && (
                                <div className="text-xs text-muted-foreground max-w-xs truncate">
                                  {estudiante.ultima_nota_preview}...
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCreateModal(estudiante.carnet)}
                            className="shadow-sm hover:shadow-md transition-shadow"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Agregar
                          </Button>
                        </TableCell>
                      </TableRow>
                      {/* Fila expandida con notas */}
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={8} className="bg-blue-50/50 dark:bg-blue-950/20 p-4">
                            {isLoadingNotas ? (
                              <div className="text-center py-8">
                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <p className="mt-2 text-sm text-muted-foreground">Cargando notas...</p>
                              </div>
                            ) : notas.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No hay notas registradas</p>
                              </div>
                            ) : (
                              <div className="space-y-3 py-2">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                    Notas de Pago ({notas.length})
                                  </h4>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openCreateModal(estudiante.carnet)}
                                    className="shadow-sm"
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Nueva Nota
                                  </Button>
                                </div>
                                <div className="space-y-3">
                                  {notas.map((nota) => (
                                    <div
                                      key={nota.id}
                                      className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between"
                                    >
                                      <div className="flex-1 pr-4">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-xs font-medium text-muted-foreground">
                                            {nota.fecha_formateada}
                                          </span>
                                          {nota.nomenclatura && (
                                            <Badge variant="outline" className="text-xs font-medium">
                                              {nota.nomenclatura}
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                          {nota.nota}
                                        </p>
                                      </div>
                                      <div className="flex gap-2 ml-4">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => openEditModal(nota, estudiante.carnet)}
                                          className="hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDeleteNota(nota, estudiante.carnet)}
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
            </div>
          )}

          {/* Paginación */}
          {pagination && pagination.total_pages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando <span className="font-medium text-gray-900 dark:text-gray-100">{pagination.from}</span> a{" "}
                <span className="font-medium text-gray-900 dark:text-gray-100">{pagination.to}</span> de{" "}
                <span className="font-medium text-gray-900 dark:text-gray-100">{pagination.total}</span> estudiantes
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (currentPage > 1) {
                          setCurrentPage(currentPage - 1)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {/* Páginas */}
                  {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                    let pageNum: number
                    if (pagination.total_pages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= pagination.total_pages - 2) {
                      pageNum = pagination.total_pages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage(pageNum)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}
                  
                  {pagination.total_pages > 5 && currentPage < pagination.total_pages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  {pagination.total_pages > 5 && (
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage(pagination.total_pages)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        isActive={currentPage === pagination.total_pages}
                        className="cursor-pointer"
                      >
                        {pagination.total_pages}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (currentPage < pagination.total_pages) {
                          setCurrentPage(currentPage + 1)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }
                      }}
                      className={currentPage === pagination.total_pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
          </CardContent>
        </Card>

        {/* Modal Crear/Editar Nota */}
        <Dialog open={modalOpen} onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) {
            setSelectedEstudianteModal(null)
            setSearchQueryModal("")
            setSearchResultsModal([])
            setSelectedCarnet(null)
          }
        }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingNota ? "Editar Nota de Pago" : "Nueva Nota de Pago"}
            </DialogTitle>
            <DialogDescription>
              {editingNota 
                ? `Editando nota del estudiante con carnet: ${selectedCarnet}`
                : selectedCarnet
                  ? `Agregando nota para: ${selectedCarnet}`
                  : "Selecciona un estudiante y completa la información de la nota"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Seleccionar estudiante (solo al crear y si no hay carnet pre-seleccionado) */}
            {!editingNota && !selectedCarnet && (
              <div className="grid gap-2">
                <Label htmlFor="estudiante">Estudiante *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="estudiante"
                    type="text"
                    placeholder="Buscar por carnet, nombre, correo o ID..."
                    value={searchQueryModal}
                    onChange={(e) => setSearchQueryModal(e.target.value)}
                    className="pl-10"
                  />
                  
                  {/* Resultados de búsqueda en modal */}
                  {searchResultsModal.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {searchResultsModal.map((estudiante) => (
                        <div
                          key={estudiante.id}
                          onClick={() => {
                            setSelectedEstudianteModal(estudiante)
                            setSearchQueryModal(estudiante.nombre_completo)
                            setSearchResultsModal([])
                          }}
                          className={`p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b last:border-b-0 ${
                            selectedEstudianteModal?.id === estudiante.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{estudiante.nombre_completo}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {estudiante.carnet}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {estudiante.correo_electronico}
                                </span>
                              </div>
                            </div>
                            {estudiante.tiene_notas && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {estudiante.total_notas} nota{estudiante.total_notas > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedEstudianteModal && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      ✓ Seleccionado: {selectedEstudianteModal.nombre_completo} ({selectedEstudianteModal.carnet})
                    </p>
                  </div>
                )}
                {!selectedEstudianteModal && (
                  <p className="text-xs text-muted-foreground">
                    Busca y selecciona un estudiante para crear la nota
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="nomenclatura">Nomenclatura (opcional)</Label>
              <Select 
                value={nomenclatura || "sin_nomenclatura"} 
                onValueChange={(value) => setNomenclatura(value === "sin_nomenclatura" ? null : value)}
              >
                <SelectTrigger id="nomenclatura">
                  <SelectValue placeholder="Seleccionar nomenclatura" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sin_nomenclatura">Sin nomenclatura</SelectItem>
                  {nomenclaturas.map((nom) => (
                    <SelectItem key={nom} value={nom}>
                      {nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nota">Nota *</Label>
              <Textarea
                id="nota"
                placeholder="Escribe la nota de pago aquí..."
                value={notaText}
                onChange={(e) => setNotaText(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {notaText.length}/5000 caracteres
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setModalOpen(false)
              setSelectedEstudianteModal(null)
              setSearchQueryModal("")
              setSearchResultsModal([])
              setSelectedCarnet(null)
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveNota} 
              disabled={saving || !notaText.trim() || (!editingNota && !selectedCarnet && !selectedEstudianteModal)}
            >
              {saving ? "Guardando..." : editingNota ? "Actualizar" : "Crear Nota"}
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>

        {/* Dialog de confirmación para eliminar nota */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar nota?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. La nota será eliminada permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteNota}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Sí, eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
