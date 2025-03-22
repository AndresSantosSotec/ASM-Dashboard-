"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Download, FileText, Search, BarChart3, BookOpen, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

// Datos de ejemplo para los reportes financieros
const reportesData = {
  estudiantes: [
    {
      id: "est-001",
      nombre: "Juan Pérez",
      carnet: "2023-0042",
      programa: "Desarrollo Web Full Stack",
      saldoPendiente: 1500,
      ultimoPago: "15/02/2025",
    },
    {
      id: "est-002",
      nombre: "María López",
      carnet: "2023-0078",
      programa: "Diseño UX/UI",
      saldoPendiente: 2500,
      ultimoPago: "10/01/2025",
    },
    {
      id: "est-003",
      nombre: "Carlos Rodríguez",
      carnet: "2023-0091",
      programa: "Medicina",
      saldoPendiente: 0,
      ultimoPago: "05/03/2025",
    },
    {
      id: "est-004",
      nombre: "Ana Martínez",
      carnet: "2023-0112",
      programa: "Psicología",
      saldoPendiente: 3000,
      ultimoPago: "20/12/2024",
    },
    {
      id: "est-005",
      nombre: "Roberto Gómez",
      carnet: "2023-0125",
      programa: "Administración",
      saldoPendiente: 750,
      ultimoPago: "25/02/2025",
    },
  ],
  librosContables: [
    {
      id: "libro-001",
      nombre: "Libro Diario",
      descripcion: "Registro cronológico de transacciones",
      ultimaActualizacion: "01/03/2025",
    },
    {
      id: "libro-002",
      nombre: "Libro Mayor",
      descripcion: "Resumen de cuentas y saldos",
      ultimaActualizacion: "01/03/2025",
    },
    {
      id: "libro-003",
      nombre: "Balance General",
      descripcion: "Estado financiero de activos y pasivos",
      ultimaActualizacion: "29/02/2025",
    },
    {
      id: "libro-004",
      nombre: "Estado de Resultados",
      descripcion: "Ingresos y gastos del período",
      ultimaActualizacion: "29/02/2025",
    },
    {
      id: "libro-005",
      nombre: "Libro de Inventarios",
      descripcion: "Registro de bienes y activos",
      ultimaActualizacion: "15/02/2025",
    },
  ],
  tiposReporte: [
    { id: "rep-001", nombre: "Ingresos Mensuales", descripcion: "Reporte de ingresos por mes" },
    { id: "rep-002", nombre: "Morosidad por Programa", descripcion: "Análisis de morosidad por programa académico" },
    { id: "rep-003", nombre: "Proyección de Pagos", descripcion: "Proyección de pagos para los próximos 3 meses" },
    { id: "rep-004", nombre: "Conciliaciones Bancarias", descripcion: "Resumen de conciliaciones bancarias" },
    { id: "rep-005", nombre: "Becas y Descuentos", descripcion: "Impacto financiero de becas y descuentos" },
  ],
  transacciones: [
    {
      id: "trans-001",
      fecha: "01/03/2025",
      concepto: "Pago mensualidad",
      estudiante: "Juan Pérez",
      monto: 750,
      tipo: "ingreso",
    },
    {
      id: "trans-002",
      fecha: "02/03/2025",
      concepto: "Pago mensualidad",
      estudiante: "María López",
      monto: 750,
      tipo: "ingreso",
    },
    {
      id: "trans-003",
      fecha: "02/03/2025",
      concepto: "Pago matrícula",
      estudiante: "Pedro Díaz",
      monto: 1500,
      tipo: "ingreso",
    },
    {
      id: "trans-004",
      fecha: "03/03/2025",
      concepto: "Compra material didáctico",
      estudiante: "",
      monto: 5000,
      tipo: "egreso",
    },
    {
      id: "trans-005",
      fecha: "05/03/2025",
      concepto: "Pago mensualidad",
      estudiante: "Carlos Rodríguez",
      monto: 750,
      tipo: "ingreso",
    },
  ],
}

// Componente para generar estados de cuenta
const GeneradorEstadosCuenta = () => {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  })
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [previewStudent, setPreviewStudent] = useState<any | null>(null)

  // Función para manejar la selección de estudiantes
  const handleStudentSelection = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId))
    } else {
      setSelectedStudents([...selectedStudents, studentId])
    }
  }

  // Función para seleccionar todos los estudiantes
  const handleSelectAllStudents = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(reportesData.estudiantes.map((student) => student.id))
    } else {
      setSelectedStudents([])
    }
  }

  // Función para filtrar estudiantes
  const filteredStudents = reportesData.estudiantes.filter(
    (student) =>
      student.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.carnet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.programa.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Función para generar estados de cuenta
  const generateAccountStatements = () => {
    if (selectedStudents.length === 0) {
      alert("Por favor seleccione al menos un estudiante")
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)

    // Simulación de generación de reportes
    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsGenerating(false)
          alert(`Se han generado ${selectedStudents.length} estados de cuenta correctamente`)
          return 0
        }
        return prev + 5
      })
    }, 100)
  }

  // Función para mostrar vista previa
  const showAccountPreview = (student: any) => {
    setPreviewStudent(student)
    setShowPreview(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar estudiante..."
              className="pl-8 w-full md:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filtrar por programa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los programas</SelectItem>
              <SelectItem value="desarrollo">Desarrollo Web</SelectItem>
              <SelectItem value="diseno">Diseño UX/UI</SelectItem>
              <SelectItem value="medicina">Medicina</SelectItem>
              <SelectItem value="psicologia">Psicología</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DatePickerWithRange className="w-auto" value={dateRange} onChange={setDateRange} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generación de Estados de Cuenta</CardTitle>
          <CardDescription>Seleccione los estudiantes para generar sus estados de cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    id="select-all"
                    checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                    onCheckedChange={handleSelectAllStudents}
                  />
                </TableHead>
                <TableHead>Estudiante</TableHead>
                <TableHead>Programa</TableHead>
                <TableHead>Saldo Pendiente</TableHead>
                <TableHead>Último Pago</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Checkbox
                      id={`select-${student.id}`}
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={() => handleStudentSelection(student.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{student.nombre}</div>
                    <div className="text-xs text-muted-foreground">{student.carnet}</div>
                  </TableCell>
                  <TableCell>{student.programa}</TableCell>
                  <TableCell>
                    {student.saldoPendiente > 0 ? (
                      <span className="text-red-500">Q{student.saldoPendiente.toLocaleString()}</span>
                    ) : (
                      <span className="text-green-500">Q0.00</span>
                    )}
                  </TableCell>
                  <TableCell>{student.ultimoPago}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => showAccountPreview(student)}>
                      <FileText className="h-4 w-4 mr-1" /> Vista Previa
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {isGenerating && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Generando estados de cuenta...</span>
                <span>{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} className="h-2" />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">{selectedStudents.length} estudiantes seleccionados</div>
          <div className="flex gap-2">
            <Select defaultValue="pdf">
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generateAccountStatements} disabled={isGenerating || selectedStudents.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Generar Estados
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Diálogo de vista previa */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Vista Previa - Estado de Cuenta</DialogTitle>
            <DialogDescription>
              {previewStudent && `Estado de cuenta de ${previewStudent.nombre} (${previewStudent.carnet})`}
            </DialogDescription>
          </DialogHeader>
          {previewStudent && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold">Blue Atlas Academy</h3>
                  <p className="text-sm text-muted-foreground">Estado de Cuenta</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">Fecha de emisión: {new Date().toLocaleDateString()}</p>
                  <p className="text-sm">
                    Período: {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Información del Estudiante</h4>
                  <p className="text-sm">Nombre: {previewStudent.nombre}</p>
                  <p className="text-sm">Carnet: {previewStudent.carnet}</p>
                  <p className="text-sm">Programa: {previewStudent.programa}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Resumen Financiero</h4>
                  <p className="text-sm">
                    Saldo Pendiente:{" "}
                    <span
                      className={
                        previewStudent.saldoPendiente > 0 ? "text-red-500 font-medium" : "text-green-500 font-medium"
                      }
                    >
                      Q{previewStudent.saldoPendiente.toLocaleString()}
                    </span>
                  </p>
                  <p className="text-sm">Último Pago: {previewStudent.ultimoPago}</p>
                  <p className="text-sm">
                    Estado: {previewStudent.saldoPendiente > 0 ? "Con saldo pendiente" : "Al día"}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Detalle de Pagos</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>05/01/2025</TableCell>
                      <TableCell>Mensualidad Enero</TableCell>
                      <TableCell>Q750.00</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Pagado</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>05/02/2025</TableCell>
                      <TableCell>Mensualidad Febrero</TableCell>
                      <TableCell>Q750.00</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Pagado</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>05/03/2025</TableCell>
                      <TableCell>Mensualidad Marzo</TableCell>
                      <TableCell>Q750.00</TableCell>
                      <TableCell>
                        {previewStudent.saldoPendiente > 0 ? (
                          <Badge variant="outline">Pendiente</Badge>
                        ) : (
                          <Badge className="bg-green-500">Pagado</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>05/04/2025</TableCell>
                      <TableCell>Mensualidad Abril</TableCell>
                      <TableCell>Q750.00</TableCell>
                      <TableCell>
                        <Badge variant="outline">Pendiente</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Historial de Transacciones</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead>Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>03/01/2025</TableCell>
                      <TableCell>Pago mensualidad Enero</TableCell>
                      <TableCell>BI-123456</TableCell>
                      <TableCell>Q750.00</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>04/02/2025</TableCell>
                      <TableCell>Pago mensualidad Febrero</TableCell>
                      <TableCell>BI-234567</TableCell>
                      <TableCell>Q750.00</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Información importante</AlertTitle>
                <AlertDescription>
                  Este documento es informativo. Para realizar pagos, utilice los canales oficiales de la institución.
                </AlertDescription>
              </Alert>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Cerrar
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" /> Descargar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Componente para generar libros contables
const GeneradorLibrosContables = () => {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)), // Primer día del mes actual
    to: new Date(),
  })
  const [selectedBooks, setSelectedBooks] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [previewBook, setPreviewBook] = useState<any | null>(null)

  // Función para manejar la selección de libros
  const handleBookSelection = (bookId: string) => {
    if (selectedBooks.includes(bookId)) {
      setSelectedBooks(selectedBooks.filter((id) => id !== bookId))
    } else {
      setSelectedBooks([...selectedBooks, bookId])
    }
  }

  // Función para seleccionar todos los libros
  const handleSelectAllBooks = (checked: boolean) => {
    if (checked) {
      setSelectedBooks(reportesData.librosContables.map((book) => book.id))
    } else {
      setSelectedBooks([])
    }
  }

  // Función para generar libros contables
  const generateAccountingBooks = () => {
    if (selectedBooks.length === 0) {
      alert("Por favor seleccione al menos un libro contable")
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)

    // Simulación de generación de libros
    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsGenerating(false)
          alert(`Se han generado ${selectedBooks.length} libros contables correctamente`)
          return 0
        }
        return prev + 5
      })
    }, 100)
  }

  // Función para mostrar vista previa
  const showBookPreview = (book: any) => {
    setPreviewBook(book)
    setShowPreview(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <Select defaultValue="all">
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Tipo de libro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los libros</SelectItem>
            <SelectItem value="diario">Libro Diario</SelectItem>
            <SelectItem value="mayor">Libro Mayor</SelectItem>
            <SelectItem value="balance">Balance General</SelectItem>
            <SelectItem value="resultados">Estado de Resultados</SelectItem>
          </SelectContent>
        </Select>
        <DatePickerWithRange className="w-auto" value={dateRange} onChange={setDateRange} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generación de Libros Contables</CardTitle>
          <CardDescription>Seleccione los libros contables que desea generar</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    id="select-all-books"
                    checked={
                      selectedBooks.length === reportesData.librosContables.length &&
                      reportesData.librosContables.length > 0
                    }
                    onCheckedChange={handleSelectAllBooks}
                  />
                </TableHead>
                <TableHead>Libro Contable</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Última Actualización</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportesData.librosContables.map((book) => (
                <TableRow key={book.id}>
                  <TableCell>
                    <Checkbox
                      id={`select-${book.id}`}
                      checked={selectedBooks.includes(book.id)}
                      onCheckedChange={() => handleBookSelection(book.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{book.nombre}</TableCell>
                  <TableCell>{book.descripcion}</TableCell>
                  <TableCell>{book.ultimaActualizacion}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => showBookPreview(book)}>
                      <FileText className="h-4 w-4 mr-1" /> Vista Previa
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {isGenerating && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Generando libros contables...</span>
                <span>{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} className="h-2" />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">{selectedBooks.length} libros seleccionados</div>
          <div className="flex gap-2">
            <Select defaultValue="pdf">
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generateAccountingBooks} disabled={isGenerating || selectedBooks.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Generar Libros
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Diálogo de vista previa */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Vista Previa - Libro Contable</DialogTitle>
            <DialogDescription>{previewBook && `${previewBook.nombre} - ${previewBook.descripcion}`}</DialogDescription>
          </DialogHeader>
          {previewBook && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold">Blue Atlas Academy</h3>
                  <p className="text-sm text-muted-foreground">{previewBook.nombre}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">Fecha de emisión: {new Date().toLocaleDateString()}</p>
                  <p className="text-sm">
                    Período: {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Separator />

              {previewBook.id === "libro-001" && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Libro Diario - Registro de Transacciones</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Referencia</TableHead>
                        <TableHead>Debe</TableHead>
                        <TableHead>Haber</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportesData.transacciones.map((trans) => (
                        <TableRow key={trans.id}>
                          <TableCell>{trans.fecha}</TableCell>
                          <TableCell>{trans.concepto}</TableCell>
                          <TableCell>{trans.estudiante || "N/A"}</TableCell>
                          <TableCell>{trans.tipo === "ingreso" ? `Q${trans.monto.toLocaleString()}` : ""}</TableCell>
                          <TableCell>{trans.tipo === "egreso" ? `Q${trans.monto.toLocaleString()}` : ""}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {previewBook.id === "libro-002" && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Libro Mayor - Resumen de Cuentas</h4>
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-medium mb-1">Cuenta: Ingresos por Mensualidades</h5>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Referencia</TableHead>
                            <TableHead>Debe</TableHead>
                            <TableHead>Haber</TableHead>
                            <TableHead>Saldo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>01/03/2025</TableCell>
                            <TableCell>Pago mensualidad</TableCell>
                            <TableCell></TableCell>
                            <TableCell>Q750.00</TableCell>
                            <TableCell>Q750.00</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>02/03/2025</TableCell>
                            <TableCell>Pago mensualidad</TableCell>
                            <TableCell></TableCell>
                            <TableCell>Q750.00</TableCell>
                            <TableCell>Q1,500.00</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>05/03/2025</TableCell>
                            <TableCell>Pago mensualidad</TableCell>
                            <TableCell></TableCell>
                            <TableCell>Q750.00</TableCell>
                            <TableCell>Q2,250.00</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium mb-1">Cuenta: Gastos Operativos</h5>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Referencia</TableHead>
                            <TableHead>Debe</TableHead>
                            <TableHead>Haber</TableHead>
                            <TableHead>Saldo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>03/03/2025</TableCell>
                            <TableCell>Compra material didáctico</TableCell>
                            <TableCell>Q5,000.00</TableCell>
                            <TableCell></TableCell>
                            <TableCell>Q5,000.00</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}

              {previewBook.id === "libro-003" && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Balance General</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium mb-1">Activos</h5>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cuenta</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>Efectivo y Equivalentes</TableCell>
                            <TableCell className="text-right">Q125,000.00</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Cuentas por Cobrar</TableCell>
                            <TableCell className="text-right">Q45,000.00</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Mobiliario y Equipo</TableCell>
                            <TableCell className="text-right">Q350,000.00</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Total Activos</TableCell>
                            <TableCell className="text-right font-medium">Q520,000.00</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium mb-1">Pasivos y Capital</h5>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cuenta</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>Cuentas por Pagar</TableCell>
                            <TableCell className="text-right">Q35,000.00</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Préstamos Bancarios</TableCell>
                            <TableCell className="text-right">Q150,000.00</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Capital Social</TableCell>
                            <TableCell className="text-right">Q300,000.00</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Utilidades Acumuladas</TableCell>
                            <TableCell className="text-right">Q35,000.00</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Total Pasivos y Capital</TableCell>
                            <TableCell className="text-right font-medium">Q520,000.00</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}

              {previewBook.id === "libro-004" && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Estado de Resultados</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Concepto</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Ingresos</TableCell>
                        <TableCell className="text-right"></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Mensualidades</TableCell>
                        <TableCell className="text-right">Q225,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Matrículas</TableCell>
                        <TableCell className="text-right">Q75,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Otros Ingresos</TableCell>
                        <TableCell className="text-right">Q15,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Total Ingresos</TableCell>
                        <TableCell className="text-right font-medium">Q315,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Gastos</TableCell>
                        <TableCell className="text-right"></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Salarios</TableCell>
                        <TableCell className="text-right">Q150,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Alquiler</TableCell>
                        <TableCell className="text-right">Q45,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Servicios</TableCell>
                        <TableCell className="text-right">Q25,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Material Didáctico</TableCell>
                        <TableCell className="text-right">Q35,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Total Gastos</TableCell>
                        <TableCell className="text-right font-medium">Q255,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Utilidad del Período</TableCell>
                        <TableCell className="text-right font-medium">Q60,000.00</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              {previewBook.id === "libro-005" && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Libro de Inventarios</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Valor Unitario</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>MOB-001</TableCell>
                        <TableCell>Escritorios</TableCell>
                        <TableCell>50</TableCell>
                        <TableCell>Q1,500.00</TableCell>
                        <TableCell className="text-right">Q75,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>MOB-002</TableCell>
                        <TableCell>Sillas</TableCell>
                        <TableCell>100</TableCell>
                        <TableCell>Q500.00</TableCell>
                        <TableCell className="text-right">Q50,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>EQ-001</TableCell>
                        <TableCell>Computadoras</TableCell>
                        <TableCell>30</TableCell>
                        <TableCell>Q5,000.00</TableCell>
                        <TableCell className="text-right">Q150,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>EQ-002</TableCell>
                        <TableCell>Proyectores</TableCell>
                        <TableCell>10</TableCell>
                        <TableCell>Q3,500.00</TableCell>
                        <TableCell className="text-right">Q35,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>MAT-001</TableCell>
                        <TableCell>Material Didáctico</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell className="text-right">Q40,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={4} className="font-medium text-right">
                          Total Inventario
                        </TableCell>
                        <TableCell className="text-right font-medium">Q350,000.00</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Información importante</AlertTitle>
                <AlertDescription>
                  Este documento es una vista previa. Los valores pueden variar en el reporte final.
                </AlertDescription>
              </Alert>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Cerrar
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" /> Descargar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function ReportesFinancieros() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reportes Financieros</h2>
        <p className="text-muted-foreground">Genere reportes financieros, estados de cuenta y libros contables</p>
      </div>

      <Tabs defaultValue="estados-cuenta" className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="estados-cuenta" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Estados de Cuenta</span>
          </TabsTrigger>
          <TabsTrigger value="libros-contables" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Libros Contables</span>
          </TabsTrigger>
          <TabsTrigger value="reportes-personalizados" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Reportes Personalizados</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="estados-cuenta">
          <GeneradorEstadosCuenta />
        </TabsContent>

        <TabsContent value="libros-contables">
          <GeneradorLibrosContables />
        </TabsContent>

        <TabsContent value="reportes-personalizados">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reportes Personalizados</CardTitle>
                <CardDescription>Genere reportes financieros personalizados según sus necesidades</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reportesData.tiposReporte.map((reporte) => (
                    <Card key={reporte.id} className="border border-muted">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{reporte.nombre}</CardTitle>
                        <CardDescription className="text-xs">{reporte.descripcion}</CardDescription>
                      </CardHeader>
                      <CardFooter className="pt-2">
                        <Button variant="outline" size="sm" className="w-full">
                          <BarChart3 className="mr-2 h-4 w-4" /> Generar Reporte
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

