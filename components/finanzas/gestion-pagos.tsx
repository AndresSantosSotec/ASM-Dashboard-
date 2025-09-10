"use client"

import { useState, useEffect } from "react"
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
import {
  // existentes
  getPayments,
  createPayment,
  getPaymentPlans,
  createPaymentPlan,
  getCollectionLogs,
  createCollectionLog,
} from "@/services/finance"
import type { LatePaymentStudent, PaymentPlanPreview } from "@/types/collections"
import { toast } from "@/hooks/use-toast"

export function GestionPagos() {
  const [activeTab, setActiveTab] = useState("late-payments")

  // dialogs
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [showPaymentPlanDialog, setShowPaymentPlanDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null)
  const [contactType, setContactType] = useState<string>("llamada")
  const [contactNotes, setContactNotes] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<string>("cash")

  // filters
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  })
  const [invoices, setInvoices] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [paymentPlans, setPaymentPlans] = useState<any[]>([])
  const [collectionLogs, setCollectionLogs] = useState<any[]>([])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      try {
        const [inv, pay, plans, logs] = await Promise.all([
          getInvoices({}),
          getPayments({}),
          getPaymentPlans({}),
          getCollectionLogs({}),
        ])
        setInvoices(inv)
        setPayments(pay)
        setPaymentPlans(plans)
        setCollectionLogs(Array.isArray(logs.data) ? logs.data : logs)
      } catch (e) {
        console.error('Error loading payment data:', e)
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los datos de pagos',
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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

  const getBucketVariant = (b: string) => {
    switch (b) {
      case "B1":
        return "outline"
      case "B2":
        return "secondary"
      case "B3":
        return "default"
      case "B4":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getBucketText = (b: string) => {
    switch (b) {
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

  // --- handlers de diálogos ---
  const openContactDialog = async (student: any) => {
    setSelectedStudent(student)
    setContactType("llamada")
    setContactNotes("")

    try {
      const snap = await fetchStudentSnapshot(student.id) // student.id = EP id
      const mappedHistory = (snap?.contact_history ?? []).map((c: any) => ({
        type: c.type,
        notes: c.notes,
        agent: c.agent,
        date: c.created_at, // adaptamos al render
      }))
      setSelectedStudent((prev: any) => ({
        ...prev,
        contactHistory: mappedHistory,
      }))
    } catch {
      // si falla, abrimos igual con lo que tengamos
    } finally {
      setShowContactDialog(true)
    }
  }

  const openPaymentPlanDialog = (student: any) => {
    setSelectedStudent(student)
    setShowPaymentPlanDialog(true)
  }

  const openPaymentDialog = async (student: any) => {
    setSelectedStudent(student)
    setPaymentMethod("cash")
    setShowPaymentDialog(true)
  }

  const openPlanDetailsDialog = (plan: any) => {
    setSelectedPlan(plan)
    setShowPaymentPlanDialog(true)
  }

  // --- acciones ---
  const saveContact = async () => {
    try {
      const promise = (document.getElementById("promise-date") as HTMLInputElement)?.value || null
      await createCollectionLog({
        estudiante_programa_id: selectedStudent?.id, // EP id
        type: contactType,
        notes: contactNotes,
        promise_date: promise || null,
      })
      toast({ title: "Contacto registrado" })
      setShowContactDialog(false)
      await loadLatePayments()
    } catch {
      toast({ title: "Error", description: "No se pudo registrar el contacto" })
    }
  }

  const savePayment = async () => {
    try {
      const amount = Number((document.getElementById("payment-amount") as HTMLInputElement)?.value ?? 0)
      const reference = (document.getElementById("payment-reference") as HTMLInputElement)?.value ?? ""
      const paymentDate = (document.getElementById("payment-date") as HTMLInputElement)?.value ?? ""
      const notes = (document.getElementById("payment-notes") as HTMLTextAreaElement)?.value ?? ""

      await createPayment({
        estudiante_programa_id: selectedStudent?.id, // EP id
        monto_pagado: amount,
        metodo_pago: paymentMethod,
        referencia: reference,
        fecha_pago: paymentDate,
        notas: notes,
        estado_pago: "aprobado",
      })

      toast({ title: "Pago registrado correctamente" })
      setShowPaymentDialog(false)
      await loadLatePayments()
    } catch {
      toast({ title: "Error", description: "No se pudo registrar el pago" })
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

        {/* --- Pagos atrasados --- */}
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
                      placeholder="Buscar alumno, carnet o EP ID..."
                      className="pl-8 w-full md:w-[250px]"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setPage(1)
                      }}
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
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-4">
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((student) => (
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
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>

            <CardFooter className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Mostrando {invoices.length} alumnos con pagos atrasados
              </div>
              <div className="flex items-center gap-2">
                <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1) }}>
                  <SelectTrigger className="w-[110px]"><SelectValue placeholder="Filas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>
                    Anterior
                  </Button>
                  <span className="text-sm">Página {page}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={invoices.length < perPage || loading}>
                    Siguiente
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline">
                    <Mail className="mr-2 h-4 w-4" /> Enviar Recordatorios
                  </Button>
                  <Button variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" /> Enviar SMS
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* --- Planes de pago --- */}
        <TabsContent value="payment-plans" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Planes de Pago Especiales</CardTitle>
                  <CardDescription>Acuerdos de pago y convenios con alumnos</CardDescription>
                </div>
                <Button onClick={() => setShowPaymentPlanDialog(true)}>
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
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-4">
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : paymentPlans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No hay planes de pago
                      </TableCell>
                    </TableRow>
                  ) : (
                    paymentPlans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">{plan.id}</TableCell>
                        <TableCell>
                          <div>{plan.studentName}</div>
                          <div className="text-xs text-muted-foreground">{plan.studentId}</div>
                        </TableCell>
                        <TableCell>Q{plan.originalDebt.toLocaleString()}</TableCell>
                        <TableCell>Q{plan.currentDebt.toLocaleString()}</TableCell>
                        <TableCell>
                          {plan.installments.length} (
                          {plan.installments.filter((i: any) => i.status === "completado").length} pagadas)
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
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Seguimiento --- */}
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

      {/* --- Diálogo de contacto --- */}
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
                  {(selectedStudent as any).contactHistory.map((contact: any, index: number) => (
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
            <Button onClick={saveContact}>Guardar Contacto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Diálogo de pago --- */}
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
              <Input id="payment-amount" type="number" defaultValue={selectedStudent?.totalDebt?.toString() ?? "0"} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="payment-method">Método de Pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
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
            <Button onClick={savePayment}>Registrar Pago</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Diálogo de plan de pago --- */}
      <Dialog open={showPaymentPlanDialog} onOpenChange={setShowPaymentPlanDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPlan ? "Detalles del Plan de Pago" : "Crear Plan de Pago"}</DialogTitle>
            <DialogDescription>
              {selectedPlan
                ? `Plan de pago ${selectedPlan.id} para ${selectedPlan.studentName}`
                : selectedStudent && `Configure un plan de pago especial para ${selectedStudent.name} (EP-${selectedStudent.id})`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {!selectedPlan && selectedStudent && (
              <>
                {/* Form para configurar el plan */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Configuración del Plan</h3>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="plan-months">Número de Cuotas (opcional)</Label>
                      <Input
                        id="plan-months"
                        type="number"
                        min="1"
                        max="24"
                        placeholder="Dejar vacío para cálculo automático"
                        value={planMonths || ""}
                        onChange={(e) => setPlanMonths(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="plan-start-date">Fecha de Inicio (opcional)</Label>
                      <Input
                        id="plan-start-date"
                        type="date"
                        value={planStartDate}
                        onChange={(e) => setPlanStartDate(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="include-late-fees" 
                        checked={includLateFees}
                        onCheckedChange={(checked) => setIncludLateFees(!!checked)}
                      />
                      <Label htmlFor="include-late-fees">Incluir recargos por mora</Label>
                    </div>
                    
                    <Button 
                      onClick={() => generatePaymentPlanPreview(selectedStudent.id, planMonths, planStartDate)}
                      disabled={loadingPreview}
                    >
                      {loadingPreview ? "Generando..." : "Actualizar Vista Previa"}
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Vista Previa del Plan</h3>
                    {loadingPreview ? (
                      <div className="text-center py-8">
                        <div className="text-muted-foreground">Generando vista previa...</div>
                      </div>
                    ) : previewPlan ? (
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="font-medium">Deuda Original:</div>
                          <div>Q{previewPlan.originalDebt.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</div>
                          
                          <div className="font-medium">Recargos por Mora:</div>
                          <div className={previewPlan.lateFeeTotal > 0 ? "text-orange-600" : ""}>
                            Q{previewPlan.lateFeeTotal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                          </div>
                          
                          <div className="font-medium">Total a Pagar:</div>
                          <div className="font-bold">Q{previewPlan.total.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</div>
                          
                          <div className="font-medium">Número de Cuotas:</div>
                          <div>{previewPlan.months}</div>
                          
                          <div className="font-medium">Fecha de Inicio:</div>
                          <div>{new Date(previewPlan.startDate).toLocaleDateString('es-GT')}</div>
                          
                          <div className="font-medium">Día de Vencimiento:</div>
                          <div>Día {previewPlan.dueDay} de cada mes</div>
                          
                          <div className="font-medium">Cuota Mensual:</div>
                          <div className="font-bold">Q{previewPlan.installmentAmount.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</div>
                        </div>
                        
                        {previewPlan.installments.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">Cronograma de Pagos</h4>
                            <div className="border rounded-md max-h-60 overflow-y-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>No.</TableHead>
                                    <TableHead>Monto</TableHead>
                                    <TableHead>Vencimiento</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {previewPlan.installments.slice(0, 10).map((installment) => (
                                    <TableRow key={installment.number}>
                                      <TableCell>{installment.number}</TableCell>
                                      <TableCell>Q{installment.amount.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</TableCell>
                                      <TableCell>{new Date(installment.dueDate).toLocaleDateString('es-GT')}</TableCell>
                                    </TableRow>
                                  ))}
                                  {previewPlan.installments.length > 10 && (
                                    <TableRow>
                                      <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                                        ... y {previewPlan.installments.length - 10} cuotas más
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Haga clic en "Actualizar Vista Previa" para ver los detalles del plan
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            
            {selectedPlan && (
              <>
                {/* Vista de plan existente - mantener código existente */}
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
                          <div className="text-sm font-medium">Deuda Original:</div>
                          <div className="text-sm">Q{selectedPlan.originalDebt.toLocaleString()}</div>
                        </div>
                        <div className="grid grid-cols-2">
                          <div className="text-sm font-medium">Estado:</div>
                          <div className="text-sm">
                            <Badge variant={getBadgeVariant(selectedPlan.status)}>
                              {selectedPlan.status === "activo" ? "Activo" : "Completado"}
                            </Badge>
                          </div>
                        </div>
                      </div>
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
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentPlanDialog(false)}>
              {selectedPlan ? "Cerrar" : "Cancelar"}
            </Button>
            {!selectedPlan && (
              <Button
                onClick={async () => {
                  try {
                    await createPaymentPlan({ prospecto_id: selectedStudent?.id })
                    toast({ title: 'Plan de pago creado' })
                    setShowPaymentPlanDialog(false)
                  } catch (e) {
                    toast({ title: 'Error', description: 'No se pudo crear el plan' })
                  }
                }}
              >
                Crear Plan de Pago
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
