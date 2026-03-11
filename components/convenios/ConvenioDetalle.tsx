"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Pencil, Handshake } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchConvenio } from "@/services/convenios"
import type { Convenio, Programa } from "@/types/convenios"
import TablaPreciosPrograma from "./TablaPreciosPrograma"
import ModalEditarConvenio from "./ModalEditarConvenio"

interface Props {
  convenio: Convenio
  onClose: () => void
  onActualizado: () => void
}

export default function ConvenioDetalle({ convenio: convenioProp, onClose, onActualizado }: Props) {
  const [convenio, setConvenio] = useState<Convenio>(convenioProp)
  const [programasDisponibles, setProgramasDisponibles] = useState<Programa[]>([])
  const [loading, setLoading] = useState(true)
  const [modalEditar, setModalEditar] = useState(false)

  const cargarDetalle = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchConvenio(convenioProp.id)
      setConvenio(data.convenio)
      setProgramasDisponibles(data.programas_disponibles)
    } catch (e) {
      console.error("Error al cargar detalle:", e)
    } finally {
      setLoading(false)
    }
  }, [convenioProp.id])

  useEffect(() => {
    cargarDetalle()
  }, [cargarDetalle])

  const handleActualizado = () => {
    cargarDetalle()
    onActualizado()
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Panel lateral */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-3xl bg-white shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f2744]/10 flex items-center justify-center">
              <Handshake className="h-5 w-5 text-[#0f2744]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0f2744]">{convenio.nombre}</h2>
              <p className="text-xs text-gray-500">
                {convenio.descripcion || "Sin descripción"} •{" "}
                <span className={convenio.activo ? "text-green-600" : "text-gray-400"}>
                  {convenio.activo ? "Activo" : "Inactivo"}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setModalEditar(true)} className="text-xs">
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Editar Info
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-4">
              <div className="h-8 bg-gray-100 rounded animate-pulse w-48" />
              <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
            </div>
          ) : (
            <TablaPreciosPrograma
              convenioId={convenio.id}
              precios={convenio.precios_por_programa || []}
              programasDisponibles={programasDisponibles}
              onActualizado={handleActualizado}
            />
          )}
        </div>
      </div>

      {/* Modal editar nombre/descripción */}
      <ModalEditarConvenio
        open={modalEditar}
        convenio={convenio}
        onClose={() => setModalEditar(false)}
        onActualizado={handleActualizado}
      />
    </>
  )
}
