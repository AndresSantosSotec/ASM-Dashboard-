"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Users, 
  BookOpen,
  GraduationCap,
  FileText,
  Bell,
  CheckCircle2
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import dashboardService from "@/services/dashboard"

interface WelcomeData {
  user: {
    name: string
    email: string
    rol?: string
    carnet?: string
  }
  stats: {
    cursos_activos?: number
    tareas_pendientes?: number
    prospectos_asignados?: number
    estudiantes_total?: number
  }
  recentActivity: {
    icon: React.ReactNode
    title: string
    description: string
    time: string
  }[]
}

export default function WelcomeView() {
  const [loading, setLoading] = useState(true)
  const [welcomeData, setWelcomeData] = useState<WelcomeData | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    // Actualizar reloj cada minuto
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    // Cargar datos del usuario
    loadWelcomeData()

    return () => clearInterval(timer)
  }, [])

  const loadWelcomeData = async () => {
    try {
      setLoading(true)
      
      // Obtener datos del localStorage
      const token = localStorage.getItem("token")
      const allowedViews = localStorage.getItem("allowedViews")
      const userStr = localStorage.getItem("user") // Cambio: usar "user" en lugar de "userData"
      
      if (!token) {
        window.location.href = "/login"
        return
      }

      let userData = null
      if (userStr) {
        try {
          userData = JSON.parse(userStr)
        } catch (e) {
          console.error("Error parsing user data:", e)
        }
      }

      // Intentar obtener datos del backend primero
      try {
        const dashboardData = await dashboardService.fetchDashboardData()
        
        // Si el backend retorna datos, usarlos
        setWelcomeData({
          user: dashboardData.user,
          stats: dashboardData.stats,
          recentActivity: dashboardData.recentActivity?.map(activity => ({
            icon: getActivityIcon(activity.type),
            title: activity.title,
            description: activity.description,
            time: formatActivityTime(activity.timestamp)
          })) || getDefaultActivities(dashboardData.user.rol || "Usuario")
        })
        
        setLoading(false)
        return
      } catch (apiError) {
        console.log("API no disponible, usando datos locales:", apiError)
      }

      // Si la API falla, usar datos del localStorage
      const views = allowedViews ? JSON.parse(allowedViews) : []
      
      // Debug: mostrar datos en consola
      console.log("=== DEBUG WELCOME VIEW ===")
      console.log("Token:", token ? "✓ Presente" : "✗ No encontrado")
      console.log("User Data:", userData)
      console.log("Allowed Views:", views)
      console.log("========================")
      
      const hasAdminAccess = views.some((v: any) => 
        v.view_path?.includes('admin') || 
        v.view_path?.includes('reportes') ||
        v.view_path?.includes('seguridad')
      )
      const hasStudentAccess = views.some((v: any) => v.view_path?.includes('estudiantes'))
      
      // Determinar rol basado en permisos
      let rol = "Usuario"
      if (hasAdminAccess) {
        rol = "Administrador"
      } else if (hasStudentAccess) {
        rol = "Estudiante"
      }

      // Si el usuario tiene un rol específico en los datos, usarlo
      if (userData?.rol) {
        rol = userData.rol
      }

      const activities = getDefaultActivities(rol)

      setWelcomeData({
        user: {
          name: userData?.name || userData?.nombre || userData?.nombres || "Usuario",
          email: userData?.email || userData?.correo_electronico || userData?.correo || "",
          rol: rol,
          carnet: userData?.carnet || userData?.username || undefined
        },
        stats: {
          cursos_activos: hasStudentAccess ? 6 : undefined,
          tareas_pendientes: hasStudentAccess ? 3 : undefined,
          prospectos_asignados: hasAdminAccess ? 12 : undefined,
          estudiantes_total: hasAdminAccess ? 152 : undefined
        },
        recentActivity: activities
      })
    } catch (error) {
      console.error("Error cargando datos de bienvenida:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'course': return <BookOpen className="h-5 w-5 text-blue-500" />
      case 'task': return <FileText className="h-5 w-5 text-green-500" />
      case 'prospect': return <Users className="h-5 w-5 text-purple-500" />
      case 'graduation': return <GraduationCap className="h-5 w-5 text-orange-500" />
      case 'notification': return <Bell className="h-5 w-5 text-yellow-500" />
      default: return <CheckCircle2 className="h-5 w-5 text-blue-500" />
    }
  }

  const formatActivityTime = (timestamp: string): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffHours < 1) return "Hace unos minutos"
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`
    if (diffHours < 48) return "Ayer"
    
    const diffDays = Math.floor(diffHours / 24)
    return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`
  }

  const getDefaultActivities = (rol: string) => {
    const activities = []
    
    if (rol === "Estudiante") {
      activities.push(
        {
          icon: <BookOpen className="h-5 w-5 text-blue-500" />,
          title: "Nuevos cursos disponibles",
          description: "Revisa tu historial académico actualizado",
          time: "Hace 2 horas"
        },
        {
          icon: <FileText className="h-5 w-5 text-green-500" />,
          title: "Perfil completado",
          description: "Tu perfil está actualizado",
          time: "Hoy"
        }
      )
    }

    if (rol === "Administrador") {
      activities.push(
        {
          icon: <Users className="h-5 w-5 text-purple-500" />,
          title: "Nuevos prospectos",
          description: "5 nuevos prospectos registrados esta semana",
          time: "Hace 1 hora"
        },
        {
          icon: <GraduationCap className="h-5 w-5 text-orange-500" />,
          title: "Reporte de graduaciones",
          description: "Reporte mensual disponible",
          time: "Hace 3 horas"
        }
      )
    }

    activities.push({
      icon: <Bell className="h-5 w-5 text-yellow-500" />,
      title: "Sistema actualizado",
      description: "Nuevas funcionalidades disponibles",
      time: "Hoy"
    })

    return activities
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return "Buenos días"
    if (hour < 18) return "Buenas tardes"
    return "Buenas noches"
  }

  const formatDate = () => {
    return currentTime.toLocaleDateString('es-GT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = () => {
    return currentTime.toLocaleTimeString('es-GT', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return <WelcomeSkeleton />
  }

  if (!welcomeData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No se pudieron cargar los datos</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header de Bienvenida */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 p-8 text-white">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6" />
            <span className="text-lg font-medium opacity-90">{getGreeting()}</span>
          </div>
          
          <h1 className="text-4xl font-bold mb-2">
            {welcomeData.user.name}
          </h1>
          
          <div className="flex flex-wrap gap-3 items-center">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {welcomeData.user.rol}
            </Badge>
            {welcomeData.user.carnet && (
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                🎓 {welcomeData.user.carnet}
              </Badge>
            )}
            <div className="flex items-center gap-2 text-white/90">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">{formatDate()}</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{formatTime()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {welcomeData.stats.cursos_activos !== undefined && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cursos Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-blue-600">
                  {welcomeData.stats.cursos_activos}
                </div>
                <BookOpen className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        )}

        {welcomeData.stats.tareas_pendientes !== undefined && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tareas Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-orange-600">
                  {welcomeData.stats.tareas_pendientes}
                </div>
                <FileText className="h-8 w-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        )}

        {welcomeData.stats.prospectos_asignados !== undefined && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Prospectos Asignados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-green-600">
                  {welcomeData.stats.prospectos_asignados}
                </div>
                <Users className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        )}

        {welcomeData.stats.estudiantes_total !== undefined && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Estudiantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-purple-600">
                  {welcomeData.stats.estudiantes_total}
                </div>
                <GraduationCap className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Actividad Reciente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Actividad Reciente
          </CardTitle>
          <CardDescription>
            Últimas actualizaciones y notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {welcomeData.recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                </div>
                <div className="flex-shrink-0 text-xs text-muted-foreground">
                  {activity.time}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Accesos Rápidos */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Accesos Rápidos</CardTitle>
          <CardDescription>
            Navega directamente a las secciones más utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {welcomeData.user.rol === "Estudiante" ? (
              <>
                <QuickAccessButton
                  href="/estudiantes/perfil"
                  icon={<Users className="h-5 w-5" />}
                  title="Mi Perfil"
                  description="Ver información personal"
                />
                <QuickAccessButton
                  href="/estudiantes/cursos"
                  icon={<BookOpen className="h-5 w-5" />}
                  title="Mis Cursos"
                  description="Cursos matriculados"
                />
                <QuickAccessButton
                  href="/estudiantes/calendario"
                  icon={<Calendar className="h-5 w-5" />}
                  title="Calendario"
                  description="Horarios y eventos"
                />
              </>
            ) : (
              <>
                <QuickAccessButton
                  href="/admin/prospectos"
                  icon={<Users className="h-5 w-5" />}
                  title="Prospectos"
                  description="Gestión de prospectos"
                />
                <QuickAccessButton
                  href="/admin/estudiantes"
                  icon={<GraduationCap className="h-5 w-5" />}
                  title="Estudiantes"
                  description="Gestión de estudiantes"
                />
                <QuickAccessButton
                  href="/admin/reportes"
                  icon={<FileText className="h-5 w-5" />}
                  title="Reportes"
                  description="Informes y estadísticas"
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function QuickAccessButton({ 
  href, 
  icon, 
  title, 
  description 
}: { 
  href: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <a
      href={href}
      className="flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-muted/50 transition-all group"
    >
      <div className="flex-shrink-0 mt-0.5 text-muted-foreground group-hover:text-primary transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm group-hover:text-primary transition-colors">
          {title}
        </p>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </div>
    </a>
  )
}

function WelcomeSkeleton() {
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <Skeleton className="h-48 w-full rounded-2xl" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
