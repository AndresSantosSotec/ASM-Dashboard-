"use client"

import { useState, useEffect } from "react"
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
import {
  fetchReportesGraduaciones,
  exportReportesGraduaciones,
  fetchProgramasParaFiltro,
  getAniosDisponibles,
  getPeriodosDisponibles,
  formatFechaGraduacion,
  calcularTiempoDesdeGraduacion,
  type ReportesGraduacionesResponse,
  type Graduado,
} from "@/services/reportesGraduaciones"
import { toast } from "sonner"

export default function ReporteGraduacionesPage() {
  // Estados de filtros
  const [year, setYear] = useState<string>(new Date().getFullYear().toString())
  const [period, setPeriod] = useState<string>("all")
  const [program, setProgram] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")
  
  // Estados de UI
  const [activeTab, setActiveTab] = useState<string>("graduates")
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportFormat, setExportFormat] = useState<string>("pdf")
  const [showGraduateDetails, setShowGraduateDetails] = useState(false)
  const [selectedGraduate, setSelectedGraduate] = useState<Graduado | null>(null)
  
  // Estados de datos
  const [data, setData] = useState<ReportesGraduacionesResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [exporting, setExporting] = useState<boolean>(false)
  const [programas, setProgramas] = useState<Array<{ id: number; nombre: string; abreviatura: string }>>([])

  // Cargar programas al montar el componente
  useEffect(() => {
    loadProgramas()
  }, [])

  const loadProgramas = async () => {
    try {
      const programasData = await fetchProgramasParaFiltro()
      setProgramas(programasData)
    } catch (error) {
      console.error('Error al cargar programas:', error)
      toast.error('Error al cargar lista de programas')
    }
  }

  // Cargar datos cuando cambien los filtros
  useEffect(() => {
    loadData()
  }, [year, period, program, searchTerm])

  const loadData = async () => {
    setLoading(true)
    console.log('🔄 Cargando datos de graduaciones...', {
      anio: parseInt(year),
      periodo: period,
      programaId: program,
      search: searchTerm || undefined,
    })
    
    try {
      const response = await fetchReportesGraduaciones({
        anio: parseInt(year),
        periodo: period as any,
        programaId: program,
        search: searchTerm || undefined,
      })
      
      console.log('✅ Datos recibidos del backend:', response)
      console.log('📊 Total de graduados:', response.graduados?.graduados?.length || 0)
      console.log('📈 Estadísticas:', response.estadisticas)
      
      setData(response)
      
      if (response.graduados?.graduados?.length > 0) {
        toast.success(`${response.graduados.graduados.length} graduados encontrados`)
      } else {
        toast.info('No se encontraron graduados en este período')
      }
    } catch (error: any) {
      console.error('❌ Error al cargar datos de graduaciones:', error)
      toast.error('Error al cargar datos de graduaciones: ' + (error.message || 'Error desconocido'))
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportReportesGraduaciones({
        formato: exportFormat as any,
        anio: parseInt(year),
        periodo: period as any,
        programaId: program !== 'all' ? program : undefined,
        search: searchTerm || undefined,
      })
      toast.success(`Reporte exportado como ${exportFormat.toUpperCase()}`)
      setShowExportDialog(false)
    } catch (error: any) {
      console.error('Error al exportar:', error)
      toast.error(error.message || 'Error al exportar reporte')
    } finally {
      setExporting(false)
    }
  }

  const handleViewGraduate = (graduado: Graduado) => {
    setSelectedGraduate(graduado)
    setShowGraduateDetails(true)
  }

  // Extraer datos REALES del backend
  const graduates = data?.graduados?.graduados || []
  const estadisticas = data?.estadisticas
  const historico = data?.historico
  const egresados = data?.egresados
  
  // Usar SOLO datos reales del backend
  const filteredGraduates = graduates

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Reporte de Graduaciones</h1>
          <div className="flex items-center gap-2 mt-1">
            {graduates.length > 0 ? (
              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                ✓ {graduates.length} graduados cargados
              </span>
            ) : (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                Sin graduados en este período
              </span>
            )}
            {loading && (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full animate-pulse">
                🔄 Cargando...
              </span>
            )}
          </div>
        </div>
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
                <Button variant="outline" onClick={() => setShowExportDialog(false)} disabled={exporting}>
                  Cancelar
                </Button>
                <Button onClick={handleExport} disabled={exporting}>
                  {exportFormat === "pdf" ? (
                    <FilePdf className="h-4 w-4 mr-1" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                  )}
                  {exporting ? 'Exportando...' : 'Exportar'}
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
                      {getAniosDisponibles().map((anio) => (
                        <SelectItem key={anio} value={anio.toString()}>
                          {anio}
                        </SelectItem>
                      ))}
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
                      {programas.map((prog) => (
                        <SelectItem key={prog.id} value={prog.id.toString()}>
                          {prog.abreviatura} - {prog.nombre}
                        </SelectItem>
                      ))}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Graduados</p>
                    <h3 className="text-2xl font-bold mt-1">{estadisticas?.totalGraduados || 0}</h3>
                    <p className="text-xs text-gray-500 mt-1">En el período seleccionado</p>
                  </div>
                  <Graduation className="h-10 w-10 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tiempo Promedio</p>
                    <h3 className="text-2xl font-bold mt-1">{estadisticas?.tiempoPromedioMeses || 0} meses</h3>
                    <p className="text-xs text-gray-500 mt-1">Duración del programa</p>
                  </div>
                  <Calendar className="h-10 w-10 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Programas Activos</p>
                    <h3 className="text-2xl font-bold mt-1">{estadisticas?.distribucionProgramas?.length || 0}</h3>
                    <p className="text-xs text-gray-500 mt-1">Con graduados</p>
                  </div>
                  <FileText className="h-10 w-10 text-purple-500" />
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
                    <TableHead>Carnet</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Programa</TableHead>
                    <TableHead>Fecha de Graduación</TableHead>
                    <TableHead>Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Cargando datos...
                      </TableCell>
                    </TableRow>
                  ) : filteredGraduates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No se encontraron graduados en este período
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredGraduates.map((graduate) => (
                      <TableRow key={graduate.id}>
                        <TableCell>{graduate.id}</TableCell>
                        <TableCell>{graduate.carnet}</TableCell>
                        <TableCell>{graduate.nombre}</TableCell>
                        <TableCell>{graduate.programa}</TableCell>
                        <TableCell>{graduate.fechaGraduacion}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleViewGraduate(graduate)}>
                            <Search className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
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
                {estadisticas?.distribucionProgramas?.map((programa) => (
                  <div key={programa.programa} className="p-3 bg-blue-50 rounded-md text-center">
                    <h4 className="font-medium text-sm">{programa.abreviatura}</h4>
                    <p className="text-xs text-gray-600 truncate">{programa.programa}</p>
                    <p className="text-lg font-bold text-blue-600 mt-1">{programa.total}</p>
                    <p className="text-xs text-blue-600">graduados</p>
                  </div>
                ))}
                {(!estadisticas?.distribucionProgramas || estadisticas.distribucionProgramas.length === 0) && (
                  <div className="col-span-4 text-center py-8 text-gray-500">
                    No hay datos de distribución por programa
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas de Graduación</CardTitle>
              <CardDescription>Análisis detallado de las tasas de graduación</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Graduados</p>
                        <h3 className="text-2xl font-bold mt-1">{estadisticas?.totalGraduados || 0}</h3>
                        <p className="text-xs text-gray-500 mt-1">En el período</p>
                      </div>
                      <UserCheck className="h-10 w-10 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Tiempo Promedio</p>
                        <h3 className="text-2xl font-bold mt-1">{estadisticas?.tiempoPromedioMeses || 0}</h3>
                        <p className="text-xs text-gray-500 mt-1">Meses de duración</p>
                      </div>
                      <Calendar className="h-10 w-10 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Programas</p>
                        <h3 className="text-2xl font-bold mt-1">{estadisticas?.distribucionProgramas?.length || 0}</h3>
                        <p className="text-xs text-gray-500 mt-1">Con graduados</p>
                      </div>
                      <Graduation className="h-10 w-10 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución por Programa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Programa</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Porcentaje</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {estadisticas?.distribucionProgramas?.map((programa) => (
                          <TableRow key={programa.programa}>
                            <TableCell className="font-medium">{programa.programa}</TableCell>
                            <TableCell>{programa.total}</TableCell>
                            <TableCell>
                              <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                {estadisticas?.totalGraduados 
                                  ? ((programa.total / estadisticas.totalGraduados) * 100).toFixed(1)
                                  : '0'}%
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!estadisticas?.distribucionProgramas || estadisticas.distribucionProgramas.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                              No hay datos disponibles
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribución por Modalidad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Modalidad</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Porcentaje</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {estadisticas?.distribucionModalidad?.map((modalidad) => (
                          <TableRow key={modalidad.modalidad}>
                            <TableCell className="font-medium">{modalidad.modalidad}</TableCell>
                            <TableCell>{modalidad.total}</TableCell>
                            <TableCell>
                              <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                {estadisticas?.totalGraduados 
                                  ? ((modalidad.total / estadisticas.totalGraduados) * 100).toFixed(1)
                                  : '0'}%
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!estadisticas?.distribucionModalidad || estadisticas.distribucionModalidad.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                              No hay datos disponibles
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Graduaciones</CardTitle>
              <CardDescription>Evolución mensual del año seleccionado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Graduados por Mes ({year})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mes</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historico?.graduadosPorMes?.map((mes) => (
                          <TableRow key={mes.mesNumero}>
                            <TableCell className="font-medium">{mes.mes}</TableCell>
                            <TableCell>
                              <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                {mes.total}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!historico?.graduadosPorMes || historico.graduadosPorMes.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center py-8 text-gray-500">
                              No hay datos históricos disponibles
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Comparación Anual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {historico?.comparacionAnioAnterior ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-md">
                          <p className="text-sm font-medium text-gray-600">
                            Año {historico.comparacionAnioAnterior.anioAnterior}
                          </p>
                          <p className="text-2xl font-bold text-blue-600 mt-1">
                            {historico.comparacionAnioAnterior.totalAnioAnterior}
                          </p>
                          <p className="text-xs text-gray-500">graduados</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-md">
                          <p className="text-sm font-medium text-gray-600">
                            Año {year}
                          </p>
                          <p className="text-2xl font-bold text-green-600 mt-1">
                            {historico.comparacionAnioAnterior.totalAnioActual}
                          </p>
                          <p className="text-xs text-gray-500">graduados</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-md text-center">
                          <p className="text-sm font-medium text-gray-600">Variación</p>
                          <p className={`text-2xl font-bold mt-1 ${
                            historico.comparacionAnioAnterior.variacion >= 0 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {historico.comparacionAnioAnterior.variacion >= 0 ? '+' : ''}
                            {historico.comparacionAnioAnterior.variacion.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
                        <p className="text-gray-500">No hay datos de comparación disponibles</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alumni" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seguimiento de Egresados</CardTitle>
              <CardDescription>Estado de la base de datos de contacto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Egresados</p>
                        <h3 className="text-2xl font-bold mt-1">{egresados?.totalEgresados || 0}</h3>
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
                        <p className="text-sm font-medium text-gray-500">Contacto Completo</p>
                        <h3 className="text-2xl font-bold mt-1">{egresados?.egresadosContactoCompleto || 0}</h3>
                        <p className="text-xs text-gray-500 mt-1">Con datos actualizados</p>
                      </div>
                      <Mail className="h-10 w-10 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Porcentaje</p>
                        <h3 className="text-2xl font-bold mt-1">{egresados?.porcentajeContactoCompleto?.toFixed(1) || 0}%</h3>
                        <p className="text-xs text-gray-500 mt-1">Base de datos completa</p>
                      </div>
                      <BarChart2 className="h-10 w-10 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {!egresados && (
                <div className="p-8 bg-gray-50 rounded-md text-center">
                  <p className="text-gray-500">No hay datos de seguimiento disponibles</p>
                </div>
              )}
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
                <h3 className="text-lg font-semibold mb-4">{selectedGraduate.nombre}</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="font-medium w-32">ID:</span>
                    <span>{selectedGraduate.id}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium w-32">Carnet:</span>
                    <span>{selectedGraduate.carnet}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium w-32">Programa:</span>
                    <span>{selectedGraduate.programa}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium w-32">Graduación:</span>
                    <span>{formatFechaGraduacion(selectedGraduate.fechaGraduacion)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium w-32">Duración:</span>
                    <span>{selectedGraduate.duracionMeses} meses</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Información de Contacto</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="font-medium w-32">Email:</span>
                    <span>{selectedGraduate.correo}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium w-32">Teléfono:</span>
                    <span>{selectedGraduate.telefono}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium w-32">Modalidad:</span>
                    <span>{selectedGraduate.modalidad}</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold mt-6 mb-4">Información Académica</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="font-medium w-32">Asesor:</span>
                    <span>{selectedGraduate.asesor}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium w-32">Fecha Inicio:</span>
                    <span>{selectedGraduate.fechaInicio}</span>
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

