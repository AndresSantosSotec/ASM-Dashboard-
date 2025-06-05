"use client"

import React, { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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
import { CheckCircle, ZoomIn, ZoomOut, RotateCw, Loader2 } from "lucide-react"
import Swal from 'sweetalert2'
import { API_BASE_URL } from '@/utils/apiConfig'

interface Student {
  id: string
  name: string
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

  // Alias al primer programa (si existe)
  const programa = programas[0]

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
            name: json.data.nombre_completo,
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
      } catch (err) {
        console.error(err)
      }
    })()
  }, [])

  // 4) Inicializar canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
  }, [])

  // 5) Handlers de dibujo
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    setIsDrawing(true)
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
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
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
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
      alert("Por favor, firme el contrato antes de enviarlo.")
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
      const res = await fetch(
        `${API_BASE_URL}/api/prospectos/${studentId}/enviar-contrato`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ signature }),
        }
      )
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || res.statusText)
      }
      await res.json()
      setShowSuccessDialog(true)
    } catch (err: any) {
      // Si ya se envió hoy, código 23505 en PG => uniq violation
      if (err.message.includes("ux_contactos_env_prosp_canal_dia")) {
        Swal.fire({
          icon: "warning",
          title: "Contrato ya enviado",
          text: "Este prospecto ya recibió el contrato hoy.",
        })
      } else {
        setError(err.message || "Error desconocido")
      }
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
              En la ciudad de Guatemala, el día:{" "}
              {new Date().toLocaleDateString("es-GT", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p>
              Yo: <strong>{student.name}</strong> &nbsp;&nbsp;Firma: __________________________
            </p>
            <p>
              Me comprometo a mantener de manera estrictamente confidencial los
              precios corporativos otorgados por American School of Management para
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
            <p>
              Firma: ____________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              Firma: ____________________<br />
              {student.name} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {currentUser.first_name}{" "}
              {currentUser.last_name}
              <br />
              Prospecto &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Asesor Educativo
            </p>
          </div>

          <Separator />

          {/* Firma del Asesor */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Firma del Asesor</h4>
            <div className="border rounded-lg p-2">
              <canvas
                ref={canvasRef}
                width={400}
                height={200}
                className="border rounded cursor-crosshair bg-white"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
              />
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={clearSignature}>
                  Limpiar Firma
                </Button>
              </div>
            </div>
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
