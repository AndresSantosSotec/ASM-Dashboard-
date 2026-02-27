"use client"

import React, { Fragment, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DASHBOARD_INICIO_DESIGN,
  DASHBOARD_SECTION_ORDER,
  type DashboardSectionId,
} from "@/lib/dashboard-inicio-config"
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
  AlertTriangle,
  Zap
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import NotificationsPanel from "@/components/dashboard/NotificationsPanel"
import { StatCard, STAT_COLORS, type StatColor } from "@/components/dashboard/StatCard"
import { QuickAccessCard } from "@/components/dashboard/QuickAccessCard"
import { SectionWrapper } from "@/components/dashboard/SectionWrapper"
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline"
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
    prospectos_en_aprobacion?: number
    prospectos_aprobacion_urgentes?: number
    proximos_hacia_academica?: number
    proximos_hacia_financiera?: number
    proximos_hacia_credenciales?: number
    
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
  /** Si tiene permiso en algún módulo de aprobación (académica/financiera/credenciales) y puede ver la sección */
  puede_ver_seccion_aprobacion?: boolean
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
  prospectos_aprobacion?: Array<{
    id: number
    prospecto_id: number
    prospecto_nombre: string
    prospecto_correo: string
    prospecto_telefono: string
    prospecto_carnet: string | null
    asesor_id: number
    asesor_nombre: string
    fase_aprobacion: string
    estado_fase: string
    porcentaje_avance: number
    fecha_ingreso: string
    fecha_limite_fase: string | null
    observaciones: string | null
    dias_en_fase: number
    prioridad: string
  }>
  /** Config del layout desde backend (orden de secciones, columnas, espaciado) */
  dashboard_config?: {
    section_order: DashboardSectionId[]
    stats_columns: 2 | 3 | 4
    spacing: "normal" | "compact"
  }
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
  const [paginaAprobacion, setPaginaAprobacion] = useState(1)
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
          alertas_detalle: dashboardData.alertas_detalle || [],
          dashboard_config: dashboardData.dashboard_config,
        })
        
        try {
          const aprobacionData = await dashboardService.fetchProspectosAprobacion()
          setWelcomeData(prev => prev ? {
            ...prev,
            puede_ver_seccion_aprobacion: aprobacionData.puede_ver_seccion_aprobacion ?? false,
            prospectos_aprobacion: aprobacionData.prospectos_aprobacion || [],
            stats: {
              ...prev.stats,
              prospectos_en_aprobacion: aprobacionData.stats?.total ?? 0,
              prospectos_aprobacion_urgentes: aprobacionData.stats?.urgentes ?? 0,
              proximos_hacia_academica: aprobacionData.stats?.proximos?.hacia_academica ?? 0,
              proximos_hacia_financiera: aprobacionData.stats?.proximos?.hacia_financiera ?? 0,
              proximos_hacia_credenciales: aprobacionData.stats?.proximos?.hacia_credenciales ?? 0,
            }
          } : prev)
        } catch (e) {
          console.warn('No se pudieron cargar prospectos en aprobación', e)
        }
        
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

  const sectionOrder: DashboardSectionId[] =
    welcomeData.dashboard_config?.section_order ?? DASHBOARD_SECTION_ORDER
  const statsColumns =
    welcomeData.dashboard_config?.stats_columns ?? DASHBOARD_INICIO_DESIGN.statsGridColumnsLg
  const spacing =
    welcomeData.dashboard_config?.spacing ?? DASHBOARD_INICIO_DESIGN.sectionSpacing
  const sectionSpacing = spacing === "compact" ? "space-y-4" : "space-y-6"
  const statsGridCols = { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" }[statsColumns]

  const welcomeSection = (
    <div
      className="relative overflow-hidden rounded-2xl p-8 text-white"
      style={{ background: "#0f2744" }}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div
        className="absolute left-0 top-8 bottom-8 w-1 bg-[#8b1a2b] rounded-r-full"
      />
      <div
        className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle, #8b1a2b, transparent)",
        }}
      />
      <div className="relative pl-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-[#8b1a2b] animate-pulse" />
          <span className="text-white/60 text-sm font-medium uppercase tracking-widest">
            {getGreeting()}
          </span>
        </div>
        <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
          {welcomeData.user.name}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#8b1a2b] text-white uppercase tracking-wide">
            {welcomeData.user.rol}
          </span>
          {welcomeData.user.carnet && (
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/10 text-white/80 border border-white/20">
              🎓 {welcomeData.user.carnet}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-white/60 text-sm">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate()}
          </span>
          <span className="flex items-center gap-1.5 text-white/60 text-sm">
            <Clock className="h-3.5 w-3.5" />
            {formatTime()}
          </span>
        </div>
      </div>
    </div>
  )

  const getStatColor = (key: string): StatColor => STAT_COLORS[key] ?? "blue"

  const statsSection = (
    <div className={`grid grid-cols-1 md:grid-cols-2 ${statsGridCols} gap-4`}>
        {welcomeData.stats.cursos_activos !== undefined && (
          <StatCard
            title="Cursos Activos"
            value={welcomeData.stats.cursos_activos}
            icon={<BookOpen className="h-5 w-5" />}
            color={getStatColor("cursos_activos")}
          />
        )}

        {welcomeData.stats.tareas_pendientes !== undefined && (
          <StatCard
            title="Tareas Pendientes"
            value={welcomeData.stats.tareas_pendientes}
            icon={<FileText className="h-5 w-5" />}
            color={getStatColor("tareas_pendientes")}
          />
        )}

        {welcomeData.stats.prospectos_asignados !== undefined && (
          <StatCard
            title="Prospectos Asignados"
            value={welcomeData.stats.prospectos_asignados}
            icon={<Users className="h-5 w-5" />}
            color={getStatColor("prospectos_asignados")}
          />
        )}

        {welcomeData.stats.estudiantes_total !== undefined && (
          <StatCard
            title="Total Estudiantes"
            value={welcomeData.stats.estudiantes_total}
            icon={<GraduationCap className="h-5 w-5" />}
            color={getStatColor("estudiantes_total")}
          />
        )}

        {welcomeData.stats.promedio_general !== undefined && welcomeData.stats.promedio_general > 0 && (
          <StatCard
            title="Promedio General"
            value={welcomeData.stats.promedio_general.toFixed(1)}
            icon={<TrendingUp className="h-5 w-5" />}
            color={getStatColor("promedio_general")}
          />
        )}

        {welcomeData.stats.cursos_completados !== undefined && welcomeData.stats.cursos_completados > 0 && (
          <StatCard
            title="Cursos Completados"
            value={welcomeData.stats.cursos_completados}
            icon={<CheckCircle2 className="h-5 w-5" />}
            color={getStatColor("cursos_completados")}
          />
        )}

        {welcomeData.stats.prospectos_nuevos !== undefined && welcomeData.stats.prospectos_nuevos > 0 && (
          <StatCard
            title="Prospectos Nuevos (7 días)"
            value={welcomeData.stats.prospectos_nuevos}
            icon={<Sparkles className="h-5 w-5" />}
            color={getStatColor("prospectos_nuevos")}
          />
        )}

        {welcomeData.stats.total_prospectos !== undefined && welcomeData.stats.total_prospectos > 0 && (
          <StatCard
            title="Total Prospectos"
            value={welcomeData.stats.total_prospectos}
            icon={<Users className="h-5 w-5" />}
            color={getStatColor("total_prospectos")}
          />
        )}

        {welcomeData.stats.pagos_procesados_mes !== undefined && welcomeData.stats.pagos_procesados_mes > 0 && (
          <StatCard
            title="Pagos del Mes"
            value={welcomeData.stats.pagos_procesados_mes}
            icon={<CheckCircle2 className="h-5 w-5" />}
            color={getStatColor("pagos_procesados_mes")}
          />
        )}

        {welcomeData.stats.monto_total_mes !== undefined && welcomeData.stats.monto_total_mes > 0 && (
          <StatCard
            title="Monto Total Mes"
            value={`Q${welcomeData.stats.monto_total_mes.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<TrendingUp className="h-5 w-5" />}
            color={getStatColor("monto_total_mes")}
          />
        )}

        {welcomeData.stats.pagos_pendientes !== undefined && welcomeData.stats.pagos_pendientes > 0 && (
          <StatCard
            title="Pagos Pendientes"
            value={welcomeData.stats.pagos_pendientes}
            icon={<Clock className="h-5 w-5" />}
            color={getStatColor("pagos_pendientes")}
          />
        )}

        {welcomeData.stats.pagos_vencidos !== undefined && welcomeData.stats.pagos_vencidos > 0 && (
          <StatCard
            title="Pagos Vencidos"
            value={welcomeData.stats.pagos_vencidos}
            icon={<Bell className="h-5 w-5" />}
            color={getStatColor("pagos_vencidos")}
          />
        )}

        {welcomeData.stats.sesiones_activas !== undefined && (
          <StatCard
            title="Sesiones Activas"
            value={welcomeData.stats.sesiones_activas}
            icon={<Users className="h-5 w-5" />}
            color={getStatColor("sesiones_activas")}
          />
        )}

        {welcomeData.stats.sesiones_hoy !== undefined && welcomeData.stats.sesiones_hoy > 0 && (
          <StatCard
            title="Sesiones Hoy"
            value={welcomeData.stats.sesiones_hoy}
            icon={<Calendar className="h-5 w-5" />}
            color={getStatColor("sesiones_hoy")}
          />
        )}

        {welcomeData.stats.usuarios_unicos_hoy !== undefined && welcomeData.stats.usuarios_unicos_hoy > 0 && (
          <StatCard
            title="Usuarios Únicos Hoy"
            value={welcomeData.stats.usuarios_unicos_hoy}
            icon={<Users className="h-5 w-5" />}
            color={getStatColor("usuarios_unicos_hoy")}
          />
        )}

        {welcomeData.stats.tiempo_promedio_sesion !== undefined && welcomeData.stats.tiempo_promedio_sesion > 0 && (
          <StatCard
            title="Tiempo Promedio Sesión"
            value={`${welcomeData.stats.tiempo_promedio_sesion.toFixed(1)}m`}
            icon={<Clock className="h-5 w-5" />}
            color={getStatColor("tiempo_promedio_sesion")}
          />
        )}

        {welcomeData.stats.estudiantes_activos !== undefined && welcomeData.stats.estudiantes_activos > 0 && (
          <StatCard
            title="Estudiantes Activos"
            value={welcomeData.stats.estudiantes_activos}
            icon={<GraduationCap className="h-5 w-5" />}
            color={getStatColor("estudiantes_activos")}
          />
        )}

        {welcomeData.stats.estudiantes_nuevos_mes !== undefined && welcomeData.stats.estudiantes_nuevos_mes > 0 && (
          <StatCard
            title="Estudiantes Nuevos (Mes)"
            value={welcomeData.stats.estudiantes_nuevos_mes}
            icon={<Sparkles className="h-5 w-5" />}
            color={getStatColor("estudiantes_nuevos_mes")}
          />
        )}

        {welcomeData.stats.programas_activos !== undefined && welcomeData.stats.programas_activos > 0 && (
          <StatCard
            title="Programas Activos"
            value={welcomeData.stats.programas_activos}
            icon={<BookOpen className="h-5 w-5" />}
            color={getStatColor("programas_activos")}
          />
        )}

        {welcomeData.stats.cursos_programados !== undefined && welcomeData.stats.cursos_programados > 0 && (
          <StatCard
            title="Cursos Programados"
            value={welcomeData.stats.cursos_programados}
            icon={<Calendar className="h-5 w-5" />}
            color={getStatColor("cursos_programados")}
          />
        )}

        {welcomeData.stats.cursos_asignados !== undefined && welcomeData.stats.cursos_asignados > 0 && (
          <StatCard
            title="Cursos Asignados"
            value={welcomeData.stats.cursos_asignados}
            icon={<BookOpen className="h-5 w-5" />}
            color={getStatColor("cursos_asignados")}
          />
        )}

        {welcomeData.stats.total_estudiantes !== undefined && welcomeData.stats.total_estudiantes > 0 && (
          <StatCard
            title="Total Estudiantes"
            value={welcomeData.stats.total_estudiantes}
            icon={<Users className="h-5 w-5" />}
            color={getStatColor("total_estudiantes")}
          />
        )}

        {welcomeData.stats.tareas_atrasadas !== undefined && welcomeData.stats.tareas_atrasadas > 0 && (
          <StatCard
            title="Tareas Atrasadas"
            value={welcomeData.stats.tareas_atrasadas}
            icon={<Bell className="h-5 w-5" />}
            color={getStatColor("tareas_atrasadas")}
          />
        )}

        {welcomeData.stats.alertas_alumno_nuevo !== undefined && welcomeData.stats.alertas_alumno_nuevo > 0 && (
          <StatCard
            title="Alertas Alumno Nuevo"
            value={welcomeData.stats.alertas_alumno_nuevo}
            icon={<AlertCircle className="h-5 w-5" />}
            color={getStatColor("alertas_alumno_nuevo")}
            subtitle={
              welcomeData.stats.alertas_urgentes !== undefined && welcomeData.stats.alertas_urgentes > 0
                ? `${welcomeData.stats.alertas_urgentes} con menos de 3 días restantes`
                : undefined
            }
          />
        )}

        {/* Alertas Expiradas - Solo para Admin */}
        {welcomeData.stats.alertas_expiradas !== undefined && welcomeData.stats.alertas_expiradas > 0 && (
          <StatCard
            title="Alertas Expiradas"
            value={welcomeData.stats.alertas_expiradas}
            icon={<AlertTriangle className="h-5 w-5" />}
            color={getStatColor("alertas_expiradas")}
          />
        )}

        {welcomeData.stats.prospectos_en_aprobacion !== undefined &&
          (welcomeData.stats.prospectos_en_aprobacion > 0 ||
            (welcomeData.puede_ver_seccion_aprobacion &&
              ((welcomeData.stats.proximos_hacia_academica ?? 0) + (welcomeData.stats.proximos_hacia_financiera ?? 0) + (welcomeData.stats.proximos_hacia_credenciales ?? 0) > 0))) && (
          <StatCard
            title="En Aprobación"
            value={welcomeData.stats.prospectos_en_aprobacion}
            icon={<CheckCircle2 className="h-5 w-5" />}
            color={getStatColor("prospectos_en_aprobacion")}
            subtitle={
              welcomeData.stats.prospectos_en_aprobacion === 0 &&
              ((welcomeData.stats.proximos_hacia_academica ?? 0) + (welcomeData.stats.proximos_hacia_financiera ?? 0) + (welcomeData.stats.proximos_hacia_credenciales ?? 0)) > 0
                ? `${(welcomeData.stats.proximos_hacia_academica ?? 0) + (welcomeData.stats.proximos_hacia_financiera ?? 0) + (welcomeData.stats.proximos_hacia_credenciales ?? 0)} próximo${((welcomeData.stats.proximos_hacia_academica ?? 0) + (welcomeData.stats.proximos_hacia_financiera ?? 0) + (welcomeData.stats.proximos_hacia_credenciales ?? 0)) !== 1 ? "s" : ""} a tu aprobación`
                : undefined
            }
          />
        )}
      </div>
  )

  const notificationsSection = <NotificationsPanel />

  const activitySection = (
    <SectionWrapper>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-gray-900 text-lg">Actividad Reciente</h2>
        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
          Últimas actualizaciones
        </span>
      </div>
      <ActivityTimeline activities={welcomeData.recentActivity} />
    </SectionWrapper>
  )

  const alertasSection = ((welcomeData.user.rol === 'Administrador' || welcomeData.user.rol === 'Asesor') ||
        (welcomeData.stats.alertas_alumno_nuevo !== undefined)) ? (
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
  ) : null

  const aprobacionSection = (welcomeData.user.rol === 'Administrador' || welcomeData.user.rol === 'Asesor' || welcomeData.puede_ver_seccion_aprobacion) ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-purple-500" />
              {welcomeData.user.rol === 'Administrador'
                ? 'Todos los Prospectos en Aprobación'
                : welcomeData.user.rol === 'Asesor'
                  ? 'Mis Prospectos en Aprobación'
                  : 'Prospectos en Aprobación'}
            </CardTitle>
            <CardDescription>
              {welcomeData.user.rol === 'Administrador'
                ? 'Vista global de todos los prospectos en proceso de aprobación (Comercial → Académica → Financiera → Credenciales)'
                : welcomeData.user.rol === 'Asesor'
                  ? 'Prospectos bajo tu gestión que están en proceso de aprobación'
                  : 'Prospectos que pronto podrían llegar a tu módulo de aprobación o están pendientes de tu revisión'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {((welcomeData.stats.proximos_hacia_academica ?? 0) + (welcomeData.stats.proximos_hacia_financiera ?? 0) + (welcomeData.stats.proximos_hacia_credenciales ?? 0)) > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-muted/60 border border-purple-200 dark:border-purple-800/50 text-sm">
                <span className="font-medium text-purple-700 dark:text-purple-300">Pronto tendrás a aprobar: </span>
                {(welcomeData.stats.proximos_hacia_academica ?? 0) > 0 && (
                  <span className="mr-3">{welcomeData.stats.proximos_hacia_academica} en Aprobación Académica</span>
                )}
                {(welcomeData.stats.proximos_hacia_financiera ?? 0) > 0 && (
                  <span className="mr-3">{welcomeData.stats.proximos_hacia_financiera} en Aprobación Financiera</span>
                )}
                {(welcomeData.stats.proximos_hacia_credenciales ?? 0) > 0 && (
                  <span>{welcomeData.stats.proximos_hacia_credenciales} en Credenciales</span>
                )}
              </div>
            )}
            {welcomeData.prospectos_aprobacion && welcomeData.prospectos_aprobacion.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold">Prospecto</th>
                        <th className="text-left p-2 font-semibold">Carnet</th>
                        {welcomeData.user.rol === 'Administrador' && (
                          <th className="text-left p-2 font-semibold">Asesor</th>
                        )}
                        <th className="text-left p-2 font-semibold">Fase Actual</th>
                        <th className="text-left p-2 font-semibold">Progreso</th>
                        <th className="text-center p-2 font-semibold">Estado</th>
                        <th className="text-center p-2 font-semibold">Días en Fase</th>
                        <th className="text-center p-2 font-semibold">Fecha Límite</th>
                        <th className="text-center p-2 font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {welcomeData.prospectos_aprobacion
                        .slice((paginaAprobacion - 1) * itemsPerPage, paginaAprobacion * itemsPerPage)
                        .map((item) => {
                          const estadoBg =
                            item.estado_fase === 'rechazado' ? 'bg-red-50' :
                            item.estado_fase === 'aprobado' ? 'bg-green-50' :
                            item.estado_fase === 'en_revision' ? 'bg-blue-50' :
                            'bg-yellow-50'
                          const faseBadgeClass =
                            item.fase_aprobacion === 'Credenciales' ? 'bg-emerald-100 text-emerald-800' :
                            item.fase_aprobacion === 'Financiera' ? 'bg-purple-100 text-purple-800' :
                            item.fase_aprobacion === 'Académica' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-800'
                          const porcentaje = item.porcentaje_avance ?? 0
                          const progressColor =
                            porcentaje >= 75 ? 'bg-green-500' :
                            porcentaje >= 50 ? 'bg-blue-500' :
                            porcentaje >= 25 ? 'bg-yellow-500' :
                            'bg-red-500'
                          return (
                            <tr key={item.id} className={`border-b hover:bg-muted/50 ${estadoBg}`}>
                              <td className="p-2">
                                <div>
                                  <div className="font-medium">{item.prospecto_nombre}</div>
                                  <div className="text-xs text-muted-foreground">{item.prospecto_correo}</div>
                                </div>
                              </td>
                              <td className="p-2">
                                {item.prospecto_carnet ? (
                                  <Badge variant="outline" className="font-mono">{item.prospecto_carnet}</Badge>
                                ) : (
                                  <span className="text-muted-foreground text-xs">Sin carnet</span>
                                )}
                              </td>
                              {welcomeData.user.rol === 'Administrador' && (
                                <td className="p-2 text-sm">{item.asesor_nombre}</td>
                              )}
                              <td className="p-2">
                                <Badge variant="secondary" className={faseBadgeClass}>
                                  {item.fase_aprobacion}
                                </Badge>
                              </td>
                              <td className="p-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-full max-w-[80px] bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full transition-all ${progressColor}`}
                                      style={{ width: `${Math.min(100, Math.max(0, porcentaje))}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground">{porcentaje}%</span>
                                </div>
                              </td>
                              <td className="p-2 text-center">
                                <Badge
                                  variant={
                                    item.estado_fase === 'rechazado' ? 'destructive' :
                                    item.estado_fase === 'aprobado' ? 'default' : 'secondary'
                                  }
                                  className={
                                    item.estado_fase === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                    item.estado_fase === 'en_revision' ? 'bg-blue-100 text-blue-800' :
                                    item.estado_fase === 'aprobado' ? 'bg-green-100 text-green-800' : ''
                                  }
                                >
                                  {item.estado_fase === 'en_revision' ? 'En revisión' : item.estado_fase}
                                </Badge>
                              </td>
                              <td className="p-2 text-center">
                                <span className={item.dias_en_fase >= 7 ? 'font-semibold text-amber-600' : ''}>
                                  {item.dias_en_fase} día{item.dias_en_fase !== 1 ? 's' : ''}
                                </span>
                              </td>
                              <td className="p-2 text-center text-xs text-muted-foreground">
                                {item.fecha_limite_fase
                                  ? new Date(item.fecha_limite_fase).toLocaleDateString('es-GT')
                                  : 'Sin límite'}
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  onClick={() => {
                                    window.location.href = `/gestion?prospectoId=${item.prospecto_id}`
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
                {welcomeData.prospectos_aprobacion.length > itemsPerPage && (
                  <PaginationControls
                    currentPage={paginaAprobacion}
                    totalPages={Math.ceil(welcomeData.prospectos_aprobacion.length / itemsPerPage)}
                    onPageChange={setPaginaAprobacion}
                  />
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-sm">No hay prospectos en proceso de aprobación</p>
              </div>
            )}
          </CardContent>
        </Card>
  ) : null

  const quickAccessSection = (
    <SectionWrapper>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-bold text-gray-900 text-lg">Accesos Rápidos</h2>
          <p className="text-sm text-gray-500">Secciones más utilizadas</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-[#0f2744]/8 flex items-center justify-center">
          <Zap className="h-4 w-4 text-[#0f2744]" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {welcomeData.quickAccess && welcomeData.quickAccess.length > 0
          ? welcomeData.quickAccess.map((access) => (
              <QuickAccessCard
                key={access.id}
                href={access.path}
                icon={getIconComponent(access.icon)}
                title={access.title}
                description={access.description}
              />
            ))
          : (
            <QuickAccessCard
              href="/dashboard"
              icon={<Users className="h-5 w-5" />}
              title="Dashboard"
              description="Volver al inicio"
            />
          )}
      </div>
    </SectionWrapper>
  )

  const sectionMap: Partial<Record<DashboardSectionId, React.ReactNode>> = {
    welcome: welcomeSection,
    quickAccess: quickAccessSection,
    stats: statsSection,
    notifications: notificationsSection,
    activity: activitySection,
    alertas: alertasSection,
    aprobacion: aprobacionSection,
  }

  return (
    <div className={`dashboard-bg ${sectionSpacing} p-6 max-w-7xl mx-auto min-h-screen`}>
      {sectionOrder.map(id => {
        const node = sectionMap[id]
        return node != null ? <Fragment key={id}>{node}</Fragment> : null
      })}
    </div>
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
