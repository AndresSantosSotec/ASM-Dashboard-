"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GraduationCap, ListChecks } from "lucide-react"

import { CuotasEstudiantesTab } from "./mantenimientos/cuotas-estudiantes-tab"
import { KardexPagosTab } from "./mantenimientos/kardex-pagos-tab"

export function MantenimientosFinancieros() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Mantenimientos financieros</h2>
        <p className="text-muted-foreground">
          Administre el kardex de pagos y las cuotas estudiantiles desde una vista dedicada de mantenimiento.
        </p>
      </div>

      <section className="space-y-4">
        <Tabs defaultValue="kardex" className="space-y-4">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-2">
            <TabsTrigger value="kardex" className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              <span>Kardex de pagos</span>
            </TabsTrigger>
            <TabsTrigger value="cuotas" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span>Cuotas por estudiante</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kardex">
            <KardexPagosTab />
          </TabsContent>

          <TabsContent value="cuotas">
            <CuotasEstudiantesTab />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}

export { KardexPagosTab, CuotasEstudiantesTab }
