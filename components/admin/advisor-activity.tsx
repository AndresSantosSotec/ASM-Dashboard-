"use client"

import { RefreshCw, MoreHorizontal } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mock data
const mockAdvisorActivity = [
  {
    id: "1",
    name: "Carlos ",
    inscriptions: 3,
    possibleClosings: 5,
    calls: 18,
    telemarketing: 25,
    followUps: 22,
    status: "success",
  },
  {
    id: "2",
    name: "Ana López",
    inscriptions: 2,
    possibleClosings: 4,
    calls: 15,
    telemarketing: 22,
    followUps: 20,
    status: "success",
  },
  {
    id: "3",
    name: "Miguel Hernández",
    inscriptions: 1,
    possibleClosings: 3,
    calls: 12,
    telemarketing: 18,
    followUps: 15,
    status: "warning",
  },
  {
    id: "4",
    name: "Laura Martínez",
    inscriptions: 0,
    possibleClosings: 2,
    calls: 10,
    telemarketing: 15,
    followUps: 12,
    status: "warning",
  },
]

export function AdvisorActivity() {
  return (
    <div className="space-y-6">
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all-medium overflow-hidden animate-fadeIn">
        <CardHeader className="border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Actividad Diaria de Asesores</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Input type="date" defaultValue="2025-03-08" className="w-full sm:w-auto rounded-lg" />
              <Button className="w-full sm:w-auto rounded-lg">
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asesor</TableHead>
                  <TableHead className="text-center">Inscritos</TableHead>
                  <TableHead className="text-center">Posibles Cierres</TableHead>
                  <TableHead className="text-center">Llamadas</TableHead>
                  <TableHead className="text-center">Telemercadeo</TableHead>
                  <TableHead className="text-center">Seguimientos</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAdvisorActivity.map((activity) => (
                  <TableRow
                    key={activity.id}
                    className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all-fast"
                  >
                    <TableCell className="font-medium">{activity.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={activity.inscriptions >= 2 ? "success" : "destructive"} className="min-w-[40px]">
                        {activity.inscriptions}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{activity.possibleClosings}</TableCell>
                    <TableCell className="text-center">{activity.calls}</TableCell>
                    <TableCell className="text-center">{activity.telemarketing}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={activity.followUps >= 20 ? "success" : "destructive"} className="min-w-[40px]">
                        {activity.followUps}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={activity.status === "success" ? "success" : "destructive"}>
                        {activity.status === "success" ? "Cumplido" : "En proceso"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Ver detalle</DropdownMenuItem>
                          <DropdownMenuItem>Enviar recordatorio</DropdownMenuItem>
                          <DropdownMenuItem>Exportar reporte</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all-medium animate-fadeIn">
          <CardHeader>
            <CardTitle>Cumplimiento de KPIs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Cierres (mín. 2 diarios)</h3>
                  <p className="text-sm text-gray-500">Promedio equipo: 2.0</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: "100%" }}></div>
                  </div>
                  <span className="font-medium">100%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Seguimientos (mín. 20 diarios)</h3>
                  <p className="text-sm text-gray-500">Promedio equipo: 21.3</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: "107%" }}></div>
                  </div>
                  <span className="font-medium">107%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Llamadas diarias</h3>
                  <p className="text-sm text-gray-500">Promedio equipo: 18.3</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: "92%" }}></div>
                  </div>
                  <span className="font-medium">92%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Telemercadeo</h3>
                  <p className="text-sm text-gray-500">Promedio equipo: 24.3</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: "97%" }}></div>
                  </div>
                  <span className="font-medium">97%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all-medium animate-fadeIn">
          <CardHeader>
            <CardTitle>Resumen de Actividad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">6</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Inscritos hoy</span>
                </div>
                <div className="flex flex-col items-center justify-center bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <span className="text-3xl font-bold text-green-600 dark:text-green-400">14</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Posibles cierres</span>
                </div>
                <div className="flex flex-col items-center justify-center bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">55</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Llamadas</span>
                </div>
                <div className="flex flex-col items-center justify-center bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                  <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">73</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Seguimientos</span>
                </div>
              </div>
              <Button className="w-full" variant="outline">
                <span className="mr-2">📄</span>
                Generar reporte completo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

