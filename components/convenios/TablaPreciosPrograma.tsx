"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PrecioConvenioPrograma, Programa, PrecioForm } from "@/types/convenios"
import {
  agregarPrecio,
  actualizarPrecio,
  eliminarPrecio,
} from "@/services/convenios"
import Swal from "sweetalert2"

interface Props {
  convenioId: number
  precios: PrecioConvenioPrograma[]
  programasDisponibles: Programa[]
  onActualizado: () => void
}

export default function TablaPreciosPrograma({
  convenioId,
  precios,
  programasDisponibles,
  onActualizado,
}: Props) {
  const [editando, setEditando] = useState<number | null>(null)
  const [formEdit, setFormEdit] = useState<PrecioForm>({
    programa_id: null,
    inscripcion: "",
    cuota_mensual: "",
    meses: "",
  })
  const [mostrarAgregar, setMostrarAgregar] = useState(false)
  const [formAgregar, setFormAgregar] = useState<PrecioForm>({
    programa_id: null,
    inscripcion: "",
    cuota_mensual: "",
    meses: "",
  })
  const [guardando, setGuardando] = useState(false)

  const inversionTotal = (p: PrecioConvenioPrograma) =>
    Number(p.inscripcion) + Number(p.cuota_mensual) * p.meses

  const handleGuardarEdicion = async (programaId: number) => {
    if (!formEdit.inscripcion || !formEdit.cuota_mensual || !formEdit.meses) return
    setGuardando(true)
    try {
      await actualizarPrecio(convenioId, programaId, {
        inscripcion: formEdit.inscripcion,
        cuota_mensual: formEdit.cuota_mensual,
        meses: Number(formEdit.meses),
      })
      setEditando(null)
      onActualizado()
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "Error", text: e.response?.data?.error || "No se pudo actualizar", confirmButtonText: "Entendido" })
    } finally {
      setGuardando(false)
    }
  }

  const handleAgregarPrecio = async () => {
    if (!formAgregar.programa_id || !formAgregar.inscripcion || !formAgregar.cuota_mensual || !formAgregar.meses) {
      Swal.fire({ icon: "warning", title: "Campos incompletos", text: "Todos los campos son requeridos", confirmButtonText: "Entendido" })
      return
    }
    setGuardando(true)
    try {
      await agregarPrecio(convenioId, {
        programa_id: formAgregar.programa_id,
        inscripcion: formAgregar.inscripcion,
        cuota_mensual: formAgregar.cuota_mensual,
        meses: Number(formAgregar.meses),
      })
      setMostrarAgregar(false)
      setFormAgregar({ programa_id: null, inscripcion: "", cuota_mensual: "", meses: "" })
      onActualizado()
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "Error", text: e.response?.data?.error || "No se pudo agregar", confirmButtonText: "Entendido" })
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async (programaId: number, nombre: string) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar precio?",
      html: `Se eliminará el precio para <strong>${nombre}</strong> de este convenio.`,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    })
    if (!result.isConfirmed) return
    try {
      await eliminarPrecio(convenioId, programaId)
      onActualizado()
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo eliminar", confirmButtonText: "Entendido" })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-gray-700">Precios por Programa</h3>
        {programasDisponibles.length > 0 && !mostrarAgregar && (
          <Button size="sm" onClick={() => setMostrarAgregar(true)} className="bg-[#0f2744] text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Agregar Programa
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Programa</th>
              <th className="text-right px-3 sm:px-4 py-2 sm:py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Inscripción</th>
              <th className="text-right px-3 sm:px-4 py-2 sm:py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cuota Mensual</th>
              <th className="text-center px-3 sm:px-4 py-2 sm:py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Meses</th>
              <th className="text-right px-3 sm:px-4 py-2 sm:py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Inversión Total</th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 w-20 sm:w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {precios.length === 0 && !mostrarAgregar && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                  Sin programas asignados. Agrega el primero.
                </td>
              </tr>
            )}

            {precios.map((precio) => (
              <tr key={precio.programa_id} className="hover:bg-gray-50/50">
                {editando === precio.programa_id ? (
                  <>
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {precio.programa?.nombre_del_programa}
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={formEdit.inscripcion}
                        onChange={(e) => setFormEdit((f) => ({ ...f, inscripcion: e.target.value }))}
                        className="w-24 text-right border rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={formEdit.cuota_mensual}
                        onChange={(e) => setFormEdit((f) => ({ ...f, cuota_mensual: e.target.value }))}
                        className="w-24 text-right border rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="number"
                        value={formEdit.meses}
                        onChange={(e) => setFormEdit((f) => ({ ...f, meses: e.target.value }))}
                        className="w-16 text-center border rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-4 py-2 text-right text-gray-400 text-xs">
                      Q
                      {(
                        Number(formEdit.inscripcion) +
                        Number(formEdit.cuota_mensual) * Number(formEdit.meses)
                      ).toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          disabled={guardando}
                          onClick={() => handleGuardarEdicion(precio.programa_id)}
                          className="bg-green-600 text-xs px-2"
                        >
                          ✓
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditando(null)}
                          className="text-xs px-2"
                        >
                          ✕
                        </Button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {precio.programa?.nombre_del_programa}
                    </td>
                    <td className="px-4 py-3 text-right text-green-700 font-semibold">
                      Q{Number(precio.inscripcion).toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-700 font-semibold">
                      Q{Number(precio.cuota_mensual).toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{precio.meses} meses</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      Q{inversionTotal(precio).toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditando(precio.programa_id)
                            setFormEdit({
                              programa_id: precio.programa_id,
                              inscripcion: String(precio.inscripcion),
                              cuota_mensual: String(precio.cuota_mensual),
                              meses: precio.meses,
                            })
                          }}
                          className="text-xs text-blue-600 hover:bg-blue-50 px-2"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleEliminar(precio.programa_id, precio.programa?.nombre_del_programa || "")
                          }
                          className="text-xs text-red-500 hover:bg-red-50 px-2"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}

            {/* Fila para agregar nuevo programa */}
            {mostrarAgregar && (
              <tr className="bg-blue-50/40">
                <td className="px-4 py-2">
                  <select
                    value={formAgregar.programa_id ?? ""}
                    onChange={(e) =>
                      setFormAgregar((f) => ({ ...f, programa_id: Number(e.target.value) || null }))
                    }
                    className="w-full border rounded px-2 py-1 text-sm"
                  >
                    <option value="">Seleccionar programa...</option>
                    {programasDisponibles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre_del_programa}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formAgregar.inscripcion}
                    onChange={(e) => setFormAgregar((f) => ({ ...f, inscripcion: e.target.value }))}
                    className="w-24 text-right border rounded px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formAgregar.cuota_mensual}
                    onChange={(e) => setFormAgregar((f) => ({ ...f, cuota_mensual: e.target.value }))}
                    className="w-24 text-right border rounded px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-4 py-2 text-center">
                  <input
                    type="number"
                    placeholder="0"
                    value={formAgregar.meses}
                    onChange={(e) => setFormAgregar((f) => ({ ...f, meses: e.target.value }))}
                    className="w-16 text-center border rounded px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-4 py-2 text-right text-xs text-gray-400">
                  Q
                  {(
                    Number(formAgregar.inscripcion || 0) +
                    Number(formAgregar.cuota_mensual || 0) * Number(formAgregar.meses || 0)
                  ).toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      disabled={guardando}
                      onClick={handleAgregarPrecio}
                      className="bg-[#0f2744] text-xs px-2"
                    >
                      ✓
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setMostrarAgregar(false)
                        setFormAgregar({ programa_id: null, inscripcion: "", cuota_mensual: "", meses: "" })
                      }}
                      className="text-xs px-2"
                    >
                      ✕
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>

          {precios.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-100">
                <td colSpan={4} className="px-4 py-2 text-xs font-semibold text-gray-500">
                  {precios.length} programa{precios.length !== 1 ? "s" : ""} asignado
                  {precios.length !== 1 ? "s" : ""}
                </td>
                <td className="px-4 py-2 text-right text-sm font-bold text-gray-900">
                  Promedio: Q
                  {(precios.reduce((acc, p) => acc + inversionTotal(p), 0) / precios.length).toLocaleString(
                    "es-GT",
                    { minimumFractionDigits: 2 },
                  )}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
