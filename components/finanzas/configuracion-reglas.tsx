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
import { AlertCircle, Save, Plus, Trash2, Settings, Eye, Edit, Users, List } from "lucide-react"
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
  // *** NUEVAS IMPORTACIONES PARA PASARELAS ***
  getPaymentGateways,
  createPaymentGateway,
  updatePaymentGateway,
  deletePaymentGateway,
  togglePaymentGatewayStatus,
  // *** NUEVAS IMPORTACIONES PARA EXCEPCIONES ***
  getExceptionCategories,
  createExceptionCategory,
  updateExceptionCategory,
  deleteExceptionCategory,
  toggleExceptionCategoryStatus,
  assignCategoryToStudent,
  assignCategoryBulk,
} from "@/services/finance"
import { toast } from "@/hooks/use-toast"
import { ExceptionAssignModal } from "./ExceptionAssignModal"
import { ExceptionAssignedListModal } from "./ExceptionAssignedListModal"

export function ConfiguracionReglas() {
  const [activeTab, setActiveTab] = useState("general")
  const [generalRules, setGeneralRules] = useState<any>({})
  const [notificationRules, setNotificationRules] = useState<any[]>([])
  const [blockingRules, setBlockingRules] = useState<any[]>([])
  const [paymentGateways, setPaymentGateways] = useState<any[]>([])
  const [exceptionCategories, setExceptionCategories] = useState<any[]>([])
  const [selectedNotifications, setSelectedNotifications] = useState<Set<number>>(new Set())
  const [selectedBlockingRules, setSelectedBlockingRules] = useState<Set<number>>(new Set())
  // *** NUEVOS ESTADOS PARA SELECCIONES ***
  const [selectedGateways, setSelectedGateways] = useState<Set<number>>(new Set())
  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set())
  
  const [editingNotification, setEditingNotification] = useState<any | null>(null)
  const [editingBlockingRule, setEditingBlockingRule] = useState<any | null>(null)
  // *** NUEVOS ESTADOS PARA EDICIÓN ***
  const [editingGateway, setEditingGateway] = useState<any | null>(null)
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  
  // ✅ Estado para asignación de categorías a estudiantes
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [categoryToAssign, setCategoryToAssign] = useState<any | null>(null)
  
  // ✅ Estado para ver lista de asignados
  const [showAssignedListModal, setShowAssignedListModal] = useState(false)
  const [categoryToView, setCategoryToView] = useState<any | null>(null)
  
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
    commission_percentage: 0,
    api_key: '',
    merchant_id: '',
    active: true,
  })

  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    due_day_override: null as number | null,
    skip_late_fee: false,
    allow_partial_payments: false,
    skip_blocking: false,
    active: true,
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

  // *** MAPEAR REGLAS DE BLOQUEO ***
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

  // *** NUEVAS FUNCIONES DE MAPEO PARA PASARELAS ***
  function mapGatewaysFromApi(apiList: any[]) {
    return (apiList ?? []).map((g: any) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      commission_percentage: Number(g.commission_percentage || 0),
      api_key: g.api_key,
      merchant_id: g.merchant_id,
      active: !!g.active,
      is_configured: g.is_configured || false,
      created_at: g.created_at,
      updated_at: g.updated_at,
    }))
  }

  // *** NUEVAS FUNCIONES DE MAPEO PARA CATEGORÍAS ***
  function mapCategoriesFromApi(apiList: any[]) {
    return (apiList ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      due_day_override: c.due_day_override,
      skip_late_fee: !!c.skip_late_fee,
      allow_partial_payments: !!c.allow_partial_payments,
      skip_blocking: !!c.skip_blocking,
      active: !!c.active,
      created_at: c.created_at,
      updated_at: c.updated_at,
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

  // *** CARGAR AL ENTRAR Y REFRESCAR (ACTUALIZADO CON PASARELAS Y CATEGORÍAS) ***

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
        // No limpiar pasarelas y categorías ya que se cargan independiente
      } else {
        // 2) mapear regla API -> UI (campos generales)
        const mapped = mapFromApiRule(rule)
        setGeneralRules((prev: any) => ({ ...prev, ...mapped }))

        // 3) pedir notificaciones por endpoint dedicado
        const notifApi = await fetchNotificationRulesByRule(rule.id)
        notifApi.sort((a: any, b: any) => (a.offset_days ?? 0) - (b.offset_days ?? 0))
        const notifUi = mapNotificationsFromApi(notifApi)
        setNotificationRules(notifUi)

        // 4) cargar reglas de bloqueo
        const blockingApi = await fetchBlockingRulesByRule(rule.id)
        blockingApi.sort((a: any, b: any) => (a.days_after_due ?? 0) - (b.days_after_due ?? 0))
        const blockingUi = mapBlockingRulesFromApi(blockingApi)
        setBlockingRules(blockingUi)
      }

      // *** 5) CARGAR PASARELAS DE PAGO INDEPENDIENTE ***
      const gatewaysApi = await getPaymentGateways()
      const gatewaysUi = mapGatewaysFromApi(gatewaysApi)
      setPaymentGateways(gatewaysUi)

      // *** 6) CARGAR CATEGORÍAS DE EXCEPCIÓN INDEPENDIENTE ***
      const categoriesApi = await getExceptionCategories()
      const categoriesUi = mapCategoriesFromApi(categoriesApi)
      setExceptionCategories(categoriesUi)

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

  // Recargar cuando entras al tab "Bloqueos"
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

  // *** NUEVO: Recargar cuando entras al tab "Pasarelas" ***
  useEffect(() => {
    if (activeTab === 'gateways') {
      getPaymentGateways()
        .then((list) => {
          setPaymentGateways(mapGatewaysFromApi(list))
        })
        .catch(() =>
          toast({ title: 'Error', description: 'No se pudieron cargar las pasarelas de pago' })
        )
    }
  }, [activeTab])

  // *** NUEVO: Recargar cuando entras al tab "Excepciones" ***
  useEffect(() => {
    if (activeTab === 'exceptions') {
      getExceptionCategories()
        .then((list) => {
          setExceptionCategories(mapCategoriesFromApi(list))
        })
        .catch(() =>
          toast({ title: 'Error', description: 'No se pudieron cargar las categorías de excepción' })
        )
    }
  }, [activeTab])

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

  // *** FUNCIONES DE BLOQUEO ***
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
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.message || 'No se pudo guardar la regla de bloqueo',
      })
    }
  }

  // // *** NUEVAS FUNCIONES PARA PASARELAS DE PAGO ***
  // const openGatewayForm = (gateway: any = null) => {
  //   setEditingGateway(gateway)
  //   if (gateway) {
  //     setGatewayForm({
  //       name: gateway.name,
  //       description: gateway.description,
  //       commission_percentage: gateway.commission_percentage,
  //       api_key: gateway.api_key,
  //       merchant_id: gateway.merchant_id,
  //       active: gateway.active,
  //     })
  //   } else {
  //     setGatewayForm({
  //       name: '',
  //       description: '',
  //       commission_percentage: 0,
  //       api_key: '',
  //       merchant_id: '',
  //       active: true,
  //     })
  //   }
  //   setShowGatewayDialog(true)
  // }

  const toggleGatewaySelection = (id: number, checked: boolean) => {
    setSelectedGateways((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }

  const handleDeleteGateway = async (gatewayId: number) => {
    try {
      await deletePaymentGateway(gatewayId)
      toast({ title: 'Pasarela eliminada correctamente' })
      await refreshRules()
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'No se pudo eliminar la pasarela' 
      })
    }
  }

  const handleToggleGatewayStatus = async (gatewayId: number) => {
    try {
      await togglePaymentGatewayStatus(gatewayId)
      toast({ title: 'Estado de pasarela actualizado' })
      await refreshRules()
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'No se pudo actualizar el estado de la pasarela' 
      })
    }
  }

  const handleCreateGateway = async () => {
    try {
      if (editingGateway) {
        await updatePaymentGateway(editingGateway.id, gatewayForm)
        toast({ title: 'Pasarela actualizada' })
      } else {
        await createPaymentGateway(gatewayForm)
        toast({ title: 'Pasarela creada' })
      }
      setShowGatewayDialog(false)
      setGatewayForm({
        name: '',
        description: '',
        commission_percentage: 0,
        api_key: '',
        merchant_id: '',
        active: true,
      })
      await refreshRules()
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo guardar la pasarela' })
    }
  }

  const handleDeleteSelectedGateways = async () => {
    if (selectedGateways.size === 0) return
    
    try {
      await Promise.all(
        Array.from(selectedGateways).map((id) => deletePaymentGateway(id))
      )
      setSelectedGateways(new Set())
      toast({ title: 'Pasarelas eliminadas' })
      await refreshRules()
    } catch {
      toast({ title: 'Error', description: 'No se pudieron eliminar las pasarelas' })
    }
  }

  // *** NUEVAS FUNCIONES PARA CATEGORÍAS DE EXCEPCIÓN ***
  const openCategoryForm = (category: any = null) => {
    setEditingCategory(category)
    if (category) {
      setCategoryForm({
        name: category.name,
        description: category.description,
        due_day_override: category.due_day_override,
        skip_late_fee: category.skip_late_fee,
        allow_partial_payments: category.allow_partial_payments,
        skip_blocking: category.skip_blocking,
        active: category.active,
      })
    } else {
      setCategoryForm({
        name: '',
        description: '',
        due_day_override: null,
        skip_late_fee: false,
        allow_partial_payments: false,
        skip_blocking: false,
        active: true,
      })
    }
    setShowCategoryDialog(true)
  }

  const toggleCategorySelection = (id: number, checked: boolean) => {
    setSelectedCategories((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      await deleteExceptionCategory(categoryId)
      toast({ title: 'Categoría eliminada correctamente' })
      await refreshRules()
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'No se pudo eliminar la categoría' 
      })
    }
  }

  const handleToggleCategoryStatus = async (categoryId: number) => {
    try {
      await toggleExceptionCategoryStatus(categoryId)
      toast({ title: 'Estado de categoría actualizado' })
      await refreshRules()
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'No se pudo actualizar el estado de la categoría' 
      })
    }
  }

  const handleCreateCategory = async () => {
    try {
      if (editingCategory) {
        await updateExceptionCategory(editingCategory.id, categoryForm)
        toast({ title: 'Categoría actualizada' })
      } else {
        await createExceptionCategory(categoryForm)
        toast({ title: 'Categoría creada' })
      }
      setShowCategoryDialog(false)
      setCategoryForm({
        name: '',
        description: '',
        due_day_override: null,
        skip_late_fee: false,
        allow_partial_payments: false,
        skip_blocking: false,
        active: true,
      })
      await refreshRules()
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo guardar la categoría' })
    }
  }

  const handleDeleteSelectedCategories = async () => {
    if (selectedCategories.size === 0) return
    
    try {
      await Promise.all(
        Array.from(selectedCategories).map((id) => deleteExceptionCategory(id))
      )
      setSelectedCategories(new Set())
      toast({ title: 'Categorías eliminadas' })
      await refreshRules()
    } catch {
      toast({ title: 'Error', description: 'No se pudieron eliminar las categorías' })
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

      <Tabs defaultValue="general" className="space-y-3" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">Reglas Generales</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="blocking">Bloqueos</TabsTrigger>
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

        {/* *** ACTUALIZADO: Tab de Pasarelas completamente funcional ***
        <TabsContent value="gateways" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Pasarelas de Pago</CardTitle>
                <CardDescription>Configure las pasarelas de pago disponibles para los alumnos</CardDescription>
              </div>
              <Button 
                onClick={() => openGatewayForm()} 
                className="mt-4 md:mt-0"
              >
                <Plus className="mr-2 h-4 w-4" /> Nueva Pasarela
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
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
                      <TableCell colSpan={8} className="text-center">
                        Sin pasarelas configuradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    paymentGateways.map((gateway) => {
                      return (
                        <TableRow key={gateway.id}>
                          <TableCell>
                            <Checkbox
                              id={`select-gateway-${gateway.id}`}
                              checked={selectedGateways.has(gateway.id)}
                              onCheckedChange={(checked) =>
                                toggleGatewaySelection(
                                  gateway.id,
                                  !!checked,
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">{gateway.name}</TableCell>
                          <TableCell>{gateway.description}</TableCell>
                          <TableCell>{gateway.commission_percentage}%</TableCell>
                          <TableCell>
                            {gateway.api_key ? 
                              <span className="text-xs text-muted-foreground">****{gateway.api_key?.slice(-4)}</span> 
                              : "No configurado"
                            }
                          </TableCell>
                          <TableCell>{gateway.merchant_id || "No configurado"}</TableCell>
                          <TableCell>
                            <Badge variant={gateway.active ? "default" : "outline"}>
                              {gateway.active ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openGatewayForm(gateway)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleToggleGatewayStatus(gateway.id)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteGateway(gateway.id)}
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
                Mostrando {paymentGateways.length} pasarelas configuradas
              </div>
              <Button 
                variant="outline" 
                onClick={handleDeleteSelectedGateways}
                disabled={selectedGateways.size === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar Seleccionadas
              </Button>
            </CardFooter>
          </Card>
        </TabsContent> */}

        {/* *** ACTUALIZADO: Tab de Excepciones completamente funcional *** */}
        <TabsContent value="exceptions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Categorías de Excepción</CardTitle>
                <CardDescription>Configure reglas especiales para grupos específicos de alumnos</CardDescription>
              </div>
              <Button 
                onClick={() => openCategoryForm()} 
                className="mt-4 md:mt-0"
              >
                <Plus className="mr-2 h-4 w-4" /> Nueva Categoría
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Día Vencimiento</TableHead>
                    <TableHead>Exención Mora</TableHead>
                    <TableHead>Pagos Parciales</TableHead>
                    <TableHead>Exención Bloqueo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exceptionCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center">
                        Sin categorías configuradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    exceptionCategories.map((category) => {
                      return (
                        <TableRow key={category.id}>
                          <TableCell>
                            <Checkbox
                              id={`select-category-${category.id}`}
                              checked={selectedCategories.has(category.id)}
                              onCheckedChange={(checked) =>
                                toggleCategorySelection(
                                  category.id,
                                  !!checked,
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>{category.description}</TableCell>
                          <TableCell>
                            {category.due_day_override ? `Día ${category.due_day_override}` : "General"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={category.skip_late_fee ? "default" : "outline"}>
                              {category.skip_late_fee ? "Sí" : "No"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={category.allow_partial_payments ? "default" : "outline"}>
                              {category.allow_partial_payments ? "Sí" : "No"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={category.skip_blocking ? "default" : "outline"}>
                              {category.skip_blocking ? "Sí" : "No"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={category.active ? "default" : "outline"}>
                              {category.active ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setCategoryToView(category)
                                  setShowAssignedListModal(true)
                                }}
                                className="text-blue-600 hover:text-blue-800"
                                title="Ver asignados"
                              >
                                <List className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setCategoryToAssign(category)
                                  setShowAssignModal(true)
                                }}
                                className="text-green-600 hover:text-green-800"
                                title="Asignar a estudiantes"
                              >
                                <Users className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openCategoryForm(category)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleToggleCategoryStatus(category.id)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteCategory(category.id)}
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
                Mostrando {exceptionCategories.length} categorías configuradas
              </div>
              <Button 
                variant="outline" 
                onClick={handleDeleteSelectedCategories}
                disabled={selectedCategories.size === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar Seleccionadas
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Reglas de Bloqueo */}
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
                      onCheckedChange={(checked) => {                        setBlockingForm((prev) => {
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

      {/* *** NUEVO: Dialog de Pasarelas de Pago ***
      <Dialog open={showGatewayDialog} onOpenChange={setShowGatewayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGateway ? "Editar Pasarela de Pago" : "Nueva Pasarela de Pago"}</DialogTitle>
            <DialogDescription>
              {editingGateway 
                ? "Modifique los detalles de la pasarela de pago"
                : "Configure una nueva pasarela de pago"
              }
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
                placeholder="Ej: PayPal, Stripe, Banco Industrial"
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
                placeholder="Descripción de la pasarela de pago"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gateway-commission">Comisión (%)</Label>
              <Input
                id="gateway-commission"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={gatewayForm.commission_percentage}
                onChange={(e) =>
                  setGatewayForm({
                    ...gatewayForm,
                    commission_percentage: Number(e.target.value),
                  })
                }
                placeholder="2.5"
              />
              <p className="text-xs text-muted-foreground">
                Porcentaje de comisión que cobra la pasarela
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gateway-apikey">API Key</Label>
              <Input
                id="gateway-apikey"
                type="password"
                value={gatewayForm.api_key}
                onChange={(e) =>
                  setGatewayForm({ ...gatewayForm, api_key: e.target.value })
                }
                placeholder="Clave API de la pasarela"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gateway-merchant">Merchant ID</Label>
              <Input
                id="gateway-merchant"
                value={gatewayForm.merchant_id}
                onChange={(e) =>
                  setGatewayForm({
                    ...gatewayForm,
                    merchant_id: e.target.value,
                  })
                }
                placeholder="ID del comercio"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="gateway-active">Pasarela Activa</Label>
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
              <Save className="mr-2 h-4 w-4" /> 
              {editingGateway ? 'Actualizar' : 'Guardar'} Pasarela
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}

      {/* *** NUEVO: Dialog de Categorías de Excepción *** */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Editar Categoría de Excepción" : "Nueva Categoría de Excepción"}</DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? "Modifique los detalles de la categoría de excepción"
                : "Configure una nueva categoría de excepción"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nombre</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
                placeholder="Ej: Becados, Empleados, Convenios Especiales"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Descripción</Label>
              <Input
                id="category-description"
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    description: e.target.value,
                  })
                }
                placeholder="Descripción de la categoría de excepción"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-due-day">Día de Vencimiento Personalizado</Label>
              <Input
                id="category-due-day"
                type="number"
                min="1"
                max="28"
                value={categoryForm.due_day_override || ""}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    due_day_override: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="Dejar vacío para usar el general"
              />
              <p className="text-xs text-muted-foreground">
                Si se especifica, sobreescribe el día de vencimiento general para esta categoría
              </p>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <Label className="text-base font-medium">Excepciones de Reglas</Label>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="skip-late-fee">Exención de Mora</Label>
                  <p className="text-xs text-muted-foreground">
                    Los estudiantes en esta categoría no pagarán recargos por mora
                  </p>
                </div>
                <Switch
                  id="skip-late-fee"
                  checked={categoryForm.skip_late_fee}
                  onCheckedChange={(checked) =>
                    setCategoryForm({ ...categoryForm, skip_late_fee: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allow-partial">Permitir Pagos Parciales</Label>
                  <p className="text-xs text-muted-foreground">
                    Los estudiantes pueden realizar pagos parciales de sus cuotas
                  </p>
                </div>
                <Switch
                  id="allow-partial"
                  checked={categoryForm.allow_partial_payments}
                  onCheckedChange={(checked) =>
                    setCategoryForm({ ...categoryForm, allow_partial_payments: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="skip-blocking">Exención de Bloqueo</Label>
                  <p className="text-xs text-muted-foreground">
                    Los estudiantes en esta categoría no serán bloqueados automáticamente
                  </p>
                </div>
                <Switch
                  id="skip-blocking"
                  checked={categoryForm.skip_blocking}
                  onCheckedChange={(checked) =>
                    setCategoryForm({ ...categoryForm, skip_blocking: checked })
                  }
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <Label htmlFor="category-active">Categoría Activa</Label>
              <Switch
                id="category-active"
                checked={categoryForm.active}
                onCheckedChange={(checked) =>
                  setCategoryForm({ ...categoryForm, active: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCategory}>
              <Save className="mr-2 h-4 w-4" /> 
              {editingCategory ? 'Actualizar' : 'Guardar'} Categoría
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* *** ACTUALIZADO: Dialog de Ver Reglas con toda la información *** */}
      <Dialog open={showRulesDialog} onOpenChange={setShowRulesDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-4xl">
          <DialogHeader>
            <DialogTitle>Resumen de Reglas Configuradas</DialogTitle>
            <DialogDescription>
              Visualice el resumen completo de todas las reglas actuales del sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4 text-sm">
            
            {/* Reglas Generales */}
            <div>
              <h4 className="font-semibold mb-3 text-lg border-b pb-2">Reglas Generales</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Día de vencimiento:</span>
                    <span>{generalRules.dueDateDay ?? 'No configurado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Monto de mora:</span>
                    <span>Q{generalRules.lateFeeAmount ?? 'No configurado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Bloqueo tras:</span>
                    <span>{generalRules.blockAfterMonths ?? 'No configurado'} meses</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Recordatorios automáticos:</span>
                    <Badge variant={generalRules.sendAutomaticReminders ? "default" : "outline"}>
                      {generalRules.sendAutomaticReminders ? 'Sí' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Desbloqueo automático:</span>
                    <Badge variant={generalRules.autoUnblockAfterPayment ? "default" : "outline"}>
                      {generalRules.autoUnblockAfterPayment ? 'Sí' : 'No'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Notificaciones */}
            <div>
              <h4 className="font-semibold mb-3 text-lg border-b pb-2">Notificaciones ({notificationRules.length})</h4>
              {notificationRules.length === 0 ? (
                <p className="text-muted-foreground italic">Sin notificaciones configuradas</p>
              ) : (
                <div className="space-y-2">
                  {notificationRules.map((n) => (
                    <div key={n.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <span>{n.displayName}</span>
                      <Badge variant="outline">{n.type}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reglas de Bloqueo */}
            <div>
              <h4 className="font-semibold mb-3 text-lg border-b pb-2">Reglas de Bloqueo ({blockingRules.length})</h4>
              {blockingRules.length === 0 ? (
                <p className="text-muted-foreground italic">Sin reglas de bloqueo configuradas</p>
              ) : (
                <div className="space-y-2">
                  {blockingRules.map((b) => (
                    <div key={b.id} className="p-3 bg-muted/30 rounded">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{b.name}</span>
                        <Badge variant={b.active ? "default" : "outline"}>
                          {b.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{b.description}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span>Después de {b.daysAfterDue} días</span>
                        <span>•</span>
                        <span>Servicios: {b.services.join(', ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pasarelas de Pago
            <div>
              <h4 className="font-semibold mb-3 text-lg border-b pb-2">Pasarelas de Pago ({paymentGateways.length})</h4>
              {paymentGateways.length === 0 ? (
                <p className="text-muted-foreground italic">Sin pasarelas configuradas</p>
              ) : (
                <div className="space-y-2">
                  {paymentGateways.map((g) => (
                    <div key={g.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <div>
                        <span className="font-medium">{g.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          Comisión: {g.commission_percentage}%
                        </span>
                      </div>
                      <Badge variant={g.active ? "default" : "outline"}>
                        {g.active ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div> */}

            {/* Categorías de Excepción */}
            <div>
              <h4 className="font-semibold mb-3 text-lg border-b pb-2">Categorías de Excepción ({exceptionCategories.length})</h4>
              {exceptionCategories.length === 0 ? (
                <p className="text-muted-foreground italic">Sin categorías configuradas</p>
              ) : (
                <div className="space-y-3">
                  {exceptionCategories.map((c) => (
                    <div key={c.id} className="p-3 bg-muted/30 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{c.name}</span>
                        <Badge variant={c.active ? "default" : "outline"}>
                          {c.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{c.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span>Día vencimiento:</span>
                          <Badge variant="outline">
                            {c.due_day_override ? `Día ${c.due_day_override}` : 'General'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Exención mora:</span>
                          <Badge variant={c.skip_late_fee ? "default" : "outline"}>
                            {c.skip_late_fee ? 'Sí' : 'No'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Pagos parciales:</span>
                          <Badge variant={c.allow_partial_payments ? "default" : "outline"}>
                            {c.allow_partial_payments ? 'Sí' : 'No'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Exención bloqueo:</span>
                          <Badge variant={c.skip_blocking ? "default" : "outline"}>
                            {c.skip_blocking ? 'Sí' : 'No'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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

      {/* ✅ Modal de Asignación de Categorías a Estudiantes */}
      {categoryToAssign && (
        <ExceptionAssignModal
          open={showAssignModal}
          onOpenChange={(open) => {
            setShowAssignModal(open)
            if (!open) setCategoryToAssign(null)
          }}
          categoryId={categoryToAssign.id}
          categoryName={categoryToAssign.name}
          onSuccess={() => {
            refreshRules()
          }}
        />
      )}

      {/* ✅ Modal para Ver Lista de Asignados */}
      {categoryToView && (
        <ExceptionAssignedListModal
          open={showAssignedListModal}
          onOpenChange={(open) => {
            setShowAssignedListModal(open)
            if (!open) setCategoryToView(null)
          }}
          categoryId={categoryToView.id}
          categoryName={categoryToView.name}
          onSuccess={() => {
            refreshRules()
          }}
        />
      )}
    </div>
  )
}