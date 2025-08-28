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
import { AlertCircle, Save, Plus, Trash2, Settings, Eye } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  getPaymentRules,
  getCurrentPaymentRule,
  updatePaymentRules,
  createPaymentRule,
  createNotificationRule,
  updateNotificationRule,
  deleteNotificationRule,
  fetchNotificationRulesByRule,
  fetchBlockingRulesByRule,
  createBlockingRule,
  updateBlockingRule,
  deleteBlockingRule,
} from "@/services/finance"
import { toast } from "@/hooks/use-toast"

export function ConfiguracionReglas() {
  const [activeTab, setActiveTab] = useState("general")
  const [generalRules, setGeneralRules] = useState<any>({})
  const [notificationRules, setNotificationRules] = useState<any[]>([])
  const [blockingRules, setBlockingRules] = useState<any[]>([])
  const [paymentGateways, setPaymentGateways] = useState<any[]>([])
  const [exceptionCategories, setExceptionCategories] = useState<any[]>([])
  const [selectedNotifications, setSelectedNotifications] = useState<Set<number>>(new Set())
  const [selectedBlockingRules, setSelectedBlockingRules] = useState<Set<number>>(new Set())
  const [editingNotification, setEditingNotification] = useState<any | null>(null)
  const [editingBlockingRule, setEditingBlockingRule] = useState<any | null>(null)
  const [showNotificationForm, setShowNotificationForm] = useState(false)
  const [notificationForm, setNotificationForm] = useState({
    type: 'email',
    triggerDays: 0,
    message: '',
  })

  const [showBlockingDialog, setShowBlockingDialog] = useState(false)
  const [blockingForm, setBlockingForm] = useState({
    name: '',
    description: '',
    daysAfterDue: 1,
    services: [] as string[],
    active: true,
  })

  const [showGatewayDialog, setShowGatewayDialog] = useState(false)
  const [gatewayForm, setGatewayForm] = useState({
    name: '',
    description: '',
    fee: 0,
    apiKey: '',
    merchantId: '',
    active: true,
  })

  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    rules: {
      skipLateFee: false,
      extendedDueDate: 1,
      allowPartialPayments: false,
      skipBlocking: false,
    },
  })

  const [showRulesDialog, setShowRulesDialog] = useState(false)

  // *** FUNCIONES DE MAPEO API ⇄ UI ***

  function mapFromApiRule(apiRule: any) {
    if (!apiRule) return {}

    return {
      id: apiRule.id,
      // API -> UI
      dueDateDay: apiRule.due_day ?? undefined,
      lateFeeAmount: apiRule.late_fee_amount !== undefined
        ? Number(apiRule.late_fee_amount)
        : undefined,
      blockAfterMonths: apiRule.block_after_months ?? undefined,
      sendAutomaticReminders: !!apiRule.send_automatic_reminders,

      // Campos que hoy solo existen en UI (mantener estado local sin romper)
      allowPartialPayments: apiRule.allow_partial_payments ?? false,
      requireReceiptUpload: apiRule.require_receipt_upload ?? false,
      autoUnblockAfterPayment: apiRule.auto_unblock_after_payment ?? true,

      // Si en backend metes esto como JSON (gateway_config)
      paymentGateways: Array.isArray(apiRule.gateway_config)
        ? apiRule.gateway_config
        : (apiRule.gateway_config ?? []),
    }
  }

  // *** MAPEAR NOTIFICACIONES ***
  function mapNotificationsFromApi(apiList: any[]) {
    return (apiList ?? []).map((n: any) => ({
      id: n.id,
      type: n.type ?? 'email',
      triggerDays: Number(n.offset_days ?? 0),
      message: n.message ?? '',
      displayName: `${n.type === 'email' ? 'Email' : n.type === 'sms' ? 'SMS' : 'WhatsApp'} - ${
        n.offset_days === 0 
          ? 'Día vencimiento' 
          : n.offset_days < 0 
            ? `${Math.abs(n.offset_days)} días antes`
            : `${n.offset_days} días después`
      }`
    }))
  }

  // *** NUEVO: MAPEAR REGLAS DE BLOQUEO ***
  function mapBlockingRulesFromApi(apiList: any[]) {
    return (apiList ?? []).map((b: any) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      daysAfterDue: Number(b.days_after_due),
      services: b.affected_services || [],
      active: !!b.active,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    }))
  }

  // Envía solo lo que valida tu backend hoy
  function mapToApiFields(uiData: any) {
    return {
      due_day: uiData.dueDateDay,
      late_fee_amount: uiData.lateFeeAmount,
      block_after_months: uiData.blockAfterMonths,
      send_automatic_reminders: uiData.sendAutomaticReminders,
      gateway_config: uiData.paymentGateways ?? [],
    }
  }

  // *** CARGAR AL ENTRAR Y REFRESCAR (ACTUALIZADO) ***

  const refreshRules = async () => {
    try {
      // 1) regla vigente (current) o, si no hay, la de mayor id del listado
      let rule: any | null = null
      try {
        const current = await getCurrentPaymentRule()
        rule = current ?? null
      } catch {
        const list = await getPaymentRules()
        if (Array.isArray(list) && list.length > 0) {
          rule = [...list].sort((a, b) => (b.id ?? 0) - (a.id ?? 0))[0]
        } else {
          rule = null
        }
      }

      if (!rule) {
        setGeneralRules({})
        setNotificationRules([])
        setBlockingRules([])
        setPaymentGateways([])
        setExceptionCategories([])
        return
      }

      // 2) mapear regla API -> UI (campos generales)
      const mapped = mapFromApiRule(rule)
      setGeneralRules((prev: any) => ({ ...prev, ...mapped }))
      setPaymentGateways(mapped.paymentGateways ?? [])

      // 3) pedir notificaciones por endpoint dedicado
      const notifApi = await fetchNotificationRulesByRule(rule.id)
      notifApi.sort((a: any, b: any) => (a.offset_days ?? 0) - (b.offset_days ?? 0))
      const notifUi = mapNotificationsFromApi(notifApi)
      setNotificationRules(notifUi)

      // 4) *** NUEVO: cargar reglas de bloqueo ***
      const blockingApi = await fetchBlockingRulesByRule(rule.id)
      blockingApi.sort((a: any, b: any) => (a.days_after_due ?? 0) - (b.days_after_due ?? 0))
      const blockingUi = mapBlockingRulesFromApi(blockingApi)
      setBlockingRules(blockingUi)

      // 5) excepciones (por ahora locales)
      setExceptionCategories(rule.exceptionCategories ?? [])
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudieron cargar las reglas' })
    }
  }

  const persistRules = async (data: any) => {
    const apiData = mapToApiFields(data)
    if (generalRules.id) {
      await updatePaymentRules(generalRules.id, apiData)
    } else {
      const created = await createPaymentRule(apiData)
      if (created && created.id) {
        setGeneralRules((prev: any) => ({ ...prev, id: created.id }))
      }
    }
  }

  useEffect(() => {
    refreshRules()
  }, [])

  // Refrescar cada vez que abras el modal de "Ver Reglas"
  useEffect(() => {
    if (showRulesDialog) {
      refreshRules()
    }
  }, [showRulesDialog])

  // Recargar cuando entras al tab "Notificaciones"
  useEffect(() => {
    if (activeTab === 'notifications' && generalRules?.id) {
      fetchNotificationRulesByRule(generalRules.id)
        .then((list) => {
          list.sort((a: any, b: any) => (a.offset_days ?? 0) - (b.offset_days ?? 0))
          setNotificationRules(mapNotificationsFromApi(list))
        })
        .catch(() =>
          toast({ title: 'Error', description: 'No se pudieron cargar las notificaciones' })
        )
    }
  }, [activeTab, generalRules?.id])

  // *** NUEVO: Recargar cuando entras al tab "Bloqueos" ***
  useEffect(() => {
    if (activeTab === 'blocking' && generalRules?.id) {
      fetchBlockingRulesByRule(generalRules.id)
        .then((list) => {
          list.sort((a: any, b: any) => (a.days_after_due ?? 0) - (b.days_after_due ?? 0))
          setBlockingRules(mapBlockingRulesFromApi(list))
        })
        .catch(() =>
          toast({ title: 'Error', description: 'No se pudieron cargar las reglas de bloqueo' })
        )
    }
  }, [activeTab, generalRules?.id])

  // Función para manejar cambios en las reglas generales
  const handleGeneralRuleChange = (key: string, value: any) => {
    setGeneralRules({
      ...generalRules,
      [key]: value,
    })
  }

  // *** FUNCIONES DE NOTIFICACIONES ***
  const openNotificationForm = (notification: any = null) => {
    setEditingNotification(notification)
    if (notification) {
      setNotificationForm({
        type: notification.type,
        triggerDays: notification.triggerDays,
        message: notification.message,
      })
    } else {
      setNotificationForm({ 
        type: 'email', 
        triggerDays: 0, 
        message: '' 
      })
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

  const handleDeleteNotification = async (notificationId: number) => {
    if (!generalRules?.id) {
      toast({ title: 'Error', description: 'No hay regla general configurada' })
      return
    }

    try {
      await deleteNotificationRule(generalRules.id, notificationId)
      toast({ title: 'Notificación eliminada correctamente' })
      await refreshRules()
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'No se pudo eliminar la notificación' 
      })
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedNotifications.size === 0 || !generalRules?.id) {
      if (!generalRules?.id) {
        toast({ title: 'Error', description: 'Primero guarda la regla general' })
      }
      return
    }
    try {
      await Promise.all(
        Array.from(selectedNotifications).map((id) =>
          deleteNotificationRule(generalRules.id, id),
        ),
      )
      setSelectedNotifications(new Set())
      toast({ title: 'Notificaciones eliminadas' })
      await refreshRules()
    } catch {
      toast({ title: 'Error', description: 'No se pudieron eliminar las notificaciones' })
    }
  }

  // *** NUEVAS FUNCIONES DE BLOQUEO ***
  const openBlockingForm = (blockingRule: any = null) => {
    setEditingBlockingRule(blockingRule)
    if (blockingRule) {
      setBlockingForm({
        name: blockingRule.name,
        description: blockingRule.description,
        daysAfterDue: blockingRule.daysAfterDue,
        services: blockingRule.services,
        active: blockingRule.active,
      })
    } else {
      setBlockingForm({
        name: '',
        description: '',
        daysAfterDue: 1,
        services: [],
        active: true,
      })
    }
    setShowBlockingDialog(true)
  }

  const toggleBlockingRuleSelection = (id: number, checked: boolean) => {
    setSelectedBlockingRules((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }

  const handleDeleteBlockingRule = async (blockingRuleId: number) => {
    if (!generalRules?.id) {
      toast({ title: 'Error', description: 'No hay regla general configurada' })
      return
    }

    try {
      await deleteBlockingRule(generalRules.id, blockingRuleId)
      toast({ title: 'Regla de bloqueo eliminada correctamente' })
      await refreshRules()
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'No se pudo eliminar la regla de bloqueo' 
      })
    }
  }

  const handleDeleteSelectedBlockingRules = async () => {
    if (selectedBlockingRules.size === 0 || !generalRules?.id) {
      if (!generalRules?.id) {
        toast({ title: 'Error', description: 'Primero guarda la regla general' })
      }
      return
    }
    try {
      await Promise.all(
        Array.from(selectedBlockingRules).map((id) =>
          deleteBlockingRule(generalRules.id, id),
        ),
      )
      setSelectedBlockingRules(new Set())
      toast({ title: 'Reglas de bloqueo eliminadas' })
      await refreshRules()
    } catch {
      toast({ title: 'Error', description: 'No se pudieron eliminar las reglas de bloqueo' })
    }
  }

  const handleCreateBlockingRule = async () => {
    if (!generalRules?.id) {
      toast({ title: 'Error', description: 'Primero guarda la regla general' })
      return
    }
    try {
      if (editingBlockingRule) {
        await updateBlockingRule(generalRules.id, editingBlockingRule.id, blockingForm)
        toast({ title: 'Regla de bloqueo actualizada' })
      } else {
        await createBlockingRule(generalRules.id, blockingForm)
        toast({ title: 'Regla de bloqueo creada' })
      }
      setShowBlockingDialog(false)
      setBlockingForm({
        name: '',
        description: '',
        daysAfterDue: 1,
        services: [],
        active: true,
      })
      await refreshRules()
    } catch (e) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar la regla de bloqueo',
      })
    }
  }

  const handleCreateGateway = async () => {
    try {
      await persistRules({
        ...generalRules,
        notificationRules,
        blockingRules,
        paymentGateways: [...paymentGateways, gatewayForm],
        exceptionCategories,
      })
      toast({ title: 'Pasarela creada' })
      setShowGatewayDialog(false)
      setGatewayForm({
        name: '',
        description: '',
        fee: 0,
        apiKey: '',
        merchantId: '',
        active: true,
      })
      await refreshRules()
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo crear la pasarela' })
    }
  }

  const handleCreateCategory = async () => {
    try {
      await persistRules({
        ...generalRules,
        notificationRules,
        blockingRules,
        paymentGateways,
        exceptionCategories: [...exceptionCategories, categoryForm],
      })
      toast({ title: 'Categoría creada' })
      setShowCategoryDialog(false)
      setCategoryForm({
        name: '',
        description: '',
        rules: {
          skipLateFee: false,
          extendedDueDate: 1,
          allowPartialPayments: false,
          skipBlocking: false,
        },
      })
      await refreshRules()
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo crear la categoría' })
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
            onClick={() => setShowRulesDialog(true)}
            variant="outline"
          >
            <Eye className="mr-2 h-4 w-4" /> Ver Reglas
          </Button>
          <Button
            onClick={async () => {
              try {
                await persistRules({
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
                      checked={!!generalRules.sendAutomaticReminders}
                      onCheckedChange={(checked) => handleGeneralRuleChange("sendAutomaticReminders", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <Label htmlFor="autoUnblockAfterPayment">Desbloquear automáticamente después del pago</Label>
                    <Switch
                      id="autoUnblockAfterPayment"
                      checked={!!generalRules.autoUnblockAfterPayment}
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
                    await persistRules({
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
              <Button 
                onClick={() => openNotificationForm()} 
                className="mt-4 md:mt-0"
                disabled={!generalRules?.id}
              >
                <Plus className="mr-2 h-4 w-4" /> Nueva Notificación
              </Button>
            </CardHeader>
            <CardContent>
              {!generalRules?.id && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Información</AlertTitle>
                  <AlertDescription>
                    Primero guarde la configuración general para poder administrar las notificaciones.
                  </AlertDescription>
                </Alert>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Días Relativos</TableHead>
                    <TableHead>Mensaje</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notificationRules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        {!generalRules?.id ? 'Configure primero las reglas generales' : 'Sin notificaciones configuradas'}
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
                          <TableCell className="font-medium">{notification.displayName}</TableCell>
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
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openNotificationForm(notification)}>
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteNotification(notification.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
              <Button 
                variant="outline" 
                onClick={handleDeleteSelected}
                disabled={selectedNotifications.size === 0 || !generalRules?.id}
              >
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
                      if (!generalRules?.id) {
                        toast({ title: 'Error', description: 'Primero guarda la regla general' })
                        return
                      }

                      const apiData = {
                        type: notificationForm.type,
                        offset_days: notificationForm.triggerDays,
                        message: notificationForm.message,
                      }

                      if (editingNotification) {
                        await updateNotificationRule(
                          generalRules.id,
                          editingNotification.id,
                          apiData,
                        )
                        toast({ title: 'Notificación actualizada' })
                      } else {
                        await createNotificationRule(
                          generalRules.id,
                          apiData,
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

        {/* *** ACTUALIZADO: Tab de Bloqueos con funcionalidad completa *** */}
        <TabsContent value="blocking" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Reglas de Bloqueo</CardTitle>
                <CardDescription>Configure las condiciones para bloqueo automático de servicios</CardDescription>
              </div>
              <Button 
                onClick={() => openBlockingForm()} 
                className="mt-4 md:mt-0"
                disabled={!generalRules?.id}
              >
                <Plus className="mr-2 h-4 w-4" /> Nueva Regla de Bloqueo
              </Button>
            </CardHeader>
            <CardContent>
              {!generalRules?.id && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Información</AlertTitle>
                  <AlertDescription>
                    Primero guarde la configuración general para poder administrar las reglas de bloqueo.
                  </AlertDescription>
                </Alert>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
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
                      <TableCell colSpan={7} className="text-center">
                        {!generalRules?.id ? 'Configure primero las reglas generales' : 'Sin reglas de bloqueo configuradas'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    blockingRules.map((rule) => {
                      return (
                        <TableRow key={rule.id}>
                          <TableCell>
                            <Checkbox
                              id={`select-blocking-${rule.id}`}
                              checked={selectedBlockingRules.has(rule.id)}
                              onCheckedChange={(checked) =>
                                toggleBlockingRuleSelection(
                                  rule.id,
                                  !!checked,
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">{rule.name}</TableCell>
                          <TableCell>{rule.description}</TableCell>
                          <TableCell>{rule.daysAfterDue} días</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {rule.services.map((service: string, index: number) => {
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
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openBlockingForm(rule)}>
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteBlockingRule(rule.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    }))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {blockingRules.length} reglas de bloqueo configuradas
              </div>
              <Button 
                variant="outline" 
                onClick={handleDeleteSelectedBlockingRules}
                disabled={selectedBlockingRules.size === 0 || !generalRules?.id}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar Seleccionadas
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
              <Button className="ml-auto" onClick={() => setShowGatewayDialog(true)}>
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
              <Button className="ml-auto" onClick={() => setShowCategoryDialog(true)}>
                <Plus className="mr-2 h-4 w-4" /> Nueva Categoría
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* *** ACTUALIZADO: Dialog de Reglas de Bloqueo *** */}
      <Dialog open={showBlockingDialog} onOpenChange={setShowBlockingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBlockingRule ? "Editar Regla de Bloqueo" : "Nueva Regla de Bloqueo"}</DialogTitle>
            <DialogDescription>
              {editingBlockingRule 
                ? "Modifique los detalles de la regla de bloqueo"
                : "Configure una nueva regla de bloqueo"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="block-name">Nombre</Label>
              <Input
                id="block-name"
                value={blockingForm.name}
                onChange={(e) =>
                  setBlockingForm({ ...blockingForm, name: e.target.value })
                }
                placeholder="Ej: Bloqueo después de 30 días"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="block-description">Descripción</Label>
              <Input
                id="block-description"
                value={blockingForm.description}
                onChange={(e) =>
                  setBlockingForm({
                    ...blockingForm,
                    description: e.target.value,
                  })
                }
                placeholder="Describe qué hace esta regla de bloqueo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="block-days">Días Después de Vencimiento</Label>
              <Input
                id="block-days"
                type="number"
                min="1"
                value={blockingForm.daysAfterDue}
                onChange={(e) =>
                  setBlockingForm({
                    ...blockingForm,
                    daysAfterDue: Number(e.target.value),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Número de días después del vencimiento para aplicar el bloqueo
              </p>
            </div>
            <div className="space-y-2">
              <Label>Servicios Afectados</Label>
              <div className="flex gap-4">
                {["plataforma", "evaluaciones", "materiales"].map((svc) => (
                  <label key={svc} className="flex items-center gap-2">
                    <Checkbox
                      checked={blockingForm.services.includes(svc)}
                      onCheckedChange={(checked) => {
                        setBlockingForm((prev) => {
                          const services = prev.services.includes(svc)
                            ? prev.services.filter((s) => s !== svc)
                            : [...prev.services, svc]
                          return { ...prev, services }
                        })
                      }}
                    />
                    <span className="text-sm">
                      {svc.charAt(0).toUpperCase() + svc.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Seleccione los servicios que serán bloqueados cuando se aplique esta regla
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="block-active">Regla Activa</Label>
              <Switch
                id="block-active"
                checked={blockingForm.active}
                onCheckedChange={(checked) =>
                  setBlockingForm({ ...blockingForm, active: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockingDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateBlockingRule}>
              <Save className="mr-2 h-4 w-4" /> 
              {editingBlockingRule ? 'Actualizar' : 'Guardar'} Regla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resto de dialogs permanecen igual... */}
      <Dialog open={showGatewayDialog} onOpenChange={setShowGatewayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Pasarela</DialogTitle>
            <DialogDescription>
              Ingrese los datos de la pasarela de pago
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="gateway-name">Nombre</Label>
              <Input
                id="gateway-name"
                value={gatewayForm.name}
                onChange={(e) =>
                  setGatewayForm({ ...gatewayForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gateway-description">Descripción</Label>
              <Input
                id="gateway-description"
                value={gatewayForm.description}
                onChange={(e) =>
                  setGatewayForm({
                    ...gatewayForm,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gateway-fee">Comisión (%)</Label>
              <Input
                id="gateway-fee"
                type="number"
                value={gatewayForm.fee}
                onChange={(e) =>
                  setGatewayForm({
                    ...gatewayForm,
                    fee: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gateway-apiKey">API Key</Label>
              <Input
                id="gateway-apiKey"
                value={gatewayForm.apiKey}
                onChange={(e) =>
                  setGatewayForm({ ...gatewayForm, apiKey: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gateway-merchant">Merchant ID</Label>
              <Input
                id="gateway-merchant"
                value={gatewayForm.merchantId}
                onChange={(e) =>
                  setGatewayForm({
                    ...gatewayForm,
                    merchantId: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="gateway-active">Activa</Label>
              <Switch
                id="gateway-active"
                checked={gatewayForm.active}
                onCheckedChange={(checked) =>
                  setGatewayForm({ ...gatewayForm, active: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGatewayDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateGateway}>
              <Save className="mr-2 h-4 w-4" /> Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Categoría</DialogTitle>
            <DialogDescription>
              Configure la categoría de excepción
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nombre</Label>
              <Input
                id="cat-name"
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-description">Descripción</Label>
              <Input
                id="cat-description"
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-due">Día de Vencimiento</Label>
              <Input
                id="cat-due"
                type="number"
                value={categoryForm.rules.extendedDueDate}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    rules: {
                      ...categoryForm.rules,
                      extendedDueDate: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Exención de Mora</Label>
              <Switch
                checked={categoryForm.rules.skipLateFee}
                onCheckedChange={(checked) =>
                  setCategoryForm({
                    ...categoryForm,
                    rules: { ...categoryForm.rules, skipLateFee: checked },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Pagos Parciales</Label>
              <Switch
                checked={categoryForm.rules.allowPartialPayments}
                onCheckedChange={(checked) =>
                  setCategoryForm({
                    ...categoryForm,
                    rules: {
                      ...categoryForm.rules,
                      allowPartialPayments: checked,
                    },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Exención de Bloqueo</Label>
              <Switch
                checked={categoryForm.rules.skipBlocking}
                onCheckedChange={(checked) =>
                  setCategoryForm({
                    ...categoryForm,
                    rules: { ...categoryForm.rules, skipBlocking: checked },
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCategory}>
              <Save className="mr-2 h-4 w-4" /> Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRulesDialog} onOpenChange={setShowRulesDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reglas Configuradas</DialogTitle>
            <DialogDescription>
              Visualice el resumen de todas las reglas actuales
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Generales</h4>
              <ul className="space-y-1">
                <li>Día de vencimiento: {generalRules.dueDateDay ?? '-'}</li>
                <li>Mora: Q{generalRules.lateFeeAmount ?? '-'}</li>
                <li>Bloquear tras {generalRules.blockAfterMonths ?? '-'} meses</li>
                <li>
                  Recordatorios automáticos:{' '}
                  {generalRules.sendAutomaticReminders ? 'Sí' : 'No'}
                </li>
                <li>
                  Pagos parciales:{' '}
                  {generalRules.allowPartialPayments ? 'Permitidos' : 'No'}
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Notificaciones</h4>
              {notificationRules.length === 0 ? (
                <p className="text-muted-foreground">Sin notificaciones</p>
              ) : (
                <ul className="space-y-1">
                  {notificationRules.map((n) => (
                    <li key={n.id}>
                      {n.displayName}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h4 className="font-semibold mb-2">Bloqueos</h4>
              {blockingRules.length === 0 ? (
                <p className="text-muted-foreground">Sin reglas de bloqueo</p>
              ) : (
                <ul className="space-y-1">
                  {blockingRules.map((b) => (
                    <li key={b.id}>
                      {b.name} - {b.daysAfterDue} días -{' '}
                      {b.active ? 'Activo' : 'Inactivo'}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h4 className="font-semibold mb-2">Pasarelas</h4>
              {paymentGateways.length === 0 ? (
                <p className="text-muted-foreground">Sin pasarelas</p>
              ) : (
                <ul className="space-y-1">
                  {paymentGateways.map((g) => (
                    <li key={g.id}>
                      {g.name} - Comisión {g.fee}% -{' '}
                      {g.active ? 'Activa' : 'Inactiva'}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h4 className="font-semibold mb-2">Excepciones</h4>
              {exceptionCategories.length === 0 ? (
                <p className="text-muted-foreground">Sin categorías</p>
              ) : (
                <ul className="space-y-1">
                  {exceptionCategories.map((c) => (
                    <li key={c.id}>{c.name}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRulesDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}