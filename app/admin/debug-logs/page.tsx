"use client"

import { useState, useCallback, useEffect } from "react"
import { api } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertTriangle,
  Bug,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Info,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface LogEntry {
  id: string
  nivel: string
  nivel_color: "red" | "amber" | "blue" | "gray"
  timestamp: string
  environment: string
  mensaje: string
  archivo_origen: string | null
  linea: number | null
  stack_trace: string
  contexto: Record<string, unknown>
  repeticiones: number
}

interface Paginacion {
  total: number
  pagina: number
  per_page: number
}

interface Resumen {
  error?: number
  warning?: number
  info?: number
  debug?: number
  critical?: number
  emergency?: number
  alert?: number
  notice?: number
  [nivel: string]: number | undefined
}

interface ArchivoLog {
  nombre: string
  tamano: number
  fecha: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const axios = api  // alias for readability

const NIVEL_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  ERROR:     { label: "ERROR",     color: "bg-red-100 text-red-700 border-red-300",    icon: <XCircle className="h-3 w-3" /> },
  CRITICAL:  { label: "CRITICAL",  color: "bg-red-200 text-red-800 border-red-400",    icon: <XCircle className="h-3 w-3" /> },
  EMERGENCY: { label: "EMERGENCY", color: "bg-red-300 text-red-900 border-red-500",    icon: <XCircle className="h-3 w-3" /> },
  ALERT:     { label: "ALERT",     color: "bg-red-100 text-red-700 border-red-300",    icon: <AlertTriangle className="h-3 w-3" /> },
  WARNING:   { label: "WARNING",   color: "bg-amber-100 text-amber-700 border-amber-300", icon: <AlertTriangle className="h-3 w-3" /> },
  NOTICE:    { label: "NOTICE",    color: "bg-amber-50 text-amber-600 border-amber-200",  icon: <AlertTriangle className="h-3 w-3" /> },
  INFO:      { label: "INFO",      color: "bg-blue-100 text-blue-700 border-blue-300",  icon: <Info className="h-3 w-3" /> },
  DEBUG:     { label: "DEBUG",     color: "bg-gray-100 text-gray-600 border-gray-300",  icon: <Bug className="h-3 w-3" /> },
}

function nivelConfig(nivel: string) {
  return NIVEL_CONFIG[nivel.toUpperCase()] ?? { label: nivel, color: "bg-gray-100 text-gray-600 border-gray-200", icon: null }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DebugLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [paginacion, setPaginacion] = useState<Paginacion>({ total: 0, pagina: 1, per_page: 50 })
  const [resumen, setResumen] = useState<Resumen>({})
  const [archivos, setArchivos] = useState<ArchivoLog[]>([])
  const [archivoSeleccionado, setArchivoSeleccionado] = useState("laravel.log")
  const [nivelFiltro, setNivelFiltro] = useState("todos")
  const [fechaFiltro, setFechaFiltro] = useState("")
  const [buscar, setBuscar] = useState("")
  const [loading, setLoading] = useState(false)
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearLoading, setClearLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchArchivos = useCallback(async () => {
    try {
      const res = await api.get(`/debug/logs/archivos`)
      setArchivos(res.data.archivos ?? [])
    } catch {
      // silent
    }
  }, [])

  const fetchLogs = useCallback(async (pagina = 1) => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string | number> = {
        archivo: archivoSeleccionado,
        per_page: paginacion.per_page,
        pagina,
      }
      if (nivelFiltro && nivelFiltro !== "todos") params.nivel = nivelFiltro
      if (fechaFiltro) params.fecha = fechaFiltro
      if (buscar.trim()) params.buscar = buscar.trim()

      const res = await api.get(`/debug/logs`, { params })
      setLogs(res.data.logs ?? [])
      setPaginacion(res.data.paginacion ?? { total: 0, pagina: 1, per_page: 50 })
      setResumen(res.data.resumen ?? {})
    } catch (e: unknown) {
      if (e instanceof Error && (e as import('axios').AxiosError).response?.status === 403) {
        setError("No tienes permiso para ver los logs del sistema.")
      } else {
        setError("Error al cargar los logs. Verifica la conexión.")
      }
    } finally {
      setLoading(false)
    }
  }, [archivoSeleccionado, nivelFiltro, fechaFiltro, buscar, paginacion.per_page])

  useEffect(() => {
    fetchArchivos()
    fetchLogs(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleBuscar = () => fetchLogs(1)

  const handleClear = async () => {
    setClearLoading(true)
    try {
      await api.post(`/debug/logs/clear`, { archivo: archivoSeleccionado, confirmar: true })
      setConfirmClear(false)
      fetchLogs(1)
    } catch (e: unknown) {
      const err = e as import('axios').AxiosError<{ message?: string }>
      alert(err.response?.data?.message ?? "Error al limpiar el log.")
    } finally {
      setClearLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      const res = await api.get(`/debug/logs/download`, {
        params: { archivo: archivoSeleccionado },
        responseType: "blob",
      })
      const blob = res.data
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = archivoSeleccionado
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {
      alert("No se pudo descargar el archivo.")
    }
  }

  const toggleExpand = (id: string) => {
    setExpandidos((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const totalPages = Math.max(1, Math.ceil(paginacion.total / paginacion.per_page))

  const nivelesSummary = ["ERROR", "CRITICAL", "WARNING", "INFO", "DEBUG"]

  return (
    <div className="p-6 space-y-4 max-w-full">
      {/* Encabezado */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-gray-600" />
            Debug Logs
          </h1>
          <p className="text-sm text-gray-500 mt-1">Visor de logs del sistema Laravel</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchLogs(paginacion.pagina)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Descargar
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setConfirmClear(true)}>
            <Trash2 className="h-4 w-4 mr-1" />
            Limpiar log
          </Button>
        </div>
      </div>

      {/* Resumen por nivel */}
      <div className="flex flex-wrap gap-2">
        {nivelesSummary.map((n) => {
          const cfg = nivelConfig(n)
          const count = resumen[n.toLowerCase()] ?? 0
          return (
            <button
              key={n}
              onClick={() => { setNivelFiltro(nivelFiltro === n ? "todos" : n); setTimeout(() => fetchLogs(1), 0) }}
              className={`flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-medium transition-opacity ${cfg.color} ${nivelFiltro === n ? "ring-2 ring-offset-1 ring-gray-400" : "opacity-80 hover:opacity-100"}`}
            >
              {cfg.icon}
              {n}: {count}
            </button>
          )
        })}
        {Object.entries(resumen)
          .filter(([k]) => !nivelesSummary.map((n) => n.toLowerCase()).includes(k) && (resumen[k] ?? 0) > 0)
          .map(([k, v]) => (
            <span key={k} className="flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-medium bg-gray-100 text-gray-600">
              {k.toUpperCase()}: {v}
            </span>
          ))}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Archivo */}
            <div className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-xs text-gray-500 font-medium">Archivo</label>
              <Select value={archivoSeleccionado} onValueChange={(v) => setArchivoSeleccionado(v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {archivos.length === 0
                    ? <SelectItem value="laravel.log">laravel.log</SelectItem>
                    : archivos.map((a) => (
                        <SelectItem key={a.nombre} value={a.nombre}>
                          {a.nombre} ({formatBytes(a.tamano)})
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nivel */}
            <div className="flex flex-col gap-1 min-w-[130px]">
              <label className="text-xs text-gray-500 font-medium">Nivel</label>
              <Select value={nivelFiltro} onValueChange={setNivelFiltro}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {["ERROR", "CRITICAL", "EMERGENCY", "ALERT", "WARNING", "NOTICE", "INFO", "DEBUG"].map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Fecha</label>
              <Input
                type="date"
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
                className="h-8 text-sm w-36"
              />
            </div>

            {/* Buscar */}
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label className="text-xs text-gray-500 font-medium">Buscar en mensaje</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar..."
                  value={buscar}
                  onChange={(e) => setBuscar(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                  className="h-8 text-sm"
                />
                <Button size="sm" className="h-8" onClick={handleBuscar}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Por página */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Por página</label>
              <Select
                value={String(paginacion.per_page)}
                onValueChange={(v) => {
                  setPaginacion((prev) => ({ ...prev, per_page: Number(v) }))
                  setTimeout(() => fetchLogs(1), 0)
                }}
              >
                <SelectTrigger className="h-8 text-sm w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[25, 50, 100, 200].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          <XCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Tabla de logs */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium text-gray-600">
            {loading ? "Cargando..." : `${paginacion.total.toLocaleString()} entradas encontradas · Página ${paginacion.pagina} de ${totalPages}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {loading ? (
            <div className="flex justify-center items-center py-16 text-gray-400">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No hay entradas de log con los filtros aplicados.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {logs.map((entry) => {
                const cfg = nivelConfig(entry.nivel)
                const expanded = expandidos.has(entry.id)
                const hasDetails = entry.stack_trace || Object.keys(entry.contexto).length > 0
                return (
                  <div key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <div
                      className={`flex items-start gap-3 px-4 py-2.5 cursor-pointer ${hasDetails ? "cursor-pointer" : ""}`}
                      onClick={() => hasDetails && toggleExpand(entry.id)}
                    >
                      {/* Nivel badge */}
                      <div className="shrink-0 mt-0.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${cfg.color}`}>
                          {cfg.icon}
                          {entry.nivel}
                        </span>
                      </div>

                      {/* Timestamp */}
                      <div className="shrink-0 text-[11px] text-gray-400 font-mono mt-0.5 min-w-[130px]">
                        {entry.timestamp}
                      </div>

                      {/* Mensaje */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 break-words leading-snug">
                          {entry.mensaje}
                        </p>
                        {entry.archivo_origen && (
                          <p className="text-[11px] text-gray-400 font-mono mt-0.5 truncate">
                            {entry.archivo_origen}{entry.linea ? `:${entry.linea}` : ""}
                          </p>
                        )}
                      </div>

                      {/* Expand toggle */}
                      <div className="shrink-0 text-gray-400">
                        {hasDetails
                          ? expanded
                            ? <ChevronDown className="h-4 w-4" />
                            : <ChevronRight className="h-4 w-4" />
                          : <div className="w-4" />}
                      </div>
                    </div>

                    {/* Expandido: stack trace + contexto */}
                    {expanded && hasDetails && (
                      <div className="mx-4 mb-3 rounded-md bg-gray-950 text-gray-200 text-[11px] font-mono overflow-auto max-h-64">
                        {Object.keys(entry.contexto).length > 0 && (
                          <div className="p-3 border-b border-gray-700">
                            <span className="text-blue-400 font-semibold">CONTEXTO:</span>
                            <pre className="mt-1 whitespace-pre-wrap">{JSON.stringify(entry.contexto, null, 2)}</pre>
                          </div>
                        )}
                        {entry.stack_trace && (
                          <div className="p-3">
                            <span className="text-amber-400 font-semibold">STACK TRACE:</span>
                            <pre className="mt-1 whitespace-pre-wrap">{entry.stack_trace}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginación */}
      {!loading && paginacion.total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Mostrando {((paginacion.pagina - 1) * paginacion.per_page) + 1}–{Math.min(paginacion.pagina * paginacion.per_page, paginacion.total)} de {paginacion.total.toLocaleString()}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={paginacion.pagina <= 1}
              onClick={() => fetchLogs(paginacion.pagina - 1)}
            >
              Anterior
            </Button>
            <div className="flex items-center gap-1 px-2 text-gray-600">
              {paginacion.pagina} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={paginacion.pagina >= totalPages}
              onClick={() => fetchLogs(paginacion.pagina + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Dialog confirmar limpiar */}
      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Limpiar el archivo de log?</DialogTitle>
            <DialogDescription>
              Se eliminará todo el contenido de <strong>{archivoSeleccionado}</strong>. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClear(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleClear} disabled={clearLoading}>
              {clearLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Sí, limpiar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
