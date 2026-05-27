import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Database, Repeat2, CalendarDays, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  getMantenimientosFinancierosLite,
  type KardexPagoResumen,
  type ReconciliationRecordResumen,
  type CuotaProgramaResumen,
} from '@/services/mantenimientos'
import { toast } from '@/hooks/use-toast'

type LiteModule = 'kardex' | 'reconciliaciones' | 'cuotas'

const formatDate = (date?: string | null) => {
  if (!date) return '-'
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date)
  if (!m) return date
  return `${m[3]}/${m[2]}/${m[1]}`
}

const formatCurrency = (amount?: number | null) => {
  const value = Number(amount || 0)
  return `Q ${value.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const ReportesLitePanel = () => {
  const [activeModule, setActiveModule] = useState<LiteModule>('kardex')
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState<Set<LiteModule>>(new Set())

  const [search, setSearch] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [bankFilter, setBankFilter] = useState('todos')
  const [estadoFilter, setEstadoFilter] = useState('todos')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(15)

  const [kardexRows, setKardexRows] = useState<KardexPagoResumen[]>([])
  const [reconciliacionRows, setReconciliacionRows] = useState<ReconciliationRecordResumen[]>([])
  const [cuotasRows, setCuotasRows] = useState<CuotaProgramaResumen[]>([])

  const [kardexTotal, setKardexTotal] = useState<number>(0)
  const [reconciliacionTotal, setReconciliacionTotal] = useState<number>(0)
  const [cuotasTotal, setCuotasTotal] = useState<number>(0)

  const [optionsBanks, setOptionsBanks] = useState<string[]>([])
  const [optionsStatus, setOptionsStatus] = useState<string[]>([])
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 15,
    total: 0,
    total_pages: 1,
    from: null as number | null,
    to: null as number | null,
  })

  const currentRowsCount = activeModule === 'kardex'
    ? kardexRows.length
    : activeModule === 'reconciliaciones'
      ? reconciliacionRows.length
      : cuotasRows.length

  const showInitialLoading = loading && currentRowsCount === 0

  const loadModule = async (module: LiteModule, nextPage?: number) => {
    setLoading(true)
    try {
      const params: any = {
        module,
        page: nextPage ?? page,
        per_page: perPage,
        search: search || undefined,
        fecha_inicio: fechaInicio || undefined,
        fecha_fin: fechaFin || undefined,
      }

      if (bankFilter !== 'todos' && (module === 'kardex' || module === 'reconciliaciones')) {
        params.banco = bankFilter
      }

      if (estadoFilter !== 'todos') {
        if (module === 'kardex') params.estado_pago = estadoFilter
        if (module === 'reconciliaciones') params.estado_reconciliacion = estadoFilter
        if (module === 'cuotas') params.estado_cuota = estadoFilter
      }

      const data = await getMantenimientosFinancierosLite(params)

      if (module === 'kardex') {
        setKardexTotal(data.summary.total || 0)
        setKardexRows((data.rows || []) as KardexPagoResumen[])
      }

      if (module === 'reconciliaciones') {
        setReconciliacionTotal(data.summary.total || 0)
        setReconciliacionRows((data.rows || []) as ReconciliationRecordResumen[])
      }

      if (module === 'cuotas') {
        setCuotasTotal(data.summary.total || 0)
        setCuotasRows((data.rows || []) as CuotaProgramaResumen[])
      }

      setOptionsBanks(data.options?.bancos || [])
      setOptionsStatus(data.options?.estados || [])
      setPagination(data.pagination)
      setPage(data.pagination.current_page)

      setLoaded((prev) => new Set(prev).add(module))
    } catch (error: any) {
      toast({
        title: 'Error al cargar reporte',
        description: error?.response?.data?.message || error?.message || 'No fue posible cargar la sección.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    setBankFilter('todos')
    setEstadoFilter('todos')
  }, [activeModule])

  useEffect(() => {
    if (!loaded.has(activeModule)) {
      loadModule(activeModule, 1)
    }
  }, [activeModule])

  useEffect(() => {
    if (!loaded.has(activeModule)) return
    const t = setTimeout(() => {
      loadModule(activeModule, 1)
    }, 300)
    return () => clearTimeout(t)
  }, [search, fechaInicio, fechaFin, bankFilter, estadoFilter, perPage])

  const cards = useMemo(() => ([
    {
      key: 'kardex',
      title: 'Kardex',
      value: kardexTotal,
      icon: <Database className="h-4 w-4" />,
    },
    {
      key: 'reconciliaciones',
      title: 'Conciliaciones',
      value: reconciliacionTotal,
      icon: <Repeat2 className="h-4 w-4" />,
    },
    {
      key: 'cuotas',
      title: 'Cuotas',
      value: cuotasTotal,
      icon: <CalendarDays className="h-4 w-4" />,
    },
  ]), [kardexTotal, reconciliacionTotal, cuotasTotal])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {cards.map((c) => (
          <Card key={c.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                {c.icon}
                {c.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeModule} onValueChange={(v) => setActiveModule(v as LiteModule)} className="space-y-3">
        <TabsList>
          <TabsTrigger value="kardex">Kardex</TabsTrigger>
          <TabsTrigger value="reconciliaciones">Conciliaciones</TabsTrigger>
          <TabsTrigger value="cuotas">Cuotas</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2">
          <Input
            className="lg:col-span-2"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          {(activeModule === 'kardex' || activeModule === 'reconciliaciones') ? (
            <Select value={bankFilter} onValueChange={setBankFilter}>
              <SelectTrigger><SelectValue placeholder="Banco" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los bancos</SelectItem>
                {optionsBanks.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <div />
          )}
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              {optionsStatus.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-between items-center gap-3">
          <div className="text-sm text-muted-foreground">
            Mostrando {pagination.from ?? 0} - {pagination.to ?? 0} de {pagination.total}
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Cargando {activeModule}...
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadModule(activeModule, page)}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><RefreshCw className="h-4 w-4 mr-1" />Actualizar sección</>}
          </Button>
        </div>

        <TabsContent value="kardex">
          <Card>
            <CardHeader>
              <CardTitle>Movimientos recientes de Kardex</CardTitle>
              <CardDescription>Vista ligera para operar desde Tareas sin abrir reportes completos.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Boleta</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kardexRows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{formatDate(r.fecha_pago || r.fecha_recibo)}</TableCell>
                        <TableCell>{r.numero_boleta || '-'}</TableCell>
                        <TableCell>{r.banco || '-'}</TableCell>
                        <TableCell>{formatCurrency(r.monto_pagado)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{r.estado_pago || '-'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {showInitialLoading && activeModule === 'kardex' && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                          <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Cargando movimientos...</span>
                        </TableCell>
                      </TableRow>
                    )}
                    {!showInitialLoading && kardexRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6">Sin datos</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reconciliaciones">
          <Card>
            <CardHeader>
              <CardTitle>Conciliaciones recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reconciliacionRows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{formatDate(r.date)}</TableCell>
                        <TableCell>{r.reference || '-'}</TableCell>
                        <TableCell>{r.bank || '-'}</TableCell>
                        <TableCell>{formatCurrency(r.amount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{r.status || '-'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {showInitialLoading && activeModule === 'reconciliaciones' && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                          <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Cargando conciliaciones...</span>
                        </TableCell>
                      </TableRow>
                    )}
                    {!showInitialLoading && reconciliacionRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6">Sin datos</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cuotas">
          <Card>
            <CardHeader>
              <CardTitle>Cuotas recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead># Cuota</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Alumno</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cuotasRows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.numero_cuota}</TableCell>
                        <TableCell>{formatDate(r.fecha_vencimiento)}</TableCell>
                        <TableCell>{formatCurrency(r.monto)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{r.estado || '-'}</Badge>
                        </TableCell>
                        <TableCell>{r.prospecto?.nombre || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {showInitialLoading && activeModule === 'cuotas' && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                          <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Cargando cuotas...</span>
                        </TableCell>
                      </TableRow>
                    )}
                    {!showInitialLoading && cuotasRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6">Sin datos</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between border-t pt-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filas</span>
          <Select value={String(perPage)} onValueChange={(v) => setPerPage(Number(v))}>
            <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[10, 15, 25, 50].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Página {pagination.current_page} de {Math.max(1, pagination.total_pages)}</span>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={loading || pagination.current_page <= 1}
            onClick={() => loadModule(activeModule, pagination.current_page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={loading || pagination.current_page >= Math.max(1, pagination.total_pages)}
            onClick={() => loadModule(activeModule, pagination.current_page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ReportesLitePanel
