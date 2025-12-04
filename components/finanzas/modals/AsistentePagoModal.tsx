"use client"

import { useCallback, useEffect, useState, useMemo, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Plus,
  Search,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Building2,
  CreditCard,
  Users,
  Receipt,
  Banknote,
} from "lucide-react"
import {
  crearPagoAsistido,
  getCuotasPendientesAsistente,
  getEstudiantesProgramaSelect,
  type EstudianteProgramaSelect,
  type PagoDistribucionLinea,
  type PagoAsistidoPayload,
  type PagoAsistidoResponse,
  type CuotaPendienteAsistente,
} from "@/services/mantenimientos"

// ==================== TIPOS ====================

interface AsistentePagoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface LineaDistribucion {
  id: string // ID temporal para el frontend
  estudiante_programa_id: number | null
  estudiante_label: string
  cuota_id: number | null
  cuota_label: string
  crear_cuota: boolean
  cuota_nueva?: {
    numero_cuota?: number
    concepto?: string
    fecha_vencimiento?: string
  }
  monto: number
  cuotasPendientes?: CuotaPendienteAsistente[]
  loadingCuotas?: boolean
}

type WizardStep = 1 | 2 | 3 | 4

const METODOS_PAGO = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia Bancaria" },
  { value: "cheque", label: "Cheque" },
  { value: "tarjeta", label: "Tarjeta de Crédito/Débito" },
  { value: "deposito", label: "Depósito Bancario" },
  { value: "otro", label: "Otro" },
]

const BANCOS_GUATEMALA = [
  "Banco Industrial",
  "Banrural",
  "G&T Continental",
  "BAC Credomatic",
  "Banco de América Central",
  "Banco Agromercantil",
  "Banco Promerica",
  "Banco Internacional",
  "VivaBank",
  "Banco Inmobiliario",
  "Banco de los Trabajadores",
  "Banco INV",
  "Otro",
]

// ==================== COMPONENTE PRINCIPAL ====================

export function AsistentePagoModal({ open, onOpenChange, onSuccess }: AsistentePagoModalProps) {
  const { toast } = useToast()

  // Estado del wizard
  const [currentStep, setCurrentStep] = useState<WizardStep>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resultado, setResultado] = useState<PagoAsistidoResponse | null>(null)

  // Datos del paso 1 (Datos generales)
  const [metodoPago, setMetodoPago] = useState("")
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split("T")[0])
  const [numeroBoleta, setNumeroBoleta] = useState("")
  const [banco, setBanco] = useState("")
  const [montoTotal, setMontoTotal] = useState<number>(0)
  const [observaciones, setObservaciones] = useState("")
  const [pagoMultiple, setPagoMultiple] = useState(false)

  // Datos del paso 1.5 (Distribución)
  const [lineasDistribucion, setLineasDistribucion] = useState<LineaDistribucion[]>([])

  // Opciones de conciliación
  const [crearConciliacion, setCrearConciliacion] = useState(true)

  // Catálogo de estudiantes
  const [estudiantes, setEstudiantes] = useState<EstudianteProgramaSelect[]>([])
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false)
  const [searchEstudiante, setSearchEstudiante] = useState("")
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)

  // ==================== EFECTOS ====================

  // Cargar estudiantes iniciales al abrir el modal
  useEffect(() => {
    if (open) {
      loadEstudiantes("")
    }
  }, [open])

  // Debounce para búsqueda en backend
  useEffect(() => {
    if (!open) return

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }

    searchDebounceRef.current = setTimeout(() => {
      loadEstudiantes(searchEstudiante)
    }, 300) // 300ms de debounce

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
      }
    }
  }, [searchEstudiante, open])

  // Reset al cerrar
  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  // Agregar línea inicial si no hay ninguna
  useEffect(() => {
    if (lineasDistribucion.length === 0) {
      agregarLinea()
    }
  }, [])

  // ==================== FUNCIONES ====================

  const loadEstudiantes = async (search: string) => {
    setLoadingEstudiantes(true)
    try {
      const response = await getEstudiantesProgramaSelect(search)
      setEstudiantes(response.data || [])
    } catch (error) {
      console.error("Error cargando estudiantes:", error)
      // Solo mostrar error si no es una búsqueda (puede ser cancelada)
      if (!search) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los estudiantes",
          variant: "destructive",
        })
      }
    } finally {
      setLoadingEstudiantes(false)
    }
  }

  const resetForm = () => {
    setCurrentStep(1)
    setMetodoPago("")
    setFechaPago(new Date().toISOString().split("T")[0])
    setNumeroBoleta("")
    setBanco("")
    setMontoTotal(0)
    setObservaciones("")
    setPagoMultiple(false)
    setLineasDistribucion([])
    setCrearConciliacion(true)
    setResultado(null)
    setIsSubmitting(false)
  }

  const agregarLinea = () => {
    const nuevaLinea: LineaDistribucion = {
      id: `linea-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      estudiante_programa_id: null,
      estudiante_label: "",
      cuota_id: null,
      cuota_label: "",
      crear_cuota: false,
      monto: 0,
    }
    setLineasDistribucion((prev) => [...prev, nuevaLinea])
  }

  const eliminarLinea = (id: string) => {
    if (lineasDistribucion.length <= 1) return
    setLineasDistribucion((prev) => prev.filter((l) => l.id !== id))
  }

  const actualizarLinea = (id: string, updates: Partial<LineaDistribucion>) => {
    setLineasDistribucion((prev) =>
      prev.map((linea) => (linea.id === id ? { ...linea, ...updates } : linea))
    )
  }

  const cargarCuotasPendientes = async (lineaId: string, estudianteProgramaId: number) => {
    actualizarLinea(lineaId, { loadingCuotas: true })

    try {
      const response = await getCuotasPendientesAsistente(estudianteProgramaId)
      actualizarLinea(lineaId, {
        cuotasPendientes: response.cuotas_pendientes,
        loadingCuotas: false,
      })
    } catch (error) {
      console.error("Error cargando cuotas:", error)
      actualizarLinea(lineaId, {
        cuotasPendientes: [],
        loadingCuotas: false,
      })
    }
  }

  const handleSeleccionarEstudiante = (lineaId: string, estudianteProgramaId: string) => {
    const epId = parseInt(estudianteProgramaId)
    const estudiante = estudiantes.find((e) => e.estudiante_programa_id === epId)

    actualizarLinea(lineaId, {
      estudiante_programa_id: epId,
      estudiante_label: estudiante?.label || "",
      cuota_id: null,
      cuota_label: "",
      cuotasPendientes: undefined,
    })

    // Cargar cuotas pendientes del estudiante
    cargarCuotasPendientes(lineaId, epId)
  }

  const handleSeleccionarCuota = (lineaId: string, cuotaId: string, linea: LineaDistribucion) => {
    if (cuotaId === "nueva") {
      actualizarLinea(lineaId, {
        cuota_id: null,
        cuota_label: "Nueva cuota",
        crear_cuota: true,
        cuota_nueva: {
          concepto: `Cuota adicional`,
          fecha_vencimiento: fechaPago,
        },
      })
    } else {
      const cuota = linea.cuotasPendientes?.find((c) => c.id === parseInt(cuotaId))
      actualizarLinea(lineaId, {
        cuota_id: parseInt(cuotaId),
        cuota_label: cuota ? `Cuota #${cuota.numero_cuota} - Q${cuota.saldo_pendiente.toFixed(2)}` : "",
        crear_cuota: false,
        monto: cuota?.saldo_pendiente || linea.monto,
        cuota_nueva: undefined,
      })
    }
  }

  // Validación de cada paso
  const validarPaso1 = (): boolean => {
    if (!metodoPago) {
      toast({ title: "Error", description: "Seleccione un método de pago", variant: "destructive" })
      return false
    }
    if (!fechaPago) {
      toast({ title: "Error", description: "Ingrese la fecha de pago", variant: "destructive" })
      return false
    }
    if (montoTotal <= 0) {
      toast({ title: "Error", description: "El monto total debe ser mayor a 0", variant: "destructive" })
      return false
    }
    return true
  }

  const validarPaso2 = (): boolean => {
    const lineasValidas = lineasDistribucion.filter(
      (l) => l.estudiante_programa_id && l.monto > 0
    )

    if (lineasValidas.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un estudiante con monto válido",
        variant: "destructive",
      })
      return false
    }

    const sumaMontos = lineasValidas.reduce((sum, l) => sum + l.monto, 0)
    if (Math.abs(sumaMontos - montoTotal) > 0.01) {
      toast({
        title: "Error",
        description: `La suma de montos (Q${sumaMontos.toFixed(2)}) no coincide con el total (Q${montoTotal.toFixed(2)})`,
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleSiguiente = () => {
    if (currentStep === 1 && !validarPaso1()) return
    if (currentStep === 2 && !validarPaso2()) return

    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as WizardStep)
    }
  }

  const handleAnterior = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep)
    }
  }

  const handleFinalizar = async () => {
    setIsSubmitting(true)

    try {
      const distribucion: PagoDistribucionLinea[] = lineasDistribucion
        .filter((l) => l.estudiante_programa_id && l.monto > 0)
        .map((l) => ({
          estudiante_programa_id: l.estudiante_programa_id!,
          cuota_id: l.cuota_id,
          crear_cuota: l.crear_cuota,
          cuota_nueva: l.cuota_nueva,
          monto: l.monto,
        }))

      const payload: PagoAsistidoPayload = {
        metodo_pago: metodoPago,
        fecha_pago: fechaPago,
        numero_boleta: numeroBoleta || undefined,
        banco: banco || undefined,
        monto_total: montoTotal,
        observaciones: observaciones || undefined,
        distribucion,
        crear_conciliacion: crearConciliacion,
        conciliacion_automatica: true,
      }

      const response = await crearPagoAsistido(payload)
      setResultado(response)
      setCurrentStep(4)

      toast({
        title: "¡Éxito!",
        description: `Se crearon ${response.resumen.kardex_creados} movimiento(s) de pago`,
      })

      onSuccess?.()
    } catch (error: any) {
      console.error("Error al procesar pago:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al procesar el pago",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ==================== CÁLCULOS ====================

  const sumaDistribucion = useMemo(() => {
    return lineasDistribucion.reduce((sum, l) => sum + (l.monto || 0), 0)
  }, [lineasDistribucion])

  const diferenciaMontos = useMemo(() => {
    return montoTotal - sumaDistribucion
  }, [montoTotal, sumaDistribucion])

  // ==================== RENDER ====================

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-4 md:mb-6 px-2">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={cn(
              "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-semibold text-xs md:text-sm transition-all",
              currentStep === step
                ? "bg-primary text-primary-foreground ring-2 md:ring-4 ring-primary/20"
                : currentStep > step
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {currentStep > step ? <Check className="h-4 w-4 md:h-5 md:w-5" /> : step}
          </div>
          {step < 4 && (
            <div
              className={cn(
                "w-6 md:w-16 h-1 mx-1 md:mx-2 rounded transition-all",
                currentStep > step ? "bg-green-500" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  )

  const renderPaso1 = () => (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <div className="space-y-2">
          <Label htmlFor="metodo_pago">
            Método de Pago <span className="text-destructive">*</span>
          </Label>
          <Select value={metodoPago} onValueChange={setMetodoPago}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione método" />
            </SelectTrigger>
            <SelectContent>
              {METODOS_PAGO.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fecha_pago">
            Fecha de Pago <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fecha_pago"
            type="date"
            value={fechaPago}
            onChange={(e) => setFechaPago(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="numero_boleta">Número de Boleta / Referencia</Label>
          <Input
            id="numero_boleta"
            placeholder="Ej: REC-2024-001"
            value={numeroBoleta}
            onChange={(e) => setNumeroBoleta(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="banco">Banco</Label>
          <Select value={banco} onValueChange={setBanco}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione banco (opcional)" />
            </SelectTrigger>
            <SelectContent>
              {BANCOS_GUATEMALA.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="monto_total">
          Monto Total del Pago <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Q</span>
          <Input
            id="monto_total"
            type="number"
            step="0.01"
            min="0.01"
            className="pl-8"
            placeholder="0.00"
            value={montoTotal || ""}
            onChange={(e) => setMontoTotal(parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
        <Checkbox
          id="pago_multiple"
          checked={pagoMultiple}
          onCheckedChange={(checked) => setPagoMultiple(checked === true)}
        />
        <Label htmlFor="pago_multiple" className="cursor-pointer">
          Este pago se distribuye entre <strong>varios estudiantes o cuotas</strong>
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observaciones">Observaciones</Label>
        <Textarea
          id="observaciones"
          placeholder="Notas adicionales sobre el pago..."
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={2}
        />
      </div>
    </div>
  )

  const renderPaso2 = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold">Distribución del Pago</h4>
          <p className="text-sm text-muted-foreground">
            Asigne el monto a cada estudiante y cuota
          </p>
        </div>
        {pagoMultiple && (
          <Button variant="outline" size="sm" onClick={agregarLinea}>
            <Plus className="h-4 w-4 mr-1" /> Agregar línea
          </Button>
        )}
      </div>

      {/* Indicador de balance */}
      <Alert
        variant={Math.abs(diferenciaMontos) < 0.01 ? "default" : "destructive"}
        className={cn(
          Math.abs(diferenciaMontos) < 0.01 && "border-green-500 bg-green-50 dark:bg-green-950"
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2">
          <div className="flex items-center gap-2">
            {Math.abs(diferenciaMontos) < 0.01 ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span className="text-sm">
              Monto total: <strong>Q {montoTotal.toFixed(2)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 ml-6 sm:ml-0">
            <span className="text-sm">
              Distribuido: <strong>Q {sumaDistribucion.toFixed(2)}</strong>
            </span>
            {Math.abs(diferenciaMontos) >= 0.01 && (
              <Badge variant="destructive" className="text-xs">
                Dif: Q {diferenciaMontos.toFixed(2)}
              </Badge>
            )}
          </div>
        </div>
      </Alert>

      {/* Distribución - Cards en móvil, Tabla en desktop */}
      <div className="space-y-3">
        {lineasDistribucion.map((linea, index) => (
          <div key={linea.id} className="border rounded-lg p-3 sm:p-4 space-y-3 bg-card">
            {/* Header con número y botón eliminar */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Línea {index + 1}
              </span>
              {pagoMultiple && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => eliminarLinea(linea.id)}
                  disabled={lineasDistribucion.length <= 1}
                  className="h-8 px-2"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>

            {/* Estudiante */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Estudiante</label>
              <Select
                value={linea.estudiante_programa_id?.toString() || ""}
                onValueChange={(value) => handleSeleccionarEstudiante(linea.id, value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Buscar estudiante..." />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Buscar por nombre o carnet..."
                      value={searchEstudiante}
                      onChange={(e) => setSearchEstudiante(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                  {loadingEstudiantes ? (
                    <div className="p-4 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      <p className="text-xs text-muted-foreground mt-1">Buscando...</p>
                    </div>
                  ) : estudiantes.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      {searchEstudiante ? "No se encontraron estudiantes" : "Escriba para buscar"}
                    </div>
                  ) : (
                    estudiantes.map((est) => (
                      <SelectItem
                        key={est.estudiante_programa_id}
                        value={est.estudiante_programa_id.toString()}
                      >
                        <span className="truncate">{est.label}</span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Cuota y Monto en una fila en pantallas más grandes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Cuota */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Cuota</label>
                {linea.estudiante_programa_id ? (
                  linea.loadingCuotas ? (
                    <div className="flex items-center gap-2 text-muted-foreground h-9 px-3 border rounded-md">
                      <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
                    </div>
                  ) : (
                    <Select
                      value={linea.crear_cuota ? "nueva" : linea.cuota_id?.toString() || ""}
                      onValueChange={(value) => handleSeleccionarCuota(linea.id, value, linea)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar cuota" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nueva">
                          <span className="flex items-center gap-2 text-blue-600">
                            <Plus className="h-3 w-3" /> Crear cuota nueva
                          </span>
                        </SelectItem>
                        {linea.cuotasPendientes && linea.cuotasPendientes.length > 0 ? (
                          linea.cuotasPendientes.map((cuota) => (
                            <SelectItem key={cuota.id} value={cuota.id.toString()}>
                              <span
                                className={cn(
                                  "flex items-center gap-2",
                                  cuota.vencida && "text-red-600"
                                )}
                              >
                                Cuota #{cuota.numero_cuota} - Q{cuota.saldo_pendiente.toFixed(2)}
                                {cuota.vencida && (
                                  <Badge variant="destructive" className="text-xs">
                                    Vencida
                                  </Badge>
                                )}
                              </span>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            Sin cuotas pendientes
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  )
                ) : (
                  <div className="text-muted-foreground text-sm h-9 px-3 border rounded-md flex items-center bg-muted/50">
                    Seleccione estudiante primero
                  </div>
                )}
              </div>

              {/* Monto */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Monto</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    Q
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-6 w-full"
                    value={linea.monto || ""}
                    onChange={(e) =>
                      actualizarLinea(linea.id, { monto: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderPaso3 = () => {
    const lineasValidas = lineasDistribucion.filter(
      (l) => l.estudiante_programa_id && l.monto > 0
    )

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Banknote className="h-4 w-4" /> Monto Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Q {montoTotal.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Estudiantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lineasValidas.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Receipt className="h-4 w-4" /> Kardex a crear
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lineasValidas.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen de movimientos a crear</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Vista móvil - Cards */}
            <div className="space-y-3 sm:hidden">
              {lineasValidas.map((linea) => (
                <div key={linea.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-sm">{linea.estudiante_label}</span>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 shrink-0">
                      Aprobado
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {linea.crear_cuota ? (
                        <Badge variant="secondary" className="text-xs">Nueva cuota</Badge>
                      ) : linea.cuota_id ? (
                        linea.cuota_label
                      ) : (
                        "Sin cuota"
                      )}
                    </span>
                    <span className="font-bold text-green-600">Q {linea.monto.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Vista desktop - Tabla */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Cuota</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineasValidas.map((linea) => (
                    <TableRow key={linea.id}>
                      <TableCell className="font-medium">{linea.estudiante_label}</TableCell>
                      <TableCell>
                        {linea.crear_cuota ? (
                          <Badge variant="secondary">Nueva cuota</Badge>
                        ) : linea.cuota_id ? (
                          linea.cuota_label
                        ) : (
                          <span className="text-muted-foreground">Sin cuota</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        Q {linea.monto.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          Aprobado
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Opciones de Conciliación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="crear_conciliacion"
                checked={crearConciliacion}
                onCheckedChange={(checked) => setCrearConciliacion(checked === true)}
              />
              <Label htmlFor="crear_conciliacion" className="cursor-pointer">
                Crear registro de conciliación bancaria automáticamente
              </Label>
            </div>
            {crearConciliacion && (
              <p className="text-sm text-muted-foreground mt-2 ml-6">
                Se creará un registro de conciliación por <strong>Q {montoTotal.toFixed(2)}</strong>{" "}
                vinculado a estos movimientos.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderPaso4 = () => (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">¡Pago registrado exitosamente!</h3>
        <p className="text-muted-foreground">
          Se han creado todos los registros correctamente.
        </p>
      </div>

      {resultado && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600">
                Q {resultado.resumen.monto_total.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">Monto total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{resultado.resumen.kardex_creados}</div>
              <p className="text-sm text-muted-foreground">Kardex creados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{resultado.resumen.cuotas_creadas}</div>
              <p className="text-sm text-muted-foreground">Cuotas creadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">
                {resultado.resumen.conciliacion_creada ? "✓" : "-"}
              </div>
              <p className="text-sm text-muted-foreground">Conciliación</p>
            </CardContent>
          </Card>
        </div>
      )}

      {resultado && resultado.kardex.length > 0 && (
        <Card className="text-left">
          <CardHeader>
            <CardTitle className="text-base">Detalle de movimientos creados</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Vista móvil - Cards */}
            <div className="space-y-2 sm:hidden">
              {resultado.kardex.map((k) => (
                <div key={k.id} className="border rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-mono">ID: {k.id}</span>
                    <span className="font-bold text-green-600">Q {k.monto_pagado.toFixed(2)}</span>
                  </div>
                  <p className="text-sm font-medium">{k.prospecto || "-"}</p>
                  <p className="text-xs text-muted-foreground">{k.carnet || "-"}</p>
                </div>
              ))}
            </div>
            {/* Vista desktop - Tabla */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Carnet</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultado.kardex.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell className="font-mono text-sm">{k.id}</TableCell>
                      <TableCell>{k.prospecto || "-"}</TableCell>
                      <TableCell>{k.carnet || "-"}</TableCell>
                      <TableCell className="text-right">Q {k.monto_pagado.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const stepTitles: Record<WizardStep, string> = {
    1: "Datos Generales del Pago",
    2: "Distribución del Pago",
    3: "Confirmar y Crear Kardex",
    4: "Resumen Final",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Asistente de Registro de Pago
          </DialogTitle>
          <DialogDescription>
            {stepTitles[currentStep]} — Paso {currentStep} de 4
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        <div className="min-h-[400px]">
          {currentStep === 1 && renderPaso1()}
          {currentStep === 2 && renderPaso2()}
          {currentStep === 3 && renderPaso3()}
          {currentStep === 4 && renderPaso4()}
        </div>

        <DialogFooter className="flex justify-between gap-2 sm:justify-between">
          <div>
            {currentStep > 1 && currentStep < 4 && (
              <Button variant="outline" onClick={handleAnterior}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Anterior
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {currentStep < 3 && (
              <Button onClick={handleSiguiente}>
                Siguiente <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            {currentStep === 3 && (
              <Button onClick={handleFinalizar} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Procesando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" /> Finalizar y Guardar
                  </>
                )}
              </Button>
            )}
            {currentStep === 4 && (
              <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
