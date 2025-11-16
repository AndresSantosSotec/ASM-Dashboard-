"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Users,
  Search,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  Send,
  Calendar as CalendarIcon,
  Loader2,
  Eye,
  FileText,
  Variable as VariableIcon,
  Bookmark,
  Filter,
} from "lucide-react"
import {
  fetchPlantillas,
  fetchSegments,
  previewBatch,
  enviarMasivo,
  type EmailTemplate,
  type SavedSegment,
  type EnvioMasivoPayload,
} from "@/services/plantillasMailing"
import { RichTextEditor } from "./RichTextEditor"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { API_BASE_URL } from "@/utils/apiConfig"

interface SimplifiedBulkSendModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

type Step = 1 | 2 | 3

// Interfaz para prospecto
interface Prospecto {
  id: string
  nombre: string
  email: string
  telefono: string
  departamento: string
  estado: string
  ultimoCambio: string
}

export function SimplifiedBulkSendModal({ open, onOpenChange, onSuccess }: SimplifiedBulkSendModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Step 1: Recipients
  const [recipientType, setRecipientType] = useState<'todos' | 'filtrado'>('filtrado')
  const [selectedSegmentId, setSelectedSegmentId] = useState<number | null>(null)
  const [savedSegments, setSavedSegments] = useState<SavedSegment[]>([])
  const [estimatedCount, setEstimatedCount] = useState(0)

  // Prospectos filtrados
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [loadingProspectos, setLoadingProspectos] = useState(false)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [estadoFilter, setEstadoFilter] = useState<string>("todos")
  const [selectedProspectoIds, setSelectedProspectoIds] = useState<string[]>([])
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)

  // Step 2: Template & Content
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [customSubject, setCustomSubject] = useState('')
  const [customContent, setCustomContent] = useState('')

  // Step 3: Schedule
  const [sendImmediate, setSendImmediate] = useState(true)
  const [scheduledDate, setScheduledDate] = useState<Date>()
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      loadTemplates()
      loadSegments()
      loadProspectos()
    } else {
      // Limpiar el estado cuando se cierra el modal para evitar errores de removeChild
      setTimeout(() => {
        resetForm()
      }, 300) // Esperar a que termine la animación de cierre
    }
  }, [open])

  useEffect(() => {
    if (selectedSegmentId) {
      const segment = savedSegments.find((s) => s.id === selectedSegmentId)
      if (segment) {
        setEstimatedCount(segment.total_destinatarios)
      }
    }
  }, [selectedSegmentId, savedSegments])

  useEffect(() => {
    if (selectedTemplate) {
      setCustomSubject(selectedTemplate.asunto)
      setCustomContent(selectedTemplate.contenido_html)
    }
  }, [selectedTemplate])

  const loadTemplates = async () => {
    try {
      const response = await fetchPlantillas({ activo: true })
      setTemplates(response.data)
    } catch (error) {
      toast.error("Error al cargar plantillas")
    }
  }

  const loadSegments = async () => {
    try {
      const data = await fetchSegments()
      setSavedSegments(data)
    } catch (error) {
      console.error("Error al cargar segmentos:", error)
    }
  }

  const loadProspectos = async () => {
    setLoadingProspectos(true)
    try {
      const token = localStorage.getItem("token")
      const url = `${API_BASE_URL}/api/prospectos`
      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      if (!res.ok) {
        throw new Error(`Error al obtener prospectos: status ${res.status}`)
      }
      const json = await res.json()
      const prospectosTransformados = json.data
        .map((item: any) => ({
          id: String(item.id),
          nombre: item.nombre_completo,
          email: item.correo_electronico,
          telefono: item.telefono,
          departamento: item.empresa_donde_labora_actualmente ?? "Sin Departamento",
          estado: item.status || "No contactado",
          ultimoCambio: item.updated_at ?? "N/A",
        }))
        .sort((a: Prospecto, b: Prospecto) => {
          const getTime = (d: string) => {
            const t = new Date(d).getTime()
            return isNaN(t) ? 0 : t
          }
          return getTime(b.ultimoCambio) - getTime(a.ultimoCambio)
        })
      setProspectos(prospectosTransformados)
    } catch (err: any) {
      console.error("Error al obtener prospectos:", err)
      toast.error("Error al cargar prospectos")
    } finally {
      setLoadingProspectos(false)
    }
  }

  // Filtrado de prospectos
  const filteredProspectos = useMemo(() => {
    return prospectos.filter((p) => {
      const matchesSearch =
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.telefono.toLowerCase().includes(searchTerm)
      const matchesEstado =
        estadoFilter === "todos"
          ? true
          : p.estado.toLowerCase() === estadoFilter.toLowerCase()
      return matchesSearch && matchesEstado
    })
  }, [prospectos, searchTerm, estadoFilter])

  // Paginación de prospectos filtrados
  const totalPages = itemsPerPage === filteredProspectos.length 
    ? 1 
    : Math.ceil(filteredProspectos.length / itemsPerPage)
  const paginatedProspectos = useMemo(() => {
    // Si itemsPerPage es igual al total (opción "Todo"), mostrar todos
    if (itemsPerPage === filteredProspectos.length) {
      return filteredProspectos
    }
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredProspectos.slice(startIndex, endIndex)
  }, [filteredProspectos, currentPage, itemsPerPage])

  // Reset página cuando cambian los filtros o items por página
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, estadoFilter, itemsPerPage])

  // Selección múltiple de prospectos - MEJORADO
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Seleccionar todos los filtrados, no solo la página actual
      setSelectedProspectoIds(filteredProspectos.map((p) => p.id))
    } else {
      setSelectedProspectoIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedProspectoIds((prev) => [...prev, id])
    } else {
      setSelectedProspectoIds((prev) => prev.filter((i) => i !== id))
    }
  }

  // Toggle selección al hacer clic en la fila (NUEVO - MÁS RÁPIDO)
  const handleRowClick = (id: string, e: React.MouseEvent) => {
    // Evitar toggle si se hizo clic en el checkbox directamente
    if ((e.target as HTMLElement).closest('button[role="checkbox"]')) {
      return
    }
    
    const isSelected = selectedProspectoIds.includes(id)
    handleSelectOne(id, !isSelected)
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (recipientType === 'filtrado' && selectedProspectoIds.length === 0) {
        toast.error("Selecciona al menos un prospecto")
        return
      }
      if (recipientType === 'filtrado') {
        setEstimatedCount(selectedProspectoIds.length)
      }
    }

    if (currentStep === 2) {
      if (!selectedTemplate) {
        toast.error("Selecciona una plantilla")
        return
      }
      if (!customSubject.trim()) {
        toast.error("El asunto no puede estar vacío")
        return
      }
      if (!customContent.trim()) {
        toast.error("El contenido no puede estar vacío")
        return
      }
    }

    if (currentStep === 3) {
      if (!sendImmediate && !scheduledDate) {
        toast.error("Selecciona una fecha de envío")
        return
      }
      handleSubmit()
      return
    }

    setCurrentStep((prev) => (prev + 1) as Step)
  }

  const handleBack = () => {
    setCurrentStep((prev) => (prev - 1) as Step)
  }

  const handleSubmit = async () => {
    if (!selectedTemplate) return

    try {
      setSubmitting(true)

      const payload: any = {
        template_id: selectedTemplate.id,
        asunto: customSubject,
        tipo_destinatarios: recipientType,
        enviar_inmediato: sendImmediate,
        notas: notes,
      }

      // Si es filtrado, enviar los IDs de prospectos seleccionados
      if (recipientType === 'filtrado' && selectedProspectoIds.length > 0) {
        // Obtener los emails de los prospectos seleccionados
        const selectedEmails = prospectos
          .filter(p => selectedProspectoIds.includes(p.id))
          .map(p => p.email)
        
        payload.destinatarios_manuales = selectedEmails
        payload.tipo_destinatarios = 'manual' // Cambiar a manual ya que enviamos emails específicos
      }

      if (!sendImmediate && scheduledDate) {
        payload.fecha_programada = format(scheduledDate, "yyyy-MM-dd HH:mm:ss")
      }

      await enviarMasivo(payload)

      toast.success(
        sendImmediate
          ? "Envío masivo iniciado correctamente"
          : "Envío programado exitosamente"
      )

      onSuccess?.()
      onOpenChange(false)
      resetForm()
    } catch (error) {
      toast.error("Error al procesar envío")
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setCurrentStep(1)
    setRecipientType('filtrado')
    setSelectedSegmentId(null)
    setSelectedProspectoIds([])
    setSearchTerm('')
    setEstadoFilter('todos')
    setSelectedTemplate(null)
    setCustomSubject('')
    setCustomContent('')
    setSendImmediate(true)
    setScheduledDate(undefined)
    setNotes('')
  }

  const steps = [
    { number: 1, title: "Destinatarios", icon: Users },
    { number: 2, title: "Contenido", icon: FileText },
    { number: 3, title: "Programar", icon: Send },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-6xl xl:max-w-7xl max-h-[95vh] flex flex-col p-3 sm:p-4 md:p-6 gap-3 sm:gap-4">
        <DialogHeader className="pb-2 sm:pb-3 border-b">
          <DialogTitle className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold">Envío Masivo de Email</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Configure su campaña de email en 3 pasos: seleccione destinatarios, personalice plantilla y confirme envío
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6 px-2 sm:px-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-full border-2 transition-all duration-200 font-semibold text-xs sm:text-sm md:text-base",
                    currentStep === step.number
                      ? "border-primary bg-primary text-primary-foreground shadow-lg scale-110"
                      : currentStep > step.number
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-muted-foreground/30 bg-background"
                  )}
                >
                  {currentStep > step.number ? (
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
                  ) : (
                    <step.icon className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] sm:text-xs md:text-sm mt-1 sm:mt-2 text-center font-medium hidden sm:block",
                    currentStep === step.number
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
                {/* Mobile: Solo mostrar título del paso actual */}
                <span
                  className={cn(
                    "text-[9px] mt-0.5 text-center font-medium sm:hidden",
                    currentStep === step.number
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  {currentStep === step.number ? step.title : `${step.number}`}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 sm:h-1 flex-1 mx-1 sm:mx-2 md:mx-4 transition-all duration-300 rounded-full",
                    currentStep > step.number ? "bg-green-500" : "bg-muted-foreground/20"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content - Scrollable area optimizada */}
        <ScrollArea className="flex-1 pr-2 sm:pr-3 md:pr-4 -mr-2 sm:-mr-3 md:-mr-4">
          <div className="pr-2 sm:pr-3 md:pr-4">
          {/* Step 1: Recipients */}
          {currentStep === 1 && (
            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              <Card className="border-2 border-primary/20 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    ¿A quién enviar?
                  </CardTitle>
                  <CardDescription>
                    Selecciona a quiénes llegará este correo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Card
                      className={cn(
                        "cursor-pointer transition-all hover:border-primary",
                        recipientType === 'todos' && "border-primary bg-primary/5 border-2"
                      )}
                      onClick={() => {
                        setRecipientType('todos')
                        setEstimatedCount(0) // Would need actual count from API
                      }}
                    >
                      <CardContent className="pt-4 sm:pt-6 text-center">
                        <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 text-primary" />
                        <h3 className="font-semibold mb-1 text-sm sm:text-base">Todos los Usuarios</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Enviar a toda la base de datos
                        </p>
                      </CardContent>
                    </Card>

                    <Card
                      className={cn(
                        "cursor-pointer transition-all hover:border-primary",
                        recipientType === 'filtrado' && "border-primary bg-primary/5 border-2"
                      )}
                      onClick={() => setRecipientType('filtrado')}
                    >
                      <CardContent className="pt-4 sm:pt-6 text-center">
                        <Filter className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 text-primary" />
                        <h3 className="font-semibold mb-1 text-sm sm:text-base">Segmento Filtrado</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Usar un grupo específico
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {recipientType === 'filtrado' && (
                    <div className="pt-2 sm:pt-4 space-y-3 sm:space-y-4">
                      <Label className="flex items-center gap-2 mb-2 text-sm sm:text-base">
                        <Filter className="h-4 w-4" />
                        Filtrar Prospectos
                      </Label>
                      
                      {/* Filtros */}
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
                        <div className="flex-1">
                          <Label className="text-xs sm:text-sm">Búsqueda</Label>
                          <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                              type="text"
                              placeholder="Buscar..."
                              className="pl-9 text-sm"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="w-full sm:w-[200px]">
                          <Label className="text-xs sm:text-sm">Estado</Label>
                          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Filtrar por estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todos">Todos</SelectItem>
                              <SelectItem value="No contactado">No contactado</SelectItem>
                              <SelectItem value="En seguimiento">En seguimiento</SelectItem>
                              <SelectItem value="Le interesa a futuro">Le interesa a futuro</SelectItem>
                              <SelectItem value="Inscrito">Inscrito</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Tabla de Prospectos */}
                      {loadingProspectos ? (
                        <div className="flex flex-col items-center justify-center p-8 sm:p-12">
                          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
                          <p className="mt-3 text-sm text-muted-foreground">Cargando prospectos...</p>
                        </div>
                      ) : (
                        <>
                          {/* Contenedor con scroll horizontal y vertical */}
                          <div className="rounded-lg border shadow-sm overflow-hidden">
                            <div className="overflow-x-auto overflow-y-auto max-h-[300px] sm:max-h-[350px] md:max-h-[400px]">
                              <Table className="relative">
                                <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur-sm z-20">
                                  <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[40px] sticky left-0 bg-muted/95 backdrop-blur-sm z-30 border-r">
                                      <Checkbox
                                        checked={filteredProspectos.length > 0 && selectedProspectoIds.length === filteredProspectos.length}
                                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                      />
                                    </TableHead>
                                    <TableHead className="min-w-[150px] sticky left-[40px] bg-muted/95 backdrop-blur-sm z-30 text-xs sm:text-sm font-semibold">Nombre</TableHead>
                                    <TableHead className="min-w-[200px] text-xs sm:text-sm font-semibold">Email</TableHead>
                                    <TableHead className="min-w-[120px] text-xs sm:text-sm font-semibold">Teléfono</TableHead>
                                    <TableHead className="min-w-[100px] text-xs sm:text-sm font-semibold">Estado</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {paginatedProspectos.length > 0 ? (
                                    paginatedProspectos.map((prospecto) => (
                                      <TableRow 
                                        key={prospecto.id} 
                                        className={cn(
                                          "cursor-pointer transition-colors",
                                          selectedProspectoIds.includes(prospecto.id) 
                                            ? "bg-primary/10 hover:bg-primary/20" 
                                            : "hover:bg-muted/50"
                                        )}
                                        onClick={(e) => handleRowClick(prospecto.id, e)}
                                      >
                                        <TableCell className="w-[40px] sticky left-0 bg-background z-10 border-r" onClick={(e) => e.stopPropagation()}>
                                          <Checkbox
                                            checked={selectedProspectoIds.includes(prospecto.id)}
                                            onCheckedChange={(checked) => handleSelectOne(prospecto.id, checked as boolean)}
                                          />
                                        </TableCell>
                                        <TableCell className="font-medium sticky left-[40px] bg-background z-10 text-xs sm:text-sm">
                                          <div className="truncate font-semibold max-w-[200px]">
                                            {prospecto.nombre}
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-xs sm:text-sm">
                                          <div className="truncate text-muted-foreground max-w-[250px]">{prospecto.email}</div>
                                        </TableCell>
                                        <TableCell className="text-xs sm:text-sm text-muted-foreground">{prospecto.telefono}</TableCell>
                                        <TableCell>
                                          <Badge
                                            variant="outline"
                                            className={cn(
                                              "text-[10px] sm:text-xs font-medium whitespace-nowrap",
                                              prospecto.estado.toLowerCase() === "no contactado"
                                                ? "bg-gray-100 text-gray-800 border-gray-300"
                                                : prospecto.estado.toLowerCase() === "en seguimiento"
                                                ? "bg-blue-100 text-blue-800 border-blue-300"
                                                : "bg-green-100 text-green-800 border-green-300"
                                            )}
                                          >
                                            {prospecto.estado}
                                          </Badge>
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={5} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                          <Users className="h-8 w-8 text-muted-foreground/50" />
                                          <p className="text-sm text-muted-foreground">No se encontraron prospectos.</p>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </div>

                          {/* Controles de Paginación - Compactos */}
                          {filteredProspectos.length > 10 && (
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t mt-3">
                              {/* Selector de items por página */}
                              <div className="flex items-center gap-2">
                                <Label className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                                  Mostrar:
                                </Label>
                                <Select
                                  value={itemsPerPage === filteredProspectos.length ? "all" : String(itemsPerPage)}
                                  onValueChange={(value) => {
                                    if (value === "all") {
                                      setItemsPerPage(filteredProspectos.length)
                                    } else {
                                      setItemsPerPage(Number(value))
                                    }
                                  }}
                                >
                                  <SelectTrigger className="h-7 w-[70px] sm:w-[80px] text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                    <SelectItem value="500">500</SelectItem>
                                    <SelectItem value="1000">1000</SelectItem>
                                    <SelectItem value="all">Todo</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Contador de items */}
                              <div className="text-[10px] sm:text-xs text-muted-foreground order-last sm:order-none w-full sm:w-auto text-center">
                                {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredProspectos.length)} de {filteredProspectos.length}
                              </div>
                              {/* Botones de navegación - Solo si no es "Todo" */}
                              {itemsPerPage !== filteredProspectos.length && (
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="h-7 w-7 p-0 hidden sm:flex"
                                    title="Primera página"
                                  >
                                    <ChevronLeft className="h-3 w-3" />
                                    <ChevronLeft className="h-3 w-3 -ml-2.5" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="h-7 w-7 p-0"
                                    title="Anterior"
                                  >
                                    <ChevronLeft className="h-3 w-3" />
                                  </Button>
                                  
                                  {/* Números de página - Solo mostrar 3 máximo en móvil */}
                                  <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                      .filter(page => {
                                        // En móvil: solo mostrar página actual ± 1
                                        if (totalPages <= 3) return true
                                        if (page === currentPage) return true
                                        if (Math.abs(page - currentPage) === 1) return true
                                        return false
                                      })
                                      .map((page) => (
                                        <Button
                                          key={page}
                                          variant={currentPage === page ? "default" : "outline"}
                                          size="sm"
                                          onClick={() => setCurrentPage(page)}
                                          className="h-7 w-7 p-0 text-xs"
                                        >
                                          {page}
                                        </Button>
                                      ))}
                                    {totalPages > 3 && currentPage < totalPages - 1 && (
                                      <span className="text-muted-foreground text-xs px-1">...</span>
                                    )}
                                    {totalPages > 3 && currentPage < totalPages - 1 && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(totalPages)}
                                        className="h-7 w-7 p-0 text-xs hidden sm:flex"
                                      >
                                        {totalPages}
                                      </Button>
                                    )}
                                  </div>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="h-7 w-7 p-0"
                                    title="Siguiente"
                                  >
                                    <ChevronRight className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="h-7 w-7 p-0 hidden sm:flex"
                                    title="Última página"
                                  >
                                    <ChevronRight className="h-3 w-3" />
                                    <ChevronRight className="h-3 w-3 -ml-2.5" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          {selectedProspectoIds.length > 0 && (
                            <Card className="bg-green-50 border-green-200 mt-4">
                              <CardContent className="p-4 flex items-center gap-3">
                                <Check className="h-8 w-8 text-green-600" />
                                <div>
                                  <p className="font-semibold text-green-900">
                                    {selectedProspectoIds.length} prospecto(s) seleccionado(s)
                                  </p>
                                  <p className="text-sm text-green-700">
                                    El correo se enviará a este grupo
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Content */}
          {currentStep === 2 && (
            <div className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Selecciona una Plantilla Base</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Puedes personalizarla después
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {templates.map((template) => (
                      <Card
                        key={template.id}
                        className={cn(
                          "cursor-pointer transition-all hover:border-primary",
                          selectedTemplate?.id === template.id && "border-primary bg-primary/5 border-2"
                        )}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm sm:text-base">{template.nombre}</h4>
                            {selectedTemplate?.id === template.id && (
                              <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2">
                            {template.descripcion || "Sin descripción"}
                          </p>
                          <div className="flex gap-2">
                            <Badge variant="outline">{template.tipo}</Badge>
                            <Badge variant="secondary">{template.categoria}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {selectedTemplate && (
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Personaliza el Contenido</CardTitle>
                    <CardDescription>
                      Edita el asunto y contenido según necesites
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="custom-subject" className="text-xs sm:text-sm">Asunto del Correo *</Label>
                      <Input
                        id="custom-subject"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        placeholder="Escribe el asunto aquí..."
                        className="mt-1 text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs sm:text-sm">Contenido del Correo *</Label>
                      <div className="mt-1">
                        {/* Solo renderizar RichTextEditor cuando el modal está abierto y en step 2 */}
                        {open && currentStep === 2 && (
                          <RichTextEditor
                            value={customContent}
                            onChange={setCustomContent}
                            variables={selectedTemplate.variables_disponibles?.map(v => ({
                              nombre: v,
                              descripcion: `Variable ${v}`,
                              ejemplo: `Ejemplo de ${v}`
                            })) || []}
                            placeholder="Personaliza el contenido del correo..."
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 3: Schedule */}
          {currentStep === 3 && (
            <div className="space-y-4 sm:space-y-6">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    ¿Cuándo enviar?
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Envía ahora o programa para más tarde
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Card
                      className={cn(
                        "cursor-pointer transition-all hover:border-primary",
                        sendImmediate && "border-primary bg-primary/5 border-2"
                      )}
                      onClick={() => setSendImmediate(true)}
                    >
                      <CardContent className="pt-4 sm:pt-6 text-center">
                        <Send className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 text-primary" />
                        <h3 className="font-semibold mb-1 text-sm sm:text-base">Enviar Ahora</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          El envío comenzará inmediatamente
                        </p>
                      </CardContent>
                    </Card>

                    <Card
                      className={cn(
                        "cursor-pointer transition-all hover:border-primary",
                        !sendImmediate && "border-primary bg-primary/5 border-2"
                      )}
                      onClick={() => setSendImmediate(false)}
                    >
                      <CardContent className="pt-4 sm:pt-6 text-center">
                        <CalendarIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 text-primary" />
                        <h3 className="font-semibold mb-1 text-sm sm:text-base">Programar</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Elige fecha y hora específica
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {!sendImmediate && (
                    <div>
                      <Label>Fecha y Hora de Envío</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal mt-1",
                              !scheduledDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {scheduledDate
                              ? format(scheduledDate, "PPP 'a las' p", { locale: es })
                              : "Seleccionar fecha y hora"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={scheduledDate}
                            onSelect={setScheduledDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="notes">Notas Internas (opcional)</Label>
                    <Input
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Agrega notas para referencia interna..."
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-base text-blue-900">Resumen del Envío</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-700">Destinatarios:</span>
                    <Badge variant="secondary" className="bg-blue-100">
                      {recipientType === 'todos' 
                        ? 'Todos los usuarios' 
                        : `${selectedProspectoIds.length} prospecto${selectedProspectoIds.length !== 1 ? 's' : ''}`}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-700">Plantilla:</span>
                    <span className="text-sm font-medium text-blue-900">
                      {selectedTemplate?.nombre}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-700">Asunto:</span>
                    <span className="text-sm font-medium text-blue-900 max-w-xs truncate">
                      {customSubject}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-700">Envío:</span>
                    <Badge className="bg-blue-600">
                      {sendImmediate
                        ? 'Inmediato'
                        : scheduledDate
                        ? format(scheduledDate, "dd/MM/yyyy HH:mm")
                        : 'Sin programar'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          </div>
        </ScrollArea>

        {/* Actions - Botones optimizados */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center pt-3 sm:pt-4 border-t mt-3 sm:mt-4 gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || submitting}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            <ChevronLeft className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Anterior</span>
            <span className="sm:hidden text-xs">Atrás</span>
          </Button>
          <Button 
            onClick={handleNext} 
            disabled={submitting} 
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">Procesando...</span>
                <span className="sm:hidden text-xs">Enviando...</span>
              </>
            ) : currentStep === 3 ? (
              <>
                <Send className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{sendImmediate ? 'Enviar Ahora' : 'Programar Envío'}</span>
                <span className="sm:hidden text-xs">Enviar</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Siguiente</span>
                <span className="sm:hidden text-xs">Siguiente</span>
                <ChevronRight className="h-4 w-4 ml-1 sm:ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
