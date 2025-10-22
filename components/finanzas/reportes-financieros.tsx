"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Download,
  FileText,
  GraduationCap,
  ListChecks,
  RefreshCw,
  Save,
  Search,
  Users,
  Wallet,
  XCircle,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { exportFinancialReport } from "@/services/finance"

type KardexStatus = "aplicado" | "pendiente" | "anulado"

interface KardexRecord {
  id: string
  estudiante: string
  carnet: string
  programa: string
  concepto: string
  monto: number
  fecha: string
  estado: KardexStatus
  metodo: string
  referencia: string
  notas?: string
}

type StudentQuotaStatus = "al-dia" | "en-mora" | "restructurado"

interface StudentQuotaRecord {
  id: string
  estudiante: string
  carnet: string
  programa: string
  cuotasPendientes: number
  montoCuota: number
  proximaCuota: string
  estado: StudentQuotaStatus
  tipoPlan: string
  notas?: string
}

const DEFAULT_KARDEX_RECORDS: KardexRecord[] = [
  {
    id: "KP-001",
    estudiante: "Andrea Castillo",
    carnet: "20204567",
    programa: "Administración de Empresas",
    concepto: "Ajuste de pago febrero 2025",
    monto: 750,
    fecha: "2025-02-07",
    estado: "aplicado",
    metodo: "transferencia",
    referencia: "TR-928374",
    notas: "Ajuste registrado por conciliación bancaria.",
  },
  {
    id: "KP-002",
    estudiante: "Luis Martínez",
    carnet: "20215634",
    programa: "Ingeniería en Sistemas",
    concepto: "Reversión de pago duplicado",
    monto: -450,
    fecha: "2025-02-15",
    estado: "anulado",
    metodo: "tarjeta",
    referencia: "POS-55721",
    notas: "Pago duplicado anulado por tesorería.",
  },
  {
    id: "KP-003",
    estudiante: "María Fernanda Soto",
    carnet: "20206321",
    programa: "Psicología",
    concepto: "Aplicación de beca semestral",
    monto: -1200,
    fecha: "2025-01-30",
    estado: "aplicado",
    metodo: "transferencia",
    referencia: "AJ-2025-02",
    notas: "Beca aprobada por comité académico.",
  },
  {
    id: "KP-004",
    estudiante: "Diego Ramírez",
    carnet: "20217890",
    programa: "Arquitectura",
    concepto: "Pendiente de conciliar - abril",
    monto: 780,
    fecha: "2025-03-01",
    estado: "pendiente",
    metodo: "deposito",
    referencia: "DEP-33210",
    notas: "En espera de conciliación bancaria.",
  },
]

const DEFAULT_STUDENT_QUOTAS: StudentQuotaRecord[] = [
  {
    id: "CT-001",
    estudiante: "Valentina Rojas",
    carnet: "20211023",
    programa: "Ingeniería Comercial",
    cuotasPendientes: 3,
    montoCuota: 680,
    proximaCuota: "2025-03-10",
    estado: "en-mora",
    tipoPlan: "mensual",
    notas: "Solicitó reprogramación con vencimiento el 15 de marzo.",
  },
  {
    id: "CT-002",
    estudiante: "Daniel López",
    carnet: "20209876",
    programa: "Diseño Gráfico",
    cuotasPendientes: 1,
    montoCuota: 520,
    proximaCuota: "2025-02-28",
    estado: "al-dia",
    tipoPlan: "trimestral",
    notas: "Plan trimestral con descuento activo.",
  },
  {
    id: "CT-003",
    estudiante: "Gabriela Hernández",
    carnet: "20213456",
    programa: "Medicina",
    cuotasPendientes: 5,
    montoCuota: 1250,
    proximaCuota: "2025-03-05",
    estado: "restructurado",
    tipoPlan: "personalizado",
    notas: "Plan ajustado por comité de becas desde enero 2025.",
  },
  {
    id: "CT-004",
    estudiante: "Kevin Morales",
    carnet: "20208765",
    programa: "Ingeniería Civil",
    cuotasPendientes: 2,
    montoCuota: 710,
    proximaCuota: "2025-03-12",
    estado: "en-mora",
    tipoPlan: "mensual",
    notas: "Atraso de 12 días, seguimiento por cobranza.",
  },
]

const KARDEX_STATUS_LABELS: Record<KardexStatus, string> = {
  "aplicado": "Aplicado",
  "pendiente": "Pendiente",
  "anulado": "Anulado",
}

const KARDEX_STATUS_CLASSES: Record<KardexStatus, string> = {
  "aplicado": "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  "pendiente": "bg-amber-500/15 text-amber-700 border-amber-500/30",
  "anulado": "bg-red-500/15 text-red-700 border-red-500/30",
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
  deposito: "Depósito",
  efectivo: "Efectivo",
}

const QUOTA_STATUS_LABELS: Record<StudentQuotaStatus, string> = {
  "al-dia": "Al día",
  "en-mora": "En mora",
  "restructurado": "Reestructurado",
}

const QUOTA_STATUS_CLASSES: Record<StudentQuotaStatus, string> = {
  "al-dia": "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  "en-mora": "bg-red-500/15 text-red-600 border-red-500/30",
  "restructurado": "bg-blue-500/15 text-blue-700 border-blue-500/30",
}

const PLAN_TYPE_LABELS: Record<string, string> = {
  mensual: "Mensual",
  trimestral: "Trimestral",
  anual: "Anual",
  personalizado: "Personalizado",
}

type PaymentMethod = keyof typeof PAYMENT_METHOD_LABELS
type PlanType = keyof typeof PLAN_TYPE_LABELS

const currencyFormatter = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
})

const parseAmount = (value: any, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string") {
    const normalized = value.replace(/[^0-9.-]+/g, "")
    const parsed = Number(normalized)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return fallback
}

const parseInteger = (value: any, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value)
  }
  if (typeof value === "string") {
    const parsed = parseInt(value, 10)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }
  return fallback
}

const normalizeDateInput = (value: any) => {
  if (!value) {
    return new Date().toISOString().slice(0, 10)
  }
  if (value instanceof Date) {
    if (!Number.isNaN(value.getTime())) {
      return value.toISOString().slice(0, 10)
    }
    return new Date().toISOString().slice(0, 10)
  }
  if (typeof value === "number") {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10)
    }
    return new Date().toISOString().slice(0, 10)
  }
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) {
      return new Date().toISOString().slice(0, 10)
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed
    }
    const parsed = new Date(trimmed)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10)
    }
    return trimmed.slice(0, 10)
  }
  return new Date().toISOString().slice(0, 10)
}

const formatDisplayDate = (value: string) => {
  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("es-GT")
  }
  return value
}

const normalizeKardexStatus = (status: any): KardexStatus => {
  const value = typeof status === "string" ? status.toLowerCase() : ""
  if (["aplicado", "aplicada", "completado", "completada", "posted", "complete"].includes(value)) {
    return "aplicado"
  }
  if (["pendiente", "pending", "procesando", "en proceso"].includes(value)) {
    return "pendiente"
  }
  if (["anulado", "anulada", "cancelado", "cancelada", "cancelled", "rejected"].includes(value)) {
    return "anulado"
  }
  return "pendiente"
}

const normalizePaymentMethod = (method: any) => {
  const value = typeof method === "string" ? method.toLowerCase() : ""
  if (["transferencia", "transfer", "wire"].includes(value)) {
    return "transferencia"
  }
  if (["tarjeta", "card", "tarjeta de credito", "tarjeta de crédito", "credito", "crédito", "debito", "débito"].includes(value)) {
    return "tarjeta"
  }
  if (["deposito", "depósito", "deposit"].includes(value)) {
    return "deposito"
  }
  if (["efectivo", "cash"].includes(value)) {
    return "efectivo"
  }
  return value || "transferencia"
}

const mapKardexRecords = (data: any): KardexRecord[] => {
  if (!Array.isArray(data)) {
    return []
  }

  return data.map((item, index) => {
    const monto = parseAmount(item?.monto ?? item?.amount ?? item?.valor ?? 0)
    return {
      id: item?.id?.toString?.() ?? item?.codigo ?? `kardex-${index + 1}`,
      estudiante:
        item?.estudiante ?? item?.studentName ?? item?.nombre_estudiante ?? item?.nombre ?? "Estudiante sin nombre",
      carnet: item?.carnet ?? item?.codigo ?? item?.studentCode ?? item?.codigo_estudiante ?? "N/A",
      programa: item?.programa ?? item?.programName ?? item?.carrera ?? "Sin programa",
      concepto:
        item?.concepto ?? item?.descripcion ?? item?.description ?? item?.detalle ?? "Movimiento sin concepto",
      monto,
      fecha: normalizeDateInput(item?.fecha ?? item?.fechaPago ?? item?.date ?? item?.created_at),
      estado: normalizeKardexStatus(item?.estado ?? item?.status),
      metodo: normalizePaymentMethod(item?.metodo ?? item?.metodoPago ?? item?.paymentMethod),
      referencia: item?.referencia ?? item?.reference ?? item?.noDocumento ?? item?.transactionId ?? "-",
      notas: item?.notas ?? item?.observaciones ?? item?.notes ?? "",
    }
  })
}

const normalizeQuotaStatus = (status: any): StudentQuotaStatus => {
  const value = typeof status === "string" ? status.toLowerCase() : ""
  if (["al-dia", "al dia", "aldia", "on-time", "al día"].includes(value)) {
    return "al-dia"
  }
  if (["en-mora", "enmora", "late", "atrasado", "moroso"].includes(value)) {
    return "en-mora"
  }
  if (["restructurado", "restructurada", "reprogramado", "ajustado", "custom"].includes(value)) {
    return "restructurado"
  }
  return "al-dia"
}

const normalizePlanType = (plan: any) => {
  const value = typeof plan === "string" ? plan.toLowerCase() : ""
  if (["mensual", "mensualidad"].includes(value)) {
    return "mensual"
  }
  if (["trimestral"].includes(value)) {
    return "trimestral"
  }
  if (["anual", "anualidad"].includes(value)) {
    return "anual"
  }
  if (["personalizado", "custom", "especial"].includes(value)) {
    return "personalizado"
  }
  return value || "mensual"
}

const mapStudentQuotaRecords = (data: any): StudentQuotaRecord[] => {
  if (!Array.isArray(data)) {
    return []
  }

  return data.map((item, index) => {
    const montoCuota = parseAmount(
      item?.montoCuota ?? item?.installment_amount ?? item?.monto ?? item?.monto_cuota ?? 0,
      0,
    )
    const cuotasPendientes = parseInteger(
      item?.cuotasPendientes ?? item?.pending_installments ?? item?.cuotas ?? item?.cuotas_pendientes,
      0,
    )
    const saldoPendiente = parseAmount(item?.saldoPendiente ?? item?.balance ?? 0, 0)
    const cuotasCalculadas =
      cuotasPendientes > 0
        ? cuotasPendientes
        : montoCuota > 0
          ? Math.max(Math.round(saldoPendiente / montoCuota), 0)
          : 0

    return {
      id: item?.id?.toString?.() ?? item?.estudianteId?.toString?.() ?? `cuota-${index + 1}`,
      estudiante:
        item?.estudiante ?? item?.nombre ?? item?.studentName ?? item?.nombre_estudiante ?? "Estudiante sin nombre",
      carnet: item?.carnet ?? item?.codigo ?? item?.studentCode ?? item?.codigo_estudiante ?? "N/A",
      programa: item?.programa ?? item?.programName ?? item?.carrera ?? "Sin programa",
      cuotasPendientes: cuotasCalculadas,
      montoCuota: montoCuota || 0,
      proximaCuota: normalizeDateInput(
        item?.proximaCuota ?? item?.next_due_date ?? item?.fechaProximoPago ?? item?.proximoPago,
      ),
      estado: normalizeQuotaStatus(
        item?.estadoCuota ?? item?.estado ?? (saldoPendiente > 0 && montoCuota > 0 ? "en-mora" : "al-dia"),
      ),
      tipoPlan: normalizePlanType(item?.plan ?? item?.planPago ?? item?.plan_name ?? item?.tipo_plan),
      notas: item?.notas ?? item?.observaciones ?? item?.notes ?? "",
    }
  })
}


// Componente para generar estados de cuenta
const GeneradorEstadosCuenta = ({ data }: { data: any }) => {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  })
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewStudent, setPreviewStudent] = useState<any | null>(null)

  // Función para manejar la selección de estudiantes
  const handleStudentSelection = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId))
    } else {
      setSelectedStudents([...selectedStudents, studentId])
    }
  }

  // Función para seleccionar todos los estudiantes
  const handleSelectAllStudents = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(data.estudiantes.map((student: any) => student.id))
    } else {
      setSelectedStudents([])
    }
  }

  // Función para filtrar estudiantes
  const filteredStudents = data.estudiantes.filter(
    (student: any) =>
      student.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.carnet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.programa.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Función para generar estados de cuenta
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf')
  const generateAccountStatements = async () => {
    if (selectedStudents.length === 0) {
      alert('Por favor seleccione al menos un estudiante')
      return
    }

    setIsGenerating(true)
    try {
      const blob = await exportFinancialReport(format)
      const url = URL.createObjectURL(blob)
      window.open(url)
    } catch (e) {
      alert('No se pudo generar el reporte')
    } finally {
      setIsGenerating(false)
    }
  }

  // Función para mostrar vista previa
  const showAccountPreview = (student: any) => {
    setPreviewStudent(student)
    setShowPreview(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar estudiante..."
              className="pl-8 w-full md:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filtrar por programa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los programas</SelectItem>
              <SelectItem value="desarrollo">Desarrollo Web</SelectItem>
              <SelectItem value="diseno">Diseño UX/UI</SelectItem>
              <SelectItem value="medicina">Medicina</SelectItem>
              <SelectItem value="psicologia">Psicología</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DatePickerWithRange
          className="w-auto"
          value={dateRange}
          onChange={(range) => {
            if (range && range.from && range.to) {
              setDateRange({ from: range.from, to: range.to })
            }
          }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generación de Estados de Cuenta</CardTitle>
          <CardDescription>Seleccione los estudiantes para generar sus estados de cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    id="select-all"
                    checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                    onCheckedChange={handleSelectAllStudents}
                  />
                </TableHead>
                <TableHead>Estudiante</TableHead>
                <TableHead>Programa</TableHead>
                <TableHead>Saldo Pendiente</TableHead>
                <TableHead>Último Pago</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student: any) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Checkbox
                      id={`select-${student.id}`}
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={() => handleStudentSelection(student.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{student.nombre}</div>
                    <div className="text-xs text-muted-foreground">{student.carnet}</div>
                  </TableCell>
                  <TableCell>{student.programa}</TableCell>
                  <TableCell>
                    {student.saldoPendiente > 0 ? (
                      <span className="text-red-500">Q{student.saldoPendiente.toLocaleString()}</span>
                    ) : (
                      <span className="text-green-500">Q0.00</span>
                    )}
                  </TableCell>
                  <TableCell>{student.ultimoPago}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => showAccountPreview(student)}>
                      <FileText className="h-4 w-4 mr-1" /> Vista Previa
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {isGenerating && (
            <div className="mt-4 text-sm">Generando reporte...</div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">{selectedStudents.length} estudiantes seleccionados</div>
          <div className="flex gap-2">
            <Select value={format} onValueChange={(v) => setFormat(v as 'pdf' | 'excel')}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generateAccountStatements} disabled={isGenerating || selectedStudents.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Generar Estados
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Diálogo de vista previa */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Vista Previa - Estado de Cuenta</DialogTitle>
            <DialogDescription>
              {previewStudent && `Estado de cuenta de ${previewStudent.nombre} (${previewStudent.carnet})`}
            </DialogDescription>
          </DialogHeader>
          {previewStudent && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold">Blue Atlas Academy</h3>
                  <p className="text-sm text-muted-foreground">Estado de Cuenta</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">Fecha de emisión: {new Date().toLocaleDateString()}</p>
                  <p className="text-sm">
                    Período: {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Información del Estudiante</h4>
                  <p className="text-sm">Nombre: {previewStudent.nombre}</p>
                  <p className="text-sm">Carnet: {previewStudent.carnet}</p>
                  <p className="text-sm">Programa: {previewStudent.programa}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Resumen Financiero</h4>
                  <p className="text-sm">
                    Saldo Pendiente:{" "}
                    <span
                      className={
                        previewStudent.saldoPendiente > 0 ? "text-red-500 font-medium" : "text-green-500 font-medium"
                      }
                    >
                      Q{previewStudent.saldoPendiente.toLocaleString()}
                    </span>
                  </p>
                  <p className="text-sm">Último Pago: {previewStudent.ultimoPago}</p>
                  <p className="text-sm">
                    Estado: {previewStudent.saldoPendiente > 0 ? "Con saldo pendiente" : "Al día"}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Detalle de Pagos</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>05/01/2025</TableCell>
                      <TableCell>Mensualidad Enero</TableCell>
                      <TableCell>Q750.00</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Pagado</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>05/02/2025</TableCell>
                      <TableCell>Mensualidad Febrero</TableCell>
                      <TableCell>Q750.00</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Pagado</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>05/03/2025</TableCell>
                      <TableCell>Mensualidad Marzo</TableCell>
                      <TableCell>Q750.00</TableCell>
                      <TableCell>
                        {previewStudent.saldoPendiente > 0 ? (
                          <Badge variant="outline">Pendiente</Badge>
                        ) : (
                          <Badge className="bg-green-500">Pagado</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>05/04/2025</TableCell>
                      <TableCell>Mensualidad Abril</TableCell>
                      <TableCell>Q750.00</TableCell>
                      <TableCell>
                        <Badge variant="outline">Pendiente</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Historial de Transacciones</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead>Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>03/01/2025</TableCell>
                      <TableCell>Pago mensualidad Enero</TableCell>
                      <TableCell>BI-123456</TableCell>
                      <TableCell>Q750.00</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>04/02/2025</TableCell>
                      <TableCell>Pago mensualidad Febrero</TableCell>
                      <TableCell>BI-234567</TableCell>
                      <TableCell>Q750.00</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Información importante</AlertTitle>
                <AlertDescription>
                  Este documento es informativo. Para realizar pagos, utilice los canales oficiales de la institución.
                </AlertDescription>
              </Alert>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Cerrar
            </Button>
            <Button
              onClick={async () => {
                const blob = await exportFinancialReport('pdf')
                const url = URL.createObjectURL(blob)
                window.open(url)
              }}
            >
              <Download className="mr-2 h-4 w-4" /> Descargar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Componente para generar libros contables
const GeneradorLibrosContables = ({ data }: { data: any }) => {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)), // Primer día del mes actual
    to: new Date(),
  })
  const [selectedBooks, setSelectedBooks] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewBook, setPreviewBook] = useState<any | null>(null)
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf')

  // Función para manejar la selección de libros
  const handleBookSelection = (bookId: string) => {
    if (selectedBooks.includes(bookId)) {
      setSelectedBooks(selectedBooks.filter((id) => id !== bookId))
    } else {
      setSelectedBooks([...selectedBooks, bookId])
    }
  }

  // Función para seleccionar todos los libros
  const handleSelectAllBooks = (checked: boolean) => {
    if (checked) {
      setSelectedBooks(data.librosContables.map((book: any) => book.id))
    } else {
      setSelectedBooks([])
    }
  }

  // Función para generar libros contables
  const generateAccountingBooks = async () => {
    if (selectedBooks.length === 0) {
      alert('Por favor seleccione al menos un libro contable')
      return
    }

    setIsGenerating(true)
    try {
      const blob = await exportFinancialReport(format)
      const url = URL.createObjectURL(blob)
      window.open(url)
    } catch (e) {
      alert('No se pudo generar el reporte')
    } finally {
      setIsGenerating(false)
    }
  }

  // Función para mostrar vista previa
  const showBookPreview = (book: any) => {
    setPreviewBook(book)
    setShowPreview(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <Select defaultValue="all">
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Tipo de libro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los libros</SelectItem>
            <SelectItem value="diario">Libro Diario</SelectItem>
            <SelectItem value="mayor">Libro Mayor</SelectItem>
            <SelectItem value="balance">Balance General</SelectItem>
            <SelectItem value="resultados">Estado de Resultados</SelectItem>
          </SelectContent>
        </Select>
        <DatePickerWithRange
          className="w-auto"
          value={dateRange}
          onChange={(range) => {
            if (range && range.from && range.to) {
              setDateRange({ from: range.from, to: range.to })
            }
          }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generación de Libros Contables</CardTitle>
          <CardDescription>Seleccione los libros contables que desea generar</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    id="select-all-books"
                    checked={
                      selectedBooks.length === data.librosContables.length &&
                      data.librosContables.length > 0
                    }
                    onCheckedChange={handleSelectAllBooks}
                  />
                </TableHead>
                <TableHead>Libro Contable</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Última Actualización</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.librosContables.map((book: any) => (
                <TableRow key={book.id}>
                  <TableCell>
                    <Checkbox
                      id={`select-${book.id}`}
                      checked={selectedBooks.includes(book.id)}
                      onCheckedChange={() => handleBookSelection(book.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{book.nombre}</TableCell>
                  <TableCell>{book.descripcion}</TableCell>
                  <TableCell>{book.ultimaActualizacion}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => showBookPreview(book)}>
                      <FileText className="h-4 w-4 mr-1" /> Vista Previa
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {isGenerating && (
            <div className="mt-4 text-sm">Generando reporte...</div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">{selectedBooks.length} libros seleccionados</div>
          <div className="flex gap-2">
            <Select value={format} onValueChange={(v) => setFormat(v as 'pdf' | 'excel')}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generateAccountingBooks} disabled={isGenerating || selectedBooks.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Generar Libros
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Diálogo de vista previa */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Vista Previa - Libro Contable</DialogTitle>
            <DialogDescription>{previewBook && `${previewBook.nombre} - ${previewBook.descripcion}`}</DialogDescription>
          </DialogHeader>
          {previewBook && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold">Blue Atlas Academy</h3>
                  <p className="text-sm text-muted-foreground">{previewBook.nombre}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">Fecha de emisión: {new Date().toLocaleDateString()}</p>
                  <p className="text-sm">
                    Período: {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Separator />

              {previewBook.id === "libro-001" && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Libro Diario - Registro de Transacciones</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Referencia</TableHead>
                        <TableHead>Debe</TableHead>
                        <TableHead>Haber</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.transacciones.map((trans: any) => (
                        <TableRow key={trans.id}>
                          <TableCell>{trans.fecha}</TableCell>
                          <TableCell>{trans.concepto}</TableCell>
                          <TableCell>{trans.estudiante || "N/A"}</TableCell>
                          <TableCell>{trans.tipo === "ingreso" ? `Q${trans.monto.toLocaleString()}` : ""}</TableCell>
                          <TableCell>{trans.tipo === "egreso" ? `Q${trans.monto.toLocaleString()}` : ""}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {previewBook.id === "libro-002" && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Libro Mayor - Resumen de Cuentas</h4>
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-medium mb-1">Cuenta: Ingresos por Mensualidades</h5>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Referencia</TableHead>
                            <TableHead>Debe</TableHead>
                            <TableHead>Haber</TableHead>
                            <TableHead>Saldo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>01/03/2025</TableCell>
                            <TableCell>Pago mensualidad</TableCell>
                            <TableCell></TableCell>
                            <TableCell>Q750.00</TableCell>
                            <TableCell>Q750.00</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>02/03/2025</TableCell>
                            <TableCell>Pago mensualidad</TableCell>
                            <TableCell></TableCell>
                            <TableCell>Q750.00</TableCell>
                            <TableCell>Q1,500.00</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>05/03/2025</TableCell>
                            <TableCell>Pago mensualidad</TableCell>
                            <TableCell></TableCell>
                            <TableCell>Q750.00</TableCell>
                            <TableCell>Q2,250.00</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium mb-1">Cuenta: Gastos Operativos</h5>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Referencia</TableHead>
                            <TableHead>Debe</TableHead>
                            <TableHead>Haber</TableHead>
                            <TableHead>Saldo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>03/03/2025</TableCell>
                            <TableCell>Compra material didáctico</TableCell>
                            <TableCell>Q5,000.00</TableCell>
                            <TableCell></TableCell>
                            <TableCell>Q5,000.00</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}

              {previewBook.id === "libro-003" && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Balance General</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium mb-1">Activos</h5>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cuenta</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>Efectivo y Equivalentes</TableCell>
                            <TableCell className="text-right">Q125,000.00</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Cuentas por Cobrar</TableCell>
                            <TableCell className="text-right">Q45,000.00</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Mobiliario y Equipo</TableCell>
                            <TableCell className="text-right">Q350,000.00</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Total Activos</TableCell>
                            <TableCell className="text-right font-medium">Q520,000.00</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium mb-1">Pasivos y Capital</h5>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cuenta</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>Cuentas por Pagar</TableCell>
                            <TableCell className="text-right">Q35,000.00</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Préstamos Bancarios</TableCell>
                            <TableCell className="text-right">Q150,000.00</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Capital Social</TableCell>
                            <TableCell className="text-right">Q300,000.00</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Utilidades Acumuladas</TableCell>
                            <TableCell className="text-right">Q35,000.00</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Total Pasivos y Capital</TableCell>
                            <TableCell className="text-right font-medium">Q520,000.00</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}

              {previewBook.id === "libro-004" && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Estado de Resultados</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Concepto</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Ingresos</TableCell>
                        <TableCell className="text-right"></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Mensualidades</TableCell>
                        <TableCell className="text-right">Q225,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Matrículas</TableCell>
                        <TableCell className="text-right">Q75,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Otros Ingresos</TableCell>
                        <TableCell className="text-right">Q15,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Total Ingresos</TableCell>
                        <TableCell className="text-right font-medium">Q315,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Gastos</TableCell>
                        <TableCell className="text-right"></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Salarios</TableCell>
                        <TableCell className="text-right">Q150,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Alquiler</TableCell>
                        <TableCell className="text-right">Q45,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Servicios</TableCell>
                        <TableCell className="text-right">Q25,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Material Didáctico</TableCell>
                        <TableCell className="text-right">Q35,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Total Gastos</TableCell>
                        <TableCell className="text-right font-medium">Q255,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Utilidad del Período</TableCell>
                        <TableCell className="text-right font-medium">Q60,000.00</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              {previewBook.id === "libro-005" && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Libro de Inventarios</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Valor Unitario</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>MOB-001</TableCell>
                        <TableCell>Escritorios</TableCell>
                        <TableCell>50</TableCell>
                        <TableCell>Q1,500.00</TableCell>
                        <TableCell className="text-right">Q75,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>MOB-002</TableCell>
                        <TableCell>Sillas</TableCell>
                        <TableCell>100</TableCell>
                        <TableCell>Q500.00</TableCell>
                        <TableCell className="text-right">Q50,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>EQ-001</TableCell>
                        <TableCell>Computadoras</TableCell>
                        <TableCell>30</TableCell>
                        <TableCell>Q5,000.00</TableCell>
                        <TableCell className="text-right">Q150,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>EQ-002</TableCell>
                        <TableCell>Proyectores</TableCell>
                        <TableCell>10</TableCell>
                        <TableCell>Q3,500.00</TableCell>
                        <TableCell className="text-right">Q35,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>MAT-001</TableCell>
                        <TableCell>Material Didáctico</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell className="text-right">Q40,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={4} className="font-medium text-right">
                          Total Inventario
                        </TableCell>
                        <TableCell className="text-right font-medium">Q350,000.00</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Información importante</AlertTitle>
                <AlertDescription>
                  Este documento es una vista previa. Los valores pueden variar en el reporte final.
                </AlertDescription>
              </Alert>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Cerrar
            </Button>
            <Button
              onClick={async () => {
                const blob = await exportFinancialReport('pdf')
                const url = URL.createObjectURL(blob)
                window.open(url)
              }}
            >
              <Download className="mr-2 h-4 w-4" /> Descargar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const MantenimientoKardexPagos = ({ initialRecords }: { initialRecords?: KardexRecord[] }) => {
  const fallbackRecords = useMemo(
    () => (Array.isArray(initialRecords) && initialRecords.length > 0 ? initialRecords : DEFAULT_KARDEX_RECORDS),
    [initialRecords],
  )

  const [records, setRecords] = useState<KardexRecord[]>(() => fallbackRecords.map((record) => ({ ...record })))
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"todos" | KardexStatus>("todos")
  const [methodFilter, setMethodFilter] = useState<"todos" | PaymentMethod>("todos")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<KardexRecord | null>(null)

  useEffect(() => {
    setRecords(fallbackRecords.map((record) => ({ ...record })))
  }, [fallbackRecords])

  const totals = useMemo(
    () => ({
      applied: records.filter((record) => record.estado === "aplicado").length,
      pending: records.filter((record) => record.estado === "pendiente").length,
      annulled: records.filter((record) => record.estado === "anulado").length,
      totalAmount: records.reduce((acc, record) => acc + record.monto, 0),
    }),
    [records],
  )

  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return records.filter((record) => {
      const matchesSearch =
        query.length === 0 ||
        [record.estudiante, record.carnet, record.programa, record.concepto, record.referencia].some((field) =>
          field.toLowerCase().includes(query),
        )
      const matchesStatus = statusFilter === "todos" || record.estado === statusFilter
      const matchesMethod = methodFilter === "todos" || record.metodo === methodFilter
      return matchesSearch && matchesStatus && matchesMethod
    })
  }, [records, searchTerm, statusFilter, methodFilter])

  const handleOpenEdit = (record: KardexRecord) => {
    setEditingRecord({ ...record })
    setIsDialogOpen(true)
  }

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setEditingRecord(null)
    }
  }

  const handleSaveRecord = () => {
    if (!editingRecord) return

    setRecords((prev) => {
      const exists = prev.some((record) => record.id === editingRecord.id)
      if (exists) {
        return prev.map((record) => (record.id === editingRecord.id ? editingRecord : record))
      }
      return [editingRecord, ...prev]
    })

    setIsDialogOpen(false)
    setEditingRecord(null)
  }

  const handleResetFilters = () => {
    setSearchTerm("")
    setStatusFilter("todos")
    setMethodFilter("todos")
    setRecords(fallbackRecords.map((record) => ({ ...record })))
  }

  return (
    <div className="space-y-6">
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Mantenimiento del kardex de pagos</CardTitle>
          <CardDescription>
            Revise y ajuste los movimientos aplicados al kardex de pagos desde el panel administrativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-muted bg-background p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Movimientos registrados</p>
                  <p className="text-2xl font-semibold">{records.length}</p>
                </div>
                <ListChecks className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <div className="rounded-lg border border-muted bg-background p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Monto neto</p>
                  <p className="text-2xl font-semibold">{currencyFormatter.format(totals.totalAmount)}</p>
                </div>
                <Wallet className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <div className="rounded-lg border border-muted bg-background p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Aplicados</p>
                  <p className="text-2xl font-semibold">{totals.applied}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <div className="rounded-lg border border-muted bg-background p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-semibold">{totals.pending}</p>
                </div>
                <CalendarClock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Aplicados: {totals.applied}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-4 w-4 text-amber-500" /> Pendientes: {totals.pending}
            </span>
            <span className="inline-flex items-center gap-1">
              <XCircle className="h-4 w-4 text-red-500" /> Anulados: {totals.annulled}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por estudiante, concepto o referencia"
              className="pl-8 sm:w-[280px]"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "todos" | KardexStatus)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="aplicado">Aplicados</SelectItem>
              <SelectItem value="pendiente">Pendientes</SelectItem>
              <SelectItem value="anulado">Anulados</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={methodFilter}
            onValueChange={(value) => setMethodFilter(value as "todos" | PaymentMethod)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Método de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los métodos</SelectItem>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={handleResetFilters} className="w-full md:w-auto">
          <RefreshCw className="mr-2 h-4 w-4" /> Restablecer filtros
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movimientos registrados</CardTitle>
          <CardDescription>
            Seleccione un movimiento para modificarlo o actualice su estado dentro del kardex.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="font-medium">{record.estudiante}</div>
                      <div className="text-xs text-muted-foreground">
                        {record.carnet} · {record.programa}
                      </div>
                      {record.notas ? (
                        <div className="text-xs text-muted-foreground">{record.notas}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{record.concepto}</div>
                      <div className="text-xs text-muted-foreground">Ref. {record.referencia}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {PAYMENT_METHOD_LABELS[record.metodo] ?? record.metodo}
                      </Badge>
                    </TableCell>
                    <TableCell>{currencyFormatter.format(record.monto)}</TableCell>
                    <TableCell>{formatDisplayDate(record.fecha)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("capitalize", KARDEX_STATUS_CLASSES[record.estado])}
                      >
                        {KARDEX_STATUS_LABELS[record.estado]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(record)}>
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    No se encontraron movimientos para los filtros seleccionados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar movimiento del kardex</DialogTitle>
            <DialogDescription>
              Ajuste la información del movimiento para mantener el kardex sincronizado con los pagos reales.
            </DialogDescription>
          </DialogHeader>
          {editingRecord ? (
            <div className="grid gap-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="kardex-estudiante">Estudiante</Label>
                  <Input
                    id="kardex-estudiante"
                    value={editingRecord.estudiante}
                    onChange={(event) =>
                      setEditingRecord((prev) =>
                        prev ? { ...prev, estudiante: event.target.value } : prev,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kardex-carnet">Carnet</Label>
                  <Input
                    id="kardex-carnet"
                    value={editingRecord.carnet}
                    onChange={(event) =>
                      setEditingRecord((prev) => (prev ? { ...prev, carnet: event.target.value } : prev))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="kardex-programa">Programa</Label>
                  <Input
                    id="kardex-programa"
                    value={editingRecord.programa}
                    onChange={(event) =>
                      setEditingRecord((prev) =>
                        prev ? { ...prev, programa: event.target.value } : prev,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kardex-concepto">Concepto</Label>
                  <Input
                    id="kardex-concepto"
                    value={editingRecord.concepto}
                    onChange={(event) =>
                      setEditingRecord((prev) =>
                        prev ? { ...prev, concepto: event.target.value } : prev,
                      )
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="kardex-monto">Monto</Label>
                  <Input
                    id="kardex-monto"
                    type="number"
                    step="0.01"
                    value={editingRecord.monto}
                    onChange={(event) =>
                      setEditingRecord((prev) =>
                        prev
                          ? { ...prev, monto: Number(event.target.value) || 0 }
                          : prev,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kardex-fecha">Fecha</Label>
                  <Input
                    id="kardex-fecha"
                    type="date"
                    value={editingRecord.fecha}
                    onChange={(event) =>
                      setEditingRecord((prev) =>
                        prev ? { ...prev, fecha: normalizeDateInput(event.target.value) } : prev,
                      )
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="kardex-metodo">Método de pago</Label>
                  <Select
                    value={editingRecord.metodo}
                    onValueChange={(value) =>
                      setEditingRecord((prev) =>
                        prev ? { ...prev, metodo: value as PaymentMethod } : prev,
                      )
                    }
                  >
                    <SelectTrigger id="kardex-metodo">
                      <SelectValue placeholder="Seleccione un método" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kardex-estado">Estado</Label>
                  <Select
                    value={editingRecord.estado}
                    onValueChange={(value) =>
                      setEditingRecord((prev) =>
                        prev ? { ...prev, estado: value as KardexStatus } : prev,
                      )
                    }
                  >
                    <SelectTrigger id="kardex-estado">
                      <SelectValue placeholder="Seleccione un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aplicado">Aplicado</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="anulado">Anulado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="kardex-referencia">Referencia</Label>
                <Input
                  id="kardex-referencia"
                  value={editingRecord.referencia}
                  onChange={(event) =>
                    setEditingRecord((prev) => (prev ? { ...prev, referencia: event.target.value } : prev))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kardex-notas">Notas internas</Label>
                <Textarea
                  id="kardex-notas"
                  value={editingRecord.notas ?? ""}
                  onChange={(event) =>
                    setEditingRecord((prev) => (prev ? { ...prev, notas: event.target.value } : prev))
                  }
                  placeholder="Observaciones relevantes para el equipo financiero"
                />
              </div>
            </div>
          ) : null}
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => handleDialogChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveRecord}>
              <Save className="mr-2 h-4 w-4" /> Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const MantenimientoCuotasEstudiantes = ({ initialQuotas }: { initialQuotas?: StudentQuotaRecord[] }) => {
  const fallbackQuotas = useMemo(
    () => (Array.isArray(initialQuotas) && initialQuotas.length > 0 ? initialQuotas : DEFAULT_STUDENT_QUOTAS),
    [initialQuotas],
  )

  const [records, setRecords] = useState<StudentQuotaRecord[]>(() => fallbackQuotas.map((quota) => ({ ...quota })))
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"todos" | StudentQuotaStatus>("todos")
  const [planFilter, setPlanFilter] = useState<"todos" | PlanType>("todos")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingQuota, setEditingQuota] = useState<StudentQuotaRecord | null>(null)

  useEffect(() => {
    setRecords(fallbackQuotas.map((quota) => ({ ...quota })))
  }, [fallbackQuotas])

  const totals = useMemo(
    () => ({
      total: records.length,
      totalPendiente: records.reduce((acc, quota) => acc + quota.cuotasPendientes * quota.montoCuota, 0),
      enMora: records.filter((quota) => quota.estado === "en-mora").length,
      reestructurados: records.filter((quota) => quota.estado === "restructurado").length,
    }),
    [records],
  )

  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return records.filter((quota) => {
      const matchesSearch =
        query.length === 0 ||
        [quota.estudiante, quota.carnet, quota.programa].some((field) => field.toLowerCase().includes(query))
      const matchesStatus = statusFilter === "todos" || quota.estado === statusFilter
      const matchesPlan = planFilter === "todos" || quota.tipoPlan === planFilter
      return matchesSearch && matchesStatus && matchesPlan
    })
  }, [records, searchTerm, statusFilter, planFilter])

  const handleOpenEdit = (quota: StudentQuotaRecord) => {
    setEditingQuota({ ...quota })
    setIsDialogOpen(true)
  }

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setEditingQuota(null)
    }
  }

  const handleSaveQuota = () => {
    if (!editingQuota) return

    setRecords((prev) =>
      prev.map((quota) => (quota.id === editingQuota.id ? { ...editingQuota } : quota)),
    )

    setIsDialogOpen(false)
    setEditingQuota(null)
  }

  const handleResetFilters = () => {
    setSearchTerm("")
    setStatusFilter("todos")
    setPlanFilter("todos")
    setRecords(fallbackQuotas.map((quota) => ({ ...quota })))
  }

  return (
    <div className="space-y-6">
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Mantenimiento de cuotas por estudiante</CardTitle>
          <CardDescription>
            Actualice planes de pago, fechas y montos de las cuotas asignadas a cada estudiante.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-muted bg-background p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Estudiantes activos</p>
                  <p className="text-2xl font-semibold">{totals.total}</p>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <div className="rounded-lg border border-muted bg-background p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Saldo estimado</p>
                  <p className="text-2xl font-semibold">{currencyFormatter.format(totals.totalPendiente)}</p>
                </div>
                <Wallet className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <div className="rounded-lg border border-muted bg-background p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">En mora</p>
                  <p className="text-2xl font-semibold">{totals.enMora}</p>
                </div>
                <CalendarClock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            <div className="rounded-lg border border-muted bg-background p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Planes reestructurados</p>
                  <p className="text-2xl font-semibold">{totals.reestructurados}</p>
                </div>
                <RefreshCw className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por estudiante, carnet o programa"
              className="pl-8 sm:w-[260px]"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "todos" | StudentQuotaStatus)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="al-dia">Al día</SelectItem>
              <SelectItem value="en-mora">En mora</SelectItem>
              <SelectItem value="restructurado">Reestructurados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={planFilter} onValueChange={(value) => setPlanFilter(value as "todos" | PlanType)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Tipo de plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los planes</SelectItem>
              {Object.entries(PLAN_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={handleResetFilters} className="w-full md:w-auto">
          <RefreshCw className="mr-2 h-4 w-4" /> Restablecer filtros
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cuotas por estudiante</CardTitle>
          <CardDescription>
            Gestione los ajustes de cuotas pendientes, próximas fechas de pago y estados de cada plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Plan de pago</TableHead>
                <TableHead>Cuotas pendientes</TableHead>
                <TableHead>Próxima cuota</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((quota) => {
                  const totalEstimado = quota.cuotasPendientes * quota.montoCuota
                  return (
                    <TableRow key={quota.id}>
                      <TableCell>
                        <div className="font-medium">{quota.estudiante}</div>
                        <div className="text-xs text-muted-foreground">
                          {quota.carnet} · {quota.programa}
                        </div>
                        {quota.notas ? (
                          <div className="text-xs text-muted-foreground">{quota.notas}</div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {PLAN_TYPE_LABELS[quota.tipoPlan] ?? quota.tipoPlan}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Monto: {currencyFormatter.format(quota.montoCuota)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{quota.cuotasPendientes}</div>
                        <div className="text-xs text-muted-foreground">
                          Estimado: {currencyFormatter.format(totalEstimado)}
                        </div>
                      </TableCell>
                      <TableCell>{formatDisplayDate(quota.proximaCuota)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("capitalize", QUOTA_STATUS_CLASSES[quota.estado])}
                        >
                          {QUOTA_STATUS_LABELS[quota.estado]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(quota)}>
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No se encontraron cuotas con los filtros seleccionados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar plan de cuotas</DialogTitle>
            <DialogDescription>
              Modifique los montos, fechas o notas de seguimiento asociadas al plan del estudiante seleccionado.
            </DialogDescription>
          </DialogHeader>
          {editingQuota ? (
            <div className="grid gap-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cuota-estudiante">Estudiante</Label>
                  <Input
                    id="cuota-estudiante"
                    value={editingQuota.estudiante}
                    onChange={(event) =>
                      setEditingQuota((prev) =>
                        prev ? { ...prev, estudiante: event.target.value } : prev,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuota-carnet">Carnet</Label>
                  <Input
                    id="cuota-carnet"
                    value={editingQuota.carnet}
                    onChange={(event) =>
                      setEditingQuota((prev) => (prev ? { ...prev, carnet: event.target.value } : prev))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cuota-programa">Programa</Label>
                  <Input
                    id="cuota-programa"
                    value={editingQuota.programa}
                    onChange={(event) =>
                      setEditingQuota((prev) =>
                        prev ? { ...prev, programa: event.target.value } : prev,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuota-plan">Tipo de plan</Label>
                  <Select
                    value={editingQuota.tipoPlan}
                    onValueChange={(value) =>
                      setEditingQuota((prev) =>
                        prev ? { ...prev, tipoPlan: value as PlanType } : prev,
                      )
                    }
                  >
                    <SelectTrigger id="cuota-plan">
                      <SelectValue placeholder="Seleccione un plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PLAN_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cuota-monto">Monto por cuota</Label>
                  <Input
                    id="cuota-monto"
                    type="number"
                    step="0.01"
                    value={editingQuota.montoCuota}
                    onChange={(event) =>
                      setEditingQuota((prev) =>
                        prev
                          ? { ...prev, montoCuota: Number(event.target.value) || 0 }
                          : prev,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuota-pendientes">Cuotas pendientes</Label>
                  <Input
                    id="cuota-pendientes"
                    type="number"
                    min={0}
                    value={editingQuota.cuotasPendientes}
                    onChange={(event) =>
                      setEditingQuota((prev) =>
                        prev
                          ? { ...prev, cuotasPendientes: Math.max(Number(event.target.value) || 0, 0) }
                          : prev,
                      )
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cuota-proxima">Próxima fecha de pago</Label>
                  <Input
                    id="cuota-proxima"
                    type="date"
                    value={editingQuota.proximaCuota}
                    onChange={(event) =>
                      setEditingQuota((prev) =>
                        prev ? { ...prev, proximaCuota: normalizeDateInput(event.target.value) } : prev,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuota-estado">Estado del plan</Label>
                  <Select
                    value={editingQuota.estado}
                    onValueChange={(value) =>
                      setEditingQuota((prev) =>
                        prev ? { ...prev, estado: value as StudentQuotaStatus } : prev,
                      )
                    }
                  >
                    <SelectTrigger id="cuota-estado">
                      <SelectValue placeholder="Seleccione un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="al-dia">Al día</SelectItem>
                      <SelectItem value="en-mora">En mora</SelectItem>
                      <SelectItem value="restructurado">Reestructurado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cuota-notas">Notas internas</Label>
                <Textarea
                  id="cuota-notas"
                  value={editingQuota.notas ?? ""}
                  onChange={(event) =>
                    setEditingQuota((prev) => (prev ? { ...prev, notas: event.target.value } : prev))
                  }
                  placeholder="Detalle acuerdos, compromisos o seguimientos pendientes"
                />
              </div>
            </div>
          ) : null}
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => handleDialogChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveQuota}>
              <Save className="mr-2 h-4 w-4" /> Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function ReportesFinancieros() {
  const [reportesData, setReportesData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        
        
      } catch (e) {
        console.error('Error fetching financial reports', e)
        setReportesData({})
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const safeReportesData = useMemo(() => {
    const data = reportesData ?? {}
    return {
      ...data,
      estudiantes: Array.isArray(data?.estudiantes) ? data.estudiantes : [],
      librosContables: Array.isArray(data?.librosContables) ? data.librosContables : [],
      tiposReporte: Array.isArray(data?.tiposReporte) ? data.tiposReporte : [],
    }
  }, [reportesData])

  const kardexRecords = useMemo(() => {
    const sources = [
      reportesData?.kardexPagos,
      reportesData?.kardex,
      reportesData?.movimientosKardex,
      reportesData?.movimientos,
    ]

    for (const source of sources) {
      const collection = Array.isArray(source)
        ? source
        : Array.isArray(source?.data)
          ? source.data
          : undefined
      const mapped = mapKardexRecords(collection)
      if (mapped.length > 0) {
        return mapped
      }
    }

    return DEFAULT_KARDEX_RECORDS
  }, [reportesData])

  const cuotasRecords = useMemo(() => {
    const sources = [
      reportesData?.cuotasEstudiantes,
      reportesData?.cuotas,
      reportesData?.planesPago,
      reportesData?.planPagos,
      reportesData?.estudiantes,
    ]

    for (const source of sources) {
      const collection = Array.isArray(source)
        ? source
        : Array.isArray(source?.data)
          ? source.data
          : undefined
      const mapped = mapStudentQuotaRecords(collection)
      if (mapped.length > 0) {
        return mapped
      }
    }

    return DEFAULT_STUDENT_QUOTAS
  }, [reportesData])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p>Cargando reportes...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mantenimientos financieros</h2>
        <p className="text-muted-foreground">
          Administre el kardex de pagos, las cuotas de los estudiantes y la generación de reportes oficiales.
        </p>
      </div>

      <Tabs defaultValue="kardex" className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="kardex" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            <span>Kardex de pagos</span>
          </TabsTrigger>
          <TabsTrigger value="cuotas" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <span>Cuotas por estudiante</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kardex">
          <MantenimientoKardexPagos initialRecords={kardexRecords} />
        </TabsContent>

        <TabsContent value="cuotas">
          <MantenimientoCuotasEstudiantes initialQuotas={cuotasRecords} />
        </TabsContent>

      </Tabs>
    </div>
  )
}

