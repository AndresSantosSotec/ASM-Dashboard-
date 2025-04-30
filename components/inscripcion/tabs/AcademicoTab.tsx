"use client"
import { ArrowLeft, ArrowRight } from "lucide-react"
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
import { DatosAcademicos } from "../types"
import { useEffect, useState } from "react"
import axios from "axios"

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
  /* ——— Listas estáticas ——— */
  const mesesMeses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ]
  const dias = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]
  const titulos = ["diversificado", "tecnico", "licenciatura", "maestria", "doctorado"] as const
  const medios = ["redes", "amigo", "empresa", "evento", "busqueda", "otros"] as const

  /* ——— Estado y fetch de programas ——— */
  const [programas, setProgramas] = useState<Programa[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    axios.get<Programa[]>("http://localhost:8000/api/programas")
      .then(resp => setProgramas(resp.data))
      .catch(err => console.error("❌ Error al obtener programas:", err))
  }, [])

  /* ——— Auto-relleno de duración al cambiar programa ——— */
  useEffect(() => {
    const prog = programas.find(p => p.id.toString() === datos.programa)
    const nuevaDur = prog?.meses.toString() ?? ""
    // sólo actualizamos si es distinto de datos.duracion
    if (nuevaDur && nuevaDur !== datos.duracion) {
      setDatos(prev => ({ ...prev, duracion: nuevaDur }))
    }
  }, [datos.programa, datos.duracion, programas])

  /* ——— Validación antes de avanzar ——— */
  const handleNext = () => {
    if (datos.titulo1 !== datos.programa) {
      setError("El Programa 1 debe coincidir con el Programa principal.")
      return
    }
    if (!datos.titulo1_duracion) {
      setError("Debes especificar la duración de Programa 1.")
      return
    }
    setError(null)
    goNext()
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Programa dinámico + duración */}
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
            onValueChange={v =>
              setDatos({ ...datos, ultimoTitulo: v as DatosAcademicos["ultimoTitulo"] })
            }
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

        {/* Institución anterior */}
        <div className="space-y-2">
          <Label>Institución donde obtuvo su último título *</Label>
          <Input
            value={datos.institucionAnterior}
            onChange={e => setDatos({ ...datos, institucionAnterior: e.target.value })}
            required
          />
        </div>

        {/* Año graduación */}
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
            onValueChange={v =>
              setDatos({ ...datos, diaEstudio: v as DatosAcademicos["diaEstudio"] })
            }
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
            onValueChange={v =>
              setDatos({ ...datos, medioConocio: v as DatosAcademicos["medioConocio"] })
            }
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

        {/* Observaciones */}
        <div className="space-y-2 md:col-span-2">
          <Label>Observaciones</Label>
          <Textarea
            value={datos.observaciones}
            onChange={e => setDatos({ ...datos, observaciones: e.target.value })}
            className="min-h-[80px]"
          />
        </div>

        {/* Cursos aprobados */}
        <div className="space-y-2 md:col-span-2">
          <Label>
            Cant. cursos aprobados (especificar, carrera y universidad)
          </Label>
          <Input
            value={datos.cursosAprobados}
            onChange={e => setDatos({ ...datos, cursosAprobados: e.target.value })}
          />
        </div>

        {/* Bloque 2: Títulos y Duración */}
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

      {/* Navegación */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={goPrev}>
          <ArrowLeft className="h-4 w-4" /> Anterior
        </Button>
        <Button onClick={handleNext}>
          Siguiente <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </>
  )
}
