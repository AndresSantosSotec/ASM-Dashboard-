"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { isAxiosError } from "axios"
import {
  AlertCircle,
  Download,
  FileSpreadsheet,
  FileIcon as FilePdf,
  FileText,
  Filter,
  Loader2,
  Printer,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import {
  exportMatriculaReport,
  fetchMatriculaReport,
  type MatriculaDateRange,
  type MatriculaExportDetail,
  type MatriculaExportFormat,
  type MatriculaReportFilters,
  type MatriculaReportResponse,
} from "@/services/reportesMatricula"
import {
  exportarEstudiantesMatriculados,
  fetchEstudiantesMatriculados,
  type EstudianteMatriculado,
} from "@/services/estudiantesMatriculados"

const numberFormatter = new Intl.NumberFormat("es-PE")
const percentFormatter = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 })
const dateFormatter = new Intl.DateTimeFormat("es-PE")

const rangeLabels: Record<MatriculaDateRange, string> = {
  month: "Mes actual",
  quarter: "Trimestre actual",
  semester: "Semestre actual",
  year: "Año actual",
  custom: "Rango personalizado",
}

const formatNumber = (value?: number | null) => {
  if (value === null || value === undefined) {
    return "—"
  }

  return numberFormatter.format(value)
}

const formatPercent = (value?: number | null, { showSign = true }: { showSign?: boolean } = {}) => {
  if (value === null || value === undefined || Number.isNaN(value) || !Number.isFinite(value)) {
    return "—"
  }

  const formatted = percentFormatter.format(Math.abs(value))

  if (!showSign) {
    return `${formatted}%`
  }

  if (value > 0) {
    return `+${formatted}%`
  }

  if (value < 0) {
    return `-${formatted}%`
  }

  return `${formatted}%`
}

const formatDate = (value?: string | null) => {
  if (!value) {
    return "—"
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return dateFormatter.format(parsedDate)
}

const getErrorMessage = (error: unknown) => {
  if (isAxiosError(error)) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.response?.data?.mensaje ||
      error.message

    return message || "Ocurrió un error inesperado"
  }

  if (error instanceof Error) {
    return error.message
  }

  return "Ocurrió un error inesperado"
}

const DEFAULT_FILTERS: MatriculaReportFilters = {
  rango: "month",
  programaId: "all",
  tipoAlumno: "all",
  page: 1,
  perPage: 50,
}

export default function ReportesMatriculaPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"current" | "comparison" | "trends">("current")
  const [dateRange, setDateRange] = useState<MatriculaDateRange>(DEFAULT_FILTERS.rango ?? "month")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [program, setProgram] = useState<string>(DEFAULT_FILTERS.programaId ?? "all")
  const [studentType, setStudentType] = useState<string>(DEFAULT_FILTERS.tipoAlumno ?? "all")
  const [perPage, setPerPage] = useState<number>(DEFAULT_FILTERS.perPage ?? 50)
  const [appliedFilters, setAppliedFilters] = useState<MatriculaReportFilters>(DEFAULT_FILTERS)
  const [reportData, setReportData] = useState<MatriculaReportResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportFormat, setExportFormat] = useState<MatriculaExportFormat>("pdf")
  const [exportDetail, setExportDetail] = useState<MatriculaExportDetail>("complete")
  const [includeCharts, setIncludeCharts] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [useStudentsEndpoint, setUseStudentsEndpoint] = useState(false)
  const [allStudentsLoading, setAllStudentsLoading] = useState(false)

  const loadReport = useCallback(async (filters: MatriculaReportFilters) => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchMatriculaReport(filters)
      setReportData(data)

      const periodo = data.periodoActual?.rango
      if (filters.rango === "custom") {
        setStartDate(filters.fechaInicio ?? "")
        setEndDate(filters.fechaFin ?? "")
      } else {
        setStartDate(periodo?.fechaInicio ?? "")
        setEndDate(periodo?.fechaFin ?? "")
      }
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      toast({
        title: "No se pudieron obtener los reportes",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const loadAllStudents = useCallback(async (filters: MatriculaReportFilters) => {
    try {
      setAllStudentsLoading(true)
      setError(null)
      const response = await fetchEstudiantesMatriculados({
        fechaInicio: filters.fechaInicio,
        fechaFin: filters.fechaFin,
        programaId: filters.programaId === "all" ? undefined : filters.programaId,
        tipoAlumno: filters.tipoAlumno === "all" ? undefined : filters.tipoAlumno,
        page: filters.page,
        perPage: filters.perPage,
      })
      
      const estudiantesData = response.estudiantes ?? response.data ?? []
      
      // Update report data structure to match the existing format
      if (reportData) {
        setReportData({
          ...reportData,
          listado: {
            alumnos: estudiantesData.map((est) => ({
              id: est.id,
              nombre: est.nombre,
              fechaMatricula: est.fechaMatricula,
              tipo: est.tipo ?? est.tipoAlumno,
              programa: est.programa,
              estado: est.estado,
            })),
            paginacion: response.paginacion,
          },
        })
      }
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      toast({
        title: "No se pudieron obtener los estudiantes matriculados",
        description: message,
        variant: "destructive",
      })
    } finally {
      setAllStudentsLoading(false)
    }
  }, [toast, reportData])

  useEffect(() => {
    void loadReport(appliedFilters)
    if (useStudentsEndpoint) {
      void loadAllStudents(appliedFilters)
    }
  }, [appliedFilters, loadReport, loadAllStudents, useStudentsEndpoint])

  useEffect(() => {
    if (appliedFilters.rango) {
      setDateRange(appliedFilters.rango)
    }
    if (appliedFilters.programaId) {
      setProgram(appliedFilters.programaId)
    }
    if (appliedFilters.tipoAlumno) {
      setStudentType(appliedFilters.tipoAlumno)
    }
    if (appliedFilters.rango === "custom") {
      setStartDate(appliedFilters.fechaInicio ?? "")
      setEndDate(appliedFilters.fechaFin ?? "")
    }
  }, [appliedFilters])

  useEffect(() => {
    const serverPerPage = reportData?.listado?.paginacion?.porPagina
    if (typeof serverPerPage === "number" && serverPerPage > 0) {
      setPerPage(serverPerPage)
    }
  }, [reportData?.listado?.paginacion?.porPagina])

  const availableRanges = reportData?.filtros?.rangosDisponibles ?? ["month", "quarter", "semester", "year", "custom"]
  const programOptions = reportData?.filtros?.programas ?? []
  const studentTypeOptions = useMemo(() => {
    const tipos = reportData?.filtros?.tiposAlumno ?? []
    const unique = Array.from(new Set(tipos))
    return ["all", ...unique]
  }, [reportData?.filtros?.tiposAlumno])

  const currentTotals = reportData?.periodoActual?.totales
  const totalStudents = currentTotals?.matriculados ?? 0
  const newStudents = currentTotals?.alumnosNuevos ?? 0
  const recurringStudents = currentTotals?.alumnosRecurrentes ?? 0

  const comparativa = reportData?.comparativa
  const previousDescription = reportData?.periodoAnterior?.rangoComparado?.descripcion
  const currentPeriodDescription = reportData?.periodoActual?.rango?.descripcion

  const pagination = reportData?.listado?.paginacion
  const students = reportData?.listado?.alumnos ?? []
  const currentPage = pagination?.pagina ?? appliedFilters.page ?? 1
  const totalPages = pagination?.totalPaginas ?? 1
  const pageSize = (pagination?.porPagina ?? appliedFilters.perPage ?? students.length) || 1
  const totalRecords = pagination?.total ?? students.length
  const firstRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const lastRecord = totalRecords === 0 ? 0 : Math.min(firstRecord + pageSize - 1, totalRecords)

  const typeDistributionWithPercent = useMemo(() => {
    const distribution = reportData?.periodoActual?.distribucionTipo ?? []
    const total = distribution.reduce((sum, item) => sum + (item.total ?? 0), 0)
    return distribution.map((item, index) => ({
      ...item,
      key: `${item.tipo ?? "tipo"}-${index}`,
      porcentaje: total > 0 ? (item.total ?? 0) / total * 100 : 0,
    }))
  }, [reportData?.periodoActual?.distribucionTipo])

  const programDistributionWithPercent = useMemo(() => {
    const distribution = reportData?.periodoActual?.distribucionProgramas ?? []
    const total = distribution.reduce((sum, item) => sum + (item.total ?? 0), 0)
    return distribution.map((item, index) => ({
      ...item,
      key: `${item.programa ?? "programa"}-${index}`,
      porcentaje: total > 0 ? (item.total ?? 0) / total * 100 : 0,
    }))
  }, [reportData?.periodoActual?.distribucionProgramas])

  const monthlyEvolution = reportData?.periodoActual?.evolucionMensual ?? []
  const tendencias = reportData?.tendencias

  const isInitialLoading = loading && !reportData

  const handleApplyFilters = () => {
    if (dateRange === "custom") {
      if (!startDate || !endDate) {
        toast({
          title: "Fechas incompletas",
          description: "Debe seleccionar fecha de inicio y fin para el rango personalizado.",
          variant: "destructive",
        })
        return
      }
      if (new Date(startDate) > new Date(endDate)) {
        toast({
          title: "Rango inválido",
          description: "La fecha de inicio no puede ser posterior a la fecha fin.",
          variant: "destructive",
        })
        return
      }
    }

    const nextFilters: MatriculaReportFilters = {
      rango: dateRange,
      programaId: program,
      tipoAlumno: studentType,
      page: 1,
      perPage,
    }

    if (dateRange === "custom") {
      nextFilters.fechaInicio = startDate
      nextFilters.fechaFin = endDate
    }

    setAppliedFilters(nextFilters)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (pagination?.totalPaginas && newPage > pagination.totalPaginas)) {
      return
    }

    setAppliedFilters((prev) => ({
      ...prev,
      page: newPage,
    }))
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      
      if (useStudentsEndpoint) {
        // Use new students endpoint for export
        await exportarEstudiantesMatriculados({
          formato: exportFormat === "pdf" ? "pdf" : exportFormat === "excel" ? "excel" : "csv",
          fechaInicio: appliedFilters.fechaInicio,
          fechaFin: appliedFilters.fechaFin,
          programaId: appliedFilters.programaId === "all" ? undefined : appliedFilters.programaId,
          tipoAlumno: appliedFilters.tipoAlumno === "all" ? undefined : appliedFilters.tipoAlumno,
          incluirTodos: true,
        })
      } else {
        // Use existing reports endpoint
        await exportMatriculaReport({
          formato: exportFormat,
          detalle: exportDetail,
          incluirGraficas: includeCharts,
          rango: appliedFilters.rango,
          fechaInicio: appliedFilters.fechaInicio,
          fechaFin: appliedFilters.fechaFin,
          programaId: appliedFilters.programaId,
          tipoAlumno: appliedFilters.tipoAlumno,
          page: appliedFilters.page,
          perPage: appliedFilters.perPage,
        })
      }

      toast({
        title: "Exportación iniciada",
        description: `Se generó el archivo en formato ${exportFormat.toUpperCase()}.`,
      })
      setShowExportDialog(false)
    } catch (err) {
      const message = getErrorMessage(err)
      toast({
        title: "No se pudo exportar",
        description: message,
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reportes de Matrícula y Alumnos Nuevos</h1>
          {currentPeriodDescription ? (
            <p className="text-sm text-muted-foreground">Período analizado: {currentPeriodDescription}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {loading && reportData ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Actualizando datos…
            </div>
          ) : null}
          <Button variant="outline" size="sm">
            <Printer className="mr-1 h-4 w-4" />
            Imprimir
          </Button>
          <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-1 h-4 w-4" />
                Exportar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Exportar reporte</DialogTitle>
                <DialogDescription>
                  Seleccione el formato y el nivel de detalle que desea incluir en el archivo.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="export-format" className="text-right">
                    Formato
                  </Label>
                  <Select value={exportFormat} onValueChange={(value: MatriculaExportFormat) => setExportFormat(value)}>
                    <SelectTrigger id="export-format" className="col-span-3">
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
                  <Label htmlFor="export-detail" className="text-right">
                    Nivel de detalle
                  </Label>
                  <Select value={exportDetail} onValueChange={(value: MatriculaExportDetail) => setExportDetail(value)}>
                    <SelectTrigger id="export-detail" className="col-span-3">
                      <SelectValue placeholder="Seleccionar detalle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="complete">Reporte completo</SelectItem>
                      <SelectItem value="summary">Solo resumen</SelectItem>
                      <SelectItem value="data">Solo datos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="include-charts" className="text-right">
                    Incluir gráficas
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Checkbox
                      id="include-charts"
                      checked={includeCharts}
                      onCheckedChange={(value) => setIncludeCharts(Boolean(value))}
                    />
                    <span className="text-sm text-muted-foreground">Agregar gráficas en el archivo (si aplica)</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowExportDialog(false)} disabled={exporting}>
                  Cancelar
                </Button>
                <Button onClick={handleExport} disabled={exporting}>
                  {exporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : exportFormat === "pdf" ? (
                    <FilePdf className="mr-2 h-4 w-4" />
                  ) : (
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                  )}
                  {exporting ? "Exportando…" : "Exportar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No se pudo cargar el reporte</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void loadReport(appliedFilters)}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {isInitialLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : null}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="current">Período actual</TabsTrigger>
          <TabsTrigger value="comparison">Comparativa</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filtros de búsqueda</CardTitle>
              <CardDescription>Aplicar filtros actualiza toda la información del reporte.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-2">
                <Checkbox
                  id="use-students-endpoint"
                  checked={useStudentsEndpoint}
                  onCheckedChange={(value) => setUseStudentsEndpoint(Boolean(value))}
                />
                <Label htmlFor="use-students-endpoint" className="text-sm font-normal cursor-pointer">
                  Mostrar todas las matrículas (incluye datos históricos completos)
                </Label>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="date-range">Rango de fechas</Label>
                  <Select
                    value={dateRange}
                    onValueChange={(value: MatriculaDateRange) => setDateRange(value)}
                    disabled={loading && !reportData}
                  >
                    <SelectTrigger id="date-range">
                      <SelectValue placeholder="Seleccionar rango" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRanges.map((range) => (
                        <SelectItem key={range} value={range}>
                          {rangeLabels[range] ?? range}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {dateRange === "custom" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Fecha inicio</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">Fecha fin</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                      />
                    </div>
                  </>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="program">Programa/Carrera</Label>
                  <Select value={program} onValueChange={setProgram}>
                    <SelectTrigger id="program">
                      <SelectValue placeholder="Todos los programas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los programas</SelectItem>
                      {programOptions.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-type">Tipo de alumno</Label>
                  <Select value={studentType} onValueChange={setStudentType}>
                    <SelectTrigger id="student-type">
                      <SelectValue placeholder="Todos los tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      {studentTypeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option === "all" ? "Todos" : option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="per-page">Registros por página</Label>
                  <Select value={String(perPage)} onValueChange={(value) => setPerPage(Number(value))}>
                    <SelectTrigger id="per-page">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[25, 50, 100].map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button onClick={handleApplyFilters} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Filter className="mr-2 h-4 w-4" />}
                    {loading ? "Aplicando…" : "Aplicar filtros"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total matriculados</p>
                    <h3 className="mt-1 text-2xl font-bold">{formatNumber(totalStudents)}</h3>
                    {currentPeriodDescription ? (
                      <p className="mt-1 text-xs text-muted-foreground">{currentPeriodDescription}</p>
                    ) : null}
                  </div>
                  <FileText className="h-10 w-10 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Alumnos nuevos</p>
                    <h3 className="mt-1 text-2xl font-bold">{formatNumber(newStudents)}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {totalStudents > 0
                        ? `${percentFormatter.format((newStudents / totalStudents) * 100)}% del total`
                        : "—"}
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
                    <p className="text-sm text-muted-foreground">Alumnos recurrentes</p>
                    <h3 className="mt-1 text-2xl font-bold">{formatNumber(recurringStudents)}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {totalStudents > 0
                        ? `${percentFormatter.format((recurringStudents / totalStudents) * 100)}% del total`
                        : "—"}
                    </p>
                  </div>
                  <FileText className="h-10 w-10 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Listado de alumnos matriculados</CardTitle>
              <CardDescription>
                {useStudentsEndpoint && allStudentsLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Cargando estudiantes matriculados...
                  </span>
                ) : totalRecords > 0 ? (
                  `Mostrando ${formatNumber(firstRecord)} - ${formatNumber(lastRecord)} de ${formatNumber(totalRecords)} alumnos`
                ) : (
                  "No se encontraron alumnos con los filtros aplicados"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Fecha de matrícula</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Programa</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.length ? (
                      students.map((student) => (
                        <TableRow key={`${student.id}-${student.fechaMatricula}`}>
                          <TableCell>{student.id ?? "—"}</TableCell>
                          <TableCell>{student.nombre ?? "—"}</TableCell>
                          <TableCell>{formatDate(student.fechaMatricula)}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                student.tipo === "Nuevo"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : student.tipo === "Recurrente"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {student.tipo ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell>{student.programa ?? "—"}</TableCell>
                          <TableCell>{student.estado ?? "—"}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                          No hay alumnos registrados para los criterios seleccionados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-muted-foreground">
                  Página {formatNumber(currentPage)} de {formatNumber(totalPages)}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || loading || allStudentsLoading}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages || loading || allStudentsLoading}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparativa entre períodos</CardTitle>
              <CardDescription>
                {previousDescription
                  ? `Comparando con ${previousDescription}`
                  : "Comparación con el período anterior inmediato"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Total matriculados</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <h3 className="text-2xl font-bold">{formatNumber(comparativa?.totales?.actual)}</h3>
                      <span className="text-sm text-muted-foreground">
                        vs {formatNumber(comparativa?.totales?.anterior)}
                      </span>
                    </div>
                    <p
                      className={`mt-1 text-xs font-medium ${
                        (comparativa?.totales?.variacion ?? 0) >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {formatPercent(comparativa?.totales?.variacion)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Alumnos nuevos</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <h3 className="text-2xl font-bold">{formatNumber(comparativa?.nuevos?.actual)}</h3>
                      <span className="text-sm text-muted-foreground">
                        vs {formatNumber(comparativa?.nuevos?.anterior)}
                      </span>
                    </div>
                    <p
                      className={`mt-1 text-xs font-medium ${
                        (comparativa?.nuevos?.variacion ?? 0) >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {formatPercent(comparativa?.nuevos?.variacion)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Alumnos recurrentes</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <h3 className="text-2xl font-bold">{formatNumber(comparativa?.recurrentes?.actual)}</h3>
                      <span className="text-sm text-muted-foreground">
                        vs {formatNumber(comparativa?.recurrentes?.anterior)}
                      </span>
                    </div>
                    <p
                      className={`mt-1 text-xs font-medium ${
                        (comparativa?.recurrentes?.variacion ?? 0) >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {formatPercent(comparativa?.recurrentes?.variacion)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Métrica</TableHead>
                      <TableHead>Período actual</TableHead>
                      <TableHead>Período anterior</TableHead>
                      <TableHead>Variación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {["totales", "nuevos", "recurrentes"].map((key) => {
                      const detail = comparativa?.[key as keyof typeof comparativa]
                      const label =
                        key === "totales"
                          ? "Total matriculados"
                          : key === "nuevos"
                            ? "Alumnos nuevos"
                            : "Alumnos recurrentes"

                      return (
                        <TableRow key={key}>
                          <TableCell>{label}</TableCell>
                          <TableCell>{formatNumber(detail?.actual)}</TableCell>
                          <TableCell>{formatNumber(detail?.anterior)}</TableCell>
                          <TableCell>{formatPercent(detail?.variacion)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por tipo de alumno</CardTitle>
                <CardDescription>Participación relativa de nuevos y recurrentes.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Participación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {typeDistributionWithPercent.length ? (
                      typeDistributionWithPercent.map((item) => (
                        <TableRow key={item.key}>
                          <TableCell>{item.tipo ?? "—"}</TableCell>
                          <TableCell>{formatNumber(item.total)}</TableCell>
                          <TableCell>{formatPercent(item.porcentaje, { showSign: false })}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                          No hay información de distribución por tipo de alumno.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución por programa</CardTitle>
                <CardDescription>Totales y variación por carrera o programa.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Programa</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Participación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programDistributionWithPercent.length ? (
                      programDistributionWithPercent.map((item) => (
                        <TableRow key={item.key}>
                          <TableCell>{item.programa ?? "—"}</TableCell>
                          <TableCell>{formatNumber(item.total)}</TableCell>
                          <TableCell>{formatPercent(item.porcentaje, { showSign: false })}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                          No hay datos de distribución por programa para mostrar.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolución de matrícula</CardTitle>
              <CardDescription>Totales registrados en los últimos meses.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mes</TableHead>
                    <TableHead>Total de matriculados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyEvolution.length ? (
                    monthlyEvolution.map((item, index) => (
                      <TableRow key={`${item.mes ?? "mes"}-${index}`}>
                        <TableCell>{item.mes ? formatDate(`${item.mes}-01`) : "—"}</TableCell>
                        <TableCell>{formatNumber(item.total)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="py-6 text-center text-sm text-muted-foreground">
                        No hay datos de evolución mensual disponibles.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Crecimiento por programa</CardTitle>
                <CardDescription>Variación porcentual en los últimos períodos.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Programa</TableHead>
                      <TableHead>Variación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tendencias?.crecimientoPorPrograma?.length ? (
                      tendencias.crecimientoPorPrograma.map((item, index) => (
                        <TableRow key={`${item.programa ?? "crecimiento"}-${index}`}>
                          <TableCell>{item.programa ?? "—"}</TableCell>
                          <TableCell>{formatPercent(item.variacion)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="py-6 text-center text-sm text-muted-foreground">
                          No se registran variaciones por programa en este período.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Proyección de matrícula</CardTitle>
                <CardDescription>Estimaciones calculadas por el backend.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Período</TableHead>
                      <TableHead>Total proyectado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tendencias?.proyeccion?.length ? (
                      tendencias.proyeccion.map((item, index) => (
                        <TableRow key={`${item.periodo ?? "proyeccion"}-${index}`}>
                          <TableCell>{item.periodo ?? "—"}</TableCell>
                          <TableCell>{formatNumber(item.totalEsperado)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="py-6 text-center text-sm text-muted-foreground">
                          No hay información de proyección disponible.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
