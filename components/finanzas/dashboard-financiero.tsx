"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, RefreshCw, LineChart, ArrowUpRight, ArrowDownRight, Shield, Clock, Calendar as CalendarIcon } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { fetchDashboardFinanciero } from "@/services/finance"
import { useRouter } from "next/navigation"
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
  const router = useRouter()
  const firstOfMonth = new Date()
  firstOfMonth.setDate(1)

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: firstOfMonth,
    to: new Date(),
  })

  // 🆕 Selector de mes/año para filtrar estudiantes activos en Moodle
  const [mesSeleccionado, setMesSeleccionado] = useState<number>(new Date().getMonth() + 1)
  const [anioSeleccionado, setAnioSeleccionado] = useState<number>(new Date().getFullYear())

  const [dashboardData, setDashboardData] = useState<DashboardFinancieroData | null>(null)
  const [loading, setLoading] = useState(true)

  // Generar opciones de meses y años
  const meses = [
    { value: 1, label: "Enero" },
    { value: 2, label: "Febrero" },
    { value: 3, label: "Marzo" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Mayo" },
    { value: 6, label: "Junio" },
    { value: 7, label: "Julio" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Septiembre" },
    { value: 10, label: "Octubre" },
    { value: 11, label: "Noviembre" },
    { value: 12, label: "Diciembre" },
  ]

  const anios = Array.from({ length: 5 }, (_, i) => {
    const anio = new Date().getFullYear() - i
    return { value: anio, label: anio.toString() }
  })

  const loadData = async () => {
    if (!dateRange?.from || !dateRange?.to) return
    
    try {
      setLoading(true)
      const data = await fetchDashboardFinanciero({
        fecha_inicio: dateRange.from.toISOString(),
        fecha_fin: dateRange.to.toISOString(),
        mes: mesSeleccionado,
        anio: anioSeleccionado,
        limit_pagos: 10,
        limit_alertas: 20,
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
  }, [mesSeleccionado, anioSeleccionado])

  const handleRefresh = () => {
    if (!dateRange?.from || !dateRange?.to) return
    fetchDashboardFinanciero({
      fecha_inicio: dateRange.from.toISOString(),
      fecha_fin: dateRange.to.toISOString(),
      mes: mesSeleccionado,
      anio: anioSeleccionado,
      limit_pagos: 10,
      limit_alertas: 20,
    })
      .then(setDashboardData)
      .catch(() => toast({ title: 'Error', description: 'No se pudo cargar el resumen financiero' }))
  }

  const handleDateRangeChange = async (range: DateRange | undefined) => {
    setDateRange(range)
    if (range?.from && range?.to) {
      try {
        setLoading(true)
        const data = await fetchDashboardFinanciero({
          fecha_inicio: range.from.toISOString(),
          fecha_fin: range.to.toISOString(),
          limit_pagos: 10,
          limit_alertas: 20,
        })
        setDashboardData(data)
      } catch (error) {
        console.error('Error loading dashboard:', error)
        toast({ title: 'Error', description: 'No se pudo cargar el resumen financiero' })
      } finally {
        setLoading(false)
      }
    }
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
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtrar por mes:</span>
            <Select
              value={mesSeleccionado.toString()}
              onValueChange={(value) => {
                setMesSeleccionado(parseInt(value))
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {meses.map((mes) => (
                  <SelectItem key={mes.value} value={mes.value.toString()}>
                    {mes.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={anioSeleccionado.toString()}
              onValueChange={(value) => {
                setAnioSeleccionado(parseInt(value))
              }}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {anios.map((anio) => (
                  <SelectItem key={anio.value} value={anio.value.toString()}>
                    {anio.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            {/* DatePickerWithRange removido temporalmente - usar selectores de mes/año */}
            <Button variant="outline" size="icon" onClick={handleRefresh} title="Actualizar">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
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

      {/* 📋 NUEVA SECCIÓN: Lista de Estudiantes Activos desde Moodle */}
      {resumen.estudiantesActivosDetalle && resumen.estudiantesActivosDetalle.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Estudiantes Activos en Moodle - {meses.find(m => m.value === mesSeleccionado)?.label} {anioSeleccionado}</CardTitle>
            <CardDescription>
              {resumen.estudiantesActivos} estudiantes con cursos matriculados este mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Carnet</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Programa</TableHead>
                    <TableHead className="text-center">Cursos</TableHead>
                    <TableHead>Primera Matrícula</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resumen.estudiantesActivosDetalle.slice(0, 100).map((estudiante: any, idx: number) => (
                    <TableRow key={estudiante.carnet || idx}>
                      <TableCell className="font-mono text-xs">{estudiante.carnet}</TableCell>
                      <TableCell className="font-medium">{estudiante.nombre_completo}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{estudiante.correo || '—'}</TableCell>
                      <TableCell>
                        {estudiante.city ? (
                          <Badge variant="outline">{estudiante.city}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge>{estudiante.total_matriculaciones || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{formatDate(estudiante.primera_matricula)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {resumen.estudiantesActivos > 100 && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Mostrando 100 de {resumen.estudiantesActivos} estudiantes
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
            <Button variant="outline" className="w-full" onClick={() => {
              router.push('/finanzas/reportes')
            }}>
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
            <Button variant="outline" className="w-full" onClick={() => {
              router.push('/finanzas/gestion-pagos')
            }}>
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
            <span>
              {' '}Mora: {dashboardData.configuracionMora.porcentaje_mora}% mensual
              {dashboardData.configuracionMora.dias_gracia > 0 && ` (con ${dashboardData.configuracionMora.dias_gracia} días de gracia)`}.
            </span>
          )}
        </AlertDescription>
      </Alert>
    </div>
  )
}