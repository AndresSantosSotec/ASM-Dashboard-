"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  Eye,
  EyeOff,
  AlertCircle,
  Search,
  Download,
  RefreshCw,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Info,
  Link2,
  CheckCircle2,
  Loader2,
} from "lucide-react"

// Diálogo errores
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { buscarKardexParaVincular, vincularConciliacionManual } from "@/services/mantenimientos"

// ✅ services centralizados
  import {
    getKardexPendientes,
    getKardexConciliados,
    importConciliacion,
    downloadConciliacionTemplate,
    exportConciliacionXlsx,
    exportConciliados,
    exportPendientesParaImportacion,
    getFiltrosDisponibles,
  } from "@/services/finance"

/** ====== Tipos ====== */
type StructureItem = { id: number; name: string; column: number }

type ParsedRow = {
  carnet: string
  alumno: string
  carrera?: string
  banco: string
  recibo: string
  monto: number
  fechaPago?: string
  autorizacion?: string
}

type ReconcileStatus = "conciliado" | "monto_difiere" | "boleta_duplicada" | "sin_coincidencia" | "error"

type PreviewResultItem = {
  id?: number
  index: number
  input: ParsedRow
  status: ReconcileStatus
  kardex_id?: number
  cuota_id?: number
  expected_total?: number
  monto_recibido?: number
  difference?: number
  message?: string
  alumno_detectado?: string
  programa?: string
  numero_cuota?: number
  estado_cuota?: string
}

type PreviewResponse = {
  ok: boolean
  results: PreviewResultItem[]
  summary?: {
    conciliados: number
    monto_conciliado: number
    con_diferencia: number
    rechazados: number
    sin_coincidencia: number
  }
  message?: string
}

type ImportErrorDetail = { row: number; message: string }

/** ====== Helpers ====== */
const normalizeBank = (bank: string) => {
  const b = (bank || "").trim().toUpperCase()
  if (["BI", "BANCO INDUSTRIAL", "INDUSTRIAL"].includes(b)) return "BANCO INDUSTRIAL"
  if (["BANRURAL", "BAN RURAL", "RURAL"].includes(b)) return "BANRURAL"
  if (["BAM", "BANCO AGROMERCANTIL"].includes(b)) return "BAM"
  if (["G&T", "G Y T", "GYT", "G&T CONTINENTAL"].includes(b)) return "G&T CONTINENTAL"
  if (["PROMERICA"].includes(b)) return "PROMERICA"
  return b
}

const formatQ = (n?: number) =>
  typeof n === "number" ? `Q${n.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"

const formatDate = (s?: string) => {
  if (!s) return "-"
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("es-GT")
}
const classNames = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(" ")

/** Paginación local */
function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), pages)
  const start = (safePage - 1) * pageSize
  const end = Math.min(start + pageSize, total)
  return { page: safePage, pages, total, slice: items.slice(start, end), start: start + 1, end }
}

/** Debounce hook para búsqueda */
function useDebouncedValue<T>(value: T, delay = 350) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

/** ====== Componente ====== */
export default function ConciliacionClient() {
  const [activeTab, setActiveTab] = useState<"pendientes" | "conciliados" | "importar">("pendientes")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState("Sin archivos seleccionados")
  const [showStructure, setShowStructure] = useState(false)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)

  // Resumen del último import
  const [importSummary, setImportSummary] = useState<null | {
    created: number
    updated: number
    skipped: number
    errors: number
  }>(null)

  const [importErrors, setImportErrors] = useState<ImportErrorDetail[] | null>(null)
  const [showErrorsDialog, setShowErrorsDialog] = useState(false)

  // filtros
  const [bankFilter, setBankFilter] = useState<string>("todos")
  const [programaFilter, setProgramaFilter] = useState<string>("todos")
  const [searchAlumno, setSearchAlumno] = useState<string>("")
  const [searchCarnet, setSearchCarnet] = useState<string>("")
  const [searchReferencia, setSearchReferencia] = useState<string>("")
  const debouncedAlumno = useDebouncedValue(searchAlumno, 350)
  const debouncedCarnet = useDebouncedValue(searchCarnet, 350)
  const debouncedReferencia = useDebouncedValue(searchReferencia, 350)
  const [fromDate, setFromDate] = useState<string>("") // YYYY-MM-DD
  const [toDate, setToDate] = useState<string>("") // YYYY-MM-DD
  
  // 🆕 Lista de bancos y programas disponibles
  const [bancosDisponibles, setBancosDisponibles] = useState<string[]>([])
  const [programasDisponibles, setProgramasDisponibles] = useState<Array<{id: number; nombre: string; abreviatura: string}>>([])

  const [expectedStructure] = useState<StructureItem[]>([
    { id: 1, name: "Fecha", column: 1 },
    { id: 2, name: "Tipo de Transacción", column: 2 },
    { id: 3, name: "Descripción", column: 3 },
    { id: 4, name: "No. Doc", column: 4 },
    { id: 5, name: "Debe", column: 5 },
    { id: 6, name: "Haber", column: 6 },
    { id: 7, name: "Banco", column: 7 },
  ])

  const [previewPendientes, setPreviewPendientes] = useState<PreviewResponse | null>(null)
  const [previewConciliados, setPreviewConciliados] = useState<PreviewResponse | null>(null)
  const [showVincularDialog, setShowVincularDialog] = useState(false)
  const [vincularTarget, setVincularTarget] = useState<PreviewResultItem | null>(null)
  const [vincularSearch, setVincularSearch] = useState("")
  const [vincularLoading, setVincularLoading] = useState(false)
  const [vinculando, setVinculando] = useState(false)
  const [vincularSugerencias, setVincularSugerencias] = useState<Array<{
    id: number
    match_percentage: number
    numero_boleta: string | null
    banco: string | null
    monto_pagado: number
    fecha_pago: string | null
    estado_pago: string | null
    prospecto?: { nombre?: string; carnet?: string } | null
    programa?: { nombre?: string } | null
  }>>([])

  // ====== Estados de paginación (separados por tab) ======
  const [pagePend, setPagePend] = useState(1)
  const [pageSizePend, setPageSizePend] = useState(25)
  const [pageConc, setPageConc] = useState(1)
  const [pageSizeConc, setPageSizeConc] = useState(25)
  
  // 🚀 Estados de paginación del servidor
  const [paginationPend, setPaginationPend] = useState<{
    current_page: number
    per_page: number
    total: number
    total_pages: number
    from: number
    to: number
  } | null>(null)
  const [paginationConc, setPaginationConc] = useState<{
    current_page: number
    per_page: number
    total: number
    total_pages: number
    from: number
    to: number
  } | null>(null)
  
  // 🚀 Lazy loading: solo cargar tabs cuando se activan
  const [tabsLoaded, setTabsLoaded] = useState<Set<string>>(new Set())

  // 🆕 Cargar filtros disponibles al montar
  useEffect(() => {
    getFiltrosDisponibles()
      .then((data) => {
        if (data?.ok) {
          setBancosDisponibles(data.bancos || [])
          setProgramasDisponibles(data.programas || [])
        }
      })
      .catch((err) => {
        console.error("Error cargando filtros disponibles:", err)
      })
  }, [])

  // Reset de página al cambiar filtros o búsqueda
  useEffect(() => {
    setPagePend(1)
    setPageConc(1)
  }, [debouncedAlumno, debouncedCarnet, debouncedReferencia, bankFilter, programaFilter, fromDate, toDate])

  // ====== Cargar PENDIENTES desde Kardex (backend) - 🚀 CON PAGINACIÓN DEL SERVIDOR ======
  const loadPendientesFromKardex = async () => {
    try {
      setLoading(true)
      setErrorMsg(null)
      const data = await getKardexPendientes({
        from: fromDate || undefined,
        to: toDate || undefined,
        banco: bankFilter === "todos" ? undefined : bankFilter,
        programa_id: programaFilter === "todos" ? undefined : Number(programaFilter),
        page: pagePend,
        per_page: pageSizePend,
        search_alumno: debouncedAlumno.trim() || undefined,
        search_carnet: debouncedCarnet.trim() || undefined,
        search_referencia: debouncedReferencia.trim() || undefined,
      })
      setPreviewPendientes(data)
      if (data.pagination) {
        setPaginationPend(data.pagination)
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "No se pudo cargar la información de pendientes.")
    } finally {
      setLoading(false)
    }
  }

  // Cargar CONCILIADOS desde Kardex - 🚀 CON PAGINACIÓN DEL SERVIDOR
  const loadConciliadosFromKardex = async () => {
    try {
      setLoading(true)
      setErrorMsg(null)
      const data = await getKardexConciliados({
        from: fromDate || undefined,
        to: toDate || undefined,
        banco: bankFilter === "todos" ? undefined : bankFilter,
        programa_id: programaFilter === "todos" ? undefined : Number(programaFilter),
        page: pageConc,
        per_page: pageSizeConc,
        search_alumno: debouncedAlumno.trim() || undefined,
        search_carnet: debouncedCarnet.trim() || undefined,
        search_referencia: debouncedReferencia.trim() || undefined,
      })
      setPreviewConciliados(data)
      if (data.pagination) {
        setPaginationConc(data.pagination)
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "No se pudo cargar la información de conciliados.")
    } finally {
      setLoading(false)
    }
  }

  // 🚀 LAZY LOADING: Carga automática por tab (solo cuando se activa)
  useEffect(() => {
    // Solo cargar si el tab está activo y no se ha cargado antes
    if (activeTab === "pendientes" && !tabsLoaded.has("pendientes")) {
      setTabsLoaded((prev) => new Set(prev).add("pendientes"))
      loadPendientesFromKardex()
    } else if (activeTab === "conciliados" && !tabsLoaded.has("conciliados")) {
      setTabsLoaded((prev) => new Set(prev).add("conciliados"))
      loadConciliadosFromKardex()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // 🚀 Cargar datos cuando cambian los parámetros de paginación (solo si el tab está cargado)
  useEffect(() => {
    if (activeTab === "pendientes" && tabsLoaded.has("pendientes")) {
      loadPendientesFromKardex()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagePend, pageSizePend])

  useEffect(() => {
    if (activeTab === "conciliados" && tabsLoaded.has("conciliados")) {
      loadConciliadosFromKardex()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageConc, pageSizeConc])

  // Recarga automática al cambiar filtros (solo si el tab está cargado)
  useEffect(() => {
    if (activeTab === "pendientes" && tabsLoaded.has("pendientes")) {
      setPagePend(1) // Reset a página 1
      loadPendientesFromKardex()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, bankFilter, programaFilter, debouncedAlumno, debouncedCarnet, debouncedReferencia])

  useEffect(() => {
    if (activeTab === "conciliados" && tabsLoaded.has("conciliados")) {
      setPageConc(1) // Reset a página 1
      loadConciliadosFromKardex()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, bankFilter, programaFilter, debouncedAlumno, debouncedCarnet, debouncedReferencia])

  // ===== Handlers =====
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      setFileName(file.name)
    }
  }

  const handleDownloadTemplate = async () => {
    if (downloadingTemplate) return // Evitar múltiples clicks
    
    try {
      setDownloadingTemplate(true)
      setErrorMsg(null)
      
      const blob = await downloadConciliacionTemplate()
      
      if (!blob || blob.size === 0) {
        throw new Error("El archivo descargado está vacío")
      }
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "plantilla_conciliacion.xlsx"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error("Error descargando plantilla:", error)
      setErrorMsg(error?.message || "No se pudo descargar la plantilla. Verifica tu conexión e intenta nuevamente.")
    } finally {
      setDownloadingTemplate(false)
    }
  }

  const handleExportXlsx = async () => {
    try {
      const blob = await exportConciliacionXlsx({
        from: fromDate || undefined,
        to: toDate || undefined,
        bank: bankFilter === "todos" ? undefined : bankFilter,
        programa_id: programaFilter === "todos" ? undefined : Number(programaFilter),
      })
      const url = URL.createObjectURL(new Blob([blob]))
      const a = document.createElement("a")
      a.href = url
      a.download = "reconciliation_records.xlsx"
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert("No se pudo exportar el XLSX.")
    }
  }

  const handleRefresh = () => {
    if (activeTab === "pendientes") {
      loadPendientesFromKardex()
    } else if (activeTab === "conciliados") {
      loadConciliadosFromKardex()
    }
  }

  const abrirVinculacionManual = async (item: PreviewResultItem) => {
    if (!item.id) {
      setErrorMsg("Este registro no tiene ID de conciliación para vincular manualmente.")
      return
    }

    setVincularTarget(item)
    setVincularSearch("")
    setVincularSugerencias([])
    setShowVincularDialog(true)

    try {
      setVincularLoading(true)
      const res = await buscarKardexParaVincular(item.id)
      setVincularSugerencias(res.sugerencias || [])
    } catch (err: any) {
      setErrorMsg(err?.message || "No se pudieron cargar sugerencias de Kardex.")
    } finally {
      setVincularLoading(false)
    }
  }

  const buscarSugerenciasVinculacion = async () => {
    if (!vincularTarget?.id) return
    try {
      setVincularLoading(true)
      const res = await buscarKardexParaVincular(vincularTarget.id, vincularSearch)
      setVincularSugerencias(res.sugerencias || [])
    } catch (err: any) {
      setErrorMsg(err?.message || "No se pudieron buscar sugerencias.")
    } finally {
      setVincularLoading(false)
    }
  }

  const ejecutarVinculacionManual = async (kardexPagoId: number) => {
    if (!vincularTarget?.id) return

    try {
      setVinculando(true)
      await vincularConciliacionManual(vincularTarget.id, kardexPagoId)
      setShowVincularDialog(false)
      await loadConciliadosFromKardex()
    } catch (err: any) {
      setErrorMsg(err?.message || "No se pudo vincular la conciliación con Kardex.")
    } finally {
      setVinculando(false)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return
    try {
      setLoading(true)
      setErrorMsg(null)
      setImportSummary(null)
      setImportErrors(null)
      setShowErrorsDialog(false)

      const res = await importConciliacion(selectedFile)
      if (res?.summary) {
        const { created = 0, updated = 0, skipped = 0, errors = 0 } = res.summary
        setImportSummary({ created, updated, skipped, errors })
      }

      if (Array.isArray(res?.details) && res.details.length) {
        setImportErrors(res.details as ImportErrorDetail[])
        setShowErrorsDialog(true)
      }

      await Promise.all([loadPendientesFromKardex(), loadConciliadosFromKardex()])
      setActiveTab("conciliados")
    } catch (e: any) {
      setErrorMsg(e?.message || "No se pudo importar el archivo.")
    } finally {
      setLoading(false)
    }
  }

  /** ===== Filtros + búsqueda ===== */
  const matchesSearches = (r: PreviewResultItem) => {
    const alumno = (r.alumno_detectado || r.input.alumno || "").toLowerCase()
    const carnet = (r.input.carnet || "").toLowerCase()
    const recibo = (r.input.recibo || "").toLowerCase()
    if (debouncedAlumno.trim() && !alumno.includes(debouncedAlumno.toLowerCase().trim())) return false
    if (debouncedCarnet.trim() && !carnet.includes(debouncedCarnet.toLowerCase().trim())) return false
    if (debouncedReferencia.trim() && !recibo.includes(debouncedReferencia.toLowerCase().trim())) return false
    return true
  }

  const filterByCommon = (list: PreviewResultItem[]) => {
    const byBank =
      bankFilter === "todos" ? list : list.filter((r) => normalizeBank(r.input.banco) === normalizeBank(bankFilter))
    return byBank.filter(matchesSearches)
  }

  // 🚀 OPTIMIZACIÓN: Los resultados ya vienen paginados del servidor
  // Solo aplicar búsqueda local si es necesario
  const filteredPendientes = useMemo(() => {
    const list = previewPendientes?.results ?? []
    const noLocal = !debouncedAlumno.trim() && !debouncedCarnet.trim() && !debouncedReferencia.trim()
    if (noLocal) return list
    return list.filter(matchesSearches)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewPendientes, debouncedAlumno, debouncedCarnet, debouncedReferencia])

  const filteredConciliados = useMemo(() => {
    const list = previewConciliados?.results ?? []
    const noLocal = !debouncedAlumno.trim() && !debouncedCarnet.trim() && !debouncedReferencia.trim()
    if (noLocal) return list
    return list.filter(matchesSearches)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewConciliados, debouncedAlumno, debouncedCarnet, debouncedReferencia])

  /** ===== Paginación aplicada - 🚀 USANDO PAGINACIÓN DEL SERVIDOR ===== */
  const pendPage = useMemo(() => {
    const filtered = filteredPendientes
    return {
      page: paginationPend?.current_page ?? pagePend,
      pages: paginationPend?.total_pages ?? 1,
      total: paginationPend?.total ?? filtered.length,
      slice: filtered, // Ya viene paginado del servidor, solo aplicar búsqueda local
      start: paginationPend?.from ?? 1,
      end: paginationPend?.to ?? filtered.length,
    }
  }, [filteredPendientes, paginationPend, pagePend])
  
  const concPage = useMemo(() => {
    const filtered = filteredConciliados
    return {
      page: paginationConc?.current_page ?? pageConc,
      pages: paginationConc?.total_pages ?? 1,
      total: paginationConc?.total ?? filtered.length,
      slice: filtered, // Ya viene paginado del servidor, solo aplicar búsqueda local
      start: paginationConc?.from ?? 1,
      end: paginationConc?.to ?? filtered.length,
    }
  }, [filteredConciliados, paginationConc, pageConc])

  // Esqueletos de carga
  const SkeletonRows = ({ cols = 8, rows = 8 }: { cols?: number; rows?: number }) => (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={`sk-${i}`}>
          {Array.from({ length: cols }).map((__, j) => (
            <TableCell key={`sk-${i}-${j}`}>
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )

  /** ===== UI Reusables ===== */
  const ToolbarFilters = (
    <>
      <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-[150px]" />
      <span className="text-sm text-muted-foreground">a</span>
      <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-[150px]" />
      <Select value={bankFilter} onValueChange={setBankFilter}>
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Filtrar por banco" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos los bancos</SelectItem>
          {bancosDisponibles.map((banco) => (
            <SelectItem key={banco} value={banco}>{banco}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={programaFilter} onValueChange={setProgramaFilter}>
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Filtrar por programa" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos los programas</SelectItem>
          {programasDisponibles.map((programa) => (
            <SelectItem key={programa.id} value={String(programa.id)}>{programa.nombre}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* <Button variant="outline" size="sm" onClick={handleExportXlsx} disabled={loading}>
        <Download className="mr-2 h-4 w-4" />
        Exportar XLSX
      </Button> */}
      <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
        <RefreshCw className={classNames("mr-2 h-4 w-4", loading && "animate-spin")} />
        Refrescar
      </Button>
    </>
  )

  const SearchBox = (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Alumno (nombre)"
          className="pl-8"
          value={searchAlumno}
          onChange={(e) => setSearchAlumno(e.target.value)}
        />
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Carnet"
          className="pl-8"
          value={searchCarnet}
          onChange={(e) => setSearchCarnet(e.target.value)}
        />
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Referencia / No. boleta"
          className="pl-8"
          value={searchReferencia}
          onChange={(e) => setSearchReferencia(e.target.value)}
        />
      </div>
    </div>
  )

  const SummaryChips = (data?: PreviewResponse | null) => {
    if (!data?.summary) return null
    const s = data.summary
    return (
      <div className="flex flex-wrap gap-2">
        <div className="rounded-full border px-3 py-1 text-xs bg-background">Conciliados: <b>{s.conciliados}</b></div>
        <div className="rounded-full border px-3 py-1 text-xs bg-background">Monto conciliado: <b>{formatQ(s.monto_conciliado)}</b></div>
        <div className="rounded-full border px-3 py-1 text-xs bg-background">Con diferencia: <b>{s.con_diferencia}</b></div>
        <div className="rounded-full border px-3 py-1 text-xs bg-background">Sin coincidencia: <b>{s.sin_coincidencia}</b></div>
        <div className="rounded-full border px-3 py-1 text-xs bg-background">Rechazados: <b>{s.rechazados}</b></div>
      </div>
    )
  }

  const PaginationBar = ({
    page,
    pages,
    total,
    start,
    end,
    pageSize,
    onChangePage,
    onChangePageSize,
  }: {
    page: number
    pages: number
    total: number
    start: number
    end: number
    pageSize: number
    onChangePage: (p: number) => void
    onChangePageSize: (s: number) => void
  }) => {
    const inputRef = useRef<HTMLInputElement | null>(null)

    const goto = () => {
      const raw = inputRef.current?.value || ""
      const n = Number(raw)
      if (!Number.isFinite(n)) return
      onChangePage(Math.max(1, Math.min(pages, Math.floor(n))))
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-t bg-muted/30 rounded-b-xl">
        <div className="text-xs text-muted-foreground">
          Mostrando <b>{start}</b>–<b>{end}</b> de <b>{total}</b>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="pageSize" className="text-xs">Filas por página</Label>
          <Select value={String(pageSize)} onValueChange={(v) => onChangePageSize(Number(v))}>
            <SelectTrigger className="h-8 w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => onChangePage(1)} disabled={page <= 1}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onChangePage(page - 1)} disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-2 text-xs">
              Página <b>{page}</b> de <b>{pages}</b>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onChangePage(page + 1)} disabled={page >= pages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onChangePage(pages)} disabled={page >= pages}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <Label htmlFor="goto" className="text-xs">Ir a</Label>
            <Input
              ref={inputRef}
              id="goto"
              type="number"
              min={1}
              max={pages}
              className="h-8 w-[80px]"
              placeholder="pág."
              onKeyDown={(e) => e.key === "Enter" && goto()}
            />
            <Button variant="outline" size="sm" onClick={goto}>Ir</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header mejorado */}
      <div className="mb-6 rounded-2xl p-5 border bg-gradient-to-br from-background to-muted/40">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Conciliación de Pagos</h1>
            <p className="text-sm text-muted-foreground">
              Revisa, concilia y exporta pagos desde estados bancarios y Kardex.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="default" size="sm" asChild>
              <Link href="/finanzas/Tareas?tab=reconciliation">
                <Link2 className="mr-2 h-4 w-4" />
                Vincular Conciliación Manual
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio
              </Link>
            </Button>
          </div>
        </div>
        <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
          <Info className="h-3.5 w-3.5" />
          <span>Consejo: usa la búsqueda para filtrar por alumno, carnet o referencia.</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid grid-cols-3 w-full sm:w-[700px] rounded-xl">
          <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
          <TabsTrigger value="conciliados">Conciliados</TabsTrigger>
          <TabsTrigger value="importar">Importar Estados de cuenta</TabsTrigger>
        </TabsList>

        {/* Pendientes */}
        <TabsContent value="pendientes">
          <Card className="rounded-2xl overflow-hidden shadow-sm">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Registros por revisar</CardTitle>
                <CardDescription>Pagos del Kardex que requieren acción.</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Botón exportar pendientes en formato importación */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      setLoading(true)
                      const blob = await exportPendientesParaImportacion('excel', {
                        from: fromDate || undefined,
                        to: toDate || undefined,
                        banco: bankFilter === "todos" ? undefined : bankFilter,
                        programa_id: programaFilter === "todos" ? undefined : Number(programaFilter),
                      })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `pendientes_para_importar_${new Date().toISOString().split('T')[0]}.xlsx`
                      a.click()
                      URL.revokeObjectURL(url)
                    } catch (err: any) {
                      setErrorMsg(err?.message || "Error al exportar pendientes")
                    } finally {
                      setLoading(false)
                    }
                  }}
                  disabled={loading || !previewPendientes?.results?.length}
                  title="Exportar en formato compatible con importación bancaria (Banco, Referencia, Monto, Fecha)"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-1" />
                  Exportar p/Importar
                </Button>
                {ToolbarFilters}
              </div>
            </CardHeader>
            <CardContent className="pb-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                {SearchBox}
                {SummaryChips(previewPendientes)}
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 text-sm rounded-md border border-red-200 bg-red-50 text-red-700">
                  {errorMsg}
                </div>
              )}

              <div className="rounded-xl border overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow className="hover:bg-transparent">
                      <TableHead>#</TableHead>
                      <TableHead>Alumno</TableHead>
                      <TableHead>Carnet</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead>Referencia/Boleta</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="[&>tr:nth-child(even)]:bg-muted/20">
                    {loading ? (
                      <SkeletonRows cols={8} rows={8} />
                    ) : pendPage.total ? (
                      pendPage.slice.map((item) => (
                        <TableRow key={item.index} className="transition-colors">
                          <TableCell>{item.index}</TableCell>
                          <TableCell className="font-medium">{item.input.alumno}</TableCell>
                          <TableCell>{item.input.carnet}</TableCell>
                          <TableCell>{normalizeBank(item.input.banco)}</TableCell>
                          <TableCell className="font-mono">{item.input.recibo}</TableCell>
                          <TableCell className="text-right">{formatQ(item.input.monto)}</TableCell>
                          <TableCell>{formatDate(item.input.fechaPago)}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={classNames(
                                "capitalize",
                                item.status === "monto_difiere" && "bg-amber-50 text-amber-700 border-amber-200",
                                item.status === "sin_coincidencia" && "bg-slate-50 text-slate-700 border-slate-200",
                                item.status === "error" && "bg-red-50 text-red-700 border-red-200"
                              )}
                            >
                              {item.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-10">
                          {loading ? "Cargando..." : "Sin registros pendientes"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <PaginationBar
              page={pendPage.page}
              pages={pendPage.pages}
              total={pendPage.total}
              start={pendPage.start}
              end={pendPage.end}
              pageSize={pageSizePend}
              onChangePage={setPagePend}
              onChangePageSize={(n) => {
                setPageSizePend(n)
                setPagePend(1)
              }}
            />
          </Card>
        </TabsContent>

        {/* Conciliados */}
        <TabsContent value="conciliados">
          <Card className="rounded-2xl overflow-hidden shadow-sm">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Registros conciliados</CardTitle>
                <CardDescription>Pagos matcheados por referencia, monto y fecha.</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        setLoading(true)
                        const blob = await exportConciliados('excel', {
                          from: fromDate || undefined,
                          to: toDate || undefined,
                          banco: bankFilter === "todos" ? undefined : bankFilter,
                          programa_id: programaFilter === "todos" ? undefined : Number(programaFilter),
                        })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `conciliados_${new Date().toISOString().split('T')[0]}.xlsx`
                        a.click()
                        URL.revokeObjectURL(url)
                      } catch (err: any) {
                        setErrorMsg(err?.message || "Error al exportar Excel")
                      } finally {
                        setLoading(false)
                      }
                    }}
                    disabled={loading || !previewConciliados?.results?.length}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-1" />
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        setLoading(true)
                        const blob = await exportConciliados('pdf', {
                          from: fromDate || undefined,
                          to: toDate || undefined,
                          banco: bankFilter === "todos" ? undefined : bankFilter,
                          programa_id: programaFilter === "todos" ? undefined : Number(programaFilter),
                        })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `conciliados_${new Date().toISOString().split('T')[0]}.pdf`
                        a.click()
                        URL.revokeObjectURL(url)
                      } catch (err: any) {
                        setErrorMsg(err?.message || "Error al exportar PDF")
                      } finally {
                        setLoading(false)
                      }
                    }}
                    disabled={loading || !previewConciliados?.results?.length}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        setLoading(true)
                        const blob = await exportConciliados('csv', {
                          from: fromDate || undefined,
                          to: toDate || undefined,
                          banco: bankFilter === "todos" ? undefined : bankFilter,
                          programa_id: programaFilter === "todos" ? undefined : Number(programaFilter),
                        })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `conciliados_${new Date().toISOString().split('T')[0]}.csv`
                        a.click()
                        URL.revokeObjectURL(url)
                      } catch (err: any) {
                        setErrorMsg(err?.message || "Error al exportar CSV")
                      } finally {
                        setLoading(false)
                      }
                    }}
                    disabled={loading || !previewConciliados?.results?.length}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    CSV
                  </Button>
                </div>
                {ToolbarFilters}
              </div>
            </CardHeader>
            <CardContent className="pb-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                {SearchBox}
                {SummaryChips(previewConciliados)}
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 text-sm rounded-md border border-red-200 bg-red-50 text-red-700">
                  {errorMsg}
                </div>
              )}

              <div className="rounded-xl border overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow className="hover:bg-transparent">
                      <TableHead>#</TableHead>
                      <TableHead>Alumno</TableHead>
                      <TableHead>Carnet</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead>Referencia/Boleta</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Vinculación Kardex</TableHead>
                      <TableHead>Programa</TableHead>
                      <TableHead>Cuota #</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="[&>tr:nth-child(even)]:bg-muted/20">
                    {loading ? (
                      <SkeletonRows cols={12} rows={8} />
                    ) : concPage.total ? (
                      concPage.slice.map((item) => (
                        <TableRow key={item.index}>
                          <TableCell>{item.index}</TableCell>
                          <TableCell className="font-medium">
                            {item.alumno_detectado || item.input.alumno}
                          </TableCell>
                          <TableCell>{item.input.carnet}</TableCell>
                          <TableCell>{normalizeBank(item.input.banco)}</TableCell>
                          <TableCell className="font-mono">{item.input.recibo}</TableCell>
                          <TableCell className="text-right">{formatQ(item.input.monto)}</TableCell>
                          <TableCell>{formatDate(item.input.fechaPago)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              conciliado
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.kardex_id ? (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />Vinculado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                Sin vínculo
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">{item.programa ?? "-"}</TableCell>
                          <TableCell>{item.numero_cuota ?? "-"}</TableCell>
                          <TableCell className="text-right">
                            {!item.kardex_id && item.id ? (
                              <Button size="sm" variant="outline" onClick={() => abrirVinculacionManual(item)}>
                                Vincular
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center text-sm text-muted-foreground py-10">
                          {loading ? "Cargando..." : "No hay registros conciliados"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <PaginationBar
              page={concPage.page}
              pages={concPage.pages}
              total={concPage.total}
              start={concPage.start}
              end={concPage.end}
              pageSize={pageSizeConc}
              onChangePage={setPageConc}
              onChangePageSize={(n) => {
                setPageSizeConc(n)
                setPageConc(1)
              }}
            />
          </Card>
        </TabsContent>

        {/* Importar */}
        <TabsContent value="importar">
          <Card className="rounded-2xl overflow-hidden shadow-sm">
            <CardHeader>
              <CardTitle>Importar Estado de Cuenta Bancario</CardTitle>
              <CardDescription>
                Carga un archivo <strong>Excel (XLSX)</strong> o <strong>CSV</strong> con los pagos bancarios para conciliar automáticamente con el Kardex.
                Solo se requieren las columnas: <strong>Banco</strong>, <strong>Referencia/Boleta</strong>, <strong>Monto</strong> y <strong>Fecha</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Archivo Excel o CSV</h3>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="file-upload">Seleccionar archivo</Label>
                      <div className="relative">
                        <Input
                          id="file-upload"
                          type="file"
                          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => document.getElementById("file-upload")?.click()}
                        >
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                          {fileName}
                        </Button>
                      </div>
                    </div>
                    {selectedFile && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedFile(null)
                          setFileName("Sin archivos seleccionados")
                        }}
                      >
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => setShowStructure(!showStructure)}>
                    {showStructure ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Ocultar Estructura
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Mostrar Estructura
                      </>
                    )}
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={handleDownloadTemplate}
                    disabled={downloadingTemplate}
                  >
                    <Download className={classNames("mr-2 h-4 w-4", downloadingTemplate && "animate-pulse")} />
                    {downloadingTemplate ? "Descargando..." : "Descargar plantilla"}
                  </Button>

                  <Button onClick={handleImport} disabled={!selectedFile || loading}>
                    <Upload className={classNames("mr-2 h-4 w-4", loading && "animate-pulse")} />
                    {loading ? "Importando..." : "Importar Recibos"}
                  </Button>
                </div>

                {importSummary && (
                  <div className="mt-2 flex items-center gap-2 text-sm flex-wrap">
                    <div className="rounded-full border px-3 py-1">Creados: <strong>{importSummary.created}</strong></div>
                    <div className="rounded-full border px-3 py-1">Actualizados: <strong>{importSummary.updated}</strong></div>
                    <div className="rounded-full border px-3 py-1">Ignorados: <strong>{importSummary.skipped}</strong></div>
                    <div className="rounded-full border px-3 py-1">Errores: <strong className="text-red-600">{importSummary.errors}</strong></div>
                    {importSummary.errors > 0 && (
                      <Button variant="outline" size="sm" onClick={() => setShowErrorsDialog(true)}>
                        Ver detalles
                      </Button>
                    )}
                  </div>
                )}

                {showStructure && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Estructura esperada</h3>
                    <div className="border rounded-xl overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[60px]">#</TableHead>
                            <TableHead>Nombre de la columna</TableHead>
                            <TableHead>No. de Columna</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {expectedStructure.map((column) => (
                            <TableRow key={column.id}>
                              <TableCell>{column.id}</TableCell>
                              <TableCell>{column.name}</TableCell>
                              <TableCell>{column.column}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div className="text-sm text-amber-900 space-y-2">
                        <p className="font-semibold">📋 Instrucciones importantes:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>El archivo debe contener <strong>solo las columnas del estado de cuenta bancario</strong></li>
                          <li>El formato debe ser: <strong>Fecha, Tipo de Transacción, Descripción, No. Doc, Debe, Haber, Banco</strong></li>
                          <li>El sistema lee: <strong>Banco</strong> (columna Banco), <strong>Referencia/Boleta</strong> (de No. Doc), <strong>Monto</strong> (de Debe o Haber) y <strong>Fecha</strong></li>
                          <li>El monto se toma de <strong>Debe</strong> o <strong>Haber</strong> (el que tenga valor)</li>
                          <li>La columna <strong>Banco</strong> es obligatoria y debe contener el nombre del banco</li>
                          <li>La columna <strong>Tipo de Transacción</strong> es opcional</li>
                          <li>La conciliación compara: <strong>Banco + Referencia + Monto + Fecha</strong> contra el Kardex</li>
                          <li>Se normalizan automáticamente los nombres de bancos y referencias para evitar errores</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3 text-sm rounded-md border border-red-200 bg-red-50 text-red-700">
                    {errorMsg}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de errores del import */}
      <Dialog open={showErrorsDialog} onOpenChange={setShowErrorsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Errores de importación</DialogTitle>
          </DialogHeader>
          <div className="max-h-72 overflow-auto text-sm space-y-2">
            {importErrors?.length ? (
              importErrors.map((e, idx) => (
                <div key={idx} className="rounded border p-2 bg-red-50 border-red-200">
                  <strong>Fila {e.row}:</strong> {e.message}
                </div>
              ))
            ) : (
              <div>No hay detalles disponibles.</div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowErrorsDialog(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showVincularDialog} onOpenChange={setShowVincularDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vincular Conciliación con Kardex</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded border p-3 text-sm bg-muted/20">
              <div><strong>Ref:</strong> {vincularTarget?.input?.recibo || "-"}</div>
              <div><strong>Monto:</strong> {formatQ(vincularTarget?.input?.monto)}</div>
              <div><strong>Fecha:</strong> {formatDate(vincularTarget?.input?.fechaPago)}</div>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Buscar boleta, carnet o nombre..."
                value={vincularSearch}
                onChange={(e) => setVincularSearch(e.target.value)}
              />
              <Button variant="outline" onClick={buscarSugerenciasVinculacion} disabled={vincularLoading}>
                {vincularLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
              </Button>
            </div>

            <div className="max-h-72 overflow-auto border rounded">
              {vincularSugerencias.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No hay sugerencias para vincular.</div>
              ) : (
                <div className="divide-y">
                  {vincularSugerencias.map((s) => (
                    <div key={s.id} className="p-3 flex items-center justify-between gap-3">
                      <div className="text-sm">
                        <div className="font-medium">Boleta: {s.numero_boleta || "-"} | Banco: {s.banco || "-"}</div>
                        <div className="text-muted-foreground">
                          Q {Number(s.monto_pagado || 0).toFixed(2)} | {formatDate(s.fecha_pago || undefined)} | {s.estado_pago || "-"}
                        </div>
                        <div className="text-muted-foreground">
                          {(s.prospecto as any)?.nombre || ""} {(s.prospecto as any)?.carnet ? `(${(s.prospecto as any).carnet})` : ""}
                        </div>
                      </div>
                      <Button onClick={() => ejecutarVinculacionManual(s.id)} disabled={vinculando}>
                        {vinculando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Vincular"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVincularDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}