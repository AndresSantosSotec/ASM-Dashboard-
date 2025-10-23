"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  getCuotasDashboard,
  getEstudiantesActivos,
  getKardexDashboard,
  type CuotasDashboardEstudiante,
  type CuotasDashboardMetrics,
  type CuotasDashboardResumen,
  type EstudianteActivoResumen,
  type MantenimientosFilters,
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
    return "sin información"
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString("es-GT")
}

const PAGE_SIZE_OPTIONS = [
  { label: "10", value: 10 },
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
  { label: "Todos", value: "all" as const },
]

type PageSizeValue = number | "all"

const mergeCuotasWithActivos = (
  cuotas: CuotasDashboardEstudiante[],
  activos: EstudianteActivoResumen[],
) => {
  const merged = cuotas.map((item) => ({ ...item }))
  const indexByKey = new Map<string, number>()

  const keyFromCuota = (item: CuotasDashboardEstudiante, index: number) => {
    if (item.estudiante_programa_id !== null && item.estudiante_programa_id !== undefined) {
      return `ep-${item.estudiante_programa_id}`
    }

    if (item.prospecto?.id !== null && item.prospecto?.id !== undefined) {
      return `prospecto-${item.prospecto.id}`
    }

    return `idx-${index}`
  }

  merged.forEach((item, index) => {
    indexByKey.set(keyFromCuota(item, index), index)
  })

  const ensureProspect = (
    previous: CuotasDashboardEstudiante["prospecto"],
    activo: EstudianteActivoResumen,
  ): CuotasDashboardEstudiante["prospecto"] => {
    const base =
      previous ??
      ({
        id: activo.prospecto_id ?? null,
        nombre: activo.nombre_completo ?? "Sin nombre",
        carnet: activo.carnet ?? "",
        correo: activo.correo_electronico ?? "",
      } as CuotasDashboardEstudiante["prospecto"])

    return {
      ...base,
      id: base.id ?? activo.prospecto_id ?? null,
      nombre: base.nombre ?? activo.nombre_completo ?? "Sin nombre",
      carnet: base.carnet ?? activo.carnet ?? "",
      correo: base.correo ?? activo.correo_electronico ?? "",
      telefono: base.telefono ?? null,
    }
  }

  const ensurePrograma = (
    previous: CuotasDashboardEstudiante["programa"],
    activo: EstudianteActivoResumen,
  ): CuotasDashboardEstudiante["programa"] => {
    if (previous) {
      return previous
    }

    if (activo.nomenclatura) {
      return { id: null, nombre: activo.nomenclatura }
    }

    return previous
  }

  activos.forEach((activo) => {
    if (!activo) {
      return
    }

    const key =
      activo.estudiante_programa_id !== null && activo.estudiante_programa_id !== undefined
        ? `ep-${activo.estudiante_programa_id}`
        : activo.prospecto_id !== null && activo.prospecto_id !== undefined
          ? `prospecto-${activo.prospecto_id}`
          : null

    if (!key) {
      return
    }

    const existingIndex = indexByKey.get(key)

    if (existingIndex !== undefined) {
      const previous = merged[existingIndex]
      merged[existingIndex] = {
        ...previous,
        estudiante_programa_id: previous.estudiante_programa_id ?? activo.estudiante_programa_id ?? null,
        prospecto: ensureProspect(previous.prospecto, activo),
        programa: ensurePrograma(previous.programa, activo),
      }

      return
    }

    merged.push({
      estudiante_programa_id: activo.estudiante_programa_id ?? null,
      prospecto: {
        id: activo.prospecto_id ?? null,
        nombre: activo.nombre_completo ?? "Sin nombre",
        carnet: activo.carnet ?? "",
        correo: activo.correo_electronico ?? "",
        telefono: null,
      },
      programa: activo.nomenclatura ? { id: null, nombre: activo.nomenclatura } : null,
      saldo_pendiente: null,
      cuotas_pendientes: null,
      cuotas_pagadas: null,
      proxima_cuota: null,
      cuotas: [],
    })

    indexByKey.set(key, merged.length - 1)
  })

  return merged
}

interface CuotasDashboardTabProps {
  filters?: MantenimientosFilters
  onLoadingChange?: (loading: boolean) => void
  onError?: (error: string | null) => void
  onMetricsChange?: (metrics: CuotasDashboardMetrics | null) => void
  onSummaryChange?: (summary: CuotasDashboardResumen | null, timestamp: string | null) => void
}

export const CuotasDashboardTab = ({
  filters,
  onLoadingChange,
  onError,
  onMetricsChange,
  onSummaryChange,
}: CuotasDashboardTabProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<CuotasDashboardResumen | null>(null)
  const [timestamp, setTimestamp] = useState<string | null>(null)
  const [estudiantes, setEstudiantes] = useState<CuotasDashboardEstudiante[]>([])
  const [activeStudentsTotal, setActiveStudentsTotal] = useState<number | null>(null)
  const [activeStudentsTimestamp, setActiveStudentsTimestamp] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSizeValue>(10)
  const abortControllerRef = useRef<AbortController | null>(null)
  const totalItems = estudiantes.length

  const paginatedEstudiantes = useMemo(() => {
    if (pageSize === "all") {
      return estudiantes
    }

    const start = (page - 1) * pageSize
    return estudiantes.slice(start, start + pageSize)
  }, [estudiantes, page, pageSize])

  const totalPages = useMemo(() => {
    if (pageSize === "all") {
      return 1
    }

    return Math.max(1, Math.ceil(totalItems / pageSize))
  }, [pageSize, totalItems])

  const handlePageChange = useCallback(
    (nextPage: number) => {
      const safePage = Math.min(Math.max(1, nextPage), totalPages)
      if (safePage !== page) {
        setPage(safePage)
      }
    },
    [page, totalPages],
  )

  const handlePageSizeChange = useCallback((value: string) => {
    const parsed = Number(value)
    setPage(1)
    setPageSize(Number.isNaN(parsed) ? "all" : parsed)
  }, [])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  useEffect(() => {
    if (!summary) {
      return
    }

    console.info("[Reportes financieros] Resumen de cuotas", summary)
  }, [summary])

  useEffect(() => {
    if (activeStudentsTotal === null) {
      return
    }

    console.info("[Reportes financieros] Total de estudiantes activos", {
      total: activeStudentsTotal,
      timestamp: activeStudentsTimestamp ?? undefined,
    })
  }, [activeStudentsTotal, activeStudentsTimestamp])

  const fetchCuotas = useCallback(async () => {
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    onLoadingChange?.(true)
    setError(null)
    onError?.(null)

    try {
      const [dashboardResponse, cuotasDashboardResponse, activosResponse] = await Promise.all([
        getKardexDashboard(filters, { signal: controller.signal }),
        getCuotasDashboard(filters, { signal: controller.signal }),
        getEstudiantesActivos(filters, { signal: controller.signal }),
      ])

      if (controller.signal.aborted) {
        return
      }

      const cuotasSummary = cuotasDashboardResponse.summary ?? null
      const cuotasTimestamp = cuotasDashboardResponse.timestamp ?? null
      const estudiantesResponse = Array.isArray(cuotasDashboardResponse.estudiantes)
        ? cuotasDashboardResponse.estudiantes
        : []
      const metrics = dashboardResponse.cuotas ?? null

      const activosEstudiantes = Array.isArray(activosResponse.estudiantes)
        ? activosResponse.estudiantes
        : []
      const activosTotal =
        typeof activosResponse.total_estudiantes_activos === "number"
          ? activosResponse.total_estudiantes_activos
          : activosEstudiantes.length
      const activosTimestamp = activosResponse.timestamp ?? null

      const nextSummaryBase: CuotasDashboardResumen | null =
        cuotasSummary ??
        (Number.isFinite(activosTotal)
          ? {
              estudiantes_activos: activosTotal,
              saldo_estimado: 0,
              en_mora: 0,
              planes_reestructurados: 0,
            }
          : null)

      const nextSummary =
        nextSummaryBase && Number.isFinite(activosTotal)
          ? {
              ...nextSummaryBase,
              estudiantes_activos:
                activosTotal > 0
                  ? activosTotal
                  : nextSummaryBase.estudiantes_activos ?? activosTotal,
            }
          : nextSummaryBase

      const mergedEstudiantes = mergeCuotasWithActivos(estudiantesResponse, activosEstudiantes)

      setSummary(nextSummary)
      setTimestamp(cuotasTimestamp ?? activosTimestamp ?? null)
      setEstudiantes(mergedEstudiantes)
      setActiveStudentsTotal(Number.isFinite(activosTotal) ? activosTotal : null)
      setActiveStudentsTimestamp(activosTimestamp ?? null)
      setPage(1)
      onSummaryChange?.(nextSummary, cuotasTimestamp ?? activosTimestamp ?? null)
      onMetricsChange?.(metrics)
    } catch (err) {
      if ((err as { code?: string })?.code === "ERR_CANCELED") {
        return
      }

      console.error("Error al cargar las cuotas", err)
      setSummary(null)
      setTimestamp(null)
      setEstudiantes([])
      setActiveStudentsTotal(null)
      setActiveStudentsTimestamp(null)
      setError("Error al cargar las cuotas.")
      onSummaryChange?.(null, null)
      onMetricsChange?.(null)
      onError?.("Error al cargar las cuotas.")
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
        onLoadingChange?.(false)
      }
    }
  }, [filters, onError, onLoadingChange, onMetricsChange, onSummaryChange])

  useEffect(() => {
    fetchCuotas()

    return () => {
      abortControllerRef.current?.abort()
    }
  }, [fetchCuotas])

  const handleRetry = () => {
    fetchCuotas()
  }

  const renderPlaceholder = (message: string) => (
    <TableRow>
      <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
        {message}
      </TableCell>
    </TableRow>
  )

  return (
    <div className="space-y-4">
      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Error al cargar las cuotas</CardTitle>
            <CardDescription>Ocurrió un problema al obtener la información de cuotas.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Puedes intentar nuevamente para recargar la información.
            </p>
            <Button type="button" onClick={handleRetry} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Estudiantes activos</CardTitle>
            <CardDescription className="text-xs">Con planes de pago registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summary?.estudiantes_activos ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Saldo estimado</CardTitle>
            <CardDescription className="text-xs">Monto pendiente proyectado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(summary?.saldo_estimado)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Estudiantes en mora</CardTitle>
            <CardDescription className="text-xs">Con cuotas vencidas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summary?.en_mora ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Planes reestructurados</CardTitle>
            <CardDescription className="text-xs">Acuerdos activos con ajustes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summary?.planes_reestructurados ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seguimiento por estudiante</CardTitle>
          <CardDescription>
            Resumen de cuotas pendientes y próximas fechas de pago. Actualizado {formatDateTime(timestamp)}.
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
              {totalItems === 0 ? (
                loading
                  ? renderPlaceholder("Cargando datos de cuotas…")
                  : renderPlaceholder(
                      "No se encontraron estudiantes con cuotas para los filtros seleccionados.",
                    )
              ) : (
                paginatedEstudiantes.map((estudiante, index) => (
                  <TableRow
                    key={
                      estudiante.estudiante_programa_id ?? estudiante.prospecto?.id ?? `cuota-${index}`
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
                    <TableCell>
                      {estudiante.saldo_pendiente !== null && estudiante.saldo_pendiente !== undefined
                        ? formatCurrency(estudiante.saldo_pendiente)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {estudiante.cuotas_pendientes !== null && estudiante.cuotas_pendientes !== undefined
                        ? estudiante.cuotas_pendientes
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {estudiante.cuotas_pagadas !== null && estudiante.cuotas_pagadas !== undefined
                        ? estudiante.cuotas_pagadas
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {estudiante.proxima_cuota ? (
                        <div className="text-xs">
                          <div className="font-medium">Cuota #{estudiante.proxima_cuota.numero_cuota}</div>
                          <div>{formatDate(estudiante.proxima_cuota.fecha_vencimiento)}</div>
                          <div className="text-muted-foreground">
                            {formatCurrency(estudiante.proxima_cuota.monto)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin próximas cuotas</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {totalItems > 0 ? (
            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                {pageSize === "all"
                  ? `Mostrando ${totalItems} de ${totalItems} registros`
                  : `Mostrando ${(page - 1) * (pageSize as number) + 1}-${
                      Math.min(totalItems, page * (pageSize as number))
                    } de ${totalItems} registros`}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Por página:</span>
                  <Select value={String(pageSize)} onValueChange={handlePageSizeChange} disabled={loading}>
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
                {pageSize === "all" ? null : (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page <= 1 || loading}
                      onClick={() => handlePageChange(page - 1)}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages || loading}
                      onClick={() => handlePageChange(page + 1)}
                    >
                      Siguiente
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

export default CuotasDashboardTab
