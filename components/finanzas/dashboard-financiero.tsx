"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { AlertCircle, RefreshCw, LineChart, ArrowUpRight, ArrowDownRight, Shield, Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, BookOpen, Search, X, DollarSign } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { fetchDashboardFinanciero } from "@/services/finance"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import type { DateRange } from "react-day-picker"
import type { DashboardFinancieroData } from "@/types/dashboard"
import { api } from "@/services/api"

// Utilidades de formato seguras
const formatCurrency = (n: unknown) => {
  const num = Number(n ?? 0)
  return `Q ${num.toLocaleString()}`
}

const formatPercent = (n: unknown) => {
  const num = Number(n ?? 0)
  return `${num.toFixed(1)}%`
}

const formatDate = (d?: Date | string) => {
  if (!d) return "—"
  const date = typeof d === 'string' ? new Date(d) : d
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString()
}

// Cálculo de variación porcentual con protección
const calcularCambio = (actual?: number, anterior?: number) => {
  const a = Number(actual ?? 0)
  const b = Number(anterior ?? 0)
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return 0
  return ((a - b) / b) * 100
}

export function DashboardFinanciero() {
  const router = useRouter()
  const firstOfMonth = new Date()
  firstOfMonth.setDate(1)

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: firstOfMonth,
    to: new Date(),
  })

  // 🆕 Selector de mes/año para filtrar estudiantes activos en Moodle
  const [mesSeleccionado, setMesSeleccionado] = useState<number>(new Date().getMonth() + 1)
  const [anioSeleccionado, setAnioSeleccionado] = useState<number>(new Date().getFullYear())

  const [dashboardData, setDashboardData] = useState<DashboardFinancieroData | null>(null)
  const [loading, setLoading] = useState(true)

  // 🆕 Estado para paginación de estudiantes
  const [paginaEstudiantes, setPaginaEstudiantes] = useState<number>(1)
  const [itemsPorPagina, setItemsPorPagina] = useState<number>(20)
  
  // 🆕 Estado para estudiantes expandidos (mostrar cursos)
  const [estudiantesExpandidos, setEstudiantesExpandidos] = useState<Set<string>>(new Set())
  
  // 🆕 Estado para cursos cargados por estudiante
  const [cursosPorEstudiante, setCursosPorEstudiante] = useState<Record<string, any[]>>({})
  const [cargandoCursos, setCargandoCursos] = useState<Set<string>>(new Set())
  
  // 🆕 Estado para deudas calculadas (lazy loading)
  const [deudasCalculadas, setDeudasCalculadas] = useState<Record<string, any>>({})
  const [cargandoDeudas, setCargandoDeudas] = useState<Set<string>>(new Set())
  
  // 🆕 Estado para filtro de búsqueda
  const [filtroBusqueda, setFiltroBusqueda] = useState<string>("")
  
  // 🆕 Estado para filtro por carrera/programa
  const [filtroCarrera, setFiltroCarrera] = useState<string>("todas")
  
  // 🆕 Estado para filtro por cantidad de cursos
  const [filtroCantidadCursos, setFiltroCantidadCursos] = useState<string>("todos")
  
  // 🆕 Estado para filtro por plan de estudio
  const [filtroPlanEstudio, setFiltroPlanEstudio] = useState<string>("todos")

  /**
   * 🔍 Función compartida para filtrar estudiantes
   * Aplica TODOS los filtros activos (búsqueda, carrera, cantidad cursos, plan)
   */
  const filtrarEstudiantes = () => {
    if (!dashboardData?.resumen?.estudiantesActivosDetalle) return []
    
    return dashboardData.resumen.estudiantesActivosDetalle.filter((est: any) => {
      // Filtro de búsqueda
      if (filtroBusqueda.trim()) {
        const busqueda = filtroBusqueda.toLowerCase().trim()
        const carnet = (est.carnet || "").toLowerCase()
        const nombre = (est.nombre_completo || "").toLowerCase()
        const correo = (est.correo || "").toLowerCase()
        const programa = (est.city || "").toLowerCase()
        if (!(carnet.includes(busqueda) || nombre.includes(busqueda) || correo.includes(busqueda) || programa.includes(busqueda))) return false
      }
      
      // Filtro de carrera
      if (filtroCarrera !== 'todas') {
        const programa = (est.city || '').trim().toUpperCase()
        const codigoPrograma = programa.split(/\s+/)[0]
        const normalizarBBA = (codigo: string) => codigo.startsWith('BBA') ? 'BBA' : codigo
        if (normalizarBBA(codigoPrograma) !== normalizarBBA(filtroCarrera)) return false
      }
      
      // Filtro por cantidad de cursos
      if (filtroCantidadCursos !== 'todos') {
        const cantidadCursos = est.total_matriculaciones || 0
        if (filtroCantidadCursos === '1' && cantidadCursos !== 1) return false
        if (filtroCantidadCursos === '2' && cantidadCursos !== 2) return false
        if (filtroCantidadCursos === '3' && cantidadCursos !== 3) return false
        if (filtroCantidadCursos === '4+' && cantidadCursos < 4) return false
      }
      
      // Filtro por plan de estudio
      if (filtroPlanEstudio !== 'todos') {
        const programa = (est.city || '').trim().toUpperCase()
        const planMatch = programa.match(/(20\d{2})/)
        const plan = planMatch ? planMatch[1] : 'DESCONOCIDO'
        if (plan !== filtroPlanEstudio) return false
      }
      
      return true
    })
  }

  /**
   * 💰 Calcular deuda mensual del estudiante
   * Usa datos lazy-loaded del estado deudasCalculadas
   */
  const calcularDeudaMensual = (estudiante: any): number => {
    const carnet = (estudiante.carnet || '').toLowerCase()
    
    // Prioridad 1: Deuda calculada lazy (estado local)
    if (deudasCalculadas[carnet]) {
      return deudasCalculadas[carnet].cuota_mensual || 0
    }
    
    // Prioridad 2: Deuda que pudiera venir del backend (fallback)
    if (estudiante.deuda_calculada && typeof estudiante.deuda_calculada === 'object') {
      return estudiante.deuda_calculada.cuota_mensual || 0
    }
    
    return 0
  }
  const meses = [
    { value: 1, label: "Enero" },
    { value: 2, label: "Febrero" },
    { value: 3, label: "Marzo" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Mayo" },
    { value: 6, label: "Junio" },
    { value: 7, label: "Julio" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Septiembre" },
    { value: 10, label: "Octubre" },
    { value: 11, label: "Noviembre" },
    { value: 12, label: "Diciembre" },
  ]

  const anios = Array.from({ length: 5 }, (_, i) => {
    const anio = new Date().getFullYear() - i
    return { value: anio, label: anio.toString() }
  })

  const loadData = async () => {
    if (!dateRange?.from || !dateRange?.to) return
    
    try {
      setLoading(true)
      const data = await fetchDashboardFinanciero({
        fecha_inicio: dateRange.from.toISOString(),
        fecha_fin: dateRange.to.toISOString(),
        mes: mesSeleccionado,
        anio: anioSeleccionado,
        limit_pagos: 10,
        limit_alertas: 20,
      })
      setDashboardData(data)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast({
        title: "Error",
        description: "No se pudo cargar el resumen financiero",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // Resetear paginación cuando cambia el mes/año
    setPaginaEstudiantes(1)
    setEstudiantesExpandidos(new Set())
    setCursosPorEstudiante({})
    setDeudasCalculadas({}) // Resetear deudas calculadas
    setFiltroBusqueda("") // Resetear filtro al cambiar mes/año
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesSeleccionado, anioSeleccionado])

  // Resetear a página 1 cuando cambia itemsPorPagina
  useEffect(() => {
    setPaginaEstudiantes(1)
  }, [itemsPorPagina])

  // 🚀 NUEVO: Calcular deudas en batch de estudiantes visibles
  useEffect(() => {
    if (!dashboardData?.resumen?.estudiantesActivosDetalle) return
    
    // Usar función compartida de filtrado
    const estudiantesFiltrados = filtrarEstudiantes()
    
    // Obtener estudiantes de la página actual
    const estudiantesPaginados = estudiantesFiltrados.slice(
      itemsPorPagina === Infinity ? 0 : (paginaEstudiantes - 1) * itemsPorPagina,
      itemsPorPagina === Infinity ? estudiantesFiltrados.length : paginaEstudiantes * itemsPorPagina
    )
    
    // Calcular deudas solo de estudiantes visibles que NO estén ya calculadas
    const carnetsParaCalcular = estudiantesPaginados
      .map((est: any) => (est.carnet || '').toLowerCase())
      .filter((carnet: string) => carnet && !deudasCalculadas[carnet] && !cargandoDeudas.has(carnet))
    
    if (carnetsParaCalcular.length > 0) {
      // Marcar como cargando
      setCargandoDeudas(prev => {
        const nuevo = new Set(prev)
        carnetsParaCalcular.forEach((c: string) => nuevo.add(c))
        return nuevo
      })
      
      // 🚀 SUPER OPTIMIZADO: 1 sola llamada batch en lugar de 20 individuales
      // Reduce network overhead de 20 round-trips HTTP a 1 solo
      api.post('/dashboard-financiero/deudas-batch', {
        carnets: carnetsParaCalcular,
        mes: mesSeleccionado,
        anio: anioSeleccionado
      }, {
        timeout: 15000 // 15 segundos para batch
      })
      .then((response) => {
        if (response.data.success && response.data.deudas) {
          const nuevasDeudas: Record<string, any> = {}
          
          // Mapear resultados del batch
          Object.entries(response.data.deudas).forEach(([carnet, deuda]) => {
            nuevasDeudas[carnet.toLowerCase()] = deuda
          })
          
          setDeudasCalculadas(prev => ({ ...prev, ...nuevasDeudas }))
        }
      })
      .catch((error) => {
        console.error('Error calculando deudas en batch:', error)
      })
      .finally(() => {
        // Limpiar estado de carga
        setCargandoDeudas(prev => {
          const nuevo = new Set(prev)
          carnetsParaCalcular.forEach((c: string) => nuevo.delete(c))
          return nuevo
        })
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginaEstudiantes, itemsPorPagina, filtroBusqueda, filtroCarrera, filtroCantidadCursos, filtroPlanEstudio, dashboardData])

  // 🆕 Función para navegar entre meses
  const navegarMes = (direccion: 'anterior' | 'siguiente') => {
    if (direccion === 'anterior') {
      if (mesSeleccionado === 1) {
        setMesSeleccionado(12)
        setAnioSeleccionado(anioSeleccionado - 1)
      } else {
        setMesSeleccionado(mesSeleccionado - 1)
      }
    } else {
      if (mesSeleccionado === 12) {
        setMesSeleccionado(1)
        setAnioSeleccionado(anioSeleccionado + 1)
      } else {
        setMesSeleccionado(mesSeleccionado + 1)
      }
    }
  }

  const obtenerCursosEstudiante = async (carnet: string) => {
    const carnetNormalizado = carnet.toLowerCase()
    if (cursosPorEstudiante[carnetNormalizado]) {
      return // Ya están cargados
    }

    setCargandoCursos(prev => new Set(prev).add(carnetNormalizado))
    
    try {
      const response = await api.get('/moodle/consultas/cursos-estudiante', {
        params: {
          carnet: carnet,
          mes: mesSeleccionado,
          anio: anioSeleccionado
        }
      })

      const responseData = response.data.data || response.data
      const cursosData = responseData.cursos || responseData.data || responseData || []
      const success = responseData.success !== false
      
      if (success) {
        setCursosPorEstudiante(prev => ({
          ...prev,
          [carnetNormalizado]: Array.isArray(cursosData) ? cursosData : []
        }))
      } else {
        setCursosPorEstudiante(prev => ({
          ...prev,
          [carnetNormalizado]: []
        }))
      }
    } catch (error: any) {
      console.error(`[Dashboard] Error cargando cursos para ${carnet}:`, error)
    } finally {
      setCargandoCursos(prev => {
        const nuevo = new Set(prev)
        nuevo.delete(carnetNormalizado)
        return nuevo
      })
    }
  }

  // 🆕 Función para expandir/colapsar estudiante
  const toggleEstudiante = (carnet: string) => {
    const carnetNormalizado = carnet.toLowerCase()
    const nuevoExpandidos = new Set(estudiantesExpandidos)
    if (nuevoExpandidos.has(carnetNormalizado)) {
      nuevoExpandidos.delete(carnetNormalizado)
    } else {
      nuevoExpandidos.add(carnetNormalizado)
      // Solo cargar cursos (deuda ya viene del backend)
      obtenerCursosEstudiante(carnetNormalizado)
    }
    setEstudiantesExpandidos(nuevoExpandidos)
  }

  const handleRefresh = () => {
    if (!dateRange?.from || !dateRange?.to) return
    fetchDashboardFinanciero({
      fecha_inicio: dateRange.from.toISOString(),
      fecha_fin: dateRange.to.toISOString(),
      mes: mesSeleccionado,
      anio: anioSeleccionado,
      limit_pagos: 10,
      limit_alertas: 20,
    })
      .then(setDashboardData)
      .catch(() => toast({ title: 'Error', description: 'No se pudo cargar el resumen financiero' }))
  }

  const handleDateRangeChange = async (range: DateRange | undefined) => {
    setDateRange(range)
    if (range?.from && range?.to) {
      try {
        setLoading(true)
        const data = await fetchDashboardFinanciero({
          fecha_inicio: range.from.toISOString(),
          fecha_fin: range.to.toISOString(),
          limit_pagos: 10,
          limit_alertas: 20,
        })
        setDashboardData(data)
      } catch (error) {
        console.error('Error loading dashboard:', error)
        toast({ title: 'Error', description: 'No se pudo cargar el resumen financiero' })
      } finally {
        setLoading(false)
      }
    }
  }

  // Helpers de UI para badges de variación
  const VariationBadge = ({
    value,
    invert = false,
  }: {
    value: number
    invert?: boolean
  }) => {
    const isUp = value > 0
    const good = invert ? !isUp : isUp
    const Icon = isUp ? ArrowUpRight : ArrowDownRight
    const klass = good ? "bg-green-500 text-xs" : "text-xs"
    const variant = good ? undefined : "destructive" as const
    return (
      <Badge className={klass} variant={variant}>
        <Icon className="h-3 w-3 mr-1" />
        {Math.abs(value).toFixed(1)}%
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando dashboard financiero...</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de carga</AlertTitle>
          <AlertDescription>
            No se pudo cargar la información del dashboard. Intente recargar la página.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const { resumen, pagosRecientes, alertasMorosidad, morosidadPorPrograma } = dashboardData

  // Valores de variación calculados
  const varIngresos = calcularCambio(resumen.ingresosMensuales, resumen.ingresosMesAnterior)
  const varMorosidad = calcularCambio(resumen.tasaMorosidad, resumen.tasaMorosidadAnterior)
  const varRecaudPend = calcularCambio(resumen.recaudacionPendiente, resumen.recaudacionPendienteAnterior)
  const varEstActivos = calcularCambio(resumen.estudiantesActivos, resumen.estudiantesActivosAnterior)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Financiero</h2>
          <p className="text-muted-foreground">Análisis y métricas financieras de la institución</p>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtrar por mes:</span>
            <Select
              value={mesSeleccionado.toString()}
              onValueChange={(value) => {
                setMesSeleccionado(parseInt(value))
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {meses.map((mes) => (
                  <SelectItem key={mes.value} value={mes.value.toString()}>
                    {mes.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={anioSeleccionado.toString()}
              onValueChange={(value) => {
                setAnioSeleccionado(parseInt(value))
              }}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {anios.map((anio) => (
                  <SelectItem key={anio.value} value={anio.value.toString()}>
                    {anio.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Botón mes anterior */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => navegarMes('anterior')}
              title="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* Botón mes siguiente */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => navegarMes('siguiente')}
              title="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleRefresh} title="Actualizar">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos Mensuales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(resumen.ingresosMensuales)}</div>
            <div className="flex items-center mt-1">
              <VariationBadge value={varIngresos} />
              <span className="text-xs text-muted-foreground ml-2">vs. mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de Morosidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(resumen.tasaMorosidad)}</div>
            <div className="flex items-center mt-1">
              <VariationBadge value={varMorosidad} invert />
              <span className="text-xs text-muted-foreground ml-2">vs. mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recaudación Pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(resumen.recaudacionPendiente)}</div>
            <div className="flex items-center mt-1">
              <VariationBadge value={varRecaudPend} invert />
              <span className="text-xs text-muted-foreground ml-2">vs. mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estudiantes Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen.estudiantesActivos}</div>
            <div className="flex items-center mt-1">
              <VariationBadge value={varEstActivos} />
              <span className="text-xs text-muted-foreground ml-2">vs. mes anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/*  NUEVA SECCIÓN: Lista de Estudiantes Activos desde Moodle con Paginación */}
      {resumen.estudiantesActivosDetalle && resumen.estudiantesActivosDetalle.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Estudiantes Activos en Moodle - {meses.find(m => m.value === mesSeleccionado)?.label} {anioSeleccionado}</CardTitle>
                <CardDescription>
                  {resumen.estudiantesActivos} estudiantes con cursos matriculados este mes
                </CardDescription>
              </div>
              {/* ✅ Recaudación mensual estimada (calculada dinámicamente según filtros) */}
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(
                    filtrarEstudiantes().reduce((sum, est) => sum + calcularDeudaMensual(est), 0)
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Recaudación mensual estimada
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filtros de búsqueda, carrera, cantidad de cursos y plan de estudio */}
            <div className="mb-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Filtro de búsqueda */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por carnet, nombre, correo o programa..."
                    value={filtroBusqueda}
                    onChange={(e) => {
                      setFiltroBusqueda(e.target.value)
                      setPaginaEstudiantes(1)
                    }}
                    className="pl-10 pr-10"
                  />
                  {filtroBusqueda && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                      onClick={() => {
                        setFiltroBusqueda("")
                        setPaginaEstudiantes(1)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {/* Filtro por carrera */}
                <div className="w-full sm:w-[220px]">
                  <Select
                    value={filtroCarrera}
                    onValueChange={(value) => {
                      setFiltroCarrera(value)
                      setPaginaEstudiantes(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por programa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">📚 Todas las carreras</SelectItem>
                      <SelectItem value="BBA">🎓 BBA</SelectItem>
                      <SelectItem value="MBA">🎓 MBA</SelectItem>
                      <SelectItem value="MFIN">💰 MFIN</SelectItem>
                      <SelectItem value="MMKD">📱 MMKD</SelectItem>
                      <SelectItem value="MLDO">👥 MLDO</SelectItem>
                      <SelectItem value="MHHRR">👔 MHHRR</SelectItem>
                      <SelectItem value="MPM">📊 MPM</SelectItem>
                      <SelectItem value="PMP">🏆 PMP</SelectItem>
                      <SelectItem value="DESCONOCIDO">❓ Desconocido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* ✅ NUEVO: Filtro por cantidad de cursos */}
                <div className="w-full sm:w-[180px]">
                  <Select
                    value={filtroCantidadCursos}
                    onValueChange={(value) => {
                      setFiltroCantidadCursos(value)
                      setPaginaEstudiantes(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Cantidad de cursos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los cursos</SelectItem>
                      <SelectItem value="1">1 curso</SelectItem>
                      <SelectItem value="2">2 cursos</SelectItem>
                      <SelectItem value="3">3 cursos</SelectItem>
                      <SelectItem value="4+">4+ cursos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* ✅ NUEVO: Filtro por plan de estudio */}
                <div className="w-full sm:w-[160px]">
                  <Select
                    value={filtroPlanEstudio}
                    onValueChange={(value) => {
                      setFiltroPlanEstudio(value)
                      setPaginaEstudiantes(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Plan de estudio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los planes</SelectItem>
                      {(() => {
                        // Extraer planes únicos de los estudiantes
                        const planesUnicos = new Set<string>()
                        resumen.estudiantesActivosDetalle.forEach((est: any) => {
                          const programa = (est.city || '').trim().toUpperCase()
                          const planMatch = programa.match(/(20\d{2})/)
                          if (planMatch) planesUnicos.add(planMatch[1])
                        })
                        return Array.from(planesUnicos).sort().reverse().map(plan => (
                          <SelectItem key={plan} value={plan}>Plan {plan}</SelectItem>
                        ))
                      })()}
                      <SelectItem value="DESCONOCIDO">Sin plan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Indicadores de filtros activos */}
              {(filtroBusqueda.trim() || filtroCarrera !== 'todas' || filtroCantidadCursos !== 'todos' || filtroPlanEstudio !== 'todos') && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                  <span>Filtros activos:</span>
                  {filtroBusqueda.trim() && (
                    <Badge variant="secondary" className="gap-1">
                      Búsqueda: {filtroBusqueda}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setFiltroBusqueda("")} />
                    </Badge>
                  )}
                  {filtroCarrera !== 'todas' && (
                    <Badge variant="secondary" className="gap-1">
                      Carrera: {filtroCarrera}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setFiltroCarrera("todas")} />
                    </Badge>
                  )}
                  {filtroCantidadCursos !== 'todos' && (
                    <Badge variant="secondary" className="gap-1">
                      Cursos: {filtroCantidadCursos}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setFiltroCantidadCursos("todos")} />
                    </Badge>
                  )}
                  {filtroPlanEstudio !== 'todos' && (
                    <Badge variant="secondary" className="gap-1">
                      Plan: {filtroPlanEstudio}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setFiltroPlanEstudio("todos")} />
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => {
                      setFiltroBusqueda("")
                      setFiltroCarrera("todas")
                      setFiltroCantidadCursos("todos")
                      setFiltroPlanEstudio("todos")
                      setPaginaEstudiantes(1)
                    }}
                  >
                    Limpiar todo
                  </Button>
                </div>
              )}
            </div>

            {/* Paginación */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Mostrar:</span>
                <Select
                  value={itemsPorPagina === Infinity ? "all" : itemsPorPagina.toString()}
                  onValueChange={(value) => {
                    if (value === "all") {
                      setItemsPorPagina(Infinity)
                      setPaginaEstudiantes(1)
                    } else {
                      setItemsPorPagina(parseInt(value))
                      setPaginaEstudiantes(1)
                    }
                  }}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="all">Todos</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                  {(() => {
                    const estudiantesFiltrados = filtrarEstudiantes()
                    const totalFiltrados = estudiantesFiltrados.length
                    const hayFiltros = filtroBusqueda.trim() || filtroCarrera !== 'todas' || filtroCantidadCursos !== 'todos' || filtroPlanEstudio !== 'todos'
                    
                    if (itemsPorPagina === Infinity) {
                      return `Mostrando todos los ${totalFiltrados} estudiantes${hayFiltros ? ' (filtrados)' : ''}`
                    }
                    
                    const inicio = ((paginaEstudiantes - 1) * itemsPorPagina) + 1
                    const fin = Math.min(paginaEstudiantes * itemsPorPagina, totalFiltrados)
                    return `Mostrando ${inicio} - ${fin} de ${totalFiltrados} estudiantes${hayFiltros ? ' (filtrados)' : ''}`
                  })()}
                </span>
              </div>
              {itemsPorPagina !== Infinity && (() => {
                const estudiantesFiltrados = filtrarEstudiantes()
                const totalFiltrados = estudiantesFiltrados.length
                const totalPaginas = Math.ceil(totalFiltrados / itemsPorPagina)
                
                return (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaEstudiantes(prev => Math.max(1, prev - 1))}
                      disabled={paginaEstudiantes === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    <span className="flex items-center px-3 text-sm">
                      Página {paginaEstudiantes} de {totalPaginas}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaEstudiantes(prev => Math.min(totalPaginas, prev + 1))}
                      disabled={paginaEstudiantes >= totalPaginas}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )
              })()}
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Carnet</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Programa</TableHead>
                    <TableHead className="text-center">Cursos</TableHead>
                    <TableHead className="text-right">Mensualidad</TableHead>
                    <TableHead>Primera Matrícula</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    // Usar función compartida de filtrado
                    const estudiantesFiltrados = filtrarEstudiantes()
                    const totalFiltrados = estudiantesFiltrados.length
                    const estudiantesPaginados = estudiantesFiltrados.slice(
                      itemsPorPagina === Infinity 
                        ? 0 
                        : (paginaEstudiantes - 1) * itemsPorPagina, 
                      itemsPorPagina === Infinity 
                        ? estudiantesFiltrados.length 
                        : paginaEstudiantes * itemsPorPagina
                    )
                    
                    const hayFiltros = filtroBusqueda.trim() || filtroCarrera !== 'todas' || filtroCantidadCursos !== 'todos' || filtroPlanEstudio !== 'todos'
                    
                    if (estudiantesPaginados.length === 0 && hayFiltros) {
                      return (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No se encontraron estudiantes con los filtros aplicados
                          </TableCell>
                        </TableRow>
                      )
                    }
                    
                    return estudiantesPaginados.map((estudiante: any, idx: number) => {
                      const carnet = (estudiante.carnet || `est-${idx}`).toLowerCase()
                      const estaExpandido = estudiantesExpandidos.has(carnet)
                      const cursos = cursosPorEstudiante[carnet] || []
                      const cargando = cargandoCursos.has(carnet)
                      const cargandoDeuda = cargandoDeudas.has(carnet)
                      const deudaMensual = calcularDeudaMensual(estudiante)
                      
                      return (
                        <React.Fragment key={carnet}>
                          <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleEstudiante(carnet)}>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                {estaExpandido ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{carnet}</TableCell>
                            <TableCell className="font-medium">{estudiante.nombre_completo}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{estudiante.correo || '—'}</TableCell>
                            <TableCell>
                              {estudiante.city ? (
                                <Badge variant="outline">{estudiante.city}</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge>{estudiante.total_matriculaciones || 0}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {cargandoDeuda ? (
                                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground mx-auto" />
                              ) : deudaMensual > 0 ? (
                                <span className="font-semibold text-sm">
                                  {formatCurrency(deudaMensual)}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs">{formatDate(estudiante.primera_matricula)}</TableCell>
                          </TableRow>
                          
                          {/* Fila expandida con cursos */}
                          {estaExpandido && (
                            <TableRow>
                              <TableCell colSpan={8} className="bg-muted/30 p-4">
                                <div className="space-y-4">
                                  {/* 📚 Lista de cursos */}
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-semibold text-sm">Cursos Matriculados ({cursos.length})</span>
                                    </div>
                                    
                                    {cargando ? (
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Cargando cursos...
                                      </div>
                                    ) : cursos.length > 0 ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {cursos.map((curso: any, cursoIdx: number) => (
                                          <div
                                            key={cursoIdx}
                                            className="p-3 bg-background border rounded-md hover:bg-muted/50 transition-colors"
                                          >
                                            <div className="font-medium text-sm">{curso.fullname || curso.nombre || 'Curso sin nombre'}</div>
                                            {curso.shortname && (
                                              <div className="text-xs text-muted-foreground mt-1">{curso.shortname}</div>
                                            )}
                                            {curso.category && (
                                              <Badge variant="outline" className="mt-2 text-xs">
                                                {curso.category}
                                              </Badge>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-sm text-muted-foreground">
                                        No se encontraron cursos para este estudiante en este mes.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      )
                    })
                  })()}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Pagos Recientes</CardTitle>
            <CardDescription>Últimos pagos registrados en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagosRecientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Sin datos
                    </TableCell>
                  </TableRow>
                ) : (
                  pagosRecientes.map((pago) => (
                    <TableRow key={pago.id}>
                      <TableCell className="font-medium">{pago.estudiante}</TableCell>
                      <TableCell>{pago.concepto}</TableCell>
                      <TableCell>{formatDate(pago.fecha)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(pago.monto)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => {
              router.push('/finanzas/reportes')
            }}>
              Ver todos los pagos
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas de Morosidad</CardTitle>
            <CardDescription>Estudiantes con pagos vencidos críticos</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Programa</TableHead>
                  <TableHead>Días Vencidos</TableHead>
                  <TableHead className="text-right">Monto + Mora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertasMorosidad.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Sin datos
                    </TableCell>
                  </TableRow>
                ) : (
                  alertasMorosidad.map((alerta) => (
                    <TableRow key={alerta.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {alerta.estudiante}
                          {alerta.serviciosBloqueados.length > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Bloqueado
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{alerta.programa}</TableCell>
                      <TableCell>
                        <Badge
                          variant={alerta.diasVencidos > 30 ? "destructive" : "outline"}
                          className="text-xs"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {alerta.diasVencidos} días
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-red-500">
                          <div className="font-medium">{formatCurrency(alerta.montoVencido)}</div>
                          {alerta.montoMora > 0 && (
                            <div className="text-xs text-muted-foreground">
                              +{formatCurrency(alerta.montoMora)} mora
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => {
              router.push('/finanzas/gestion-pagos')
            }}>
              Ver todas las alertas
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Información importante</AlertTitle>
        <AlertDescription>
          Los datos mostrados en este dashboard corresponden al período del {formatDate(dateRange?.from)} al {formatDate(dateRange?.to)}. 
          {dashboardData.configuracionMora && (
            <span>
              {' '}Mora: {dashboardData.configuracionMora.porcentaje_mora}% mensual
              {dashboardData.configuracionMora.dias_gracia > 0 && ` (con ${dashboardData.configuracionMora.dias_gracia} días de gracia)`}.
            </span>
          )}
        </AlertDescription>
      </Alert>
    </div>
  )
}