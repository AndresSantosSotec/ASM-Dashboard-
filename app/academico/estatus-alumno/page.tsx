"use client"

import { useState } from "react"
import { Search, Download, BookOpen, DollarSign, CheckCircle, XCircle, AlertTriangle, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"

// Tipos
interface Student {
  id: string
  name: string
  program: string
  semester: number
  enrollmentDate: string
  status: "active" | "inactive" | "graduated" | "on_leave"
  academicInfo: {
    coursesApproved: number
    coursesFailed: number
    coursesInProgress: number
    totalCourses: number
    credits: {
      completed: number
      total: number
    }
    gpa: number
  }
  financialInfo: {
    enrollmentFee: number
    monthlyFee: number
    pendingPayments: number
    totalDebt: number
    lastPaymentDate: string | null
    nextPaymentDate: string | null
    paymentStatus: "up_to_date" | "pending" | "overdue"
  }
}

interface Course {
  id: string
  studentId: string
  name: string
  code: string
  credits: number
  period: string
  status: "approved" | "failed" | "in_progress" | "pending"
  grade: number | null
  professor: string
}

interface Payment {
  id: string
  studentId: string
  concept: string
  amount: number
  date: string
  status: "paid" | "pending" | "overdue"
  dueDate: string
}

// Datos de ejemplo
const mockStudents: Student[] = [
  {
    id: "1",
    name: "Juan Pérez",
    program: "Licenciatura en Administración de Empresas",
    semester: 3,
    enrollmentDate: "2022-08-15",
    status: "active",
    academicInfo: {
      coursesApproved: 12,
      coursesFailed: 1,
      coursesInProgress: 4,
      totalCourses: 36,
      credits: {
        completed: 45,
        total: 120,
      },
      gpa: 8.7,
    },
    financialInfo: {
      enrollmentFee: 5000,
      monthlyFee: 2500,
      pendingPayments: 1,
      totalDebt: 2500,
      lastPaymentDate: "2023-10-05",
      nextPaymentDate: "2023-11-05",
      paymentStatus: "pending",
    },
  },
  {
    id: "2",
    name: "María González",
    program: "Ingeniería en Sistemas Computacionales",
    semester: 4,
    enrollmentDate: "2022-01-10",
    status: "active",
    academicInfo: {
      coursesApproved: 18,
      coursesFailed: 0,
      coursesInProgress: 5,
      totalCourses: 45,
      credits: {
        completed: 72,
        total: 180,
      },
      gpa: 9.2,
    },
    financialInfo: {
      enrollmentFee: 6000,
      monthlyFee: 3000,
      pendingPayments: 0,
      totalDebt: 0,
      lastPaymentDate: "2023-11-02",
      nextPaymentDate: "2023-12-05",
      paymentStatus: "up_to_date",
    },
  },
  {
    id: "3",
    name: "Carlos Rodríguez",
    program: "Maestría en Educación",
    semester: 2,
    enrollmentDate: "2023-01-15",
    status: "on_leave",
    academicInfo: {
      coursesApproved: 6,
      coursesFailed: 1,
      coursesInProgress: 0,
      totalCourses: 15,
      credits: {
        completed: 24,
        total: 60,
      },
      gpa: 8.1,
    },
    financialInfo: {
      enrollmentFee: 8000,
      monthlyFee: 4000,
      pendingPayments: 2,
      totalDebt: 8000,
      lastPaymentDate: "2023-09-05",
      nextPaymentDate: "2023-10-05",
      paymentStatus: "overdue",
    },
  },
]

const mockCourses: Course[] = [
  {
    id: "c1",
    studentId: "1",
    name: "Fundamentos de Administración",
    code: "ADM101",
    credits: 4,
    period: "2022-2",
    status: "approved",
    grade: 85,
    professor: "Ana López",
  },
  {
    id: "c2",
    studentId: "1",
    name: "Contabilidad Básica",
    code: "CONT101",
    credits: 3,
    period: "2022-2",
    status: "approved",
    grade: 78,
    professor: "Roberto Méndez",
  },
  {
    id: "c3",
    studentId: "1",
    name: "Estadística para Negocios",
    code: "STAT201",
    credits: 4,
    period: "2023-1",
    status: "failed",
    grade: 55,
    professor: "María González",
  },
  {
    id: "c4",
    studentId: "1",
    name: "Marketing Digital",
    code: "MKT301",
    credits: 3,
    period: "2023-1",
    status: "in_progress",
    grade: null,
    professor: "Carlos Rodríguez",
  },
  {
    id: "c5",
    studentId: "1",
    name: "Gestión de Proyectos",
    code: "ADM302",
    credits: 4,
    period: "2023-2",
    status: "in_progress",
    grade: null,
    professor: "Juan Martínez",
  },
]

const mockPayments: Payment[] = [
  {
    id: "p1",
    studentId: "1",
    concept: "Inscripción 2023-2",
    amount: 5000,
    date: "2023-08-01",
    status: "paid",
    dueDate: "2023-08-05",
  },
  {
    id: "p2",
    studentId: "1",
    concept: "Mensualidad Septiembre 2023",
    amount: 2500,
    date: "2023-09-03",
    status: "paid",
    dueDate: "2023-09-05",
  },
  {
    id: "p3",
    studentId: "1",
    concept: "Mensualidad Octubre 2023",
    amount: 2500,
    date: "2023-10-05",
    status: "paid",
    dueDate: "2023-10-05",
  },
  {
    id: "p4",
    studentId: "1",
    concept: "Mensualidad Noviembre 2023",
    amount: 2500,
    date: null,
    status: "pending",
    dueDate: "2023-11-05",
  },
]

export default function EstatusAcademico() {
  const [students] = useState<Student[]>(mockStudents)
  const [courses] = useState<Course[]>(mockCourses)
  const [payments] = useState<Payment[]>(mockPayments)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  // Filtrar estudiantes
  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.program.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Obtener cursos del estudiante seleccionado
  const studentCourses = selectedStudent ? courses.filter((course) => course.studentId === selectedStudent.id) : []

  // Obtener pagos del estudiante seleccionado
  const studentPayments = selectedStudent ? payments.filter((payment) => payment.studentId === selectedStudent.id) : []

  // Descargar estado de cuenta
  const handleDownloadStatement = () => {
    toast({
      title: "Estado de cuenta descargado",
      description: "El estado de cuenta ha sido descargado correctamente.",
    })
  }

  // Descargar historial académico
  const handleDownloadTranscript = () => {
    toast({
      title: "Historial académico descargado",
      description: "El historial académico ha sido descargado correctamente.",
    })
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Estatus Académico del Alumno</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Panel de búsqueda de estudiantes */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Estudiantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar estudiante..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No se encontraron estudiantes</div>
              ) : (
                filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className={`p-3 rounded-md cursor-pointer ${
                      selectedStudent?.id === student.id
                        ? "bg-blue-100 border border-blue-200"
                        : "hover:bg-gray-100 border border-transparent"
                    }`}
                    onClick={() => setSelectedStudent(student)}
                  >
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-gray-500 mb-2">{student.program}</div>
                    <div className="flex justify-between text-xs">
                      <span>Semestre: {student.semester}</span>
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
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Panel principal */}
        <div className="md:col-span-3 space-y-6">
          {selectedStudent ? (
            <>
              {/* Información general del estudiante */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle>Información del Estudiante</CardTitle>
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
                      className={
                        selectedStudent.status === "graduated" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""
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
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Nombre completo</div>
                      <div className="font-medium">{selectedStudent.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Programa</div>
                      <div className="font-medium">{selectedStudent.program}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Semestre actual</div>
                      <div className="font-medium">{selectedStudent.semester}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Fecha de inscripción</div>
                      <div className="font-medium">{new Date(selectedStudent.enrollmentDate).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Promedio general</div>
                      <div
                        className={`font-medium ${
                          selectedStudent.academicInfo.gpa >= 9
                            ? "text-green-600"
                            : selectedStudent.academicInfo.gpa >= 7
                              ? "text-blue-600"
                              : "text-amber-600"
                        }`}
                      >
                        {selectedStudent.academicInfo.gpa.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Progreso académico</div>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">
                          {Math.round(
                            (selectedStudent.academicInfo.credits.completed /
                              selectedStudent.academicInfo.credits.total) *
                              100,
                          )}
                          %
                        </span>
                        <Progress
                          value={
                            (selectedStudent.academicInfo.credits.completed /
                              selectedStudent.academicInfo.credits.total) *
                            100
                          }
                          className="h-2 flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pestañas de información académica y financiera */}
              <Tabs defaultValue="academic">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="academic">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Información Académica
                  </TabsTrigger>
                  <TabsTrigger value="financial">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Información Financiera
                  </TabsTrigger>
                </TabsList>

                {/* Pestaña de información académica */}
                <TabsContent value="academic" className="space-y-4 pt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle>Resumen Académico</CardTitle>
                        <Button variant="outline" size="sm" onClick={handleDownloadTranscript}>
                          <Download className="h-4 w-4 mr-2" />
                          Descargar historial
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {selectedStudent.academicInfo.coursesApproved}
                          </div>
                          <div className="text-sm text-gray-500">Cursos aprobados</div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {selectedStudent.academicInfo.coursesFailed}
                          </div>
                          <div className="text-sm text-gray-500">Cursos reprobados</div>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-amber-600">
                            {selectedStudent.academicInfo.coursesInProgress}
                          </div>
                          <div className="text-sm text-gray-500">Cursos en curso</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {selectedStudent.academicInfo.credits.completed}
                          </div>
                          <div className="text-sm text-gray-500">Créditos completados</div>
                        </div>
                      </div>

                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Curso</TableHead>
                              <TableHead>Periodo</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead>Calificación</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {studentCourses.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                                  No hay cursos registrados
                                </TableCell>
                              </TableRow>
                            ) : (
                              studentCourses.map((course) => (
                                <TableRow key={course.id}>
                                  <TableCell>
                                    <div className="font-medium">{course.name}</div>
                                    <div className="text-sm text-gray-500">
                                      {course.code} • {course.credits} créditos
                                    </div>
                                    <div className="text-xs text-gray-500">Prof. {course.professor}</div>
                                  </TableCell>
                                  <TableCell>{course.period}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        course.status === "approved"
                                          ? "default"
                                          : course.status === "failed"
                                            ? "destructive"
                                            : course.status === "in_progress"
                                              ? "secondary"
                                              : "outline"
                                      }
                                      className={
                                        course.status === "approved"
                                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                                          : course.status === "in_progress"
                                            ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                            : ""
                                      }
                                    >
                                      {course.status === "approved"
                                        ? "Aprobado"
                                        : course.status === "failed"
                                          ? "Reprobado"
                                          : course.status === "in_progress"
                                            ? "En curso"
                                            : "Pendiente"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {course.grade !== null ? (
                                      <div
                                        className={`font-medium ${
                                          course.grade >= 70
                                            ? "text-green-600"
                                            : course.grade >= 50
                                              ? "text-amber-600"
                                              : "text-red-600"
                                        }`}
                                      >
                                        {course.grade}
                                      </div>
                                    ) : (
                                      <span className="text-gray-500">-</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Pestaña de información financiera */}
                <TabsContent value="financial" className="space-y-4 pt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle>Resumen Financiero</CardTitle>
                        <Button variant="outline" size="sm" onClick={handleDownloadStatement}>
                          <Download className="h-4 w-4 mr-2" />
                          Descargar estado de cuenta
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="border p-4 rounded-lg">
                          <div className="text-sm text-gray-500 mb-1">Cuota de inscripción</div>
                          <div className="text-xl font-bold">
                            ${selectedStudent.financialInfo.enrollmentFee.toLocaleString()}
                          </div>
                        </div>
                        <div className="border p-4 rounded-lg">
                          <div className="text-sm text-gray-500 mb-1">Mensualidad</div>
                          <div className="text-xl font-bold">
                            ${selectedStudent.financialInfo.monthlyFee.toLocaleString()}
                          </div>
                        </div>
                        <div className="border p-4 rounded-lg">
                          <div className="text-sm text-gray-500 mb-1">Pagos pendientes</div>
                          <div className="text-xl font-bold text-amber-600">
                            {selectedStudent.financialInfo.pendingPayments}
                          </div>
                        </div>
                        <div className="border p-4 rounded-lg">
                          <div className="text-sm text-gray-500 mb-1">Deuda total</div>
                          <div
                            className={`text-xl font-bold ${
                              selectedStudent.financialInfo.totalDebt > 0 ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            ${selectedStudent.financialInfo.totalDebt.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 mb-4 rounded-lg bg-gray-50">
                        <div>
                          <div className="text-sm text-gray-500">Estado de pagos</div>
                          <div className="font-medium flex items-center">
                            {selectedStudent.financialInfo.paymentStatus === "up_to_date" ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                                <span className="text-green-600">Al día</span>
                              </>
                            ) : selectedStudent.financialInfo.paymentStatus === "pending" ? (
                              <>
                                <AlertTriangle className="h-4 w-4 mr-1 text-amber-600" />
                                <span className="text-amber-600">Pago pendiente</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-1 text-red-600" />
                                <span className="text-red-600">Pago vencido</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Próximo pago</div>
                          <div className="font-medium">
                            {selectedStudent.financialInfo.nextPaymentDate
                              ? new Date(selectedStudent.financialInfo.nextPaymentDate).toLocaleDateString()
                              : "No programado"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Último pago</div>
                          <div className="font-medium">
                            {selectedStudent.financialInfo.lastPaymentDate
                              ? new Date(selectedStudent.financialInfo.lastPaymentDate).toLocaleDateString()
                              : "Sin pagos"}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Concepto</TableHead>
                              <TableHead>Monto</TableHead>
                              <TableHead>Fecha límite</TableHead>
                              <TableHead>Estado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {studentPayments.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                                  No hay pagos registrados
                                </TableCell>
                              </TableRow>
                            ) : (
                              studentPayments.map((payment) => (
                                <TableRow key={payment.id}>
                                  <TableCell>
                                    <div className="font-medium">{payment.concept}</div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium">${payment.amount.toLocaleString()}</div>
                                  </TableCell>
                                  <TableCell>{new Date(payment.dueDate).toLocaleDateString()}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        payment.status === "paid"
                                          ? "default"
                                          : payment.status === "pending"
                                            ? "outline"
                                            : "destructive"
                                      }
                                      className={
                                        payment.status === "paid"
                                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                                          : ""
                                      }
                                    >
                                      {payment.status === "paid"
                                        ? "Pagado"
                                        : payment.status === "pending"
                                          ? "Pendiente"
                                          : "Vencido"}
                                    </Badge>
                                    {payment.date && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        Pagado: {new Date(payment.date).toLocaleDateString()}
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <User className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-700 mb-2">Seleccione un estudiante</h3>
                <p className="text-gray-500 text-center max-w-md">
                  Seleccione un estudiante del panel izquierdo para ver su información académica y financiera.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

