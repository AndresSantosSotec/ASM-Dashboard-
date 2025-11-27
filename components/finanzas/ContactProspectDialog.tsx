// components/finanzas/ContactProspectDialog.tsx
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, X, FileText, Mail as MailIcon } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

import { buildEmailTemplate, buildWhatsAppText, type ContactTemplateType } from "@/lib/collectionsTemplates"
import { getProspectoById, sendEmailToProspect as sendEmailAPI } from "@/services/finance"
import { pickTelefono, pickCorreo, pickProgramaNombre } from "@/lib/contact/mappers"
import { toast } from "@/hooks/use-toast"
import { getPlantillas, type EmailTemplate } from "@/services/mailing"
import { RichTextEditor } from "@/components/plantillas-mailing/RichTextEditor"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  prospectoId?: number
  contextoPago?: { nombre: string; programa?: string; fecha?: string; monto?: number }
}

const forceLTR = (raw: string) =>
  (raw || "").replace(/\sdir=("|')rtl\1/gi, ' dir="ltr"').replace(/direction:\s*rtl/gi, "direction: ltr")

const normalizeGTPhone = (value?: string) => {
  const digits = (value ?? "").replace(/[^\d]/g, "")
  if (!digits) return ""
  return digits.startsWith("502") ? digits : `502${digits}`
}

export default function ContactProspectDialog({ open, onOpenChange, prospectoId, contextoPago }: Props) {
  const [loading, setLoading] = useState(false)
  const [prospecto, setProspecto] = useState<any | null>(null)

  const [telefono, setTelefono] = useState("")
  const [correo, setCorreo] = useState("")

  const [mode, setMode] = useState<"whatsapp" | "email">("email")
  const [tpl, setTpl] = useState<ContactTemplateType>("overdue")
  const [subject, setSubject] = useState("")
  const [html, setHtml] = useState("")

  // ✅ Nuevos estados para plantillas dinámicas y editor
  const [tipoPlantilla, setTipoPlantilla] = useState<"hardcoded" | "api">("hardcoded")
  const [plantillasAPI, setPlantillasAPI] = useState<EmailTemplate[]>([])
  const [loadingPlantillas, setLoadingPlantillas] = useState(false)
  const [plantillaAPISeleccionada, setPlantillaAPISeleccionada] = useState<number | null>(null)
  const [useCustomMessage, setUseCustomMessage] = useState(false)
  const [useRichEditor, setUseRichEditor] = useState(true) // ✅ Por defecto usar editor rico
  const [isUserEditing, setIsUserEditing] = useState(false)

  const [attachments, setAttachments] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const editorRef = useRef<HTMLDivElement | null>(null)

  // Reset al cerrar
  useEffect(() => {
    if (!open) {
      setAttachments([])
      setUseCustomMessage(false)
      setTipoPlantilla("hardcoded")
      setPlantillaAPISeleccionada(null)
      setUseRichEditor(true)
    }
  }, [open])

  // ✅ Cargar plantillas dinámicas cuando se abre el modal
  useEffect(() => {
    if (!open) return
    const loadPlantillas = async () => {
      setLoadingPlantillas(true)
      try {
        const response = await getPlantillas({
          activo: true,
          tipo: mode === "email" ? "correo" : "whatsapp",
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
  }, [open, mode])

  // 3.1 Cargar la ficha cuando abras el modal con un prospectoId válido
  useEffect(() => {
    if (!open) return
    if (!prospectoId) {
      setProspecto(null)
      setTelefono("")
      setCorreo("")
      return
    }
    setLoading(true)
    getProspectoById(prospectoId)
      .then((p) => {
        setProspecto(p)
        setTelefono(pickTelefono(p))
        setCorreo(pickCorreo(p))
      })
      .catch((e) => {
        console.error(e)
        toast({ title: "Error", description: "No se pudo cargar la ficha del prospecto", variant: "destructive" })
      })
      .finally(() => setLoading(false))
  }, [open, prospectoId])

  // ✅ Generar contenido desde plantilla API o hardcoded
  useEffect(() => {
    if (useCustomMessage) return // No actualizar si el usuario está editando personalizado

    const ctx = contextoPago ?? {
      nombre: prospecto?.nombre_completo ?? "Estudiante",
      programa: pickProgramaNombre(prospecto),
      fecha: contextoPago?.fecha,
      monto: contextoPago?.monto,
    }

    // Si usa plantilla API
    if (tipoPlantilla === "api" && plantillaAPISeleccionada) {
      const plantilla = plantillasAPI.find((p) => p.id === plantillaAPISeleccionada)
      if (plantilla) {
        let contenido = plantilla.contenido_html || plantilla.cuerpo || ""
        let asunto = plantilla.asunto || ""

        // Reemplazar variables
        const variables: Record<string, string> = {
          nombre: ctx.nombre || "Estudiante",
          programa: ctx.programa || "",
          fecha: ctx.fecha || "",
          monto: ctx.monto ? `Q${ctx.monto.toLocaleString("es-GT", { minimumFractionDigits: 2 })}` : "",
        }

        Object.entries(variables).forEach(([key, value]) => {
          contenido = contenido.replace(new RegExp(`{{${key}}}`, "gi"), value)
          asunto = asunto.replace(new RegExp(`{{${key}}}`, "gi"), value)
        })

        setSubject(asunto)
        setHtml(forceLTR(contenido))
        return
      }
    }

    // Plantilla hardcoded
    const mail = buildEmailTemplate(tpl, ctx)
    setSubject(mail.subject)
    setHtml(forceLTR(mail.html))
  }, [tpl, prospecto, contextoPago, tipoPlantilla, plantillaAPISeleccionada, plantillasAPI, useCustomMessage])

  // 3.3 WhatsApp href con normalización GT
  const whatsappHref = useMemo(() => {
    const ctx = contextoPago ?? {
      nombre: prospecto?.nombre_completo ?? "Estudiante",
      programa: pickProgramaNombre(prospecto),
      fecha: contextoPago?.fecha,
      monto: contextoPago?.monto,
    }
    const text = buildWhatsAppText(tpl, ctx)
    const phone = normalizeGTPhone(telefono)
    if (!phone) return "#"
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  }, [tpl, telefono, prospecto, contextoPago])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments((prev) => [...prev, ...files])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const sendEmail = async () => {
    if (!correo) {
      toast({ title: "Correo requerido", description: "El correo del estudiante es obligatorio", variant: "destructive" })
      return
    }
    try {
      setLoading(true)
      const payload = { to: correo, subject, html, attachments }
      
      const res = await sendEmailAPI(payload)

      toast({
        title: "Correo enviado",
        description: `Para: ${res?.echo?.to ?? correo} (${res?.echo?.files_count ?? 0} adj.)`,
      })
      
      // ✅ Registrar contacto del día
      if (prospectoId) {
        try {
          await fetch("/api/contactos-dia", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prospecto_id: prospectoId,
              tipo_contacto: "email",
            }),
          })
        } catch (e) {
          console.warn("Error registrando contacto del día:", e)
        }
      }
      
      onOpenChange(false)
    } catch (e: any) {
      console.error("[ContactDialog] error al enviar:", e?.response?.data ?? e)
      toast({
        title: "Error",
        description: e?.response?.data?.message ?? "No se pudo enviar el correo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contactar estudiante</DialogTitle>
          <DialogDescription>
            {loading ? "Cargando..." : prospecto ? `Ficha de ${prospecto.nombre_completo} (ID ${prospecto.id})` : "Sin ficha"}
          </DialogDescription>
        </DialogHeader>

        {/* Contacto */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+502 ..." />
            <Label>Correo</Label>
            <Input value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="correo@dominio.com" />
          </div>
          <div className="space-y-2">
            <Label>Canal</Label>
            <Select value={mode} onValueChange={(v: any) => setMode(v)}>
              <SelectTrigger><SelectValue placeholder="Selecciona canal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Correo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {mode === "whatsapp" ? (
          <div className="mt-4">
            <Label>Plantilla</Label>
            <Select value={tpl} onValueChange={(v: any) => setTpl(v)}>
              <SelectTrigger><SelectValue placeholder="Selecciona plantilla" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="overdue">Pago atrasado</SelectItem>
                <SelectItem value="due_soon">Por vencer</SelectItem>
                <SelectItem value="reminder">Recordatorio</SelectItem>
              </SelectContent>
            </Select>
            <Button asChild className="w-full mt-4" disabled={!telefono || loading}>
              <a href={whatsappHref} target="_blank" rel="noreferrer">Abrir WhatsApp con mensaje</a>
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Se abrirá WhatsApp con el mensaje según la plantilla.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* ✅ Selector de tipo de plantilla */}
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

            {/* ✅ Selector de plantilla API */}
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
                      .filter((p) => {
                        const tipoPlantilla = (p.tipo === "correo" || p.tipo === "email") ? "email" : p.tipo
                        return tipoPlantilla === mode
                      })
                      .map((plantilla) => (
                        <SelectItem key={plantilla.id} value={plantilla.id.toString()}>
                          {plantilla.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* ✅ Plantillas hardcoded */}
            {tipoPlantilla === "hardcoded" && (
              <div className="space-y-2">
                <Label>Plantilla</Label>
                <Select value={tpl} onValueChange={(v: any) => {
                  setTpl(v)
                  setUseCustomMessage(false)
                }}>
                  <SelectTrigger><SelectValue placeholder="Selecciona plantilla" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overdue">Pago atrasado</SelectItem>
                    <SelectItem value="due_soon">Por vencer</SelectItem>
                    <SelectItem value="reminder">Recordatorio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* ✅ Checkbox para mensaje personalizado */}
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

            {/* ✅ Selector de editor */}
            {!useCustomMessage && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useRichEditor"
                  checked={useRichEditor}
                  onCheckedChange={(checked) => setUseRichEditor(!!checked)}
                />
                <Label htmlFor="useRichEditor" className="cursor-pointer">
                  Usar editor HTML avanzado
                </Label>
              </div>
            )}

            <Separator />

            <div className="flex-1">
              <Label>Asunto</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            {/* ✅ Editor HTML avanzado o simple */}
            {useRichEditor && !useCustomMessage ? (
              <div>
                <Label>Contenido (HTML)</Label>
                <RichTextEditor
                  value={html}
                  onChange={setHtml}
                  placeholder="Personaliza el contenido del correo..."
                  variables={[
                    { nombre: "nombre", descripcion: "Nombre del estudiante" },
                    { nombre: "programa", descripcion: "Programa académico" },
                    { nombre: "fecha", descripcion: "Fecha de vencimiento" },
                    { nombre: "monto", descripcion: "Monto a pagar" },
                  ]}
                />
              </div>
            ) : (
              <div>
                <Label>Contenido {useCustomMessage ? "(personalizado)" : "(texto simple)"}</Label>
                <Textarea 
                  value={html} 
                  onChange={(e) => setHtml(e.target.value)} 
                  className="min-h-[300px]" 
                />
                {!useCustomMessage && (
                  <div className="mt-2">
                    <Label className="text-xs text-muted-foreground">Vista previa HTML</Label>
                    <div className="border rounded-md p-3 mt-1 text-sm" dangerouslySetInnerHTML={{ __html: html }} />
                  </div>
                )}
              </div>
            )}

            {/* Adjuntos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Archivos adjuntos</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                  disabled={loading}
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
                          disabled={loading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button className="w-full" onClick={sendEmail} disabled={loading || !correo}>
              {loading ? "Enviando..." : "Enviar correo"}
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
