"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CreditCard, Download, FileText, Upload, Loader2, RefreshCw } from "lucide-react"
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
  type PaymentUploadResponse 
} from "@/services/payments"

export function PaymentsView() {
  const [activeTab, setActiveTab] = useState("pending")
  const [showReceiptUpload, setShowReceiptUpload] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  
  // Estados para datos de la API
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([])
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [accountSummary, setAccountSummary] = useState<AccountSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Estados del formulario
  const [receiptForm, setReceiptForm] = useState({
    numero_boleta: '',
    banco: '',
    monto: 0
  })

  // 🔥 FUNCIÓN MEJORADA PARA CARGAR DATOS CON REFRESH FORZADO
  const loadPaymentData = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      let pending, history, summary
      
      if (forceRefresh) {
        // Usar el método de refresh forzado que evita cache
        const data = await paymentsService.refreshAllData()
        pending = data.pending
        history = data.history
        summary = data.summary
      } else {
        // Carga normal
        [pending, history, summary] = await Promise.all([
          paymentsService.getPendingPayments(),
          paymentsService.getPaymentHistory(),
          paymentsService.getAccountStatement()
        ])
      }
      
      // 🔥 VALIDAR Y ACTUALIZAR LOS DATOS
      setPendingPayments(pending?.pagos_mes_actual_proximo || [])
      setPaymentHistory(history?.historial_pagos || [])
      setAccountSummary(summary || null)
      
      console.log('Datos actualizados:', {
        pendientes: pending?.pagos_mes_actual_proximo?.length || 0,
        historial: history?.historial_pagos?.length || 0,
        resumen: summary?.resumen
      })
      
    } catch (error) {
      console.error('Error cargando datos de pagos:', error)
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

  // Cargar datos al montar el componente
  useEffect(() => {
    loadPaymentData()
  }, [loadPaymentData])

  // 🔥 FUNCIÓN PARA REFRESCAR MANUALMENTE
  const handleManualRefresh = () => {
    loadPaymentData(true)
    toast({
      title: "Actualizando datos",
      description: "Refrescando información de pagos...",
    })
  }

  // Función para iniciar la carga de recibo
  const startReceiptUpload = (payment: PendingPayment) => {
    setSelectedPayment(payment)
    setReceiptForm({
      numero_boleta: '',
      banco: '',
      monto: payment.monto
    })
    setUploadFile(null)
    setShowReceiptUpload(true)
  }

  // Función para manejar la carga de archivos
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0])
    }
  }

  // 🔥 FUNCIÓN MEJORADA PARA CONFIRMAR LA CARGA DE RECIBO
  const confirmReceiptUpload = async () => {
    if (!selectedPayment || !uploadFile) return

    try {
      setUploading(true)
      
      const response: PaymentUploadResponse = await paymentsService.uploadReceipt({
        cuota_id: selectedPayment.id,
        numero_boleta: receiptForm.numero_boleta,
        banco: receiptForm.banco,
        monto: receiptForm.monto,
        comprobante: uploadFile
      })

      console.log('Respuesta del pago:', response)

      // 🔥 VERIFICAR SI EL PAGO FUE PROCESADO AUTOMÁTICAMENTE
      if (response.success || response.estado_cuota === 'pagado') {
        toast({
          title: "¡Pago Procesado Automáticamente!",
          description: "Su pago ha sido procesado exitosamente. La cuota ha sido marcada como pagada.",
          variant: "default"
        })
      } else {
        toast({
          title: "Recibo enviado",
          description: response.message || "El recibo se envió correctamente. Se revisará en las próximas 48 horas.",
        })
      }

      // Cerrar modal
      setShowReceiptUpload(false)
      setUploadFile(null)
      setSelectedPayment(null)
      setReceiptForm({
        numero_boleta: '',
        banco: '',
        monto: 0
      })
      
      // 🔥 REFRESCAR DATOS MÚLTIPLES VECES PARA ASEGURAR ACTUALIZACIÓN
      console.log('Refrescando datos después del pago...')
      
      // Primer refresh inmediato
      await loadPaymentData(true)
      
      // Segundo refresh después de 1 segundo
      setTimeout(async () => {
        console.log('Segundo refresh...')
        await loadPaymentData(true)
      }, 1000)
      
      // Tercer refresh después de 3 segundos
      setTimeout(async () => {
        console.log('Tercer refresh...')
        await loadPaymentData(true)
      }, 3000)

    } catch (error) {
      console.error('Error subiendo recibo:', error)
      toast({
        title: "Error",
        description: "No se pudo enviar el recibo. Intente nuevamente.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  // 🔥 FUNCIÓN MEJORADA PARA OBTENER EL COLOR DE LA INSIGNIA
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

  // 🔥 FUNCIÓN MEJORADA PARA OBTENER EL TEXTO DEL ESTADO
  const getStatusText = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || 'pendiente'
    switch (normalizedStatus) {
      case "pagado": 
        return "Pagado"
      case "aprobado": 
        return "Aprobado"
      case "pendiente": 
        return "Pendiente"
      case "en_revision": 
      case "pendiente_revision": 
        return "En Revisión"
      case "rechazado": 
        return "Rechazado"
      default: 
        return "Pendiente"
    }
  }

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-GT')
  }

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
      {/* 🔥 BOTÓN DE REFRESH MANUAL */}
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            Pagos Pendientes ({pendingPayments.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Historial de Pagos ({paymentHistory.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6 mt-6">
          {pendingPayments.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {pendingPayments.map((payment) => (
                <Card key={payment.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-bold">
                        Cuota {payment.numero_cuota} - {payment.estudiante_programa.programa.nombre_del_programa}
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
                ¡Excelente! No tiene pagos pendientes en este momento.
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Todas sus cuotas están al día.
              </p>
            </div>
          )}
        </TabsContent>

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
                          Cuota {payment.cuota?.numero_cuota} - {payment.estudiante_programa.programa.nombre_del_programa}
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
        <DialogContent>
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
                onChange={(e) => setReceiptForm(prev => ({ ...prev, numero_boleta: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bank">Banco</Label>
              <Select 
                value={receiptForm.banco} 
                onValueChange={(value) => setReceiptForm(prev => ({ ...prev, banco: value }))}
              >
                <SelectTrigger>
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
            <div className="grid gap-2">
              <Label htmlFor="amount">Monto (Q)</Label>
              <Input 
                id="amount" 
                type="number" 
                value={receiptForm.monto}
                onChange={(e) => setReceiptForm(prev => ({ ...prev, monto: Number(e.target.value) }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="receipt-upload">Comprobante de Pago</Label>
              <Input id="receipt-upload" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} />
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
                La cuota se marcará como pagada inmediatamente.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowReceiptUpload(false)} 
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmReceiptUpload} 
              disabled={!uploadFile || !receiptForm.numero_boleta || !receiptForm.banco || uploading}
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
    </div>
  )
}