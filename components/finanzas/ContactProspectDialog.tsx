// components/finanzas/ContactProspectDialog.tsx
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, X } from "lucide-react"

import { buildEmailTemplate, buildWhatsAppText, type ContactTemplateType } from "@/lib/collectionsTemplates"
import { getProspectoById, sendEmailToProspect as sendEmailAPI } from "@/services/finance"
import { pickTelefono, pickCorreo, pickProgramaNombre } from "@/lib/contact/mappers"
import { toast } from "@/hooks/use-toast"

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

  const [mode, setMode] = useState<"whatsapp" | "email">("whatsapp")
  const [tpl, setTpl] = useState<ContactTemplateType>("overdue")
  const [subject, setSubject] = useState("")
  const [html, setHtml] = useState("")

  const [useSimpleEditor, setUseSimpleEditor] = useState(false)
  const [isUserEditing, setIsUserEditing] = useState(false)

  const [attachments, setAttachments] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const editorRef = useRef<HTMLDivElement | null>(null)

  // Reset de adjuntos al cerrar
  useEffect(() => {
    if (!open) setAttachments([])
  }, [open])

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

  // 3.2 Generar plantillas (usa datos de contexto o de la ficha)
  useEffect(() => {
    const ctx = contextoPago ?? {
      nombre: prospecto?.nombre_completo ?? "Estudiante",
      programa: pickProgramaNombre(prospecto),
      fecha: undefined,
      monto: undefined,
    }
    const mail = buildEmailTemplate(tpl, ctx)
    setSubject(mail.subject)
    const sanitized = forceLTR(mail.html)

    setHtml((prev) => {
      if (prev !== sanitized) {
        if (editorRef.current && !useSimpleEditor) {
          editorRef.current.innerHTML = sanitized
        }
        return sanitized
      }
      return prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tpl, prospecto, contextoPago, useSimpleEditor])

  // 3.3 WhatsApp href con normalización GT
  const whatsappHref = useMemo(() => {
    const ctx = contextoPago ?? {
      nombre: prospecto?.nombre_completo ?? "Estudiante",
      programa: pickProgramaNombre(prospecto),
      fecha: undefined,
      monto: undefined,
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
      console.log("[ContactDialog] POST /emails/send payload", payload)

      const res = await sendEmailAPI(payload) // <--- usa el servicio real
      console.log("[ContactDialog] respuesta /emails/send:", res)

      toast({
        title: "Correo enviado",
        description: `Para: ${res?.echo?.to ?? correo} (${res?.echo?.files_count ?? 0} adj.)`,
      })
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
      <DialogContent className="max-w-3xl">
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
            <Label>Plantilla</Label>
            <Select value={tpl} onValueChange={(v: any) => setTpl(v)}>
              <SelectTrigger><SelectValue placeholder="Selecciona plantilla" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="overdue">Pago atrasado</SelectItem>
                <SelectItem value="due_soon">Por vencer</SelectItem>
                <SelectItem value="reminder">Recordatorio</SelectItem>
              </SelectContent>
            </Select>

            {/* (Opcional) Cambiar de editor */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="simple-editor"
                type="checkbox"
                checked={useSimpleEditor}
                onChange={(e) => setUseSimpleEditor(e.target.checked)}
              />
              <Label htmlFor="simple-editor" className="text-sm">Usar editor simple</Label>
            </div>
          </div>
        </div>

        {mode === "whatsapp" ? (
          <div className="mt-4">
            <Button asChild className="w-full" disabled={!telefono || loading}>
              <a href={whatsappHref} target="_blank" rel="noreferrer">Abrir WhatsApp con mensaje</a>
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Se abrirá WhatsApp con el mensaje según la plantilla.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="flex-1">
              <Label>Asunto</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            {!useSimpleEditor ? (
              <>
                <Label>Contenido (rich)</Label>
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="border rounded-md p-3 min-h-[160px] text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ direction: "ltr", textAlign: "left", unicodeBidi: "embed" }}
                  onFocus={() => setIsUserEditing(true)}
                  onBlur={() => setIsUserEditing(false)}
                  onInput={(e) => setHtml((e.currentTarget as HTMLDivElement).innerHTML)}
                />
              </>
            ) : (
              <>
                <Label>Contenido (textarea)</Label>
                <Textarea value={html} onChange={(e) => setHtml(e.target.value)} className="min-h-[180px]" />
                <div className="mt-2">
                  <Label className="text-xs text-muted-foreground">Vista previa</Label>
                  <div className="border rounded-md p-3 mt-1 text-sm" dangerouslySetInnerHTML={{ __html: html }} />
                </div>
              </>
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

            <Button className="w-full" onClick={sendEmail} disabled={loading}>
              {loading ? "Enviando..." : "Enviar correo"}
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
