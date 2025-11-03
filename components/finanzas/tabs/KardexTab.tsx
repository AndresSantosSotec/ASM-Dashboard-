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
import { Edit, Trash2, Plus, DollarSign, Users, TrendingUp, AlertCircle } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useKardexTab } from "@/hooks/useKardexTab"
import type { KardexPagoResumen } from "@/services/mantenimientos"

interface KardexTabProps {
  filters: any
}

const KardexTab: React.FC<KardexTabProps> = ({ filters }) => {
  const {
    // Estados principales
    loading,
    error,
    totals,
    rows,
    lastUpdated,
    
    // Estados del modal de crear
    showCreateModal,
    setShowCreateModal,
    createForm,
    setCreateForm,
    
    // Estados de estudiantes
    estudiantesProgramaOptions,
    
    // Funciones principales
    createKardexRecord,
    deleteKardexRecord,
    
    // Handlers
    handleCreateKardex,
  } = useKardexTab({ filters })

  const getBadgeVariant = (estado: string | null) => {
    switch (estado?.toLowerCase()) {
      case "aplicado":
        return "default"
      case "pendiente":
        return "secondary"
      case "rechazado":
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Movimientos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.movimientos_registrados}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totals.monto_neto)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aplicados</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{totals.aplicados}</div>
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
        </div>
      )}

      {/* Tabla de movimientos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Movimientos de Pago (Kardex)</CardTitle>
              <CardDescription>
                Gestión de movimientos de pago y transacciones financieras
                {lastUpdated && (
                  <span className="block text-xs text-muted-foreground mt-1">
                    Última actualización: {formatDate(lastUpdated)}
                  </span>
                )}
              </CardDescription>
            </div>
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateKardex}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Movimiento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Movimiento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="estudiante_programa_id">Estudiante</Label>
                    <Select
                      value={createForm.estudiante_programa_id.toString()}
                      onValueChange={(value) => setCreateForm({ ...createForm, estudiante_programa_id: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estudiante" />
                      </SelectTrigger>
                      <SelectContent>
                        {estudiantesProgramaOptions.map((estudiante) => (
                          <SelectItem key={estudiante.estudiante_programa_id} value={estudiante.estudiante_programa_id.toString()}>
                            {estudiante.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="monto_pagado">Monto Pagado</Label>
                    <Input
                      id="monto_pagado"
                      type="number"
                      step="0.01"
                      value={createForm.monto_pagado}
                      onChange={(e) => setCreateForm({ ...createForm, monto_pagado: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="fecha_pago">Fecha de Pago</Label>
                    <Input
                      id="fecha_pago"
                      type="date"
                      value={createForm.fecha_pago}
                      onChange={(e) => setCreateForm({ ...createForm, fecha_pago: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="metodo_pago">Método de Pago</Label>
                    <Select
                      value={createForm.metodo_pago}
                      onValueChange={(value) => setCreateForm({ ...createForm, metodo_pago: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                        <SelectItem value="deposito">Depósito</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="numero_boleta">Número de Boleta</Label>
                    <Input
                      id="numero_boleta"
                      value={createForm.numero_boleta}
                      onChange={(e) => setCreateForm({ ...createForm, numero_boleta: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                      id="observaciones"
                      value={createForm.observaciones}
                      onChange={(e) => setCreateForm({ ...createForm, observaciones: e.target.value })}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={createKardexRecord}>
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
                  <TableHead>Monto</TableHead>
                  <TableHead>Fecha Pago</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No hay movimientos de pago registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((kardex: KardexPagoResumen) => (
                    <TableRow key={kardex.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{kardex.prospecto?.nombre}</div>
                          <div className="text-sm text-muted-foreground">{kardex.prospecto?.carnet}</div>
                        </div>
                      </TableCell>
                      <TableCell>{kardex.programa?.nombre}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(kardex.monto_pagado)}</TableCell>
                      <TableCell>{formatDate(kardex.fecha_pago)}</TableCell>
                      <TableCell>{kardex.metodo_pago}</TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(kardex.estado_pago)}>
                          {kardex.estado_pago || "Sin estado"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          
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
                                  Esta acción no se puede deshacer. Se eliminará permanentemente el movimiento de pago.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteKardexRecord(kardex.id)}
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

export default KardexTab