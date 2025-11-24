"use client"

/**
 * 💰 DASHBOARD FINANCIERO HÍBRIDO
 * 
 * Combina dos vistas:
 * 1. Vista CLÁSICA - Estudiantes activos, cursos matriculados (dashboard anterior)
 * 2. Vista MÉTRICAS - Reglas de negocio, warnings, validaciones (dashboard nuevo)
 * 
 * El usuario puede alternar entre ambas vistas con tabs
 */

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  AlertTriangle,
  BookOpen,
  TrendingUp
} from "lucide-react"

// Componentes existentes
import { DashboardFinanciero as DashboardClasico } from "./dashboard-financiero"
import { DashboardFinanciero as DashboardMetricas } from "./DashboardFinanciero"

export function DashboardFinancieroHibrido() {
  const [tabActiva, setTabActiva] = useState<"clasico" | "metricas">("clasico")

  return (
    <div className="space-y-6">
      {/* Header con descripción */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Financiero</h1>
          <p className="text-muted-foreground">
            Análisis completo con dos perspectivas: estudiantes activos y métricas de negocio
          </p>
        </div>
      </div>

      {/* Tabs para alternar vistas */}
      <Tabs value={tabActiva} onValueChange={(v) => setTabActiva(v as any)} className="w-full">
        <TabsList className="grid w-full max-w-[600px] grid-cols-2">
          {/* TAB 1: Vista Clásica */}
          <TabsTrigger value="clasico" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Estudiantes Activos</span>
            <Badge variant="secondary" className="ml-2">
              <BookOpen className="h-3 w-3 mr-1" />
              Cursos
            </Badge>
          </TabsTrigger>

          {/* TAB 2: Vista Métricas */}
          <TabsTrigger value="metricas" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Métricas & Reglas</span>
            <Badge variant="secondary" className="ml-2">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Warnings
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* TAB CONTENT 1: Dashboard Clásico */}
        <TabsContent value="clasico" className="space-y-4 mt-6">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Vista Clásica</h2>
              <Badge variant="outline">Estudiantes & Cursos</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              • Estudiantes activos este mes en Moodle<br/>
              • Cursos matriculados por estudiante<br/>
              • Pagos recientes y alertas de mora<br/>
              • Filtros por mes/año
            </p>
          </div>
          
          <DashboardClasico />
        </TabsContent>

        {/* TAB CONTENT 2: Dashboard Métricas */}
        <TabsContent value="metricas" className="space-y-4 mt-6">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Vista Métricas de Negocio</h2>
              <Badge variant="outline">Reglas & Validaciones</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              • Cálculo de cuotas reales (cuota × cursos activos)<br/>
              • Sistema de mora automático (después del día 5)<br/>
              • Validación de paths Moodle (depth=3)<br/>
              • Warnings de inconsistencias Moodle ↔ PostgreSQL<br/>
              • Estados financieros: PAGADO_COMPLETO, MOROSO, PAGO_PARCIAL, etc.<br/>
              • Detección de pagos duplicados
            </p>
          </div>

          <DashboardMetricas />
        </TabsContent>
      </Tabs>
    </div>
  )
}
