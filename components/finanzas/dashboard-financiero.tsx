"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { AlertCircle, RefreshCw, LineChart, ArrowUpRight, ArrowDownRight, Shield, Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, BookOpen, Search, X, DollarSign, Download } from "lucide-react"
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select"
import { SimpleDateRangePicker, type DateRange as DateRangeType } from "@/components/ui/simple-date-range-picker"
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

  // Array de nombres de meses
  const mesNombres = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]

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
  
  // 🆕 Estado para filtro por carrera/programa (selección múltiple)
  const [filtroCarrera, setFiltroCarrera] = useState<string[]>([])
  
  // 🆕 Estado para filtro por cantidad de cursos (selección múltiple)
  const [filtroCantidadCursos, setFiltroCantidadCursos] = useState<string[]>([])
  
  // 🆕 Estado para filtro por plan de estudio (selección múltiple)
  const [filtroPlanEstudio, setFiltroPlanEstudio] = useState<string[]>([])
  
  // 🆕 Estado para filtro de estado de pago (selección múltiple)
  const [filtroEstadoPago, setFiltroEstadoPago] = useState<string[]>([])
  
  // 🆕 Estado para filtro de rango de fechas de pagos
  const [filtroRangoFechasPagos, setFiltroRangoFechasPagos] = useState<DateRange | undefined>(undefined)
  
  // 🆕 Estado para filtro de días hacia atrás
  const [filtroDiasAtras, setFiltroDiasAtras] = useState<number | null>(null)
  
  // 🆕 Estado para almacenar el estado de pago de cada estudiante
  const [estadoPagos, setEstadoPagos] = useState<Record<string, any>>({})
  const [cargandoEstadoPagos, setCargandoEstadoPagos] = useState(false)
  
  // 🆕 Estado para filtro por asesor asignado (selección múltiple)
  const [filtroAsesor, setFiltroAsesor] = useState<string[]>([])
  
  // 🆕 Estado para almacenar información de asesores por estudiante
  const [asesoresPorEstudiante, setAsesoresPorEstudiante] = useState<Record<string, { id: number; nombre: string } | null>>({})
  
  // 🆕 Estado para lista de asesores disponibles
  const [asesoresDisponibles, setAsesoresDisponibles] = useState<Array<{ id: number; name: string }>>([])

  /**
   * 🔍 Extraer todas las variantes de BBA que existen en los datos
   * Detecta dinámicamente todas las variantes de BBA desde los datos de Moodle
   */
  const obtenerVariantesBBA = (): string[] => {
    if (!dashboardData?.resumen?.estudiantesActivosDetalle) return []
    
    const variantesBBA = new Set<string>()
    
    dashboardData.resumen.estudiantesActivosDetalle.forEach((est: any) => {
      const programa = (est.city || '').trim().toUpperCase()
      
      // Si el programa empieza con BBA, agregarlo a las variantes
      if (/^BBA/i.test(programa)) {
        // Normalizar: quitar años (2024, 2025, etc.) para agrupar mejor
        const programaNormalizado = programa.replace(/\s*\d{4}\s*$/, '').trim()
        if (programaNormalizado) {
          variantesBBA.add(programaNormalizado)
        }
        // También agregar la versión original completa
        variantesBBA.add(programa)
      }
    })
    
    // Ordenar: primero "BBA" solo, luego las demás alfabéticamente
    const variantesArray = Array.from(variantesBBA).sort((a, b) => {
      if (a === 'BBA') return -1
      if (b === 'BBA') return 1
      return a.localeCompare(b)
    })
    
    return variantesArray
  }

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
      
      // Filtro de carrera con regex para BBA (captura TODA la familia de BBA) - SELECCIÓN MÚLTIPLE
      if (filtroCarrera.length > 0) {
        const programa = (est.city || '').trim().toUpperCase()
        let matchesAny = false
        
        for (const filtro of filtroCarrera) {
          // Si el filtro es "BBA" o cualquier variante de BBA, usar regex
          if (filtro.startsWith('BBA') || filtro === 'BBA') {
            // Si es una variante específica (ej: "BBA CM"), hacer match exacto (sin año)
            if (filtro !== 'BBA') {
              // Normalizar ambos para comparar (quitar años y espacios extra)
              const programaNormalizado = programa.replace(/\s*\d{4}\s*$/, '').trim().replace(/\s+/g, ' ')
              const filtroNormalizado = filtro.replace(/\s+/g, ' ')
              
              // Comparar con y sin espacios
              const programaSinEspacios = programaNormalizado.replace(/\s+/g, '')
              const filtroSinEspacios = filtroNormalizado.replace(/\s+/g, '')
              
              if (programaNormalizado === filtroNormalizado || programaSinEspacios === filtroSinEspacios) {
                matchesAny = true
                break
              }
            } else {
              // Si es solo "BBA", capturar TODAS las variantes con regex
              const regexBBA = /^BBA/i
              if (regexBBA.test(programa)) {
                matchesAny = true
                break
              }
            }
          } else {
            // Para otras carreras (MBA, MFIN, etc.), usar la lógica normal
            const codigoPrograma = programa.split(/\s+/)[0]
            const normalizarBBA = (codigo: string) => codigo.startsWith('BBA') ? 'BBA' : codigo
            if (normalizarBBA(codigoPrograma) === normalizarBBA(filtro)) {
              matchesAny = true
              break
            }
          }
        }
        
        if (!matchesAny) return false
      }
      
      // Filtro por cantidad de cursos - SELECCIÓN MÚLTIPLE
      if (filtroCantidadCursos.length > 0) {
        const cantidadCursos = est.total_matriculaciones || 0
        let matchesAny = false
        
        for (const filtro of filtroCantidadCursos) {
          if (filtro === '1' && cantidadCursos === 1) {
            matchesAny = true
            break
          }
          if (filtro === '2' && cantidadCursos === 2) {
            matchesAny = true
            break
          }
          if (filtro === '3' && cantidadCursos === 3) {
            matchesAny = true
            break
          }
          if (filtro === '4+' && cantidadCursos >= 4) {
            matchesAny = true
            break
          }
        }
        
        if (!matchesAny) return false
      }
      
      // Filtro por plan de estudio - SELECCIÓN MÚLTIPLE
      if (filtroPlanEstudio.length > 0) {
        const programa = (est.city || '').trim().toUpperCase()
        const planMatch = programa.match(/(20\d{2})/)
        const plan = planMatch ? planMatch[1] : 'DESCONOCIDO'
        
        if (!filtroPlanEstudio.includes(plan)) return false
      }
      
      // 🆕 Filtro por estado de pago (pagado/no pagado en últimos 30 días) - SELECCIÓN MÚLTIPLE
      // 🆕 ACTUALIZADO: También filtra por si tiene registro en kardex
      if (filtroEstadoPago.length > 0) {
        const carnet = (est.carnet || '').toLowerCase()
        const estadoPago = estadoPagos[carnet]
        
        if (!estadoPago) {
          // Si no tenemos el estado de pago cargado, solo mostrar si "Sin información" está seleccionado
          if (!filtroEstadoPago.includes('sin_informacion')) return false
          return true
        }
        
        // Verificar si el estado del estudiante coincide con alguno de los filtros seleccionados
        let matchesFilter = false
        
        for (const filtro of filtroEstadoPago) {
          if (filtro === 'tiene_kardex' && estadoPago.tiene_registro_kardex) {
            matchesFilter = true
            break
          }
          if (filtro === 'sin_kardex' && !estadoPago.tiene_registro_kardex) {
            matchesFilter = true
            break
          }
          if (filtro === estadoPago.estado) {
            matchesFilter = true
            break
          }
        }
        
        if (!matchesFilter) return false
      }
      
      // 🆕 Filtro por asesor asignado (created_by o updated_by) - SELECCIÓN MÚLTIPLE
      if (filtroAsesor.length > 0) {
        const carnet = (est.carnet || '').toLowerCase()
        const asesorEstudiante = asesoresPorEstudiante[carnet]
        
        if (!asesorEstudiante) {
          // Si no tenemos información del asesor, solo mostrar si "Sin asesor" está seleccionado
          if (!filtroAsesor.includes('sin_asesor')) return false
          return true
        }
        
        // Verificar si el ID del asesor coincide con alguno de los filtros seleccionados
        if (!filtroAsesor.includes(asesorEstudiante.id.toString())) return false
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

  /**
   * 📥 Exportar estudiantes filtrados a CSV
   */
  const exportarEstudiantesCSV = (estudiantes: any[]) => {
    try {
      // Encabezados CSV
      const headers = [
        'Carnet',
        'Nombre Completo',
        'Correo',
        'Programa',
        'Cantidad Cursos',
        'Cuota Mensual',
        'Monto Total a Cobrar',
        'Estado de Pago (30 días)',
        'Última Fecha Pago',
        'Total Pagado (30 días)',
        'Cantidad Pagos'
      ]
      
      // Convertir datos a filas CSV
      const rows = estudiantes.map((est: any) => {
        const carnet = est.carnet || ''
        const estadoPago = estadoPagos[carnet.toLowerCase()] || {}
        const mensualidad = calcularDeudaMensual(est)
        const cantidadCursos = est.total_matriculaciones || 0
        const montoTotalACobrar = mensualidad * cantidadCursos
        
        return [
          carnet,
          est.nombre_completo || '',
          est.correo || '',
          est.city || '',
          cantidadCursos,
          mensualidad,
          montoTotalACobrar,
          estadoPago.estado === 'pagado' ? 'Pagado' : estadoPago.estado === 'no_pagado' ? 'No pagado' : 'Sin información',
          estadoPago.ultima_fecha_pago ? new Date(estadoPago.ultima_fecha_pago).toLocaleDateString() : '',
          estadoPago.total_pagado_30dias || 0,
          estadoPago.cantidad_pagos || 0
        ]
      })
      
      // Crear contenido CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n')
      
      // Crear blob y descargar
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `estudiantes_activos_${mesSeleccionado}_${anioSeleccionado}_${new Date().getTime()}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Exportación exitosa",
        description: `Se exportaron ${estudiantes.length} estudiantes a CSV`,
      })
    } catch (error) {
      console.error('Error al exportar:', error)
      toast({
        title: "Error",
        description: "No se pudo exportar el archivo CSV",
        variant: "destructive"
      })
    }
  }

  /**
   * 📥 Exportar estudiantes filtrados a Excel (XLSX)
   */
  const exportarEstudiantesExcel = (estudiantes: any[]) => {
    try {
      // Crear tabla HTML que Excel puede interpretar
      const headers = [
        'Carnet',
        'Nombre Completo',
        'Correo',
        'Teléfono',
        'Detalle de Pago',
        'Programa',
        'Cantidad Cursos',
        'Cursos Matriculados (Mes)',
        'Cuota Mensual',
        'Monto Total a Cobrar',
        'Estado de Pago (30 días)',
        'Última Fecha Pago',
        'Total Pagado (30 días)',
        'Cantidad Pagos'
      ]
      
      let tableHTML = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Estudiantes Activos</x:Name>
                  <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <style>
            table { border-collapse: collapse; width: 100%; }
            th { 
              background-color: #2563eb; 
              color: white; 
              font-weight: bold; 
              padding: 10px; 
              border: 1px solid #ddd;
              text-align: left;
            }
            td { 
              padding: 8px; 
              border: 1px solid #ddd;
            }
            tr:nth-child(even) { background-color: #f9fafb; }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
      `
      
      estudiantes.forEach((est: any) => {
        const carnet = est.carnet || ''
        const estadoPago = estadoPagos[carnet.toLowerCase()] || {}
        const mensualidad = calcularDeudaMensual(est)
        const cantidadCursos = est.total_matriculaciones || 0
        const montoTotalACobrar = mensualidad * cantidadCursos
        
        // 🆕 Obtener teléfono (prioridad CRM sobre Moodle)
        const telefono = est.telefono || ''
        
        // 🆕 Obtener detalle de pago desde campo personalizado de Moodle
        const detallePago = est.detalle_pago || ''
        
        // 🆕 Obtener cursos matriculados del mes
        const cursosDelMes = est.cursos_matriculados_mes || []
        const cursosListaTexto = cursosDelMes.length > 0 
          ? cursosDelMes.map((c: any) => c.nombre_curso || c.course_name || '').join('; ')
          : 'Sin cursos matriculados este mes'
        
        tableHTML += `
          <tr>
            <td>${carnet}</td>
            <td>${est.nombre_completo || ''}</td>
            <td>${est.correo || ''}</td>
            <td>${telefono}</td>
            <td>${detallePago}</td>
            <td>${est.city || ''}
            <td>${cantidadCursos}</td>
            <td>${cursosListaTexto}</td>
            <td>${mensualidad}</td>
            <td>${montoTotalACobrar}</td>
            <td>${estadoPago.estado === 'pagado' ? 'Pagado' : estadoPago.estado === 'no_pagado' ? 'No pagado' : 'Sin información'}</td>
            <td>${estadoPago.ultima_fecha_pago ? new Date(estadoPago.ultima_fecha_pago).toLocaleDateString() : ''}</td>
            <td>${estadoPago.total_pagado_30dias || 0}</td>
            <td>${estadoPago.cantidad_pagos || 0}</td>
          </tr>
        `
      })
      
      tableHTML += `
            </tbody>
          </table>
        </body>
        </html>
      `
      
      // Crear blob y descargar
      const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `estudiantes_activos_${mesSeleccionado}_${anioSeleccionado}_${new Date().getTime()}.xls`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Exportación exitosa",
        description: `Se exportaron ${estudiantes.length} estudiantes a Excel`,
      })
    } catch (error) {
      console.error('Error al exportar:', error)
      toast({
        title: "Error",
        description: "No se pudo exportar el archivo Excel",
        variant: "destructive"
      })
    }
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
    setFiltroCarrera([]) // Resetear filtros múltiples
    setFiltroCantidadCursos([])
    setFiltroPlanEstudio([])
    setFiltroEstadoPago([])
    setFiltroAsesor([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesSeleccionado, anioSeleccionado])

  // Resetear a página 1 cuando cambia itemsPorPagina
  useEffect(() => {
    setPaginaEstudiantes(1)
  }, [itemsPorPagina])

  // 🆕 Cargar lista de asesores disponibles
  useEffect(() => {
    api.get('/reports/advisors')
      .then((response) => {
        if (Array.isArray(response.data)) {
          setAsesoresDisponibles(response.data)
        }
      })
      .catch((error) => {
        console.error('Error al cargar asesores:', error)
      })
  }, [])

  // 🆕 Cargar información de asesores para cada estudiante
  useEffect(() => {
    if (!dashboardData?.resumen?.estudiantesActivosDetalle || asesoresDisponibles.length === 0) return
    
    const todosLosCarnets = dashboardData.resumen.estudiantesActivosDetalle
      .map((est: any) => est.carnet)
      .filter((carnet: string) => carnet && carnet.trim())
    
    if (todosLosCarnets.length === 0) return
    
    // Verificar qué carnets necesitan información de asesor
    const carnetsFaltantes = todosLosCarnets.filter((carnet: string) => {
      const carnetLower = carnet.toLowerCase()
      return !asesoresPorEstudiante[carnetLower]
    })
    
    if (carnetsFaltantes.length === 0) return
    
    // 🚀 OPTIMIZACIÓN: Cargar información de asesores en batch usando endpoint optimizado
    api.post('/prospectos/batch-por-carnets', { carnets: carnetsFaltantes })
          .then((response) => {
        if (response.data?.success && response.data?.data) {
          const resultados = carnetsFaltantes.map((carnet: string) => {
            const carnetLower = carnet.toLowerCase()
            const prospectoData = response.data.data[carnet]
            
            if (!prospectoData || !prospectoData.asesor_id) {
              return { carnet: carnetLower, asesor: null }
            }
            
                // Buscar el asesor en la lista disponible
            const asesor = asesoresDisponibles.find((a: any) => a.id === prospectoData.asesor_id)
                if (asesor) {
                  return {
                carnet: carnetLower,
                    asesor: { id: asesor.id, nombre: asesor.name }
                  }
                }
            
            return { carnet: carnetLower, asesor: null }
          })
          
      const nuevosAsesores: Record<string, { id: number; nombre: string } | null> = {}
          resultados.forEach((result: any) => {
        nuevosAsesores[result.carnet] = result.asesor
      })
      setAsesoresPorEstudiante((prev) => ({ ...prev, ...nuevosAsesores }))
        }
      })
      .catch((error) => {
        console.error('Error al cargar asesores en batch:', error)
    })
  }, [dashboardData?.resumen?.estudiantesActivosDetalle, asesoresDisponibles])

  // 🆕 Cargar estado de pagos de todos los estudiantes activos
  useEffect(() => {
    if (!dashboardData?.resumen?.estudiantesActivosDetalle || cargandoEstadoPagos) return
    
    const todosLosCarnets = dashboardData.resumen.estudiantesActivosDetalle
      .map((est: any) => est.carnet)
      .filter((carnet: string) => carnet && carnet.trim())
    
    if (todosLosCarnets.length === 0) return
    
    // Verificar si ya tenemos los estados cargados
    const carnetsFaltantes = todosLosCarnets.filter((carnet: string) => !estadoPagos[carnet.toLowerCase()])
    if (carnetsFaltantes.length === 0) return
    
    setCargandoEstadoPagos(true)
    
    api.post('/dashboard-financiero/estado-pagos', { carnets: carnetsFaltantes })
      .then((response) => {
        if (response.data.success && response.data.data) {
          const nuevosEstados: Record<string, any> = {}
          Object.values(response.data.data).forEach((estado: any) => {
            if (estado.carnet) {
              nuevosEstados[estado.carnet.toLowerCase()] = estado
            }
          })
          setEstadoPagos((prev) => ({ ...prev, ...nuevosEstados }))
        }
      })
      .catch((error) => {
        console.error('Error al cargar estado de pagos:', error)
      })
      .finally(() => {
        setCargandoEstadoPagos(false)
      })
  }, [dashboardData?.resumen?.estudiantesActivosDetalle])

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
          Object.entries(response.data.deudas).forEach(([carnet, deuda]: [string, any]) => {
            const carnetNormalizado = carnet.toLowerCase()
            nuevasDeudas[carnetNormalizado] = deuda
            
            // Log para debugging
            if (deuda?.errores && deuda.errores.length > 0) {
              console.warn(`[Dashboard] Errores para carnet ${carnet}:`, deuda.errores)
            } else if (deuda?.cuota_mensual > 0) {
              console.log(`[Dashboard] Cuota calculada para ${carnet}: Q${deuda.cuota_mensual}`)
            }
          })
          
          setDeudasCalculadas(prev => ({ ...prev, ...nuevasDeudas }))
        } else {
          console.error('[Dashboard] Respuesta inválida del endpoint de deudas:', response.data)
        }
      })
      .catch((error) => {
        console.error('[Dashboard] Error calculando deudas en batch:', error)
        if (error.response) {
          console.error('[Dashboard] Detalles del error:', error.response.data)
        }
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
        {/* <Card>
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
        </Card> */}

        {/* <Card>
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
        </Card> */}

        {/* <Card>
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
        </Card> */}

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
                    filtrarEstudiantes().reduce((sum, est) => {
                      const mensualidad = calcularDeudaMensual(est)
                      const cantidadCursos = est.total_matriculaciones || 0
                      const montoTotalACobrar = mensualidad * cantidadCursos
                      return sum + montoTotalACobrar
                    }, 0)
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
            <div className="mb-4 space-y-4">
              {/* Fila 1: Búsqueda principal */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  placeholder="Buscar por carnet, nombre, correo o programa..."
                  value={filtroBusqueda}
                  onChange={(e) => {
                    setFiltroBusqueda(e.target.value)
                    setPaginaEstudiantes(1)
                  }}
                  className="pl-10 pr-10 h-11 text-sm"
                />
                {filtroBusqueda && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-muted"
                    onClick={() => {
                      setFiltroBusqueda("")
                      setPaginaEstudiantes(1)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Fila 2: Filtros múltiples en grid responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* 🆕 Filtro por carrera (selección múltiple) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground px-1">
                    Programa
                  </label>
                  <MultiSelect
                    options={[
                      // 🎓 BBA y todas sus variantes detectadas dinámicamente
                      { label: '🎓 BBA (Todas las variantes)', value: 'BBA' },
                      ...obtenerVariantesBBA()
                        .filter(v => v !== 'BBA')
                        .map(v => ({ label: `🎓 ${v}`, value: v })),
                      // Otras carreras
                      { label: '🎓 MBA', value: 'MBA' },
                      { label: '💰 MFIN', value: 'MFIN' },
                      { label: '📱 MMKD', value: 'MMKD' },
                      { label: '👥 MLDO', value: 'MLDO' },
                      { label: '👔 MHHRR', value: 'MHHRR' },
                      { label: '📊 MPM', value: 'MPM' },
                      { label: '🏆 PMP', value: 'PMP' },
                      { label: '👔 MHTM', value: 'MHTM' },
                      { label: '📱 MKD', value: 'MKD' },
                      { label: '📊 MDGP', value: 'MDGP' },
                      { label: '📱 MDM', value: 'MDM' },
                      { label: '🎓 DBA', value: 'DBA' },
                      { label: '📊 MGP', value: 'MGP' },
                      { label: '💰 MFM', value: 'MFM' },
                      { label: '📝 TEMP', value: 'TEMP' },
                      { label: '❓ Desconocido', value: 'DESCONOCIDO' },
                    ]}
                    selected={filtroCarrera}
                    onChange={(values) => {
                      setFiltroCarrera(values)
                      setPaginaEstudiantes(1)
                    }}
                    placeholder="Todos los programas"
                    searchPlaceholder="Buscar programa..."
                    emptyMessage="No se encontraron programas"
                    maxCount={1}
                  />
                </div>
                
                {/* 🆕 Filtro por cantidad de cursos (selección múltiple) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground px-1">
                    Cantidad de cursos
                  </label>
                  <MultiSelect
                    options={[
                      { label: '1 curso', value: '1' },
                      { label: '2 cursos', value: '2' },
                      { label: '3 cursos', value: '3' },
                      { label: '4+ cursos', value: '4+' },
                    ]}
                    selected={filtroCantidadCursos}
                    onChange={(values) => {
                      setFiltroCantidadCursos(values)
                      setPaginaEstudiantes(1)
                    }}
                    placeholder="Todos los cursos"
                    searchPlaceholder="Buscar..."
                    emptyMessage="No se encontraron opciones"
                    maxCount={2}
                  />
                </div>
                
                {/* 🆕 Filtro por asesor asignado (selección múltiple) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground px-1">
                    Asesor asignado
                  </label>
                  <MultiSelect
                    options={[
                      ...asesoresDisponibles.map((asesor: any) => ({
                        label: `👤 ${asesor.name}`,
                        value: asesor.id.toString()
                      })),
                      { label: '❓ Sin asesor', value: 'sin_asesor' },
                    ]}
                    selected={filtroAsesor}
                    onChange={(values) => {
                      setFiltroAsesor(values)
                      setPaginaEstudiantes(1)
                    }}
                    placeholder="Todos los asesores"
                    searchPlaceholder="Buscar asesor..."
                    emptyMessage="No se encontraron asesores"
                    maxCount={2}
                  />
                </div>
                
                {/* 🆕 Filtro por estado de pago (selección múltiple) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground px-1">
                    Estado de pago
                  </label>
                  <MultiSelect
                    options={[
                      { label: '✅ Pagados (30 días)', value: 'pagado' },
                      { label: '❌ No pagados (30 días)', value: 'no_pagado' },
                      { label: '📋 Tiene registro en Kardex', value: 'tiene_kardex' },
                      { label: '📭 Sin registro en Kardex', value: 'sin_kardex' },
                      { label: '❓ Sin información', value: 'sin_informacion' },
                    ]}
                    selected={filtroEstadoPago}
                    onChange={(values) => {
                      setFiltroEstadoPago(values)
                      setPaginaEstudiantes(1)
                    }}
                    placeholder="Todos los estados"
                    searchPlaceholder="Buscar..."
                    emptyMessage="No se encontraron opciones"
                    maxCount={5}
                  />
                </div>
                
                {/* 🆕 Filtro por rango de fechas de pagos */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground px-1">
                    Rango de fechas de pagos
                  </label>
                  <SimpleDateRangePicker
                    value={filtroRangoFechasPagos}
                    onChange={(range) => {
                      setFiltroRangoFechasPagos(range)
                      setFiltroDiasAtras(null) // Limpiar días hacia atrás si se selecciona rango
                      setPaginaEstudiantes(1)
                    }}
                    placeholder="Seleccionar rango"
                    className="w-full"
                  />
                </div>
                
                {/* 🆕 Filtro por días hacia atrás */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground px-1">
                    Días hacia atrás
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      placeholder="Ej: 30"
                      value={filtroDiasAtras || ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value) : null
                        setFiltroDiasAtras(value)
                        setFiltroRangoFechasPagos(undefined) // Limpiar rango si se selecciona días
                        setPaginaEstudiantes(1)
                      }}
                      className="h-10 text-sm"
                    />
                    {filtroDiasAtras && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 shrink-0"
                        onClick={() => {
                          setFiltroDiasAtras(null)
                          setPaginaEstudiantes(1)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground px-1">
                    {filtroDiasAtras ? `Ver pagos de los últimos ${filtroDiasAtras} días` : 'Opcional: días hacia atrás'}
                  </div>
                </div>
                
                {/* 🆕 Filtro por plan de estudio (selección múltiple) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground px-1">
                    Plan de estudio
                  </label>
                  <MultiSelect
                    options={(() => {
                      // Extraer planes únicos de los estudiantes
                      const planesUnicos = new Set<string>()
                      resumen.estudiantesActivosDetalle.forEach((est: any) => {
                        const programa = (est.city || '').trim().toUpperCase()
                        const planMatch = programa.match(/(20\d{2})/)
                        if (planMatch) planesUnicos.add(planMatch[1])
                      })
                      return [
                        ...Array.from(planesUnicos).sort().reverse().map(plan => ({
                          label: `Plan ${plan}`,
                          value: plan
                        })),
                        { label: 'Sin plan', value: 'DESCONOCIDO' }
                      ]
                    })()}
                    selected={filtroPlanEstudio}
                    onChange={(values) => {
                      setFiltroPlanEstudio(values)
                      setPaginaEstudiantes(1)
                    }}
                    placeholder="Todos los planes"
                    searchPlaceholder="Buscar plan..."
                    emptyMessage="No se encontraron planes"
                    maxCount={2}
                  />
                </div>
              </div>
              
              {/* 🆕 Botones de exportación y filtros activos - Layout mejorado */}
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between pt-2 border-t">
                {/* Indicadores de filtros activos */}
                {(filtroBusqueda.trim() || filtroCarrera.length > 0 || filtroCantidadCursos.length > 0 || filtroPlanEstudio.length > 0 || filtroEstadoPago.length > 0 || filtroAsesor.length > 0 || filtroRangoFechasPagos || filtroDiasAtras) ? (
                  <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-medium text-muted-foreground shrink-0">Filtros activos:</span>
                    {filtroBusqueda.trim() && (
                      <Badge variant="secondary" className="gap-1.5 px-2 py-1 text-xs shrink-0">
                        <Search className="h-3 w-3" />
                        <span className="max-w-[150px] truncate">
                          {filtroBusqueda.length > 20 ? `${filtroBusqueda.substring(0, 20)}...` : filtroBusqueda}
                        </span>
                        <button
                          onClick={() => {
                            setFiltroBusqueda("")
                            setPaginaEstudiantes(1)
                          }}
                          className="ml-0.5 hover:bg-secondary-foreground/20 rounded-full p-0.5 transition-colors focus:outline-none"
                          aria-label="Eliminar filtro de búsqueda"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {filtroCarrera.length > 0 && (
                      <Badge variant="secondary" className="gap-1.5 px-2 py-1 text-xs shrink-0">
                        <BookOpen className="h-3 w-3" />
                        {filtroCarrera.length} programa{filtroCarrera.length > 1 ? 's' : ''}
                        <button
                          onClick={() => {
                            setFiltroCarrera([])
                            setPaginaEstudiantes(1)
                          }}
                          className="ml-0.5 hover:bg-secondary-foreground/20 rounded-full p-0.5 transition-colors focus:outline-none"
                          aria-label="Eliminar filtro de programas"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {filtroCantidadCursos.length > 0 && (
                      <Badge variant="secondary" className="gap-1.5 px-2 py-1 text-xs shrink-0">
                        Cursos: {filtroCantidadCursos.join(', ')}
                        <button
                          onClick={() => {
                            setFiltroCantidadCursos([])
                            setPaginaEstudiantes(1)
                          }}
                          className="ml-0.5 hover:bg-secondary-foreground/20 rounded-full p-0.5 transition-colors focus:outline-none"
                          aria-label="Eliminar filtro de cursos"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {filtroPlanEstudio.length > 0 && (
                      <Badge variant="secondary" className="gap-1.5 px-2 py-1 text-xs shrink-0">
                        Planes: {filtroPlanEstudio.length}
                        <button
                          onClick={() => {
                            setFiltroPlanEstudio([])
                            setPaginaEstudiantes(1)
                          }}
                          className="ml-0.5 hover:bg-secondary-foreground/20 rounded-full p-0.5 transition-colors focus:outline-none"
                          aria-label="Eliminar filtro de planes"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {filtroEstadoPago.length > 0 && (
                      <Badge variant="secondary" className="gap-1.5 px-2 py-1 text-xs shrink-0">
                        <DollarSign className="h-3 w-3" />
                        {filtroEstadoPago.length} estado{filtroEstadoPago.length > 1 ? 's' : ''}
                        <button
                          onClick={() => {
                            setFiltroEstadoPago([])
                            setPaginaEstudiantes(1)
                          }}
                          className="ml-0.5 hover:bg-secondary-foreground/20 rounded-full p-0.5 transition-colors focus:outline-none"
                          aria-label="Eliminar filtro de estado de pago"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {filtroAsesor.length > 0 && (
                      <Badge variant="secondary" className="gap-1.5 px-2 py-1 text-xs shrink-0">
                        <Shield className="h-3 w-3" />
                        {filtroAsesor.length} asesor{filtroAsesor.length > 1 ? 'es' : ''}
                        <button
                          onClick={() => {
                            setFiltroAsesor([])
                            setPaginaEstudiantes(1)
                          }}
                          className="ml-0.5 hover:bg-secondary-foreground/20 rounded-full p-0.5 transition-colors focus:outline-none"
                          aria-label="Eliminar filtro de asesor"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {filtroRangoFechasPagos && (
                      <Badge variant="secondary" className="gap-1.5 px-2 py-1 text-xs shrink-0">
                        <CalendarIcon className="h-3 w-3" />
                        {filtroRangoFechasPagos.from && filtroRangoFechasPagos.to
                          ? `${filtroRangoFechasPagos.from.toLocaleDateString()} - ${filtroRangoFechasPagos.to.toLocaleDateString()}`
                          : filtroRangoFechasPagos.from
                          ? `Desde ${filtroRangoFechasPagos.from.toLocaleDateString()}`
                          : 'Rango de fechas'}
                        <button
                          onClick={() => {
                            setFiltroRangoFechasPagos(undefined)
                            setPaginaEstudiantes(1)
                          }}
                          className="ml-0.5 hover:bg-secondary-foreground/20 rounded-full p-0.5 transition-colors focus:outline-none"
                          aria-label="Eliminar filtro de rango de fechas"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {filtroDiasAtras && (
                      <Badge variant="secondary" className="gap-1.5 px-2 py-1 text-xs shrink-0">
                        <Clock className="h-3 w-3" />
                        Últimos {filtroDiasAtras} días
                        <button
                          onClick={() => {
                            setFiltroDiasAtras(null)
                            setPaginaEstudiantes(1)
                          }}
                          className="ml-0.5 hover:bg-secondary-foreground/20 rounded-full p-0.5 transition-colors focus:outline-none"
                          aria-label="Eliminar filtro de días hacia atrás"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs px-2 shrink-0"
                      onClick={() => {
                        setFiltroBusqueda("")
                        setFiltroCarrera([])
                        setFiltroCantidadCursos([])
                        setFiltroPlanEstudio([])
                        setFiltroEstadoPago([])
                        setFiltroAsesor([])
                        setFiltroRangoFechasPagos(undefined)
                        setFiltroDiasAtras(null)
                        setPaginaEstudiantes(1)
                      }}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Limpiar todo
                    </Button>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Sin filtros aplicados
                  </div>
                )}
                
                {/* Botones de exportación */}
                <div className="flex gap-2 w-full sm:w-auto shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const estudiantesFiltrados = filtrarEstudiantes()
                      exportarEstudiantesCSV(estudiantesFiltrados)
                    }}
                    className="gap-2 flex-1 sm:flex-initial"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Exportar CSV</span>
                    <span className="sm:hidden">CSV</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const estudiantesFiltrados = filtrarEstudiantes()
                      exportarEstudiantesExcel(estudiantesFiltrados)
                    }}
                    className="gap-2 flex-1 sm:flex-initial"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Exportar Excel</span>
                    <span className="sm:hidden">Excel</span>
                  </Button>
                </div>
              </div>
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
                    const hayFiltros = filtroBusqueda.trim() || filtroCarrera.length > 0 || filtroCantidadCursos.length > 0 || filtroPlanEstudio.length > 0 || filtroEstadoPago.length > 0 || filtroAsesor.length > 0
                    
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
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Detalle de Pago</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Programa</TableHead>
                    <TableHead className="text-center">Cursos</TableHead>
                    <TableHead className="text-center">Cursos del Mes</TableHead>
                    <TableHead className="text-right">Mensualidad</TableHead>
                    <TableHead className="text-right">Monto Total a Cobrar</TableHead>
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
                    
                    const hayFiltros = filtroBusqueda.trim() || filtroCarrera.length > 0 || filtroCantidadCursos.length > 0 || filtroPlanEstudio.length > 0 || filtroEstadoPago.length > 0 || filtroAsesor.length > 0
                    
                    if (estudiantesPaginados.length === 0 && hayFiltros) {
                      return (
                        <TableRow>
                          <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
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
                      const cantidadCursos = estudiante.total_matriculaciones || 0
                      const montoTotalACobrar = deudaMensual * cantidadCursos
                      
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
                            <TableCell className="text-sm">
                              {estudiante.telefono ? (
                                <div className="flex flex-col">
                                  <span className="font-mono">{estudiante.telefono}</span>
                                  {estudiante.telefono_fuente && (
                                    <span className="text-xs text-muted-foreground">
                                      {estudiante.telefono_fuente === 'CRM' ? '📋 CRM' : '🎓 Moodle'}
                                    </span>
                                  )}
                                </div>
                              ) : estudiante.phone1 || estudiante.phone2 ? (
                                <span className="font-mono">{estudiante.phone1 || estudiante.phone2}</span>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {estudiante.detalle_pago ? (
                                <span className="text-sm">{estudiante.detalle_pago}</span>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{estudiante.correo || '—'}</TableCell>
                            <TableCell>
                              {estudiante.city ? (
                                <Badge variant="outline">{estudiante.city}</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge>{cantidadCursos}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {estudiante.cursos_matriculados_mes && estudiante.cursos_matriculados_mes.length > 0 ? (
                                <div className="flex flex-col items-center gap-1">
                                  <Badge variant="secondary">{estudiante.total_cursos_matriculados_mes || estudiante.cursos_matriculados_mes.length}</Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {mesNombres[parseInt(mesSeleccionado.toString()) - 1]} {anioSeleccionado}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
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
                            <TableCell className="text-right">
                              {cargandoDeuda ? (
                                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground mx-auto" />
                              ) : montoTotalACobrar > 0 ? (
                                <span className="font-bold text-sm text-primary">
                                  {formatCurrency(montoTotalACobrar)}
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
                              <TableCell colSpan={12} className="bg-muted/30 p-4">
                                <div className="space-y-4">
                                  {/* 📚 Lista de cursos del mes (desde backend) */}
                                  {estudiante.cursos_matriculados_mes && estudiante.cursos_matriculados_mes.length > 0 && (
                                    <div>
                                      <div className="flex items-center gap-2 mb-2">
                                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-semibold text-sm">
                                          Cursos Matriculados en {mesNombres[parseInt(mesSeleccionado.toString()) - 1]} {anioSeleccionado} ({estudiante.cursos_matriculados_mes.length})
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {estudiante.cursos_matriculados_mes.map((curso: any, cursoIdx: number) => (
                                          <div
                                            key={cursoIdx}
                                            className="p-3 bg-background border rounded-md hover:bg-muted/50 transition-colors"
                                          >
                                            <div className="font-medium text-sm">{curso.course_name || 'Curso sin nombre'}</div>
                                            {curso.course_shortname && (
                                              <div className="text-xs text-muted-foreground mt-1">{curso.course_shortname}</div>
                                            )}
                                            {curso.programa_detectado && (
                                              <Badge variant="outline" className="mt-2 text-xs">
                                                {curso.programa_detectado}
                                              </Badge>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
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