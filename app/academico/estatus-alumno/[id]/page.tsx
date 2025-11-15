"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, DollarSign, GraduationCap, TrendingUp, Calendar, CheckCircle, XCircle, Clock, AlertTriangle, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import api from "@/services/api"
import { generateStudentReport } from "@/lib/pdf-generator"

interface StudentInfo {
  id: string
  name: string
  carnet: string
  email: string
  program: string
  programCode: string
  enrollmentDate: string | null
  status: string
}

interface AcademicInfo {
  coursesApproved: number
  coursesFailed: number
  coursesInProgress: number
  totalCourses: number
  credits: {
    completed: number
    total: number
  }
  gpa: number
  semester: number
}

interface Course {
  id: string
  name: string
  code: string
  credits: number
  period: string
  status: string
  grade: number | null
  professor: string
  startDate: string
  endDate: string | null
}

interface Payment {
  id: string
  concept: string
  amount: number
  date: string | null
  dueDate: string
  status: string
  paidAmount: number | null
}

interface FinancialInfo {
  enrollmentFee: number
  monthlyFee: number
  pendingPayments: number
  totalDebt: number
  lastPaymentDate: string | null
  nextPaymentDate: string | null
  paymentStatus: string
}

export default function EstudianteDetalleEstatus() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
  const [academicInfo, setAcademicInfo] = useState<AcademicInfo | null>(null)
  const [financialInfo, setFinancialInfo] = useState<FinancialInfo | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [payments, setPayments] = useState<Payment[]>([])

  useEffect(() => {
    if (studentId) {
      loadStudentData()
    }
  }, [studentId])

  const loadStudentData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('[DETALLE ESTUDIANTE] Cargando datos para ID:', studentId)

      // Cargar información completa del estudiante con manejo de errores individual
      const responses = await Promise.allSettled([
        api.get('/estudiantes/estatus-completo', { params: { prospecto_id: studentId } }),
        api.get('/estudiantes/cursos-detallados', { params: { prospecto_id: studentId } }),
        api.get('/estudiantes/historial-pagos', { params: { prospecto_id: studentId } })
      ])

      console.log('[DETALLE ESTUDIANTE] Respuestas recibidas:', {
        estatus: responses[0].status === 'fulfilled',
        cursos: responses[1].status === 'fulfilled',
        pagos: responses[2].status === 'fulfilled'
      })

      // Procesar información del estudiante
      if (responses[0].status === 'fulfilled' && responses[0].value.data.success) {
        const data = responses[0].value.data.data
        setStudentInfo({
          id: data.id,
          name: data.name,
          carnet: data.carnet,
          email: data.email,
          program: data.program,
          programCode: data.programCode || '',
          enrollmentDate: data.enrollmentDate,
          status: data.status
        })
        setAcademicInfo(data.academicInfo)
        setFinancialInfo(data.financialInfo)
      } else if (responses[0].status === 'rejected') {
        console.error('[DETALLE ESTUDIANTE] Error al cargar estatus:', responses[0].reason)
        throw new Error('No se pudo cargar la información del estudiante')
      }

      // Procesar cursos (no bloquear si falla)
      if (responses[1].status === 'fulfilled' && responses[1].value.data.success) {
        setCourses(responses[1].value.data.data)
      } else {
        console.warn('[DETALLE ESTUDIANTE] No se pudieron cargar cursos')
        setCourses([])
      }

      // Procesar pagos (no bloquear si falla)
      if (responses[2].status === 'fulfilled' && responses[2].value.data.success) {
        setPayments(responses[2].value.data.data)
      } else {
        console.warn('[DETALLE ESTUDIANTE] No se pudieron cargar pagos')
        setPayments([])
      }

      toast({
        title: "Datos cargados",
        description: "Información del estudiante cargada correctamente"
      })

    } catch (err: any) {
      console.error('[DETALLE ESTUDIANTE] Error:', err)
      setError(err.message || 'Error al cargar información del estudiante')
      toast({
        title: "Error",
        description: err.message || "No se pudo cargar la información del estudiante",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReport = () => {
    if (!studentInfo || !academicInfo) {
      toast({
        title: "Error",
        description: "No hay información disponible para generar el reporte",
        variant: "destructive"
      })
      return
    }

    try {
      generateStudentReport({
        studentInfo: {
          name: studentInfo.name,
          carnet: studentInfo.carnet,
          email: studentInfo.email,
          program: studentInfo.program,
          programCode: studentInfo.programCode,
          status: studentInfo.status
        },
        academicInfo: {
          coursesApproved: academicInfo.coursesApproved,
          coursesFailed: academicInfo.coursesFailed,
          coursesInProgress: academicInfo.coursesInProgress,
          totalCourses: academicInfo.totalCourses,
          credits: academicInfo.credits,
          gpa: academicInfo.gpa,
          semester: academicInfo.semester
        },
        financialInfo: financialInfo ? {
          enrollmentFee: financialInfo.enrollmentFee,
          monthlyFee: financialInfo.monthlyFee,
          pendingPayments: financialInfo.pendingPayments,
          totalDebt: financialInfo.totalDebt,
          paymentStatus: financialInfo.paymentStatus
        } : null,
        courses: courses.map(c => ({
          name: c.name,
          code: c.code,
          credits: c.credits,
          period: c.period,
          status: c.status,
          grade: c.grade
        }))
      })

      toast({
        title: "Reporte generado",
        description: "El PDF se ha descargado correctamente"
      })
    } catch (error) {
      console.error('[PDF] Error al generar reporte:', error)
      toast({
        title: "Error",
        description: "No se pudo generar el reporte PDF",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col justify-center items-center min-h-[60vh] space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            <div className="absolute top-0 left-0 animate-ping rounded-full h-16 w-16 border-4 border-blue-400 opacity-20"></div>
          </div>
          <div className="space-y-2 text-center">
            <p className="text-xl font-semibold text-gray-700">Cargando información del estudiante</p>
            <p className="text-sm text-gray-500">Obteniendo datos académicos y financieros...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !studentInfo) {
    return (
      <div className="container mx-auto py-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar información</h3>
            <p className="text-red-600 mb-6 text-center">{error}</p>
            <div className="flex gap-4">
              <Button onClick={loadStudentData} variant="default">
                Reintentar
              </Button>
              <Button onClick={() => router.push('/academico/estatus-alumno')} variant="outline">
                Volver al Listado
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progressPercent = academicInfo && academicInfo.credits.total > 0
    ? Math.round((academicInfo.credits.completed / academicInfo.credits.total) * 100)
    : 0

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <Button 
            onClick={() => router.push('/academico/estatus-alumno')} 
            variant="outline" 
            className="hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Listado
          </Button>

          <Button 
            onClick={handleDownloadReport} 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            size="lg"
          >
            <Download className="h-5 w-5 mr-2" />
            Descargar Reporte PDF
          </Button>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{studentInfo.name}</h1>
              <div className="flex items-center gap-4 mt-3 text-gray-600">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-medium">Carnet:</span>
                  <code className="bg-white px-3 py-1 rounded-md border border-gray-200 text-sm font-mono">
                    {studentInfo.carnet}
                  </code>
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-sm">{studentInfo.email}</span>
              </div>
              <p className="text-lg mt-3 text-gray-700">
                {studentInfo.program}
                {studentInfo.programCode && (
                  <span className="text-gray-500 ml-2 text-base">({studentInfo.programCode})</span>
                )}
              </p>
            </div>
            <Badge 
              variant={studentInfo.status === 'active' ? 'default' : 'secondary'}
              className="text-base px-4 py-2"
            >
              {studentInfo.status === 'active' ? 'Activo' : 
               studentInfo.status === 'inactive' ? 'Inactivo' : 
               studentInfo.status === 'graduated' ? 'Graduado' : studentInfo.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Cards de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* GPA */}
        <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Promedio General</p>
                <p className="text-4xl font-bold text-blue-600">
                  {academicInfo?.gpa.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Escala de 0 a 10</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cursos Aprobados */}
        <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Cursos Aprobados</p>
                <p className="text-4xl font-bold text-green-600">
                  {academicInfo?.coursesApproved || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">De {academicInfo?.totalCourses || 0} totales</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Créditos */}
        <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Créditos Completados</p>
                <p className="text-4xl font-bold text-purple-600">
                  {academicInfo?.credits.completed || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">De {academicInfo?.credits.total || 0} requeridos</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <GraduationCap className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Pagos Pendientes */}
      </div>

      {/* Barra de Progreso */}
      {academicInfo && (
        <Card className="mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-1">
            <div className="bg-white">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-lg font-bold text-gray-900">Progreso Académico</span>
                      <p className="text-sm text-gray-600 mt-1">Semestre {academicInfo.semester}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-blue-600">{progressPercent}%</span>
                      <p className="text-sm text-gray-600">Completado</p>
                    </div>
                  </div>
                  <Progress value={progressPercent} className="h-4" />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{academicInfo.credits.completed} créditos completados</span>
                    <span>{academicInfo.credits.total - academicInfo.credits.completed} créditos restantes</span>
                  </div>
                </div>
              </CardContent>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs con Detalles */}
      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 h-12">
          <TabsTrigger value="courses" className="text-base">
            <BookOpen className="h-4 w-4 mr-2" />
            Historial Académico
          </TabsTrigger>
        </TabsList>

        {/* Tab: Cursos */}
        <TabsContent value="courses">
          <Card className="shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
              <CardTitle className="text-xl">Cursos del Estudiante</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Registro completo de cursos cursados y en progreso
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Curso</TableHead>
                      <TableHead className="font-semibold">Período</TableHead>

                      <TableHead className="text-center font-semibold">Créditos</TableHead>
                      <TableHead className="text-center font-semibold">Calificación</TableHead>
                      <TableHead className="text-center font-semibold">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 font-medium">No se encontraron cursos registrados</p>
                          <p className="text-sm text-gray-400 mt-1">Los cursos aparecerán aquí cuando se registren en Moodle</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      courses.map((course) => (
                        <TableRow key={course.id} className="hover:bg-gray-50 transition-colors">
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900">{course.name}</div>
                              {course.code && <div className="text-sm text-gray-500 mt-1">{course.code}</div>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-700">{course.period}</div>
                          </TableCell>

                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-semibold">{course.credits}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {course.grade !== null ? (
                              <span className={`text-lg font-bold ${
                                course.grade >= 90 ? 'text-green-600' :
                                course.grade >= 70 ? 'text-blue-600' :
                                course.grade >= 60 ? 'text-amber-600' :
                                'text-red-600'
                              }`}>
                                {course.grade.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">Sin calificar</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {course.status === 'approved' && (
                              <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Aprobado
                              </Badge>
                            )}
                            {course.status === 'failed' && (
                              <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-200">
                                <XCircle className="h-3 w-3 mr-1" />
                                Reprobado
                              </Badge>
                            )}
                            {course.status === 'in_progress' && (
                              <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200">
                                <Clock className="h-3 w-3 mr-1" />
                                En Progreso
                              </Badge>
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
    </div>
  )
}
