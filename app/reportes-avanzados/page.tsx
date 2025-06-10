"use client"

import { dateLocale } from '@/lib/date-utils'
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { es } from "date-fns/locale"
import {
  Search,
  Download,
  CalendarIcon,
  BarChart2,
  PieChart,
  LineChart,
  AlertCircle,
  FileText,
  FileIcon as FilePdf,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  RefreshCw,
  ArrowUpDown,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  FileArchive,
  FileImage,
  MessageSquare,
  PenTool,
  Eye,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

export default function ReportesAvanzadosPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Reportes Operativos y Seguimiento" />
      <main className="flex-1 p-4 md:p-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <TabsList className="mb-0">
              <TabsTrigger value="dashboard">Dashboard de Reportes</TabsTrigger>
              <TabsTrigger value="exportacion">Filtros y Exportación</TabsTrigger>
              <TabsTrigger value="incidencias">Detalle de Incidencias</TabsTrigger>
              <TabsTrigger value="generador">Generador de Reportes</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <Select defaultValue="marzo">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Seleccionar mes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enero">Enero 2023</SelectItem>
                  <SelectItem value="febrero">Febrero 2023</SelectItem>
                  <SelectItem value="marzo">Marzo 2023</SelectItem>
                  <SelectItem value="abril">Abril 2023</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="sr-only">Calendario</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar mode="single" locale={es} showOutsideDays={false} className="rounded-md border" />
                </PopoverContent>
              </Popover>
              <Button variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </Button>
            </div>
          </div>

          {/* Dashboard de Reportes */}
          <TabsContent value="dashboard">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total de Inscripciones</CardTitle>
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">45</div>
                  <p className="text-xs text-muted-foreground">+12% respecto al mes anterior</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Inscripciones Completadas</CardTitle>
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">18</div>
                  <p className="text-xs text-muted-foreground">40% del total</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
                  <LineChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">7.2 días</div>
                  <p className="text-xs text-muted-foreground">-1.5 días respecto al mes anterior</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Incidencias</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">26% del total de inscripciones</p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Inscripciones por Programa</CardTitle>
                  <CardDescription>Distribución de inscripciones por programa académico</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="w-full max-w-md">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                              <span>MBA Ejecutivo</span>
                            </div>
                            <span>18 (40%)</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div className="h-2 rounded-full bg-blue-500" style={{ width: "40%" }}></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded-full bg-green-500"></div>
                              <span>Maestría en Marketing Digital</span>
                            </div>
                            <span>12 (27%)</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div className="h-2 rounded-full bg-green-500" style={{ width: "27%" }}></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded-full bg-amber-500"></div>
                              <span>Diplomado en Finanzas</span>
                            </div>
                            <span>8 (18%)</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div className="h-2 rounded-full bg-amber-500" style={{ width: "18%" }}></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded-full bg-red-500"></div>
                              <span>Otros Programas</span>
                            </div>
                            <span>7 (15%)</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div className="h-2 rounded-full bg-red-500" style={{ width: "15%" }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm">
                    Ver Detalles
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="h-4 w-4" />
                    Exportar
                  </Button>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Estado de Inscripciones</CardTitle>
                  <CardDescription>Distribución por estado actual del proceso</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="w-full max-w-md">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded-full bg-green-500"></div>
                              <span>Completadas</span>
                            </div>
                            <span>18 (40%)</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div className="h-2 rounded-full bg-green-500" style={{ width: "40%" }}></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                              <span>En Proceso</span>
                            </div>
                            <span>15 (33%)</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div className="h-2 rounded-full bg-blue-500" style={{ width: "33%" }}></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded-full bg-amber-500"></div>
                              <span>Con Incidencias</span>
                            </div>
                            <span>8 (18%)</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div className="h-2 rounded-full bg-amber-500" style={{ width: "18%" }}></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded-full bg-red-500"></div>
                              <span>Rechazadas</span>
                            </div>
                            <span>4 (9%)</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div className="h-2 rounded-full bg-red-500" style={{ width: "9%" }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm">
                    Ver Detalles
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="h-4 w-4" />
                    Exportar
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Rendimiento por Asesor</CardTitle>
                      <CardDescription>Métricas de desempeño individual</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Download className="h-4 w-4" />
                      Exportar Tabla
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Asesor</TableHead>
                          <TableHead>Inscripciones Asignadas</TableHead>
                          <TableHead>Completadas</TableHead>
                          <TableHead>Tiempo Promedio</TableHead>
                          <TableHead>Incidencias</TableHead>
                          <TableHead>Eficiencia</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          {
                            name: "Roberto Gómez",
                            assigned: 15,
                            completed: 8,
                            time: "6.5 días",
                            issues: 2,
                            efficiency: "Alta",
                          },
                          {
                            name: "Ana Martínez",
                            assigned: 12,
                            completed: 5,
                            time: "7.2 días",
                            issues: 3,
                            efficiency: "Media",
                          },
                          {
                            name: "Luis Hernández",
                            assigned: 10,
                            completed: 3,
                            time: "8.1 días",
                            issues: 4,
                            efficiency: "Media",
                          },
                          {
                            name: "Carmen Díaz",
                            assigned: 8,
                            completed: 2,
                            time: "7.8 días",
                            issues: 3,
                            efficiency: "Baja",
                          },
                        ].map((asesor, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{asesor.name}</TableCell>
                            <TableCell>{asesor.assigned}</TableCell>
                            <TableCell>{asesor.completed}</TableCell>
                            <TableCell>{asesor.time}</TableCell>
                            <TableCell>{asesor.issues}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  asesor.efficiency === "Alta"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                    : asesor.efficiency === "Media"
                                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                                      : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                }
                              >
                                {asesor.efficiency}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Tiempo Promedio por Etapa</CardTitle>
                  <CardDescription>Duración promedio de cada etapa del proceso</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Captura de Datos</span>
                        <span className="text-sm font-medium">1.5 días</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-blue-500" style={{ width: "30%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Carga de Documentos</span>
                        <span className="text-sm font-medium">2.8 días</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-blue-500" style={{ width: "56%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Validación de Documentos</span>
                        <span className="text-sm font-medium">1.2 días</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-blue-500" style={{ width: "24%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Firma Digital</span>
                        <span className="text-sm font-medium">0.8 días</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-blue-500" style={{ width: "16%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Aprobaciones Finales</span>
                        <span className="text-sm font-medium">0.9 días</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-blue-500" style={{ width: "18%" }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="text-sm text-muted-foreground">Tiempo total promedio: 7.2 días</div>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="h-4 w-4" />
                    Exportar
                  </Button>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Tipos de Incidencias</CardTitle>
                  <CardDescription>Distribución por categoría de incidencia</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full bg-red-500"></div>
                          <span>Documentos Rechazados</span>
                        </div>
                        <span>5 (42%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-red-500" style={{ width: "42%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full bg-amber-500"></div>
                          <span>Datos Incompletos</span>
                        </div>
                        <span>3 (25%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-amber-500" style={{ width: "25%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                          <span>Firma Inválida</span>
                        </div>
                        <span>2 (17%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-blue-500" style={{ width: "17%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full bg-purple-500"></div>
                          <span>Pago Rechazado</span>
                        </div>
                        <span>1 (8%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-purple-500" style={{ width: "8%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full bg-gray-500"></div>
                          <span>Otros</span>
                        </div>
                        <span>1 (8%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-gray-500" style={{ width: "8%" }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="text-sm text-muted-foreground">Total de incidencias: 12</div>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="h-4 w-4" />
                    Exportar
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          {/* Filtros y Exportación */}
          <TabsContent value="exportacion">
            <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Filtros de Reporte</CardTitle>
                  <CardDescription>Personaliza los criterios para tu reporte</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="report-type">Tipo de Reporte</Label>
                      <Select defaultValue="inscripciones">
                        <SelectTrigger id="report-type">
                          <SelectValue placeholder="Seleccionar tipo de reporte" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inscripciones">Inscripciones</SelectItem>
                          <SelectItem value="documentos">Documentos</SelectItem>
                          <SelectItem value="incidencias">Incidencias</SelectItem>
                          <SelectItem value="asesores">Rendimiento de Asesores</SelectItem>
                          <SelectItem value="tiempos">Tiempos de Proceso</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Rango de Fechas</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="date-from" className="text-xs">
                            Desde
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                01/03/2023
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                locale={es}
                                showOutsideDays={false}
                                className="rounded-md border"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="date-to" className="text-xs">
                            Hasta
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                31/03/2023
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                locale={es}
                                showOutsideDays={false}
                                className="rounded-md border"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="program">Programa Académico</Label>
                      <Select defaultValue="todos">
                        <SelectTrigger id="program">
                          <SelectValue placeholder="Seleccionar programa" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos los programas</SelectItem>
                          <SelectItem value="mba">MBA Ejecutivo</SelectItem>
                          <SelectItem value="marketing">Maestría en Marketing Digital</SelectItem>
                          <SelectItem value="finanzas">Diplomado en Finanzas</SelectItem>
                          <SelectItem value="rrhh">Maestría en Recursos Humanos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Estado</Label>
                      <Select defaultValue="todos">
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos los estados</SelectItem>
                          <SelectItem value="completados">Completados</SelectItem>
                          <SelectItem value="en-proceso">En Proceso</SelectItem>
                          <SelectItem value="incidencias">Con Incidencias</SelectItem>
                          <SelectItem value="rechazados">Rechazados</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="advisor">Asesor</Label>
                      <Select defaultValue="todos">
                        <SelectTrigger id="advisor">
                          <SelectValue placeholder="Seleccionar asesor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos los asesores</SelectItem>
                          <SelectItem value="roberto">Roberto Gómez</SelectItem>
                          <SelectItem value="ana">Ana Martínez</SelectItem>
                          <SelectItem value="luis">Luis Hernández</SelectItem>
                          <SelectItem value="carmen">Carmen Díaz</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="pt-2 space-y-4">
                      <Button className="w-full">Aplicar Filtros</Button>
                      <Button variant="outline" className="w-full">
                        Restablecer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Vista Previa del Reporte</CardTitle>
                        <CardDescription>Inscripciones - Marzo 2023</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-1">
                          <RefreshCw className="h-4 w-4" />
                          Actualizar
                        </Button>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1">
                              <Download className="h-4 w-4" />
                              Exportar
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56" align="end">
                            <div className="space-y-1">
                              <Button variant="ghost" className="w-full justify-start gap-2 text-left">
                                <FileSpreadsheet className="h-4 w-4" />
                                Excel (.xlsx)
                              </Button>
                              <Button variant="ghost" className="w-full justify-start gap-2 text-left">
                                <FilePdf className="h-4 w-4" />
                                PDF (.pdf)
                              </Button>
                              <Button variant="ghost" className="w-full justify-start gap-2 text-left">
                                <FileText className="h-4 w-4" />
                                CSV (.csv)
                              </Button>
                              <Separator />
                              <Button variant="ghost" className="w-full justify-start gap-2 text-left">
                                <Printer className="h-4 w-4" />
                                Imprimir
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>
                              <div className="flex items-center gap-1 cursor-pointer">
                                Estudiante
                                <ArrowUpDown className="h-3 w-3" />
                              </div>
                            </TableHead>
                            <TableHead>Programa</TableHead>
                            <TableHead>
                              <div className="flex items-center gap-1 cursor-pointer">
                                Fecha
                                <ArrowUpDown className="h-3 w-3" />
                              </div>
                            </TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Asesor</TableHead>
                            <TableHead>Tiempo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                            <TableRow key={i}>
                              <TableCell>{i}</TableCell>
                              <TableCell className="font-medium">
                                {i % 3 === 0
                                  ? "Juan Pérez García"
                                  : i % 3 === 1
                                    ? "María González López"
                                    : "Carlos Rodríguez Méndez"}
                              </TableCell>
                              <TableCell>
                                {i % 3 === 0
                                  ? "MBA Ejecutivo"
                                  : i % 3 === 1
                                    ? "Maestría en Marketing Digital"
                                    : "Diplomado en Finanzas"}
                              </TableCell>
                              <TableCell>{`${i + 5}/03/2023`}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    i % 4 === 0
                                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                      : i % 4 === 1
                                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                        : i % 4 === 2
                                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                                          : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                  }
                                >
                                  {i % 4 === 0
                                    ? "Completada"
                                    : i % 4 === 1
                                      ? "En Proceso"
                                      : i % 4 === 2
                                        ? "Con Incidencias"
                                        : "Rechazada"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {i % 4 === 0
                                  ? "Roberto Gómez"
                                  : i % 4 === 1
                                    ? "Ana Martínez"
                                    : i % 4 === 2
                                      ? "Luis Hernández"
                                      : "Carmen Díaz"}
                              </TableCell>
                              <TableCell>
                                {i % 4 === 0
                                  ? "6 días"
                                  : i % 4 === 1
                                    ? "8 días (en curso)"
                                    : i % 4 === 2
                                      ? "10 días (en curso)"
                                      : "12 días"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="text-sm text-muted-foreground">Mostrando 10 de 45 registros</div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled>
                        Anterior
                      </Button>
                      <Button variant="outline" size="sm">
                        Siguiente
                      </Button>
                    </div>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Opciones de Exportación</CardTitle>
                    <CardDescription>Personaliza el formato y contenido de tu exportación</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="export-format">Formato de Exportación</Label>
                          <Select defaultValue="excel">
                            <SelectTrigger id="export-format">
                              <SelectValue placeholder="Seleccionar formato" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                              <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                              <SelectItem value="csv">CSV (.csv)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="export-content">Contenido a Exportar</Label>
                          <Select defaultValue="completo">
                            <SelectTrigger id="export-content">
                              <SelectValue placeholder="Seleccionar contenido" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="completo">Reporte Completo</SelectItem>
                              <SelectItem value="resumen">Resumen Ejecutivo</SelectItem>
                              <SelectItem value="datos">Solo Datos</SelectItem>
                              <SelectItem value="graficos">Datos y Gráficos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="export-name">Nombre del Archivo</Label>
                          <Input id="export-name" defaultValue="Reporte_Inscripciones_Marzo2023" />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Incluir en el Reporte</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="include-charts"
                                className="rounded border-gray-300"
                                defaultChecked
                              />
                              <Label htmlFor="include-charts" className="text-sm font-normal">
                                Gráficos
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="include-tables"
                                className="rounded border-gray-300"
                                defaultChecked
                              />
                              <Label htmlFor="include-tables" className="text-sm font-normal">
                                Tablas
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="include-summary"
                                className="rounded border-gray-300"
                                defaultChecked
                              />
                              <Label htmlFor="include-summary" className="text-sm font-normal">
                                Resumen
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="include-details"
                                className="rounded border-gray-300"
                                defaultChecked
                              />
                              <Label htmlFor="include-details" className="text-sm font-normal">
                                Detalles
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="include-header"
                                className="rounded border-gray-300"
                                defaultChecked
                              />
                              <Label htmlFor="include-header" className="text-sm font-normal">
                                Encabezado
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="include-footer"
                                className="rounded border-gray-300"
                                defaultChecked
                              />
                              <Label htmlFor="include-footer" className="text-sm font-normal">
                                Pie de Página
                              </Label>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="export-notes">Notas Adicionales</Label>
                          <Textarea id="export-notes" placeholder="Agregar notas o comentarios al reporte..." />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline">Vista Previa</Button>
                    <Button>Exportar Ahora</Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Detalle de Incidencias */}
          <TabsContent value="incidencias">
            <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Resumen de Incidencias</CardTitle>
                    <CardDescription>Marzo 2023</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-red-500" />
                          <span>Total de Incidencias</span>
                        </div>
                        <span className="font-bold">12</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span>Resueltas</span>
                        </div>
                        <span className="font-bold">5 (42%)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-amber-500" />
                          <span>En Proceso</span>
                        </div>
                        <span className="font-bold">4 (33%)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-5 w-5 text-red-500" />
                          <span>Sin Resolver</span>
                        </div>
                        <span className="font-bold">3 (25%)</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-blue-500" />
                          <span>Estudiantes Afectados</span>
                        </div>
                        <span className="font-bold">8</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-blue-500" />
                          <span>Tiempo Promedio de Resolución</span>
                        </div>
                        <span className="font-bold">2.3 días</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Filtrar Incidencias</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="incident-type">Tipo de Incidencia</Label>
                        <Select defaultValue="todos">
                          <SelectTrigger id="incident-type">
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos los tipos</SelectItem>
                            <SelectItem value="documentos">Documentos Rechazados</SelectItem>
                            <SelectItem value="datos">Datos Incompletos</SelectItem>
                            <SelectItem value="firma">Firma Inválida</SelectItem>
                            <SelectItem value="pago">Pago Rechazado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="incident-status">Estado</Label>
                        <Select defaultValue="todos">
                          <SelectTrigger id="incident-status">
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos los estados</SelectItem>
                            <SelectItem value="resuelto">Resuelto</SelectItem>
                            <SelectItem value="en-proceso">En Proceso</SelectItem>
                            <SelectItem value="sin-resolver">Sin Resolver</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="incident-priority">Prioridad</Label>
                        <Select defaultValue="todos">
                          <SelectTrigger id="incident-priority">
                            <SelectValue placeholder="Seleccionar prioridad" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todas las prioridades</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="media">Media</SelectItem>
                            <SelectItem value="baja">Baja</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="incident-search">Buscar</Label>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="incident-search"
                            type="search"
                            placeholder="Buscar por ID, estudiante o descripción..."
                            className="pl-8"
                          />
                        </div>
                      </div>

                      <Button className="w-full">Aplicar Filtros</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Lista de Incidencias</CardTitle>
                        <CardDescription>Mostrando todas las incidencias</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Download className="h-4 w-4" />
                        Exportar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[80px]">ID</TableHead>
                            <TableHead>Estudiante</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Prioridad</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[
                            {
                              id: "INC-001",
                              student: "Juan Pérez García",
                              type: "Documento Rechazado",
                              date: "15/03/2023",
                              status: "Resuelto",
                              priority: "Alta",
                              icon: FileImage,
                            },
                            {
                              id: "INC-002",
                              student: "María González López",
                              type: "Datos Incompletos",
                              date: "14/03/2023",
                              status: "En Proceso",
                              priority: "Media",
                              icon: FileText,
                            },
                            {
                              id: "INC-003",
                              student: "Carlos Rodríguez Méndez",
                              type: "Firma Inválida",
                              date: "13/03/2023",
                              status: "Sin Resolver",
                              priority: "Alta",
                              icon: FileArchive,
                            },
                            {
                              id: "INC-004",
                              student: "Laura Sánchez Torres",
                              type: "Pago Rechazado",
                              date: "12/03/2023",
                              status: "Resuelto",
                              priority: "Media",
                              icon: FilePdf,
                            },
                            {
                              id: "INC-005",
                              student: "Pedro Ramírez Flores",
                              type: "Documento Rechazado",
                              date: "11/03/2023",
                              status: "En Proceso",
                              priority: "Baja",
                              icon: FileImage,
                            },
                          ].map((incident, i) => (
                            <TableRow key={i}>
                              <TableCell>{incident.id}</TableCell>
                              <TableCell className="font-medium">{incident.student}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <incident.icon className="h-4 w-4 text-blue-500" />
                                  <span>{incident.type}</span>
                                </div>
                              </TableCell>
                              <TableCell>{incident.date}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    incident.status === "Resuelto"
                                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                      : incident.status === "En Proceso"
                                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                                        : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                  }
                                >
                                  {incident.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    incident.priority === "Alta"
                                      ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                      : incident.priority === "Media"
                                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                                        : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                  }
                                >
                                  {incident.priority}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      Ver Detalles
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-3xl">
                                    <DialogHeader>
                                      <DialogTitle className="flex items-center gap-2">
                                        <incident.icon className="h-5 w-5 text-blue-500" />
                                        Incidencia {incident.id} - {incident.type}
                                      </DialogTitle>
                                      <DialogDescription>
                                        Estudiante: {incident.student} | Fecha: {incident.date}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid md:grid-cols-2 gap-4">
                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium">Descripción</Label>
                                          <div className="rounded-lg border p-3 text-sm">
                                            {incident.type === "Documento Rechazado"
                                              ? "El documento de identidad (DPI) ha sido rechazado debido a que la imagen está borrosa y no se pueden verificar los datos correctamente."
                                              : incident.type === "Datos Incompletos"
                                                ? "Faltan datos de contacto de emergencia y referencias personales en el formulario de inscripción."
                                                : incident.type === "Firma Inválida"
                                                  ? "La firma digital no coincide con la firma registrada en el documento de identidad."
                                                  : "El pago de la inscripción ha sido rechazado por la entidad bancaria debido a fondos insuficientes."}
                                          </div>
                                        </div>

                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium">Estado Actual</Label>
                                          <div className="flex items-center gap-2">
                                            <Badge
                                              variant="outline"
                                              className={
                                                incident.status === "Resuelto"
                                                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                                  : incident.status === "En Proceso"
                                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                                                    : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                              }
                                            >
                                              {incident.status}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                              {incident.status === "Resuelto"
                                                ? "Resuelto el 17/03/2023"
                                                : incident.status === "En Proceso"
                                                  ? "En proceso desde hace 2 días"
                                                  : "Sin resolver desde hace 3 días"}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium">Asignado a</Label>
                                          <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                                              {i % 2 === 0 ? "RG" : "AM"}
                                            </div>
                                            <div>
                                              <div className="text-sm font-medium">
                                                {i % 2 === 0 ? "Roberto Gómez" : "Ana Martínez"}
                                              </div>
                                              <div className="text-xs text-muted-foreground">
                                                {i % 2 === 0 ? "Asesor Senior" : "Asesor de Documentación"}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium">Historial de Acciones</Label>
                                          <div className="rounded-lg border overflow-hidden">
                                            <div className="bg-muted p-2">
                                              <span className="text-sm font-medium">Actividad reciente</span>
                                            </div>
                                            <div className="p-3 space-y-3 max-h-[200px] overflow-auto">
                                              <div className="text-sm space-y-1">
                                                <div className="flex justify-between">
                                                  <span className="font-medium">
                                                    Notificación enviada al estudiante
                                                  </span>
                                                  <span className="text-xs text-muted-foreground">
                                                    16/03/2023 10:30
                                                  </span>
                                                </div>
                                                <p className="text-muted-foreground">
                                                  Se envió correo electrónico solicitando la corrección del documento.
                                                </p>
                                              </div>
                                              <Separator />
                                              <div className="text-sm space-y-1">
                                                <div className="flex justify-between">
                                                  <span className="font-medium">Incidencia registrada</span>
                                                  <span className="text-xs text-muted-foreground">
                                                    {incident.date} 14:45
                                                  </span>
                                                </div>
                                                <p className="text-muted-foreground">
                                                  {incident.type} detectado durante la revisión de documentos.
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium">Acciones Disponibles</Label>
                                          <div className="flex flex-col gap-2">
                                            <Button variant="outline" className="justify-start gap-2">
                                              <MessageSquare className="h-4 w-4" />
                                              Enviar Recordatorio
                                            </Button>
                                            <Button variant="outline" className="justify-start gap-2">
                                              <RefreshCw className="h-4 w-4" />
                                              Actualizar Estado
                                            </Button>
                                            <Button variant="outline" className="justify-start gap-2">
                                              <Users className="h-4 w-4" />
                                              Reasignar Incidencia
                                            </Button>
                                            <Button className="justify-start gap-2">
                                              <CheckCircle className="h-4 w-4" />
                                              Marcar como Resuelto
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="text-sm text-muted-foreground">Mostrando 5 de 12 incidencias</div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled>
                        Anterior
                      </Button>
                      <Button variant="outline" size="sm">
                        Siguiente
                      </Button>
                    </div>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Análisis de Incidencias</CardTitle>
                    <CardDescription>Tendencias y patrones identificados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium flex items-center gap-2">
                          <Info className="h-4 w-4 text-blue-500" />
                          Incidencias Recurrentes
                        </h3>
                        <div className="rounded-lg border p-3 text-sm">
                          <p className="text-muted-foreground">
                            Se ha identificado un patrón recurrente de documentos rechazados por baja calidad de imagen.
                            Recomendación: Mejorar las instrucciones para la carga de documentos y proporcionar ejemplos
                            de imágenes aceptables.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4 text-amber-500" />
                          Tiempo de Resolución
                        </h3>
                        <div className="rounded-lg border p-3 text-sm">
                          <p className="text-muted-foreground">
                            El tiempo promedio de resolución ha disminuido de 3.5 días a 2.3 días en el último mes, lo
                            que representa una mejora del 34% en la eficiencia del proceso.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm font-medium flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          Áreas de Mejora
                        </h3>
                        <div className="rounded-lg border p-3 text-sm">
                          <p className="text-muted-foreground">
                            Las incidencias relacionadas con firmas inválidas tienen el mayor tiempo de resolución. Se
                            recomienda revisar el proceso de validación de firmas y proporcionar capacitación adicional
                            a los asesores.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full gap-2">
                      <FileText className="h-4 w-4" />
                      Ver Reporte Completo de Incidencias
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Generador de Reportes */}
          <TabsContent value="generador">
            <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Generador de Reportes</CardTitle>
                  <CardDescription>Crea reportes personalizados por características del sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="report-scope">Alcance del Reporte</Label>
                      <Select defaultValue="general">
                        <SelectTrigger id="report-scope">
                          <SelectValue placeholder="Seleccionar alcance" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">Reporte General</SelectItem>
                          <SelectItem value="individual">Reporte Individual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="report-feature">Característica del Sistema</Label>
                      <Select defaultValue="inscripciones">
                        <SelectTrigger id="report-feature">
                          <SelectValue placeholder="Seleccionar característica" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inscripciones">Inscripciones</SelectItem>
                          <SelectItem value="documentos">Documentos</SelectItem>
                          <SelectItem value="validaciones">Validaciones</SelectItem>
                          <SelectItem value="firmas">Firmas Digitales</SelectItem>
                          <SelectItem value="seguimiento">Seguimiento de Procesos</SelectItem>
                          <SelectItem value="incidencias">Incidencias</SelectItem>
                          <SelectItem value="asesores">Rendimiento de Asesores</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Período de Tiempo</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="date-from-gen" className="text-xs">
                            Desde
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                01/03/2023
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                locale={es}
                                showOutsideDays={false}
                                className="rounded-md border"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="date-to-gen" className="text-xs">
                            Hasta
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                31/03/2023
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                locale={es}
                                showOutsideDays={false}
                                className="rounded-md border"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Métricas a Incluir</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="include-general"
                            className="rounded border-gray-300"
                            defaultChecked
                          />
                          <Label htmlFor="include-general" className="text-sm font-normal">
                            Datos Generales
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="include-trends"
                            className="rounded border-gray-300"
                            defaultChecked
                          />
                          <Label htmlFor="include-trends" className="text-sm font-normal">
                            Tendencias
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="include-performance"
                            className="rounded border-gray-300"
                            defaultChecked
                          />
                          <Label htmlFor="include-performance" className="text-sm font-normal">
                            Rendimiento
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="include-issues"
                            className="rounded border-gray-300"
                            defaultChecked
                          />
                          <Label htmlFor="include-issues" className="text-sm font-normal">
                            Incidencias
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="include-times"
                            className="rounded border-gray-300"
                            defaultChecked
                          />
                          <Label htmlFor="include-times" className="text-sm font-normal">
                            Tiempos
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="include-comparisons"
                            className="rounded border-gray-300"
                            defaultChecked
                          />
                          <Label htmlFor="include-comparisons" className="text-sm font-normal">
                            Comparativas
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="report-format">Formato del Reporte</Label>
                      <Select defaultValue="excel">
                        <SelectTrigger id="report-format">
                          <SelectValue placeholder="Seleccionar formato" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                          <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                          <SelectItem value="csv">CSV (.csv)</SelectItem>
                          <SelectItem value="dashboard">Dashboard Interactivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-2 space-y-4">
                      <Button className="w-full">Generar Reporte</Button>
                      <Button variant="outline" className="w-full">
                        Guardar Configuración
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Reportes Disponibles</CardTitle>
                        <CardDescription>Reportes predefinidos por característica</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" className="gap-1">
                        <RefreshCw className="h-4 w-4" />
                        Actualizar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="rounded-lg border overflow-hidden">
                        <div className="bg-muted p-3 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            <span className="font-medium">Inscripciones</span>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          >
                            General
                          </Badge>
                        </div>
                        <div className="p-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Reporte General de Inscripciones</span>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">Ver</span>
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Download className="h-4 w-4" />
                                  <span className="sr-only">Descargar</span>
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Resumen completo de todas las inscripciones, incluyendo métricas de conversión, tiempos
                              promedio y distribución por programa.
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                Actualizado: 31/03/2023
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Excel
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                PDF
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border overflow-hidden">
                        <div className="bg-muted p-3 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-green-500" />
                            <span className="font-medium">Documentos</span>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          >
                            Individual
                          </Badge>
                        </div>
                        <div className="p-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Reporte de Validación de Documentos</span>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">Ver</span>
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Download className="h-4 w-4" />
                                  <span className="sr-only">Descargar</span>
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Análisis detallado de documentos cargados, tasas de aprobación, rechazos y tiempos de
                              validación por tipo de documento.
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                Actualizado: 30/03/2023
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Excel
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Dashboard
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border overflow-hidden">
                        <div className="bg-muted p-3 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <PenTool className="h-5 w-5 text-amber-500" />
                            <span className="font-medium">Firmas Digitales</span>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          >
                            General
                          </Badge>
                        </div>
                        <div className="p-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Reporte de Firmas Digitales</span>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">Ver</span>
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Download className="h-4 w-4" />
                                  <span className="sr-only">Descargar</span>
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Estadísticas de firmas digitales, verificaciones, rechazos y tiempos de procesamiento por
                              tipo de contrato.
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                Actualizado: 29/03/2023
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                PDF
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border overflow-hidden">
                        <div className="bg-muted p-3 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <span className="font-medium">Incidencias</span>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          >
                            Individual
                          </Badge>
                        </div>
                        <div className="p-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Reporte de Incidencias por Tipo</span>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">Ver</span>
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Download className="h-4 w-4" />
                                  <span className="sr-only">Descargar</span>
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Análisis detallado de incidencias por tipo, frecuencia, tiempo de resolución y impacto en
                              el proceso.
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                Actualizado: 28/03/2023
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Excel
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Dashboard
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="text-sm text-muted-foreground">Mostrando 4 de 12 reportes disponibles</div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled>
                        Anterior
                      </Button>
                      <Button variant="outline" size="sm">
                        Siguiente
                      </Button>
                    </div>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Reportes Individuales por Característica</CardTitle>
                    <CardDescription>Métricas específicas disponibles por cada característica</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-lg border p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Users className="h-5 w-5 text-blue-500" />
                            <h3 className="font-medium">Inscripciones</h3>
                          </div>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>Tasa de conversión por etapa</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>Tiempo promedio de inscripción</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>Distribución por programa académico</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>Análisis de abandonos</span>
                            </li>
                          </ul>
                          <Button variant="outline" size="sm" className="w-full mt-3 gap-1">
                            <FileText className="h-4 w-4" />
                            Generar Reporte
                          </Button>
                        </div>

                        <div className="rounded-lg border p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <FileText className="h-5 w-5 text-green-500" />
                            <h3 className="font-medium">Documentos</h3>
                          </div>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>Tasa de aprobación por tipo</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>Motivos de rechazo más comunes</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>Tiempo de validación promedio</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>Volumen de documentos por día</span>
                            </li>
                          </ul>
                          <Button variant="outline" size="sm" className="w-full mt-3 gap-1">
                            <FileText className="h-4 w-4" />
                            Generar Reporte
                          </Button>
                        </div>

                        <div className="rounded-lg border p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <PenTool className="h-5 w-5 text-amber-500" />
                            <h3 className="font-medium">Firmas Digitales</h3>
                          </div>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>Tasa de verificación exitosa</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>Tiempo promedio de firma</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>Distribución por tipo de contrato</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>Análisis de rechazos de firma</span>
                            </li>
                          </ul>
                          <Button variant="outline" size="sm" className="w-full mt-3 gap-1">
                            <FileText className="h-4 w-4" />
                            Generar Reporte
                          </Button>
                        </div>

                        <div className="rounded-lg border p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <h3 className="font-medium">Incidencias</h3>
                          </div>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>Distribución por tipo y severidad</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>Tiempo promedio de resolución</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>Incidencias recurrentes</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>Impacto en tiempo de proceso</span>
                            </li>
                          </ul>
                          <Button variant="outline" size="sm" className="w-full mt-3 gap-1">
                            <FileText className="h-4 w-4" />
                            Generar Reporte
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full gap-2">
                      <BarChart2 className="h-4 w-4" />
                      Generar Reporte Comparativo
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

