"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Plus, Search, Handshake } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchConvenios, toggleActivoConvenio } from "@/services/convenios"
import type { Convenio } from "@/types/convenios"
import ConvenioCard from "./ConvenioCard"
import ModalCrearConvenio from "./ModalCrearConvenio"
import ConvenioDetalle from "./ConvenioDetalle"
import Swal from "sweetalert2"

type Filtro = "todos" | "activos" | "inactivos"

export default function ConveniosPage() {
  const [convenios, setConvenios] = useState<Convenio[]>([])
  const [loading, setLoading] = useState(true)
  const [buscar, setBuscar] = useState("")
  const [filtroActivo, setFiltroActivo] = useState<Filtro>("todos")
  const [modalCrear, setModalCrear] = useState(false)
  const [convenioSeleccionado, setConvenioSeleccionado] = useState<Convenio | null>(null)

  const cargarConvenios = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchConvenios()
      setConvenios(data)
    } catch (e) {
      console.error("Error al cargar convenios:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarConvenios()
  }, [cargarConvenios])

  const handleToggleActivo = async (convenio: Convenio) => {
    const accion = convenio.activo ? "desactivar" : "activar"
    const result = await Swal.fire({
      icon: "question",
      title: `¿${convenio.activo ? "Desactivar" : "Activar"} convenio?`,
      html: `Se va a <strong>${accion}</strong> el convenio <strong>${convenio.nombre}</strong>.`,
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: "Cancelar",
      confirmButtonColor: convenio.activo ? "#dc2626" : "#16a34a",
    })
    if (!result.isConfirmed) return
    try {
      await toggleActivoConvenio(convenio.id)
      cargarConvenios()
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: `No se pudo ${accion} el convenio.`, confirmButtonText: "Entendido" })
    }
  }

  const conveniosFiltrados = useMemo(() => {
    return convenios.filter((c) => {
      const matchBuscar = c.nombre.toLowerCase().includes(buscar.toLowerCase())
      const matchActivo =
        filtroActivo === "todos" ? true : filtroActivo === "activos" ? c.activo : !c.activo
      return matchBuscar && matchActivo
    })
  }, [convenios, buscar, filtroActivo])

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2744]">Convenios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de convenios corporativos y precios por programa
          </p>
        </div>
        <Button onClick={() => setModalCrear(true)} className="bg-[#0f2744] hover:bg-[#0f2744]/90">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Convenio
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar convenio..."
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]/20"
          />
        </div>

        <div className="flex border rounded-lg overflow-hidden">
          {(["todos", "activos", "inactivos"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltroActivo(f)}
              className={`px-3 py-2 text-sm capitalize transition-colors ${
                filtroActivo === f ? "bg-[#0f2744] text-white" : "hover:bg-gray-50 text-gray-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <span className="text-sm text-muted-foreground">
          {conveniosFiltrados.length} convenio{conveniosFiltrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : conveniosFiltrados.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Handshake className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No hay convenios que mostrar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {conveniosFiltrados.map((convenio) => (
            <ConvenioCard
              key={convenio.id}
              convenio={convenio}
              onEditar={() => setConvenioSeleccionado(convenio)}
              onToggleActivo={() => handleToggleActivo(convenio)}
            />
          ))}
        </div>
      )}

      {/* Modal crear */}
      <ModalCrearConvenio open={modalCrear} onClose={() => setModalCrear(false)} onCreado={cargarConvenios} />

      {/* Panel detalle */}
      {convenioSeleccionado && (
        <ConvenioDetalle
          convenio={convenioSeleccionado}
          onClose={() => setConvenioSeleccionado(null)}
          onActualizado={cargarConvenios}
        />
      )}
    </div>
  )
}
