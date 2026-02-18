"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCheck, ExternalLink, Loader2, Bell, BellOff, Trash2, X } from "lucide-react"
import { useNotifications } from "@/hooks/useNotifications"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function NotificacionesPage() {
  const router = useRouter()
  const {
    notifications,
    unreadCount,
    loading,
    totalCount,
    currentPage,
    totalPages,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    limpiar,
    eliminar,
  } = useNotifications({
    autoRefresh: true,
    refreshInterval: 60000, // 1 minuto
    perPage: 50,
  })

  const [filter, setFilter] = useState<"all" | "unread">("all")
  const [markingAll, setMarkingAll] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true)
    try {
      await markAllAsRead()
    } catch (err) {
      console.error("Error al marcar todas como leídas:", err)
    } finally {
      setMarkingAll(false)
    }
  }

  const handleLimpiarLeidas = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar todas las notificaciones leídas?")) {
      return
    }
    setClearing(true)
    try {
      await limpiar(false) // Solo leídas
    } catch (err) {
      console.error("Error al limpiar notificaciones:", err)
      alert("Error al limpiar notificaciones")
    } finally {
      setClearing(false)
    }
  }

  const handleLimpiarTodas = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar TODAS las notificaciones (leídas y no leídas)? Esta acción no se puede deshacer.")) {
      return
    }
    setClearing(true)
    try {
      await limpiar(true) // Todas
    } catch (err) {
      console.error("Error al limpiar todas las notificaciones:", err)
      alert("Error al limpiar notificaciones")
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
    } catch (err) {
      console.error("Error al eliminar notificación:", err)
      alert("Error al eliminar la notificación")
    } finally {
      setDeletingId(null)
    }
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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("es-GT", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateString
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

  const filteredNotifications = filter === "unread" 
    ? notifications.filter((n) => !n.read_at)
    : notifications

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gaia-navy dark:text-gaia-light mb-2">
          Notificaciones
        </h1>
        <p className="text-muted-foreground">
          Gestiona tus notificaciones del sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mis Notificaciones</CardTitle>
              <CardDescription>
                {filter === "all" 
                  ? `${totalCount} notificaciones totales`
                  : `${unreadCount} notificaciones no leídas`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={markingAll}
                >
                  {markingAll ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCheck className="h-4 w-4 mr-2" />
                  )}
                  Marcar todas como leídas
                </Button>
              )}
              {notifications.some(n => n.read_at) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLimpiarLeidas}
                  disabled={clearing}
                  className="text-orange-600 hover:text-orange-700"
                >
                  {clearing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Limpiar leídas
                </Button>
              )}
              {totalCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLimpiarTodas}
                  disabled={clearing}
                  className="text-red-600 hover:text-red-700"
                >
                  {clearing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Limpiar todas
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
            <TabsList>
              <TabsTrigger value="all">
                Todas ({totalCount})
              </TabsTrigger>
              <TabsTrigger value="unread">
                No leídas ({unreadCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="mt-4">
              {loading && notifications.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  {filter === "unread" ? (
                    <BellOff className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  ) : (
                    <Bell className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  )}
                  <p className="text-lg font-medium text-muted-foreground mb-2">
                    {filter === "unread" 
                      ? "No tienes notificaciones no leídas"
                      : "No tienes notificaciones"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Las notificaciones aparecerán aquí cuando haya cambios en las fichas de inscripción
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {filteredNotifications.map((notification) => (
                      <Card
                        key={notification.id}
                        className={`cursor-pointer transition-colors hover:bg-accent ${
                          !notification.read_at ? "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20" : ""
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3
                                  className={`text-base font-semibold ${
                                    !notification.read_at
                                      ? "text-foreground"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {notification.title}
                                </h3>
                                {!notification.read_at && (
                                  <Badge variant="default" className="text-xs">
                                    Nuevo
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {notification.message}
                              </p>

                              {notification.data && (
                                <div className="space-y-1 mb-3">
                                  {notification.data.prospecto_nombre && (
                                    <div className="text-xs text-muted-foreground">
                                      <span className="font-medium">Estudiante:</span>{" "}
                                      {notification.data.prospecto_nombre}
                                      {notification.data.prospecto_carnet && (
                                        <span className="ml-1">
                                          ({notification.data.prospecto_carnet})
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {notification.data.programa && (
                                    <div className="text-xs text-muted-foreground">
                                      <span className="font-medium">Programa:</span>{" "}
                                      {notification.data.programa}
                                    </div>
                                  )}
                                  {notification.data.to_status && (
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {getStatusLabel(notification.data.to_status)}
                                    </Badge>
                                  )}
                                  {notification.data.comentario && (
                                    <div className="text-xs text-muted-foreground mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded border-l-2 border-yellow-400">
                                      <span className="font-medium">Comentario:</span>{" "}
                                      {notification.data.comentario}
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{formatTime(notification.created_at)}</span>
                                <span className="hidden sm:inline">
                                  {formatDate(notification.created_at)}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-1 shrink-0">
                              {notification.route && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleNotificationClick(notification)
                                  }}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                onClick={(e) => handleEliminarIndividual(notification.id, e)}
                                disabled={deletingId === notification.id}
                              >
                                {deletingId === notification.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1 || loading}
                      onClick={() => loadNotifications(currentPage - 1, filter === "unread")}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages || loading}
                      onClick={() => loadNotifications(currentPage + 1, filter === "unread")}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

