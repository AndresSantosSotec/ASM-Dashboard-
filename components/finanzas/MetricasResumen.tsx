"use client"

/**
 * 📊 COMPONENTE: Métricas Resumen
 * 
 * 4 Cards principales con las métricas clave del dashboard
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Users } from "lucide-react"
import { formatCurrency } from "@/services/financialMetrics"
import type { FinancialMetrics } from "@/services/financialMetrics"

interface MetricasResumenProps {
  metrics: FinancialMetrics
}

export function MetricasResumen({ metrics }: MetricasResumenProps) {
  const variacion = metrics.recaudacion_total.variacion_porcentaje
  const isPositive = variacion >= 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Recaudación Total */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recaudación Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(metrics.recaudacion_total.mes_actual)}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
            {isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={isPositive ? "text-green-600" : "text-red-600"}>
              {isPositive ? "+" : ""}{variacion.toFixed(1)}%
            </span>
            {" "}vs mes anterior
          </p>
        </CardContent>
      </Card>

      {/* Card 2: Pendiente de Cobro */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendiente de Cobro</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(metrics.recaudacion_pendiente.total)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Con mora: {formatCurrency(metrics.recaudacion_pendiente.con_mora)}
          </p>
        </CardContent>
      </Card>

      {/* Card 3: Estudiantes Morosos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estudiantes Morosos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {metrics.recaudacion_pendiente.estudiantes_morosos}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            De {metrics.metadata.estudiantes_evaluados} estudiantes activos
          </p>
        </CardContent>
      </Card>

      {/* Card 4: Tasa de Cobro */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasa de Cobro</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(
              (metrics.recaudacion_total.mes_actual /
                (metrics.recaudacion_total.mes_actual +
                  metrics.recaudacion_pendiente.total)) *
              100
            ).toFixed(1)}
            %
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Efectividad de recaudación
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
