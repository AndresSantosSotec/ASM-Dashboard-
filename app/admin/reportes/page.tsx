"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Download,
  FileText,
  Printer,
  Filter,
  FileSpreadsheet,
  FileIcon as FilePdf,
  Users,
  Bookmark,
  Search,
  CheckCircle,
  XCircle,
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
import { Badge } from "@/components/ui/badge"

export default function ReportesPage() {
  const [reportType, setReportType] = useState<string>("matriculados")
  const [period, setPeriod] = useState<string>("current-month")
  const [program, setProgram] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [showDetails, setShowDetails] = useState<boolean>(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportFormat, setExportFormat] = useState<string>("pdf")
  const [activeTab, setActiveTab] = useState<string>("current")
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)

  // Datos de ejemplo para la tabla mensual
  const monthlyData = [
    {
      month: "Enero",
      count: 87,
      previousYear: 68,
      newStudents: 32,
      programs: { "Desarrollo Web": 28, "Marketing Digital": 22, "Diseño Gráfico": 15, Contabilidad: 22 },
    },
    {
      month: "Febrero",
      count: 92,
      previousYear: 75,
      newStudents: 35,
      programs: { "Desarrollo Web": 30, "Marketing Digital": 24, "Diseño Gráfico": 16, Contabilidad: 22 },
    },
    {
      month: "Marzo",
      count: 105,
      previousYear: 83,
      newStudents: 38,
      programs: { "Desarrollo Web": 34, "Marketing Digital": 28, "Diseño Gráfico": 18, Contabilidad: 25 },
    },
    {
      month: "Abril",
      count: 78,
      previousYear: 72,
      newStudents: 25,
      programs: { "Desarrollo Web": 25, "Marketing Digital": 20, "Diseño Gráfico": 14, Contabilidad: 19 },
    },
    {
      month: "Mayo",
      count: 65,
      previousYear: 60,
      newStudents: 20,
      programs: { "Desarrollo Web": 22, "Marketing Digital": 16, "Diseño Gráfico": 12, Contabilidad: 15 },
    },
    {
      month: "Junio",
      count: 110,
      previousYear: 95,
      newStudents: 42,
      programs: { "Desarrollo Web": 38, "Marketing Digital": 30, "Diseño Gráfico": 17, Contabilidad: 25 },
    },
  ]

  // Datos de ejemplo para lista de estudiantes
  const students = [
    {
      id: 1,
      name: "Ana García",
      enrollmentDate: "2025-03-05",
      program: "Desarrollo Web",
      source: "Recomendación",
      status: "Activo",
      type: "Nuevo",
    },
    {
      id: 2,
      name: "Carlos Rodríguez",
      enrollmentDate: "2025-03-07",
      program: "Marketing Digital",
      source: "Redes Sociales",
      status: "Activo",
      type: "Nuevo",
    },
    {
      id: 3,
      name: "María López",
      enrollmentDate: "2025-03-10",
      program: "Diseño Gráfico",
      source: "Sitio Web",
      status: "Activo",
      type: "Nuevo",
    },
    {
      id: 4,
      name: "Juan Pérez",
      enrollmentDate: "2025-03-12",
      program: "Desarrollo Web",
      source: "Feria Educativa",
      status: "Activo",
      type: "Recurrente",
    },
    {
      id: 5,
      name: "Laura Martínez",
      enrollmentDate: "2025-03-15",
      program: "Contabilidad",
      source: "Anuncio en Línea",
      status: "Activo",
      type: "Recurrente",
    },
  ]

  // Datos de ejemplo para solicitudes académicas
  const academicRequests = [
    {
      id: 12345,
      student: "Juan Pérez",
      type: "Cambio de Carrera",
      date: "2025-03-10",
      status: "Pendiente",
      details: "Solicita cambio de Desarrollo Web a Marketing Digital",
    },
    {
      id: 67890,
      student: "María López",
      type: "Convalidación de Materias",
      date: "2025-03-15",
      status: "Pendiente",
      details: "Solicita convalidación de 3 materias de su carrera anterior",
    },
    {
      id: 24680,
      student: "Carlos Rodríguez",
      type: "Baja Temporal",
      date: "2025-03-18",
      status: "Pendiente",
      details: "Solicita baja temporal por motivos laborales",
    },
  ]

  // Programas académicos disponibles
  const programs = ["Desarrollo Web", "Marketing Digital", "Diseño Gráfico", "Contabilidad"]

  // Calcular totales
  const totalStudents = students.length
  const newStudents = students.filter((s) => s.type === "Nuevo").length
  const recurringStudents = students.filter((s) => s.type === "Recurrente").length
  const totalEnrollments = monthlyData.reduce((sum, month) => sum + month.count, 0)
  const totalNewStudents = monthlyData.reduce((sum, month) => sum + month.newStudents, 0)
  const totalPreviousYear = monthlyData.reduce((sum, month) => sum + month.previousYear, 0)
  const percentNewVsTotal = (totalNewStudents / totalEnrollments) * 100
  const percentChange = ((totalStudents - totalPreviousYear) / totalPreviousYear) * 100

  // Filtrar estudiantes según criterios
  const filteredStudents = students.filter((student) => {
    if (program !== "all" && student.program !== program) return false
    if (searchTerm && !student.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  // Función para ver detalles de un estudiante
  const handleViewDetails = (student: any) => {
    setSelectedStudent(student)
    setShowDetails(true)
  }

  // Función para manejar aprobaciones académicas
  const handleApprovalRequest = (request: any) => {
    setSelectedRequest(request)
    setShowApprovalDialog(true)
  }

  // Función para aprobar o rechazar solicitud
  const handleApprovalAction = (approved: boolean) => {
    // Aquí iría la lógica para actualizar el estado de la solicitud
    console.log(`Solicitud ${selectedRequest.id} ${approved ? "aprobada" : "rechazada"}`)
    setShowApprovalDialog(false)
  }

  // Función para exportar a PDF
  const handleExport = () => {
    // Aquí iría la lógica para generar y descargar el PDF
    console.log(`Exportando reporte en formato ${exportFormat}`)
    setShowExportDialog(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {reportType === "matriculados" ? "Reportes de Matrícula" : "Reporte de Alumnos Nuevos"}
        </h1>
        <div className="flex items-center space-x-4">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tipo de reporte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="matriculados">Matriculados por Mes</SelectItem>
              <SelectItem value="nuevos">Alumnos Nuevos por Mes</SelectItem>
            </SelectContent>
          </Select>
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
                  <Label htmlFor="includeCharts" className="text-right">
                    Incluir Gráficas
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
                <Button onClick={handleExport}>
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
          <TabsTrigger value="academic-approvals">Aprobaciones Académicas</TabsTrigger>
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
                  <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rango" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current-month">Mes Actual</SelectItem>
                      <SelectItem value="quarter">Trimestre Actual</SelectItem>
                      <SelectItem value="semester">Semestre Actual</SelectItem>
                      <SelectItem value="year">Año Actual</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {period === "custom" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Fecha Inicio</Label>
                      <Input id="startDate" type="date" defaultValue="2025-03-01" />
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
                  <Users className="h-10 w-10 text-green-500" />
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
                  <Bookmark className="h-10 w-10 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfica */}
          <Card>
            <CardHeader>
              <CardTitle>{reportType === "matriculados" ? "Matrícula por Mes" : "Nuevos Alumnos por Mes"}</CardTitle>
              <CardDescription>
                Evolución mensual de {reportType === "matriculados" ? "matrículas" : "nuevos ingresos"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
                <p className="text-gray-500">
                  Gráfica de {reportType === "matriculados" ? "matrícula mensual" : "nuevos alumnos por mes"}
                </p>
                {/* Aquí iría el componente de gráfica real */}
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Resultados */}
          <Card>
            <CardHeader>
              <CardTitle>
                {reportType === "matriculados"
                  ? "Listado de Alumnos Matriculados"
                  : "Detalle Mensual de Nuevos Ingresos"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Buscar por nombre..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Fecha de Matrícula</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Programa</TableHead>
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
                      <TableCell>
                        <Badge variant={student.type === "Nuevo" ? "default" : "secondary"}>{student.type}</Badge>
                      </TableCell>
                      <TableCell>{student.program}</TableCell>
                      <TableCell>
                        <Badge variant={student.status === "Activo" ? "success" : "destructive"}>
                          {student.status}
                        </Badge>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparativa con Período Anterior</CardTitle>
              <CardDescription>Comparación entre el período actual y el período anterior</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md mb-6">
                <p className="text-gray-500">Gráfica comparativa entre períodos</p>
                {/* Aquí iría el componente de gráfica real */}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mes</TableHead>
                    <TableHead className="text-right">
                      {reportType === "matriculados" ? "Total Matriculados" : "Nuevos Alumnos"}
                    </TableHead>
                    <TableHead className="text-right">Año Anterior</TableHead>
                    <TableHead className="text-right">Variación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map((month) => (
                    <TableRow key={month.month}>
                      <TableCell>{month.month}</TableCell>
                      <TableCell className="text-right">
                        {reportType === "matriculados" ? month.count : month.newStudents}
                      </TableCell>
                      <TableCell className="text-right">{month.previousYear}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            (reportType === "matriculados" ? month.count : month.newStudents) > month.previousYear
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {(
                            (((reportType === "matriculados" ? month.count : month.newStudents) - month.previousYear) /
                              month.previousYear) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academic-approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aprobaciones Académicas Pendientes</CardTitle>
              <CardDescription>Listado de solicitudes académicas pendientes de aprobación</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Solicitud</TableHead>
                    <TableHead>Alumno</TableHead>
                    <TableHead>Tipo de Solicitud</TableHead>
                    <TableHead>Fecha de Solicitud</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {academicRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.id}</TableCell>
                      <TableCell>{request.student}</TableCell>
                      <TableCell>{request.type}</TableCell>
                      <TableCell>{request.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{request.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleApprovalRequest(request)}>
                          Ver y Aprobar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                    <Badge variant={selectedStudent.status === "Activo" ? "success" : "destructive"}>
                      {selectedStudent.status}
                    </Badge>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium w-32">Tipo:</span>
                    <Badge variant={selectedStudent.type === "Nuevo" ? "default" : "secondary"}>
                      {selectedStudent.type}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Historial Académico</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="font-medium w-32">Documentos:</span>
                    <Badge variant="outline">Completos</Badge>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium w-32">Primer Curso:</span>
                    <span>Fundamentos de {selectedStudent.program}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium w-32">Fecha de Inicio:</span>
                    <span>{selectedStudent.enrollmentDate}</span>
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

      {/* Modal de aprobación académica */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Solicitud Académica</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="py-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">ID de Solicitud</p>
                    <p className="font-medium">{selectedRequest.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Fecha de Solicitud</p>
                    <p className="font-medium">{selectedRequest.date}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Alumno</p>
                    <p className="font-medium">{selectedRequest.student}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tipo de Solicitud</p>
                    <p className="font-medium">{selectedRequest.type}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Detalles de la Solicitud</p>
                  <p className="mt-1">{selectedRequest.details}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm font-medium text-gray-500 mb-2">Documentos Adjuntos</p>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <span>solicitud_{selectedRequest.id}.pdf</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="approvalNotes">Notas de Aprobación/Rechazo</Label>
                  <Input
                    id="approvalNotes"
                    className="mt-1"
                    placeholder="Ingrese notas o comentarios sobre esta solicitud..."
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => handleApprovalAction(false)}>
              <XCircle className="h-4 w-4 mr-1" />
              Rechazar
            </Button>
            <Button variant="default" onClick={() => handleApprovalAction(true)}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Aprobar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

