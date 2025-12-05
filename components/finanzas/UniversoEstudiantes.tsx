"use client"

/**
 * 🌐 UNIVERSO COMPLETO DE ESTUDIANTES
 * 
 * Muestra TODOS los estudiantes registrados en Moodle (histórico completo)
 * Combinado con información del CRM interno (programas, cuotas, pagos)
 * 
 * Características:
 * - Tabla paginada con paginación del servidor
 * - Filtros: búsqueda por carnet/nombre, programa, estado financiero
 * - Información completa: cursos Moodle, programas CRM, deudas, pagos
 * - Resumen estadístico del universo completo
 * 
 * 🚀 Optimizaciones:
 * - React.memo para evitar re-renders innecesarios
 * - useMemo para cálculos costosos (formateo de montos)
 * - useCallback para funciones que se pasan como props
 */

import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Globe, Search, Users, BookOpen, DollarSign, AlertCircle, CheckCircle, XCircle, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { getUniversoEstudiantes, getUniversoProgramas, getUniversoEstadisticas } from "@/services/finance"

interface Estudiante {
  carnet: string
  vinculado: boolean
  fuente: 'CRM_MOODLE' | 'SOLO_MOODLE' | 'SOLO_CRM'
  moodle?: {
    carnet: string
    nombre_completo: string
    correo: string
    telefono: string
    plan_estudio: string
    total_cursos_activos: number
    primera_matricula: string | null // 🆕 Fecha cuando fue creado en Moodle
    ultimo_acceso: string | null
    estado_moodle: string
    suspended: number // 0=Activo, 1=Suspendido
    status_personalizado: string | null // Activo, Graduado, Inactivo, Suspendido
  } | null
  crm?: {
    carnet: string
    nombre_completo: string
    correo: string
    telefono: string
    programa_mas_reciente?: {
      id: number
      nombre: string
      abreviatura: string
      fecha_inicio: string
      cuota_mensual: number
    } | null
    prospecto_id: number | null
  } | null
  financiero: {
    mensualidad_estimada: number
    estado_financiero: 'MOROSO' | 'AL_DIA' | 'PAGADO_COMPLETO' | 'PAGO_PARCIAL' | 'SIN_PROGRAMA' | 'NO_EN_CRM'
    total_deuda: number
    total_pagado: number
    cuotas_pendientes: number
    cuotas_pagadas: number
    mora_total: number
    meses_atrasados: number
    ultimo_pago?: {
      fecha: string
      monto: number
      boleta: string
    } | null
  }
}

interface Summary {
  total_estudiantes: number
  morosos: number
  al_dia: number
  activos_moodle?: number
  suspendidos_moodle?: number
  estudiantes_por_programa?: Record<string, number | {total: number, activos: number, suspendidos?: number, inactivos?: number}>
}

export function UniversoEstudiantes() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [summary, setSummary] = useState<Summary>({
    total_estudiantes: 0,
    morosos: 0,
    al_dia: 0,
    activos_moodle: 0,
    suspendidos_moodle: 0,
    estudiantes_por_programa: {},
  })
  
  // 🆕 Estadísticas GLOBALES (no dependen de la página)
  const [estadisticasGlobales, setEstadisticasGlobales] = useState<Summary | null>(null)
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [search, setSearch] = useState("")
  const [estadoFiltro, setEstadoFiltro] = useState<string>("todos")
  const [estadoReal, setEstadoReal] = useState<string>("todos") // Estado combinado: activo_normal, activo_pausado, graduado, suspendido, inactivo
  const [searchInput, setSearchInput] = useState("")
  const [programaMoodle, setProgramaMoodle] = useState<string>("todos") // 🆕 Filtro programa Moodle
  const [programaCRM, setProgramaCRM] = useState<string>("todos") // 🆕 Filtro programa CRM
  
  // 🆕 Listas de programas disponibles
  const [programasMoodle, setProgramasMoodle] = useState<string[]>([])
  const [programasCRM, setProgramasCRM] = useState<{id: number, nombre: string, abreviatura: string}[]>([])
  
  // 🆕 Cargar programas Y estadísticas globales al montar
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        // Cargar programas
        const responseProgs = await getUniversoProgramas()
        if (responseProgs.success) {
          setProgramasMoodle(responseProgs.programas_moodle || [])
          setProgramasCRM(responseProgs.programas_crm || [])
        }
        
        // 🆕 Cargar estadísticas GLOBALES (todos los estudiantes)
        setLoadingEstadisticas(true)
        const responseStats = await getUniversoEstadisticas()
        if (responseStats.success !== false) {
          setEstadisticasGlobales(responseStats)
        }
      } catch (err) {
        console.error("Error cargando datos iniciales:", err)
      } finally {
        setLoadingEstadisticas(false)
      }
    }
    cargarDatosIniciales()
  }, [])

  // 🚀 Debounce para búsqueda (evita llamadas excesivas al backend)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 500) // Espera 500ms después de que el usuario deja de escribir

    return () => clearTimeout(timeoutId)
  }, [searchInput])

  // Paginación
  const [page, setPage] = useState(1)
  const [perPage] = useState(50)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const cargarDatos = async () => {
    try {
      setLoading(true)
      setError(null)

      const params: any = {
        page,
        per_page: perPage,
      }

      if (search) params.search = search
      if (estadoFiltro !== "todos") {
        // Mapear estado del frontend al formato del backend
        const estadoMap: Record<string, string> = {
          'moroso': 'MOROSO',
          'al_dia': 'AL_DIA',
          'sin_programa': 'SIN_PROGRAMA'
        }
        params.estado_financiero = estadoMap[estadoFiltro] || estadoFiltro
      }
      
      // 🎯 Mapear estado real a suspended + status_personalizado
      if (estadoReal !== "todos") {
        switch (estadoReal) {
          case 'activo_normal':
            params.suspended = '0'
            params.status_personalizado = 'Activo'
            break
          case 'activo_pausado':
            params.suspended = '1'
            params.status_personalizado = 'Activo'
            break
          case 'graduado':
            params.suspended = '1'
            params.status_personalizado = 'Graduado'
            break
          case 'suspendido':
            params.suspended = '1'
            params.status_personalizado = 'Suspendido'
            break
          case 'inactivo':
            params.suspended = '1'
            params.status_personalizado = 'Inactivo'
            break
          case 'sin_estado':
            params.status_personalizado = 'SIN_ESTADO'
            break
        }
      }
      
      // 🆕 Filtro por programa de Moodle
      if (programaMoodle !== "todos") {
        params.programa_moodle = programaMoodle
      }
      
      // 🆕 Filtro por programa del CRM
      if (programaCRM !== "todos") {
        params.programa_crm_id = programaCRM
      }

      const response = await getUniversoEstudiantes(params)

      if (response.success) {
        // ✅ Mapear datos del backend a la estructura esperada
        const estudiantesMapeados = (response.data || []).map((est: any) => ({
          carnet: est.carnet || '',
          vinculado: est.vinculado || false,
          fuente: est.fuente || 'SOLO_MOODLE',
          moodle: est.moodle || null,
          crm: est.crm || null,
          financiero: est.financiero || {
            mensualidad_estimada: 0,
            estado_financiero: 'NO_EN_CRM',
            total_deuda: 0,
            total_pagado: 0,
            cuotas_pendientes: 0,
            cuotas_pagadas: 0,
            mora_total: 0,
            meses_atrasados: 0,
            ultimo_pago: null,
          },
        }))
        
        setEstudiantes(estudiantesMapeados)
        // ✅ Asegurar que summary siempre tenga valores por defecto
        setSummary({
          total_estudiantes: response.summary?.total_estudiantes || 0,
          morosos: response.summary?.morosos || 0,
          al_dia: response.summary?.al_dia || 0,
          activos_moodle: response.summary?.activos_moodle || 0,
          suspendidos_moodle: response.summary?.suspendidos_moodle || 0,
          estudiantes_por_programa: response.summary?.estudiantes_por_programa || {},
        })
        setTotal(response.pagination?.total || 0)
        setTotalPages(response.pagination?.last_page || 1)
      } else {
        setError(response.message || "Error al cargar datos")
      }
    } catch (err: any) {
      console.error("Error cargando universo de estudiantes:", err)
      setError(err?.message || "Error al cargar el universo de estudiantes")
    } finally {
      setLoading(false)
    }
  }

  // 🚀 useCallback para memoizar función de carga
  const cargarDatosMemo = useCallback(cargarDatos, [
    page, 
    perPage,
    search, 
    estadoFiltro, 
    estadoReal,
    programaMoodle, // 🆕
    programaCRM // 🆕
  ])

  useEffect(() => {
    cargarDatosMemo()
  }, [cargarDatosMemo])

  // 🚀 useCallback para memoizar handlers
  const handleSearch = useCallback(() => {
    setSearch(searchInput)
    setPage(1)
  }, [searchInput])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }, [handleSearch])

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'moroso':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Moroso
        </Badge>
      case 'al_dia':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-600">
          <CheckCircle className="h-3 w-3" />
          Al Día
        </Badge>
      case 'sin_programa':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Sin Programa
        </Badge>
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return "N/A"
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // 🚀 useMemo para formatear montos solo cuando cambian
  const formatMonto = useCallback((monto: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ'
    }).format(monto)
  }, [])

  // 🚀 Memoizar porcentajes para evitar cálculos repetidos
  const porcentajeMorosos = useMemo(() => {
    const totalActivos = estadisticasGlobales?.activos_moodle || summary.activos_moodle || 0
    const totalMorosos = estadisticasGlobales?.morosos || summary.morosos || 0
    return totalActivos > 0
      ? ((totalMorosos / totalActivos) * 100).toFixed(1)
      : '0'
  }, [estadisticasGlobales, summary])

  const porcentajeAlDia = useMemo(() => {
    const totalActivos = estadisticasGlobales?.activos_moodle || summary.activos_moodle || 0
    const totalAlDia = estadisticasGlobales?.al_dia || summary.al_dia || 0
    return totalActivos > 0
      ? ((totalAlDia / totalActivos) * 100).toFixed(1)
      : '0'
  }, [estadisticasGlobales, summary])

  return (
    <div className="space-y-6">
      {/* Resumen Estadístico GLOBAL */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingEstadisticas ? '...' : (estadisticasGlobales?.total_estudiantes || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Universo completo (global)</p>
          </CardContent>
        </Card>

        <Card>

          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loadingEstadisticas ? '...' : (estadisticasGlobales?.activos_moodle || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {estadisticasGlobales?.suspendidos_moodle || 0} suspendidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Morosos (mes actual)</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {loadingEstadisticas ? '...' : (estadisticasGlobales?.morosos || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">{porcentajeMorosos}% de activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Al Día (mes actual)</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loadingEstadisticas ? '...' : (estadisticasGlobales?.al_dia || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">{porcentajeAlDia}% de activos</p>
          </CardContent>
        </Card>
      </div>

      {/* 🆕 Estadísticas por Programa/Carrera (datos del CRM) */}
      {estadisticasGlobales?.estudiantes_por_programa && Object.keys(estadisticasGlobales.estudiantes_por_programa).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Estudiantes por Programa/Carrera (CRM)
            </CardTitle>
            <CardDescription>
              Distribución de estudiantes registrados en el CRM por programa académico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Object.entries(estadisticasGlobales.estudiantes_por_programa)
                .filter(([programa]) => programa !== 'TEMP') // Excluir TEMP
                .sort(([,a], [,b]) => {
                  const totalA = typeof a === 'number' ? a : a.total
                  const totalB = typeof b === 'number' ? b : b.total
                  return totalB - totalA
                })
                .map(([programa, datos]) => {
                  const total = typeof datos === 'number' ? datos : datos.total
                  const activos = typeof datos === 'number' ? datos : datos.activos
                  const suspendidos = typeof datos === 'number' ? 0 : (datos.suspendidos || datos.inactivos || 0)
                  // Calcular porcentaje sobre total de estudiantes en CRM (suma de todos los programas, excluyendo TEMP)
                  const totalCRM = Object.entries(estadisticasGlobales.estudiantes_por_programa as Record<string, any>)
                    .filter(([prog]) => prog !== 'TEMP')
                    .reduce((sum: number, [, d]: [string, any]) => {
                      return sum + (typeof d === 'number' ? d : d.total)
                    }, 0 as number)
                  const porcentaje = totalCRM > 0 ? ((total / totalCRM) * 100).toFixed(1) : '0'
                  
                  return (
                    <div key={programa} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" title={programa}>
                          {programa === 'SIN_PROGRAMA' ? 'Sin programa asignado' : programa}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activos} activos {suspendidos > 0 && `• ${suspendidos} susp.`}
                        </p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-lg font-bold">{total.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{porcentaje}%</p>
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros y Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Todos los Estudiantes
          </CardTitle>
          <CardDescription>
            Universo completo de estudiantes registrados en Moodle con información del CRM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Búsqueda */}
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Buscar por carnet, nombre o correo..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSearch} variant="secondary">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>

            {/* Filtro Estado Financiero */}
            <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado financiero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="moroso">Morosos</SelectItem>
                <SelectItem value="al_dia">Al día</SelectItem>
                <SelectItem value="sin_programa">Sin programa</SelectItem>
              </SelectContent>
            </Select>

            {/* 🎯 Filtro Estado Real (Combina suspended + status_personalizado) */}
            <Select value={estadoReal} onValueChange={setEstadoReal}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Estado estudiante" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activo_normal">✅ Activo normal</SelectItem>
                <SelectItem value="activo_pausado">⏸️ Activo pausado</SelectItem>
                <SelectItem value="graduado">🎓 Graduado</SelectItem>
                <SelectItem value="suspendido">🚫 Suspendido</SelectItem>
                <SelectItem value="inactivo">❌ Inactivo/Expulsado</SelectItem>
                <SelectItem value="sin_estado">❓ Sin estado definido</SelectItem>
              </SelectContent>
            </Select>
            
            {/* 🆕 Filtro Programa Moodle (campo city) */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-blue-600 font-medium px-1">📚 Moodle</span>
              <Select value={programaMoodle} onValueChange={(v) => { setProgramaMoodle(v); setPage(1) }}>
                <SelectTrigger className="w-[200px] border-blue-200">
                  <SelectValue placeholder="Plan de estudio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los planes</SelectItem>
                  {programasMoodle.map((prog) => (
                    <SelectItem key={prog} value={prog}>{prog}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* 🆕 Filtro Programa CRM */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-green-600 font-medium px-1">🏢 CRM</span>
              <Select value={programaCRM} onValueChange={(v) => { setProgramaCRM(v); setPage(1) }}>
                <SelectTrigger className="w-[200px] border-green-200">
                  <SelectValue placeholder="Programa académico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los programas</SelectItem>
                  {programasCRM.map((prog) => (
                    <SelectItem key={prog.id} value={prog.id.toString()}>
                      {prog.abreviatura || prog.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Botón Refrescar */}
            <Button onClick={cargarDatos} variant="outline" disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Tabla de Estudiantes */}
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Cargando estudiantes...</span>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Carnet</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="text-center">Status Moodle</TableHead>
                      <TableHead className="text-center">Cursos Moodle</TableHead>
                      <TableHead className="text-center">Programas CRM</TableHead>
                      <TableHead className="text-right">Pagado</TableHead>
                      <TableHead>Primera Matrícula</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estudiantes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No se encontraron estudiantes con los filtros aplicados
                        </TableCell>
                      </TableRow>
                    ) : (
                      estudiantes.map((est) => {
                        const nombre = est.moodle?.nombre_completo || est.crm?.nombre_completo || 'Sin nombre'
                        const correo = est.moodle?.correo || est.crm?.correo || ''
                        const cursosMoodle = est.moodle?.total_cursos_activos || 0
                        const suspended = est.moodle?.suspended ?? null
                        const statusPersonalizado = est.moodle?.status_personalizado || null
                        const planMoodle = est.moodle?.plan_estudio || ''
                        const tienePrograma = !!(est.crm?.programa_mas_reciente || planMoodle) // ✅ CORREGIDO: Moodle O CRM
                        const programaNombre = est.crm?.programa_mas_reciente?.abreviatura || planMoodle || '—'
                        const deuda = est.financiero?.total_deuda || 0 // ✅ Solo cuotas VENCIDAS
                        const pagado = est.financiero?.total_pagado || 0
                        const estadoFinanciero = est.financiero?.estado_financiero || 'NO_EN_CRM'
                        const primeraMatricula = est.moodle?.primera_matricula || null // 🆕 Primera matrícula (fecha creación en Moodle)
                        const matriculadoMes = (est as any).matriculado_mes_actual || false // 🆕 Matriculado mes actual
                        
                        // Mapear estado financiero a formato esperado por getEstadoBadge
                        const estadoBadge = estadoFinanciero === 'MOROSO' ? 'moroso' 
                          : estadoFinanciero === 'AL_DIA' || estadoFinanciero === 'PAGADO_COMPLETO' ? 'al_dia'
                          : estadoFinanciero === 'SIN_PROGRAMA' || estadoFinanciero === 'NO_EN_CRM' ? 'sin_programa'
                          : 'sin_programa'
                        
                        return (
                          <TableRow key={est.carnet}>
                            <TableCell className="font-mono text-sm">{est.carnet}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{nombre}</div>
                                <div className="text-xs text-muted-foreground">{correo}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col gap-1 items-center">
                                {suspended !== null && (
                                  <Badge variant={suspended === 0 ? "default" : "destructive"} className="text-xs">
                                    {suspended === 0 ? "Activo" : "Suspendido"}
                                  </Badge>
                                )}
                                {statusPersonalizado ? (
                                  <Badge variant="outline" className="text-xs">
                                    {statusPersonalizado}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs text-muted-foreground">
                                    Sin estado
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{cursosMoodle}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {tienePrograma ? (
                                <Badge variant="secondary">{programaNombre}</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {pagado > 0 ? (
                                <span className="text-green-600 font-medium">
                                  {formatMonto(pagado)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Q0.00</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatFecha(primeraMatricula)}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {estudiantes.length} de {total.toLocaleString()} estudiantes
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <div className="text-sm">
                    Página {page} de {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
