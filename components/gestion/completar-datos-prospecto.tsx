"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { API_BASE_URL } from "@/utils/apiConfig"
import Swal from "sweetalert2"

interface CompletarDatosProspectoProps {
  prospectoId: string
  datosFaltantes: string[]
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const API_URL = `${API_BASE_URL}/api`

export default function CompletarDatosProspecto({
  prospectoId,
  datosFaltantes,
  isOpen,
  onClose,
  onSuccess,
}: CompletarDatosProspectoProps) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState<any>({})

  // Cargar datos actuales del prospecto
  useEffect(() => {
    if (!isOpen || !prospectoId) return

    const cargarDatos = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_URL}/prospectos/${prospectoId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) throw new Error("Error al cargar datos")

        const { data } = await res.json()
        setFormData({
          nombre_completo: data.nombre_completo || "",
          correo_electronico: data.correo_electronico || "",
          numero_identificacion: data.numero_identificacion || "",
          telefono: data.telefono || "",
          modalidad: data.modalidad || "",
          fecha_inicio_especifica: data.fecha_inicio_especifica || "",
        })
      } catch (err) {
        console.error("Error:", err)
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los datos del prospecto",
        })
      } finally {
        setLoadingData(false)
      }
    }

    cargarDatos()
  }, [isOpen, prospectoId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem("token")

      // Preparar payload solo con los campos que faltan
      const payload: any = {}

      if (datosFaltantes.includes("Nombre completo") && formData.nombre_completo) {
        payload.nombreCompleto = formData.nombre_completo
      }

      if (datosFaltantes.includes("Correo electrónico") && formData.correo_electronico) {
        payload.correoElectronico = formData.correo_electronico
      }

      if (datosFaltantes.includes("DPI") && formData.numero_identificacion) {
        payload.numeroIdentificacion = formData.numero_identificacion
      }

      if (datosFaltantes.includes("Teléfono") && formData.telefono) {
        payload.telefono = formData.telefono
      }

      if (datosFaltantes.includes("Modalidad") && formData.modalidad) {
        payload.modalidad = formData.modalidad
      }

      if (datosFaltantes.includes("Fecha de inicio del programa") && formData.fecha_inicio_especifica) {
        payload.fechaInicioEspecifica = formData.fecha_inicio_especifica
      }

      const res = await fetch(`${API_URL}/prospectos/${prospectoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Error al actualizar datos")
      }

      await Swal.fire({
        icon: "success",
        title: "¡Datos actualizados!",
        text: "Los datos faltantes han sido completados correctamente",
        timer: 2000,
        showConfirmButton: false,
      })

      if (onSuccess) {
        onSuccess()
      }
      onClose()

    } catch (err: any) {
      console.error("Error:", err)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudieron actualizar los datos",
      })
    } finally {
      setLoading(false)
    }
  }

  const necesitaDPI = datosFaltantes.includes("DPI")
  const necesitaCorreo = datosFaltantes.includes("Correo electrónico")
  const necesitaNombre = datosFaltantes.includes("Nombre completo")
  const necesitaModalidad = datosFaltantes.includes("Modalidad")
  const necesitaFechaInicio = datosFaltantes.includes("Fecha de inicio del programa")

  if (!isOpen) return null

  // Renderizar directamente sin portal para evitar problemas de z-index
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ zIndex: 9999 }} onInteractOutside={(e) => e.preventDefault()}>
        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Completar Datos Faltantes</DialogTitle>
              <DialogDescription>
                Completa los datos requeridos para continuar con el proceso de alerta de alumno nuevo.
              </DialogDescription>
            </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Datos requeridos:</strong> Completa los siguientes campos para continuar con el proceso de alerta de alumno nuevo.
            </p>
          </div>

          {necesitaNombre && (
            <div className="space-y-2">
              <Label>
                Nombre completo <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.nombre_completo || ""}
                onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                required={necesitaNombre}
                placeholder="Nombre completo del prospecto"
              />
            </div>
          )}

          {necesitaDPI && (
            <div className="space-y-2">
              <Label>
                DPI / Número de Identificación <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.numero_identificacion || ""}
                onChange={(e) => {
                  // Solo permitir números
                  const soloNumeros = e.target.value.replace(/[^0-9]/g, "")
                  setFormData({ ...formData, numero_identificacion: soloNumeros })
                }}
                required={necesitaDPI}
                placeholder="Ingresa solo números, sin guiones"
                inputMode="numeric"
                pattern="[0-9]*"
                minLength={5}
              />
              <p className="text-xs text-gray-500">
                Mínimo 5 dígitos. DPI guatemalteco: 13 dígitos
              </p>
            </div>
          )}

          {necesitaCorreo && (
            <div className="space-y-2">
              <Label>
                Correo electrónico <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                value={formData.correo_electronico || ""}
                onChange={(e) => setFormData({ ...formData, correo_electronico: e.target.value })}
                required={necesitaCorreo}
                placeholder="ejemplo@correo.com"
              />
            </div>
          )}

          {necesitaModalidad && (
            <div className="space-y-2">
              <Label>
                Modalidad <span className="text-red-500">*</span>
              </Label>
              <select
                value={formData.modalidad || ""}
                onChange={(e) => setFormData({ ...formData, modalidad: e.target.value })}
                required={necesitaModalidad}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Seleccionar modalidad</option>
                <option value="sincronica">Sincrónica</option>
              </select>
            </div>
          )}

          {necesitaFechaInicio && (
            <div className="space-y-2">
              <Label>
                Fecha de inicio del programa <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={formData.fecha_inicio_especifica || ""}
                onChange={(e) => setFormData({ ...formData, fecha_inicio_especifica: e.target.value })}
                required={necesitaFechaInicio}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Guardando..." : "Guardar Datos"}
            </Button>
          </div>
        </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

