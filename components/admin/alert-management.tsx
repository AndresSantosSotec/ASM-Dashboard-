"use client"

import { RefreshCw, MoreHorizontal, AlertTriangle, CheckCircle, UserPlus } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mock data
const mockAlerts = [
  {
    id: "1",
    prospectName: "Juan Pérez",
    advisorName: "Carlos Rodríguez",
    type: "followUp",
    daysWithoutContact: 8,
    priority: "high",
    status: "pending",
  },
  {
    id: "2",
    prospectName: "María García",
    advisorName: "Ana López",
    type: "information",
    daysWithoutContact: 6,
    priority: "medium",
    status: "pending",
  },
  {
    id: "3",
    prospectName: "Pedro Sánchez",
    advisorName: "Miguel Hernández",
    type: "meeting",
    daysWithoutContact: 5,
    priority: "medium",
    status: "pending",
  },
  {
    id: "4",
    prospectName: "Ana Martínez",
    advisorName: "Laura Martínez",
    type: "followUp",
    daysWithoutContact: 3,
    priority: "low",
    status: "pending",
  },
]

export function AlertManagement() {
  return (
    <div className="space-y-6">
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all-medium overflow-hidden animate-fadeIn">
        <CardHeader className="border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Alertas por Tiempo de Seguimiento</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las prioridades</SelectItem>
                  <SelectItem value="high">Alta prioridad</SelectItem>
                  <SelectItem value="medium">Media prioridad</SelectItem>
                  <SelectItem value="low">Baja prioridad</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="w-full sm:w-auto">
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
                  <TableHead>Prospecto</TableHead>
                  <TableHead>Asesor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Días sin contacto</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAlerts.map((alert) => (
                  <TableRow
                    key={alert.id}
                    className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all-fast"
                  >
                    <TableCell className="font-medium">{alert.prospectName}</TableCell>
                    <TableCell>{alert.advisorName}</TableCell>
                    <TableCell>
                      {alert.type === "followUp" && "Seguimiento"}
                      {alert.type === "information" && "Información"}
                      {alert.type === "meeting" && "Reunión"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          alert.daysWithoutContact >= 7
                            ? "destructive"
                            : alert.daysWithoutContact >= 5
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {alert.daysWithoutContact} días
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          alert.priority === "high"
                            ? "destructive"
                            : alert.priority === "medium"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {alert.priority === "high" && "Alta"}
                        {alert.priority === "medium" && "Media"}
                        {alert.priority === "low" && "Baja"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{alert.status === "pending" ? "Pendiente" : "Completado"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Ver detalle</DropdownMenuItem>
                            <DropdownMenuItem>Enviar email</DropdownMenuItem>
                            <DropdownMenuItem>Reasignar asesor</DropdownMenuItem>
                            <DropdownMenuItem>Cambiar prioridad</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all-medium animate-fadeIn">
          <CardHeader className="bg-red-50 dark:bg-red-900/20 border-b">
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <span>Alertas Rojas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">5</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Prospectos sin seguimiento por más de 7 días</p>
            <Button className="mt-4 w-full" variant="destructive">
              Ver todos
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all-medium animate-fadeIn">
          <CardHeader className="bg-yellow-50 dark:bg-yellow-900/20 border-b">
            <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              <span>Alertas Amarillas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">12</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Prospectos sin seguimiento por 5-6 días</p>
            <Button className="mt-4 w-full" variant="secondary">
              Ver todos
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all-medium animate-fadeIn">
          <CardHeader className="bg-green-50 dark:bg-green-900/20 border-b">
            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span>Alertas Verdes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">27</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Prospectos con seguimiento regular (1-4 días)</p>
            <Button className="mt-4 w-full border-green-500 text-green-600 hover:bg-green-50" variant="outline">
              Ver todos
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all-medium animate-fadeIn">
        <CardHeader>
          <CardTitle>Configuración de Tiempos de Alerta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="greenAlertDays">Alerta Verde (días)</Label>
              <div className="flex items-center gap-2">
                <Input id="greenAlertDays" type="number" defaultValue="1" className="w-20" />
                <span className="text-xs text-gray-500">a</span>
                <Input type="number" defaultValue="4" className="w-20" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="yellowAlertDays">Alerta Amarilla (días)</Label>
              <div className="flex items-center gap-2">
                <Input id="yellowAlertDays" type="number" defaultValue="5" className="w-20" />
                <span className="text-xs text-gray-500">a</span>
                <Input type="number" defaultValue="6" className="w-20" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="redAlertDays">Alerta Roja (días)</Label>
              <div className="flex items-center gap-2">
                <Input id="redAlertDays" type="number" defaultValue="7" className="w-20" />
                <span className="text-xs text-gray-500">o más</span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Button>Guardar configuración</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

