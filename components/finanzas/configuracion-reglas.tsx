"use client"

import { useState, useEffect } from "react"
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
import {
  getPaymentRules,
  updatePaymentRules,
  createNotificationRule,
  updateNotificationRule,
  deleteNotificationRule,
} from "@/services/finance"
import { toast } from "@/hooks/use-toast"


export function ConfiguracionReglas() {
  const [activeTab, setActiveTab] = useState("general")
  const [generalRules, setGeneralRules] = useState<any>({})
  const [notificationRules, setNotificationRules] = useState<any[]>([])
  const [blockingRules, setBlockingRules] = useState<any[]>([])
  const [paymentGateways, setPaymentGateways] = useState<any[]>([])
  const [exceptionCategories, setExceptionCategories] = useState<any[]>([])
  const [selectedNotifications, setSelectedNotifications] = useState<
    Set<number>
  >(new Set())
  const [editingNotification, setEditingNotification] = useState<any | null>(null)
  const [showNotificationForm, setShowNotificationForm] = useState(false)
  const [notificationForm, setNotificationForm] = useState({
    name: '',
    type: 'email',
    triggerDays: 0,
    active: true,
    message: '',
  })

  const refreshRules = async () => {
    try {
      const data = await getPaymentRules()
      if (data) {
        const rule = Array.isArray(data) ? data[0] : data
        setGeneralRules((prev) => ({ ...prev, ...rule }))
        setNotificationRules(rule.notificationRules || [])
        setBlockingRules(rule.blockingRules || [])
        setPaymentGateways(rule.paymentGateways || [])
        setExceptionCategories(rule.exceptionCategories || [])
      }
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudieron cargar las reglas' })
    }
  }

  useEffect(() => {
    refreshRules()
  }, [])

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
    if (notification) {
      setNotificationForm({
        name: notification.name,
        type: notification.type,
        triggerDays: notification.triggerDays,
        active: notification.active,
        message: notification.message,
      })
    } else {
      setNotificationForm({ name: '', type: 'email', triggerDays: 0, active: true, message: '' })
    }
    setShowNotificationForm(true)
  }

  const toggleNotificationSelection = (id: number, checked: boolean) => {
    setSelectedNotifications((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }

  const handleDeleteSelected = async () => {
    if (selectedNotifications.size === 0) return
    try {
      await Promise.all(
        Array.from(selectedNotifications).map((id) =>
          deleteNotificationRule(generalRules.id ?? 1, id),
        ),
      )
      setSelectedNotifications(new Set())
      toast({ title: 'Notificaciones eliminadas' })
      await refreshRules()
    } catch (e) {
      toast({
        title: 'Error',
        description: 'No se pudieron eliminar las notificaciones',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configuración de Reglas</h2>
          <p className="text-muted-foreground">Administre las reglas de pagos, notificaciones y bloqueos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={async () => {
              try {
                await updatePaymentRules(generalRules.id ?? 1, {
                  ...generalRules,
                  notificationRules,
                  blockingRules,
                  paymentGateways,
                  exceptionCategories,
                })
                toast({ title: 'Cambios guardados' })
              } catch (e) {
                toast({ title: 'Error', description: 'No se pudieron guardar los cambios' })
              }
            }}
          >
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
                      value={generalRules.dueDateDay ?? ""}

                      onChange={(e) =>
                        handleGeneralRuleChange(
                          "dueDateDay",
                          e.target.value === "" ? undefined : Number(e.target.value),
                        )
                      }

                    />
                    <p className="text-xs text-muted-foreground">Día del mes en que vencen los pagos mensuales</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lateFeeAmount">Monto de recargo por mora (Q)</Label>
                    <Input
                      id="lateFeeAmount"
                      type="number"
                      min="0"
                      value={generalRules.lateFeeAmount ?? ""}

                      onChange={(e) =>
                        handleGeneralRuleChange(
                          "lateFeeAmount",
                          e.target.value === "" ? undefined : Number(e.target.value),
                        )
                      }

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
                      value={generalRules.blockAfterMonths ?? ""}

                      onChange={(e) =>
                        handleGeneralRuleChange(
                          "blockAfterMonths",
                          e.target.value === "" ? undefined : Number(e.target.value),
                        )
                      }

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
              <Button
                onClick={async () => {
                  try {
                await updatePaymentRules(generalRules.id ?? 1, {
                      ...generalRules,
                      notificationRules,
                      blockingRules,
                      paymentGateways,
                      exceptionCategories,
                    })
                    toast({ title: 'Configuración guardada' })
                  } catch (e) {
                    toast({ title: 'Error', description: 'No se pudo guardar la configuración' })
                  }
                }}
              >
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
                  {notificationRules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Sin datos
                      </TableCell>
                    </TableRow>
                  ) : (
                    notificationRules.map((notification) => {
                      return (
                        <TableRow key={notification.id}>
                          <TableCell>
                            <Checkbox
                              id={`select-${notification.id}`}
                              checked={selectedNotifications.has(notification.id)}
                              onCheckedChange={(checked) =>
                                toggleNotificationSelection(
                                  notification.id,
                                  !!checked,
                                )
                              }
                            />
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
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {notificationRules.length} notificaciones configuradas
              </div>
              <Button variant="outline" onClick={handleDeleteSelected}>
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
                      value={notificationForm.name}
                      onChange={(e) =>
                        setNotificationForm({ ...notificationForm, name: e.target.value })
                      }
                      placeholder="Ej: Recordatorio de pago"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notification-type">Tipo</Label>
                    <Select
                      value={notificationForm.type}
                      onValueChange={(val) =>
                        setNotificationForm({ ...notificationForm, type: val })
                      }
                    >
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
                      value={notificationForm.triggerDays}
                      onChange={(e) =>
                        setNotificationForm({
                          ...notificationForm,
                          triggerDays: Number(e.target.value),
                        })
                      }
                      placeholder="-3 (antes), 0 (día de), 5 (después)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Número de días antes (-) o después (+) de la fecha de vencimiento
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notification-active">Estado</Label>
                    <Select
                      value={notificationForm.active ? 'active' : 'inactive'}
                      onValueChange={(val) =>
                        setNotificationForm({
                          ...notificationForm,
                          active: val === 'active',
                        })
                      }
                    >
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
                    value={notificationForm.message}
                    onChange={(e) =>
                      setNotificationForm({ ...notificationForm, message: e.target.value })
                    }
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
                <Button
                  onClick={async () => {
                    try {
                      if (editingNotification) {
                        await updateNotificationRule(
                          generalRules.id ?? 1,
                          editingNotification.id,
                          notificationForm,
                        )
                        toast({ title: 'Notificación actualizada' })
                      } else {
                        await createNotificationRule(
                          generalRules.id ?? 1,
                          notificationForm,
                        )
                        toast({ title: 'Notificación creada' })
                      }
                      setShowNotificationForm(false)
                      await refreshRules()
                    } catch (e) {
                      toast({
                        title: 'Error',
                        description: 'No se pudo guardar la notificación',
                      })
                    }
                  }}
                >
                  {editingNotification ? 'Actualizar' : 'Crear'} Notificación
                </Button>
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
                  {blockingRules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Sin datos
                      </TableCell>
                    </TableRow>
                  ) : (

                    blockingRules.map((rule) => {
                      return (
                        <TableRow key={rule.id}>

                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell>{rule.description}</TableCell>
                        <TableCell>{rule.daysAfterDue}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {rule.services.map((service, index) => {
                              return (
                                <Badge key={index} variant="outline">
                                  {service === "plataforma"
                                    ? "Plataforma"
                                    : service === "evaluaciones"
                                      ? "Evaluaciones"
                                      : service === "materiales"
                                        ? "Materiales"
                                        : service}
                                </Badge>
                              )
                            })}
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
                      )
                      }))}
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
                  {paymentGateways.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        Sin datos
                      </TableCell>
                    </TableRow>
                  ) : (

                    paymentGateways.map((gateway) => {
                      return (
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
                      )
                      }))}
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
                  {exceptionCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        Sin datos
                      </TableCell>
                    </TableRow>
                  ) : (
                    exceptionCategories.map((category) => {
                      return (
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
                      )
                      }))}
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
