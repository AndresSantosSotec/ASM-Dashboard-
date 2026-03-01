"use client"
import { useEffect, useState, useMemo, useRef } from "react"
import { ArrowLeft, ArrowRight, CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SimpleDatePicker } from "@/components/ui/simple-date-picker"
import { Label } from "@/components/ui/label"
import { RequiredAsterisk } from "@/components/ui/required-asterisk"
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

  // 🔥 Días disponibles (para seleccionar varios)
  const diasDisponibles = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado","domingo"]

  const titulos = ["diversificado", "tecnico", "licenciatura", "maestria", "doctorado", "cierre_pensum", "Carrera Universitaria Incompleta"] as const
  const medios = [
    "facebook",
    "instagram",
    "linkedin",
    "referido",
    "whatsapp_corporativo",
    "pagina_web",
    "actividades_escritorio",
    "meeting",
    "otros",
  ] as const

  const medioLabels: Record<string, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    referido: "Referido",
    whatsapp_corporativo: "WhatsApp Corporativo",
    pagina_web: "Página Web",
    actividades_escritorio: "Actividades de Escritorio",
    meeting: "Meeting",
    otros: "Otros",
  }

  const [programas, setProgramas] = useState<Programa[]>([])
  const programasUnicos = useMemo(() => {
    const map = new Map<string, Programa>()
    programas.forEach((p) => {
      const key = `${p.abreviatura}-${p.nombre_del_programa}`
      if (!map.has(key)) map.set(key, p)
    })
    return Array.from(map.values())
  }, [programas])

  const [error, setError] = useState<string | null>(null)

  const userEditedDuration = useRef(false)
  const lastProgramaId = useRef(datos.programa)
  const lastDuracion = useRef(datos.duracion)
  const lastTitulo2 = useRef(datos.titulo2)
  const lastTitulo3 = useRef(datos.titulo3)

  // Cargar programas
  useEffect(() => {
    axios
      .get<Programa[]>(`${API_BASE_URL}/api/programas`)
      .then((resp) => setProgramas(resp.data))
      .catch((err) => console.error("❌ Error al obtener programas:", err))
  }, [])

  // Actualizar duración solo cuando el usuario cambia el programa (no al cargar desde API, para respetar la duración guardada del prospecto)
  useEffect(() => {
    if (!datos.programa) return
    const programaCambio = datos.programa !== lastProgramaId.current
    if (!programaCambio && userEditedDuration.current) return
    if (programaCambio) {
      const cargaInicial = lastProgramaId.current === "" || lastProgramaId.current === undefined
      lastProgramaId.current = datos.programa
      userEditedDuration.current = false
      if (cargaInicial) return // Carga desde prospecto/API: no pisar duración con la estándar del programa
    }
    const prog = programasUnicos.find((p) => p.id.toString() === datos.programa)
    const nuevaDur = prog?.meses.toString() ?? ""
    if (nuevaDur) {
      setDatos((prev) => ({ ...prev, duracion: nuevaDur, titulo1_duracion: nuevaDur }))
    }
  }, [datos.programa, programasUnicos, setDatos])

  // Programa 1 = programa principal
  useEffect(() => {
    if (datos.programa && datos.titulo1 !== datos.programa) {
      setDatos((prev) => ({ ...prev, titulo1: datos.programa }))
    }
  }, [datos.programa, datos.titulo1, setDatos])

  // Cuando cambia "Duración (meses)" (ej. el usuario escribe ahí), actualizar también "Duración 1 (meses)"
  useEffect(() => {
    if (datos.duracion === lastDuracion.current) return
    lastDuracion.current = datos.duracion
    if (datos.duracion) {
      setDatos((prev) => ({ ...prev, titulo1_duracion: datos.duracion }))
    }
  }, [datos.duracion, datos.titulo1_duracion, setDatos])

  // Actualizar duración de programa 2 solo cuando el usuario cambia el programa (no al cargar desde API)
  useEffect(() => {
    if (!datos.titulo2) return
    const cambio = datos.titulo2 !== lastTitulo2.current
    if (cambio) {
      const cargaInicial = lastTitulo2.current === "" || lastTitulo2.current === undefined
      lastTitulo2.current = datos.titulo2
      if (cargaInicial) return
    } else return
    const prog = programasUnicos.find((p) => p.id.toString() === datos.titulo2)
    if (prog) setDatos((prev) => ({ ...prev, titulo2_duracion: prog.meses.toString() }))
  }, [datos.titulo2, programasUnicos, setDatos])

  // Actualizar duración de programa 3 solo cuando el usuario cambia el programa (no al cargar desde API)
  useEffect(() => {
    if (!datos.titulo3) return
    const cambio = datos.titulo3 !== lastTitulo3.current
    if (cambio) {
      const cargaInicial = lastTitulo3.current === "" || lastTitulo3.current === undefined
      lastTitulo3.current = datos.titulo3
      if (cargaInicial) return
    } else return
    const prog = programasUnicos.find((p) => p.id.toString() === datos.titulo3)
    if (prog) setDatos((prev) => ({ ...prev, titulo3_duracion: prog.meses.toString() }))
  }, [datos.titulo3, programasUnicos, setDatos])

  // 🔥 Validación del formulario
  const isFormValid = useMemo(() => {
    const baseValidation =
      !!datos.programa &&
      !!datos.ultimoTitulo &&
      datos.institucionAnterior.trim().length > 0 &&
      !!datos.modalidad &&
      !!datos.fechaInicio &&
      !!datos.diaEstudio && // (validamos que existan días, aunque sean varios)
      !!datos.fechaInicioEspecifica &&
      !!datos.fechaTallerInduccion &&
      !!datos.fechaTallerIntegracion &&
      !!datos.medioConocio &&
      datos.titulo1 === datos.programa &&
      datos.titulo1_duracion.trim().length > 0

    // Si es cierre de pénsum -> carrera obligatoria
    if (datos.ultimoTitulo === "cierre_pensum") {
      return baseValidation && (datos.carrera?.trim().length || 0) > 0
    }

    // Año de graduación OPCIONAL
    return baseValidation
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

  // 🔥 Manejar selección múltiple de días de estudio
  const toggleDia = (dia: string) => {
    let seleccionados = datos.diaEstudio ? datos.diaEstudio.split(", ") : []

    if (seleccionados.includes(dia)) {
      seleccionados = seleccionados.filter((d) => d !== dia)
    } else {
      seleccionados.push(dia)
    }

    setDatos({ ...datos, diaEstudio: seleccionados.join(", ") })
  }

  return (
    <>
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
            <Label>
              Programa <RequiredAsterisk />
            </Label>
            <Select
              value={datos.programa}
              onValueChange={(v) => setDatos({ ...datos, programa: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar programa" />
              </SelectTrigger>
              <SelectContent>
                {programasUnicos.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.abreviatura} – {p.nombre_del_programa}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 space-y-2">
            <Label>Duración (meses)</Label>
            <Input
              type="number"
              value={datos.duracion}
              onChange={(e) => {
                userEditedDuration.current = true
                setDatos({ ...datos, duracion: e.target.value })
              }}
              placeholder="Meses"
            />
          </div>
        </div>

        {/* Último título */}
        <div className="space-y-2">
          <Label>
            Último título obtenido <RequiredAsterisk />
          </Label>
          <Select
            value={datos.ultimoTitulo}
            onValueChange={(v) => setDatos({ ...datos, ultimoTitulo: v as any })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar título" />
            </SelectTrigger>
            <SelectContent>
              {titulos.map((t) => (
                <SelectItem key={t} value={t}>
                  {t === "cierre_pensum"
                    ? "Cierre de Pénsum"
                    : t.charAt(0).toUpperCase() + t.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Institución */}
        <div className="space-y-2">
          <Label>
            Institución <RequiredAsterisk />
          </Label>
          <Input
            value={datos.institucionAnterior}
            onChange={(e) => setDatos({ ...datos, institucionAnterior: e.target.value })}
          />
        </div>

        {/* Carrera del último título obtenido */}
        <div className="space-y-2">
          <Label>
            Carrera del último título {datos.ultimoTitulo === "cierre_pensum" ? <RequiredAsterisk /> : "(opcional)"}
          </Label>
          <Input
            value={datos.carrera || ""}
            onChange={(e) => setDatos({ ...datos, carrera: e.target.value })}
            placeholder="Ej: Administración de Empresas, Ingeniería, etc."
          />
        </div>

        {/* Año graduación OPCIONAL */}
        {datos.ultimoTitulo !== "cierre_pensum" && (
          <div className="space-y-2">
            <Label>Año de graduación (opcional)</Label>
            <Input
              type="number"
              min={1950}
              max={new Date().getFullYear()}
              value={datos.añoGraduacion}
              onChange={(e) => setDatos({ ...datos, añoGraduacion: e.target.value })}
            />
          </div>
        )}

        {/* Modalidad */}
        <div className="space-y-2">
          <Label>
            Modalidad <RequiredAsterisk />
          </Label>
          <Select
            value={datos.modalidad}
            onValueChange={(v) => setDatos({ ...datos, modalidad: v as any })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar modalidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sincronica">Sincrónica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mes inicio */}
        <div className="space-y-2">
          <Label>
            Mes de inicio <RequiredAsterisk />
          </Label>
          <Select
            value={datos.fechaInicio}
            onValueChange={(v) => setDatos({ ...datos, fechaInicio: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar mes" />
            </SelectTrigger>
            <SelectContent>
              {mesesMeses.map((m) => (
                <SelectItem key={m} value={m}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 🔥 MULTI SELECT PARA DÍAS DE ESTUDIO */}
        <div className="space-y-2">
          <Label>
            Días que estudiará <RequiredAsterisk />
          </Label>

          <div className="grid grid-cols-2 gap-2 border p-3 rounded-md">
            {diasDisponibles.map((dia) => {
              const seleccionados = datos.diaEstudio ? datos.diaEstudio.split(", ") : []
              const activo = seleccionados.includes(dia)

              return (
                <button
                  type="button"
                  key={dia}
                  onClick={() => toggleDia(dia)}
                  className={`text-sm p-2 rounded border ${
                    activo
                      ? "bg-blue-600 text-white border-blue-700"
                      : "bg-white border-gray-300 text-gray-700"
                  }`}
                >
                  {dia.charAt(0).toUpperCase() + dia.slice(1)}
                </button>
              )
            })}
          </div>

          <p className="text-xs text-gray-500">
            Seleccionados: {datos.diaEstudio || "Ninguno"}
          </p>
        </div>

        {/* Fechas */}
        <div className="space-y-2">
          <Label>
            Fecha de inicio específica <RequiredAsterisk />
          </Label>
          <SimpleDatePicker
            value={datos.fechaInicioEspecifica}
            onChange={(v) => setDatos({ ...datos, fechaInicioEspecifica: v })}
          />
        </div>

        <div className="space-y-2">
          <Label>
            Fecha taller de inducción <RequiredAsterisk />
          </Label>
          <SimpleDatePicker
            value={datos.fechaTallerInduccion}
            onChange={(v) => setDatos({ ...datos, fechaTallerInduccion: v })}
          />
        </div>

        <div className="space-y-2">
          <Label>
            Fecha taller de integración <RequiredAsterisk />
          </Label>
          <SimpleDatePicker
            value={datos.fechaTallerIntegracion}
            onChange={(v) => setDatos({ ...datos, fechaTallerIntegracion: v })}
          />
        </div>

        {/* Medio conoció */}
        <div className="space-y-2">
          <Label>
            ¿Cómo conoció ASM? <RequiredAsterisk />
          </Label>
          <Select
            value={datos.medioConocio}
            onValueChange={(v) => setDatos({ ...datos, medioConocio: v as any })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar medio" />
            </SelectTrigger>
            <SelectContent>
              {medios.map((m) => (
                <SelectItem key={m} value={m}>
                  {medioLabels[m] || m}
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
            onChange={(e) => setDatos({ ...datos, observaciones: e.target.value })}
            className="min-h-[80px]"
          />
        </div>

        {/* Cursos opcionales */}
        <div className="space-y-2 md:col-span-2">
          <Label>Cursos aprobados (opcional)</Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={datos.cursosAprobados}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "") // ← permite solo números
                  setDatos({ ...datos, cursosAprobados: value })
                }}
                placeholder="Ej: 5"
              />
        </div>

        {/* Programas adicionales */}
        {["titulo1", "titulo2", "titulo3"].map((field, idx) => {
          const programaValue = (datos as any)[field] || ""
          const duracionValue = (datos as any)[`${field}_duracion`] || ""
          const isProgramaSeleccionado = programaValue !== ""

          return (
            <div className="flex space-x-4 items-end" key={field}>
              <div className="flex-1 space-y-2">
                <Label>{`Programa ${idx + 1}${idx === 0 ? " (Principal)" : ""}`}</Label>

                <Select
                  value={programaValue}
                  onValueChange={(val) => {
                    const prog = programasUnicos.find((p) => p.id.toString() === val)
                    setDatos((prev) => ({
                      ...prev,
                      [field]: val,
                      [`${field}_duracion`]: prog?.meses.toString() || "",
                    }))
                  }}
                  disabled={idx === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar programa" />
                  </SelectTrigger>
                  <SelectContent>
                    {programasUnicos.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.abreviatura} – {p.nombre_del_programa}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 space-y-2">
                <Label>{`Duración ${idx + 1} (meses)`}</Label>
                <Input
                  type="number"
                  value={duracionValue}
                  onChange={(e) =>
                    setDatos({ ...datos, [`${field}_duracion`]: e.target.value })
                  }
                />
              </div>

              {idx > 0 && isProgramaSeleccionado && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 mb-2"
                  onClick={() =>
                    setDatos((prev) => ({
                      ...prev,
                      [field]: "",
                      [`${field}_duracion`]: "",
                    }))
                  }
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          )
        })}
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
