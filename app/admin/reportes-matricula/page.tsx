"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, FileText, Printer, Filter, FileSpreadsheet, FileIcon as FilePdf } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function ReportesMatriculaPage() {
  const [dateRange, setDateRange] = useState<"month" | "quarter" | "semester" | "year" | "custom">("month")
  const [startDate, setStartDate] = useState<string>("2025-03-01")
  const [endDate, setEndDate] = useState<string>("2025-03-31")
  const [program, setProgram] = useState<string>("all")
  const [studentType, setStudentType] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<string>("current")
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportFormat, setExportFormat] = useState<string>("pdf")
  const [exportDetail, setExportDetail] = useState<string>("complete")

  // Datos de ejemplo para la tabla
  const students = [
    {
      id: 1,
      name: "Ana García",
      enrollmentDate: "2025-03-05",
      type: "Nuevo",
      program: "Desarrollo Web",
      status: "Activo",
    },
    {
      id: 2,
      name: "Carlos Rodríguez",
      enrollmentDate: "2025-03-07",
      type: "Nuevo",
      program: "Marketing Digital",
      status: "Activo",
    },
    {
      id: 3,
      name: "María López",
      enrollmentDate: "2025-03-10",
      type: "Recurrente",
      program: "Diseño Gráfico",
      status: "Activo",
    },
    {
      id: 4,
      name: "Juan Pérez",
      enrollmentDate: "2025-03-12",
      type: "Recurrente",
      program: "Desarrollo Web",
      status: "Activo",
    },
    {
      id: 5,
      name: "Laura Martínez",
      enrollmentDate: "2025-03-15",
      type: "Nuevo",
      program: "Contabilidad",
      status: "Activo",
    },
    {
      id: 6,
      name: "Roberto Sánchez",
      enrollmentDate: "2025-03-18",
      type: "Recurrente",
      program: "Marketing Digital",
      status: "Retirado",
    },
    {
      id: 7,
      name: "Sofía Ramírez",
      enrollmentDate: "2025-03-20",
      type: "Nuevo",
      program: "Desarrollo Web",
      status: "Activo",
    },
    {
      id: 8,
      name: "Diego Hernández",
      enrollmentDate: "2025-03-22",
      type: "Recurrente",
      program: "Diseño Gráfico",
      status: "Activo",
    },
    {
      id: 9,
      name: "Valentina Torres",
      enrollmentDate: "2025-03-25",
      type: "Nuevo",
      program: "Contabilidad",
      status: "Activo",
    },
    {
      id: 10,
      name: "Javier Flores",
      enrollmentDate: "2025-03-28",
      type: "Recurrente",
      program: "Marketing Digital",
      status: "Activo",
    },
  ]

  // Datos de ejemplo para comparación con período anterior
  const previousPeriodStudents = [
    {
      id: 1,
      name: "Ana García",
      enrollmentDate: "2025-02-05",
      type: "Nuevo",
      program: "Desarrollo Web",
      status: "Activo",
    },
    {
      id: 2,
      name: "Carlos Rodríguez",
      enrollmentDate: "2025-02-07",
      type: "Nuevo",
      program: "Marketing Digital",
      status: "Activo",
    },
    {
      id: 3,
      name: "María López",
      enrollmentDate: "2025-02-10",
      type: "Recurrente",
      program: "Diseño Gráfico",
      status: "Activo",
    },
    {
      id: 4,
      name: "Juan Pérez",
      enrollmentDate: "2025-02-12",
      type: "Recurrente",
      program: "Desarrollo Web",
      status: "Activo",
    },
    {
      id: 5,
      name: "Laura Martínez",
      enrollmentDate: "2025-02-15",
      type: "Nuevo",
      program: "Contabilidad",
      status: "Activo",
    },
    {
      id: 6,
      name: "Roberto Sánchez",
      enrollmentDate: "2025-02-18",
      type: "Recurrente",
      program: "Marketing Digital",
      status: "Retirado",
    },
  ]

  // Filtrar estudiantes según los criterios seleccionados
  const filteredStudents = students.filter((student) => {
    if (program !== "all" && student.program !== program) return false
    if (studentType !== "all" && student.type !== studentType) return false
    return true
  })

  // Calcular totales
  const totalStudents = filteredStudents.length
  const newStudents = filteredStudents.filter((s) => s.type === "Nuevo").length
  const recurringStudents = filteredStudents.filter((s) => s.type === "Recurrente").length

  // Calcular totales del período anterior
  const previousTotalStudents = previousPeriodStudents.length
  const previousNewStudents = previousPeriodStudents.filter((s) => s.type === "Nuevo").length
  const previousRecurringStudents = previousPeriodStudents.filter((s) => s.type === "Recurrente").length

  // Calcular porcentajes de crecimiento
  const totalGrowth = ((totalStudents - previousTotalStudents) / previousTotalStudents) * 100
  const newGrowth = ((newStudents - previousNewStudents) / previousNewStudents) * 100
  const recurringGrowth = ((recurringStudents - previousRecurringStudents) / previousRecurringStudents) * 100

  // Datos para gráficas por programa
  const programCounts = filteredStudents.reduce((acc: Record<string, number>, student) => {
    acc[student.program] = (acc[student.program] || 0) + 1
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reportes de Matrícula y Alumnos Nuevos</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-1" />
            Imprimir
          </Button>
          <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Exportar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Exportar Reporte</DialogTitle>
                <DialogDescription>
                  Seleccione el formato y nivel de detalle para exportar el reporte.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="exportFormat" className="text-right">
                    Formato
                  </Label>
                  <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Seleccionar formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="exportDetail" className="text-right">
                    Nivel de Detalle
                  </Label>
                  <Select value={exportDetail} onValueChange={(value: any) => setExportDetail(value)}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Seleccionar nivel de detalle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="complete">Reporte Completo</SelectItem>
                      <SelectItem value="summary">Solo Resumen</SelectItem>
                      <SelectItem value="data">Solo Datos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="includeCharts" className="text-right">
                    Incluir Gráficas
                  </Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <input type="checkbox" id="includeCharts" className="h-4 w-4" defaultChecked />
                    <Label htmlFor="includeCharts">Incluir gráficas en el reporte</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setShowExportDialog(false)}>
                  {exportFormat === "pdf" ? (
                    <FilePdf className="h-4 w-4 mr-1" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                  )}
                  Exportar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="current">Período Actual</TabsTrigger>
          <TabsTrigger value="comparison">Comparativa</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros de Búsqueda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateRange">Rango de Fechas</Label>
                  <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rango" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Mes Actual</SelectItem>
                      <SelectItem value="quarter">Trimestre Actual</SelectItem>
                      <SelectItem value="semester">Semestre Actual</SelectItem>
                      <SelectItem value="year">Año Actual</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {dateRange === "custom" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Fecha Inicio</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Fecha Fin</Label>
                      <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="program">Programa/Carrera</Label>
                  <Select value={program} onValueChange={(value: any) => setProgram(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los programas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los programas</SelectItem>
                      <SelectItem value="Desarrollo Web">Desarrollo Web</SelectItem>
                      <SelectItem value="Marketing Digital">Marketing Digital</SelectItem>
                      <SelectItem value="Diseño Gráfico">Diseño Gráfico</SelectItem>
                      <SelectItem value="Contabilidad">Contabilidad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentType">Tipo de Alumno</Label>
                  <Select value={studentType} onValueChange={(value: any) => setStudentType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      <SelectItem value="Nuevo">Nuevo</SelectItem>
                      <SelectItem value="Recurrente">Recurrente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button>
                    <Filter className="h-4 w-4 mr-1" />
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Matriculados</p>
                    <h3 className="text-2xl font-bold mt-1">{totalStudents}</h3>
                  </div>
                  <FileText className="h-10 w-10 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Alumnos Nuevos</p>
                    <h3 className="text-2xl font-bold mt-1">{newStudents}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round((newStudents / totalStudents) * 100)}% del total
                    </p>
                  </div>
                  <FileText className="h-10 w-10 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Alumnos Recurrentes</p>
                    <h3 className="text-2xl font-bold mt-1">{recurringStudents}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round((recurringStudents / totalStudents) * 100)}% del total
                    </p>
                  </div>
                  <FileText className="h-10 w-10 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de Resultados */}
          <Card>
            <CardHeader>
              <CardTitle>Listado de Alumnos Matriculados</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Fecha de Matrícula</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Programa</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.id}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.enrollmentDate}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${student.type === "Nuevo" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}
                        >
                          {student.type}
                        </span>
                      </TableCell>
                      <TableCell>{student.program}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${student.status === "Activo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                        >
                          {student.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Gráficas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Matrícula por Mes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
                  <p className="text-gray-500">Gráfica de matrícula mensual</p>
                  {/* Aquí iría el componente de gráfica real */}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución por Programa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
                  <p className="text-gray-500">Gráfica de distribución por programa</p>
                  {/* Aquí iría el componente de gráfica real */}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparativa con Período Anterior</CardTitle>
              <CardDescription>
                Comparación entre {dateRange === "month" ? "Marzo 2025" : "el período actual"} y{" "}
                {dateRange === "month" ? "Febrero 2025" : "el período anterior"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Matriculados</p>
                      <div className="flex items-center mt-1">
                        <h3 className="text-2xl font-bold">{totalStudents}</h3>
                        <span className={`ml-2 text-sm ${totalGrowth >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {totalGrowth >= 0 ? "+" : ""}
                          {totalGrowth.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">vs. {previousTotalStudents} en período anterior</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Alumnos Nuevos</p>
                      <div className="flex items-center mt-1">
                        <h3 className="text-2xl font-bold">{newStudents}</h3>
                        <span className={`ml-2 text-sm ${newGrowth >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {newGrowth >= 0 ? "+" : ""}
                          {newGrowth.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">vs. {previousNewStudents} en período anterior</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Alumnos Recurrentes</p>
                      <div className="flex items-center mt-1">
                        <h3 className="text-2xl font-bold">{recurringStudents}</h3>
                        <span className={`ml-2 text-sm ${recurringGrowth >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {recurringGrowth >= 0 ? "+" : ""}
                          {recurringGrowth.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">vs. {previousRecurringStudents} en período anterior</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Comparativa de Matrícula</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
                      <p className="text-gray-500">Gráfica comparativa entre períodos</p>
                      {/* Aquí iría el componente de gráfica real */}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribución por Tipo de Alumno</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
                      <p className="text-gray-500">Gráfica de distribución por tipo de alumno</p>
                      {/* Aquí iría el componente de gráfica real */}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendencias de Matrícula</CardTitle>
              <CardDescription>Análisis de tendencias en los últimos 12 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center bg-gray-50 rounded-md mb-6">
                <p className="text-gray-500">Gráfica de tendencias de matrícula (12 meses)</p>
                {/* Aquí iría el componente de gráfica real */}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Crecimiento por Programa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
                      <p className="text-gray-500">Gráfica de crecimiento por programa</p>
                      {/* Aquí iría el componente de gráfica real */}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Proyección de Matrícula</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
                      <p className="text-gray-500">Gráfica de proyección para próximos períodos</p>
                      {/* Aquí iría el componente de gráfica real */}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

