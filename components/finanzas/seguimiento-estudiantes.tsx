"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Edit, Trash2, DollarSign, Calendar, RefreshCw } from "lucide-react"
import {
  getCuotasDashboard,
  createCuota,
  updateCuota,
  deleteCuota,
  type CuotasDashboardEstudiante,
  type CuotaCreatePayload,
  type CuotaUpdatePayload,
  type CuotaDetalladaResumen,
  type Pagination,
} from "@/services/mantenimientos"
import { toast } from "sonner"

const currencyFormatter = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
})

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return currencyFormatter.format(0)
  }
  return currencyFormatter.format(value)
}

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString("es-GT")
}

const getEstadoBadgeColor = (estado: string | null) => {
  switch (estado) {
    case "pagado":
      return "bg-green-100 text-green-800"
    case "pendiente":
      return "bg-yellow-100 text-yellow-800"
    case "vencido":
      return "bg-red-100 text-red-800"
    case "cancelado":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function SeguimientoEstudiantes() {
  const [loading, setLoading] = useState(false)
  const [estudiantes, setEstudiantes] = useState<CuotasDashboardEstudiante[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(100)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEstudiante, setSelectedEstudiante] = useState<CuotasDashboardEstudiante | null>(null)
  const [showCuotasModal, setShowCuotasModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false)
  const [selectedCuota, setSelectedCuota] = useState<CuotaDetalladaResumen | null>(null)

  // Form states for create/edit
  const [formData, setFormData] = useState({
    numero_cuota: 1,
    fecha_vencimiento: "",
    monto: 0,
    estado: "pendiente",
    observaciones: "",
    paid_at: "",
  })

  // Bulk creation form
  const [bulkFormData, setBulkFormData] = useState({
    fecha_inicio: "",
    numero_cuotas: 1,
    monto_por_cuota: 0,
    intervalo_dias: 30,
  })

  useEffect(() => {
    loadEstudiantes()
  }, [currentPage, perPage, searchQuery])

  const loadEstudiantes = async () => {
    setLoading(true)
    try {
      const response = await getCuotasDashboard({ 
        page: currentPage, 
        per_page: perPage,
        search: searchQuery || undefined,
      })
      setEstudiantes(response.estudiantes || [])
      setPagination(response.pagination || null)
    } catch (error) {
      console.error("Error loading students:", error)
      toast.error("Error al cargar los estudiantes")
    } finally {
      setLoading(false)
    }
  }

  const filteredEstudiantes = estudiantes

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (pagination?.total_pages || 1)) {
      setCurrentPage(newPage)
    }
  }

  const handlePerPageChange = (value: string) => {
    const newPerPage = parseInt(value)
    if (!isNaN(newPerPage) && newPerPage > 0) {
      setPerPage(newPerPage)
      setCurrentPage(1)
    }
  }

  const handleViewCuotas = (estudiante: CuotasDashboardEstudiante) => {
    setSelectedEstudiante(estudiante)
    setShowCuotasModal(true)
  }

  const handleCreateCuota = () => {
    setFormData({
      numero_cuota: (selectedEstudiante?.cuotas?.length || 0) + 1,
      fecha_vencimiento: "",
      monto: 0,
      estado: "pendiente",
      observaciones: "",
      paid_at: "",
    })
    setShowCreateModal(true)
  }

  const handleEditCuota = (cuota: CuotaDetalladaResumen) => {
    setSelectedCuota(cuota)
    setFormData({
      numero_cuota: cuota.numero_cuota,
      fecha_vencimiento: cuota.fecha_vencimiento || "",
      monto: cuota.monto,
      estado: cuota.estado || "pendiente",
      observaciones: "",
      paid_at: cuota.paid_at ? cuota.paid_at.split(" ")[0].split("T")[0] : "",
    })
    setShowEditModal(true)
  }

  const handleDeleteCuota = (cuota: CuotaDetalladaResumen) => {
    setSelectedCuota(cuota)
    setShowDeleteDialog(true)
  }

  const submitCreateCuota = async () => {
    if (!selectedEstudiante?.estudiante_programa_id) {
      toast.error("No se ha seleccionado un estudiante")
      return
    }

    try {
      const payload: CuotaCreatePayload = {
        estudiante_programa_id: selectedEstudiante.estudiante_programa_id,
        numero_cuota: formData.numero_cuota,
        fecha_vencimiento: formData.fecha_vencimiento,
        monto: formData.monto,
        estado: formData.estado,
        observaciones: formData.observaciones,
      }

      await createCuota(payload)
      toast.success("Cuota creada exitosamente")
      setShowCreateModal(false)
      await loadEstudiantes()
      // Reload the selected student's cuotas
      const updatedResponse = await getCuotasDashboard({ 
        page: currentPage, 
        per_page: perPage,
        search: searchQuery || undefined,
      })
      const updatedEstudiante = updatedResponse.estudiantes.find(
        (e) => e.estudiante_programa_id === selectedEstudiante.estudiante_programa_id,
      )
      if (updatedEstudiante) {
        setSelectedEstudiante(updatedEstudiante)
      }
    } catch (error: any) {
      console.error("Error creating cuota:", error)
      toast.error(error.response?.data?.message || "Error al crear la cuota")
    }
  }

  const submitEditCuota = async () => {
    if (!selectedCuota) return

    try {
      const payload: CuotaUpdatePayload = {
        numero_cuota: formData.numero_cuota,
        fecha_vencimiento: formData.fecha_vencimiento,
        monto: formData.monto,
        estado: formData.estado,
        observaciones: formData.observaciones,
        paid_at: formData.estado === "pagado" && formData.paid_at ? formData.paid_at : (formData.estado === "pagado" ? new Date().toISOString().split("T")[0] : null),
      }

      await updateCuota(selectedCuota.id, payload)
      toast.success("Cuota actualizada exitosamente")
      setShowEditModal(false)
      await loadEstudiantes()
      // Reload the selected student's cuotas
      const updatedResponse = await getCuotasDashboard({ 
        page: currentPage, 
        per_page: perPage,
        search: searchQuery || undefined,
      })
      const updatedEstudiante = updatedResponse.estudiantes.find(
        (e) => e.estudiante_programa_id === selectedEstudiante?.estudiante_programa_id,
      )
      if (updatedEstudiante) {
        setSelectedEstudiante(updatedEstudiante)
      }
    } catch (error: any) {
      console.error("Error updating cuota:", error)
      toast.error(error.response?.data?.message || "Error al actualizar la cuota")
    }
  }

  const submitDeleteCuota = async () => {
    if (!selectedCuota) return

    try {
      await deleteCuota(selectedCuota.id)
      toast.success("Cuota eliminada exitosamente")
      setShowDeleteDialog(false)
      await loadEstudiantes()
      // Reload the selected student's cuotas
      const updatedResponse = await getCuotasDashboard({ 
        page: currentPage, 
        per_page: perPage,
        search: searchQuery || undefined,
      })
      const updatedEstudiante = updatedResponse.estudiantes.find(
        (e) => e.estudiante_programa_id === selectedEstudiante?.estudiante_programa_id,
      )
      if (updatedEstudiante) {
        setSelectedEstudiante(updatedEstudiante)
      }
    } catch (error: any) {
      console.error("Error deleting cuota:", error)
      toast.error(error.response?.data?.message || "Error al eliminar la cuota")
    }
  }

  const submitBulkCreate = async () => {
    if (!selectedEstudiante?.estudiante_programa_id) {
      toast.error("No se ha seleccionado un estudiante")
      return
    }

    if (!bulkFormData.fecha_inicio || bulkFormData.numero_cuotas < 1) {
      toast.error("Complete todos los campos requeridos")
      return
    }

    try {
      const startDate = new Date(bulkFormData.fecha_inicio)
      const cuotasToCreate: CuotaCreatePayload[] = []

      for (let i = 0; i < bulkFormData.numero_cuotas; i++) {
        const vencimientoDate = new Date(startDate)
        vencimientoDate.setDate(vencimientoDate.getDate() + i * bulkFormData.intervalo_dias)

        cuotasToCreate.push({
          estudiante_programa_id: selectedEstudiante.estudiante_programa_id,
          numero_cuota: (selectedEstudiante?.cuotas?.length || 0) + i + 1,
          fecha_vencimiento: vencimientoDate.toISOString().split("T")[0],
          monto: bulkFormData.monto_por_cuota,
          estado: "pendiente",
        })
      }

      // Create all cuotas
      await Promise.all(cuotasToCreate.map((cuota) => createCuota(cuota)))

      toast.success(`${bulkFormData.numero_cuotas} cuotas creadas exitosamente`)
      setShowBulkCreateModal(false)
      setBulkFormData({
        fecha_inicio: "",
        numero_cuotas: 1,
        monto_por_cuota: 0,
        intervalo_dias: 30,
      })
      await loadEstudiantes()
      // Reload the selected student's cuotas
      const updatedResponse = await getCuotasDashboard({ 
        page: currentPage, 
        per_page: perPage,
        search: searchQuery || undefined,
      })
      const updatedEstudiante = updatedResponse.estudiantes.find(
        (e) => e.estudiante_programa_id === selectedEstudiante.estudiante_programa_id,
      )
      if (updatedEstudiante) {
        setSelectedEstudiante(updatedEstudiante)
      }
    } catch (error: any) {
      console.error("Error creating bulk cuotas:", error)
      toast.error(error.response?.data?.message || "Error al crear las cuotas")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Seguimiento por Estudiante</CardTitle>
          <CardDescription>Gestione las cuotas de pago de cada estudiante</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, carnet o programa..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Cargando estudiantes...</div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Programa</TableHead>
                    <TableHead className="text-right">Saldo Pendiente</TableHead>
                    <TableHead className="text-center">Cuotas Pendientes</TableHead>
                    <TableHead className="text-center">Cuotas Pagadas</TableHead>
                    <TableHead>Próxima Cuota</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEstudiantes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No se encontraron estudiantes
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEstudiantes.map((estudiante) => (
                      <TableRow key={estudiante.estudiante_programa_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{estudiante.prospecto?.nombre}</div>
                            <div className="text-sm text-muted-foreground">{estudiante.prospecto?.carnet}</div>
                          </div>
                        </TableCell>
                        <TableCell>{estudiante.programa?.nombre}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(estudiante.saldo_pendiente)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{estudiante.cuotas_pendientes || 0}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-green-50">
                            {estudiante.cuotas_pagadas || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {estudiante.proxima_cuota ? (
                            <div>
                              <div className="text-sm">{formatDate(estudiante.proxima_cuota.fecha_vencimiento)}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatCurrency(estudiante.proxima_cuota.monto)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleViewCuotas(estudiante)}>
                            Ver Cuotas
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && pagination && pagination.total > 0 && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {pagination.from}-{pagination.to} de {pagination.total} registros
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Por página:</span>
                  <Select value={String(perPage)} onValueChange={handlePerPageChange} disabled={loading}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="200">200</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1 || loading}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {pagination.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.has_more || loading}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cuotas Modal */}
      <Dialog open={showCuotasModal} onOpenChange={setShowCuotasModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Cuotas de {selectedEstudiante?.prospecto?.nombre}
            </DialogTitle>
            <DialogDescription>
              {selectedEstudiante?.programa?.nombre} - {selectedEstudiante?.prospecto?.carnet}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="grid grid-cols-3 gap-4 flex-1">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Saldo Pendiente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(selectedEstudiante?.saldo_pendiente)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedEstudiante?.cuotas_pendientes || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Pagadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {selectedEstudiante?.cuotas_pagadas || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateCuota} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Cuota
              </Button>
              <Button onClick={() => setShowBulkCreateModal(true)} size="sm" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Generar Múltiples
              </Button>
            </div>

            <div className="border rounded-lg max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N°</TableHead>
                    <TableHead>Fecha Vencimiento</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Pago</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedEstudiante?.cuotas && selectedEstudiante.cuotas.length > 0 ? (
                    selectedEstudiante.cuotas.map((cuota) => (
                      <TableRow key={cuota.id}>
                        <TableCell>{cuota.numero_cuota}</TableCell>
                        <TableCell>{formatDate(cuota.fecha_vencimiento)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(cuota.monto)}</TableCell>
                        <TableCell>
                          <Badge className={getEstadoBadgeColor(cuota.estado)}>{cuota.estado || "pendiente"}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(cuota.paid_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCuota(cuota)}
                              disabled={cuota.estado === "pagado"}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCuota(cuota)}
                              disabled={cuota.estado === "pagado"}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No hay cuotas registradas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Cuota Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Cuota</DialogTitle>
            <DialogDescription>Ingrese los detalles de la nueva cuota</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Número de Cuota</Label>
              <Input
                type="number"
                value={formData.numero_cuota}
                onChange={(e) => setFormData({ ...formData, numero_cuota: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <Label>Fecha de Vencimiento</Label>
              <Input
                type="date"
                value={formData.fecha_vencimiento}
                onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
              />
            </div>
            <div>
              <Label>Monto</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observaciones (opcional)</Label>
              <Input
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={submitCreateCuota}>Crear Cuota</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Cuota Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cuota</DialogTitle>
            <DialogDescription>Modifique los detalles de la cuota</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Número de Cuota</Label>
              <Input
                type="number"
                value={formData.numero_cuota}
                onChange={(e) => setFormData({ ...formData, numero_cuota: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <Label>Fecha de Vencimiento</Label>
              <Input
                type="date"
                value={formData.fecha_vencimiento}
                onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
              />
            </div>
            <div>
              <Label>Monto</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={formData.estado} onValueChange={(value) => {
                const updates: any = { ...formData, estado: value }
                if (value === "pagado" && !formData.paid_at) {
                  updates.paid_at = new Date().toISOString().split("T")[0]
                }
                if (value !== "pagado") {
                  updates.paid_at = ""
                }
                setFormData(updates)
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="pagado">Pagado</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.estado === "pagado" && (
              <div>
                <Label>Fecha de Pago</Label>
                <Input
                  type="date"
                  value={formData.paid_at || ""}
                  onChange={(e) => setFormData({ ...formData, paid_at: e.target.value })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={submitEditCuota}>Actualizar Cuota</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Cuota Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la cuota permanentemente. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={submitDeleteCuota} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Create Modal */}
      <Dialog open={showBulkCreateModal} onOpenChange={setShowBulkCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar Cuotas Masivamente</DialogTitle>
            <DialogDescription>Configure la generación automática de múltiples cuotas</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Fecha de Inicio</Label>
              <Input
                type="date"
                value={bulkFormData.fecha_inicio}
                onChange={(e) => setBulkFormData({ ...bulkFormData, fecha_inicio: e.target.value })}
              />
            </div>
            <div>
              <Label>Número de Cuotas</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={bulkFormData.numero_cuotas}
                onChange={(e) => setBulkFormData({ ...bulkFormData, numero_cuotas: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <Label>Monto por Cuota</Label>
              <Input
                type="number"
                step="0.01"
                value={bulkFormData.monto_por_cuota}
                onChange={(e) =>
                  setBulkFormData({ ...bulkFormData, monto_por_cuota: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div>
              <Label>Intervalo entre cuotas (días)</Label>
              <Input
                type="number"
                min="1"
                value={bulkFormData.intervalo_dias}
                onChange={(e) => setBulkFormData({ ...bulkFormData, intervalo_dias: parseInt(e.target.value) || 30 })}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Por ejemplo: 30 días para cuotas mensuales, 7 días para semanales
              </p>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">
                Se generarán <strong>{bulkFormData.numero_cuotas}</strong> cuotas de{" "}
                <strong>{formatCurrency(bulkFormData.monto_por_cuota)}</strong> cada una, con vencimientos cada{" "}
                <strong>{bulkFormData.intervalo_dias}</strong> días.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkCreateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={submitBulkCreate}>Generar Cuotas</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
