"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Mail, Plus, Send, Trash, Edit, Eye, Calendar, Download, Upload, Copy } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function PlantillasMailingPage() {
  const [activeTab, setActiveTab] = useState<string>("templates")
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false)
  const [showSendMailDialog, setShowSendMailDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [templateType, setTemplateType] = useState<"email" | "document">("email")
  const [templateEditor, setTemplateEditor] = useState<"basic" | "advanced">("basic")
  const [showVariablesPanel, setShowVariablesPanel] = useState(false)

  // Datos de ejemplo para plantillas
  const templates = [
    { id: 1, name: "Bienvenida a Nuevos Alumnos", type: "Correo", lastModified: "2025-03-10", status: "Activo" },
    { id: 2, name: "Recordatorio de Pago", type: "Correo", lastModified: "2025-03-12", status: "Activo" },
    { id: 3, name: "Invitación a Graduación", type: "Correo", lastModified: "2025-03-15", status: "Activo" },
    { id: 4, name: "Certificado de Finalización", type: "Documento", lastModified: "2025-03-18", status: "Activo" },
    { id: 5, name: "Diploma Oficial", type: "Documento", lastModified: "2025-03-20", status: "Activo" },
    { id: 6, name: "Estado de Cuenta", type: "Documento", lastModified: "2025-03-22", status: "Inactivo" },
  ]

  // Datos de ejemplo para historial de envíos
  const mailingHistory = [
    {
      id: 1,
      template: "Bienvenida a Nuevos Alumnos",
      recipients: 45,
      sentDate: "2025-03-15 10:30",
      status: "Enviado",
      openRate: "68%",
    },
    {
      id: 2,
      template: "Recordatorio de Pago",
      recipients: 78,
      sentDate: "2025-03-16 09:15",
      status: "Enviado",
      openRate: "72%",
    },
    {
      id: 3,
      template: "Invitación a Graduación",
      recipients: 34,
      sentDate: "2025-03-18 14:45",
      status: "Enviado",
      openRate: "85%",
    },
    {
      id: 4,
      template: "Bienvenida a Nuevos Alumnos",
      recipients: 12,
      sentDate: "2025-03-20 11:20",
      status: "Enviado",
      openRate: "75%",
    },
    {
      id: 5,
      template: "Recordatorio de Pago",
      recipients: 56,
      sentDate: "2025-03-25 15:30",
      status: "Programado",
      openRate: "-",
    },
  ]

  // Variables disponibles para plantillas
  const availableVariables = [
    { name: "nombre_alumno", description: "Nombre completo del alumno", example: "Juan Pérez" },
    { name: "fecha", description: "Fecha actual", example: new Date().toLocaleDateString() },
    { name: "programa", description: "Nombre del programa o carrera", example: "Desarrollo Web" },
    { name: "monto", description: "Monto a pagar (para recordatorios)", example: "$1,500.00" },
    { name: "fecha_limite", description: "Fecha límite de pago", example: "30/04/2025" },
    { name: "codigo_alumno", description: "Código o matrícula del alumno", example: "A2025-0123" },
    { name: "nombre_curso", description: "Nombre del curso", example: "Introducción a JavaScript" },
    { name: "nombre_docente", description: "Nombre del docente", example: "Dra. María Rodríguez" },
    { name: "fecha_evento", description: "Fecha de un evento", example: "15/06/2025" },
    { name: "lugar_evento", description: "Lugar de un evento", example: "Auditorio Principal" },
  ]

  // Función para previsualizar una plantilla
  const handlePreviewTemplate = (template: any) => {
    setSelectedTemplate(template)
    setShowPreviewDialog(true)
  }

  // Función para insertar una variable en el editor
  const insertVariable = (variable: string) => {
    // En una implementación real, esto insertaría la variable en el punto de cursor del editor
    console.log(`Insertar variable: {{${variable}}}`)
  }

  // Dummy data for preview
  const nombre_alumno = "Juan Pérez"
  const fecha = new Date().toLocaleDateString()
  const programa = "Ingeniería Informática"
  const monto = "$1,500.00"

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Plantillas y Mailing</h1>
        <div className="flex items-center space-x-2">
          {activeTab === "templates" && (
            <Dialog open={showNewTemplateDialog} onOpenChange={setShowNewTemplateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-1" />
                  Nueva Plantilla
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Plantilla</DialogTitle>
                  <DialogDescription>Diseñe una nueva plantilla para correos o documentos.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="templateName" className="text-right">
                      Nombre
                    </Label>
                    <Input id="templateName" placeholder="Nombre de la plantilla" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="templateType" className="text-right">
                      Tipo
                    </Label>
                    <RadioGroup
                      defaultValue="email"
                      className="col-span-3 flex space-x-4"
                      onValueChange={(value) => setTemplateType(value as "email" | "document")}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="email" id="email" />
                        <Label htmlFor="email">Correo Electrónico</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="document" id="document" />
                        <Label htmlFor="document">Documento</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {templateType === "email" && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="subject" className="text-right">
                        Asunto
                      </Label>
                      <Input id="subject" placeholder="Asunto del correo" className="col-span-3" />
                    </div>
                  )}

                  <div className="grid grid-cols-4 items-start gap-4">
                    <div className="text-right pt-2">
                      <Label htmlFor="editorType">Tipo de Editor</Label>
                    </div>
                    <div className="col-span-3 flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="basic"
                          id="basic"
                          checked={templateEditor === "basic"}
                          onClick={() => setTemplateEditor("basic")}
                        />
                        <Label htmlFor="basic">Básico</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="advanced"
                          id="advanced"
                          checked={templateEditor === "advanced"}
                          onClick={() => setTemplateEditor("advanced")}
                        />
                        <Label htmlFor="advanced">Avanzado (HTML)</Label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="content" className="text-right pt-2">
                      Contenido
                    </Label>
                    <div className="col-span-3 space-y-2">
                      {templateEditor === "basic" ? (
                        <Textarea
                          id="content"
                          placeholder="Contenido de la plantilla. Puede usar variables como {{nombre_alumno}}, {{fecha}}, etc."
                          className="min-h-[200px]"
                        />
                      ) : (
                        <div className="border rounded-md">
                          <div className="bg-gray-100 p-2 border-b flex justify-between items-center">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                B
                              </Button>
                              <Button variant="ghost" size="sm">
                                I
                              </Button>
                              <Button variant="ghost" size="sm">
                                U
                              </Button>
                              <Button variant="ghost" size="sm">
                                A
                              </Button>
                              <Button variant="ghost" size="sm">
                                🔗
                              </Button>
                              <Button variant="ghost" size="sm">
                                📷
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowVariablesPanel(!showVariablesPanel)}
                            >
                              Variables
                            </Button>
                          </div>
                          <Textarea
                            id="htmlContent"
                            placeholder="<p>Contenido HTML de la plantilla. Puede usar variables como {{nombre_alumno}}, {{fecha}}, etc.</p>"
                            className="min-h-[200px] border-0 rounded-none"
                          />
                        </div>
                      )}

                      {showVariablesPanel && (
                        <div className="border p-3 rounded-md bg-gray-50">
                          <h4 className="font-medium mb-2">Variables Disponibles</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {availableVariables.map((variable) => (
                              <Button
                                key={variable.name}
                                variant="outline"
                                size="sm"
                                onClick={() => insertVariable(variable.name)}
                                className="justify-start"
                              >
                                <span className="truncate">
                                  {`{{${variable.name}}}`} - {variable.description}
                                </span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-sm text-gray-500">
                        <p>Variables disponibles:</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                          {availableVariables.slice(0, 6).map((variable) => (
                            <div key={variable.name} className="flex items-center">
                              <span className="text-blue-600 font-mono text-xs">{`{{${variable.name}}}`}:</span>
                              <span className="ml-1 text-xs">{variable.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {templateType === "document" && (
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="documentTemplate" className="text-right pt-2">
                        Plantilla Base
                      </Label>
                      <div className="col-span-3 flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Upload className="h-4 w-4 mr-1" />
                          Subir Plantilla
                        </Button>
                        <span className="text-sm text-gray-500">Formatos soportados: PDF, DOCX</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="templateStatus" className="text-right">
                      Estado
                    </Label>
                    <div className="col-span-3 flex items-center space-x-2">
                      <Switch id="templateStatus" defaultChecked />
                      <Label htmlFor="templateStatus">Activo</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewTemplateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => setShowNewTemplateDialog(false)}>Guardar Plantilla</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {activeTab === "mailing" && (
            <Dialog open={showSendMailDialog} onOpenChange={setShowSendMailDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Send className="h-4 w-4 mr-1" />
                  Enviar Correo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Enviar Correo Masivo</DialogTitle>
                  <DialogDescription>Configure y envíe un correo a múltiples destinatarios.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="emailTemplate" className="text-right">
                      Plantilla
                    </Label>
                    <Select>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Seleccionar plantilla" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="welcome">Bienvenida a Nuevos Alumnos</SelectItem>
                        <SelectItem value="payment">Recordatorio de Pago</SelectItem>
                        <SelectItem value="graduation">Invitación a Graduación</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="recipients" className="text-right">
                      Destinatarios
                    </Label>
                    <Select>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Seleccionar grupo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los alumnos</SelectItem>
                        <SelectItem value="new">Alumnos nuevos</SelectItem>
                        <SelectItem value="graduating">Alumnos por graduarse</SelectItem>
                        <SelectItem value="pending">Pagos pendientes</SelectItem>
                        <SelectItem value="custom">Lista personalizada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="recipientFilters" className="text-right pt-2">
                      Filtros Adicionales
                    </Label>
                    <div className="col-span-3 space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="filterProgram" className="h-4 w-4" />
                        <Label htmlFor="filterProgram">Filtrar por Programa</Label>
                        <Select disabled>
                          <SelectTrigger className="w-[180px] ml-2">
                            <SelectValue placeholder="Seleccionar programa" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="web">Desarrollo Web</SelectItem>
                            <SelectItem value="marketing">Marketing Digital</SelectItem>
                            <SelectItem value="design">Diseño Gráfico</SelectItem>
                            <SelectItem value="accounting">Contabilidad</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="filterStatus" className="h-4 w-4" />
                        <Label htmlFor="filterStatus">Filtrar por Estado</Label>
                        <Select disabled>
                          <SelectTrigger className="w-[180px] ml-2">
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Activo</SelectItem>
                            <SelectItem value="inactive">Inactivo</SelectItem>
                            <SelectItem value="pending">Pendiente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="filterCustom" className="h-4 w-4" />
                        <Label htmlFor="filterCustom">Subir Lista Personalizada</Label>
                        <Button variant="outline" size="sm" className="ml-2" disabled>
                          <Upload className="h-4 w-4 mr-1" />
                          Subir CSV
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="scheduledDate" className="text-right">
                      Programar Envío
                    </Label>
                    <div className="col-span-3 flex space-x-2">
                      <div className="flex items-center space-x-2">
                        <input type="radio" id="sendNow" name="sendTime" className="h-4 w-4" defaultChecked />
                        <Label htmlFor="sendNow">Enviar ahora</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="radio" id="sendLater" name="sendTime" className="h-4 w-4" />
                        <Label htmlFor="sendLater">Programar</Label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <div className="text-right">
                      <span className="text-transparent">.</span>
                    </div>
                    <div className="col-span-3 flex space-x-2">
                      <Input id="scheduledDate" type="date" className="flex-1" disabled />
                      <Input id="scheduledTime" type="time" className="w-32" disabled />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="antiSpamSettings" className="text-right">
                      Configuración Anti-SPAM
                    </Label>
                    <div className="col-span-3 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch id="useInstitutionalEmail" defaultChecked />
                        <Label htmlFor="useInstitutionalEmail">Usar correo institucional verificado</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="addUnsubscribeLink" defaultChecked />
                        <Label htmlFor="addUnsubscribeLink">Incluir enlace para cancelar suscripción</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="avoidSpamWords" defaultChecked />
                        <Label htmlFor="avoidSpamWords">Verificar palabras que activan filtros de spam</Label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="preview" className="text-right pt-2">
                      Vista Previa
                    </Label>
                    <div className="col-span-3 p-4 border rounded-md bg-gray-50 min-h-[200px]">
                      <p className="font-medium">Asunto: Bienvenida a Nuevos Alumnos</p>
                      <div className="mt-2">
                        <p>Estimado/a {nombre_alumno},</p>
                        <p className="mt-2">
                          ¡Te damos la más cordial bienvenida a nuestra institución! Estamos muy contentos de que hayas
                          decidido formar parte de nuestro programa de {programa}.
                        </p>
                        <p className="mt-2">
                          En los próximos días recibirás información importante sobre el inicio de clases, acceso a
                          plataformas y recursos académicos.
                        </p>
                        <p className="mt-2">Si tienes alguna duda, no dudes en contactarnos.</p>
                        <p className="mt-2">Saludos cordiales,</p>
                        <p>Equipo Académico</p>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowSendMailDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => setShowSendMailDialog(false)}>Enviar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
          <TabsTrigger value="mailing">Historial de Envíos</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Plantillas Disponibles</CardTitle>
              <div className="flex items-center space-x-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="email">Correo</SelectItem>
                    <SelectItem value="document">Documento</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Buscar plantilla..." className="w-[200px]" />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Última Modificación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>{template.id}</TableCell>
                      <TableCell>{template.name}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${template.type === "Correo" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}
                        >
                          {template.type}
                        </span>
                      </TableCell>
                      <TableCell>{template.lastModified}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${template.status === "Activo" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                        >
                          {template.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handlePreviewTemplate(template)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Plantillas Recientes</CardTitle>
                <CardDescription>Últimas plantillas creadas o modificadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {templates.slice(0, 3).map((template) => (
                    <div key={template.id} className="flex items-start p-3 bg-gray-50 rounded-md">
                      {template.type === "Correo" ? (
                        <Mail className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                      ) : (
                        <FileText className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                      )}
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-gray-600">Modificado: {template.lastModified}</p>
                        <p className="text-sm text-gray-600">Estado: {template.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Variables Disponibles</CardTitle>
                <CardDescription>Variables que puede usar en sus plantillas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {availableVariables.map((variable) => (
                    <div key={variable.name} className="flex items-start p-2 border-b last:border-0">
                      <div className="flex-1">
                        <p className="font-medium text-blue-600 font-mono">{`{{${variable.name}}}`}:</p>
                        <p className="text-sm text-gray-600">{variable.description}</p>
                      </div>
                      <div className="text-sm text-gray-500">Ejemplo: {variable.example}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mailing" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Historial de Envíos</CardTitle>
              <div className="flex items-center space-x-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="sent">Enviado</SelectItem>
                    <SelectItem value="scheduled">Programado</SelectItem>
                    <SelectItem value="failed">Fallido</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Buscar envío..." className="w-[200px]" />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Plantilla</TableHead>
                    <TableHead>Destinatarios</TableHead>
                    <TableHead>Fecha de Envío</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Tasa de Apertura</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mailingHistory.map((mail) => (
                    <TableRow key={mail.id}>
                      <TableCell>{mail.id}</TableCell>
                      <TableCell>{mail.template}</TableCell>
                      <TableCell>{mail.recipients}</TableCell>
                      <TableCell>{mail.sentDate}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            mail.status === "Enviado"
                              ? "bg-green-100 text-green-800"
                              : mail.status === "Programado"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {mail.status}
                        </span>
                      </TableCell>
                      <TableCell>{mail.openRate}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Correos Enviados</p>
                    <h3 className="text-2xl font-bold mt-1">225</h3>
                    <p className="text-xs text-gray-500 mt-1">Últimos 30 días</p>
                  </div>
                  <Send className="h-10 w-10 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tasa de Apertura</p>
                    <h3 className="text-2xl font-bold mt-1">72.5%</h3>
                    <p className="text-xs text-gray-500 mt-1">Promedio</p>
                  </div>
                  <Eye className="h-10 w-10 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Próximos Envíos</p>
                    <h3 className="text-2xl font-bold mt-1">3</h3>
                    <p className="text-xs text-gray-500 mt-1">Programados</p>
                  </div>
                  <Calendar className="h-10 w-10 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Próximos Envíos Programados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start p-3 bg-blue-50 rounded-md">
                  <Calendar className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Recordatorio de Pago</h4>
                    <p className="text-sm text-gray-600">Programado para: 25/03/2025 15:30</p>
                    <p className="text-sm text-gray-600">Destinatarios: 56 alumnos con pagos pendientes</p>
                    <div className="flex mt-2">
                      <Button variant="outline" size="sm" className="mr-2">
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      <Button variant="outline" size="sm" className="mr-2">
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
                        <Trash className="h-3 w-3 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start p-3 bg-blue-50 rounded-md">
                  <Calendar className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Invitación a Evento</h4>
                    <p className="text-sm text-gray-600">Programado para: 01/04/2025 09:00</p>
                    <p className="text-sm text-gray-600">Destinatarios: 120 alumnos activos</p>
                    <div className="flex mt-2">
                      <Button variant="outline" size="sm" className="mr-2">
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      <Button variant="outline" size="sm" className="mr-2">
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
                        <Trash className="h-3 w-3 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start p-3 bg-blue-50 rounded-md">
                  <Calendar className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Notificación de Calificaciones</h4>
                    <p className="text-sm text-gray-600">Programado para: 10/04/2025 14:00</p>
                    <p className="text-sm text-gray-600">Destinatarios: 85 alumnos del curso "Desarrollo Web"</p>
                    <div className="flex mt-2">
                      <Button variant="outline" size="sm" className="mr-2">
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      <Button variant="outline" size="sm" className="mr-2">
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
                        <Trash className="h-3 w-3 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analíticas de Envíos</CardTitle>
              <CardDescription>Estadísticas y métricas de rendimiento de sus envíos de correo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md mb-6">
                <p className="text-gray-500">Gráfica de rendimiento de envíos (últimos 6 meses)</p>
                {/* Aquí iría el componente de gráfica real */}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center">
                      <p className="text-sm font-medium text-gray-500">Tasa de Apertura</p>
                      <h3 className="text-2xl font-bold mt-1">72.5%</h3>
                      <p className="text-xs text-green-500 mt-1">+5.2% vs. mes anterior</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center">
                      <p className="text-sm font-medium text-gray-500">Tasa de Clics</p>
                      <h3 className="text-2xl font-bold mt-1">38.2%</h3>
                      <p className="text-xs text-green-500 mt-1">+2.8% vs. mes anterior</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center">
                      <p className="text-sm font-medium text-gray-500">Rebotes</p>
                      <h3 className="text-2xl font-bold mt-1">2.1%</h3>
                      <p className="text-xs text-red-500 mt-1">+0.3% vs. mes anterior</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center">
                      <p className="text-sm font-medium text-gray-500">Cancelaciones</p>
                      <h3 className="text-2xl font-bold mt-1">0.8%</h3>
                      <p className="text-xs text-green-500 mt-1">-0.2% vs. mes anterior</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento por Plantilla</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plantilla</TableHead>
                      <TableHead>Envíos</TableHead>
                      <TableHead>Apertura</TableHead>
                      <TableHead>Clics</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Bienvenida a Nuevos Alumnos</TableCell>
                      <TableCell>57</TableCell>
                      <TableCell>85.2%</TableCell>
                      <TableCell>42.1%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Recordatorio de Pago</TableCell>
                      <TableCell>78</TableCell>
                      <TableCell>72.8%</TableCell>
                      <TableCell>38.5%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Invitación a Graduación</TableCell>
                      <TableCell>34</TableCell>
                      <TableCell>91.2%</TableCell>
                      <TableCell>65.7%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mejores Horarios de Envío</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
                  <p className="text-gray-500">Gráfica de rendimiento por hora del día</p>
                  {/* Aquí iría el componente de gráfica real */}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Correo</CardTitle>
              <CardDescription>Configure los ajustes para el envío de correos electrónicos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Configuración del Remitente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="senderName">Nombre del Remitente</Label>
                      <Input id="senderName" defaultValue="BlueAtlas Educación" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="senderEmail">Correo del Remitente</Label>
                      <Input id="senderEmail" defaultValue="notificaciones@blueatlas.edu" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="replyToEmail">Correo de Respuesta</Label>
                      <Input id="replyToEmail" defaultValue="soporte@blueatlas.edu" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Configuración Anti-SPAM</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="spfEnabled" defaultChecked />
                      <Label htmlFor="spfEnabled">Habilitar SPF (Sender Policy Framework)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="dkimEnabled" defaultChecked />
                      <Label htmlFor="dkimEnabled">Habilitar DKIM (DomainKeys Identified Mail)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="unsubscribeLink" defaultChecked />
                      <Label htmlFor="unsubscribeLink">
                        Incluir enlace para cancelar suscripción en todos los correos
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="spamCheck" defaultChecked />
                      <Label htmlFor="spamCheck">Verificar contenido contra filtros de spam comunes</Label>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Límites de Envío</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dailyLimit">Límite Diario de Envíos</Label>
                      <Input id="dailyLimit" type="number" defaultValue="1000" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hourlyLimit">Límite por Hora</Label>
                      <Input id="hourlyLimit" type="number" defaultValue="200" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Firma Institucional</h3>
                  <div className="space-y-2">
                    <Label htmlFor="signature">Firma Predeterminada</Label>
                    <Textarea
                      id="signature"
                      className="min-h-[100px]"
                      defaultValue="BlueAtlas Educación\nTel: (555) 123-4567\nwww.blueatlas.edu\n\nEste correo es confidencial y está dirigido exclusivamente a su destinatario."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline">Cancelar</Button>
                  <Button>Guardar Configuración</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de vista previa de plantilla */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Vista Previa de Plantilla</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="py-4">
              <div className="bg-white border rounded-md p-6">
                {selectedTemplate.type === "Correo" ? (
                  <>
                    <div className="border-b pb-2 mb-4">
                      <p className="font-medium">Asunto: {selectedTemplate.name}</p>
                      <p className="text-sm text-gray-500">
                        De: BlueAtlas Educación &lt;notificaciones@blueatlas.edu&gt;
                      </p>
                      <p className="text-sm text-gray-500">Para: {nombre_alumno} &lt;juan.perez@example.com&gt;</p>
                    </div>
                    <div>
                      <p>Estimado/a {nombre_alumno},</p>
                      <p className="mt-2">
                        ¡Te damos la más cordial bienvenida a nuestra institución! Estamos muy contentos de que hayas
                        decidido formar parte de nuestro programa de {programa}.
                      </p>
                      <p className="mt-2">
                        En los próximos días recibirás información importante sobre el inicio de clases, acceso a
                        plataformas y recursos académicos.
                      </p>
                      <p className="mt-2">Si tienes alguna duda, no dudes en contactarnos.</p>
                      <p className="mt-2">Saludos cordiales,</p>
                      <p>Equipo Académico</p>
                      <div className="mt-4 pt-4 border-t text-sm text-gray-500">
                        <p>BlueAtlas Educación</p>
                        <p>Tel: (555) 123-4567</p>
                        <p>www.blueatlas.edu</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold mb-2">BlueAtlas Educación</h2>
                      <h3 className="text-xl">{selectedTemplate.name}</h3>
                    </div>
                    <div className="w-full max-w-md border-4 border-blue-200 p-8 rounded-md text-center">
                      <p className="text-lg mb-4">Se certifica que:</p>
                      <p className="text-xl font-bold mb-6">{nombre_alumno}</p>
                      <p className="mb-4">Ha completado satisfactoriamente el programa de:</p>
                      <p className="text-lg font-semibold mb-6">{programa}</p>
                      <p className="mb-8">Con fecha {fecha}</p>
                      <div className="flex justify-between mt-12">
                        <div className="text-center">
                          <div className="border-t border-black pt-2 w-32 mx-auto">
                            <p className="text-sm">Director Académico</p>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="border-t border-black pt-2 w-32 mx-auto">
                            <p className="text-sm">Coordinador de Programa</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Cerrar
            </Button>
            <Button>Editar Plantilla</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

