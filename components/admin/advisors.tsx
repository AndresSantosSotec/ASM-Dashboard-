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
  level: string // Ahora puede ser cualquier string (personalizable)
  min_sales: number
  max_sales: number | null
  percentage: number
  is_custom?: boolean // Para identificar niveles personalizados
}

interface AvailableMonth {
  month: number
  year: number
  label: string
}

interface CommissionV2 {
  id: number
  asesor_id: number
  month: number
  year: number
  sales_count: number
  sales_total_amount: number
  performance_level: 'superstar' | 'estrella' | 'punto_negro' | 'punto_rojo' | 'cero'
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

  // Estados para reglas de comisión personalizadas por asesor
  const [asesorRules, setAsesorRules] = useState<Array<{
    id?: number
    level: string
    min_percentage: number
    max_percentage: number | null
    commission_percentage: number
  }>>([])
  const [asesorHasCustomRules, setAsesorHasCustomRules] = useState(false)
  const [useCustomRules, setUseCustomRules] = useState(false)
  const [asesorRulesLoading, setAsesorRulesLoading] = useState(false)
  const [savingGoalAndRules, setSavingGoalAndRules] = useState(false)
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
  
  // Estados para meses disponibles
  const [availableMonths, setAvailableMonths] = useState<AvailableMonth[]>([])
  
  // Estados para agregar nuevo nivel
  const [addLevelModalOpen, setAddLevelModalOpen] = useState(false)
  const [newLevelName, setNewLevelName] = useState("")
  const [newLevelMinSales, setNewLevelMinSales] = useState(0)
  const [newLevelMaxSales, setNewLevelMaxSales] = useState<number | null>(null)
  const [newLevelPercentage, setNewLevelPercentage] = useState(0)

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

  const openGoalModal = async (adv: Advisor) => {
    setSelectedGoalAdvisor(adv)
    const goal = goals.find(g => g.asesor_id.toString() === adv.id)
    setNewGoal(goal?.monthly_goal || globalSettings.global_default_goal)
    setAsesorRules([])
    setAsesorHasCustomRules(false)
    setUseCustomRules(false)
    setGoalModalOpen(true)
    // Cargar reglas personalizadas del asesor
    setAsesorRulesLoading(true)
    try {
      const r = await safeFetch(`${API_COMM_V2}/asesor-rules/${adv.id}`)
      const json = await r.json()
      if (json.success) {
        const hasCustom = json.has_custom_rules && json.data?.length > 0
        setAsesorHasCustomRules(hasCustom)
        setUseCustomRules(hasCustom)
        setAsesorRules(json.data?.map((rule: any) => ({
          id: rule.id,
          level: rule.level,
          min_percentage: rule.min_percentage,
          max_percentage: rule.max_percentage,
          commission_percentage: Number(rule.commission_percentage),
        })) || [])
      }
    } catch (err: any) {
      console.error("Error cargando reglas del asesor:", err)
    } finally {
      setAsesorRulesLoading(false)
    }
  }

  const addAsesorRuleRow = () => {
    setAsesorRules(prev => [...prev, {
      level: `nivel_${prev.length + 1}`,
      min_percentage: 0,
      max_percentage: null,
      commission_percentage: 0,
    }])
  }

  const removeAsesorRuleRow = (index: number) => {
    setAsesorRules(prev => prev.filter((_, i) => i !== index))
  }

  const initAsesorRulesFromGlobal = () => {
    const copied = [...globalRules]
      .sort((a, b) => (b.min_sales || 0) - (a.min_sales || 0))
      .map(r => ({
        level: r.level,
        min_percentage: r.min_sales,
        max_percentage: r.max_sales,
        commission_percentage: Number(r.percentage),
      }))
    setAsesorRules(copied)
    setUseCustomRules(true)
  }

  const saveGoalAndRules = async () => {
    if (!selectedGoalAdvisor) return
    if (newGoal < 1 || newGoal > 500) {
      Swal.fire("Error", "La meta debe estar entre 1 y 500 ventas", "error")
      return
    }
    if (useCustomRules && asesorRules.length > 0) {
      const hasErrors = asesorRules.some(r => {
        if (!r.level.trim()) return true
        if (r.commission_percentage < 0 || r.commission_percentage > 100) return true
        if (r.min_percentage < 0) return true
        if (r.max_percentage !== null && r.max_percentage < r.min_percentage) return true
        return false
      })
      if (hasErrors) {
        Swal.fire("Error", "Por favor verifica los valores de los niveles personalizados", "error")
        return
      }
    }
    setSavingGoalAndRules(true)
    try {
      // 1. Guardar meta mensual
      const goalRes = await safeFetch(`${API_COMM_V2}/goal/${selectedGoalAdvisor.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthly_goal: newGoal, active: true }),
      })
      const goalJson = await goalRes.json()
      if (!goalJson.success) throw new Error(goalJson.message || "Error al guardar meta")
      // 2. Guardar reglas personalizadas (array vacío = usar global)
      const rulesToSave = useCustomRules ? asesorRules : []
      const rulesRes = await safeFetch(`${API_COMM_V2}/asesor-rules/${selectedGoalAdvisor.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: rulesToSave }),
      })
      const rulesJson = await rulesRes.json()
      if (!rulesJson.success) throw new Error(rulesJson.message || "Error al guardar reglas")
      setGoalModalOpen(false)
      Swal.fire("Guardado", useCustomRules && asesorRules.length > 0
        ? "Meta y niveles personalizados guardados correctamente"
        : "Meta guardada. El asesor usará las reglas globales de comisión", "success")
      await loadGoals()
      await loadCommissionsV2()
    } catch (err: any) {
      Swal.fire("Error", "No se pudo guardar: " + err.message, "error")
    } finally {
      setSavingGoalAndRules(false)
    }
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

  // Función para cargar meses disponibles
  const loadAvailableMonths = async () => {
    try {
      const r = await safeFetch(`${API_COMM_V2}/available-months`)
      const json = await r.json()
      if (json.success) {
        setAvailableMonths(json.data || [])
      }
    } catch (err: any) {
      console.error("Error cargando meses disponibles:", err)
    }
  }

  useEffect(() => {
    loadAvailableMonths()
  }, [])

  // Función para agregar nuevo nivel de comisión
  const addNewLevel = async () => {
    if (!newLevelName.trim()) {
      Swal.fire("Error", "El nombre del nivel es requerido", "error")
      return
    }
    if (newLevelPercentage < 0 || newLevelPercentage > 100) {
      Swal.fire("Error", "El porcentaje debe estar entre 0 y 100", "error")
      return
    }
    try {
      const r = await safeFetch(`${API_COMM_V2}/global-rules/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: newLevelName.trim(),
          min_sales: newLevelMinSales,
          max_sales: newLevelMaxSales,
          percentage: newLevelPercentage,
        }),
      })
      const json = await r.json()
      if (json.success) {
        setAddLevelModalOpen(false)
        setNewLevelName("")
        setNewLevelMinSales(0)
        setNewLevelMaxSales(null)
        setNewLevelPercentage(0)
        Swal.fire("Nivel creado", "El nuevo nivel se ha creado exitosamente", "success")
        await loadGlobalRules()
      } else {
        throw new Error(json.message || "Error al crear nivel")
      }
    } catch (err: any) {
      Swal.fire("Error", err.message, "error")
    }
  }

  // Función para eliminar nivel personalizado
  const deleteLevel = async (ruleId: number, levelName: string) => {
    const defaultLevels = ['superstar', 'estrella', 'punto_negro', 'punto_rojo', 'cero']
    if (defaultLevels.includes(levelName)) {
      Swal.fire("Error", "No se pueden eliminar los niveles por defecto", "error")
      return
    }
    
    const result = await Swal.fire({
      title: "¿Eliminar nivel?",
      text: `¿Estás seguro de eliminar el nivel "${levelName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    })
    
    if (!result.isConfirmed) return
    
    try {
      const r = await safeFetch(`${API_COMM_V2}/global-rules/${ruleId}`, {
        method: "DELETE",
      })
      const json = await r.json()
      if (json.success) {
        Swal.fire("Eliminado", "El nivel se ha eliminado correctamente", "success")
        await loadGlobalRules()
      } else {
        throw new Error(json.message || "Error al eliminar nivel")
      }
    } catch (err: any) {
      Swal.fire("Error", err.message, "error")
    }
  }

  // Helper para obtener el icono/emoji de un nivel
  const getLevelIcon = (level: string) => {
    const icons: Record<string, string> = {
      superstar: '⭐',
      estrella: '✨',
      punto_negro: '⚫',
      punto_rojo: '🔴',
      cero: '❌',
    }
    return icons[level] || '🏷️'
  }

  // Helper para determinar si un nivel es personalizado
  const isCustomLevel = (level: string) => {
    const defaultLevels = ['superstar', 'estrella', 'punto_negro', 'punto_rojo', 'cero']
    return !defaultLevels.includes(level)
  }

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
                {/* <Button variant="outline">
                  <Settings2 className="h-4 w-4 mr-2" />
                  Configurar Comisiones
                </Button> */}
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
          <Tabs defaultValue="commissions-v2" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="commissions-v2">📊 Comisiones del Mes</TabsTrigger>
              <TabsTrigger value="goals">🎯 Metas por Asesor</TabsTrigger>
              <TabsTrigger value="global-rules">⚙️ Reglas Globales</TabsTrigger>
            </TabsList>

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
                  Configura los porcentajes de comisión según el nivel de rendimiento. Puedes agregar niveles personalizados.
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => setAddLevelModalOpen(true)} variant="outline">
                    + Agregar Nivel
                  </Button>
                  <Button onClick={saveGlobalRules}>
                    Guardar Cambios
                  </Button>
                  <Button onClick={() => setGlobalSettingsModalOpen(true)} variant="secondary">
                    Meta Global
                  </Button>
                </div>
              </div>
              
              {/* Card de Meta Global */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">🎯 Meta Global por Defecto</h3>
                    <p className="text-sm text-muted-foreground">
                      Meta mensual para asesores sin meta personalizada. El porcentaje de comisión se calcula según el % de meta alcanzado.
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
              
              {/* Explicación de clasificación */}
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm">
                  <strong>💡 Cómo funciona:</strong> El nivel se determina por el % de meta alcanzado. Por ejemplo, si la meta es 10 y vendes 8, alcanzas el 80% = Estrella.
                  Los niveles con el icono 🏷️ son personalizados y pueden eliminarse.
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nivel</TableHead>
                    <TableHead>% Meta Mín.</TableHead>
                    <TableHead>% Meta Máx.</TableHead>
                    <TableHead>Porcentaje Comisión</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {globalRules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No hay reglas configuradas. Cargando...
                      </TableCell>
                    </TableRow>
                  ) : (
                    globalRules.map((rule: GlobalRule) => (
                      <TableRow key={rule.id} className={isCustomLevel(rule.level) ? "bg-purple-50/50 dark:bg-purple-900/10" : ""}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Badge variant={isCustomLevel(rule.level) ? "default" : "outline"} className="capitalize">
                              {getLevelIcon(rule.level)} {rule.level.replace(/_/g, ' ')}
                            </Badge>
                            {isCustomLevel(rule.level) && (
                              <Badge variant="secondary" className="text-xs">Personalizado</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={rule.min_sales}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0
                                const updated = globalRules.map((r: GlobalRule) =>
                                  r.id === rule.id ? { ...r, min_sales: val } : r
                                )
                                setGlobalRules(updated)
                              }}
                              className="w-20"
                            />
                            <span className="text-muted-foreground">%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
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
                              className="w-20"
                              placeholder="∞"
                            />
                            <span className="text-muted-foreground">%</span>
                          </div>
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
                              className="flex-1 min-w-[100px]"
                            />
                            <Badge variant="secondary" className="w-16 justify-center">{rule.percentage}%</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isCustomLevel(rule.level) ? (
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => deleteLevel(rule.id, rule.level)}
                            >
                              Eliminar
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">Por defecto</span>
                          )}
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
                  <Select 
                    value={`${selectedMonth}-${selectedYear}`} 
                    onValueChange={(v) => {
                      const [m, y] = v.split('-').map(Number)
                      setSelectedMonth(m)
                      setSelectedYear(y)
                    }}
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMonths.length > 0 ? (
                        availableMonths.map((m) => (
                          <SelectItem key={`${m.month}-${m.year}`} value={`${m.month}-${m.year}`}>
                            {m.label}
                          </SelectItem>
                        ))
                      ) : (
                        // Fallback: mostrar últimos 12 meses
                        Array.from({ length: 12 }, (_, i) => {
                          const date = new Date()
                          date.setMonth(date.getMonth() - i)
                          return {
                            month: date.getMonth() + 1,
                            year: date.getFullYear(),
                            label: `${date.toLocaleString('es', { month: 'long' })} ${date.getFullYear()}`,
                          }
                        }).map((m) => (
                          <SelectItem key={`${m.month}-${m.year}`} value={`${m.month}-${m.year}`}>
                            {m.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
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
                              comm.performance_level === 'punto_rojo' ? 'outline' :
                              comm.performance_level === 'cero' ? 'destructive' :
                              'default' // Para niveles personalizados
                            }>
                              {getLevelIcon(comm.performance_level)} {comm.performance_level.replace(/_/g, ' ')}
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
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between border-t p-4 gap-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <span className="text-sm font-medium block">Total comisiones</span>
                <span className="text-lg font-bold text-green-600">
                  Q{commissionsV2.reduce((sum, c: CommissionV2) => sum + parseFloat(String(c.commission_amount || 0)), 0).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <Award className="h-5 w-5 text-blue-600" />
              <div>
                <span className="text-sm font-medium block">Total ventas</span>
                <span className="text-lg font-bold text-blue-600">
                  {commissionsV2.reduce((sum, c: CommissionV2) => sum + (c.sales_count || 0), 0)} inscripciones
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <PieChart className="h-5 w-5 text-purple-600" />
              <div>
                <span className="text-sm font-medium block">Meta global</span>
                <span className="text-lg font-bold text-purple-600">
                  {globalSettings.global_default_goal} ventas
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={calculateCommissions} disabled={calculating} className="flex-1 sm:flex-auto">
              {calculating ? "Calculando..." : "Calcular Comisiones"}
            </Button>
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

      {/* Modal Editar Meta y Niveles de Comisión por Asesor */}
      <Dialog open={goalModalOpen} onOpenChange={setGoalModalOpen}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Configuración de {selectedGoalAdvisor?.name}</DialogTitle>
            <DialogDescription>
              Configura la meta mensual y los niveles de comisión para este asesor
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">

            {/* Sección 1: Meta Mensual */}
            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">🎯 Meta Mensual (ventas)</span>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  min={1}
                  max={100}
                  step={1}
                  value={[newGoal]}
                  onValueChange={v => setNewGoal(v[0])}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={newGoal}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1
                    setNewGoal(Math.min(Math.max(val, 1), 500))
                  }}
                  className="w-20"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Meta global por defecto: <strong>{globalSettings.global_default_goal} ventas</strong>
              </p>
            </div>

            <div className="border-t" />

            {/* Sección 2: Niveles de Comisión Personalizados */}
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">⚙️ Niveles de Comisión</p>
                  <p className="text-xs text-muted-foreground">
                    {useCustomRules
                      ? "Este asesor tiene niveles personalizados que sobrescriben las reglas globales"
                      : "Este asesor usa las Reglas Globales de Comisión"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {asesorHasCustomRules && (
                    <Badge variant="default" className="bg-purple-600 text-xs">Personalizado</Badge>
                  )}
                  <Switch
                    checked={useCustomRules}
                    onCheckedChange={(checked) => {
                      setUseCustomRules(checked)
                      if (checked && asesorRules.length === 0) {
                        initAsesorRulesFromGlobal()
                      }
                    }}
                  />
                  <Label className="text-sm">Personalizar</Label>
                </div>
              </div>

              {asesorRulesLoading ? (
                <div className="text-center py-4 text-muted-foreground text-sm">Cargando niveles...</div>
              ) : useCustomRules ? (
                <div className="grid gap-2">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-purple-700 dark:text-purple-300">
                      <strong>ℹ️</strong> Los niveles aquí configurados aplican <strong>solo a {selectedGoalAdvisor?.name}</strong>.
                      El % de comisión se calcula según el % de su meta individual alcanzado.
                    </p>
                  </div>

                  {asesorRules.length === 0 ? (
                    <div className="text-center py-4 border-2 border-dashed rounded-lg">
                      <p className="text-sm text-muted-foreground mb-3">No hay niveles personalizados configurados</p>
                      <div className="flex gap-2 justify-center">
                        <Button size="sm" variant="outline" onClick={initAsesorRulesFromGlobal}>
                          📋 Copiar desde Reglas Globales
                        </Button>
                        <Button size="sm" variant="outline" onClick={addAsesorRuleRow}>
                          + Agregar nivel vacío
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[25%]">Nivel</TableHead>
                            <TableHead className="w-[18%]">% Meta Mín.</TableHead>
                            <TableHead className="w-[18%]">% Meta Máx.</TableHead>
                            <TableHead>% Comisión</TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {asesorRules.map((rule, idx) => (
                            <TableRow key={idx}>
                              <TableCell>
                                <Input
                                  value={rule.level}
                                  onChange={(e) => {
                                    const updated = [...asesorRules]
                                    updated[idx] = { ...updated[idx], level: e.target.value }
                                    setAsesorRules(updated)
                                  }}
                                  className="h-8 text-xs"
                                  placeholder="nombre"
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    min={0}
                                    value={rule.min_percentage}
                                    onChange={(e) => {
                                      const updated = [...asesorRules]
                                      updated[idx] = { ...updated[idx], min_percentage: parseInt(e.target.value) || 0 }
                                      setAsesorRules(updated)
                                    }}
                                    className="h-8 w-16 text-xs"
                                  />
                                  <span className="text-xs text-muted-foreground">%</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    min={0}
                                    value={rule.max_percentage ?? ""}
                                    onChange={(e) => {
                                      const updated = [...asesorRules]
                                      updated[idx] = { ...updated[idx], max_percentage: e.target.value ? parseInt(e.target.value) : null }
                                      setAsesorRules(updated)
                                    }}
                                    className="h-8 w-16 text-xs"
                                    placeholder="∞"
                                  />
                                  <span className="text-xs text-muted-foreground">%</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Slider
                                    min={0}
                                    max={100}
                                    step={0.5}
                                    value={[rule.commission_percentage]}
                                    onValueChange={(v) => {
                                      const updated = [...asesorRules]
                                      updated[idx] = { ...updated[idx], commission_percentage: v[0] }
                                      setAsesorRules(updated)
                                    }}
                                    className="flex-1 min-w-[60px]"
                                  />
                                  <Badge variant="secondary" className="w-14 justify-center text-xs">
                                    {rule.commission_percentage}%
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                  onClick={() => removeAsesorRuleRow(idx)}
                                >
                                  ✕
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={addAsesorRuleRow}>
                          + Agregar Nivel
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground"
                          onClick={initAsesorRulesFromGlobal}
                        >
                          📋 Reiniciar desde Global
                        </Button>
                      </div>
                    </>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 self-start"
                    onClick={() => {
                      setUseCustomRules(false)
                      setAsesorRules([])
                    }}
                  >
                    🗑 Eliminar reglas personalizadas — volver a Global
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-3">
                    Este asesor usará las <strong>Reglas Globales de Comisión</strong>.
                    Activa &quot;Personalizar&quot; para configurar niveles específicos para él.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {globalRules.slice().sort((a, b) => b.min_sales - a.min_sales).map(r => (
                      <Badge key={r.id} variant="outline" className="text-xs">
                        {getLevelIcon(r.level)} {r.level.replace(/_/g, ' ')}: {r.percentage}%
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalModalOpen(false)} disabled={savingGoalAndRules}>
              Cancelar
            </Button>
            <Button onClick={saveGoalAndRules} disabled={savingGoalAndRules}>
              {savingGoalAndRules ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detalle de Comisión */}
      <Dialog open={commissionDetailModalOpen} onOpenChange={setCommissionDetailModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Comisión</DialogTitle>
            <DialogDescription>
              Información detallada de la comisión calculada
            </DialogDescription>
          </DialogHeader>
          {selectedCommission && (
            <div className="grid gap-4 py-4">
              {/* Resumen Principal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Asesor</Label>
                  <p className="font-medium">
                    {selectedCommission.asesor?.full_name || selectedCommission.asesor?.email || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Período</Label>
                  <p className="font-medium">
                    {new Date(2000, selectedCommission.month - 1).toLocaleString('es', { month: 'long' })} {selectedCommission.year}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Ventas</Label>
                  <p className="font-medium">{selectedCommission.sales_count}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Meta Usada</Label>
                  <p className="font-medium">{selectedCommission.goal_used}</p>
                </div>
              </div>

              {/* Métricas de Comisión */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Nivel Alcanzado</Label>
                  <Badge className="capitalize mt-1" variant="default">
                    {getLevelIcon(selectedCommission.performance_level)} {selectedCommission.performance_level.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Porcentaje Aplicado</Label>
                  <p className="font-bold text-blue-600">{selectedCommission.percentage_applied}%</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Total Inscripciones</Label>
                  <p className="font-medium">Q{parseFloat(String(selectedCommission.sales_total_amount || 0)).toLocaleString()}</p>
                </div>
              </div>

              {/* Comisión Total */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                <Label className="text-xs text-muted-foreground">Comisión Total</Label>
                <p className="text-2xl font-bold text-green-600">
                  Q{parseFloat(String(selectedCommission.commission_amount || 0)).toLocaleString()}
                </p>
              </div>

              {/* Configuración Aplicada */}
              {selectedCommission.config_snapshot && selectedCommission.config_snapshot.global_thresholds && (
                <div>
                  <Label className="mb-2 block font-semibold">Configuración de Niveles Aplicada</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-gray-800">
                          <TableHead>Nivel</TableHead>
                          <TableHead>Ventas Mínimas</TableHead>
                          <TableHead>Ventas Máximas</TableHead>
                          <TableHead>% Comisión</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(selectedCommission.config_snapshot.global_thresholds as Record<string, any>)
                          .sort((a, b) => (b[1].min_sales || 0) - (a[1].min_sales || 0))
                          .map(([level, config]: [string, any]) => (
                            <TableRow 
                              key={level}
                              className={level === selectedCommission.performance_level ? 'bg-green-50 dark:bg-green-900/20 font-semibold' : ''}
                            >
                              <TableCell>
                                <Badge variant={level === selectedCommission.performance_level ? 'default' : 'outline'} className="capitalize">
                                  {getLevelIcon(level)} {level.replace(/_/g, ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>{config.min_sales}</TableCell>
                              <TableCell>{config.max_sales ?? '∞'}</TableCell>
                              <TableCell className="font-semibold">{config.percentage}%</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Meta mensual usada: <strong>{selectedCommission.goal_used} ventas</strong> • 
                    Calculado: {selectedCommission.config_snapshot.calculated_at ? new Date(selectedCommission.config_snapshot.calculated_at).toLocaleString('es') : 'N/A'}
                  </p>
                </div>
              )}

              {/* Ventas del Mes */}
              {selectedCommission.sales_source && selectedCommission.sales_source.length > 0 ? (
                <div>
                  <Label className="mb-2 block font-semibold">
                    Ventas del Mes ({selectedCommission.sales_source.length})
                  </Label>
                  <div className="max-h-[400px] overflow-y-auto border rounded-lg">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                        <TableRow>
                          <TableHead className="w-[50%]">Prospecto</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                          <TableHead className="text-center">Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCommission.sales_source.map((sale: any, idx: number) => (
                          <TableRow key={sale.id || idx}>
                            <TableCell className="font-medium">
                              {sale.prospecto?.nombre_completo || `ID: ${sale.prospecto_id}`}
                            </TableCell>
                            <TableCell className="text-right">Q{parseFloat(String(sale.amount || 0)).toLocaleString()}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={sale.paid_status ? "default" : "secondary"} className="text-xs">
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
                <div className="text-center py-8 text-muted-foreground">
                  No hay ventas registradas para esta comisión
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

      {/* Modal Agregar Nuevo Nivel */}
      <Dialog open={addLevelModalOpen} onOpenChange={setAddLevelModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Nivel de Comisión</DialogTitle>
            <DialogDescription>
              Crea un nivel personalizado para clasificar el rendimiento de los asesores.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="level-name">Nombre del Nivel</Label>
              <Input
                id="level-name"
                placeholder="Ej: bronce, plata, oro..."
                value={newLevelName}
                onChange={(e) => setNewLevelName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Se convertirá a minúsculas y los espacios serán reemplazados por guiones bajos.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="level-min">% Meta Mínimo</Label>
                <Input
                  id="level-min"
                  type="number"
                  min={0}
                  max={200}
                  value={newLevelMinSales}
                  onChange={(e) => setNewLevelMinSales(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="level-max">% Meta Máximo</Label>
                <Input
                  id="level-max"
                  type="number"
                  min={0}
                  max={200}
                  placeholder="∞"
                  value={newLevelMaxSales || ""}
                  onChange={(e) => setNewLevelMaxSales(e.target.value ? parseInt(e.target.value) : null)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Porcentaje de Comisión: {newLevelPercentage}%</Label>
              <Slider
                min={0}
                max={100}
                step={0.5}
                value={[newLevelPercentage]}
                onValueChange={(v) => setNewLevelPercentage(v[0])}
              />
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
              <p className="text-sm">
                <strong>Ejemplo:</strong> Si configuras Min: 70%, Max: 79% y Comisión: 45%, 
                los asesores que alcancen entre 70% y 79% de su meta recibirán 45% de comisión.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddLevelModalOpen(false)
              setNewLevelName("")
              setNewLevelMinSales(0)
              setNewLevelMaxSales(null)
              setNewLevelPercentage(0)
            }}>
              Cancelar
            </Button>
            <Button onClick={addNewLevel}>
              Crear Nivel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
