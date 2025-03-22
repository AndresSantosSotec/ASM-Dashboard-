"use client"

import { useState } from "react"
import { Bell, FileText, DollarSign, CheckCircle, X, MessageSquare, Award } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// Tipo para notificaciones
type Notification = {
  id: string
  title: string
  message: string
  date: Date
  read: boolean
  type: "payment" | "academic" | "document" | "system" | "message" | "achievement"
}

// Datos de ejemplo
const notificationsData: Notification[] = [
  {
    id: "1",
    title: "Pago pendiente",
    message: "Tu pago de colegiatura del mes de marzo está pendiente. Vence en 5 días.",
    date: new Date(2025, 2, 10),
    read: false,
    type: "payment",
  },
  {
    id: "2",
    title: "Nuevo material disponible",
    message: "Se ha subido nuevo material para el curso de Programación Avanzada",
    date: new Date(2025, 2, 8),
    read: true,
    type: "academic",
  },
  {
    id: "3",
    title: "Documento rechazado",
    message: "Tu documento de identificación ha sido rechazado. Por favor, sube una versión actualizada.",
    date: new Date(2025, 2, 7),
    read: false,
    type: "document",
  },
  {
    id: "4",
    title: "Examen próximo",
    message: "Recuerda que tienes programado un examen de Algoritmos el 15 de marzo a las 10:00 AM.",
    date: new Date(2025, 2, 5),
    read: false,
    type: "academic",
  },
  {
    id: "5",
    title: "Pago confirmado",
    message: "Tu pago de colegiatura del mes de febrero ha sido confirmado. Gracias.",
    date: new Date(2025, 2, 1),
    read: true,
    type: "payment",
  },
  {
    id: "6",
    title: "Cambio de horario",
    message: "La clase de Matemáticas Discretas del viernes ha sido reprogramada para el lunes a las 3:00 PM.",
    date: new Date(2025, 1, 28),
    read: true,
    type: "system",
  },
  {
    id: "7",
    title: "Mensaje nuevo",
    message: "Has recibido un mensaje de la Dra. Sánchez sobre tu proyecto final.",
    date: new Date(2025, 1, 26),
    read: true,
    type: "message",
  },
  {
    id: "8",
    title: "¡Felicidades! Nuevo logro desbloqueado",
    message:
      "Has conseguido el logro 'Estudiante Destacado' por mantener un promedio superior a 90 en el último trimestre.",
    date: new Date(2025, 1, 25),
    read: false,
    type: "achievement",
  },
]

export default function NotificationsView() {
  const [notifications, setNotifications] = useState<Notification[]>(notificationsData)
  const [activeTab, setActiveTab] = useState("all")

  // Marcar notificación como leída
  const markAsRead = (id: string) => {
    setNotifications(notifications.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
  }

  // Eliminar notificación
  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((notif) => notif.id !== id))
  }

  // Marcar todas como leídas
  const markAllAsRead = () => {
    setNotifications(notifications.map((notif) => ({ ...notif, read: true })))
  }

  // Filtrar notificaciones según la pestaña activa
  const filteredNotifications = notifications.filter((notif) => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !notif.read
    return notif.type === activeTab
  })

  // Obtener ícono según el tipo de notificación
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <DollarSign className="h-5 w-5 text-blue-500" />
      case "academic":
        return <FileText className="h-5 w-5 text-green-500" />
      case "document":
        return <FileText className="h-5 w-5 text-amber-500" />
      case "system":
        return <Bell className="h-5 w-5 text-purple-500" />
      case "message":
        return <MessageSquare className="h-5 w-5 text-cyan-500" />
      case "achievement":
        return <Award className="h-5 w-5 text-yellow-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  // Formatear fecha relativa
  const getRelativeTime = (date: Date) => {
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Hoy"
    if (diffInDays === 1) return "Ayer"
    if (diffInDays < 7) return `Hace ${diffInDays} días`

    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    })
  }

  // Contar notificaciones no leídas
  const unreadCount = notifications.filter((notif) => !notif.read).length

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Centro de Notificaciones
              </CardTitle>
              <CardDescription>Mantente al día con tus actividades académicas y administrativas</CardDescription>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar todas como leídas
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">
                Todas
                {unreadCount > 0 && (
                  <Badge className="ml-2 bg-blue-500" variant="secondary">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="unread">No leídas</TabsTrigger>
              <TabsTrigger value="academic">Académicas</TabsTrigger>
              <TabsTrigger value="payment">Pagos</TabsTrigger>
              <TabsTrigger value="document">Documentos</TabsTrigger>
              <TabsTrigger value="message">Mensajes</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              <div className="space-y-1">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-700">No hay notificaciones</h3>
                    <p className="text-gray-500">Todas tus notificaciones aparecerán aquí</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div key={notification.id} className="relative">
                      <div
                        className={`p-4 rounded-lg border mb-2 hover:bg-gray-50 transition-colors flex ${
                          !notification.read ? "border-l-4 border-l-blue-500" : ""
                        }`}
                      >
                        <div className="mr-3">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className={`font-medium ${!notification.read ? "text-blue-600" : ""}`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">{getRelativeTime(notification.date)}</span>
                              <div className="flex">
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => markAsRead(notification.id)}
                                  >
                                    <CheckCircle className="h-4 w-4 text-gray-400 hover:text-blue-500" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => deleteNotification(notification.id)}
                                >
                                  <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuración de Notificaciones</CardTitle>
          <CardDescription>Personaliza qué tipos de notificaciones deseas recibir</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="academic-notifications">Notificaciones Académicas</Label>
                <p className="text-sm text-gray-500">Nuevos materiales, tareas, calificaciones y exámenes</p>
              </div>
              <Switch id="academic-notifications" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="payment-notifications">Notificaciones de Pagos</Label>
                <p className="text-sm text-gray-500">Recordatorios de pagos, confirmaciones y estados de cuenta</p>
              </div>
              <Switch id="payment-notifications" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="document-notifications">Notificaciones de Documentos</Label>
                <p className="text-sm text-gray-500">Estado de solicitudes y documentos requeridos</p>
              </div>
              <Switch id="document-notifications" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="message-notifications">Mensajes de Docentes</Label>
                <p className="text-sm text-gray-500">Comunicaciones directas de tus profesores</p>
              </div>
              <Switch id="message-notifications" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Recibir por Email</Label>
                <p className="text-sm text-gray-500">Enviar notificaciones importantes a tu correo electrónico</p>
              </div>
              <Switch id="email-notifications" defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

