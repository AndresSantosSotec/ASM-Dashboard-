"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { AlertCircle, RefreshCw, LineChart, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  fetchDashboardSummary,
  type DashboardSummary,
  fetchRecentPayments,
} from "@/services/finance"
import { toast } from "@/hooks/use-toast"

// Datos obtenidos de la API. Se inicializan vacíos para evitar mostrar datos de ejemplo
const emptyArray: any[] = []

export function DashboardFinanciero() {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)), // Primer día del mes actual
    to: new Date(),
  })
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [recentPayments, setRecentPayments] = useState<any[]>([])
  const [morosidadPorPrograma, setMorosidadPorPrograma] = useState<any[]>(emptyArray)
  const [alertasMorosidad, setAlertasMorosidad] = useState<any[]>(emptyArray)

  useEffect(() => {
    Promise.all([fetchDashboardSummary(), fetchRecentPayments()])
      .then(([sum, payments]) => {
        setSummary(sum)
        setRecentPayments(payments)
      })
      .catch(() =>
        toast({
          title: 'Error',
          description: 'No se pudo cargar el resumen financiero',
        }))
  }, [])

  // Función para calcular el cambio porcentual
  const calcularCambio = (actual: number, anterior: number) => {
    return ((actual - anterior) / anterior) * 100
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Financiero</h2>
          <p className="text-muted-foreground">Análisis y métricas financieras de la institución</p>
        </div>
        <div className="flex items-center gap-2">
          <DatePickerWithRange className="w-auto" value={dateRange} onChange={setDateRange} />
          <Button variant="outline" size="icon">
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
            <div className="text-2xl font-bold">Q {(summary?.ingresosMensuales ?? 0).toLocaleString()}</div>
            <div className="flex items-center mt-1">
              {calcularCambio(summary?.ingresosMensuales ?? 0, summary?.ingresosMesAnterior ?? 0) > 0 ? (
                <Badge className="bg-green-500 text-xs">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  {Math.abs(calcularCambio(summary?.ingresosMensuales ?? 0, summary?.ingresosMesAnterior ?? 0)).toFixed(1)}
                  %
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  {Math.abs(calcularCambio(summary?.ingresosMensuales ?? 0, summary?.ingresosMesAnterior ?? 0)).toFixed(1)}
                  %
                </Badge>
              )}
              <span className="text-xs text-muted-foreground ml-2">vs. mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de Morosidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.tasaMorosidad ?? 0}%</div>
            <div className="flex items-center mt-1">
              {calcularCambio(summary?.tasaMorosidad ?? 0, summary?.tasaMorosidadAnterior ?? 0) < 0 ? (
                <Badge className="bg-green-500 text-xs">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  {Math.abs(calcularCambio(summary?.tasaMorosidad ?? 0, summary?.tasaMorosidadAnterior ?? 0)).toFixed(1)}
                  %
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  {Math.abs(calcularCambio(summary?.tasaMorosidad ?? 0, summary?.tasaMorosidadAnterior ?? 0)).toFixed(1)}
                  %
                </Badge>
              )}
              <span className="text-xs text-muted-foreground ml-2">vs. mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recaudación Pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Q {(summary?.recaudacionPendiente ?? 0).toLocaleString()}</div>
            <div className="flex items-center mt-1">
              {calcularCambio(
                summary?.recaudacionPendiente ?? 0,
                summary?.recaudacionPendienteAnterior ?? 0,
              ) < 0 ? (
                <Badge className="bg-green-500 text-xs">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  {Math.abs(
                    calcularCambio(
                      summary?.recaudacionPendiente ?? 0,
                      summary?.recaudacionPendienteAnterior ?? 0,
                    ),
                  ).toFixed(1)}
                  %
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  {Math.abs(
                    calcularCambio(
                      summary?.recaudacionPendiente ?? 0,
                      summary?.recaudacionPendienteAnterior ?? 0,
                    ),
                  ).toFixed(1)}
                  %
                </Badge>
              )}
              <span className="text-xs text-muted-foreground ml-2">vs. mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estudiantes Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.estudiantesActivos ?? 0}</div>
            <div className="flex items-center mt-1">
              {calcularCambio(summary?.estudiantesActivos ?? 0, summary?.estudiantesActivosAnterior ?? 0) > 0 ? (
                <Badge className="bg-green-500 text-xs">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  {Math.abs(
                    calcularCambio(
                      summary?.estudiantesActivos ?? 0,
                      summary?.estudiantesActivosAnterior ?? 0,
                    ),
                  ).toFixed(1)}
                  %
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  {Math.abs(
                    calcularCambio(
                      summary?.estudiantesActivos ?? 0,
                      summary?.estudiantesActivosAnterior ?? 0,
                    ),
                  ).toFixed(1)}
                  %
                </Badge>
              )}
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
                    <Progress value={item.porcentaje} max={20} className="h-2" />
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
                {recentPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Sin datos
                    </TableCell>
                  </TableRow>
                ) : (
                  recentPayments.map((pago) => (
                    <TableRow key={pago.id}>
                      <TableCell className="font-medium">{pago.estudiante ?? pago.prospecto?.nombre_completo}</TableCell>
                      <TableCell>{pago.concepto || pago.concept}</TableCell>
                      <TableCell>
                        {new Date(pago.fecha || pago.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        Q{Number(pago.monto || pago.amount).toLocaleString()}
                      </TableCell>
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
                  <TableHead className="text-right">Monto</TableHead>
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
                      <TableCell className="font-medium">{alerta.estudiante}</TableCell>
                      <TableCell>{alerta.programa}</TableCell>
                      <TableCell>
                        <Badge
                          variant={alerta.diasVencidos > 30 ? "destructive" : "outline"}
                          className="text-xs"
                        >
                          {alerta.diasVencidos} días
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-red-500">Q{alerta.montoVencido.toLocaleString()}</TableCell>
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
          Los datos mostrados en este dashboard corresponden al período del {dateRange.from.toLocaleDateString()} al{" "}
          {dateRange.to.toLocaleDateString()}. Para ver datos históricos completos, utilice los reportes financieros.
        </AlertDescription>
      </Alert>
    </div>
  )
}

