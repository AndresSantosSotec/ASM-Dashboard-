"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  getCuotasDashboard,
  getKardexDashboard,
  type CuotasDashboardEstudiante,
  type CuotasDashboardMetrics,
  type CuotasDashboardResumen,
  type MantenimientosFilters,
  type Pagination,
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
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
  { label: "200", value: 200 },
]

type PageSizeValue = number

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
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSizeValue>(100)
  const abortControllerRef = useRef<AbortController | null>(null)

  const totalItems = pagination?.total ?? 0
  const totalPages = pagination?.total_pages ?? 1

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
    if (!Number.isNaN(parsed) && parsed > 0) {
      setPage(1)
      setPageSize(parsed)
    }
  }, [])

  useEffect(() => {
    if (!summary) {
      return
    }

    console.info("[Reportes financieros] Resumen de cuotas", summary)
  }, [summary])

  const fetchCuotas = useCallback(async () => {
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    onLoadingChange?.(true)
    setError(null)
    onError?.(null)

    try {
      const paginatedFilters = {
        ...filters,
        page,
        per_page: pageSize,
      }

      const [dashboardResponse, cuotasDashboardResponse] = await Promise.all([
        getKardexDashboard(filters, { signal: controller.signal }),
        getCuotasDashboard(paginatedFilters, { signal: controller.signal }),
      ])

      if (controller.signal.aborted) {
        return
      }

      const cuotasSummary = cuotasDashboardResponse.summary ?? null
      const cuotasTimestamp = cuotasDashboardResponse.timestamp ?? null
      const estudiantesResponse = cuotasDashboardResponse.estudiantes ?? []
      const paginationData = cuotasDashboardResponse.pagination ?? null
      const metrics = dashboardResponse.cuotas ?? null

      setSummary(cuotasSummary)
      setTimestamp(cuotasTimestamp)
      setEstudiantes(estudiantesResponse)
      setPagination(paginationData)
      onSummaryChange?.(cuotasSummary, cuotasTimestamp)
      onMetricsChange?.(metrics)
    } catch (err) {
      if ((err as { code?: string })?.code === "ERR_CANCELED") {
        return
      }

      console.error("Error al cargar las cuotas", err)
      setSummary(null)
      setTimestamp(null)
      setEstudiantes([])
      setPagination(null)
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
  }, [filters, page, pageSize, onError, onLoadingChange, onMetricsChange, onSummaryChange])

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
                estudiantes.map((estudiante, index) => (
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
                    <TableCell>{formatCurrency(estudiante.saldo_pendiente)}</TableCell>
                    <TableCell>{estudiante.cuotas_pendientes}</TableCell>
                    <TableCell>{estudiante.cuotas_pagadas}</TableCell>
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
                Mostrando {pagination?.from ?? 0}-{pagination?.to ?? 0} de {totalItems} registros
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
                  <span className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!pagination?.has_more || loading}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

export default CuotasDashboardTab
