"use client"
import React, { useState, useEffect, useRef } from "react"
import axios from "axios"
import { API_BASE_URL } from "@/utils/apiConfig"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MessageSquare, Copy, ExternalLink, CheckCircle } from "lucide-react"

interface WhatsAppMensajeGeneratorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentName?: string
  studentPhone?: string
  studentEmail?: string
  programa?: string
  asesor?: string
  // Datos financieros
  inscripcion?: string
  cuotaMensual?: string
  cantidadMeses?: string
  inversionTotal?: string
  serviciosElectronicos?: string
  formaPago?: string
  // Datos académicos
  fechaInicioEspecifica?: string
  diaEstudio?: string
  duracionCarrera?: string
  titulo1?: string
  titulo2?: string
  titulo3?: string
}

type PlantillaType =
  | "confirmacion_registro"
  | "bienvenida"
  | "inscripcion_completa"
  | "recordatorio_documentos"
  | "credenciales"
  | "inicio_clases"
  | "personalizado"

const PLANTILLAS: Record<PlantillaType, { label: string; description: string }> = {
  confirmacion_registro: {
    label: "Confirmación de Registro",
    description: "Mensaje completo con datos del alumno e inversión",
  },
  bienvenida: {
    label: "Bienvenida",
    description: "Mensaje de bienvenida al nuevo estudiante",
  },
  inscripcion_completa: {
    label: "Inscripción Completa",
    description: "Confirmación de que la inscripción fue completada",
  },
  recordatorio_documentos: {
    label: "Recordatorio de Documentos",
    description: "Solicitar documentos pendientes",
  },
  credenciales: {
    label: "Envío de Credenciales",
    description: "Envío de credenciales de acceso a plataforma",
  },
  inicio_clases: {
    label: "Inicio de Clases",
    description: "Información sobre el inicio de clases",
  },
  personalizado: {
    label: "Mensaje Personalizado",
    description: "Escribir un mensaje libre",
  },
}

/** Formatea un valor numérico como moneda guatemalteca Q1,234.00 */
function formatQ(val: string | undefined): string {
  if (!val) return "Q0.00"
  const num = parseFloat(val.replace(/[^0-9.-]/g, ""))
  if (isNaN(num)) return "Q0.00"
  return `Q${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** Formatea fecha ISO a d/m/yyyy */
function formatFecha(val: string | undefined): string {
  if (!val) return "[Por confirmar]"
  const d = new Date(val + "T00:00:00")
  if (isNaN(d.getTime())) return val
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

function buildTemplate(
  type: PlantillaType,
  data: {
    nombre: string
    programa: string
    asesor: string
    fechaInicio?: string
    plataforma?: string
    // Datos de confirmación de registro
    telefono?: string
    email?: string
    duracionCarrera?: string
    fechaInicioEspecifica?: string
    diaEstudio?: string
    titulo1?: string
    titulo2?: string
    titulo3?: string
    inscripcion?: string
    cuotaMensual?: string
    cantidadMeses?: string
    inversionTotal?: string
    serviciosElectronicos?: string
  }
): string {
  const { nombre, programa, asesor, fechaInicio, plataforma } = data

  switch (type) {
    case "confirmacion_registro": {
      const tel = data.telefono || "[Teléfono]"
      const correo = data.email || "[Correo]"
      const dur = data.duracionCarrera || data.cantidadMeses || "[Duración]"
      const fechaIni = formatFecha(data.fechaInicioEspecifica)
      const dia = data.diaEstudio || "[Por confirmar]"
      const t1 = data.titulo1 || programa || "0"
      const t2 = data.titulo2 || "0"
      const t3 = data.titulo3 || "0"
      const inscrip = formatQ(data.inscripcion)
      const cuota = formatQ(data.cuotaMensual)
      const meses = data.cantidadMeses || dur
      const servElec = formatQ(data.serviciosElectronicos)
      const invTotal = formatQ(data.inversionTotal)

      return (
        `Buen día estimado estudiante: *${nombre}*\n\n` +
        `Le damos una cordial bienvenida a la familia *American School of Management*, le envío el siguiente mensaje para dejar constancia de su registro como alumno y confirmar datos:\n\n` +
        `📱 *Teléfono móvil:* ${tel}\n` +
        `📧 *Correo electrónico personal:* ${correo}\n` +
        `📋 *Programa:* ${programa}\n` +
        `📅 *Duración de carrera:* ${dur}\n` +
        `🗓️ *Fecha de inicio:* ${fechaIni}\n` +
        `📆 *Día que estudiará:* ${dia}\n` +
        `🎓 *Título 1:* ${t1}\n` +
        `🎓 *Título 2:* ${t2}\n` +
        `🎓 *Título 3:* ${t3}\n\n` +
        `Si los datos están incorrectos favor de confirmarlos nuevamente.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `*Inversión con porcentaje de beca*\n\n` +
        `💰 *Inscripción:* ${inscrip}\n` +
        `   _Único pago en toda la carrera, a menos que deje de estudiar en un lapso de 6 meses_\n` +
        `💵 *Cuota Mensual:* ${cuota} _(Cuota confidencial)_\n` +
        `📊 *Cantidad en Meses:* ${meses}\n` +
        `⚡ *Pago de servicios electrónicos:* ${servElec} _(pago único durante todo el programa)_\n` +
        `🏦 *Inversión Total:* ${invTotal}\n\n` +
        `Su pago mensual debe hacerse del 1 al 5 de cada mes, enviando boleta de pago al correo o número de contabilidad. Si desea que su cobro se haga por débito automático, notifique inmediatamente a su asesor.\n\n` +
        `Le enviamos este mensaje para dejar constancia de su registro como alumno, y confirmar sus datos.\n\n` +
        `⚠️ *Nota:* el día que estudiará está sujeto a cambios según disponibilidad de cursos. Es *OBLIGATORIO* tener la cámara encendida durante sus clases, en un espacio idóneo. Para un óptimo rendimiento debe utilizar como principal herramienta una *COMPUTADORA* con internet estable, no teléfonos o tablets.\n\n` +
        `Así mismo es importante que tome en cuenta que su fecha para taller de integración es (participación indispensable):\n` +
        `📅 *Fecha de sesión de inducción (obligatoria):*\n\n` +
        `Si aún no nos sigues en nuestras redes sociales te invitamos a hacerlo, no olvides interactuar en nuestras publicaciones.\n` +
        `🔗 https://linktr.ee/american_school_of_management`
      )
    }

    case "bienvenida":
      return `¡Hola ${nombre}! 🎓\n\nLe damos la más cordial bienvenida a *American School of Management*.\n\nHa sido inscrito/a en el programa: *${programa}*.\n\nSoy ${asesor}, su asesor/a académico/a y estaré a su disposición para cualquier consulta o apoyo que necesite durante su proceso.\n\n📞 No dude en contactarme.\n📧 contabilidad@american-edu.com\n\n¡Le deseamos mucho éxito! 🌟`

    case "inscripcion_completa":
      return `¡Hola ${nombre}! ✅\n\nLe informamos que su proceso de inscripción en *American School of Management* ha sido completado exitosamente.\n\n📋 *Programa:* ${programa}\n👤 *Asesor:* ${asesor}\n\n*Próximos pasos:*\n1. Recibirá sus credenciales de acceso a la plataforma virtual.\n2. Se le compartirá el calendario académico.\n3. Le notificaremos la fecha de inicio de clases.\n\nPara cualquier consulta, no dude en contactarnos.\n📧 contabilidad@american-edu.com\n📱 WhatsApp: +502 4169-8467\n\n¡Bienvenido/a! 🎉`

    case "recordatorio_documentos":
      return `Hola ${nombre}, buenos días. 📄\n\nLe escribimos de *American School of Management* para recordarle que tiene documentos pendientes de entrega para completar su expediente.\n\n📋 *Programa:* ${programa}\n\n*Documentos que puede tener pendientes:*\n• DPI (ambos lados)\n• Recibo de servicios\n• Título o diploma\n• Fotografía reciente\n• Cierre de pensum\n\nPuede enviarlos por este medio o entregarlos en nuestras oficinas.\n\n📍 3ra calle 9-39, zona 1, Torre Tigo, 6to nivel, oficina 610.\n\nQuedo atento/a. Saludos,\n${asesor}`

    case "credenciales":
      return `¡Hola ${nombre}! 🔑\n\nLe compartimos sus credenciales de acceso a la plataforma de *American School of Management*:\n\n🌐 *Plataforma:* ${plataforma || "campus.american-edu.com"}\n📧 *Usuario:* [Se enviará por correo]\n🔒 *Contraseña:* [Se enviará por correo]\n\n*Instrucciones:*\n1. Ingrese a la plataforma con las credenciales proporcionadas.\n2. Cambie su contraseña en el primer inicio de sesión.\n3. Complete su perfil con sus datos actualizados.\n\nSi tiene algún problema de acceso, contácteme directamente.\n\nSaludos,\n${asesor}\n📱 WhatsApp: +502 4169-8467`

    case "inicio_clases":
      return `¡Hola ${nombre}! 📚\n\nLe informamos sobre el inicio de clases en *American School of Management*.\n\n📋 *Programa:* ${programa}\n📅 *Fecha de inicio:* ${fechaInicio || "[Por confirmar]"}\n🕐 *Horario:* [Por confirmar]\n📍 *Modalidad:* Virtual / Presencial\n\n*Recomendaciones:*\n• Tener acceso a internet estable.\n• Revisar la plataforma antes del primer día.\n• Tener a mano sus credenciales de acceso.\n\nPara cualquier consulta, estoy a sus órdenes.\n\nSaludos,\n${asesor}`

    case "personalizado":
      return ""

    default:
      return `Hola ${nombre}, le escribimos de American School of Management. Saludos, ${asesor}.`
  }
}

export default function WhatsAppMensajeGenerator({
  open,
  onOpenChange,
  studentName = "",
  studentPhone = "",
  studentEmail = "",
  programa = "",
  asesor = "",
  inscripcion = "",
  cuotaMensual = "",
  cantidadMeses = "",
  inversionTotal = "",
  serviciosElectronicos = "",
  formaPago = "",
  fechaInicioEspecifica = "",
  diaEstudio = "",
  duracionCarrera = "",
  titulo1 = "",
  titulo2 = "",
  titulo3 = "",
}: WhatsAppMensajeGeneratorProps) {
  const [plantilla, setPlantilla] = useState<PlantillaType>("confirmacion_registro")
  const [mensaje, setMensaje] = useState("")
  const [telefono, setTelefono] = useState(studentPhone)
  const [nombre, setNombre] = useState(studentName)
  const [emailLocal, setEmailLocal] = useState(studentEmail)
  const [programaLocal, setProgramaLocal] = useState(programa)
  // Auto-load asesor name from logged-in user (first_name + last_name or full_name)
  const getAsesorName = (propValue: string) => {
    if (propValue) return propValue
    try {
      const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null
      if (storedUser) {
        const u = JSON.parse(storedUser)
        // El modelo User tiene first_name, last_name y accessor full_name
        if (u?.full_name) return u.full_name
        if (u?.first_name || u?.last_name) return `${u.first_name || ""} ${u.last_name || ""}`.trim()
        if (u?.name) return u.name
      }
    } catch { /* ignore */ }
    return ""
  }
  const [asesorLocal, setAsesorLocal] = useState(() => getAsesorName(asesor))
  const [fechaInicio, setFechaInicio] = useState(fechaInicioEspecifica)
  const [diaEstudioLocal, setDiaEstudioLocal] = useState(diaEstudio)
  const [duracionLocal, setDuracionLocal] = useState(duracionCarrera || cantidadMeses)
  const [inscripcionLocal, setInscripcionLocal] = useState(inscripcion)
  const [cuotaLocal, setCuotaLocal] = useState(cuotaMensual)
  const [mesesLocal, setMesesLocal] = useState(cantidadMeses)
  const [servElecLocal, setServElecLocal] = useState(serviciosElectronicos)
  const [invTotalLocal, setInvTotalLocal] = useState(inversionTotal)
  const [titulo1Local, setTitulo1Local] = useState(titulo1)
  const [titulo2Local, setTitulo2Local] = useState(titulo2)
  const [titulo3Local, setTitulo3Local] = useState(titulo3)
  const [copied, setCopied] = useState(false)

  // Cache of program IDs → names
  const programasCache = useRef<Record<string, string>>({})

  // Cache of servicios electrónicos prices from DB
  const preciosServElecCache = useRef<Array<{ curso: string; transfer: string; otro: string }>>([])

  // Fetch servicios electrónicos prices and auto-fill based on duration + payment method
  useEffect(() => {
    if (!open) return
    const fetchAndApply = async () => {
      try {
        // Fetch prices if cache is empty
        if (preciosServElecCache.current.length === 0) {
          const resp = await axios.get(`${API_BASE_URL}/api/precios-servicios-electronicos/frontend`)
          preciosServElecCache.current = resp.data
        }
        // Determine the course count to look up
        const cursos = parseInt(duracionCarrera || cantidadMeses || "0", 10)
        if (cursos <= 0 || preciosServElecCache.current.length === 0) return

        // Find the matching price row (exact match or closest ≤ value)
        const precios = preciosServElecCache.current
        let match = precios.find((p) => parseInt(p.curso, 10) === cursos)
        if (!match) {
          // Find closest row with cantidad_cursos ≤ cursos
          const sorted = [...precios]
            .filter((p) => parseInt(p.curso, 10) <= cursos)
            .sort((a, b) => parseInt(b.curso, 10) - parseInt(a.curso, 10))
          match = sorted[0]
        }
        if (!match) match = precios[precios.length - 1] // fallback to highest

        // Pick price based on payment method
        const esTransferencia = ["transferencia", "deposito"].includes(formaPago.toLowerCase())
        const precio = esTransferencia ? match.transfer : match.otro
        setServElecLocal(precio)
      } catch (err) {
        console.error("Error cargando precios de servicios electrónicos:", err)
      }
    }
    fetchAndApply()
  }, [open, duracionCarrera, cantidadMeses, formaPago])

  // Resolve program IDs to names when dialog opens
  useEffect(() => {
    if (!open) return
    // Only fetch if we have IDs that look like numbers and haven't resolved yet
    const ids = [programa, titulo1, titulo2, titulo3].filter(
      (id) => id && /^\d+$/.test(id) && !programasCache.current[id]
    )
    if (ids.length === 0) return

    axios
      .get(`${API_BASE_URL}/api/programas`)
      .then((resp) => {
        const progs: Array<{ id: number; abreviatura?: string; nombre_del_programa?: string }> = resp.data
        progs.forEach((p) => {
          const label = p.abreviatura
            ? `${p.abreviatura} - ${p.nombre_del_programa}`
            : p.nombre_del_programa || ""
          programasCache.current[p.id.toString()] = label
        })
        // Update local state with resolved names
        if (programa && programasCache.current[programa]) {
          setProgramaLocal(programasCache.current[programa])
        }
        if (titulo1 && programasCache.current[titulo1]) {
          setTitulo1Local(programasCache.current[titulo1])
        }
        if (titulo2 && programasCache.current[titulo2]) {
          setTitulo2Local(programasCache.current[titulo2])
        }
        if (titulo3 && programasCache.current[titulo3]) {
          setTitulo3Local(programasCache.current[titulo3])
        }
      })
      .catch((err) => console.error("Error cargando programas:", err))
  }, [open, programa, titulo1, titulo2, titulo3])

  // Sync props when dialog opens
  useEffect(() => {
    if (open) {
      setTelefono(studentPhone)
      setNombre(studentName)
      setEmailLocal(studentEmail)
      // Resolve program name from cache if ID, otherwise use as-is
      const resolveProgName = (id: string) =>
        id && /^\d+$/.test(id) && programasCache.current[id]
          ? programasCache.current[id]
          : id
      setProgramaLocal(resolveProgName(programa))
      setAsesorLocal(getAsesorName(asesor))
      setFechaInicio(fechaInicioEspecifica)
      setDiaEstudioLocal(diaEstudio)
      setDuracionLocal(duracionCarrera || cantidadMeses)
      setInscripcionLocal(inscripcion)
      setCuotaLocal(cuotaMensual)
      setMesesLocal(cantidadMeses)
      setServElecLocal(serviciosElectronicos)
      setInvTotalLocal(inversionTotal)
      setTitulo1Local(resolveProgName(titulo1))
      setTitulo2Local(titulo2 && /^\d+$/.test(titulo2) ? resolveProgName(titulo2) : (titulo2 || "0"))
      setTitulo3Local(titulo3 && /^\d+$/.test(titulo3) ? resolveProgName(titulo3) : (titulo3 || "0"))
      setCopied(false)
    }
  }, [open, studentPhone, studentName, studentEmail, programa, asesor, fechaInicioEspecifica, diaEstudio, duracionCarrera, cantidadMeses, inscripcion, cuotaMensual, serviciosElectronicos, inversionTotal, titulo1, titulo2, titulo3])

  // Rebuild message when template or fields change
  useEffect(() => {
    if (plantilla !== "personalizado") {
      const text = buildTemplate(plantilla, {
        nombre: nombre || "[Nombre]",
        programa: programaLocal || "[Programa]",
        asesor: asesorLocal || "[Asesor]",
        fechaInicio: fechaInicio,
        telefono: telefono,
        email: emailLocal,
        duracionCarrera: duracionLocal,
        fechaInicioEspecifica: fechaInicio,
        diaEstudio: diaEstudioLocal,
        titulo1: titulo1Local,
        titulo2: titulo2Local,
        titulo3: titulo3Local,
        inscripcion: inscripcionLocal,
        cuotaMensual: cuotaLocal,
        cantidadMeses: mesesLocal,
        inversionTotal: invTotalLocal,
        serviciosElectronicos: servElecLocal,
      })
      setMensaje(text)
    }
  }, [plantilla, nombre, programaLocal, asesorLocal, fechaInicio, telefono, emailLocal, duracionLocal, diaEstudioLocal, titulo1Local, titulo2Local, titulo3Local, inscripcionLocal, cuotaLocal, mesesLocal, servElecLocal, invTotalLocal])

  const formatPhone = (phone: string): string => {
    let clean = phone.replace(/[^\d+]/g, "")
    if (!clean.startsWith("+")) {
      if (clean.length === 8) clean = "+502" + clean
      else if (!clean.startsWith("502")) clean = "+502" + clean
      else clean = "+" + clean
    }
    return clean
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(mensaje)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenWhatsApp = () => {
    if (!telefono.trim()) {
      alert("Ingrese un número de teléfono.")
      return
    }
    const phone = formatPhone(telefono)
    const encoded = encodeURIComponent(mensaje)
    window.open(`https://wa.me/${phone.replace("+", "")}?text=${encoded}`, "_blank")
  }

  const showFinancialFields = plantilla === "confirmacion_registro"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Generador de Mensaje WhatsApp
          </DialogTitle>
          <DialogDescription>
            Seleccione una plantilla y personalice el mensaje antes de enviarlo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selector de plantilla */}
          <div>
            <Label>Plantilla de mensaje</Label>
            <Select
              value={plantilla}
              onValueChange={(v) => setPlantilla(v as PlantillaType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PLANTILLAS).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    {val.label} — {val.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Datos del destinatario */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nombre del estudiante</Label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <Label>Teléfono (WhatsApp)</Label>
              <Input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="5555-5555 o +502..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Programa</Label>
              <Input
                value={programaLocal}
                onChange={(e) => setProgramaLocal(e.target.value)}
                placeholder="Nombre del programa"
              />
            </div>
            <div>
              <Label>Asesor</Label>
              <Input
                value={asesorLocal}
                onChange={(e) => setAsesorLocal(e.target.value)}
                placeholder="Nombre del asesor"
              />
            </div>
          </div>

          {/* Campos adicionales para confirmación de registro */}
          {showFinancialFields && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Correo electrónico</Label>
                  <Input
                    value={emailLocal}
                    onChange={(e) => setEmailLocal(e.target.value)}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div>
                  <Label>Día que estudiará</Label>
                  <Input
                    value={diaEstudioLocal}
                    onChange={(e) => setDiaEstudioLocal(e.target.value)}
                    placeholder="Sábado"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Duración de carrera</Label>
                  <Input
                    value={duracionLocal}
                    onChange={(e) => setDuracionLocal(e.target.value)}
                    placeholder="32"
                  />
                </div>
                <div>
                  <Label>Fecha de inicio</Label>
                  <Input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Cantidad en meses</Label>
                  <Input
                    value={mesesLocal}
                    onChange={(e) => setMesesLocal(e.target.value)}
                    placeholder="32"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Título 1</Label>
                  <Input
                    value={titulo1Local}
                    onChange={(e) => setTitulo1Local(e.target.value)}
                    placeholder="BBA - Bachelor..."
                  />
                </div>
                <div>
                  <Label>Título 2</Label>
                  <Input
                    value={titulo2Local}
                    onChange={(e) => setTitulo2Local(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Título 3</Label>
                  <Input
                    value={titulo3Local}
                    onChange={(e) => setTitulo3Local(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Inscripción (Q)</Label>
                  <Input
                    value={inscripcionLocal}
                    onChange={(e) => setInscripcionLocal(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Cuota Mensual (Q)</Label>
                  <Input
                    value={cuotaLocal}
                    onChange={(e) => setCuotaLocal(e.target.value)}
                    placeholder="885.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Servicios Electrónicos (Q)</Label>
                  <Input
                    value={servElecLocal}
                    onChange={(e) => setServElecLocal(e.target.value)}
                    placeholder="123.00"
                  />
                </div>
                <div>
                  <Label>Inversión Total (Q)</Label>
                  <Input
                    value={invTotalLocal}
                    onChange={(e) => setInvTotalLocal(e.target.value)}
                    placeholder="28,443.00"
                  />
                </div>
              </div>
            </>
          )}

          {plantilla === "inicio_clases" && (
            <div className="w-1/2">
              <Label>Fecha de inicio</Label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
          )}

          {/* Vista previa / editor */}
          <div>
            <Label>Mensaje</Label>
            <Textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={showFinancialFields ? 18 : 12}
              className="font-mono text-sm"
              placeholder="Escriba su mensaje aquí..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              {mensaje.length} caracteres · Puede editar el mensaje libremente antes de enviarlo.
            </p>
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" onClick={handleCopy}>
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar mensaje
                </>
              )}
            </Button>

            <Button
              onClick={handleOpenWhatsApp}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir en WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
