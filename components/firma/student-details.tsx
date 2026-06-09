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
import { CheckCircle, ZoomIn, ZoomOut, RotateCw, Loader2, Upload, Save, Trash2, Star, AlertCircle } from "lucide-react"
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
  duracion_meses: number             // meses reales del estudiante (no el catálogo)
  created_at: string                 // fecha de inscripción (para detectar reinscripción)
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

/** Ignora respuestas de fetch canceladas al desmontar el componente o cambiar de ruta. */
function isStaleRequestError(err: unknown, cancelled: boolean): boolean {
  if (cancelled) return true
  const isAbort =
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error && err.name === "AbortError")
  // AbortError sin timeout = cancelación normal (navegación / Strict Mode)
  return isAbort
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
  const [prospectStatus, setProspectStatus] = useState<string | null>(null)
  const [moneda, setMoneda] = useState<"GTQ" | "USD">("GTQ")
  const [cursosAprobados, setCursosAprobados] = useState<number | null>(null)
  const TASA_CAMBIO = 8

  // Estado de carga de los 3 fetches críticos (prospecto, programas, usuario)
  // Si alguno falla o tarda más de 20s, mostramos error con botón de Reintentar
  // en lugar de un spinner infinito.
  const [studentLoadState, setStudentLoadState] = useState<"loading" | "ok" | "error">("loading")
  const [programasLoadState, setProgramasLoadState] = useState<"loading" | "ok" | "error">("loading")
  const [userLoadState, setUserLoadState] = useState<"loading" | "ok" | "error">("loading")
  const [loadError, setLoadError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const handleRetryLoad = () => {
    setLoadError(null)
    setStudentLoadState("loading")
    setProgramasLoadState("loading")
    setUserLoadState("loading")
    setRetryKey((k) => k + 1)
  }

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

  // ——— Detectar tipo de inscripción por diferencia de fechas de creación ———
  // created_at = fecha en que se inscribió al programa (NO fecha_inicio del programa)
  // ≤30 días entre inscripciones = DOBLE / TRIPLE TITULACIÓN
  // >30 días = REINSCRIPCIÓN → mostrar solo el programa más reciente
  const programasOrdenados = [...programas].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  const primerProgramaFecha = programasOrdenados[0]
  const ultimoProgramaFecha = programasOrdenados[programasOrdenados.length - 1]
  const diasDiferenciaInscripcion = programas.length > 1
    ? Math.round(
        Math.abs(
          (new Date(ultimoProgramaFecha.created_at).getTime() - new Date(primerProgramaFecha.created_at).getTime())
          / (1000 * 60 * 60 * 24)
        )
      )
    : 0
  const esReinscripcion = programas.length > 1 && diasDiferenciaInscripcion > 30
  // Para reinscripción: solo el programa más reciente; para doble/triple: todos ordenados
  const programasAMostrar = esReinscripcion ? [ultimoProgramaFecha] : programasOrdenados
  // Programa financiero: el relevante para matrícula/mensualidad en la vista previa
  const programaFinanciero = programasAMostrar[0] ?? programa
  // ————————————————————————————————————————

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
    const controller = new AbortController()
    let cancelled = false
    let timedOut = false
    const timeoutId = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, 20000)
    ;(async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(
          `${API_BASE_URL}/api/prospectos/${studentId}`,
          { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
        )
        if (cancelled) return
        if (!res.ok) throw new Error(`HTTP ${res.status} al cargar prospecto`)
        const json = await res.json()
        const data = json?.data
        if (!data) throw new Error("Respuesta inválida del prospecto")
        setStudent({
          id: String(data.id),
          name: data.nombre_completo || "Sin nombre",
          email:
            data.correo_electronico ||
            data.correo ||
            data.email ||
            "",
          dpi: data.numero_identificacion || "",
        })
        setProspectStatus(data.status ?? null)
        if (data.moneda === "USD") setMoneda("USD")
        const cursos = data.cantidad_cursos_aprobados
        setCursosAprobados(
          cursos !== null && cursos !== undefined && String(cursos).trim() !== ""
            ? Number(cursos)
            : null
        )
        setStudentLoadState("ok")
      } catch (err: unknown) {
        if (isStaleRequestError(err, cancelled)) {
          if (timedOut && !cancelled) {
            setStudentLoadState("error")
            setLoadError((prev) => prev ?? "La carga del prospecto tardó demasiado.")
          }
          return
        }
        console.error("Error cargando prospecto:", err)
        setStudentLoadState("error")
        setLoadError((prev) => prev ?? `No se pudo cargar el prospecto: ${err instanceof Error ? err.message : "error desconocido"}`)
      } finally {
        clearTimeout(timeoutId)
      }
    })()
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [studentId, retryKey])

  // 2) Traer programas del prospecto
  useEffect(() => {
    if (!studentId) return
    const controller = new AbortController()
    let cancelled = false
    let timedOut = false
    const timeoutId = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, 20000)
    ;(async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(
          `${API_BASE_URL}/api/estudiante-programa?prospecto_id=${studentId}`,
          { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
        )
        if (cancelled) return
        if (!res.ok) throw new Error(`HTTP ${res.status} al cargar programas`)
        const data: ProgramaItem[] = await res.json()
        setProgramas(Array.isArray(data) ? data : [])
        setProgramasLoadState("ok")
      } catch (err: unknown) {
        if (isStaleRequestError(err, cancelled)) {
          if (timedOut && !cancelled) {
            setProgramasLoadState("error")
            setLoadError((prev) => prev ?? "La carga de programas tardó demasiado.")
          }
          return
        }
        console.error("Error cargando programas:", err)
        setProgramasLoadState("error")
        setLoadError((prev) => prev ?? `No se pudieron cargar los programas: ${err instanceof Error ? err.message : "error desconocido"}`)
      } finally {
        clearTimeout(timeoutId)
      }
    })()
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [studentId, retryKey])

  // 3) Traer usuario autenticado
  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false
    let timedOut = false
    const timeoutId = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, 20000)
    ;(async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_BASE_URL}/api/user`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          signal: controller.signal,
        })
        if (cancelled) return
        if (!res.ok) throw new Error(`HTTP ${res.status} al cargar usuario`)
        const user: User = await res.json()
        if (!user || typeof user !== "object") throw new Error("Respuesta inválida del usuario")
        setCurrentUser(user)
        setStudent((prev) =>
          prev ? { ...prev, email: prev.email || user.email } : prev
        )
        setUserLoadState("ok")
      } catch (err: unknown) {
        if (isStaleRequestError(err, cancelled)) {
          if (timedOut && !cancelled) {
            setUserLoadState("error")
            setLoadError((prev) => prev ?? "La carga del usuario tardó demasiado.")
          }
          return
        }
        console.error("Error cargando usuario:", err)
        setUserLoadState("error")
        setLoadError((prev) => prev ?? `No se pudo cargar el usuario: ${err instanceof Error ? err.message : "error desconocido"}`)
      } finally {
        clearTimeout(timeoutId)
      }
    })()
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [retryKey])

  // 3.5) Traer documentos del prospecto
  useEffect(() => {
    if (!studentId) return
    const controller = new AbortController()
    let cancelled = false
    ;(async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_BASE_URL}/api/documentos`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        if (cancelled) return
        if (!res.ok) throw new Error("Error al cargar documentos")
        const allDocs = await res.json()
        const prospectoId = Number(studentId)
        const docsProspecto = allDocs
          .filter((d: any) => d.prospecto_id === prospectoId)
          .map((d: any) => d.tipo_documento)
        setDocumentos(docsProspecto)
      } catch (err) {
        if (isStaleRequestError(err, cancelled)) return
        console.error("Error cargando documentos:", err)
      }
    })()
    return () => {
      cancelled = true
      controller.abort()
    }
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
  const handleSendContract = async () => {
    if (!signature) {
      Swal.fire({
        icon: "warning",
        title: "Firma requerida",
        text: "Por favor, firme el contrato antes de enviarlo.",
      })
      return
    }

    // Validar documentos mínimos requeridos (salvo prospectos en Alerta Alumno Nuevo)
    const docsRequeridos = ["dpi", "recibo", "american", "inscripcion"]
    const docsFaltantes = docsRequeridos.filter(doc => !documentos.includes(doc))
    const esAlertaAlumnoNuevo = prospectStatus != null && /alerta\s*alumno\s*nuevo/i.test(prospectStatus)

    if (docsFaltantes.length > 0) {
      const listaFaltantes = docsFaltantes.map(d => d.toUpperCase()).join(", ")
      if (esAlertaAlumnoNuevo) {
        const result = await Swal.fire({
          icon: "warning",
          title: "Documentos básicos faltantes",
          html: `<p>Faltan los siguientes documentos: <strong class="text-amber-600">${listaFaltantes}</strong>.</p><p class="mt-2">Este prospecto está en <strong>Alerta Alumno Nuevo</strong>. Puede enviar el contrato igual; los documentos deberán completarse desde admisión.</p><p class="mt-2">¿Desea enviar el contrato?</p>`,
          showCancelButton: true,
          confirmButtonText: "Sí, enviar contrato",
          cancelButtonText: "Cancelar",
          confirmButtonColor: "#059669",
        })
        if (!result.isConfirmed) return
      } else {
        Swal.fire({
          icon: "error",
          title: "Documentos incompletos",
          html: `<p>No se puede enviar el contrato porque faltan los siguientes documentos:</p><p class="font-bold text-red-600">${listaFaltantes}</p><p class="mt-2">Por favor, asegúrese de que el prospecto haya cargado todos los documentos requeridos.</p>`,
          confirmButtonText: "Entendido",
        })
        return
      }
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
              programa: programaFinanciero?.programa.nombre_del_programa,
              programa_abreviatura: programaFinanciero?.programa.abreviatura,
              matricula: programaFinanciero?.inscripcion,
              mensualidad: programaFinanciero?.cuota_mensual,
              convenio_id: programaFinanciero?.convenio_id,
              asesor: currentUser
                ? `${currentUser.first_name} ${currentUser.last_name}`
                : "",
              fecha: formattedDate,
              cantidad_cursos_aprobados: cursosAprobados,
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
            email: student?.email || currentUser?.email,
            prospecto: student?.name,
            programa: programaFinanciero?.programa.nombre_del_programa,
            matricula: programaFinanciero?.inscripcion,
            mensualidad: programaFinanciero?.cuota_mensual,
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

  // 8) Loading / Error states (evita spinner infinito)
  const anyError =
    studentLoadState === "error" ||
    programasLoadState === "error" ||
    userLoadState === "error"
  const allLoaded =
    studentLoadState === "ok" &&
    programasLoadState === "ok" &&
    userLoadState === "ok"

  if (anyError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 p-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-sm text-red-700 text-center max-w-md">
          {loadError ?? "No se pudo cargar la información del estudiante."}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRetryLoad}>
            Reintentar
          </Button>
          <Button variant="ghost" onClick={() => router.push("/firma")}>
            Volver
          </Button>
        </div>
      </div>
    )
  }

  if (allLoaded && programas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 p-4">
        <AlertCircle className="h-12 w-12 text-amber-500" />
        <p className="text-sm text-amber-800 text-center max-w-md">
          Este prospecto no tiene programas asignados. No se puede generar el contrato hasta que se le asigne al menos un programa.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRetryLoad}>
            Reintentar
          </Button>
          <Button variant="ghost" onClick={() => router.push("/firma")}>
            Volver
          </Button>
        </div>
      </div>
    )
  }

  if (!student || programas.length === 0 || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="animate-spin h-12 w-12 text-gray-500" />
        <p className="text-sm text-muted-foreground">Cargando información del estudiante…</p>
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
        <Input id="email" value={student.email} readOnly />
      </div>

      {/* Información académica: detecta reinscripción vs doble/triple titulación por fecha de creación */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información académica</CardTitle>
        </CardHeader>
        <CardContent>
          {esReinscripcion && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mb-2">
              🔄 <strong>Reinscripción detectada</strong> ({diasDiferenciaInscripcion} días entre inscripciones) — mostrando solo el programa más reciente.
            </p>
          )}
          {programasAMostrar.length > 1 ? (
            <>
              <p className="text-sm font-semibold text-slate-700 mb-2">
                {programasAMostrar.length === 2
                  ? "Doble titulación (2 carreras)"
                  : programasAMostrar.length === 3
                    ? "Triple titulación (3 carreras)"
                    : `Varias carreras (${programasAMostrar.length})`}
                {" · "}
                Total: {programasAMostrar.reduce((s, p) => s + (p.duracion_meses ?? p.programa?.meses ?? 0), 0)} meses
              </p>
              <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                {programasAMostrar.map((p, idx) => (
                  <li key={idx}>
                    {p.programa.abreviatura} – {p.programa.nombre_del_programa} ({p.duracion_meses ?? p.programa.meses} meses)
                  </li>
                ))}
              </ul>
            </>
          ) : (
            programaFinanciero && (
              <p className="text-sm text-slate-600">
                <span className="font-medium">Programa:</span> {programaFinanciero.programa.abreviatura} – {programaFinanciero.programa.nombre_del_programa}
                {" · "}
                <span className="font-medium">Duración:</span> {programaFinanciero.duracion_meses ?? programaFinanciero.programa.meses} meses
                {cursosAprobados != null && (
                  <>
                    {" · "}
                    <span className="font-medium">Cursos aprobados:</span> {cursosAprobados}
                  </>
                )}
              </p>
            )
          )}
        </CardContent>
      </Card>

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
              precios corporativos otorgados por American School of Management para
              {programasAMostrar.length > 1 ? " cursar mis programas:" : " cursar mi programa de:"}
            </p>
            <p>
              {programasAMostrar.length > 1 ? (
                <strong>
                  {programasAMostrar.map((p, i) => (
                    <span key={i}>
                      {i > 0 && " · "}
                      {p.programa.abreviatura} – {p.programa.nombre_del_programa} ({p.duracion_meses ?? p.programa.meses} meses)
                    </span>
                  ))}
                </strong>
              ) : (
                <strong>
                  {programaFinanciero.programa.nombre_del_programa} ({programaFinanciero.programa.abreviatura})
                </strong>
              )}
            </p>
            <p>
              Asimismo, entiendo y acepto que mi participación en el acto de
              graduación {programasAMostrar.length > 1 ? "de dichos programas" : "de dicho programa"} es obligatoria e indispensable.
            </p>

            {/* Datos económicos */}
            {moneda === "USD" && (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1 mb-1">
                💱 Moneda: <strong>Dólares Americanos (USD)</strong> · Tipo de cambio: Q{TASA_CAMBIO}.00 = $1.00 USD
              </p>
            )}
            <p>
              Matrícula:{" "}
              {moneda === "USD" ? (
                <><strong>${(parseFloat(String(programaFinanciero.inscripcion)) / TASA_CAMBIO).toFixed(2)} USD</strong>{" "}<span className="text-gray-500 text-sm">(Q{programaFinanciero.inscripcion})</span></>
              ) : (
                <>Q{programaFinanciero.inscripcion}</>
              )}
              <br />
              Mensualidad:{" "}
              {moneda === "USD" && programaFinanciero.cuota_mensual ? (
                <><strong>${(parseFloat(String(programaFinanciero.cuota_mensual)) / TASA_CAMBIO).toFixed(2)} USD</strong>{" "}<span className="text-gray-500 text-sm">(Q{programaFinanciero.cuota_mensual})</span></>
              ) : (
                <>Q{programaFinanciero.cuota_mensual}</>
              )}
            </p>

            {/* Sección extra sólo si convenio_id y cuota_mensual existen */}
            {programaFinanciero.convenio_id != null && programaFinanciero.cuota_mensual != null && (
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
                {moneda === "USD" ? (
                  <strong>Mensualidad: ${(parseFloat(String(programaFinanciero.cuota_mensual)) / TASA_CAMBIO).toFixed(2)} USD <span className="text-gray-500 font-normal text-sm">(Q{programaFinanciero.cuota_mensual})</span></strong>
                ) : (
                  <strong>Mensualidad: Q{programaFinanciero.cuota_mensual}</strong>
                )}
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
              Confirmo que tengo:<br />
              {cursosAprobados != null && (
                <>
                  — {cursosAprobados} {cursosAprobados === 1 ? "curso aprobado" : "cursos aprobados"}.<br />
                </>
              )}
              — Declaración de estar plenamente informado(a) y de acuerdo con que mi día
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
              Finalmente, autorizo a American School of Management a utilizar mis
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
              En American School of Management, los estudiantes se comprometen a la
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
              únicamente a las siguientes direcciones: contabilidad@american-edu.com
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
