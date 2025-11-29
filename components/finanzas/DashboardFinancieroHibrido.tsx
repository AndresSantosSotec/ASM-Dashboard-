"use client"

/**
 * 💰 DASHBOARD FINANCIERO HÍBRIDO
 * 
 * Combina dos vistas:
 * 1. Vista ACTIVOS - Estudiantes activos este mes en Moodle
 * 2. Vista UNIVERSO - TODOS los estudiantes (Moodle + CRM)
 * 
 * El usuario puede alternar entre las dos vistas con tabs
 */

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen,
  Globe
} from "lucide-react"

// Componentes existentes
import { DashboardFinanciero as DashboardClasico } from "./dashboard-financiero"
import { UniversoEstudiantes } from "./UniversoEstudiantes"

export function DashboardFinancieroHibrido() {
  const [tabActiva, setTabActiva] = useState<"activos" | "universo">("activos")

  return (
    <div className="space-y-6">
      {/* Header con descripción */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Financiero</h1>
          <p className="text-muted-foreground">
            Análisis completo con dos perspectivas: activos del mes y universo completo de estudiantes
          </p>
        </div>
      </div>

      {/* Tabs para alternar vistas */}
      <Tabs value={tabActiva} onValueChange={(v) => setTabActiva(v as any)} className="w-full">
        <TabsList className="grid w-full max-w-[600px] grid-cols-2">
          {/* TAB 1: Estudiantes Activos Este Mes */}
          <TabsTrigger value="activos" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Activos del Mes</span>
            <Badge variant="secondary" className="ml-1">
              Moodle
            </Badge>
          </TabsTrigger>

          {/* TAB 2: Universo Completo */}
          <TabsTrigger value="universo" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span>Universo Completo</span>
            <Badge variant="secondary" className="ml-1">
              Todos
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* TAB CONTENT 1: Estudiantes Activos Este Mes */}
        <TabsContent value="activos" className="space-y-4 mt-6">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Estudiantes Activos Este Mes</h2>
              <Badge variant="outline">Matriculados en Moodle</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              • Estudiantes con cursos matriculados este mes en Moodle<br/>
              • Cursos activos por estudiante<br/>
              • Pagos recientes y alertas de mora<br/>
              • Filtros por mes/año
            </p>
          </div>
          
          <DashboardClasico />
        </TabsContent>

        {/* TAB CONTENT 2: Universo Completo de Estudiantes */}
        <TabsContent value="universo" className="space-y-4 mt-6">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Universo Completo de Estudiantes</h2>
              <Badge variant="outline">Moodle + CRM</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              • TODOS los estudiantes registrados en Moodle (histórico completo)<br/>
              • Información de programas inscritos en CRM<br/>
              • Estado financiero: deudas, pagos realizados<br/>
              • Filtros por programa, estado financiero, búsqueda por carnet/nombre<br/>
              • Fechas de primera y última matrícula
            </p>
          </div>

          <UniversoEstudiantes />
        </TabsContent>
      </Tabs>
    </div>
  )
}

