"use client"

import { useEffect, useState } from "react"
import { Bell, ExternalLink, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/useNotifications"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface NotificationsBannerProps {
  etapa?: "revision" | "academica" | "financiera"
}

export default function NotificationsBanner({ etapa }: NotificationsBannerProps) {
  const router = useRouter()
  const { notifications, unreadCount, markAsRead, loadNotifications } = useNotifications({
    autoRefresh: true,
    refreshInterval: 60000,
    perPage: 10,
  })

  const [visibleNotifications, setVisibleNotifications] = useState<any[]>([])
  const [dismissed, setDismissed] = useState<Set<number>>(new Set())

  // Mapeo de etapas a estados
  const etapaToStatus: Record<string, string> = {
    revision: "Pendiente Aprobacion",
    academica: "Pendiente de Aprobación Académica",
    financiera: "Pendiente de Aprobación Financiera",
  }

  useEffect(() => {
    // Filtrar notificaciones por etapa si se especifica
    const filtered = notifications
      .filter((n) => !n.read_at && !dismissed.has(n.id))
      .filter((n) => {
        if (!etapa) return true
        const targetStatus = etapaToStatus[etapa]
        // Verificar tanto en data como en route
        const matchesData = n.data?.to_status === targetStatus
        const matchesRoute = n.route?.includes(etapa)
        return matchesData || matchesRoute
      })
      .slice(0, 3) // Solo mostrar las 3 más recientes

    setVisibleNotifications(filtered)
  }, [notifications, etapa, dismissed])

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

  const handleDismiss = (id: number) => {
    setDismissed((prev) => new Set([...prev, id]))
  }

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

  if (visibleNotifications.length === 0) {
    return null
  }

  return (
    <div className="space-y-3 mb-6">
      {visibleNotifications.map((notification) => (
        <Alert
          key={notification.id}
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => handleNotificationClick(notification)}
        >
          <Bell className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between">
            <span>{notification.title}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation()
                handleDismiss(notification.id)
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </AlertTitle>
          <AlertDescription className="space-y-2">
            <p className="text-sm">{notification.message}</p>
            {notification.data?.prospecto_nombre && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Estudiante:</span> {notification.data.prospecto_nombre}
                {notification.data.prospecto_carnet && ` (${notification.data.prospecto_carnet})`}
              </p>
            )}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatTime(notification.created_at)}</span>
              {notification.route && (
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  Ver <ExternalLink className="h-3 w-3" />
                </span>
              )}
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )
}

