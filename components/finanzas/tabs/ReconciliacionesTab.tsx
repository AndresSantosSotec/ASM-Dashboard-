import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Edit, Trash2, Plus, DollarSign, Users, TrendingUp, AlertCircle, FileText } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useReconciliacionesTab } from "@/hooks/useReconciliacionesTab"
import { ReconciliacionModal } from "@/components/finanzas/modals/ReconciliacionModal"
import type { ReconciliationRecordResumen } from "@/services/mantenimientos"
import { API_BASE_URL } from "@/utils/apiConfig"

interface ReconciliacionesTabProps {
  filters: any
}

const ReconciliacionesTab: React.FC<ReconciliacionesTabProps> = ({ filters }) => {
  const {
    // Estados principales
    loading,
    error,
    totals,
    rows,
    lastUpdated,
    
    // Estados del modal
    showCreateModal,
    setShowCreateModal,
    
    // Funciones principales
    deleteReconciliacionRecord,
    handleCreateReconciliacion,
    handleCreateSuccess,
  } = useReconciliacionesTab({ filters })

  const getBadgeVariant = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "conciliado":
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
              <CardTitle className="text-sm font-medium">Total Reconciliaciones</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totals.monto_total)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conciliados</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{totals.conciliados}</div>
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

      {/* Tabla de reconciliaciones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reconciliaciones Bancarias</CardTitle>
              <CardDescription>
                Gestión de reconciliaciones bancarias y movimientos financieros
                {lastUpdated && (
                  <span className="block text-xs text-muted-foreground mt-1">
                    Última actualización: {formatDate(lastUpdated)}
                  </span>
                )}
              </CardDescription>
            </div>
            <Button onClick={handleCreateReconciliacion}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Reconciliación
            </Button>
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
                  <TableHead>Banco</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Comprobante</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No hay reconciliaciones registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((reconciliacion: ReconciliationRecordResumen) => (
                    <TableRow key={reconciliacion.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{reconciliacion.prospecto?.nombre}</div>
                          <div className="text-sm text-muted-foreground">{reconciliacion.prospecto?.carnet}</div>
                        </div>
                      </TableCell>
                      <TableCell>{reconciliacion.bank}</TableCell>
                      <TableCell>{reconciliacion.reference}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(reconciliacion.amount)}</TableCell>
                      <TableCell>{formatDate(reconciliacion.date)}</TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(reconciliacion.status)}>
                          {reconciliacion.status || "Sin estado"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {reconciliacion.kardex?.archivo_comprobante ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`${API_BASE_URL}/storage/${reconciliacion.kardex!.archivo_comprobante}`, '_blank')}
                            title="Ver comprobante"
                          >
                            <FileText className="h-4 w-4 text-blue-600" />
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
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
                                  Esta acción no se puede deshacer. Se eliminará permanentemente la reconciliación bancaria.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteReconciliacionRecord(reconciliacion.id)}
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

      {/* Modal de crear reconciliación */}
      <ReconciliacionModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}

export default ReconciliacionesTab