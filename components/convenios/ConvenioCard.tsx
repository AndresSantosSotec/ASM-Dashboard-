"use client"

import { Handshake, Settings, ToggleLeft, ToggleRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Convenio } from "@/types/convenios"

interface Props {
  convenio: Convenio
  onEditar: () => void
  onToggleActivo: () => void
}

export default function ConvenioCard({ convenio, onEditar, onToggleActivo }: Props) {
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
      <div className="p-5 border-b border-gray-50">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f2744]/10 flex items-center justify-center flex-shrink-0">
              <Handshake className="h-5 w-5 text-[#0f2744]" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{convenio.nombre}</h3>
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
      <div className="px-5 py-3 grid grid-cols-2 gap-3">
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
        <div className="px-5 pb-3">
          <div className="flex flex-wrap gap-1">
            {convenio.precios_por_programa.slice(0, 3).map((p) => (
              <span
                key={p.programa_id}
                className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
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
      <div className="px-5 pb-4 flex items-center gap-2">
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
              Desactivar
            </>
          ) : (
            <>
              <ToggleRight className="h-3.5 w-3.5 mr-1" />
              Activar
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
