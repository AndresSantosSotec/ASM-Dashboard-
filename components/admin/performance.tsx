"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function Performance() {
  const [selectedMetric, setSelectedMetric] = useState("leads")

  // Mock data for the chart
  const mockAdvisorData = [
    {
      id: "1",
      name: "Carlos Rodríguez",
      leads: 45,
      conversions: 12,
      revenue: 24500,
    },
    {
      id: "2",
      name: "Ana López",
      leads: 38,
      conversions: 9,
      revenue: 18200,
    },
    {
      id: "3",
      name: "Miguel Hernández",
      leads: 52,
      conversions: 15,
      revenue: 31000,
    },
    {
      id: "4",
      name: "Laura Martínez",
      leads: 29,
      conversions: 7,
      revenue: 14300,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Métricas de Rendimiento</CardTitle>
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar métrica" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="leads">Leads</SelectItem>
              <SelectItem value="conversions">Conversiones</SelectItem>
              <SelectItem value="revenue">Ingresos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center">
          {/* This is a placeholder for the chart */}
          <div className="text-center">
            <p className="text-gray-500">Gráfico de barras mostrando {selectedMetric} por asesor</p>
            <div className="mt-4 grid grid-cols-4 gap-4">
              {mockAdvisorData.map((advisor) => (
                <div key={advisor.id} className="flex flex-col items-center">
                  <div
                    className="bg-blue-500 w-12"
                    style={{
                      height:
                        selectedMetric === "leads"
                          ? `${advisor.leads * 2}px`
                          : selectedMetric === "conversions"
                            ? `${advisor.conversions * 10}px`
                            : `${advisor.revenue / 200}px`,
                    }}
                  ></div>
                  <p className="text-xs mt-2">{advisor.name.split(" ")[0]}</p>
                  <p className="text-xs font-bold">
                    {selectedMetric === "leads"
                      ? advisor.leads
                      : selectedMetric === "conversions"
                        ? advisor.conversions
                        : `Q${advisor.revenue}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

