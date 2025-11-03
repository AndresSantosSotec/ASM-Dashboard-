"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, FileText, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface EmailTemplate {
  id: number
  nombre: string
  tipo: "correo" | "documento"
  categoria: string
  activo: boolean
  updated_at?: string
}

interface PlantillasRecientesProps {
  plantillas: EmailTemplate[]
  loading?: boolean
  onEdit?: (plantilla: EmailTemplate) => void
}

export function PlantillasRecientes({ plantillas, loading = false, onEdit }: PlantillasRecientesProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Plantillas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Plantillas Recientes</CardTitle>
        <CardDescription className="text-xs">
          Últimas plantillas modificadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {plantillas.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No hay plantillas recientes
          </p>
        ) : (
          <div className="space-y-2">
            {plantillas.map((plantilla) => (
              <div
                key={plantilla.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors group"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <h4 className="text-sm font-medium truncate">{plantilla.nombre}</h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs py-0 px-1.5 h-5">
                      {plantilla.tipo}
                    </Badge>
                    <Badge variant="secondary" className="text-xs py-0 px-1.5 h-5">
                      {plantilla.categoria}
                    </Badge>
                    <Badge
                      className={`text-xs py-0 px-1.5 h-5 ${
                        plantilla.activo ? "bg-green-500" : "bg-gray-500"
                      }`}
                    >
                      {plantilla.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Actualizada{" "}
                    {plantilla.updated_at
                      ? formatDistanceToNow(new Date(plantilla.updated_at), {
                          addSuffix: true,
                          locale: es,
                        })
                      : "Sin fecha"}
                  </p>
                </div>
                {onEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(plantilla)}
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
