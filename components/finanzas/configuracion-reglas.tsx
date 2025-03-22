"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Save, Plus, Trash2, Settings } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

// Datos de ejemplo para la configuración de reglas
const rulesData = {
  generalRules: {
    dueDateDay: 5,
    lateFeeAmount: 50,
    blockAfterMonths: 2,
    sendAutomaticReminders: true,
    allowPartialPayments: false,
    requireReceiptUpload: true,
    autoUnblockAfterPayment: true,
  },
  notificationRules: [
    {
      id: "not-1",
      name: "Recordatorio previo",
      type: "email",
      triggerDays: -3,
      message: "Recordatorio: Su pago vence en 3 días. Por favor, realice su pago a tiempo para evitar recargos.",
      active: true,
    },
    {
      id: "not-2",
      name: "Día de vencimiento",
      type: "sms",
      triggerDays: 0,
      message: "Hoy vence su pago mensual. Realice su pago para evitar recargos por mora.",
      active: true,
    },
    {
      id: "not-3",
      name: "Primer recordatorio",
      type: "email",
      triggerDays: 1,
      message:
        "Su pago está vencido por 1 día. Por favor, realice su pago lo antes posible para evitar recargos adicionales.",
      active: true,
    },
    {
      id: "not-4",
      name: "Aviso de recargo",
      type: "sms",
      triggerDays: 5,
      message: "Su pago está vencido por 5 días. Se ha aplicado un recargo de Q50 a su cuenta.",
      active: true,
    },
    {
      id: "not-5",
      name: "Aviso de bloqueo",
      type: "email",
      triggerDays: 45,
      message:
        "Su cuenta será bloqueada en 15 días si no realiza el pago pendiente. Por favor, regularice su situación.",
      active: true,
    },
  ],
  blockingRules: [
    {
      id: "block-1",
      name: "Bloqueo por mora",
      description: "Bloqueo automático después de 2 meses sin pago",
      daysAfterDue: 60,
      services: ["plataforma", "evaluaciones", "materiales"],
      active: true,
    },
    {
      id: "block-2",
      name: "Bloqueo parcial",
      description: "Bloqueo de evaluaciones después de 1 mes sin pago",
      daysAfterDue: 30,
      services: ["evaluaciones"],
      active: true,
    },
  ],
  paymentGateways: [
    {
      id: "pg-1",
      name: "Pagalo",
      description: "Pasarela de pago Pagalo",
      active: true,
      fee: 4.5,
      apiKey: "********",
      merchantId: "MERCHANT123",
    },
    {
      id: "pg-2",
      name: "VisaNet",
      description: "Pasarela de pago VisaNet",
      active: true,
      fee: 3.8,
      apiKey: "********",
      merchantId: "VISANET456",
    },
    {
      id: "pg-3",
      name: "Stripe",
      description: "Pasarela de pago Stripe",
      active: false,
      fee: 2.9,
      apiKey: "",
      merchantId: "",
    },
    {
      id: "pg-4",
      name: "NeoNet",
      description: "Pasarela de pago NeoNet",
      active: false,
      fee: 3.5,
      apiKey: "",
      merchantId: "",
    },
  ],
  exceptionCategories: [
    {
      id: "exc-1",
      name: "Becados",
      description: "Alumnos con beca completa o parcial",
      rules: {
        skipLateFee: true,
        extendedDueDate: 15,
        allowPartialPayments: true,
        skipBlocking: false,
      },
    },
    {
      id: "exc-2",
      name: "Convenios Empresariales",
      description: "Alumnos con convenio a través de empresas",
      rules: {
        skipLateFee: false,
        extendedDueDate: 10,
        allowPartialPayments: false,
        skipBlocking: true,
      },
    },
    {
      id: "exc-3",
      name: "Casos Especiales",
      description: "Alumnos con situaciones particulares aprobadas",
      rules: {
        skipLateFee: true,
        extendedDueDate: 20,
        allowPartialPayments: true,
        skipBlocking: true,
      },
    },
  ],
}

export function ConfiguracionReglas() {
  const [activeTab, setActiveTab] = useState("general")
  const [generalRules, setGeneralRules] = useState(rulesData.generalRules)
  const [editingNotification, setEditingNotification] = useState<any | null>(null)
  const [showNotificationForm, setShowNotificationForm] = useState(false)

  // Función para manejar cambios en las reglas generales
  const handleGeneralRuleChange = (key: string, value: any) => {
    setGeneralRules({
      ...generalRules,
      [key]: value,
    })
  }

  // Función para abrir el formulario de notificación
  const openNotificationForm = (notification: any = null) => {
    setEditingNotification(notification)
    setShowNotificationForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configuración de Reglas</h2>
          <p className="text-muted-foreground">Administre las reglas de pagos, notificaciones y bloqueos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <Save className="mr-2 h-4 w-4" /> Guardar Cambios
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">Reglas Generales</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="blocking">Bloqueos</TabsTrigger>
          <TabsTrigger value="gateways">Pasarelas de Pago</TabsTrigger>
          <TabsTrigger value="exceptions">Excepciones</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General de Pagos</CardTitle>
              <CardDescription>Configure las reglas básicas para el procesamiento de pagos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dueDateDay">Día de vencimiento mensual</Label>
                    <Input
                      id="dueDateDay"
                      type="number"
                      min="1"
                      max="28"
                      value={generalRules.dueDateDay}
                      onChange={(e) => handleGeneralRuleChange("dueDateDay", Number.parseInt(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">Día del mes en que vencen los pagos mensuales</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lateFeeAmount">Monto de recargo por mora (Q)</Label>
                    <Input
                      id="lateFeeAmount"
                      type="number"
                      min="0"
                      value={generalRules.lateFeeAmount}
                      onChange={(e) => handleGeneralRuleChange("lateFeeAmount", Number.parseInt(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Cantidad que se cargará automáticamente por pagos atrasados
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="blockAfterMonths">Bloquear después de (meses)</Label>
                    <Input
                      id="blockAfterMonths"
                      type="number"
                      min="1"
                      max="12"
                      value={generalRules.blockAfterMonths}
                      onChange={(e) => handleGeneralRuleChange("blockAfterMonths", Number.parseInt(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Número de meses sin pago antes de bloquear la plataforma
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <Label htmlFor="sendAutomaticReminders">Enviar recordatorios automáticos</Label>
                    <Switch
                      id="sendAutomaticReminders"
                      checked={generalRules.sendAutomaticReminders}
                      onCheckedChange={(checked) => handleGeneralRuleChange("sendAutomaticReminders", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <Label htmlFor="allowPartialPayments">Permitir pagos parciales</Label>
                    <Switch
                      id="allowPartialPayments"
                      checked={generalRules.allowPartialPayments}
                      onCheckedChange={(checked) => handleGeneralRuleChange("allowPartialPayments", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <Label htmlFor="requireReceiptUpload">Requerir carga de recibo</Label>
                    <Switch
                      id="requireReceiptUpload"
                      checked={generalRules.requireReceiptUpload}
                      onCheckedChange={(checked) => handleGeneralRuleChange("requireReceiptUpload", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <Label htmlFor="autoUnblockAfterPayment">Desbloquear automáticamente después del pago</Label>
                    <Switch
                      id="autoUnblockAfterPayment"
                      checked={generalRules.autoUnblockAfterPayment}
                      onCheckedChange={(checked) => handleGeneralRuleChange("autoUnblockAfterPayment", checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Importante</AlertTitle>
                <AlertDescription>
                  Los cambios en estas reglas afectarán a todos los alumnos a menos que tengan una excepción
                  configurada. Asegúrese de revisar cuidadosamente antes de guardar.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>
                <Save className="mr-2 h-4 w-4" /> Guardar Configuración
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Configuración de Notificaciones</CardTitle>
                <CardDescription>Administre las notificaciones automáticas para pagos</CardDescription>
              </div>
              <Button onClick={() => openNotificationForm()} className="mt-4 md:mt-0">
                <Plus className="mr-2 h-4 w-4" /> Nueva Notificación
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Días Relativos</TableHead>
                    <TableHead>Mensaje</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rulesData.notificationRules.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell>
                        <Checkbox id={`select-${notification.id}`} />
                      </TableCell>
                      <TableCell className="font-medium">{notification.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {notification.type === "email" ? "Email" : notification.type === "sms" ? "SMS" : "WhatsApp"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {notification.triggerDays === 0
                          ? "Día de vencimiento"
                          : notification.triggerDays < 0
                            ? `${Math.abs(notification.triggerDays)} días antes`
                            : `${notification.triggerDays} días después`}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">{notification.message}</TableCell>
                      <TableCell>
                        <Badge variant={notification.active ? "default" : "outline"}>
                          {notification.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openNotificationForm(notification)}>
                          <Settings className="h-4 w-4 mr-1" /> Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {rulesData.notificationRules.length} notificaciones configuradas
              </div>
              <Button variant="outline">
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar Seleccionadas
              </Button>
            </CardFooter>
          </Card>

          {showNotificationForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingNotification ? "Editar Notificación" : "Nueva Notificación"}</CardTitle>
                <CardDescription>
                  {editingNotification
                    ? "Modifique los detalles de la notificación"
                    : "Configure una nueva notificación automática"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="notification-name">Nombre</Label>
                    <Input
                      id="notification-name"
                      defaultValue={editingNotification?.name || ""}
                      placeholder="Ej: Recordatorio de pago"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notification-type">Tipo</Label>
                    <Select defaultValue={editingNotification?.type || "email"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione el tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="notification-days">Días Relativos</Label>
                    <Input
                      id="notification-days"
                      type="number"
                      defaultValue={editingNotification?.triggerDays || 0}
                      placeholder="-3 (antes), 0 (día de), 5 (después)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Número de días antes (-) o después (+) de la fecha de vencimiento
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notification-active">Estado</Label>
                    <Select defaultValue={editingNotification?.active ? "active" : "inactive"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione el estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notification-message">Mensaje</Label>
                  <Input
                    id="notification-message"
                    defaultValue={editingNotification?.message || ""}
                    placeholder="Ingrese el mensaje de la notificación"
                  />
                  <p className="text-xs text-muted-foreground">
                    Puede usar variables como {"{nombre}"}, {"{monto}"}, {"{fecha_vencimiento}"} en el mensaje
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setShowNotificationForm(false)}>
                  Cancelar
                </Button>
                <Button>{editingNotification ? "Actualizar" : "Crear"} Notificación</Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="blocking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reglas de Bloqueo</CardTitle>
              <CardDescription>Configure las condiciones para bloqueo automático de servicios</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Días Después de Vencimiento</TableHead>
                    <TableHead>Servicios Afectados</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rulesData.blockingRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>{rule.description}</TableCell>
                      <TableCell>{rule.daysAfterDue}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {rule.services.map((service, index) => (
                            <Badge key={index} variant="outline">
                              {service === "plataforma"
                                ? "Plataforma"
                                : service === "evaluaciones"
                                  ? "Evaluaciones"
                                  : service === "materiales"
                                    ? "Materiales"
                                    : service}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={rule.active ? "default" : "outline"}>
                          {rule.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4 mr-1" /> Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">
                <Plus className="mr-2 h-4 w-4" /> Nueva Regla de Bloqueo
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="gateways" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pasarelas de Pago</CardTitle>
              <CardDescription>Configure las pasarelas de pago disponibles para los alumnos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Comisión (%)</TableHead>
                    <TableHead>API Key</TableHead>
                    <TableHead>Merchant ID</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rulesData.paymentGateways.map((gateway) => (
                    <TableRow key={gateway.id}>
                      <TableCell className="font-medium">{gateway.name}</TableCell>
                      <TableCell>{gateway.description}</TableCell>
                      <TableCell>{gateway.fee}%</TableCell>
                      <TableCell>{gateway.apiKey || "No configurado"}</TableCell>
                      <TableCell>{gateway.merchantId || "No configurado"}</TableCell>
                      <TableCell>
                        <Badge variant={gateway.active ? "default" : "outline"}>
                          {gateway.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4 mr-1" /> Configurar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">
                <Plus className="mr-2 h-4 w-4" /> Agregar Pasarela
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="exceptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Categorías de Excepción</CardTitle>
              <CardDescription>Configure reglas especiales para grupos específicos de alumnos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Exención de Mora</TableHead>
                    <TableHead>Día de Vencimiento</TableHead>
                    <TableHead>Pagos Parciales</TableHead>
                    <TableHead>Exención de Bloqueo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rulesData.exceptionCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.description}</TableCell>
                      <TableCell>
                        {category.rules.skipLateFee ? (
                          <Badge variant="default" className="bg-green-500">
                            Sí
                          </Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>Día {category.rules.extendedDueDate}</TableCell>
                      <TableCell>
                        {category.rules.allowPartialPayments ? (
                          <Badge variant="default" className="bg-green-500">
                            Permitidos
                          </Badge>
                        ) : (
                          <Badge variant="outline">No permitidos</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {category.rules.skipBlocking ? (
                          <Badge variant="default" className="bg-green-500">
                            Sí
                          </Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4 mr-1" /> Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">
                <Plus className="mr-2 h-4 w-4" /> Nueva Categoría
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

