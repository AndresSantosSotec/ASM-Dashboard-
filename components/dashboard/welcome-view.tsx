"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
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
  UserCheck,
  Mail,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  RefreshCw
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import NotificationsPanel from "@/components/dashboard/NotificationsPanel"
import dashboardService, { fetchInscritosPorMes, downloadInscritosPorMes, type InscritoMes } from "@/services/dashboard"
import api from "@/services/api"

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
    tiene_usuario?: boolean
    usuario_id?: number | null
    ya_enviado?: boolean
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
  const [procesandoAlerta, setProcesandoAlerta] = useState<number | null>(null)
  const itemsPerPage = 10
  const { toast } = useToast()

  // — Estado: Inscritos por mes —
  const [inscritosMes, setInscritosMes] = useState<InscritoMes[]>([])
  const [inscritosTotal, setInscritosTotal] = useState(0)
  const [inscritosEsAdmin, setInscritosEsAdmin] = useState(false)
  const [inscritosMesNombre, setInscritosMesNombre] = useState('')
  const [inscritosLoading, setInscritosLoading] = useState(false)
  const [inscritosDescargando, setInscritosDescargando] = useState(false)
  const [inscritosPagina, setInscritosPagina] = useState(1)
  const inscritosPerPage = 10

  const hoy = new Date()
  const [mesSel, setMesSel] = useState(hoy.getMonth() + 1)
  const [anoSel, setAnoSel] = useState(hoy.getFullYear())

  // — Estado: Últimos carnets generados —
  const [ultimosCarnets, setUltimosCarnets] = useState<{id:number; carnet:string; nombre_completo:string; updated_at:string}[]>([])
  const [ultimosCarnetsSiguiente, setUltimosCarnetsSiguiente] = useState('')
  const [ultimosCarnetsTotal, setUltimosCarnetsTotal] = useState(0)
  const [ultimosCarnetsPage, setUltimosCarnetsPage] = useState(1)
  const [ultimosCarnetsLastPage, setUltimosCarnetsLastPage] = useState(1)
  const [ultimosCarnetsLoading, setUltimosCarnetsLoading] = useState(false)
  const ultimosCarnetsPerPage = 10

  // — Estado: Últimos carnets Moodle —
  const [ultimosMoodle, setUltimosMoodle] = useState<{id:number; carnet:string; nombre_completo:string; email:string; fecha_creacion:string; suspendido:boolean}[]>([])
  const [ultimosMoodleTotal, setUltimosMoodleTotal] = useState(0)
  const [ultimosMoodlePage, setUltimosMoodlePage] = useState(1)
  const [ultimosMoodleLastPage, setUltimosMoodleLastPage] = useState(1)
  const [ultimosMoodleLoading, setUltimosMoodleLoading] = useState(false)
  const [ultimosMoodleDisponible, setUltimosMoodleDisponible] = useState(true)
  const ultimosMoodlePerPage = 10

  useEffect(() => {
    // Actualizar reloj cada minuto
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    // Cargar datos del usuario
    loadWelcomeData()

    return () => clearInterval(timer)
  }, [])

  // Cargar últimos carnets generados
  const cargarUltimosCarnets = async (page = 1) => {
    try {
      setUltimosCarnetsLoading(true)
      const token = localStorage.getItem("token")
      const res = await api.get('/gen-credenciales/ultimos-carnets', {
        params: { limit: ultimosCarnetsPerPage, page },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const d = res.data
      setUltimosCarnets(d.data || [])
      setUltimosCarnetsTotal(d.total || 0)
      setUltimosCarnetsPage(d.page || 1)
      setUltimosCarnetsLastPage(d.last_page || 1)
      setUltimosCarnetsSiguiente(d.siguiente_carnet || '')
    } catch (e) {
      console.warn('No se pudieron cargar últimos carnets', e)
    } finally {
      setUltimosCarnetsLoading(false)
    }
  }

  useEffect(() => { cargarUltimosCarnets(ultimosCarnetsPage) }, [ultimosCarnetsPage])

  // Cargar últimos carnets de Moodle
  const cargarUltimosMoodle = async (page = 1) => {
    try {
      setUltimosMoodleLoading(true)
      const token = localStorage.getItem("token")
      const anio = new Date().getFullYear().toString()
      const res = await api.get('/gen-credenciales/ultimos-carnets-moodle', {
        params: { limit: ultimosMoodlePerPage, page, anio },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const d = res.data
      setUltimosMoodle(d.data || [])
      setUltimosMoodleTotal(d.total || 0)
      setUltimosMoodlePage(d.page || 1)
      setUltimosMoodleLastPage(d.last_page || 1)
      setUltimosMoodleDisponible(d.moodle_disponible !== false)
    } catch (e) {
      console.warn('No se pudieron cargar carnets de Moodle', e)
      setUltimosMoodleDisponible(false)
    } finally {
      setUltimosMoodleLoading(false)
    }
  }

  useEffect(() => { cargarUltimosMoodle(ultimosMoodlePage) }, [ultimosMoodlePage])

  // Cargar inscritos cuando cambie mes/año
  useEffect(() => {
    const cargarInscritos = async () => {      try {
        setInscritosLoading(true)
        const res = await fetchInscritosPorMes(mesSel, anoSel)
        if (res.success) {
          setInscritosMes(res.data)
          setInscritosTotal(res.total)
          setInscritosEsAdmin(res.es_admin)
          setInscritosMesNombre(res.mes_nombre)
          setInscritosPagina(1)
        }
      } catch (e) {
        console.warn('No se pudieron cargar inscritos por mes', e)
      } finally {
        setInscritosLoading(false)
      }
    }
    cargarInscritos()
  }, [mesSel, anoSel])

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

  const marcarAlertaProcesada = async (alertaId: number) => {
    try {
      setProcesandoAlerta(alertaId)
      
      const response = await api.post('/dashboard/alertas/marcar-procesada', {
        alerta_id: alertaId
      })

      if (response.data.success) {
        toast({
          title: "Alerta procesada",
          description: "La alerta ha sido marcada como procesada exitosamente",
        })

        // Recargar datos del dashboard
        await loadWelcomeData()
      }
    } catch (error: any) {
      console.error("Error al marcar alerta:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "No se pudo procesar la alerta",
      })
    } finally {
      setProcesandoAlerta(null)
    }
  }

  const descargarInscritosMes = async (format: 'csv' | 'excel') => {
    try {
      setInscritosDescargando(true)
      await downloadInscritosPorMes(mesSel, anoSel, inscritosMesNombre, format)
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo descargar el reporte' })
    } finally {
      setInscritosDescargando(false)
    }
  }

  const cambiarMes = (delta: number) => {
    let m = mesSel + delta
    let a = anoSel
    if (m < 1) { m = 12; a-- }
    if (m > 12) { m = 1; a++ }
    setMesSel(m)
    setAnoSel(a)
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

        {/* Prospectos en Aprobación - Para Admin, Asesor o quien tenga permiso y tenga datos */}
        {welcomeData.stats.prospectos_en_aprobacion !== undefined &&
          (welcomeData.stats.prospectos_en_aprobacion > 0 ||
            (welcomeData.puede_ver_seccion_aprobacion &&
              ((welcomeData.stats.proximos_hacia_academica ?? 0) + (welcomeData.stats.proximos_hacia_financiera ?? 0) + (welcomeData.stats.proximos_hacia_credenciales ?? 0) > 0))) && (
          <Card className="hover:shadow-lg transition-shadow border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                En Aprobación
                {welcomeData.stats.prospectos_aprobacion_urgentes !== undefined && welcomeData.stats.prospectos_aprobacion_urgentes > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {welcomeData.stats.prospectos_aprobacion_urgentes} urgente{welcomeData.stats.prospectos_aprobacion_urgentes > 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-purple-600">
                    {welcomeData.stats.prospectos_en_aprobacion}
                  </div>
                  {welcomeData.stats.prospectos_en_aprobacion === 0 &&
                    ((welcomeData.stats.proximos_hacia_academica ?? 0) + (welcomeData.stats.proximos_hacia_financiera ?? 0) + (welcomeData.stats.proximos_hacia_credenciales ?? 0)) > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {(welcomeData.stats.proximos_hacia_academica ?? 0) + (welcomeData.stats.proximos_hacia_financiera ?? 0) + (welcomeData.stats.proximos_hacia_credenciales ?? 0)} próximo{(welcomeData.stats.proximos_hacia_academica ?? 0) + (welcomeData.stats.proximos_hacia_financiera ?? 0) + (welcomeData.stats.proximos_hacia_credenciales ?? 0) !== 1 ? 's' : ''} a tu aprobación
                    </p>
                  )}
                </div>
                <CheckCircle2 className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notificaciones de Inscripción */}
      <NotificationsPanel />

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
                      <th className="text-center p-2 font-semibold">Estado Proceso</th>
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
                          <td className="p-2 text-center">
                            <div className="flex flex-col items-center gap-1">
                              {/* Indicador: Usuario Creado */}
                              <div className="flex items-center gap-1" title={alerta.tiene_usuario ? 'Usuario ya creado' : 'Usuario no creado'}>
                                <UserCheck className={`h-4 w-4 ${alerta.tiene_usuario ? 'text-green-600' : 'text-gray-300'}`} />
                                <span className={`text-xs ${alerta.tiene_usuario ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                                  {alerta.tiene_usuario ? 'Usuario' : 'Sin usuario'}
                                </span>
                              </div>
                              {/* Indicador: Credenciales Enviadas */}
                              <div className="flex items-center gap-1" title={alerta.ya_enviado ? 'Credenciales ya enviadas (Inscrito)' : 'Credenciales no enviadas'}>
                                <Mail className={`h-4 w-4 ${alerta.ya_enviado ? 'text-blue-600' : 'text-gray-300'}`} />
                                <span className={`text-xs ${alerta.ya_enviado ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                                  {alerta.ya_enviado ? 'Enviadas' : 'Sin enviar'}
                                </span>
                              </div>
                            </div>
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
                          <td className="p-2">
                            <div className="flex flex-col gap-2 items-center">
                              <button
                                onClick={() => {
                                  window.location.href = `/gestion?prospectoId=${alerta.prospecto_id}`
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
                              >
                                Ver Prospecto
                              </button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => marcarAlertaProcesada(alerta.id)}
                                disabled={procesandoAlerta === alerta.id}
                                className="h-7 px-2 text-xs gap-1 hover:bg-green-50 hover:border-green-300"
                              >
                                <X className="h-3 w-3" />
                                {procesandoAlerta === alerta.id ? 'Procesando...' : 'Marcar Procesada'}
                              </Button>
                            </div>
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

      {/* Mis Prospectos en Aprobación / Todos los Prospectos en Aprobación - Admin, Asesor o quien tenga permiso en algún módulo de aprobación */}
      {(welcomeData.user.rol === 'Administrador' || welcomeData.user.rol === 'Asesor' || welcomeData.puede_ver_seccion_aprobacion) && (
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
      )}

      {/* ── Inscritos por Mes ── */}
      {(welcomeData.user.rol === 'Administrador' || welcomeData.user.rol === 'Asesor') && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-emerald-500" />
                  Inscritos por Mes
                </CardTitle>
                <CardDescription>
                  {inscritosEsAdmin
                    ? 'Registro histórico de todos los prospectos inscritos en el período seleccionado'
                    : 'Tus prospectos inscritos en el período seleccionado'}
                </CardDescription>
              </div>
              {/* Selector de mes */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => cambiarMes(-1)}
                  className="p-1 rounded hover:bg-muted border"
                  title="Mes anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex gap-1">
                  <select
                    value={mesSel}
                    onChange={e => setMesSel(Number(e.target.value))}
                    className="text-sm border rounded px-2 py-1 bg-background"
                  >
                    {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => (
                      <option key={i+1} value={i+1}>{m}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={anoSel}
                    onChange={e => setAnoSel(Number(e.target.value))}
                    min={2020}
                    max={2100}
                    className="text-sm border rounded px-2 py-1 w-20 bg-background"
                  />
                </div>
                <button
                  onClick={() => cambiarMes(1)}
                  className="p-1 rounded hover:bg-muted border"
                  title="Mes siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => descargarInscritosMes('csv')}
                  disabled={inscritosDescargando || inscritosLoading || inscritosTotal === 0}
                  className="gap-1 ml-2"
                  title="Descargar CSV"
                >
                  <Download className="h-4 w-4" />
                  CSV
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => descargarInscritosMes('excel')}
                  disabled={inscritosDescargando || inscritosLoading || inscritosTotal === 0}
                  className="gap-1 border-green-500 text-green-600 hover:bg-green-50"
                  title="Descargar Excel (.xlsx)"
                >
                  <Download className="h-4 w-4" />
                  Excel
                </Button>
              </div>
            </div>
            {/* Resumen */}
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {inscritosLoading ? '...' : inscritosTotal} inscrito{inscritosTotal !== 1 ? 's' : ''} en {inscritosMesNombre || '...'} {anoSel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {inscritosLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}
              </div>
            ) : inscritosMes.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No hay inscritos en {inscritosMesNombre} {anoSel}</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="text-left p-2 font-semibold">#</th>
                        <th className="text-left p-2 font-semibold">Nombre</th>
                        <th className="text-left p-2 font-semibold">Carnet</th>
                        <th className="text-left p-2 font-semibold">Programa</th>
                        <th className="text-left p-2 font-semibold">Meses</th>
                        <th className="text-right p-2 font-semibold">Inscripción</th>
                        <th className="text-center p-2 font-semibold">Fecha</th>
                        {inscritosEsAdmin && <th className="text-left p-2 font-semibold">Asesor</th>}
                        <th className="text-center p-2 font-semibold">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inscritosMes
                        .slice((inscritosPagina - 1) * inscritosPerPage, inscritosPagina * inscritosPerPage)
                        .map((inscrito, idx) => (
                          <tr key={inscrito.ep_id} className="border-b hover:bg-muted/30">
                            <td className="p-2 text-muted-foreground text-xs">
                              {(inscritosPagina - 1) * inscritosPerPage + idx + 1}
                            </td>
                            <td className="p-2">
                              <div className="font-medium leading-tight">{inscrito.nombre_completo}</div>
                              <div className="text-xs text-muted-foreground">{inscrito.correo_electronico}</div>
                            </td>
                            <td className="p-2">
                              {inscrito.carnet
                                ? <Badge variant="outline" className="font-mono text-xs">{inscrito.carnet}</Badge>
                                : <span className="text-muted-foreground text-xs">—</span>}
                            </td>
                            <td className="p-2">
                              <span className="font-medium">{inscrito.programa_abreviatura || inscrito.programa_nombre}</span>
                              {inscrito.programa_abreviatura && (
                                <div className="text-xs text-muted-foreground">{inscrito.programa_nombre}</div>
                              )}
                            </td>
                            <td className="p-2 text-center">{inscrito.duracion_meses}</td>
                            <td className="p-2 text-right font-mono">
                              {inscrito.monto_inscripcion != null
                                ? `Q${Number(inscrito.monto_inscripcion).toLocaleString('es-GT', {minimumFractionDigits: 2})}`
                                : '—'}
                            </td>
                            <td className="p-2 text-center text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(inscrito.fecha_inscripcion).toLocaleDateString('es-GT')}
                            </td>
                            {inscritosEsAdmin && (
                              <td className="p-2 text-sm">{inscrito.asesor_nombre}</td>
                            )}
                            <td className="p-2 text-center">
                              <button
                                onClick={() => { window.location.href = `/gestion?prospectoId=${inscrito.prospecto_id}` }}
                                className="text-xs text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
                              >
                                Ver
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {inscritosMes.length > inscritosPerPage && (
                  <PaginationControls
                    currentPage={inscritosPagina}
                    totalPages={Math.ceil(inscritosMes.length / inscritosPerPage)}
                    onPageChange={setInscritosPagina}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Widget: Últimos carnets generados */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Últimos carnets generados
            </CardTitle>
            <CardDescription>
              Sistema: {ultimosCarnetsTotal} carnet{ultimosCarnetsTotal !== 1 ? 's' : ''} en {new Date().getFullYear()}
              {ultimosCarnetsSiguiente && (
                <span className="ml-2 text-emerald-600 font-medium">
                  · Siguiente: <strong>{ultimosCarnetsSiguiente}</strong>
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { cargarUltimosCarnets(ultimosCarnetsPage); cargarUltimosMoodle(ultimosMoodlePage) }}
              disabled={ultimosCarnetsLoading && ultimosMoodleLoading}
              title="Recargar"
            >
              <RefreshCw className={`h-4 w-4 ${(ultimosCarnetsLoading || ultimosMoodleLoading) ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sistema" className="w-full">
            <TabsList className="mb-3 h-8">
              <TabsTrigger value="sistema" className="text-xs px-3">
                Sistema ({ultimosCarnetsTotal})
              </TabsTrigger>
              <TabsTrigger value="moodle" className="text-xs px-3">
                Moodle {ultimosMoodleDisponible ? `(${ultimosMoodleTotal})` : '(no disponible)'}
              </TabsTrigger>
            </TabsList>

            {/* ── Tab Sistema ── */}
            <TabsContent value="sistema">
              {ultimosCarnetsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-9 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : ultimosCarnets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay carnets generados este año todavía
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-2 pr-4 font-medium w-28">Carnet</th>
                        <th className="text-left py-2 font-medium">Nombre</th>
                        <th className="text-right py-2 pl-4 font-medium w-32 hidden sm:table-cell">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ultimosCarnets.map((item) => (
                        <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-2 pr-4">
                            <Badge variant="secondary" className="font-mono text-xs">
                              {item.carnet}
                            </Badge>
                          </td>
                          <td className="py-2 truncate max-w-[200px]">{item.nombre_completo || '—'}</td>
                          <td className="py-2 pl-4 text-xs text-muted-foreground text-right hidden sm:table-cell">
                            {item.updated_at ? new Date(item.updated_at).toLocaleDateString('es-GT') : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {ultimosCarnetsLastPage > 1 && (
                    <PaginationControls
                      currentPage={ultimosCarnetsPage}
                      totalPages={ultimosCarnetsLastPage}
                      onPageChange={(p) => setUltimosCarnetsPage(p)}
                    />
                  )}
                </div>
              )}
            </TabsContent>

            {/* ── Tab Moodle ── */}
            <TabsContent value="moodle">
              {!ultimosMoodleDisponible ? (
                <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 text-orange-400" />
                  <p className="text-sm text-center">Moodle no disponible en este momento</p>
                  <Button variant="outline" size="sm" onClick={() => cargarUltimosMoodle(1)}>
                    <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reintentar
                  </Button>
                </div>
              ) : ultimosMoodleLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-9 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : ultimosMoodle.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay usuarios Moodle registrados este año todavía
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-2 pr-4 font-medium w-32">Usuario</th>
                        <th className="text-left py-2 font-medium">Nombre</th>
                        <th className="text-left py-2 pl-4 font-medium hidden md:table-cell">Email</th>
                        <th className="text-right py-2 pl-4 font-medium w-24 hidden sm:table-cell">Creación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ultimosMoodle.map((item) => (
                        <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-2 pr-4">
                            <Badge
                              variant={item.suspendido ? 'destructive' : 'secondary'}
                              className="font-mono text-xs"
                            >
                              {item.carnet}
                            </Badge>
                          </td>
                          <td className="py-2 truncate max-w-[180px]">{item.nombre_completo || '—'}</td>
                          <td className="py-2 pl-4 text-xs text-muted-foreground truncate max-w-[180px] hidden md:table-cell">
                            {item.email || '—'}
                          </td>
                          <td className="py-2 pl-4 text-xs text-muted-foreground text-right hidden sm:table-cell">
                            {item.fecha_creacion
                              ? new Date(parseInt(item.fecha_creacion) * 1000).toLocaleDateString('es-GT')
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {ultimosMoodleLastPage > 1 && (
                    <PaginationControls
                      currentPage={ultimosMoodlePage}
                      totalPages={ultimosMoodleLastPage}
                      onPageChange={(p) => setUltimosMoodlePage(p)}
                    />
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
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
