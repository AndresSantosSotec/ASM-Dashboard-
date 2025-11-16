"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  ChevronLeft,
  ChevronRight,
  Users,
  FileText,
  Variable,
  Eye,
  Send,
  Calendar as CalendarIcon,
  Loader2,
  Check,
  X,
  Filter,
  Bookmark,
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
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface BulkSendModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

type Step = 1 | 2 | 3 | 4 | 5

interface RecipientFilters {
  programa_id?: 'all' | number
  activo?: boolean
  tiene_email?: boolean
  estado?: string
  fecha_registro_desde?: string
  fecha_registro_hasta?: string
}

export function BulkSendModal({ open, onOpenChange, onSuccess }: BulkSendModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Step 1: Recipients
  const [recipientType, setRecipientType] = useState<'todos' | 'filtrado' | 'manual'>('filtrado')
  const [filters, setFilters] = useState<RecipientFilters>({
    activo: true,
    tiene_email: true,
  })
  const [manualRecipients, setManualRecipients] = useState<string>('')
  const [savedSegments, setSavedSegments] = useState<SavedSegment[]>([])
  const [selectedSegmentId, setSelectedSegmentId] = useState<number | null>(null)
  const [estimatedCount, setEstimatedCount] = useState(0)

  // Step 2: Template
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [customSubject, setCustomSubject] = useState('')

  // Step 3: Variables
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})

  // Step 4: Preview
  const [previews, setPreviews] = useState<any[]>([])
  const [previewRecipients, setPreviewRecipients] = useState<string>('1,2,3,4,5')

  // Step 5: Schedule
  const [sendImmediate, setSendImmediate] = useState(true)
  const [scheduledDate, setScheduledDate] = useState<Date>()
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      loadTemplates()
      loadSegments()
    }
  }, [open])

  useEffect(() => {
    if (selectedSegmentId) {
      const segment = savedSegments.find((s) => s.id === selectedSegmentId)
      if (segment) {
        setFilters(segment.filtros)
        setEstimatedCount(segment.total_destinatarios)
      }
    }
  }, [selectedSegmentId, savedSegments])

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

  const loadPreviews = async () => {
    if (!selectedTemplate) return

    try {
      setLoading(true)
      const ids = previewRecipients.split(',').map((id) => parseInt(id.trim())).filter(Boolean)
      const data = await previewBatch(selectedTemplate.id, ids.slice(0, 5))
      setPreviews(data)
    } catch (error) {
      toast.error("Error al cargar previsualizaciones")
    } finally {
      setLoading(false)
    }
  }

  const handleNext = async () => {
    // Validations
    if (currentStep === 1) {
      if (recipientType === 'manual' && !manualRecipients.trim()) {
        toast.error("Ingresa IDs de destinatarios separados por comas")
        return
      }
      if (recipientType === 'filtrado' && estimatedCount === 0) {
        toast.error("Los filtros no generan destinatarios")
        return
      }
    }

    if (currentStep === 2) {
      if (!selectedTemplate) {
        toast.error("Selecciona una plantilla")
        return
      }
    }

    if (currentStep === 3) {
      const requiredVars = selectedTemplate?.variables_disponibles || []
      const missingVars = requiredVars.filter((v) => !variableValues[v])
      if (missingVars.length > 0) {
        toast.error(`Completa las variables: ${missingVars.join(', ')}`)
        return
      }
    }

    if (currentStep === 4) {
      await loadPreviews()
    }

    if (currentStep === 5) {
      if (!sendImmediate && !scheduledDate) {
        toast.error("Selecciona una fecha de envío")
        return
      }
      await handleSubmit()
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

      const payload: EnvioMasivoPayload = {
        template_id: selectedTemplate.id,
        asunto: customSubject || selectedTemplate.asunto,
        tipo_destinatarios: recipientType,
        enviar_inmediato: sendImmediate,
        notas: notes,
      }

      if (recipientType === 'filtrado') {
        payload.filtros = filters
      } else if (recipientType === 'manual') {
        payload.destinatarios_manuales = manualRecipients
          .split(',')
          .map((id) => parseInt(id.trim()))
          .filter(Boolean)
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
    setFilters({ activo: true, tiene_email: true })
    setManualRecipients('')
    setSelectedTemplate(null)
    setCustomSubject('')
    setVariableValues({})
    setPreviews([])
    setSendImmediate(true)
    setScheduledDate(undefined)
    setNotes('')
  }

  const steps = [
    { number: 1, title: "Destinatarios", icon: Users },
    { number: 2, title: "Plantilla", icon: FileText },
    { number: 3, title: "Variables", icon: Variable },
    { number: 4, title: "Preview", icon: Eye },
    { number: 5, title: "Enviar", icon: Send },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Envío Masivo de Correos</DialogTitle>
          <DialogDescription>
            Configura y envía correos masivos en 5 simples pasos
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                    currentStep === step.number
                      ? "border-primary bg-primary text-primary-foreground"
                      : currentStep > step.number
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-muted-foreground/30 bg-background"
                  )}
                >
                  {currentStep > step.number ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs mt-1 text-center",
                    currentStep === step.number
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2 transition-colors",
                    currentStep > step.number ? "bg-green-500" : "bg-muted-foreground/30"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 pr-4">
          {/* Step 1: Recipients */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label>Tipo de Destinatarios</Label>
                <Select
                  value={recipientType}
                  onValueChange={(v: any) => setRecipientType(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los usuarios</SelectItem>
                    <SelectItem value="filtrado">Con filtros</SelectItem>
                    <SelectItem value="manual">IDs manuales</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {recipientType === 'filtrado' && (
                <>
                  {savedSegments.length > 0 && (
                    <div>
                      <Label className="flex items-center gap-1">
                        <Bookmark className="h-4 w-4" />
                        Segmentos Guardados
                      </Label>
                      <Select
                        value={selectedSegmentId?.toString() || ''}
                        onValueChange={(v) => setSelectedSegmentId(v ? parseInt(v) : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un segmento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Sin segmento</SelectItem>
                          {savedSegments.map((seg) => (
                            <SelectItem key={seg.id} value={seg.id.toString()}>
                              {seg.nombre} ({seg.total_destinatarios} destinatarios)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filtros de Destinatarios
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="programa">Programa</Label>
                          <Select
                            value={filters.programa_id?.toString() || 'all'}
                            onValueChange={(v) =>
                              setFilters({ ...filters, programa_id: v === 'all' ? 'all' : parseInt(v) })
                            }
                          >
                            <SelectTrigger id="programa">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              {/* Add program options */}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="activo">Estado</Label>
                          <Select
                            value={
                              filters.activo === undefined
                                ? 'all'
                                : filters.activo
                                ? 'true'
                                : 'false'
                            }
                            onValueChange={(v) =>
                              setFilters({
                                ...filters,
                                activo: v === 'all' ? undefined : v === 'true',
                              })
                            }
                          >
                            <SelectTrigger id="activo">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="true">Activos</SelectItem>
                              <SelectItem value="false">Inactivos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <Users className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">
                            Destinatarios estimados: {estimatedCount}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Basado en los filtros aplicados
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {recipientType === 'manual' && (
                <div>
                  <Label htmlFor="manual-ids">IDs de Destinatarios (separados por comas)</Label>
                  <Textarea
                    id="manual-ids"
                    placeholder="1, 2, 3, 4, 5..."
                    value={manualRecipients}
                    onChange={(e) => setManualRecipients(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Total:{' '}
                    {manualRecipients
                      .split(',')
                      .map((id) => id.trim())
                      .filter(Boolean).length}{' '}
                    destinatarios
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Template */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Selecciona una Plantilla</Label>
                <div className="grid grid-cols-1 gap-3 mt-2">
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      className={cn(
                        "cursor-pointer transition-all hover:border-primary",
                        selectedTemplate?.id === template.id && "border-primary bg-primary/5"
                      )}
                      onClick={() => {
                        setSelectedTemplate(template)
                        setCustomSubject(template.asunto)
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{template.nombre}</CardTitle>
                            <CardDescription>{template.descripcion}</CardDescription>
                          </div>
                          {selectedTemplate?.id === template.id && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Badge variant="outline">{template.tipo}</Badge>
                          <Badge variant="secondary">{template.categoria}</Badge>
                          {template.variables_disponibles &&
                            template.variables_disponibles.length > 0 && (
                              <Badge>
                                {template.variables_disponibles.length} variables
                              </Badge>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {selectedTemplate && (
                <div>
                  <Label htmlFor="custom-subject">Asunto del Correo</Label>
                  <Input
                    id="custom-subject"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Asunto personalizado"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 3: Variables */}
          {currentStep === 3 && (
            <div className="space-y-4">
              {selectedTemplate?.variables_disponibles &&
              selectedTemplate.variables_disponibles.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Completa los valores para las variables de la plantilla:
                  </p>
                  {selectedTemplate.variables_disponibles.map((variable) => (
                    <div key={variable}>
                      <Label htmlFor={`var-${variable}`}>
                        {variable}
                        <Badge variant="outline" className="ml-2">
                          {`{{${variable}}}`}
                        </Badge>
                      </Label>
                      <Input
                        id={`var-${variable}`}
                        value={variableValues[variable] || ''}
                        onChange={(e) =>
                          setVariableValues({ ...variableValues, [variable]: e.target.value })
                        }
                        placeholder={`Valor para ${variable}`}
                      />
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Variable className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Esta plantilla no tiene variables configuradas</p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Preview */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="preview-ids">IDs para Preview (máx 5, separados por comas)</Label>
                <div className="flex gap-2">
                  <Input
                    id="preview-ids"
                    value={previewRecipients}
                    onChange={(e) => setPreviewRecipients(e.target.value)}
                    placeholder="1, 2, 3, 4, 5"
                  />
                  <Button onClick={loadPreviews} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {previews.length > 0 && (
                <div className="space-y-3">
                  {previews.map((preview, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">
                          Preview #{index + 1} - {preview.destinatario_nombre || 'Sin nombre'}
                        </CardTitle>
                        <CardDescription>{preview.destinatario_email}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">
                              Asunto:
                            </span>
                            <p className="text-sm">{preview.asunto}</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">
                              Contenido:
                            </span>
                            <div
                              className="text-sm p-3 bg-muted rounded-lg max-h-40 overflow-y-auto"
                              dangerouslySetInnerHTML={{ __html: preview.contenido_html }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Schedule */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div>
                <Label>¿Cuándo enviar?</Label>
                <Select
                  value={sendImmediate ? 'immediate' : 'scheduled'}
                  onValueChange={(v) => setSendImmediate(v === 'immediate')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Enviar inmediatamente</SelectItem>
                    <SelectItem value="scheduled">Programar envío</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!sendImmediate && (
                <div>
                  <Label>Fecha y Hora de Envío</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !scheduledDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {scheduledDate
                          ? format(scheduledDate, "PPP 'a las' p", { locale: es })
                          : "Seleccionar fecha"}
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
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Agrega notas sobre este envío..."
                  rows={3}
                />
              </div>

              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-base">Resumen del Envío</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plantilla:</span>
                    <span className="font-medium">{selectedTemplate?.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Destinatarios:</span>
                    <span className="font-medium">
                      {recipientType === 'todos'
                        ? 'Todos'
                        : recipientType === 'manual'
                        ? manualRecipients.split(',').filter(Boolean).length
                        : estimatedCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Envío:</span>
                    <span className="font-medium">
                      {sendImmediate
                        ? 'Inmediato'
                        : scheduledDate
                        ? format(scheduledDate, "PPP", { locale: es })
                        : 'Sin programar'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </ScrollArea>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || submitting}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <Button onClick={handleNext} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Procesando...
              </>
            ) : currentStep === 5 ? (
              <>
                <Send className="h-4 w-4 mr-1" />
                {sendImmediate ? 'Enviar Ahora' : 'Programar Envío'}
              </>
            ) : (
              <>
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
