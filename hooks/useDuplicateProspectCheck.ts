"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { API_BASE_URL } from "@/utils/apiConfig"

export interface DuplicateProspect {
  id: number
  nombre_completo: string
  telefono: string
  numero_identificacion: string
  correo_electronico: string
  correo_corporativo: string
  status: string
  pais_origen: string
  pais_residencia: string
  fecha_nacimiento: string
  direccion_residencia: string
  empresa_donde_labora_actualmente: string
  puesto: string
  departamento: string
  interes: string
  modalidad: string
  telefono_corporativo: string
  direccion_empresa: string
  ultimo_titulo_obtenido: string
  institucion_titulo: string
  anio_graduacion: number | null
  fecha_inicio_especifica: string
  fecha_taller_reduccion: string
  fecha_taller_integracion: string
  medio_conocimiento_institucion: string
  cantidad_cursos_aprobados: number | null
  dia_estudio: string
  observaciones: string
  notas_generales: string
  metodo_pago: string
  monto_inscripcion: string
  convenio_pago_id: number | null
  coincidencia: number
  detalles_coincidencia: string[]
}

interface UseDuplicateCheckParams {
  nombre: string
  telefono: string
  dpi: string
  /** No verificar duplicados si ya se seleccionó un prospecto existente */
  skipIfProspectoSelected?: boolean
}

export function useDuplicateProspectCheck({
  nombre,
  telefono,
  dpi,
  skipIfProspectoSelected = false,
}: UseDuplicateCheckParams) {
  const [duplicates, setDuplicates] = useState<DuplicateProspect[]>([])
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const checkDuplicates = useCallback(async (n: string, t: string, d: string) => {
    // Cancelar petición anterior si existe
    if (abortRef.current) {
      abortRef.current.abort()
    }

    const trimmedName = n.trim()
    const trimmedPhone = t.trim()
    const trimmedDpi = d.trim()

    // Necesitar al menos nombre con 3+ chars, o teléfono con 8+ chars, o DPI con 5+ chars
    const hasEnoughData =
      trimmedName.length >= 3 ||
      trimmedPhone.length >= 8 ||
      trimmedDpi.length >= 5

    if (!hasEnoughData) {
      setDuplicates([])
      return
    }

    setLoading(true)
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/api/prospectos/check-duplicates`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: trimmedName,
          telefono: trimmedPhone,
          dpi: trimmedDpi,
        }),
        signal: controller.signal,
      })

      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      setDuplicates(data.duplicates || [])
      setHasChecked(true)
      // Reset dismissed when new results come in
      if ((data.duplicates || []).length > 0) {
        setDismissed(false)
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error checking duplicates:", err)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce: verificar 800ms después del último cambio
  useEffect(() => {
    if (skipIfProspectoSelected) {
      setDuplicates([])
      return
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      checkDuplicates(nombre, telefono, dpi)
    }, 800)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [nombre, telefono, dpi, skipIfProspectoSelected, checkDuplicates])

  const dismiss = useCallback(() => setDismissed(true), [])
  const clearDuplicates = useCallback(() => {
    setDuplicates([])
    setDismissed(false)
    setHasChecked(false)
  }, [])

  return {
    duplicates,
    loading,
    dismissed,
    dismiss,
    clearDuplicates,
    hasChecked,
    hasDuplicates: duplicates.length > 0 && !dismissed,
  }
}
