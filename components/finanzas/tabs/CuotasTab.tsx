import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, Plus, DollarSign, Users, TrendingDown, AlertCircle } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useCuotasTab } from "@/hooks/useCuotasTab"
import type { CuotaProgramaResumen } from "@/services/mantenimientos"

interface CuotasTabProps {
  filters: any
}

const CuotasTab: React.FC<CuotasTabProps> = ({ filters }) => {
  const {
    // Estados principales
    loading,
    error,
    totals,
    rows,
    lastUpdated,
    
    // Estados del modal de crear
    showCreateCuotaModal,
    setShowCreateCuotaModal,
    createCuotaFormData,
    setCreateCuotaFormData,
    
    // Estados del modal de editar
    editingCuota,
    editFormData,
    setEditFormData,
    
    // Funciones principales
    createCuota,
    deleteCuotaRecord,
    
    // Handlers
    handleCreateCuota,
    handleEditCuota,
    handleSaveEdit,
    handleCancelEdit,
  } = useCuotasTab({ filters })

  const getBadgeVariant = (estado: string | null) => {
    switch (estado?.toLowerCase()) {
      case "pagada":
        return "default"
      case "pendiente":
        return "secondary"
      case "vencida":
        return "destructive"
      default:
        return "outline"
    }
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Error: {error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Métricas del Dashboard */}
      {totals && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cuotas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{totals.pendientes}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monto Pendiente</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totals.monto_pendiente)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla de cuotas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cuotas de Programas</CardTitle>
              <CardDescription>
                Gestión de cuotas por estudiante y programa académico
                {lastUpdated && (
                  <span className="block text-xs text-muted-foreground mt-1">
                    Última actualización: {formatDate(lastUpdated)}
                  </span>
                )}
              </CardDescription>
            </div>
            <Dialog open={showCreateCuotaModal} onOpenChange={setShowCreateCuotaModal}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateCuota}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Cuota
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Cuota</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="codigo_estudiante">Código Estudiante</Label>
                    <Input
                      id="codigo_estudiante"
                      value={createCuotaFormData.codigo_estudiante}
                      onChange={(e) => setCreateCuotaFormData({ ...createCuotaFormData, codigo_estudiante: e.target.value })}
                      placeholder="Código del estudiante"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="monto">Monto</Label>
                    <Input
                      id="monto"
                      type="number"
                      step="0.01"
                      value={createCuotaFormData.monto}
                      onChange={(e) => setCreateCuotaFormData({ ...createCuotaFormData, monto: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="fecha_vencimiento">Fecha de Vencimiento</Label>
                    <Input
                      id="fecha_vencimiento"
                      type="date"
                      value={createCuotaFormData.fecha_vencimiento}
                      onChange={(e) => setCreateCuotaFormData({ ...createCuotaFormData, fecha_vencimiento: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="categoria">Categoría</Label>
                    <Input
                      id="categoria"
                      value={createCuotaFormData.categoria}
                      onChange={(e) => setCreateCuotaFormData({ ...createCuotaFormData, categoria: e.target.value })}
                      placeholder="Categoría de la cuota"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={createCuotaFormData.descripcion}
                      onChange={(e) => setCreateCuotaFormData({ ...createCuotaFormData, descripcion: e.target.value })}
                      placeholder="Descripción de la cuota"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateCuotaModal(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={createCuota}>
                      Crear
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Programa</TableHead>
                  <TableHead>Cuota N°</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No hay cuotas registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((cuota: CuotaProgramaResumen) => (
                    <TableRow key={cuota.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{cuota.prospecto?.nombre}</div>
                          <div className="text-sm text-muted-foreground">{cuota.prospecto?.carnet}</div>
                        </div>
                      </TableCell>
                      <TableCell>{cuota.programa?.nombre}</TableCell>
                      <TableCell>{cuota.numero_cuota}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(cuota.monto)}</TableCell>
                      <TableCell>{formatDate(cuota.fecha_vencimiento)}</TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(cuota.estado)}>
                          {cuota.estado || "Sin estado"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Dialog open={editingCuota?.id === cuota.id} onOpenChange={(open) => open ? handleEditCuota(cuota) : handleCancelEdit()}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Editar Cuota</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="edit_monto">Monto</Label>
                                  <Input
                                    id="edit_monto"
                                    type="number"
                                    step="0.01"
                                    value={editFormData.monto}
                                    onChange={(e) => setEditFormData({ ...editFormData, monto: e.target.value })}
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="edit_fecha_vencimiento">Fecha de Vencimiento</Label>
                                  <Input
                                    id="edit_fecha_vencimiento"
                                    type="date"
                                    value={editFormData.fecha_vencimiento}
                                    onChange={(e) => setEditFormData({ ...editFormData, fecha_vencimiento: e.target.value })}
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="edit_estado">Estado</Label>
                                  <Select
                                    value={editFormData.estado}
                                    onValueChange={(value) => {
                                      const updates: any = { ...editFormData, estado: value }
                                      if (value === "pagada" && !editFormData.paid_at) {
                                        updates.paid_at = new Date().toISOString().split("T")[0]
                                      }
                                      if (value !== "pagada") {
                                        updates.paid_at = ""
                                      }
                                      setEditFormData(updates)
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pendiente">Pendiente</SelectItem>
                                      <SelectItem value="pagada">Pagada</SelectItem>
                                      <SelectItem value="vencida">Vencida</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                {editFormData.estado === "pagada" && (
                                  <div>
                                    <Label htmlFor="edit_paid_at">Fecha de Pago</Label>
                                    <Input
                                      id="edit_paid_at"
                                      type="date"
                                      value={editFormData.paid_at || ""}
                                      onChange={(e) => setEditFormData({ ...editFormData, paid_at: e.target.value })}
                                    />
                                  </div>
                                )}
                                
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline" onClick={handleCancelEdit}>
                                    Cancelar
                                  </Button>
                                  <Button onClick={handleSaveEdit}>
                                    Guardar
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará permanentemente la cuota.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteCuotaRecord(cuota.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default CuotasTab