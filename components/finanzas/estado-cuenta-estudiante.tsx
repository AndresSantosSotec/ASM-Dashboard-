"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertCircle,
  CreditCard,
  Download,
  FileText,
  Upload,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Datos de ejemplo para el estado de cuenta
const accountData = {
  student: {
    name: "Carlos Méndez",
    id: "2023-0042",
    program: "Ingeniería en Sistemas",
    status: "Activo",
  },
  balance: {
    currentDebt: 1400,
    totalDebt: 2800,
    nextDueDate: "2025-04-05",
    daysUntilDue: 25,
    latePayments: 1,
    isBlocked: false,
    warningLevel: 1, // 0: normal, 1: advertencia, 2: crítico
  },
  pendingPayments: [
    {
      id: "PAY-2025-03",
      concept: "Cuota Mensual - Marzo 2025",
      amount: 1400,
      dueDate: "2025-03-05",
      status: "vencido",
      lateFee: 50,
      daysLate: 15,
    },
    {
      id: "PAY-2025-04",
      concept: "Cuota Mensual - Abril 2025",
      amount: 1400,
      dueDate: "2025-04-05",
      status: "pendiente",
      lateFee: 0,
      daysLate: 0,
    },
  ],
  paymentHistory: [
    {
      id: "TRX-2025-02",
      concept: "Cuota Mensual - Febrero 2025",
      amount: 1400,
      dueDate: "2025-02-05",
      paymentDate: "2025-02-03",
      method: "Tarjeta de Crédito",
      reference: "TRX-78945612",
      status: "completado",
    },
    {
      id: "TRX-2025-01",
      concept: "Cuota Mensual - Enero 2025",
      amount: 1400,
      dueDate: "2025-01-05",
      paymentDate: "2025-01-04",
      method: "Depósito Bancario",
      reference: "DEP-12345678",
      status: "completado",
    },
    {
      id: "TRX-2024-12",
      concept: "Cuota Mensual - Diciembre 2024",
      amount: 1400,
      dueDate: "2024-12-05",
      paymentDate: "2024-12-02",
      method: "Transferencia",
      reference: "TRF-98765432",
      status: "completado",
    },
  ],
}

export function EstadoCuentaEstudiante() {
  const [activeTab, setActiveTab] = useState("pending")
  const [showCardPayment, setShowCardPayment] = useState(false)
  const [showReceiptUpload, setShowReceiptUpload] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  // Función para iniciar el pago con tarjeta
  const startCardPayment = (payment: any) => {
    setSelectedPayment(payment)
    setShowCardPayment(true)
  }

  // Función para iniciar la carga de recibo
  const startReceiptUpload = (payment: any) => {
    setSelectedPayment(payment)
    setShowReceiptUpload(true)
  }

  // Función para manejar la carga de archivos
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0])
    }
  }

  // Función para confirmar la carga de recibo
  const confirmReceiptUpload = () => {
    setShowReceiptUpload(false)
    setUploadFile(null)
    // Aquí se implementaría la lógica para subir el recibo al servidor
  }

  // Función para obtener el color de la insignia según el estado
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "completado":
        return "default"
      case "pendiente":
        return "outline"
      case "vencido":
        return "destructive"
      case "procesando":
        return "secondary"
      default:
        return "outline"
    }
  }

  // Función para obtener el texto del estado
  const getStatusText = (status: string) => {
    switch (status) {
      case "completado":
        return "Completado"
      case "pendiente":
        return "Pendiente"
      case "vencido":
        return "Vencido"
      case "procesando":
        return "Procesando"
      default:
        return "Pendiente"
    }
  }

  // Calcular el total pendiente incluyendo moras
  const calculateTotalPending = () => {
    return accountData.pendingPayments.reduce((total, payment) => {
      return total + payment.amount + payment.lateFee
    }, 0)
  }

  return (
    <div className="space-y-6">
      {/* Resumen del estado de cuenta */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Estado de Cuenta</CardTitle>
              <CardDescription>
                {accountData.student.name} - {accountData.student.id}
              </CardDescription>
            </div>
            <div className="mt-2 md:mt-0">
              {accountData.balance.isBlocked ? (
                <Badge variant="destructive" className="text-sm">
                  Cuenta Bloqueada
                </Badge>
              ) : accountData.balance.warningLevel > 0 ? (
                <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50 text-sm">
                  {accountData.balance.warningLevel === 1 ? "Advertencia de Pago" : "Riesgo de Bloqueo"}
                </Badge>
              ) : (
                <Badge variant="default" className="bg-green-500 text-sm">
                  Al Día
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Saldo Pendiente</h3>
              <div className="text-2xl font-bold">Q{calculateTotalPending().toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">
                Incluye Q{accountData.pendingPayments.reduce((total, payment) => total + payment.lateFee, 0)} en
                recargos por mora
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Próximo Vencimiento</h3>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <span className="text-lg font-medium">
                  {new Date(accountData.balance.nextDueDate).toLocaleDateString()}
                </span>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Faltan {accountData.balance.daysUntilDue} días</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Estado de Pagos</h3>
              <div className="flex items-center gap-2">
                {accountData.balance.latePayments === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
                <span className="text-lg font-medium">
                  {accountData.balance.latePayments === 0
                    ? "Al día"
                    : `${accountData.balance.latePayments} pago(s) atrasado(s)`}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {accountData.balance.latePayments === 0
                  ? "Todos los pagos están al día"
                  : accountData.balance.latePayments === 1
                    ? "Riesgo de recargo por mora"
                    : "Riesgo de bloqueo de plataforma"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerta de mora o bloqueo si aplica */}
      {accountData.balance.warningLevel > 0 && (
        <Alert
          variant={accountData.balance.warningLevel === 2 ? "destructive" : "default"}
          className={accountData.balance.warningLevel === 2 ? "" : "border-yellow-500 text-yellow-700 bg-yellow-50"}
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {accountData.balance.warningLevel === 2 ? "Cuenta en riesgo de bloqueo" : "Pago vencido"}
          </AlertTitle>
          <AlertDescription>
            {accountData.balance.warningLevel === 2
              ? "Su cuenta será bloqueada en 5 días si no realiza el pago pendiente. Por favor, regularice su situación lo antes posible."
              : "Tiene un pago vencido con recargo por mora de Q50. Realice su pago lo antes posible para evitar el bloqueo de su cuenta."}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pagos Pendientes</TabsTrigger>
          <TabsTrigger value="history">Historial de Pagos</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6 mt-6">
          {accountData.pendingPayments.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {accountData.pendingPayments.map((payment) => (
                <Card key={payment.id} className={payment.status === "vencido" ? "border-red-200" : ""}>
                  <CardHeader className={`pb-2 ${payment.status === "vencido" ? "bg-red-50" : ""}`}>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-bold">{payment.concept}</CardTitle>
                      <Badge variant={getBadgeVariant(payment.status)}>{getStatusText(payment.status)}</Badge>
                    </div>
                    <CardDescription>
                      Fecha límite: {new Date(payment.dueDate).toLocaleDateString()}
                      {payment.status === "vencido" && (
                        <span className="text-red-500 ml-2">({payment.daysLate} días de atraso)</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-1">
                      <div className="text-2xl font-bold">
                        Q{payment.amount.toLocaleString()}
                        {payment.lateFee > 0 && (
                          <span className="text-sm text-red-500 ml-2">+ Q{payment.lateFee} (mora)</span>
                        )}
                      </div>
                      {payment.status === "vencido" && (
                        <div className="text-sm text-red-500">
                          Total a pagar: Q{(payment.amount + payment.lateFee).toLocaleString()}
                        </div>
                      )}
                    </div>
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
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium">¡No tiene pagos pendientes!</h3>
              <p className="text-muted-foreground mt-2">
                Todos sus pagos están al día. El próximo pago vence el{" "}
                {new Date(accountData.balance.nextDueDate).toLocaleDateString()}.
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fecha de Pago</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountData.paymentHistory.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.concept}</TableCell>
                      <TableCell>Q{payment.amount.toLocaleString()}</TableCell>
                      <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                      <TableCell>{payment.method}</TableCell>
                      <TableCell>{payment.reference}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4 mr-1" /> Recibo
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="ml-auto">
                <Download className="mr-2 h-4 w-4" /> Descargar Estado de Cuenta
              </Button>
            </CardFooter>
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
                <span className="font-bold">
                  Q{selectedPayment ? (selectedPayment.amount + selectedPayment.lateFee).toLocaleString() : "0"}
                </span>
                {selectedPayment?.lateFee > 0 && (
                  <span className="text-sm text-muted-foreground ml-2">
                    (Incluye Q{selectedPayment.lateFee} de recargo por mora)
                  </span>
                )}
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
              <Input id="receipt-number" placeholder="Ej: 123456789" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bank">Banco</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el banco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banrural">Banrural</SelectItem>
                  <SelectItem value="bi">Banco Industrial</SelectItem>
                  <SelectItem value="bam">BAM</SelectItem>
                  <SelectItem value="g&t">G&T Continental</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Monto (Q)</Label>
              <Input
                id="amount"
                type="number"
                defaultValue={selectedPayment ? (selectedPayment.amount + selectedPayment.lateFee).toString() : "0"}
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
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">Importante</AlertTitle>
              <AlertDescription className="text-yellow-700">
                La conciliación de su pago puede tomar hasta 48 horas hábiles. Recibirá una notificación cuando su pago
                sea confirmado.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiptUpload(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmReceiptUpload} disabled={!uploadFile}>
              Enviar Recibo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

