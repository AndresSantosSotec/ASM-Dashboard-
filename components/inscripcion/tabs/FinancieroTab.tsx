"use client"
import React, { useEffect, useState, useRef, useMemo } from "react"
import axios, { AxiosError } from "axios"
import { API_BASE_URL } from "@/utils/apiConfig"
import { ArrowLeft, ArrowRight, CheckCircle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RequiredAsterisk } from "@/components/ui/required-asterisk"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatosFinancieros } from "../types"
import ReciboPagoGenerator from "../ReciboPagoGenerator"

interface Convenio { id: number; nombre: string }
interface ProgramaConDuracion { programaId: number; duracion: number }

interface Props {
  datos: DatosFinancieros
  setDatos: React.Dispatch<React.SetStateAction<DatosFinancieros>>
  goPrev: () => void
  goNext: () => void
  programas: ProgramaConDuracion[]
  studentName?: string
  nit?: string
  telefono?: string
  email?: string
  programa?: string
  /** Si true, no sobrescribir inscripción/cuota/meses/inversión con precios del API (datos cargados desde prospecto/Alerta) */
  preserveFinancialFromProspect?: boolean
  /** Llamar cuando se respetaron los datos del prospecto para dejar de preservar en el siguiente cambio */
  onPreserveFinancialApplied?: () => void
}

export default function FinancieroTab({
  datos,
  setDatos,
  goPrev,
  goNext,
  programas,
  studentName,
  nit,
  telefono,
  email,
  programa,
  preserveFinancialFromProspect,
  onPreserveFinancialApplied,
}: Props) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const cache = useRef(new Map<string, { inscripcion: number; cuota_mensual: number }>())
  const lastKey = useRef("")
  const formas = ["deposito", "debito", "transferencia", "tarjeta"]
  const [convenios, setConvenios] = useState<Convenio[]>([])
  const [sugeridos, setSugeridos] = useState({ inscripcion: "", cuota: "" })
  const [serviciosElectronicos, setServiciosElectronicos] = useState<Array<{ curso: string, transfer: string, otro: string }>>([])
  const [showRecibo, setShowRecibo] = useState(false)

  // ——— Validación de campos obligatorios ———
  const isFormValid = useMemo(() => {
    // Debe haber respondido si tiene convenio o no,
    // si tiene, debe seleccionar un convenio, y siempre forma de pago
    return (
      datos.tieneConvenio !== undefined &&
      (!datos.tieneConvenio || !!datos.convenioId) &&
      !!datos.formaPago
    )
  }, [datos.tieneConvenio, datos.convenioId, datos.formaPago])

  /* ——— Cargar convenios y precios de servicios electrónicos ——— */
  useEffect(() => {
    axios
      .get<Convenio[]>(`${API_BASE_URL}/api/convenios`)
      .then(resp => setConvenios(resp.data))
      .catch(err => {
        console.error("Error cargando convenios:", err)
        setError("No se pudieron cargar los convenios.")
      })

    // Cargar precios de servicios electrónicos desde BD
    axios
      .get(`${API_BASE_URL}/api/precios-servicios-electronicos/frontend`)
      .then(resp => setServiciosElectronicos(resp.data))
      .catch(err => {
        console.error("Error cargando precios de servicios electrónicos:", err)
        // Valores por defecto en caso de error
        setServiciosElectronicos([
          { curso: "8", transfer: "Q560.00", otro: "Q616.00" },
          { curso: "9", transfer: "Q630.00", otro: "Q693.00" },
          { curso: "12", transfer: "Q840.00", otro: "Q924.00" },
          { curso: "18", transfer: "Q1,260.00", otro: "Q1,386.00" },
          { curso: "21", transfer: "Q1,470.00", otro: "Q1,617.00" },
          { curso: "24", transfer: "Q1,680.00", otro: "Q1,848.00" },
          { curso: "32", transfer: "Q2,240.00", otro: "Q2,464.00" },
        ])
      })
  }, [])

  /* ——— Asignar automáticamente el convenio 1 ——— */
  useEffect(() => {
    if (datos.tieneConvenio && !datos.convenioId && convenios.length > 0) {
      const convenioUno = convenios.find(c => c.id === 1) || convenios[0]
      setDatos(prev => ({ ...prev, convenioId: convenioUno.id }))
    }
  }, [datos.tieneConvenio, convenios, datos.convenioId, setDatos])

  /* ——— Cálculo de precios dinámicos ——— */
  useEffect(() => {
    if (!programas.length) return
    if (datos.tieneConvenio && !datos.convenioId) return

    const convId = datos.tieneConvenio ? datos.convenioId : null

    const key =
      programas.map(p => `${p.programaId}:${p.duracion}`).join("|") +
      `|conv:${convId ?? "no"}`
    if (key === lastKey.current) return
    lastKey.current = key

    setLoading(true)
    setError(null)

    const calls = programas.map(({ programaId, duracion }) => {
      const cacheKey = `${convId ?? "no"}-${programaId}-${duracion}`
      if (cache.current.has(cacheKey)) {
        return Promise.resolve({ ok: true as const, data: cache.current.get(cacheKey)! })
      }

      const url = convId
        ? `${API_BASE_URL}/api/precios/convenio/${convId}/${programaId}?meses=${duracion}`
        : `${API_BASE_URL}/api/precios/programa/${programaId}?meses=${duracion}`

      console.debug("GET precios:", url)

      return axios
        .get<{ inscripcion: number; cuota_mensual: number }>(url)
        .then(r => {
          cache.current.set(cacheKey, r.data)
          return { ok: true as const, data: r.data }
        })
        .catch((err: AxiosError) => ({ ok: false as const, error: err }))
    })

    Promise.all(calls).then(results => {
      setLoading(false)

      const exitosos = results.filter(r => (r as any).ok).map(r => (r as any).data)
      const fallidos = results.filter(r => !(r as any).ok).map(r => (r as any).error as AxiosError)

      if (fallidos.some(e => axios.isAxiosError(e) && e.response?.status === 429)) {
        setError("Has excedido el límite de solicitudes. Espera unos segundos.")
        return
      }
      if (!exitosos.length) {
        console.error("Todas las peticiones fallaron:", fallidos)
        setError("No se pudieron calcular los precios. Intenta más tarde.")
        return
      }

      const first = exitosos[0]
      const insc = first.inscripcion.toFixed(2)
      const cuota = first.cuota_mensual.toFixed(2)
      const totalMeses = programas.reduce((s, p) => s + p.duracion, 0).toString()
      const sumaTotal = exitosos.reduce((s, { inscripcion, cuota_mensual }, i) => {
        return s + inscripcion + cuota_mensual * programas[i].duracion
      }, 0)
      const invTotal = sumaTotal.toFixed(2)

      setSugeridos({ inscripcion: insc, cuota })

      if (preserveFinancialFromProspect) {
        onPreserveFinancialApplied?.()
      } else {
        setDatos(prev => ({
          ...prev,
          inscripcion: insc,
          cuotaMensual: cuota,
          cantidadMeses: totalMeses,
          inversionTotal: invTotal,
        }))
      }

      if (fallidos.length) console.warn("Peticiones fallidas no críticas:", fallidos)
      setError(null)
    })
  }, [programas, datos.tieneConvenio, datos.convenioId, setDatos, preserveFinancialFromProspect, onPreserveFinancialApplied])

  // Recalcular inversión total al editar montos
  useEffect(() => {
    const insc = parseFloat(datos.inscripcion.replace(/,/g, "")) || 0
    const cuota = parseFloat(datos.cuotaMensual.replace(/,/g, "")) || 0
    const meses = parseInt(datos.cantidadMeses) || 0
    const total = cuota * meses + insc
    setDatos(prev => ({ ...prev, inversionTotal: total.toFixed(2) }))
  }, [datos.inscripcion, datos.cuotaMensual, datos.cantidadMeses, setDatos])

  const gastosFinales = [
    { concepto: "Proyecto Final", transfer: "Q1,600.00", otro: "Q1,760.00" },
    { concepto: "Graduación", transfer: "Q2,845.00", otro: "Q3,129.50" },
    { concepto: "Gastos de Título (1)", transfer: "Q3,999.00", otro: "Q4,398.90" },
    { concepto: "Certificación Internacional", transfer: "Q2,000.00", otro: "Q2,200.00" },
  ]

  return (
    <>
      {/* Indicador de éxito */}
      {isFormValid && !loading && (
        <div className="mb-4 flex items-center gap-2 rounded bg-green-100 px-4 py-2 text-green-800">
          <CheckCircle className="h-5 w-5" />
          Listo para continuar: campos financieros completos
        </div>
      )}

      {/* — Formulario — */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>
            ¿Posee convenio corporativo? <RequiredAsterisk />
          </Label>
          <Select
            value={datos.tieneConvenio ? "si" : "no"}
            onValueChange={v => {
              const tiene = v === "si"
              setDatos(d => ({
                ...d,
                tieneConvenio: tiene,
                // Si pasa a "no", limpiamos convenioId para evitar confusiones
                convenioId: tiene ? d.convenioId : undefined,
              }))
            }}
            disabled={loading}
          >
            <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="si">Sí</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {datos.tieneConvenio && (
          <div className="space-y-2">
            <Label>
              Seleccionar convenio <RequiredAsterisk />
            </Label>
            <Select
              value={datos.convenioId?.toString() || ""}
              onValueChange={v => setDatos(d => ({ ...d, convenioId: Number(v) }))}
              disabled={loading}
            >
              <SelectTrigger><SelectValue placeholder="Convenio" /></SelectTrigger>
              <SelectContent>
                {convenios.map(c => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>
            Modalidad de pago <RequiredAsterisk />
          </Label>
          <Select
            value={datos.formaPago}
            onValueChange={v => setDatos(d => ({ ...d, formaPago: v as DatosFinancieros["formaPago"] }))}
            disabled={loading}
          >
            <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
            <SelectContent>
              {formas.map(f => (
                <SelectItem key={f} value={f}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* — Costos dinámicos — */}
      <div className={`mt-6 grid gap-4 md:grid-cols-4 ${loading ? "opacity-50" : ""}`}>
        <div>
          <InputWithLabel
            id="ins"
            label="Inscripción (Q)"
            value={datos.inscripcion}
            placeholder={sugeridos.inscripcion}
            onChange={(v) => setDatos((d) => ({ ...d, inscripcion: v }))}
          />
          {/* Toggle de descuento: visible cuando inscripción < precio sugerido del API */}
          {(() => {
            const precioBase = parseFloat(sugeridos.inscripcion) || 0
            const montoActual = parseFloat(datos.inscripcion?.replace(/,/g, "") || "0")
            return precioBase > 0 && montoActual > 0 && montoActual < precioBase ? (
              <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!datos.descuentoInscripcion}
                  onChange={(e) => setDatos(d => ({ ...d, descuentoInscripcion: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-blue-700 font-medium">Descuento en inscripción</span>
              </label>
            ) : null
          })()}
          {(() => {
            const precioBase = parseFloat(sugeridos.inscripcion) || 0
            const montoActual = parseFloat(datos.inscripcion?.replace(/,/g, "") || "0")
            return !!datos.descuentoInscripcion && precioBase > 0 && montoActual > 0 && montoActual < precioBase ? (
              <p className="text-xs text-green-700 mt-1">
                Se aplicará como pago completo de inscripción (descuento de Q{(precioBase - montoActual).toFixed(2)})
              </p>
            ) : null
          })()}
        </div>
        <InputWithLabel
          id="cuo"
          label="Cuota mensual (Q)"
          value={datos.cuotaMensual}
          placeholder={sugeridos.cuota}
          onChange={(v) => setDatos((d) => ({ ...d, cuotaMensual: v }))}
        />
        <InputWithLabel
          id="mes"
          label="Cantidad en meses"
          value={datos.cantidadMeses}
          readOnly
        />
        <InputWithLabel
          id="inv"
          label="Inversión total (Q)"
          value={datos.inversionTotal}
          readOnly
          bold
        />
      </div>

      {error && <p className="text-red-600 mt-2">{error}</p>}

      {/* — Generar Recibo de Pago — */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-amber-900 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recibo de Pago
            </h3>
            <p className="text-sm text-amber-700">Generar e imprimir recibo con los datos financieros actuales</p>
          </div>
          <Button variant="outline" onClick={() => setShowRecibo(true)} className="border-amber-400 text-amber-800 hover:bg-amber-100">
            <FileText className="h-4 w-4 mr-2" />
            Generar Recibo
          </Button>
        </div>
      </div>

      <ReciboPagoGenerator
        open={showRecibo}
        onOpenChange={setShowRecibo}
        monto={datos.inscripcion?.replace(/,/g, "")}
        concepto="matricula"
        studentName={studentName}
        nit={nit}
        formaPago={datos.formaPago}
        cuotaMensual={datos.cuotaMensual}
        cantidadMeses={datos.cantidadMeses}
        inversionTotal={datos.inversionTotal}
        convenioNombre={datos.convenioNombre}
        programa={programa}
        telefono={telefono}
        email={email}
      />

      {/* — Tablas fijas — */}
      <div className="mt-8 rounded-lg bg-blue-50 p-4">
        <h3 className="mb-3 font-semibold text-blue-900">INVERSIÓN ADICIONAL OBLIGATORIA</h3>
        <TableSimple
          titulo="Gastos finales"
          head={["", "Transferencia / Depósito", "Otro método"]}
          rows={gastosFinales.map(g => [g.concepto, g.transfer, g.otro])}
        />
        <TableSimple
          titulo="Servicios electrónicos"
          className="mt-4"
          head={["", "Transferencia / Depósito", "Otro método"]}
          rows={(() => {
            const standardDurations = [8, 9, 12, 18, 21, 24, 32];
            const duracion = parseInt(datos.cantidadMeses) || 0;

            // Filtrar para mostrar solo los estandares o el seleccionado
            const mostrar = serviciosElectronicos.filter(s => {
              const c = parseInt(s.curso);
              return standardDurations.includes(c) || c === duracion;
            });

            // Si el seleccionado no está en la lista mostrada y es mayor a 0, lo agregamos
            if (duracion > 0 && !mostrar.some(s => parseInt(s.curso) === duracion)) {
              mostrar.push({
                curso: duracion.toString(),
                transfer: `Q${(duracion * 70).toFixed(2)}`,
                otro: `Q${(duracion * 77).toFixed(2)}`
              });
              // Ordenar numéricamente para que se vea bien
              mostrar.sort((a, b) => parseInt(a.curso) - parseInt(b.curso));
            }

            return mostrar.map(s => [`Programa de ${s.curso} cursos`, s.transfer, s.otro]);
          })()}
        />
        <SmallPrint />
      </div>

      {/* — Navegación — */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={goPrev} disabled={loading}>
          <ArrowLeft className="h-4 w-4" /> Anterior
        </Button>
        <Button
          onClick={goNext}
          disabled={!isFormValid || loading}
          className={isFormValid && !loading ? "bg-green-600 hover:bg-green-700 text-white" : ""}
        >
          Siguiente <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </>
  )
}

function InputWithLabel({
  id,
  label,
  value,
  onChange,
  placeholder,
  readOnly = false,
  bold = false,
}: {
  id: string
  label: string
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  readOnly?: boolean
  bold?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        title={placeholder ? `Precio sugerido: ${placeholder}` : undefined}
        className={bold ? "font-bold" : ""}
      />
    </div>
  )
}

function TableSimple({
  titulo,
  head,
  rows,
  className = "",
}: {
  titulo: string
  head: string[]
  rows: string[][]
  className?: string
}) {
  return (
    <div className={className}>
      <h4 className="mb-2 font-medium text-blue-800">{titulo}</h4>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {head.map((h, i) => (
              <th key={i} className="py-2 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b">
              {r.map((c, j) => (
                <td key={j} className="py-2">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SmallPrint() {
  return (
    <div className="mt-4 text-xs text-gray-600 space-y-1">
      <p>* La cuota de casos puede pagarse 50 % al inicio y 50 % a mitad de carrera.</p>
      <p>* El título se emite al completar los cursos y cancelar la totalidad de pagos.</p>
      <p>* Los pagos de cuotas se realizan del 1 al 5 de cada mes; a partir del 6 se genera mora (Q50.00).</p>
    </div>
  )
}
