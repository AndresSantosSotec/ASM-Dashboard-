"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, CheckCircle } from "lucide-react"
import { API_BASE_URL } from "@/utils/apiConfig"
import Swal from "sweetalert2"

interface ContratoVistaModalProps {
  isOpen: boolean
  onClose: () => void
  contratoId: number
}

interface ContratoData {
  datos_contrato: {
    nombre_completo: string
    dpi: string
    telefono: string
    correo: string
    programa: string
  }
  firma_asesor: string | null
  firma_estudiante: string | null
  fecha_firma_estudiante: string
  estado_firma: string
  prospecto: {
    nombre_completo: string
    telefono: string
    correo_electronico: string
    programas?: Array<{
      programa: {
        nombre_del_programa: string
        abreviatura: string
      }
      convenio?: {
        nombre_convenio: string
      }
      inscripcion: number
      cuota_mensual: number
    }>
  }
}

export default function ContratoVistaModal({
  isOpen,
  onClose,
  contratoId,
}: ContratoVistaModalProps) {
  const [loading, setLoading] = useState(true)
  const [contrato, setContrato] = useState<ContratoData | null>(null)

  useEffect(() => {
    if (isOpen && contratoId) {
      fetchContrato()
    }
  }, [isOpen, contratoId])

  const fetchContrato = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/api/contactos-enviados/${contratoId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })

      if (!response.ok) throw new Error("Error al cargar el contrato")

      const data = await response.json()
      
      console.log("=== DATOS RECIBIDOS DEL API ===", data)
      console.log("datos_contrato:", data.datos_contrato)
      console.log("firma_asesor:", data.firma_asesor?.substring(0, 50) + '...')
      console.log("firma_estudiante:", data.firma_estudiante?.substring(0, 50) + '...')
      console.log("prospecto:", data.prospecto)
      console.log("programas:", data.prospecto?.programas)
      
      // datos_contrato ya viene como objeto por el cast del modelo
      // No necesita parsing
      
      setContrato(data)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Vista Previa del Contrato de Confidencialidad
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : contrato ? (
          <div className="space-y-6">
            {/* Estado del contrato */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Estado del contrato</p>
                <div className="flex items-center gap-2 mt-1">
                  {contrato.estado_firma === "firmado_completo" ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <Badge className="bg-green-100 text-green-800">Completado</Badge>
                    </>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800">Pendiente Firma Estudiante</Badge>
                  )}
                </div>
              </div>
              {contrato.fecha_firma_estudiante && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Firmado el</p>
                  <p className="text-sm font-medium">{new Date(contrato.fecha_firma_estudiante).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {/* Información del estudiante */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-lg mb-3">Información del Estudiante</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Nombre:</span>
                  <p className="font-medium">{contrato.datos_contrato?.nombre_completo || contrato.prospecto?.nombre_completo}</p>
                </div>
                <div>
                  <span className="text-gray-600">DPI:</span>
                  <p className="font-medium">{contrato.datos_contrato?.dpi || "No proporcionado"}</p>
                </div>
                <div>
                  <span className="text-gray-600">Teléfono:</span>
                  <p className="font-medium">{contrato.datos_contrato?.telefono || contrato.prospecto?.telefono || "No proporcionado"}</p>
                </div>
                <div>
                  <span className="text-gray-600">Correo:</span>
                  <p className="font-medium">{contrato.datos_contrato?.correo || contrato.prospecto?.correo_electronico || "No proporcionado"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Programa:</span>
                  <p className="font-medium">{contrato.datos_contrato?.programa || "No especificado"}</p>
                </div>
                {contrato.prospecto?.programas && contrato.prospecto.programas.length > 0 && (
                  <>
                    <div>
                      <span className="text-gray-600">Inscripción:</span>
                      <p className="font-medium">Q{Number(contrato.prospecto.programas[0].inscripcion).toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Mensualidad:</span>
                      <p className="font-medium">Q{Number(contrato.prospecto.programas[0].cuota_mensual).toFixed(2)}</p>
                    </div>
                    {contrato.prospecto.programas[0].convenio && (
                      <div className="col-span-2">
                        <span className="text-gray-600">Convenio:</span>
                        <p className="font-medium">{contrato.prospecto.programas[0].convenio.nombre_convenio}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Contenido del contrato */}
            <div className="border rounded-lg p-6 bg-white">
              <h2 className="text-xl font-bold text-center mb-6">
                CONTRATO DE CONFIDENCIALIDAD Y COMPROMISO DE ESTUDIANTE
              </h2>
              <p className="text-center text-xs text-gray-500 mb-4">(Por favor firme ambas páginas en donde corresponde)</p>

              <div className="space-y-4 text-sm text-gray-700">
                <p>
                  En la ciudad de Guatemala, el día <strong>{new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                </p>

                <p>
                  Yo: <strong>{contrato.datos_contrato?.nombre_completo || contrato.prospecto?.nombre_completo}</strong> me comprometo a mantener
                  de manera estrictamente confidencial los precios corporativos otorgados por
                  Gaia Business School para cursar mi programa de:<br/>
                  <strong>{contrato.datos_contrato?.programa || 'N/A'}</strong>
                </p>

                <p>
                  Asimismo, entiendo y acepto que mi participación en el acto de graduación de
                  dicho programa es obligatoria e indispensable.
                </p>

                <p>
                  Deseo que el cobro de mi mensualidad sea de manera automática:<br/>
                  <em>(EL COBRO SERÁ EN LOS PRIMEROS DÍAS DEL MES, APLICANDO EL PORCENTAJE DE BECA)</em>
                </p>

                <p>
                  Confirmo que tengo:<br/>
                  — Declaración de estar plenamente informado(a) y de acuerdo con que mi día de
                  estudio puede ser modificado durante el transcurso de la carrera, y que
                  los cursos del área común pueden variar según la programación anual.
                  Reconozco que, al inscribirme, me uniré a un canal de WhatsApp, cuya
                  participación es obligatoria durante toda la duración de mi carrera, con
                  el fin de mantenerme actualizado(a) sobre toda la información relevante.
                </p>

                <p>
                  Asimismo, confirmo que estoy consciente de que, debido a la modalidad de
                  estudio de mi programa, es indispensable tomar mis clases a través de una
                  computadora con una conexión a internet estable, en un espacio adecuado, y
                  con la cámara encendida en todo momento.
                </p>

                <p>
                  Finalmente, autorizo a Gaia Business School a utilizar mis
                  fotografías para fines de colaboración institucional en materiales
                  impresos o digitales.
                </p>

                <p>
                  Estoy plenamente informado(a) de que el plazo límite para la entrega de los
                  documentos requeridos es durante el primer trimestre del programa. Entiendo
                  que no cumplir con esta entrega dentro del período establecido
                  representará un obstáculo para mi graduación y la emisión del título
                  correspondiente.
                </p>

                <p>
                  Reitero mi compromiso de no duplicar ni compartir materiales provenientes
                  de la plataforma para fines distintos a la realización de los cursos. Está
                  estrictamente prohibido replicar rúbricas, casos del CIC o cualquier
                  material proporcionado por Harvard BP, ya que dichas acciones serán
                  consideradas como plagio y estarán sujetas a las consecuencias
                  correspondientes.
                </p>

                <p>
                  En Gaia Business School, los estudiantes se comprometen a la
                  excelencia académica desde el inicio de su programa. Se fomenta la búsqueda
                  de altos promedios para obtener menciones honoríficas:
                </p>
                <ul className="list-disc pl-8">
                  <li>Cum Laude: promedio de 96 puntos.</li>
                  <li>Magna Cum Laude: promedio de 97 a 98 puntos.</li>
                  <li>Summa Cum Laude: promedio de 99 a 100 puntos.</li>
                </ul>
                <p>
                  Además, se espera que los estudiantes actúen con integridad y ética, siendo
                  un ejemplo de dedicación e inspiración para sus compañeros.
                </p>

                <p>
                  Asimismo, acepto que al realizar los pagos correspondientes a las
                  mensualidades y gastos adicionales, me comprometo a enviar las boletas
                  únicamente a las siguientes direcciones:
                  <strong> contabilidad@gaia-edu.com</strong> o a los números de WhatsApp
                  <strong> +502 4169-8467</strong> o <strong>+502 4138-1907</strong>. Se
                  exceptúa el pago de inscripción, el cual deberá ser remitido directamente
                  al asesor educativo. Está prohibido enviar boletas a direcciones distintas
                  a las mencionadas anteriormente.
                </p>

                <p>
                  Con pleno entendimiento y aceptación de las condiciones aquí establecidas,
                  firmo en señal de conformidad con este contrato.
                </p>
              </div>
            </div>

            {/* Firmas */}
            <div className="grid grid-cols-2 gap-6 mt-8">
              {/* Firma del Estudiante */}
              <div className="border rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Firma del Estudiante</p>
                {contrato.firma_estudiante ? (
                  <div className="border rounded bg-gray-50 p-2">
                    <img 
                      src={contrato.firma_estudiante} 
                      alt="Firma del estudiante" 
                      className="w-full h-32 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const parent = e.currentTarget.parentElement
                        if (parent) {
                          parent.innerHTML = '<div class="h-32 flex items-center justify-center text-red-500 text-sm">⚠️ Archivo de firma no encontrado</div>'
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="border rounded bg-gray-50 p-2 h-32 flex items-center justify-center text-gray-400">
                    Pendiente de firma
                  </div>
                )}
                <p className="text-xs text-center text-gray-600 mt-2">{contrato.datos_contrato?.nombre_completo || contrato.prospecto?.nombre_completo}</p>
              </div>

              {/* Firma del Asesor */}
              <div className="border rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Firma del Asesor</p>
                {contrato.firma_asesor ? (
                  <div className="border rounded bg-gray-50 p-2">
                    <img 
                      src={contrato.firma_asesor} 
                      alt="Firma del asesor" 
                      className="w-full h-32 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const parent = e.currentTarget.parentElement
                        if (parent) {
                          parent.innerHTML = '<div class="h-32 flex items-center justify-center text-red-500 text-sm">⚠️ Archivo de firma no encontrado</div>'
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="border rounded bg-gray-50 p-2 h-32 flex items-center justify-center text-gray-400">
                    Sin firma
                  </div>
                )}
                <p className="text-xs text-center text-gray-600 mt-2">Asesor Educativo</p>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    // Validar que tenga ambas firmas
                    if (!contrato.firma_asesor || !contrato.firma_estudiante) {
                      await Swal.fire({
                        icon: "warning",
                        title: "Contrato incompleto",
                        text: "El contrato debe estar firmado por el asesor y el estudiante para poder descargarlo.",
                      })
                      return
                    }

                    const token = localStorage.getItem("token")
                    const res = await fetch(`${API_BASE_URL}/api/contactos-enviados/${contratoId}/pdf`, {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    })
                    
                    if (!res.ok) throw new Error(`HTTP ${res.status}`)
                    
                    const blob = await res.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `contrato-firmado-${contratoId}.pdf`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                    
                    await Swal.fire({
                      icon: "success",
                      title: "Descarga exitosa",
                      text: "El contrato firmado se descargó correctamente",
                      timer: 2000,
                      showConfirmButton: false,
                    })
                  } catch (err) {
                    console.error("Error al descargar:", err)
                    await Swal.fire({
                      icon: "error",
                      title: "Error",
                      text: "No se pudo descargar el contrato",
                    })
                  }
                }}
                disabled={!contrato.firma_asesor || !contrato.firma_estudiante}
                className={contrato.firma_asesor && contrato.firma_estudiante ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
              >
                <FileText className="mr-2 h-4 w-4" />
                {contrato.firma_asesor && contrato.firma_estudiante 
                  ? "Descargar Contrato Firmado" 
                  : "Contrato sin firmas completas"}
              </Button>
              <Button onClick={onClose}>Cerrar</Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No se pudo cargar el contrato
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
