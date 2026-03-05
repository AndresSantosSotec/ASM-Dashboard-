import { useState, useCallback, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import {
  getKardexDashboard,
  getKardexData,
  updateCuota,
  deleteCuota,
  type CuotaUpdatePayload,
  type CuotasDashboardMetrics,
  type CuotaProgramaResumen,
} from "@/services/mantenimientos"

export interface CuotaEditFormState {
  fecha_vencimiento: string
  monto: string
  estado: string
  paid_at: string
}

interface UseCuotasTabOptions {
  filters: any
}

export const useCuotasTab = ({ filters }: UseCuotasTabOptions) => {
  const { toast } = useToast()
  
  // Estados principales
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totals, setTotals] = useState<CuotasDashboardMetrics | null>(null)
  const [rows, setRows] = useState<CuotaProgramaResumen[]>([])
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // Estados del modal de crear cuota
  const [showCreateCuotaModal, setShowCreateCuotaModal] = useState(false)
  const [createCuotaLoading, setCreateCuotaLoading] = useState(false)
  const [createCuotaFormData, setCreateCuotaFormData] = useState({
    codigo_estudiante: "",
    monto: "",
    fecha_vencimiento: "",
    categoria: "",
    descripcion: "",
  })

  // Estados del modal de editar cuota
  const [editingCuota, setEditingCuota] = useState<CuotaProgramaResumen | null>(null)
  const [editFormData, setEditFormData] = useState<CuotaEditFormState>({
    fecha_vencimiento: "",
    monto: "",
    estado: "",
    paid_at: "",
  })

  // Función para construir filtros de request
  const buildRequestFilters = useCallback((filters: any) => ({
    search: filters.search || undefined,
    vencimiento: filters.vencimiento !== "todos" ? filters.vencimiento : undefined,
    status: filters.status !== "todos" ? filters.status : undefined,
    categoria: filters.categoria !== "todos" ? filters.categoria : undefined,
    limit: filters.limit === "all" ? undefined : filters.limit,
  }), [])

  // Cargar datos de cuotas
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

      setTotals(dashboardResponse.cuotas)
      setRows(dataResponse.cuotas)
      setLastUpdated(dataResponse.timestamp)
    } catch (err: any) {
      if (err?.code === "ERR_CANCELED") return

      const message = err.response?.data?.message ?? err.message ?? "No se pudieron cargar las cuotas"
      setError(message)
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [filters, buildRequestFilters])

  // Crear cuota
  const createCuota = useCallback(async () => {
    try {
      setCreateCuotaLoading(true)
      
      const response = await fetch('/api/mantenimientos/cuotas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createCuotaFormData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al crear la cuota')
      }

      const result = await response.json()
      
      toast({
        title: "Cuota creada exitosamente",
        description: "La cuota se ha registrado correctamente",
      })

      setShowCreateCuotaModal(false)
      setCreateCuotaFormData({
        codigo_estudiante: "",
        monto: "",
        fecha_vencimiento: "",
        categoria: "",
        descripcion: "",
      })
      
      // Recargar datos
      await loadData()
    } catch (error: any) {
      toast({
        title: "Error al crear cuota",
        description: error.message || "Ha ocurrido un error inesperado",
        variant: "destructive",
      })
    } finally {
      setCreateCuotaLoading(false)
    }
  }, [createCuotaFormData, toast, loadData])

  // Actualizar cuota
  const updateCuotaRecord = useCallback(async (id: number, payload: CuotaUpdatePayload) => {
    try {
      const updatedCuota = await updateCuota(id, payload)
      
      toast({
        title: "Cuota actualizada",
        description: "La cuota se ha actualizado exitosamente",
      })
      
      setRows(prevRows => prevRows.map(row => {
        if (row.id === id) {
          return {
            ...row,
            ...updatedCuota,
            monto: updatedCuota.monto ?? row.monto,
            fecha_vencimiento: updatedCuota.fecha_vencimiento || row.fecha_vencimiento,
            estado: updatedCuota.estado || row.estado,
            paid_at: updatedCuota.paid_at || row.paid_at,
          }
        }
        return row
      }))
      
      // Recargar métricas
      const params = buildRequestFilters(filters)
      const dashboardResponse = await getKardexDashboard(params)
      setTotals(dashboardResponse.cuotas)
      
      return true
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al actualizar la cuota",
        variant: "destructive",
      })
      return false
    }
  }, [toast, filters, buildRequestFilters])

  // Eliminar cuota
  const deleteCuotaRecord = useCallback(async (id: number) => {
    try {
      await deleteCuota(id)
      
      toast({
        title: "Cuota eliminada",
        description: "La cuota se ha eliminado exitosamente",
      })
      
      setRows(prevRows => prevRows.filter(row => row.id !== id))
      
      // Recargar métricas
      const params = buildRequestFilters(filters)
      const dashboardResponse = await getKardexDashboard(params)
      setTotals(dashboardResponse.cuotas)
      
      return true
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al eliminar la cuota",
        variant: "destructive",
      })
      return false
    }
  }, [toast, filters, buildRequestFilters])

  // Handler para abrir modal de crear cuota
  const handleCreateCuota = useCallback(() => {
    setShowCreateCuotaModal(true)
  }, [])

  // Handler para editar cuota
  const handleEditCuota = useCallback((cuota: CuotaProgramaResumen) => {
    setEditingCuota(cuota)
    setEditFormData({
      fecha_vencimiento: cuota.fecha_vencimiento || "",
      monto: cuota.monto?.toString() || "",
      estado: cuota.estado || "",
      paid_at: cuota.paid_at || "",
    })
  }, [])

  // Handler para guardar cambios en cuota
  const handleSaveEdit = useCallback(async () => {
    if (!editingCuota) return false
    
    const result = await updateCuotaRecord(editingCuota.id, {
      fecha_vencimiento: editFormData.fecha_vencimiento,
      monto: parseFloat(editFormData.monto),
      estado: editFormData.estado,
      paid_at: editFormData.paid_at || null,
    })
    
    if (result) {
      setEditingCuota(null)
    }
    
    return result
  }, [editingCuota, editFormData, updateCuotaRecord])

  // Handler para cancelar edición
  const handleCancelEdit = useCallback(() => {
    setEditingCuota(null)
    setEditFormData({
      fecha_vencimiento: "",
      monto: "",
      estado: "",
      paid_at: "",
    })
  }, [])

  // Efecto para cargar datos cuando cambian los filtros
  useEffect(() => {
    const controller = new AbortController()
    loadData(controller.signal)
    return () => controller.abort()
  }, [loadData])

  return {
    // Estados principales
    loading,
    error,
    totals,
    rows,
    lastUpdated,
    
    // Estados del modal de crear
    showCreateCuotaModal,
    setShowCreateCuotaModal,
    createCuotaLoading,
    createCuotaFormData,
    setCreateCuotaFormData,
    
    // Estados del modal de editar
    editingCuota,
    editFormData,
    setEditFormData,
    
    // Funciones principales
    loadData,
    createCuota,
    updateCuotaRecord,
    deleteCuotaRecord,
    
    // Handlers
    handleCreateCuota,
    handleEditCuota,
    handleSaveEdit,
    handleCancelEdit,
  }
}