"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { AlertCircle, RefreshCw, LineChart, ArrowUpRight, ArrowDownRight, Shield, Clock } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { fetchDashboardFinanciero } from "@/services/finance"
import { toast } from "@/hooks/use-toast"
import type { DateRange } from "react-day-picker"
import type { DashboardFinancieroData } from "@/types/dashboard"

// Utilidades de formato seguras
const formatCurrency = (n: unknown) => {
  const num = Number(n ?? 0)
  return `Q ${num.toLocaleString()}`
}

const formatPercent = (n: unknown) => {
  const num = Number(n ?? 0)
  return `${num.toFixed(1)}%`
}

const formatDate = (d?: Date | string) => {
  if (!d) return "—"
  const date = typeof d === 'string' ? new Date(d) : d
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString()
}

// Cálculo de variación porcentual con protección
const calcularCambio = (actual?: number, anterior?: number) => {
  const a = Number(actual ?? 0)
  const b = Number(anterior ?? 0)
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return 0
  return ((a - b) / b) * 100
}

export function DashboardFinanciero() {
  const firstOfMonth = new Date()
  firstOfMonth.setDate(1)

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: firstOfMonth,
    to: new Date(),
  })

  const [dashboardData, setDashboardData] = useState<DashboardFinancieroData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await fetchDashboardFinanciero({
        fecha_inicio: dateRange?.from?.toISOString(),
        fecha_fin: dateRange?.to?.toISOString()
      })
      setDashboardData(data)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast({
        title: "Error",
        description: "No se pudo cargar el resumen financiero",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRefresh = () => {
    loadData()
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    // Opcionalmente recargar datos cuando cambie el rango
    // loadData()
  }

  // Helpers de UI para badges de variación
  const VariationBadge = ({
    value,
    invert = false,
  }: {
    value: number
    invert?: boolean
  }) => {
    const isUp = value > 0
    const good = invert ? !isUp : isUp
    const Icon = isUp ? ArrowUpRight : ArrowDownRight
    const klass = good ? "bg-green-500 text-xs" : "text-xs"
    const variant = good ? undefined : "destructive" as const
    return (
      <Badge className={klass} variant={variant}>
        <Icon className="h-3 w-3 mr-1" />
        {Math.abs(value).toFixed(1)}%
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando dashboard financiero...</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de carga</AlertTitle>
          <AlertDescription>
            No se pudo cargar la información del dashboard. Intente recargar la página.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const { resumen, pagosRecientes, alertasMorosidad, morosidadPorPrograma } = dashboardData

  // Valores de variación calculados
  const varIngresos = calcularCambio(resumen.ingresosMensuales, resumen.ingresosMesAnterior)
  const varMorosidad = calcularCambio(resumen.tasaMorosidad, resumen.tasaMorosidadAnterior)
  const varRecaudPend = calcularCambio(resumen.recaudacionPendiente, resumen.recaudacionPendienteAnterior)
  const varEstActivos = calcularCambio(resumen.estudiantesActivos, resumen.estudiantesActivosAnterior)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Financiero</h2>
          <p className="text-muted-foreground">Análisis y métricas financieras de la institución</p>
        </div>
        <div className="flex items-center gap-2">
          <DatePickerWithRange
            className="w-auto"
            value={
              dateRange
                ? { from: dateRange.from ?? new Date(), to: dateRange.to ?? new Date() }
                : undefined
            }
            onChange={(r) => handleDateRangeChange(r as unknown as DateRange)}
          />
          <Button variant="outline" size="icon" onClick={handleRefresh} title="Actualizar">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos Mensuales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(resumen.ingresosMensuales)}</div>
            <div className="flex items-center mt-1">
              <VariationBadge value={varIngresos} />
              <span className="text-xs text-muted-foreground ml-2">vs. mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de Morosidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(resumen.tasaMorosidad)}</div>
            <div className="flex items-center mt-1">
              <VariationBadge value={varMorosidad} invert />
              <span className="text-xs text-muted-foreground ml-2">vs. mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recaudación Pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(resumen.recaudacionPendiente)}</div>
            <div className="flex items-center mt-1">
              <VariationBadge value={varRecaudPend} invert />
              <span className="text-xs text-muted-foreground ml-2">vs. mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estudiantes Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen.estudiantesActivos}</div>
            <div className="flex items-center mt-1">
              <VariationBadge value={varEstActivos} />
              <span className="text-xs text-muted-foreground ml-2">vs. mes anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tendencia de Ingresos</CardTitle>
            <CardDescription>Análisis de ingresos de los últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md">
              <div className="text-center">
                <LineChart className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Gráfico de tendencia de ingresos</p>
                <p className="text-xs text-muted-foreground">(Visualización simulada)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Morosidad por Programa</CardTitle>
            <CardDescription>Porcentaje de morosidad por programa académico</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {morosidadPorPrograma.length === 0 ? (
                <div className="text-muted-foreground text-sm">Sin datos</div>
              ) : (
                morosidadPorPrograma.map((item) => (
                  <div key={item.programa} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.programa}</span>
                      <span className="font-medium">{item.porcentaje}%</span>
                    </div>
                    <Progress value={item.porcentaje} className="h-2" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Pagos Recientes</CardTitle>
            <CardDescription>Últimos pagos registrados en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagosRecientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Sin datos
                    </TableCell>
                  </TableRow>
                ) : (
                  pagosRecientes.map((pago) => (
                    <TableRow key={pago.id}>
                      <TableCell className="font-medium">{pago.estudiante}</TableCell>
                      <TableCell>{pago.concepto}</TableCell>
                      <TableCell>{formatDate(pago.fecha)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(pago.monto)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Ver todos los pagos
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas de Morosidad</CardTitle>
            <CardDescription>Estudiantes con pagos vencidos críticos</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Programa</TableHead>
                  <TableHead>Días Vencidos</TableHead>
                  <TableHead className="text-right">Monto + Mora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertasMorosidad.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Sin datos
                    </TableCell>
                  </TableRow>
                ) : (
                  alertasMorosidad.map((alerta) => (
                    <TableRow key={alerta.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {alerta.estudiante}
                          {alerta.serviciosBloqueados.length > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Bloqueado
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{alerta.programa}</TableCell>
                      <TableCell>
                        <Badge
                          variant={alerta.diasVencidos > 30 ? "destructive" : "outline"}
                          className="text-xs"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {alerta.diasVencidos} días
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-red-500">
                          <div className="font-medium">{formatCurrency(alerta.montoVencido)}</div>
                          {alerta.montoMora > 0 && (
                            <div className="text-xs text-muted-foreground">
                              +{formatCurrency(alerta.montoMora)} mora
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Ver todas las alertas
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Información importante</AlertTitle>
        <AlertDescription>
          Los datos mostrados en este dashboard corresponden al período del {formatDate(dateRange?.from)} al {formatDate(dateRange?.to)}. 
          {dashboardData.configuracionMora && (
            <span> Mora aplicada según regla: {dashboardData.configuracionMora.regla_activa} ({dashboardData.configuracionMora.porcentaje_mora}% mensual).</span>
          )}
        </AlertDescription>
      </Alert>
    </div>
  )
}