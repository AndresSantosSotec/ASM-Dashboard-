"use client"

import { AlertTriangle, UserCheck, X, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { DuplicateProspect } from "@/hooks/useDuplicateProspectCheck"

interface Props {
  duplicates: DuplicateProspect[]
  onSelect: (prospect: DuplicateProspect) => void
  onDismiss: () => void
  loading?: boolean
}

function getCoincidenceColor(pct: number): string {
  if (pct >= 80) return "bg-red-100 border-red-400 text-red-800"
  if (pct >= 50) return "bg-amber-100 border-amber-400 text-amber-800"
  return "bg-blue-100 border-blue-400 text-blue-800"
}

function getBadgeVariant(pct: number): "destructive" | "default" | "secondary" {
  if (pct >= 80) return "destructive"
  if (pct >= 50) return "default"
  return "secondary"
}

export default function DuplicateProspectAlert({
  duplicates,
  onSelect,
  onDismiss,
  loading,
}: Props) {
  const [expanded, setExpanded] = useState(true)

  if (duplicates.length === 0) return null

  const topMatch = duplicates[0]
  const colorClass = getCoincidenceColor(topMatch.coincidencia)

  return (
    <div className={`mb-4 rounded-lg border-2 p-4 ${colorClass} animate-in fade-in slide-in-from-top-2 duration-300`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">
              {duplicates.length === 1
                ? "Se encontró un prospecto similar registrado anteriormente"
                : `Se encontraron ${duplicates.length} prospectos similares registrados`}
            </h4>
            <p className="text-xs mt-0.5 opacity-80">
              Puede reutilizar un registro existente para evitar duplicados y conservar su historial.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Prospect Cards */}
      {expanded && (
        <div className="mt-3 space-y-2">
          {duplicates.map((dup) => (
            <div
              key={dup.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/80 dark:bg-secondary/80 rounded-md border dark:border-primary/30 p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-gray-900 dark:text-foreground truncate">
                    {dup.nombre_completo}
                  </span>
                  <Badge variant={getBadgeVariant(dup.coincidencia)} className="text-xs">
                    {dup.coincidencia}% coincidencia
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {dup.status}
                  </Badge>
                </div>

                {/* Detail fields */}
                <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-0.5 text-xs text-gray-600 dark:text-muted-foreground">
                  {dup.telefono && (
                    <span>
                      <strong>Tel:</strong> {dup.telefono}
                    </span>
                  )}
                  {dup.numero_identificacion && (
                    <span>
                      <strong>DPI:</strong> {dup.numero_identificacion}
                    </span>
                  )}
                  {dup.correo_electronico && (
                    <span>
                      <strong>Email:</strong> {dup.correo_electronico}
                    </span>
                  )}
                </div>

                {/* Coincidence details */}
                {dup.detalles_coincidencia.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {dup.detalles_coincidencia.map((detalle, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-full bg-gray-100 dark:bg-primary/20 px-2 py-0.5 text-[10px] text-gray-700 dark:text-muted-foreground"
                      >
                        {detalle}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <Button
                size="sm"
                variant="default"
                className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
                onClick={() => onSelect(dup)}
              >
                <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                Usar este prospecto
              </Button>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <p className="mt-2 text-xs opacity-70">Buscando coincidencias...</p>
      )}
    </div>
  )
}
