"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Download,
  Search,
  FileText,
  AlertCircle,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  MessageSquare,
  Clock,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"

// Datos de ejemplo para la gestión de pagos
const paymentsData = {
  lateStudents: [
    {
      id: "2023-0042",
      name: "Carlos Méndez",
      program: "Ingeniería en Sistemas",
      totalDebt: 2850,
      lateMonths: 2,
      latestDueDate: "2025-02-05",
      daysLate: 45,
      bucket: "B3", // B1: 0-5 días, B2: 6-10 días, B3: 11-30 días, B4: +30 días
      status: "bloqueado",
      lastContact: "2025-03-01",
      promiseDate: "2025-03-15",
      contactHistory: [
        { date: "2025-03-01", type: "llamada", notes: "Promete pagar el 15 de marzo", agent: "María López" },
        { date: "2025-02-20", type: "email", notes: "Se envió recordatorio de pago", agent: "Sistema" },
        { date: "2025-02-10", type: "sms", notes: "Se envió notificación de vencimiento", agent: "Sistema" },
      ],
    },
    {
      id: "2023-0078",
      name: "Ana Lucía Gómez",
      program: "Administración de Empresas",
      totalDebt: 1450,
      lateMonths: 1,
      latestDueDate: "2025-03-05",
      daysLate: 15,
      bucket: "B3",
      status: "activo",
      lastContact: "2025-03-08",
      promiseDate: "2025-03-20",
      contactHistory: [
        {
          date: "2025-03-08",
          type: "llamada",
          notes: "Indica que realizará el pago el 20 de marzo",
          agent: "Juan Pérez",
        },
        { date: "2025-03-06", type: "email", notes: "Se envió recordatorio de pago", agent: "Sistema" },
      ],
    },
    {
      id: "2023-0103",
      name: "Roberto Juárez",
      program: "Diseño Gráfico",
      totalDebt: 4200,
      lateMonths: 3,
      latestDueDate: "2025-01-05",
      daysLate: 75,
      bucket: "B4",
      status: "bloqueado",
      lastContact: "2025-03-05",
      promiseDate: null,
      contactHistory: [
        { date: "2025-03-05", type: "llamada", notes: "No contesta", agent: "María López" },
        { date: "2025-02-25", type: "llamada", notes: "Número fuera de servicio", agent: "Juan Pérez" },
        { date: "2025-02-15", type: "email", notes: "Se envió notificación de bloqueo", agent: "Sistema" },
        { date: "2025-02-05", type: "sms", notes: "Se envió recordatorio de pago", agent: "Sistema" },
      ],
    },
    {
      id: "2023-0056",
      name: "María Fernanda López",
      program: "Psicología",
      totalDebt: 1400,
      lateMonths: 1,
      latestDueDate: "2025-03-05",
      daysLate: 5,
      bucket: "B1",
      status: "activo",
      lastContact: null,
      promiseDate: null,
      contactHistory: [],
    },
    {
      id: "2023-0091",
      name: "Juan Pablo Herrera",
      program: "Medicina",
      totalDebt: 1450,
      lateMonths: 1,
      latestDueDate: "2025-03-05",
      daysLate: 8,
      bucket: "B2",
      status: "activo",
      lastContact: "2025-03-10",
      promiseDate: "2025-03-13",
      contactHistory: [
        {
          date: "2025-03-10",
          type: "llamada",
          notes: "Indica que realizará el pago el 13 de marzo",
          agent: "María López",
        },
      ],
    },
  ],
  paymentPlans: [
    {
      id: "PLAN-001",
      studentId: "2023-0042",
      studentName: "Carlos Méndez",
      originalDebt: 2850,
      currentDebt: 2850,
      installments: [
        { number: 1, amount: 950, dueDate: "2025-03-15", status: "pendiente" },
        { number: 2, amount: 950, dueDate: "2025-04-15", status: "pendiente" },
        { number: 3, amount: 950, dueDate: "2025-05-15", status: "pendiente" },
      ],
      startDate: "2025-03-10",
      endDate: "2025-05-15",
      status: "activo",
      createdBy: "María López",
      notes: "Plan de pago especial por situación económica. Documentado con carta de compromiso.",
    },
    {
      id: "PLAN-002",
      studentId: "2023-0103",
      studentName: "Roberto Juárez",
      originalDebt: 4200,
      currentDebt: 2800,
      installments: [
        { number: 1, amount: 1400, dueDate: "2025-03-01", status: "completado" },
        { number: 2, amount: 1400, dueDate: "2025-04-01", status: "pendiente" },
        { number: 3, amount: 1400, dueDate: "2025-05-01", status: "pendiente" },
      ],
      startDate: "2025-02-20",
      endDate: "2025-05-01",
      status: "activo",
      createdBy: "Juan Pérez",
      notes: "Se desbloquea acceso después del primer pago. Debe mantenerse al día con las cuotas.",
    },
  ],
}

export function GestionPagos() {
  const [activeTab, setActiveTab] = useState("late-payments")
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [showPaymentPlanDialog, setShowPaymentPlanDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null)
  const [contactType, setContactType] = useState<string>("llamada")
  const [contactNotes, setContactNotes] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  })

  // Función para abrir el diálogo de contacto
  const openContactDialog = (student: any) => {
    setSelectedStudent(student)
    setContactType("llamada")
    setContactNotes("")
    setShowContactDialog(true)
  }

  // Función para abrir el diálogo de plan de pago
  const openPaymentPlanDialog = (student: any) => {
    setSelectedStudent(student)
    setShowPaymentPlanDialog(true)
  }

  // Función para abrir el diálogo de registro de pago
  const openPaymentDialog = (student: any) => {
    setSelectedStudent(student)
    setShowPaymentDialog(true)
  }

  // Función para abrir el diálogo de detalles de plan de pago
  const openPlanDetailsDialog = (plan: any) => {
    setSelectedPlan(plan)
    setShowPaymentPlanDialog(true)
  }

  // Función para obtener el color de la insignia según el estado
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "activo":
        return "default"
      case "bloqueado":
        return "destructive"
      case "advertencia":
        return "outline"
      case "completado":
        return "default"
      case "pendiente":
        return "outline"
      default:
        return "outline"
    }
  }

  // Función para obtener el color de la insignia según el bucket
  const getBucketVariant = (bucket: string) => {
    switch (bucket) {
      case "B1":
        return "outline"
      case "B2":
        return "secondary"
      case "B3":
        return "warning"
      case "B4":
        return "destructive"
      default:
        return "outline"
    }
  }

  // Función para obtener el texto del bucket
  const getBucketText = (bucket: string) => {
    switch (bucket) {
      case "B1":
        return "0-5 días"
      case "B2":
        return "6-10 días"
      case "B3":
        return "11-30 días"
      case "B4":
        return "+30 días"
      default:
        return ""
    }
  }

  // Función para obtener el icono según el tipo de contacto
  const getContactIcon = (type: string) => {
    switch (type) {
      case "llamada":
        return <Phone className="h-4 w-4" />
      case "email":
        return <Mail className="h-4 w-4" />
      case "sms":
        return <MessageSquare className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Pagos</h2>
          <p className="text-muted-foreground">Control de morosidad y seguimiento de pagos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Exportar Listado
          </Button>
          <Button>
            <Phone className="mr-2 h-4 w-4" /> Campaña de Cobro
          </Button>
        </div>
      </div>

      <Tabs defaultValue="late-payments" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="late-payments">Pagos Atrasados</TabsTrigger>
          <TabsTrigger value="payment-plans">Planes de Pago</TabsTrigger>
          <TabsTrigger value="follow-up">Seguimiento</TabsTrigger>
        </TabsList>

        <TabsContent value="late-payments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Alumnos con Pagos Atrasados</CardTitle>
                  <CardDescription>Listado de alumnos con cuotas pendientes</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar alumno..."
                      className="pl-8 w-full md:w-[250px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Bucket de mora" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los buckets</SelectItem>
                      <SelectItem value="b1">B1 (0-5 días)</SelectItem>
                      <SelectItem value="b2">B2 (6-10 días)</SelectItem>
                      <SelectItem value="b3">B3 (11-30 días)</SelectItem>
                      <SelectItem value="b4">B4 (+30 días)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Alumno</TableHead>
                    <TableHead>Deuda Total</TableHead>
                    <TableHead>Meses</TableHead>
                    <TableHead>Días Atraso</TableHead>
                    <TableHead>Bucket</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Último Contacto</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentsData.lateStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Checkbox id={`select-${student.id}`} />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {student.id} - {student.program}
                        </div>
                      </TableCell>
                      <TableCell>Q{student.totalDebt.toLocaleString()}</TableCell>
                      <TableCell>{student.lateMonths}</TableCell>
                      <TableCell>{student.daysLate}</TableCell>
                      <TableCell>
                        <Badge variant={getBucketVariant(student.bucket)}>
                          {student.bucket} ({getBucketText(student.bucket)})
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(student.status)}>
                          {student.status === "activo" ? "Activo" : "Bloqueado"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {student.lastContact ? (
                          <div className="text-sm">
                            {new Date(student.lastContact).toLocaleDateString()}
                            {student.promiseDate && (
                              <div className="text-xs text-green-600 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>Promesa: {new Date(student.promiseDate).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin contacto</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openContactDialog(student)}>
                            <Phone className="h-4 w-4 mr-1" /> Contactar
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openPaymentPlanDialog(student)}>
                            <Calendar className="h-4 w-4 mr-1" /> Plan
                          </Button>
                          <Button size="sm" onClick={() => openPaymentDialog(student)}>
                            <DollarSign className="h-4 w-4 mr-1" /> Pago
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {paymentsData.lateStudents.length} alumnos con pagos atrasados
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Mail className="mr-2 h-4 w-4" /> Enviar Recordatorios
                </Button>
                <Button variant="outline">
                  <MessageSquare className="mr-2 h-4 w-4" /> Enviar SMS
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="payment-plans" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Planes de Pago Especiales</CardTitle>
                  <CardDescription>Acuerdos de pago y convenios con alumnos</CardDescription>
                </div>
                <Button>
                  <Calendar className="mr-2 h-4 w-4" /> Crear Nuevo Plan
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Alumno</TableHead>
                    <TableHead>Deuda Original</TableHead>
                    <TableHead>Deuda Actual</TableHead>
                    <TableHead>Cuotas</TableHead>
                    <TableHead>Fecha Inicio</TableHead>
                    <TableHead>Fecha Fin</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentsData.paymentPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.id}</TableCell>
                      <TableCell>
                        <div>{plan.studentName}</div>
                        <div className="text-xs text-muted-foreground">{plan.studentId}</div>
                      </TableCell>
                      <TableCell>Q{plan.originalDebt.toLocaleString()}</TableCell>
                      <TableCell>Q{plan.currentDebt.toLocaleString()}</TableCell>
                      <TableCell>
                        {plan.installments.length} ({plan.installments.filter((i) => i.status === "completado").length}{" "}
                        pagadas)
                      </TableCell>
                      <TableCell>{new Date(plan.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(plan.endDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(plan.status)}>
                          {plan.status === "activo" ? "Activo" : "Completado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => openPlanDetailsDialog(plan)}>
                          <FileText className="h-4 w-4 mr-1" /> Detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="follow-up" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Seguimiento de Promesas de Pago</CardTitle>
                  <CardDescription>Compromisos de pago pendientes de cumplimiento</CardDescription>
                </div>
                <DatePickerWithRange className="w-auto" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Calendario y listado de promesas de pago con opciones de seguimiento y recordatorios
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de contacto con alumno */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Contacto</DialogTitle>
            <DialogDescription>
              {selectedStudent && `Registre la interacción con ${selectedStudent.name} (${selectedStudent.id})`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="contact-type">Tipo de Contacto</Label>
              <Select value={contactType} onValueChange={setContactType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el tipo de contacto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="llamada">Llamada Telefónica</SelectItem>
                  <SelectItem value="email">Correo Electrónico</SelectItem>
                  <SelectItem value="sms">Mensaje SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact-result">Resultado</Label>
              <Select defaultValue="contacted">
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el resultado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contacted">Contactado</SelectItem>
                  <SelectItem value="no-answer">No Contesta</SelectItem>
                  <SelectItem value="wrong-number">Número Equivocado</SelectItem>
                  <SelectItem value="message">Se Dejó Mensaje</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="promise-date">Fecha de Promesa de Pago (opcional)</Label>
              <Input type="date" id="promise-date" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact-notes">Notas</Label>
              <Textarea
                id="contact-notes"
                placeholder="Ingrese los detalles de la conversación..."
                value={contactNotes}
                onChange={(e) => setContactNotes(e.target.value)}
                rows={4}
              />
            </div>
            {selectedStudent && selectedStudent.contactHistory.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Historial de Contactos Previos</h4>
                <div className="space-y-2 max-h-[150px] overflow-y-auto border rounded-md p-2">
                  {selectedStudent.contactHistory.map((contact: any, index: number) => (
                    <div key={index} className="text-sm border-b pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {getContactIcon(contact.type)}
                          <span className="font-medium">{new Date(contact.date).toLocaleDateString()}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{contact.agent}</span>
                      </div>
                      <p className="mt-1 text-muted-foreground">{contact.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>
              Cancelar
            </Button>
            <Button>Guardar Contacto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de registro de pago */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              {selectedStudent && `Ingrese los datos del pago para ${selectedStudent.name} (${selectedStudent.id})`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="payment-amount">Monto</Label>
              <Input id="payment-amount" type="number" defaultValue={selectedStudent?.totalDebt.toString()} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="payment-method">Método de Pago</Label>
              <Select defaultValue="cash">
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="deposit">Depósito</SelectItem>
                  <SelectItem value="check">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="payment-reference">Referencia / No. de Boleta</Label>
              <Input id="payment-reference" placeholder="Ej: 123456789" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="payment-date">Fecha de Pago</Label>
              <Input type="date" id="payment-date" defaultValue={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="payment-notes">Notas</Label>
              <Textarea id="payment-notes" placeholder="Observaciones adicionales..." rows={2} />
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Importante</AlertTitle>
              <AlertDescription>
                {selectedStudent && selectedStudent.status === "bloqueado"
                  ? "Al registrar este pago, se desbloqueará automáticamente el acceso del alumno a la plataforma."
                  : "Verifique los datos antes de registrar el pago."}
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancelar
            </Button>
            <Button>Registrar Pago</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de plan de pago */}
      <Dialog open={showPaymentPlanDialog} onOpenChange={setShowPaymentPlanDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedPlan ? "Detalles del Plan de Pago" : "Crear Plan de Pago"}</DialogTitle>
            <DialogDescription>
              {selectedPlan
                ? `Plan de pago ${selectedPlan.id} para ${selectedPlan.studentName}`
                : selectedStudent && `Configure un plan de pago especial para ${selectedStudent.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {selectedPlan ? (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Información del Plan</h3>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2">
                          <div className="text-sm font-medium">ID del Plan:</div>
                          <div className="text-sm">{selectedPlan.id}</div>
                        </div>
                        <div className="grid grid-cols-2">
                          <div className="text-sm font-medium">Alumno:</div>
                          <div className="text-sm">{selectedPlan.studentName}</div>
                        </div>
                        <div className="grid grid-cols-2">
                          <div className="text-sm font-medium">ID del Alumno:</div>
                          <div className="text-sm">{selectedPlan.studentId}</div>
                        </div>
                        <div className="grid grid-cols-2">
                          <div className="text-sm font-medium">Deuda Original:</div>
                          <div className="text-sm">Q{selectedPlan.originalDebt.toLocaleString()}</div>
                        </div>
                        <div className="grid grid-cols-2">
                          <div className="text-sm font-medium">Deuda Actual:</div>
                          <div className="text-sm">Q{selectedPlan.currentDebt.toLocaleString()}</div>
                        </div>
                        <div className="grid grid-cols-2">
                          <div className="text-sm font-medium">Fecha de Inicio:</div>
                          <div className="text-sm">{new Date(selectedPlan.startDate).toLocaleDateString()}</div>
                        </div>
                        <div className="grid grid-cols-2">
                          <div className="text-sm font-medium">Fecha de Fin:</div>
                          <div className="text-sm">{new Date(selectedPlan.endDate).toLocaleDateString()}</div>
                        </div>
                        <div className="grid grid-cols-2">
                          <div className="text-sm font-medium">Estado:</div>
                          <div className="text-sm">
                            <Badge variant={getBadgeVariant(selectedPlan.status)}>
                              {selectedPlan.status === "activo" ? "Activo" : "Completado"}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2">
                          <div className="text-sm font-medium">Creado por:</div>
                          <div className="text-sm">{selectedPlan.createdBy}</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Notas</h3>
                      <div className="text-sm p-3 bg-muted rounded-md">{selectedPlan.notes}</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Cuotas del Plan</h3>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>No.</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Vencimiento</TableHead>
                            <TableHead>Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedPlan.installments.map((installment: any) => (
                            <TableRow key={installment.number}>
                              <TableCell>{installment.number}</TableCell>
                              <TableCell>Q{installment.amount.toLocaleString()}</TableCell>
                              <TableCell>{new Date(installment.dueDate).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Badge variant={getBadgeVariant(installment.status)}>
                                  {installment.status === "completado" ? "Pagado" : "Pendiente"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="mt-4">
                      <Progress
                        value={
                          (selectedPlan.installments.filter((i: any) => i.status === "completado").length /
                            selectedPlan.installments.length) *
                          100
                        }
                        className="h-2"
                      />
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>Progreso del Plan</span>
                        <span>
                          {selectedPlan.installments.filter((i: any) => i.status === "completado").length} de{" "}
                          {selectedPlan.installments.length} cuotas pagadas
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text-center py-8 text-muted-foreground">
                  Formulario para crear un nuevo plan de pago con opciones para definir cuotas, fechas de vencimiento y
                  condiciones especiales
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentPlanDialog(false)}>
              {selectedPlan ? "Cerrar" : "Cancelar"}
            </Button>
            {!selectedPlan && <Button>Crear Plan de Pago</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

