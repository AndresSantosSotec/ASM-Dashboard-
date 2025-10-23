"use client"

import { useEffect, useMemo, useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Eye, Loader2, Pencil, RefreshCw, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getCuotasDashboard,
  getKardexDashboard,
  getKardexData,
  type CuotaProgramaResumen,
  type CuotasDashboardEstudiante,
  type CuotasDashboardResponse,
  type CuotasDashboardMetrics,
  type KardexDashboardMetrics,
  type KardexPagoResumen,
  type ReconciliationDashboardMetrics,
  type ReconciliationRecordResumen,
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

interface ReportFilters {
  search: string
  estadoPago: string
  estadoReconciliacion: string
  estadoCuota: string
  limit: number
}

const BASE_FILTERS: ReportFilters = {
  search: "",
  estadoPago: "todos",
  estadoReconciliacion: "todos",
  estadoCuota: "todos",
  limit: 50,
}

type TabKey = "kardex" | "reconciliaciones" | "cuotas"
type PaginationKey = "kardex" | "reconciliaciones" | "cuotasEstudiantes" | "cuotas"

interface PaginationState {
  page: number
  pageSize: number
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

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
  limit: filters.limit,
})

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
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
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

    return loadingStates.cuotas
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

  const estudiantesResumen = useMemo(() => cuotasDashboard?.summary ?? null, [cuotasDashboard])
  const estudiantes = useMemo(() => cuotasDashboard?.estudiantes ?? [], [cuotasDashboard])

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
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * pageSize + 1
    const end = Math.min(totalItems, safePage * pageSize)
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
                  <SelectItem key={option} value={String(option)}>
                    {option}
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
    const start = (page - 1) * pageSize
    return kardexRows.slice(start, start + pageSize)
  }, [kardexRows, pagination.kardex])

  const paginatedReconciliationRows = useMemo(() => {
    const { page, pageSize } = pagination.reconciliaciones
    const start = (page - 1) * pageSize
    return reconciliationRows.slice(start, start + pageSize)
  }, [reconciliationRows, pagination.reconciliaciones])

  const paginatedCuotasRows = useMemo(() => {
    const { page, pageSize } = pagination.cuotas
    const start = (page - 1) * pageSize
    return cuotasRows.slice(start, start + pageSize)
  }, [cuotasRows, pagination.cuotas])

  const paginatedCuotasEstudiantes = useMemo(() => {
    const { page, pageSize } = pagination.cuotasEstudiantes
    const start = (page - 1) * pageSize
    return estudiantes.slice(start, start + pageSize)
  }, [estudiantes, pagination.cuotasEstudiantes])

  useEffect(() => {
    setPagination((prev) => {
      const { page, pageSize } = prev.kardex
      const totalPages = Math.max(1, Math.ceil(kardexRows.length / pageSize))
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
      const totalPages = Math.max(1, Math.ceil(reconciliationRows.length / pageSize))
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
      const totalPages = Math.max(1, Math.ceil(cuotasRows.length / pageSize))
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
      const totalPages = Math.max(1, Math.ceil(estudiantes.length / pageSize))
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
                    {[25, 50, 100, 200, 500].map((value) => (
                      <SelectItem key={value} value={String(value)}>
                        {value} registros
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estudiantes.length === 0 ? (
                    renderTablePlaceholder(
                      "No se encontraron estudiantes con cuotas para los filtros seleccionados",
                      6,
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
                        </TableRow>
                      ),
                    )
                  )}
                </TableBody>
              </Table>
              {renderPaginationControls("cuotasEstudiantes", estudiantes.length)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cuotas registradas</CardTitle>
              <CardDescription>
                Detalle de cuotas individuales de estudiantes. Actualizado
                {" "}
                {cuotasLastUpdated ? formatDateTime(cuotasLastUpdated) : "sin información"}
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Programa</TableHead>
                    <TableHead>Cuota</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cuotasRows.length === 0 ? (
                    renderTablePlaceholder(
                      "No se encontraron cuotas para los filtros seleccionados",
                      6,
                      loadingStates.cuotas,
                    )
                  ) : (
                    paginatedCuotasRows.map((row) => {
                      const estado = row.estado ?? ""
                      const estadoClase = cuotaEstadoClasses[estado] ?? "bg-slate-500/15 text-slate-700 border-slate-500/30"
                      const estadoLabel = cuotaEstadoLabels[estado] ?? (estado ? estado.replace(/_/g, " ") : "Sin estado")

                      return (
                        <TableRow key={row.id}>
                          <TableCell className="min-w-[200px]">
                            <div className="font-medium">{row.prospecto?.nombre ?? "Sin nombre"}</div>
                            <div className="text-xs text-muted-foreground">{row.prospecto?.carnet ?? "-"}</div>
                          </TableCell>
                          <TableCell className="min-w-[160px]">{row.programa?.nombre ?? "-"}</TableCell>
                          <TableCell>
                            <div>Cuota #{row.numero_cuota}</div>
                            <div className="text-xs text-muted-foreground">Monto: {formatCurrency(row.monto)}</div>
                          </TableCell>
                          <TableCell>{formatDate(row.fecha_vencimiento)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("capitalize", estadoClase)}>
                              {estadoLabel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {row.paid_at ? (
                              <div className="text-xs">
                                <div className="font-medium">Pagado</div>
                                <div>{formatDateTime(row.paid_at)}</div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Sin pago registrado</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
              {renderPaginationControls("cuotas", cuotasRows.length)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
