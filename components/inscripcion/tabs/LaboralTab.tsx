"use client"

import { useEffect, useRef, useState, useMemo } from "react"
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
import { DatosLaborales } from "../types"

interface Props {
  datos:    DatosLaborales
  setDatos: React.Dispatch<React.SetStateAction<DatosLaborales>>
  goPrev:   () => void
  goNext:   () => void
}

export default function LaboralTab({ datos, setDatos, goPrev, goNext }: Props) {
  const mountedRef = useRef(false)

  // Sólo cargamos departamentos
  const [departamentos, setDepartamentos] = useState<
    { id: number; nombre: string }[]
  >([])

  // Validación de campos obligatorios
  const isFormValid = useMemo(() => {
    return (
      (datos.empresa ?? "").trim() !== "" &&
      (datos.puesto ?? "").trim() !== "" &&
      (datos.departamento ?? "").trim() !== "" &&
      (datos.direccionEmpresa ?? "").trim() !== ""
    )
  }, [datos])

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true

      // Inicializar campos existentes
      setDatos({
        empresa:             datos.empresa || "",
        puesto:              datos.puesto || "",
        telefonoCorporativo: datos.telefonoCorporativo || "",
        departamento:        datos.departamento || "",
        sectorEmpresa:       datos.sectorEmpresa || "",
        direccionEmpresa:    datos.direccionEmpresa || "",
      })

      // Cargar departamentos desde API
        axios
          .get(`${API_BASE_URL}/api/ubicacion/1`)
        .then((resp) => {
          const deps = resp.data.departamentos.map((d: any) => ({
            id: d.id,
            nombre: d.nombre,
          }))
          setDepartamentos(deps)
        })
        .catch((err) => console.error("Error cargando departamentos:", err))
    }
  }, [datos, setDatos])

  const handleDepartamentoChange = (value: string) => {
    setDatos({ ...datos, departamento: value })
  }

  return (
    <>
      {/* Mensaje de éxito cuando el formulario está completo */}
      {isFormValid && (
        <div className="mb-4 flex items-center gap-2 rounded bg-green-100 px-4 py-2 text-green-800">
          <CheckCircle className="h-5 w-5" />
          Todos los campos obligatorios completados
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Empresa */}
        <div className="space-y-2">
          <Label>Empresa en donde labora *</Label>
          <Input
            value={datos.empresa || ""}
            onChange={(e) => setDatos({ ...datos, empresa: e.target.value })}
            placeholder="Nombre de la empresa"
            required
          />
        </div>

        {/* Puesto */}
        <div className="space-y-2">
          <Label>Puesto de trabajo *</Label>
          <Input
            value={datos.puesto || ""}
            onChange={(e) => setDatos({ ...datos, puesto: e.target.value })}
            placeholder="Cargo actual"
            required
          />
        </div>

        {/* Teléfono corporativo */}
        <div className="space-y-2">
          <Label>Teléfono corporativo</Label>
          <Input
            value={datos.telefonoCorporativo || ""}
            onChange={(e) =>
              setDatos({ ...datos, telefonoCorporativo: e.target.value })
            }
            placeholder="Teléfono de la empresa"
          />
        </div>

        {/* Departamento dinámico */}
        <div className="space-y-2">
          <Label>Departamento *</Label>
          <Select
            value={datos.departamento || ""}
            onValueChange={handleDepartamentoChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar departamento" />
            </SelectTrigger>
            <SelectContent>
              {departamentos.map((dept) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dirección de la empresa */}
        <div className="space-y-2 md:col-span-2">
          <Label>Dirección de la empresa *</Label>
          <Textarea
            value={datos.direccionEmpresa || ""}
            onChange={(e) =>
              setDatos({ ...datos, direccionEmpresa: e.target.value })
            }
            placeholder="Dirección completa de la empresa"
            className="min-h-[80px]"
            required
          />
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between mt-6 space-y-4 space-y-reverse sm:space-y-0 sm:space-x-4">
        <Button variant="outline" onClick={goPrev}>
          <ArrowLeft className="h-4 w-4" /> Anterior
        </Button>
        <Button
          onClick={goNext}
          disabled={!isFormValid}
          className={
            isFormValid
              ? "bg-green-600 hover:bg-green-700 text-white"
              : ""
          }
        >
          Siguiente <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </>
  )
}
