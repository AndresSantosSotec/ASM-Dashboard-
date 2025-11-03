import { useState, useCallback, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import {
  getKardexDashboard,
  getKardexData,
  createKardex,
  updateKardex,
  deleteKardex,
  getEstudiantesProgramaSelect,
  type KardexCreatePayload,
  type KardexUpdatePayload,
  type KardexDashboardMetrics,
  type KardexPagoResumen,
  type EstudianteProgramaSelect,
} from "@/services/mantenimientos"

export interface KardexEditFormState {
  monto_pagado: string
  fecha_pago: string
  fecha_recibo: string
  metodo_pago: string
  estado_pago: string
  numero_boleta: string
  banco: string
  observaciones: string
}

interface UseKardexTabOptions {
  filters: any
}

export const useKardexTab = ({ filters }: UseKardexTabOptions) => {
  const { toast } = useToast()
  
  // Estados principales
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totals, setTotals] = useState<KardexDashboardMetrics | null>(null)
  const [rows, setRows] = useState<KardexPagoResumen[]>([])
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // Estados para crear Kardex
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    estudiante_programa_id: 0,
    cuota_id: undefined as number | undefined,
    monto_pagado: 0,
    fecha_pago: new Date().toISOString().split('T')[0],
    fecha_recibo: "",
    metodo_pago: "efectivo",
    estado_pago: "aprobado",
    numero_boleta: "",
    banco: "",
    observaciones: "",
  })

  // Estados para estudiantes programa
  const [estudiantesProgramaOptions, setEstudiantesProgramaOptions] = useState<EstudianteProgramaSelect[]>([])
  const [loadingEstudiantesPrograma, setLoadingEstudiantesPrograma] = useState(false)

  // Función para construir filtros de request
  const buildRequestFilters = useCallback((filters: any) => ({
    search: filters.search || undefined,
    estado_pago: filters.estadoPago !== "todos" ? filters.estadoPago : undefined,
    estado_reconciliacion: filters.estadoReconciliacion !== "todos" ? filters.estadoReconciliacion : undefined,
    limit: filters.limit === "all" ? undefined : filters.limit,
  }), [])

  // Cargar datos del kardex
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

      setTotals(dashboardResponse.kardex)
      setRows(dataResponse.kardex)
      setLastUpdated(dataResponse.timestamp)
    } catch (err: any) {
      if (err?.code === "ERR_CANCELED") return

      const message = err.response?.data?.message ?? err.message ?? "No se pudieron cargar los movimientos del kardex"
      setError(message)
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [filters, buildRequestFilters])

  // Cargar estudiantes programa
  const loadEstudiantesPrograma = useCallback(async () => {
    if (estudiantesProgramaOptions.length > 0 || loadingEstudiantesPrograma) return

    setLoadingEstudiantesPrograma(true)
    try {
      const response = await getEstudiantesProgramaSelect()
      setEstudiantesProgramaOptions(response.data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los estudiantes",
        variant: "destructive",
      })
    } finally {
      setLoadingEstudiantesPrograma(false)
    }
  }, [estudiantesProgramaOptions.length, loadingEstudiantesPrograma, toast])

  // Crear kardex
  const createKardexRecord = useCallback(async () => {
    if (createForm.estudiante_programa_id === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar un estudiante",
        variant: "destructive",
      })
      return false
    }

    if (createForm.monto_pagado <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser mayor a 0",
        variant: "destructive",
      })
      return false
    }

    try {
      const payload: KardexCreatePayload = {
        estudiante_programa_id: createForm.estudiante_programa_id,
        cuota_id: createForm.cuota_id,
        monto_pagado: createForm.monto_pagado,
        fecha_pago: createForm.fecha_pago,
        fecha_recibo: createForm.fecha_recibo || undefined,
        metodo_pago: createForm.metodo_pago,
        estado_pago: createForm.estado_pago,
        numero_boleta: createForm.numero_boleta || undefined,
        banco: createForm.banco || undefined,
        observaciones: createForm.observaciones || undefined,
      }

      const newKardex = await createKardex(payload)
      
      toast({
        title: "Kardex creado",
        description: "El movimiento del kardex se ha creado exitosamente",
      })
      
      setShowCreateModal(false)
      setRows(prevRows => [newKardex, ...prevRows])
      
      // Recargar métricas
      const params = buildRequestFilters(filters)
      const dashboardResponse = await getKardexDashboard(params)
      setTotals(dashboardResponse.kardex)
      
      return true
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al crear el kardex",
        variant: "destructive",
      })
      return false
    }
  }, [createForm, toast, filters, buildRequestFilters])

  // Actualizar kardex
  const updateKardexRecord = useCallback(async (id: number, payload: KardexUpdatePayload) => {
    try {
      const updatedKardex = await updateKardex(id, payload)
      
      toast({
        title: "Kardex actualizado",
        description: "El movimiento del kardex se ha actualizado exitosamente",
      })
      
      setRows(prevRows => prevRows.map(row => {
        if (row.id === id) {
          return {
            ...row,
            ...updatedKardex,
            fecha_pago: updatedKardex.fecha_pago || row.fecha_pago,
            fecha_recibo: updatedKardex.fecha_recibo || row.fecha_recibo,
            monto_pagado: updatedKardex.monto_pagado ?? row.monto_pagado,
            metodo_pago: updatedKardex.metodo_pago || row.metodo_pago,
            estado_pago: updatedKardex.estado_pago || row.estado_pago,
            numero_boleta: updatedKardex.numero_boleta || row.numero_boleta,
            banco: updatedKardex.banco || row.banco,
            observaciones: updatedKardex.observaciones || row.observaciones,
          }
        }
        return row
      }))
      
      // Recargar métricas
      const params = buildRequestFilters(filters)
      const dashboardResponse = await getKardexDashboard(params)
      setTotals(dashboardResponse.kardex)
      
      return true
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al actualizar el kardex",
        variant: "destructive",
      })
      return false
    }
  }, [toast, filters, buildRequestFilters])

  // Eliminar kardex
  const deleteKardexRecord = useCallback(async (id: number) => {
    try {
      await deleteKardex(id)
      
      toast({
        title: "Kardex eliminado",
        description: "El movimiento del kardex se ha eliminado exitosamente",
      })
      
      setRows(prevRows => prevRows.filter(row => row.id !== id))
      
      // Recargar métricas
      const params = buildRequestFilters(filters)
      const dashboardResponse = await getKardexDashboard(params)
      setTotals(dashboardResponse.kardex)
      
      return true
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al eliminar el kardex",
        variant: "destructive",
      })
      return false
    }
  }, [toast, filters, buildRequestFilters])

  // Handlers para crear kardex
  const handleCreateKardex = useCallback(() => {
    setCreateForm({
      estudiante_programa_id: 0,
      cuota_id: undefined,
      monto_pagado: 0,
      fecha_pago: new Date().toISOString().split('T')[0],
      fecha_recibo: "",
      metodo_pago: "efectivo",
      estado_pago: "aprobado",
      numero_boleta: "",
      banco: "",
      observaciones: "",
    })
    setShowCreateModal(true)
  }, [])

  // Efecto para cargar datos cuando cambian los filtros
  useEffect(() => {
    const controller = new AbortController()
    loadData(controller.signal)
    return () => controller.abort()
  }, [loadData])

  // Efecto para cargar estudiantes cuando se abre el modal
  useEffect(() => {
    if (showCreateModal) {
      loadEstudiantesPrograma()
    }
  }, [showCreateModal, loadEstudiantesPrograma])

  return {
    // Estados
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
    loadingEstudiantesPrograma,
    
    // Funciones
    loadData,
    createKardexRecord,
    updateKardexRecord,
    deleteKardexRecord,
    handleCreateKardex,
  }
}