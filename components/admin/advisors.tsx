"use client"

import { useState } from "react"
import { UserPlus, MoreHorizontal, Settings2, PieChart, BarChart3, Percent, DollarSign, Award } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

// Definir interfaces para los tipos de datos
interface Advisor {
  id: string
  name: string
  leads: number
  conversions: number
  revenue: number
  commission: number
  commissionRate: number
  hasCustomRate: boolean
  performance: "high" | "medium" | "low"
  lastMonthCommission: number
  trend: "up" | "down"
}

// Actualizar el mockAdvisorData para incluir más información relevante para comisiones
const mockAdvisorData: Advisor[] = [
  {
    id: "1",
    name: "Carlos Rodríguez",
    leads: 45,
    conversions: 12,
    revenue: 24500,
    commission: 2940, // 12% de comisión
    commissionRate: 12,
    hasCustomRate: true,
    performance: "high",
    lastMonthCommission: 2650,
    trend: "up",
  },
  {
    id: "2",
    name: "Ana López",
    leads: 38,
    conversions: 9,
    revenue: 18200,
    commission: 1820, // 10% de comisión
    commissionRate: 10,
    hasCustomRate: false,
    performance: "medium",
    lastMonthCommission: 1920,
    trend: "down",
  },
  {
    id: "3",
    name: "Miguel Hernández",
    leads: 52,
    conversions: 15,
    revenue: 31000,
    commission: 4650, // 15% de comisión (tasa más alta por alto rendimiento)
    commissionRate: 15,
    hasCustomRate: true,
    performance: "high",
    lastMonthCommission: 4200,
    trend: "up",
  },
  {
    id: "4",
    name: "Laura Martínez",
    leads: 29,
    conversions: 7,
    revenue: 14300,
    commission: 1144, // 8% de comisión
    commissionRate: 8,
    hasCustomRate: true,
    performance: "low",
    lastMonthCommission: 1300,
    trend: "down",
  },
]

// Reemplazar la función Advisors completa
export function Advisors() {
  const [newAdvisorModalOpen, setNewAdvisorModalOpen] = useState(false)
  const [commissionSettingsOpen, setCommissionSettingsOpen] = useState(false)
  const [commissionRate, setCommissionRate] = useState(10)
  const [bonusThreshold, setBonusThreshold] = useState(10)
  const [bonusRate, setBonusRate] = useState(5)
  const [advisorData, setAdvisorData] = useState<Advisor[]>(mockAdvisorData)
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null)
  const [adjustCommissionOpen, setAdjustCommissionOpen] = useState(false)
  const [newCommissionRate, setNewCommissionRate] = useState(10)
  const [commissionPreview, setCommissionPreview] = useState(0)
  const [commissionPeriod, setCommissionPeriod] = useState("monthly")
  const [showTrends, setShowTrends] = useState(true)

  // Calcular el total de comisiones
  const totalCommissions = advisorData.reduce((sum, advisor) => sum + advisor.commission, 0)

  // Función para abrir el diálogo de ajuste de comisión
  const openAdjustCommission = (advisor: Advisor): void => {
    setSelectedAdvisor(advisor)
    setNewCommissionRate(advisor.commissionRate)
    setCommissionPreview(calculateCommission(advisor.revenue, advisor.commissionRate))
    setAdjustCommissionOpen(true)
  }

  // Función para calcular comisión basada en ingresos y tasa
  const calculateCommission = (revenue: number, rate: number): number => {
    return (revenue * rate) / 100
  }

  // Función para guardar la nueva tasa de comisión
  const saveCommissionRate = (): void => {
    if (!selectedAdvisor) return

    const updatedAdvisors = advisorData.map((advisor) => {
      if (advisor.id === selectedAdvisor.id) {
        const newCommission = calculateCommission(advisor.revenue, newCommissionRate)
        return {
          ...advisor,
          commissionRate: newCommissionRate,
          commission: newCommission,
          hasCustomRate: true,
        }
      }
      return advisor
    })

    setAdvisorData(updatedAdvisors)
    setAdjustCommissionOpen(false)
  }

  // Función para aplicar configuración global de comisiones
  const applyGlobalCommissionSettings = (): void => {
    const updatedAdvisors = advisorData.map((advisor) => {
      // Solo actualizar asesores sin tasa personalizada
      if (!advisor.hasCustomRate) {
        let effectiveRate = commissionRate

        // Aplicar bonificación si supera el umbral
        if (advisor.conversions >= bonusThreshold) {
          effectiveRate += bonusRate
        }

        const newCommission = calculateCommission(advisor.revenue, effectiveRate)
        return {
          ...advisor,
          commissionRate: effectiveRate,
          commission: newCommission,
        }
      }
      return advisor
    })

    setAdvisorData(updatedAdvisors)
    setCommissionSettingsOpen(false)
  }

  // Función para renderizar el indicador de tendencia
  const renderTrend = (advisor: Advisor) => {
    if (!showTrends) return null

    const percentChange = ((advisor.commission - advisor.lastMonthCommission) / advisor.lastMonthCommission) * 100
    const isPositive = advisor.trend === "up"

    return (
      <Badge variant={isPositive ? "success" : "destructive"} className="ml-2">
        {isPositive ? "+" : ""}
        {percentChange.toFixed(1)}%
      </Badge>
    )
  }

  // Función para renderizar el indicador de rendimiento
  const renderPerformanceBadge = (performance: "high" | "medium" | "low") => {
    switch (performance) {
      case "high":
        return <Badge className="bg-green-500">Alto</Badge>
      case "medium":
        return <Badge className="bg-blue-500">Medio</Badge>
      case "low":
        return <Badge className="bg-amber-500">Bajo</Badge>
      default:
        return null
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Rendimiento de Asesores</CardTitle>
            <CardDescription className="mt-1">
              Gestiona el rendimiento y las comisiones de tu equipo de ventas
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={commissionSettingsOpen} onOpenChange={setCommissionSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings2 className="h-4 w-4 mr-2" />
                  Configurar Comisiones
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Configuración de Comisiones</DialogTitle>
                  <DialogDescription>Establece los parámetros globales para el cálculo de comisiones</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="commission-rate">Tasa de comisión base ({commissionRate}%)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        id="commission-rate"
                        min={1}
                        max={30}
                        step={0.5}
                        value={[commissionRate]}
                        onValueChange={(value) => setCommissionRate(value[0])}
                        className="flex-1"
                      />
                      <span className="w-12 text-right font-medium">{commissionRate}%</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Porcentaje base aplicado a los ingresos generados</p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bonus-threshold">Umbral para bonificación ({bonusThreshold} conversiones)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        id="bonus-threshold"
                        min={1}
                        max={20}
                        step={1}
                        value={[bonusThreshold]}
                        onValueChange={(value) => setBonusThreshold(value[0])}
                        className="flex-1"
                      />
                      <span className="w-12 text-right font-medium">{bonusThreshold}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Número de conversiones para aplicar tasa de bonificación
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bonus-rate">Tasa de bonificación adicional ({bonusRate}%)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        id="bonus-rate"
                        min={0.5}
                        max={10}
                        step={0.5}
                        value={[bonusRate]}
                        onValueChange={(value) => setBonusRate(value[0])}
                        className="flex-1"
                      />
                      <span className="w-12 text-right font-medium">{bonusRate}%</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Porcentaje adicional para asesores que superen el umbral
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="commission-period">Período de cálculo</Label>
                    <Select value={commissionPeriod} onValueChange={setCommissionPeriod}>
                      <SelectTrigger id="commission-period">
                        <SelectValue placeholder="Seleccionar período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="biweekly">Quincenal</SelectItem>
                        <SelectItem value="monthly">Mensual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch id="respect-custom-rates" checked={true} disabled />
                    <Label htmlFor="respect-custom-rates">Respetar tasas personalizadas por asesor</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCommissionSettingsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={applyGlobalCommissionSettings}>Aplicar cambios</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button onClick={() => setNewAdvisorModalOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Nuevo Asesor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="table" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="table">Tabla General</TabsTrigger>
              <TabsTrigger value="commission">Comisiones</TabsTrigger>
            </TabsList>
            <TabsContent value="table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Leads</TableHead>
                    <TableHead>Conversiones</TableHead>
                    <TableHead>Ingresos</TableHead>
                    <TableHead>Rendimiento</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advisorData.map((advisor) => (
                    <TableRow key={advisor.id}>
                      <TableCell>{advisor.name}</TableCell>
                      <TableCell>{advisor.leads}</TableCell>
                      <TableCell>{advisor.conversions}</TableCell>
                      <TableCell>Q{advisor.revenue.toLocaleString()}</TableCell>
                      <TableCell>{renderPerformanceBadge(advisor.performance)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                            <DropdownMenuItem>Editar perfil</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openAdjustCommission(advisor)}>
                              Ajustar comisión
                            </DropdownMenuItem>
                            <DropdownMenuItem>Desactivar cuenta</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="commission">
              <div className="flex justify-end mb-4 space-x-4 items-center">
                <div className="flex items-center space-x-2">
                  <Switch id="show-trends" checked={showTrends} onCheckedChange={setShowTrends} />
                  <Label htmlFor="show-trends">Mostrar tendencias</Label>
                </div>
                <Select defaultValue={commissionPeriod} onValueChange={setCommissionPeriod}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Esta semana</SelectItem>
                    <SelectItem value="biweekly">Esta quincena</SelectItem>
                    <SelectItem value="monthly">Este mes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Conversiones</TableHead>
                    <TableHead>Ingresos</TableHead>
                    <TableHead>Comisión</TableHead>
                    <TableHead>Tasa</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advisorData.map((advisor) => (
                    <TableRow
                      key={advisor.id}
                      className={advisor.hasCustomRate ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}
                    >
                      <TableCell className="font-medium">
                        {advisor.name}
                        {advisor.hasCustomRate && (
                          <Badge variant="outline" className="ml-2">
                            Personalizada
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{advisor.conversions}</TableCell>
                      <TableCell>Q{advisor.revenue.toLocaleString()}</TableCell>
                      <TableCell className="font-medium text-green-600">
                        Q{advisor.commission.toLocaleString()}
                        {renderTrend(advisor)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{advisor.commissionRate}%</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="w-full">
                          <Progress
                            value={advisor.conversions * 10}
                            className={`h-2 ${
                              advisor.performance === "high"
                                ? "bg-green-500"
                                : advisor.performance === "medium"
                                ? "bg-blue-500"
                                : "bg-amber-500"
                            }`}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openAdjustCommission(advisor)}>
                              Ajustar comisión
                            </DropdownMenuItem>
                            <DropdownMenuItem>Ver historial</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Exportar reporte</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between border-t p-4 gap-4">
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <PieChart className="h-5 w-5 text-green-600" />
              <div>
                <span className="text-sm font-medium block">Total comisiones</span>
                <span className="text-lg font-bold text-green-600">Q{totalCommissions.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <Percent className="h-5 w-5 text-blue-600" />
              <div>
                <span className="text-sm font-medium block">Tasa promedio</span>
                <span className="text-lg font-bold text-blue-600">
                  {(advisorData.reduce((sum, advisor) => sum + advisor.commissionRate, 0) / advisorData.length).toFixed(
                    1,
                  )}
                  %
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-auto">
              <BarChart3 className="h-4 w-4 mr-2" />
              Ver análisis
            </Button>
            <Button className="flex-1 sm:flex-auto">Exportar reporte</Button>
          </div>
        </CardFooter>
      </Card>

      {/* Diálogo para ajustar comisión individual */}
      <Dialog open={adjustCommissionOpen} onOpenChange={setAdjustCommissionOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajustar Comisión para {selectedAdvisor?.name}</DialogTitle>
            <DialogDescription>Personaliza la tasa de comisión para este asesor específico</DialogDescription>
          </DialogHeader>
          {selectedAdvisor && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-600 mb-1" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Ingresos</span>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    Q{selectedAdvisor.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <Award className="h-5 w-5 text-green-600 mb-1" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Conversiones</span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    {selectedAdvisor.conversions}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="new-commission-rate">Tasa de comisión ({newCommissionRate}%)</Label>
                  <span className="text-sm text-muted-foreground">Tasa actual: {selectedAdvisor.commissionRate}%</span>
                </div>
                <div className="flex items-center gap-4">
                  <Slider
                    id="new-commission-rate"
                    min={1}
                    max={30}
                    step={0.5}
                    value={[newCommissionRate]}
                    onValueChange={(value) => {
                      setNewCommissionRate(value[0])
                      setCommissionPreview(calculateCommission(selectedAdvisor.revenue, value[0]))
                    }}
                    className="flex-1"
                  />
                  <span className="w-12 text-right font-medium">{newCommissionRate}%</span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Vista previa de comisión:</span>
                  <span className="text-sm font-medium text-green-600">Q{commissionPreview.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Comisión actual:</span>
                  <span>Q{selectedAdvisor.commission.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Diferencia:</span>
                  <span className={commissionPreview > selectedAdvisor.commission ? "text-green-600" : "text-red-600"}>
                    {commissionPreview > selectedAdvisor.commission ? "+" : ""}Q
                    {(commissionPreview - selectedAdvisor.commission).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustCommissionOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveCommissionRate}>Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
