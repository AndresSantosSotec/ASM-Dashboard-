"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, FileText, Printer, BarChart2, FileSpreadsheet, FileIcon as FilePdf } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

export default function MatriculadosPorMesPage() {
  const [year, setYear] = useState<string>("2025")
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>(["all"])
  const [compareWithPreviousYear, setCompareWithPreviousYear] = useState<boolean>(true)
  const [chartView, setChartView] = useState<"bar" | "line">("bar")
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportFormat, setExportFormat] = useState<string>("pdf")
  const [activeTab, setActiveTab] = useState<string>("monthly")

  // Datos de ejemplo para la tabla mensual
  const monthlyData = [
    {
      month: "Enero",
      count: 87,
      previousYear: 68,
      programs: { "Desarrollo Web": 28, "Marketing Digital": 22, "Diseño Gráfico": 15, Contabilidad: 22 },
    },
    {
      month: "Febrero",
      count: 92,
      previousYear: 75,
      programs: { "Desarrollo Web": 30, "Marketing Digital": 24, "Diseño Gráfico": 16, Contabilidad: 22 },
    },
    {
      month: "Marzo",
      count: 105,
      previousYear: 83,
      programs: { "Desarrollo Web": 34, "Marketing Digital": 28, "Diseño Gráfico": 18, Contabilidad: 25 },
    },
    {
      month: "Abril",
      count: 78,
      previousYear: 72,
      programs: { "Desarrollo Web": 25, "Marketing Digital": 20, "Diseño Gráfico": 14, Contabilidad: 19 },
    },
    {
      month: "Mayo",
      count: 65,
      previousYear: 60,
      programs: { "Desarrollo Web": 22, "Marketing Digital": 16, "Diseño Gráfico": 12, Contabilidad: 15 },
    },
    {
      month: "Junio",
      count: 110,
      previousYear: 95,
      programs: { "Desarrollo Web": 38, "Marketing Digital": 30, "Diseño Gráfico": 17, Contabilidad: 25 },
    },
    {
      month: "Julio",
      count: 125,
      previousYear: 105,
      programs: { "Desarrollo Web": 42, "Marketing Digital": 34, "Diseño Gráfico": 19, Contabilidad: 30 },
    },
    {
      month: "Agosto",
      count: 136,
      previousYear: 120,
      programs: { "Desarrollo Web": 45, "Marketing Digital": 36, "Diseño Gráfico": 22, Contabilidad: 33 },
    },
    {
      month: "Septiembre",
      count: 98,
      previousYear: 90,
      programs: { "Desarrollo Web": 32, "Marketing Digital": 26, "Diseño Gráfico": 16, Contabilidad: 24 },
    },
    {
      month: "Octubre",
      count: 85,
      previousYear: 78,
      programs: { "Desarrollo Web": 28, "Marketing Digital": 22, "Diseño Gráfico": 15, Contabilidad: 20 },
    },
    {
      month: "Noviembre",
      count: 75,
      previousYear: 65,
      programs: { "Desarrollo Web": 24, "Marketing Digital": 20, "Diseño Gráfico": 12, Contabilidad: 19 },
    },
    {
      month: "Diciembre",
      count: 68,
      previousYear: 62,
      programs: { "Desarrollo Web": 22, "Marketing Digital": 18, "Diseño Gráfico": 10, Contabilidad: 18 },
    },
  ]

  // Datos de ejemplo para tendencias históricas (últimos 5 años)
  const historicalData = [
    { year: "2021", totalEnrollments: 850 },
    { year: "2022", totalEnrollments: 920 },
    { year: "2023", totalEnrollments: 980 },
    { year: "2024", totalEnrollments: 1050 },
    { year: "2025", totalEnrollments: 1124 },
  ]

  // Programas académicos disponibles
  const programs = ["Desarrollo Web", "Marketing Digital", "Diseño Gráfico", "Contabilidad"]

  // Calcular totales
  const totalCurrentYear = monthlyData.reduce((sum, month) => sum + month.count, 0)
  const totalPreviousYear = monthlyData.reduce((sum, month) => sum + month.previousYear, 0)
  const percentChange = ((totalCurrentYear - totalPreviousYear) / totalPreviousYear) * 100

  // Función para filtrar los datos por programa
  const getFilteredData = () => {
    if (selectedPrograms.includes("all")) {
      return monthlyData
    }

    return monthlyData.map((month) => {
      let count = 0
      selectedPrograms.forEach((program) => {
        count += month.programs[program] || 0
      })

      return {
        ...month,
        count: count,
      }
    })
  }

  const filteredData = getFilteredData()

  // Función para manejar cambios en la selección de programas
  const handleProgramChange = (checked: boolean, program: string) => {
    if (program === "all") {
      setSelectedPrograms(checked ? ["all"] : [])
      return
    }

    if (checked) {
      if (selectedPrograms.includes("all")) {
        setSelectedPrograms([program])
      } else {
        setSelectedPrograms([...selectedPrograms, program])
      }
    } else {
      setSelectedPrograms(selectedPrograms.filter((p) => p !== program))
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reporte de Matriculados por Mes</h1>
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
                  <Label htmlFor="includeComparison" className="text-right">
                    Incluir Comparación
                  </Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Checkbox id="includeComparison" defaultChecked />
                    <Label htmlFor="includeComparison">Incluir comparación con año anterior</Label>
                  </div>
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
          <TabsTrigger value="monthly">Vista Mensual</TabsTrigger>
          <TabsTrigger value="comparison">Comparativa Anual</TabsTrigger>
          <TabsTrigger value="trends">Tendencias Históricas</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros de Búsqueda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <Label>Programas</Label>
                  <div className="flex flex-col space-y-2 border p-3 rounded-md max-h-[150px] overflow-y-auto">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="program-all"
                        checked={selectedPrograms.includes("all")}
                        onCheckedChange={(checked: boolean) => handleProgramChange(checked, "all")}
                      />
                      <Label htmlFor="program-all" className="font-medium">
                        Todos los programas
                      </Label>
                    </div>
                    {programs.map((program) => (
                      <div key={program} className="flex items-center space-x-2">
                        <Checkbox
                          id={`program-${program}`}
                          checked={selectedPrograms.includes(program)}
                          onCheckedChange={(checked: boolean) => handleProgramChange(checked, program)}
                        />
                        <Label htmlFor={`program-${program}`}>{program}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="compareYear"
                      checked={compareWithPreviousYear}
                      onCheckedChange={(checked: boolean) => setCompareWithPreviousYear(checked)}
                    />
                    <Label htmlFor="compareYear">Comparar con año anterior</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Label htmlFor="chartView" className="min-w-[100px]">
                      Tipo de Gráfica:
                    </Label>
                    <Select value={chartView} onValueChange={(value: any) => setChartView(value)}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Tipo de gráfica" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bar">Barras</SelectItem>
                        <SelectItem value="line">Línea</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <p className="text-sm font-medium text-gray-500">Total Matriculados</p>
                    <h3 className="text-2xl font-bold mt-1">{totalCurrentYear}</h3>
                    <p className="text-xs text-gray-500 mt-1">Año {year}</p>
                  </div>
                  <FileText className="h-10 w-10 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            {compareWithPreviousYear && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Año Anterior</p>
                      <h3 className="text-2xl font-bold mt-1">{totalPreviousYear}</h3>
                      <p className="text-xs text-gray-500 mt-1">Año {Number.parseInt(year) - 1}</p>
                    </div>
                    <FileText className="h-10 w-10 text-gray-500" />
                  </div>
                </CardContent>
              </Card>
            )}

            {compareWithPreviousYear && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Variación</p>
                      <div className="flex items-center mt-1">
                        <h3 className="text-2xl font-bold">{percentChange.toFixed(1)}%</h3>
                        <span className={`ml-2 ${percentChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {percentChange >= 0 ? "↑" : "↓"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Respecto al año anterior</p>
                    </div>
                    <BarChart2 className="h-10 w-10 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Gráfica */}
          <Card>
            <CardHeader>
              <CardTitle>Matrículas por Mes</CardTitle>
              <CardDescription>
                {selectedPrograms.includes("all")
                  ? "Mostrando todos los programas"
                  : `Mostrando: ${selectedPrograms.join(", ")}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center bg-gray-50 rounded-md">
                <p className="text-gray-500">
                  {chartView === "bar"
                    ? "Gráfica de barras de matrículas mensuales"
                    : "Gráfica de línea de matrículas mensuales"}
                </p>
                {/* Aquí iría el componente de gráfica real */}
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Resultados */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle Mensual de Matrículas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mes</TableHead>
                    <TableHead className="text-right">Matrículas {year}</TableHead>
                    {compareWithPreviousYear && (
                      <TableHead className="text-right">Matrículas {Number.parseInt(year) - 1}</TableHead>
                    )}
                    {compareWithPreviousYear && <TableHead className="text-right">Variación</TableHead>}
                    {selectedPrograms.includes("all") &&
                      programs.map((program) => (
                        <TableHead key={program} className="text-right">
                          {program}
                        </TableHead>
                      ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((month) => (
                    <TableRow key={month.month}>
                      <TableCell>{month.month}</TableCell>
                      <TableCell className="text-right">{month.count}</TableCell>
                      {compareWithPreviousYear && <TableCell className="text-right">{month.previousYear}</TableCell>}
                      {compareWithPreviousYear && (
                        <TableCell className="text-right">
                          <span
                            className={
                              month.count > month.previousYear
                                ? "text-green-600"
                                : month.count < month.previousYear
                                  ? "text-red-600"
                                  : ""
                            }
                          >
                            {(((month.count - month.previousYear) / month.previousYear) * 100).toFixed(1)}%
                          </span>
                        </TableCell>
                      )}
                      {selectedPrograms.includes("all") &&
                        programs.map((program) => (
                          <TableCell key={program} className="text-right">
                            {month.programs[program]}
                          </TableCell>
                        ))}
                    </TableRow>
                  ))}
                  <TableRow className="font-medium">
                    <TableCell>TOTAL</TableCell>
                    <TableCell className="text-right">{totalCurrentYear}</TableCell>
                    {compareWithPreviousYear && <TableCell className="text-right">{totalPreviousYear}</TableCell>}
                    {compareWithPreviousYear && (
                      <TableCell className="text-right">
                        <span className={percentChange >= 0 ? "text-green-600" : "text-red-600"}>
                          {percentChange.toFixed(1)}%
                        </span>
                      </TableCell>
                    )}
                    {selectedPrograms.includes("all") &&
                      programs.map((program) => (
                        <TableCell key={program} className="text-right">
                          {monthlyData.reduce((sum, month) => sum + month.programs[program], 0)}
                        </TableCell>
                      ))}
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparativa Anual</CardTitle>
              <CardDescription>
                Comparación entre {year} y {Number.parseInt(year) - 1}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center bg-gray-50 rounded-md mb-6">
                <p className="text-gray-500">Gráfica comparativa de matrículas por mes entre años</p>
                {/* Aquí iría el componente de gráfica real */}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Estadísticas Comparativas</h3>
                  <dl className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded-md flex justify-between">
                      <dt className="font-medium">Total {year}:</dt>
                      <dd className="font-bold">{totalCurrentYear} matriculados</dd>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md flex justify-between">
                      <dt className="font-medium">Total {Number.parseInt(year) - 1}:</dt>
                      <dd className="font-bold">{totalPreviousYear} matriculados</dd>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md flex justify-between">
                      <dt className="font-medium">Diferencia absoluta:</dt>
                      <dd
                        className={`font-bold ${totalCurrentYear > totalPreviousYear ? "text-green-600" : totalCurrentYear < totalPreviousYear ? "text-red-600" : ""}`}
                      >
                        {totalCurrentYear - totalPreviousYear} matriculados
                      </dd>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md flex justify-between">
                      <dt className="font-medium">Diferencia porcentual:</dt>
                      <dd className={`font-bold ${percentChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {percentChange.toFixed(1)}%
                      </dd>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md flex justify-between">
                      <dt className="font-medium">Mes con mayor matrícula {year}:</dt>
                      <dd className="font-bold">
                        {
                          monthlyData.reduce((max, month) => (month.count > max.count ? month : max), monthlyData[0])
                            .month
                        }
                      </dd>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md flex justify-between">
                      <dt className="font-medium">Mes con mayor crecimiento:</dt>
                      <dd className="font-bold">
                        {
                          monthlyData.reduce(
                            (max, month) => {
                              const growth = (month.count - month.previousYear) / month.previousYear
                              return growth > max.growth ? { month: month.month, growth } : max
                            },
                            { month: "", growth: Number.NEGATIVE_INFINITY },
                          ).month
                        }
                      </dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-4">Distribución por Programa</h3>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-md">
                    <p className="text-gray-500">Gráfica de distribución por programa</p>
                    {/* Aquí iría el componente de gráfica real */}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {programs.map((program) => {
                      const totalProgram = monthlyData.reduce((sum, month) => sum + month.programs[program], 0)
                      return (
                        <div key={program} className="bg-gray-50 p-2 rounded-md">
                          <p className="text-sm">{program}</p>
                          <p className="font-medium">
                            {totalProgram} ({((totalProgram / totalCurrentYear) * 100).toFixed(1)}%)
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendencias Históricas</CardTitle>
              <CardDescription>Evolución de matrículas en los últimos 5 años</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md mb-6">
                <p className="text-gray-500">Gráfica de tendencias de matrícula (5 años)</p>
                {/* Aquí iría el componente de gráfica real */}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Año</TableHead>
                    <TableHead className="text-right">Total Matriculados</TableHead>
                    <TableHead className="text-right">Variación vs. Año Anterior</TableHead>
                    <TableHead className="text-right">Crecimiento Acumulado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicalData.map((data, index) => (
                    <TableRow key={data.year}>
                      <TableCell>{data.year}</TableCell>
                      <TableCell className="text-right">{data.totalEnrollments}</TableCell>
                      <TableCell className="text-right">
                        {index > 0 ? (
                          <span
                            className={
                              data.totalEnrollments > historicalData[index - 1].totalEnrollments
                                ? "text-green-600"
                                : data.totalEnrollments < historicalData[index - 1].totalEnrollments
                                  ? "text-red-600"
                                  : ""
                            }
                          >
                            {(
                              ((data.totalEnrollments - historicalData[index - 1].totalEnrollments) /
                                historicalData[index - 1].totalEnrollments) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {index > 0 ? (
                          <span
                            className={
                              data.totalEnrollments > historicalData[0].totalEnrollments
                                ? "text-green-600"
                                : data.totalEnrollments < historicalData[0].totalEnrollments
                                  ? "text-red-600"
                                  : ""
                            }
                          >
                            {(
                              ((data.totalEnrollments - historicalData[0].totalEnrollments) /
                                historicalData[0].totalEnrollments) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Proyección para {Number.parseInt(year) + 1}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center p-4">
                      <p className="text-3xl font-bold text-blue-600">{Math.round(totalCurrentYear * 1.07)}</p>
                      <p className="text-sm text-gray-500 mt-1">Estimado basado en crecimiento promedio de 7% anual</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Análisis de Temporalidad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Los meses con mayor actividad de matrícula históricamente son:</p>
                    <ol className="mt-2 space-y-1 list-decimal list-inside">
                      <li className="text-sm font-medium">
                        Agosto <span className="text-gray-500">(136 promedio)</span>
                      </li>
                      <li className="text-sm font-medium">
                        Julio <span className="text-gray-500">(125 promedio)</span>
                      </li>
                      <li className="text-sm font-medium">
                        Junio <span className="text-gray-500">(110 promedio)</span>
                      </li>
                    </ol>
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

