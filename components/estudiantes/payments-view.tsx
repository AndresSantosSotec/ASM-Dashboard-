"use client"
import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CreditCard, FileText, Upload, Loader2, RefreshCw, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import {
  paymentsService,
  type PendingPayment,
  type PaymentHistory,
  type AccountSummary,
  type PaymentUploadResponse,
  PaymentError
} from "@/services/payments"

// ⬅️ NUEVO: tipos y helpers para el modal de duplicado
type DuplicateInfo = {
  fechaUso?: string
  cuotaNumero?: number | string
  programa?: string
  monto?: number
}

const formatDateGT = (d: string | Date) =>
  new Date(d).toLocaleDateString("es-GT")

const formatCurrencyGT = (n?: number) =>
  typeof n === "number" ? `Q${n.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"

// 🆕 Formatear mes/año para mostrar en las tarjetas
const formatMesAnio = (payment: PendingPayment): string => {
  // Intentar usar mes_pago/anio_pago primero
  if (payment.mes_pago && payment.ano) {
    return `${payment.mes_pago} ${payment.ano}`
  }
  // Fallback: calcular desde fecha_vencimiento
  if (payment.fecha_vencimiento) {
    const fecha = new Date(payment.fecha_vencimiento)
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`
  }
  return '—'
}

export function PaymentsView() {
  const [activeTab, setActiveTab] = useState("pending-window")
  const [showReceiptUpload, setShowReceiptUpload] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  // Estados para datos de la API
  const [pendingWindowPayments, setPendingWindowPayments] = useState<PendingPayment[]>([])
  const [allPendingPayments, setAllPendingPayments] = useState<PendingPayment[]>([])
  const [overduePaymentsServer, setOverduePaymentsServer] = useState<PendingPayment[]>([])
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [accountSummary, setAccountSummary] = useState<AccountSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Estados de validación
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // ⬅️ NUEVO // LIMITE DE MONTO
  const [amountError, setAmountError] = useState<string | null>(null)

  // Filtro de la pestaña "Todos los Pendientes"
  const [allPendingFilter, setAllPendingFilter] = useState<"all" | "overdue" | "upcoming">("all")

  // Estados del formulario
  const [receiptForm, setReceiptForm] = useState({
    numero_boleta: '',
    banco: '',
    monto: 0,
    fecha_recibo: new Date().toISOString().slice(0, 10), // YYYY-MM-DD, no editable
  })

  // ⬅️ NUEVO: modal gráfico para boleta/archivo duplicado
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateInfo | null>(null)

  // Helpers de fecha
  const startOfToday = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const parseDate = (s?: string) => (s ? new Date(s) : null)

  const isOverdue = (p: PendingPayment) => {
    if (typeof p.is_overdue === "boolean") return p.is_overdue
    const d = parseDate(p.fecha_vencimiento)
    return !!(d && d < startOfToday)
  }

  const isUpcoming = (p: PendingPayment) => !isOverdue(p)

  // Cargar datos con opción de refresh forzado
  const loadPaymentData = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) setRefreshing(true)
      else setLoading(true)

      let pending, history, summary

      if (forceRefresh) {
        const data = await paymentsService.refreshAllData()
        pending = data.pending
        history = data.history
        summary = data.summary
      } else {
        [pending, history, summary] = await Promise.all([
          paymentsService.getPendingPayments(),
          paymentsService.getPaymentHistory(),
          paymentsService.getAccountStatement()
        ])
      }

      setAllPendingPayments(pending?.pagos || [])
      setPendingWindowPayments(pending?.pagos_mes_actual_proximo || [])
      setOverduePaymentsServer(pending?.pagos_atrasados || [])
      setPaymentHistory(history?.historial_pagos || [])
      setAccountSummary(summary || null)

    } catch {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de pagos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Cargar datos al montar
  useEffect(() => {
    loadPaymentData()
  }, [loadPaymentData])

  // Refresh manual
  const handleManualRefresh = () => {
    loadPaymentData(true)
    toast({
      title: "Actualizando datos",
      description: "Refrescando información de pagos...",
    })
  }

  // Validación en tiempo real de boleta
  const validateReceiptNumber = useCallback(async (numero: string, banco: string) => {
    if (!numero.trim() || !banco.trim()) {
      setValidationError(null)
      return
    }

    setIsValidating(true)
    setValidationError(null)

    try {
      const result = await paymentsService.prevalidateReceipt(numero, banco)
      if (result.duplicate && result.existing_payment) {
        const existing = result.existing_payment
        setValidationError(
          `Esta boleta ya fue utilizada el ${new Date(existing.fecha_pago).toLocaleDateString('es-GT')} ` +
          `para la cuota ${existing.cuota_numero} del programa ${existing.programa} ` +
          `por un monto de Q${existing.monto_pagado.toLocaleString()}.`
        )
      }
    } catch {
      // silencioso
    } finally {
      setIsValidating(false)
    }
  }, [])

  // Efecto para validar cuando cambia la boleta o banco
  useEffect(() => {
    const timer = setTimeout(() => {
      validateReceiptNumber(receiptForm.numero_boleta, receiptForm.banco)
    }, 500)
    return () => clearTimeout(timer)
  }, [receiptForm.numero_boleta, receiptForm.banco, validateReceiptNumber])

  // ⬅️ NUEVO // LIMITE DE MONTO: calcula el máximo permitido (con mora si existe)
  const allowedMax = useMemo(() => {
    if (!selectedPayment) return 0
    const anyP = selectedPayment as any
    const withLate = typeof anyP.total_with_late_fee === "number" ? anyP.total_with_late_fee : null
    return Number(withLate ?? selectedPayment.monto) || 0
  }, [selectedPayment])

  // Iniciar carga de recibo
  const startReceiptUpload = (payment: PendingPayment) => {
    // 🆕 Validar si puede pagar esta cuota antes de abrir el modal
    const validacion = puedePagarCuota(payment)
    if (!validacion.puede) {
      toast({
        title: "No se puede procesar este pago",
        description: validacion.razon || "Debe pagar primero todas las cuotas vencidas antes de pagar cuotas futuras.",
        variant: "destructive"
      })
      return
    }

    setSelectedPayment(payment)
    // 🆕 Monto fijo - el estudiante NO puede modificarlo (incluye mora si existe)
    const anyP = payment as any
    const withLate = typeof anyP.total_with_late_fee === "number" ? anyP.total_with_late_fee : null
    const fixedAmount = Number(withLate ?? payment.monto) || 0

    setReceiptForm({
      numero_boleta: '',
      banco: '',
      monto: fixedAmount, // Monto fijo - no modificable
      fecha_recibo: ''
    })
    setUploadFile(null)
    setValidationError(null)
    setShowReceiptUpload(true)
  }

  // Manejar archivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0])
    }
  }

  // ⬅️ NUEVO // LIMITE DE MONTO: clamp y mensajes
  const clampAmount = (raw: number) => {
    const safe = Math.max(0, raw || 0)
    if (allowedMax > 0 && safe > allowedMax) {
      setAmountError(`El monto no puede superar el saldo a pagar (${formatCurrencyGT(allowedMax)}).`)
      return allowedMax
    }
    setAmountError(null)
    return safe
  }

  // Actualizar campos del formulario
  const updateReceiptForm = (field: string, value: string | number) => {
    if (field === "monto") {
      const num = typeof value === "number" ? value : Number(value)
      const clamped = clampAmount(num)
      setReceiptForm(prev => ({ ...prev, monto: clamped }))
      return
    }
    setReceiptForm(prev => ({ ...prev, [field]: value }))
  }

  // Confirmar carga de recibo
  const confirmReceiptUpload = async () => {
    if (!selectedPayment || !uploadFile) return

    // Validaciones previas
    if (validationError) {
      toast({
        title: "Error de Validación",
        description: "No puede usar una boleta que ya fue utilizada anteriormente",
        variant: "destructive"
      })
      return
    }

    // ⬅️ NUEVO // LIMITE DE MONTO: bloquear si por alguna razón excede
    if (allowedMax > 0 && receiptForm.monto > allowedMax) {
      toast({
        title: "Monto inválido",
        description: `El monto no puede superar ${formatCurrencyGT(allowedMax)}.`,
        variant: "destructive"
      })
      return
    }

    try {
      setUploading(true)

      const response: PaymentUploadResponse = await paymentsService.uploadReceipt({
        cuota_id: selectedPayment.id,
        numero_boleta: receiptForm.numero_boleta,
        banco: receiptForm.banco,
        monto: receiptForm.monto,
        comprobante: uploadFile,
        fecha_recibo: receiptForm.fecha_recibo 
      })

      if (response.success || response.estado_cuota === 'pagado') {
        toast({
          title: "¡Pago Procesado Automáticamente!",
          description: "Su pago ha sido procesado exitosamente. La cuota ha sido marcada como pagada.",
        })
      } else {
        toast({
          title: "Recibo enviado",
          description: response.message || "El recibo se envió correctamente. Se revisará en las próximas 48 horas.",
        })
      }

      setShowReceiptUpload(false)
      setUploadFile(null)
      setSelectedPayment(null)
      setReceiptForm({ numero_boleta: '', banco: '', monto: 0, fecha_recibo: new Date().toISOString().slice(0, 10) })
      setValidationError(null)

      await loadPaymentData(true)
      setTimeout(async () => { await loadPaymentData(true) }, 1000)
      setTimeout(async () => { await loadPaymentData(true) }, 3000)

    } catch (error: unknown) {
      if (error instanceof PaymentError) {
        if (error.code === "DUPLICATE_RECEIPT_NUMBER" || error.code === "DUPLICATE_RECEIPT_FILE") {
          const d = (error as any).details || {}
          const original = d.boleta_original || d.matched_payment || d.original || {}
          const fechaUso = original.fecha_uso || original.fecha_pago || original.fecha || d.fecha_uso || d.fecha_pago
          const cuotaNumero = original.cuota_numero || original.cuota || d.cuota_numero
          const programa = original.programa || d.programa
          const monto = original.monto_original ?? original.monto_pagado ?? original.monto ?? d.monto

          setDuplicateInfo({
            fechaUso: fechaUso ? String(fechaUso) : undefined,
            cuotaNumero: typeof cuotaNumero !== "undefined" ? cuotaNumero : undefined,
            programa: programa ? String(programa) : undefined,
            monto: typeof monto === "number" ? monto : (typeof monto === "string" ? Number(monto) : undefined),
          })
          setShowDuplicateModal(true)
          setValidationError(
            fechaUso && cuotaNumero && programa && (typeof monto === "number" || typeof monto === "string")
              ? `Esta boleta ya fue utilizada el ${formatDateGT(fechaUso)} para la cuota ${cuotaNumero} del programa ${programa} por un monto de ${formatCurrencyGT(Number(monto))}.`
              : (error.userMessage || "Esta boleta/archivo ya fue utilizado anteriormente.")
          )
        } else if (error.code === "CUOTA_ALREADY_PAID") {
          toast({
            title: "Cuota ya Pagada",
            description: "Esta cuota ya fue pagada anteriormente",
            variant: "destructive"
          })
          await loadPaymentData(true)
          setShowReceiptUpload(false)
        } else {
          toast({
            title: "Error en el Pago",
            description: error.message || "Ocurrió un error procesando el pago",
            variant: "destructive"
          })
        }
      } else {
        toast({
          title: "Error",
          description: "No se pudo enviar el recibo. Intente nuevamente.",
          variant: "destructive"
        })
      }
    } finally {
      setUploading(false)
    }
  }

  const getBadgeVariant = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || 'pendiente'
    switch (normalizedStatus) {
      case "pagado":
      case "aprobado":
        return "default"
      case "pendiente":
        return "outline"
      case "en_revision":
      case "pendiente_revision":
        return "secondary"
      case "rechazado":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusText = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || 'pendiente'
    switch (normalizedStatus) {
      case "pagado": return "Pagado"
      case "aprobado": return "Aprobado"
      case "pendiente": return "Pendiente"
      case "en_revision":
      case "pendiente_revision": return "En Revisión"
      case "rechazado": return "Rechazado"
      default: return "Pendiente"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-GT')
  }

  // Filtro client-side en "Todos los Pendientes"
  const computedOverdue = useMemo(() => {
    const base = overduePaymentsServer?.length ? overduePaymentsServer : allPendingPayments
    return base.filter(isOverdue).sort((a, b) => {
      return (new Date(a.fecha_vencimiento).getTime()) - (new Date(b.fecha_vencimiento).getTime())
    })
  }, [overduePaymentsServer, allPendingPayments])

  const computedUpcoming = useMemo(() => {
    return allPendingPayments
      .filter(isUpcoming)
      .sort((a, b) => (new Date(a.fecha_vencimiento).getTime()) - (new Date(b.fecha_vencimiento).getTime()))
  }, [allPendingPayments])

  const filteredAllPending = useMemo(() => {
    switch (allPendingFilter) {
      case "overdue": return computedOverdue
      case "upcoming": return computedUpcoming
      case "all":
      default:
        return [...allPendingPayments].sort((a, b) =>
          (new Date(a.fecha_vencimiento).getTime()) - (new Date(b.fecha_vencimiento).getTime())
        )
    }
  }, [allPendingFilter, allPendingPayments, computedOverdue, computedUpcoming])

  const overdueCount = computedOverdue.length
  const upcomingCount = computedUpcoming.length

  // 🆕 Validar si hay cuotas vencidas pendientes
  const tieneCuotasVencidas = useMemo(() => {
    // Buscar en todas las cuotas pendientes si hay alguna vencida
    const hayVencidas = allPendingPayments.some(p => {
      const fechaVenc = parseDate(p.fecha_vencimiento)
      return fechaVenc && fechaVenc < startOfToday && p.estado !== 'pagado'
    })
    return hayVencidas || computedOverdue.length > 0 || (overduePaymentsServer && overduePaymentsServer.length > 0)
  }, [allPendingPayments, computedOverdue, overduePaymentsServer, startOfToday])

  // 🆕 Obtener la cuota vencida más antigua (la primera que debe pagarse)
  const primeraCuotaVencida = useMemo(() => {
    const cuotasVencidas = allPendingPayments
      .filter(p => {
        const fechaVenc = parseDate(p.fecha_vencimiento)
        return fechaVenc && fechaVenc < startOfToday && p.estado !== 'pagado'
      })
      .sort((a, b) => {
        const fechaA = parseDate(a.fecha_vencimiento)
        const fechaB = parseDate(b.fecha_vencimiento)
        if (!fechaA || !fechaB) return 0
        return fechaA.getTime() - fechaB.getTime() // Ordenar por fecha más antigua primero
      })
    
    return cuotasVencidas.length > 0 ? cuotasVencidas[0] : null
  }, [allPendingPayments, startOfToday])

  // 🆕 Verificar si un pago puede ser procesado (solo puede pagar la cuota vencida más antigua)
  const puedePagarCuota = useCallback((payment: PendingPayment): { puede: boolean; razon?: string } => {
    // Si NO está vencida pero hay cuotas vencidas pendientes, NO puede pagar
    if (!isOverdue(payment) && tieneCuotasVencidas) {
      const mesAnioPrimerVencida = primeraCuotaVencida ? formatMesAnio(primeraCuotaVencida) : null
      
      return {
        puede: false,
        razon: `Debe pagar primero todas las cuotas vencidas${mesAnioPrimerVencida ? ` (comenzando por ${mesAnioPrimerVencida})` : ''} antes de pagar cuotas futuras. Cada cuota debe pagarse con una boleta separada.`
      }
    }
    
    // Si está vencida, verificar si es la más antigua
    if (isOverdue(payment)) {
      // Si hay una cuota vencida más antigua que esta, NO puede pagar esta
      if (primeraCuotaVencida && primeraCuotaVencida.id !== payment.id) {
        const fechaEsta = parseDate(payment.fecha_vencimiento)
        const fechaPrimera = parseDate(primeraCuotaVencida.fecha_vencimiento)
        
        if (fechaEsta && fechaPrimera && fechaEsta.getTime() > fechaPrimera.getTime()) {
          const mesAnioPrimerVencida = formatMesAnio(primeraCuotaVencida)
          return {
            puede: false,
            razon: `Debe pagar primero la cuota de ${mesAnioPrimerVencida} antes de poder pagar esta cuota. Cada cuota debe pagarse con una boleta separada.`
          }
        }
      }
      // Si es la cuota vencida más antigua (o la única), puede pagar
      return { puede: true }
    }
    
    // Si no está vencida y no hay vencidas pendientes, puede pagar
    return { puede: true }
  }, [tieneCuotasVencidas, primeraCuotaVencida, allPendingPayments, startOfToday])

  // Check if form is valid for submission
  const isFormValid = useMemo(() => {
    return (
      uploadFile &&
      receiptForm.numero_boleta.trim() &&
      receiptForm.banco.trim() &&
      receiptForm.monto > 0 && // Monto fijo, siempre debería ser válido
      !validationError &&
      !isValidating
    )
  }, [uploadFile, receiptForm, validationError, isValidating])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando información de pagos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header + Refresh */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Pagos</h2>
        <Button
          variant="outline"
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </div>

      {/* Resumen de cuenta */}
      {accountSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                Q{accountSummary.resumen.monto_pagado.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Total Pagado</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">
                Q{accountSummary.resumen.monto_pendiente.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Total Pendiente</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {accountSummary.resumen.cuotas_pagadas}
              </div>
              <p className="text-sm text-muted-foreground">Cuotas Pagadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {accountSummary.resumen.cuotas_pendientes}
              </div>
              <p className="text-sm text-muted-foreground">Cuotas Pendientes</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending-window">
            Pendientes (Mes & Próx) ({pendingWindowPayments.length})
          </TabsTrigger>
          <TabsTrigger value="all-pending">
            Todos los Pendientes ({allPendingPayments.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Historial ({paymentHistory.length})
          </TabsTrigger>
        </TabsList>

        {/* Pendientes ventana */}
        <TabsContent value="pending-window" className="space-y-6 mt-6">
          {pendingWindowPayments.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {pendingWindowPayments.map((payment) => (
                <Card key={payment.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-bold">
                        Cuota {payment.numero_cuota} - {payment.estudiante_programa?.programa?.nombre_del_programa || 'Programa no disponible'}
                      </CardTitle>
                      <Badge variant={getBadgeVariant(payment.estado)}>
                        {getStatusText(payment.estado)}
                      </Badge>
                    </div>
                    <CardDescription>
                      <div className="flex items-center gap-2">
                        <span>Fecha límite: {formatDate(payment.fecha_vencimiento)}</span>
                        {formatMesAnio(payment) !== '—' && (
                          <Badge variant="outline" className="text-xs">
                            {formatMesAnio(payment)}
                          </Badge>
                        )}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-2xl font-bold">Q{payment.monto.toLocaleString()}</div>
                    {typeof (payment as any).total_with_late_fee === "number" && (payment as any).total_with_late_fee > payment.monto && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Con mora: Q{(payment as any).total_with_late_fee.toLocaleString()}
                        {typeof (payment as any).months_overdue === "number" ? ` • ${(payment as any).months_overdue} mes(es) atraso` : ''}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                    {(() => {
                      const validacion = puedePagarCuota(payment)
                      const estaDeshabilitado = payment.estado === 'en_revision' || payment.estado === 'pagado' || !validacion.puede
                      
                      return (
                        <>
                          {!validacion.puede && validacion.razon && (
                            <Alert className="mb-2 border-orange-200 bg-orange-50">
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                              <AlertTitle className="text-orange-800 text-xs">No puede pagar esta cuota</AlertTitle>
                              <AlertDescription className="text-orange-700 text-xs">
                                {validacion.razon}
                              </AlertDescription>
                            </Alert>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => startReceiptUpload(payment)}
                            className="w-full sm:w-auto"
                            disabled={estaDeshabilitado}
                            title={validacion.razon || ''}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            {payment.estado === 'en_revision' ? 'En Revisión' :
                              payment.estado === 'pagado' ? 'Pagado' :
                              !validacion.puede ? 'Cuota Bloqueada' :
                              'Subir Recibo'}
                          </Button>
                        </>
                      )
                    })()}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="text-green-600 mb-2">
                <CreditCard className="h-12 w-12 mx-auto mb-4" />
              </div>
              <p className="text-gray-500 text-lg font-medium">
                ¡Excelente! No tiene pagos pendientes en esta ventana.
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Revise la pestaña "Todos los Pendientes" para ver cuotas futuras o atrasadas.
              </p>
            </div>
          )}
        </TabsContent>

        {/* TODOS los pendientes */}
        <TabsContent value="all-pending" className="space-y-6 mt-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground mr-1">Mostrar:</span>
            <Button
              variant={allPendingFilter === "all" ? "default" : "outline"}
              onClick={() => setAllPendingFilter("all")}
              size="sm"
            >
              Todos ({allPendingPayments.length})
            </Button>
            <Button
              variant={allPendingFilter === "overdue" ? "default" : "outline"}
              onClick={() => setAllPendingFilter("overdue")}
              size="sm"
            >
              Atrasados ({overdueCount})
            </Button>
            <Button
              variant={allPendingFilter === "upcoming" ? "default" : "outline"}
              onClick={() => setAllPendingFilter("upcoming")}
              size="sm"
            >
              Próximos ({upcomingCount})
            </Button>
          </div>

          {filteredAllPending.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredAllPending.map((payment) => (
                <Card key={`all-${payment.id}`} className={isOverdue(payment) ? "border-red-200" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-bold">
                        Cuota {payment.numero_cuota} - {payment.estudiante_programa?.programa?.nombre_del_programa || 'Programa no disponible'}
                      </CardTitle>
                      <Badge variant={isOverdue(payment) ? "destructive" : getBadgeVariant(payment.estado)}>
                        {isOverdue(payment) ? "Vencida" : getStatusText(payment.estado)}
                      </Badge>
                    </div>
                    <CardDescription>
                      <div className="flex items-center gap-2">
                        <span>Fecha límite: {formatDate(payment.fecha_vencimiento)}</span>
                        {formatMesAnio(payment) !== '—' && (
                          <Badge variant="outline" className="text-xs">
                            {formatMesAnio(payment)}
                          </Badge>
                        )}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-2xl font-bold">Q{payment.monto.toLocaleString()}</div>
                    {typeof (payment as any).total_with_late_fee === "number" && (payment as any).total_with_late_fee >= payment.monto && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Con mora: Q{(payment as any).total_with_late_fee.toLocaleString()}
                        {typeof (payment as any).months_overdue === "number" ? ` • ${(payment as any).months_overdue} mes(es)` : ''}
                        {(payment as any).urgent ? " • URGENTE" : ""}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                    {(() => {
                      const validacion = puedePagarCuota(payment)
                      const estaDeshabilitado = payment.estado === 'en_revision' || payment.estado === 'pagado' || !validacion.puede
                      
                      return (
                        <>
                          {!validacion.puede && validacion.razon && (
                            <Alert className="mb-2 border-orange-200 bg-orange-50">
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                              <AlertTitle className="text-orange-800 text-xs">No puede pagar esta cuota</AlertTitle>
                              <AlertDescription className="text-orange-700 text-xs">
                                {validacion.razon}
                              </AlertDescription>
                            </Alert>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => startReceiptUpload(payment)}
                            className="w-full sm:w-auto"
                            disabled={estaDeshabilitado}
                            title={validacion.razon || ''}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            {payment.estado === 'en_revision' ? 'En Revisión' :
                              payment.estado === 'pagado' ? 'Pagado' :
                              !validacion.puede ? 'Cuota Bloqueada' :
                              'Subir Recibo'}
                          </Button>
                        </>
                      )
                    })()}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {allPendingFilter === "overdue" ? "No hay cuotas atrasadas." :
                  allPendingFilter === "upcoming" ? "No hay cuotas próximas." :
                    "No hay cuotas pendientes en este momento."}
              </p>
            </div>
          )}
        </TabsContent>

        {/* Historial */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
              <CardDescription>Registro de todos los pagos realizados</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Fecha de Pago</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Recibo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentHistory.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          Cuota {payment.cuota?.numero_cuota} - {payment.estudiante_programa?.programa?.nombre_del_programa || 'Programa no disponible'}
                        </TableCell>
                        <TableCell>Q{payment.monto_pagado.toLocaleString()}</TableCell>
                        <TableCell>{formatDate(payment.fecha_pago)}</TableCell>
                        <TableCell>
                          {payment.metodo_pago === 'transferencia_bancaria' ? 'Transferencia Bancaria' : payment.metodo_pago}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getBadgeVariant(payment.estado_pago)}>
                            {getStatusText(payment.estado_pago)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {payment.numero_boleta && (
                            <span className="text-sm text-muted-foreground">
                              {payment.numero_boleta}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay pagos registrados aún.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de carga de recibo */}
      <Dialog open={showReceiptUpload} onOpenChange={setShowReceiptUpload}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Subir Recibo de Pago</DialogTitle>
            <DialogDescription className="text-sm">
              Suba el comprobante de su depósito o transferencia para la Cuota {selectedPayment?.numero_cuota}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            <div className="grid gap-2">
              <Label htmlFor="receipt-number" className="text-sm font-medium">Número de Boleta/Referencia</Label>
              <Input
                id="receipt-number"
                placeholder="Ej: 123456789"
                value={receiptForm.numero_boleta}
                onChange={(e) => updateReceiptForm('numero_boleta', e.target.value)}
                className={`text-sm ${validationError ? "border-red-500" : ""}`}
              />
              {isValidating && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Validando boleta...</span>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bank" className="text-sm font-medium">Banco</Label>
              <Select
                value={receiptForm.banco}
                onValueChange={(value) => updateReceiptForm('banco', value)}
              >
                <SelectTrigger className={`text-sm ${validationError ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Seleccione el banco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Banrural">Banrural</SelectItem>
                  <SelectItem value="Banco Industrial">Banco Industrial</SelectItem>
                  <SelectItem value="BAM">BAM</SelectItem>
                  <SelectItem value="G&T Continental">G&T Continental</SelectItem>
                  <SelectItem value="Promerica">Promerica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mostrar error de validación inline */}
            {validationError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">Boleta ya utilizada</AlertTitle>
                <AlertDescription className="text-red-700 text-sm">
                  {validationError}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="amount">Monto a Pagar (Q)</Label>
              {/* 🆕 Campo de monto de solo lectura - el estudiante NO puede modificarlo */}
              <div className="relative">
                <Input
                  id="amount"
                  type="text"
                  value={formatCurrencyGT(receiptForm.monto)}
                  readOnly
                  disabled
                  className="bg-gray-50 border-gray-200 text-gray-900 font-semibold text-lg cursor-not-allowed pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <span className="text-gray-500 text-sm">🔒</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs">
                <span className="text-muted-foreground">
                  Monto total de la cuota: <strong className="text-gray-900">{formatCurrencyGT(allowedMax)}</strong>
                </span>
              </div>
              <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                <strong>Nota:</strong> El monto es fijo y no puede ser modificado. Debe pagar el monto completo de la cuota.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="receipt-date" className="text-sm font-medium">Fecha del Recibo</Label>
              <Input
                id="receipt-date"
                type="date"
                value={receiptForm.fecha_recibo}
                onChange={(e) => updateReceiptForm("fecha_recibo", e.target.value)}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Seleccione la fecha en que fue emitido el recibo o boleta.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="receipt-upload" className="text-sm font-medium">Comprobante de Pago</Label>
              <Input
                id="receipt-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              <p className="text-xs text-gray-500">Formatos aceptados: PDF, JPG, PNG (máx. 5MB)</p>
            </div>

            {uploadFile && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-green-600 bg-green-50 p-2 rounded border border-green-200">
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Archivo: {uploadFile.name}</span>
              </div>
            )}

            <Alert className="bg-blue-50 border-blue-200 text-xs sm:text-sm">
              <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <AlertTitle className="text-blue-800 text-sm font-semibold">Procesamiento Automático</AlertTitle>
              <AlertDescription className="text-blue-700 text-xs sm:text-sm">
                Su pago será procesado automáticamente una vez que suba el comprobante.
                La cuota se marcará como pagada inmediatamente si el monto coincide.
              </AlertDescription>
            </Alert>
            
            {/* 🆕 Mensaje sobre boletas separadas */}
            <Alert className="bg-amber-50 border-amber-200 text-xs sm:text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <AlertTitle className="text-amber-800 text-sm font-semibold">Importante: Boletas Separadas</AlertTitle>
              <AlertDescription className="text-amber-700 text-xs sm:text-sm">
                Cada cuota debe pagarse con una boleta o comprobante separado. No puede usar una sola boleta para pagar múltiples cuotas.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowReceiptUpload(false)
                setValidationError(null)
              }}
              disabled={uploading}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmReceiptUpload}
              disabled={!isFormValid || uploading}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Procesando Pago...</span>
                  <span className="sm:hidden">Procesando...</span>
                </>
              ) : (
                'Procesar Pago'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal duplicado */}
      <Dialog open={showDuplicateModal} onOpenChange={setShowDuplicateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <DialogTitle>Boleta ya utilizada</DialogTitle>
            </div>
            <DialogDescription>
              {duplicateInfo?.fechaUso && duplicateInfo?.cuotaNumero && duplicateInfo?.programa && typeof duplicateInfo?.monto !== "undefined"
                ? (
                  <>
                    Esta boleta ya fue utilizada el <strong>{formatDateGT(duplicateInfo.fechaUso)}</strong> para la cuota <strong>{duplicateInfo.cuotaNumero}</strong> del programa <strong>{duplicateInfo.programa}</strong> por un monto de <strong>{formatCurrencyGT(duplicateInfo.monto)}</strong>.
                  </>
                ) : (
                  <>Este comprobante ya fue presentado anteriormente.</>
                )
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDuplicateModal(false)}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
