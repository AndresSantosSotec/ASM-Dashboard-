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
const API_COMM_V2 = `${API_BASE}/commissions-v2`

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

interface CommissionGoal {
  id: number
  asesor_id: number
  monthly_goal: number
  active: boolean
  asesor?: {
    id: number
    full_name?: string
    email?: string
  }
}

interface GlobalRule {
  id: number
  level: 'superstar' | 'estrella' | 'punto_negro' | 'minimo' | 'cero'
  min_sales: number
  max_sales: number | null
  percentage: number
}

interface CommissionV2 {
  id: number
  asesor_id: number
  month: number
  year: number
  sales_count: number
  sales_total_amount: number
  performance_level: 'superstar' | 'estrella' | 'punto_negro' | 'minimo' | 'cero'
  percentage_applied: number
  commission_amount: number
  goal_used: number
  config_snapshot?: any
  asesor?: {
    id: number
    full_name?: string
    email?: string
  }
  sales_source?: Array<{
    id: number
    prospecto_id: number
    amount: number
    paid_status: boolean
    prospecto?: {
      id: number
      nombre_completo?: string
    }
  }>
}

interface HistoricalCommission {
  id: number
  asesor_id: number
  mes: number
  anio: number
  cantidad_inscritos: number
  monto_comision: number
  monto_total_inscripciones: number
  observaciones?: string
  created_at: string
  updated_at: string
  asesor?: {
    id: number
    full_name?: string
    email?: string
  }
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

  // Estados de UI: Sistema V2
  const [goals, setGoals] = useState<CommissionGoal[]>([])
  const [globalRules, setGlobalRules] = useState<GlobalRule[]>([])
  const [commissionsV2, setCommissionsV2] = useState<CommissionV2[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [selectedGoalAdvisor, setSelectedGoalAdvisor] = useState<Advisor | null>(null)
  const [newGoal, setNewGoal] = useState(10)
  const [globalRulesModalOpen, setGlobalRulesModalOpen] = useState(false)
  const [commissionDetailModalOpen, setCommissionDetailModalOpen] = useState(false)
  const [selectedCommission, setSelectedCommission] = useState<CommissionV2 | null>(null)
  const [loadingV2, setLoadingV2] = useState(false)
  const [calculating, setCalculating] = useState(false)
  
  // Estados para comisiones históricas (comisiones_asesores)
  const [historicalCommissions, setHistoricalCommissions] = useState<HistoricalCommission[]>([])
  const [loadingHistorical, setLoadingHistorical] = useState(false)
  const [historicalMonth, setHistoricalMonth] = useState(new Date().getMonth() + 1)
  const [historicalYear, setHistoricalYear] = useState(new Date().getFullYear())
  
  // Estados para ventas actuales del mes (inscripciones reales)
  const [currentSales, setCurrentSales] = useState<Array<{asesor_id: number, sales_count: number}>>([])
  const [loadingCurrentSales, setLoadingCurrentSales] = useState(false)
  
  // Estados para configuración global (meta por defecto)
  const [globalSettings, setGlobalSettings] = useState<{global_default_goal: number}>({global_default_goal: 10})
  const [globalGoalInput, setGlobalGoalInput] = useState(10)
  const [globalSettingsModalOpen, setGlobalSettingsModalOpen] = useState(false)

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

  // Funciones para Sistema V2
  const loadGoals = async () => {
    try {
      const r = await safeFetch(`${API_COMM_V2}/goals`)
      const json = await r.json()
      if (json.success) {
        setGoals(json.data || [])
      } else {
        throw new Error(json.message || "Error al cargar metas")
      }
    } catch (err: any) {
      console.error("Error cargando metas:", err)
      Swal.fire("Error", "No se pudieron cargar las metas: " + err.message, "error")
    }
  }

  const loadGlobalRules = async () => {
    try {
      const r = await safeFetch(`${API_COMM_V2}/global-rules`)
      const json = await r.json()
      if (json.success) {
        setGlobalRules(json.data || [])
      } else {
        throw new Error(json.message || "Error al cargar reglas")
      }
    } catch (err: any) {
      console.error("Error cargando reglas globales:", err)
      Swal.fire("Error", "No se pudieron cargar las reglas globales: " + err.message, "error")
    }
  }

  const loadCommissionsV2 = async () => {
    setLoadingV2(true)
    try {
      const r = await safeFetch(`${API_COMM_V2}/${selectedMonth}/${selectedYear}`)
      const json = await r.json()
      if (json.success) {
        setCommissionsV2(json.data || [])
      } else {
        throw new Error(json.message || "Error al cargar comisiones")
      }
    } catch (err: any) {
      console.error("Error cargando comisiones V2:", err)
      Swal.fire("Error", "No se pudieron cargar las comisiones: " + err.message, "error")
      setCommissionsV2([])
    } finally {
      setLoadingV2(false)
    }
  }

  const saveGoal = async () => {
    if (!selectedGoalAdvisor) return
    if (newGoal < 1 || newGoal > 100) {
      Swal.fire("Error", "La meta debe estar entre 1 y 100 ventas", "error")
      return
    }
    try {
      const r = await safeFetch(`${API_COMM_V2}/goal/${selectedGoalAdvisor.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthly_goal: newGoal, active: true }),
      })
      const json = await r.json()
      if (json.success) {
        setGoalModalOpen(false)
        Swal.fire("Meta guardada", "La meta se ha actualizado correctamente", "success")
        await loadGoals()
        await loadCommissionsV2() // Recargar comisiones para ver cambios
      } else {
        throw new Error(json.message || "Error al guardar meta")
      }
    } catch (err: any) {
      Swal.fire("Error", "No se pudo guardar la meta: " + err.message, "error")
    }
  }

  const saveGlobalRules = async () => {
    // Validar reglas antes de guardar
    const hasErrors = globalRules.some((r: GlobalRule) => {
      if (r.percentage < 0 || r.percentage > 100) return true
      if (r.min_sales < 0) return true
      if (r.max_sales !== null && r.max_sales < r.min_sales) return true
      return false
    })

    if (hasErrors) {
      Swal.fire("Error", "Por favor verifica que los valores sean válidos", "error")
      return
    }

    try {
      const r = await safeFetch(`${API_COMM_V2}/global-rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: globalRules }),
      })
      const json = await r.json()
      if (json.success) {
        Swal.fire("Reglas guardadas", "Las reglas globales se han actualizado correctamente", "success")
        await loadGlobalRules()
      } else {
        throw new Error(json.message || "Error al guardar reglas")
      }
    } catch (err: any) {
      Swal.fire("Error", "No se pudieron guardar las reglas: " + err.message, "error")
    }
  }

  const calculateCommissions = async () => {
    const result = await Swal.fire({
      title: "¿Calcular comisiones?",
      text: `Se calcularán las comisiones para ${new Date(2000, selectedMonth - 1).toLocaleString('es', { month: 'long' })} ${selectedYear}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, calcular",
      cancelButtonText: "Cancelar",
    })

    if (!result.isConfirmed) return

    setCalculating(true)
    try {
      const r = await safeFetch(`${API_COMM_V2}/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear }),
      })
      const json = await r.json()
      if (json.success) {
        Swal.fire("Comisiones calculadas", `Se procesaron ${json.results?.length || 0} asesores`, "success")
        await loadCommissionsV2()
      } else {
        throw new Error(json.message || "Error al calcular comisiones")
      }
    } catch (err: any) {
      Swal.fire("Error", "No se pudieron calcular las comisiones: " + err.message, "error")
    } finally {
      setCalculating(false)
    }
  }

  const openGoalModal = (adv: Advisor) => {
    setSelectedGoalAdvisor(adv)
    const goal = goals.find(g => g.asesor_id.toString() === adv.id)
    setNewGoal(goal?.monthly_goal || 10)
    setGoalModalOpen(true)
  }

  const openCommissionDetail = async (commissionId: number) => {
    try {
      const r = await safeFetch(`${API_COMM_V2}/detail/${commissionId}`)
      const json = await r.json()
      setSelectedCommission(json.data)
      setCommissionDetailModalOpen(true)
    } catch (err: any) {
      Swal.fire("Error cargando detalle", err.message, "error")
    }
  }

  useEffect(() => {
    loadGoals()
    loadGlobalRules()
  }, [])

  useEffect(() => {
    loadCommissionsV2()
  }, [selectedMonth, selectedYear])

  // Función para cargar comisiones históricas
  const loadHistoricalCommissions = async () => {
    setLoadingHistorical(true)
    try {
      const r = await safeFetch(`${API_COMM_V2}/historical/${historicalMonth}/${historicalYear}`)
      const json = await r.json()
      if (json.success) {
        setHistoricalCommissions(json.data || [])
      } else {
        throw new Error(json.message || "Error al cargar comisiones históricas")
      }
    } catch (err: any) {
      console.error("Error cargando comisiones históricas:", err)
      Swal.fire("Error", "No se pudieron cargar las comisiones históricas: " + err.message, "error")
      setHistoricalCommissions([])
    } finally {
      setLoadingHistorical(false)
    }
  }

  useEffect(() => {
    loadHistoricalCommissions()
  }, [historicalMonth, historicalYear])

  // Función para cargar ventas actuales del mes (inscripciones reales)
  const loadCurrentSales = async () => {
    setLoadingCurrentSales(true)
    try {
      const r = await safeFetch(`${API_COMM_V2}/current-sales/${selectedMonth}/${selectedYear}`)
      const json = await r.json()
      if (json.success) {
        setCurrentSales(json.data || [])
      } else {
        throw new Error(json.message || "Error al cargar ventas actuales")
      }
    } catch (err: any) {
      console.error("Error cargando ventas actuales:", err)
      setCurrentSales([])
    } finally {
      setLoadingCurrentSales(false)
    }
  }

  useEffect(() => {
    loadCurrentSales()
  }, [selectedMonth, selectedYear])

  // Función para cargar configuración global
  const loadGlobalSettings = async () => {
    try {
      const r = await safeFetch(`${API_COMM_V2}/global-settings`)
      const json = await r.json()
      if (json.success) {
        setGlobalSettings(json.data)
        setGlobalGoalInput(json.data.global_default_goal || 10)
      }
    } catch (err: any) {
      console.error("Error cargando configuración global:", err)
    }
  }

  // Función para guardar configuración global
  const saveGlobalSettings = async () => {
    if (globalGoalInput < 1 || globalGoalInput > 1000) {
      Swal.fire("Error", "La meta global debe estar entre 1 y 1000 ventas", "error")
      return
    }
    try {
      const r = await safeFetch(`${API_COMM_V2}/global-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ global_default_goal: globalGoalInput }),
      })
      const json = await r.json()
      if (json.success) {
        setGlobalSettings(json.data)
        setGlobalSettingsModalOpen(false)
        Swal.fire("Configuración guardada", "La meta global se ha actualizado correctamente", "success")
        await loadGoals() // Recargar metas para reflejar el cambio
      } else {
        throw new Error(json.message || "Error al guardar configuración")
      }
    } catch (err: any) {
      Swal.fire("Error", "No se pudo guardar la configuración: " + err.message, "error")
    }
  }

  useEffect(() => {
    loadGlobalSettings()
  }, [])

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
              <TabsTrigger value="goals">Metas por Asesor</TabsTrigger>
              <TabsTrigger value="global-rules">Reglas Globales</TabsTrigger>
              <TabsTrigger value="commissions-v2">Comisiones V2</TabsTrigger>
              <TabsTrigger value="historical">Rendimiento Histórico</TabsTrigger>
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

            {/* Tab: Metas por Asesor */}
            <TabsContent value="goals">
              <div className="flex justify-between items-center mb-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">
                    Establece metas personalizadas de ventas mensuales para cada asesor. Si no hay meta personalizada, se usa la meta global (10 ventas).
                  </p>
                  <div className="flex items-center gap-2">
                    <Label>Período:</Label>
                    <Select value={selectedMonth.toString()} onValueChange={(v) => {
                      setSelectedMonth(parseInt(v))
                    }}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                          <SelectItem key={m} value={m.toString()}>
                            {new Date(2000, m - 1).toLocaleString('es', { month: 'long' })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="2020"
                      max="2100"
                      value={selectedYear}
                      onChange={(e) => {
                        const year = parseInt(e.target.value) || new Date().getFullYear()
                        setSelectedYear(year)
                      }}
                      className="w-24"
                    />
                  </div>
                </div>
                <Button onClick={() => { loadGoals(); loadCurrentSales(); }} variant="outline" disabled={loadingCurrentSales}>
                  {loadingCurrentSales ? "Cargando..." : "Actualizar"}
                </Button>
              </div>
              {loadingCurrentSales ? (
                <div className="text-center py-8 text-muted-foreground">
                  Cargando ventas actuales...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asesor</TableHead>
                      <TableHead>Meta Mensual</TableHead>
                      <TableHead>Ventas Actuales</TableHead>
                      <TableHead>Progreso</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {asesores.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No hay asesores registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      asesores.map(a => {
                      const goal = goals.find((g: CommissionGoal) => g.asesor_id.toString() === a.id)
                      const goalValue = goal?.monthly_goal || globalSettings.global_default_goal
                        // Usar ventas actuales del mes basadas en inscripciones reales
                        const salesData = currentSales.find(s => s.asesor_id.toString() === a.id)
                        const actualSales = salesData?.sales_count || 0
                        const progress = goalValue > 0 ? Math.min((actualSales / goalValue) * 100, 100) : 0
                        const isGoalMet = actualSales >= goalValue
                        return (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">{a.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{goalValue} ventas</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className={isGoalMet ? "text-green-600 font-medium" : ""}>
                                  {actualSales}
                                </span>
                                {isGoalMet && (
                                  <Badge variant="default" className="bg-green-500">✓ Meta alcanzada</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={progress} 
                                  className={`h-2 flex-1 ${isGoalMet ? 'bg-green-500' : ''}`} 
                                />
                                <span className={`text-xs w-12 text-right ${isGoalMet ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                                  {progress.toFixed(0)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={goal?.active !== false ? "default" : "secondary"}>
                                {goal?.active !== false ? "Activa" : "Inactiva"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" onClick={() => openGoalModal(a)}>
                                Editar Meta
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {/* Tab: Reglas Globales */}
            <TabsContent value="global-rules">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Configura los porcentajes de comisión según el nivel de rendimiento y la meta global por defecto. Estos porcentajes se aplican globalmente a todos los asesores.
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => { loadGlobalRules(); loadGlobalSettings(); }} variant="outline">
                    Actualizar
                  </Button>
                  <Button onClick={saveGlobalRules}>
                    Guardar Reglas
                  </Button>
                  <Button onClick={() => setGlobalSettingsModalOpen(true)} variant="outline">
                    Configurar Meta Global
                  </Button>
                </div>
              </div>
              
              {/* Card de Meta Global */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Meta Global por Defecto</h3>
                    <p className="text-sm text-muted-foreground">
                      Esta meta se aplica a todos los asesores que no tengan una meta personalizada configurada.
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Meta actual</p>
                      <p className="text-2xl font-bold text-blue-600">{globalSettings.global_default_goal} ventas</p>
                    </div>
                    <Button onClick={() => setGlobalSettingsModalOpen(true)} variant="outline" size="sm">
                      Cambiar
                    </Button>
                  </div>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Ventas Mínimas</TableHead>
                    <TableHead>Ventas Máximas</TableHead>
                    <TableHead>Porcentaje de Comisión</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {globalRules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No hay reglas configuradas. Cargando...
                      </TableCell>
                    </TableRow>
                  ) : (
                    globalRules.map((rule: GlobalRule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium capitalize">
                          <Badge variant="outline" className="capitalize">
                            {rule.level === 'superstar' ? '⭐ Superstar' :
                             rule.level === 'estrella' ? '✨ Estrella' :
                             rule.level === 'punto_negro' ? '⚫ Punto Negro' :
                             rule.level === 'minimo' ? '📊 Mínimo' :
                             '❌ Cero'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={rule.min_sales}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0
                              const updated = globalRules.map((r: GlobalRule) =>
                                r.id === rule.id ? { ...r, min_sales: val } : r
                              )
                              setGlobalRules(updated)
                            }}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={rule.max_sales || ""}
                            onChange={(e) => {
                              const val = e.target.value ? parseInt(e.target.value) : null
                              const updated = globalRules.map((r: GlobalRule) =>
                                r.id === rule.id ? { ...r, max_sales: val } : r
                              )
                              setGlobalRules(updated)
                            }}
                            className="w-24"
                            placeholder="Sin límite"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Slider
                              min={0}
                              max={100}
                              step={0.5}
                              value={[Number(rule.percentage)]}
                              onValueChange={(v) => {
                                const updated = globalRules.map((r: GlobalRule) =>
                                  r.id === rule.id ? { ...r, percentage: v[0] } : r
                                )
                                setGlobalRules(updated)
                              }}
                              className="flex-1"
                            />
                            <span className="w-16 text-right font-medium">{rule.percentage}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Tab: Comisiones V2 */}
            <TabsContent value="commissions-v2">
              <div className="flex justify-between items-center mb-4 gap-4">
                <div className="flex items-center gap-2">
                  <Label>Período:</Label>
                  <Select value={selectedMonth.toString()} onValueChange={(v) => {
                    setSelectedMonth(parseInt(v))
                  }}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <SelectItem key={m} value={m.toString()}>
                          {new Date(2000, m - 1).toLocaleString('es', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="2020"
                    max="2100"
                    value={selectedYear}
                    onChange={(e) => {
                      const year = parseInt(e.target.value) || new Date().getFullYear()
                      setSelectedYear(year)
                    }}
                    className="w-24"
                  />
                </div>
                <Button 
                  onClick={calculateCommissions} 
                  disabled={calculating}
                >
                  {calculating ? "Calculando..." : "Calcular Comisiones"}
                </Button>
              </div>
              {loadingV2 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Cargando comisiones...
                </div>
              ) : commissionsV2.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No hay comisiones calculadas para este período.
                  </p>
                  <Button onClick={calculateCommissions} variant="outline">
                    Calcular Comisiones
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Comisiones</p>
                        <p className="text-2xl font-bold text-green-600">
                          Q{commissionsV2.reduce((sum, c: CommissionV2) => sum + parseFloat(String(c.commission_amount || 0)), 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Ventas</p>
                        <p className="text-2xl font-bold">
                          {commissionsV2.reduce((sum, c: CommissionV2) => sum + (c.sales_count || 0), 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Inscripciones</p>
                        <p className="text-2xl font-bold">
                          Q{commissionsV2.reduce((sum, c: CommissionV2) => sum + parseFloat(String(c.sales_total_amount || 0)), 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asesor</TableHead>
                        <TableHead>Ventas</TableHead>
                        <TableHead>Nivel</TableHead>
                        <TableHead>%</TableHead>
                        <TableHead>Total Inscripciones</TableHead>
                        <TableHead>Comisión</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissionsV2.map((comm: CommissionV2) => (
                        <TableRow key={comm.id}>
                          <TableCell className="font-medium">
                            {comm.asesor?.full_name || comm.asesor?.email || "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{comm.sales_count}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="capitalize" variant={
                              comm.performance_level === 'superstar' ? 'default' :
                              comm.performance_level === 'estrella' ? 'default' :
                              comm.performance_level === 'punto_negro' ? 'secondary' :
                              comm.performance_level === 'minimo' ? 'outline' :
                              'destructive'
                            }>
                              {comm.performance_level === 'superstar' ? '⭐ Superstar' :
                               comm.performance_level === 'estrella' ? '✨ Estrella' :
                               comm.performance_level === 'punto_negro' ? '⚫ Punto Negro' :
                               comm.performance_level === 'minimo' ? '📊 Mínimo' :
                               '❌ Cero'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{comm.percentage_applied}%</Badge>
                          </TableCell>
                          <TableCell>Q{parseFloat(String(comm.sales_total_amount || 0)).toLocaleString()}</TableCell>
                          <TableCell className="font-medium text-green-600">
                            Q{parseFloat(String(comm.commission_amount || 0)).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => openCommissionDetail(comm.id)}>
                              Ver Detalle
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </TabsContent>

            {/* Tab: Rendimiento Histórico (comisiones_asesores) */}
            <TabsContent value="historical">
              <div className="flex justify-between items-center mb-4 gap-4">
                <div className="flex items-center gap-2">
                  <Label>Período:</Label>
                  <Select value={historicalMonth.toString()} onValueChange={(v) => {
                    setHistoricalMonth(parseInt(v))
                  }}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <SelectItem key={m} value={m.toString()}>
                          {new Date(2000, m - 1).toLocaleString('es', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="2020"
                    max="2100"
                    value={historicalYear}
                    onChange={(e) => {
                      const year = parseInt(e.target.value) || new Date().getFullYear()
                      setHistoricalYear(year)
                    }}
                    className="w-24"
                  />
                </div>
                <Button onClick={loadHistoricalCommissions} variant="outline" disabled={loadingHistorical}>
                  {loadingHistorical ? "Cargando..." : "Actualizar"}
                </Button>
              </div>
              {loadingHistorical ? (
                <div className="text-center py-8 text-muted-foreground">
                  Cargando rendimiento histórico...
                </div>
              ) : historicalCommissions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No hay registros de rendimiento para este período.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Inscritos</p>
                        <p className="text-2xl font-bold">
                          {historicalCommissions.reduce((sum, c) => sum + (c.cantidad_inscritos || 0), 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Inscripciones</p>
                        <p className="text-2xl font-bold">
                          Q{historicalCommissions.reduce((sum, c) => sum + parseFloat(String(c.monto_total_inscripciones || 0)), 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Comisiones</p>
                        <p className="text-2xl font-bold text-green-600">
                          Q{historicalCommissions.reduce((sum, c) => sum + parseFloat(String(c.monto_comision || 0)), 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Promedio por Asesor</p>
                        <p className="text-2xl font-bold">
                          Q{historicalCommissions.length > 0 
                            ? (historicalCommissions.reduce((sum, c) => sum + parseFloat(String(c.monto_comision || 0)), 0) / historicalCommissions.length).toLocaleString(undefined, { maximumFractionDigits: 2 })
                            : '0.00'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asesor</TableHead>
                        <TableHead>Inscritos</TableHead>
                        <TableHead>Total Inscripciones</TableHead>
                        <TableHead>Comisión</TableHead>
                        <TableHead>Promedio por Inscrito</TableHead>
                        <TableHead>Observaciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historicalCommissions.map((comm: HistoricalCommission) => {
                        const promedioPorInscrito = comm.cantidad_inscritos > 0 
                          ? parseFloat(String(comm.monto_comision || 0)) / comm.cantidad_inscritos 
                          : 0
                        return (
                          <TableRow key={comm.id}>
                            <TableCell className="font-medium">
                              {comm.asesor?.full_name || comm.asesor?.email || `ID: ${comm.asesor_id}`}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{comm.cantidad_inscritos}</Badge>
                            </TableCell>
                            <TableCell>
                              Q{parseFloat(String(comm.monto_total_inscripciones || 0)).toLocaleString()}
                            </TableCell>
                            <TableCell className="font-medium text-green-600">
                              Q{parseFloat(String(comm.monto_comision || 0)).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              Q{promedioPorInscrito.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                              {comm.observaciones || '-'}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </>
              )}
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

      {/* Modal Editar Meta */}
      <Dialog open={goalModalOpen} onOpenChange={setGoalModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Meta para {selectedGoalAdvisor?.name}</DialogTitle>
            <DialogDescription>
              Establece la meta mensual de ventas para este asesor
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="monthly-goal">Meta Mensual (ventas)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  id="monthly-goal"
                  min={1}
                  max={50}
                  step={1}
                  value={[newGoal]}
                  onValueChange={v => setNewGoal(v[0])}
                  className="flex-1"
                />
                <span className="w-12 text-right font-medium">{newGoal}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveGoal}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detalle de Comisión */}
      <Dialog open={commissionDetailModalOpen} onOpenChange={setCommissionDetailModalOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Detalle de Comisión</DialogTitle>
            <DialogDescription>
              Información detallada de la comisión calculada
            </DialogDescription>
          </DialogHeader>
          {selectedCommission && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Asesor</Label>
                  <p className="font-medium">
                    {selectedCommission.asesor?.full_name || selectedCommission.asesor?.email || "N/A"}
                  </p>
                </div>
                <div>
                  <Label>Período</Label>
                  <p className="font-medium">
                    {new Date(2000, selectedCommission.month - 1).toLocaleString('es', { month: 'long' })} {selectedCommission.year}
                  </p>
                </div>
                <div>
                  <Label>Ventas</Label>
                  <p className="font-medium">{selectedCommission.sales_count}</p>
                </div>
                <div>
                  <Label>Nivel</Label>
                  <Badge className="capitalize">{selectedCommission.performance_level}</Badge>
                </div>
                <div>
                  <Label>Porcentaje Aplicado</Label>
                  <p className="font-medium">{selectedCommission.percentage_applied}%</p>
                </div>
                <div>
                  <Label>Total Inscripciones</Label>
                  <p className="font-medium">Q{parseFloat(String(selectedCommission.sales_total_amount || 0)).toLocaleString()}</p>
                </div>
                <div>
                  <Label>Comisión</Label>
                  <p className="font-medium text-green-600">
                    Q{parseFloat(String(selectedCommission.commission_amount || 0)).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label>Meta Usada</Label>
                  <p className="font-medium">{selectedCommission.goal_used}</p>
                </div>
              </div>
              {selectedCommission.sales_source && selectedCommission.sales_source.length > 0 ? (
                <div>
                  <Label className="mb-2 block">Ventas del Mes ({selectedCommission.sales_source.length})</Label>
                  <div className="max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Prospecto</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Estado Pago</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCommission.sales_source.map((sale: any) => (
                          <TableRow key={sale.id}>
                            <TableCell>
                              {sale.prospecto?.nombre_completo || `ID: ${sale.prospecto_id}`}
                            </TableCell>
                            <TableCell>Q{parseFloat(String(sale.amount || 0)).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={sale.paid_status ? "default" : "secondary"}>
                                {sale.paid_status ? "Pagado" : "Pendiente"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No hay ventas registradas para esta comisión
                </div>
              )}
              {selectedCommission.config_snapshot && (
                <div>
                  <Label>Configuración Aplicada</Label>
                  <pre className="bg-gray-50 dark:bg-gray-800 p-4 rounded text-xs overflow-auto">
                    {JSON.stringify(selectedCommission.config_snapshot, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommissionDetailModalOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Asesor */}
      <Dialog open={editAdvisorModalOpen} onOpenChange={setEditAdvisorModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Asesor</DialogTitle>
            <DialogDescription>
              Modifica la información del asesor
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="advisor-name">Nombre Completo</Label>
              <Input
                id="advisor-name"
                value={editAdvisorName}
                onChange={(e) => setEditAdvisorName(e.target.value)}
                placeholder="Nombre del asesor"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAdvisorModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateAdvisor}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Eliminación */}
      <Dialog open={deleteAdvisorConfirmOpen} onOpenChange={setDeleteAdvisorConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar Asesor?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el asesor{" "}
              <strong>{currentAdvisor?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAdvisorConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteAdvisor}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Configuración Meta Global */}
      <Dialog open={globalSettingsModalOpen} onOpenChange={setGlobalSettingsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configurar Meta Global por Defecto</DialogTitle>
            <DialogDescription>
              Establece la meta mensual de ventas que se aplicará a todos los asesores que no tengan una meta personalizada.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="global-goal">Meta Global Mensual (ventas)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  id="global-goal"
                  min={1}
                  max={100}
                  step={1}
                  value={[globalGoalInput]}
                  onValueChange={v => setGlobalGoalInput(v[0])}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={globalGoalInput}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 10
                    setGlobalGoalInput(Math.min(Math.max(val, 1), 1000))
                  }}
                  className="w-24"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Meta actual: <strong>{globalSettings.global_default_goal} ventas</strong>
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Nota:</strong> Esta meta se aplicará automáticamente a todos los asesores que no tengan una meta personalizada configurada. 
                Los asesores con metas personalizadas no se verán afectados por este cambio.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setGlobalGoalInput(globalSettings.global_default_goal)
              setGlobalSettingsModalOpen(false)
            }}>
              Cancelar
            </Button>
            <Button onClick={saveGlobalSettings}>
              Guardar Configuración
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
