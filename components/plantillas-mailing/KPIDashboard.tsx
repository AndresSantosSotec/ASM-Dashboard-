"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, TrendingUp, Calendar, Users, Eye, Play, XCircle, Loader2, AlertCircle } from "lucide-react"
import { fetchKPIs, cancelarEnvio, type KPIData, type EmailSending } from "@/services/plantillasMailing"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface KPIDashboardProps {
  dias?: number
  onRefresh?: () => void
}

export function KPIDashboard({ dias = 30, onRefresh }: KPIDashboardProps) {
  const [kpis, setKpis] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<number | null>(null)

  useEffect(() => {
    loadKPIs()
  }, [dias])

  const loadKPIs = async () => {
    try {
      setLoading(true)
      const data = await fetchKPIs(dias)
      setKpis(data)
    } catch (error) {
      console.error('Error cargando KPIs:', error)
      toast.error("Error al cargar métricas")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEnvio = async (id: number) => {
    if (!confirm("¿Cancelar este envío programado?")) return

    try {
      setCancelling(id)
      await cancelarEnvio(id)
      toast.success("Envío cancelado exitosamente")
      loadKPIs()
      onRefresh?.()
    } catch (error) {
      toast.error("Error al cancelar envío")
    } finally {
      setCancelling(null)
    }
  }

  const getEstadoBadge = (estado: string) => {
    const colors: Record<string, string> = {
      completado: "bg-green-500",
      enviando: "bg-blue-500",
      programado: "bg-yellow-500",
      fallido: "bg-red-500",
      cancelado: "bg-gray-500"
    }
    return (
      <Badge className={colors[estado] || "bg-gray-500"}>
        {estado.toUpperCase()}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cargando...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!kpis) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No se pudieron cargar las métricas</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Correos Enviados */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Correos Enviados</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.correos_enviados.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Últimos {kpis.periodo_dias} días</p>
          </CardContent>
        </Card>

        {/* Tasa de Apertura */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Apertura</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.tasa_apertura_promedio.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Promedio general</p>
          </CardContent>
        </Card>

        {/* Próximos Envíos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos Envíos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.proximos_envios.length}</div>
            <p className="text-xs text-muted-foreground">Programados</p>
          </CardContent>
        </Card>

        {/* Plantillas Activas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plantillas Populares</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.plantillas_populares.length}</div>
            <p className="text-xs text-muted-foreground">Más utilizadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Envíos Programados */}
      {kpis.proximos_envios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Envíos Programados</CardTitle>
            <CardDescription>Próximos envíos masivos programados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {kpis.proximos_envios.map((envio: EmailSending) => (
                <div
                  key={envio.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{envio.asunto}</h4>
                      {getEstadoBadge(envio.estado)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {envio.total_destinatarios} destinatarios
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {envio.fecha_programada
                          ? formatDistanceToNow(new Date(envio.fecha_programada), {
                              addSuffix: true,
                              locale: es,
                            })
                          : "Sin fecha"}
                      </span>
                    </div>
                    {envio.template && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Plantilla: {envio.template.nombre}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {envio.estado === "programado" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCancelEnvio(envio.id)}
                        disabled={cancelling === envio.id}
                      >
                        {cancelling === envio.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Cancelando
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancelar
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plantillas Populares */}
      {kpis.plantillas_populares.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Plantillas Más Utilizadas</CardTitle>
            <CardDescription>Plantillas con mayor número de envíos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {kpis.plantillas_populares.map((plantilla, index) => (
                <div
                  key={plantilla.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{plantilla.nombre}</h4>
                      <p className="text-xs text-muted-foreground">
                        Categoría: {plantilla.categoria}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{plantilla.envios_count}</div>
                    <p className="text-xs text-muted-foreground">envíos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
