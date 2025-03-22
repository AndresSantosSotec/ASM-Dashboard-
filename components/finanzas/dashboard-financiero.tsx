"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { AlertCircle, RefreshCw, LineChart, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Datos de ejemplo para el dashboard financiero
const dashboardData = {
  kpis: {
    ingresosMensuales: 175000,
    ingresosMesAnterior: 165000,
    tasaMorosidad: 12.5,
    tasaMorosidadAnterior: 14.2,
    recaudacionPendiente: 45000,
    recaudacionPendienteAnterior: 52000,
    estudiantesActivos: 350,
    estudiantesActivosAnterior: 340,
  },
  morosidadPorPrograma: [
    { programa: "Desarrollo Web", porcentaje: 8.2 },
    { programa: "Diseño UX/UI", porcentaje: 10.5 },
    { programa: "Medicina", porcentaje: 15.3 },
    { programa: "Psicología", porcentaje: 12.8 },
    { programa: "Administración", porcentaje: 9.7 },
  ],
  pagosRecientes: [
    { id: "pago-001", estudiante: "Juan Pérez", monto: 750, fecha: "10/03/2025", concepto: "Mensualidad Marzo" },
    { id: "pago-002", estudiante: "María López", monto: 750, fecha: "09/03/2025", concepto: "Mensualidad Marzo" },
    { id: "pago-003", estudiante: "Carlos Rodríguez", monto: 750, fecha: "08/03/2025", concepto: "Mensualidad Marzo" },
    { id: "pago-004", estudiante: "Ana Martínez", monto: 750, fecha: "07/03/2025", concepto: "Mensualidad Marzo" },
    { id: "pago-005", estudiante: "Roberto Gómez", monto: 750, fecha: "06/03/2025", concepto: "Mensualidad Marzo" },
  ],
  alertasMorosidad: [
    { id: "alerta-001", estudiante: "Pedro Díaz", diasVencidos: 45, montoVencido: 1500, programa: "Medicina" },
    { id: "alerta-002", estudiante: "Sofía Hernández", diasVencidos: 38, montoVencido: 1500, programa: "Psicología" },
    { id: "alerta-003", estudiante: "Luis Torres", diasVencidos: 30, montoVencido: 750, programa: "Desarrollo Web" },
    { id: "alerta-004", estudiante: "Carmen Jiménez", diasVencidos: 25, montoVencido: 750, programa: "Diseño UX/UI" },
    { id: "alerta-005", estudiante: "Javier Morales", diasVencidos: 20, montoVencido: 750, programa: "Administración" },
  ],
}

export function DashboardFinanciero() {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)), // Primer día del mes actual
    to: new Date(),
  })

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
            <div className="text-2xl font-bold">Q {dashboardData.kpis.ingresosMensuales.toLocaleString()}</div>
            <div className="flex items-center mt-1">
              {calcularCambio(dashboardData.kpis.ingresosMensuales, dashboardData.kpis.ingresosMesAnterior) > 0 ? (
                <Badge className="bg-green-500 text-xs">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  {Math.abs(
                    calcularCambio(dashboardData.kpis.ingresosMensuales, dashboardData.kpis.ingresosMesAnterior),
                  ).toFixed(1)}
                  %
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  {Math.abs(
                    calcularCambio(dashboardData.kpis.ingresosMensuales, dashboardData.kpis.ingresosMesAnterior),
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de Morosidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.kpis.tasaMorosidad}%</div>
            <div className="flex items-center mt-1">
              {calcularCambio(dashboardData.kpis.tasaMorosidad, dashboardData.kpis.tasaMorosidadAnterior) < 0 ? (
                <Badge className="bg-green-500 text-xs">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  {Math.abs(
                    calcularCambio(dashboardData.kpis.tasaMorosidad, dashboardData.kpis.tasaMorosidadAnterior),
                  ).toFixed(1)}
                  %
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  {Math.abs(
                    calcularCambio(dashboardData.kpis.tasaMorosidad, dashboardData.kpis.tasaMorosidadAnterior),
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Recaudación Pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Q {dashboardData.kpis.recaudacionPendiente.toLocaleString()}</div>
            <div className="flex items-center mt-1">
              {calcularCambio(
                dashboardData.kpis.recaudacionPendiente,
                dashboardData.kpis.recaudacionPendienteAnterior,
              ) < 0 ? (
                <Badge className="bg-green-500 text-xs">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  {Math.abs(
                    calcularCambio(
                      dashboardData.kpis.recaudacionPendiente,
                      dashboardData.kpis.recaudacionPendienteAnterior,
                    ),
                  ).toFixed(1)}
                  %
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  {Math.abs(
                    calcularCambio(
                      dashboardData.kpis.recaudacionPendiente,
                      dashboardData.kpis.recaudacionPendienteAnterior,
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
            <div className="text-2xl font-bold">{dashboardData.kpis.estudiantesActivos}</div>
            <div className="flex items-center mt-1">
              {calcularCambio(dashboardData.kpis.estudiantesActivos, dashboardData.kpis.estudiantesActivosAnterior) >
              0 ? (
                <Badge className="bg-green-500 text-xs">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  {Math.abs(
                    calcularCambio(
                      dashboardData.kpis.estudiantesActivos,
                      dashboardData.kpis.estudiantesActivosAnterior,
                    ),
                  ).toFixed(1)}
                  %
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  {Math.abs(
                    calcularCambio(
                      dashboardData.kpis.estudiantesActivos,
                      dashboardData.kpis.estudiantesActivosAnterior,
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
              {dashboardData.morosidadPorPrograma.map((item) => (
                <div key={item.programa} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{item.programa}</span>
                    <span className="font-medium">{item.porcentaje}%</span>
                  </div>
                  <Progress value={item.porcentaje} max={20} className="h-2" />
                </div>
              ))}
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
                {dashboardData.pagosRecientes.map((pago) => (
                  <TableRow key={pago.id}>
                    <TableCell className="font-medium">{pago.estudiante}</TableCell>
                    <TableCell>{pago.concepto}</TableCell>
                    <TableCell>{pago.fecha}</TableCell>
                    <TableCell className="text-right">Q{pago.monto.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
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
                {dashboardData.alertasMorosidad.map((alerta) => (
                  <TableRow key={alerta.id}>
                    <TableCell className="font-medium">{alerta.estudiante}</TableCell>
                    <TableCell>{alerta.programa}</TableCell>
                    <TableCell>
                      <Badge variant={alerta.diasVencidos > 30 ? "destructive" : "outline"} className="text-xs">
                        {alerta.diasVencidos} días
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-red-500">Q{alerta.montoVencido.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
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

