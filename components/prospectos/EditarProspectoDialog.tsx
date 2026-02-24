"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProspectoDPIField } from "./ProspectoDPIField"
import { API_BASE_URL } from "@/utils/apiConfig"
import { Loader2 } from "lucide-react"

const API_URL = `${API_BASE_URL}/api`

export interface EditarProspectoDialogProps {
  prospectoId: string | number
  prospectoNombre?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface FormData {
  nombre_completo: string
  correo_electronico: string
  telefono: string
  dpi: string
}

export function EditarProspectoDialog({
  prospectoId,
  prospectoNombre,
  open,
  onOpenChange,
  onSuccess,
}: EditarProspectoDialogProps) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState<FormData>({
    nombre_completo: "",
    correo_electronico: "",
    telefono: "",
    dpi: "",
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  useEffect(() => {
    if (!open || !prospectoId) return
    const token = localStorage.getItem("token")
    setLoadingData(true)
    fetch(`${API_URL}/prospectos/${prospectoId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error("Error al cargar")))
      .then(({ data }) => {
        setFormData({
          nombre_completo: data.nombre_completo ?? "",
          correo_electronico: data.correo_electronico ?? "",
          telefono: data.telefono ?? "",
          dpi: (data.numero_identificacion ?? "").toString().trim(),
        })
        setErrors({})
      })
      .catch(() => setErrors({ dpi: "No se pudieron cargar los datos" }))
      .finally(() => setLoadingData(false))
  }, [open, prospectoId])

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormData, string>> = {}
    if (formData.dpi && !/^\d{13}$/.test(formData.dpi)) {
      next.dpi = "El DPI debe tener exactamente 13 dígitos"
    }
    if (formData.nombre_completo.trim() === "") {
      next.nombre_completo = "El nombre es requerido"
    }
    if (formData.correo_electronico.trim() === "") {
      next.correo_electronico = "El correo es requerido"
    }
    if (formData.telefono.trim().length < 8) {
      next.telefono = "Teléfono válido (mín. 8 caracteres)"
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    const token = localStorage.getItem("token")
    try {
      const payload: Record<string, string> = {
        nombreCompleto: formData.nombre_completo.trim(),
        correoElectronico: formData.correo_electronico.trim(),
        telefono: formData.telefono.trim(),
      }
      if (formData.dpi.trim()) {
        payload.dpi = formData.dpi.trim()
      }
      const res = await fetch(`${API_URL}/prospectos/${prospectoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        const msg = data?.messages?.dpi?.[0] ?? data?.messages?.numeroIdentificacion?.[0] ?? data?.message ?? "Error al guardar"
        setErrors({ dpi: msg })
        return
      }
      onSuccess?.()
      onOpenChange(false)
    } catch {
      setErrors({ dpi: "Error de conexión" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Prospecto</DialogTitle>
          <DialogDescription>
            {prospectoNombre ? `Editar datos de ${prospectoNombre}` : "Actualizar datos del prospecto"}
          </DialogDescription>
        </DialogHeader>
        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre_completo">Nombre completo</Label>
              <Input
                id="nombre_completo"
                value={formData.nombre_completo}
                onChange={(e) => setFormData((p) => ({ ...p, nombre_completo: e.target.value }))}
                className={errors.nombre_completo ? "border-red-500" : ""}
              />
              {errors.nombre_completo && <p className="text-xs text-red-500">{errors.nombre_completo}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <ProspectoDPIField
                value={formData.dpi}
                onChange={(v) => setFormData((p) => ({ ...p, dpi: v }))}
                error={errors.dpi}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="correo_electronico">Correo electrónico</Label>
              <Input
                id="correo_electronico"
                type="email"
                value={formData.correo_electronico}
                onChange={(e) => setFormData((p) => ({ ...p, correo_electronico: e.target.value }))}
                className={errors.correo_electronico ? "border-red-500" : ""}
              />
              {errors.correo_electronico && <p className="text-xs text-red-500">{errors.correo_electronico}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData((p) => ({ ...p, telefono: e.target.value }))}
                className={errors.telefono ? "border-red-500" : ""}
              />
              {errors.telefono && <p className="text-xs text-red-500">{errors.telefono}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
