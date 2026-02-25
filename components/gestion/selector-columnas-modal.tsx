"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Settings2, Eye, EyeOff } from "lucide-react"

interface Columna {
  key: string
  label: string
  tipo: "base" | "extra"
  visible: boolean
  orden: number
}

interface ColumnasData {
  base: Columna[]
  extra: Columna[]
}

interface SelectorColumnasModalProps {
  open: boolean
  onClose: () => void
  columnasDisponibles: ColumnasData | null
  columnasSeleccionadas: string[]
  onChange: (columnas: string[]) => void
}

export default function SelectorColumnasModal({
  open,
  onClose,
  columnasDisponibles,
  columnasSeleccionadas,
  onChange,
}: SelectorColumnasModalProps) {
  const [tempSeleccion, setTempSeleccion] = useState<string[]>([])

  // Inicializar selección temporal cuando se abre el modal
  useEffect(() => {
    if (open) {
      setTempSeleccion(columnasSeleccionadas)
    }
  }, [open, columnasSeleccionadas])

  // Toggle individual de columna
  const toggleColumna = (key: string, esBase: boolean) => {
    // Las columnas base no se pueden desactivar
    if (esBase) return

    if (tempSeleccion.includes(key)) {
      setTempSeleccion(tempSeleccion.filter((k) => k !== key))
    } else {
      setTempSeleccion([...tempSeleccion, key])
    }
  }

  // Seleccionar/Deseleccionar todas las extras
  const toggleTodasExtras = () => {
    if (!columnasDisponibles) return

    const extrasKeys = columnasDisponibles.extra.map((c) => c.key)
    const todasExtrasSeleccionadas = extrasKeys.every((k) => tempSeleccion.includes(k))

    if (todasExtrasSeleccionadas) {
      // Deseleccionar todas las extras (mantener solo las base)
      const baseKeys = columnasDisponibles.base.map((c) => c.key)
      setTempSeleccion(baseKeys)
    } else {
      // Seleccionar todas
      const baseKeys = columnasDisponibles.base.map((c) => c.key)
      setTempSeleccion([...baseKeys, ...extrasKeys])
    }
  }

  // Aplicar cambios
  const handleAplicar = () => {
    onChange(tempSeleccion)
    onClose()
  }

  // Resetear a valores por defecto (solo columnas base)
  const handleResetear = () => {
    if (!columnasDisponibles) return
    const baseKeys = columnasDisponibles.base.map((c) => c.key)
    setTempSeleccion(baseKeys)
  }

  if (!columnasDisponibles) return null

  const extrasKeys = columnasDisponibles.extra.map((c) => c.key)
  const todasExtrasSeleccionadas = extrasKeys.length > 0 && extrasKeys.every((k) => tempSeleccion.includes(k))
  const countSeleccionadas = tempSeleccion.length
  const countTotal = columnasDisponibles.base.length + columnasDisponibles.extra.length

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-blue-600" />
            <DialogTitle>Configurar Columnas Visibles</DialogTitle>
          </div>
          <DialogDescription>
            Selecciona qué columnas deseas ver en la tabla de prospectos. Las columnas base siempre estarán visibles.
          </DialogDescription>
        </DialogHeader>

        {/* Contador y acciones rápidas */}
        <div className="flex items-center justify-between py-2 px-1 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-800">{countSeleccionadas}</span> de {countTotal} columnas seleccionadas
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={toggleTodasExtras}>
              {todasExtrasSeleccionadas ? (
                <>
                  <EyeOff className="h-4 w-4 mr-1" />
                  Ocultar extras
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  Mostrar todas
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetear}>
              Resetear
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[450px] pr-4">
          <div className="space-y-6">
            {/* COLUMNAS BASE */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Campos Base
                </Label>
                <span className="text-xs text-gray-500">(siempre visibles)</span>
              </div>
              <div className="space-y-2 pl-2">
                {columnasDisponibles.base.map((columna) => (
                  <div
                    key={columna.key}
                    className="flex items-center gap-3 p-2 rounded-md bg-blue-50 border border-blue-100"
                  >
                    <Checkbox
                      checked={true}
                      disabled={true}
                      className="opacity-50"
                    />
                    <Label className="text-sm font-medium text-gray-700 cursor-not-allowed flex-1">
                      {columna.label}
                    </Label>
                    <span className="text-xs text-blue-600 font-medium">FIJO</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* COLUMNAS EXTRAS */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Campos de Plantilla
                </Label>
                <span className="text-xs text-gray-500">
                  ({columnasDisponibles.extra.length} disponibles)
                </span>
              </div>
              <div className="space-y-1.5 pl-2">
                {columnasDisponibles.extra.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No hay campos extra configurados</p>
                ) : (
                  columnasDisponibles.extra.map((columna) => {
                    const isChecked = tempSeleccion.includes(columna.key)
                    return (
                      <div
                        key={columna.key}
                        className={`flex items-center gap-3 p-2.5 rounded-md border cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-green-50 border-green-200 hover:bg-green-100"
                            : "bg-white border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => toggleColumna(columna.key, false)}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleColumna(columna.key, false)}
                        />
                        <Label className="text-sm text-gray-700 cursor-pointer flex-1">
                          {columna.label}
                        </Label>
                        {isChecked && (
                          <Eye className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleAplicar} className="bg-blue-600 hover:bg-blue-700">
            Aplicar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
