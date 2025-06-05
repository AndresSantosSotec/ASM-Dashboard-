"use client"

import React, { useState, useEffect } from "react"
import Swal from "sweetalert2"
import { UserPlus, MoreHorizontal, Settings2, PieChart, BarChart3, Percent, DollarSign, Award } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { API_BASE_URL } from "@/utils/apiConfig"

// Endpoints
const API_BASE = `${API_BASE_URL}/api`
const API_USERS_ROLE = `${API_BASE}/users/role/7`
const API_USERS = `${API_BASE}/users`
const API_COMM = `${API_BASE}/commissions`

// Wrappers
const safeFetch = async (input: RequestInfo, init?: RequestInit) => {
  const token = localStorage.getItem("token")
  try {
    const res = await fetch(input, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(init?.headers as any),
      },
    })

    if (!res.ok) {
      const txt = await res.text()
      throw new Error(`HTTP ${res.status}: ${txt}`)
    }

    return res
  } catch (err) {
    console.error("Fetch failed:", err)
    throw err
  }
}

interface Advisor {
  id: string
  name: string
}

interface CommissionConfig {
  base_rate: number
  bonus_threshold: number
  bonus_rate: number
  period: "monthly" | "quarterly"
  respect_personalized: boolean
}

interface CommissionRecord {
  user_id: number
  conversions: number
  total_income: number
  commission_amount: number
  rate_applied: number
  period_start: string
  period_end: string
  trend_percent?: number
}

export function Advisors() {
  const [asesores, setAsesores] = useState<Advisor[]>([])
  const [config, setConfig] = useState<CommissionConfig | null>(null)
  const [records, setRecords] = useState<CommissionRecord[]>([])

  // Estados de UI: comisiones
  const [commissionSettingsOpen, setCommissionSettingsOpen] = useState(false)
  const [commissionRate, setCommissionRate] = useState(10)
  const [bonusThreshold, setBonusThreshold] = useState(10)
  const [bonusRate, setBonusRate] = useState(5)
  const [commissionPeriod, setCommissionPeriod] = useState<"monthly" | "quarterly">("monthly")
  const [showTrends, setShowTrends] = useState(true)

  // Estados de UI: ajustar comisión individual
  const [selectedAdvisor, setSelectedAdvisor] = useState<CommissionRecord | null>(null)
  const [adjustCommissionOpen, setAdjustCommissionOpen] = useState(false)
  const [newCommissionRate, setNewCommissionRate] = useState(10)
  const [commissionPreview, setCommissionPreview] = useState(0)

  // Estados de UI: CRUD de asesores
  const [editAdvisorModalOpen, setEditAdvisorModalOpen] = useState(false)
  const [deleteAdvisorConfirmOpen, setDeleteAdvisorConfirmOpen] = useState(false)
  const [currentAdvisor, setCurrentAdvisor] = useState<Advisor | null>(null)
  const [editAdvisorName, setEditAdvisorName] = useState("")

  // 1) Función de carga de asesores (rol=7)
  const loadAdvisors = async () => {
    try {
      const r = await safeFetch(API_USERS_ROLE)
      const json = await r.json()
      const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []
      setAsesores(
        list.map((u: any) => ({
          id: u.id.toString(),
          name: u.full_name ?? (u.first_name && u.last_name
            ? `${u.first_name} ${u.last_name}`
            : u.username) ?? "—",
        }))
      )
    } catch (err: any) {
      Swal.fire("Error al cargar asesores", err.message, "error")
    }
  }
  useEffect(() => { loadAdvisors() }, [])

  // 2) Cargar configuración global de comisiones
  useEffect(() => {
    (async () => {
      try {
        const r = await safeFetch(`${API_COMM}/config`)
        const c: CommissionConfig = await r.json()
        setConfig(c)
        setCommissionRate(c.base_rate)
        setBonusThreshold(c.bonus_threshold)
        setBonusRate(c.bonus_rate)
        setCommissionPeriod(c.period)
      } catch (err: any) {
        Swal.fire("Error al cargar configuración", err.message, "error")
      }
    })()
  }, [])

  // 3) Cargar comisiones para el periodo seleccionado
  useEffect(() => {
    if (!config) return
    (async () => {
      try {
        const qs = new URLSearchParams({ period: commissionPeriod })
        const r = await safeFetch(`${API_COMM}?${qs}`)
        const p = await r.json()
        setRecords(p.data || [])
      } catch (err: any) {
        Swal.fire("Error al cargar comisiones", err.message, "error")
      }
    })()
  }, [config, commissionPeriod])

  // 4) Aplicar configuración global
  const applyGlobalCommissionSettings = async () => {
    try {
      const body = JSON.stringify({
        base_rate: commissionRate,
        bonus_threshold: bonusThreshold,
        bonus_rate: bonusRate,
        period: commissionPeriod,
      })
      const r = await safeFetch(`${API_COMM}/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body,
      })
      const c = await r.json()
      setConfig(c)
      setCommissionSettingsOpen(false)
      Swal.fire("Configuración guardada", "", "success")
    } catch (err: any) {
      Swal.fire("Error guardando configuración", err.message, "error")
    }
  }

  // 5) Ajustar tasa individual
  const saveCommissionRate = async () => {
    if (!selectedAdvisor) return
    try {
      await safeFetch(`${API_COMM}/rates/${selectedAdvisor.user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate: newCommissionRate }),
      })
      setAdjustCommissionOpen(false)
      Swal.fire("Tasa actualizada", "", "success")
      setCommissionPeriod(p => p)
    } catch (err: any) {
      Swal.fire("Error actualizando tasa", err.message, "error")
    }
  }

  // 6) Editar Asesor
  const openEditModal = (adv: Advisor) => {
    setCurrentAdvisor(adv)
    setEditAdvisorName(adv.name)
    setEditAdvisorModalOpen(true)
  }
  const handleUpdateAdvisor = async () => {
    if (!currentAdvisor) return
    try {
      await safeFetch(`${API_USERS}/${currentAdvisor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: editAdvisorName }),
      })
      setEditAdvisorModalOpen(false)
      Swal.fire("Asesor actualizado", "", "success")
      loadAdvisors()
    } catch (err: any) {
      Swal.fire("Error actualizando asesor", err.message, "error")
    }
  }

  // 7) Eliminar Asesor
  const openDeleteModal = (adv: Advisor) => {
    setCurrentAdvisor(adv)
    setDeleteAdvisorConfirmOpen(true)
  }
  const handleDeleteAdvisor = async () => {
    if (!currentAdvisor) return
    try {
      await safeFetch(`${API_USERS}/${currentAdvisor.id}`, {
        method: "DELETE",
      })
      setDeleteAdvisorConfirmOpen(false)
      Swal.fire("Asesor eliminado", "", "success")
      loadAdvisors()
    } catch (err: any) {
      Swal.fire("Error eliminando asesor", err.message, "error")
    }
  }

  // 8) Preparar datos para la UI de comisiones
  type Row = {
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
  const advisorData: Row[] = asesores.map(a => {
    const rec = records.find(r => r.user_id.toString() === a.id)
    const conv = rec?.conversions || 0
    const inc = rec?.total_income || 0
    const comm = rec?.commission_amount || 0
    const rate = rec?.rate_applied || config?.base_rate || 0
    return {
      id: a.id,
      name: a.name,
      leads: conv * 2,
      conversions: conv,
      revenue: inc,
      commission: comm,
      commissionRate: rate,
      hasCustomRate: !!rec,
      performance: conv > bonusThreshold
        ? "high"
        : conv > bonusThreshold / 2
          ? "medium"
          : "low",
      lastMonthCommission: comm * 0.9,
      trend: comm >= (rec?.commission_amount || 0)
        ? "up"
        : "down",
    }
  })
  const totalCommissions = advisorData.reduce((sum, a) => sum + a.commission, 0)

  const renderPerformanceBadge = (perf: "high" | "medium" | "low") => {
    switch (perf) {
      case "high": return <Badge className="bg-green-500">Alto</Badge>
      case "medium": return <Badge className="bg-blue-500">Medio</Badge>
      case "low": return <Badge className="bg-amber-500">Bajo</Badge>
    }
  }
  const renderTrend = (a: Row) => {
    if (!showTrends) return null
    const pct = a.lastMonthCommission
      ? ((a.commission - a.lastMonthCommission) / a.lastMonthCommission) * 100
      : 0
    const pos = pct >= 0
    return (
      <Badge variant={pos ? "success" : "destructive"} className="ml-2">
        {pos ? "+" : ""}{pct.toFixed(1)}%
      </Badge>
    )
  }
  const calculateCommission = (rev: number, rate: number) => Math.round((rev * rate) / 100)

  // Render
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
            {/* Modal de Configuración de Comisiones */}
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
                  <DialogDescription>
                    Establece los parámetros globales para el cálculo de comisiones
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* Tasa base */}
                  <div className="grid gap-2">
                    <Label htmlFor="commission-rate">
                      Tasa de comisión base ({commissionRate}%)
                    </Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        id="commission-rate"
                        min={1}
                        max={30}
                        step={0.5}
                        value={[commissionRate]}
                        onValueChange={v => setCommissionRate(v[0])}
                        className="flex-1"
                      />
                      <span className="w-12 text-right font-medium">
                        {commissionRate}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Porcentaje base aplicado a los ingresos generados
                    </p>
                  </div>
                  {/* Umbral */}
                  <div className="grid gap-2">
                    <Label htmlFor="bonus-threshold">
                      Umbral para bonificación ({bonusThreshold} conversiones)
                    </Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        id="bonus-threshold"
                        min={1}
                        max={50}
                        step={1}
                        value={[bonusThreshold]}
                        onValueChange={v => setBonusThreshold(v[0])}
                        className="flex-1"
                      />
                      <span className="w-12 text-right font-medium">
                        {bonusThreshold}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Número de conversiones para aplicar tasa de bonificación
                    </p>
                  </div>
                  {/* Bonus rate */}
                  <div className="grid gap-2">
                    <Label htmlFor="bonus-rate">
                      Tasa de bonificación adicional ({bonusRate}%)
                    </Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        id="bonus-rate"
                        min={0.5}
                        max={20}
                        step={0.5}
                        value={[bonusRate]}
                        onValueChange={v => setBonusRate(v[0])}
                        className="flex-1"
                      />
                      <span className="w-12 text-right font-medium">
                        {bonusRate}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Porcentaje adicional para asesores que superen el umbral
                    </p>
                  </div>
                  {/* Periodo */}
                  <div className="grid gap-2">
                    <Label htmlFor="commission-period">Período de cálculo</Label>
                    <Select
                      value={commissionPeriod}
                      onValueChange={v => setCommissionPeriod(v as any)}
                    >
                      <SelectTrigger id="commission-period">
                        <SelectValue placeholder="Seleccionar período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensual</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch id="respect-custom-rates" checked={true} disabled />
                    <Label htmlFor="respect-custom-rates">
                      Respetar tasas personalizadas por asesor
                    </Label>
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
          </div>
        </CardHeader>
        <CardContent className="p-0">
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
                  {advisorData.map(a => (
                    <TableRow key={a.id}>
                      <TableCell>{a.name}</TableCell>
                      <TableCell>{a.leads}</TableCell>
                      <TableCell>{a.conversions}</TableCell>
                      <TableCell>Q{a.revenue.toLocaleString()}</TableCell>
                      <TableCell>{renderPerformanceBadge(a.performance)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                const rec = records.find(r => r.user_id.toString() === a.id)
                                if (rec) {
                                  setSelectedAdvisor(rec)
                                  setNewCommissionRate(rec.rate_applied)
                                  setCommissionPreview(rec.commission_amount)
                                  setAdjustCommissionOpen(true)
                                }
                              }}
                            >
                              Ajustar comisión
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEditModal({ id: a.id, name: a.name })}>
                              Editar asesor
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openDeleteModal({ id: a.id, name: a.name })}>
                              Eliminar asesor
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="commission">
              <div className="flex justify-end mb-4 gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Switch
                    id="show-trends"
                    checked={showTrends}
                    onCheckedChange={setShowTrends}
                  />
                  <Label htmlFor="show-trends">Mostrar tendencias</Label>
                </div>
                <Select
                  value={commissionPeriod}
                  onValueChange={v => setCommissionPeriod(v as any)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Este mes</SelectItem>
                    <SelectItem value="quarterly">Este trimestre</SelectItem>
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
                  {advisorData.map(a => (
                    <TableRow
                      key={a.id}
                      className={a.hasCustomRate ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}
                    >
                      <TableCell className="font-medium">
                        {a.name}
                        {a.hasCustomRate && (
                          <Badge variant="outline" className="ml-2">
                            Personalizada
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{a.conversions}</TableCell>
                      <TableCell>Q{a.revenue.toLocaleString()}</TableCell>
                      <TableCell className="font-medium text-green-600">
                        Q{a.commission.toLocaleString()}
                        {renderTrend(a)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{a.commissionRate}%</Badge>
                      </TableCell>
                      <TableCell>
                        <Progress
                          value={Math.min(a.conversions * 10, 100)}
                          className="h-2"
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                const rec = records.find(r => r.user_id.toString() === a.id)
                                if (rec) {
                                  setSelectedAdvisor(rec)
                                  setNewCommissionRate(rec.rate_applied)
                                  setCommissionPreview(rec.commission_amount)
                                  setAdjustCommissionOpen(true)
                                }
                              }}
                            >
                              Ajustar comisión
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEditModal({ id: a.id, name: a.name })}>
                              Editar asesor
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openDeleteModal({ id: a.id, name: a.name })}>
                              Eliminar asesor
                            </DropdownMenuItem>
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
          <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <PieChart className="h-5 w-5 text-green-600" />
              <div>
                <span className="text-sm font-medium block">Total comisiones</span>
                <span className="text-lg font-bold text-green-600">
                  Q{totalCommissions.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <Percent className="h-5 w-5 text-blue-600" />
              <div>
                <span className="text-sm font-medium block">Tasa promedio</span>
                <span className="text-lg font-bold text-blue-600">
                  {(advisorData.reduce((s, a) => s + a.commissionRate, 0) /
                    (advisorData.length || 1)
                  ).toFixed(1)}
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

      {/* Modal Ajuste Comisión Individual */}
      <Dialog open={adjustCommissionOpen} onOpenChange={setAdjustCommissionOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Ajustar Comisión para{" "}
              {asesores.find(a => a.id === selectedAdvisor?.user_id.toString())
                ?.name ?? selectedAdvisor?.user_id}
            </DialogTitle>
            <DialogDescription>
              Personaliza la tasa de comisión para este asesor específico
            </DialogDescription>
          </DialogHeader>
          {selectedAdvisor && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-600 mb-1" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Ingresos
                  </span>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    Q{selectedAdvisor.total_income.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <Award className="h-5 w-5 text-green-600 mb-1" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Conversiones
                  </span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    {selectedAdvisor.conversions}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="new-commission-rate">
                    Tasa de comisión ({newCommissionRate}%)
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    Tasa actual: {selectedAdvisor.rate_applied}%
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <Slider
                    id="new-commission-rate"
                    min={1}
                    max={50}
                    step={0.5}
                    value={[newCommissionRate]}
                    onValueChange={v => {
                      setNewCommissionRate(v[0])
                      setCommissionPreview(calculateCommission(
                        selectedAdvisor.total_income,
                        v[0]
                      ))
                    }}
                    className="flex-1"
                  />
                  <span className="w-12 text-right font-medium">
                    {newCommissionRate}%
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Vista previa:</span>
                  <span className="text-sm font-medium text-green-600">
                    Q{commissionPreview.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Comisión actual:</span>
                  <span>Q{selectedAdvisor.commission_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Diferencia:</span>
                  <span className={commissionPreview > selectedAdvisor.commission_amount ? "text-green-600" : "text-red-600"}>
                    {commissionPreview > selectedAdvisor.commission_amount ? "+" : ""}Q
                    {Math.abs(commissionPreview - selectedAdvisor.commission_amount).toLocaleString()}
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
