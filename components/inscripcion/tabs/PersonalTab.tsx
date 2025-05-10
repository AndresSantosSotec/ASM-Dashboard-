"use client"
import { useMemo } from "react"
import { Search, ArrowRight, CheckCircle } from "lucide-react"
import Swal from "sweetalert2"

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
import { Textarea } from "@/components/ui/textarea"
import { DatosPersonales } from "../types"

interface Props {
  datos: DatosPersonales
  setDatos: React.Dispatch<React.SetStateAction<DatosPersonales>>
  openModal: () => void
  goNext: () => void
}

export default function PersonalTab({
  datos,
  setDatos,
  openModal,
  goNext,
}: Props) {
  const paises = [
    "Guatemala",
    "El Salvador",
    "Honduras",
    "Nicaragua",
    "Costa Rica",
    "Panamá",
    "México",
  ]

  // Validación de campos obligatorios con DPI de 13 dígitos
  const isFormValid = useMemo(() => {
    const dpi = datos.dpi ?? ""
    return (
      (datos.nombre ?? "").trim() !== "" &&
      datos.paisOrigen !== "" &&
      datos.paisResidencia !== "" &&
      (datos.telefono ?? "").trim() !== "" &&
      /^\d{13}$/.test(dpi) &&
      (datos.emailPersonal ?? "").trim() !== "" &&
      datos.fechaNacimiento !== "" &&
      (datos.direccion ?? "").trim() !== ""
    )
  }, [datos])

  // Función para validar DPI al salir del campo
  const validateDpi = (value: string) => {
    if (value && !/^\d{13}$/.test(value)) {
      Swal.fire({
        title: "DPI inválido",
        text: "El DPI debe contener exactamente 13 dígitos numéricos.",
        icon: "error",
      })
    }
  }

  return (
    <>
      {/* Botón búsqueda de prospecto */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={openModal} className="mb-4">
          <Search className="mr-2 h-4 w-4" />
          Buscar prospecto
        </Button>
      </div>

      {/* Mensaje de éxito cuando el formulario está completo */}
      {isFormValid && (
        <div className="mb-4 flex items-center gap-2 rounded bg-green-100 px-4 py-2 text-green-800">
          <CheckCircle className="h-5 w-5" />
          Todos los campos obligatorios completados
        </div>
      )}

      {/* Formulario */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Nombre completo */}
        <div className="space-y-2">
          <Label>Nombre completo *</Label>
          <Input
            value={datos.nombre || ""}
            onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
            required
          />
        </div>

        {/* País origen / residencia */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>País de origen *</Label>
            <Select
              value={datos.paisOrigen || ""}
              onValueChange={(v) => setDatos({ ...datos, paisOrigen: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {paises.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>País de residencia *</Label>
            <Select
              value={datos.paisResidencia || ""}
              onValueChange={(v) =>
                setDatos({ ...datos, paisResidencia: v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {paises.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Teléfono */}
        <div className="space-y-2">
          <Label>Teléfono móvil *</Label>
          <Input
            value={datos.telefono || ""}
            onChange={(e) =>
              setDatos({ ...datos, telefono: e.target.value })
            }
            required
          />
        </div>

        {/* DPI con validación onBlur */}
        <div className="space-y-2">
          <Label>DPI *</Label>
          <Input
            value={datos.dpi || ""}
            onChange={(e) => setDatos({ ...datos, dpi: e.target.value })}
            onBlur={(e) => validateDpi(e.target.value)}
            required
          />
        </div>

        {/* Emails */}
        <div className="space-y-2">
          <Label>Email personal *</Label>
          <Input
            type="email"
            value={datos.emailPersonal || ""}
            onChange={(e) =>
              setDatos({ ...datos, emailPersonal: e.target.value })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Email corporativo</Label>
          <Input
            type="email"
            value={datos.emailCorporativo || ""}
            onChange={(e) =>
              setDatos({ ...datos, emailCorporativo: e.target.value })
            }
          />
        </div>

        {/* Fecha nacimiento */}
        <div className="space-y-2">
          <Label>Fecha de nacimiento *</Label>
          <Input
            type="date"
            value={datos.fechaNacimiento || ""}
            onChange={(e) =>
              setDatos({ ...datos, fechaNacimiento: e.target.value })
            }
            required
          />
        </div>

        {/* Dirección */}
        <div className="space-y-2 md:col-span-2">
          <Label>Dirección de residencia *</Label>
          <Textarea
            value={datos.direccion || ""}
            onChange={(e) =>
              setDatos({ ...datos, direccion: e.target.value })
            }
            required
          />
        </div>
      </div>

      {/* Navegación */}
      <div className="flex justify-end mt-6">
        <Button
          onClick={goNext}
          disabled={!isFormValid}
          className={isFormValid ? "bg-green-600 hover:bg-green-700 text-white" : ""}
        >
          Siguiente
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </>
  )
}
