"use client"

import { X, Calendar, MapPin, Globe, BookOpen, User, Briefcase, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

interface Prospecto {
  id: string
  nombre: string
  email: string
  telefono: string
  departamento: string
  puesto?: string
  estado: string
  origen?: string
  observaciones?: string
  notasGenerales?: string
  programa?: string
  ciudad?: string
  pais?: string
  fechaCaptura?: string
  asesor?: string
}

interface DetallesProspectoProps {
  prospecto: Prospecto
  onClose: () => void
}

const formatDate = (dateString?: string) => {
  if (!dateString || dateString === "—") return "—"
  try {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch {
    return dateString
  }
}

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
    <Icon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-900 break-words">{value}</p>
    </div>
  </div>
)

export default function DetallesProspecto({ prospecto, onClose }: DetallesProspectoProps) {
  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      "No contactado": "bg-gray-100 text-gray-800",
      "En seguimiento": "bg-blue-100 text-blue-800",
      "Le interesa a futuro": "bg-yellow-100 text-yellow-800",
      Perdido: "bg-red-100 text-red-800",
      Inscrito: "bg-green-100 text-green-800",
      "Promesa de pago": "bg-purple-100 text-purple-800",
    }
    return colors[estado] || "bg-gray-100 text-gray-800"
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-blue-600" />
              <span>Información Completa del Prospecto</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Header con nombre y estado */}
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{prospecto.nombre}</h3>
                <p className="text-sm text-gray-600 mt-1">ID: {prospecto.id}</p>
              </div>
              <Badge className={getEstadoColor(prospecto.estado)}>
                {prospecto.estado}
              </Badge>
            </div>
          </Card>

          {/* Información de contacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoRow icon={User} label="Correo Electrónico" value={prospecto.email} />
            <InfoRow icon={User} label="Teléfono" value={prospecto.telefono} />
          </div>

          {/* Información profesional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoRow icon={Building2} label="Empresa Actual" value={prospecto.departamento} />
            <InfoRow icon={Briefcase} label="Puesto" value={prospecto.puesto || "N/A"} />
          </div>

          {/* Información académica y geográfica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoRow icon={BookOpen} label="Programa de Interés" value={prospecto.programa || "—"} />
            <InfoRow icon={User} label="Asesor Asignado" value={prospecto.asesor || "Sin asignar"} />
            <InfoRow icon={MapPin} label="Ciudad" value={prospecto.ciudad || "—"} />
            <InfoRow icon={Globe} label="País" value={prospecto.pais || "—"} />
          </div>

          {/* Origen y fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoRow icon={User} label="Medio de Conocimiento" value={prospecto.origen || "—"} />
            <InfoRow icon={Calendar} label="Fecha de Captura" value={formatDate(prospecto.fechaCaptura)} />
          </div>

          {/* Notas (si existen) */}
          {(prospecto.notasGenerales || prospecto.observaciones) && (
            <Card className="p-4 bg-amber-50 border-amber-200">
              <h4 className="text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                Notas y Observaciones
              </h4>
              {prospecto.notasGenerales && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Notas Generales:</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-2 rounded border border-amber-200">
                    {prospecto.notasGenerales}
                  </p>
                </div>
              )}
              {prospecto.observaciones && (
                <div>
                  <p className="text-xs font-semibold text-amber-700 mb-1">Observaciones:</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-2 rounded border border-amber-200">
                    {prospecto.observaciones}
                  </p>
                </div>
              )}
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}