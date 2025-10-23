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
import { Eye, Loader2, Pencil, RefreshCw, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getKardexDashboard,
  getKardexData,
  type CuotasDashboardMetrics,
  type CuotasDashboardResumen,
  type KardexDashboardMetrics,
  type KardexPagoResumen,
  type ReconciliationDashboardMetrics,
  type ReconciliationRecordResumen,
} from "@/services/mantenimientos"
import { CuotasDashboardTab } from "./CuotasDashboardTab"

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

type TabKey = "kardex" | "reconciliaciones" | "cuotas"
type PaginationKey = "kardex" | "reconciliaciones"

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

const ACTION_LABELS: Record<RowAction, string> = {
  view: "Ver detalle",
  edit: "Editar",
  delete: "Eliminar",
}

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

export const ReportesFinancieros = () => {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<TabKey>("kardex")
  const [filtersByTab, setFiltersByTab] = useState<Record<TabKey, ReportFilters>>({
    kardex: createDefaultFilters(),
    reconciliaciones: createDefaultFilters(),
    cuotas: createDefaultFilters(),
  })
  const [formFiltersByTab, setFormFiltersByTab] = useState<Record<TabKey, ReportFilters>>({
    kardex: createDefaultFilters(),
    reconciliaciones: createDefaultFilters(),
    cuotas: createDefaultFilters(),
  })
  const [loadingStates, setLoadingStates] = useState<Record<TabKey, boolean>>({
    kardex: false,
    reconciliaciones: false,
    cuotas: false,
  })
  const [errors, setErrors] = useState<Record<TabKey, string | null>>({
    kardex: null,
    reconciliaciones: null,
    cuotas: null,
  })
  const [kardexTotals, setKardexTotals] = useState<KardexDashboardMetrics | null>(null)
  const [reconciliacionTotals, setReconciliacionTotals] =
    useState<ReconciliationDashboardMetrics | null>(null)
  const [cuotasTotals, setCuotasTotals] = useState<CuotasDashboardMetrics | null>(null)
  const [cuotasSummary, setCuotasSummary] = useState<CuotasDashboardResumen | null>(null)
  const [kardexRows, setKardexRows] = useState<KardexPagoResumen[]>([])
  const [reconciliationRows, setReconciliationRows] = useState<ReconciliationRecordResumen[]>([])
  const [kardexLastUpdated, setKardexLastUpdated] = useState<string | null>(null)
  const [reconciliacionesLastUpdated, setReconciliacionesLastUpdated] =
    useState<string | null>(null)
  const [pagination, setPagination] = useState<Record<PaginationKey, PaginationState>>({
    kardex: { page: 1, pageSize: 10 },
    reconciliaciones: { page: 1, pageSize: 10 },
  })

  // Add missing modal and form states
  const [kardexModal, setKardexModal] = useState<DetailModalState>(null)
  const [reconciliationModal, setReconciliationModal] = useState<DetailModalState>(null)
  const [kardexEditForm, setKardexEditForm] = useState<KardexEditFormState | null>(null)
  const [reconciliationEditForm, setReconciliationEditForm] = useState<ReconciliationEditFormState | null>(null)
  const [deleteState, setDeleteState] = useState<DeleteState>(null)
  const [deleteReference, setDeleteReference] = useState<string>("")

  // You may need to implement open/close modal handlers and form logic as needed.

  // Dummy handler for kardex edit submit to fix compile error
  const handleKardexEditSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Implement the logic to save kardex edit here
    // For now, just close the modal
    setKardexModal(null)
  }

  // Dummy handler for reconciliation edit submit to fix compile error
  const handleReconciliationEditSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Implement the logic to save reconciliation edit here
    // For now, just close the modal
    setReconciliationModal(null)
  }

  // Dummy handler for delete confirm to fix compile error
  const handleDeleteConfirm = () => {
    // Implement the logic to delete here
    // For now, just close the dialog
    setDeleteState(null)
  }

  // Handler to close any open detail modal
  const closeDetailModal = () => {
    setKardexModal(null)
    setReconciliationModal(null)
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
      default:
        return reconciliationRows.length
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

  const handlePageSizeChange = (key: PaginationKey, size: number) => {
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

    return loadingStates.reconciliaciones
  }

  const handleRowAction = (
    tab: "kardex" | "reconciliaciones",
    action: RowAction,
    reference?: string,
  ) => {
    const tabLabel = TAB_LABELS[tab]
    const actionLabel = ACTION_LABELS[action]

    toast({
      title: `${actionLabel} (${tabLabel})`,
      description:
        reference && reference.trim().length > 0
          ? `Acción pendiente de implementación para ${reference}.`
          : "Acción pendiente de implementación.",
    })
  }

  const cuotaFilters = useMemo(
    () => buildRequestFilters(filtersByTab.cuotas),
    [filtersByTab.cuotas],
  )
  const cuotasResumen = cuotasSummary

  const handleCuotasLoadingChange = useCallback((loading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, cuotas: loading }))
  }, [])

  const handleCuotasError = useCallback((message: string | null) => {
    setErrors((prev) => ({ ...prev, cuotas: message }))
  }, [])

  const handleCuotasMetricsChange = useCallback(
    (metrics: CuotasDashboardMetrics | null) => {
      setCuotasTotals(metrics)
    },
    [],
  )

  const handleCuotasSummaryChange = useCallback(
    (summary: CuotasDashboardResumen | null, _timestamp: string | null) => {
      setCuotasSummary(summary)
    },
    [],
  )

  const renderTablePlaceholder = (message: string, columns = 7, isLoading = false) => (
    <TableRow>
      <TableCell colSpan={columns} className="py-8 text-center text-sm text-muted-foreground">
        {isLoading ? "Cargando información..." : message}
      </TableCell>
    </TableRow>
  )

  const renderPaginationControls = (key: PaginationKey, totalItems: number) => {
    if (totalItems === 0) {
      return null
    }

    const { page, pageSize } = pagination[key]
    const totalPages =
      typeof pageSize === "number" && pageSize > 0
        ? Math.max(1, Math.ceil(totalItems / pageSize))
        : 1
    const safePage = Math.min(page, totalPages)
    const start = typeof pageSize === "number" ? (safePage - 1) * pageSize + 1 : 1
    const end = typeof pageSize === "number" ? Math.min(totalItems, safePage * pageSize) : totalItems
    const isLoading = getPaginationLoading(key)

    return (
      <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {start}-{end} de {totalItems} registros
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Por página:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => handlePageSizeChange(key, Number(value))}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Elementos" />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={String(option.value)} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage <= 1 || isLoading}
              onClick={() => handlePageChange(key, safePage - 1)}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {safePage} de {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages || isLoading}
              onClick={() => handlePageChange(key, safePage + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>
    )
  }

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

  const activeFormFilters = formFiltersByTab[activeTab]
  const activeLoading = loadingStates[activeTab]
  const activeError = activeTab === "cuotas" ? null : errors[activeTab]

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
            <div className="text-2xl font-semibold">{cuotasResumen?.estudiantes_activos ?? 0}</div>
            <div className="flex justify-between text-muted-foreground">
              <span>Saldo estimado</span>
              <span className="font-medium text-foreground">{formatCurrency(cuotasResumen?.saldo_estimado ?? 0)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>En mora</span>
              <span className="font-medium text-foreground">{cuotasResumen?.en_mora ?? 0}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Planes reestructurados</span>
              <span className="font-medium text-foreground">{cuotasResumen?.planes_reestructurados ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)}>
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="kardex" className="flex-1">Kardex</TabsTrigger>
          <TabsTrigger value="reconciliaciones" className="flex-1">Conciliaciones</TabsTrigger>
          <TabsTrigger value="cuotas" className="flex-1">Cuotas</TabsTrigger>
        </TabsList>

        <TabsContent value="kardex" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Movimientos del kardex</CardTitle>
              <CardDescription>
                Actualizado {kardexLastUpdated ? formatDateTime(kardexLastUpdated) : "sin información"}
              </CardDescription>
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
                      const referenceLabel = row.numero_boleta
                        ? `Boleta ${row.numero_boleta}`
                        : `Pago #${row.id}`

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
                                onClick={() => handleRowAction("kardex", "view", referenceLabel)}
                                aria-label="Ver detalle"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRowAction("kardex", "edit", referenceLabel)}
                                aria-label="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRowAction("kardex", "delete", referenceLabel)}
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
              <CardTitle>Conciliaciones bancarias</CardTitle>
              <CardDescription>
                Resultado de los registros importados desde las entidades financieras. Actualizado
                {" "}
                {reconciliacionesLastUpdated
                  ? formatDateTime(reconciliacionesLastUpdated)
                  : "sin información"}
              </CardDescription>
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
                      const reference = row.reference ?? `Conciliación #${row.id}`

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
                                onClick={() => handleRowAction("reconciliaciones", "view", reference)}
                                aria-label="Ver detalle"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRowAction("reconciliaciones", "edit", reference)}
                                aria-label="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRowAction("reconciliaciones", "delete", reference)}
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
          <CuotasDashboardTab
            filters={cuotaFilters}
            onLoadingChange={handleCuotasLoadingChange}
            onError={handleCuotasError}
            onMetricsChange={handleCuotasMetricsChange}
            onSummaryChange={handleCuotasSummaryChange}
          />
        </TabsContent>
      </Tabs>

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

      <AlertDialog
        open={Boolean(deleteState)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteState(null)
          }
        }}
      >
        {deleteState ? (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar {TAB_LABELS[deleteState.tab]}</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará definitivamente {deleteReference}. Esta funcionalidad está pendiente de integración,
                por lo que no se realizarán cambios reales por ahora.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteState(null)}>
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
