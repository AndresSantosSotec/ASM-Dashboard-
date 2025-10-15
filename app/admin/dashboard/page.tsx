"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  Calendar,
  CalendarIcon,
  FileText,
  GraduationCapIcon as Graduation,
  Loader2,
  Users,
  type LucideIcon,
} from "lucide-react"

import { StatsCard } from "@/components/admin/dashboard/stats-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import {
  exportAdministracionDashboard,
  fetchAdministracionDashboard,
  type AdministracionDashboardResponse,
  type DashboardNotifications,
  type EstadisticasGenerales,
  type EvolutionPoint,
  type MultiplesProgramasStats,
  type NotificationItem,
  type ProgramDistribution,
  type StudentProgramStat,
} from "@/services/administracion"

type DateRange = "6m" | "1y" | "all"

type NormalizedNotification = NotificationItem & { categoria: string }

interface NotificationVisuals {
  icon: LucideIcon
  containerClass: string
  iconClass: string
  linkClass: string
}

const integerFormatter = new Intl.NumberFormat("es-PE")
const decimalFormatter = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 })
const percentFormatter = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 })

const defaultNotificationVisuals: NotificationVisuals = {
  icon: FileText,
  containerClass: "bg-muted/40",
  iconClass: "text-muted-foreground",
  linkClass: "text-primary",
}

const formatNumber = (value?: number | null) => {
  if (value === null || value === undefined) {
    return "—"
  }

  return integerFormatter.format(value)
}

const formatDecimal = (value?: number | null) => {
  if (value === null || value === undefined) {
    return "—"
  }

  return decimalFormatter.format(value)
}

const formatPercent = (value?: number | null, { showSign = true }: { showSign?: boolean } = {}) => {
  if (value === null || value === undefined) {
    return "—"
  }

  const formatted = percentFormatter.format(Math.abs(value))
  const sign = showSign ? (value > 0 ? "+" : value < 0 ? "-" : "") : ""
  return `${sign}${formatted}%`
}

const getTrendTone = (value?: number | null) => {
  if (value === null || value === undefined) {
    return "muted" as const
  }

  if (value > 0) {
    return "success" as const
  }

  if (value < 0) {
    return "danger" as const
  }

  return "muted" as const
}

const getTrendLabel = (value?: number | null, suffix = "vs mes anterior") => {
  if (value === null || value === undefined) {
    return undefined
  }

  return `${formatPercent(value)} ${suffix}`
}

const formatSummaryLabel = (label: string) => {
  const spaced = label.replace(/[_-]/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2")
  return spaced.replace(/\b\w/g, (char) => char.toUpperCase()).trim()
}

const getErrorMessage = (error: unknown) => {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof (error.response as { data?: unknown }).data === "object"
  ) {
    const data = (error.response as { data?: { message?: string; error?: string } }).data
    return data?.message || data?.error || "No se pudo completar la operación."
  }

  if (error instanceof Error) {
    return error.message
  }

  return "No se pudo completar la operación."
}

const mergeSummaryEntries = (stats?: EstadisticasGenerales) => {
  if (!stats) {
    return [] as Array<[string, number]>
  }

  const entries = new Map<string, number>()
  const sources = [stats.resumen, stats.totales]

  sources.forEach((source) => {
    if (!source) return

    Object.entries(source).forEach(([key, value]) => {
      if (typeof value === "number" && Number.isFinite(value)) {
        entries.set(key, value)
      }
    })
  })

  return Array.from(entries.entries())
}

const normalizeNotifications = (notifications?: DashboardNotifications): NormalizedNotification[] => {
  if (!notifications) {
    return []
  }

  const normalized: NormalizedNotification[] = []

  Object.entries(notifications).forEach(([categoria, payload]) => {
    if (!payload) {
      return
    }

    if (Array.isArray(payload)) {
      payload.forEach((item) => {
        if (item) {
          normalized.push({ ...item, categoria })
        }
      })
      return
    }

    if (typeof payload === "object") {
      normalized.push({ ...(payload as NotificationItem), categoria })
    }
  })

  return normalized
}

const getNotificationVisuals = (categoria: string): NotificationVisuals => {
  const normalized = categoria.toLowerCase()

  if (normalized.includes("solicitud")) {
    return {
      icon: FileText,
      containerClass: "bg-blue-50",
      iconClass: "text-blue-500",
      linkClass: "text-blue-600",
    }
  }

  if (normalized.includes("gradu")) {
    return {
      icon: Graduation,
      containerClass: "bg-orange-50",
      iconClass: "text-orange-500",
      linkClass: "text-orange-600",
    }
  }

  if (normalized.includes("curso") || normalized.includes("inicio")) {
    return {
      icon: Calendar,
      containerClass: "bg-purple-50",
      iconClass: "text-purple-500",
      linkClass: "text-purple-600",
    }
  }

  return defaultNotificationVisuals
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-3 p-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((__, idx) => (
                <Skeleton key={idx} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-52" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <Skeleton className="h-5 w-56" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
export default function AdminDashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>("6m")
  const [dashboardData, setDashboardData] = useState<AdministracionDashboardResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const { toast } = useToast()

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchAdministracionDashboard()
      setDashboardData(data ?? null)
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      setDashboardData(null)
      console.error("Error fetching administración dashboard:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const handleExport = useCallback(async () => {
    try {
      setExporting(true)
      await exportAdministracionDashboard('xlsx')

      toast({
        title: "Exportación lista",
        description: "Se descargó el reporte del dashboard administrativo.",
      })
    } catch (err) {
      const message = getErrorMessage(err)
      toast({
        title: "No se pudo exportar",
        description: message,
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }, [toast])

  const normalizedNotifications = useMemo(() => {
    const data = normalizeNotifications(dashboardData?.notificaciones)
    return data.sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
  }, [dashboardData])

  const evolutionData = useMemo<EvolutionPoint[]>(() => {
    const data = dashboardData?.evolucionMatricula ?? []
    if (!data.length) {
      return []
    }

    const limit = dateRange === "6m" ? 6 : dateRange === "1y" ? 12 : data.length
    const start = Math.max(data.length - limit, 0)
    return data.slice(start)
  }, [dashboardData, dateRange])

  const maxEvolutionValue = useMemo(
    () =>
      evolutionData.reduce(
        (max, point) => Math.max(max, typeof point.total === "number" ? point.total : 0),
        0
      ),
    [evolutionData]
  )

  const distributionData = useMemo<ProgramDistribution[]>(
    () => dashboardData?.distribucionProgramas ?? [],
    [dashboardData]
  )

  const totalDistribution = useMemo(
    () => distributionData.reduce((acc, item) => acc + (item.totalEstudiantes ?? 0), 0),
    [distributionData]
  )

  const summaryEntries = useMemo(() => mergeSummaryEntries(dashboardData?.estadisticas), [dashboardData])

  const multiplesProgramas: MultiplesProgramasStats | undefined = dashboardData?.estadisticas?.multiplesProgramas

  const topStudents = useMemo(
    () =>
      (multiplesProgramas?.topEstudiantes ?? []).filter(
        (student): student is StudentProgramStat => Boolean(student)
      ),
    [multiplesProgramas]
  )

  const multiplesProgramasValues =
    multiplesProgramas &&
    [
      multiplesProgramas.total,
      multiplesProgramas.porcentaje,
      multiplesProgramas.promedioProgramas,
      multiplesProgramas.maximoProgramas,
    ].some((value) => value !== null && value !== undefined)

  const showMultiplesProgramas = Boolean(multiplesProgramasValues || topStudents.length > 0)

  const proximos = dashboardData?.proximosInicios
  const proximosDescription = useMemo(() => {
    if (!proximos) {
      return undefined
    }

    const parts: string[] = []
    if (proximos.cursos !== null && proximos.cursos !== undefined) {
      parts.push(`Cursos: ${formatNumber(proximos.cursos)}`)
    }
    if (proximos.periodos !== null && proximos.periodos !== undefined) {
      parts.push(`Períodos: ${formatNumber(proximos.periodos)}`)
    }

    return parts.length ? parts.join(" • ") : undefined
  }, [proximos])

  const graduaciones = dashboardData?.graduaciones

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Dashboard Administrativo</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting || loading || !dashboardData}
          >
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              "Exportar datos"
            )}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
            Imprimir
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al cargar el dashboard</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <DashboardSkeleton />
      ) : dashboardData ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Matrículas del Mes"
              value={formatNumber(dashboardData.matriculas?.total)}
              subtitle={getTrendLabel(dashboardData.matriculas?.porcentajeCambio)}
              description={
                dashboardData.matriculas?.mesAnterior !== undefined &&
                  dashboardData.matriculas?.mesAnterior !== null
                  ? `Mes anterior: ${formatNumber(dashboardData.matriculas?.mesAnterior)}`
                  : undefined
              }
              icon={Users}
              tone={getTrendTone(dashboardData.matriculas?.porcentajeCambio)}
              iconClassName="text-blue-600"
            />
            <StatsCard
              title="Alumnos Nuevos"
              value={formatNumber(dashboardData.alumnosNuevos?.total)}
              subtitle={getTrendLabel(dashboardData.alumnosNuevos?.porcentajeCambio)}
              icon={Users}
              tone={getTrendTone(dashboardData.alumnosNuevos?.porcentajeCambio)}
              iconClassName="text-emerald-600"
            />
            <StatsCard
              title="Próximos Inicios"
              value={formatNumber(proximos?.total)}
              subtitle="Próximos 30 días"
              description={proximosDescription}
              icon={Calendar}
              tone="muted"
              iconClassName="text-purple-600"
            />
            <StatsCard
              title="Graduaciones"
              value={formatNumber(graduaciones?.total)}
              subtitle={graduaciones?.proximoTrimestre ? "Próximo trimestre" : "Sin proyección cercana"}
              icon={Graduation}
              tone="muted"
              iconClassName="text-orange-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Evolución de Matrícula</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant={dateRange === "6m" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDateRange("6m")}
                    >
                      6 Meses
                    </Button>
                    <Button
                      variant={dateRange === "1y" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDateRange("1y")}
                    >
                      1 Año
                    </Button>
                    <Button
                      variant={dateRange === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDateRange("all")}
                    >
                      Todo
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {evolutionData.length > 0 ? (
                  <div className="space-y-4">
                    {evolutionData.map((point, index) => {
                      const percentage =
                        maxEvolutionValue > 0 ? Math.min((point.total / maxEvolutionValue) * 100, 100) : 0

                      return (
                        <div key={`${point.periodo}-${index}`} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{point.periodo}</span>
                            <span className="font-semibold">{formatNumber(point.total)}</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                          {point.variacion !== null && point.variacion !== undefined ? (
                            <p
                              className={cn(
                                "text-xs font-medium",
                                point.variacion >= 0 ? "text-emerald-600" : "text-rose-600"
                              )}
                            >
                              {formatPercent(point.variacion)}
                            </p>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
                    <p className="text-sm text-muted-foreground">
                      No hay datos suficientes para mostrar la evolución de matrículas.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Distribución por Programas</CardTitle>
              </CardHeader>
              <CardContent>
                {distributionData.length > 0 ? (
                  <div className="space-y-4">
                    {distributionData.map((programa) => {
                      const percent =
                        programa.porcentaje !== null && programa.porcentaje !== undefined
                          ? Math.max(Math.min(programa.porcentaje, 100), 0)
                          : totalDistribution > 0
                            ? Math.min((programa.totalEstudiantes / totalDistribution) * 100, 100)
                            : 0

                      return (
                        <div key={programa.programa} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{programa.programa}</span>
                            <span className="font-semibold">{formatPercent(percent, { showSign: false })}</span>
                          </div>
                          <Progress value={percent} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            {programa.abreviatura}: {formatNumber(programa.totalEstudiantes)} estudiantes
                          </p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
                    <p className="text-sm text-muted-foreground">
                      No hay información disponible sobre la distribución de programas.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Accesos Rápidos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/reportes-matricula">
                    <FileText className="mr-2 h-4 w-4" />
                    Reportes de Matrícula
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/programacion-cursos">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Programación de Cursos
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/reporte-graduaciones">
                    <Graduation className="mr-2 h-4 w-4" />
                    Reporte de Graduaciones
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/plantillas-mailing">
                    <FileText className="mr-2 h-4 w-4" />
                    Plantillas y Mailing
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Notificaciones Importantes</CardTitle>
              </CardHeader>
              <CardContent>
                {normalizedNotifications.length > 0 ? (
                  <div className="space-y-4">
                    {normalizedNotifications.map((item, index) => {
                      const visuals = getNotificationVisuals(item.categoria)
                      const Icon = visuals.icon
                      const key = `${item.categoria}-${item.titulo ?? "item"}-${index}`

                      return (
                        <div key={key} className={cn("flex items-start gap-3 rounded-md p-3", visuals.containerClass)}>
                          <div className="mt-0.5">
                            <Icon className={cn("h-5 w-5", visuals.iconClass)} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-medium leading-tight">
                                {item.titulo ?? formatSummaryLabel(item.categoria)}
                              </h4>
                              {item.total !== null && item.total !== undefined ? (
                                <span className="text-sm font-semibold text-muted-foreground">
                                  {formatNumber(item.total)}
                                </span>
                              ) : null}
                            </div>
                            {item.descripcion ? (
                              <p className="text-sm text-muted-foreground">{item.descripcion}</p>
                            ) : null}
                            {item.tipo ? (
                              <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.tipo}</p>
                            ) : null}
                            {item.enlace || item.link ? (
                              <Button asChild variant="link" className={cn("h-auto p-0 text-sm", visuals.linkClass)}>
                                <Link href={item.enlace || item.link || "#"}>Ver detalles</Link>
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No hay notificaciones pendientes por el momento.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Estadísticas Generales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {showMultiplesProgramas ? (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Estudiantes inscritos en múltiples programas
                        </p>
                        <p className="text-3xl font-bold leading-tight">
                          {formatNumber(multiplesProgramas?.total)}
                        </p>
                        {multiplesProgramas?.porcentaje !== null &&
                          multiplesProgramas?.porcentaje !== undefined ? (
                          <p className="text-sm text-muted-foreground">
                            Representa {formatPercent(multiplesProgramas?.porcentaje, { showSign: false })} del total
                            de estudiantes
                          </p>
                        ) : null}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-md bg-muted/60 p-3">
                          <p className="text-xs text-muted-foreground">Promedio de programas</p>
                          <p className="text-lg font-semibold">
                            {formatDecimal(multiplesProgramas?.promedioProgramas)}
                          </p>
                        </div>
                        <div className="rounded-md bg-muted/60 p-3">
                          <p className="text-xs text-muted-foreground">Máximo de programas</p>
                          <p className="text-lg font-semibold">
                            {formatNumber(multiplesProgramas?.maximoProgramas)}
                          </p>
                        </div>
                      </div>
                    </div>
                    {topStudents.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-muted-foreground">
                          Top {topStudents.length} estudiantes con más programas
                        </p>
                        <ol className="space-y-2 text-sm">
                          {topStudents.map((student, index) => (
                            <li
                              key={`${student.estudiante ?? "estudiante"}-${index}`}
                              className="flex items-center justify-between rounded-md border border-border/60 bg-background px-3 py-2"
                            >
                              <span className="font-medium">
                                {student.estudiante ?? `Estudiante ${index + 1}`}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {formatNumber(student.programas ?? student.cantidad ?? 0)} programas
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">
                        Sin detalle de estudiantes disponible.
                      </div>
                    )}
                  </div>
                ) : null}

                {summaryEntries.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-muted-foreground">Resumen del sistema</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {summaryEntries.map(([key, value]) => (
                        <div key={key} className="rounded-md bg-muted/60 p-3">
                          <p className="text-xs text-muted-foreground">{formatSummaryLabel(key)}</p>
                          <p className="text-lg font-semibold">{formatNumber(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {!showMultiplesProgramas && summaryEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay estadísticas adicionales disponibles por el momento.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
          No se encontraron datos para mostrar en el dashboard administrativo.
        </div>
      )}
    </div>
  )
}
