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
  GraduationCapIcon as Graduation,
  BarChart2,
  FileSpreadsheet,
  FileIcon as FilePdf,
  Search,
  UserCheck,
  Mail,
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

export default function ReporteGraduacionesPage() {
  const [year, setYear] = useState<string>("2025")
  const [period, setPeriod] = useState<string>("all")
  const [program, setProgram] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<string>("graduates")
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportFormat, setExportFormat] = useState<string>("pdf")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [showGraduateDetails, setShowGraduateDetails] = useState(false)
  const [selectedGraduate, setSelectedGraduate] = useState<any>(null)

  // Datos de ejemplo para la tabla
  const graduates = [
    {
      id: 1,
      name: "Ana García",
      graduationDate: "2025-06-15",
      program: "Desarrollo Web",
      gpa: "9.2",
      email: "ana.garcia@example.com",
      phone: "+52 555 123 4567",
      thesis: "Desarrollo de Aplicaciones Web Progresivas",
      advisor: "Dr. Carlos Mendoza",
      honors: true,
    },
    {
      id: 2,
      name: "Carlos Rodríguez",
      graduationDate: "2025-06-15",
      program: "Marketing Digital",
      gpa: "8.7",
      email: "carlos.rodriguez@example.com",
      phone: "+52 555 234 5678",
      thesis: "Estrategias de Marketing en Redes Sociales",
      advisor: "Dra. Laura Sánchez",
      honors: false,
    },
    {
      id: 3,
      name: "María López",
      graduationDate: "2025-06-15",
      program: "Diseño Gráfico",
      gpa: "9.5",
      email: "maria.lopez@example.com",
      phone: "+52 555 345 6789",
      thesis: "Diseño de Interfaces para Aplicaciones Móviles",
      advisor: "Dr. Roberto Gómez",
      honors: true,
    },
    {
      id: 4,
      name: "Juan Pérez",
      graduationDate: "2025-06-15",
      program: "Desarrollo Web",
      gpa: "8.9",
      email: "juan.perez@example.com",
      phone: "+52 555 456 7890",
      thesis: "Seguridad en Aplicaciones Web",
      advisor: "Dra. Ana Martínez",
      honors: false,
    },
    {
      id: 5,
      name: "Laura Martínez",
      graduationDate: "2025-12-10",
      program: "Contabilidad",
      gpa: "9.1",
      email: "laura.martinez@example.com",
      phone: "+52 555 567 8901",
      thesis: "Análisis de Estados Financieros",
      advisor: "Dr. Javier López",
      honors: true,
    },
    {
      id: 6,
      name: "Roberto Sánchez",
      graduationDate: "2025-12-10",
      program: "Marketing Digital",
      gpa: "8.5",
      email: "roberto.sanchez@example.com",
      phone: "+52 555 678 9012",
      thesis: "Estrategias de Email Marketing",
      advisor: "Dra. Sofía Ramírez",
      honors: false,
    },
    {
      id: 7,
      name: "Sofía Ramírez",
      graduationDate: "2025-12-10",
      program: "Desarrollo Web",
      gpa: "9.3",
      email: "sofia.ramirez@example.com",
      phone: "+52 555 789 0123",
      thesis: "Frameworks de JavaScript para Desarrollo Web",
      advisor: "Dr. Miguel Ángel Torres",
      honors: true,
    },
    {
      id: 8,
      name: "Diego Hernández",
      graduationDate: "2025-12-10",
      program: "Diseño Gráfico",
      gpa: "8.8",
      email: "diego.hernandez@example.com",
      phone: "+52 555 890 1234",
      thesis: "Diseño de Marca para Startups",
      advisor: "Dra. Carmen Vega",
      honors: false,
    },
    {
      id: 9,
      name: "Valentina Torres",
      graduationDate: "2025-12-10",
      program: "Contabilidad",
      gpa: "9.0",
      email: "valentina.torres@example.com",
      phone: "+52 555 901 2345",
      thesis: "Impacto de las NIIF en PyMEs",
      advisor: "Dr. Fernando Ruiz",
      honors: true,
    },
    {
      id: 10,
      name: "Javier Flores",
      graduationDate: "2025-12-10",
      program: "Marketing Digital",
      gpa: "8.6",
      email: "javier.flores@example.com",
      phone: "+52 555 012 3456",
      thesis: "Marketing de Contenidos en Plataformas Digitales",
      advisor: "Dra. Patricia Morales",
      honors: false,
    },
  ]

  // Datos históricos para comparación
  const historicalData = [
    {
      year: "2023",
      total: 85,
      byProgram: { "Desarrollo Web": 25, "Marketing Digital": 20, "Diseño Gráfico": 15, Contabilidad: 25 },
    },
    {
      year: "2024",
      total: 92,
      byProgram: { "Desarrollo Web": 28, "Marketing Digital": 22, "Diseño Gráfico": 17, Contabilidad: 25 },
    },
    {
      year: "2025",
      total: 100,
      byProgram: { "Desarrollo Web": 30, "Marketing Digital": 25, "Diseño Gráfico": 20, Contabilidad: 25 },
    },
  ]

  // Datos de cohortes para análisis de egreso
  const cohortData = [
    { cohort: "2021-2023", enrolled: 120, graduated: 85, rate: 70.8 },
    { cohort: "2022-2024", enrolled: 130, graduated: 92, rate: 70.8 },
    { cohort: "2023-2025", enrolled: 140, graduated: 100, rate: 71.4 },
  ]

  // Filtrar graduados según los criterios seleccionados
  const filteredGraduates = graduates.filter((graduate) => {
    if (program !== "all" && graduate.program !== program) return false
    if (period !== "all") {
      if (period === "first" && !graduate.graduationDate.includes("06-15")) return false
      if (period === "second" && !graduate.graduationDate.includes("12-10")) return false
    }
    if (searchTerm && !graduate.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  // Calcular totales por programa
  const programCounts = filteredGraduates.reduce((acc: Record<string, number>, graduate) => {
    acc[graduate.program] = (acc[graduate.program] || 0) + 1
    return acc
  }, {})

  // Calcular promedios por programa
  const programAverages = filteredGraduates.reduce((acc: Record<string, { sum: number; count: number }>, graduate) => {
    if (!acc[graduate.program]) {
      acc[graduate.program] = { sum: 0, count: 0 }
    }
    acc[graduate.program].sum += Number.parseFloat(graduate.gpa)
    acc[graduate.program].count += 1
    return acc
  }, {})

  const programGPAs = Object.entries(programAverages).reduce((acc: Record<string, number>, [program, data]) => {
    acc[program] = data.sum / data.count
    return acc
  }, {})

  // Función para mostrar detalles de un graduado
  const handleViewGraduate = (graduate: any) => {
    setSelectedGraduate(graduate)
    setShowGraduateDetails(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reporte de Graduaciones</h1>
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
                <DialogTitle>Exportar Reporte de Graduaciones</DialogTitle>
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
                  <Label htmlFor="includeDetails" className="text-right">
                    Incluir Detalles
                  </Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <input type="checkbox" id="includeDetails" className="h-4 w-4" defaultChecked />
                    <Label htmlFor="includeDetails">Incluir información detallada de graduados</Label>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="includeStats" className="text-right">
                    Incluir Estadísticas
                  </Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <input type="checkbox" id="includeStats" className="h-4 w-4" defaultChecked />
                    <Label htmlFor="includeStats">Incluir estadísticas y gráficas</Label>
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
          <TabsTrigger value="graduates">Graduados</TabsTrigger>
          <TabsTrigger value="statistics">Estadísticas</TabsTrigger>
          <TabsTrigger value="historical">Histórico</TabsTrigger>
          <TabsTrigger value="alumni">Alumni</TabsTrigger>
        </TabsList>

        <TabsContent value="graduates" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros de Búsqueda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Año</Label>
                  <Select value={year} onValueChange={(value: any) => setYear(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar año" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period">Período</Label>
                  <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los períodos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los períodos</SelectItem>
                      <SelectItem value="first">Primer Semestre</SelectItem>
                      <SelectItem value="second">Segundo Semestre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
                  <Label htmlFor="search">Buscar por Nombre</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="search"
                      placeholder="Buscar graduado..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Graduados</p>
                    <h3 className="text-2xl font-bold mt-1">{filteredGraduates.length}</h3>
                    <p className="text-xs text-gray-500 mt-1">Año {year}</p>
                  </div>
                  <Graduation className="h-10 w-10 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Promedio General</p>
                    <h3 className="text-2xl font-bold mt-1">
                      {(
                        filteredGraduates.reduce((sum, graduate) => sum + Number.parseFloat(graduate.gpa), 0) /
                        filteredGraduates.length
                      ).toFixed(1)}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Escala 0-10</p>
                  </div>
                  <FileText className="h-10 w-10 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de Resultados */}
          <Card>
            <CardHeader>
              <CardTitle>Listado de Graduados</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Fecha de Graduación</TableHead>
                    <TableHead>Programa</TableHead>
                    <TableHead>Promedio</TableHead>
                    <TableHead>Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGraduates.map((graduate) => (
                    <TableRow key={graduate.id}>
                      <TableCell>{graduate.id}</TableCell>
                      <TableCell>{graduate.name}</TableCell>
                      <TableCell>{graduate.graduationDate}</TableCell>
                      <TableCell>{graduate.program}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${Number.parseFloat(graduate.gpa) >= 9.0 ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}
                        >
                          {graduate.gpa}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleViewGraduate(graduate)}>
                          <Search className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
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
                <CardTitle>Graduados por Programa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
                  <p className="text-gray-500">Gráfica de graduados por programa</p>
                  {/* Aquí iría el componente de gráfica real */}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Porcentaje de Egreso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
                  <p className="text-gray-500">Gráfica de porcentaje de egreso por cohorte</p>
                  {/* Aquí iría el componente de gráfica real */}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Estadísticas Adicionales */}
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas por Programa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(programCounts).map(([program, count]) => (
                  <div key={program} className="p-3 bg-blue-50 rounded-md text-center">
                    <h4 className="font-medium">{program}</h4>
                    <p className="text-sm text-blue-600">{count} graduados</p>
                    <p className="text-sm text-blue-600">Promedio: {programGPAs[program]?.toFixed(1) || "N/A"}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas de Graduación</CardTitle>
              <CardDescription>Análisis detallado de las tasas de graduación y rendimiento académico</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Tasa de Graduación</p>
                        <h3 className="text-2xl font-bold mt-1">71.4%</h3>
                        <p className="text-xs text-gray-500 mt-1">Cohorte 2023-2025</p>
                      </div>
                      <UserCheck className="h-10 w-10 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Graduados con Honores</p>
                        <h3 className="text-2xl font-bold mt-1">40%</h3>
                        <p className="text-xs text-gray-500 mt-1">Del total de graduados</p>
                      </div>
                      <Graduation className="h-10 w-10 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Tiempo Promedio</p>
                        <h3 className="text-2xl font-bold mt-1">2.2 años</h3>
                        <p className="text-xs text-gray-500 mt-1">Para completar el programa</p>
                      </div>
                      <Calendar className="h-10 w-10 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Tasa de Graduación por Cohorte</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cohorte</TableHead>
                          <TableHead>Matriculados</TableHead>
                          <TableHead>Graduados</TableHead>
                          <TableHead>Tasa</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cohortData.map((cohort) => (
                          <TableRow key={cohort.cohort}>
                            <TableCell>{cohort.cohort}</TableCell>
                            <TableCell>{cohort.enrolled}</TableCell>
                            <TableCell>{cohort.graduated}</TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${cohort.rate >= 70 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                              >
                                {cohort.rate.toFixed(1)}%
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribución de Promedios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
                      <p className="text-gray-500">Gráfica de distribución de promedios</p>
                      {/* Aquí iría el componente de gráfica real */}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Análisis de Eficiencia Terminal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
                    <p className="text-gray-500">Gráfica de análisis de eficiencia terminal</p>
                    {/* Aquí iría el componente de gráfica real */}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Graduaciones</CardTitle>
              <CardDescription>Evolución de graduaciones a lo largo de los años</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center bg-gray-50 rounded-md mb-6">
                <p className="text-gray-500">Gráfica histórica de graduaciones (5 años)</p>
                {/* Aquí iría el componente de gráfica real */}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Graduados por Año</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Año</TableHead>
                          <TableHead>Total Graduados</TableHead>
                          <TableHead>Variación</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historicalData.map((data, index) => (
                          <TableRow key={data.year}>
                            <TableCell>{data.year}</TableCell>
                            <TableCell>{data.total}</TableCell>
                            <TableCell>
                              {index > 0 ? (
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${(data.total - historicalData[index - 1].total) >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                                >
                                  {data.total - historicalData[index - 1].total >= 0 ? "+" : ""}
                                  {data.total - historicalData[index - 1].total}(
                                  {(
                                    ((data.total - historicalData[index - 1].total) / historicalData[index - 1].total) *
                                    100
                                  ).toFixed(1)}
                                  %)
                                </span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Evolución por Programa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
                      <p className="text-gray-500">Gráfica de evolución por programa</p>
                      {/* Aquí iría el componente de gráfica real */}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alumni" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Base de Datos de Alumni</CardTitle>
              <CardDescription>Seguimiento de egresados y su desarrollo profesional</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Alumni</p>
                        <h3 className="text-2xl font-bold mt-1">277</h3>
                        <p className="text-xs text-gray-500 mt-1">En la base de datos</p>
                      </div>
                      <UserCheck className="h-10 w-10 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Tasa de Empleo</p>
                        <h3 className="text-2xl font-bold mt-1">92%</h3>
                        <p className="text-xs text-gray-500 mt-1">Dentro de su campo</p>
                      </div>
                      <BarChart2 className="h-10 w-10 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Contacto Activo</p>
                        <h3 className="text-2xl font-bold mt-1">85%</h3>
                        <p className="text-xs text-gray-500 mt-1">Mantienen comunicación</p>
                      </div>
                      <Mail className="h-10 w-10 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución Laboral</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
                      <p className="text-gray-500">Gráfica de distribución laboral de egresados</p>
                      {/* Aquí iría el componente de gráfica real */}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Nivel de Ingresos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
                      <p className="text-gray-500">Gráfica de nivel de ingresos de egresados</p>
                      {/* Aquí iría el componente de gráfica real */}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Próximos Eventos Alumni</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start p-3 bg-blue-50 rounded-md">
                      <Calendar className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Encuentro Anual de Egresados</h4>
                        <p className="text-sm text-gray-600">Fecha: 15 de Junio, 2025</p>
                        <p className="text-sm text-gray-600">Lugar: Campus Principal</p>
                      </div>
                    </div>

                    <div className="flex items-start p-3 bg-green-50 rounded-md">
                      <Calendar className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Webinar: Tendencias en Tecnología</h4>
                        <p className="text-sm text-gray-600">Fecha: 20 de Julio, 2025</p>
                        <p className="text-sm text-gray-600">Plataforma: Zoom</p>
                      </div>
                    </div>

                    <div className="flex items-start p-3 bg-purple-50 rounded-md">
                      <Calendar className="h-5 w-5 text-purple-500 mr-3 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Feria de Empleo para Egresados</h4>
                        <p className="text-sm text-gray-600">Fecha: 10 de Agosto, 2025</p>
                        <p className="text-sm text-gray-600">Lugar: Centro de Convenciones</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de detalles de graduado */}
      <Dialog open={showGraduateDetails} onOpenChange={setShowGraduateDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalles del Graduado</DialogTitle>
          </DialogHeader>
          {selectedGraduate && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">{selectedGraduate.name}</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="font-medium w-32">ID:</span>
                    <span>{selectedGraduate.id}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium w-32">Programa:</span>
                    <span>{selectedGraduate.program}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium w-32">Graduación:</span>
                    <span>{selectedGraduate.graduationDate}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium w-32">Promedio:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${Number.parseFloat(selectedGraduate.gpa) >= 9.0 ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}
                    >
                      {selectedGraduate.gpa}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium w-32">Honores:</span>
                    <span>{selectedGraduate.honors ? "Sí" : "No"}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Información de Contacto</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="font-medium w-32">Email:</span>
                    <span>{selectedGraduate.email}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium w-32">Teléfono:</span>
                    <span>{selectedGraduate.phone}</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold mt-6 mb-4">Información Académica</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <span className="font-medium w-32">Tesis:</span>
                    <span>{selectedGraduate.thesis}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium w-32">Asesor:</span>
                    <span>{selectedGraduate.advisor}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGraduateDetails(false)}>
              Cerrar
            </Button>
            <Button>Descargar Expediente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

