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
import { Loader2, FileText, CheckCircle, ChevronDown, ChevronUp, ClipboardList, Zap } from "lucide-react"
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
    asesor?: string
  }
  firma_asesor: string | null
  firma_estudiante: string | null
  fecha_firma_estudiante: string
  estado_firma: string
  prospecto: {
    id?: number
    nombre_completo: string
    telefono: string
    correo_electronico: string
    correo_corporativo?: string
    numero_identificacion?: string
    fecha_nacimiento?: string
    pais_origen?: string
    pais_residencia?: string
    direccion_residencia?: string
    // Datos laborales
    empresa_donde_labora_actualmente?: string
    puesto?: string
    telefono_corporativo?: string
    direccion_empresa?: string
    sector_empresa?: string
    // Datos académicos
    modalidad?: string
    dia_estudio?: string
    fecha_inicio_especifica?: string
    medio_conocimiento_institucion?: string
    ultimo_titulo_obtenido?: string
    institucion_titulo?: string
    carrera_ultimo_titulo?: string
    anio_graduacion?: string
    cantidad_cursos_aprobados?: number
    // Datos financieros
    forma_pago?: string
    servicios_electronicos?: Array<{
      cantidad_cursos: number
      precio_transferencia: number
      precio_otro_metodo: number
      activo?: boolean
    }>
    programas?: Array<{
      programa: {
        nombre_del_programa: string
        abreviatura: string
        meses?: number
      }
      convenio?: {
        nombre_convenio: string
      }
      inscripcion: number
      cuota_mensual: number
      duracion_meses?: number
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
  const [fichaVisible, setFichaVisible] = useState(false)
  const [serviciosElectronicos, setServiciosElectronicos] = useState<Array<{
    cantidad_cursos: number
    precio_transferencia: number
    precio_otro_metodo: number
    activo: boolean
  }>>([]
  )

  useEffect(() => {
    if (isOpen && contratoId) {
      fetchContrato()
      fetchServiciosElectronicos()
    }
  }, [isOpen, contratoId])

  const fetchServiciosElectronicos = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/api/precios-servicios-electronicos/frontend`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
      if (res.ok) {
        const data = await res.json()
        // El endpoint puede devolver { data: [...] } o directamente un array
        setServiciosElectronicos(Array.isArray(data) ? data : (data.data ?? []))
      }
    } catch (e) {
      console.error("Error cargando precios electrónicos:", e)
    }
  }

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
      <DialogContent className="w-full max-w-[95vw] sm:max-w-4xl max-h-[90dvh] overflow-y-auto">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Nombre:</span>
                  <p className="font-medium">{contrato.datos_contrato?.nombre_completo || contrato.prospecto?.nombre_completo}</p>
                </div>
                <div>
                  <span className="text-gray-600">DPI:</span>
                  <p className="font-medium">{contrato.datos_contrato?.dpi || contrato.prospecto?.numero_identificacion || "No proporcionado"}</p>
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

            {/* ===== FICHA DE INSCRIPCIÓN ===== */}
            <div className="border rounded-lg overflow-hidden">
              {/* Header colapsable */}
              <button
                className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors text-left"
                onClick={() => setFichaVisible(v => !v)}
              >
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-800">Ficha de Inscripción</span>
                </div>
                {fichaVisible ? (
                  <ChevronUp className="h-4 w-4 text-blue-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-blue-600" />
                )}
              </button>

              {fichaVisible && (
                <div className="p-4 space-y-5 text-sm">

                  {/* ── Datos Personales ── */}
                  <div>
                    <p className="font-semibold text-gray-700 mb-2 border-b pb-1">Datos Personales</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                      <div><span className="text-gray-500">Nombre completo:</span><p className="font-medium">{contrato.prospecto?.nombre_completo || "—"}</p></div>
                      <div><span className="text-gray-500">DPI / Identificación:</span><p className="font-medium">{contrato.prospecto?.numero_identificacion || "—"}</p></div>
                      <div><span className="text-gray-500">Fecha de nacimiento:</span><p className="font-medium">{contrato.prospecto?.fecha_nacimiento || "—"}</p></div>
                      <div><span className="text-gray-500">País de origen:</span><p className="font-medium">{contrato.prospecto?.pais_origen || "—"}</p></div>
                      <div><span className="text-gray-500">País de residencia:</span><p className="font-medium">{contrato.prospecto?.pais_residencia || "—"}</p></div>
                      <div><span className="text-gray-500">Teléfono:</span><p className="font-medium">{contrato.prospecto?.telefono || "—"}</p></div>
                      <div><span className="text-gray-500">Correo personal:</span><p className="font-medium">{contrato.prospecto?.correo_electronico || "—"}</p></div>
                      {contrato.prospecto?.correo_corporativo && (
                        <div><span className="text-gray-500">Correo corporativo:</span><p className="font-medium">{contrato.prospecto.correo_corporativo}</p></div>
                      )}
                      {contrato.prospecto?.direccion_residencia && (
                        <div className="col-span-2"><span className="text-gray-500">Dirección:</span><p className="font-medium">{contrato.prospecto.direccion_residencia}</p></div>
                      )}
                    </div>
                  </div>

                  {/* ── Datos Laborales ── */}
                  {(contrato.prospecto?.empresa_donde_labora_actualmente || contrato.prospecto?.puesto) && (
                    <div>
                      <p className="font-semibold text-gray-700 mb-2 border-b pb-1">Datos Laborales</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        {contrato.prospecto?.empresa_donde_labora_actualmente && (
                          <div><span className="text-gray-500">Empresa:</span><p className="font-medium">{contrato.prospecto.empresa_donde_labora_actualmente}</p></div>
                        )}
                        {contrato.prospecto?.puesto && (
                          <div><span className="text-gray-500">Puesto:</span><p className="font-medium">{contrato.prospecto.puesto}</p></div>
                        )}
                        {contrato.prospecto?.telefono_corporativo && (
                          <div><span className="text-gray-500">Tel. corporativo:</span><p className="font-medium">{contrato.prospecto.telefono_corporativo}</p></div>
                        )}
                        {contrato.prospecto?.sector_empresa && (
                          <div><span className="text-gray-500">Sector:</span><p className="font-medium">{contrato.prospecto.sector_empresa}</p></div>
                        )}
                        {contrato.prospecto?.direccion_empresa && (
                          <div className="col-span-2"><span className="text-gray-500">Dirección empresa:</span><p className="font-medium">{contrato.prospecto.direccion_empresa}</p></div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Datos Académicos ── */}
                  <div>
                    <p className="font-semibold text-gray-700 mb-2 border-b pb-1">Datos Académicos</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                      {contrato.prospecto?.modalidad && (
                        <div><span className="text-gray-500">Modalidad:</span><p className="font-medium capitalize">{contrato.prospecto.modalidad}</p></div>
                      )}
                      {contrato.prospecto?.dia_estudio && (
                        <div><span className="text-gray-500">Día de estudio:</span><p className="font-medium capitalize">{contrato.prospecto.dia_estudio}</p></div>
                      )}
                      {contrato.prospecto?.fecha_inicio_especifica && (
                        <div><span className="text-gray-500">Fecha de inicio:</span><p className="font-medium">{contrato.prospecto.fecha_inicio_especifica}</p></div>
                      )}
                      {contrato.prospecto?.medio_conocimiento_institucion && (
                        <div><span className="text-gray-500">Medio de contacto:</span><p className="font-medium">{contrato.prospecto.medio_conocimiento_institucion}</p></div>
                      )}
                      {contrato.prospecto?.ultimo_titulo_obtenido && (
                        <div><span className="text-gray-500">Último título:</span><p className="font-medium">{contrato.prospecto.ultimo_titulo_obtenido}</p></div>
                      )}
                      {contrato.prospecto?.institucion_titulo && (
                        <div><span className="text-gray-500">Institución:</span><p className="font-medium">{contrato.prospecto.institucion_titulo}</p></div>
                      )}
                      {contrato.prospecto?.carrera_ultimo_titulo && (
                        <div><span className="text-gray-500">Carrera anterior:</span><p className="font-medium">{contrato.prospecto.carrera_ultimo_titulo}</p></div>
                      )}
                      {contrato.prospecto?.anio_graduacion && (
                        <div><span className="text-gray-500">Año de graduación:</span><p className="font-medium">{contrato.prospecto.anio_graduacion}</p></div>
                      )}
                      {contrato.prospecto?.cantidad_cursos_aprobados != null && (
                        <div><span className="text-gray-500">Cursos aprobados:</span><p className="font-medium">{contrato.prospecto.cantidad_cursos_aprobados}</p></div>
                      )}
                    </div>
                  </div>

                  {/* ── Datos Financieros / Programas ── */}
                  <div>
                    <p className="font-semibold text-gray-700 mb-2 border-b pb-1">Datos Financieros</p>
                    {contrato.prospecto?.forma_pago && (
                      <p className="mb-2"><span className="text-gray-500">Forma de pago: </span><span className="font-medium capitalize">{contrato.prospecto.forma_pago}</span></p>
                    )}
                    {contrato.prospecto?.programas && contrato.prospecto.programas.length > 0 ? (
                      <div className="space-y-3">
                        {contrato.prospecto.programas.map((ep, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-md p-3 border text-sm">
                            <p className="font-semibold text-blue-700 mb-1">
                              {idx === 0 ? "Programa principal" : `${idx + 1}º programa (titulación adicional)`}
                              {" — "}{ep.programa?.abreviatura || ep.programa?.nombre_del_programa}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div><span className="text-gray-500">Inscripción:</span><p className="font-medium">Q{Number(ep.inscripcion).toFixed(2)}</p></div>
                              <div><span className="text-gray-500">Mensualidad:</span><p className="font-medium">Q{Number(ep.cuota_mensual).toFixed(2)}</p></div>
                              {(ep.duracion_meses ?? ep.programa?.meses) && (
                                <div><span className="text-gray-500">Duración:</span><p className="font-medium">{ep.duracion_meses ?? ep.programa?.meses} meses</p></div>
                              )}
                            </div>
                            {ep.convenio && (
                              <p className="mt-1"><span className="text-gray-500">Convenio: </span><span className="font-medium">{ep.convenio.nombre_convenio}</span></p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-xs">Sin programas registrados</p>
                    )}
                  </div>

                  {/* ── Precios Servicios Electrónicos ── (solo la fila del total de meses) */}
                  {serviciosElectronicos.length > 0 && (() => {
                    const totalMeses = contrato.prospecto?.programas?.reduce(
                      (sum, p) => sum + (p.programa?.meses ?? 0), 0
                    ) ?? 0
                    const activos = serviciosElectronicos
                      .filter(s => s.activo !== false)
                      .sort((a, b) => a.cantidad_cursos - b.cantidad_cursos)
                    const filaExacta = activos.find(s => s.cantidad_cursos === totalMeses)
                    const fila = filaExacta ?? activos.filter(s => s.cantidad_cursos <= totalMeses).pop() ?? activos[0]
                    if (!fila) return null
                    const cantidad = filaExacta ? fila.cantidad_cursos : totalMeses
                    const transfer = filaExacta
                      ? (Number(fila.precio_transferencia) || fila.cantidad_cursos * 70)
                      : totalMeses * 70
                    const otro = filaExacta
                      ? (Number(fila.precio_otro_metodo) || Math.round(transfer * 1.10 * 100) / 100)
                      : totalMeses * 77
                    return (
                      <div>
                        <p className="font-semibold text-gray-700 mb-2 border-b pb-1 flex items-center gap-1">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          Precios Servicios Electrónicos
                        </p>
                        <p className="text-xs text-gray-400 mb-2">
                          {totalMeses > 0 ? `Total ${totalMeses} meses (${contrato.prospecto?.programas?.length ?? 1} ${(contrato.prospecto?.programas?.length ?? 1) === 1 ? "programa" : "programas"})` : "Costos según cantidad de cursos del programa"}
                        </p>
                        <div className="overflow-x-auto rounded-md border">
                          <table className="w-full text-xs min-w-[280px]">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="text-left px-3 py-2 font-semibold text-gray-600">Cursos</th>
                                <th className="text-right px-3 py-2 font-semibold text-gray-600">Transferencia / Depósito</th>
                                <th className="text-right px-3 py-2 font-semibold text-gray-600">Otro método (+10%)</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-t bg-white">
                                <td className="px-3 py-2 font-medium text-gray-700">{cantidad} cursos</td>
                                <td className="px-3 py-2 text-right text-green-700 font-semibold">
                                  Q{Number.isFinite(transfer) ? transfer.toFixed(2) : "0.00"}
                                </td>
                                <td className="px-3 py-2 text-right text-blue-700 font-semibold">
                                  Q{Number.isFinite(otro) ? otro.toFixed(2) : "0.00"}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">
                          * El precio con otro método incluye un recargo del 10% sobre el precio base.
                        </p>
                      </div>
                    )
                  })()}

                </div>
              )}
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
                  American School of Management para cursar mi programa de:<br />
                  <strong>{contrato.datos_contrato?.programa || 'N/A'}</strong>
                </p>

                <p>
                  Asimismo, entiendo y acepto que mi participación en el acto de graduación de
                  dicho programa es obligatoria e indispensable.
                </p>

                <p>
                  Deseo que el cobro de mi mensualidad sea de manera automática:<br />
                  <em>(EL COBRO SERÁ EN LOS PRIMEROS DÍAS DEL MES, APLICANDO EL PORCENTAJE DE BECA)</em>
                </p>

                <p>
                  Confirmo que tengo:<br />
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
                  Finalmente, autorizo a American School of Management a utilizar mis
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
                  En American School of Management, los estudiantes se comprometen a la
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
                  <strong> contabilidad@american-edu.com</strong> o a los números de WhatsApp
                  <strong> +502 4169-8467</strong> o <strong>+502 4138-1907</strong>. Se
                  exceptúa el pago de inscripción, el cual deberá ser remitido directamente
                  al asesor educativo. Está prohibido enviar boletas a direcciones distintas
                  a las mencionadas anteriormente.
                </p>

                <p>
                  Con pleno entendimiento y aceptación de las condiciones aquí establecidas,
                  firmo en señal de conformidad con este contrato.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-12 mb-4 not-prose border-t pt-8">
                  <div className="text-center">
                    <div className="border-b border-black w-full max-w-[160px] mx-auto mb-2"></div>
                    <p className="font-bold text-[10px] uppercase">
                      {contrato.datos_contrato?.nombre_completo || contrato.prospecto?.nombre_completo}
                    </p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1">Prospecto</p>
                  </div>
                  <div className="text-center">
                    <div className="border-b border-black w-full max-w-[160px] mx-auto mb-2"></div>
                    <p className="font-bold text-[10px] uppercase">
                      {contrato.datos_contrato?.asesor || "Asesor Educativo"}
                    </p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1">Asesor Educativo</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Firmas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
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
    </Dialog >
  )
}
