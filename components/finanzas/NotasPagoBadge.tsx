"use client"

import React, { useState, useEffect } from "react"
import { AlertCircle, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { API_BASE_URL } from "@/utils/apiConfig"

const API_BASE = `${API_BASE_URL}/api`
const API_NOTAS = `${API_BASE}/notas-pago`

interface NotasPagoBadgeProps {
  carnet: string
  variant?: "icon" | "badge" | "both"
  onViewNotes?: () => void
}

export function NotasPagoBadge({ carnet, variant = "both", onViewNotes }: NotasPagoBadgeProps) {
  const [notasCount, setNotasCount] = useState<number | null>(null)
  const [ultimaNota, setUltimaNota] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!carnet) return

    const loadNotas = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem("token")
        const r = await fetch(`${API_NOTAS}/${carnet}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        })

        if (r.ok) {
          const json = await r.json()
          if (json.success) {
            const notas = json.data.notas || []
            setNotasCount(notas.length)
            if (notas.length > 0) {
              // Obtener resumen de la última nota (primeros 100 caracteres)
              const ultima = notas[0]
              setUltimaNota(ultima.nota.length > 100 
                ? ultima.nota.substring(0, 100) + '...' 
                : ultima.nota)
            }
          }
        }
      } catch (err) {
        console.error("Error cargando notas:", err)
      } finally {
        setLoading(false)
      }
    }

    loadNotas()
  }, [carnet])

  if (loading || notasCount === null || notasCount === 0) {
    return null
  }

  const tooltipContent = (
    <div className="space-y-2">
      <p className="font-semibold">Notas de Pago ({notasCount})</p>
      {ultimaNota && (
        <p className="text-sm max-w-xs">{ultimaNota}</p>
      )}
      {onViewNotes && (
        <p className="text-xs text-blue-300 mt-2">Clic para ver todas las notas</p>
      )}
    </div>
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="inline-flex items-center gap-1 cursor-pointer"
            onClick={onViewNotes}
          >
            {(variant === "icon" || variant === "both") && (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
            {(variant === "badge" || variant === "both") && (
              <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 border-amber-300 text-amber-700 dark:text-amber-400">
                <FileText className="h-3 w-3 mr-1" />
                {notasCount} nota{notasCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

