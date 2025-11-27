// components/finanzas/MassEmailModal.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { FileText, Mail as MailIcon, Loader2, Paperclip, X } from "lucide-react"
import { getPlantillas, type EmailTemplate } from "@/services/mailing"
import { sendEmailToProspect } from "@/services/finance"
import { RichTextEditor } from "@/components/plantillas-mailing/RichTextEditor"
import { buildEmailTemplate, type ContactTemplateType } from "@/lib/collectionsTemplates"
import { toast } from "@/hooks/use-toast"
import type { LatePaymentStudent } from "@/types/collections"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  selectedStudents: LatePaymentStudent[]
  onSuccess?: () => void
}

const forceLTR = (raw: string) =>
  (raw || "").replace(/\sdir=("|')rtl\1/gi, ' dir="ltr"').replace(/direction:\s*rtl/gi, "direction: ltr")

export default function MassEmailModal({ open, onOpenChange, selectedStudents, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState({ sent: 0, total: 0, errors: 0 })

  // Plantillas
  const [tipoPlantilla, setTipoPlantilla] = useState<"hardcoded" | "api">("hardcoded")
  const [plantillasAPI, setPlantillasAPI] = useState<EmailTemplate[]>([])
  const [loadingPlantillas, setLoadingPlantillas] = useState(false)
  const [plantillaAPISeleccionada, setPlantillaAPISeleccionada] = useState<number | null>(null)
  const [tpl, setTpl] = useState<ContactTemplateType>("overdue")

  // Contenido
  const [subject, setSubject] = useState("")
  const [html, setHtml] = useState("")
  const [useCustomMessage, setUseCustomMessage] = useState(false)
  const [useRichEditor, setUseRichEditor] = useState(true)

  // ✅ Adjuntos de archivos
  const [attachments, setAttachments] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Reset al cerrar
  useEffect(() => {
    if (!open) {
      setSubject("")
      setHtml("")
      setUseCustomMessage(false)
      setProgress({ sent: 0, total: 0, errors: 0 })
      setAttachments([])
    }
  }, [open])

  // Cargar plantillas dinámicas
  useEffect(() => {
    if (!open) return
    const loadPlantillas = async () => {
      setLoadingPlantillas(true)
      try {
        const response = await getPlantillas({
          activo: true,
          tipo: "correo",
          perPage: 100,
        })
        setPlantillasAPI(response.data || [])
      } catch (error) {
        console.error("Error loading plantillas:", error)
      } finally {
        setLoadingPlantillas(false)
      }
    }
    loadPlantillas()
  }, [open])

  // Generar contenido desde plantilla
  useEffect(() => {
    if (useCustomMessage) return

    // Si usa plantilla API
    if (tipoPlantilla === "api" && plantillaAPISeleccionada) {
      const plantilla = plantillasAPI.find((p) => p.id === plantillaAPISeleccionada)
      if (plantilla) {
        let contenido = plantilla.contenido_html || plantilla.cuerpo || ""
        let asunto = plantilla.asunto || ""
        setSubject(asunto)
        setHtml(forceLTR(contenido))
        return
      }
    }

    // Plantilla hardcoded (ejemplo con primer estudiante)
    if (selectedStudents.length > 0) {
      const firstStudent = selectedStudents[0]
      const mail = buildEmailTemplate(tpl, {
        nombre: firstStudent.name,
        programa: firstStudent.program,
        monto: firstStudent.montoCuota,
        fecha: undefined,
      })
      setSubject(mail.subject)
      setHtml(forceLTR(mail.html))
    }
  }, [tpl, selectedStudents, tipoPlantilla, plantillaAPISeleccionada, plantillasAPI, useCustomMessage])

  // Obtener correos de los estudiantes seleccionados
  const getStudentEmails = async () => {
    const emails: Array<{ email: string; student: LatePaymentStudent; prospectoId?: number }> = []
    
    // Importar servicios necesarios
    const { getProspectoById, fetchStudentSnapshot } = await import("@/services/finance")
    
    for (const student of selectedStudents) {
      try {
        let prospectoId: number | undefined = undefined
        let email: string | undefined = undefined
        
        // Intentar obtener prospecto_id del studentId
        prospectoId = Number(student.studentId) || undefined
        
        // Si no se puede obtener directamente, usar snapshot
        if (!prospectoId && student.epId) {
          try {
            const snap = await fetchStudentSnapshot(student.epId)
            prospectoId = Number(
              (snap as any)?.prospecto_id ??
              snap?.ep?.prospecto?.id ??
              (snap as any)?.prospectoId
            ) || undefined
          } catch (e) {
            console.warn(`No se pudo obtener prospecto desde snapshot para ${student.name}:`, e)
          }
        }
        
        // Obtener email del prospecto
        if (prospectoId) {
          try {
            const prospecto = await getProspectoById(prospectoId)
            email = prospecto?.correo_electronico || prospecto?.correo_corporativo || undefined
          } catch (e) {
            console.warn(`No se pudo obtener prospecto ${prospectoId} para ${student.name}:`, e)
          }
        }
        
        if (email) {
          emails.push({ email, student, prospectoId })
        }
      } catch (e) {
        console.error(`Error procesando estudiante ${student.name}:`, e)
      }
    }
    
    return emails
  }

  // ✅ Funciones para manejar archivos adjuntos
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments((prev) => [...prev, ...files])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSendMassive = async () => {
    if (!subject || !html) {
      toast({
        title: "Campos requeridos",
        description: "El asunto y contenido son obligatorios",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    setProgress({ sent: 0, total: selectedStudents.length, errors: 0 })

    try {
      const emailsWithData = await getStudentEmails()
      
      if (emailsWithData.length === 0) {
        toast({
          title: "Sin correos válidos",
          description: "No se encontraron correos válidos para los estudiantes seleccionados",
          variant: "destructive",
        })
        setSending(false)
        return
      }

      const prospectoIds: number[] = []

      for (const { email, student, prospectoId } of emailsWithData) {
        try {
          // Personalizar contenido para cada estudiante
          let personalizedHtml = html
          let personalizedSubject = subject

          const variables: Record<string, string> = {
            nombre: student.name,
            programa: student.program,
            monto: `Q${student.montoCuota.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`,
            fecha: student.fechaVencimiento ? new Date(student.fechaVencimiento).toLocaleDateString('es-GT') : "",
          }

          Object.entries(variables).forEach(([key, value]) => {
            personalizedHtml = personalizedHtml.replace(new RegExp(`{{${key}}}`, "gi"), value)
            personalizedSubject = personalizedSubject.replace(new RegExp(`{{${key}}}`, "gi"), value)
          })

          await sendEmailToProspect({
            to: email,
            subject: personalizedSubject,
            html: personalizedHtml,
            attachments: attachments.length > 0 ? attachments : undefined,
          })

          if (prospectoId) {
            prospectoIds.push(prospectoId)
          }

          setProgress((prev) => ({ ...prev, sent: prev.sent + 1 }))
        } catch (e: any) {
          console.error(`Error enviando a ${email}:`, e)
          setProgress((prev) => ({ ...prev, errors: prev.errors + 1 }))
        }
      }

      // Registrar contactos del día
      if (prospectoIds.length > 0) {
        try {
          await fetch("/api/contactos-dia/masivo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prospecto_ids: prospectoIds,
              tipo_contacto: "email",
            }),
          })
        } catch (e) {
          console.warn("Error registrando contactos del día:", e)
        }
      }

      toast({
        title: "Envío completado",
        description: `Se enviaron ${progress.sent} correos. ${progress.errors > 0 ? `${progress.errors} errores.` : ""}`,
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Error al enviar correos masivos",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar correos masivos</DialogTitle>
          <DialogDescription>
            {selectedStudents.length} estudiante{selectedStudents.length !== 1 ? "s" : ""} seleccionado{selectedStudents.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selector de tipo de plantilla */}
          <div className="space-y-2">
            <Label>Origen de plantilla</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={tipoPlantilla === "hardcoded" ? "default" : "outline"}
                onClick={() => {
                  setTipoPlantilla("hardcoded")
                  setPlantillaAPISeleccionada(null)
                  setUseCustomMessage(false)
                }}
                disabled={useCustomMessage}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Plantillas predefinidas
              </Button>
              <Button
                type="button"
                variant={tipoPlantilla === "api" ? "default" : "outline"}
                onClick={() => {
                  setTipoPlantilla("api")
                  setUseCustomMessage(false)
                }}
                disabled={useCustomMessage || loadingPlantillas}
                className="flex-1"
              >
                <MailIcon className="h-4 w-4 mr-2" />
                {loadingPlantillas ? "Cargando..." : `Plantillas dinámicas (${plantillasAPI.length})`}
              </Button>
            </div>
          </div>

          {/* Selector de plantilla API */}
          {tipoPlantilla === "api" && (
            <div className="space-y-2">
              <Label>Seleccionar plantilla</Label>
              <Select
                value={plantillaAPISeleccionada?.toString() || ""}
                onValueChange={(v) => {
                  setPlantillaAPISeleccionada(v ? parseInt(v) : null)
                  setUseCustomMessage(false)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una plantilla..." />
                </SelectTrigger>
                <SelectContent>
                  {plantillasAPI
                    .filter((p) => p.tipo === "correo" || p.tipo === "email")
                    .map((plantilla) => (
                      <SelectItem key={plantilla.id} value={plantilla.id.toString()}>
                        {plantilla.nombre}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Plantillas hardcoded */}
          {tipoPlantilla === "hardcoded" && (
            <div className="space-y-2">
              <Label>Plantilla</Label>
              <Select
                value={tpl}
                onValueChange={(v: any) => {
                  setTpl(v)
                  setUseCustomMessage(false)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona plantilla" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overdue">Pago atrasado</SelectItem>
                  <SelectItem value="due_soon">Por vencer</SelectItem>
                  <SelectItem value="reminder">Recordatorio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Checkbox para mensaje personalizado */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="customMessage"
              checked={useCustomMessage}
              onCheckedChange={(checked) => setUseCustomMessage(!!checked)}
            />
            <Label htmlFor="customMessage" className="cursor-pointer">
              Usar mensaje personalizado
            </Label>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Asunto</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          {/* Editor */}
          {useRichEditor && !useCustomMessage ? (
            <div>
              <Label>Contenido (HTML)</Label>
              <RichTextEditor
                value={html}
                onChange={setHtml}
                placeholder="Personaliza el contenido del correo..."
                variables={[
                  { nombre: "nombre", descripcion: "Nombre del estudiante", ejemplo: "Juan Pérez" },
                  { nombre: "programa", descripcion: "Programa académico", ejemplo: "Ingeniería en Sistemas" },
                  { nombre: "monto", descripcion: "Monto a pagar", ejemplo: "Q1,500.00" },
                  { nombre: "fecha", descripcion: "Fecha de vencimiento", ejemplo: "15/12/2024" },
                ]}
              />
            </div>
          ) : (
            <div>
              <Label>Contenido {useCustomMessage ? "(personalizado)" : "(texto simple)"}</Label>
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                className="w-full min-h-[300px] border rounded-md p-3 text-sm"
                placeholder="Escribe el contenido del correo..."
              />
            </div>
          )}

          {/* ✅ Adjuntos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Archivos adjuntos</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
                disabled={sending}
              >
                <Paperclip className="h-4 w-4" /> Adjuntar archivo
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xlsx,.xls"
            />
            {attachments.length > 0 && (
              <div className="space-y-2 p-3 bg-gray-50 rounded-md">
                {attachments.map((file, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1">{file.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs">{(file.size / 1024).toFixed(1)} KB</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(i)}
                        className="h-6 w-6 p-0"
                        disabled={sending}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progress */}
          {sending && (
            <div className="p-4 bg-blue-50 rounded-md">
              <div className="text-sm font-medium mb-2">Enviando correos...</div>
              <div className="text-xs text-muted-foreground">
                Enviados: {progress.sent} / {progress.total}
                {progress.errors > 0 && ` • Errores: ${progress.errors}`}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancelar
          </Button>
          <Button onClick={handleSendMassive} disabled={sending || !subject || !html}>
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <MailIcon className="mr-2 h-4 w-4" />
                Enviar a {selectedStudents.length} estudiante{selectedStudents.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

