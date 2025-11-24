"use client"

/**
 * 💰 DASHBOARD FINANCIERO COMPLETO
 * 
 * Integración Moodle + PostgreSQL para métricas financieras en tiempo real:
 * - Recaudación vs Pendiente
 * - Estados financieros por estudiante
 * - Gráficos de tendencias
 * - Filtros avanzados
 * - Exportación de datos
 * - ⚠️ Sistema de warnings del backend
 */

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Download,
  Search,
  Filter,
  AlertTriangle,
} from "lucide-react"
import { useFinancialMetrics } from "@/hooks/useFinancialMetrics"
import { 
  formatCurrency, 
  formatMonthYear,
  getCurrentMonth,
  getCurrentYear,
} from "@/services/financialMetrics"
import { toast } from "@/hooks/use-toast"
import { limpiarCache } from "@/services/financialMetrics"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

// Sub-componentes
import { MetricasResumen } from "./MetricasResumen"
import { TablaPagosEstudiantes } from "./TablaPagosEstudiantes"
import { GraficoRecaudacion } from "./GraficoRecaudacion"
import { DistribucionProgramas } from "./DistribucionProgramas"
import { DetalleEstudianteModal } from "./DetalleEstudianteModal"

export function DashboardFinanciero() {
  // =====================================================
  // ESTADO
  // =====================================================
  const [mes, setMes] = useState(getCurrentMonth())
  const [anio, setAnio] = useState(getCurrentYear())
  const [programaId, setProgramaId] = useState<number | undefined>(undefined)
  const [modoAuditoria, setModoAuditoria] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [busquedaCarnet, setBusquedaCarnet] = useState("")
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])

  // =====================================================
  // HOOK DE DATOS
  // =====================================================
  const { metrics, isLoading, isError, refresh } = useFinancialMetrics({
    mes,
    anio,
    programa_id: programaId,
    auditoria: modoAuditoria,
  })

  // Actualizar warnings desde metrics cuando estén disponibles
  useEffect(() => {
    if (metrics?.warnings && Array.isArray(metrics.warnings)) {
      setWarnings(metrics.warnings)
    }
  }, [metrics])

  // =====================================================
  // FUNCIONES
  // =====================================================
  const handleRefresh = async () => {
    try {
      await refresh()
      toast({
        title: "Actualizado",
        description: "Métricas financieras actualizadas correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron actualizar las métricas",
        variant: "destructive",
      })
    }
  }

  const handleClearCache = async () => {
    try {
      await limpiarCache('all')
      await refresh()
      toast({
        title: "Caché limpiado",
        description: "Se ha limpiado el caché y actualizado los datos",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo limpiar el caché",
        variant: "destructive",
      })
    }
  }

  const handleExportExcel = () => {
    // TODO: Implementar exportación a Excel
    toast({
      title: "Exportando...",
      description: "La descarga comenzará en breve",
    })
  }

  const handleVerDetalleEstudiante = (carnet: string) => {
    setEstudianteSeleccionado(carnet)
  }

  // =====================================================
  // RENDER: LOADING
  // =====================================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando métricas financieras...</p>
        </div>
      </div>
    )
  }

  // =====================================================
  // RENDER: ERROR
  // =====================================================
  if (isError || !metrics) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Error al cargar métricas
            </CardTitle>
            <CardDescription>
              No se pudieron obtener los datos financieros
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // =====================================================
  // RENDER: PRINCIPAL
  // =====================================================
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header con controles */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Financiero</h1>
          <p className="text-muted-foreground">
            {formatMonthYear(mes, anio)} • {metrics.metadata.estudiantes_evaluados} estudiantes evaluados
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Mes */}
          <Select value={mes.toString()} onValueChange={(v) => setMes(parseInt(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={m.toString()}>
                  {formatMonthYear(m, anio).split(' ')[0]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Selector de Año */}
          <Select value={anio.toString()} onValueChange={(v) => setAnio(parseInt(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025].map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="icon" onClick={handleClearCache}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ⚠️ PANEL DE WARNINGS (NUEVO) */}
      {warnings.length > 0 && (
        <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-200">
            Advertencias del Sistema ({warnings.length})
          </AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            <ul className="list-disc list-inside space-y-1 mt-2">
              {warnings.slice(0, 5).map((warning, idx) => (
                <li key={idx} className="text-sm">{warning}</li>
              ))}
              {warnings.length > 5 && (
                <li className="text-sm italic">... y {warnings.length - 5} más</li>
              )}
            </ul>
            <Button 
              variant="link" 
              size="sm" 
              className="mt-2 h-auto p-0 text-yellow-800"
              onClick={() => setWarnings([])}
            >
              Descartar advertencias
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Modo auditoría */}
      <Card className={modoAuditoria ? "border-orange-500" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Modo Auditoría</CardTitle>
              <CardDescription>
                Activa validaciones adicionales y logs detallados
              </CardDescription>
            </div>
            <Switch 
              checked={modoAuditoria} 
              onCheckedChange={setModoAuditoria}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Indicador de caché */}
      {metrics.metadata.cache_usado && !modoAuditoria && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3">
            <p className="text-sm text-blue-700 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Datos desde caché • Calculado: {new Date(metrics.metadata.fecha_calculo).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Métricas principales (4 cards) */}
      <MetricasResumen metrics={metrics} />

      {/* Tabs de contenido */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="estudiantes">Estudiantes</TabsTrigger>
          <TabsTrigger value="programas">Por Programa</TabsTrigger>
          <TabsTrigger value="tendencias">Tendencias</TabsTrigger>
        </TabsList>

        {/* TAB: Resumen */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <GraficoRecaudacion historial={metrics.historial_mensual} />
            <DistribucionProgramas programas={metrics.por_programa} />
          </div>

          {/* Card de distribución de pagos */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Pagos</CardTitle>
              <CardDescription>
                Estado de los pagos del mes {formatMonthYear(mes, anio)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Completos</span>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold">{metrics.distribucion_pagos.completos.cantidad}</p>
                  <p className="text-sm text-green-600">{formatCurrency(metrics.distribucion_pagos.completos.monto)}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Parciales</span>
                    <Clock className="h-4 w-4 text-yellow-500" />
                  </div>
                  <p className="text-2xl font-bold">{metrics.distribucion_pagos.parciales.cantidad}</p>
                  <p className="text-sm text-yellow-600">{formatCurrency(metrics.distribucion_pagos.parciales.monto)}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Sin Pago</span>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold">{metrics.distribucion_pagos.sin_pago.cantidad}</p>
                  <p className="text-sm text-red-600">{formatCurrency(metrics.distribucion_pagos.sin_pago.monto_esperado)}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Anticipados</span>
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold">{metrics.distribucion_pagos.anticipados.cantidad}</p>
                  <p className="text-sm text-blue-600">{formatCurrency(metrics.distribucion_pagos.anticipados.monto)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Estudiantes */}
        <TabsContent value="estudiantes">
          <TablaPagosEstudiantes
            mes={mes}
            anio={anio}
            onVerDetalle={handleVerDetalleEstudiante}
          />
        </TabsContent>

        {/* TAB: Por Programa */}
        <TabsContent value="programas">
          <Card>
            <CardHeader>
              <CardTitle>Análisis por Programa</CardTitle>
              <CardDescription>
                Rendimiento financiero de cada programa académico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.por_programa.map((programa) => (
                  <div key={programa.programa_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{programa.nombre}</h3>
                        <p className="text-sm text-muted-foreground">
                          {programa.estudiantes_activos} estudiantes activos
                        </p>
                      </div>
                      <Badge variant={programa.tasa_cobro >= 70 ? "default" : "destructive"}>
                        {programa.tasa_cobro.toFixed(1)}% cobrado
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Ingresos</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(programa.ingresos)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Deuda</p>
                        <p className="text-lg font-bold text-red-600">
                          {formatCurrency(programa.deuda)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Tendencias */}
        <TabsContent value="tendencias">
          <GraficoRecaudacion historial={metrics.historial_mensual} />
        </TabsContent>
      </Tabs>

      {/* Modal de detalle de estudiante */}
      {estudianteSeleccionado && (
        <DetalleEstudianteModal
          carnet={estudianteSeleccionado}
          mes={mes}
          anio={anio}
          open={!!estudianteSeleccionado}
          onClose={() => setEstudianteSeleccionado(null)}
        />
      )}
    </div>
  )
}
