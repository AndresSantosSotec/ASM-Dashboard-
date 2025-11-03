"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import axios from "axios"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, Loader2, Pencil, Plus, RefreshCw, Trash2, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getCuotasDashboard,
  getKardexDashboard,
  getKardexData,
  createCuota,
  updateCuota,
  deleteCuota,
  createKardex,
  updateKardex,
  deleteKardex,
  createReconciliacion,
  updateReconciliacion,
  deleteReconciliacion,
  getEstudiantesProgramaSelect,
  type CuotaProgramaResumen,
  type CuotasDashboardEstudiante,
  type CuotasDashboardResponse,
  type CuotasDashboardMetrics,
  type CuotaDetalladaResumen,
  type CuotaCreatePayload,
  type CuotaUpdatePayload,
  type KardexCreatePayload,
  type KardexUpdatePayload,
  type ReconciliacionCreatePayload,
  type ReconciliacionUpdatePayload,
  type KardexDashboardMetrics,
  type KardexPagoResumen,
  type ReconciliationDashboardMetrics,
  type ReconciliationRecordResumen,
  type EstudianteProgramaSelect,
} from "@/services/mantenimientos"

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
  if (!value) {
    return "-"
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString("es-GT")
}

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return "-"
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString("es-GT")
}

const estadoPagoLabels: Record<string, string> = {
  aprobado: "Aprobado",
  pendiente_revision: "Pendiente",
  rechazado: "Rechazado",
}

const estadoPagoClasses: Record<string, string> = {
  aprobado: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  pendiente_revision: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  rechazado: "bg-red-500/15 text-red-600 border-red-500/30",
}

const conciliacionLabels: Record<string, string> = {
  conciliado: "Conciliado",
  rechazado: "Rechazado",
  pendiente: "Pendiente",
  sin_coincidencia: "Sin coincidencia",
  imported: "Importado",
}

const conciliacionClasses: Record<string, string> = {
  conciliado: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  rechazado: "bg-red-500/15 text-red-600 border-red-500/30",
  pendiente: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  sin_coincidencia: "bg-sky-500/15 text-sky-700 border-sky-500/30",
  imported: "bg-slate-500/15 text-slate-700 border-slate-500/30",
}

const cuotaEstadoLabels: Record<string, string> = {
  pagado: "Pagado",
  pendiente: "Pendiente",
  parcial: "Pago parcial",
  vencido: "Vencido",
}

const cuotaEstadoClasses: Record<string, string> = {
  pagado: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  pendiente: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  parcial: "bg-sky-500/15 text-sky-700 border-sky-500/30",
  vencido: "bg-red-500/15 text-red-600 border-red-500/30",
}

type LimitValue = number | "all"

interface ReportFilters {
  search: string
  estadoPago: string
  estadoReconciliacion: string
  estadoCuota: string
  limit: LimitValue
}

const BASE_FILTERS: ReportFilters = {
  search: "",
  estadoPago: "todos",
  estadoReconciliacion: "todos",
  estadoCuota: "todos",
  limit: "all",
}

type TabKey = "kardex" | "reconciliaciones" | "cuotas" | "generacion-masiva"
type PaginationKey = "kardex" | "reconciliaciones" | "cuotasEstudiantes" | "cuotas"

type PageSizeValue = number | "all"

interface PaginationState {
  page: number
  pageSize: PageSizeValue
}

const PAGE_SIZE_OPTIONS: Array<{ label: string; value: PageSizeValue }> = [
  { label: "10", value: 10 },
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
  { label: "Todos", value: "all" },
]

const LIMIT_OPTIONS: Array<{ label: string; value: LimitValue }> = [
  { label: "Todos los registros", value: "all" },
  { label: "25 registros", value: 25 },
  { label: "50 registros", value: 50 },
  { label: "100 registros", value: 100 },
  { label: "200 registros", value: 200 },
  { label: "500 registros", value: 500 },
]



type KardexRow = KardexPagoResumen
type ReconciliationRow = ReconciliationRecordResumen

type DetailModalState =
  | { tab: "kardex"; action: Exclude<RowAction, "delete">; row: KardexRow }
  | {
      tab: "reconciliaciones"
      action: Exclude<RowAction, "delete">
      row: ReconciliationRow
    }
  | null

type DeleteState =
  | { tab: "kardex"; row: KardexRow }
  | { tab: "reconciliaciones"; row: ReconciliationRow }
  | null

interface KardexEditFormState {
  monto_pagado: string
  fecha_pago: string
  fecha_recibo: string
  metodo_pago: string
  estado_pago: string
  numero_boleta: string
  banco: string
  observaciones: string
}

interface ReconciliationEditFormState {
  amount: string
  date: string
  status: string
  bank: string
  reference: string
}

const createDefaultFilters = (): ReportFilters => ({
  ...BASE_FILTERS,
})

type RowAction = "view" | "edit" | "delete"

const TAB_LABELS: Record<"kardex" | "reconciliaciones", string> = {
  kardex: "Kardex",
  reconciliaciones: "Conciliaciones",
}

const buildRequestFilters = (filters: ReportFilters) => ({
  search: filters.search || undefined,
  estado_pago: filters.estadoPago !== "todos" ? filters.estadoPago : undefined,
  estado_reconciliacion: filters.estadoReconciliacion !== "todos" ? filters.estadoReconciliacion : undefined,
  estado_cuota: filters.estadoCuota !== "todos" ? filters.estadoCuota : undefined,
  limit: filters.limit === "all" ? undefined : filters.limit,
})

const getKardexReference = (row: KardexRow) =>
  row.numero_boleta ? `Boleta ${row.numero_boleta}` : `Pago #${row.id}`

const getReconciliationReference = (row: ReconciliationRow) =>
  row.reference ?? `Conciliación #${row.id}`

const toDateInputValue = (value: string | null | undefined) => {
  if (!value) {
    return ""
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return ""
  }

  const offset = parsed.getTimezoneOffset()
  const local = new Date(parsed.getTime() - offset * 60_000)

  return local.toISOString().slice(0, 10)
}

const createKardexEditFormState = (row: KardexRow): KardexEditFormState => ({
  monto_pagado: row.monto_pagado != null ? String(row.monto_pagado) : "",
  fecha_pago: toDateInputValue(row.fecha_pago),
  fecha_recibo: toDateInputValue(row.fecha_recibo),
  metodo_pago: row.metodo_pago ?? "",
  estado_pago: row.estado_pago ?? "",
  numero_boleta: row.numero_boleta ?? "",
  banco: row.banco ?? "",
  observaciones: row.observaciones ?? "",
})

const createReconciliationEditFormState = (
  row: ReconciliationRow,
): ReconciliationEditFormState => ({
  amount: row.amount != null ? String(row.amount) : "",
  date: toDateInputValue(row.date),
  status: row.status ?? "",
  bank: row.bank ?? "",
  reference: row.reference ?? "",
})

export const ReportesFinancieros = () => {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<TabKey>("kardex")
  const [filtersByTab, setFiltersByTab] = useState<Record<TabKey, ReportFilters>>({
    kardex: createDefaultFilters(),
    reconciliaciones: createDefaultFilters(),
    cuotas: createDefaultFilters(),
    "generacion-masiva": createDefaultFilters(),
  })
  const [formFiltersByTab, setFormFiltersByTab] = useState<Record<TabKey, ReportFilters>>({
    kardex: createDefaultFilters(),
    reconciliaciones: createDefaultFilters(),
    cuotas: createDefaultFilters(),
    "generacion-masiva": createDefaultFilters(),
  })
  const [loadingStates, setLoadingStates] = useState<Record<TabKey, boolean>>({
    kardex: false,
    reconciliaciones: false,
    cuotas: false,
    "generacion-masiva": false,
  })
  const [errors, setErrors] = useState<Record<TabKey, string | null>>({
    kardex: null,
    reconciliaciones: null,
    cuotas: null,
    "generacion-masiva": null,
  })
  const [kardexTotals, setKardexTotals] = useState<KardexDashboardMetrics | null>(null)
  const [reconciliacionTotals, setReconciliacionTotals] =
    useState<ReconciliationDashboardMetrics | null>(null)
  const [cuotasTotals, setCuotasTotals] = useState<CuotasDashboardMetrics | null>(null)
  const [kardexRows, setKardexRows] = useState<KardexPagoResumen[]>([])
  const [reconciliationRows, setReconciliationRows] = useState<ReconciliationRecordResumen[]>([])
  const [cuotasRows, setCuotasRows] = useState<CuotaProgramaResumen[]>([])
  const [cuotasDashboard, setCuotasDashboard] = useState<CuotasDashboardResponse | null>(null)
  const [kardexLastUpdated, setKardexLastUpdated] = useState<string | null>(null)
  const [reconciliacionesLastUpdated, setReconciliacionesLastUpdated] =
    useState<string | null>(null)
  const [cuotasLastUpdated, setCuotasLastUpdated] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Record<PaginationKey, PaginationState>>({
    kardex: { page: 1, pageSize: 10 },
    reconciliaciones: { page: 1, pageSize: 10 },
    cuotasEstudiantes: { page: 1, pageSize: 10 },
    cuotas: { page: 1, pageSize: 10 },
  })

  // Add missing modal and form states
  const [kardexModal, setKardexModal] = useState<DetailModalState>(null)
  const [reconciliationModal, setReconciliationModal] = useState<DetailModalState>(null)
  const [kardexEditForm, setKardexEditForm] = useState<KardexEditFormState | null>(null)
  const [reconciliationEditForm, setReconciliationEditForm] = useState<ReconciliationEditFormState | null>(null)
  const [deleteState, setDeleteState] = useState<DeleteState>(null)
  const [deleteReference, setDeleteReference] = useState<string>("")

  // Estados para el modal de cuotas del estudiante
  const [selectedEstudiante, setSelectedEstudiante] = useState<CuotasDashboardEstudiante | null>(null)
  const [showCuotasModal, setShowCuotasModal] = useState(false)
  const [selectedCuota, setSelectedCuota] = useState<CuotaDetalladaResumen | null>(null)
  const [showCreateCuotaModal, setShowCreateCuotaModal] = useState(false)
  const [showEditCuotaModal, setShowEditCuotaModal] = useState(false)
  const [showDeleteCuotaDialog, setShowDeleteCuotaDialog] = useState(false)
  const [cuotaCreateForm, setCuotaCreateForm] = useState({
    numero_cuota: 1,
    fecha_vencimiento: "",
    monto: 0,
    estado: "pendiente",
    observaciones: "",
  })
  const [cuotaEditForm, setCuotaEditForm] = useState({
    numero_cuota: 0,
    fecha_vencimiento: "",
    monto: 0,
    estado: "pendiente",
  })

  // Estados para generación masiva de cuotas
  const [bulkGenerationFilters, setBulkGenerationFilters] = useState({
    search: "",
    carnet: "",
  })
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set())
  const [bulkCuotaForm, setBulkCuotaForm] = useState({
    anio: new Date().getFullYear(),
    mes_inicio: 1,
    mes_fin: 12,
    monto_por_mes: 0,
    estado: "pendiente",
    observaciones: "",
  })
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false)
  const [allStudentsData, setAllStudentsData] = useState<CuotasDashboardEstudiante[]>([])
  const [isLoadingAllStudents, setIsLoadingAllStudents] = useState(false)

  // Estados para crear Kardex
  const [showCreateKardexModal, setShowCreateKardexModal] = useState(false)
  const [kardexCreateForm, setKardexCreateForm] = useState({
    estudiante_programa_id: 0,
    cuota_id: undefined as number | undefined,
    monto_pagado: 0,
    fecha_pago: "",
    fecha_recibo: "",
    metodo_pago: "efectivo",
    estado_pago: "aprobado",
    numero_boleta: "",
    banco: "",
    observaciones: "",
  })

  // 🔍 Select simple de estudiante-programa (cargar una vez, filtrar en frontend)
  const [estudiantesProgramaOptions, setEstudiantesProgramaOptions] = useState<EstudianteProgramaSelect[]>([])
  const [loadingEstudiantesPrograma, setLoadingEstudiantesPrograma] = useState(false)
  const [searchEstudiantePrograma, setSearchEstudiantePrograma] = useState("")

  // Filtrar opciones localmente para mejorar rendimiento
  const filteredEstudiantesProgramaOptions = useMemo(() => {
    if (!searchEstudiantePrograma.trim()) {
      return estudiantesProgramaOptions.slice(0, 100) // Solo primeros 100 si no hay búsqueda
    }
    
    const searchLower = searchEstudiantePrograma.toLowerCase()
    return estudiantesProgramaOptions
      .filter(item => 
        item.estudiante_nombre.toLowerCase().includes(searchLower) ||
        item.carnet.toLowerCase().includes(searchLower) ||
        item.programa_nombre.toLowerCase().includes(searchLower)
      )
      .slice(0, 50) // Solo primeros 50 resultados
  }, [estudiantesProgramaOptions, searchEstudiantePrograma])

  // Estados para crear Reconciliación
  const [showCreateReconciliacionModal, setShowCreateReconciliacionModal] = useState(false)
  const [reconciliacionCreateForm, setReconciliacionCreateForm] = useState({
    bank: "",
    reference: "",
    amount: 0,
    date: "",
    status: "pendiente",
    kardex_pago_id: undefined as number | undefined,
    notes: "",
  })

  const closeDetailModal = useCallback(() => {
    setKardexModal(null)
    setReconciliationModal(null)
    setKardexEditForm(null)
    setReconciliationEditForm(null)
  }, [])

  const handleKardexEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    if (!kardexModal || kardexModal.tab !== "kardex" || !kardexEditForm) return

    try {
      // Limpiar y validar el payload
      const payload: KardexUpdatePayload = {}
      
      // Solo incluir campos que han sido modificados y son válidos
      if (kardexEditForm.monto_pagado && kardexEditForm.monto_pagado.trim() !== '') {
        const monto = parseFloat(kardexEditForm.monto_pagado)
        if (!isNaN(monto) && monto >= 0) {
          payload.monto_pagado = monto
        }
      }
      
      if (kardexEditForm.fecha_pago && kardexEditForm.fecha_pago.trim() !== '') {
        payload.fecha_pago = kardexEditForm.fecha_pago
      }
      
      if (kardexEditForm.fecha_recibo && kardexEditForm.fecha_recibo.trim() !== '') {
        payload.fecha_recibo = kardexEditForm.fecha_recibo
      }
      
      if (kardexEditForm.metodo_pago && kardexEditForm.metodo_pago.trim() !== '') {
        payload.metodo_pago = kardexEditForm.metodo_pago
      }
      
      if (kardexEditForm.estado_pago && kardexEditForm.estado_pago.trim() !== '') {
        payload.estado_pago = kardexEditForm.estado_pago
      }
      
      if (kardexEditForm.numero_boleta && kardexEditForm.numero_boleta.trim() !== '') {
        payload.numero_boleta = kardexEditForm.numero_boleta
      }
      
      if (kardexEditForm.banco && kardexEditForm.banco.trim() !== '') {
        payload.banco = kardexEditForm.banco
      }
      
      if (kardexEditForm.observaciones && kardexEditForm.observaciones.trim() !== '') {
        payload.observaciones = kardexEditForm.observaciones
      }

      // Validar que al menos un campo fue proporcionado
      if (Object.keys(payload).length === 0) {
        toast({
          title: "Advertencia",
          description: "Debe modificar al menos un campo para actualizar el kardex",
          variant: "destructive",
        })
        return
      }

      // Debug: mostrar payload
      console.log('📤 Enviando payload de actualización de kardex:', payload)

      const updatedKardex = await updateKardex(kardexModal.row.id, payload)
      
      console.log('📥 Datos recibidos del backend:', updatedKardex)
      console.log('📋 Estructura del registro actual:', kardexModal.row)
      
      toast({
        title: "Kardex actualizado",
        description: "El movimiento del kardex se ha actualizado exitosamente",
      })
      
      closeDetailModal()
      
      // Actualizar el registro en el estado local en lugar de recargar todo
      setKardexRows(prevRows => {
        return prevRows.map(row => {
          if (row.id === kardexModal.row.id) {
            console.log('🔄 Actualizando registro en estado local:', {
              id: row.id,
              antes: row,
              actualizacion: updatedKardex
            })
            
            // Combinar datos actuales con los actualizados
            const updated = {
              ...row,
              fecha_pago: updatedKardex.fecha_pago || row.fecha_pago,
              fecha_recibo: updatedKardex.fecha_recibo || row.fecha_recibo,
              monto_pagado: updatedKardex.monto_pagado ?? row.monto_pagado,
              metodo_pago: updatedKardex.metodo_pago || row.metodo_pago,
              estado_pago: updatedKardex.estado_pago || row.estado_pago,
              numero_boleta: updatedKardex.numero_boleta || row.numero_boleta,
              banco: updatedKardex.banco || row.banco,
              observaciones: updatedKardex.observaciones || row.observaciones,
              // Mantener estructuras anidadas si el backend las envía
              prospecto: updatedKardex.prospecto || row.prospecto,
              programa: updatedKardex.programa || row.programa,
              cuota: updatedKardex.cuota || row.cuota,
            }
            
            console.log('✅ Registro actualizado:', updated)
            return updated
          }
          return row
        })
      })
      
      // Recargar solo las métricas del dashboard
      const params = buildRequestFilters(filtersByTab.kardex)
      const dashboardResponse = await getKardexDashboard(params)
      setKardexTotals(dashboardResponse.kardex)
      
    } catch (error: any) {
      console.error("Error updating kardex:", error)
      
      // Manejar errores de validación (422)
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const validationErrors = error.response.data.errors
        const errorMessages = Object.entries(validationErrors)
          .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
          .join('\n')
        
        toast({
          title: "Error de validación",
          description: errorMessages || error.response?.data?.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Error al actualizar el kardex",
          variant: "destructive",
        })
      }
    }
  }

  const handleReconciliationEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    if (!reconciliationModal || reconciliationModal.tab !== "reconciliaciones" || !reconciliationEditForm) return

    try {
      const payload: ReconciliacionUpdatePayload = {
        amount: parseFloat(reconciliationEditForm.amount),
        date: reconciliationEditForm.date,
        status: reconciliationEditForm.status,
        bank: reconciliationEditForm.bank || undefined,
        reference: reconciliationEditForm.reference || undefined,
      }

      const updatedReconciliation = await updateReconciliacion(reconciliationModal.row.id, payload)
      
      toast({
        title: "Reconciliación actualizada",
        description: "La reconciliación se ha actualizado exitosamente",
      })
      
      closeDetailModal()
      
      // Actualizar el registro en el estado local en lugar de recargar todo
      setReconciliationRows(prevRows => {
        return prevRows.map(row => {
          if (row.id === reconciliationModal.row.id) {
            // Combinar datos actuales con los actualizados
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
        })
      })
      
      // Recargar solo las métricas del dashboard
      const params = buildRequestFilters(filtersByTab.reconciliaciones)
      const dashboardResponse = await getKardexDashboard(params)
      setReconciliacionTotals(dashboardResponse.reconciliaciones)
      
    } catch (error: any) {
      console.error("Error updating reconciliation:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al actualizar la reconciliación",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    const loadKardex = async () => {
      setLoadingStates((prev) => ({ ...prev, kardex: true }))
      setErrors((prev) => ({ ...prev, kardex: null }))

      const params = buildRequestFilters(filtersByTab.kardex)

      try {
        const [dashboardResponse, dataResponse] = await Promise.all([
          getKardexDashboard(params, { signal: controller.signal }),
          getKardexData(params, { signal: controller.signal }),
        ])

        if (controller.signal.aborted) {
          return
        }

        setKardexTotals(dashboardResponse.kardex)
        setKardexRows(dataResponse.kardex)
        setKardexLastUpdated(dataResponse.timestamp)
        setPagination((prev) => ({
          ...prev,
          kardex:
            prev.kardex.page === 1 ? prev.kardex : { ...prev.kardex, page: 1 },
        }))
      } catch (err) {
        if ((err as { code?: string })?.code === "ERR_CANCELED") {
          return
        }

        const message = axios.isAxiosError(err)
          ? err.response?.data?.message ?? err.message ??
            "No se pudieron cargar los movimientos del kardex"
          : (err as Error).message ??
            "No se pudieron cargar los movimientos del kardex"

        setErrors((prev) => ({ ...prev, kardex: message }))
      } finally {
        if (!controller.signal.aborted) {
          setLoadingStates((prev) => ({ ...prev, kardex: false }))
        }
      }
    }

    loadKardex()

    return () => {
      controller.abort()
    }
  }, [filtersByTab.kardex])

  useEffect(() => {
    const controller = new AbortController()

    const loadReconciliaciones = async () => {
      setLoadingStates((prev) => ({ ...prev, reconciliaciones: true }))
      setErrors((prev) => ({ ...prev, reconciliaciones: null }))

      const params = buildRequestFilters(filtersByTab.reconciliaciones)

      try {
        const [dashboardResponse, dataResponse] = await Promise.all([
          getKardexDashboard(params, { signal: controller.signal }),
          getKardexData(params, { signal: controller.signal }),
        ])

        if (controller.signal.aborted) {
          return
        }

        setReconciliacionTotals(dashboardResponse.reconciliaciones)
        setReconciliationRows(dataResponse.reconciliaciones)
        setReconciliacionesLastUpdated(dataResponse.timestamp)
        setPagination((prev) => ({
          ...prev,
          reconciliaciones:
            prev.reconciliaciones.page === 1
              ? prev.reconciliaciones
              : { ...prev.reconciliaciones, page: 1 },
        }))
      } catch (err) {
        if ((err as { code?: string })?.code === "ERR_CANCELED") {
          return
        }

        const message = axios.isAxiosError(err)
          ? err.response?.data?.message ?? err.message ??
            "No se pudieron cargar las conciliaciones"
          : (err as Error).message ?? "No se pudieron cargar las conciliaciones"

        setErrors((prev) => ({ ...prev, reconciliaciones: message }))
      } finally {
        if (!controller.signal.aborted) {
          setLoadingStates((prev) => ({ ...prev, reconciliaciones: false }))
        }
      }
    }

    loadReconciliaciones()

    return () => {
      controller.abort()
    }
  }, [filtersByTab.reconciliaciones])

  useEffect(() => {
    const controller = new AbortController()

    const loadCuotas = async () => {
      setLoadingStates((prev) => ({ ...prev, cuotas: true }))
      setErrors((prev) => ({ ...prev, cuotas: null }))

      const params = buildRequestFilters(filtersByTab.cuotas)

      try {
        const [dashboardResponse, dataResponse, cuotasDashboardResponse] =
          await Promise.all([
            getKardexDashboard(params, { signal: controller.signal }),
            getKardexData(params, { signal: controller.signal }),
            getCuotasDashboard(params, { signal: controller.signal }),
          ])

        if (controller.signal.aborted) {
          return
        }

        setCuotasTotals(dashboardResponse.cuotas)
        setCuotasRows(dataResponse.cuotas)
        setCuotasLastUpdated(dataResponse.timestamp)
        setCuotasDashboard(cuotasDashboardResponse)
        setPagination((prev) => ({
          ...prev,
          cuotas:
            prev.cuotas.page === 1 ? prev.cuotas : { ...prev.cuotas, page: 1 },
          cuotasEstudiantes:
            prev.cuotasEstudiantes.page === 1
              ? prev.cuotasEstudiantes
              : { ...prev.cuotasEstudiantes, page: 1 },
        }))
      } catch (err) {
        if ((err as { code?: string })?.code === "ERR_CANCELED") {
          return
        }

        const message = axios.isAxiosError(err)
          ? err.response?.data?.message ?? err.message ?? "No se pudieron cargar las cuotas"
          : (err as Error).message ?? "No se pudieron cargar las cuotas"

        setErrors((prev) => ({ ...prev, cuotas: message }))
      } finally {
        if (!controller.signal.aborted) {
          setLoadingStates((prev) => ({ ...prev, cuotas: false }))
        }
      }
    }

    loadCuotas()

    return () => {
      controller.abort()
    }
  }, [filtersByTab.cuotas])

  const handleFiltersChange = (tab: TabKey, updates: Partial<ReportFilters>) => {
    setFormFiltersByTab((prev) => ({
      ...prev,
      [tab]: { ...prev[tab], ...updates },
    }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setFiltersByTab((prev) => ({
      ...prev,
      [activeTab]: { ...formFiltersByTab[activeTab] },
    }))
  }

  const handleReset = () => {
    const defaults = createDefaultFilters()

    setFormFiltersByTab((prev) => ({
      ...prev,
      [activeTab]: defaults,
    }))

    setFiltersByTab((prev) => ({
      ...prev,
      [activeTab]: defaults,
    }))
  }

  const getTotalItems = (key: PaginationKey) => {
    switch (key) {
      case "kardex":
        return kardexRows.length
      case "reconciliaciones":
        return reconciliationRows.length
      case "cuotasEstudiantes":
        return cuotasDashboard?.estudiantes?.length ?? 0
      case "cuotas":
      default:
        return cuotasRows.length
    }
  }

  const handlePageChange = (key: PaginationKey, nextPage: number) => {
    setPagination((prev) => {
      const { pageSize } = prev[key]
      const totalItems = getTotalItems(key)
      let totalPages = 1
      if (typeof pageSize === "number" && pageSize > 0) {
        totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
      }
      const page = Math.min(Math.max(1, nextPage), totalPages)

      if (page === prev[key].page) {
        return prev
      }

      return {
        ...prev,
        [key]: { ...prev[key], page },
      }
    })
  }

  const handlePageSizeChange = (key: PaginationKey, size: PageSizeValue) => {
    setPagination((prev) => ({
      ...prev,
      [key]: { page: 1, pageSize: size },
    }))
  }

  const getPaginationLoading = (key: PaginationKey) => {
    if (key === "kardex") {
      return loadingStates.kardex
    }

    if (key === "reconciliaciones") {
      return loadingStates.reconciliaciones
    }

    return loadingStates.cuotas
  }

  const handleKardexRowAction = useCallback(
    (action: RowAction, row: KardexRow) => {
      if (action === "delete") {
        setKardexModal(null)
        setKardexEditForm(null)
        setDeleteState({ tab: "kardex", row })
        setDeleteReference(getKardexReference(row))
        return
      }

      setDeleteState(null)
      setDeleteReference("")
      setReconciliationModal(null)
      setReconciliationEditForm(null)

      if (action === "edit") {
        setKardexEditForm(createKardexEditFormState(row))
      } else {
        setKardexEditForm(null)
      }

      setKardexModal({ tab: "kardex", action, row })
    },
    [],
  )

  const handleReconciliationRowAction = useCallback(
    (action: RowAction, row: ReconciliationRow) => {
      if (action === "delete") {
        setReconciliationModal(null)
        setReconciliationEditForm(null)
        setDeleteState({ tab: "reconciliaciones", row })
        setDeleteReference(getReconciliationReference(row))
        return
      }

      setDeleteState(null)
      setDeleteReference("")
      setKardexModal(null)
      setKardexEditForm(null)

      if (action === "edit") {
        setReconciliationEditForm(createReconciliationEditFormState(row))
      } else {
        setReconciliationEditForm(null)
      }

      setReconciliationModal({ tab: "reconciliaciones", action, row })
    },
    [],
  )

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteState) {
      return
    }

    try {
      if (deleteState.tab === "kardex") {
        await deleteKardex(deleteState.row.id)
        
        toast({
          title: "Kardex eliminado",
          description: "El movimiento del kardex se ha eliminado exitosamente",
        })
        
        // Eliminar del estado local inmediatamente
        setKardexRows(prevRows => prevRows.filter(row => row.id !== deleteState.row.id))
        
        // Recargar solo las métricas del dashboard
        const params = buildRequestFilters(filtersByTab.kardex)
        const dashboardResponse = await getKardexDashboard(params)
        setKardexTotals(dashboardResponse.kardex)
        
      } else if (deleteState.tab === "reconciliaciones") {
        await deleteReconciliacion(deleteState.row.id)
        
        toast({
          title: "Reconciliación eliminada",
          description: "La reconciliación se ha eliminado exitosamente",
        })
        
        // Eliminar del estado local inmediatamente
        setReconciliationRows(prevRows => prevRows.filter(row => row.id !== deleteState.row.id))
        
        // Recargar solo las métricas del dashboard
        const params = buildRequestFilters(filtersByTab.reconciliaciones)
        const dashboardResponse = await getKardexDashboard(params)
        setReconciliacionTotals(dashboardResponse.reconciliaciones)
      }
    } catch (error: any) {
      console.error("Error deleting:", error)
      toast({
        title: "Error al eliminar",
        description: error.response?.data?.message || "Error al eliminar el registro",
        variant: "destructive",
      })
    } finally {
      setDeleteState(null)
      setDeleteReference("")
    }
  }, [deleteState, deleteReference, toast, filtersByTab])

  // Handlers para el modal de cuotas
  const handleViewCuotas = useCallback((estudiante: CuotasDashboardEstudiante) => {
    setSelectedEstudiante(estudiante)
    setShowCuotasModal(true)
  }, [])

  const handleCreateCuota = useCallback(() => {
    if (!selectedEstudiante) return
    
    // Calcular el próximo número de cuota
    const maxCuota = selectedEstudiante.cuotas?.length > 0 
      ? Math.max(...selectedEstudiante.cuotas.map(c => c.numero_cuota))
      : 0
    
    setCuotaCreateForm({
      numero_cuota: maxCuota + 1,
      fecha_vencimiento: "",
      monto: 0,
      estado: "pendiente",
      observaciones: "",
    })
    setShowCreateCuotaModal(true)
  }, [selectedEstudiante])

  const handleEditCuota = useCallback((cuota: CuotaDetalladaResumen) => {
    setSelectedCuota(cuota)
    setCuotaEditForm({
      numero_cuota: cuota.numero_cuota,
      fecha_vencimiento: cuota.fecha_vencimiento || "",
      monto: cuota.monto,
      estado: cuota.estado || "pendiente",
    })
    setShowEditCuotaModal(true)
  }, [])

  const handleDeleteCuota = useCallback((cuota: CuotaDetalladaResumen) => {
    setSelectedCuota(cuota)
    setShowDeleteCuotaDialog(true)
  }, [])

  const submitCreateCuota = useCallback(async () => {
    if (!selectedEstudiante?.estudiante_programa_id) {
      toast({
        title: "Error",
        description: "No se ha seleccionado un estudiante",
        variant: "destructive",
      })
      return
    }

    try {
      const payload: CuotaCreatePayload = {
        estudiante_programa_id: selectedEstudiante.estudiante_programa_id,
        numero_cuota: cuotaCreateForm.numero_cuota,
        fecha_vencimiento: cuotaCreateForm.fecha_vencimiento,
        monto: cuotaCreateForm.monto,
        estado: cuotaCreateForm.estado,
        observaciones: cuotaCreateForm.observaciones || undefined,
      }

      const newCuota = await createCuota(payload)
      
      toast({
        title: "Cuota creada",
        description: "La cuota se ha creado exitosamente",
      })
      
      setShowCreateCuotaModal(false)
      
      // Agregar la nueva cuota al estudiante seleccionado localmente
      if (selectedEstudiante) {
        const cuotaDetallada: CuotaDetalladaResumen = {
          id: newCuota.id,
          numero_cuota: newCuota.numero_cuota,
          fecha_vencimiento: newCuota.fecha_vencimiento,
          monto: newCuota.monto,
          estado: newCuota.estado,
          paid_at: null,
        }
        
        setSelectedEstudiante(prev => {
          if (!prev) return prev
          return {
            ...prev,
            cuotas: [...prev.cuotas, cuotaDetallada],
            cuotas_pendientes: (prev.cuotas_pendientes || 0) + (newCuota.estado === 'pendiente' ? 1 : 0),
          }
        })
        
        // Actualizar en cuotasDashboard también
        setCuotasDashboard(prev => {
          if (!prev) return prev
          return {
            ...prev,
            estudiantes: prev.estudiantes.map(e => {
              if (e.estudiante_programa_id === selectedEstudiante.estudiante_programa_id) {
                return {
                  ...e,
                  cuotas: [...e.cuotas, cuotaDetallada],
                  cuotas_pendientes: (e.cuotas_pendientes || 0) + (newCuota.estado === 'pendiente' ? 1 : 0),
                }
              }
              return e
            })
          }
        })
      }
      
      // Recargar solo las métricas
      const params = buildRequestFilters(filtersByTab.cuotas)
      const dashboardResponse = await getKardexDashboard(params)
      setCuotasTotals(dashboardResponse.cuotas)
      
    } catch (error: any) {
      console.error("Error creating cuota:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al crear la cuota",
        variant: "destructive",
      })
    }
  }, [selectedEstudiante, cuotaCreateForm, toast, filtersByTab.cuotas])

  const submitEditCuota = useCallback(async () => {
    if (!selectedCuota) return

    try {
      const payload: CuotaUpdatePayload = {
        numero_cuota: cuotaEditForm.numero_cuota,
        fecha_vencimiento: cuotaEditForm.fecha_vencimiento,
        monto: cuotaEditForm.monto,
        estado: cuotaEditForm.estado,
      }

      await updateCuota(selectedCuota.id, payload)
      
      toast({
        title: "Cuota actualizada",
        description: "La cuota se ha actualizado exitosamente",
      })
      
      setShowEditCuotaModal(false)
      
      // Actualizar el estudiante seleccionado localmente
      if (selectedEstudiante) {
        setSelectedEstudiante(prev => {
          if (!prev) return prev
          return {
            ...prev,
            cuotas: prev.cuotas.map(c => {
              if (c.id === selectedCuota.id) {
                return {
                  ...c,
                  ...payload,
                  fecha_vencimiento: payload.fecha_vencimiento || c.fecha_vencimiento,
                  monto: payload.monto ?? c.monto,
                }
              }
              return c
            })
          }
        })
      }
      
      // Actualizar en cuotasDashboard también
      setCuotasDashboard(prev => {
        if (!prev) return prev
        return {
          ...prev,
          estudiantes: prev.estudiantes.map(e => {
            if (e.estudiante_programa_id === selectedEstudiante?.estudiante_programa_id) {
              return {
                ...e,
                cuotas: e.cuotas.map(c => {
                  if (c.id === selectedCuota.id) {
                    return {
                      ...c,
                      ...payload,
                      fecha_vencimiento: payload.fecha_vencimiento || c.fecha_vencimiento,
                      monto: payload.monto ?? c.monto,
                    }
                  }
                  return c
                })
              }
            }
            return e
          })
        }
      })
      
      // Recargar solo las métricas
      const params = buildRequestFilters(filtersByTab.cuotas)
      const dashboardResponse = await getKardexDashboard(params)
      setCuotasTotals(dashboardResponse.cuotas)
      
    } catch (error: any) {
      console.error("Error updating cuota:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al actualizar la cuota",
        variant: "destructive",
      })
    }
  }, [selectedCuota, cuotaEditForm, toast, filtersByTab.cuotas, selectedEstudiante])

  const submitDeleteCuota = useCallback(async () => {
    if (!selectedCuota) return

    try {
      await deleteCuota(selectedCuota.id)
      
      toast({
        title: "Cuota eliminada",
        description: "La cuota se ha eliminado exitosamente",
      })
      
      setShowDeleteCuotaDialog(false)
      
      // Eliminar del estudiante seleccionado localmente
      if (selectedEstudiante) {
        setSelectedEstudiante(prev => {
          if (!prev) return prev
          return {
            ...prev,
            cuotas: prev.cuotas.filter(c => c.id !== selectedCuota.id),
            cuotas_pendientes: (prev.cuotas_pendientes || 0) - (selectedCuota.estado === 'pendiente' ? 1 : 0),
            cuotas_pagadas: (prev.cuotas_pagadas || 0) - (selectedCuota.estado === 'pagado' ? 1 : 0),
          }
        })
      }
      
      // Eliminar de cuotasDashboard también
      setCuotasDashboard(prev => {
        if (!prev) return prev
        return {
          ...prev,
          estudiantes: prev.estudiantes.map(e => {
            if (e.estudiante_programa_id === selectedEstudiante?.estudiante_programa_id) {
              return {
                ...e,
                cuotas: e.cuotas.filter(c => c.id !== selectedCuota.id),
                cuotas_pendientes: (e.cuotas_pendientes || 0) - (selectedCuota.estado === 'pendiente' ? 1 : 0),
                cuotas_pagadas: (e.cuotas_pagadas || 0) - (selectedCuota.estado === 'pagado' ? 1 : 0),
              }
            }
            return e
          })
        }
      })
      
      // Recargar solo las métricas
      const params = buildRequestFilters(filtersByTab.cuotas)
      const dashboardResponse = await getKardexDashboard(params)
      setCuotasTotals(dashboardResponse.cuotas)
      
    } catch (error: any) {
      console.error("Error deleting cuota:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al eliminar la cuota",
        variant: "destructive",
      })
    }
  }, [selectedCuota, toast, filtersByTab.cuotas, selectedEstudiante])

  // Handlers para generación masiva
  const loadAllStudents = useCallback(async () => {
    setIsLoadingAllStudents(true)
    try {
      const response = await getCuotasDashboard({ limit: 10000 })
      setAllStudentsData(response.estudiantes || [])
    } catch (error: any) {
      console.error("Error loading all students:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los estudiantes",
        variant: "destructive",
      })
    } finally {
      setIsLoadingAllStudents(false)
    }
  }, [toast])

  const toggleStudentSelection = useCallback((estudianteId: number) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev)
      if (newSet.has(estudianteId)) {
        newSet.delete(estudianteId)
      } else {
        newSet.add(estudianteId)
      }
      return newSet
    })
  }, [])

  const toggleAllStudents = useCallback((students: CuotasDashboardEstudiante[]) => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(students.map(s => s.estudiante_programa_id).filter((id): id is number => id !== null)))
    }
  }, [selectedStudents.size])

  const generateBulkCuotas = useCallback(async () => {
    if (selectedStudents.size === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un estudiante",
        variant: "destructive",
      })
      return
    }

    if (bulkCuotaForm.mes_inicio > bulkCuotaForm.mes_fin) {
      toast({
        title: "Error",
        description: "El mes de inicio debe ser menor o igual al mes final",
        variant: "destructive",
      })
      return
    }

    if (bulkCuotaForm.monto_por_mes <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingBulk(true)

    try {
      const cuotasToCreate: CuotaCreatePayload[] = []
      
      // Para cada estudiante seleccionado
      for (const estudianteId of Array.from(selectedStudents)) {
        const estudiante = allStudentsData.find(e => e.estudiante_programa_id === estudianteId)
        if (!estudiante) continue

        // Calcular el número de cuota inicial
        const maxCuota = estudiante.cuotas?.length > 0 
          ? Math.max(...estudiante.cuotas.map(c => c.numero_cuota))
          : 0
        
        let numeroCuota = maxCuota + 1

        // Generar cuotas para cada mes en el rango
        for (let mes = bulkCuotaForm.mes_inicio; mes <= bulkCuotaForm.mes_fin; mes++) {
          // Calcular fecha de vencimiento (último día del mes)
          const ultimoDia = new Date(bulkCuotaForm.anio, mes, 0).getDate()
          const fechaVencimiento = `${bulkCuotaForm.anio}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`

          cuotasToCreate.push({
            estudiante_programa_id: estudianteId,
            numero_cuota: numeroCuota,
            fecha_vencimiento: fechaVencimiento,
            monto: bulkCuotaForm.monto_por_mes,
            estado: bulkCuotaForm.estado,
            observaciones: bulkCuotaForm.observaciones || undefined,
          })

          numeroCuota++
        }
      }

      // Crear todas las cuotas
      const promises = cuotasToCreate.map(payload => createCuota(payload))
      await Promise.all(promises)

      toast({
        title: "Cuotas creadas",
        description: `Se crearon ${cuotasToCreate.length} cuotas exitosamente`,
      })

      // Limpiar selección y recargar datos
      setSelectedStudents(new Set())
      await loadAllStudents()

    } catch (error: any) {
      console.error("Error generating bulk cuotas:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al generar las cuotas",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingBulk(false)
    }
  }, [selectedStudents, allStudentsData, bulkCuotaForm, toast, loadAllStudents])

  // Cargar todos los estudiantes cuando se activa el tab de generación masiva
  useEffect(() => {
    if (activeTab === "generacion-masiva" && allStudentsData.length === 0) {
      loadAllStudents()
    }
  }, [activeTab, allStudentsData.length, loadAllStudents])

  const estudiantesResumen = useMemo(() => cuotasDashboard?.summary ?? null, [cuotasDashboard])
  const estudiantes = useMemo(() => cuotasDashboard?.estudiantes ?? [], [cuotasDashboard])

  // Filtrar estudiantes para generación masiva
  const filteredBulkStudents = useMemo(() => {
    return allStudentsData.filter(estudiante => {
      const searchLower = bulkGenerationFilters.search.toLowerCase()
      const carnetLower = bulkGenerationFilters.carnet.toLowerCase()
      
      const matchesSearch = !searchLower || 
        estudiante.prospecto?.nombre?.toLowerCase().includes(searchLower)
        // estudiante.prospecto?.apellido_paterno?.toLowerCase().includes(searchLower) ||
        // estudiante.prospecto?.apellido_materno?.toLowerCase().includes(searchLower)
      
      const matchesCarnet = !carnetLower || 
        (estudiante.prospecto as any)?.carnet?.toLowerCase().includes(carnetLower)
      
      return matchesSearch && matchesCarnet
    })
  }, [allStudentsData, bulkGenerationFilters])

  // Handlers para crear Kardex
  const handleCreateKardex = useCallback(() => {
    // Resetear formulario
    setKardexCreateForm({
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
    setShowCreateKardexModal(true)
  }, [])

  // 🚀 Cargar opciones de estudiante-programa UNA SOLA VEZ (caché en memoria)
  useEffect(() => {
    if (showCreateKardexModal && estudiantesProgramaOptions.length === 0 && !loadingEstudiantesPrograma) {
      setLoadingEstudiantesPrograma(true)
      getEstudiantesProgramaSelect()
        .then((response) => {
          console.log(`✅ Cargados ${response.total} estudiantes-programa`)
          setEstudiantesProgramaOptions(response.data)
        })
        .catch((error) => {
          console.error('❌ Error al cargar estudiantes-programa:', error)
          toast({
            title: "Error",
            description: "No se pudieron cargar los estudiantes. Intente nuevamente.",
            variant: "destructive",
          })
        })
        .finally(() => {
          setLoadingEstudiantesPrograma(false)
        })
    }
  }, [showCreateKardexModal, estudiantesProgramaOptions.length, loadingEstudiantesPrograma, toast])

  const submitCreateKardex = useCallback(async () => {
    if (kardexCreateForm.estudiante_programa_id === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar un estudiante",
        variant: "destructive",
      })
      return
    }

    if (kardexCreateForm.monto_pagado <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    try {
      const payload: KardexCreatePayload = {
        estudiante_programa_id: kardexCreateForm.estudiante_programa_id,
        cuota_id: kardexCreateForm.cuota_id,
        monto_pagado: kardexCreateForm.monto_pagado,
        fecha_pago: kardexCreateForm.fecha_pago,
        fecha_recibo: kardexCreateForm.fecha_recibo || undefined,
        metodo_pago: kardexCreateForm.metodo_pago,
        estado_pago: kardexCreateForm.estado_pago,
        numero_boleta: kardexCreateForm.numero_boleta || undefined,
        banco: kardexCreateForm.banco || undefined,
        observaciones: kardexCreateForm.observaciones || undefined,
      }

      const newKardex = await createKardex(payload)
      
      toast({
        title: "Kardex creado",
        description: "El movimiento del kardex se ha creado exitosamente",
      })
      
      setShowCreateKardexModal(false)
      
      // Agregar el nuevo kardex al inicio de la lista (más reciente primero)
      setKardexRows(prevRows => [newKardex, ...prevRows])
      
      // Recargar las métricas del dashboard
      const params = buildRequestFilters(filtersByTab.kardex)
      const dashboardResponse = await getKardexDashboard(params)
      setKardexTotals(dashboardResponse.kardex)
      
    } catch (error: any) {
      console.error("Error creating kardex:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al crear el kardex",
        variant: "destructive",
      })
    }
  }, [kardexCreateForm, toast, filtersByTab.kardex])

  // Handlers para crear Reconciliación
  const handleCreateReconciliacion = useCallback(() => {
    setReconciliacionCreateForm({
      bank: "",
      reference: "",
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      status: "pendiente",
      kardex_pago_id: undefined,
      notes: "",
    })
    setShowCreateReconciliacionModal(true)
  }, [])

  const submitCreateReconciliacion = useCallback(async () => {
    if (!reconciliacionCreateForm.bank || !reconciliacionCreateForm.reference) {
      toast({
        title: "Error",
        description: "Debe completar banco y referencia",
        variant: "destructive",
      })
      return
    }

    if (reconciliacionCreateForm.amount <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    try {
      const payload: ReconciliacionCreatePayload = {
        bank: reconciliacionCreateForm.bank,
        reference: reconciliacionCreateForm.reference,
        amount: reconciliacionCreateForm.amount,
        date: reconciliacionCreateForm.date,
        status: reconciliacionCreateForm.status,
        kardex_pago_id: reconciliacionCreateForm.kardex_pago_id,
        notes: reconciliacionCreateForm.notes || undefined,
      }

      const newReconciliacion = await createReconciliacion(payload)
      
      toast({
        title: "Reconciliación creada",
        description: "La reconciliación se ha creado exitosamente",
      })
      
      setShowCreateReconciliacionModal(false)
      
      // Agregar la nueva reconciliación al inicio de la lista (más reciente primero)
      setReconciliationRows(prevRows => [newReconciliacion, ...prevRows])
      
      // Recargar las métricas del dashboard
      const params = buildRequestFilters(filtersByTab.reconciliaciones)
      const dashboardResponse = await getKardexDashboard(params)
      setReconciliacionTotals(dashboardResponse.reconciliaciones)
      
    } catch (error: any) {
      console.error("Error creating reconciliation:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al crear la reconciliación",
        variant: "destructive",
      })
    }
  }, [reconciliacionCreateForm, toast, filtersByTab.reconciliaciones])

  const paginatedKardexRows = useMemo(() => {
    const { page, pageSize } = pagination.kardex
    if (pageSize === "all") return kardexRows
    const start = (page - 1) * pageSize
    return kardexRows.slice(start, start + pageSize)
  }, [kardexRows, pagination.kardex])

  const paginatedReconciliationRows = useMemo(() => {
    const { page, pageSize } = pagination.reconciliaciones
    if (pageSize === "all") return reconciliationRows
    const start = (page - 1) * pageSize
    return reconciliationRows.slice(start, start + pageSize)
  }, [reconciliationRows, pagination.reconciliaciones])

  const paginatedCuotasRows = useMemo(() => {
    const { page, pageSize } = pagination.cuotas
    if (pageSize === "all") return cuotasRows
    const start = (page - 1) * pageSize
    return cuotasRows.slice(start, start + pageSize)
  }, [cuotasRows, pagination.cuotas])

  const paginatedCuotasEstudiantes = useMemo(() => {
    const { page, pageSize } = pagination.cuotasEstudiantes
    if (pageSize === "all") return estudiantes
    const start = (page - 1) * pageSize
    return estudiantes.slice(start, start + pageSize)
  }, [estudiantes, pagination.cuotasEstudiantes])

  useEffect(() => {
    setPagination((prev) => {
      const { page, pageSize } = prev.kardex
      const totalPages =
        typeof pageSize === "number"
          ? Math.max(1, Math.ceil(kardexRows.length / pageSize))
          : 1
      if (page <= totalPages) {
        return prev
      }

      return {
        ...prev,
        kardex: { ...prev.kardex, page: totalPages },
      }
    })
  }, [kardexRows])

  useEffect(() => {
    setPagination((prev) => {
      const { page, pageSize } = prev.reconciliaciones
      const totalPages =
        typeof pageSize === "number"
          ? Math.max(1, Math.ceil(reconciliationRows.length / pageSize))
          : 1
      if (page <= totalPages) {
        return prev
      }

      return {
        ...prev,
        reconciliaciones: { ...prev.reconciliaciones, page: totalPages },
      }
    })
  }, [reconciliationRows])

  useEffect(() => {
    setPagination((prev) => {
      const { page, pageSize } = prev.cuotas
      const totalPages =
        typeof pageSize === "number"
          ? Math.max(1, Math.ceil(cuotasRows.length / pageSize))
          : 1
      if (page <= totalPages) {
        return prev
      }

      return {
        ...prev,
        cuotas: { ...prev.cuotas, page: totalPages },
      }
    })
  }, [cuotasRows])

  useEffect(() => {
    setPagination((prev) => {
      const { page, pageSize } = prev.cuotasEstudiantes
      const totalPages =
        typeof pageSize === "number"
          ? Math.max(1, Math.ceil(estudiantes.length / pageSize))
          : 1
      if (page <= totalPages) {
        return prev
      }

      return {
        ...prev,
        cuotasEstudiantes: { ...prev.cuotasEstudiantes, page: totalPages },
      }
    })
  }, [estudiantes])

  const activeFormFilters = formFiltersByTab[activeTab]
  const activeLoading = loadingStates[activeTab]
  const activeError = errors[activeTab]

  // Helper functions for rendering
  const renderTablePlaceholder = (message: string, colSpan: number, loading = false) => (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-24 text-center">
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{message}</span>
          </div>
        ) : (
          message
        )}
      </TableCell>
    </TableRow>
  )

  const renderPaginationControls = (key: PaginationKey, totalItems: number) => {
    const { page, pageSize } = pagination[key]
    const totalPages = pageSize === "all" ? 1 : Math.max(1, Math.ceil(totalItems / (pageSize as number)))
    const loading = getPaginationLoading(key)

    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filas por página:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => handlePageSizeChange(key, value === "all" ? "all" : Number(value))}
            disabled={loading}
          >
            <SelectTrigger className="h-8 w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map(({ label, value }) => (
                <SelectItem key={value} value={String(value)}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(key, page - 1)}
            disabled={page <= 1 || loading}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(key, page + 1)}
            disabled={page >= totalPages || loading}
          >
            Siguiente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reportes financieros</CardTitle>
          <CardDescription>Consulta la información consolidada del kardex, conciliaciones bancarias y cuotas registradas.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-1 flex-wrap gap-3">
                <Input
                  value={activeFormFilters.search}
                  onChange={(event) =>
                    handleFiltersChange(activeTab, { search: event.target.value })
                  }
                  placeholder="Buscar por estudiante, carnet, programa o referencia"
                  className="w-full min-w-[220px] flex-1"
                />
                {activeTab === "kardex" ? (
                  <Select
                    value={activeFormFilters.estadoPago}
                    onValueChange={(value) =>
                      handleFiltersChange("kardex", { estadoPago: value })
                    }
                  >
                    <SelectTrigger className="w-full min-w-[160px] sm:w-[180px]">
                      <SelectValue placeholder="Estado de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los pagos</SelectItem>
                      <SelectItem value="aprobado">Aprobado</SelectItem>
                      <SelectItem value="pendiente_revision">Pendiente</SelectItem>
                      <SelectItem value="rechazado">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                ) : null}
                {activeTab !== "cuotas" ? (
                  <Select
                    value={activeFormFilters.estadoReconciliacion}
                    onValueChange={(value) =>
                      handleFiltersChange(activeTab, {
                        estadoReconciliacion: value,
                      })
                    }
                  >
                    <SelectTrigger className="w-full min-w-[160px] sm:w-[180px]">
                      <SelectValue placeholder="Estado conciliación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas las conciliaciones</SelectItem>
                      <SelectItem value="conciliado">Conciliado</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="rechazado">Rechazado</SelectItem>
                      <SelectItem value="sin_coincidencia">Sin coincidencia</SelectItem>
                    </SelectContent>
                  </Select>
                ) : null}
                {activeTab === "cuotas" ? (
                  <Select
                    value={activeFormFilters.estadoCuota}
                    onValueChange={(value) =>
                      handleFiltersChange("cuotas", { estadoCuota: value })
                    }
                  >
                    <SelectTrigger className="w-full min-w-[160px] sm:w-[180px]">
                      <SelectValue placeholder="Estado de cuota" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas las cuotas</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="pagado">Pagado</SelectItem>
                      <SelectItem value="parcial">Pago parcial</SelectItem>
                      <SelectItem value="vencido">Vencido</SelectItem>
                    </SelectContent>
                  </Select>
                ) : null}
                <Select
                  value={String(activeFormFilters.limit)}
                  onValueChange={(value) =>
                    handleFiltersChange(activeTab, { limit: Number(value) })
                  }
                >
                  <SelectTrigger className="w-full min-w-[120px] sm:w-[140px]">
                    <SelectValue placeholder="Límite" />
                  </SelectTrigger>
                  <SelectContent>
                    {LIMIT_OPTIONS.map(({ value, label }) => (
                      <SelectItem key={value} value={String(value)}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleReset} disabled={activeLoading}>
                  Restablecer
                </Button>
                <Button type="submit" disabled={activeLoading}>
                  {activeLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Aplicar filtros
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {activeError ? (
        <Alert variant="destructive">
          <AlertTitle>Ocurrió un problema</AlertTitle>
          <AlertDescription>{activeError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Movimientos en kardex</CardTitle>
            <CardDescription className="text-xs">Resumen de los registros filtrados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="text-2xl font-semibold">
              {kardexTotals?.movimientos_registrados ?? 0}
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Aplicados</span>
              <span className="font-medium text-foreground">{kardexTotals?.aplicados ?? 0}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Pendientes</span>
              <span className="font-medium text-foreground">{kardexTotals?.pendientes ?? 0}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Rechazados</span>
              <span className="font-medium text-foreground">{kardexTotals?.rechazados ?? 0}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Monto neto</span>
              <span className="font-medium text-foreground">{formatCurrency(kardexTotals?.monto_neto ?? 0)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Conciliaciones bancarias</CardTitle>
            <CardDescription className="text-xs">Registros importados desde bancos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="text-2xl font-semibold">{reconciliacionTotals?.total ?? 0}</div>
            <div className="flex justify-between text-muted-foreground">
              <span>Conciliados</span>
              <span className="font-medium text-foreground">{reconciliacionTotals?.conciliados ?? 0}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Pendientes</span>
              <span className="font-medium text-foreground">{reconciliacionTotals?.pendientes ?? 0}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Monto total</span>
              <span className="font-medium text-foreground">{formatCurrency(reconciliacionTotals?.monto_total ?? 0)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cuotas registradas</CardTitle>
            <CardDescription className="text-xs">Incluye pagos pendientes y en mora</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="text-2xl font-semibold">{cuotasTotals?.total ?? 0}</div>
            <div className="flex justify-between text-muted-foreground">
              <span>Pendientes</span>
              <span className="font-medium text-foreground">{cuotasTotals?.pendientes ?? 0}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>En mora</span>
              <span className="font-medium text-foreground">{cuotasTotals?.en_mora ?? 0}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Monto pendiente</span>
              <span className="font-medium text-foreground">{formatCurrency(cuotasTotals?.monto_pendiente ?? 0)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Seguimiento de estudiantes</CardTitle>
            <CardDescription className="text-xs">Con base en planes de pago activos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="text-2xl font-semibold">{estudiantesResumen?.estudiantes_activos ?? 0}</div>
            <div className="flex justify-between text-muted-foreground">
              <span>Saldo estimado</span>
              <span className="font-medium text-foreground">{formatCurrency(estudiantesResumen?.saldo_estimado ?? 0)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>En mora</span>
              <span className="font-medium text-foreground">{estudiantesResumen?.en_mora ?? 0}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Planes reestructurados</span>
              <span className="font-medium text-foreground">{estudiantesResumen?.planes_reestructurados ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)}>
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="kardex" className="flex-1">Kardex</TabsTrigger>
          <TabsTrigger value="reconciliaciones" className="flex-1">Conciliaciones</TabsTrigger>
          <TabsTrigger value="cuotas" className="flex-1">Cuotas</TabsTrigger>
          <TabsTrigger value="generacion-masiva" className="flex-1">Generación Masiva</TabsTrigger>
        </TabsList>

        <TabsContent value="kardex" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Movimientos del kardex</CardTitle>
                  <CardDescription>
                    Actualizado {kardexLastUpdated ? formatDateTime(kardexLastUpdated) : "sin información"}
                  </CardDescription>
                </div>
                <Button onClick={handleCreateKardex}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Movimiento
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Programa</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fechas</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Conciliaciones</TableHead>
                    <TableHead className="w-[140px] text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kardexRows.length === 0 ? (
                    renderTablePlaceholder(
                      "No se encontraron movimientos para los filtros seleccionados",
                      8,
                      loadingStates.kardex,
                    )
                  ) : (
                    paginatedKardexRows.map((row) => {
                      const estado = row.estado_pago ?? ""
                      const estadoClase = estadoPagoClasses[estado] ?? "bg-slate-500/15 text-slate-700 border-slate-500/30"
                      const estadoLabel = estadoPagoLabels[estado] ?? (estado ? estado.replace(/_/g, " ") : "Sin estado")

                      return (
                        <TableRow key={row.id}>
                          <TableCell className="min-w-[200px]">
                            <div className="font-medium">{row.prospecto?.nombre ?? "Sin nombre"}</div>
                            <div className="text-xs text-muted-foreground">
                              {row.prospecto?.carnet ?? "-"}
                              {row.numero_boleta ? ` · Boleta ${row.numero_boleta}` : ""}
                            </div>
                            {row.observaciones ? (
                              <div className="text-xs text-muted-foreground">{row.observaciones}</div>
                            ) : null}
                          </TableCell>
                          <TableCell className="min-w-[160px]">{row.programa?.nombre ?? "-"}</TableCell>
                          <TableCell>{formatCurrency(row.monto_pagado)}</TableCell>
                          <TableCell>
                            <div>{formatDate(row.fecha_pago)}</div>
                            <div className="text-xs text-muted-foreground">Recibo: {formatDate(row.fecha_recibo)}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("capitalize", estadoClase)}>
                              {estadoLabel}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">{row.metodo_pago ?? "-"}</TableCell>
                          <TableCell>
                            {row.reconciliaciones.length > 0 ? (
                              <div className="text-xs">
                                <div className="font-medium">
                                  {row.reconciliaciones.length} registro(s)
                                </div>
                                <div className="text-muted-foreground">
                                  {row.reconciliaciones
                                    .slice(0, 2)
                                    .map((item) => `${item.bank ?? "Banco"}: ${formatCurrency(item.amount)}`)
                                    .join(" · ")}
                                  {row.reconciliaciones.length > 2
                                    ? ` · +${row.reconciliaciones.length - 2}`
                                    : ""}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Sin conciliaciones</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleKardexRowAction("view", row)}
                                aria-label="Ver detalle"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleKardexRowAction("edit", row)}
                                aria-label="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleKardexRowAction("delete", row)}
                                aria-label="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
              {renderPaginationControls("kardex", kardexRows.length)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reconciliaciones" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Conciliaciones bancarias</CardTitle>
                  <CardDescription>
                    Resultado de los registros importados desde las entidades financieras. Actualizado
                    {" "}
                    {reconciliacionesLastUpdated
                      ? formatDateTime(reconciliacionesLastUpdated)
                      : "sin información"}
                  </CardDescription>
                </div>
                <Button onClick={handleCreateReconciliacion}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Reconciliación
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Prospecto</TableHead>
                    <TableHead>Kardex vinculado</TableHead>
                    <TableHead className="w-[140px] text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reconciliationRows.length === 0 ? (
                    renderTablePlaceholder(
                      "No se encontraron conciliaciones para los filtros seleccionados",
                      7,
                      loadingStates.reconciliaciones,
                    )
                  ) : (
                    paginatedReconciliationRows.map((row) => {
                      const estado = row.status ?? ""
                      const estadoClase = conciliacionClasses[estado] ?? "bg-slate-500/15 text-slate-700 border-slate-500/30"
                      const estadoLabel = conciliacionLabels[estado] ?? (estado ? estado.replace(/_/g, " ") : "Sin estado")

                      return (
                        <TableRow key={row.id}>
                          <TableCell className="min-w-[200px]">
                            <div className="font-medium">{row.reference ?? "Sin referencia"}</div>
                            <div className="text-xs text-muted-foreground">{row.bank ?? "Sin banco"}</div>
                          </TableCell>
                          <TableCell>{formatCurrency(row.amount)}</TableCell>
                          <TableCell>{formatDate(row.date)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("capitalize", estadoClase)}>
                              {estadoLabel}
                            </Badge>
                          </TableCell>
                          <TableCell className="min-w-[180px]">
                            <div className="font-medium">{row.prospecto?.nombre ?? "Sin prospecto"}</div>
                            <div className="text-xs text-muted-foreground">{row.prospecto?.carnet ?? "-"}</div>
                          </TableCell>
                          <TableCell className="min-w-[160px]">
                            {row.kardex ? (
                              <div className="text-xs">
                                <div className="font-medium">#{row.kardex.id}</div>
                                <div>{formatCurrency(row.kardex.monto_pagado ?? 0)}</div>
                                <div className="text-muted-foreground">{formatDate(row.kardex.fecha_pago)}</div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Sin vincular</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleReconciliationRowAction("view", row)}
                                aria-label="Ver detalle"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleReconciliationRowAction("edit", row)}
                                aria-label="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleReconciliationRowAction("delete", row)}
                                aria-label="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
              {renderPaginationControls("reconciliaciones", reconciliationRows.length)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cuotas" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Seguimiento por estudiante</CardTitle>
              <CardDescription>
                Resumen de cuotas pendientes y próximas fechas de pago. Actualizado
                {" "}
                {cuotasDashboard?.timestamp
                  ? formatDateTime(cuotasDashboard.timestamp)
                  : "sin información"}
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Programa</TableHead>
                    <TableHead>Saldo pendiente</TableHead>
                    <TableHead>Cuotas pendientes</TableHead>
                    <TableHead>Cuotas pagadas</TableHead>
                    <TableHead>Próxima cuota</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estudiantes.length === 0 ? (
                    renderTablePlaceholder(
                      "No se encontraron estudiantes con cuotas para los filtros seleccionados",
                      7,
                      loadingStates.cuotas,
                    )
                  ) : (
                    paginatedCuotasEstudiantes.map(
                      (estudiante: CuotasDashboardEstudiante, index) => (
                        <TableRow
                          key={
                            estudiante.estudiante_programa_id ??
                            estudiante.prospecto?.id ??
                            `est-${index}`
                          }
                        >
                          <TableCell className="min-w-[220px]">
                            <div className="font-medium">{estudiante.prospecto?.nombre ?? "Sin nombre"}</div>
                            <div className="text-xs text-muted-foreground">
                              {estudiante.prospecto?.carnet ?? "-"}
                              {estudiante.prospecto?.telefono ? ` · ${estudiante.prospecto.telefono}` : ""}
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[160px]">{estudiante.programa?.nombre ?? "-"}</TableCell>
                          <TableCell>{formatCurrency(estudiante.saldo_pendiente)}</TableCell>
                          <TableCell>{estudiante.cuotas_pendientes}</TableCell>
                          <TableCell>{estudiante.cuotas_pagadas}</TableCell>
                          <TableCell>
                            {estudiante.proxima_cuota ? (
                              <div className="text-xs">
                                <div className="font-medium">Cuota #{estudiante.proxima_cuota.numero_cuota}</div>
                                <div>{formatDate(estudiante.proxima_cuota.fecha_vencimiento)}</div>
                                <div className="text-muted-foreground">{formatCurrency(estudiante.proxima_cuota.monto)}</div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Sin próximas cuotas</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewCuotas(estudiante)}
                            >
                              Ver Cuotas
                            </Button>
                          </TableCell>
                        </TableRow>
                      ),
                    )
                  )}
                </TableBody>
              </Table>
              {renderPaginationControls("cuotasEstudiantes", estudiantes.length)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generacion-masiva" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Generación Masiva de Cuotas
              </CardTitle>
              <CardDescription>
                Genere múltiples cuotas para uno o varios estudiantes en un rango de fechas por meses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Formulario de configuración */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="bulk-anio">Año</Label>
                  <Input
                    id="bulk-anio"
                    type="number"
                    min="2020"
                    max="2050"
                    value={bulkCuotaForm.anio}
                    onChange={(e) => setBulkCuotaForm({ ...bulkCuotaForm, anio: parseInt(e.target.value) || new Date().getFullYear() })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-mes-inicio">Mes Inicio</Label>
                  <Select
                    value={String(bulkCuotaForm.mes_inicio)}
                    onValueChange={(value) => setBulkCuotaForm({ ...bulkCuotaForm, mes_inicio: parseInt(value) })}
                  >
                    <SelectTrigger id="bulk-mes-inicio">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Enero</SelectItem>
                      <SelectItem value="2">Febrero</SelectItem>
                      <SelectItem value="3">Marzo</SelectItem>
                      <SelectItem value="4">Abril</SelectItem>
                      <SelectItem value="5">Mayo</SelectItem>
                      <SelectItem value="6">Junio</SelectItem>
                      <SelectItem value="7">Julio</SelectItem>
                      <SelectItem value="8">Agosto</SelectItem>
                      <SelectItem value="9">Septiembre</SelectItem>
                      <SelectItem value="10">Octubre</SelectItem>
                      <SelectItem value="11">Noviembre</SelectItem>
                      <SelectItem value="12">Diciembre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-mes-fin">Mes Final</Label>
                  <Select
                    value={String(bulkCuotaForm.mes_fin)}
                    onValueChange={(value) => setBulkCuotaForm({ ...bulkCuotaForm, mes_fin: parseInt(value) })}
                  >
                    <SelectTrigger id="bulk-mes-fin">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Enero</SelectItem>
                      <SelectItem value="2">Febrero</SelectItem>
                      <SelectItem value="3">Marzo</SelectItem>
                      <SelectItem value="4">Abril</SelectItem>
                      <SelectItem value="5">Mayo</SelectItem>
                      <SelectItem value="6">Junio</SelectItem>
                      <SelectItem value="7">Julio</SelectItem>
                      <SelectItem value="8">Agosto</SelectItem>
                      <SelectItem value="9">Septiembre</SelectItem>
                      <SelectItem value="10">Octubre</SelectItem>
                      <SelectItem value="11">Noviembre</SelectItem>
                      <SelectItem value="12">Diciembre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-monto">Monto por Mes</Label>
                  <Input
                    id="bulk-monto"
                    type="number"
                    step="0.01"
                    min="0"
                    value={bulkCuotaForm.monto_por_mes}
                    onChange={(e) => setBulkCuotaForm({ ...bulkCuotaForm, monto_por_mes: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-estado">Estado</Label>
                  <Select
                    value={bulkCuotaForm.estado}
                    onValueChange={(value) => setBulkCuotaForm({ ...bulkCuotaForm, estado: value })}
                  >
                    <SelectTrigger id="bulk-estado">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="pagado">Pagado</SelectItem>
                      <SelectItem value="vencido">Vencido</SelectItem>
                      <SelectItem value="parcial">Pago Parcial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2 lg:col-span-1">
                  <Label htmlFor="bulk-observaciones">Observaciones (opcional)</Label>
                  <Input
                    id="bulk-observaciones"
                    value={bulkCuotaForm.observaciones}
                    onChange={(e) => setBulkCuotaForm({ ...bulkCuotaForm, observaciones: e.target.value })}
                    placeholder="Notas adicionales..."
                  />
                </div>
              </div>

              {/* Resumen de generación */}
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="grid gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estudiantes seleccionados:</span>
                      <span className="font-medium">{selectedStudents.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Meses a generar:</span>
                      <span className="font-medium">{bulkCuotaForm.mes_fin - bulkCuotaForm.mes_inicio + 1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total de cuotas:</span>
                      <span className="font-medium">{selectedStudents.size * (bulkCuotaForm.mes_fin - bulkCuotaForm.mes_inicio + 1)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-3">
                      <span className="font-medium">Monto total:</span>
                      <span className="font-bold">{formatCurrency(selectedStudents.size * (bulkCuotaForm.mes_fin - bulkCuotaForm.mes_inicio + 1) * bulkCuotaForm.monto_por_mes)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Botón de generación */}
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setSelectedStudents(new Set())}
                  variant="outline"
                  disabled={selectedStudents.size === 0 || isGeneratingBulk}
                >
                  Limpiar Selección
                </Button>
                <Button
                  onClick={generateBulkCuotas}
                  disabled={selectedStudents.size === 0 || isGeneratingBulk}
                >
                  {isGeneratingBulk ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Generar Cuotas
                    </>
                  )}
                </Button>
              </div>

              {/* Filtros de estudiantes */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Seleccionar Estudiantes</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAllStudents(filteredBulkStudents)}
                    disabled={isLoadingAllStudents}
                  >
                    {selectedStudents.size === filteredBulkStudents.length ? "Deseleccionar Todos" : "Seleccionar Todos"}
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="filter-nombre">Buscar por Nombre</Label>
                    <Input
                      id="filter-nombre"
                      placeholder="Nombre del estudiante..."
                      value={bulkGenerationFilters.search}
                      onChange={(e) => setBulkGenerationFilters({ ...bulkGenerationFilters, search: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="filter-carnet">Buscar por Carnet</Label>
                    <Input
                      id="filter-carnet"
                      placeholder="Carnet del estudiante..."
                      value={bulkGenerationFilters.carnet}
                      onChange={(e) => setBulkGenerationFilters({ ...bulkGenerationFilters, carnet: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Tabla de estudiantes */}
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedStudents.size === filteredBulkStudents.length && filteredBulkStudents.length > 0}
                            onCheckedChange={() => toggleAllStudents(filteredBulkStudents)}
                            disabled={isLoadingAllStudents}
                          />
                        </TableHead>
                        <TableHead>Estudiante</TableHead>
                        <TableHead>Carnet</TableHead>
                        <TableHead>Programa</TableHead>
                        <TableHead className="text-right">Cuotas Actuales</TableHead>
                        <TableHead className="text-right">Saldo Pendiente</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingAllStudents ? (
                        renderTablePlaceholder("Cargando estudiantes...", 6, true)
                      ) : filteredBulkStudents.length === 0 ? (
                        renderTablePlaceholder("No se encontraron estudiantes", 6)
                      ) : (
                        filteredBulkStudents.map((estudiante) => (
                          <TableRow key={estudiante.estudiante_programa_id}>
                            <TableCell>
                              <Checkbox
                                checked={estudiante.estudiante_programa_id !== null && selectedStudents.has(estudiante.estudiante_programa_id)}
                                onCheckedChange={() => {
                                  if (estudiante.estudiante_programa_id !== null) {
                                    toggleStudentSelection(estudiante.estudiante_programa_id)
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {estudiante.prospecto?.nombre}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {(estudiante.prospecto as any)?.email || "-"}
                              </div>
                            </TableCell>
                            <TableCell>{(estudiante.prospecto as any)?.carnet || "-"}</TableCell>
                            <TableCell className="text-sm">{estudiante.programa?.nombre}</TableCell>
                            <TableCell className="text-right">{(estudiante as any).total_cuotas || 0}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(estudiante.saldo_pendiente ? parseFloat(String(estudiante.saldo_pendiente)) : 0)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Cuotas del Estudiante */}
      <Dialog open={showCuotasModal} onOpenChange={setShowCuotasModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Cuotas de {selectedEstudiante?.prospecto?.nombre}
            </DialogTitle>
            <DialogDescription>
              {selectedEstudiante?.programa?.nombre} · {selectedEstudiante?.prospecto?.carnet}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Resumen */}
            <div className="grid grid-cols-3 gap-4">
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
                  <div className="text-2xl font-bold text-green-600">{selectedEstudiante?.cuotas_pagadas || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Botón para crear nueva cuota */}
            <div className="flex justify-end">
              <Button onClick={handleCreateCuota} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Cuota
              </Button>
            </div>

            {/* Tabla de Cuotas */}
            <div className="border rounded-lg">
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
                    selectedEstudiante.cuotas.map((cuota) => {
                      const estado = cuota.estado ?? ""
                      const estadoClase = cuotaEstadoClasses[estado] ?? "bg-slate-500/15 text-slate-700 border-slate-500/30"
                      const estadoLabel = cuotaEstadoLabels[estado] ?? (estado ? estado.replace(/_/g, " ") : "Sin estado")

                      return (
                        <TableRow key={cuota.id}>
                          <TableCell>{cuota.numero_cuota}</TableCell>
                          <TableCell>{formatDate(cuota.fecha_vencimiento)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(cuota.monto)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("capitalize", estadoClase)}>
                              {estadoLabel}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(cuota.paid_at)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditCuota(cuota)}
                                title="Editar cuota"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCuota(cuota)}
                                title="Eliminar cuota"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCuotasModal(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Crear Cuota */}
      <Dialog open={showCreateCuotaModal} onOpenChange={setShowCreateCuotaModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Cuota</DialogTitle>
            <DialogDescription>
              Ingrese los detalles de la nueva cuota para {selectedEstudiante?.prospecto?.nombre}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Número de Cuota</Label>
              <Input
                type="number"
                value={cuotaCreateForm.numero_cuota}
                onChange={(e) => setCuotaCreateForm({ ...cuotaCreateForm, numero_cuota: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <Label>Fecha de Vencimiento</Label>
              <Input
                type="date"
                value={cuotaCreateForm.fecha_vencimiento}
                onChange={(e) => setCuotaCreateForm({ ...cuotaCreateForm, fecha_vencimiento: e.target.value })}
              />
            </div>
            <div>
              <Label>Monto</Label>
              <Input
                type="number"
                step="0.01"
                value={cuotaCreateForm.monto}
                onChange={(e) => setCuotaCreateForm({ ...cuotaCreateForm, monto: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={cuotaCreateForm.estado} onValueChange={(value) => setCuotaCreateForm({ ...cuotaCreateForm, estado: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="pagado">Pagado</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="parcial">Pago Parcial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observaciones (opcional)</Label>
              <Textarea
                value={cuotaCreateForm.observaciones}
                onChange={(e) => setCuotaCreateForm({ ...cuotaCreateForm, observaciones: e.target.value })}
                placeholder="Agregar notas sobre esta cuota..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCuotaModal(false)}>
              Cancelar
            </Button>
            <Button onClick={submitCreateCuota}>Crear Cuota</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Editar Cuota */}
      <Dialog open={showEditCuotaModal} onOpenChange={setShowEditCuotaModal}>
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
                value={cuotaEditForm.numero_cuota}
                onChange={(e) => setCuotaEditForm({ ...cuotaEditForm, numero_cuota: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Fecha de Vencimiento</Label>
              <Input
                type="date"
                value={cuotaEditForm.fecha_vencimiento}
                onChange={(e) => setCuotaEditForm({ ...cuotaEditForm, fecha_vencimiento: e.target.value })}
              />
            </div>
            <div>
              <Label>Monto</Label>
              <Input
                type="number"
                step="0.01"
                value={cuotaEditForm.monto}
                onChange={(e) => setCuotaEditForm({ ...cuotaEditForm, monto: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={cuotaEditForm.estado} onValueChange={(value) => setCuotaEditForm({ ...cuotaEditForm, estado: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="pagado">Pagado</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="parcial">Pago Parcial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditCuotaModal(false)}>
              Cancelar
            </Button>
            <Button onClick={submitEditCuota}>Actualizar Cuota</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de Eliminar Cuota */}
      <AlertDialog open={showDeleteCuotaDialog} onOpenChange={setShowDeleteCuotaDialog}>
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

      <Dialog open={Boolean(kardexModal)} onOpenChange={(open) => (!open ? closeDetailModal() : undefined)}>
        {kardexModal ? (
          <DialogContent className="sm:max-w-[650px]">
            <DialogHeader>
              <DialogTitle>
                {kardexModal.action === "view"
                  ? "Detalle del pago"
                  : "Editar movimiento del kardex"}
              </DialogTitle>
              <DialogDescription>
                {("fecha_pago" in kardexModal.row ? getKardexReference(kardexModal.row as KardexPagoResumen) : "")}
                · {kardexModal.row.prospecto?.nombre ?? "Sin nombre"}
              </DialogDescription>
            </DialogHeader>
            {kardexModal.action === "view" ? (
              <div className="space-y-4 text-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Estudiante</p>
                    <p className="font-medium text-foreground">{kardexModal.row.prospecto?.nombre ?? "Sin nombre"}</p>
                    <p className="text-muted-foreground">
                      {kardexModal.row.prospecto?.carnet ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Programa</p>
                    <p className="font-medium text-foreground">{kardexModal.row.programa?.nombre ?? "-"}</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Monto pagado</p>
                    <p className="font-medium text-foreground">
                      {"monto_pagado" in kardexModal.row
                        ? formatCurrency((kardexModal.row as KardexPagoResumen).monto_pagado)
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Estado del pago</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize",
                        "estado_pago" in kardexModal.row
                          ? estadoPagoClasses[kardexModal.row.estado_pago ?? ""] ??
                            "bg-slate-500/15 text-slate-700 border-slate-500/30"
                          : "bg-slate-500/15 text-slate-700 border-slate-500/30",
                      )}
                    >
                      {"estado_pago" in kardexModal.row
                        ? estadoPagoLabels[kardexModal.row.estado_pago ?? ""] ??
                          (kardexModal.row.estado_pago
                            ? kardexModal.row.estado_pago.replace(/_/g, " ")
                            : "Sin estado")
                        : "Sin estado"}
                    </Badge>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Fecha de pago</p>
                    <p>
                      {"fecha_pago" in kardexModal.row
                        ? formatDateTime((kardexModal.row as KardexPagoResumen).fecha_pago)
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Fecha de recibo</p>
                    <p>
                      {"fecha_recibo" in kardexModal.row
                        ? formatDateTime((kardexModal.row as KardexPagoResumen).fecha_recibo)
                        : "-"}
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Método de pago</p>
                    <p className="capitalize">
                      {kardexModal.tab === "kardex"
                        ? (kardexModal.row as KardexPagoResumen).metodo_pago ?? "-"
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Banco / Boleta</p>
                    <p>
                      {"banco" in kardexModal.row ? kardexModal.row.banco ?? "Sin banco" : "Sin banco"}
                      {"fecha_pago" in kardexModal.row && kardexModal.row.numero_boleta
                        ? ` · Boleta ${kardexModal.row.numero_boleta}`
                        : ""}
                    </p>
                  </div>
                </div>
                {kardexModal.tab === "kardex" && (kardexModal.row as KardexPagoResumen).observaciones ? (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Observaciones</p>
                    <p>{(kardexModal.row as KardexPagoResumen).observaciones}</p>
                  </div>
                ) : null}
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Conciliaciones vinculadas</p>
                  {kardexModal.tab === "kardex" && (kardexModal.row as KardexPagoResumen).reconciliaciones.length > 0 ? (
                    <ul className="mt-2 space-y-2">
                      {(kardexModal.row as KardexPagoResumen).reconciliaciones.map((item) => (
                        <li key={item.id} className="rounded-md border p-2">
                          <div className="flex flex-col gap-1 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-foreground">{item.bank ?? "Banco"}</span>
                              <span>{formatCurrency(item.amount)}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.reference ?? "Sin referencia"} · {formatDate(item.date)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Estado: {conciliacionLabels[item.status ?? ""] ?? item.status ?? "Sin estado"}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">No hay conciliaciones asociadas.</p>
                  )}
                </div>
              </div>
            ) : kardexEditForm ? (
              <form className="space-y-4" onSubmit={handleKardexEditSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="kardex-monto">Monto pagado</Label>
                    <Input
                      id="kardex-monto"
                      type="number"
                      step="0.01"
                      value={kardexEditForm.monto_pagado}
                      onChange={(event) =>
                        setKardexEditForm((prev) =>
                          prev ? { ...prev, monto_pagado: event.target.value } : prev,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kardex-metodo">Método de pago</Label>
                    <Input
                      id="kardex-metodo"
                      value={kardexEditForm.metodo_pago}
                      onChange={(event) =>
                        setKardexEditForm((prev) =>
                          prev ? { ...prev, metodo_pago: event.target.value } : prev,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kardex-fecha-pago">Fecha de pago</Label>
                    <Input
                      id="kardex-fecha-pago"
                      type="date"
                      value={kardexEditForm.fecha_pago}
                      onChange={(event) =>
                        setKardexEditForm((prev) =>
                          prev ? { ...prev, fecha_pago: event.target.value } : prev,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kardex-fecha-recibo">Fecha de recibo</Label>
                    <Input
                      id="kardex-fecha-recibo"
                      type="date"
                      value={kardexEditForm.fecha_recibo}
                      onChange={(event) =>
                        setKardexEditForm((prev) =>
                          prev ? { ...prev, fecha_recibo: event.target.value } : prev,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kardex-banco">Banco</Label>
                    <Input
                      id="kardex-banco"
                      value={kardexEditForm.banco}
                      onChange={(event) =>
                        setKardexEditForm((prev) =>
                          prev ? { ...prev, banco: event.target.value } : prev,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kardex-boleta">Número de boleta</Label>
                    <Input
                      id="kardex-boleta"
                      value={kardexEditForm.numero_boleta}
                      onChange={(event) =>
                        setKardexEditForm((prev) =>
                          prev ? { ...prev, numero_boleta: event.target.value } : prev,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kardex-estado">Estado del pago</Label>
                    <Select
                      value={kardexEditForm.estado_pago}
                      onValueChange={(value) =>
                        setKardexEditForm((prev) =>
                          prev ? { ...prev, estado_pago: value } : prev,
                        )
                      }
                    >
                      <SelectTrigger id="kardex-estado">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(estadoPagoLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kardex-observaciones">Observaciones</Label>
                  <Textarea
                    id="kardex-observaciones"
                    value={kardexEditForm.observaciones}
                    onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setKardexEditForm((prev) =>
                        prev ? { ...prev, observaciones: event.target.value } : prev,
                      )
                    }
                    rows={4}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeDetailModal}>
                    Cancelar
                  </Button>
                  <Button type="submit">Guardar cambios</Button>
                </DialogFooter>
              </form>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Cargando información del formulario...
              </div>
            )}
            {kardexModal.action === "view" ? (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDetailModal}>
                  Cerrar
                </Button>
              </DialogFooter>
            ) : null}
          </DialogContent>
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(reconciliationModal)}
        onOpenChange={(open) => (!open ? closeDetailModal() : undefined)}
      >
        {reconciliationModal ? (
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {reconciliationModal.action === "view"
                  ? "Detalle de la conciliación"
                  : "Editar conciliación"}
              </DialogTitle>
              <DialogDescription>
                {"reference" in reconciliationModal.row
                  ? getReconciliationReference(reconciliationModal.row as ReconciliationRecordResumen)
                  : ""}
                · {"bank" in reconciliationModal.row ? reconciliationModal.row.bank ?? "Sin banco" : "Sin banco"}
              </DialogDescription>
            </DialogHeader>
            {reconciliationModal.action === "view" ? (
              <div className="space-y-4 text-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Banco</p>
                    <p className="font-medium text-foreground">
                      {reconciliationModal.tab === "reconciliaciones"
                        ? (reconciliationModal.row as ReconciliationRecordResumen).bank ?? "Sin banco"
                        : "Sin banco"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Referencia</p>
                    <p className="font-medium text-foreground">
                      {"reference" in reconciliationModal.row
                        ? reconciliationModal.row.reference ?? "Sin referencia"
                        : "Sin referencia"}
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Monto</p>
                    <p className="font-medium text-foreground">
                      {"amount" in reconciliationModal.row
                        ? formatCurrency(reconciliationModal.row.amount)
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Fecha</p>
                    <p>
                      {"date" in reconciliationModal.row
                        ? formatDateTime(reconciliationModal.row.date)
                        : "-"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Estado</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "capitalize",
                      "status" in reconciliationModal.row
                        ? conciliacionClasses[reconciliationModal.row.status ?? ""] ??
                          "bg-slate-500/15 text-slate-700 border-slate-500/30"
                        : "bg-slate-500/15 text-slate-700 border-slate-500/30",
                    )}
                  >
                    {"status" in reconciliationModal.row
                      ? conciliacionLabels[reconciliationModal.row.status ?? ""] ??
                        (reconciliationModal.row.status
                          ? reconciliationModal.row.status.replace(/_/g, " ")
                          : "Sin estado")
                      : "Sin estado"}
                  </Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Prospecto</p>
                    <p className="font-medium text-foreground">{reconciliationModal.row.prospecto?.nombre ?? "Sin prospecto"}</p>
                    <p className="text-muted-foreground">{reconciliationModal.row.prospecto?.carnet ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Programa</p>
                    <p className="font-medium text-foreground">{reconciliationModal.row.programa?.nombre ?? "-"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Movimiento en kardex</p>
                  {"kardex" in reconciliationModal.row && reconciliationModal.row.kardex ? (
                    <div className="mt-2 rounded-md border p-3 text-sm">
                      <div className="font-medium text-foreground">Pago #{reconciliationModal.row.kardex.id}</div>
                      <div className="text-muted-foreground">
                        {formatCurrency(reconciliationModal.row.kardex.monto_pagado ?? 0)} · {formatDate(reconciliationModal.row.kardex.fecha_pago)}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">Sin vincular al kardex.</p>
                  )}
                </div>
              </div>
            ) : reconciliationEditForm ? (
              <form className="space-y-4" onSubmit={handleReconciliationEditSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="reconciliacion-banco">Banco</Label>
                    <Input
                      id="reconciliacion-banco"
                      value={reconciliationEditForm.bank}
                      onChange={(event) =>
                        setReconciliationEditForm((prev) =>
                          prev ? { ...prev, bank: event.target.value } : prev,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reconciliacion-referencia">Referencia</Label>
                    <Input
                      id="reconciliacion-referencia"
                      value={reconciliationEditForm.reference}
                      onChange={(event) =>
                        setReconciliationEditForm((prev) =>
                          prev ? { ...prev, reference: event.target.value } : prev,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reconciliacion-monto">Monto</Label>
                    <Input
                      id="reconciliacion-monto"
                      type="number"
                      step="0.01"
                      value={reconciliationEditForm.amount}
                      onChange={(event) =>
                        setReconciliationEditForm((prev) =>
                          prev ? { ...prev, amount: event.target.value } : prev,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reconciliacion-fecha">Fecha</Label>
                    <Input
                      id="reconciliacion-fecha"
                      type="date"
                      value={reconciliationEditForm.date}
                      onChange={(event) =>
                        setReconciliationEditForm((prev) =>
                          prev ? { ...prev, date: event.target.value } : prev,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reconciliacion-estado">Estado</Label>
                    <Select
                      value={reconciliationEditForm.status}
                      onValueChange={(value) =>
                        setReconciliationEditForm((prev) =>
                          prev ? { ...prev, status: value } : prev,
                        )
                      }
                    >
                      <SelectTrigger id="reconciliacion-estado">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(conciliacionLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeDetailModal}>
                    Cancelar
                  </Button>
                  <Button type="submit">Guardar cambios</Button>
                </DialogFooter>
              </form>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Cargando información del formulario...
              </div>
            )}
            {reconciliationModal.action === "view" ? (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDetailModal}>
                  Cerrar
                </Button>
              </DialogFooter>
            ) : null}
          </DialogContent>
        ) : null}
      </Dialog>

      {/* Modal de Crear Kardex */}
      <Dialog open={showCreateKardexModal} onOpenChange={setShowCreateKardexModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Movimiento de Kardex</DialogTitle>
            <DialogDescription>
              Seleccione el estudiante-programa y registre el pago
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* � Select de Estudiante-Programa con búsqueda */}
            <div className="grid gap-2">
              <Label htmlFor="select-estudiante-programa">Estudiante y Programa *</Label>
              {loadingEstudiantesPrograma ? (
                <p className="text-sm text-muted-foreground">Cargando estudiantes...</p>
              ) : (
                <Select
                  value={kardexCreateForm.estudiante_programa_id.toString()}
                  onValueChange={(value) => setKardexCreateForm({ ...kardexCreateForm, estudiante_programa_id: parseInt(value) })}
                >
                  <SelectTrigger id="select-estudiante-programa">
                    <SelectValue placeholder="Buscar por nombre, carnet o programa..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <div className="px-2 py-1.5 sticky top-0 bg-background z-10 border-b">
                      <Input
                        placeholder="Buscar por nombre, carnet o programa..."
                        className="h-8"
                        value={searchEstudiantePrograma}
                        onChange={(e) => {
                          setSearchEstudiantePrograma(e.target.value)
                          e.stopPropagation()
                        }}
                      />
                    </div>
                    {filteredEstudiantesProgramaOptions.length === 0 ? (
                      <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                        {searchEstudiantePrograma ? "No se encontraron resultados" : "No hay estudiantes disponibles"}
                      </div>
                    ) : (
                      <>
                        {filteredEstudiantesProgramaOptions.map((item) => (
                          <SelectItem key={item.estudiante_programa_id} value={item.estudiante_programa_id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{item.estudiante_nombre}</span>
                              <span className="text-xs text-muted-foreground">
                                {item.carnet} • {item.programa_nombre}
                                {item.programa_abreviatura && ` (${item.programa_abreviatura})`}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                        {filteredEstudiantesProgramaOptions.length >= 50 && (
                          <div className="px-2 py-2 text-xs text-center text-muted-foreground border-t">
                            Mostrando {filteredEstudiantesProgramaOptions.length} resultados. 
                            {searchEstudiantePrograma === "" && " Use el buscador para refinar."}
                          </div>
                        )}
                      </>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Datos del pago */}
            <div className="grid gap-2">
              <Label htmlFor="kardex-cuota">ID Cuota (opcional)</Label>
              <Input
                id="kardex-cuota"
                type="number"
                value={kardexCreateForm.cuota_id || ""}
                onChange={(e) => setKardexCreateForm({ ...kardexCreateForm, cuota_id: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Vincular a una cuota específica"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="kardex-monto">Monto Pagado *</Label>
                <Input
                  id="kardex-monto"
                  type="number"
                  step="0.01"
                  value={kardexCreateForm.monto_pagado || ""}
                  onChange={(e) => setKardexCreateForm({ ...kardexCreateForm, monto_pagado: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="kardex-metodo">Método de Pago *</Label>
                <Select
                  value={kardexCreateForm.metodo_pago}
                  onValueChange={(value) => setKardexCreateForm({ ...kardexCreateForm, metodo_pago: value })}
                >
                  <SelectTrigger id="kardex-metodo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="deposito">Depósito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="kardex-fecha-pago">Fecha de Pago *</Label>
                <Input
                  id="kardex-fecha-pago"
                  type="date"
                  value={kardexCreateForm.fecha_pago}
                  onChange={(e) => setKardexCreateForm({ ...kardexCreateForm, fecha_pago: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="kardex-fecha-recibo">Fecha de Recibo</Label>
                <Input
                  id="kardex-fecha-recibo"
                  type="date"
                  value={kardexCreateForm.fecha_recibo}
                  onChange={(e) => setKardexCreateForm({ ...kardexCreateForm, fecha_recibo: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="kardex-estado">Estado de Pago *</Label>
                <Select
                  value={kardexCreateForm.estado_pago}
                  onValueChange={(value) => setKardexCreateForm({ ...kardexCreateForm, estado_pago: value })}
                >
                  <SelectTrigger id="kardex-estado">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aprobado">Aprobado</SelectItem>
                    <SelectItem value="pendiente_revision">Pendiente de Revisión</SelectItem>
                    <SelectItem value="rechazado">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="kardex-boleta">Número de Boleta</Label>
                <Input
                  id="kardex-boleta"
                  value={kardexCreateForm.numero_boleta}
                  onChange={(e) => setKardexCreateForm({ ...kardexCreateForm, numero_boleta: e.target.value })}
                  placeholder="Número de boleta o referencia"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kardex-banco">Banco</Label>
              <Input
                id="kardex-banco"
                value={kardexCreateForm.banco}
                onChange={(e) => setKardexCreateForm({ ...kardexCreateForm, banco: e.target.value })}
                placeholder="Nombre del banco"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kardex-observaciones">Observaciones</Label>
              <Textarea
                id="kardex-observaciones"
                value={kardexCreateForm.observaciones}
                onChange={(e) => setKardexCreateForm({ ...kardexCreateForm, observaciones: e.target.value })}
                placeholder="Notas adicionales..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateKardexModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={submitCreateKardex}
              disabled={kardexCreateForm.estudiante_programa_id === 0 || kardexCreateForm.monto_pagado <= 0}
            >
              Crear Movimiento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Crear Reconciliación */}
      <Dialog open={showCreateReconciliacionModal} onOpenChange={setShowCreateReconciliacionModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nueva Reconciliación Bancaria</DialogTitle>
            <DialogDescription>
              Registre una nueva conciliación bancaria
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="rec-banco">Banco *</Label>
                <Input
                  id="rec-banco"
                  value={reconciliacionCreateForm.bank}
                  onChange={(e) => setReconciliacionCreateForm({ ...reconciliacionCreateForm, bank: e.target.value })}
                  placeholder="Nombre del banco"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rec-referencia">Referencia *</Label>
                <Input
                  id="rec-referencia"
                  value={reconciliacionCreateForm.reference}
                  onChange={(e) => setReconciliacionCreateForm({ ...reconciliacionCreateForm, reference: e.target.value })}
                  placeholder="Número de referencia bancaria"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="rec-monto">Monto *</Label>
                <Input
                  id="rec-monto"
                  type="number"
                  step="0.01"
                  value={reconciliacionCreateForm.amount || ""}
                  onChange={(e) => setReconciliacionCreateForm({ ...reconciliacionCreateForm, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rec-fecha">Fecha *</Label>
                <Input
                  id="rec-fecha"
                  type="date"
                  value={reconciliacionCreateForm.date}
                  onChange={(e) => setReconciliacionCreateForm({ ...reconciliacionCreateForm, date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rec-estado">Estado</Label>
              <Select
                value={reconciliacionCreateForm.status}
                onValueChange={(value) => setReconciliacionCreateForm({ ...reconciliacionCreateForm, status: value })}
              >
                <SelectTrigger id="rec-estado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="conciliado">Conciliado</SelectItem>
                  <SelectItem value="rechazado">Rechazado</SelectItem>
                  <SelectItem value="sin_coincidencia">Sin Coincidencia</SelectItem>
                  <SelectItem value="imported">Importado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rec-kardex">ID Kardex de Pago (opcional)</Label>
              <Input
                id="rec-kardex"
                type="number"
                value={reconciliacionCreateForm.kardex_pago_id || ""}
                onChange={(e) => setReconciliacionCreateForm({ ...reconciliacionCreateForm, kardex_pago_id: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Vincular a un movimiento de kardex"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rec-notas">Notas</Label>
              <Textarea
                id="rec-notas"
                value={reconciliacionCreateForm.notes}
                onChange={(e) => setReconciliacionCreateForm({ ...reconciliacionCreateForm, notes: e.target.value })}
                placeholder="Notas adicionales..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateReconciliacionModal(false)}>
              Cancelar
            </Button>
            <Button onClick={submitCreateReconciliacion}>Crear Reconciliación</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteState)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteState(null)
            setDeleteReference("")
          }
        }}
      >
        {deleteState ? (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar {TAB_LABELS[deleteState.tab]}</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará definitivamente {deleteReference}. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setDeleteState(null)
                  setDeleteReference("")
                }}
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        ) : null}
      </AlertDialog>
    </div>
  )
}

