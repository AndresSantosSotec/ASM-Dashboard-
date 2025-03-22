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
  CheckCircle,
  AlertCircle,
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  Send,
  CalendarIcon,
  Plus,
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
import { Textarea } from "@/components/ui/textarea"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Separator } from "@/components/ui/separator"

// Datos de ejemplo para el seguimiento de cobros
const collectionData = {
  pendingStudents: [
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
      score: 85,
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
      score: 72,
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
      score: 92,
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
      score: 65,
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
      score: 78,
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
  promisesCalendar: [
    {
      id: "prom-001",
      studentId: "2023-0042",
      studentName: "Carlos Méndez",
      promiseDate: "2025-03-15",
      amount: 2850,
      status: "pendiente",
      notes: "Prometió pagar después de recibir su sueldo",
    },
    {
      id: "prom-002",
      studentId: "2023-0078",
      studentName: "Ana Lucía Gómez",
      promiseDate: "2025-03-20",
      amount: 1450,
      status: "pendiente",
      notes: "Esperando transferencia de sus padres",
    },
    {
      id: "prom-003",
      studentId: "2023-0091",
      studentName: "Juan Pablo Herrera",
      promiseDate: "2025-03-13",
      amount: 1450,
      status: "pendiente",
      notes: "Pagará con tarjeta de crédito",
    },
    {
      id: "prom-004",
      studentId: "2023-0112",
      studentName: "Lucía Ramírez",
      promiseDate: "2025-03-12",
      amount: 1400,
      status: "cumplida",
      notes: "Pagó en efectivo en oficina central",
    },
    {
      id: "prom-005",
      studentId: "2023-0098",
      studentName: "Pedro Alvarado",
      promiseDate: "2025-03-10",
      amount: 1400,
      status: "incumplida",
      notes: "No realizó el pago en la fecha acordada",
    },
  ],
  messageTemplates: [
    {
      id: "tmpl-001",
      name: "Recordatorio de promesa",
      type: "sms",
      content:
        "Estimado/a {nombre}, le recordamos que tiene un compromiso de pago para el día {fecha_promesa} por Q{monto}. Gracias.",
    },
    {
      id: "tmpl-002",
      name: "Seguimiento de mora",
      type: "email",
      content:
        "Estimado/a {nombre}, su cuenta presenta un atraso de {dias_mora} días. Por favor, regularice su situación lo antes posible para evitar recargos adicionales.",
    },
    {
      id: "tmpl-003",
      name: "Aviso de bloqueo",
      type: "sms",
      content:
        "Estimado/a {nombre}, su cuenta será bloqueada en 5 días si no realiza el pago pendiente de Q{monto}. Contáctenos para resolver su situación.",
    },
  ],
}

export function SeguimientoCobros() {
  const [activeTab, setActiveTab] = useState("pending-students")
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [showPromiseDialog, setShowPromiseDialog] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null)
  const [selectedPromise, setSelectedPromise] = useState<any | null>(null)
  const [contactType, setContactType] = useState<string>("llamada")
  const [contactNotes, setContactNotes] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [messageContent, setMessageContent] = useState<string>("")
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(new Date().setDate(new Date().getDate() + 7)),
  })

  // Función para abrir el diálogo de contacto
  const openContactDialog = (student: any) => {
    setSelectedStudent(student)
    setContactType("llamada")
    setContactNotes("")
    setShowContactDialog(true)
  }

  // Función para abrir el diálogo de mensaje
  const openMessageDialog = (student: any) => {
    setSelectedStudent(student)
    setSelectedTemplate("")
    setMessageContent("")
    setShowMessageDialog(true)
  }

  // Función para abrir el diálogo de promesa de pago
  const openPromiseDialog = (student: any, promise: any = null) => {
    setSelectedStudent(student)
    setSelectedPromise(promise)
    setShowPromiseDialog(true)
  }

  // Función para manejar la selección de plantilla
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = collectionData.messageTemplates.find((t) => t.id === templateId)
    if (template && selectedStudent) {
      let content = template.content
        .replace("{nombre}", selectedStudent.name)
        .replace("{dias_mora}", selectedStudent.daysLate.toString())
        .replace("{monto}", selectedStudent.totalDebt.toLocaleString())

      if (selectedStudent.promiseDate) {
        content = content.replace("{fecha_promesa}", new Date(selectedStudent.promiseDate).toLocaleDateString())
      }

      setMessageContent(content)
    }
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
      case "pendiente":
        return "outline"
      case "cumplida":
        return "default"
      case "incumplida":
        return "destructive"
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
          <h2 className="text-3xl font-bold tracking-tight">Seguimiento de Cobros</h2>
          <p className="text-muted-foreground">Gestión y seguimiento de alumnos con pagos pendientes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Exportar Listado
          </Button>
          <Button>
            <Send className="mr-2 h-4 w-4" /> Campaña Masiva
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pending-students" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending-students">Alumnos Pendientes</TabsTrigger>
          <TabsTrigger value="promises-calendar">Calendario de Promesas</TabsTrigger>
          <TabsTrigger value="message-templates">Plantillas de Mensajes</TabsTrigger>
        </TabsList>

        <TabsContent value="pending-students" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Alumnos con Pagos Pendientes</CardTitle>
                  <CardDescription>Listado de alumnos para seguimiento de cobro</CardDescription>
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
                    <TableHead>Deuda</TableHead>
                    <TableHead>Días Atraso</TableHead>
                    <TableHead>Bucket</TableHead>
                    <TableHead>Punteo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Último Contacto</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collectionData.pendingStudents.map((student) => (
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
                      <TableCell>
                        <div>Q{student.totalDebt.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {student.lateMonths} {student.lateMonths === 1 ? "mes" : "meses"}
                        </div>
                      </TableCell>
                      <TableCell>{student.daysLate}</TableCell>
                      <TableCell>
                        <Badge variant={getBucketVariant(student.bucket)}>
                          {student.bucket} ({getBucketText(student.bucket)})
                        </Badge>
                      </TableCell>
                      <TableCell>{student.score}</TableCell>
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
                            <Phone className="h-4 w-4 mr-1" /> Llamar
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openMessageDialog(student)}>
                            <MessageSquare className="h-4 w-4 mr-1" /> Mensaje
                          </Button>
                          <Button size="sm" onClick={() => openPromiseDialog(student)}>
                            <Calendar className="h-4 w-4 mr-1" /> Promesa
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
                Mostrando {collectionData.pendingStudents.length} alumnos con pagos pendientes
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

        <TabsContent value="promises-calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Calendario de Promesas de Pago</CardTitle>
                  <CardDescription>Seguimiento de compromisos de pago acordados con alumnos</CardDescription>
                </div>
                <DatePickerWithRange className="w-auto" value={dateRange} onChange={setDateRange} />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alumno</TableHead>
                    <TableHead>Fecha Promesa</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collectionData.promisesCalendar.map((promise) => (
                    <TableRow key={promise.id}>
                      <TableCell>
                        <div className="font-medium">{promise.studentName}</div>
                        <div className="text-xs text-muted-foreground">{promise.studentId}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4 text-blue-500" />
                          <span>{new Date(promise.promiseDate).toLocaleDateString()}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(promise.promiseDate) > new Date()
                            ? `Faltan ${Math.ceil((new Date(promise.promiseDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} días`
                            : `Hace ${Math.ceil((new Date().getTime() - new Date(promise.promiseDate).getTime()) / (1000 * 60 * 60 * 24))} días`}
                        </div>
                      </TableCell>
                      <TableCell>Q{promise.amount.toLocaleString()}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{promise.notes}</TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(promise.status)}>
                          {promise.status === "pendiente"
                            ? "Pendiente"
                            : promise.status === "cumplida"
                              ? "Cumplida"
                              : "Incumplida"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              openPromiseDialog(
                                collectionData.pendingStudents.find((s) => s.id === promise.studentId),
                                promise,
                              )
                            }
                          >
                            <FileText className="h-4 w-4 mr-1" /> Detalles
                          </Button>
                          {promise.status === "pendiente" && (
                            <Button size="sm" onClick={() => {}}>
                              <CheckCircle className="h-4 w-4 mr-1" /> Confirmar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="ml-auto">
                <Download className="mr-2 h-4 w-4" /> Exportar Calendario
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="message-templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Plantillas de Mensajes</CardTitle>
                  <CardDescription>Administre las plantillas para comunicación con alumnos</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Nueva Plantilla
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Contenido</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collectionData.messageTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {template.type === "email" ? "Email" : template.type === "sms" ? "SMS" : "WhatsApp"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[500px] truncate">{template.content}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-1" /> Editar
                          </Button>
                          <Button variant="outline" size="sm">
                            <Send className="h-4 w-4 mr-1" /> Usar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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

      {/* Diálogo de envío de mensaje */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Mensaje</DialogTitle>
            <DialogDescription>
              {selectedStudent && `Envíe un mensaje a ${selectedStudent.name} (${selectedStudent.id})`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="message-type">Tipo de Mensaje</Label>
              <Select defaultValue="sms">
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el tipo de mensaje" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message-template">Plantilla</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una plantilla" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin plantilla</SelectItem>
                  {collectionData.messageTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message-content">Mensaje</Label>
              <Textarea
                id="message-content"
                placeholder="Ingrese el contenido del mensaje..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Puede usar variables como {"{nombre}"}, {"{monto}"}, {"{fecha_vencimiento}"} en el mensaje
              </p>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Información</AlertTitle>
              <AlertDescription>
                Este mensaje quedará registrado en el historial de contactos del alumno.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
              Cancelar
            </Button>
            <Button>
              <Send className="mr-2 h-4 w-4" /> Enviar Mensaje
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de promesa de pago */}
      <Dialog open={showPromiseDialog} onOpenChange={setShowPromiseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedPromise ? "Detalles de Promesa de Pago" : "Registrar Promesa de Pago"}</DialogTitle>
            <DialogDescription>
              {selectedPromise
                ? `Detalles de la promesa de pago de ${selectedPromise.studentName}`
                : selectedStudent && `Registre un compromiso de pago para ${selectedStudent.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedPromise ? (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Alumno</Label>
                  <div className="p-2 bg-muted rounded-md">
                    <div className="font-medium">{selectedPromise.studentName}</div>
                    <div className="text-sm text-muted-foreground">{selectedPromise.studentId}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Fecha Prometida</Label>
                    <div className="p-2 bg-muted rounded-md">
                      {new Date(selectedPromise.promiseDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Monto</Label>
                    <div className="p-2 bg-muted rounded-md">Q{selectedPromise.amount.toLocaleString()}</div>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Estado</Label>
                  <div className="p-2 bg-muted rounded-md">
                    <Badge variant={getBadgeVariant(selectedPromise.status)}>
                      {selectedPromise.status === "pendiente"
                        ? "Pendiente"
                        : selectedPromise.status === "cumplida"
                          ? "Cumplida"
                          : "Incumplida"}
                    </Badge>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Notas</Label>
                  <div className="p-2 bg-muted rounded-md">{selectedPromise.notes}</div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Actualizar Estado</Label>
                  <Select defaultValue={selectedPromise.status}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="cumplida">Cumplida</SelectItem>
                      <SelectItem value="incumplida">Incumplida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="update-notes">Notas de Actualización</Label>
                  <Textarea id="update-notes" placeholder="Ingrese notas sobre la actualización..." rows={2} />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="promise-date">Fecha de Promesa</Label>
                  <Input type="date" id="promise-date" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="promise-amount">Monto Prometido (Q)</Label>
                  <Input id="promise-amount" type="number" defaultValue={selectedStudent?.totalDebt.toString()} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="promise-notes">Notas</Label>
                  <Textarea id="promise-notes" placeholder="Ingrese detalles sobre la promesa de pago..." rows={3} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reminder-date">Recordatorio</Label>
                  <div className="flex items-center gap-2">
                    <Input type="date" id="reminder-date" className="flex-1" />
                    <Select defaultValue="email">
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="call">Llamada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Programar un recordatorio antes de la fecha de promesa
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPromiseDialog(false)}>
              {selectedPromise ? "Cerrar" : "Cancelar"}
            </Button>
            {selectedPromise ? <Button>Actualizar Estado</Button> : <Button>Registrar Promesa</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

