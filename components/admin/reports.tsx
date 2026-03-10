"use client"

import { useState, useEffect, useMemo } from "react"
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
  getAdvisorsForFilter,
  getProgramsForFilter,
  getLeadsByAdvisorDetail,
  getCommissionReport,
  downloadCommissionReportExport,
  exportReport,
  exportAdvisorStatsLocal,
  exportLeadStatsLocal,
  exportConversionStatsLocal,
  exportLeadsByAdvisorDetail,
  type ReportFilters,
  type AdvisorStats,
  type LeadStats,
  type ConversionStats,
  type LeadDetail,
  type CommissionReportRow,
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
  const [leadsDetail, setLeadsDetail] = useState<LeadDetail[]>([])
  // Reporte de Comisiones (por mes)
  const [commissionRows, setCommissionRows] = useState<CommissionReportRow[]>([])
  const [commissionMonth, setCommissionMonth] = useState(new Date().getMonth() + 1)
  const [commissionYear, setCommissionYear] = useState(new Date().getFullYear())
  const [commissionExporting, setCommissionExporting] = useState(false)
  const [commissionPage, setCommissionPage] = useState(1)
  const COMMISSION_PAGE_SIZE = 20

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

  // Optimización: Memorizar datos filtrados y estadísticas calculadas
  const filteredAdvisorStats = useMemo(() => {
    return advisorStats.sort((a, b) => b.tasa_conversion - a.tasa_conversion)
  }, [advisorStats])

  const totalLeadsAllAdvisors = useMemo(() => {
    return advisorStats.reduce((acc, curr) => acc + curr.total_leads, 0)
  }, [advisorStats])

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
        case "detalle":
          const detailData = await getLeadsByAdvisorDetail(filters)
          setLeadsDetail(detailData)
          break
        case "comisiones":
          const commData = await getCommissionReport(commissionMonth, commissionYear, filters.userId)
          setCommissionRows(commData.data ?? [])
          setCommissionPage(1)
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

  const handleExport = async (reportType: string, format: 'pdf' | 'xlsx' | 'csv' = 'pdf') => {
    setExporting(true)
    try {
      // Obtener información del usuario
      const userName = localStorage.getItem('user_name') || 'Usuario'
      const userEmail = localStorage.getItem('email') || ''

      if (format === 'xlsx' || format === 'csv') {
        // Exportación local
        if (reportType === 'asesores' && advisorStats.length > 0) {
          exportAdvisorStatsLocal(advisorStats, format, { name: userName, email: userEmail })
        } else if (reportType === 'leads' && leadStats) {
          exportLeadStatsLocal(leadStats, format, { name: userName, email: userEmail })
        } else if (reportType === 'conversiones' && conversionStats) {
          exportConversionStatsLocal(conversionStats, format, { name: userName, email: userEmail })
        } else if (reportType === 'detalle' && leadsDetail.length > 0) {
          exportLeadsByAdvisorDetail(leadsDetail, format, { name: userName, email: userEmail })
        }

        toast({
          title: "Descarga exitosa",
          description: `Reporte ${format.toUpperCase()} generado correctamente`
        })
      } else {
        // Exportación PDF desde backend
        const blob = await exportReport(reportType, format, filters)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.${format}`
        a.click()
        URL.revokeObjectURL(url)

        toast({
          title: "Descarga exitosa",
          description: `Reporte ${format.toUpperCase()} generado correctamente`
        })
      }
    } catch (err: any) {
      toast({
        title: "Error en la descarga",
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
        <TabsList className="grid w-full grid-cols-5">
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
          <TabsTrigger value="detalle">
            <BarChart3 className="h-4 w-4 mr-2" />
            Detalle por Asesor
          </TabsTrigger>
          <TabsTrigger value="comisiones">
            <DollarSign className="h-4 w-4 mr-2" />
            Reportes Comisiones
          </TabsTrigger>
        </TabsList>

        {/* TAB: Asesores */}
        <TabsContent value="asesores" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Rendimiento por Asesor</h3>
            <div className="flex gap-2">
              <Button
                onClick={() => handleExport('asesores', 'csv')}
                disabled={exporting || loading}
                size="sm"
                variant="outline"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                CSV
              </Button>
              <Button
                onClick={() => handleExport('asesores', 'xlsx')}
                disabled={exporting || loading}
                size="sm"
                variant="outline"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Excel
              </Button>
              <Button
                onClick={() => handleExport('asesores', 'pdf')}
                disabled={exporting || loading}
                size="sm"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                PDF
              </Button>
            </div>
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
                    {filteredAdvisorStats.map((advisor) => (
                      <TableRow key={advisor.advisor_id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <Users className="h-4 w-4 text-blue-600" />
                            </div>
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
            <div className="flex gap-2">
              <Button
                onClick={() => handleExport('leads', 'csv')}
                disabled={exporting || loading}
                size="sm"
                variant="outline"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                CSV
              </Button>
              <Button
                onClick={() => handleExport('leads', 'xlsx')}
                disabled={exporting || loading}
                size="sm"
                variant="outline"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Excel
              </Button>
              <Button
                onClick={() => handleExport('leads', 'pdf')}
                disabled={exporting || loading}
                size="sm"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                PDF
              </Button>
            </div>
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
            <div className="flex gap-2">
              <Button
                onClick={() => handleExport('conversiones', 'csv')}
                disabled={exporting || loading}
                size="sm"
                variant="outline"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                CSV
              </Button>
              <Button
                onClick={() => handleExport('conversiones', 'xlsx')}
                disabled={exporting || loading}
                size="sm"
                variant="outline"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Excel
              </Button>
              <Button
                onClick={() => handleExport('conversiones', 'pdf')}
                disabled={exporting || loading}
                size="sm"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                PDF
              </Button>
            </div>
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

        {/* TAB: Detalle por Asesor */}
        <TabsContent value="detalle" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Detalle de Leads por Asesor</h3>
            <div className="flex gap-2">
              <Button
                onClick={() => handleExport('detalle', 'csv')}
                disabled={exporting || loading}
                size="sm"
                variant="outline"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                CSV
              </Button>
              <Button
                onClick={() => handleExport('detalle', 'xlsx')}
                disabled={exporting || loading}
                size="sm"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Excel
              </Button>
            </div>
          </div>

          {loading ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : leadsDetail.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay datos disponibles para el período seleccionado</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Total de Leads: {leadsDetail.length}</span>
                  <Badge variant="outline">{filters.userId ? 'Filtrado por asesor' : 'Todos los asesores'}</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Datos listos para análisis en Excel o Power BI
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Asesor</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Programa</TableHead>
                        <TableHead>Ciudad/País</TableHead>
                        <TableHead className="text-right">Interacciones</TableHead>
                        <TableHead className="text-right">Días</TableHead>
                        <TableHead>Fecha Captura</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leadsDetail.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">
                            <div>
                              <p>{lead.nombre}</p>
                              <p className="text-xs text-muted-foreground">{lead.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{lead.asesor}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {lead.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{lead.programa}</TableCell>
                          <TableCell className="text-sm">
                            {lead.ciudad}, {lead.pais}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge className={lead.total_interacciones > 0 ? 'bg-blue-600' : 'bg-gray-400'}>
                              {lead.total_interacciones}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">{lead.dias_desde_captura}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {lead.fecha_captura}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB: Reportes Comisiones — columnas completas por alumno */}
        <TabsContent value="comisiones" className="space-y-4">
          {/* Selector de mes/año + exportar */}
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1">
                  <Label>Mes</Label>
                  <Select
                    value={commissionMonth.toString()}
                    onValueChange={(v) => setCommissionMonth(Number(v))}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        [1, 'Enero'], [2, 'Febrero'], [3, 'Marzo'], [4, 'Abril'],
                        [5, 'Mayo'], [6, 'Junio'], [7, 'Julio'], [8, 'Agosto'],
                        [9, 'Septiembre'], [10, 'Octubre'], [11, 'Noviembre'], [12, 'Diciembre']
                      ].map(([n, label]) => (
                        <SelectItem key={n} value={n.toString()}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Año</Label>
                  <Select
                    value={commissionYear.toString()}
                    onValueChange={(v) => setCommissionYear(Number(v))}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2023, 2024, 2025, 2026, 2027].map(y => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={loadData} disabled={loading} size="sm">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Generar Reporte
                </Button>
                <div className="ml-auto flex gap-2">
                  <Button
                    size="sm" variant="outline"
                    disabled={commissionExporting || commissionRows.length === 0}
                    onClick={async () => {
                      setCommissionExporting(true)
                      try {
                        await downloadCommissionReportExport(commissionMonth, commissionYear, 'pdf', filters.userId)
                        toast({ title: 'PDF descargado' })
                      } catch { toast({ title: 'Error al descargar', variant: 'destructive' } as any) }
                      finally { setCommissionExporting(false) }
                    }}
                  >
                    {commissionExporting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileText className="h-4 w-4 mr-1" />} PDF
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    disabled={commissionExporting || commissionRows.length === 0}
                    onClick={async () => {
                      setCommissionExporting(true)
                      try {
                        await downloadCommissionReportExport(commissionMonth, commissionYear, 'csv', filters.userId)
                        toast({ title: 'CSV descargado' })
                      } catch { toast({ title: 'Error al descargar', variant: 'destructive' } as any) }
                      finally { setCommissionExporting(false) }
                    }}
                  >
                    <FileText className="h-4 w-4 mr-1" /> CSV
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    disabled={commissionExporting || commissionRows.length === 0}
                    onClick={async () => {
                      setCommissionExporting(true)
                      try {
                        await downloadCommissionReportExport(commissionMonth, commissionYear, 'excel', filters.userId)
                        toast({ title: 'Excel descargado' })
                      } catch { toast({ title: 'Error al descargar', variant: 'destructive' } as any) }
                      finally { setCommissionExporting(false) }
                    }}
                  >
                    <Download className="h-4 w-4 mr-1" /> Excel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <Card><CardContent className="p-6"><div className="space-y-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div></CardContent></Card>
          ) : commissionRows.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-20 text-amber-500" />
                <p className="font-medium">No hay datos de comisiones para el período seleccionado</p>
                <p className="text-xs mt-2">Seleccione el mes y año y presione «Generar Reporte».</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    Reporte de Comisiones — {[
                      '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                    ][commissionMonth]} {commissionYear}
                    <Badge className="ml-2 bg-amber-600 text-white">{commissionRows.length} registros</Badge>
                  </CardTitle>
                  {/* Paginación superior */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">
                      Pág. {commissionPage} de {Math.ceil(commissionRows.length / COMMISSION_PAGE_SIZE)}
                    </span>
                    <Button size="sm" variant="outline" className="h-7 px-2"
                      disabled={commissionPage === 1}
                      onClick={() => setCommissionPage(p => p - 1)}
                    >←</Button>
                    <Button size="sm" variant="outline" className="h-7 px-2"
                      disabled={commissionPage >= Math.ceil(commissionRows.length / COMMISSION_PAGE_SIZE)}
                      onClick={() => setCommissionPage(p => p + 1)}
                    >→</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow className="bg-amber-50 dark:bg-amber-950/30">
                        <TableHead className="whitespace-nowrap font-bold">Carné</TableHead>
                        <TableHead className="whitespace-nowrap font-bold">Nombre</TableHead>
                        <TableHead className="whitespace-nowrap font-bold">Apellido</TableHead>
                        <TableHead className="whitespace-nowrap font-bold">Mes que Ingresa</TableHead>
                        <TableHead className="whitespace-nowrap font-bold">Cód. Carrera</TableHead>
                        <TableHead className="whitespace-nowrap font-bold text-right">Valor Q. Matrícula</TableHead>
                        <TableHead className="whitespace-nowrap font-bold">Boleta</TableHead>
                        <TableHead className="whitespace-nowrap font-bold">No. Recibo</TableHead>
                        <TableHead className="whitespace-nowrap font-bold">No. Factura</TableHead>
                        <TableHead className="whitespace-nowrap font-bold text-right">Mensualidad</TableHead>
                        <TableHead className="whitespace-nowrap font-bold">Recibo</TableHead>
                        <TableHead className="whitespace-nowrap font-bold">Boleta Mensual</TableHead>
                        <TableHead className="whitespace-nowrap font-bold">Asesor</TableHead>
                        <TableHead className="whitespace-nowrap font-bold">Fecha Inscripción</TableHead>
                        <TableHead className="whitespace-nowrap font-bold text-right bg-yellow-100 dark:bg-yellow-900/30">Pago Comisión</TableHead>
                        <TableHead className="whitespace-nowrap font-bold text-right">Monto Depósito</TableHead>
                        <TableHead className="whitespace-nowrap font-bold text-right">Pago 1</TableHead>
                        <TableHead className="whitespace-nowrap font-bold">Otros Desc.</TableHead>
                        <TableHead className="whitespace-nowrap font-bold text-right">Pago 2</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissionRows
                        .slice((commissionPage - 1) * COMMISSION_PAGE_SIZE, commissionPage * COMMISSION_PAGE_SIZE)
                        .map((row, idx) => (
                          <TableRow key={idx} className={idx % 2 === 0 ? '' : 'bg-muted/30'}>
                            <TableCell className="font-mono font-medium">{row.carnet}</TableCell>
                            <TableCell>{row.nombre}</TableCell>
                            <TableCell>{row.apellido}</TableCell>
                            <TableCell>{row.mes_ingresa}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{row.codigo_carrera}</Badge></TableCell>
                            <TableCell className="text-right font-medium">
                              {Number(row.valor_matricula) > 0 ? `Q${Number(row.valor_matricula).toLocaleString('es-GT', { minimumFractionDigits: 2 })}` : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="font-mono text-xs">{row.boleta_inscripcion || <span className="text-muted-foreground">—</span>}</TableCell>
                            <TableCell className="font-mono text-xs">{row.recibo_american || <span className="text-muted-foreground">—</span>}</TableCell>
                            <TableCell className="text-muted-foreground">—</TableCell>
                            <TableCell className="text-right">
                              {Number(row.mensualidad) > 0 ? `Q${Number(row.mensualidad).toLocaleString('es-GT', { minimumFractionDigits: 2 })}` : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="font-mono text-xs">{row.recibo_mensualidad || <span className="text-muted-foreground">—</span>}</TableCell>
                            <TableCell className="font-mono text-xs">{row.boleta_mensualidad || <span className="text-muted-foreground">—</span>}</TableCell>
                            <TableCell className="max-w-[120px] truncate" title={row.asesor}>{row.asesor || <span className="text-muted-foreground">—</span>}</TableCell>
                            <TableCell>{row.fecha_inscripcion}</TableCell>
                            <TableCell className="text-right font-bold text-amber-700 bg-yellow-50 dark:bg-yellow-900/20">
                              {Number(row.pago_comision) > 0 ? `Q${Number(row.pago_comision).toLocaleString('es-GT', { minimumFractionDigits: 2 })}` : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-right">
                              {Number(row.monto_deposito) > 0 ? `Q${Number(row.monto_deposito).toLocaleString('es-GT', { minimumFractionDigits: 2 })}` : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-right">{row.pago_1 || <span className="text-muted-foreground">—</span>}</TableCell>
                            <TableCell>{row.otros_descuentos || <span className="text-muted-foreground">—</span>}</TableCell>
                            <TableCell className="text-right">{row.pago_2 || <span className="text-muted-foreground">—</span>}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
                {/* Paginación inferior */}
                {commissionRows.length > COMMISSION_PAGE_SIZE && (
                  <div className="flex items-center justify-center gap-3 py-3 border-t text-sm">
                    <Button size="sm" variant="outline"
                      disabled={commissionPage === 1}
                      onClick={() => setCommissionPage(p => p - 1)}
                    >← Anterior</Button>
                    <span className="text-muted-foreground">
                      {Math.min((commissionPage - 1) * COMMISSION_PAGE_SIZE + 1, commissionRows.length)}–{Math.min(commissionPage * COMMISSION_PAGE_SIZE, commissionRows.length)} de {commissionRows.length}
                    </span>
                    <Button size="sm" variant="outline"
                      disabled={commissionPage >= Math.ceil(commissionRows.length / COMMISSION_PAGE_SIZE)}
                      onClick={() => setCommissionPage(p => p + 1)}
                    >Siguiente →</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

      </Tabs>
    </div>
  )
}
