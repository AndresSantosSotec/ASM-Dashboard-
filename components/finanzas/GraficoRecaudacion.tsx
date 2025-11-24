"use client"

/**
 * 📈 COMPONENTE: Gráfico de Recaudación
 * 
 * Gráfico de líneas mostrando tendencia de recaudación vs esperado
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import type { HistorialMensual } from "@/services/financialMetrics"
import { formatCurrency } from "@/services/financialMetrics"

interface GraficoRecaudacionProps {
  historial: HistorialMensual[]
}

export function GraficoRecaudacion({ historial }: GraficoRecaudacionProps) {
  // Transformar datos para el gráfico
  const data = historial.map((item) => ({
    mes: item.mes.split('-')[1] + '/' + item.mes.split('-')[0].slice(2), // "11/25"
    recaudado: item.recaudado,
    esperado: item.esperado,
    tasa: item.tasa_cobro,
  }))

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Tendencia de Recaudación</CardTitle>
        <CardDescription>
          Comparación de ingresos reales vs esperados (últimos 6 meses)
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="mes"
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
                            Recaudado
                          </span>
                          <span className="font-bold text-green-600">
                            {formatCurrency(payload[0].value as number)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Esperado
                          </span>
                          <span className="font-bold text-blue-600">
                            {formatCurrency(payload[1].value as number)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">
                          Tasa: {payload[0].payload.tasa.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="recaudado"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={false}
              name="Recaudado"
            />
            <Line
              type="monotone"
              dataKey="esperado"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
              name="Esperado"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
