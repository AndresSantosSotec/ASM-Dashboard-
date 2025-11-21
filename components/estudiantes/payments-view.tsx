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
    setSelectedPayment(payment)
    // ⬅️ Monto arranca en el máximo permitido (se puede bajar, nunca subir)
    const anyP = payment as any
    const withLate = typeof anyP.total_with_late_fee === "number" ? anyP.total_with_late_fee : null
    const startAmount = Number(withLate ?? payment.monto) || 0

    setReceiptForm({
      numero_boleta: '',
      banco: '',
      monto: startAmount,
      fecha_recibo: '' // ⬅️ NUEVO
    })
    setUploadFile(null)
    setValidationError(null)
    setAmountError(null)
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
      setAmountError(null)

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

  // Check if form is valid for submission
  const isFormValid = useMemo(() => {
    return (
      uploadFile &&
      receiptForm.numero_boleta.trim() &&
      receiptForm.banco.trim() &&
      receiptForm.monto > 0 &&
      !validationError &&
      !isValidating &&
      !amountError // ⬅️ NUEVO // LIMITE DE MONTO
    )
  }, [uploadFile, receiptForm, validationError, isValidating, amountError])

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
                      Fecha límite: {formatDate(payment.fecha_vencimiento)}
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
                    <Button
                      variant="outline"
                      onClick={() => startReceiptUpload(payment)}
                      className="w-full sm:w-auto"
                      disabled={payment.estado === 'en_revision' || payment.estado === 'pagado'}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {payment.estado === 'en_revision' ? 'En Revisión' :
                        payment.estado === 'pagado' ? 'Pagado' : 'Subir Recibo'}
                    </Button>
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
                      Fecha límite: {formatDate(payment.fecha_vencimiento)}
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
                    <Button
                      variant="outline"
                      onClick={() => startReceiptUpload(payment)}
                      className="w-full sm:w-auto"
                      disabled={payment.estado === 'en_revision' || payment.estado === 'pagado'}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {payment.estado === 'en_revision' ? 'En Revisión' :
                        payment.estado === 'pagado' ? 'Pagado' : 'Subir Recibo'}
                    </Button>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Subir Recibo de Pago</DialogTitle>
            <DialogDescription>
              Suba el comprobante de su depósito o transferencia para la Cuota {selectedPayment?.numero_cuota}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="receipt-number">Número de Boleta/Referencia</Label>
              <Input
                id="receipt-number"
                placeholder="Ej: 123456789"
                value={receiptForm.numero_boleta}
                onChange={(e) => updateReceiptForm('numero_boleta', e.target.value)}
                className={validationError ? "border-red-500" : ""}
              />
              {isValidating && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Validando boleta...</span>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bank">Banco</Label>
              <Select
                value={receiptForm.banco}
                onValueChange={(value) => updateReceiptForm('banco', value)}
              >
                <SelectTrigger className={validationError ? "border-red-500" : ""}>
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
              <Label htmlFor="amount">Monto (Q)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min={0}
                // ⬅️ NUEVO // LIMITE DE MONTO: tope visual del input
                max={allowedMax || undefined}
                value={receiptForm.monto}
                onChange={(e) => updateReceiptForm('monto', Number(e.target.value))}
                onBlur={(e) => updateReceiptForm('monto', Number(e.target.value))} // re-clamp al salir
                className={amountError ? "border-red-500" : ""}
              />
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  Máximo permitido: <strong>{formatCurrencyGT(allowedMax)}</strong>
                </span>
                {amountError && <span className="text-red-600">{amountError}</span>}
              </div>
              <p className="text-xs text-muted-foreground">
                * Puede pagar un monto menor (pago parcial). No puede exceder el saldo.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="receipt-date">Fecha del Recibo</Label>
              <Input
                id="receipt-date"
                type="date"
                value={receiptForm.fecha_recibo}
                onChange={(e) => updateReceiptForm("fecha_recibo", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Seleccione la fecha en que fue emitido el recibo o boleta.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="receipt-upload">Comprobante de Pago</Label>
              <Input
                id="receipt-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
              />
              <p className="text-xs text-gray-500">Formatos aceptados: PDF, JPG, PNG (máx. 5MB)</p>
            </div>

            {uploadFile && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <FileText className="h-4 w-4" />
                <span>Archivo seleccionado: {uploadFile.name}</span>
              </div>
            )}

            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Procesamiento Automático</AlertTitle>
              <AlertDescription className="text-blue-700">
                Su pago será procesado automáticamente una vez que suba el comprobante.
                La cuota se marcará como pagada inmediatamente si el monto coincide.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReceiptUpload(false)
                setValidationError(null)
                setAmountError(null)
              }}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmReceiptUpload}
              disabled={!isFormValid || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando Pago...
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
