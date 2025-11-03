"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Activity,
  Filter,
  Download,
  Loader2,
  Calendar as CalendarIcon,
  User,
  FileText,
  Send,
  AlertCircle,
  X,
} from "lucide-react"
import { fetchActivity, type ActivityLogItem } from "@/services/plantillasMailing"
import { toast } from "sonner"
import { format, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface HistoryPanelProps {
  entityType?: string
  entityId?: number
  maxHeight?: number
}

export function HistoryPanel({ entityType, entityId, maxHeight = 600 }: HistoryPanelProps) {
  const [activities, setActivities] = useState<ActivityLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Filtros
  const [filterType, setFilterType] = useState<string>(entityType || "")
  const [filterAction, setFilterAction] = useState<string>("")
  const [filterUserId, setFilterUserId] = useState<string>("")
  const [filterEntityId, setFilterEntityId] = useState<string>(entityId?.toString() || "")
  const [dateFrom, setDateFrom] = useState<Date | undefined>()
  const [dateTo, setDateTo] = useState<Date | undefined>()

  useEffect(() => {
    loadActivity(1)
  }, [filterType, filterAction, filterUserId, filterEntityId, dateFrom, dateTo])

  const loadActivity = async (page: number) => {
    try {
      setLoading(true)
      const filters: any = { page }

      if (filterType && filterType !== "all") filters.entity_type = filterType
      if (filterAction && filterAction !== "all") filters.action = filterAction
      if (filterUserId) filters.user_id = parseInt(filterUserId)
      if (filterEntityId) filters.entity_id = parseInt(filterEntityId)
      if (dateFrom) filters.fecha_desde = format(dateFrom, "yyyy-MM-dd")
      if (dateTo) filters.fecha_hasta = format(dateTo, "yyyy-MM-dd")

      const response = await fetchActivity(filters)
      setActivities(response.data)
      setCurrentPage(response.current_page)
      setTotalPages(response.last_page)
      setTotal(response.total)
    } catch (error) {
      console.error("Error cargando actividad:", error)
      toast.error("Error al cargar historial de actividad")
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      setExporting(true)

      // Fetch all pages
      const allActivities: ActivityLogItem[] = []
      for (let page = 1; page <= totalPages; page++) {
        const filters: any = { page }
        if (filterType && filterType !== "all") filters.entity_type = filterType
        if (filterAction && filterAction !== "all") filters.action = filterAction
        if (filterUserId) filters.user_id = parseInt(filterUserId)
        if (filterEntityId) filters.entity_id = parseInt(filterEntityId)
        if (dateFrom) filters.fecha_desde = format(dateFrom, "yyyy-MM-dd")
        if (dateTo) filters.fecha_hasta = format(dateTo, "yyyy-MM-dd")
        if (dateTo) filters.fecha_hasta = format(dateTo, "yyyy-MM-dd")

        const response = await fetchActivity(filters)
        allActivities.push(...response.data)
      }

      // Generate CSV
      const headers = [
        "Fecha",
        "Usuario",
        "Tipo",
        "ID Entidad",
        "Acción",
        "Descripción",
        "IP",
      ]
      const rows = allActivities.map((activity) => [
        format(new Date(activity.created_at), "yyyy-MM-dd HH:mm:ss"),
        activity.user?.name || "Sistema",
        activity.entity_type,
        activity.entity_id,
        activity.action,
        activity.description,
        activity.ip_address || "",
      ])

      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `historial-actividad-${format(new Date(), "yyyyMMdd-HHmmss")}.csv`
      link.click()

      toast.success("Historial exportado correctamente")
    } catch (error) {
      toast.error("Error al exportar historial")
    } finally {
      setExporting(false)
    }
  }

  const clearFilters = () => {
    setFilterType(entityType || "all")
    setFilterAction("all")
    setFilterUserId("")
    setFilterEntityId(entityId?.toString() || "")
    setDateFrom(undefined)
    setDateTo(undefined)
  }

  const getActionIcon = (action: string) => {
    const icons: Record<string, any> = {
      create: FileText,
      edit: Activity,
      delete: X,
      send: Send,
      schedule: CalendarIcon,
      cancel: X,
      restore: Activity,
      duplicate: FileText,
    }
    const Icon = icons[action] || Activity
    return <Icon className="h-4 w-4" />
  }

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      create: "bg-green-500",
      edit: "bg-blue-500",
      delete: "bg-red-500",
      send: "bg-purple-500",
      schedule: "bg-yellow-500",
      cancel: "bg-gray-500",
      restore: "bg-indigo-500",
      duplicate: "bg-teal-500",
    }
    return colors[action] || "bg-gray-500"
  }

  const activeFiltersCount =
    (filterType && filterType !== "all" && filterType !== entityType ? 1 : 0) +
    (filterAction && filterAction !== "all" ? 1 : 0) +
    (filterUserId ? 1 : 0) +
    (filterEntityId && (!entityId || filterEntityId !== entityId.toString()) ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Historial de Actividad
            </CardTitle>
            <CardDescription>
              {total} {total === 1 ? "registro" : "registros"} encontrados
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpiar ({activeFiltersCount})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={exporting || activities.length === 0}
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Exportando
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1" />
                  Exportar CSV
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="mb-4 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filtros</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label htmlFor="filter-type" className="text-xs">
                Tipo de Entidad
              </Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger id="filter-type">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="template">Plantilla</SelectItem>
                  <SelectItem value="sending">Envío</SelectItem>
                  <SelectItem value="segment">Segmento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filter-action" className="text-xs">
                Acción
              </Label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger id="filter-action">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="create">Crear</SelectItem>
                  <SelectItem value="edit">Editar</SelectItem>
                  <SelectItem value="delete">Eliminar</SelectItem>
                  <SelectItem value="send">Enviar</SelectItem>
                  <SelectItem value="schedule">Programar</SelectItem>
                  <SelectItem value="cancel">Cancelar</SelectItem>
                  <SelectItem value="restore">Restaurar</SelectItem>
                  <SelectItem value="duplicate">Duplicar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filter-entity-id" className="text-xs">
                ID Entidad
              </Label>
              <Input
                id="filter-entity-id"
                type="number"
                placeholder="Filtrar por ID"
                value={filterEntityId}
                onChange={(e) => setFilterEntityId(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="filter-user-id" className="text-xs">
                ID Usuario
              </Label>
              <Input
                id="filter-user-id"
                type="number"
                placeholder="Filtrar por usuario"
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs">Desde</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP", { locale: es }) : "Seleccionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="text-xs">Hasta</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP", { locale: es }) : "Seleccionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Lista de Actividad */}
        <ScrollArea style={{ height: maxHeight }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-2" />
              <p>No se encontró actividad</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-white",
                      getActionColor(activity.action)
                    )}
                  >
                    {getActionIcon(activity.action)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{activity.action.toUpperCase()}</Badge>
                        <Badge variant="secondary">{activity.entity_type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          ID: {activity.entity_id}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </div>

                    <p className="text-sm font-medium mb-1">{activity.description}</p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {activity.user && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {activity.user.name}
                        </span>
                      )}
                      {activity.ip_address && (
                        <span>IP: {activity.ip_address}</span>
                      )}
                      <span>
                        {format(new Date(activity.created_at), "PPP 'a las' p", { locale: es })}
                      </span>
                    </div>

                    {activity.meta && Object.keys(activity.meta).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                          Ver detalles
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {JSON.stringify(activity.meta, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Paginación */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadActivity(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadActivity(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
