"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { buildEmailTemplate, buildWhatsAppText, type ContactTemplateType } from "@/lib/collectionsTemplates"
import { getProspectoById, sendEmailToProspect } from "@/services/finance"
import { toast } from "@/hooks/use-toast"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  prospectoId?: number
  contextoPago?: { nombre: string; programa?: string; fecha?: string; monto?: number }
}

export default function ContactProspectDialog({ open, onOpenChange, prospectoId, contextoPago }: Props) {
  const [loading, setLoading] = useState(false)
  const [prospecto, setProspecto] = useState<any | null>(null)

  // datos editables
  const [telefono, setTelefono] = useState('')
  const [correo, setCorreo] = useState('')

  const [mode, setMode] = useState<'whatsapp' | 'email'>('whatsapp')
  const [tpl, setTpl] = useState<ContactTemplateType>('overdue')
  const [subject, setSubject] = useState('')
  const [html, setHtml] = useState('')

  // Carga de ficha técnica
  useEffect(() => {
    if (!open || !prospectoId) return
    setLoading(true)
    getProspectoById(prospectoId)
      .then((data) => {
        setProspecto(data)
        setTelefono(data?.telefono ?? data?.telefono_corporativo ?? '')
        setCorreo(data?.correo_electronico ?? data?.correo_corporativo ?? '')
      })
      .catch(() => toast({ title: 'Error', description: 'No se pudo cargar la ficha del prospecto', variant: 'destructive' }))
      .finally(() => setLoading(false))
  }, [open, prospectoId])

  // Pre-armar plantillas
  useEffect(() => {
    const ctx = contextoPago ?? {
      nombre: prospecto?.nombre_completo ?? 'Estudiante',
      programa: prospecto?.programas?.[0]?.programa?.nombre_del_programa,
      fecha: undefined,
      monto: undefined,
    }
    const mail = buildEmailTemplate(tpl, ctx)
    setSubject(mail.subject)
    setHtml(mail.html)
  }, [tpl, prospecto, contextoPago])

  const whatsappHref = useMemo(() => {
    const ctx = contextoPago ?? {
      nombre: prospecto?.nombre_completo ?? 'Estudiante',
      programa: prospecto?.programas?.[0]?.programa?.nombre_del_programa,
      fecha: undefined,
      monto: undefined,
    }
    const text = buildWhatsAppText(tpl, ctx)
    const phone = (telefono ?? '').replace(/[^\d]/g, '')
    if (!phone) return '#'
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  }, [tpl, telefono, prospecto, contextoPago])

  const sendEmail = async () => {
    if (!correo) {
      toast({ title: 'Correo requerido', description: 'El correo del estudiante es obligatorio', variant: 'destructive' })
      return
    }
    try {
      setLoading(true)
      await sendEmailToProspect({ to: correo, subject, html })
      toast({ title: 'Correo enviado' })
      onOpenChange(false)
    } catch {
      toast({ title: 'Error', description: 'No se pudo enviar el correo', variant: 'destructive' })
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
            {prospecto ? `Ficha técnica de ${prospecto.nombre_completo} (ID ${prospecto.id})` : 'Cargando...'}
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
                <SelectItem value="overdue">Pago atrasado</SelectItem>
                <SelectItem value="due_soon">Por vencer</SelectItem>
                <SelectItem value="reminder">Recordatorio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Contenido según canal */}
        {mode === 'whatsapp' ? (
          <div className="mt-4">
            <Button asChild className="w-full" disabled={!telefono || loading}>
              <a href={whatsappHref} target="_blank" rel="noreferrer">Abrir WhatsApp con mensaje</a>
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Se abrirá WhatsApp con el mensaje predeterminado según la plantilla seleccionada.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            <Label>Asunto</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            <Label>Contenido</Label>
            <div
              contentEditable
              className="border rounded-md p-3 min-h-[160px] prose prose-sm max-w-none"
              onInput={(e) => setHtml((e.target as HTMLDivElement).innerHTML)}
              dangerouslySetInnerHTML={{ __html: html }}
            />
            <Button className="w-full mt-2" onClick={sendEmail} disabled={loading}>Enviar correo</Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}