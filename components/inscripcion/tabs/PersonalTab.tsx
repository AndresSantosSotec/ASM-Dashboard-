"use client"

import { useMemo, useEffect } from "react"
import { Search, ArrowRight, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import CountryCombobox from "../CountryCombobox"
import { Label } from "@/components/ui/label"
import { RequiredAsterisk } from "@/components/ui/required-asterisk"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DatosPersonales } from "../types"
import { useCountries } from "@/hooks/useCountries"

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
  const { countries } = useCountries()

  // Set default countries when data is empty
  useEffect(() => {
    if (countries.length > 0) {
      if (!datos.paisOrigen) {
        setDatos((prev) => ({ ...prev, paisOrigen: "Guatemala" }))
      }
      if (!datos.paisResidencia) {
        setDatos((prev) => ({ ...prev, paisResidencia: "Guatemala" }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries])

  // Validación de campos obligatorios con número de identificación alfanumérico
  const isFormValid = useMemo(() => {
    const dpi = (datos.dpi ?? "").trim()
    return (
      (datos.nombre ?? "").trim() !== "" &&
      datos.paisOrigen !== "" &&
      datos.paisResidencia !== "" &&
      (datos.telefono ?? "").trim() !== "" &&
      /^[A-Za-z0-9]+$/.test(dpi) &&
      (datos.emailPersonal ?? "").trim() !== "" &&
      (datos.emailCorporativo ?? "").trim() !== "" &&
      datos.fechaNacimiento !== "" &&
      (datos.direccion ?? "").trim() !== ""
    )
  }, [datos])

  return (
    <TooltipProvider>
      {/* Botón búsqueda de prospecto */}
      <div className="mb-4 flex justify-start">
        <Button variant="outline" onClick={openModal}>
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
          <Label>
            Nombre completo <RequiredAsterisk />
          </Label>
          <Input
            value={datos.nombre || ""}
            onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
            required
          />
        </div>

        {/* País origen / residencia */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>
              País de origen <RequiredAsterisk />
            </Label>
            <CountryCombobox
              countries={countries}
              value={datos.paisOrigen || ""}
              onChange={(v) => setDatos({ ...datos, paisOrigen: v })}
            />
          </div>
          <div className="space-y-2">
            <Label>
              País de residencia <RequiredAsterisk />
            </Label>
            <CountryCombobox
              countries={countries}
              value={datos.paisResidencia || ""}
              onChange={(v) =>
                setDatos({ ...datos, paisResidencia: v })
              }
            />
          </div>
        </div>

        {/* Teléfono */}
        <div className="space-y-2">
          <Label>
            Teléfono móvil <RequiredAsterisk />
          </Label>
          <Input
            value={datos.telefono || ""}
            onChange={(e) =>
              setDatos({ ...datos, telefono: e.target.value })
            }
            required
          />
        </div>

        {/* DPI/Identificación */}
        <div className="space-y-2">
          <Label>
            DPI/Identificación <RequiredAsterisk />
          </Label>
          <Input
            value={datos.dpi || ""}
            onChange={(e) => setDatos({ ...datos, dpi: e.target.value })}
            required
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{(datos.dpi || "").length} caracteres</span>
            {datos.dpi && datos.dpi.length === 13 && /^\d{13}$/.test(datos.dpi) && (
              <span className="text-green-600">DPI válido</span>
            )}
          </div>
        </div>

        {/* Emails */}
        <div className="space-y-2">
          <Label>
            Email personal <RequiredAsterisk />
          </Label>
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Label>
                Email corporativo <RequiredAsterisk />
              </Label>
            </TooltipTrigger>
            <TooltipContent>
              Si no cuentas con un correo corporativo, ingresa el correo personal. Podrás actualizarlo después.
            </TooltipContent>
          </Tooltip>
          <Input
            type="email"
            value={datos.emailCorporativo || ""}
            onChange={(e) =>
              setDatos({ ...datos, emailCorporativo: e.target.value })
            }
            required
          />
        </div>

        {/* Fecha nacimiento */}
        <div className="space-y-2">
          <Label>
            Fecha de nacimiento <RequiredAsterisk />
          </Label>
          <DatePicker
            value={datos.fechaNacimiento}
            onChange={(v) => setDatos({ ...datos, fechaNacimiento: v })}
            captionLayout="dropdown"
            fromYear={1920}
            toYear={new Date().getFullYear()}
          />
        </div>

        {/* Dirección */}
        <div className="space-y-2 md:col-span-2">
          <Label>
            Dirección de residencia <RequiredAsterisk />
          </Label>
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
          className={
            isFormValid
              ? "bg-green-600 hover:bg-green-700 text-white"
              : ""
          }
        >
          Siguiente
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </TooltipProvider>
  )
}
