"use client"

import { Handshake, Settings, ToggleLeft, ToggleRight, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Convenio } from "@/types/convenios"

interface Props {
  convenio: Convenio
  onEditar: () => void
  onToggleActivo: () => void
  onEliminar: () => void
}

export default function ConvenioCard({ convenio, onEditar, onToggleActivo, onEliminar }: Props) {
  const totalProgramas = convenio.precios_por_programa?.length ?? 0

  const inversionTotal = convenio.precios_por_programa?.reduce(
    (acc, p) => acc + Number(p.cuota_mensual) * p.meses + Number(p.inscripcion),
    0,
  ) ?? 0

  return (
    <div
      className={`bg-white rounded-xl border transition-all hover:shadow-md ${
        convenio.activo ? "border-gray-100" : "border-gray-200 opacity-70"
      }`}
    >
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-gray-50">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#0f2744]/10 flex items-center justify-center flex-shrink-0">
              <Handshake className="h-4 w-4 sm:h-5 sm:w-5 text-[#0f2744]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-sm truncate">{convenio.nombre}</h3>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                {convenio.descripcion ?? "Sin descripción"}
              </p>
            </div>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
              convenio.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            {convenio.activo ? "Activo" : "Inactivo"}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 sm:px-5 py-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-500">Programas</p>
          <p className="font-bold text-lg text-[#0f2744]">{totalProgramas}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Inversión promedio</p>
          <p className="font-bold text-sm text-green-700">
            {totalProgramas > 0
              ? `Q${(inversionTotal / totalProgramas).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`
              : "—"}
          </p>
        </div>
      </div>

      {/* Preview de programas */}
      {totalProgramas > 0 && (
        <div className="px-4 sm:px-5 pb-3">
          <div className="flex flex-wrap gap-1">
            {convenio.precios_por_programa.slice(0, 3).map((p) => (
              <span
                key={p.programa_id}
                className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full truncate max-w-[120px] sm:max-w-[150px]"
              >
                {p.programa?.nombre_del_programa}
              </span>
            ))}
            {totalProgramas > 3 && (
              <span className="text-xs text-gray-400 px-2 py-0.5">+{totalProgramas - 3} más</span>
            )}
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="px-4 sm:px-5 pb-4 flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={onEditar} className="flex-1 text-xs">
          <Settings className="h-3.5 w-3.5 mr-1" />
          Gestionar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onToggleActivo}
          className={`text-xs ${
            convenio.activo
              ? "text-red-600 hover:text-red-700 hover:bg-red-50"
              : "text-green-600 hover:text-green-700 hover:bg-green-50"
          }`}
        >
          {convenio.activo ? (
            <>
              <ToggleLeft className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Desactivar</span>
            </>
          ) : (
            <>
              <ToggleRight className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Activar</span>
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onEliminar}
          className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2"
          title="Eliminar convenio"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
