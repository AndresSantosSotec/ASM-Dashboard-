import { useState, useCallback, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import {
  getKardexDashboard,
  getKardexData,
  updateReconciliacion,
  deleteReconciliacion,
  type ReconciliacionUpdatePayload,
  type ReconciliationDashboardMetrics,
  type ReconciliationRecordResumen,
} from "@/services/mantenimientos"

export interface ReconciliationEditFormState {
  amount: string
  date: string
  status: string
  bank: string
  reference: string
}

interface UseReconciliacionesTabOptions {
  filters: any
}

export const useReconciliacionesTab = ({ filters }: UseReconciliacionesTabOptions) => {
  const { toast } = useToast()
  
  // Estados principales
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totals, setTotals] = useState<ReconciliationDashboardMetrics | null>(null)
  const [rows, setRows] = useState<ReconciliationRecordResumen[]>([])
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // Estados del modal de crear
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Función para construir filtros de request
  const buildRequestFilters = useCallback((filters: any) => ({
    search: filters.search || undefined,
    estado_pago: filters.estadoPago !== "todos" ? filters.estadoPago : undefined,
    estado_reconciliacion: filters.estadoReconciliacion !== "todos" ? filters.estadoReconciliacion : undefined,
    limit: filters.limit === "all" ? undefined : filters.limit,
  }), [])

  // Cargar datos de reconciliaciones
  const loadData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)

    const params = buildRequestFilters(filters)

    try {
      const [dashboardResponse, dataResponse] = await Promise.all([
        getKardexDashboard(params, { signal }),
        getKardexData(params, { signal }),
      ])

      if (signal?.aborted) return

      setTotals(dashboardResponse.reconciliaciones)
      setRows(dataResponse.reconciliaciones)
      setLastUpdated(dataResponse.timestamp)
    } catch (err: any) {
      if (err?.code === "ERR_CANCELED") return

      const message = err.response?.data?.message ?? err.message ?? "No se pudieron cargar las conciliaciones"
      setError(message)
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [filters, buildRequestFilters])

  // Actualizar reconciliación
  const updateReconciliacionRecord = useCallback(async (id: number, payload: ReconciliacionUpdatePayload) => {
    try {
      const updatedReconciliation = await updateReconciliacion(id, payload)
      
      toast({
        title: "Reconciliación actualizada",
        description: "La reconciliación se ha actualizado exitosamente",
      })
      
      setRows(prevRows => prevRows.map(row => {
        if (row.id === id) {
          return {
            ...row,
            ...updatedReconciliation,
            amount: updatedReconciliation.amount ?? row.amount,
            date: updatedReconciliation.date || row.date,
            status: updatedReconciliation.status || row.status,
            bank: updatedReconciliation.bank || row.bank,
            reference: updatedReconciliation.reference || row.reference,
          }
        }
        return row
      }))
      
      // Recargar métricas
      const params = buildRequestFilters(filters)
      const dashboardResponse = await getKardexDashboard(params)
      setTotals(dashboardResponse.reconciliaciones)
      
      return true
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al actualizar la reconciliación",
        variant: "destructive",
      })
      return false
    }
  }, [toast, filters, buildRequestFilters])

  // Eliminar reconciliación
  const deleteReconciliacionRecord = useCallback(async (id: number) => {
    try {
      await deleteReconciliacion(id)
      
      toast({
        title: "Reconciliación eliminada",
        description: "La reconciliación se ha eliminado exitosamente",
      })
      
      setRows(prevRows => prevRows.filter(row => row.id !== id))
      
      // Recargar métricas
      const params = buildRequestFilters(filters)
      const dashboardResponse = await getKardexDashboard(params)
      setTotals(dashboardResponse.reconciliaciones)
      
      return true
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al eliminar la reconciliación",
        variant: "destructive",
      })
      return false
    }
  }, [toast, filters, buildRequestFilters])

  // Handler para crear reconciliación
  const handleCreateReconciliacion = useCallback(() => {
    setShowCreateModal(true)
  }, [])

  // Handler para éxito de creación (para usar con ReconciliacionModal)
  const handleCreateSuccess = useCallback((newReconciliacion: any) => {
    setRows(prevRows => [newReconciliacion, ...prevRows])
    
    // Recargar métricas
    const params = buildRequestFilters(filters)
    getKardexDashboard(params).then(dashboardResponse => {
      setTotals(dashboardResponse.reconciliaciones)
    }).catch(error => {
      console.error("Error reloading dashboard metrics:", error)
    })
  }, [filters, buildRequestFilters])

  // Efecto para cargar datos cuando cambian los filtros
  useEffect(() => {
    const controller = new AbortController()
    loadData(controller.signal)
    return () => controller.abort()
  }, [loadData])

  return {
    // Estados
    loading,
    error,
    totals,
    rows,
    lastUpdated,
    
    // Estados del modal
    showCreateModal,
    setShowCreateModal,
    
    // Funciones
    loadData,
    updateReconciliacionRecord,
    deleteReconciliacionRecord,
    handleCreateReconciliacion,
    handleCreateSuccess,
  }
}