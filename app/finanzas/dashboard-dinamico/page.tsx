"use client"

import { useState } from "react"
import DashboardFilters, { type FilterValues } from "@/components/dashboard/DashboardFilters"
import MetricCard from "@/components/dashboard/MetricCard"
import SkeletonMetric from "@/components/dashboard/SkeletonMetric"
import { useMetrics, clearMetricsCache } from "@/hooks/useMetrics"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import {
  DollarSign,
  TrendingUp,
  Users,
  AlertCircle,
  RefreshCcw,
  Download,
  FileText,
} from "lucide-react"

export default function DashboardFinancieroPage() {
  const currentDate = new Date()
  const [filters, setFilters] = useState<FilterValues>({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
  })

  const { metrics, isLoading, isError, refresh } = useMetrics(filters)
  const [refreshing, setRefreshing] = useState(false)

  const handleFiltersChange = (newFilters: FilterValues) => {
    setFilters(newFilters)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refresh()
      toast({
        title: "Datos actualizados",
        description: "Las métricas se han actualizado correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron actualizar los datos",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleClearCache = async () => {
    try {
      await clearMetricsCache()
      await refresh()
      toast({
        title: "Cache limpiado",
        description: "El cache se ha limpiado y los datos se han recargado",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo limpiar el cache",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Financiero</h1>
          <p className="text-muted-foreground">
            Métricas dinámicas y análisis en tiempo real
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button variant="outline" onClick={handleClearCache}>
            <AlertCircle className="h-4 w-4 mr-2" />
            Limpiar Cache
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <DashboardFilters
        onFiltersChange={handleFiltersChange}
        showProgramaFilter={false}
        showAsesorFilter={false}
      />

      {/* Error State */}
      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p className="font-semibold">Error al cargar las métricas</p>
          </div>
          <p className="text-sm mt-1">Por favor, intenta nuevamente más tarde.</p>
        </div>
      )}

      {/* Métricas Financieras */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Métricas Financieras</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              <SkeletonMetric />
              <SkeletonMetric />
              <SkeletonMetric />
              <SkeletonMetric />
            </>
          ) : (
            <>
              <MetricCard
                title="Ingresos Mensuales"
                value={metrics?.ingresosMensuales || 0}
                variation={metrics?.variaciones.ingresos}
                icon={DollarSign}
                prefix="Q"
                description="vs mes anterior"
              />
              <MetricCard
                title="Tasa de Morosidad"
                value={metrics?.tasaMorosidad || 0}
                variation={metrics?.variaciones.morosidad}
                icon={AlertCircle}
                suffix="%"
                description="vs mes anterior"
                trend={metrics && metrics.variaciones.morosidad < 0 ? "up" : "down"}
              />
              <MetricCard
                title="Recaudación Pendiente"
                value={metrics?.recaudacionPendiente || 0}
                variation={metrics?.variaciones.recaudacion}
                icon={FileText}
                prefix="Q"
                description="vs mes anterior"
                trend={metrics && metrics.variaciones.recaudacion < 0 ? "up" : "down"}
              />
              <MetricCard
                title="Total Facturado"
                value={metrics?.totalFacturado || 0}
                icon={TrendingUp}
                prefix="Q"
                description="período actual"
              />
            </>
          )}
        </div>
      </div>

      {/* Métricas Académicas */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Métricas Académicas (Moodle)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              <SkeletonMetric />
              <SkeletonMetric />
              <SkeletonMetric />
              <SkeletonMetric />
            </>
          ) : (
            <>
              <MetricCard
                title="Estudiantes Activos"
                value={metrics?.estudiantesActivos || 0}
                variation={metrics?.variaciones.estudiantes}
                icon={Users}
                description="vs mes anterior"
              />
              <MetricCard
                title="Estudiantes Inactivos"
                value={metrics?.estudiantesInactivos || 0}
                icon={Users}
                description="período actual"
                valueClassName="text-orange-600"
              />
              <MetricCard
                title="Nuevas Inscripciones"
                value={metrics?.nuevasInscripciones || 0}
                icon={TrendingUp}
                description="período actual"
                valueClassName="text-green-600"
              />
              <MetricCard
                title="Cursos Activos"
                value={metrics?.cursosActivos || 0}
                icon={FileText}
                description="en plataforma"
                valueClassName="text-blue-600"
              />
            </>
          )}
        </div>
      </div>

      {/* Métricas de Actividad */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Actividad y Engagement</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              <SkeletonMetric />
              <SkeletonMetric />
            </>
          ) : (
            <>
              <MetricCard
                title="Estudiantes con Actividad"
                value={metrics?.estudiantesConActividad || 0}
                icon={TrendingUp}
                description="últimos 30 días"
                valueClassName="text-green-600"
              />
              <MetricCard
                title="Total Pendiente"
                value={metrics?.totalPendiente || 0}
                icon={DollarSign}
                prefix="Q"
                description="por cobrar"
              />
            </>
          )}
        </div>
      </div>

      {/* Info de última actualización */}
      {metrics?.timestamp && (
        <div className="text-sm text-muted-foreground text-center">
          Última actualización: {new Date(metrics.timestamp).toLocaleString("es-GT")}
        </div>
      )}
    </div>
  )
}
