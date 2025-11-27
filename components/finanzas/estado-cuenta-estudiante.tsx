"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowUpDown, ArrowUp, ArrowDown, Download, Search, Filter } from "lucide-react"
import { fetchProspectos, type ProspectoRow } from "@/services/estudiantes"
import StudentAccountModal from "./StudentAccountModal"
import { NotasPagoBadge } from "./NotasPagoBadge"
import * as pdfGenerator from "@/lib/pdf-generator"

type SortField = 'nombre' | 'monto_pagado' | 'balance' | 'fecha_pago'
type SortOrder = 'asc' | 'desc'
type PriorityMode = 'none' | 'balance' | 'pagado'

export default function GestionEstadosCuenta() {
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<'al_dia'|'bloqueado'|'all'>('all')
  const [sortField, setSortField] = useState<SortField>('monto_pagado')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [rows, setRows] = useState<ProspectoRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [totalPages, setTotalPages] = useState(0)

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // Filtros adicionales
  const [minBalance, setMinBalance] = useState("")
  const [maxBalance, setMaxBalance] = useState("")
  const [programa, setPrograma] = useState("all")

  // NUEVO: Prioridad (balance/pagado) y filtro “solo > 0”
  const [priority, setPriority] = useState<PriorityMode>('none')
  const [onlyPositive, setOnlyPositive] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const params: any = {
        q: q.trim() || undefined,
        status: status === 'all' ? undefined : status,
        program_id: programa === 'all' ? undefined : programa,
        sort_field: sortField,
        sort_order: sortOrder,
        page,
        per_page: perPage,
      }

      if (minBalance) params.min_balance = parseFloat(minBalance)
      if (maxBalance) params.max_balance = parseFloat(maxBalance)

      const { data, meta } = await fetchProspectos(params)

      // === Post-proceso en cliente: prioridad y filtro de “solo > 0” ===
      let processed = [...data]

      if (priority === 'balance') {
        if (onlyPositive) processed = processed.filter(e => Number(e.balance) > 0)
        processed.sort((a, b) => Number(b.balance) - Number(a.balance))
      } else if (priority === 'pagado') {
        if (onlyPositive) processed = processed.filter(e => Number(e.monto_pagado) > 0)
        processed.sort((a, b) => Number(b.monto_pagado) - Number(a.monto_pagado))
      }
      // Si priority === 'none', respetamos el orden que vino del backend (sortField/sortOrder)

      setRows(processed)

      // Si aplicamos “onlyPositive” con prioridad, el total visual debe reflejar lo mostrado
      const baseTotal = meta?.total ?? data.length
      const visualTotal = (priority !== 'none' && onlyPositive) ? processed.length : baseTotal
      setTotal(visualTotal)
      setTotalPages(Math.ceil(visualTotal / perPage))
    } finally {
      setLoading(false)
    }
  }

  // Cuando cambian filtros “globales”, resetea a página 1 y carga
  useEffect(() => {
    setPage(1)
    load()
  }, [q, status, sortField, sortOrder, perPage, minBalance, maxBalance, programa, priority, onlyPositive])

  // Cambios de página
  useEffect(() => {
    load()
  }, [page])

  const handleSort = (field: SortField) => {
    // Si estamos priorizando, ignora clicks de sort para no confundir
    if (priority !== 'none') return
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (priority !== 'none') return <ArrowUpDown className="w-4 h-4" />
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />
    return sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
  }

  const handleGeneratePDF = async (prospecto: ProspectoRow) => {
    try {
      const gen: any = pdfGenerator as any
      if (typeof gen.generateAccountStatePDF === 'function') {
        await gen.generateAccountStatePDF(prospecto)
      } else if (typeof gen.generateStudentAccountPDF === 'function') {
        await gen.generateStudentAccountPDF(prospecto)
      } else if (typeof gen.generate === 'function') {
        await gen.generate(prospecto)
      } else if (typeof gen.default?.generateAccountStatePDF === 'function') {
        await gen.default.generateAccountStatePDF(prospecto)
      } else {
        console.warn('No PDF generator export found on "@/lib/pdf-generator"')
      }
    } catch (error) {
      console.error('Error generando PDF:', error)
    }
  }

  const clearFilters = () => {
    setQ("")
    setStatus('all')
    setPrograma('all')
    setMinBalance("")
    setMaxBalance("")
    setSortField('monto_pagado')
    setSortOrder('desc')
    setPriority('none')
    setOnlyPositive(false)
    setPage(1)
  }

  const renderPagination = () => {
    const startPage = Math.max(1, page - 2)
    const endPage = Math.min(totalPages, page + 2)
    const pages = []
    for (let i = startPage; i <= endPage; i++) pages.push(i)

    return (
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {((page - 1) * perPage) + 1} - {Math.min(page * perPage, total)} de {total} resultados
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page <= 1 || loading}>Primera</Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1 || loading}>Anterior</Button>
          {startPage > 1 && (
            <>
              <Button variant="outline" size="sm" onClick={() => setPage(1)}>1</Button>
              {startPage > 2 && <span className="px-2">...</span>}
            </>
          )}
          {pages.map(p => (
            <Button key={p} variant={p === page ? "default" : "outline"} size="sm" onClick={() => setPage(p)}>
              {p}
            </Button>
          ))}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-2">...</span>}
              <Button variant="outline" size="sm" onClick={() => setPage(totalPages)}>{totalPages}</Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading}>Siguiente</Button>
          <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page >= totalPages || loading}>Última</Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            Estados de Cuenta (Administración)
            <Badge variant="secondary">{total} estudiantes</Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filtros principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, carnet o correo"
                value={q}
                onChange={e => setQ(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Estado de cuenta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="al_dia">Al día</SelectItem>
                <SelectItem value="bloqueado">Bloqueado</SelectItem>
              </SelectContent>
            </Select>

            {/* NUEVO: Prioridad + Solo > 0 */}
            <div className="flex items-center gap-2">
              <Select value={priority} onValueChange={(v: PriorityMode) => setPriority(v)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Priorizar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin prioridad</SelectItem>
                  <SelectItem value="pagado">Priorizar Pagado</SelectItem>
                  <SelectItem value="balance">Priorizar Balance</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Checkbox id="onlyPositive" checked={onlyPositive} onCheckedChange={(v) => setOnlyPositive(Boolean(v))} />
                <label htmlFor="onlyPositive" className="text-sm text-muted-foreground">Solo &gt; 0</label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select value={String(perPage)} onValueChange={(v) => setPerPage(Number(v))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 filas</SelectItem>
                  <SelectItem value="25">25 filas</SelectItem>
                  <SelectItem value="50">50 filas</SelectItem>
                  <SelectItem value="100">100 filas</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={clearFilters}>
                <Filter className="w-4 h-4 mr-1" />
                Limpiar
              </Button>
            </div>
          </div>

          {/* Filtros de balance */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-muted/50 rounded-lg">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Balance mínimo</label>
              <Input
                type="number"
                placeholder="0.00"
                value={minBalance}
                onChange={e => setMinBalance(e.target.value)}
                className="h-8"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Balance máximo</label>
              <Input
                type="number"
                placeholder="100000.00"
                value={maxBalance}
                onChange={e => setMaxBalance(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="md:col-span-2 flex items-end">
              <div className="text-xs text-muted-foreground">
                {loading ? 'Cargando...' : `${total} estudiantes encontrados`}
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[250px]">
                    <Button variant="ghost" onClick={() => handleSort('nombre')} className="h-auto p-0 font-semibold">
                      Estudiante {getSortIcon('nombre')}
                    </Button>
                  </TableHead>
                  <TableHead>Programas</TableHead>
                  <TableHead className="text-right">
                    <Button variant="ghost" onClick={() => handleSort('monto_pagado')} className="h-auto p-0 font-semibold">
                      Pagado {getSortIcon('monto_pagado')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button variant="ghost" onClick={() => handleSort('balance')} className="h-auto p-0 font-semibold">
                      Balance {getSortIcon('balance')}
                    </Button>
                  </TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right w-[160px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        Cargando...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron resultados con los filtros actuales
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r, index) => (
                    <TableRow key={r.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm flex items-center gap-2">
                            {r.nombre}
                            {r.carnet && (
                              <NotasPagoBadge 
                                carnet={r.carnet} 
                                variant="icon"
                                onViewNotes={() => {
                                  window.open(`/finanzas/notas?carnet=${r.carnet}`, '_blank')
                                }}
                              />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {r.carnet ? `Carnet: ${r.carnet}` : 'Sin carnet'}
                          </div>
                          {(((r as any).email) || ((r as any).correo)) && (
                            <div className="text-xs text-muted-foreground">{(r as any).email ?? (r as any).correo}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="max-w-[200px]">
                          {r.programas?.map(p => p.programa).filter(Boolean).join(", ") || (
                            <span className="text-muted-foreground italic">Sin programa asignado</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <div className={`font-semibold ${r.monto_pagado > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                          Q{r.monto_pagado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <div className={`font-semibold ${r.balance > 0 ? 'text-red-600' : r.balance === 0 ? 'text-green-600' : 'text-blue-600'}`}>
                          Q{r.balance.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {r.bloqueado ? (
                            <Badge variant="destructive" className="text-xs">Bloqueado</Badge>
                          ) : (
                            <Badge className="bg-green-500 hover:bg-green-600 text-xs">Al día</Badge>
                          )}
                          {/* ✅ Mostrar excepciones activas */}
                          {r.excepciones && r.excepciones.categories && r.excepciones.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {r.excepciones.skip_late_fee && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                                  ⚡ Sin Mora
                                </Badge>
                              )}
                              {r.excepciones.skip_blocking && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                                  🔓 Sin Bloqueo
                                </Badge>
                              )}
                              {r.excepciones.allows_partial_payments && (
                                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-300">
                                  💸 Parciales
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setSelectedId(r.id); setModalOpen(true) }}
                            className="text-xs"
                          >
                            Ver estado
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGeneratePDF(r)}
                            className="text-xs"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {!loading && rows.length > 0 && renderPagination()}
        </CardContent>
      </Card>

      <StudentAccountModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
        prospectoId={selectedId ?? undefined} 
      />
    </>
  )
}
