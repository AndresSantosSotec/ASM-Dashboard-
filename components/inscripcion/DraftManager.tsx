"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Save,
  FileText,
  Trash2,
  Clock,
  Download,
  Plus,
  AlertCircle,
} from "lucide-react"
import type { DraftData } from "@/hooks/useDraftCache"
import Swal from "sweetalert2"

interface DraftManagerProps {
  drafts: DraftData[]
  activeDraftId: string | null
  maxDrafts: number
  synced: boolean
  onSave: () => void
  onLoad: (draftId: string) => void
  onDelete: (draftId: string) => void
  onNewDraft: () => void
  isSaving?: boolean
}

/** Etiqueta legible del tab */
const tabLabels: Record<string, string> = {
  personal: "Datos Personales",
  laboral: "Datos Laborales",
  academico: "Info. Académica",
  financiero: "Datos Financieros",
  documentos: "Documentos",
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "hace un momento"
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `hace ${days}d`
}

export default function DraftManager({
  drafts,
  activeDraftId,
  maxDrafts,
  synced,
  onSave,
  onLoad,
  onDelete,
  onNewDraft,
  isSaving,
}: DraftManagerProps) {
  const [expanded, setExpanded] = useState(false)

  const handleLoad = async (draftId: string) => {
    const result = await Swal.fire({
      icon: "question",
      title: "Cargar borrador",
      text: "Se reemplazarán los datos actuales del formulario con los del borrador seleccionado. ¿Continuar?",
      showCancelButton: true,
      confirmButtonText: "Sí, cargar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#2563eb",
    })
    if (result.isConfirmed) {
      onLoad(draftId)
    }
  }

  const handleDelete = async (draftId: string, label: string) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Eliminar borrador",
      html: `¿Eliminar el borrador <strong>"${label}"</strong>? Esta acción no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    })
    if (result.isConfirmed) {
      onDelete(draftId)
    }
  }

  // Ordenados por más reciente
  const sorted = [...drafts].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  return (
    <Card className="mb-4 border border-blue-200 bg-blue-50/60 shadow-sm">
      <CardContent className="p-3">
        {/* Barra compacta */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Borradores ({drafts.length}/{maxDrafts})
            </span>
            {activeDraftId && (
              <Badge variant="outline" className="text-xs border-green-400 text-green-700 bg-green-50">
                <Save className="h-3 w-3 mr-1" /> Auto-guardado activo
              </Badge>
            )}
            {synced && (
              <Badge variant="outline" className="text-xs border-purple-400 text-purple-700 bg-purple-50">
                ☁️ Respaldado en BD
              </Badge>
            )}
            {!synced && activeDraftId && (
              <Badge variant="outline" className="text-xs border-amber-400 text-amber-700 bg-amber-50">
                ⏳ Sincronizando...
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
              onClick={onSave}
              disabled={isSaving}
            >
              <Save className="h-3 w-3 mr-1" />
              Guardar ahora
            </Button>

            {drafts.length < maxDrafts && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                onClick={onNewDraft}
              >
                <Plus className="h-3 w-3 mr-1" />
                Nuevo borrador
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-blue-600 hover:bg-blue-100"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Ocultar" : `Ver borradores (${drafts.length})`}
            </Button>
          </div>
        </div>

        {/* Lista expandible de borradores */}
        {expanded && (
          <div className="mt-3 space-y-2">
            {sorted.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <AlertCircle className="h-4 w-4" />
                No hay borradores guardados. Guarda tu progreso para no perderlo.
              </div>
            ) : (
              sorted.map((draft) => {
                const isActive = draft.draftId === activeDraftId
                return (
                  <div
                    key={draft.draftId}
                    className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition ${
                      isActive
                        ? "bg-blue-100 border border-blue-300"
                        : "bg-white border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <FileText
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? "text-blue-600" : "text-gray-400"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {draft.label}
                          {isActive && (
                            <span className="ml-2 text-xs text-blue-600 font-normal">
                              (activo)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo(draft.updatedAt)} ·{" "}
                          {tabLabels[draft.activeTab] || draft.activeTab} ·{" "}
                          {draft.progress}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!isActive && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-blue-600 hover:bg-blue-100"
                          onClick={() => handleLoad(draft.draftId)}
                        >
                          <Download className="h-3 w-3 mr-1" /> Cargar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-red-500 hover:bg-red-50"
                        onClick={() => handleDelete(draft.draftId, draft.label)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}

            {drafts.length >= maxDrafts && (
              <p className="text-xs text-amber-600 flex items-center gap-1 pt-1">
                <AlertCircle className="h-3 w-3" />
                Límite alcanzado. Al guardar uno nuevo se eliminará el más antiguo.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
