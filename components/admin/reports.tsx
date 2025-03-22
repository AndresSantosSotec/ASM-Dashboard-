"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function Reports() {
  const handleGenerateReport = (reportType: string) => {
    console.log(`Generando reporte de ${reportType}...`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reportes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={() => handleGenerateReport("leads")} className="w-full sm:w-auto">
            Generar Reporte de Leads
          </Button>
          <Button onClick={() => handleGenerateReport("conversiones")} className="w-full sm:w-auto">
            Generar Reporte de Conversiones
          </Button>
          <Button onClick={() => handleGenerateReport("ingresos")} className="w-full sm:w-auto">
            Generar Reporte de Ingresos
          </Button>
          <Button onClick={() => handleGenerateReport("rendimiento")} className="w-full sm:w-auto">
            Generar Reporte de Rendimiento de Asesores
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

