"use client"
import { Search, ArrowRight } from "lucide-react"

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

  return (
    <>
      {/* Botón búsqueda de prospecto */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={openModal} className="mb-4">
          <Search className="mr-2 h-4 w-4" />
          Buscar prospecto
        </Button>
      </div>

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
              onValueChange={(v) => setDatos({ ...datos, paisResidencia: v })}
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

        {/* Teléfono / DPI */}
        <div className="space-y-2">
          <Label>Teléfono móvil *</Label>
          <Input
            value={datos.telefono || ""}
            onChange={(e) => setDatos({ ...datos, telefono: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>DPI *</Label>
          <Input
            value={datos.dpi || ""}
            onChange={(e) => setDatos({ ...datos, dpi: e.target.value })}
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
        <Button onClick={goNext}>
          Siguiente
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </>
  )
}
