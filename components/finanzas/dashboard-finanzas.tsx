"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { BarChart, DollarSign, Users, AlertTriangle, Calendar, ArrowUpRight, Download, Filter } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Datos de ejemplo para las gráficas y tablas
const financialData = {
  totalIncome: 125000,
  pendingPayments: 45000,
  totalStudents: 350,
  studentsOnTime: 280,
  studentsLate: 70,
  collectionRate: 73.5,
  promiseRate: 65.2,
  buckets: {
    b1: 32, // 0-5 días
    b2: 18, // 6-10 días
    b3: 12, // 11-30 días
    b4: 8, // +30 días
  },
  recentTransactions: [
    {
      id: "TRX-001",
      student: "Carlos Méndez",
      amount: 1400,
      date: "2025-03-10",
      method: "Tarjeta",
      status: "completado",
    },
    {
      id: "TRX-002",
      student: "Ana Lucía Gómez",
      amount: 1400,
      date: "2025-03-09",
      method: "Depósito",
      status: "pendiente",
    },
    {
      id: "TRX-003",
      student: "Roberto Juárez",
      amount: 2000,
      date: "2025-03-09",
      method: "Transferencia",
      status: "completado",
    },
    {
      id: "TRX-004",
      student: "María Fernanda López",
      amount: 1400,
      date: "2025-03-08",
      method: "Tarjeta",
      status: "completado",
    },
    {
      id: "TRX-005",
      student: "Juan Pablo Herrera",
      amount: 1400,
      date: "2025-03-07",
      method: "Depósito",
      status: "rechazado",
    },
  ],
  monthlyIncome: [
    { month: "Ene", amount: 110000 },
    { month: "Feb", amount: 115000 },
    { month: "Mar", amount: 125000 },
    { month: "Abr", amount: 0 }, // Proyección
    { month: "May", amount: 0 }, // Proyección
    { month: "Jun", amount: 0 }, // Proyección
  ],
}

export function DashboardFinanzas() {
  const [dateRange, setDateRange] = useState({
    from: new Date(2025, 2, 1), // 1 de marzo de 2025
    to: new Date(2025, 2, 31), // 31 de marzo de 2025
  })

  const [activeTab, setActiveTab] = useState("overview")

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
                <div className="text-2xl font-bold">Q{financialData.totalIncome.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+12% respecto al mes anterior</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Q{financialData.pendingPayments.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(
                    (financialData.pendingPayments / (financialData.totalIncome + financialData.pendingPayments)) * 100,
                  )}
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
                <div className="text-2xl font-bold">
                  {financialData.studentsOnTime} / {financialData.totalStudents}
                </div>
                <div className="mt-2">
                  <Progress
                    value={Math.round((financialData.studentsOnTime / financialData.totalStudents) * 100)}
                    className="h-2"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((financialData.studentsOnTime / financialData.totalStudents) * 100)}% de alumnos sin mora
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Cobro (ACR)</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{financialData.collectionRate}%</div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-green-600">+2.5%</span>
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                </div>
                <p className="text-xs text-muted-foreground">KPR (Promesa de pago): {financialData.promiseRate}%</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficas y tablas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Gráfica de ingresos mensuales */}
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Ingresos Mensuales</CardTitle>
                <CardDescription>Comparativa de ingresos por mes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-end gap-2">
                  {financialData.monthlyIncome.map((month) => (
                    <div key={month.month} className="relative flex flex-col items-center">
                      <div
                        className={`w-12 rounded-t-md ${month.amount > 0 ? "bg-blue-500" : "bg-gray-200"}`}
                        style={{
                          height: `${month.amount > 0 ? (month.amount / 125000) * 250 : 100}px`,
                        }}
                      ></div>
                      <div className="absolute -top-6 text-xs font-medium">
                        {month.amount > 0 ? `Q${(month.amount / 1000).toFixed(0)}K` : ""}
                      </div>
                      <div className="mt-2 text-xs">{month.month}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Buckets de morosidad */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Buckets de Morosidad</CardTitle>
                <CardDescription>Distribución de alumnos por días de atraso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50">
                          B1
                        </Badge>
                        <span className="text-sm">0-5 días</span>
                      </div>
                      <span className="text-sm font-medium">{financialData.buckets.b1} alumnos</span>
                    </div>
                    <Progress
                      value={(financialData.buckets.b1 / financialData.studentsLate) * 100}
                      className="h-2 bg-blue-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-yellow-50">
                          B2
                        </Badge>
                        <span className="text-sm">6-10 días</span>
                      </div>
                      <span className="text-sm font-medium">{financialData.buckets.b2} alumnos</span>
                    </div>
                    <Progress
                      value={(financialData.buckets.b2 / financialData.studentsLate) * 100}
                      className="h-2 bg-yellow-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-orange-50">
                          B3
                        </Badge>
                        <span className="text-sm">11-30 días</span>
                      </div>
                      <span className="text-sm font-medium">{financialData.buckets.b3} alumnos</span>
                    </div>
                    <Progress
                      value={(financialData.buckets.b3 / financialData.studentsLate) * 100}
                      className="h-2 bg-orange-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-red-50">
                          B4
                        </Badge>
                        <span className="text-sm">+30 días</span>
                      </div>
                      <span className="text-sm font-medium">{financialData.buckets.b4} alumnos</span>
                    </div>
                    <Progress
                      value={(financialData.buckets.b4 / financialData.studentsLate) * 100}
                      className="h-2 bg-red-100"
                    />
                  </div>
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
                  {financialData.recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.id}</TableCell>
                      <TableCell>{transaction.student}</TableCell>
                      <TableCell>Q{transaction.amount.toLocaleString()}</TableCell>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell>{transaction.method}</TableCell>
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
                  ))}
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

