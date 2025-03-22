"use client"

import { useState } from "react"
import {
  Search,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  FileText,
  PieChart,
  DollarSign,
  BookOpen,
  Filter,
  MoreHorizontal,
  ArrowUpDown,
  Calendar,
  Mail,
  Phone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"

// Tipos
interface Student {
  id: string
  name: string
  email: string
  phone: string
  program: string
  semester: number
  status: "active" | "inactive" | "on_leave" | "graduated"
  financialStatus: "up_to_date" | "pending" | "overdue"
  academicStatus: "good_standing" | "warning" | "probation"
  lastActivity: string
  pendingAssignments: string[]
  attendance: number
  gpa: number
  tuitionPaid: number
  tuitionTotal: number
  enrollmentDate: string
}

// Datos de ejemplo
const mockStudents: Student[] = [
  {
    id: "1",
    name: "Juan Pérez",
    email: "juan.perez@ejemplo.com",
    phone: "+52 555 123 4567",
    program: "Licenciatura en Administración de Empresas",
    semester: 3,
    status: "active",
    financialStatus: "pending",
    academicStatus: "good_standing",
    lastActivity: "2023-11-10",
    pendingAssignments: [],
    attendance: 92,
    gpa: 8.7,
    tuitionPaid: 15000,
    tuitionTotal: 25000,
    enrollmentDate: "2022-08-15",
  },
  {
    id: "2",
    name: "María González",
    email: "maria.gonzalez@ejemplo.com",
    phone: "+52 555 234 5678",
    program: "Ingeniería en Sistemas Computacionales",
    semester: 4,
    status: "active",
    financialStatus: "up_to_date",
    academicStatus: "good_standing",
    lastActivity: "2023-11-12",
    pendingAssignments: [],
    attendance: 95,
    gpa: 9.2,
    tuitionPaid: 30000,
    tuitionTotal: 30000,
    enrollmentDate: "2022-01-10",
  },
  {
    id: "3",
    name: "Carlos Rodríguez",
    email: "carlos.rodriguez@ejemplo.com",
    phone: "+52 555 345 6789",
    program: "Maestría en Educación",
    semester: 2,
    status: "on_leave",
    financialStatus: "overdue",
    academicStatus: "warning",
    lastActivity: "2023-10-05",
    pendingAssignments: ["Capstone"],
    attendance: 65,
    gpa: 7.1,
    tuitionPaid: 10000,
    tuitionTotal: 40000,
    enrollmentDate: "2023-01-15",
  },
  {
    id: "4",
    name: "Ana López",
    email: "ana.lopez@ejemplo.com",
    phone: "+52 555 456 7890",
    program: "Licenciatura en Psicología",
    semester: 5,
    status: "active",
    financialStatus: "up_to_date",
    academicStatus: "good_standing",
    lastActivity: "2023-11-11",
    pendingAssignments: [],
    attendance: 88,
    gpa: 8.9,
    tuitionPaid: 27500,
    tuitionTotal: 27500,
    enrollmentDate: "2021-08-20",
  },
  {
    id: "5",
    name: "Pedro Sánchez",
    email: "pedro.sanchez@ejemplo.com",
    phone: "+52 555 567 8901",
    program: "Ingeniería en Sistemas Computacionales",
    semester: 6,
    status: "active",
    financialStatus: "pending",
    academicStatus: "probation",
    lastActivity: "2023-11-08",
    pendingAssignments: [],
    attendance: 72,
    gpa: 6.5,
    tuitionPaid: 15000,
    tuitionTotal: 30000,
    enrollmentDate: "2021-01-15",
  },
  {
    id: "6",
    name: "Laura Martínez",
    email: "laura.martinez@ejemplo.com",
    phone: "+52 555 678 9012",
    program: "Licenciatura en Administración de Empresas",
    semester: 7,
    status: "active",
    financialStatus: "up_to_date",
    academicStatus: "good_standing",
    lastActivity: "2023-11-12",
    pendingAssignments: ["Especialidad"],
    attendance: 91,
    gpa: 9.0,
    tuitionPaid: 25000,
    tuitionTotal: 25000,
    enrollmentDate: "2020-08-10",
  },
  {
    id: "7",
    name: "Roberto Díaz",
    email: "roberto.diaz@ejemplo.com",
    phone: "+52 555 789 0123",
    program: "Doctorado en Ciencias",
    semester: 3,
    status: "inactive",
    financialStatus: "overdue",
    academicStatus: "probation",
    lastActivity: "2023-09-20",
    pendingAssignments: [],
    attendance: 45,
    gpa: 5.8,
    tuitionPaid: 5000,
    tuitionTotal: 50000,
    enrollmentDate: "2022-01-20",
  },
  {
    id: "8",
    name: "Sofía Hernández",
    email: "sofia.hernandez@ejemplo.com",
    phone: "+52 555 890 1234",
    program: "Maestría en Administración de Negocios",
    semester: 4,
    status: "active",
    financialStatus: "up_to_date",
    academicStatus: "good_standing",
    lastActivity: "2023-11-11",
    pendingAssignments: [],
    attendance: 94,
    gpa: 9.5,
    tuitionPaid: 35000,
    tuitionTotal: 35000,
    enrollmentDate: "2022-01-05",
  },
]

export default function EstatusGeneral() {
  const [students] = useState<Student[]>(mockStudents)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [financialFilter, setFinancialFilter] = useState<string>("all")
  const [academicFilter, setAcademicFilter] = useState<string>("all")
  const [programFilter, setProgramFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("todos")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  // Obtener programas únicos para el filtro
  const uniquePrograms = Array.from(new Set(students.map((s) => s.program)))

  // Filtrar estudiantes
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || student.status === statusFilter
    const matchesFinancial = financialFilter === "all" || student.financialStatus === financialFilter
    const matchesAcademic = academicFilter === "all" || student.academicStatus === academicFilter
    const matchesProgram = programFilter === "all" || student.program === programFilter

    // Filtrar por tab activo
    if (activeTab === "activos" && student.status !== "active") return false
    if (activeTab === "inactivos" && student.status !== "inactive") return false
    if (activeTab === "financiero" && student.financialStatus !== "overdue") return false
    if (activeTab === "academico" && student.academicStatus !== "probation" && student.academicStatus !== "warning")
      return false

    return matchesSearch && matchesStatus && matchesFinancial && matchesAcademic && matchesProgram
  })

  // Calcular estadísticas
  const stats = {
    total: students.length,
    active: students.filter((s) => s.status === "active").length,
    inactive: students.filter((s) => s.status === "inactive").length,
    onLeave: students.filter((s) => s.status === "on_leave").length,
    graduated: students.filter((s) => s.status === "graduated").length,
    upToDate: students.filter((s) => s.financialStatus === "up_to_date").length,
    pending: students.filter((s) => s.financialStatus === "pending").length,
    overdue: students.filter((s) => s.financialStatus === "overdue").length,
    goodStanding: students.filter((s) => s.academicStatus === "good_standing").length,
    warning: students.filter((s) => s.academicStatus === "warning").length,
    probation: students.filter((s) => s.academicStatus === "probation").length,
    pendingAssignments: students.filter((s) => s.pendingAssignments.length > 0).length,
  }

  // Descargar reporte
  const handleDownloadReport = () => {
    toast({
      title: "Reporte descargado",
      description: "El reporte ha sido descargado correctamente.",
    })
  }

  // Ver detalles del estudiante
  const handleViewDetails = (student: Student) => {
    setSelectedStudent(student)
  }

  // Cerrar detalles del estudiante
  const handleCloseDetails = () => {
    setSelectedStudent(null)
  }

  // Enviar correo al estudiante
  const handleSendEmail = (email: string) => {
    toast({
      title: "Correo enviado",
      description: `Se ha enviado un correo a ${email}`,
    })
  }

  // Llamar al estudiante
  const handleCallStudent = (phone: string) => {
    toast({
      title: "Llamada iniciada",
      description: `Llamando a ${phone}`,
    })
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Estatus General del Sistema</h1>
          <p className="text-muted-foreground">Monitoreo y gestión de estudiantes en tiempo real</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadReport}>
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
          <Button>
            <Filter className="mr-2 h-4 w-4" /> Filtros Avanzados
          </Button>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-blue-600">Estudiantes Activos</div>
                <div className="text-3xl font-bold">{stats.active}</div>
                <div className="text-sm text-gray-500">de {stats.total} totales</div>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <User className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <Progress className="h-2 mt-4" value={(stats.active / stats.total) * 100} />
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-green-600">Pagos al Día</div>
                <div className="text-3xl font-bold">{stats.upToDate}</div>
                <div className="text-sm text-gray-500">
                  {Math.round((stats.upToDate / stats.total) * 100)}% del total
                </div>
              </div>
              <div className="bg-green-100 p-2 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <Progress className="h-2 mt-4" value={(stats.upToDate / stats.total) * 100} />
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-amber-600">Buen Rendimiento</div>
                <div className="text-3xl font-bold">{stats.goodStanding}</div>
                <div className="text-sm text-gray-500">
                  {Math.round((stats.goodStanding / stats.total) * 100)}% del total
                </div>
              </div>
              <div className="bg-amber-100 p-2 rounded-full">
                <BookOpen className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <Progress className="h-2 mt-4" value={(stats.goodStanding / stats.total) * 100} />
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-red-600">Pagos Vencidos</div>
                <div className="text-3xl font-bold">{stats.overdue}</div>
                <div className="text-sm text-gray-500">
                  {Math.round((stats.overdue / stats.total) * 100)}% del total
                </div>
              </div>
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <Progress className="h-2 mt-4" value={(stats.overdue / stats.total) * 100} />
          </CardContent>
        </Card>
      </div>

      {/* Tabs y Filtros */}
      <Tabs defaultValue="todos" className="mb-6" onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <TabsList className="mb-2 md:mb-0">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="activos">Activos</TabsTrigger>
            <TabsTrigger value="inactivos">Inactivos</TabsTrigger>
            <TabsTrigger value="financiero">Alerta Financiera</TabsTrigger>
            <TabsTrigger value="academico">Alerta Académica</TabsTrigger>
          </TabsList>

          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar por nombre, email o programa..."
              className="pl-8 w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Filtros avanzados */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                  <SelectItem value="on_leave">En permiso</SelectItem>
                  <SelectItem value="graduated">Graduados</SelectItem>
                </SelectContent>
              </Select>

              <Select value={financialFilter} onValueChange={setFinancialFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado financiero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="up_to_date">Al día</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                </SelectContent>
              </Select>

              <Select value={academicFilter} onValueChange={setAcademicFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado académico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="good_standing">Buen rendimiento</SelectItem>
                  <SelectItem value="warning">Advertencia</SelectItem>
                  <SelectItem value="probation">Probación</SelectItem>
                </SelectContent>
              </Select>

              <Select value={programFilter} onValueChange={setProgramFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Programa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los programas</SelectItem>
                  {uniquePrograms.map((program) => (
                    <SelectItem key={program} value={program}>
                      {program}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Contenido de las tabs */}
        <TabsContent value="todos" className="mt-0">
          {/* Tabla de estudiantes */}
          <Card>
            <CardHeader className="pb-0">
              <div className="flex justify-between items-center">
                <CardTitle>Listado de Estudiantes</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Mostrando {filteredStudents.length} de {students.length} estudiantes
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">
                        <div className="flex items-center">
                          Estudiante
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Financiero</TableHead>
                      <TableHead>Académico</TableHead>
                      <TableHead>Última Actividad</TableHead>
                      <TableHead>Pendientes</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                          No se encontraron estudiantes con los filtros seleccionados
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student) => (
                        <TableRow
                          key={student.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleViewDetails(student)}
                        >
                          <TableCell>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.email}</div>
                            <div className="text-xs text-gray-500">Semestre {student.semester}</div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                student.status === "active"
                                  ? "default"
                                  : student.status === "on_leave"
                                    ? "secondary"
                                    : student.status === "graduated"
                                      ? "outline"
                                      : "destructive"
                              }
                              className={
                                student.status === "graduated" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""
                              }
                            >
                              {student.status === "active"
                                ? "Activo"
                                : student.status === "on_leave"
                                  ? "Permiso"
                                  : student.status === "graduated"
                                    ? "Graduado"
                                    : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {student.financialStatus === "up_to_date" ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                                  <span className="text-green-600">Al día</span>
                                </>
                              ) : student.financialStatus === "pending" ? (
                                <>
                                  <AlertTriangle className="h-4 w-4 mr-1 text-amber-600" />
                                  <span className="text-amber-600">Pendiente</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-1 text-red-600" />
                                  <span className="text-red-600">Vencido</span>
                                </>
                              )}
                            </div>
                            {student.financialStatus !== "up_to_date" && (
                              <div className="text-xs text-gray-500 mt-1">
                                ${student.tuitionPaid} / ${student.tuitionTotal}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                student.academicStatus === "good_standing"
                                  ? "default"
                                  : student.academicStatus === "warning"
                                    ? "outline"
                                    : "destructive"
                              }
                              className={
                                student.academicStatus === "good_standing"
                                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                                  : student.academicStatus === "warning"
                                    ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                    : ""
                              }
                            >
                              {student.academicStatus === "good_standing"
                                ? "Buen rendimiento"
                                : student.academicStatus === "warning"
                                  ? "Advertencia"
                                  : "Probación"}
                            </Badge>
                            <div className="text-xs text-gray-500 mt-1">
                              GPA: {student.gpa} | Asistencia: {student.attendance}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                              <span>{new Date(student.lastActivity).toLocaleDateString()}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {student.pendingAssignments.length > 0 ? (
                              <div className="space-y-1">
                                {student.pendingAssignments.map((assignment, index) => (
                                  <Badge key={index} variant="outline">
                                    {assignment}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Abrir menú</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewDetails(student)
                                  }}
                                >
                                  Ver detalles
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleSendEmail(student.email)
                                  }}
                                >
                                  Enviar correo
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleCallStudent(student.phone)
                                  }}
                                >
                                  Llamar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Editar información</DropdownMenuItem>
                                <DropdownMenuItem>Cambiar estado</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-gray-500">Página 1 de 1</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button variant="outline" size="sm">
                  <PieChart className="h-4 w-4 mr-2" />
                  Ver Gráficos
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="activos" className="mt-0">
          {/* Contenido similar para estudiantes activos */}
          <Card>
            <CardHeader>
              <CardTitle>Estudiantes Activos</CardTitle>
              <CardDescription>Listado de todos los estudiantes con estado activo en el sistema</CardDescription>
            </CardHeader>
            <CardContent>{/* Tabla similar a la anterior pero solo con estudiantes activos */}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inactivos" className="mt-0">
          {/* Contenido para estudiantes inactivos */}
          <Card>
            <CardHeader>
              <CardTitle>Estudiantes Inactivos</CardTitle>
              <CardDescription>Estudiantes que no están actualmente activos en el sistema</CardDescription>
            </CardHeader>
            <CardContent>{/* Tabla similar a la anterior pero solo con estudiantes inactivos */}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financiero" className="mt-0">
          {/* Contenido para alertas financieras */}
          <Card>
            <CardHeader>
              <CardTitle>Alertas Financieras</CardTitle>
              <CardDescription>Estudiantes con pagos vencidos que requieren atención</CardDescription>
            </CardHeader>
            <CardContent>{/* Tabla similar a la anterior pero solo con estudiantes con pagos vencidos */}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academico" className="mt-0">
          {/* Contenido para alertas académicas */}
          <Card>
            <CardHeader>
              <CardTitle>Alertas Académicas</CardTitle>
              <CardDescription>Estudiantes en estado de advertencia o probación académica</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Tabla similar a la anterior pero solo con estudiantes con problemas académicos */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de detalles del estudiante */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="sticky top-0 bg-background z-10">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{selectedStudent.name}</CardTitle>
                  <CardDescription>{selectedStudent.program}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={handleCloseDetails}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Información Personal</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{selectedStudent.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{selectedStudent.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Inscrito: {new Date(selectedStudent.enrollmentDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Estado Actual</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Badge
                        variant={
                          selectedStudent.status === "active"
                            ? "default"
                            : selectedStudent.status === "on_leave"
                              ? "secondary"
                              : selectedStudent.status === "graduated"
                                ? "outline"
                                : "destructive"
                        }
                      >
                        {selectedStudent.status === "active"
                          ? "Activo"
                          : selectedStudent.status === "on_leave"
                            ? "Permiso"
                            : selectedStudent.status === "graduated"
                              ? "Graduado"
                              : "Inactivo"}
                      </Badge>
                    </div>
                    <div className="flex items-center">
                      <Badge
                        variant={
                          selectedStudent.financialStatus === "up_to_date"
                            ? "default"
                            : selectedStudent.financialStatus === "pending"
                              ? "outline"
                              : "destructive"
                        }
                        className={
                          selectedStudent.financialStatus === "up_to_date"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : ""
                        }
                      >
                        {selectedStudent.financialStatus === "up_to_date"
                          ? "Pagos al día"
                          : selectedStudent.financialStatus === "pending"
                            ? "Pagos pendientes"
                            : "Pagos vencidos"}
                      </Badge>
                    </div>
                    <div className="flex items-center">
                      <Badge
                        variant={
                          selectedStudent.academicStatus === "good_standing"
                            ? "default"
                            : selectedStudent.academicStatus === "warning"
                              ? "outline"
                              : "destructive"
                        }
                        className={
                          selectedStudent.academicStatus === "good_standing"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : ""
                        }
                      >
                        {selectedStudent.academicStatus === "good_standing"
                          ? "Buen rendimiento"
                          : selectedStudent.academicStatus === "warning"
                            ? "Advertencia académica"
                            : "Probación académica"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Rendimiento Académico</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{selectedStudent.gpa}</div>
                        <div className="text-sm text-muted-foreground">Promedio General</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{selectedStudent.attendance}%</div>
                        <div className="text-sm text-muted-foreground">Asistencia</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{selectedStudent.semester}</div>
                        <div className="text-sm text-muted-foreground">Semestre Actual</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Estado Financiero</h3>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Colegiatura Total:</span>
                        <span className="font-medium">${selectedStudent.tuitionTotal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pagado:</span>
                        <span className="font-medium">${selectedStudent.tuitionPaid}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pendiente:</span>
                        <span className="font-medium">
                          ${selectedStudent.tuitionTotal - selectedStudent.tuitionPaid}
                        </span>
                      </div>
                      <Progress
                        className="h-2"
                        value={(selectedStudent.tuitionPaid / selectedStudent.tuitionTotal) * 100}
                      />
                      <div className="text-xs text-right text-muted-foreground">
                        {Math.round((selectedStudent.tuitionPaid / selectedStudent.tuitionTotal) * 100)}% completado
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedStudent.pendingAssignments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Tareas Pendientes</h3>
                  <Card>
                    <CardContent className="pt-6">
                      <ul className="space-y-2">
                        {selectedStudent.pendingAssignments.map((assignment, index) => (
                          <li key={index} className="flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
                            <span>{assignment}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between gap-2">
              <Button variant="outline" onClick={handleCloseDetails}>
                Cerrar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleSendEmail(selectedStudent.email)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Correo
                </Button>
                <Button onClick={() => handleCallStudent(selectedStudent.phone)}>
                  <Phone className="h-4 w-4 mr-2" />
                  Llamar
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}

