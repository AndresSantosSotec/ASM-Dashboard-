"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { fuzzyMatch } from "@/lib/search"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Link as LinkIcon, FileText, PlusCircle, Loader2, CheckCircle2, Unlink, AlertCircle, History, User, Calendar, Info, TrendingUp, Clock, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Database, Copy, Trash2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { getKardexPendientes } from "@/services/finance"
import {
  createReconciliacion,
  getKardex,
  getReconciliaciones,
  getConciliacionesPendientes,
  getConciliacionesRevisionManual,
  buscarKardexParaVincular,
  vincularConciliacionManual,
  desvincularConciliacion,
  getHistorialVinculaciones,
  getReconciliacionesDuplicados,
  bulkDeleteReconciliaciones,
  type KardexPagoResumen,
  type ReconciliationRecordResumen,
  type ConciliacionPendiente,
  type ConciliacionRevisionManual,
  type KardexSugerencia,
  type HistorialVinculacion,
  type DuplicadoGrupo,
  type DuplicadosResponse,
} from "@/services/mantenimientos"

type PaymentReconciliationProps = {
  initialView?: string | null
}

const PaymentReconciliation = ({ initialView }: PaymentReconciliationProps) => {
  // Función para formatear fechas de YYYY-MM-DD a DD/MM/YYYY
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-'
    // Parsear YYYY-MM-DD directamente sin usar new Date() para evitar
    // que JavaScript interprete la fecha como UTC medianoche y la
    // retroceda un día en zonas UTC- (Guatemala = UTC-6)
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateString)
    if (match) return `${match[3]}/${match[2]}/${match[1]}`
    return dateString
  }

  const [records, setRecords] = useState<ReconciliationRecordResumen[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const [bank, setBank] = useState("")
  const [reference, setReference] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState("")

  const [filterStatus, setFilterStatus] = useState("todos")
  const [filterBank, setFilterBank] = useState("todos")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")

  const [kardexQuery, setKardexQuery] = useState("")
  const [kardexLoading, setKardexLoading] = useState(false)
  const [kardexOptions, setKardexOptions] = useState<KardexPagoResumen[]>([])
  const [selectedKardex, setSelectedKardex] = useState<KardexPagoResumen | null>(null)

  // Estado del modal de vinculación manual
  const [modalOpen, setModalOpen] = useState(false)
  const [pendientes, setPendientes] = useState<ConciliacionPendiente[]>([])
  const [loadingPendientes, setLoadingPendientes] = useState(false)
  const [selectedConciliacion, setSelectedConciliacion] = useState<ConciliacionPendiente | null>(null)
  const [sugerencias, setSugerencias] = useState<KardexSugerencia[]>([])
  const [loadingSugerencias, setLoadingSugerencias] = useState(false)
  const [searchPendientes, setSearchPendientes] = useState("")
  const [searchSugerencias, setSearchSugerencias] = useState("")
  const [vinculando, setVinculando] = useState(false)

  // Estado del historial
  const [historial, setHistorial] = useState<HistorialVinculacion[]>([])
  const [loadingHistorial, setLoadingHistorial] = useState(false)
  const [searchHistorial, setSearchHistorial] = useState("")
  const [activeTab, setActiveTab] = useState("sin_conciliar")

  const normalizeView = (view?: string | null) => {
    const allowed = new Set(["sin_conciliar", "kardex_pendientes", "historial", "conciliaciones", "revision_manual"])
    if (view && allowed.has(view)) return view
    return "sin_conciliar"
  }

  // Estado de Conciliaciones sin conciliar (prospecto_id = null)
  const [sinconciliarList, setSinconciliarList] = useState<ConciliacionPendiente[]>([])
  const [loadingSinconciliar, setLoadingSinconciliar] = useState(false)
  const [searchSinconciliar, setSearchSinconciliar] = useState("")
  const [filterBankSinconciliar, setFilterBankSinconciliar] = useState("todos")
  const [filterDateFromSinconciliar, setFilterDateFromSinconciliar] = useState("")
  const [filterDateToSinconciliar, setFilterDateToSinconciliar] = useState("")

  // Estado de revisión manual (prospecto_id null con match probable)
  const [manualReviewList, setManualReviewList] = useState<ConciliacionRevisionManual[]>([])
  const [loadingManualReview, setLoadingManualReview] = useState(false)
  const [searchManualReview, setSearchManualReview] = useState("")

  // Estado de Kardex sin conciliar
  const [kardexPendientesList, setKardexPendientesList] = useState<any[]>([])
  const [loadingKardexPendientes, setLoadingKardexPendientes] = useState(false)
  const [filterBankKardex, setFilterBankKardex] = useState("todos")
  const [filterDateKardex, setFilterDateKardex] = useState("")
  const [filterCutoffDateKardex, setFilterCutoffDateKardex] = useState("")
  const [filterBoletaKardex, setFilterBoletaKardex] = useState("")
  const [filterMontoKardex, setFilterMontoKardex] = useState("")
  const [filterAlumnoKardex, setFilterAlumnoKardex] = useState("")

  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // Estado de paginación para Kardex
  const [currentPageKardex, setCurrentPageKardex] = useState(1)
  const [itemsPerPageKardex, setItemsPerPageKardex] = useState(20)

  // Total real de conciliaciones en BD (puede superar el límite cargado)
  const [totalRealCount, setTotalRealCount] = useState<number | null>(null)

  // Estado del panel de duplicados
  const [duplicadosOpen, setDuplicadosOpen] = useState(false)
  const [duplicadosData, setDuplicadosData] = useState<DuplicadosResponse | null>(null)
  const [loadingDuplicados, setLoadingDuplicados] = useState(false)
  const [selectedToDelete, setSelectedToDelete] = useState<Set<number>>(new Set())
  const [deletingDuplicados, setDeletingDuplicados] = useState(false)
  // Filtros dentro del dialog de duplicados
  const [dupFilterRef, setDupFilterRef] = useState("")
  const [dupFilterBank, setDupFilterBank] = useState("todos")

  const loadReconciliaciones = async () => {
    setLoadingRecords(true)
    try {
      const response = await getReconciliaciones({ limit: 5000 })
      setRecords(response.data ?? [])
      if (response.pagination?.total != null) {
        setTotalRealCount(response.pagination.total)
      }
    } catch (error: any) {
      toast({
        title: "Error al cargar conciliaciones",
        description: error?.response?.data?.message || error?.message || "No se pudieron cargar los registros.",
        variant: "destructive",
      })
    } finally {
      setLoadingRecords(false)
    }
  }

  const loadDuplicados = async () => {
    setLoadingDuplicados(true)
    setSelectedToDelete(new Set())
    try {
      const data = await getReconciliacionesDuplicados()
      setDuplicadosData(data)
    } catch (error: any) {
      toast({
        title: "Error al detectar duplicados",
        description: error?.response?.data?.message || error?.message || "No se pudieron detectar los duplicados.",
        variant: "destructive",
      })
    } finally {
      setLoadingDuplicados(false)
    }
  }

  const handleDeleteDuplicados = async () => {
    if (selectedToDelete.size === 0) return
    setDeletingDuplicados(true)
    try {
      const result = await bulkDeleteReconciliaciones(Array.from(selectedToDelete))
      toast({
        title: "Duplicados eliminados",
        description: `Se eliminaron ${result.eliminados} registro(s).${result.ignorados > 0 ? ` (${result.ignorados} ignorado(s) por estar vinculados)` : ''}`,
      })
      setSelectedToDelete(new Set())
      // Recargar duplicados y la lista principal
      await Promise.all([loadDuplicados(), loadReconciliaciones()])
    } catch (error: any) {
      toast({
        title: "Error al eliminar duplicados",
        description: error?.response?.data?.message || error?.message || "No se pudieron eliminar los duplicados.",
        variant: "destructive",
      })
    } finally {
      setDeletingDuplicados(false)
    }
  }

  const toggleSelectDuplicate = (id: number) => {
    setSelectedToDelete(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllExtras = () => {
    if (!duplicadosData) return
    const extras = new Set<number>()
    const gruposFiltrados = duplicadosData.grupos.filter(g => {
      const matchRef = !dupFilterRef || g.reference.toLowerCase().includes(dupFilterRef.toLowerCase())
      return matchRef
    })
    gruposFiltrados.forEach(g => {
      g.registros.forEach(r => {
        if (r.id !== g.conservar_id) extras.add(r.id)
      })
    })
    setSelectedToDelete(extras)
  }

  useEffect(() => {
    loadReconciliaciones()
    loadSinconciliar()   // precarga el badge de sin conciliar
    loadManualReview()   // precarga contador de revisión manual
  }, [])

  useEffect(() => {
    setActiveTab(normalizeView(initialView))
  }, [initialView])

  useEffect(() => {
    const fetchKardex = async () => {
      const term = kardexQuery.trim()
      if (term.length < 2) {
        setKardexOptions([])
        return
      }

      setKardexLoading(true)
      try {
        const response = await getKardex({ q: term, limit: 8 })
        setKardexOptions(response.data ?? [])
      } catch {
        setKardexOptions([])
      } finally {
        setKardexLoading(false)
      }
    }

    const timeout = setTimeout(fetchKardex, 300)
    return () => clearTimeout(timeout)
  }, [kardexQuery])

  // Auto-búsqueda en sugerencias del modal de vinculación con debounce
  useEffect(() => {
    if (!selectedConciliacion || !modalOpen) return
    const term = searchSugerencias.trim()
    // Si el campo queda vacío, buscar con la referencia original
    const buscarCon = term.length > 0 ? term : (selectedConciliacion.reference || "")
    const timeout = setTimeout(async () => {
      setLoadingSugerencias(true)
      try {
        const response = await buscarKardexParaVincular(selectedConciliacion.id, buscarCon)
        setSugerencias(response.sugerencias ?? [])
      } catch {
        // silencioso; el botón manual sigue disponible
      } finally {
        setLoadingSugerencias(false)
      }
    }, 400)
    return () => clearTimeout(timeout)
  }, [searchSugerencias, selectedConciliacion, modalOpen])

  const handleSelectKardex = (item: KardexPagoResumen) => {
    setSelectedKardex(item)
    setKardexQuery("")
    setKardexOptions([])

    setBank((prev) => prev || item.banco || "")
    setReference((prev) => prev || item.numero_boleta || "")
    setAmount((prev) => prev || String(item.monto_pagado ?? ""))
    setDate((prev) => prev || item.fecha_pago || "")
  }

  const clearSelectedKardex = () => {
    setSelectedKardex(null)
  }

  const resetForm = () => {
    setBank("")
    setReference("")
    setAmount("")
    setDate("")
    setKardexQuery("")
    setKardexOptions([])
    setSelectedKardex(null)
  }

  const handleCreateReconciliation = async () => {
    if (!bank.trim() || !reference.trim() || !amount || !date) {
      toast({
        title: "Datos incompletos",
        description: "Banco, referencia, monto y fecha son obligatorios.",
        variant: "destructive",
      })
      return
    }

    const numericAmount = Number(amount)
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        title: "Monto inválido",
        description: "Ingresa un monto mayor a 0.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      await createReconciliacion({
        bank: bank.trim(),
        reference: reference.trim(),
        amount: numericAmount,
        date,
        kardex_pago_id: selectedKardex?.id,
        prospecto_id: selectedKardex?.prospecto?.id ?? undefined,
        status: selectedKardex ? "conciliado" : "imported",
      })

      toast({
        title: "Reconciliación creada",
        description: selectedKardex
          ? "La conciliación quedó vinculada al Kardex seleccionado."
          : "La conciliación se registró sin vínculo de Kardex.",
      })

      resetForm()
      await loadReconciliaciones()
    } catch (error: any) {
      toast({
        title: "Error al crear conciliación",
        description: error?.response?.data?.message || error?.message || "No se pudo crear la conciliación.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const openVinculacionModal = async () => {
    setModalOpen(true)
    setLoadingPendientes(true)
    try {
      const response = await getConciliacionesPendientes()
      setPendientes(response.conciliaciones ?? [])
    } catch (error: any) {
      toast({
        title: "Error al cargar conciliaciones pendientes",
        description: error?.response?.data?.message || error?.message,
        variant: "destructive",
      })
    } finally {
      setLoadingPendientes(false)
    }
  }

  const openVinculacionModalWithRecord = async (record: ReconciliationRecordResumen) => {
    const termInicial = record.reference || ""
    setModalOpen(true)
    setSelectedConciliacion(record as any)
    setSearchSugerencias(termInicial)   // pre-llena con el número de boleta/referencia
    setLoadingPendientes(true)
    setLoadingSugerencias(true)
    try {
      // Cargar lista de pendientes
      const responsePendientes = await getConciliacionesPendientes()
      setPendientes(responsePendientes.conciliaciones ?? [])
      
      // Buscar en kardex usando la referencia como término inicial
      const responseSugerencias = await buscarKardexParaVincular(record.id, termInicial)
      setSugerencias(responseSugerencias.sugerencias ?? [])
    } catch (error: any) {
      toast({
        title: "Error al cargar datos",
        description: error?.response?.data?.message || error?.message,
        variant: "destructive",
      })
    } finally {
      setLoadingPendientes(false)
      setLoadingSugerencias(false)
    }
  }

  const closeVinculacionModal = () => {
    setModalOpen(false)
    setSelectedConciliacion(null)
    setSugerencias([])
    setSearchPendientes("")
    setSearchSugerencias("")
  }

  const handleSelectConciliacionPendiente = async (conciliacion: ConciliacionPendiente) => {
    const termInicial = conciliacion.reference || ""
    setSelectedConciliacion(conciliacion)
    setSearchSugerencias(termInicial)   // pre-llena con la referencia
    setLoadingSugerencias(true)
    try {
      const response = await buscarKardexParaVincular(conciliacion.id, termInicial)
      setSugerencias(response.sugerencias ?? [])
    } catch (error: any) {
      toast({
        title: "Error al buscar sugerencias",
        description: error?.response?.data?.message || error?.message,
        variant: "destructive",
      })
    } finally {
      setLoadingSugerencias(false)
    }
  }

  const handleBuscarSugerencias = async () => {
    if (!selectedConciliacion) return
    setLoadingSugerencias(true)
    try {
      const response = await buscarKardexParaVincular(selectedConciliacion.id, searchSugerencias)
      setSugerencias(response.sugerencias ?? [])
    } catch (error: any) {
      toast({
        title: "Error al buscar",
        description: error?.response?.data?.message || error?.message,
        variant: "destructive",
      })
    } finally {
      setLoadingSugerencias(false)
    }
  }

  const handleVincularPago = async (kardexPagoId: number) => {
    if (!selectedConciliacion) return

    setVinculando(true)
    try {
      await vincularConciliacionManual(selectedConciliacion.id, kardexPagoId)
      toast({
        title: "Vinculación exitosa",
        description: "La conciliación fue vinculada correctamente al pago del Kardex.",
      })
      closeVinculacionModal()
      await loadReconciliaciones()
      if (activeTab === "sin_conciliar") await loadSinconciliar()
    } catch (error: any) {
      toast({
        title: "Error al vincular",
        description: error?.response?.data?.message || error?.message,
        variant: "destructive",
      })
    } finally {
      setVinculando(false)
    }
  }

  const handleDesvincular = async (conciliacionId: number) => {
    if (!confirm("¿Seguro que deseas desvincular esta conciliación?")) return

    try {
      await desvincularConciliacion(conciliacionId)
      toast({
        title: "Desvinculación exitosa",
        description: "La conciliación ha sido desvinculada correctamente.",
      })
      await loadReconciliaciones()
      if (activeTab === "historial") {
        await loadHistorial()
      }
    } catch (error: any) {
      toast({
        title: "Error al desvincular",
        description: error?.response?.data?.message || error?.message,
        variant: "destructive",
      })
    }
  }

  const loadSinconciliar = async () => {
    setLoadingSinconciliar(true)
    try {
      const response = await getConciliacionesPendientes()
      setSinconciliarList(response.conciliaciones ?? [])
    } catch (error: any) {
      toast({
        title: "Error al cargar registros sin conciliar",
        description: error?.response?.data?.message || error?.message || "No se pudieron cargar los registros.",
        variant: "destructive",
      })
    } finally {
      setLoadingSinconciliar(false)
    }
  }

  const loadManualReview = async (search?: string) => {
    setLoadingManualReview(true)
    try {
      const response = await getConciliacionesRevisionManual(search)
      setManualReviewList(response.conciliaciones ?? [])
    } catch (error: any) {
      toast({
        title: "Error al cargar revisión manual",
        description: error?.response?.data?.message || error?.message || "No se pudieron cargar los registros.",
        variant: "destructive",
      })
    } finally {
      setLoadingManualReview(false)
    }
  }

  const loadKardexPendientesTab = async () => {
    setLoadingKardexPendientes(true)
    try {
      const response = await getKardexPendientes({ per_page: 500 })
      setKardexPendientesList(response.results ?? [])
    } catch (error: any) {
      toast({
        title: "Error al cargar Kardex sin conciliar",
        description: error?.response?.data?.message || error?.message || "No se pudieron cargar los registros.",
        variant: "destructive",
      })
    } finally {
      setLoadingKardexPendientes(false)
    }
  }

  const loadHistorial = async () => {
    setLoadingHistorial(true)
    try {
      const response = await getHistorialVinculaciones({ limit: 200 })
      setHistorial(response.historial ?? [])
    } catch (error: any) {
      toast({
        title: "Error al cargar historial",
        description: error?.response?.data?.message || error?.message,
        variant: "destructive",
      })
    } finally {
      setLoadingHistorial(false)
    }
  }

  const filteredKardexPendientes = useMemo(() => {
    return kardexPendientesList.filter((k) => {
      // Filtro de banco
      if (filterBankKardex !== "todos" && k.input?.banco !== filterBankKardex) return false

      // Filtro de fecha específica
      if (filterDateKardex && k.input?.fechaPago !== filterDateKardex) return false

      // Filtro de fecha de corte
      if (filterCutoffDateKardex && k.input?.fechaPago) {
        if (k.input.fechaPago > filterCutoffDateKardex) return false
      }

      // Filtro de boleta (recibo)
      if (filterBoletaKardex && !k.input?.recibo?.toLowerCase().includes(filterBoletaKardex.toLowerCase())) return false

      // Filtro de monto
      if (filterMontoKardex && !String(k.input?.monto || "").includes(filterMontoKardex)) return false

      // Filtro de alumno / carnet
      if (filterAlumnoKardex) {
        const searchVal = filterAlumnoKardex.toLowerCase()
        const matchAlumno = k.input?.alumno?.toLowerCase().includes(searchVal)
        const matchCarnet = k.input?.carnet?.toLowerCase().includes(searchVal)
        if (!matchAlumno && !matchCarnet) return false
      }

      return true
    })
  }, [kardexPendientesList, filterBankKardex, filterDateKardex, filterCutoffDateKardex, filterBoletaKardex, filterMontoKardex, filterAlumnoKardex])

  const uniqueBanksKardex = useMemo(() => {
    const banks = new Set(kardexPendientesList.map(k => k.input?.banco).filter(Boolean))
    return Array.from(banks) as string[]
  }, [kardexPendientesList])

  const filteredHistorial = useMemo(() => {
    if (!searchHistorial.trim()) return historial
    return historial.filter((h) =>
      fuzzyMatch(
        [
          h.action || "",
          h.usuario?.nombre || "",
          h.usuario?.email || "",
          h.conciliacion?.referencia || "",
          h.conciliacion?.banco || "",
          h.kardex?.numero_boleta || "",
          h.prospecto?.nombre || "",
          h.prospecto?.carnet || "",
          h.observaciones || "",
        ],
        searchHistorial,
      ),
    )
  }, [historial, searchHistorial])

  const uniqueBanks = useMemo(() => {
    const banks = new Set(records.map(r => r.bank).filter(Boolean))
    return Array.from(banks) as string[]
  }, [records])

  const filteredSinconciliar = useMemo(() => {
    return sinconciliarList.filter((c) => {
      if (filterBankSinconciliar !== "todos" && c.bank !== filterBankSinconciliar) return false
      if (filterDateFromSinconciliar && c.date && c.date < filterDateFromSinconciliar) return false
      if (filterDateToSinconciliar && c.date && c.date > filterDateToSinconciliar) return false
      if (!searchSinconciliar.trim()) return true
      const q = searchSinconciliar.toLowerCase()
      return (
        (c.reference || "").toLowerCase().includes(q) ||
        (c.bank || "").toLowerCase().includes(q) ||
        String(c.amount || "").includes(q) ||
        (c.prospecto?.nombre || "").toLowerCase().includes(q) ||
        (c.prospecto?.carnet || "").toLowerCase().includes(q)
      )
    })
  }, [sinconciliarList, filterBankSinconciliar, searchSinconciliar, filterDateFromSinconciliar, filterDateToSinconciliar])

  const uniqueBanksSinconciliar = useMemo(() => {
    const banks = new Set(sinconciliarList.map(c => c.bank).filter(Boolean))
    return Array.from(banks) as string[]
  }, [sinconciliarList])

  const filteredPendientes = useMemo(() => {
    const term = searchPendientes.trim().toLowerCase()
    if (!term) return pendientes
    return pendientes.filter((c) => {
      return (
        (c.reference || "").toLowerCase().includes(term) ||
        (c.bank || "").toLowerCase().includes(term) ||
        String(c.amount || "").includes(term) ||
        (c.prospecto?.nombre || "").toLowerCase().includes(term) ||
        (c.prospecto?.carnet || "").toLowerCase().includes(term)
      )
    })
  }, [pendientes, searchPendientes])

  const filteredManualReview = useMemo(() => {
    const term = searchManualReview.trim().toLowerCase()
    if (!term) return manualReviewList
    return manualReviewList.filter((c) => {
      return (
        (c.reference || "").toLowerCase().includes(term) ||
        (c.bank || "").toLowerCase().includes(term) ||
        String(c.amount || "").includes(term) ||
        String(c.match_count || "").includes(term)
      )
    })
  }, [manualReviewList, searchManualReview])

  const filteredRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return records.filter((r) => {
      if (filterStatus === "conciliado" && !r.kardex_pago_id) return false
      if (filterStatus === "pendiente" && r.kardex_pago_id) return false
      if (filterBank !== "todos" && r.bank !== filterBank) return false
      if (filterDateFrom && r.date && r.date < filterDateFrom) return false
      if (filterDateTo && r.date && r.date > filterDateTo) return false
      if (!term) return true

      const prospectName = ((r.prospecto as any)?.nombre_completo || r.prospecto?.nombre || "").toLowerCase()
      const prospectCarnet = ((r.prospecto as any)?.carnet || "").toLowerCase()
      return (
        (r.reference || "").toLowerCase().includes(term) ||
        (r.bank || "").toLowerCase().includes(term) ||
        String(r.amount || "").includes(term) ||
        prospectName.includes(term) ||
        prospectCarnet.includes(term) ||
        (r.status || "").toLowerCase().includes(term)
      )
    })
  }, [records, searchTerm, filterStatus, filterBank, filterDateFrom, filterDateTo])

  // Paginación principal
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredRecords.slice(startIndex, endIndex)
  }, [filteredRecords, currentPage, itemsPerPage])

  // Paginación Kardex
  const totalPagesKardex = Math.ceil(filteredKardexPendientes.length / itemsPerPageKardex)
  const paginatedKardex = useMemo(() => {
    const startIndex = (currentPageKardex - 1) * itemsPerPageKardex
    const endIndex = startIndex + itemsPerPageKardex
    return filteredKardexPendientes.slice(startIndex, endIndex)
  }, [filteredKardexPendientes, currentPageKardex, itemsPerPageKardex])

  // Resetear a página 1 cuando cambia el filtro
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterStatus, filterBank, filterDateFrom, filterDateTo])

  useEffect(() => {
    setCurrentPageKardex(1)
  }, [filterBankKardex, filterDateKardex, filterCutoffDateKardex, filterBoletaKardex, filterMontoKardex, filterAlumnoKardex])

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const goToPageKardex = (page: number) => {
    if (page >= 1 && page <= totalPagesKardex) {
      setCurrentPageKardex(page)
    }
  }

  const handleActionKardex = (kardexItem: any) => {
    // Fill "Create" form
    setBank(kardexItem.input?.banco || "")
    setReference(kardexItem.input?.recibo || "")
    setAmount(String(kardexItem.input?.monto || ""))
    if (kardexItem.input?.fechaPago) setDate(kardexItem.input.fechaPago)

    setSelectedKardex({
      id: kardexItem.kardex_id,
      numero_boleta: kardexItem.input?.recibo,
      monto_pagado: kardexItem.input?.monto,
      banco: kardexItem.input?.banco,
      fecha_pago: kardexItem.input?.fechaPago,
      prospecto: { nombre: kardexItem.input?.alumno, carnet: kardexItem.input?.carnet }
    } as any)

    setSearchTerm(kardexItem.input?.recibo || "")
    setFilterStatus("pendiente")
    setActiveTab("conciliaciones")
    window.scrollTo({ top: 0, behavior: 'smooth' })

    toast({
      title: "Kardex seleccionado",
      description: "Puede crear la conciliación llenando los datos restantes arriba, o vincularla a una pendiente en la lista inferior.",
    })
  }

  useEffect(() => {
    if (activeTab === "historial" && historial.length === 0) {
      loadHistorial()
    } else if (activeTab === "kardex_pendientes" && kardexPendientesList.length === 0) {
      loadKardexPendientesTab()
    } else if (activeTab === "revision_manual") {
      loadManualReview(searchManualReview)
    } else if (activeTab === "sin_conciliar") {
      loadSinconciliar()
    }
  }, [activeTab])

  const pendientesCount = records.filter(r => !r.kardex_pago_id).length
  const vinculadasCount = records.filter(r => r.kardex_pago_id).length

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <Alert className="bg-slate-50 border-slate-200">
        <Info className="h-4 w-4 text-slate-600" />
        <AlertTitle className="text-slate-900">Flujo recomendado de trabajo</AlertTitle>
        <AlertDescription className="text-slate-700 text-sm">
          1) Conciliaciones Sin Conciliar. 2) Kardex Sin Conciliar. 3) Historial de Vinculaciones.
          4) Conciliaciones generales y Revisión Manual cuando aplique.
        </AlertDescription>
      </Alert>

      <TabsList>
        <TabsTrigger value="sin_conciliar" className="relative">
          <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
          Conciliaciones Sin Conciliar
          {sinconciliarList.length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1">
              {sinconciliarList.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="kardex_pendientes">
          <Database className="h-4 w-4 mr-2" />
          Kardex Sin Conciliar
        </TabsTrigger>
        <TabsTrigger value="historial">
          <History className="h-4 w-4 mr-2" />
          Historial
        </TabsTrigger>
        <TabsTrigger value="conciliaciones">
          <FileText className="h-4 w-4 mr-2" />
          Conciliaciones
        </TabsTrigger>
        <TabsTrigger value="revision_manual" className="relative">
          <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
          Revisión Manual
          {manualReviewList.length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1">
              {manualReviewList.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      {/* forceMount evita que Radix desmonte el Dialog cuando el tab no está activo */}
      <TabsContent value="conciliaciones" className="space-y-6" forceMount>
      
      {/* Alert informativo */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900">¿Cómo vincular conciliaciones bancarias?</AlertTitle>
        <AlertDescription className="text-blue-800">
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Busque la conciliación sin vincular en la tabla inferior</li>
            <li>Haga clic en el botón <strong>"Vincular"</strong> en la columna de acciones</li>
            <li>Se abrirá una ventana donde puede buscar el pago correspondiente en el Kardex</li>
            <li>Seleccione el pago que coincida (se muestra el % de similitud)</li>
            <li>Confirme la vinculación</li>
          </ol>
        </AlertDescription>
      </Alert>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Conciliaciones</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1 border-orange-300 text-orange-700 hover:bg-orange-50"
                onClick={() => { setDuplicadosOpen(true); loadDuplicados() }}
              >
                <Copy className="h-3 w-3" />
                Detectar duplicadas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRealCount != null ? totalRealCount.toLocaleString() : records.length.toLocaleString()}
            </div>
            {totalRealCount != null && records.length < totalRealCount && (
              <p className="text-xs text-amber-600 mt-1">
                Mostrando {records.length.toLocaleString()} de {totalRealCount.toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-amber-900">Pendientes de Vincular</CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">{pendientesCount}</div>
            <p className="text-xs text-amber-700 mt-1">Sin vínculo al Kardex</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-green-900">Vinculadas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{vinculadasCount}</div>
            <p className="text-xs text-green-700 mt-1">Conectadas al Kardex</p>
          </CardContent>
        </Card>
      </div>

      {/* ====== DIALOG DUPLICADOS ====== */}
      <Dialog open={duplicadosOpen} onOpenChange={(open) => { setDuplicadosOpen(open); if (!open) { setDupFilterRef(""); setDupFilterBank("todos") } }}>
        <DialogContent className="max-w-5xl w-full" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5 text-orange-500" />
              Conciliaciones Duplicadas Sin Vincular
            </DialogTitle>
            <DialogDescription className="space-y-1">
              <span className="block">
                Detecta registros sin vincular que comparten el mismo <strong>número de referencia</strong>.
                Pueden ser importaciones duplicadas del mismo pago bancario.
              </span>
              <span className="block text-xs text-muted-foreground">
                ⚠️ Grupos con <strong>montos distintos</strong> pueden ser pagos agrupados del banco (varios alumnos bajo la misma referencia) — revisa antes de eliminar.
              </span>
            </DialogDescription>
          </DialogHeader>

          {loadingDuplicados ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Analizando duplicados…
            </div>
          ) : !duplicadosData ? null : duplicadosData.grupos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-green-700">
              <CheckCircle2 className="h-10 w-10" />
              <p className="font-semibold text-base">No se encontraron referencias duplicadas</p>
              <p className="text-xs text-center text-muted-foreground max-w-sm">
                Todos los registros sin vincular tienen un número de referencia único.
                No hay conciliaciones duplicadas en este momento.
              </p>
            </div>
          ) : (() => {
            // Grupos filtrados según búsqueda activa
            const gruposFiltrados = duplicadosData.grupos.filter(g => {
              const matchRef = !dupFilterRef || g.reference.toLowerCase().includes(dupFilterRef.toLowerCase())
              return matchRef
            })

            const extrasEnFiltro = gruposFiltrados.reduce((acc, g) =>
              acc + g.registros.filter(r => r.id !== g.conservar_id).length, 0)

            const todosExtrasSeleccionados = extrasEnFiltro > 0 &&
              gruposFiltrados.every(g => g.registros.filter(r => r.id !== g.conservar_id).every(r => selectedToDelete.has(r.id)))

            return (
              <>
                {/* Resumen */}
                <div className="shrink-0 flex items-center gap-4 p-3 bg-orange-50 border border-orange-200 rounded-md text-sm">
                  <span className="font-semibold text-orange-800">
                    {duplicadosData.resumen.grupos_duplicados} grupo(s) duplicados
                  </span>
                  <span className="text-orange-400">·</span>
                  <span className="text-orange-700">{duplicadosData.resumen.registros_extra} registros extra eliminables</span>
                  {dupFilterRef && (
                    <>
                      <span className="text-orange-400">·</span>
                      <span className="text-blue-700 font-medium">Filtro activo: {gruposFiltrados.length} grupo(s)</span>
                    </>
                  )}
                </div>

                {/* ── FILTROS ── */}
                <div className="shrink-0 flex gap-2 flex-wrap items-end">
                  <div className="flex-1 min-w-[160px]">
                    <label className="text-xs text-muted-foreground mb-1 block">Buscar por referencia</label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        value={dupFilterRef}
                        onChange={e => setDupFilterRef(e.target.value)}
                        placeholder="Ej: 448002"
                        className="pl-7 h-8 text-xs"
                      />
                    </div>
                  </div>
                  {dupFilterRef && (
                    <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => setDupFilterRef("")}>
                      Limpiar filtro
                    </Button>
                  )}
                </div>

                {/* ── ACCIONES MASIVAS ── */}
                <div className="shrink-0 flex items-center gap-2 flex-wrap border-t pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium">
                    <Checkbox
                      checked={todosExtrasSeleccionados}
                      onCheckedChange={(checked) => {
                        const extras = gruposFiltrados.flatMap(g =>
                          g.registros.filter(r => r.id !== g.conservar_id).map(r => r.id)
                        )
                        setSelectedToDelete(prev => {
                          const next = new Set(prev)
                          extras.forEach(id => checked ? next.add(id) : next.delete(id))
                          return next
                        })
                      }}
                    />
                    Seleccionar todos los extras {dupFilterRef ? 'filtrados' : ''} ({extrasEnFiltro})
                  </label>

                  {selectedToDelete.size > 0 && (
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setSelectedToDelete(new Set())}>
                      Quitar selección ({selectedToDelete.size})
                    </Button>
                  )}

                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={selectedToDelete.size === 0 || deletingDuplicados}
                    onClick={handleDeleteDuplicados}
                    className="text-xs gap-1 ml-auto"
                  >
                    {deletingDuplicados ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    {selectedToDelete.size > 0 ? `Eliminar ${selectedToDelete.size} seleccionada(s)` : 'Eliminar seleccionadas'}
                  </Button>
                </div>

                {/* ── LISTA DE GRUPOS (scrollable) ── */}
                <div className="overflow-y-auto flex-1 space-y-3 pr-1">
                  {gruposFiltrados.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">Sin grupos que coincidan con los filtros.</p>
                  ) : gruposFiltrados.map((grupo) => {
                    const extrasGrupo = grupo.registros.filter(r => r.id !== grupo.conservar_id)
                    const todosGrupoSel = extrasGrupo.length > 0 && extrasGrupo.every(r => selectedToDelete.has(r.id))
                    return (
                      <div key={grupo.reference} className="border rounded-md overflow-hidden">
                        {/* Header del grupo */}
                        <div className="bg-orange-50 px-3 py-2 flex items-center gap-2 text-sm font-medium text-orange-900">
                          <Checkbox
                            title="Seleccionar todos los duplicados de este grupo"
                            checked={todosGrupoSel}
                            onCheckedChange={(checked) => {
                              setSelectedToDelete(prev => {
                                const next = new Set(prev)
                                extrasGrupo.forEach(r => checked ? next.add(r.id) : next.delete(r.id))
                                return next
                              })
                            }}
                            className="shrink-0"
                          />
                          <Copy className="h-4 w-4 shrink-0" />
                          <span>Ref: <span className="font-mono">{grupo.reference}</span></span>
                          {grupo.montos_distintos && (
                            <Badge variant="outline" className="border-yellow-400 text-yellow-700 text-xs">
                              ⚠️ Pagos agrupados
                            </Badge>
                          )}
                          <Badge variant="outline" className="ml-auto border-orange-300 text-orange-700 text-xs shrink-0">
                            {grupo.total} registros · {extrasGrupo.length} extra(s)
                          </Badge>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow className="text-xs bg-gray-50">
                              <TableHead className="w-10 text-center">✓</TableHead>
                              <TableHead>ID</TableHead>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Alumno / Carnet</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead>Importado</TableHead>
                              <TableHead>Tipo</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {grupo.registros.map((reg) => {
                              const isOriginal = reg.id === grupo.conservar_id
                              const isChecked = selectedToDelete.has(reg.id)
                              return (
                                <TableRow
                                  key={reg.id}
                                  className={isOriginal ? 'bg-green-50' : isChecked ? 'bg-red-50' : 'hover:bg-gray-50 cursor-pointer'}
                                  onClick={() => { if (!isOriginal) toggleSelectDuplicate(reg.id) }}
                                >
                                  <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                                    {!isOriginal ? (
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={() => toggleSelectDuplicate(reg.id)}
                                      />
                                    ) : (
                                      <span className="text-green-600 text-base leading-none">✓</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs text-muted-foreground">#{reg.id}</TableCell>
                                  <TableCell className="text-xs">{formatDate(reg.date)}</TableCell>
                                  <TableCell className="text-xs">
                                    {reg.nombre_alumno ? (
                                      <div>
                                        <div className="font-medium">{reg.nombre_alumno}</div>
                                        <div className="text-muted-foreground">{reg.carnet ?? 'Sin carnet'}</div>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground italic">Sin alumno</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">{reg.status ?? '-'}</Badge>
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">{reg.created_at ?? '-'}</TableCell>
                                  <TableCell>
                                    {isOriginal ? (
                                      <Badge className="text-xs bg-green-100 text-green-800 border border-green-300 hover:bg-green-100">
                                        ✓ Original
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className={`text-xs ${isChecked ? 'border-red-400 bg-red-50 text-red-700' : 'border-orange-300 text-orange-700'}`}>
                                        {isChecked ? '✗ A eliminar' : 'Duplicado'}
                                      </Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )
                  })}
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Crear Nueva Reconciliación Bancaria</CardTitle>
          <CardDescription>
            <strong>Opcional:</strong> Registre manualmente una conciliación bancaria. Puede vincularla con el Kardex ahora o después.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Banco</label>
              <Input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Ej: BANRURAL" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Referencia</label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Ej: 87291022" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Monto</label>
              <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Vincular con Kardex (opcional)</label>
            <Input
              placeholder="Buscar por estudiante, carnet, boleta u observaciones..."
              value={kardexQuery}
              onChange={(e) => setKardexQuery(e.target.value)}
            />
            {kardexLoading && (
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" /> Buscando en Kardex...
              </p>
            )}
            {!kardexLoading && kardexOptions.length > 0 && (
              <div className="border rounded-md max-h-56 overflow-y-auto">
                {kardexOptions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-muted border-b last:border-b-0"
                    onClick={() => handleSelectKardex(item)}
                  >
                    <div className="text-sm font-medium">
                      {(item.prospecto as any)?.nombre_completo || item.prospecto?.nombre || "Sin nombre"}
                      <span className="text-muted-foreground"> ({(item.prospecto as any)?.carnet || "sin carnet"})</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Boleta: {item.numero_boleta || "-"} | Banco: {item.banco || "-"} | Monto: Q {Number(item.monto_pagado || 0).toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedKardex && (
            <div className="rounded-md border bg-green-50 border-green-200 p-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Kardex vinculado
                </p>
                <p className="text-xs text-green-900">
                  ID {selectedKardex.id} - {(selectedKardex.prospecto as any)?.nombre_completo || selectedKardex.prospecto?.nombre || "Sin nombre"}
                  {" | "}Boleta: {selectedKardex.numero_boleta || "-"}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={clearSelectedKardex}>
                Quitar
              </Button>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
              Limpiar
            </Button>
            <Button type="button" onClick={handleCreateReconciliation} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />}
              Guardar Reconciliación
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Conciliaciones Bancarias</CardTitle>
              <CardDescription>
                Todas las conciliaciones importadas o creadas manualmente. Use el botón <strong>"Vincular"</strong> para conectar con pagos del Kardex.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar (ref, banco, alumno)..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Estado de Vinculación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="conciliado">Vinculados</SelectItem>
                <SelectItem value="pendiente">Pendientes</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterBank} onValueChange={setFilterBank}>
              <SelectTrigger>
                <SelectValue placeholder="Banco" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los bancos</SelectItem>
                {uniqueBanks.map(banco => (
                  <SelectItem key={banco} value={banco}>{banco}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtros de fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Fecha desde</label>
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Fecha hasta (corte)</label>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>
            {(filterDateFrom || filterDateTo || filterStatus !== "todos" || filterBank !== "todos" || searchTerm) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground self-end"
                onClick={() => {
                  setFilterDateFrom("")
                  setFilterDateTo("")
                  setFilterStatus("todos")
                  setFilterBank("todos")
                  setSearchTerm("")
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>

          {/* Información de paginación y controles */}
          {filteredRecords.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> a{" "}
                <strong>{Math.min(currentPage * itemsPerPage, filteredRecords.length)}</strong> de{" "}
                <strong>{filteredRecords.length}</strong> conciliaciones
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Mostrar:</span>
                <Select value={String(itemsPerPage)} onValueChange={(v) => {
                  setItemsPerPage(Number(v))
                  setCurrentPage(1)
                }}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {filteredRecords.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Banco</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRecords.map((record) => (
                    <TableRow key={record.id} className={!record.kardex_pago_id ? "bg-amber-50/30" : ""}>
                      <TableCell className="text-sm">{formatDate(record.date)}</TableCell>
                      <TableCell className="font-mono text-xs">{record.reference || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{record.bank || '-'}</TableCell>
                      <TableCell className="font-medium">Q {Number(record.amount || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        {record.prospecto ? (
                          <div>
                            <div className="text-sm">{(record.prospecto as any)?.nombre_completo || record.prospecto.nombre || 'Sin nombre'}</div>
                            <div className="text-xs text-muted-foreground">{(record.prospecto as any)?.carnet || '-'}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No identificado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.status === 'conciliado' ? 'default' : 'outline'} className="capitalize">
                          {record.status || 'imported'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {record.kardex ? (
                          <div className="flex items-center justify-end gap-2">
                            <Badge variant="outline" className="border-green-400 text-green-700">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Vinculado
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDesvincular(record.id)}
                              title="Desvincular"
                            >
                              <Unlink className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => openVinculacionModalWithRecord(record)}
                          >
                            <LinkIcon className="h-3 w-3 mr-1" />
                            Vincular
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No se encontraron conciliaciones</p>
            </div>
          )}

          {/* Controles de paginación */}
          {filteredRecords.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-muted-foreground">
                Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  title="Primera página"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  title="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = Number(e.target.value)
                      if (page >= 1 && page <= totalPages) {
                        goToPage(page)
                      }
                    }}
                    className="w-16 h-8 text-center"
                  />
                  <span className="text-sm text-muted-foreground">de {totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  title="Página siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  title="Última página"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 🔗 Modal de Vinculación Manual */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>🔗 Vincular con Pago del Kardex</DialogTitle>
            <DialogDescription>
              <strong>Paso 1:</strong> Conciliación seleccionada mostrada a la izquierda. 
              <strong>Paso 2:</strong> Busque y seleccione el pago correspondiente del Kardex a la derecha.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna izquierda: Conciliación seleccionada */}
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-4">
                <h3 className="text-sm font-semibold mb-3 text-blue-900 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Conciliación a Vincular
                </h3>
                {selectedConciliacion ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Banco</p>
                        <p className="font-medium">{selectedConciliacion.bank || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Referencia</p>
                        <p className="font-medium font-mono">{selectedConciliacion.reference || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Monto</p>
                        <p className="font-medium text-lg">Q {Number(selectedConciliacion.amount || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Fecha</p>
                        <p className="font-medium">{formatDate(selectedConciliacion.date)}</p>
                      </div>
                    </div>
                    {selectedConciliacion.prospecto && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">Estudiante</p>
                        <p className="font-medium text-sm">{selectedConciliacion.prospecto.nombre || 'Sin nombre'}</p>
                        <p className="text-xs text-muted-foreground">{selectedConciliacion.prospecto.carnet || '-'}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Ninguna conciliación seleccionada</p>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-semibold mb-2">Otras Conciliaciones Pendientes</h3>
                <Input
                  placeholder="Buscar otra conciliación..."
                  value={searchPendientes}
                  onChange={(e) => setSearchPendientes(e.target.value)}
                />
              </div>

              {loadingPendientes ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredPendientes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No hay conciliaciones pendientes</p>
                </div>
              ) : (
                <div className="border rounded-md max-h-96 overflow-y-auto">
                  {filteredPendientes.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectConciliacionPendiente(c)}
                      className={`w-full text-left px-3 py-3 border-b hover:bg-muted ${
                        selectedConciliacion?.id === c.id ? "bg-blue-50 border-blue-300" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {c.bank} - {c.reference}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Q {Number(c.amount || 0).toFixed(2)} | {formatDate(c.date)}
                          </div>
                          {c.prospecto && (
                            <div className="text-xs text-muted-foreground">
                              {c.prospecto.nombre || "Sin nombre"} ({c.prospecto.carnet || "-"})
                            </div>
                          )}
                        </div>
                        {selectedConciliacion?.id === c.id && (
                          <CheckCircle2 className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Columna derecha: Sugerencias de Kardex */}
            <div className="space-y-4">
              {selectedConciliacion ? (
                <>
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-900">Paso 2: Busque el Pago Correspondiente</AlertTitle>
                    <AlertDescription className="text-green-800 text-xs">
                      Use la búsqueda para encontrar el pago del estudiante en el Kardex. 
                      El sistema calculará automáticamente el % de coincidencia.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <h3 className="text-sm font-semibold mb-2">🔍 Buscar en Kardex de Pagos</h3>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Buscar por estudiante, DPI, boleta..."
                        value={searchSugerencias}
                        onChange={(e) => setSearchSugerencias(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleBuscarSugerencias()}
                      />
                      <Button onClick={handleBuscarSugerencias} disabled={loadingSugerencias}>
                        {loadingSugerencias ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {loadingSugerencias ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <p className="ml-2 text-sm text-muted-foreground">Buscando pagos similares...</p>
                    </div>
                  ) : sugerencias.length === 0 ? (
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-900">No se encontraron coincidencias</AlertTitle>
                      <AlertDescription className="text-amber-800 text-xs">
                        Intente buscar con diferentes términos: nombre del estudiante, DPI, carnet o número de boleta.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="border rounded-md max-h-96 overflow-y-auto">
                      <div className="bg-muted/50 p-2 text-xs font-medium border-b">
                        {sugerencias.length} pagos encontrados - ordenados por similitud
                      </div>
                      {sugerencias.map((s, index) => (
                        <div
                          key={s.id}
                          className={`px-3 py-3 border-b last:border-b-0 hover:bg-muted/50 ${
                            s.match_percentage >= 80 ? "bg-green-50/50" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1">
                              <div className="text-sm font-medium flex items-center gap-2">
                                {s.prospecto?.nombre || "Sin nombre"} 
                                <span className="text-muted-foreground text-xs">({s.prospecto?.carnet || "-"})</span>
                                {index === 0 && s.match_percentage >= 80 && (
                                  <Badge variant="default" className="bg-green-600 text-xs">
                                    Recomendado
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Boleta: {s.numero_boleta || "-"} | Banco: {s.banco || "-"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Q {Number(s.monto_pagado || 0).toFixed(2)} | {formatDate(s.fecha_pago)}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge
                                variant={
                                  s.match_percentage >= 80
                                    ? "default"
                                    : s.match_percentage >= 50
                                    ? "secondary"
                                    : "outline"
                                }
                                className={
                                  s.match_percentage >= 80
                                    ? "bg-green-600 text-white font-bold"
                                    : s.match_percentage >= 50
                                    ? "bg-amber-500 text-white"
                                    : ""
                                }
                              >
                                {s.match_percentage}%
                              </Badge>
                              <Button
                                size="sm"
                                onClick={() => handleVincularPago(s.id)}
                                disabled={vinculando}
                                variant={s.match_percentage >= 80 ? "default" : "outline"}
                                className={s.match_percentage >= 80 ? "bg-green-600 hover:bg-green-700" : ""}
                              >
                                {vinculando ? <Loader2 className="h-3 w-3 animate-spin" /> : (
                                  <>
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Vincular
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Comparación visual */}
                          <div className="mt-2 grid grid-cols-2 gap-3 text-xs border-t pt-2 bg-white/50 rounded p-2">
                            <div className="space-y-1">
                              <p className="font-semibold text-blue-700 flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                Conciliación Bancaria
                              </p>
                              <p><span className="text-muted-foreground">Ref:</span> {selectedConciliacion.reference || "-"}</p>
                              <p><span className="text-muted-foreground">Monto:</span> Q {Number(selectedConciliacion.amount).toFixed(2)}</p>
                              <p><span className="text-muted-foreground">Fecha:</span> {formatDate(selectedConciliacion.date)}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="font-semibold text-green-700 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Pago en Kardex
                              </p>
                              <p><span className="text-muted-foreground">Boleta:</span> {s.numero_boleta || "-"}</p>
                              <p><span className="text-muted-foreground">Monto:</span> Q {Number(s.monto_pagado || 0).toFixed(2)}</p>
                              <p><span className="text-muted-foreground">Fecha:</span> {formatDate(s.fecha_pago)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Esperando selección</AlertTitle>
                  <AlertDescription>
                    Seleccione una conciliación de la lista de la izquierda para buscar pagos correspondientes en el Kardex.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </TabsContent>

      {/* ⚠️ Pestaña de Conciliaciones Sin Conciliar */}
      <TabsContent value="sin_conciliar" className="space-y-6">
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900">Registros Importados Sin Vincular</AlertTitle>
          <AlertDescription className="text-amber-800">
            Estos registros tienen <strong>prospecto_id = null</strong> — fueron importados del banco pero aún no se han relacionado con ningún estudiante en el Kardex.
            Use el botón <strong>Vincular</strong> para asignarlos.
          </AlertDescription>
        </Alert>

        {/* Filtros */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por banco, referencia, monto…"
                className="pl-9"
                value={searchSinconciliar}
                onChange={(e) => setSearchSinconciliar(e.target.value)}
              />
            </div>
            <Select value={filterBankSinconciliar} onValueChange={setFilterBankSinconciliar}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Todos los bancos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los bancos</SelectItem>
                {uniqueBanksSinconciliar.map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadSinconciliar} disabled={loadingSinconciliar}>
              {loadingSinconciliar ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              Actualizar
            </Button>
          </div>

          {/* Filtros de fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Fecha desde</label>
              <Input
                type="date"
                value={filterDateFromSinconciliar}
                onChange={(e) => setFilterDateFromSinconciliar(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Fecha hasta (corte)</label>
              <Input
                type="date"
                value={filterDateToSinconciliar}
                onChange={(e) => setFilterDateToSinconciliar(e.target.value)}
              />
            </div>
            {(filterDateFromSinconciliar || filterDateToSinconciliar || filterBankSinconciliar !== "todos" || searchSinconciliar) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground self-end"
                onClick={() => {
                  setFilterDateFromSinconciliar("")
                  setFilterDateToSinconciliar("")
                  setFilterBankSinconciliar("todos")
                  setSearchSinconciliar("")
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>

        {loadingSinconciliar ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-lg">
            <Loader2 className="h-12 w-12 text-muted-foreground mb-4 opacity-20 animate-spin" />
            <h4 className="font-medium">Cargando registros sin conciliar…</h4>
          </div>
        ) : filteredSinconciliar.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-lg">
            <CheckCircle2 className="h-12 w-12 text-green-400 mb-4 opacity-60" />
            <h4 className="font-medium">Sin registros pendientes</h4>
            <p className="text-sm text-muted-foreground">
              {searchSinconciliar || filterBankSinconciliar !== "todos" || filterDateFromSinconciliar || filterDateToSinconciliar
                ? "No hay coincidencias con los filtros aplicados."
                : "¡Todos los registros importados ya están vinculados!"}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <div className="bg-amber-50/50 px-4 py-2 border-b flex items-center justify-between">
              <span className="text-sm font-medium text-amber-900">
                {filteredSinconciliar.length} registro{filteredSinconciliar.length !== 1 ? "s" : ""} sin vincular
              </span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSinconciliar.map((c) => (
                  <TableRow key={c.id} className="bg-amber-50/20 hover:bg-amber-50/50">
                    <TableCell className="text-sm">{formatDate(c.date)}</TableCell>
                    <TableCell className="font-medium">{c.bank || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{c.reference || '-'}</TableCell>
                    <TableCell className="font-semibold">Q {Number(c.amount || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      {c.prospecto ? (
                        <div>
                          <div className="text-sm">{(c.prospecto as any).nombre_completo || c.prospecto.nombre}</div>
                          <div className="text-xs text-muted-foreground">{c.prospecto.carnet}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-600 italic font-medium">Sin identificar</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-amber-700 border-amber-400 bg-amber-50 capitalize">
                        {c.status || 'imported'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => openVinculacionModalWithRecord(c as any)}
                      >
                        <LinkIcon className="h-3 w-3 mr-1" />
                        Vincular
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      <TabsContent value="revision_manual" className="space-y-6">
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-900">Conciliaciones para Revisión Manual</AlertTitle>
          <AlertDescription className="text-red-800">
            Registros con posibles diferencias o sin prospecto identificado que tienen un match probable en Kardex.
            Revise y use <strong>Vincular</strong> para conciliarlos manualmente.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por banco, referencia, monto o #matches..."
              className="pl-9"
              value={searchManualReview}
              onChange={(e) => setSearchManualReview(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => loadManualReview(searchManualReview)} disabled={loadingManualReview}>
            {loadingManualReview ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            Actualizar
          </Button>
        </div>

        {loadingManualReview ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-lg">
            <Loader2 className="h-12 w-12 text-muted-foreground mb-4 opacity-20 animate-spin" />
            <h4 className="font-medium">Cargando revisión manual…</h4>
          </div>
        ) : filteredManualReview.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-lg">
            <CheckCircle2 className="h-12 w-12 text-green-400 mb-4 opacity-60" />
            <h4 className="font-medium">Sin registros para revisión manual</h4>
          </div>
        ) : (
          <div className="rounded-md border">
            <div className="bg-red-50/50 px-4 py-2 border-b flex items-center justify-between">
              <span className="text-sm font-medium text-red-900">
                {filteredManualReview.length} registro{filteredManualReview.length !== 1 ? "s" : ""} con match probable
              </span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Matches Kardex</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredManualReview.map((c) => (
                  <TableRow key={c.id} className="bg-red-50/20 hover:bg-red-50/50">
                    <TableCell className="text-sm">{formatDate(c.date)}</TableCell>
                    <TableCell className="font-medium">{c.bank || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{c.reference || '-'}</TableCell>
                    <TableCell className="font-semibold">Q {Number(c.amount || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50 capitalize">
                        {c.status || 'imported'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">
                        {c.match_count} candidato{c.match_count !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => openVinculacionModalWithRecord(c as any)}
                      >
                        <LinkIcon className="h-3 w-3 mr-1" />
                        Vincular
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      {/* 📜 Pestaña de Historial */}
      <TabsContent value="historial" className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar en historial (usuario, conciliación, kardex, prospecto)..." 
              className="pl-9"
              value={searchHistorial}
              onChange={(e) => setSearchHistorial(e.target.value)}
            />
          </div>
          <Button onClick={loadHistorial} variant="outline" disabled={loadingHistorial}>
            {loadingHistorial ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <History className="h-4 w-4 mr-2" />}
            Actualizar
          </Button>
        </div>

        {loadingHistorial ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-lg">
            <Loader2 className="h-12 w-12 text-muted-foreground mb-4 opacity-20 animate-spin" />
            <h4 className="font-medium">Cargando historial...</h4>
            <p className="text-sm text-muted-foreground">Obteniendo registros de auditoría.</p>
          </div>
        ) : filteredHistorial.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha/Hora</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Conciliación</TableHead>
                  <TableHead>Kardex</TableHead>
                  <TableHead>Prospecto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistorial.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {h.fecha}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={h.action === 'vinculado' ? 'default' : h.action === 'desvinculado' ? 'destructive' : 'outline'}
                        className="capitalize"
                      >
                        {h.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {h.usuario ? (
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{h.usuario.nombre}</div>
                            <div className="text-xs text-muted-foreground">{h.usuario.email}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Sistema</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {h.conciliacion ? (
                        <div>
                          <div className="font-medium">#{h.conciliacion.id} - {h.conciliacion.referencia || '-'}</div>
                          <div className="text-muted-foreground">{h.conciliacion.banco} | Q{Number(h.conciliacion.monto).toFixed(2)}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {h.kardex ? (
                        <div>
                          <div className="font-medium">Kardex #{h.kardex.id}</div>
                          <div className="text-muted-foreground">Boleta: {h.kardex.numero_boleta || '-'}</div>
                          <div className="text-muted-foreground">Q{Number(h.kardex.monto).toFixed(2)}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {h.prospecto ? (
                        <div>
                          <div className="font-medium">{h.prospecto.nombre}</div>
                          <div className="text-xs text-muted-foreground">{h.prospecto.carnet || 'Sin carnet'}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="space-y-1">
                        {h.status_anterior && (
                          <Badge variant="outline" className="text-xs">
                            {h.status_anterior}
                          </Badge>
                        )}
                        <div className="text-muted-foreground">→</div>
                        {h.status_nuevo && (
                          <Badge variant="secondary" className="text-xs">
                            {h.status_nuevo}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-lg">
            <History className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h4 className="font-medium">Sin historial</h4>
            <p className="text-sm text-muted-foreground">
              No hay registros de auditoría o no hay coincidencias con el filtro.
            </p>
          </div>
        )}
      </TabsContent>

      {/* 📜 Pestaña de Kardex sin Conciliar */}
      <TabsContent value="kardex_pendientes" className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Fecha Pago (Específica)</label>
              <Input 
                type="date"
                value={filterDateKardex}
                onChange={(e) => setFilterDateKardex(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Fecha de Corte (Hasta)</label>
              <Input 
                type="date"
                value={filterCutoffDateKardex}
                onChange={(e) => setFilterCutoffDateKardex(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Banco</label>
              <Select value={filterBankKardex} onValueChange={setFilterBankKardex}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los bancos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los bancos</SelectItem>
                  {uniqueBanksKardex.map(banco => (
                    <SelectItem key={banco} value={banco}>{banco}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Boleta</label>
              <Input 
                placeholder="Buscar por boleta..." 
                value={filterBoletaKardex}
                onChange={(e) => setFilterBoletaKardex(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Monto</label>
              <Input 
                placeholder="Buscar por monto..." 
                value={filterMontoKardex}
                onChange={(e) => setFilterMontoKardex(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Alumno / Carnet</label>
              <Input 
                placeholder="Buscar alumno..." 
                value={filterAlumnoKardex}
                onChange={(e) => setFilterAlumnoKardex(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setFilterBankKardex("todos")
                setFilterDateKardex("")
                setFilterCutoffDateKardex("")
                setFilterBoletaKardex("")
                setFilterMontoKardex("")
                setFilterAlumnoKardex("")
              }}
            >
              Limpiar Filtros
            </Button>
            <Button onClick={loadKardexPendientesTab} variant="outline" disabled={loadingKardexPendientes}>
              {loadingKardexPendientes ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Database className="h-4 w-4 mr-2" />}
              Actualizar
            </Button>
          </div>
        </div>

        {loadingKardexPendientes ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-lg">
            <Loader2 className="h-12 w-12 text-muted-foreground mb-4 opacity-20 animate-spin" />
            <h4 className="font-medium">Cargando Kardex sin conciliar...</h4>
            <p className="text-sm text-muted-foreground">Obteniendo registros del servidor.</p>
          </div>
        ) : filteredKardexPendientes.length > 0 ? (
          <div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando <strong>{((currentPageKardex - 1) * itemsPerPageKardex) + 1}</strong> a{" "}
                <strong>{Math.min(currentPageKardex * itemsPerPageKardex, filteredKardexPendientes.length)}</strong> de{" "}
                <strong>{filteredKardexPendientes.length}</strong> pagos del Kardex
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Mostrar:</span>
                <Select value={String(itemsPerPageKardex)} onValueChange={(v) => {
                  setItemsPerPageKardex(Number(v))
                  setCurrentPageKardex(1)
                }}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="rounded-md border mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha Pago</TableHead>
                    <TableHead>Boleta</TableHead>
                    <TableHead>Banco</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Alumno</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedKardex.map((k) => (
                    <TableRow key={k.kardex_id}>
                      <TableCell className="text-sm">{k.input?.fechaPago ? formatDate(k.input.fechaPago) : '-'}</TableCell>
                      <TableCell className="font-mono text-xs">{k.input?.recibo || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{k.input?.banco || '-'}</TableCell>
                      <TableCell className="font-medium">Q {Number(k.input?.monto || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{k.input?.alumno || 'Sin nombre'}</div>
                          <div className="text-xs text-muted-foreground">{k.input?.carnet || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                          onClick={() => handleActionKardex(k)}
                        >
                          <LinkIcon className="h-3 w-3 mr-1" />
                          Crear / Vincular
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Controles de paginación Kardex */}
            {filteredKardexPendientes.length > 0 && totalPagesKardex > 1 && (
              <div className="flex items-center justify-between border-t pt-4 mt-4">
                <div className="text-sm text-muted-foreground">
                  Página <strong>{currentPageKardex}</strong> de <strong>{totalPagesKardex}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPageKardex(1)}
                    disabled={currentPageKardex === 1}
                    title="Primera página"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPageKardex(currentPageKardex - 1)}
                    disabled={currentPageKardex === 1}
                    title="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={1}
                      max={totalPagesKardex}
                      value={currentPageKardex}
                      onChange={(e) => {
                        const page = Number(e.target.value)
                        if (page >= 1 && page <= totalPagesKardex) {
                          goToPageKardex(page)
                        }
                      }}
                      className="w-16 h-8 text-center"
                    />
                    <span className="text-sm text-muted-foreground">de {totalPagesKardex}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPageKardex(currentPageKardex + 1)}
                    disabled={currentPageKardex === totalPagesKardex}
                    title="Página siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPageKardex(totalPagesKardex)}
                    disabled={currentPageKardex === totalPagesKardex}
                    title="Última página"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-lg">
            <Database className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h4 className="font-medium">Sin registros</h4>
            <p className="text-sm text-muted-foreground">
              No hay pagos en Kardex pendientes de conciliar o no hay coincidencias con el filtro.
            </p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}

export default PaymentReconciliation