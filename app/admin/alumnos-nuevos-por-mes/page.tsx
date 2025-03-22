"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Download,
  FileText,
  Printer,
  Users,
  Bookmark,
  FileSpreadsheet,
  FileIcon as FilePdf,
  Search,
} from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"

export default function AlumnosNuevosPorMesPage() {
  const [period, setPeriod] = useState<string>("current-month")
  const [program, setProgram] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [showDetails, setShowDetails] = useState<boolean>(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportFormat, setExportFormat] = useState<string>("pdf")
  const [activeTab, setActiveTab] = useState<string>("summary")

  // Datos de ejemplo para nuevos alumnos por mes
  const monthlyData = [
    { month: "Enero", newStudents: 32, totalEnrollments: 87, previousYear: 24 },
    { month: "Febrero", newStudents: 35, totalEnrollments: 92, previousYear: 28 },
    { month: "Marzo", newStudents: 38, totalEnrollments: 105, previousYear: 30 },
    { month: "Abril", newStudents: 25, totalEnrollments: 78, previousYear: 22 },
    { month: "Mayo", newStudents: 20, totalEnrollments: 65, previousYear: 18 },
    { month: "Junio", newStudents: 42, totalEnrollments: 110, previousYear: 36 },
    { month: "Julio", newStudents: 48, totalEnrollments: 125, previousYear: 40 },
    { month: "Agosto", newStudents: 52, totalEnrollments: 136, previousYear: 45 },
    { month: "Septiembre", newStudents: 35, totalEnrollments: 98, previousYear: 31 },
    { month: "Octubre", newStudents: 30, totalEnrollments: 85, previousYear: 27 },
    { month: "Noviembre", newStudents: 25, totalEnrollments: 75, previousYear: 20 },
    { month: "Diciembre", newStudents: 22, totalEnrollments: 68, previousYear: 18 },
  ]

  // Datos de ejemplo para lista de nuevos alumnos
  const newStudents = [
    {
      id: 1,
      name: "Ana García",
      enrollmentDate: "2025-03-05",
      program: "Desarrollo Web",
      source: "Recomendación",
      status: "Activo",
    },
    {
      id: 2,
      name: "Carlos Rodríguez",
      enrollmentDate: "2025-03-07",
      program: "Marketing Digital",
      source: "Redes Sociales",
      status: "Activo",
    },
    {
      id: 3,
      name: "María López",
      enrollmentDate: "2025-03-10",
      program: "Diseño Gráfico",
      source: "Sitio Web",
      status: "Activo",
    },
    {
      id: 4,
      name: "Juan Pérez",
      enrollmentDate: "2025-03-12",
      program: "Desarrollo Web",
      source: "Feria Educativa",
      status: "Activo",
    },
    {
      id: 5,
      name: "Laura Martínez",
      enrollmentDate: "2025-03-15",
      program: "Contabilidad",
      source: "Anuncio en Línea",
      status: "Activo",
    },
    {
      id: 6,
      name: "Roberto Sánchez",
      enrollmentDate: "2025-03-18",
      program: "Marketing Digital",
      source: "Recomendación",
      status: "Inactivo",
    },
    {
      id: 7,
      name: "Sofía Ramírez",
      enrollmentDate: "2025-03-20",
      program: "Desarrollo Web",
      source: "Feria Educativa",
      status: "Activo",
    },
    {
      id: 8,
      name: "Diego Hernández",
      enrollmentDate: "2025-03-22",
      program: "Diseño Gráfico",
      source: "Redes Sociales",
      status: "Activo",
    },
    {
      id: 9,
      name: "Valentina Torres",
      enrollmentDate: "2025-03-25",
      program: "Contabilidad",
      source: "Sitio Web",
      status: "Activo",
    },
    {
      id: 10,
      name: "Javier Flores",
      enrollmentDate: "2025-03-28",
      program: "Marketing Digital",
      source: "Anuncio en Línea",
      status: "Activo",
    },
  ]

  // Datos por fuente de captación (origen)
  const sourcesData = [
    { source: "Recomendación", count: 82, percentage: 22 },
    { source: "Redes Sociales", count: 104, percentage: 28 },
    { source: "Sitio Web", count: 96, percentage: 26 },
    { source: "Feria Educativa", count: 56, percentage: 15 },
    { source: "Anuncio en Línea", count: 35, percentage: 9 },
  ]

  // Programas académicos disponibles
  const programs = ["Desarrollo Web", "Marketing Digital", "Diseño Gráfico", "Contabilidad"]

  // Calcular totales
  const totalNewStudents = monthlyData.reduce((sum, month) => sum + month.newStudents, 0)
  const totalEnrollments = monthlyData.reduce((sum, month) => sum + month.totalEnrollments, 0)
  const totalPreviousYear = monthlyData.reduce((sum, month) => sum + month.previousYear, 0)
  const percentNewVsTotal = (totalNewStudents / totalEnrollments) * 100
  const percentChange = ((totalNewStudents - totalPreviousYear) / totalPreviousYear) * 100

  // Filtrar estudiantes según criterios
  const filteredStudents = newStudents.filter((student) => {
    if (program !== "all" && student.program !== program) return false
    if (searchTerm && !student.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  // Función para ver detalles de un estudiante
  const handleViewDetails = (student: any) => {
    setSelectedStudent(student)
    setShowDetails(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reporte de Alumnos Nuevos por Mes</h1>
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
                <DialogDescription>Seleccione el formato y opciones para exportar el reporte.</DialogDescription>
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
                  <Label htmlFor="includeDetailList" className="text-right">
                    Contenido
                  </Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Checkbox id="includeDetailList" defaultChecked />
                    <Label htmlFor="includeDetailList">Incluir listado detallado de alumnos</Label>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="includeCharts" className="text-right">
                    Gráficas
                  </Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Checkbox id="includeCharts" defaultChecked />
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
          <TabsTrigger value="summary">Resumen</TabsTrigger>
          <TabsTrigger value="detail">Listado Detallado</TabsTrigger>
          <TabsTrigger value="sources">Origen de Captación</TabsTrigger>
          <TabsTrigger value="comparison">Comparativa</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros de Búsqueda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="period">Período</Label>
                  <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current-month">Mes Actual</SelectItem>
                      <SelectItem value="last-quarter">Último Trimestre</SelectItem>
                      <SelectItem value="ytd">Año hasta la fecha</SelectItem>
                      <SelectItem value="last-year">Año completo</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {period === "custom" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Fecha Inicio</Label>
                      <Input id="startDate" type="date" defaultValue="2025-01-01" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Fecha Fin</Label>
                      <Input id="endDate" type="date" defaultValue="2025-03-31" />
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
                      {programs.map((prog) => (
                        <SelectItem key={prog} value={prog}>
                          {prog}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nuevos Alumnos</p>
                    <h3 className="text-2xl font-bold mt-1">{totalNewStudents}</h3>
                    <p className="text-xs text-gray-500 mt-1">Año hasta la fecha</p>
                  </div>
                  <Users className="h-10 w-10 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">% del Total</p>
                    <h3 className="text-2xl font-bold mt-1">{percentNewVsTotal.toFixed(1)}%</h3>
                    <p className="text-xs text-gray-500 mt-1">De matriculados totales</p>
                  </div>
                  <Bookmark className="h-10 w-10 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Año Anterior</p>
                    <h3 className="text-2xl font-bold mt-1">{totalPreviousYear}</h3>
                    <p className="text-xs text-gray-500 mt-1">Mismo período</p>
                  </div>
                  <Calendar className="h-10 w-10 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Crecimiento</p>
                    <div className="flex items-center mt-1">
                      <h3 className="text-2xl font-bold">{percentChange.toFixed(1)}%</h3>
                      <span className={`ml-2 ${percentChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {percentChange >= 0 ? "↑" : "↓"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">vs. año anterior</p>
                  </div>
                  <FileText className="h-10 w-10 text-amber-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfica */}
          <Card>
            <CardHeader>
              <CardTitle>Nuevos Alumnos por Mes</CardTitle>
              <CardDescription>Evolución mensual de nuevos ingresos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
                <p className="text-gray-500">Gráfica de nuevos alumnos por mes</p>
                {/* Aquí iría el componente de gráfica real */}
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Resultados */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle Mensual de Nuevos Ingresos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mes</TableHead>
                    <TableHead className="text-right">Nuevos Alumnos</TableHead>
                    <TableHead className="text-right">% del Total</TableHead>
                    <TableHead className="text-right">Año Anterior</TableHead>
                    <TableHead className="text-right">Variación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map((month) => (
                    <TableRow key={month.month}>
                      <TableCell>{month.month}</TableCell>
                      <TableCell className="text-right">{month.newStudents}</TableCell>
                      <TableCell className="text-right">
                        {((month.newStudents / month.totalEnrollments) * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">{month.previousYear}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            month.newStudents > month.previousYear
                              ? "text-green-600"
                              : month.newStudents < month.previousYear
                                ? "text-red-600"
                                : ""
                          }
                        >
                          {(((month.newStudents - month.previousYear) / month.previousYear) * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-medium">
                    <TableCell>TOTAL</TableCell>
                    <TableCell className="text-right">{totalNewStudents}</TableCell>
                    <TableCell className="text-right">
                      {((totalNewStudents / totalEnrollments) * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right">{totalPreviousYear}</TableCell>
                    <TableCell className="text-right">
                      <span className={percentChange >= 0 ? "text-green-600" : "text-red-600"}>
                        {percentChange.toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detail" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Listado de Alumnos Nuevos</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Buscar por nombre..."
                    className="pl-8 w-[250px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={program} onValueChange={(value: any) => setProgram(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por programa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los programas</SelectItem>
                    {programs.map((prog) => (
                      <SelectItem key={prog} value={prog}>
                        {prog}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Fecha de Matrícula</TableHead>
                    <TableHead>Programa</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.id}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.enrollmentDate}</TableCell>
                      <TableCell>{student.program}</TableCell>
                      <TableCell>{student.source}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${student.status === "Activo" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                        >
                          {student.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(student)}>
                          <Search className="h-4 w-4 mr-1" />
                          Ver Detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 text-sm text-gray-500">
                Mostrando {filteredStudents.length} de {newStudents.length} alumnos nuevos
              </div>
            </CardContent>
          </Card>

          {/* Modal de detalles del estudiante */}
          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Detalles del Alumno</DialogTitle>
              </DialogHeader>
              {selectedStudent && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">{selectedStudent.name}</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <span className="font-medium w-32">ID de Alumno:</span>
                        <span>{selectedStudent.id}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium w-32">Programa:</span>
                        <span>{selectedStudent.program}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium w-32">Fecha de Matrícula:</span>
                        <span>{selectedStudent.enrollmentDate}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium w-32">Estado:</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${selectedStudent.status === "Activo" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                        >
                          {selectedStudent.status}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium w-32">Fuente de Captación:</span>
                        <span>{selectedStudent.source}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Historial Académico</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <span className="font-medium w-32">Tipo de Ingreso:</span>
                        <span>Nuevo Ingreso</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium w-32">Documentos:</span>
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">Completos</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium w-32">Primer Curso:</span>
                        <span>Fundamentos de {selectedStudent.program}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium w-32">Fecha de Inicio:</span>
                        <span>
                          {new Date(selectedStudent.enrollmentDate).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  Cerrar
                </Button>
                <Button>Ver Expediente Completo</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Origen de Captación de Nuevos Alumnos</CardTitle>
              <CardDescription>Análisis de las fuentes que generan nuevos estudiantes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-md">
                    <p className="text-gray-500">Gráfica de distribución por fuente de captación</p>
                    {/* Aquí iría el componente de gráfica real */}
                  </div>
                </div>

                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fuente</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Porcentaje</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sourcesData.map((source) => (
                        <TableRow key={source.source}>
                          <TableCell>{source.source}</TableCell>
                          <TableCell className="text-right">{source.count}</TableCell>
                          <TableCell className="text-right">{source.percentage}%</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-medium">
                        <TableCell>TOTAL</TableCell>
                        <TableCell className="text-right">
                          {sourcesData.reduce((sum, source) => sum + source.count, 0)}
                        </TableCell>
                        <TableCell className="text-right">100%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Fuente Más Efectiva</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4">
                      <div>
                        <h3 className="text-xl font-bold">Redes Sociales</h3>
                        <p className="text-sm text-gray-500">28% de nuevos alumnos</p>
                      </div>
                      <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-700 font-bold">104</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Mayor Crecimiento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4">
                      <div>
                        <h3 className="text-xl font-bold">Sitio Web</h3>
                        <p className="text-sm text-gray-500">+15% vs. año anterior</p>
                      </div>
                      <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-green-700 font-bold">+15%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Captación por Programa</CardTitle>
              <CardDescription>Distribución de fuentes por programa académico</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center bg-gray-50 rounded-md">
                <p className="text-gray-500">Gráfica de distribución de fuentes por programa</p>
                {/* Aquí iría el componente de gráfica real */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparativa con Períodos Anteriores</CardTitle>
              <CardDescription>Evolución de captación de nuevos alumnos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md mb-6">
                <p className="text-gray-500">Gráfica comparativa de nuevos alumnos por período</p>
                {/* Aquí iría el componente de gráfica real */}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Tendencia de Crecimiento</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Período</TableHead>
                        <TableHead className="text-right">Nuevos Alumnos</TableHead>
                        <TableHead className="text-right">Variación</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>2023</TableCell>
                        <TableCell className="text-right">289</TableCell>
                        <TableCell className="text-right">-</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>2024</TableCell>
                        <TableCell className="text-right">339</TableCell>
                        <TableCell className="text-right">
                          <span className="text-green-600">+17.3%</span>
                        </TableCell>
                      </TableRow>
                      <TableRow className="font-medium">
                        <TableCell>2025 (proyectado)</TableCell>
                        <TableCell className="text-right">404</TableCell>
                        <TableCell className="text-right">
                          <span className="text-green-600">+19.2%</span>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Distribución Trimestral</h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="font-medium">1er Trimestre</p>
                      <div className="flex items-center mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "35%" }}></div>
                        </div>
                        <span className="ml-2 min-w-[40px] text-center">35%</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="font-medium">2do Trimestre</p>
                      <div className="flex items-center mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "20%" }}></div>
                        </div>
                        <span className="ml-2 min-w-[40px] text-center">20%</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="font-medium">3er Trimestre</p>
                      <div className="flex items-center mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "30%" }}></div>
                        </div>
                        <span className="ml-2 min-w-[40px] text-center">30%</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="font-medium">4to Trimestre</p>
                      <div className="flex items-center mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "15%" }}></div>
                        </div>
                        <span className="ml-2 min-w-[40px] text-center">15%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

