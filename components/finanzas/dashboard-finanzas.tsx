"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { BarChart, DollarSign, Users, AlertTriangle, Calendar, ArrowUpRight, Download, Filter } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchDashboardSummary, fetchRecentPayments, type DashboardSummary } from "@/services/finance"
import { toast } from "@/hooks/use-toast"


export function DashboardFinanzas() {
  const [dateRange, setDateRange] = useState({
    from: new Date(2025, 2, 1), // 1 de marzo de 2025
    to: new Date(2025, 2, 31), // 31 de marzo de 2025
  })

  const [activeTab, setActiveTab] = useState("overview")
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])

  useEffect(() => {
    Promise.all([fetchDashboardSummary(), fetchRecentPayments()])
      .then(([sum, payments]) => {
        setSummary(sum)
        setRecentTransactions(payments)
      })
      .catch(() =>
        toast({ title: "Error", description: "No se pudieron cargar los datos" })
      )
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Financiero</h2>
          <p className="text-muted-foreground">Monitoreo de ingresos, pagos pendientes y métricas de cobranza</p>
        </div>
        <div className="flex items-center gap-2">
          <DatePickerWithRange className="w-auto" />
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="transactions">Transacciones</TabsTrigger>
          <TabsTrigger value="late-payments">Morosidad</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Tarjetas de métricas principales */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Q{(summary?.ingresosMensuales ?? 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+12% respecto al mes anterior</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Q{(summary?.recaudacionPendiente ?? 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {summary && summary.ingresosMensuales + summary.recaudacionPendiente > 0
                    ? Math.round((summary.recaudacionPendiente / (summary.ingresosMensuales + summary.recaudacionPendiente)) * 100)
                    : 0}
                  % del total facturado
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alumnos al Día</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.estudiantesActivos ?? 0}</div>
                <div className="mt-2">
                  <Progress value={100} className="h-2" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Estudiantes activos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Cobro (ACR)</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.tasaMorosidad ?? 0}%</div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-green-600">+0%</span>
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                </div>
                <p className="text-xs text-muted-foreground">KPR (Promesa de pago): 0%</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficas y tablas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Gráfica de ingresos mensuales */}
            {/* <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Ingresos Mensuales</CardTitle>
                <CardDescription>Comparativa de ingresos por mes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                  Sin datos
                </div>
              </CardContent>
            </Card> */}

            {/* Buckets de morosidad */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Buckets de Morosidad</CardTitle>
                <CardDescription>Distribución de alumnos por días de atraso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[150px] flex items-center justify-center text-sm text-muted-foreground">
                  Sin datos
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <Users className="mr-2 h-4 w-4" /> Ver Listado Completo
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Transacciones recientes */}
          <Card>
            <CardHeader>
              <CardTitle>Transacciones Recientes</CardTitle>
              <CardDescription>Últimos pagos registrados en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Sin datos
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.id}</TableCell>
                        <TableCell>
                          {transaction.estudiante ?? transaction.prospecto?.nombre_completo}
                        </TableCell>
                        <TableCell>Q{Number(transaction.monto || transaction.amount).toLocaleString()}</TableCell>
                        <TableCell>{new Date(transaction.fecha || transaction.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{transaction.metodo || transaction.method}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.status === "completado"
                                ? "default"
                                : transaction.status === "pendiente"
                                  ? "outline"
                                  : "destructive"
                            }
                          >
                            {transaction.status === "completado"
                              ? "Completado"
                              : transaction.status === "pendiente"
                                ? "Pendiente"
                                : "Rechazado"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Ver Transacciones Anteriores</Button>
              <Button>
                <Download className="mr-2 h-4 w-4" /> Exportar Reporte
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registro de Transacciones</CardTitle>
              <CardDescription>Historial completo de pagos y transacciones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Método de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los métodos</SelectItem>
                      <SelectItem value="card">Tarjeta</SelectItem>
                      <SelectItem value="deposit">Depósito</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                      <SelectItem value="cash">Efectivo</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="completed">Completado</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="rejected">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button>
                  <Calendar className="mr-2 h-4 w-4" /> Registrar Nuevo Pago
                </Button>
              </div>

              {/* Aquí iría una tabla más completa con paginación */}
              <div className="text-center py-8 text-muted-foreground">
                Contenido detallado de transacciones con filtros avanzados y paginación
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="late-payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Morosidad</CardTitle>
              <CardDescription>Control y seguimiento de pagos atrasados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Bucket de mora" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los buckets</SelectItem>
                      <SelectItem value="b1">B1 (0-5 días)</SelectItem>
                      <SelectItem value="b2">B2 (6-10 días)</SelectItem>
                      <SelectItem value="b3">B3 (11-30 días)</SelectItem>
                      <SelectItem value="b4">B4 (+30 días)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Estado de bloqueo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="blocked">Bloqueados</SelectItem>
                      <SelectItem value="active">Activos</SelectItem>
                      <SelectItem value="warning">En advertencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button>
                  <Download className="mr-2 h-4 w-4" /> Exportar Listado
                </Button>
              </div>

              {/* Aquí iría una tabla de alumnos en mora con opciones de gestión */}
              <div className="text-center py-8 text-muted-foreground">
                Listado de alumnos en mora con opciones para registrar seguimiento, bloquear/desbloquear acceso y
                programar recordatorios
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reportes Financieros</CardTitle>
              <CardDescription>Generación de reportes personalizados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Reporte de Ingresos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Detalle de todos los ingresos en un período específico
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Generar Reporte</Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Reporte de Morosidad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Listado de alumnos con pagos pendientes y días de atraso
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Generar Reporte</Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Conciliación Bancaria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Reporte para conciliar pagos registrados con movimientos bancarios
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Generar Reporte</Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Proyección de Ingresos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Estimación de ingresos futuros basados en pagos programados
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Generar Reporte</Button>
                  </CardFooter>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

