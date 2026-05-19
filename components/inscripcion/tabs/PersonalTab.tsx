"use client"

import { useMemo, useEffect } from "react"
import { Search, ArrowRight, CheckCircle, Info as InfoIcon, Loader2, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SimpleDatePicker } from "@/components/ui/simple-date-picker"
import CountryCombobox from "../CountryCombobox"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RequiredAsterisk } from "@/components/ui/required-asterisk"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

import { DatosPersonales } from "../types"
import { useCountries } from "@/hooks/useCountries"
import { useDuplicateProspectCheck, DuplicateProspect } from "@/hooks/useDuplicateProspectCheck"
import DuplicateProspectAlert from "../DuplicateProspectAlert"

interface Props {
  datos: DatosPersonales
  setDatos: React.Dispatch<React.SetStateAction<DatosPersonales>>
  openModal: () => void
  goNext: () => void
  prospectoId: number | null
  onDuplicateSelect: (dup: DuplicateProspect) => void
}

export default function PersonalTab({
  datos,
  setDatos,
  openModal,
  goNext,
  prospectoId,
  onDuplicateSelect,
}: Props) {
  const { countries } = useCountries()

  // 🔍 Detección de prospectos duplicados
  const {
    duplicates,
    loading: duplicateLoading,
    dismissed: duplicateDismissed,
    dismiss: dismissDuplicates,
    hasDuplicates,
    hasChecked: duplicateChecked,
    clearDuplicates,
  } = useDuplicateProspectCheck({
    nombre: datos.nombre,
    telefono: datos.telefono,
    dpi: datos.dpi,
    skipIfProspectoSelected: !!prospectoId,
  })

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

  // Validación de campos obligatorios - DPI puede ser cualquier longitud
// Validación de campos obligatorios - DPI puede ser cualquier longitud >= 5
  const isFormValid = useMemo(() => {
    const dpi = (datos.dpi ?? "").trim()
    return (
      (datos.nombre ?? "").trim() !== "" &&
      datos.paisOrigen !== "" &&
      datos.paisResidencia !== "" &&
      (datos.telefono ?? "").trim() !== "" &&
      /^\d+$/.test(dpi) && // Solo números
      dpi.length >= 5 && // ✅ Mínimo 5 dígitos
      // ❌ REMOVIDO: dpi.length <= 13 (ya no hay límite máximo)
      (datos.emailPersonal ?? "").trim() !== "" &&
      (datos.emailCorporativo ?? "").trim() !== "" &&
      datos.fechaNacimiento !== "" &&
      (datos.direccion ?? "").trim() !== ""
    )
  }, [datos])
  return (
    <TooltipProvider>

      {/* Alerta cuando NO hay prospecto seleccionado */}
      {!datos.nombre && !datos.dpi && (
        <Alert variant="default" className="mb-4 border-blue-300 bg-blue-50 text-blue-800">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Debe seleccionar un prospecto</AlertTitle>
          <AlertDescription>
            Para continuar con el llenado de la ficha, primero debe buscar y seleccionar un prospecto.
          </AlertDescription>
        </Alert>
      )}

      {/* Botón búsqueda de prospecto */}
      <div className="mb-4 flex justify-start">
        <Button variant="outline" onClick={openModal}>
          <Search className="mr-2 h-4 w-4" />
          Buscar prospecto
        </Button>
      </div>

      {/* 🔍 Alerta de prospectos duplicados */}
      {hasDuplicates && (
        <DuplicateProspectAlert
          duplicates={duplicates}
          onSelect={(dup) => {
            onDuplicateSelect(dup)
            clearDuplicates()
          }}
          onDismiss={dismissDuplicates}
          loading={duplicateLoading}
        />
      )}

      {/* Indicador de búsqueda de duplicados en progreso */}
      {duplicateLoading && !hasDuplicates && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600 animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verificando si existe un prospecto registrado anteriormente...
        </div>
      )}

      {/* Indicador de que no se encontraron duplicados (solo si ya verificó) */}
      {!duplicateLoading && !hasDuplicates && !prospectoId && duplicateChecked &&
        duplicates.length === 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          <ShieldCheck className="h-4 w-4" />
          No se encontraron prospectos similares registrados anteriormente.
        </div>
      )}

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
              onChange={(v) => setDatos({ ...datos, paisResidencia: v })}
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
            onChange={(e) => setDatos({ ...datos, telefono: e.target.value })}
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
            onChange={(e) => {
              // Eliminar todo lo que no sea número
              const soloNumeros = e.target.value.replace(/[^0-9]/g, "")
              setDatos({ ...datos, dpi: soloNumeros })
            }}
            placeholder="Ingresa solo números, sin guiones ni espacios"
            inputMode="numeric"
            pattern="[0-9]*"
            required
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{(datos.dpi || "").length} caracteres</span>
            {datos.dpi && (
              <>
                {datos.dpi.length === 13 && /^\d{13}$/.test(datos.dpi) ? (
                  <span className="text-green-600">✓ DPI guatemalteco válido</span>
                ) : datos.dpi.length >= 5 ? (
                  <span className="text-blue-600">
                    {datos.dpi.length > 13 
                      ? "✓ Documento de identificación extranjero" 
                      : datos.dpi.length < 13 
                        ? `Faltan ${13 - datos.dpi.length} dígitos para DPI guatemalteco` 
                        : ""}
                  </span>
                ) : (
                  <span className="text-red-600">Mínimo 5 dígitos</span>
                )}
              </>
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
            onChange={(e) => setDatos({ ...datos, emailPersonal: e.target.value })}
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
          <SimpleDatePicker
            value={datos.fechaNacimiento}
            onChange={(v) => setDatos({ ...datos, fechaNacimiento: v })}
            placeholder="Seleccionar fecha de nacimiento"
          />
        </div>

        {/* Reinscripción */}
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="esReinscripcion"
              checked={datos.esReinscripcion || false}
              onCheckedChange={(checked) => {
                const isChecked = checked as boolean
                setDatos({
                  ...datos,
                  esReinscripcion: isChecked,
                  // Si se activa reinscripción, desactivar doble titulación (son mutuamente excluyentes)
                  esDobleTitulacion: isChecked ? false : datos.esDobleTitulacion,
                })
              }}
            />
            <Label htmlFor="esReinscripcion" className="cursor-pointer">
              Es Reinscripción
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Marque esta casilla si el estudiante ya estuvo inscrito anteriormente y se está reinscribiendo a un nuevo programa.
            Al marcar esta opción, se mantendrá su plan de pagos anterior y se creará uno nuevo para el programa actual.
          </p>
        </div>

        {/* Doble / Triple Titulación */}
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="esDobleTitulacion"
              checked={datos.esDobleTitulacion || false}
              disabled={datos.esReinscripcion === true}
              onCheckedChange={(checked) => {
                const isChecked = checked as boolean
                setDatos({
                  ...datos,
                  esDobleTitulacion: isChecked,
                  // Si se activa doble titulación, desactivar reinscripción
                  esReinscripcion: isChecked ? false : datos.esReinscripcion,
                })
              }}
            />
            <Label
              htmlFor="esDobleTitulacion"
              className={`cursor-pointer ${datos.esReinscripcion ? "text-muted-foreground" : ""}`}
            >
              Es Doble / Triple Titulación
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Marque esta casilla si el estudiante se inscribe a 2 o 3 programas simultáneamente (inscripción múltiple).
            El sistema detecta automáticamente si es <strong>Doble</strong> (2 programas) o <strong>Triple</strong> (3 programas) según cuántos estén completos en el tab académico.
            {datos.esReinscripcion && (
              <span className="text-amber-600 font-medium"> (Desactivado: no compatible con Reinscripción)</span>
            )}
          </p>
        </div>

        {/* Dirección */}
        <div className="space-y-2 md:col-span-2">
          <Label>
            Dirección de residencia <RequiredAsterisk />
          </Label>
          <Textarea
            value={datos.direccion || ""}
            onChange={(e) => setDatos({ ...datos, direccion: e.target.value })}
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
    </TooltipProvider>
  )
}