"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, ExternalLink, Check, Loader2 } from "lucide-react"
import { useNotifications } from "@/hooks/useNotifications"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

export default function NotificationsPanel() {
  const router = useRouter()
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    loadNotifications,
  } = useNotifications({
    autoRefresh: true,
    refreshInterval: 60000, // 1 minuto
    perPage: 5, // Solo las 5 más recientes en el panel
  })

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: es,
      })
    } catch {
      return "Hace un momento"
    }
  }

  const getStatusLabel = (status?: string) => {
    const labels: Record<string, string> = {
      "Pendiente Aprobacion": "Revisión",
      "Pendiente de Aprobación Académica": "Aprobación Académica",
      "Pendiente de Aprobación Financiera": "Aprobación Financiera",
    }
    return labels[status || ""] || status || "N/A"
  }

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read_at) {
      try {
        await markAsRead(notification.id)
      } catch (err) {
        console.error("Error al marcar notificación como leída:", err)
      }
    }

    if (notification.route) {
      router.push(notification.route)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              Notificaciones Recientes
            </CardTitle>
            <CardDescription>
              Cambios en fichas de inscripción
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} no leídas
                </Badge>
              )}
            </CardDescription>
          </div>
          {unreadCount > 0 && (
            <Link href="/notificaciones">
              <Button variant="outline" size="sm">
                Ver todas
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay notificaciones</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                    !notification.read_at
                      ? "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                      : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4
                          className={`text-sm font-semibold ${
                            !notification.read_at
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {notification.title}
                        </h4>
                        {!notification.read_at && (
                          <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {notification.message}
                      </p>
                      {notification.data?.prospecto_nombre && (
                        <p className="text-xs text-muted-foreground mb-1">
                          <span className="font-medium">Estudiante:</span>{" "}
                          {notification.data.prospecto_nombre}
                          {notification.data.prospecto_carnet && (
                            <span> ({notification.data.prospecto_carnet})</span>
                          )}
                        </p>
                      )}
                      {notification.data?.to_status && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {getStatusLabel(notification.data.to_status)}
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                    {notification.route && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleNotificationClick(notification)
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        {notifications.length > 5 && (
          <div className="mt-4 pt-4 border-t">
            <Link href="/notificaciones">
              <Button variant="outline" size="sm" className="w-full">
                Ver todas las notificaciones
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

