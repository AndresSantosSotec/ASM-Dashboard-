"use client"

import { useState, useEffect } from "react"
import { Bell, Check, CheckCheck, ExternalLink, Loader2, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNotifications } from "@/hooks/useNotifications"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export default function NotificationBell() {
  const router = useRouter()
  const {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    limpiar,
    eliminar,
    refreshUnreadCount,
  } = useNotifications({
    autoRefresh: true,
    refreshInterval: 30000, // 30 segundos
    perPage: 10, // Solo las últimas 10 en el dropdown
  })

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Cargar notificaciones cuando se abre el dropdown
  useEffect(() => {
    if (dropdownOpen) {
      loadNotifications(1, false)
    }
  }, [dropdownOpen, loadNotifications])

  const handleNotificationClick = async (notification: any) => {
    // Marcar como leída si no está leída
    if (!notification.read_at) {
      try {
        await markAsRead(notification.id)
      } catch (err) {
        console.error("Error al marcar notificación como leída:", err)
      }
    }

    // Navegar a la ruta
    if (notification.route) {
      router.push(notification.route)
      setDropdownOpen(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      refreshUnreadCount()
    } catch (err) {
      console.error("Error al marcar todas como leídas:", err)
    }
  }

  const handleLimpiarLeidas = async () => {
    if (!confirm("¿Eliminar todas las notificaciones leídas?")) {
      return
    }
    setClearing(true)
    try {
      await limpiar(false) // Solo leídas
      refreshUnreadCount()
    } catch (err) {
      console.error("Error al limpiar notificaciones:", err)
    } finally {
      setClearing(false)
    }
  }

  const handleEliminarIndividual = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("¿Eliminar esta notificación?")) {
      return
    }
    setDeletingId(id)
    try {
      await eliminar(id)
      refreshUnreadCount()
    } catch (err) {
      console.error("Error al eliminar notificación:", err)
      alert("Error al eliminar la notificación")
    } finally {
      setDeletingId(null)
    }
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

  const getStatusLabel = (status?: string) => {
    const labels: Record<string, string> = {
      "Pendiente Aprobacion": "Revisión",
      "Pendiente de Aprobación Académica": "Aprobación Académica",
      "Pendiente de Aprobación Financiera": "Aprobación Financiera",
    }
    return labels[status || ""] || status || "N/A"
  }

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-asm-navy dark:text-asm-light-gold hover:bg-asm-light-gold/10 hover:text-asm-navy dark:hover:bg-asm-medium-gold/20 dark:hover:text-asm-light-gold"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-[600px] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <DropdownMenuLabel className="p-0 font-semibold">
            Notificaciones
            {unreadCount > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({unreadCount} no leídas)
              </span>
            )}
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-8 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                No tienes notificaciones
              </p>
            </div>
          ) : (
            <div className="py-2">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex flex-col items-start p-4 cursor-pointer hover:bg-accent focus:bg-accent"
                  onClick={() => handleNotificationClick(notification)}
                  onSelect={(e) => e.preventDefault()}
                >
                  <div className="flex items-start justify-between w-full mb-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4
                          className={`text-sm font-medium ${
                            !notification.read_at
                              ? "text-foreground font-semibold"
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
                        <div className="text-xs text-muted-foreground mb-1">
                          <span className="font-medium">Estudiante:</span>{" "}
                          {notification.data.prospecto_nombre}
                          {notification.data.prospecto_carnet && (
                            <span className="ml-1">
                              ({notification.data.prospecto_carnet})
                            </span>
                          )}
                        </div>
                      )}
                      {notification.data?.programa && (
                        <div className="text-xs text-muted-foreground mb-1">
                          <span className="font-medium">Programa:</span>{" "}
                          {notification.data.programa}
                        </div>
                      )}
                      {notification.data?.to_status && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {getStatusLabel(notification.data.to_status)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1 ml-2">
                      {!notification.read_at && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => handleEliminarIndividual(notification.id, e)}
                        disabled={deletingId === notification.id}
                      >
                        {deletingId === notification.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                    <span>{formatTime(notification.created_at)}</span>
                    {notification.route && (
                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        Ver <ExternalLink className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-4 py-2 space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  router.push("/notificaciones")
                  setDropdownOpen(false)
                }}
              >
                Ver todas las notificaciones
              </Button>
              {notifications.some(n => n.read_at) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                  onClick={handleLimpiarLeidas}
                  disabled={clearing}
                >
                  {clearing ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3 mr-1" />
                  )}
                  Limpiar leídas
                </Button>
              )}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

