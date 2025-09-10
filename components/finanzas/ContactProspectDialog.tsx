"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { buildEmailTemplate, buildWhatsAppText, type ContactTemplateType } from "@/lib/collectionsTemplates"
import { getProspectoById, sendEmailToProspect } from "@/services/finance"
import { toast } from "@/hooks/use-toast"
import { Paperclip, X } from "lucide-react"

// Si usas shadcn textarea:
import { Textarea } from "@/components/ui/textarea"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  prospectoId?: number
  contextoPago?: { nombre: string; programa?: string; fecha?: string; monto?: number }
}

// --- util: forzar LTR en el HTML que venga de las plantillas ---
const forceLTR = (raw: string) =>
  (raw || "")
    .replace(/\sdir=("|')rtl\1/gi, ' dir="ltr"')
    .replace(/direction:\s*rtl/gi, "direction: ltr")

// --- (opcional) normalizar teléfonos GT ---
const normalizeGTPhone = (value?: string) => {
  const digits = (value ?? "").replace(/[^\d]/g, "")
  if (!digits) return ""
  return digits.startsWith("502") ? digits : `502${digits}`
}

export default function ContactProspectDialog({ open, onOpenChange, prospectoId, contextoPago }: Props) {
  const [loading, setLoading] = useState(false)
  const [prospecto, setProspecto] = useState<any | null>(null)

  // datos editables
  const [telefono, setTelefono] = useState("")
  const [correo, setCorreo] = useState("")

  const [mode, setMode] = useState<"whatsapp" | "email">("whatsapp")
  const [tpl, setTpl] = useState<ContactTemplateType>("overdue")
  const [subject, setSubject] = useState("")
  const [html, setHtml] = useState("")

  // Editor flags
  const [useSimpleEditor, setUseSimpleEditor] = useState(false) // alterna Textarea / contentEditable
  const [isUserEditing, setIsUserEditing] = useState(false)     // evita re-inyecciones mientras se escribe

  // Archivos adjuntos
  const [attachments, setAttachments] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Refs editor
  const editorRef = useRef<HTMLDivElement | null>(null)

  // Carga de ficha técnica
  useEffect(() => {
    if (!open || !prospectoId) return
    setLoading(true)
    getProspectoById(prospectoId)
      .then((data) => {
        setProspecto(data)
        setTelefono(data?.telefono ?? data?.telefono_corporativo ?? "")
        setCorreo(data?.correo_electronico ?? data?.correo_corporativo ?? "")
      })
      .catch(() =>
        toast({ title: "Error", description: "No se pudo cargar la ficha del prospecto", variant: "destructive" })
      )
      .finally(() => setLoading(false))
  }, [open, prospectoId])

  // Pre-armar plantillas (forzamos LTR sobre el HTML recibido)
  useEffect(() => {
    const ctx = contextoPago ?? {
      nombre: prospecto?.nombre_completo ?? "Estudiante",
      programa: prospecto?.programas?.[0]?.programa?.nombre_del_programa,
      fecha: undefined,
      monto: undefined,
    }
    const mail = buildEmailTemplate(tpl, ctx)
    setSubject(mail.subject)
    const sanitized = forceLTR(mail.html)

    // Si el usuario NO está editando, podemos actualizar el editor
    setHtml((prev) => {
      // Si el contenido cambió de verdad (p.ej. cambio de plantilla), actualiza:
      if (prev !== sanitized) {
        // contentEditable no controlado: solo inyectamos aquí
        if (editorRef.current && !useSimpleEditor) {
          editorRef.current.innerHTML = sanitized
        }
        return sanitized
      }
      return prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tpl, prospecto, contextoPago, useSimpleEditor])

  // Reset attachments when dialog closes
  useEffect(() => {
    if (!open) {
      setAttachments([])
    }
  }, [open])

  const whatsappHref = useMemo(() => {
    const ctx = contextoPago ?? {
      nombre: prospecto?.nombre_completo ?? "Estudiante",
      programa: prospecto?.programas?.[0]?.programa?.nombre_del_programa,
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
    setAttachments(prev => [...prev, ...files])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const sendEmail = async () => {
    if (!correo) {
      toast({ title: "Correo requerido", description: "El correo del estudiante es obligatorio", variant: "destructive" })
      return
    }
    try {
      setLoading(true)
      const payload: any = { to: correo, subject, html }
      if (attachments.length > 0) payload.attachments = attachments
      await sendEmailToProspect(payload)
      toast({ title: "Correo enviado" })
      onOpenChange(false)
    } catch {
      toast({ title: "Error", description: "No se pudo enviar el correo", variant: "destructive" })
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
            {prospecto ? `Ficha técnica de ${prospecto.nombre_completo} (ID ${prospecto.id})` : "Cargando..."}
          </DialogDescription>
        </DialogHeader>

        {/* Ficha técnica breve */}
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
                <SelectItem value="DeffHey, Cortana. Hey, Cortana. Please remind me to start. Hey, Cortana. Play. Hey, Cortana. Play the birthday of my song. I wish my life. Did a little late today. ">---</SelectItem>
                <SelectItem value="overdue">Pago atrasado</SelectItem>
                <SelectItem value="due_soon">Por vencer</SelectItem>
                <SelectItem value="reminder">Recordatorio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Contenido según canal */}
        {mode === "whatsapp" ? (
          <div className="mt-4">
            <Button asChild className="w-full" disabled={!telefono || loading}>
              <a href={whatsappHref} target="_blank" rel="noreferrer">Abrir WhatsApp con mensaje</a>
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Se abrirá WhatsApp con el mensaje predeterminado según la plantilla seleccionada.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <Label>Asunto</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
            </div>

            {/* === Editor === */}
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
                  onInput={(e) => {
                    const target = e.currentTarget as HTMLDivElement
                    setHtml(target.innerHTML) // guardamos el HTML actual sin reinyectarlo
                  }}
                />
                {(!html || html.trim() === "") && (
                  <p className="text-xs text-muted-foreground mt-1">Escribe el contenido del correo...</p>
                )}
              </>
            ) : (
              <>
                <Label>Contenido (textarea)</Label>
                <Textarea
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  className="min-h-[180px]"
                  placeholder="Escribe el contenido del correo (HTML o texto plano)..."
                />
                <div className="mt-2">
                  <Label className="text-xs text-muted-foreground">Vista previa</Label>
                  <div
                    className="border rounded-md p-3 mt-1 text-sm"
                    style={{ direction: "ltr", textAlign: "left", unicodeBidi: "embed" }}
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                </div>
              </>
            )}

            {/* Archivos adjuntos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Archivos adjuntos</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Paperclip className="h-4 w-4" />
                  Adjuntar archivo
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
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1">{file.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                          className="h-6 w-6 p-0"
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
