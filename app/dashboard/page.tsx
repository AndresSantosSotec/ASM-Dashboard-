import type { Metadata } from "next"
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Tarjetas de estadísticas */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuarios</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,248</div>
                <p className="text-xs text-muted-foreground">+12% respecto al mes anterior</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estudiantes Activos</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">845</div>
                <p className="text-xs text-muted-foreground">+5% respecto al mes anterior</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cursos Activos</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">42</div>
                <p className="text-xs text-muted-foreground">+2 nuevos cursos este mes</p>
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

