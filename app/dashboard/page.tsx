"use client"

import type { Metadata } from "next"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  GraduationCap,
  BookOpen,
  Building,
  CreditCard,
  BarChart,
  Calendar,
  FileText,
  Settings,
} from "lucide-react"
import Link from "next/link"
import { fetchCourses } from "@/services/courses"
import { fetchEnrolledStudents } from "@/services/students"
import { fetchUsers, fetchCurrentUser } from "@/services/users"
import {
  fetchProspectos,
  fetchProspectCountByStatus,
} from '@/services/prospectos'

export const metadata: Metadata = {
  title: "Dashboard | Blue Atlas",
  description: "Panel de control principal",
}

export default function DashboardPage() {
  const modules = [
    {
      title: "Usuarios",
      description: "Gestión de usuarios, roles y permisos",
      icon: <Users className="h-6 w-6" />,
      href: "/usuarios",
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
      title: "Docentes",
      description: "Gestión de cursos, material didáctico y comunicación con alumnos",
      icon: <GraduationCap className="h-6 w-6" />,
      href: "/docente",
      color: "bg-blue-500",
    },
    {
      title: "Administrativo",
      description: "Gestión de recursos y procesos administrativos",
      icon: <Building className="h-6 w-6" />,
      href: "/administrativo",
      color: "bg-yellow-500",
    },
    {
      title: "Finanzas",
      description: "Gestión de pagos, facturas y reportes financieros",
      icon: <CreditCard className="h-6 w-6" />,
      href: "/finanzas",
      color: "bg-red-500",
    },
    {
      title: "Reportes",
      description: "Generación y visualización de reportes",
      icon: <BarChart className="h-6 w-6" />,
      href: "/reportes",
      color: "bg-indigo-500",
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
    {
      title: "Configuración",
      description: "Configuración general del sistema",
      icon: <Settings className="h-6 w-6" />,
      href: "/configuracion",
      color: "bg-gray-500",
    },
  ]

  const [totalUsers, setTotalUsers] = useState<number>(0)
  const [activeStudents, setActiveStudents] = useState<number>(0)
  const [activeCourses, setActiveCourses] = useState<number>(0)
  const [myProspects, setMyProspects] = useState<number>(0)
  const [leadStats, setLeadStats] = useState<Record<string, number>>({})

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
          setMyProspects(mine)

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
                <CardTitle className="text-sm font-medium">Mis Prospectos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myProspects}</div>
                <p className="text-xs text-muted-foreground">Prospectos asignados</p>
              </CardContent>
            </Card>
          </div>

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

