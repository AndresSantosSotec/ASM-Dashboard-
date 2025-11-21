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
  CheckCircle2,
  AlertCircle,
  AlertTriangle
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
    // Estadísticas de estudiante (Rol 3)
    cursos_activos?: number
    tareas_pendientes?: number
    promedio_general?: number
    cursos_completados?: number
    total_cursos?: number
    
    // Estadísticas de admin (Rol 1) y asesor (Rol 7)
    prospectos_asignados?: number
    estudiantes_total?: number
    prospectos_nuevos?: number
    total_prospectos?: number
    tareas_atrasadas?: number
    alertas_alumno_nuevo?: number
    alertas_urgentes?: number
    alertas_expiradas?: number
    
    // Estadísticas de finanzas (Rol 5)
    pagos_procesados_mes?: number
    monto_total_mes?: number
    pagos_pendientes?: number
    monto_pendiente?: number
    pagos_vencidos?: number
    
    // Estadísticas de seguridad (Rol 6)
    sesiones_activas?: number
    sesiones_hoy?: number
    usuarios_unicos_hoy?: number
    tiempo_promedio_sesion?: number
    dispositivo_mas_usado?: string
    
    // Estadísticas de administrativo (Rol 4)
    estudiantes_activos?: number
    estudiantes_nuevos_mes?: number
    programas_activos?: number
    cursos_programados?: number
    
    // Estadísticas de docente (Rol 2)
    cursos_asignados?: number
    total_estudiantes?: number
    promedio_asistencia?: number
  }
  recentActivity: {
    icon: React.ReactNode
    title: string
    description: string
    time: string
  }[]
  quickAccess?: {
    id: number
    title: string
    description: string
    path: string
    icon: string
  }[]
  alertas_detalle?: Array<{
    id: number
    prospecto_id: number
    prospecto_nombre: string
    prospecto_correo: string
    prospecto_telefono: string
    prospecto_carnet: string | null
    asesor_id: number
    asesor_nombre: string
    estado: string
    dias_restantes: number
    carnet_existe_moodle?: boolean
    dias_atraso: number
    fecha_limite: string
    fecha_creacion: string
  }>
}

// Componente de paginación
function PaginationControls({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void 
}) {
  const pages = []
  const maxVisiblePages = 5
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
  
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1)
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }
  
  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-muted-foreground">
        Página {currentPage} de {totalPages}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
        >
          Anterior
        </button>
        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="px-3 py-1 text-sm border rounded hover:bg-muted"
            >
              1
            </button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}
        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 text-sm border rounded ${
              currentPage === page 
                ? 'bg-blue-600 text-white' 
                : 'hover:bg-muted'
            }`}
          >
            {page}
          </button>
        ))}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className="px-3 py-1 text-sm border rounded hover:bg-muted"
            >
              {totalPages}
            </button>
          </>
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}

export default function WelcomeView() {
  const [loading, setLoading] = useState(true)
  const [welcomeData, setWelcomeData] = useState<WelcomeData | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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
          })) || getDefaultActivities(dashboardData.user.rol || "Usuario"),
          quickAccess: dashboardData.quickAccess || [],
          alertas_detalle: dashboardData.alertas_detalle || []
        })
        
        // Debug: verificar alertas
        console.log('📊 Dashboard Data recibido:', dashboardData)
        console.log('🔔 Alertas Detalle:', dashboardData.alertas_detalle)
        console.log('📈 Stats:', dashboardData.stats)
        
        setLoading(false)
        return
      } catch (apiError: any) {
        console.error("⚠️ Error al cargar datos del dashboard desde API:", apiError?.message || apiError)
        console.log("📦 Usando datos locales como fallback...")
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

      // ⚠️ FALLBACK: Si la API falló, intentar obtener datos básicos sin estadísticas hardcodeadas
      setWelcomeData({
        user: {
          name: userData?.name || userData?.nombre || userData?.nombres || "Usuario",
          email: userData?.email || userData?.correo_electronico || userData?.correo || "",
          rol: rol,
          carnet: userData?.carnet || userData?.username || undefined
        },
        stats: {}, // Sin estadísticas si la API falló - se mostrarán como vacías
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
      case 'payment': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      case 'warning': return <Bell className="h-5 w-5 text-red-500" />
      case 'login': return <Users className="h-5 w-5 text-cyan-500" />
      default: return <CheckCircle2 className="h-5 w-5 text-blue-500" />
    }
  }

  const getIconComponent = (iconName: string) => {
    const iconClass = "h-5 w-5"
    switch(iconName) {
      case 'Users': return <Users className={iconClass} />
      case 'Plus': return <Sparkles className={iconClass} />
      case 'FileText': return <FileText className={iconClass} />
      case 'ClipboardList': return <FileText className={iconClass} />
      case 'Activities': return <Calendar className={iconClass} />
      case 'Calendar': return <Calendar className={iconClass} />
      case 'BookOpen': return <BookOpen className={iconClass} />
      case 'UserCheck': return <Users className={iconClass} />
      case 'LayoutDashboard': return <TrendingUp className={iconClass} />
      case 'Mail': return <Bell className={iconClass} />
      case 'Medal': return <CheckCircle2 className={iconClass} />
      case 'Award': return <CheckCircle2 className={iconClass} />
      case 'Bell': return <Bell className={iconClass} />
      case 'DollarSign': return <Clock className={iconClass} />
      case 'CreditCard': return <Clock className={iconClass} />
      case 'PieChart': return <TrendingUp className={iconClass} />
      case 'RefreshCw': return <TrendingUp className={iconClass} />
      case 'BarChart': return <TrendingUp className={iconClass} />
      case 'Settings': return <FileText className={iconClass} />
      case 'FileCheck': return <FileText className={iconClass} />
      case 'Send': return <Bell className={iconClass} />
      case 'Shield': return <CheckCircle2 className={iconClass} />
      case 'Activity': return <TrendingUp className={iconClass} />
      case 'Key': return <CheckCircle2 className={iconClass} />
      case 'LogIn': return <Users className={iconClass} />
      case 'Database': return <FileText className={iconClass} />
      case 'FileSignature': return <FileText className={iconClass} />
      default: return <FileText className={iconClass} />
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

        {/* Nuevas tarjetas dinámicas */}
        {welcomeData.stats.promedio_general !== undefined && welcomeData.stats.promedio_general > 0 && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Promedio General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-indigo-600">
                  {welcomeData.stats.promedio_general.toFixed(1)}
                </div>
                <TrendingUp className="h-8 w-8 text-indigo-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        )}

        {welcomeData.stats.cursos_completados !== undefined && welcomeData.stats.cursos_completados > 0 && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cursos Completados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-green-600">
                  {welcomeData.stats.cursos_completados}
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        )}

        {welcomeData.stats.prospectos_nuevos !== undefined && welcomeData.stats.prospectos_nuevos > 0 && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Prospectos Nuevos (7 días)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-cyan-600">
                  {welcomeData.stats.prospectos_nuevos}
                </div>
                <Sparkles className="h-8 w-8 text-cyan-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        )}

        {welcomeData.stats.total_prospectos !== undefined && welcomeData.stats.total_prospectos > 0 && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Prospectos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-slate-600">
                  {welcomeData.stats.total_prospectos}
                </div>
                <Users className="h-8 w-8 text-slate-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estadísticas de Finanzas (Rol 5) */}
        {welcomeData.stats.pagos_procesados_mes !== undefined && welcomeData.stats.pagos_procesados_mes > 0 && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pagos del Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-emerald-600">
                  {welcomeData.stats.pagos_procesados_mes}
                </div>
                <CheckCircle2 className="h-8 w-8 text-emerald-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        )}

        {welcomeData.stats.monto_total_mes !== undefined && welcomeData.stats.monto_total_mes > 0 && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monto Total Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-green-600">
                  Q{welcomeData.stats.monto_total_mes.toLocaleString('es-GT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
                <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        )}

        {welcomeData.stats.pagos_pendientes !== undefined && welcomeData.stats.pagos_pendientes > 0 && (
          <Card className="hover:shadow-lg transition-shadow border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pagos Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-amber-600">
                  {welcomeData.stats.pagos_pendientes}
                </div>
                <Clock className="h-8 w-8 text-amber-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        )}

        {welcomeData.stats.pagos_vencidos !== undefined && welcomeData.stats.pagos_vencidos > 0 && (
          <Card className="hover:shadow-lg transition-shadow border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pagos Vencidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-red-600">
                  {welcomeData.stats.pagos_vencidos}
                </div>
                <Bell className="h-8 w-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estadísticas de Seguridad (Rol 6) */}
        {welcomeData.stats.sesiones_activas !== undefined && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sesiones Activas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-blue-600">
                  {welcomeData.stats.sesiones_activas}
                </div>
                <Users className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        )}

        {welcomeData.stats.sesiones_hoy !== undefined && welcomeData.stats.sesiones_hoy > 0 && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sesiones Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-cyan-600">
                  {welcomeData.stats.sesiones_hoy}
                </div>
                <Calendar className="h-8 w-8 text-cyan-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        )}

        {welcomeData.stats.usuarios_unicos_hoy !== undefined && welcomeData.stats.usuarios_unicos_hoy > 0 && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Usuarios Únicos Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-indigo-600">
                  {welcomeData.stats.usuarios_unicos_hoy}
                </div>
                <Users className="h-8 w-8 text-indigo-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        )}

        {welcomeData.stats.tiempo_promedio_sesion !== undefined && welcomeData.stats.tiempo_promedio_sesion > 0 && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tiempo Promedio Sesión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-violet-600">
                  {welcomeData.stats.tiempo_promedio_sesion.toFixed(1)}m
                </div>
                <Clock className="h-8 w-8 text-violet-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estadísticas de Administrativo (Rol 4) */}
        {welcomeData.stats.estudiantes_activos !== undefined && welcomeData.stats.estudiantes_activos > 0 && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Estudiantes Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-teal-600">
                  {welcomeData.stats.estudiantes_activos}
                </div>
                <GraduationCap className="h-8 w-8 text-teal-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        )}

        {welcomeData.stats.estudiantes_nuevos_mes !== undefined && welcomeData.stats.estudiantes_nuevos_mes > 0 && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Estudiantes Nuevos (Mes)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-lime-600">
                  {welcomeData.stats.estudiantes_nuevos_mes}
                </div>
                <Sparkles className="h-8 w-8 text-lime-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        )}

        {welcomeData.stats.programas_activos !== undefined && welcomeData.stats.programas_activos > 0 && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Programas Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-orange-600">
                  {welcomeData.stats.programas_activos}
                </div>
                <BookOpen className="h-8 w-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        )}

        {welcomeData.stats.cursos_programados !== undefined && welcomeData.stats.cursos_programados > 0 && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cursos Programados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-fuchsia-600">
                  {welcomeData.stats.cursos_programados}
                </div>
                <Calendar className="h-8 w-8 text-fuchsia-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estadísticas de Docente (Rol 2) */}
        {welcomeData.stats.cursos_asignados !== undefined && welcomeData.stats.cursos_asignados > 0 && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cursos Asignados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-rose-600">
                  {welcomeData.stats.cursos_asignados}
                </div>
                <BookOpen className="h-8 w-8 text-rose-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        )}

        {welcomeData.stats.total_estudiantes !== undefined && welcomeData.stats.total_estudiantes > 0 && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Estudiantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-sky-600">
                  {welcomeData.stats.total_estudiantes}
                </div>
                <Users className="h-8 w-8 text-sky-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        )}

        {welcomeData.stats.tareas_atrasadas !== undefined && welcomeData.stats.tareas_atrasadas > 0 && (
          <Card className="hover:shadow-lg transition-shadow border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tareas Atrasadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-red-600">
                  {welcomeData.stats.tareas_atrasadas}
                </div>
                <Bell className="h-8 w-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alertas Alumno Nuevo - Para Admin y Asesores */}
        {welcomeData.stats.alertas_alumno_nuevo !== undefined && welcomeData.stats.alertas_alumno_nuevo > 0 && (
          <Card className="hover:shadow-lg transition-shadow border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Alertas Alumno Nuevo
                {welcomeData.stats.alertas_urgentes !== undefined && welcomeData.stats.alertas_urgentes > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {welcomeData.stats.alertas_urgentes} urgente{welcomeData.stats.alertas_urgentes > 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-blue-600">
                  {welcomeData.stats.alertas_alumno_nuevo}
                </div>
                <AlertCircle className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
              {welcomeData.stats.alertas_urgentes !== undefined && welcomeData.stats.alertas_urgentes > 0 && (
                <p className="text-xs text-red-600 mt-2">
                  {welcomeData.stats.alertas_urgentes} con menos de 3 días restantes
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Alertas Expiradas - Solo para Admin */}
        {welcomeData.stats.alertas_expiradas !== undefined && welcomeData.stats.alertas_expiradas > 0 && (
          <Card className="hover:shadow-lg transition-shadow border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Alertas Expiradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-orange-600">
                  {welcomeData.stats.alertas_expiradas}
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500 opacity-50" />
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

      {/* Tabla de Alertas Alumno Nuevo - Mostrar para Admin y Asesores */}
      {((welcomeData.user.rol === 'Administrador' || welcomeData.user.rol === 'Asesor') || 
        (welcomeData.stats.alertas_alumno_nuevo !== undefined)) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              Alertas Alumno Nuevo
            </CardTitle>
            <CardDescription>
              {welcomeData.user.rol === 'Administrador' 
                ? 'Lista completa de todas las alertas activas del sistema (incluye todas las creadas)'
                : 'Lista completa de tus alertas activas (incluye todas las que has creado)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {welcomeData.alertas_detalle && welcomeData.alertas_detalle.length > 0 ? (
              <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">Prospecto</th>
                      <th className="text-left p-2 font-semibold">Carnet</th>
                      <th className="text-left p-2 font-semibold">Asesor (Creador)</th>
                      <th className="text-center p-2 font-semibold">Estado</th>
                      <th className="text-center p-2 font-semibold">Días</th>
                      <th className="text-center p-2 font-semibold">Fecha Límite</th>
                      <th className="text-center p-2 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                <tbody>
                  {(welcomeData.alertas_detalle || [])
                    .sort((a, b) => {
                      // Ordenar: primero las atrasadas (dias_atraso > 0), luego por días restantes
                      if (a.dias_atraso > 0 && b.dias_atraso === 0) return -1
                      if (a.dias_atraso === 0 && b.dias_atraso > 0) return 1
                      if (a.dias_atraso > 0 && b.dias_atraso > 0) return b.dias_atraso - a.dias_atraso
                      return a.dias_restantes - b.dias_restantes
                    })
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((alerta) => {
                      const isAtrasada = alerta.dias_atraso > 0
                      const diasRestantes = alerta.dias_restantes
                      
                      // Sistema de semáforo según días restantes
                      // Verde: 10-8 días | Amarillo: 7-4 días | Naranja: 3-2 días | Rojo: 1 día o menos/atrasada
                      let semaforoColor = ''
                      let semaforoLabel = ''
                      
                      if (isAtrasada) {
                        semaforoColor = 'red'
                        semaforoLabel = 'Atrasada'
                      } else if (diasRestantes <= 1) {
                        semaforoColor = 'red'
                        semaforoLabel = 'Crítico (1 día)'
                      } else if (diasRestantes >= 2 && diasRestantes <= 3) {
                        semaforoColor = 'orange'
                        semaforoLabel = `Urgente (${diasRestantes} días)`
                      } else if (diasRestantes >= 4 && diasRestantes <= 7) {
                        semaforoColor = 'yellow'
                        semaforoLabel = `Atención (${diasRestantes} días)`
                      } else if (diasRestantes >= 8 && diasRestantes <= 10) {
                        semaforoColor = 'green'
                        semaforoLabel = `Normal (${diasRestantes} días)`
                      } else {
                        // Más de 10 días
                        semaforoColor = 'green'
                        semaforoLabel = `Normal (${diasRestantes} días)`
                      }
                      
                      const isUrgente = semaforoColor === 'orange' || semaforoColor === 'red'
                      const isNormal = semaforoColor === 'green'
                      
                      return (
                        <tr
                          key={alerta.id}
                          className={`border-b hover:bg-muted/50 ${
                            semaforoColor === 'red' ? 'bg-red-50' :
                            semaforoColor === 'orange' ? 'bg-orange-50' :
                            semaforoColor === 'yellow' ? 'bg-yellow-50' :
                            'bg-green-50'
                          }`}
                        >
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{alerta.prospecto_nombre}</div>
                              <div className="text-xs text-muted-foreground">
                                {alerta.prospecto_correo}
                              </div>
                            </div>
                          </td>
                          <td className="p-2">
                            {alerta.prospecto_carnet ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono">
                                  {alerta.prospecto_carnet}
                                </Badge>
                                {alerta.carnet_existe_moodle !== undefined && (
                                  <div className="flex items-center gap-1" title={alerta.carnet_existe_moodle ? 'Carnet existe en Moodle' : 'Carnet no existe en Moodle'}>
                                    {alerta.carnet_existe_moodle ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <AlertCircle className="h-4 w-4 text-red-600" />
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">Sin carnet</span>
                            )}
                          </td>
                          <td className="p-2 text-sm">{alerta.asesor_nombre}</td>
                          <td className="p-2 text-center">
                            <Badge
                              variant={
                                isAtrasada
                                  ? 'destructive'
                                  : isUrgente
                                  ? 'default'
                                  : 'secondary'
                              }
                              className="text-xs"
                            >
                              {alerta.estado}
                            </Badge>
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex flex-col items-center gap-1">
                              {/* Semáforo visual */}
                              <div className={`w-4 h-4 rounded-full ${
                                semaforoColor === 'red' ? 'bg-red-500' :
                                semaforoColor === 'orange' ? 'bg-orange-500' :
                                semaforoColor === 'yellow' ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`} title={semaforoLabel} />
                              
                              {/* Días restantes/atraso */}
                              {isAtrasada ? (
                                <div className="flex items-center gap-1">
                                  <AlertTriangle className="h-4 w-4 text-red-600" />
                                  <span className="font-bold text-red-600 text-sm">
                                    -{alerta.dias_atraso} día{alerta.dias_atraso > 1 ? 's' : ''}
                                  </span>
                                </div>
                              ) : (
                                <span className={`font-bold text-sm ${
                                  semaforoColor === 'red' ? 'text-red-600' :
                                  semaforoColor === 'orange' ? 'text-orange-600' :
                                  semaforoColor === 'yellow' ? 'text-yellow-600' :
                                  'text-green-600'
                                }`}>
                                  {diasRestantes} día{diasRestantes !== 1 ? 's' : ''}
                                </span>
                              )}
                              
                              {/* Badge del estado */}
                              <Badge 
                                variant={
                                  semaforoColor === 'red' ? 'destructive' :
                                  semaforoColor === 'orange' ? 'default' :
                                  'secondary'
                                }
                                className={`text-xs ${
                                  semaforoColor === 'orange' ? 'bg-orange-500' :
                                  semaforoColor === 'yellow' ? 'bg-yellow-500' :
                                  semaforoColor === 'green' ? 'bg-green-500' :
                                  ''
                                }`}
                              >
                                {semaforoLabel}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-2 text-center text-xs text-muted-foreground">
                            {new Date(alerta.fecha_limite).toLocaleDateString('es-GT')}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              onClick={() => {
                                window.location.href = `/gestion?prospectoId=${alerta.prospecto_id}`
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                              Ver Prospecto
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
            {welcomeData.alertas_detalle && welcomeData.alertas_detalle.length > itemsPerPage && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={Math.ceil(welcomeData.alertas_detalle.length / itemsPerPage)}
                onPageChange={setCurrentPage}
              />
            )}
            </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-sm">No hay alertas de alumno nuevo activas</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
            {welcomeData.quickAccess && welcomeData.quickAccess.length > 0 ? (
              welcomeData.quickAccess.map((access) => (
                <QuickAccessButton
                  key={access.id}
                  href={access.path}
                  icon={getIconComponent(access.icon)}
                  title={access.title}
                  description={access.description}
                />
              ))
            ) : (
              // Fallback si no hay quickAccess del backend
              <>
                <QuickAccessButton
                  href="/dashboard"
                  icon={<Users className="h-5 w-5" />}
                  title="Dashboard"
                  description="Volver al inicio"
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
