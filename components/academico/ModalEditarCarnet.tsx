"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { API_BASE_URL } from "@/utils/apiConfig"
import { useDebounce } from "@/hooks/use-debounce"

export interface UsuarioCarnet {
  id: number
  nombre: string
  email: string
  username?: string
  carnet: string
}

interface Disponibilidad {
  disponible: boolean
  tomado_por: {
    id: number
    nombre: string
    carnet_actual: string
  } | null
}

interface ModalEditarCarnetProps {
  open: boolean
  onClose: () => void
  usuario: UsuarioCarnet
  onSuccess: () => void
}

export function ModalEditarCarnet({ open, onClose, usuario, onSuccess }: ModalEditarCarnetProps) {
  const [nuevoCarnet, setNuevoCarnet] = useState(usuario.carnet || "")
  const [motivo, setMotivo] = useState("")
  const [verificando, setVerificando] = useState(false)
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const carnetDebounced = useDebounce(nuevoCarnet.trim(), 500)
  const carnetActual = (usuario.carnet || "").trim()

  useEffect(() => {
    if (!open) return
    setNuevoCarnet(usuario.carnet || "")
    setMotivo("")
    setDisponibilidad(null)
    setError(null)
  }, [open, usuario.id, usuario.carnet])

  useEffect(() => {
    if (!open || !carnetDebounced || carnetDebounced === carnetActual) {
      setDisponibilidad(null)
      setVerificando(false)
      return
    }

    let cancelled = false
    setVerificando(true)
    setDisponibilidad(null)

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) {
      setVerificando(false)
      return
    }

    fetch(
      `${API_BASE_URL}/api/academico/carnets/verificar?carnet=${encodeURIComponent(carnetDebounced)}&usuario_id=${usuario.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setDisponibilidad({
            disponible: data.disponible === true,
            tomado_por: data.tomado_por || null,
          })
        }
      })
      .catch(() => {
        if (!cancelled) setDisponibilidad(null)
      })
      .finally(() => {
        if (!cancelled) setVerificando(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, carnetDebounced, usuario.id, carnetActual])

  const handleGuardar = async () => {
    const motivoTrim = motivo.trim()
    if (motivoTrim.length < 10) {
      setError("El motivo del cambio debe tener al menos 10 caracteres.")
      return
    }
    if (nuevoCarnet.trim() === carnetActual) {
      setError("El nuevo carnet debe ser distinto al actual.")
      return
    }

    setGuardando(true)
    setError(null)

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) {
      setError("No autorizado")
      setGuardando(false)
      return
    }

    try {
      const body: { nuevo_carnet: string; motivo: string; intercambiar_con?: number } = {
        nuevo_carnet: nuevoCarnet.trim(),
        motivo: motivoTrim,
      }
      if (disponibilidad?.tomado_por?.id) {
        body.intercambiar_con = disponibilidad.tomado_por.id
      }

      const res = await fetch(`${API_BASE_URL}/api/academico/usuarios/${usuario.id}/carnet`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || "Error al actualizar el carnet")
        setGuardando(false)
        return
      }

      onSuccess()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión")
    } finally {
      setGuardando(false)
    }
  }

  const puedeGuardar =
    nuevoCarnet.trim() !== "" &&
    nuevoCarnet.trim() !== carnetActual &&
    motivo.trim().length >= 10 &&
    (disponibilidad?.disponible === true || (disponibilidad?.tomado_por != null))

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">🎓</span>
            Editar Carnet de Estudiante
          </DialogTitle>
          <DialogDescription>
            Usuario: <strong>{usuario.nombre}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Carnet actual</Label>
            <p className="text-sm text-muted-foreground mt-1 font-mono">{carnetActual || "—"}</p>
          </div>

          <div>
            <Label htmlFor="nuevo-carnet">Nuevo carnet</Label>
            <Input
              id="nuevo-carnet"
              value={nuevoCarnet}
              onChange={(e) => setNuevoCarnet(e.target.value)}
              placeholder="Ej. 2025-002"
              className="mt-1 font-mono"
            />
          </div>

          {verificando && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando disponibilidad...
            </p>
          )}

          {!verificando && carnetDebounced && carnetDebounced !== carnetActual && disponibilidad && (
            <>
              {disponibilidad.disponible ? (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>Disponible</AlertDescription>
                </Alert>
              ) : disponibilidad.tomado_por ? (
                <div className="space-y-2">
                  <Alert className="border-amber-200 bg-amber-50 text-amber-800">
                    <XCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription>
                      Ya está tomado por: <strong>{disponibilidad.tomado_por.nombre}</strong> (ID:{" "}
                      {disponibilidad.tomado_por.id})
                    </AlertDescription>
                  </Alert>
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription>
                      ¿Deseas intercambiar carnets?
                      <div className="mt-2 text-sm space-y-1">
                        <p>
                          <strong>{usuario.nombre}</strong> → {carnetDebounced}
                        </p>
                        <p>
                          <strong>{disponibilidad.tomado_por.nombre}</strong> → {carnetActual || "—"}
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              ) : null}
            </>
          )}

          <div>
            <Label htmlFor="motivo">Motivo del cambio (mín. 10 caracteres)</Label>
            <Input
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Corrección de carnet asignado incorrectamente"
              className="mt-1"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button onClick={handleGuardar} disabled={!puedeGuardar || guardando}>
            {guardando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              "Guardar Carnet"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
