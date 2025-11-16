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
} from "lucide-react"

// Diálogo errores
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

// ✅ services centralizados
import {
  getKardexPendientes,
  getKardexConciliados,
  importConciliacion,
  downloadConciliacionTemplate,
  exportConciliacionXlsx,
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
  const [search, setSearch] = useState<string>("")
  const debouncedSearch = useDebouncedValue(search, 350)
  const [fromDate, setFromDate] = useState<string>("") // YYYY-MM-DD
  const [toDate, setToDate] = useState<string>("") // YYYY-MM-DD

  const [expectedStructure] = useState<StructureItem[]>([
    { id: 1, name: "Banco", column: 1 },
    { id: 2, name: "Referencia / Boleta", column: 2 },
    { id: 3, name: "Monto", column: 3 },
    { id: 4, name: "Fecha de Pago", column: 4 },
    { id: 5, name: "Número de Autorización (Opcional)", column: 5 },
  ])

  const [previewPendientes, setPreviewPendientes] = useState<PreviewResponse | null>(null)
  const [previewConciliados, setPreviewConciliados] = useState<PreviewResponse | null>(null)

  // ====== Estados de paginación (separados por tab) ======
  const [pagePend, setPagePend] = useState(1)
  const [pageSizePend, setPageSizePend] = useState(25)
  const [pageConc, setPageConc] = useState(1)
  const [pageSizeConc, setPageSizeConc] = useState(25)

  // Reset de página al cambiar filtros o búsqueda
  useEffect(() => {
    setPagePend(1)
    setPageConc(1)
  }, [debouncedSearch, bankFilter, fromDate, toDate])

  // ====== Cargar PENDIENTES desde Kardex (backend) ======
  const loadPendientesFromKardex = async () => {
    try {
      setLoading(true)
      setErrorMsg(null)
      const data = await getKardexPendientes({
        from: fromDate || undefined,
        to: toDate || undefined,
        banco: bankFilter === "todos" ? undefined : bankFilter,
      })
      setPreviewPendientes(data)
    } catch (err: any) {
      setErrorMsg(err?.message || "No se pudo cargar la información de pendientes.")
    } finally {
      setLoading(false)
    }
  }

  // Cargar CONCILIADOS desde Kardex
  const loadConciliadosFromKardex = async () => {
    try {
      setLoading(true)
      setErrorMsg(null)
      const data = await getKardexConciliados({
        from: fromDate || undefined,
        to: toDate || undefined,
        banco: bankFilter === "todos" ? undefined : bankFilter,
      })
      setPreviewConciliados(data)
    } catch (err: any) {
      setErrorMsg(err?.message || "No se pudo cargar la información de conciliados.")
    } finally {
      setLoading(false)
    }
  }

  // Carga automática por tab
  useEffect(() => {
    if (activeTab === "pendientes") {
      loadPendientesFromKardex()
    } else if (activeTab === "conciliados") {
      loadConciliadosFromKardex()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Recarga automática al cambiar filtros
  useEffect(() => {
    if (activeTab === "pendientes") {
      loadPendientesFromKardex()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, bankFilter])

  useEffect(() => {
    if (activeTab === "conciliados") {
      loadConciliadosFromKardex()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, bankFilter])

  // ===== Handlers =====
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      setFileName(file.name)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadConciliacionTemplate()
      const url = URL.createObjectURL(new Blob([blob]))
      const a = document.createElement("a")
      a.href = url
      a.download = "plantilla_conciliacion.xlsx"
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert("No se pudo descargar la plantilla.")
    }
  }

  const handleExportXlsx = async () => {
    try {
      const blob = await exportConciliacionXlsx({
        from: fromDate || undefined,
        to: toDate || undefined,
        bank: bankFilter === "todos" ? undefined : bankFilter,
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
  const filterByCommon = (list: PreviewResultItem[]) => {
    const byBank =
      bankFilter === "todos" ? list : list.filter((r) => normalizeBank(r.input.banco) === normalizeBank(bankFilter))

    if (!debouncedSearch.trim()) return byBank

    const q = debouncedSearch.toLowerCase()
    return byBank.filter((r) => {
      const alumno = (r.alumno_detectado || r.input.alumno || "").toLowerCase()
      const carnet = (r.input.carnet || "").toLowerCase()
      const recibo = (r.input.recibo || "").toLowerCase()
      return alumno.includes(q) || carnet.includes(q) || recibo.includes(q)
    })
  }

  // Pendientes visibles (solo estados que requieren acción)
  const filteredPendientes = useMemo(() => {
    const list = previewPendientes?.results ?? []
    const needAction = list.filter((r) =>
      ["monto_difiere", "sin_coincidencia", "error"].includes(r.status)
    )
    return filterByCommon(needAction)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewPendientes, bankFilter, debouncedSearch])

  // Conciliados visibles
  const filteredConciliados = useMemo(() => {
    const list = previewConciliados?.results ?? []
    const ok = list.filter((r) => r.status === "conciliado")
    return filterByCommon(ok)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewConciliados, bankFilter, debouncedSearch])

  /** ===== Paginación aplicada ===== */
  const pendPage = paginate(filteredPendientes, pagePend, pageSizePend)
  const concPage = paginate(filteredConciliados, pageConc, pageSizeConc)

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
          <SelectItem value="BANCO INDUSTRIAL">Banco Industrial</SelectItem>
          <SelectItem value="BANRURAL">Banrural</SelectItem>
          <SelectItem value="G&T CONTINENTAL">Banco G&amp;T</SelectItem>
          <SelectItem value="BAM">BAM</SelectItem>
          <SelectItem value="PROMERICA">Promérica</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" onClick={handleExportXlsx} disabled={loading}>
        <Download className="mr-2 h-4 w-4" />
        Exportar XLSX
      </Button>
      <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
        <RefreshCw className={classNames("mr-2 h-4 w-4", loading && "animate-spin")} />
        Refrescar
      </Button>
    </>
  )

  const SearchBox = (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Buscar por alumno, carnet o referencia..."
        className="pl-8"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
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
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio
            </Link>
          </Button>
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
              <div className="flex flex-wrap items-center gap-2">{ToolbarFilters}</div>
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
              <div className="flex flex-wrap items-center gap-2">{ToolbarFilters}</div>
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
                      <TableHead>Programa</TableHead>
                      <TableHead>Cuota #</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="[&>tr:nth-child(even)]:bg-muted/20">
                    {loading ? (
                      <SkeletonRows cols={10} rows={8} />
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
                          <TableCell className="text-xs">{item.programa ?? "-"}</TableCell>
                          <TableCell>{item.numero_cuota ?? "-"}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-sm text-muted-foreground py-10">
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

                  <Button variant="outline" onClick={handleDownloadTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar plantilla
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
                          <li>El sistema busca automáticamente las columnas: <strong>Banco</strong>, <strong>Referencia/Boleta</strong>, <strong>Monto</strong> y <strong>Fecha</strong></li>
                          <li>Los nombres de columnas pueden variar (ej: "Banco", "Bank", "Entidad" son aceptados)</li>
                          <li>La conciliación compara: <strong>Banco + Referencia + Monto + Fecha</strong> contra el Kardex</li>
                          <li>Se normalizan automáticamente los nombres de bancos y referencias para evitar errores</li>
                          <li>El número de autorización es <strong>opcional</strong></li>
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
    </div>
  )
}