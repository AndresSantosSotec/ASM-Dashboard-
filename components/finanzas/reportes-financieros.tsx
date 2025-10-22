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
import { Loader2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getCuotasDashboard,
  getKardexDashboard,
  getKardexData,
  type CuotaProgramaResumen,
  type CuotasDashboardEstudiante,
  type CuotasDashboardResponse,
  type KardexDashboardResponse,
  type KardexPagoResumen,
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

const DEFAULT_FILTERS: ReportFilters = {
  search: "",
  estadoPago: "todos",
  estadoReconciliacion: "todos",
  estadoCuota: "todos",
  limit: 50,
}

const buildRequestFilters = (filters: ReportFilters) => ({
  search: filters.search || undefined,
  estado_pago: filters.estadoPago !== "todos" ? filters.estadoPago : undefined,
  estado_reconciliacion: filters.estadoReconciliacion !== "todos" ? filters.estadoReconciliacion : undefined,
  estado_cuota: filters.estadoCuota !== "todos" ? filters.estadoCuota : undefined,
  limit: filters.limit,
})

export const ReportesFinancieros = () => {
  const [activeTab, setActiveTab] = useState("kardex")
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_FILTERS)
  const [formFilters, setFormFilters] = useState<ReportFilters>(DEFAULT_FILTERS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dashboardSummary, setDashboardSummary] = useState<KardexDashboardResponse | null>(null)
  const [kardexRows, setKardexRows] = useState<KardexPagoResumen[]>([])
  const [reconciliationRows, setReconciliationRows] = useState<ReconciliationRecordResumen[]>([])
  const [cuotasRows, setCuotasRows] = useState<CuotaProgramaResumen[]>([])
  const [cuotasDashboard, setCuotasDashboard] = useState<CuotasDashboardResponse | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    setFormFilters(filters)
  }, [filters])

  useEffect(() => {
    const controller = new AbortController()

    const loadData = async () => {
      setLoading(true)
      setError(null)

      const params = buildRequestFilters(filters)

      try {
        const [kardexDashboard, kardexData, cuotasDashboardResponse] = await Promise.all([
          getKardexDashboard(params, { signal: controller.signal }),
          getKardexData(params, { signal: controller.signal }),
          getCuotasDashboard(params, { signal: controller.signal }),
        ])

        if (controller.signal.aborted) {
          return
        }

        setDashboardSummary(kardexDashboard)
        setKardexRows(kardexData.kardex)
        setReconciliationRows(kardexData.reconciliaciones)
        setCuotasRows(kardexData.cuotas)
        setCuotasDashboard(cuotasDashboardResponse)
        setLastUpdated(kardexData.timestamp)
      } catch (err) {
        if ((err as { code?: string })?.code === "ERR_CANCELED") {
          return
        }

        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message ?? err.message ?? "No se pudieron cargar los reportes")
        } else {
          setError((err as Error).message ?? "No se pudieron cargar los reportes")
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      controller.abort()
    }
  }, [filters])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFilters(formFilters)
  }

  const handleReset = () => {
    setFormFilters(DEFAULT_FILTERS)
    setFilters(DEFAULT_FILTERS)
  }

  const kardexTotals = useMemo(() => {
    if (!dashboardSummary) {
      return null
    }

    return dashboardSummary.kardex
  }, [dashboardSummary])

  const reconciliacionTotals = useMemo(() => {
    if (!dashboardSummary) {
      return null
    }

    return dashboardSummary.reconciliaciones
  }, [dashboardSummary])

  const cuotasTotals = useMemo(() => {
    if (!dashboardSummary) {
      return null
    }

    return dashboardSummary.cuotas
  }, [dashboardSummary])

  const estudiantesResumen = useMemo(() => cuotasDashboard?.summary ?? null, [cuotasDashboard])

  const renderTablePlaceholder = (message: string, columns = 7) => (
    <TableRow>
      <TableCell colSpan={columns} className="py-8 text-center text-sm text-muted-foreground">
        {loading ? "Cargando información..." : message}
      </TableCell>
    </TableRow>
  )

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
                  value={formFilters.search}
                  onChange={(event) => setFormFilters((prev) => ({ ...prev, search: event.target.value }))}
                  placeholder="Buscar por estudiante, carnet, programa o referencia"
                  className="w-full min-w-[220px] flex-1"
                />
                <Select
                  value={formFilters.estadoPago}
                  onValueChange={(value) => setFormFilters((prev) => ({ ...prev, estadoPago: value }))}
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
                <Select
                  value={formFilters.estadoReconciliacion}
                  onValueChange={(value) => setFormFilters((prev) => ({ ...prev, estadoReconciliacion: value }))}
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
                <Select
                  value={formFilters.estadoCuota}
                  onValueChange={(value) => setFormFilters((prev) => ({ ...prev, estadoCuota: value }))}
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
                <Select
                  value={String(formFilters.limit)}
                  onValueChange={(value) => setFormFilters((prev) => ({ ...prev, limit: Number(value) }))}
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
                <Button type="button" variant="outline" onClick={handleReset} disabled={loading}>
                  Restablecer
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
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

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Ocurrió un problema</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                Actualizado {lastUpdated ? formatDateTime(lastUpdated) : "sin información"}
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kardexRows.length === 0 ? (
                    renderTablePlaceholder("No se encontraron movimientos para los filtros seleccionados")
                  ) : (
                    kardexRows.map((row) => {
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
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reconciliaciones" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Conciliaciones bancarias</CardTitle>
              <CardDescription>
                Resultado de los registros importados desde las entidades financieras
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reconciliationRows.length === 0 ? (
                    renderTablePlaceholder(
                      "No se encontraron conciliaciones para los filtros seleccionados",
                      6,
                    )
                  ) : (
                    reconciliationRows.map((row) => {
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
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cuotas" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Seguimiento por estudiante</CardTitle>
              <CardDescription>Resumen de cuotas pendientes y próximas fechas de pago</CardDescription>
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
                  {!cuotasDashboard || cuotasDashboard.estudiantes.length === 0 ? (
                    renderTablePlaceholder(
                      "No se encontraron estudiantes con cuotas para los filtros seleccionados",
                      6,
                    )
                  ) : (
                    cuotasDashboard.estudiantes.map(
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
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cuotas registradas</CardTitle>
              <CardDescription>Detalle de cuotas individuales de estudiantes</CardDescription>
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
                    )
                  ) : (
                    cuotasRows.map((row) => {
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
