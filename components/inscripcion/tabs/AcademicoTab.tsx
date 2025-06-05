"use client"
import { useEffect, useState, useMemo } from "react"
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react"
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
import axios from "axios"
import { API_BASE_URL } from "@/utils/apiConfig"
import { DatosAcademicos } from "../types"

interface Programa {
  id: number
  abreviatura: string
  nombre_del_programa: string
  meses: number
}

interface Props {
  datos: DatosAcademicos
  setDatos: React.Dispatch<React.SetStateAction<DatosAcademicos>>
  goPrev: () => void
  goNext: () => void
}

export default function AcademicoTab({ datos, setDatos, goPrev, goNext }: Props) {
  const mesesMeses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ]
  const dias = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]
  const titulos = ["diversificado", "tecnico", "licenciatura", "maestria", "doctorado"] as const
  const medios = ["redes", "amigo", "empresa", "evento", "busqueda", "otros"] as const

  const [programas, setProgramas] = useState<Programa[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    axios
      .get<Programa[]>(`${API_BASE_URL}/api/programas`)
      .then((resp) => setProgramas(resp.data))
      .catch((err) => console.error("❌ Error al obtener programas:", err))
  }, [])

  useEffect(() => {
    const prog = programas.find(p => p.id.toString() === datos.programa)
    const nuevaDur = prog?.meses.toString() ?? ""
    if (nuevaDur && nuevaDur !== datos.duracion) {
      setDatos(prev => ({ ...prev, duracion: nuevaDur }))
    }
  }, [datos.programa, datos.duracion, programas, setDatos])

  // validación de sólo los campos obligatorios
// Reemplaza tu isFormValid por esto:
const isFormValid = useMemo(() => {
  return (
    !!datos.programa &&                                   // truthy en lugar de !== ""
    !!datos.ultimoTitulo &&                               // idem
    datos.institucionAnterior.trim().length > 0 &&        // evita comparar con ""
    datos.añoGraduacion.trim().length > 0 &&              // idem
    !!datos.modalidad &&                                  // truthy
    !!datos.fechaInicio &&                                // truthy
    !!datos.diaEstudio &&                                 // truthy
    !!datos.fechaInicioEspecifica &&                      // truthy
    !!datos.fechaTallerInduccion &&                       // truthy
    !!datos.fechaTallerIntegracion &&                     // truthy
    !!datos.medioConocio &&                               // truthy
    datos.titulo1 === datos.programa &&                   // comparas dos uniones del mismo tipo
    datos.titulo1_duracion.trim().length > 0              // idem a trim() !== ""
  )
}, [datos])


  const handleNext = () => {
    if (datos.titulo1 !== datos.programa) {
      setError("El Programa 1 debe coincidir con el Programa principal.")
      return
    }
    if (!datos.titulo1_duracion.trim()) {
      setError("Debes especificar la duración de Programa 1.")
      return
    }
    setError(null)
    goNext()
  }

  return (
    <>
      {/* indicador de éxito */}
      {isFormValid && (
        <div className="mb-4 flex items-center gap-2 rounded bg-green-100 px-4 py-2 text-green-800">
          <CheckCircle className="h-5 w-5" />
          Todos los campos obligatorios completados
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Programa + duración */}
        <div className="flex space-x-4">
          <div className="flex-1 space-y-2">
            <Label>Programa *</Label>
            <Select
              value={datos.programa}
              onValueChange={v => setDatos({ ...datos, programa: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar programa" />
              </SelectTrigger>
              <SelectContent>
                {programas.map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.abreviatura} – {p.nombre_del_programa} ({p.meses} meses)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-2">
            <Label>Duración de carrera (meses)</Label>
            <Input
              type="number"
              value={datos.duracion}
              onChange={e => setDatos({ ...datos, duracion: e.target.value })}
            />
          </div>
        </div>

        {/* Último título */}
        <div className="space-y-2">
          <Label>Último título obtenido *</Label>
          <Select
            value={datos.ultimoTitulo}
            onValueChange={v => setDatos({ ...datos, ultimoTitulo: v as DatosAcademicos["ultimoTitulo"] })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar título" />
            </SelectTrigger>
            <SelectContent>
              {titulos.map(t => (
                <SelectItem key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Institución */}
        <div className="space-y-2">
          <Label>Institución donde obtuvo su último título *</Label>
          <Input
            value={datos.institucionAnterior}
            onChange={e => setDatos({ ...datos, institucionAnterior: e.target.value })}
            required
          />
        </div>

        {/* Año de graduación */}
        <div className="space-y-2">
          <Label>Año de graduación *</Label>
          <Input
            type="number"
            min={1950}
            max={new Date().getFullYear()}
            value={datos.añoGraduacion}
            onChange={e => setDatos({ ...datos, añoGraduacion: e.target.value })}
            required
          />
        </div>

        {/* Modalidad */}
        <div className="space-y-2">
          <Label>Modalidad *</Label>
          <Select
            value={datos.modalidad}
            onValueChange={v => setDatos({ ...datos, modalidad: v as "sincronica" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar modalidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sincronica">Sincrónica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mes de inicio */}
        <div className="space-y-2">
          <Label>Mes de inicio *</Label>
          <Select
            value={datos.fechaInicio}
            onValueChange={v => setDatos({ ...datos, fechaInicio: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar mes" />
            </SelectTrigger>
            <SelectContent>
              {mesesMeses.map(m => (
                <SelectItem key={m} value={m}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Día de estudio */}
        <div className="space-y-2">
          <Label>Día que estudiará *</Label>
          <Select
            value={datos.diaEstudio}
            onValueChange={v => setDatos({ ...datos, diaEstudio: v as DatosAcademicos["diaEstudio"] })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar día" />
            </SelectTrigger>
            <SelectContent>
              {dias.map(d => (
                <SelectItem key={d} value={d}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fechas específicas */}
        <div className="space-y-2">
          <Label>Fecha de inicio específica *</Label>
          <Input
            type="date"
            value={datos.fechaInicioEspecifica}
            onChange={e => setDatos({ ...datos, fechaInicioEspecifica: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Fecha taller de inducción *</Label>
          <Input
            type="date"
            value={datos.fechaTallerInduccion}
            onChange={e => setDatos({ ...datos, fechaTallerInduccion: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Fecha taller de integración *</Label>
          <Input
            type="date"
            value={datos.fechaTallerIntegracion}
            onChange={e => setDatos({ ...datos, fechaTallerIntegracion: e.target.value })}
            required
          />
        </div>

        {/* Medio conoció */}
        <div className="space-y-2">
          <Label>¿Por qué medio conoció ASM? *</Label>
          <Select
            value={datos.medioConocio}
            onValueChange={v => setDatos({ ...datos, medioConocio: v as DatosAcademicos["medioConocio"] })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar medio" />
            </SelectTrigger>
            <SelectContent>
              {medios.map(m => (
                <SelectItem key={m} value={m}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Observaciones y cursos (opcionales) */}
        <div className="space-y-2 md:col-span-2">
          <Label>Observaciones</Label>
          <Textarea
            value={datos.observaciones}
            onChange={e => setDatos({ ...datos, observaciones: e.target.value })}
            className="min-h-[80px]"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Cant. cursos aprobados (opcionales)</Label>
          <Input
            value={datos.cursosAprobados}
            onChange={e => setDatos({ ...datos, cursosAprobados: e.target.value })}
          />
        </div>

        {/* Bloque de Programas adicionales */}
        {["titulo1", "titulo2", "titulo3"].map((field, idx) => (
          <div className="flex space-x-4 items-end" key={field}>
            <div className="flex-1 space-y-2">
              <Label>{`Programa ${idx + 1}`}</Label>
              <Select
                value={(datos as any)[field] || ""}
                onValueChange={val => setDatos({ ...datos, [field]: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar programa" />
                </SelectTrigger>
                <SelectContent>
                  {programas.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.abreviatura} – {p.nombre_del_programa} ({p.meses} meses)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label>{`Duración ${idx + 1} (meses)`}</Label>
              <Input
                type="number"
                value={(datos as any)[`${field}_duracion`] || ""}
                onChange={e => setDatos({ ...datos, [`${field}_duracion`]: e.target.value })}
              />
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-red-600 mt-2">{error}</p>}

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={goPrev}>
          <ArrowLeft className="h-4 w-4" /> Anterior
        </Button>
        <Button
          onClick={handleNext}
          disabled={!isFormValid}
          className={isFormValid ? "bg-green-600 hover:bg-green-700 text-white" : ""}
        >
          Siguiente <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </>
  )
}
