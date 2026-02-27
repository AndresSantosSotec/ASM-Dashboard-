"use client"

import React, { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CheckCircle, ZoomIn, ZoomOut, RotateCw, Loader2, Upload, Save, Trash2, Star } from "lucide-react"
import Swal from 'sweetalert2'
import { API_BASE_URL } from '@/utils/apiConfig'

interface Student {
  id: string
  name: string
  email: string
  dpi?: string // Número de identificación (DPI)
}
interface ProgramaItem {
  id: number
  prospecto_id: number
  inscripcion: string
  cuota_mensual: string | null       // puede ser null
  convenio_id: number | null         // lo mismo
  programa: {
    id: number
    abreviatura: string
    nombre_del_programa: string
    meses: number
  }
}

interface User {
  id: number
  first_name: string
  last_name: string
  username: string
  email: string
}

export function StudentDetails() {
  const { id: studentId } = useParams()
  const router = useRouter()

  const [student, setStudent] = useState<Student | null>(null)
  const [programas, setProgramas] = useState<ProgramaItem[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [signature, setSignature] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastX, setLastX] = useState(0)
  const [lastY, setLastY] = useState(0)

  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [documentos, setDocumentos] = useState<string[]>([])

  // Firmas guardadas
  interface FirmaGuardada { id: number; nombre: string; imagen_base64: string; es_predeterminada: boolean }
  const [firmasGuardadas, setFirmasGuardadas] = useState<FirmaGuardada[]>([])
  const [signatureMode, setSignatureMode] = useState<"draw" | "saved" | "upload">("draw")
  const [savingSignature, setSavingSignature] = useState(false)
  const [signatureName, setSignatureName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  // Alias al primer programa (si existe)
  const programa = programas[0]

  // Fecha formateada una vez para coincidir con PDF
  const formattedDate = new Date().toLocaleDateString("es-GT", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // 1) Traer prospecto
  useEffect(() => {
    if (!studentId) return
      ; (async () => {
        try {
          const token = localStorage.getItem("token")
          const res = await fetch(
            `${API_BASE_URL}/api/prospectos/${studentId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          const json = await res.json()
          console.log("Prospecto recibido:", json.data)
          setStudent({
            id: String(json.data.id),
            name: json.data.nombre_completo || 'Sin nombre',
            email:
              json.data.correo_electronico ||
              json.data.correo ||
              json.data.email ||
              "",
            dpi: json.data.numero_identificacion || "", // ✅ Capturar DPI
          })
        } catch (err) {
          console.error(err)
        }
      })()
  }, [studentId])

  // 2) Traer programas del prospecto
  useEffect(() => {
    if (!studentId) return
      ; (async () => {
        try {
          const token = localStorage.getItem("token")
          const res = await fetch(
            `${API_BASE_URL}/api/estudiante-programa?prospecto_id=${studentId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          if (!res.ok) throw new Error("Error al cargar programas")
          const data: ProgramaItem[] = await res.json()
          console.log("Programas recibidos:", data)
          setProgramas(data)
        } catch (err) {
          console.error(err)
        }
      })()
  }, [studentId])

  // 3) Traer usuario autenticado
  useEffect(() => {
    ; (async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_BASE_URL}/api/user`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        })
        const user: User = await res.json()
        console.log("Usuario recibido:", user)
        setCurrentUser(user)
        setStudent((prev) =>
          prev ? { ...prev, email: prev.email || user.email } : prev
        )
      } catch (err) {
        console.error(err)
      }
    })()
  }, [])

  // 3.5) Traer documentos del prospecto
  useEffect(() => {
    if (!studentId) return
      ; (async () => {
        try {
          const token = localStorage.getItem("token")
          const res = await fetch(`${API_BASE_URL}/api/documentos`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!res.ok) throw new Error("Error al cargar documentos")
          const allDocs = await res.json()
          // Filtrar solo los de este prospecto
          const prospectoId = Number(studentId)
          const docsProspecto = allDocs
            .filter((d: any) => d.prospecto_id === prospectoId)
            .map((d: any) => d.tipo_documento)
          setDocumentos(docsProspecto)
        } catch (err) {
          console.error("Error cargando documentos:", err)
        }
      })()
  }, [studentId])

  // 4) Inicializar canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.lineCap = "round"

    // Hacer el canvas responsive al contenedor
    const container = canvasContainerRef.current
    if (container) {
      const w = Math.min(container.clientWidth - 16, 500)
      canvas.width = w
      canvas.height = Math.round(w * 0.5)
      // Reinicializar contexto después de cambiar tamaño
      ctx.strokeStyle = "#000"
      ctx.lineWidth = 2
      ctx.lineCap = "round"
    }
  }, [signatureMode])

  // 4.5) Cargar firmas guardadas
  useEffect(() => {
    ; (async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_BASE_URL}/api/firmas-guardadas`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        })
        if (res.ok) {
          const data: FirmaGuardada[] = await res.json()
          setFirmasGuardadas(data)
          // Si hay una firma predeterminada, usarla por defecto
          const defaultFirma = data.find(f => f.es_predeterminada)
          if (defaultFirma) {
            setSignatureMode("saved")
            setSignature(defaultFirma.imagen_base64)
          }
        }
      } catch (err) {
        console.error("Error cargando firmas guardadas:", err)
      }
    })()
  }, [])

  // Helpers para guardar/cargar firmas
  const handleSaveSignature = async () => {
    if (!signature || !signatureName.trim()) return
    setSavingSignature(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/api/firmas-guardadas`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ nombre: signatureName, imagen_base64: signature }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Error al guardar")
      }
      const { data } = await res.json()
      setFirmasGuardadas(prev => [...prev, data])
      setSignatureName("")
      Swal.fire({ icon: "success", title: "Firma guardada", text: "Puede usarla en futuros contratos.", timer: 2000, showConfirmButton: false })
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Error", text: err.message })
    } finally {
      setSavingSignature(false)
    }
  }

  const handleDeleteSavedSignature = async (firmaId: number) => {
    const result = await Swal.fire({ title: "¿Eliminar firma?", icon: "warning", showCancelButton: true, confirmButtonText: "Eliminar", cancelButtonText: "Cancelar" })
    if (!result.isConfirmed) return
    try {
      const token = localStorage.getItem("token")
      await fetch(`${API_BASE_URL}/api/firmas-guardadas/${firmaId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      setFirmasGuardadas(prev => prev.filter(f => f.id !== firmaId))
      if (signature) {
        const deleted = firmasGuardadas.find(f => f.id === firmaId)
        if (deleted && deleted.imagen_base64 === signature) setSignature(null)
      }
    } catch (err) {
      console.error("Error eliminando firma:", err)
    }
  }

  const handleSetDefaultSignature = async (firmaId: number) => {
    try {
      const token = localStorage.getItem("token")
      await fetch(`${API_BASE_URL}/api/firmas-guardadas/${firmaId}/default`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      })
      setFirmasGuardadas(prev => prev.map(f => ({ ...f, es_predeterminada: f.id === firmaId })))
    } catch (err) {
      console.error("Error:", err)
    }
  }

  const handleUploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      Swal.fire({ icon: "error", title: "Archivo inválido", text: "Solo se permiten imágenes (PNG, JPG)." })
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setSignature(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // 5) Handlers de dibujo (mouse + touch)
  const getCanvasCoords = (canvas: HTMLCanvasElement, clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    setIsDrawing(true)
    const { x, y } = getCanvasCoords(canvas, e.clientX, e.clientY)
    setLastX(x)
    setLastY(y)
    const ctx = canvas.getContext("2d")
    ctx?.beginPath()
    ctx?.moveTo(x, y)
    ctx?.lineTo(x, y)
    ctx?.stroke()
  }
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    const { x, y } = getCanvasCoords(canvas, e.clientX, e.clientY)
    ctx.beginPath()
    ctx.moveTo(lastX, lastY)
    ctx.lineTo(x, y)
    ctx.stroke()
    setLastX(x)
    setLastY(y)
  }

  // Touch handlers
  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const touch = e.touches[0]
    setIsDrawing(true)
    const { x, y } = getCanvasCoords(canvas, touch.clientX, touch.clientY)
    setLastX(x)
    setLastY(y)
    const ctx = canvas.getContext("2d")
    ctx?.beginPath()
    ctx?.moveTo(x, y)
    ctx?.lineTo(x, y)
    ctx?.stroke()
  }
  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    const touch = e.touches[0]
    const { x, y } = getCanvasCoords(canvas, touch.clientX, touch.clientY)
    ctx.beginPath()
    ctx.moveTo(lastX, lastY)
    ctx.lineTo(x, y)
    ctx.stroke()
    setLastX(x)
    setLastY(y)
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas) setSignature(canvas.toDataURL())
  }
  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setSignature(null)
    }
  }

  // 6) Zoom handlers
  const increaseZoom = () => zoomLevel < 200 && setZoomLevel(z => z + 10)
  const decreaseZoom = () => zoomLevel > 50 && setZoomLevel(z => z - 10)
  const resetZoom = () => setZoomLevel(100)

  // 7) Envío del contrato
  const handleSendContract = () => {
    if (!signature) {
      Swal.fire({
        icon: "warning",
        title: "Firma requerida",
        text: "Por favor, firme el contrato antes de enviarlo.",
      })
      return
    }

    // Validar documentos mínimos requeridos
    const docsRequeridos = ["dpi", "recibo", "american", "inscripcion"]
    const docsFaltantes = docsRequeridos.filter(doc => !documentos.includes(doc))

    if (docsFaltantes.length > 0) {
      const listaFaltantes = docsFaltantes.map(d => d.toUpperCase()).join(", ")
      Swal.fire({
        icon: "error",
        title: "Documentos incompletos",
        html: `<p>No se puede enviar el contrato porque faltan los siguientes documentos:</p><p class="font-bold text-red-600">${listaFaltantes}</p><p class="mt-2">Por favor, asegúrese de que el prospecto haya cargado todos los documentos requeridos.</p>`,
        confirmButtonText: "Entendido",
      })
      return
    }

    if (!currentUser?.email) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo obtener el correo del usuario.",
      })
      return
    }
    setShowConfirmDialog(true)
  }
  const confirmSendContract = async () => {
    setShowConfirmDialog(false)
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem("token")

      // 1. Guardar firma del asesor y obtener token
      const firmaRes = await fetch(
        `${API_BASE_URL}/api/contratos/firma-asesor`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            prospecto_id: studentId,
            firma_asesor: signature,
            datos_contrato: {
              prospecto: student?.name,
              email: student?.email, // ✅ Email del prospecto (estudiante)
              email_asesor: currentUser?.email, // ✅ Email del asesor
              dpi: student?.dpi || "No proporcionado", // ✅ Incluir DPI
              programa: programa?.programa.nombre_del_programa,
              programa_abreviatura: programa?.programa.abreviatura,
              matricula: programa?.inscripcion,
              mensualidad: programa?.cuota_mensual,
              convenio_id: programa?.convenio_id,
              asesor: currentUser
                ? `${currentUser.first_name} ${currentUser.last_name}`
                : "",
              fecha: formattedDate,
            },
          }),
        }
      )

      if (!firmaRes.ok) {
        const text = await firmaRes.text()
        throw new Error(text || firmaRes.statusText)
      }

      const firmaData = await firmaRes.json()
      const urlFirmaEstudiante = firmaData.url_firma_estudiante
      const tokenFirma = firmaData.token // ✅ Obtener el token

      // 2. Enviar contrato por email con el link para que el estudiante firme
      const res = await fetch(
        `${API_BASE_URL}/api/prospectos/${studentId}/enviar-contrato`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            signature,
            email: currentUser?.email || student?.email,
            prospecto: student?.name,
            programa: programa?.programa.nombre_del_programa,
            matricula: programa?.inscripcion,
            mensualidad: programa?.cuota_mensual,
            asesor: currentUser
              ? `${currentUser.first_name} ${currentUser.last_name}`
              : "",
            fecha: formattedDate,
            url_firma_estudiante: urlFirmaEstudiante, // Link para firma del estudiante
            token_firma: tokenFirma, // ✅ Enviar el token para recuperar datos del asesor
          }),
        }
      )

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || res.statusText)
      }

      await res.json()

      // Mostrar modal de éxito con el link
      await Swal.fire({
        icon: 'success',
        title: '¡Contrato enviado!',
        html: `
          <p>El contrato ha sido firmado por el asesor y enviado al estudiante.</p>
          <div class="mt-3 p-3 bg-blue-50 rounded text-sm">
            <p class="font-semibold mb-2">Link de firma para el estudiante:</p>
            <input 
              type="text" 
              value="${urlFirmaEstudiante}" 
              readonly 
              class="w-full p-2 border rounded text-xs"
              onclick="this.select()"
            />
          </div>
        `,
        confirmButtonText: 'Aceptar',
      })

      setShowSuccessDialog(true)
    } catch (err: any) {
      // Manejar errores generales
      setError(err.message || "Error desconocido")
      Swal.fire({
        icon: "error",
        title: "Error al enviar contrato",
        text: err.message || "Ocurrió un error al enviar el contrato.",
      })
    } finally {
      setLoading(false)
    }
  }

  // 8) Cerrar diálogo de éxito
  const handleSuccessClose = () => {
    setShowSuccessDialog(false)
    router.push("/firma")
  }

  // 8) Loading states
  if (!student || programas.length === 0 || !currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-12 w-12 text-gray-500" />
      </div>
    )
  }

  // 9) Render completo
  return (
    <div className="space-y-6">
      {/* Prospecto */}
      <p className="text-sm font-medium text-blue-600">
        ID Estudiante: {student.id}
      </p>
      <p className="text-lg font-semibold mb-4">{student.name}</p>
      <div className="mb-4 max-w-md">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input id="email" value={currentUser?.email || student.email} readOnly />
      </div>

      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Contrato de Confidencialidad</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={decreaseZoom}>
              <ZoomOut />
            </Button>
            <span>{zoomLevel}%</span>
            <Button variant="outline" size="icon" onClick={increaseZoom}>
              <ZoomIn />
            </Button>
            <Button variant="outline" size="icon" onClick={resetZoom}>
              <RotateCw />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="prose space-y-2" style={{ zoom: `${zoomLevel}%` }}>
            <p className="font-bold">
              CONTRATO DE CONFIDENCIALIDAD Y COMPROMISO DE ESTUDIANTE
            </p>
            <p>(Por favor firme ambas páginas en donde corresponde)</p>
            <p>
              En la ciudad de Guatemala, el día: {formattedDate}
            </p>
            <p>
              Yo: <strong>{student.name}</strong>{" "}
              {student.email && <span>({student.email})</span>} &nbsp;&nbsp;Firma:
              __________________________
            </p>
            <p>
              Me comprometo a mantener de manera estrictamente confidencial los
              precios corporativos otorgados por Gaia Business School para
              cursar mi programa de:
            </p>
            <p>
              <strong>
                {programa.programa.nombre_del_programa} ({programa.programa.abreviatura})
              </strong>
            </p>
            <p>
              Asimismo, entiendo y acepto que mi participación en el acto de
              graduación de dicho programa es obligatoria e indispensable.
            </p>

            {/* Datos económicos */}
            <p>
              Matrícula: Q{programa.inscripcion}
              <br />
              Mensualidad: Q{programa.cuota_mensual}
            </p>

            {/* Sección extra sólo si convenio_id y cuota_mensual existen */}
            {programa.convenio_id != null && programa.cuota_mensual != null && (
              <p>
                Asimismo, acepto que, en caso de divulgar este precio y las
                condiciones preferenciales relacionadas con la duración del programa,
                perderé automáticamente dicho beneficio y deberé asumir el pago de la
                cuota vigente correspondiente al tiempo establecido. Cabe destacar
                que el porcentaje de beca aplica únicamente si el pago se realiza
                mediante depósito o transferencia bancaria, y no se aplica con otros
                medios de pago. Si el pago se efectúa por otros medios distintos a
                los mencionados, la cuota se ajustará de la siguiente manera:
                <br />
                <strong>Mensualidad: Q{programa.cuota_mensual}</strong>
              </p>
            )}

            {/* Aquí continúa el resto del contrato */}
            <p>
              Deseo que el cobro de mi mensualidad sea de manera automática: (El
              cobro se realizará los primeros días de cada mes, aplicando el
              porcentaje de beca correspondiente).<br />
              Sí: ________
            </p>
            <p>
              Confirmo que he recibido toda la información necesaria sobre los
              requisitos académicos y administrativos para mi programa.
            </p>
            <p>
              Declaro que estoy plenamente informado(a) y de acuerdo con que mi día
              de estudio puede ser modificado durante el transcurso de la carrera,
              y que los cursos del área común pueden variar según la programación
              anual. Reconozco que, al inscribirme, me uniré a un canal de WhatsApp,
              cuya participación es obligatoria durante toda la duración de mi
              carrera, con el fin de mantenerme actualizado(a) sobre toda la
              información relevante.
            </p>
            <p>
              Asimismo, confirmo que estoy consciente de que, debido a la modalidad
              de estudio de mi programa, es indispensable tomar mis clases a través
              de una computadora con una conexión a internet estable, en un espacio
              adecuado, y con la cámara encendida en todo momento.
            </p>
            <p>
              Finalmente, autorizo a Gaia Business School a utilizar mis
              fotografías para fines de colaboración institucional en materiales
              impresos o digitales.
            </p>
            <p>
              Estoy plenamente informado(a) de que el plazo límite para la entrega
              de los documentos requeridos es durante el primer trimestre del
              programa. Entiendo que no cumplir con esta entrega dentro del
              período establecido representará un obstáculo para mi graduación y la
              emisión del título correspondiente.
            </p>
            <p>
              Reitero mi compromiso de no duplicar ni compartir materiales
              provenientes de la plataforma para fines distintos a la realización
              de los cursos. Está estrictamente prohibido replicar rúbricas, casos
              del CIC o cualquier material proporcionado por Harvard BP, ya que
              dichas acciones serán consideradas como plagio y estarán sujetas a
              las consecuencias correspondientes.
            </p>
            <p>
              En Gaia Business School, los estudiantes se comprometen a la
              excelencia académica desde el inicio de su programa. Se fomenta la
              búsqueda de altos promedios para obtener menciones honoríficas:<br />
              • Cum Laude: promedio de 96 puntos.<br />
              • Magna Cum Laude: promedio de 97 a 98 puntos.<br />
              • Summa Cum Laude: promedio de 99 a 100 puntos.
            </p>
            <p>
              Además, se espera que los estudiantes actúen con integridad y ética,
              siendo un ejemplo de dedicación e inspiración para sus compañeros.
            </p>
            <p>
              Asimismo, acepto que al realizar los pagos correspondientes a las
              mensualidades y gastos adicionales, me comprometo a enviar las boletas
              únicamente a las siguientes direcciones: contabilidad@gaia-edu.com
              o a los números de WhatsApp +502 4169-8467 o +502 4138-1907. Se
              exceptúa el pago de inscripción, el cual deberá ser remitido
              directamente al asesor educativo. Está prohibido enviar boletas a
              direcciones distintas a las mencionadas anteriormente.
            </p>
            <p>
              Con pleno entendimiento y aceptación de las condiciones aquí
              establecidas, firmo en señal de conformidad con este contrato.
            </p>
            <div className="grid grid-cols-2 gap-12 mt-16 mb-8 border-t pt-8">
              <div className="text-center">
                <div className="border-b border-black w-full max-w-[200px] mx-auto mb-2"></div>
                <p className="font-bold text-xs uppercase">{student.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Prospecto</p>
              </div>
              <div className="text-center">
                <div className="border-b border-black w-full max-w-[200px] mx-auto mb-2"></div>
                <p className="font-bold text-xs uppercase">
                  {currentUser.first_name} {currentUser.last_name}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Asesor Educativo</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Firma del Asesor */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Firma del Asesor</h4>

            {/* Selector de modo */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={signatureMode === "draw" ? "default" : "outline"}
                size="sm"
                onClick={() => { setSignatureMode("draw"); setSignature(null); clearSignature() }}
              >
                ✏️ Dibujar
              </Button>
              <Button
                variant={signatureMode === "saved" ? "default" : "outline"}
                size="sm"
                onClick={() => setSignatureMode("saved")}
                disabled={firmasGuardadas.length === 0}
              >
                <Star className="h-3 w-3 mr-1" /> Mis Firmas ({firmasGuardadas.length})
              </Button>
              <Button
                variant={signatureMode === "upload" ? "default" : "outline"}
                size="sm"
                onClick={() => setSignatureMode("upload")}
              >
                <Upload className="h-3 w-3 mr-1" /> Subir imagen
              </Button>
            </div>

            {/* Modo: Dibujar */}
            {signatureMode === "draw" && (
              <div className="border rounded-lg p-2" ref={canvasContainerRef}>
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={200}
                  className="border rounded cursor-crosshair bg-white w-full touch-none"
                  style={{ maxWidth: "500px" }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseOut={stopDrawing}
                  onTouchStart={startDrawingTouch}
                  onTouchMove={drawTouch}
                  onTouchEnd={stopDrawing}
                  onTouchCancel={stopDrawing}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={clearSignature}>
                    Limpiar Firma
                  </Button>
                  {signature && (
                    <div className="flex items-center gap-2 ml-auto">
                      <Input
                        placeholder="Nombre de la firma..."
                        value={signatureName}
                        onChange={(e) => setSignatureName(e.target.value)}
                        className="h-8 w-40 text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveSignature}
                        disabled={savingSignature || !signatureName.trim()}
                      >
                        <Save className="h-3 w-3 mr-1" />
                        {savingSignature ? "Guardando..." : "Guardar"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modo: Firmas guardadas */}
            {signatureMode === "saved" && (
              <div className="space-y-2">
                {firmasGuardadas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tiene firmas guardadas. Dibuje una y guárdela.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {firmasGuardadas.map((f) => (
                      <div
                        key={f.id}
                        className={`border rounded-lg p-2 cursor-pointer transition-all ${signature === f.imagen_base64 ? "border-primary ring-2 ring-primary/30" : "hover:border-muted-foreground"
                          }`}
                        onClick={() => setSignature(f.imagen_base64)}
                      >
                        <img src={f.imagen_base64} alt={f.nombre} className="w-full h-24 object-contain bg-white rounded" />
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-medium truncate">
                            {f.es_predeterminada && <Star className="h-3 w-3 inline mr-1 text-yellow-500" />}
                            {f.nombre}
                          </span>
                          <div className="flex gap-1">
                            {!f.es_predeterminada && (
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); handleSetDefaultSignature(f.id) }} title="Predeterminada">
                                <Star className="h-3 w-3" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteSavedSignature(f.id) }} title="Eliminar">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Modo: Subir imagen */}
            {signatureMode === "upload" && (
              <div className="border rounded-lg p-4 space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleUploadSignature}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  {signature ? (
                    <img src={signature} alt="Firma subida" className="max-w-[400px] max-h-[200px] border rounded bg-white p-2" />
                  ) : (
                    <div
                      className="w-full max-w-[400px] h-[150px] border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="text-center text-muted-foreground">
                        <Upload className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Haga clic para seleccionar imagen de firma</p>
                        <p className="text-xs">PNG o JPG</p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-3 w-3 mr-1" /> {signature ? "Cambiar imagen" : "Seleccionar"}
                    </Button>
                    {signature && (
                      <Button variant="outline" size="sm" onClick={() => setSignature(null)} className="text-red-500">
                        Eliminar
                      </Button>
                    )}
                  </div>
                  {/* Opción de guardar la imagen subida */}
                  {signature && (
                    <div className="flex items-center gap-2 w-full max-w-sm">
                      <Input
                        placeholder="Nombre para guardar..."
                        value={signatureName}
                        onChange={(e) => setSignatureName(e.target.value)}
                        className="h-8 text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveSignature}
                        disabled={savingSignature || !signatureName.trim()}
                      >
                        <Save className="h-3 w-3 mr-1" /> Guardar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Button
            className="w-full flex justify-center items-center"
            onClick={handleSendContract}
            disabled={!signature || loading}
          >
            {loading
              ? <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Enviando...
              </>
              : "Enviar Contrato"
            }
          </Button>
          {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
        </CardContent>
      </Card>

      {/* Confirmación */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar envío</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Desea enviar este contrato firmado? No podrá deshacerlo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSendContract}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Éxito */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-center">
            <div className="mb-2">
              <CheckCircle className="h-10 w-10 text-green-600 mx-auto" />
            </div>
            <AlertDialogTitle>¡Enviado con éxito!</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-center">
            <AlertDialogAction onClick={handleSuccessClose}>
              Aceptar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
