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
  /** Doble/triple titulación: lista de programas con nombre y duración */
  programas_inscritos?: { nombre: string; duracion_meses: number }[]
  es_doble_titulacion?: boolean
}

interface Contrato {
  id: number
  prospecto_id: number
  estado_firma: string
  fecha_envio: string
  datos_contrato: DatosContrato
  firma_asesor: string // Base64 de la imagen
}

interface FichaInscripcion {
  datos_personales: {
    nombre_completo: string
    dpi: string
    pais_origen: string
    pais_residencia: string
    telefono: string
    fecha_nacimiento: string
    email_personal: string
    email_corporativo: string
    direccion: string
  }
  datos_laborales: {
    empresa: string
    puesto: string
    telefono_corporativo: string
    departamento: string
    direccion_empresa: string
  }
  datos_academicos: {
    programa: string
    duracion_meses: string | number
    programas_inscritos?: { nombre: string; duracion_meses: number }[]
    es_doble_titulacion?: boolean
    ultimo_titulo: string
    institucion: string
    carrera: string
    anio_graduacion: string
    modalidad: string
    dia_estudio: string
    fecha_inicio: string
    medio_conocio: string
  }
  datos_financieros: {
    tiene_convenio: boolean
    forma_pago: string
    inscripcion: number
    cuota_mensual: number
    duracion_meses: number
    inversion_total: number
    moneda?: string
  }
  servicios_electronicos: {
    cantidad_cursos: number
    precio_transferencia: number
    precio_otro_metodo: number
  }[]
}

export default function FirmarContratoPage() {
  const { token } = useParams()
  const router = useRouter()

  const [contrato, setContrato] = useState<Contrato | null>(null)
  const [prospecto, setProspecto] = useState<any>(null)
  const [fichaInscripcion, setFichaInscripcion] = useState<FichaInscripcion | null>(null)
  const [signature, setSignature] = useState<string | null>(null)
  const [dpi, setDpi] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [yaFirmado, setYaFirmado] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [departamentos, setDepartamentos] = useState<{ id: number; nombre: string }[]>([])

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
        setFichaInscripcion(data.ficha_inscripcion || null)
        setLoading(false)
      } catch (err) {
        setError("Error al cargar el contrato")
        setLoading(false)
      }
    }

    cargarContrato()
  }, [token])

  // Cargar departamentos
  useEffect(() => {
    const fetchDepartamentos = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/ubicacion/1`)
        if (res.ok) {
          const data = await res.json()
          const deps = (data.departamentos || []).map((d: any) => ({
            id: d.id,
            nombre: d.nombre,
          }))
          setDepartamentos(deps)
        }
      } catch (err) {
        console.error("Error cargando departamentos:", err)
      }
    }
    fetchDepartamentos()
  }, [])

  const getDepartamentoNombre = (id: string | number) => {
    if (!id) return ""
    const dep = departamentos.find(d => d.id.toString() === id.toString())
    return dep ? dep.nombre : id.toString()
  }

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50" style={{ colorScheme: 'light' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando contrato...</p>
        </div>
      </div>
    )
  }

  if (error || yaFirmado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" style={{ colorScheme: 'light' }}>
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" style={{ colorScheme: 'light' }}>
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
  const TASA_CAMBIO = 8
  const esUSD = fichaInscripcion?.datos_financieros?.moneda === "USD"

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" style={{ colorScheme: 'light' }}>
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
              <p className="text-sm text-slate-500 mb-1">{datos.es_doble_titulacion && datos.programas_inscritos && datos.programas_inscritos.length > 1 ? "Programas académicos" : "Programa académico"}</p>
              {datos.es_doble_titulacion && datos.programas_inscritos && datos.programas_inscritos.length > 1 ? (
                <ul className="font-semibold text-slate-900 list-none space-y-0.5">
                  {datos.programas_inscritos.map((p, idx) => (
                    <li key={idx}>{p.nombre} ({p.duracion_meses} meses)</li>
                  ))}
                </ul>
              ) : (
                <p className="font-semibold text-slate-900">{datos.programa}</p>
              )}
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

        {/* ═══════════════════════════════════════════════════════ */}
        {/* FICHA DE INSCRIPCIÓN                                   */}
        {/* ═══════════════════════════════════════════════════════ */}
        {fichaInscripcion && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2 pb-3 border-b-4 border-[#1e264d] text-center uppercase tracking-wide">
              Ficha de Inscripción
            </h2>
            <p className="text-center text-sm text-slate-500 mb-6">Información del Estudiante y Programa Académico</p>

            {/* 1. DATOS PERSONALES */}
            <div className="bg-[#1e264d] text-white px-4 py-2 rounded-t-md font-bold text-sm uppercase mb-0">
              📋 Datos Personales
            </div>
            <div className="border border-slate-300 rounded-b-md mb-5 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {[
                  { label: "Nombre completo", value: fichaInscripcion.datos_personales.nombre_completo },
                  { label: "DPI/Identificación", value: fichaInscripcion.datos_personales.dpi },
                  { label: "País de origen", value: fichaInscripcion.datos_personales.pais_origen },
                  { label: "País de residencia", value: fichaInscripcion.datos_personales.pais_residencia },
                  { label: "Teléfono móvil", value: fichaInscripcion.datos_personales.telefono },
                  { label: "Fecha de nacimiento", value: fichaInscripcion.datos_personales.fecha_nacimiento },
                  { label: "Email personal", value: fichaInscripcion.datos_personales.email_personal },
                  { label: "Email corporativo", value: fichaInscripcion.datos_personales.email_corporativo },
                  { label: "Dirección de residencia", value: fichaInscripcion.datos_personales.direccion, full: true },
                ].filter(f => f.value && f.value.toString().trim() !== "" && f.value.toString().toLowerCase() !== "null" && f.value.toString().toLowerCase() !== "na" && f.value.toString().toLowerCase() !== "n/a")
                  .map((f, i) => (
                    <div
                      key={i}
                      className={`p-3 border-b border-slate-200 ${f.full ? 'col-span-1 md:col-span-2' : (i % 2 === 0 ? 'md:border-r' : '')}`}
                    >
                      <p className="text-xs font-bold text-[#1e264d]">{f.label}</p>
                      <p className="text-sm text-slate-800">{f.value}</p>
                    </div>
                  ))}
              </div>
            </div>

            {/* 2. DATOS LABORALES */}
            <div className="bg-[#1e264d] text-white px-4 py-2 rounded-t-md font-bold text-sm uppercase mb-0">
              💼 Datos Laborales
            </div>
            <div className="border border-slate-300 rounded-b-md mb-5 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {[
                  { label: "Empresa donde labora", value: fichaInscripcion.datos_laborales.empresa },
                  { label: "Puesto de trabajo", value: fichaInscripcion.datos_laborales.puesto },
                  { label: "Teléfono corporativo", value: fichaInscripcion.datos_laborales.telefono_corporativo },
                  { label: "Departamento", value: getDepartamentoNombre(fichaInscripcion.datos_laborales.departamento) },
                  { label: "Dirección de la empresa", value: fichaInscripcion.datos_laborales.direccion_empresa, full: true },
                ].filter(f => f.value && f.value.toString().trim() !== "" && f.value.toString().toLowerCase() !== "null" && f.value.toString().toLowerCase() !== "na" && f.value.toString().toLowerCase() !== "n/a")
                  .map((f, i) => (
                    <div
                      key={i}
                      className={`p-3 border-b border-slate-200 ${f.full ? 'col-span-1 md:col-span-2' : (i % 2 === 0 ? 'md:border-r' : '')}`}
                    >
                      <p className="text-xs font-bold text-[#1e264d]">{f.label}</p>
                      <p className="text-sm text-slate-800">{f.value}</p>
                    </div>
                  ))}
              </div>
            </div>

            {/* 3. INFORMACIÓN ACADÉMICA */}
            <div className="bg-[#1e264d] text-white px-4 py-2 rounded-t-md font-bold text-sm uppercase mb-0">
              🎓 Información Académica
            </div>
            <div className="border border-slate-300 rounded-b-md mb-5 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {fichaInscripcion.datos_academicos.es_doble_titulacion && fichaInscripcion.datos_academicos.programas_inscritos && fichaInscripcion.datos_academicos.programas_inscritos.length > 1 ? (
                  <>
                    <div className="p-3 border-b border-slate-200 md:border-r col-span-full md:col-span-2">
                      <p className="text-xs font-bold text-[#1e264d]">
                        {fichaInscripcion.datos_academicos.programas_inscritos.length === 2
                          ? "Doble titulación (2 carreras)"
                          : fichaInscripcion.datos_academicos.programas_inscritos.length === 3
                            ? "Triple titulación (3 carreras)"
                            : `Varias carreras (${fichaInscripcion.datos_academicos.programas_inscritos.length})`}
                      </p>
                      <p className="text-sm text-slate-800">
                        Total: {fichaInscripcion.datos_financieros.duracion_meses} meses
                      </p>
                    </div>
                    {fichaInscripcion.datos_academicos.programas_inscritos.map((p, idx) => (
                      <div key={idx} className={`p-3 border-b border-slate-200 ${idx % 2 === 0 ? "md:border-r" : ""}`}>
                        <p className="text-xs font-bold text-[#1e264d]">{p.nombre}</p>
                        <p className="text-sm text-slate-800">{p.duracion_meses} meses</p>
                      </div>
                    ))}
                    {[
                      { label: "Último título obtenido", value: fichaInscripcion.datos_academicos.ultimo_titulo },
                      { label: "Institución", value: fichaInscripcion.datos_academicos.institucion },
                      { label: "Carrera del último título", value: fichaInscripcion.datos_academicos.carrera },
                      { label: "Año de graduación", value: fichaInscripcion.datos_academicos.anio_graduacion },
                      { label: "Modalidad", value: fichaInscripcion.datos_academicos.modalidad },
                      { label: "Día de estudio", value: fichaInscripcion.datos_academicos.dia_estudio },
                      { label: "Fecha de inicio", value: fichaInscripcion.datos_academicos.fecha_inicio },
                      { label: "¿Cómo conoció ASM?", value: fichaInscripcion.datos_academicos.medio_conocio },
                    ]
                      .filter(f => f.value && f.value.toString().trim() !== "" && f.value.toString().toLowerCase() !== "null" && f.value.toString().toLowerCase() !== "na" && f.value.toString().toLowerCase() !== "n/a")
                      .map((f, i) => (
                        <div key={i} className={`p-3 border-b border-slate-200 ${i % 2 === 0 ? "md:border-r" : ""}`}>
                          <p className="text-xs font-bold text-[#1e264d]">{f.label}</p>
                          <p className="text-sm text-slate-800">{f.value}</p>
                        </div>
                      ))}
                  </>
                ) : (
                  [
                    { label: "Programa", value: fichaInscripcion.datos_academicos.programa },
                    { label: "Duración", value: fichaInscripcion.datos_academicos.duracion_meses ? `${fichaInscripcion.datos_academicos.duracion_meses} meses` : null },
                    { label: "Último título obtenido", value: fichaInscripcion.datos_academicos.ultimo_titulo },
                    { label: "Institución", value: fichaInscripcion.datos_academicos.institucion },
                    { label: "Carrera del último título", value: fichaInscripcion.datos_academicos.carrera },
                    { label: "Año de graduación", value: fichaInscripcion.datos_academicos.anio_graduacion },
                    { label: "Modalidad", value: fichaInscripcion.datos_academicos.modalidad },
                    { label: "Día de estudio", value: fichaInscripcion.datos_academicos.dia_estudio },
                    { label: "Fecha de inicio", value: fichaInscripcion.datos_academicos.fecha_inicio },
                    { label: "¿Cómo conoció ASM?", value: fichaInscripcion.datos_academicos.medio_conocio },
                  ]
                    .filter(f => f.value && f.value.toString().trim() !== "" && f.value.toString().toLowerCase() !== "null" && f.value.toString().toLowerCase() !== "na" && f.value.toString().toLowerCase() !== "n/a")
                    .map((f, i) => (
                      <div key={i} className={`p-3 border-b border-slate-200 ${i % 2 === 0 ? "md:border-r" : ""}`}>
                        <p className="text-xs font-bold text-[#1e264d]">{f.label}</p>
                        <p className="text-sm text-slate-800">{f.value}</p>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* 4. DATOS FINANCIEROS */}
            <div className="bg-[#1e264d] text-white px-4 py-2 rounded-t-md font-bold text-sm uppercase mb-0">
              💰 Datos Financieros
            </div>
            <div className="border border-slate-300 rounded-b-md mb-5 overflow-hidden">
              {esUSD && (
                <div className="px-3 py-2 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-700 font-medium">
                  💱 Moneda: <strong>Dólares Americanos (USD)</strong> · Tipo de cambio: Q{TASA_CAMBIO}.00 = $1.00 USD
                </div>
              )}
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="p-3 bg-slate-50 font-bold text-[#1e264d] w-2/5">¿Posee convenio corporativo?</td>
                    <td className="p-3">{fichaInscripcion.datos_financieros.tiene_convenio ? 'Sí' : 'No'}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-3 bg-slate-50 font-bold text-[#1e264d]">Modalidad de pago</td>
                    <td className="p-3">{fichaInscripcion.datos_financieros.forma_pago}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-3 bg-slate-50 font-bold text-[#1e264d]">{esUSD ? "Inscripción" : "Inscripción (Q)"}</td>
                    <td className="p-3 bg-amber-50 font-bold">
                      {esUSD ? (
                        <>${(Number(fichaInscripcion.datos_financieros.inscripcion) / TASA_CAMBIO).toLocaleString('es-GT', { minimumFractionDigits: 2 })} USD <span className="text-slate-400 font-normal text-xs">(Q{Number(fichaInscripcion.datos_financieros.inscripcion).toLocaleString('es-GT', { minimumFractionDigits: 2 })})</span></>
                      ) : (
                        <>Q{Number(fichaInscripcion.datos_financieros.inscripcion).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</>
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-3 bg-slate-50 font-bold text-[#1e264d]">{esUSD ? "Cuota mensual" : "Cuota mensual (Q)"}</td>
                    <td className="p-3 bg-amber-50 font-bold">
                      {esUSD ? (
                        <>${(Number(fichaInscripcion.datos_financieros.cuota_mensual) / TASA_CAMBIO).toLocaleString('es-GT', { minimumFractionDigits: 2 })} USD <span className="text-slate-400 font-normal text-xs">(Q{Number(fichaInscripcion.datos_financieros.cuota_mensual).toLocaleString('es-GT', { minimumFractionDigits: 2 })})</span></>
                      ) : (
                        <>Q{Number(fichaInscripcion.datos_financieros.cuota_mensual).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</>
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-3 bg-slate-50 font-bold text-[#1e264d]">Cantidad en meses</td>
                    <td className="p-3">{fichaInscripcion.datos_financieros.duracion_meses} meses</td>
                  </tr>
                  <tr>
                    <td className="p-3 bg-slate-50 font-bold text-[#1e264d]">{esUSD ? "Inversión total" : "Inversión total (Q)"}</td>
                    <td className="p-3 bg-amber-50 font-bold">
                      {esUSD ? (
                        <>${(Number(fichaInscripcion.datos_financieros.inversion_total) / TASA_CAMBIO).toLocaleString('es-GT', { minimumFractionDigits: 2 })} USD <span className="text-slate-400 font-normal text-xs">(Q{Number(fichaInscripcion.datos_financieros.inversion_total).toLocaleString('es-GT', { minimumFractionDigits: 2 })})</span></>
                      ) : (
                        <>Q{Number(fichaInscripcion.datos_financieros.inversion_total).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 5. INVERSIÓN ADICIONAL OBLIGATORIA */}
            <div className="bg-[#1e264d] text-white px-4 py-2 rounded-t-md font-bold text-sm uppercase mb-0">
              📊 Inversión Adicional Obligatoria
            </div>
            <div className="border border-slate-300 rounded-b-md mb-5 overflow-hidden">
              <p className="px-4 py-2 font-bold text-[#1e264d] text-xs">Gastos Finales</p>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1e264d] text-white">
                    <th className="p-2 text-left">Concepto</th>
                    <th className="p-2 text-center">Transferencia/Depósito</th>
                    <th className="p-2 text-center">Otro método</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { concepto: "Proyecto Final",            transfer: 1600,  otro: 1760 },
                    { concepto: "Graduación",                transfer: 2845,  otro: 3129.5 },
                    { concepto: "Gastos de Título",          transfer: 3999,  otro: 4398.9 },
                    { concepto: "Certificación Internacional",transfer: 2000,  otro: 2200 },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-slate-200">
                      <td className="p-2 bg-slate-50 font-semibold">{row.concepto}</td>
                      <td className="p-2 text-center">
                        Q{row.transfer.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        {esUSD && <div className="text-emerald-600 text-xs font-semibold">${(row.transfer / TASA_CAMBIO).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</div>}
                      </td>
                      <td className="p-2 text-center">
                        Q{row.otro.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        {esUSD && <div className="text-emerald-600 text-xs font-semibold">${(row.otro / TASA_CAMBIO).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="px-4 py-2 font-bold text-[#1e264d] text-xs mt-2">Servicios Electrónicos</p>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1e264d] text-white">
                    <th className="p-2 text-left">Programa</th>
                    <th className="p-2 text-center">Transferencia/Depósito</th>
                    <th className="p-2 text-center">Otro método</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const duracion = fichaInscripcion.datos_financieros.duracion_meses;
                    // Buscar si existe un precio configurado para esta duración específica
                    let servicio = fichaInscripcion.servicios_electronicos.find(s => s.cantidad_cursos == duracion);

                    // Si no existe configuración específica, calcular basado en la regla Q70/Q77
                    if (!servicio) {
                      servicio = {
                        cantidad_cursos: duracion,
                        precio_transferencia: duracion * 70,
                        precio_otro_metodo: duracion * 77
                      };
                    }

                    const pt = Number(servicio.precio_transferencia)
                    const po = Number(servicio.precio_otro_metodo)
                    const transfer = Number.isFinite(pt) && pt >= 0 ? pt : duracion * 70
                    const otro = Number.isFinite(po) && po >= 0 ? po : duracion * 77
                    return (
                      <tr className="border-b border-slate-200">
                        <td className="p-2 bg-slate-50 font-semibold">Programa de {servicio.cantidad_cursos} cursos</td>
                        <td className="p-2 text-center">
                          Q{transfer.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                          {esUSD && <div className="text-emerald-600 text-xs font-semibold">${(transfer / TASA_CAMBIO).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</div>}
                        </td>
                        <td className="p-2 text-center">
                          Q{otro.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                          {esUSD && <div className="text-emerald-600 text-xs font-semibold">${(otro / TASA_CAMBIO).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</div>}
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>

              <div className="bg-slate-50 border-l-4 border-[#1e264d] p-3 m-3 text-xs text-slate-500">
                <ul className="list-disc ml-4 space-y-1">
                  <li>La cuota de casos puede pagarse 50% al inicio y 50% a mitad de carrera.</li>
                  <li>El título se emite al completar los cursos y cancelar la totalidad de pagos.</li>
                  <li>Los pagos de cuotas se realizan del 1 al 5 de cada mes; a partir del 6 se genera mora (Q50.00).</li>
                </ul>
              </div>
            </div>

            {/* 6. DOCUMENTOS ADICIONALES REQUERIDOS */}
            <div className="bg-[#1e264d] text-white px-4 py-2 rounded-t-md font-bold text-sm uppercase mb-0">
              📄 Documentos Adicionales Requeridos
            </div>
            <div className="border border-slate-300 rounded-b-md overflow-hidden">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1e264d] text-white">
                    <th className="p-2 text-center">Programa</th>
                    <th className="p-2 text-center">Título de diversificado</th>
                    <th className="p-2 text-center">Cierre de pensum</th>
                    <th className="p-2 text-center">Certificación de cursos</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 text-center">BBA 8</td>
                    <td className="p-2 text-center">Sí</td>
                    <td className="p-2 text-center">-</td>
                    <td className="p-2 text-center">40</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 text-center">BBA 12</td>
                    <td className="p-2 text-center">Sí</td>
                    <td className="p-2 text-center">-</td>
                    <td className="p-2 text-center">30</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 text-center">BBA 18</td>
                    <td className="p-2 text-center">Sí</td>
                    <td className="p-2 text-center">-</td>
                    <td className="p-2 text-center">25</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 text-center">BBA 24</td>
                    <td className="p-2 text-center">Sí</td>
                    <td className="p-2 text-center">-</td>
                    <td className="p-2 text-center">20</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-center">BBA 32</td>
                    <td className="p-2 text-center">Sí</td>
                    <td className="p-2 text-center">-</td>
                    <td className="p-2 text-center">Menos de 20</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

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
              cursar {datos.es_doble_titulacion && datos.programas_inscritos && datos.programas_inscritos.length > 1
                ? "mis programas:"
                : "mi programa de:"}
            </p>

            {datos.es_doble_titulacion && datos.programas_inscritos && datos.programas_inscritos.length > 1 ? (
              <ul className="list-none text-center font-bold text-base text-slate-900 space-y-1 my-2">
                {datos.programas_inscritos.map((p, idx) => (
                  <li key={idx}>{p.nombre} ({p.duracion_meses} meses)</li>
                ))}
              </ul>
            ) : (
              <p className="text-center font-bold text-base text-slate-900">
                {datos.programa} ({datos.programa_abreviatura})
              </p>
            )}

            <p className="text-justify">
              Asimismo, entiendo y acepto que mi participación en el acto de
              graduación de {datos.es_doble_titulacion && datos.programas_inscritos && datos.programas_inscritos.length > 1 ? "dichos programas" : "dicho programa"} es obligatoria e indispensable.
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
              Número de Identificación <span className="text-red-600">*</span>
            </label>
            <p className="text-sm text-slate-600 mb-3">
              Para confirmar su identidad, por favor ingrese su Documento Personal de Identificación o el número de documento brindado.
            </p>
            <input
              type="text"
              maxLength={100}
              value={dpi}
              onChange={(e) => setDpi(e.target.value.replace(/\D/g, ""))}
              placeholder="0000000000000"
              className="w-full max-w-md px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 outline-none transition-colors text-lg font-mono bg-white text-slate-900 placeholder:text-slate-400"
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
