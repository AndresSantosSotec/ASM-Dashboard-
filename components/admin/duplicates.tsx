"use client"

import { RefreshCw, UserPlus, Settings } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock data
const mockDuplicates = [
  {
    id: "1",
    originalProspect: {
      name: "Juan Pérez",
      email: "juan@example.com",
      phone: "1234567890",
      advisorName: "Carlos Rodríguez",
      entryDate: "15/02/2025",
    },
    duplicateProspect: {
      name: "Juan Pérez González",
      email: "juan.perez@example.com",
      phone: "1234567890",
      advisorName: "Ana López",
      entryDate: "18/02/2025",
    },
    similarityScore: 95,
    status: "pending",
  },
  {
    id: "2",
    originalProspect: {
      name: "María García",
      email: "maria@example.com",
      phone: "9876543210",
      advisorName: "Miguel Hernández",
      entryDate: "10/02/2025",
    },
    duplicateProspect: {
      name: "María García López",
      email: "maria.garcia@example.com",
      phone: "9876543210",
      advisorName: "Laura Martínez",
      entryDate: "20/02/2025",
    },
    similarityScore: 90,
    status: "pending",
  },
]

export function Duplicates() {
  return (
    <div className="space-y-6">
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all-medium overflow-hidden animate-fadeIn">
        <CardHeader className="border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Detección de Registros Duplicados</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button className="w-full sm:w-auto">
                <RefreshCw className="mr-2 h-4 w-4" />
                Buscar duplicados
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registro original</TableHead>
                  <TableHead>Registro duplicado</TableHead>
                  <TableHead>Similitud</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockDuplicates.map((duplicate) => (
                  <TableRow
                    key={duplicate.id}
                    className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all-fast"
                  >
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{duplicate.originalProspect.name}</div>
                        <div className="text-xs text-gray-500">{duplicate.originalProspect.email}</div>
                        <div className="text-xs text-gray-500">{duplicate.originalProspect.phone}</div>
                        <div className="text-xs">Asesor: {duplicate.originalProspect.advisorName}</div>
                        <div className="text-xs">Ingreso: {duplicate.originalProspect.entryDate}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{duplicate.duplicateProspect.name}</div>
                        <div className="text-xs text-gray-500">{duplicate.duplicateProspect.email}</div>
                        <div className="text-xs text-gray-500">{duplicate.duplicateProspect.phone}</div>
                        <div className="text-xs">Asesor: {duplicate.duplicateProspect.advisorName}</div>
                        <div className="text-xs">Ingreso: {duplicate.duplicateProspect.entryDate}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          duplicate.similarityScore >= 90
                            ? "destructive"
                            : duplicate.similarityScore >= 80
                              ? "warning"
                              : "outline"
                        }
                        className="min-w-[50px] text-center"
                      >
                        {duplicate.similarityScore}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{duplicate.status === "pending" ? "Pendiente" : "Resuelto"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
                          Mantener original
                        </Button>
                        <Button size="sm" variant="outline" className="w-full">
                          Mantener duplicado
                        </Button>
                        <Button size="sm" variant="destructive" className="w-full">
                          Eliminar duplicado
                        </Button>
                        <Button size="sm" variant="outline" className="w-full">
                          Marcar como revisado
                        </Button>
                      </div>
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
            <CardTitle>Reasignación de Prospectos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Asesor origen</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar asesor origen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Juan Pérez</SelectItem>
                    <SelectItem value="2">María García</SelectItem>
                    <SelectItem value="3">Carlos Rodríguez</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Asesor destino</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar asesor destino" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Juan Pérez</SelectItem>
                    <SelectItem value="2">María García</SelectItem>
                    <SelectItem value="3">Carlos Rodríguez</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Motivo de reasignación</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacation">Vacaciones</SelectItem>
                    <SelectItem value="leave">Baja</SelectItem>
                    <SelectItem value="workload">Balanceo de carga</SelectItem>
                    <SelectItem value="specialization">Especialización</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-2">
                <Button className="w-full">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Reasignar prospectos
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all-medium animate-fadeIn">
          <CardHeader>
            <CardTitle>Integración con ManyChat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Conexión activa</span>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  Sincronizado
                </Badge>
              </div>
              <div className="space-y-2">
                <Label>Última sincronización</Label>
                <Input readOnly value="2025-03-08 10:45:23" />
              </div>
              <div className="space-y-2">
                <Label>Leads importados hoy</Label>
                <div className="text-2xl font-bold">15</div>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <Button>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sincronizar ahora
                </Button>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurar integración
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

