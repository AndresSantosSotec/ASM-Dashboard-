"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertCircle,
  Calendar,
  Check,
  Download,
  FileText,
  RefreshCw,
  Search,
  Upload,
  CheckCircle2,
  Building2,
  CreditCard,
  DollarSign,
  CalendarDays,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Separator } from "@/components/ui/separator"

// Datos de ejemplo para la conciliación bancaria
const conciliacionData = {
  pendingReceipts: [
    {
      id: "rec-001",
      studentId: "2023-0042",
      studentName: "Carlos Méndez",
      bank: "Banco Industrial",
      receiptNumber: "BI-123456",
      amount: 750,
      date: "2025-03-10",
      authNumber: "AUTH-987654",
      status: "pendiente",
      uploadDate: "2025-03-10",
      program: "Desarrollo Web Full Stack",
    },
    {
      id: "rec-002",
      studentId: "2023-0078",
      studentName: "Ana Lucía Gómez",
      bank: "Banrural",
      receiptNumber: "BR-654321",
      amount: 750,
      date: "2025-03-09",
      authNumber: "AUTH-123456",
      status: "pendiente",
      uploadDate: "2025-03-09",
      program: "Diseño UX/UI",
    },
    {
      id: "rec-003",
      studentId: "2023-0091",
      studentName: "Juan Pablo Herrera",
      bank: "Banco G&T",
      receiptNumber: "GT-789456",
      amount: 750,
      date: "2025-03-08",
      authNumber: "AUTH-456789",
      status: "pendiente",
      uploadDate: "2025-03-08",
      program: "Medicina",
    },
  ],
  reconciliationHistory: [
    {
      id: "recon-001",
      date: "2025-03-09",
      totalReceipts: 15,
      totalAmount: 11250,
      status: "completada",
      processedBy: "María López",
      receipts: [
        {
          id: "rec-004",
          studentId: "2023-0056",
          studentName: "María Fernanda López",
          bank: "Banco Industrial",
          receiptNumber: "BI-789123",
          amount: 750,
          date: "2025-03-05",
          authNumber: "AUTH-321654",
          status: "conciliado",
          uploadDate: "2025-03-05",
          program: "Psicología",
        },
        {
          id: "rec-005",
          studentId: "2023-0112",
          studentName: "Lucía Ramírez",
          bank: "Banrural",
          receiptNumber: "BR-456789",
          amount: 750,
          date: "2025-03-05",
          authNumber: "AUTH-987321",
          status: "conciliado",
          uploadDate: "2025-03-05",
          program: "Administración de Empresas",
        },
      ],
    },
    {
      id: "recon-002",
      date: "2025-03-08",
      totalReceipts: 12,
      totalAmount: 9000,
      status: "completada",
      processedBy: "Juan Pérez",
      receipts: [],
    },
  ],
  banks: [
    { id: "bank-001", name: "Banco Industrial" },
    { id: "bank-002", name: "Banrural" },
    { id: "bank-003", name: "Banco G&T" },
    { id: "bank-004", name: "BAC Credomatic" },
    { id: "bank-005", name: "Banco Promerica" },
  ],
}

export function ConciliacionBancaria() {
  const [activeTab, setActiveTab] = useState("pending-receipts")
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showReconcileDialog, setShowReconcileDialog] = useState(false)
  const [showReceiptDetailsDialog, setShowReceiptDetailsDialog] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  })
  const [uploadForm, setUploadForm] = useState({
    studentId: "",
    bank: "",
    receiptNumber: "",
    amount: "",
    date: "",
    authNumber: "",
  })
  const [selectedReceipts, setSelectedReceipts] = useState<string[]>([])

  // Función para abrir el diálogo de detalles de recibo
  const openReceiptDetailsDialog = (receipt: any) => {
    setSelectedReceipt(receipt)
    setShowReceiptDetailsDialog(true)
  }

  // Función para abrir el diálogo de conciliación
  const openReconcileDialog = () => {
    setShowReconcileDialog(true)
  }

  // Función para manejar cambios en el formulario de carga
  const handleUploadFormChange = (field: string, value: string) => {
    setUploadForm({
      ...uploadForm,
      [field]: value,
    })
  }

  // Función para manejar la selección de recibos
  const handleReceiptSelection = (receiptId: string) => {
    if (selectedReceipts.includes(receiptId)) {
      setSelectedReceipts(selectedReceipts.filter((id) => id !== receiptId))
    } else {
      setSelectedReceipts([...selectedReceipts, receiptId])
    }
  }

  // Función para seleccionar todos los recibos
  const handleSelectAllReceipts = (checked: boolean) => {
    if (checked) {
      setSelectedReceipts(conciliacionData.pendingReceipts.map((receipt) => receipt.id))
    } else {
      setSelectedReceipts([])
    }
  }

  // Función para realizar la conciliación
  const handleReconciliation = () => {
    // Aquí iría la lógica real de conciliación
    setShowReconcileDialog(false)
    setSelectedReceipts([])
    alert("Conciliación completada correctamente")
  }

  // Función para subir un recibo
  const handleUploadReceipt = () => {
    // Aquí iría la lógica real de carga de recibo
    setShowUploadDialog(false)
    setUploadForm({
      studentId: "",
      bank: "",
      receiptNumber: "",
      amount: "",
      date: "",
      authNumber: "",
    })
    alert("Recibo cargado correctamente")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Conciliación Bancaria</h2>
          <p className="text-muted-foreground">Gestión y conciliación de recibos de pago</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowUploadDialog(true)}>
            <Upload className="mr-2 h-4 w-4" /> Cargar Recibo
          </Button>
          <Button onClick={openReconcileDialog} disabled={selectedReceipts.length === 0}>
            <Check className="mr-2 h-4 w-4" /> Conciliar Seleccionados
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pending-receipts" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending-receipts">Recibos Pendientes</TabsTrigger>
          <TabsTrigger value="reconciliation-history">Historial de Conciliaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="pending-receipts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Recibos Pendientes de Conciliación</CardTitle>
                  <CardDescription>Listado de recibos cargados pendientes de conciliación</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar recibo o alumno..."
                      className="pl-8 w-full md:w-[250px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Filtrar por banco" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los bancos</SelectItem>
                      {conciliacionData.banks.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        id="select-all"
                        checked={
                          selectedReceipts.length === conciliacionData.pendingReceipts.length &&
                          conciliacionData.pendingReceipts.length > 0
                        }
                        onCheckedChange={handleSelectAllReceipts}
                      />
                    </TableHead>
                    <TableHead>Alumno</TableHead>
                    <TableHead>Banco</TableHead>
                    <TableHead>No. Recibo</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>No. Autorización</TableHead>
                    <TableHead>Fecha Carga</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conciliacionData.pendingReceipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell>
                        <Checkbox
                          id={`select-${receipt.id}`}
                          checked={selectedReceipts.includes(receipt.id)}
                          onCheckedChange={() => handleReceiptSelection(receipt.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{receipt.studentName}</div>
                        <div className="text-xs text-muted-foreground">
                          {receipt.studentId} - {receipt.program}
                        </div>
                      </TableCell>
                      <TableCell>{receipt.bank}</TableCell>
                      <TableCell>{receipt.receiptNumber}</TableCell>
                      <TableCell>Q{receipt.amount.toLocaleString()}</TableCell>
                      <TableCell>{receipt.date}</TableCell>
                      <TableCell>{receipt.authNumber}</TableCell>
                      <TableCell>{receipt.uploadDate}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openReceiptDetailsDialog(receipt)}>
                          <FileText className="h-4 w-4 mr-1" /> Detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {conciliacionData.pendingReceipts.length} recibos pendientes
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" /> Exportar Listado
                </Button>
                <Button variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="reconciliation-history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Historial de Conciliaciones</CardTitle>
                  <CardDescription>Registro de conciliaciones bancarias realizadas</CardDescription>
                </div>
                <DatePickerWithRange className="w-auto" value={dateRange} onChange={setDateRange} />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Recibos</TableHead>
                    <TableHead>Monto Total</TableHead>
                    <TableHead>Procesado Por</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conciliacionData.reconciliationHistory.map((reconciliation) => (
                    <TableRow key={reconciliation.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{reconciliation.date}</span>
                        </div>
                      </TableCell>
                      <TableCell>{reconciliation.totalReceipts}</TableCell>
                      <TableCell>Q{reconciliation.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>{reconciliation.processedBy}</TableCell>
                      <TableCell>
                        <Badge variant={reconciliation.status === "completada" ? "default" : "outline"}>
                          {reconciliation.status === "completada" ? "Completada" : "Pendiente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4 mr-1" /> Ver Detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="ml-auto">
                <Download className="mr-2 h-4 w-4" /> Exportar Historial
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de carga de recibo */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cargar Recibo de Pago</DialogTitle>
            <DialogDescription>Ingrese los datos del recibo de pago para su conciliación</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="student-id">ID de Alumno</Label>
              <Input
                id="student-id"
                placeholder="Ej: 2023-0042"
                value={uploadForm.studentId}
                onChange={(e) => handleUploadFormChange("studentId", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Ingrese el ID o carnet del alumno</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bank">Banco</Label>
              <Select value={uploadForm.bank} onValueChange={(value) => handleUploadFormChange("bank", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el banco" />
                </SelectTrigger>
                <SelectContent>
                  {conciliacionData.banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="receipt-number">Número de Recibo</Label>
              <Input
                id="receipt-number"
                placeholder="Ej: BI-123456"
                value={uploadForm.receiptNumber}
                onChange={(e) => handleUploadFormChange("receiptNumber", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Monto (Q)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Ej: 750"
                value={uploadForm.amount}
                onChange={(e) => handleUploadFormChange("amount", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={uploadForm.date}
                onChange={(e) => handleUploadFormChange("date", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="auth-number">Número de Autorización</Label>
              <Input
                id="auth-number"
                placeholder="Ej: AUTH-987654"
                value={uploadForm.authNumber}
                onChange={(e) => handleUploadFormChange("authNumber", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="receipt-image">Imagen del Recibo (opcional)</Label>
              <Input id="receipt-image" type="file" />
              <p className="text-xs text-muted-foreground">Formatos aceptados: JPG, PNG, PDF (máx. 5MB)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUploadReceipt}>Cargar Recibo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de conciliación */}
      <Dialog open={showReconcileDialog} onOpenChange={setShowReconcileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conciliar Recibos</DialogTitle>
            <DialogDescription>Confirme la conciliación de los recibos seleccionados</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Información</AlertTitle>
              <AlertDescription>
                Está a punto de conciliar {selectedReceipts.length} recibos. Esta acción actualizará el estado de cuenta
                de los alumnos correspondientes.
              </AlertDescription>
            </Alert>
            <div className="border rounded-md p-4">
              <h4 className="text-sm font-medium mb-2">Resumen de Conciliación</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Recibos seleccionados:</span>
                  <span className="text-sm font-medium">{selectedReceipts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Monto total:</span>
                  <span className="text-sm font-medium">
                    Q
                    {conciliacionData.pendingReceipts
                      .filter((receipt) => selectedReceipts.includes(receipt.id))
                      .reduce((sum, receipt) => sum + receipt.amount, 0)
                      .toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Fecha de conciliación:</span>
                  <span className="text-sm font-medium">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reconciliation-notes">Notas (opcional)</Label>
              <Textarea
                id="reconciliation-notes"
                placeholder="Ingrese notas adicionales sobre esta conciliación..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReconcileDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReconciliation}>Confirmar Conciliación</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de detalles de recibo */}
      <Dialog open={showReceiptDetailsDialog} onOpenChange={setShowReceiptDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles del Recibo</DialogTitle>
            <DialogDescription>
              {selectedReceipt && `Información del recibo ${selectedReceipt.receiptNumber}`}
            </DialogDescription>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Alumno</Label>
                  <div className="font-medium">{selectedReceipt.studentName}</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedReceipt.studentId} - {selectedReceipt.program}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Estado</Label>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                    Pendiente de Conciliación
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-xs text-muted-foreground">Banco</Label>
                    <div className="font-medium">{selectedReceipt.bank}</div>
                  </div>
                </div>
                <div className="space-y-1 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-xs text-muted-foreground">Número de Recibo</Label>
                    <div className="font-medium">{selectedReceipt.receiptNumber}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-xs text-muted-foreground">Monto</Label>
                    <div className="font-medium">Q{selectedReceipt.amount.toLocaleString()}</div>
                  </div>
                </div>
                <div className="space-y-1 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-xs text-muted-foreground">Fecha</Label>
                    <div className="font-medium">{selectedReceipt.date}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Número de Autorización</Label>
                <div className="font-medium">{selectedReceipt.authNumber}</div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Fecha de Carga</Label>
                <div className="font-medium">{selectedReceipt.uploadDate}</div>
              </div>

              <div className="mt-4 p-4 border rounded-md bg-muted/50">
                <h4 className="text-sm font-medium mb-2">Imagen del Recibo</h4>
                <div className="flex items-center justify-center h-40 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">Vista previa no disponible</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiptDetailsDialog(false)}>
              Cerrar
            </Button>
            <Button>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Conciliar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

