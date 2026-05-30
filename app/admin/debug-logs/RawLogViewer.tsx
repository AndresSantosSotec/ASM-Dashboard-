"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { api } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Download,
  RefreshCw,
  ScrollText,
  Search,
  ArrowDownToLine,
  ArrowUpToLine,
  AlertTriangle,
  ArrowDownUp,
  Trash2,
} from "lucide-react"

interface ArchivoLog {
  nombre: string
  tamano: number
  fecha: string
}

interface RawResponse {
  archivo: string
  contenido: string
  tamano: number
  lineas: number
  lineas_pedidas: number
  truncado: boolean
  mensaje?: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function RawLogViewer() {
  const [archivos, setArchivos] = useState<ArchivoLog[]>([])
  const [archivo, setArchivo] = useState("laravel.log")
  const [lineas, setLineas] = useState(500)
  const [data, setData] = useState<RawResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [search, setSearch] = useState("")
  const [autoScroll, setAutoScroll] = useState(true)
  const [orden, setOrden] = useState<"desc" | "asc">("asc") // asc = orden natural del archivo (antiguo→reciente), desc = invertido (reciente→antiguo)
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearing, setClearing] = useState(false)
  const preRef = useRef<HTMLPreElement | null>(null)

  const fetchArchivos = useCallback(async () => {
    try {
      const res = await api.get(`/debug/logs/archivos`)
      setArchivos(res.data.archivos ?? [])
    } catch {
      // silent
    }
  }, [])

  const fetchRaw = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<RawResponse>(`/debug/logs/raw`, {
        params: { archivo, lineas },
      })
      setData(res.data)
      // Auto-scroll: si orden es ascendente (recientes al final) vamos al final;
      // si es descendente (recientes arriba) vamos al inicio.
      if (autoScroll) {
        setTimeout(() => {
          if (!preRef.current) return
          if (orden === "asc") preRef.current.scrollTop = preRef.current.scrollHeight
          else preRef.current.scrollTop = 0
        }, 50)
      }
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { message?: string } } }
      if (err?.response?.status === 403) {
        setError("No tienes permiso para ver los logs del sistema.")
      } else {
        setError(err?.response?.data?.message ?? "Error al cargar el log crudo.")
      }
    } finally {
      setLoading(false)
    }
  }, [archivo, lineas, autoScroll, orden])

  useEffect(() => { fetchArchivos() }, [fetchArchivos])
  useEffect(() => { fetchRaw() }, [archivo, lineas])

  useEffect(() => {
    if (!autoRefresh) return
    const t = setInterval(() => fetchRaw(), 5000)
    return () => clearInterval(t)
  }, [autoRefresh, fetchRaw])

  const handleDownload = async () => {
    try {
      const res = await api.get(`/debug/logs/download`, {
        params: { archivo },
        responseType: "blob",
      })
      const a = document.createElement("a")
      a.href = URL.createObjectURL(res.data)
      a.download = archivo
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {
      alert("No se pudo descargar el archivo.")
    }
  }

  const handleClear = async () => {
    setClearing(true)
    try {
      await api.post(`/debug/logs/clear`, { archivo, confirmar: true })
      setConfirmClear(false)
      await fetchRaw()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      alert(err?.response?.data?.message ?? "Error al limpiar el log.")
    } finally {
      setClearing(false)
    }
  }

  // Agrupa líneas en "entradas" (cada entrada empieza con [YYYY-MM-DD HH:MM:SS]).
  // Esto permite invertir el orden sin romper stack traces multilínea.
  const splitEntries = (texto: string): string[] => {
    if (!texto) return []
    const lines = texto.split("\n")
    const entries: string[] = []
    const startRe = /^\[\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}/
    let current: string[] = []
    for (const ln of lines) {
      if (startRe.test(ln) && current.length) {
        entries.push(current.join("\n"))
        current = [ln]
      } else {
        current.push(ln)
      }
    }
    if (current.length) entries.push(current.join("\n"))
    return entries
  }

  const displayedContent = (() => {
    if (!data?.contenido) return ""
    let entries = splitEntries(data.contenido)
    if (search.trim()) {
      const needle = search.toLowerCase()
      entries = entries.filter((e) => e.toLowerCase().includes(needle))
    }
    if (orden === "desc") entries = entries.slice().reverse()
    return entries.join("\n")
  })()

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1 min-w-[180px]">
              <label className="text-xs text-gray-500 font-medium">Archivo</label>
              <Select value={archivo} onValueChange={setArchivo}>
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

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Últimas líneas</label>
              <Select value={String(lineas)} onValueChange={(v) => setLineas(Number(v))}>
                <SelectTrigger className="h-8 text-sm w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[100, 250, 500, 1000, 2000, 5000].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-[220px]">
              <label className="text-xs text-gray-500 font-medium">Filtrar líneas</label>
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Texto a buscar en líneas..."
                  className="h-8 text-sm pl-7"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pb-0.5">
              <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                Auto-refresh (5s)
              </label>
              <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                />
                Auto-scroll
              </label>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Orden</label>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-sm gap-1"
                onClick={() => setOrden(orden === "desc" ? "asc" : "desc")}
                title="Cambiar orden de las entradas"
              >
                <ArrowDownUp className="h-3.5 w-3.5" />
                {orden === "desc" ? "Recientes primero" : "Antiguos primero"}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8" onClick={fetchRaw} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
              <Button size="sm" variant="outline" className="h-8" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                Descargar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => {
                  if (!preRef.current) return
                  if (orden === "asc") preRef.current.scrollTop = preRef.current.scrollHeight
                  else preRef.current.scrollTop = 0
                }}
                title="Ir al log más reciente"
              >
                {orden === "asc" ? <ArrowDownToLine className="h-4 w-4 mr-1" /> : <ArrowUpToLine className="h-4 w-4 mr-1" />}
                Reciente
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-8"
                onClick={() => setConfirmClear(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Limpiar log
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2 pt-3 px-4 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <ScrollText className="h-4 w-4" />
            {data ? `${data.archivo} · ${data.lineas} líneas · ${formatBytes(data.tamano)}` : "Cargando..."}
            {data?.truncado && (
              <span className="text-amber-600 text-xs flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> contenido truncado a 5 MB
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <pre
            ref={preRef}
            className="bg-gray-950 text-gray-200 text-[12px] font-mono p-3 overflow-auto max-h-[70vh] whitespace-pre-wrap break-words"
          >
            {displayedContent || (loading ? "Cargando..." : "Sin contenido.")}
          </pre>
        </CardContent>
      </Card>

      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Limpiar el archivo de log?</DialogTitle>
            <DialogDescription>
              Se eliminará todo el contenido de <strong>{archivo}</strong>. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClear(false)} disabled={clearing}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleClear} disabled={clearing}>
              {clearing ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Sí, limpiar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
