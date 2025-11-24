"use client"

/**
 * 🎓 COMPONENTE: Distribución por Programas
 * 
 * Gráfico de barras mostrando rendimiento financiero por programa
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"
import type { ProgramaMetricas } from "@/services/financialMetrics"
import { formatCurrency } from "@/services/financialMetrics"

interface DistribucionProgramasProps {
  programas: ProgramaMetricas[]
}

export function DistribucionProgramas({ programas }: DistribucionProgramasProps) {
  // Transformar datos para el gráfico
  const data = programas.map((p) => ({
    nombre: p.abreviatura || p.nombre.substring(0, 10),
    ingresos: p.ingresos,
    deuda: p.deuda,
    tasa: p.tasa_cobro,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución por Programa</CardTitle>
        <CardDescription>
          Comparación de ingresos vs deuda por programa académico
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="nombre"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `Q${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Ingresos
                          </span>
                          <span className="font-bold text-green-600">
                            {formatCurrency(payload[0].value as number)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Deuda
                          </span>
                          <span className="font-bold text-red-600">
                            {formatCurrency(payload[1].value as number)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">
                          Tasa cobro: {payload[0].payload.tasa.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend />
            <Bar dataKey="ingresos" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Ingresos" />
            <Bar dataKey="deuda" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Deuda" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
