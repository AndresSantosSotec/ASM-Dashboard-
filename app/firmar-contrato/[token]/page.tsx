"use client"

import React, { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { API_BASE_URL } from '@/utils/apiConfig'

interface DatosContrato {
  prospecto: string
  email: string
  programa: string
  programa_abreviatura: string
  matricula: string
  mensualidad: string | null
  convenio_id: number | null
  asesor: string
  fecha: string
}

interface Contrato {
  id: number
  prospecto_id: number
  estado_firma: string
  fecha_envio: string
  datos_contrato: DatosContrato
  firma_asesor: string // Base64 de la imagen
}

export default function FirmarContratoPage() {
  const { token } = useParams()
  const router = useRouter()

  const [contrato, setContrato] = useState<Contrato | null>(null)
  const [prospecto, setProspecto] = useState<any>(null)
  const [signature, setSignature] = useState<string | null>(null)
  const [dpi, setDpi] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [yaFirmado, setYaFirmado] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastX, setLastX] = useState(0)
  const [lastY, setLastY] = useState(0)

  // Cargar contrato por token
  useEffect(() => {
    if (!token) return

    const cargarContrato = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/contratos/token/${token}`)
        const data = await res.json()

        if (!data.success) {
          if (data.firmado) {
            setYaFirmado(true)
          }
          setError(data.message)
          setLoading(false)
          return
        }

        setContrato(data.contrato)
        setProspecto(data.prospecto)
        setLoading(false)
      } catch (err) {
        setError("Error al cargar el contrato")
        setLoading(false)
      }
    }

    cargarContrato()
  }, [token])

  // Inicializar canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Aumentar grosor de línea en dispositivos móviles
    const isMobile = window.innerWidth < 768
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = isMobile ? 3 : 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
    
    const x = (clientX - rect.left) * scaleX
    const y = (clientY - rect.top) * scaleY

    setIsDrawing(true)
    setLastX(x)
    setLastY(y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    e.preventDefault()

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
    
    const x = (clientX - rect.left) * scaleX
    const y = (clientY - rect.top) * scaleY

    ctx.beginPath()
    ctx.moveTo(lastX, lastY)
    ctx.lineTo(x, y)
    ctx.stroke()

    setLastX(x)
    setLastY(y)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignature(null)
  }

  const saveSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dataUrl = canvas.toDataURL("image/png")
    setSignature(dataUrl)
  }

  const handleSubmit = async () => {
    if (!signature) {
      alert("Por favor, firme en el espacio designado")
      return
    }

    if (!dpi || dpi.length < 13) {
      alert("Por favor, ingrese su DPI completo (13 dígitos)")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE_URL}/api/contratos/firma-estudiante`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token_firma: token,
          firma_estudiante: signature,
          dpi: dpi,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.message || "Error al guardar la firma")
        setSubmitting(false)
        return
      }

      setShowSuccess(true)
    } catch (err) {
      setError("Error al procesar la firma")
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando contrato...</p>
        </div>
      </div>
    )
  }

  if (error || yaFirmado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {yaFirmado ? "Contrato ya firmado" : "Error"}
          </h3>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">¡Contrato Firmado Exitosamente!</h3>
          <p className="text-slate-600 mb-6">
            Su firma ha sido registrada correctamente. Recibirá una copia del contrato firmado por correo electrónico.
          </p>
          <p className="text-sm text-slate-500">Puede cerrar esta ventana.</p>
        </div>
      </div>
    )
  }

  if (!contrato || !prospecto) return null

  const datos = contrato.datos_contrato

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Profesional */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold mb-2">Contrato de Confidencialidad</h1>
          <p className="text-blue-100">Firma Digital de Documento Legal</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Información del Contrato */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-blue-900">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">Estudiante</p>
              <p className="font-semibold text-slate-900">{datos.prospecto}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Programa Académico</p>
              <p className="font-semibold text-slate-900">{datos.programa}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Correo Electrónico</p>
              <p className="font-semibold text-slate-900">{prospecto?.email || prospecto?.correo_electronico || "No proporcionado"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Fecha de Emisión</p>
              <p className="font-semibold text-slate-900">
                {datos.fecha || "No especificada"}
              </p>
            </div>
          </div>
        </div>

        {/* Contenido del Contrato */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-slate-200">
            CONTRATO DE CONFIDENCIALIDAD
          </h2>

          <div className="prose prose-slate max-w-none space-y-4 text-slate-700 leading-relaxed">
            <p className="font-bold text-center text-base text-slate-900">
              CONTRATO DE CONFIDENCIALIDAD Y COMPROMISO DE ESTUDIANTE
            </p>
            <p className="text-center italic text-sm">(Por favor firme en donde corresponde)</p>
            
            <p className="text-justify">
              En la ciudad de Guatemala, el día: <strong className="text-slate-900">{datos.fecha}</strong>
            </p>
            
            <p className="text-justify">
              Yo: <strong className="text-slate-900">{datos.prospecto}</strong> ({prospecto?.email || prospecto?.correo_electronico || datos.email})
            </p>

            <p className="text-justify">
              Me comprometo a mantener de manera estrictamente confidencial los
              precios corporativos otorgados por American School of Management para
              cursar mi programa de:
            </p>

            <p className="text-center font-bold text-base text-slate-900">
              {datos.programa} ({datos.programa_abreviatura})
            </p>

            <p className="text-justify">
              Asimismo, entiendo y acepto que mi participación en el acto de
              graduación de dicho programa es obligatoria e indispensable.
            </p>

            {datos.matricula && datos.mensualidad && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
                <p className="font-semibold text-blue-900 mb-2">Datos económicos:</p>
                <ul className="list-none space-y-1 text-slate-700">
                  <li>• Matrícula: <strong className="text-blue-900">Q{datos.matricula}</strong></li>
                  <li>• Cuota Mensual: <strong className="text-blue-900">Q{datos.mensualidad}</strong></li>
                </ul>
              </div>
            )}

            {datos.convenio_id != null && datos.mensualidad != null && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-4">
                <p className="text-justify text-amber-900">
                  Asimismo, acepto que, en caso de divulgar este precio y las
                  condiciones preferenciales relacionadas con la duración del programa,
                  perderé automáticamente dicho beneficio y deberé asumir el pago de la
                  cuota vigente correspondiente al tiempo establecido.
                </p>
              </div>
            )}

            <p className="text-justify">
              Deseo que el cobro de mi mensualidad sea de manera automática: (El
              cobro se realizará los primeros días de cada mes).<br />
              <strong>Sí:</strong> ________
            </p>

            <p className="text-justify">
              Confirmo que he recibido toda la información necesaria sobre los
              requisitos académicos y administrativos para mi programa.
            </p>

            <p className="text-justify">
              Declaro que estoy plenamente informado(a) y de acuerdo con que mi día
              de estudio puede ser modificado durante el transcurso de la carrera.
            </p>

            <p className="text-justify">
              Asimismo, confirmo que estoy consciente de que, debido a la modalidad
              de estudio de mi programa, es indispensable tomar mis clases a través
              de una computadora con conexión a internet estable.
            </p>

            <p className="text-justify">
              Finalmente, autorizo a American School of Management a utilizar mis
              fotografías para fines de colaboración institucional.
            </p>

            <p className="text-justify">
              Reitero mi compromiso de no duplicar ni compartir materiales
              provenientes de la plataforma para fines distintos a la realización
              de los cursos.
            </p>

            <p className="text-justify">
              Con pleno entendimiento y aceptación de las condiciones aquí
              establecidas, firmo en señal de conformidad con este contrato.
            </p>
          </div>

          {/* Firma del Asesor */}
          <div className="mt-8 pt-6 border-t-2 border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Firma del Asesor Educativo</h3>
            <div className="bg-slate-50 border-2 border-slate-300 rounded-lg p-6 text-center">
              {contrato.firma_asesor ? (
                <div>
                  <Image
                    src={contrato.firma_asesor}
                    alt="Firma del asesor"
                    width={300}
                    height={120}
                    className="mx-auto"
                  />
                  <div className="mt-3 pt-3 border-t border-slate-300">
                    <p className="font-semibold text-slate-900">{datos.asesor}</p>
                    <p className="text-sm text-slate-600">Asesor Educativo</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500">Firma no disponible</p>
              )}
            </div>
          </div>
        </div>

        {/* Sección de Firma del Estudiante */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-slate-200">
            Firma del Estudiante
          </h2>

          {/* Verificación de DPI */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Número de Indentificacion<span className="text-red-600">*</span>
            </label>
            <p className="text-sm text-slate-600 mb-3">
              Para confirmar su identidad, por favor ingrese su Documento Personal de Identificación o el Numero Documento Brindado.
            </p>
            <input
              type="text"
              maxLength={100}
              value={dpi}
              onChange={(e) => setDpi(e.target.value.replace(/\D/g, ""))}
              placeholder="0000 00000 0000"
              className="w-full max-w-md px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 outline-none transition-colors text-lg font-mono"
            />
            <p className="text-xs text-slate-500 mt-1">13 dígitos sin espacios</p>
          </div>

          {/* Canvas para Firma */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Dibuje su firma <span className="text-red-600">*</span>
            </label>
            <p className="text-sm text-slate-600 mb-3">
              Use su mouse o dedo (en dispositivos táctiles) para firmar en el cuadro a continuación.
            </p>
            <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                width={800}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full cursor-crosshair touch-none"
                style={{ 
                  touchAction: "none",
                  maxHeight: "200px",
                  display: "block"
                }}
              />
            </div>
            <div className="mt-3 flex gap-3">
              <button
                onClick={clearSignature}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Limpiar Firma
              </button>
              <button
                onClick={saveSignature}
                className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-lg font-medium transition-colors"
              >
                Confirmar Firma
              </button>
            </div>
          </div>

          {/* Vista Previa de Firma */}
          {signature && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-semibold text-green-900 mb-2">✓ Firma confirmada</p>
              <p className="text-sm text-green-700">Su firma ha sido capturada correctamente.</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-900 mb-1">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Botón de Envío */}
          <div className="pt-6 border-t border-slate-200">
            <button
              onClick={handleSubmit}
              disabled={submitting || !signature || !dpi}
              className="w-full py-4 bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 disabled:from-slate-300 disabled:to-slate-300 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed text-lg"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Procesando firma...
                </span>
              ) : (
                "Firmar Contrato"
              )}
            </button>
            <p className="text-xs text-center text-slate-500 mt-3">
              Al firmar, usted acepta los términos y condiciones del contrato de confidencialidad.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-300 py-6 mt-12">
        <div className="max-w-5xl mx-auto px-6 text-center text-sm">
          <p>© {new Date().getFullYear()} - Sistema de Firma Digital Segura</p>
          <p className="text-slate-400 mt-1">Documento legalmente vinculante</p>
        </div>
      </footer>
    </div>
  )
}
