"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CreditCard, Download, FileText, Upload, Shield, CheckCircle2, AlertTriangle } from "lucide-react"
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
import { api } from "@/services/api"

// Tipos para los pagos
type PaymentStatus = "aprobado" | "pendiente" | "rechazado" | "conciliacion"

interface Payment {
  id: string
  concept: string
  amount: number
  dueDate?: string
  paymentDate?: string
  method?: string
  status: PaymentStatus
  receiptNumber?: string
}

export function PaymentsView() {
  const [activeTab, setActiveTab] = useState("pending")
  const [showCardPayment, setShowCardPayment] = useState(false)
  const [showReceiptUpload, setShowReceiptUpload] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [receiptForm, setReceiptForm] = useState({
    receiptNumber: "",
    bank: "",
    amount: ""
  })
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean
    message: string
    type: 'success' | 'error' | 'warning'
  } | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Datos de ejemplo
  const pendingPayments: Payment[] = [
    {
      id: "cuota-03-2025",
      concept: "Cuota Mensual - Marzo 2025",
      amount: 1400,
      dueDate: "05/03/2025",
      status: "pendiente",
    },
    {
      id: "cert-int-2025",
      concept: "Certificación Internacional",
      amount: 2000,
      dueDate: "15/04/2025",
      status: "pendiente",
    },
  ]

  const paymentHistory: Payment[] = [
    {
      id: "cuota-02-2025",
      concept: "Cuota Mensual - Febrero 2025",
      amount: 1400,
      dueDate: "05/02/2025",
      paymentDate: "03/02/2025",
      method: "Depósito Bancario",
      status: "aprobado",
      receiptNumber: "DEP-78945612",
    },
    {
      id: "cuota-01-2025",
      concept: "Cuota Mensual - Enero 2025",
      amount: 1400,
      dueDate: "05/01/2025",
      paymentDate: "04/01/2025",
      method: "Tarjeta de Crédito",
      status: "aprobado",
      receiptNumber: "TRX-12345678",
    },
    {
      id: "inscripcion-2024",
      concept: "Inscripción",
      amount: 1000,
      dueDate: "15/12/2024",
      paymentDate: "14/12/2024",
      method: "Depósito Bancario",
      status: "conciliacion",
      receiptNumber: "DEP-45678912",
    },
  ]

  // Función para iniciar el pago con tarjeta
  const startCardPayment = (payment: Payment) => {
    setSelectedPayment(payment)
    setShowCardPayment(true)
  }

  // Function to start receipt upload
  const startReceiptUpload = (payment: Payment) => {
    setSelectedPayment(payment)
    setReceiptForm({
      receiptNumber: "",
      bank: "",
      amount: payment.amount.toString()
    })
    setVerificationResult(null)
    setUploadFile(null)
    setShowReceiptUpload(true)
  }

  // Function to verify receipt before upload
  const handleVerifyReceipt = async () => {
    if (!receiptForm.bank || !receiptForm.receiptNumber) {
      setVerificationResult({
        verified: false,
        message: 'Ingrese banco y número de boleta para verificar',
        type: 'warning'
      })
      return
    }

    setIsVerifying(true)
    setVerificationResult(null)

    try {
      const response = await api.get('/estudiante/pagos/boletas/verify', {
        params: {
          banco: receiptForm.bank,
          numero_boleta: receiptForm.receiptNumber
        }
      })

      if (response.data.success && !response.data.duplicate) {
        setVerificationResult({
          verified: true,
          message: 'Esta boleta está disponible para uso.',
          type: 'success'
        })
      } else {
        setVerificationResult({
          verified: false,
          message: response.data.message || 'Esta boleta ya fue utilizada.',
          type: 'error'
        })
      }
    } catch (error: any) {
      console.error('Error verifying receipt:', error)
      setVerificationResult({
        verified: false,
        message: error.response?.data?.message || 'Error al verificar la boleta. Intente nuevamente.',
        type: 'error'
      })
    } finally {
      setIsVerifying(false)
    }
  }

  // Function to handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        alert('El archivo es demasiado grande. El tamaño máximo permitido es 5MB.')
        e.target.value = ''
        return
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        alert('Formato de archivo no válido. Solo se permiten JPG, PNG y PDF.')
        e.target.value = ''
        return
      }

      setUploadFile(file)
    }
  }

  // Function to confirm receipt upload
  const confirmReceiptUpload = async () => {
    if (!selectedPayment || !uploadFile || !receiptForm.receiptNumber || !receiptForm.bank) {
      alert("Por favor complete todos los campos requeridos.")
      return
    }

    // Check verification status
    if (verificationResult && !verificationResult.verified) {
      alert("Esta boleta no puede ser utilizada. Verifique el número de boleta.")
      return
    }

    // Final verification if not done
    if (!verificationResult) {
      await handleVerifyReceipt()
      if (verificationResult && !verificationResult.verified) {
        return
      }
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('banco', receiptForm.bank)
      formData.append('numero_boleta', receiptForm.receiptNumber)
      formData.append('monto', receiptForm.amount)
      formData.append('fecha_pago', new Date().toISOString().split('T')[0])
      formData.append('estudiante_id', 'current-student-id') // In real app, get from auth context
      formData.append('comprobante', uploadFile)

      const response = await api.post('/estudiante/pagos/subir-recibo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        alert("Comprobante cargado exitosamente. Pendiente de conciliación.")
        setShowReceiptUpload(false)
        setUploadFile(null)
        setVerificationResult(null)
        setReceiptForm({ receiptNumber: "", bank: "", amount: "" })
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      
      if (error.response?.data?.duplicate_type) {
        alert(`Error: ${error.response.data.message}`)
      } else if (error.response?.data?.details) {
        alert(`Errores de validación:\n${error.response.data.details.join('\n')}`)
      } else {
        alert("Error al cargar el comprobante. Intente nuevamente.")
      }
    } finally {
      setIsUploading(false)
    }
  }

  // Función para obtener el color de la insignia según el estado
  const getBadgeVariant = (status: PaymentStatus) => {
    switch (status) {
      case "aprobado":
        return "default"
      case "pendiente":
        return "outline"
      case "rechazado":
        return "destructive"
      case "conciliacion":
        return "secondary"
      default:
        return "outline"
    }
  }

  // Función para obtener el texto del estado
  const getStatusText = (status: PaymentStatus) => {
    switch (status) {
      case "aprobado":
        return "Aprobado"
      case "pendiente":
        return "Pendiente"
      case "rechazado":
        return "Rechazado"
      case "conciliacion":
        return "Pendiente de Conciliación"
      default:
        return "Pendiente"
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pagos Pendientes</TabsTrigger>
          <TabsTrigger value="history">Historial de Pagos</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6 mt-6">
          {pendingPayments.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {pendingPayments.map((payment) => (
                <Card key={payment.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-bold">{payment.concept}</CardTitle>
                      <Badge variant={getBadgeVariant(payment.status)}>{getStatusText(payment.status)}</Badge>
                    </div>
                    <CardDescription>Fecha límite: {payment.dueDate}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-2xl font-bold">Q{payment.amount.toLocaleString()}</div>
                  </CardContent>
                  <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button onClick={() => startCardPayment(payment)} className="w-full sm:w-auto">
                      <CreditCard className="mr-2 h-4 w-4" /> Pagar con Tarjeta
                    </Button>
                    <Button variant="outline" onClick={() => startReceiptUpload(payment)} className="w-full sm:w-auto">
                      <Upload className="mr-2 h-4 w-4" /> Subir Recibo
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">No tiene pagos pendientes en este momento.</p>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fecha de Pago</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.concept}</TableCell>
                      <TableCell>Q{payment.amount.toLocaleString()}</TableCell>
                      <TableCell>{payment.paymentDate}</TableCell>
                      <TableCell>{payment.method}</TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(payment.status)}>{getStatusText(payment.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {payment.status === "aprobado" && (
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4 mr-1" /> Recibo
                          </Button>
                        )}
                        {payment.status === "conciliacion" && (
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4 mr-1" /> Detalles
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de pago con tarjeta */}
      <Dialog open={showCardPayment} onOpenChange={setShowCardPayment}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Pago con Tarjeta</DialogTitle>
            <DialogDescription>
              Complete los datos de su tarjeta para realizar el pago de {selectedPayment?.concept}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="card-number">Número de Tarjeta</Label>
              <Input id="card-number" placeholder="1234 5678 9012 3456" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="expiry">Fecha de Expiración</Label>
                <Input id="expiry" placeholder="MM/AA" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input id="cvc" placeholder="123" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre en la Tarjeta</Label>
              <Input id="name" placeholder="NOMBRE APELLIDO" />
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Monto a pagar</AlertTitle>
              <AlertDescription>
                <span className="font-bold">Q{selectedPayment?.amount.toLocaleString()}</span>
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCardPayment(false)}>
              Cancelar
            </Button>
            <Button type="submit">Procesar Pago</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de carga de recibo */}
      <Dialog open={showReceiptUpload} onOpenChange={setShowReceiptUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir Recibo de Pago</DialogTitle>
            <DialogDescription>
              Suba el comprobante de su depósito o transferencia para el pago de {selectedPayment?.concept}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="receipt-number">Número de Boleta/Referencia</Label>
              <div className="flex gap-2">
                <Input 
                  id="receipt-number" 
                  placeholder="Ej: 123456789" 
                  value={receiptForm.receiptNumber}
                  onChange={(e) => setReceiptForm({...receiptForm, receiptNumber: e.target.value})}
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleVerifyReceipt}
                  disabled={!receiptForm.bank || !receiptForm.receiptNumber || isVerifying || isUploading}
                >
                  {isVerifying ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-1 border-2 border-current border-t-transparent rounded-full"></div>
                      Verificando...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-1 h-4 w-4" />
                      Verificar
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Verification Result */}
            {verificationResult && (
              <Alert className={
                verificationResult.type === 'success' 
                  ? 'border-green-200 bg-green-50' 
                  : verificationResult.type === 'error'
                  ? 'border-red-200 bg-red-50'
                  : 'border-yellow-200 bg-yellow-50'
              }>
                {verificationResult.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : verificationResult.type === 'error' ? (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                )}
                <AlertTitle className={
                  verificationResult.type === 'success' 
                    ? 'text-green-800' 
                    : verificationResult.type === 'error'
                    ? 'text-red-800'
                    : 'text-yellow-800'
                }>
                  {verificationResult.type === 'success' ? 'Verificación exitosa' 
                   : verificationResult.type === 'error' ? 'Boleta no disponible'
                   : 'Verificación pendiente'}
                </AlertTitle>
                <AlertDescription className={
                  verificationResult.type === 'success' 
                    ? 'text-green-700' 
                    : verificationResult.type === 'error'
                    ? 'text-red-700'
                    : 'text-yellow-700'
                }>
                  {verificationResult.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="bank">Banco</Label>
              <Select 
                value={receiptForm.bank}
                onValueChange={(value) => setReceiptForm({...receiptForm, bank: value})}
                disabled={isUploading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el banco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Banrural">Banrural</SelectItem>
                  <SelectItem value="Banco Industrial">Banco Industrial</SelectItem>
                  <SelectItem value="BAM">BAM</SelectItem>
                  <SelectItem value="G&T Continental">G&T Continental</SelectItem>
                  <SelectItem value="BAC Credomatic">BAC Credomatic</SelectItem>
                  <SelectItem value="Banco Promerica">Banco Promerica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Monto (Q)</Label>
              <Input 
                id="amount" 
                type="number" 
                value={receiptForm.amount}
                onChange={(e) => setReceiptForm({...receiptForm, amount: e.target.value})}
                disabled={isUploading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="receipt-upload">Comprobante de Pago</Label>
              <Input 
                id="receipt-upload" 
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png" 
                onChange={handleFileUpload}
                disabled={isUploading || (verificationResult && !verificationResult.verified)}
              />
              <p className="text-xs text-gray-500">
                Formatos aceptados: PDF, JPG, PNG (máx. 5MB)
                {uploadFile && (
                  <span className="ml-2 text-green-600 font-medium">
                    ✓ {uploadFile.name}
                  </span>
                )}
              </p>
            </div>
            {uploadFile && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <FileText className="h-4 w-4" />
                <span>Archivo seleccionado: {uploadFile.name}</span>
              </div>
            )}
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">Importante - Prevención de Duplicados</AlertTitle>
              <AlertDescription className="text-yellow-700">
                ⚠️ Se verificará que esta boleta no haya sido utilizada anteriormente.<br/>
                ⚠️ No se permiten boletas duplicadas sin importar el estado del pago anterior.<br/>
                ℹ️ La conciliación puede tomar hasta 48 horas hábiles. Recibirá una notificación cuando su pago sea confirmado.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiptUpload(false)} disabled={isUploading}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmReceiptUpload} 
              disabled={
                !uploadFile || 
                !receiptForm.receiptNumber || 
                !receiptForm.bank || 
                isUploading ||
                (verificationResult && !verificationResult.verified)
              }
            >
              {isUploading ? 'Enviando...' : 'Enviar Recibo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

