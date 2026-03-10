"use client"

import { useCallback, useEffect, useState } from "react"
import { Header } from "@/components/header"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import {
  Download,
  FileSpreadsheet,
  FileIcon as FilePdf,
  FileText,
  Loader2,
  RefreshCw,
  Users,
  DollarSign,
  Receipt,
} from "lucide-react"
import { API_BASE_URL } from "@/utils/apiConfig"
import {
  getCommissionReport,
  downloadCommissionReportExport,
  type CommissionReportRow,
} from "@/services/reports"

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const formatQ = (val: number | null | undefined) => {
  if (val === null || val === undefined || val === 0) return "—"
  return `Q ${val.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface Asesor {
  id: string
  name: string
}

export default function ReporteComisionesPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [asesorId, setAsesorId] = useState<number | undefined>(undefined)
  const [asesores, setAsesores] = useState<Asesor[]>([])
  const [data, setData] = useState<CommissionReportRow[]>([])
  const [resumen, setResumen] = useState<{
    total_inscripciones: number
    total_mensualidades: number
    total_comisiones: number
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState<string | null>(null)
  const { toast } = useToast()

  // Cargar asesores
  useEffect(() => {
    const loadAdvisors = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_BASE_URL}/api/users/role/7`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []
        setAsesores(
          list.map((u: any) => ({
            id: u.id.toString(),
            name: u.full_name ?? (`${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || "—"),
          }))
        )
      } catch {
        // silently fail
      }
    }
    loadAdvisors()
  }, [])

  const loadReport = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getCommissionReport(month, year, asesorId)
      setData(result.data || [])
      setResumen(result.resumen || null)
    } catch (err: any) {
      toast({
        title: "Error al cargar reporte",
        description: err?.response?.data?.message || err.message || "Error desconocido",
        variant: "destructive",
      })
      setData([])
      setResumen(null)
    } finally {
      setLoading(false)
    }
  }, [month, year, asesorId, toast])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  const handleExport = async (format: "excel" | "pdf" | "csv") => {
    setExporting(format)
    try {
      await downloadCommissionReportExport(month, year, format, asesorId)
      toast({ title: "Exportación exitosa", description: `Reporte descargado en formato ${format.toUpperCase()}` })
    } catch (err: any) {
      toast({
        title: "Error al exportar",
        description: err?.response?.data?.message || err.message || "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setExporting(null)
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Reporte de Comisiones Mensual" />
      <main className="flex-1 p-4 md:p-6 space-y-4">
        {/* Filtros */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filtros del Reporte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Mes</label>
                <Select value={month.toString()} onValueChange={(v) => setMonth(Number(v))}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((name, i) => (
                      <SelectItem key={i} value={(i + 1).toString()}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Año</label>
                <Select value={year.toString()} onValueChange={(v) => setYear(Number(v))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Asesor</label>
                <Select
                  value={asesorId?.toString() ?? "all"}
                  onValueChange={(v) => setAsesorId(v === "all" ? undefined : Number(v))}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Todos los asesores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los asesores</SelectItem>
                    {asesores.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={loadReport} disabled={loading} variant="outline" className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Actualizar
              </Button>

              {/* Botones de exportación */}
              <div className="flex gap-2 ml-auto">
                <Button
                  onClick={() => handleExport("excel")}
                  disabled={!!exporting || data.length === 0}
                  variant="outline"
                  className="gap-2"
                  title="Exportar a Excel"
                >
                  {exporting === "excel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 text-green-600" />}
                  Excel
                </Button>
                <Button
                  onClick={() => handleExport("pdf")}
                  disabled={!!exporting || data.length === 0}
                  variant="outline"
                  className="gap-2"
                  title="Exportar a PDF"
                >
                  {exporting === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePdf className="h-4 w-4 text-red-600" />}
                  PDF
                </Button>
                <Button
                  onClick={() => handleExport("csv")}
                  disabled={!!exporting || data.length === 0}
                  variant="outline"
                  className="gap-2"
                  title="Exportar a CSV"
                >
                  {exporting === "csv" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 text-blue-600" />}
                  CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen */}
        {resumen && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Inscripciones</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatQ(resumen.total_inscripciones)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Mensualidades</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatQ(resumen.total_mensualidades)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Comisiones</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatQ(resumen.total_comisiones)}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabla */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Detalle de Comisiones — {MONTH_NAMES[month - 1]} {year}
              {data.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({data.length} registro{data.length !== 1 ? "s" : ""})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Download className="h-10 w-10 mb-3 opacity-50" />
                <p className="text-lg font-medium">No hay registros</p>
                <p className="text-sm">No se encontraron inscripciones para el periodo seleccionado.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="whitespace-nowrap min-w-[100px]">Carné</TableHead>
                      <TableHead className="whitespace-nowrap min-w-[120px]">Nombre</TableHead>
                      <TableHead className="whitespace-nowrap min-w-[120px]">Apellido</TableHead>
                      <TableHead className="whitespace-nowrap min-w-[110px]">Mes Ingresa</TableHead>
                      <TableHead className="whitespace-nowrap min-w-[120px]">Código Carrera</TableHead>
                      <TableHead className="whitespace-nowrap min-w-[120px] text-right">Valor Matrícula</TableHead>
                      <TableHead className="whitespace-nowrap min-w-[120px]">Boleta Inscripción</TableHead>
                      <TableHead className="whitespace-nowrap min-w-[130px]">No. Recibo American</TableHead>
                      <TableHead className="whitespace-nowrap min-w-[100px]">No. Factura</TableHead>
                      <TableHead className="whitespace-nowrap min-w-[110px] text-right">Mensualidad</TableHead>
                      <TableHead className="whitespace-nowrap min-w-[100px]">Recibo</TableHead>
                      <TableHead className="whitespace-nowrap min-w-[100px]">Boleta</TableHead>
                      <TableHead className="whitespace-nowrap min-w-[130px]">Asesor</TableHead>
                      <TableHead className="whitespace-nowrap min-w-[120px]">Fecha Inscripción</TableHead>
                      <TableHead className="whitespace-nowrap min-w-[130px] text-right font-bold text-green-700">Pago Comisión</TableHead>
                      <TableHead className="whitespace-nowrap min-w-[120px] text-right">Monto Depósito</TableHead>
                      <TableHead className="whitespace-nowrap min-w-[100px] text-right">Pago 1</TableHead>
                      <TableHead className="whitespace-nowrap min-w-[130px] text-right">Otros Descuentos</TableHead>
                      <TableHead className="whitespace-nowrap min-w-[100px] text-right">Pago 2</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row, idx) => (
                      <TableRow key={idx} className={idx % 2 === 0 ? "" : "bg-muted/30"}>
                        <TableCell className="font-mono text-xs">{row.carnet || "—"}</TableCell>
                        <TableCell>{row.nombre || "—"}</TableCell>
                        <TableCell>{row.apellido || "—"}</TableCell>
                        <TableCell className="text-xs">{row.mes_ingresa || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{row.codigo_carrera || "—"}</TableCell>
                        <TableCell className="text-right">{formatQ(row.valor_matricula)}</TableCell>
                        <TableCell className="text-xs">{row.boleta_inscripcion || "—"}</TableCell>
                        <TableCell className="text-xs">{row.recibo_american || "—"}</TableCell>
                        <TableCell className="text-xs">{row.no_factura || "—"}</TableCell>
                        <TableCell className="text-right">{formatQ(row.mensualidad)}</TableCell>
                        <TableCell className="text-xs">{row.recibo_mensualidad || "—"}</TableCell>
                        <TableCell className="text-xs">{row.boleta_mensualidad || "—"}</TableCell>
                        <TableCell className="text-xs">{row.asesor || "—"}</TableCell>
                        <TableCell className="text-xs">{row.fecha_inscripcion || "—"}</TableCell>
                        <TableCell className="text-right font-bold text-green-700">{formatQ(row.pago_comision)}</TableCell>
                        <TableCell className="text-right">{formatQ(row.monto_deposito)}</TableCell>
                        <TableCell className="text-right">{formatQ(row.pago_1)}</TableCell>
                        <TableCell className="text-right">{formatQ(row.otros_descuentos)}</TableCell>
                        <TableCell className="text-right">{formatQ(row.pago_2)}</TableCell>
                      </TableRow>
                    ))}
                    {/* Fila de totales */}
                    <TableRow className="bg-green-50 font-bold border-t-2">
                      <TableCell colSpan={5} className="text-right">TOTALES:</TableCell>
                      <TableCell className="text-right">
                        {formatQ(data.reduce((s, r) => s + (r.valor_matricula || 0), 0))}
                      </TableCell>
                      <TableCell colSpan={3} />
                      <TableCell className="text-right">
                        {formatQ(data.reduce((s, r) => s + (r.mensualidad || 0), 0))}
                      </TableCell>
                      <TableCell colSpan={4} />
                      <TableCell className="text-right text-green-700">
                        {formatQ(data.reduce((s, r) => s + (r.pago_comision || 0), 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatQ(data.reduce((s, r) => s + (r.monto_deposito || 0), 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatQ(data.reduce((s, r) => s + (r.pago_1 || 0), 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatQ(data.reduce((s, r) => s + (r.otros_descuentos || 0), 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatQ(data.reduce((s, r) => s + (r.pago_2 || 0), 0))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
