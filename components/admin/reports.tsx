"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  BarChart3,
  Download,
  TrendingUp,
  Users,
  Target,
  DollarSign,
  Calendar,
  FileText,
  Loader2,
  RefreshCw,
  AlertCircle,
  Award,
  Activity
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  getAdvisorStats,
  getLeadStats,
  getConversionStats,
  getIncomeStats,
  getPerformanceStats,
  getAdvisorsForFilter,
  getProgramsForFilter,
  exportReport,
  type ReportFilters,
  type AdvisorStats,
  type LeadStats,
  type ConversionStats
} from "@/services/reports"

export function Reports() {
  const { toast } = useToast()

  // Estados de filtros
  const [filters, setFilters] = useState<ReportFilters>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  })

  // Estados de datos
  const [advisorStats, setAdvisorStats] = useState<AdvisorStats[]>([])
  const [leadStats, setLeadStats] = useState<LeadStats | null>(null)
  const [conversionStats, setConversionStats] = useState<ConversionStats | null>(null)

  // Estados de UI
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("asesores")

  // Listas para filtros
  const [advisors, setAdvisors] = useState<Array<{ id: number; name: string }>>([])
  const [programs, setPrograms] = useState<Array<{ id: number; nombre: string }>>([])

  // Cargar listas para filtros
  useEffect(() => {
    const loadFilters = async () => {
      const [advisorsList, programsList] = await Promise.all([
        getAdvisorsForFilter(),
        getProgramsForFilter()
      ])
      setAdvisors(advisorsList)
      setPrograms(programsList)
    }
    loadFilters()
  }, [])

  // Cargar datos según el tab activo
  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filters])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      switch (activeTab) {
        case "asesores":
          const advisorData = await getAdvisorStats(filters)
          setAdvisorStats(advisorData)
          break
        case "leads":
          const leadData = await getLeadStats(filters)
          setLeadStats(leadData)
          break
        case "conversiones":
          const conversionData = await getConversionStats(filters)
          setConversionStats(conversionData)
          break
      }
    } catch (err: any) {
      setError(err?.message || "Error al cargar los datos")
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del reporte",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (reportType: string) => {
    setExporting(true)
    try {
      const blob = await exportReport(reportType, filters)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)

      toast({
        title: "✅ Descarga exitosa",
        description: `Reporte PDF de ${reportType} generado correctamente`
      })
    } catch (err: any) {
      toast({
        title: "❌ Error",
        description: err?.message || "No se pudo exportar el reporte",
        variant: "destructive"
      })
    } finally {
      setExporting(false)
    }
  }

  const handleFilterChange = (key: keyof ReportFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0]
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reportes y Análisis</h2>
          <p className="text-sm text-muted-foreground">
            Visualiza y exporta reportes detallados de rendimiento
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from">Desde</Label>
              <Input
                id="from"
                type="date"
                value={filters.from || ''}
                onChange={(e) => handleFilterChange('from', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">Hasta</Label>
              <Input
                id="to"
                type="date"
                value={filters.to || ''}
                onChange={(e) => handleFilterChange('to', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="advisor">Asesor</Label>
              <Select
                value={filters.userId?.toString() || 'todos'}
                onValueChange={(v) => handleFilterChange('userId', v === 'todos' ? undefined : Number(v))}
              >
                <SelectTrigger id="advisor">
                  <SelectValue placeholder="Todos los asesores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los asesores</SelectItem>
                  {advisors.map(a => (
                    <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="program">Programa</Label>
              <Select
                value={filters.programId?.toString() || 'todos'}
                onValueChange={(v) => handleFilterChange('programId', v === 'todos' ? undefined : Number(v))}
              >
                <SelectTrigger id="program">
                  <SelectValue placeholder="Todos los programas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los programas</SelectItem>
                  {programs.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs de reportes */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="asesores">
            <Users className="h-4 w-4 mr-2" />
            Asesores
          </TabsTrigger>
          <TabsTrigger value="leads">
            <Target className="h-4 w-4 mr-2" />
            Leads
          </TabsTrigger>
          <TabsTrigger value="conversiones">
            <TrendingUp className="h-4 w-4 mr-2" />
            Conversiones
          </TabsTrigger>
        </TabsList>

        {/* TAB: Asesores */}
        <TabsContent value="asesores" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Rendimiento por Asesor</h3>
            <Button
              onClick={() => handleExport('asesores')}
              disabled={exporting || loading}
              size="sm"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Descargar PDF
            </Button>
          </div>

          {loading ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : advisorStats.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay datos disponibles para el período seleccionado</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asesor</TableHead>
                      <TableHead className="text-right">Total Leads</TableHead>
                      <TableHead className="text-right">Asignados</TableHead>
                      <TableHead className="text-right">Contactados</TableHead>
                      <TableHead className="text-right">Convertidos</TableHead>
                      <TableHead className="text-right">Tasa Conv.</TableHead>
                      <TableHead className="text-right">Interacciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {advisorStats.map((advisor) => (
                      <TableRow key={advisor.advisor_id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <Award className="h-4 w-4 text-yellow-500" />
                            <span>{advisor.advisor_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{advisor.total_leads}</TableCell>
                        <TableCell className="text-right">{advisor.leads_asignados}</TableCell>
                        <TableCell className="text-right">{advisor.leads_contactados}</TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-green-600">{advisor.leads_convertidos}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">
                            {advisor.tasa_conversion.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{advisor.interacciones_total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB: Leads */}
        <TabsContent value="leads" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Estadísticas de Leads</h3>
            <Button
              onClick={() => handleExport('leads')}
              disabled={exporting || loading}
              size="sm"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Descargar PDF
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : leadStats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{leadStats.total}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Nuevos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">{leadStats.nuevos}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">En Seguimiento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-600">{leadStats.en_seguimiento}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Contactados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">{leadStats.contactados}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Convertidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">{leadStats.convertidos}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">No Interesados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-600">{leadStats.no_interesados}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Leads por programa */}
              {leadStats.por_programa && leadStats.por_programa.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Leads por Programa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Programa</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leadStats.por_programa.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.programa}</TableCell>
                            <TableCell className="text-right font-medium">{item.cantidad}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </TabsContent>

        {/* TAB: Conversiones */}
        <TabsContent value="conversiones" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Análisis de Conversiones</h3>
            <Button
              onClick={() => handleExport('conversiones')}
              disabled={exporting || loading}
              size="sm"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Descargar PDF
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : conversionStats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-2 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total Prospectos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{conversionStats.total_prospectos}</div>
                  </CardContent>
                </Card>
                <Card className="border-2 border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Convertidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">{conversionStats.total_convertidos}</div>
                  </CardContent>
                </Card>
                <Card className="border-2 border-purple-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {conversionStats.tasa_conversion.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Conversiones por programa */}
              {conversionStats.por_programa && conversionStats.por_programa.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Conversiones por Programa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Programa</TableHead>
                          <TableHead className="text-right">Prospectos</TableHead>
                          <TableHead className="text-right">Convertidos</TableHead>
                          <TableHead className="text-right">Tasa</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {conversionStats.por_programa.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{item.programa}</TableCell>
                            <TableCell className="text-right">{item.prospectos}</TableCell>
                            <TableCell className="text-right text-green-600 font-medium">
                              {item.convertidos}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline">{item.tasa.toFixed(1)}%</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}

