"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  Calendar,
  FileText,
  UserCheck,
  Mail,
  Send,
  ArrowRight,
  User,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { fetchCourses } from "@/services/courses"
import { fetchEnrolledStudents } from "@/services/students"
import { fetchUsers, fetchCurrentUser } from "@/services/users"
import {
  fetchProspectos,
  fetchProspectCountByStatus,
} from '@/services/prospectos'
import { API_BASE_URL } from '@/utils/apiConfig'

export default function DashboardClient() {
  const modules = [
    {
      title: "Usuarios",
      description: "Gestión de usuarios, roles y permisos",
      icon: <Users className="h-6 w-6" />,
      href: "/seguridad/usuarios",
      color: "bg-purple-500",
    },
    {
      title: "Académico",
      description: "Gestión de programas, cursos y estudiantes",
      icon: <BookOpen className="h-6 w-6" />,
      href: "/academico",
      color: "bg-green-500",
    },
    {
      title: "Cursos Moodle",
      description: "Consulta de cursos desde Moodle",
      icon: <BookOpen className="h-6 w-6" />,
      href: "/academico/moodle",
      color: "bg-yellow-500",
    },
    {
      title: "Docentes",
      description: "Gestión de cursos, material didáctico y comunicación con alumnos",
      icon: <GraduationCap className="h-6 w-6" />,
      href: "/docente",
      color: "bg-blue-500",
    },
    {
      title: "Finanzas",
      description: "Gestión de pagos, facturas y reportes financieros",
      icon: <CreditCard className="h-6 w-6" />,
      href: "/finanzas",
      color: "bg-red-500",
    },
    {
      title: "Calendario",
      description: "Gestión de eventos y actividades",
      icon: <Calendar className="h-6 w-6" />,
      href: "/calendario",
      color: "bg-pink-500",
    },
    {
      title: "Documentos",
      description: "Gestión de documentos y archivos",
      icon: <FileText className="h-6 w-6" />,
      href: "/documentos",
      color: "bg-teal-500",
    },
  ]

  const [totalUsers, setTotalUsers] = useState<number>(0)
  const [activeStudents, setActiveStudents] = useState<number>(0)
  const [activeCourses, setActiveCourses] = useState<number>(0)
  const [myStudents, setMyStudents] = useState<number>(0)
  const [leadStats, setLeadStats] = useState<Record<string, number>>({})
  
  // Estados para gestión de credenciales
  const [credencialesStats, setCredencialesStats] = useState<{
    total_pendientes: number
    con_carnet: number
    sin_carnet: number
    usuarios_creados: number
    credenciales_enviadas: number
    listos_para_enviar: number
    sin_usuario: number
  } | null>(null)

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const currentUser = await fetchCurrentUser()
        const [users, students, courses, prospects] = await Promise.all([
          fetchUsers(),
          fetchEnrolledStudents(),
          fetchCourses(),
          fetchProspectos(),
        ])

        setTotalUsers(users.length)
        setActiveStudents(students.length)
        setActiveCourses(courses.length)

        if (currentUser) {
          const mine =
            currentUser.rol === 'Administrador'
              ? prospects.length
              : prospects.filter(
                  p => p.created_by === currentUser.id,
                ).length

          setMyStudents(mine)
          const statuses = [
            'Interesado',
            'No le interesa',
            'En seguimiento',
            'No volver a contactar',
          ]
          const counts: Record<string, number> = {}
          for (const s of statuses) {
            counts[s] = await fetchProspectCountByStatus(s)
          }
          setLeadStats(counts)
        }
        
        // Cargar estadísticas de credenciales
        try {
          const credResponse = await fetch(`${API_BASE_URL}/api/gen-credenciales/estadisticas`)
          const credData = await credResponse.json()
          if (credData.success) {
            setCredencialesStats(credData.data)
          }
        } catch (err) {
          console.error('Error fetching credentials stats', err)
        }
      } catch (err) {
        console.error('Error fetching dashboard metrics', err)
      }
    }
    loadMetrics()
  }, [])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Tarjetas de estadísticas */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuarios</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <p className="text-xs text-muted-foreground">Usuarios registrados</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estudiantes Activos</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeStudents}</div>
                <p className="text-xs text-muted-foreground">Estudiantes inscritos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cursos Activos</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeCourses}</div>
                <p className="text-xs text-muted-foreground">Cursos activos</p>
              </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mis Estudiantes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myStudents}</div>
                <p className="text-xs text-muted-foreground">Estudiantes asignados</p>
              </CardContent>
            </Card>
          </div>

          {/* Sección de Gestión de Credenciales y Accesos */}
          {credencialesStats && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">Gestión de Credenciales y Accesos</h3>
                  <p className="text-sm text-muted-foreground">Estado actual de usuarios y credenciales del sistema</p>
                </div>
                <Button asChild>
                  <Link href="/academico/usuarios">
                    Ir a Gestión Completa
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Pendientes de procesar */}
                <Card className="border-l-4 border-l-gray-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-600" />
                      Pendientes de Procesar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Total</span>
                        <span className="text-2xl font-bold">{credencialesStats.total_pendientes}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Con carnet</span>
                        <span className="font-semibold text-green-600">{credencialesStats.con_carnet}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Sin carnet</span>
                        <span className="font-semibold text-orange-600">{credencialesStats.sin_carnet}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Usuarios creados */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-blue-600" />
                      Usuarios en el Sistema
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Usuarios Creados</span>
                        <span className="text-2xl font-bold text-blue-600">{credencialesStats.usuarios_creados}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Sin usuario</span>
                        <span className="font-semibold text-gray-600">{credencialesStats.sin_usuario}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t">
                        <div className="text-xs text-muted-foreground">
                          {Math.round((credencialesStats.usuarios_creados / credencialesStats.total_pendientes) * 100)}% de cobertura
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Credenciales enviadas */}
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-green-600" />
                      Estado de Envío
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Credenciales Enviadas</span>
                        <span className="text-2xl font-bold text-green-600">{credencialesStats.credenciales_enviadas}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Listos para enviar</span>
                        <span className="font-semibold text-teal-600">{credencialesStats.listos_para_enviar}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t">
                        <div className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {credencialesStats.credenciales_enviadas > 0 ? 'Proceso en marcha' : 'Listo para iniciar'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Alerta informativa */}
              {credencialesStats.sin_usuario > 0 && (
                <Card className="mt-4 bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">
                          Hay {credencialesStats.sin_usuario} estudiante{credencialesStats.sin_usuario !== 1 ? 's' : ''} pendiente{credencialesStats.sin_usuario !== 1 ? 's' : ''} de crear usuario
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          Ve a la página de gestión de usuarios para generar carnets y enviar credenciales a los estudiantes.
                        </p>
                      </div>
                      <Button size="sm" variant="outline" asChild className="border-blue-300 text-blue-700 hover:bg-blue-100">
                        <Link href="/academico/usuarios">
                          Ver Detalles
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <h3 className="text-xl font-semibold mt-6 mb-4">Módulos del Sistema</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module, index) => (
              <Link key={index} href={module.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${module.color} text-white mb-2`}
                    >
                      {module.icon}
                    </div>
                    <CardTitle>{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>

          {Object.keys(leadStats).length > 0 && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(leadStats).map(([label, count]) => (
                <Card key={label}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{count}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analíticas</CardTitle>
              <CardDescription>Visualización de datos y métricas del sistema</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Contenido de analíticas en desarrollo</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reportes</CardTitle>
              <CardDescription>Generación y visualización de reportes del sistema</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Contenido de reportes en desarrollo</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>Gestión de notificaciones y alertas del sistema</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Contenido de notificaciones en desarrollo</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
