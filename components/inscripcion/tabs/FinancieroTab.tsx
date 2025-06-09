"use client"
import React, { useEffect, useState, useRef, useMemo } from "react"
import axios, { AxiosError } from "axios"
import { API_BASE_URL } from "@/utils/apiConfig"
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatosFinancieros } from "../types"

interface Convenio { id: number; nombre: string }
interface ProgramaConDuracion { programaId: number; duracion: number }

interface Props {
  datos: DatosFinancieros
  setDatos: React.Dispatch<React.SetStateAction<DatosFinancieros>>
  goPrev: () => void
  goNext: () => void
  programas: ProgramaConDuracion[]
  convenioId?: number
}

export default function FinancieroTab({
  datos,
  setDatos,
  goPrev,
  goNext,
  programas,
  convenioId,
}: Props) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const cache = useRef(new Map<string, { inscripcion: number; cuota_mensual: number }>())
  const lastKey = useRef("")
  const formas = ["deposito", "debito", "transferencia", "tarjeta"]
  const [convenios, setConvenios] = useState<Convenio[]>([])

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

  /* ——— Cargar convenios ——— */
  useEffect(() => {
    axios
      .get<Convenio[]>(`${API_BASE_URL}/api/convenios`)
      .then(resp => setConvenios(resp.data))
      .catch(err => {
        console.error("Error cargando convenios:", err)
        setError("No se pudieron cargar los convenios.")
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
    if (datos.tieneConvenio && !convenioId) return

    const key = programas.map(p => `${p.programaId}:${p.duracion}`).join("|")
      + `|conv:${datos.tieneConvenio ? convenioId : "no"}`
    if (key === lastKey.current) return
    lastKey.current = key

    setLoading(true)
    setError(null)

    const calls = programas.map(({ programaId, duracion }) => {
      const cacheKey = `${datos.tieneConvenio ? convenioId : "no"}-${programaId}-${duracion}`
      if (cache.current.has(cacheKey)) {
        return Promise.resolve({ ok: true as const, data: cache.current.get(cacheKey)! })
      }
    const url = datos.tieneConvenio
        ? `${API_BASE_URL}/api/precios/convenio/${convenioId}/${programaId}?meses=${duracion}`
        : `${API_BASE_URL}/api/precios/programa/${programaId}?meses=${duracion}`
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

      const exitosos = results.filter(r => r.ok).map(r => (r as any).data)
      const fallidos = results.filter(r => !r.ok).map(r => (r as any).error as AxiosError)

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

      setDatos(prev => ({
        ...prev,
        inscripcion: insc,
        cuotaMensual: cuota,
        cantidadMeses: totalMeses,
        inversionTotal: invTotal,
      }))

      if (fallidos.length) console.warn("Peticiones fallidas no críticas:", fallidos)
      setError(null)
    })
  }, [programas, datos.tieneConvenio, convenioId, setDatos])

  const gastosFinales = [
    { concepto: "Proyecto Final", transfer: "Q1,600.00", otro: "Q1,760.00" },
    { concepto: "Graduación", transfer: "Q2,845.00", otro: "Q3,129.50" },
    { concepto: "Gastos de Título (1)", transfer: "Q3,999.00", otro: "Q4,398.90" },
    { concepto: "Certificación Internacional", transfer: "Q2,000.00", otro: "Q2,200.00" },
  ]
  const serviciosElectronicos = [
    { curso: "8", transfer: "Q362.00", otro: "Q398.20" },
    { curso: "9", transfer: "Q421.00", otro: "Q463.10" },
    { curso: "12", transfer: "Q598.00", otro: "Q657.80" },
    { curso: "18", transfer: "Q897.00", otro: "Q986.70" },
    { curso: "21", transfer: "Q1,074.00", otro: "Q1,181.40" },
    { curso: "24", transfer: "Q1,251.00", otro: "Q1,376.10" },
    { curso: "32", transfer: "Q1,650.00", otro: "Q1,815.00" },
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
          <Label>¿Posee convenio corporativo? *</Label>
          <Select
            value={datos.tieneConvenio ? "si" : "no"}
            onValueChange={v => setDatos(d => ({ ...d, tieneConvenio: v === "si" }))}
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
            <Label>Seleccionar convenio *</Label>
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
          <Label>Modalidad de pago *</Label>
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
        <InputWithLabel id="ins" label="Inscripción (Q)" value={datos.inscripcion} />
        <InputWithLabel id="cuo" label="Cuota mensual (Q)" value={datos.cuotaMensual} />
        <InputWithLabel id="mes" label="Cantidad en meses" value={datos.cantidadMeses} />
        <InputWithLabel id="inv" label="Inversión total (Q)" value={datos.inversionTotal} bold />
      </div>

      {error && <p className="text-red-600 mt-2">{error}</p>}

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
          rows={serviciosElectronicos.map(s => [`Programa de ${s.curso} cursos`, s.transfer, s.otro])}
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
  bold = false,
}: {
  id: string
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} readOnly value={value} className={bold ? "font-bold" : ""} />
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
