"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Download,
  Search,
  Phone,
  Mail,
  MessageSquare,
  Loader2,
} from "lucide-react"

// servicios
import {
  getPayments,
  listPayments,
  fetchLatePayments,
  fetchStudentSnapshot,
} from "@/services/finance"

import type { LatePaymentStudent } from "@/types/collections"
import { toast } from "@/hooks/use-toast"
import ContactProspectDialog from "@/components/finanzas/ContactProspectDialog"

// 🎨 Skeleton Components
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 py-3 border-b">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-[180px]" />
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-8 w-[100px] rounded-full" />
          <Skeleton className="h-8 w-[80px] rounded" />
        </div>
      ))}
    </div>
  )
}

function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-[200px]" />
        <Skeleton className="h-4 w-[150px] mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[200px] w-full" />
      </CardContent>
    </Card>
  )
}

export function GestionPagos() {
  const [activeTab, setActiveTab] = useState<"late-payments" | "upcoming-payments" | "recent-payments">("late-payments")

  // filtros (atrasados)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [bucketFilter, setBucketFilter] = useState<"all" | "b1" | "b2" | "b3" | "b4">("all")
  const [programaFilter, setProgramaFilter] = useState("")
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  // datos
  const [latePayments, setLatePayments] = useState<LatePaymentStudent[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [payments, setPayments] = useState<any[]>([]) // listado general (para "siguientes pagos")

  const [loading, setLoading] = useState(true)
  const [latePaymentsLoading, setLatePaymentsLoading] = useState(false) // 🆕 Loading específico

  // ---------- estado para ContactProspectDialog ----------
  const [contactOpen, setContactOpen] = useState(false)
  const [contactProspectoId, setContactProspectoId] = useState<number | undefined>(undefined)
  const [contactCtx, setContactCtx] = useState<{ nombre: string; programa?: string; fecha?: string; monto?: number } | undefined>(undefined)

  // ---------- filtros + paginación para "Pagos recientes" ----------
  const [rpQ, setRpQ] = useState("")
  const [rpStatus, setRpStatus] = useState<'aprobado' | 'pendiente' | 'rechazado' | 'all'>('aprobado')
  const [rpMethod, setRpMethod] = useState<'all' | 'cash' | 'card' | 'transfer' | 'deposit' | 'check'>('all')
  const [rpProgramId, setRpProgramId] = useState<string>('all')

  const [rpPage, setRpPage] = useState(1)
  const [rpPerPage, setRpPerPage] = useState(10)
  const [rpTotal, setRpTotal] = useState(0)
  const [rpRows, setRpRows] = useState<any[]>([])
  const [rpLoading, setRpLoading] = useState(false)
  const [rpProgramOptions, setRpProgramOptions] = useState<Array<{ id: string; name: string }>>([])

  // debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400)
    return () => clearTimeout(t)
  }, [searchQuery])

  // 🚀 OPTIMIZACIÓN: Cargar solo late payments al inicio
  const loadLatePayments = async () => {
    setLatePaymentsLoading(true)
    try {
      const latePaymentsParams = {
        q: debouncedSearch || searchQuery || undefined,
        bucket: bucketFilter !== 'all' ? bucketFilter : undefined,
        programa_id: programaFilter || undefined,
        page,
        per_page: perPage,
      }

      const late = await fetchLatePayments(latePaymentsParams)
      // Normalize rows so they conform to LatePaymentStudent (ensure lastContact is string | null)
      const normalizedLate = Array.isArray(late.data)
        ? late.data.map((r: any) => ({
            ...r,
            lastContact: r.lastContact ?? null,
          }))
        : []
      setLatePayments(normalizedLate as LatePaymentStudent[])
      setTotalRows(late.meta?.total || (Array.isArray(late.data) ? late.data.length : 0))
    } catch (e) {
      console.error('Error loading late payments:', e)
      toast({
        title: "Error",
        description: "No se pudieron cargar los pagos atrasados",
        variant: 'destructive',
      })
    } finally {
      setLatePaymentsLoading(false)
    }
  }

  // 🚀 LAZY LOADING: Solo cargar payments cuando se active el tab
  const loadOthers = async () => {
    try {
      // Usar listPayments con paginación en lugar de getPayments
      const { data } = await listPayments({ 
        per_page: 100,  // Cargar primeros 100 registros para otros tabs
        sort: '-fecha_pago' 
      })
      setPayments(data)
    } catch (e) {
      console.error('Error loading payment data:', e)
      // No mostrar toast aquí, puede ser que no se necesiten aún
    }
  }

  // 🚀 Cargar solo late payments al inicio
  useEffect(() => {
    setLoading(true)
    loadLatePayments().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, searchQuery, bucketFilter, programaFilter, page, perPage])

  // 🚀 Cargar otros datos solo cuando se cambie de tab
  useEffect(() => {
    if (activeTab !== 'late-payments' && payments.length === 0) {
      loadOthers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // UI helpers
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "activo":
      case "aprobado":
      case "completado":
        return "default"
      case "bloqueado":
      case "rechazado":
        return "destructive"
      case "pendiente":
      case "advertencia":
      default:
        return "outline"
    }
  }

  const getBucketVariant = (b: string) => {
    switch (b) {
      case "B1": return "outline"
      case "B2": return "secondary"
      case "B3": return "default"
      case "B4": return "destructive"
      default: return "outline"
    }
  }

  const getBucketText = (b: string) => {
    switch (b) {
      case "B1": return "0-5 días"
      case "B2": return "6-10 días"
      case "B3": return "11-30 días"
      case "B4": return "+30 días"
      default: return ""
    }
  }

  // ----------- abrir ContactProspectDialog desde "Atrasados" -----------
const openProspectContactFromLate = async (student: LatePaymentStudent) => {
  try {
    // 1) Usar directamente el studentId como prospecto_id (basado en el patrón del sistema)
    let prospectoId: number | undefined = Number(student.studentId) || undefined

    // 2) Si no viene studentId, intentar con el prospectoId del objeto
    if (!prospectoId && student.prospectoId) {
      prospectoId = student.prospectoId
    }

    // 3) Fallback: usar snapshot con EP ID si es necesario
    if (!prospectoId && student?.id) {
      try {
        const snap = await fetchStudentSnapshot(student.id)
        prospectoId =
            Number(
              (snap as any)?.prospecto_id ??
              snap?.ep?.prospecto?.id ??
              snap?.prospectoId
            ) || undefined
      } catch (e) {
        console.warn("No se pudo resolver prospecto desde snapshot:", e)
      }
    }

    // 4) Contexto para plantillas
    setContactCtx({
      nombre: student.name,
      programa: student.program,
      monto: Number(student.totalDebt ?? 0),
      fecha: undefined,
    })

    // 5) Abrir diálogo con el prospecto ID encontrado
    setContactProspectoId(prospectoId)
    setContactOpen(true)

    // Log para debugging
    console.log(`Abriendo contacto para alumno ${student.name} (studentId: ${student.studentId}, prospectoId: ${prospectoId})`)

    // Solo mostrar warning si no se pudo resolver ningún ID
    if (!prospectoId) {
      toast({
        title: "Sin ficha vinculada",
        description: `No se encontró prospecto para Alumno-${student.studentId}. Puedes contactar manualmente.`,
      })
    }
  } catch (error) {
    console.error("Error opening contact dialog:", error)
    toast({
      title: "Error",
      description: "No se pudo abrir el diálogo de contacto",
      variant: "destructive",
    })
  }
}

  // ----------- datasets derivados de `payments` para "Siguientes pagos" -----------
  const { upcomingPayments } = useMemo(() => {
    const now = new Date()
    const in30d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const normDate = (v: any) => (v ? new Date(v) : null)
    const list = (Array.isArray(payments) ? payments : []).map((p: any) => ({
      ...p,
      fecha_pago: normDate(p.fecha_pago),
      due_date: normDate(p.due_date ?? p.fecha_vencimiento ?? p.vencimiento),
      estado: p.estado_pago ?? p.estado ?? "pendiente",
      monto: Number(p.monto_pagado ?? p.monto ?? p.importe ?? 0),
      alumno: p.studentName ?? p.alumno ?? p.estudiante ?? "-",
      carnet: p.carnet ?? p.studentId ?? "-",
      programa: p.programa?.nombre_del_programa ?? p.programa ?? "-",
    }))

    const upcoming = list
      .filter(p => p.estado === "pendiente" && p.due_date && p.due_date > now)
      .sort((a, b) => (a.due_date as any) - (b.due_date as any))

    const upcoming30 = upcoming.filter(p => p.due_date! <= in30d)

    return { upcomingPayments: upcoming30 }
  }, [payments])

  // fuente para atrasados
  const studentsData = latePayments

  // ----------- cargar "Pagos recientes" con filtros + paginación -----------
  const loadRecentPayments = async () => {
    setRpLoading(true)

    const to = new Date()
    const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)

    try {
      const { data, meta } = await getPayments({
        status: rpStatus === 'all' ? undefined : rpStatus,
        method: rpMethod === 'all' ? undefined : rpMethod,
        program_id: rpProgramId === 'all' ? undefined : rpProgramId,
        q: rpQ || undefined,
        fecha_inicio: from.toISOString(),
        fecha_fin: to.toISOString(),
        page: rpPage,
        per_page: rpPerPage,
        sort: '-fecha_pago',
      })

      setRpRows(Array.isArray(data) ? data : (data?.data ?? []))
      setRpTotal(meta?.total ?? (Array.isArray(data) ? data.length : (data?.data?.length ?? 0)))

      // Derivar opciones de programa de la página actual
      const map = new Map<string, string>()
      const current = Array.isArray(data) ? data : (data?.data ?? [])
      for (const r of current) {
        const pid = String(r?.program_id ?? r?.programId ?? '')
        const pname = r?.programa?.nombre_del_programa ?? r?.program_name ?? r?.programa ?? ''
        if (pid && pname && !map.has(pid)) map.set(pid, pname)
      }
      setRpProgramOptions(Array.from(map.entries()).map(([id, name]) => ({ id, name })))
    } catch (e) {
      toast({ title: "Error", description: "No se pudieron cargar los pagos recientes", variant: "destructive" })
    } finally {
      setRpLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab !== 'recent-payments') return
    loadRecentPayments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, rpQ, rpStatus, rpMethod, rpProgramId, rpPage, rpPerPage])

  // ----------- abrir ContactProspectDialog desde fila de "Pagos recientes" -----------
  const openProspectContactFromPayment = (row: any) => {
    const pid = Number(row?.prospecto_id ?? row?.prospectId ?? row?.prospecto?.id ?? row?.id)
    setContactProspectoId(Number.isFinite(pid) ? pid : undefined)

    setContactCtx({
      nombre: row?.studentName ?? row?.alumno ?? 'Estudiante',
      programa: row?.programa?.nombre_del_programa ?? row?.programa ?? row?.program_name,
      fecha: row?.fecha_pago ? new Date(row.fecha_pago).toLocaleDateString('es-GT') : undefined,
      monto: Number(row?.monto_pagado ?? row?.monto ?? row?.importe ?? 0),
    })

    setContactOpen(true)
  }

  // ----------- abrir ContactProspectDialog desde "Siguientes pagos" -----------
  const openProspectContactFromUpcoming = (payment: any) => {
    const pid = Number(payment?.prospecto_id ?? payment?.prospectId ?? payment?.id)
    setContactProspectoId(Number.isFinite(pid) ? pid : undefined)

    setContactCtx({
      nombre: payment.alumno,
      programa: payment.programa,
      fecha: payment.due_date ? new Date(payment.due_date).toLocaleDateString('es-GT') : undefined,
      monto: Number(payment.monto ?? 0),
    })

    setContactOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Pagos</h2>
          <p className="text-muted-foreground">Dashboard para contactar y enviar recordatorios de pagos</p>
        </div>
      </div>

      <Tabs defaultValue="late-payments" className="space-y-4" onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="late-payments">Pagos Atrasados</TabsTrigger>
          <TabsTrigger value="upcoming-payments">Siguientes pagos</TabsTrigger>
          <TabsTrigger value="recent-payments">Pagos recientes</TabsTrigger>
        </TabsList>

        {/* --- Pagos atrasados --- */}
        <TabsContent value="late-payments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Alumnos con Pagos Atrasados</CardTitle>
                  <CardDescription>Listado de alumnos con cuotas pendientes para contactar</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar alumno, carnet o EP ID..."
                      className="pl-8 w-full md:w-[250px]"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setPage(1)
                      }}
                    />
                  </div>
                  <Select
                    value={bucketFilter}
                    onValueChange={(v) => {
                      setBucketFilter(v as any)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Bucket de mora" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los buckets</SelectItem>
                      <SelectItem value="b1">B1 (0-5 días)</SelectItem>
                      <SelectItem value="b2">B2 (6-10 días)</SelectItem>
                      <SelectItem value="b3">B3 (11-30 días)</SelectItem>
                      <SelectItem value="b4">B4 (+30 días)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* 🎨 Skeleton Loader Moderno */}
              {latePaymentsLoading || loading ? (
                <TableSkeleton rows={perPage} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Alumno</TableHead>
                      <TableHead>Deuda Total</TableHead>
                      <TableHead>Meses</TableHead>
                      <TableHead>Días Atraso</TableHead>
                      <TableHead>Bucket</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentsData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No hay alumnos con pagos atrasados
                      </TableCell>
                    </TableRow>
                  ) : (
                    studentsData.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell><Checkbox id={`select-${student.id}`} /></TableCell>
                        <TableCell>
                          <div className="font-medium">{student.name}</div>
                          <div className="text-xs text-muted-foreground">
                            EP-{student.id} | Alumno-{student.studentId} - {student.program}
                          </div>
                        </TableCell>
                        <TableCell>
                          Q{(student.totalDebt || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{student.lateMonths}</TableCell>
                        <TableCell>{student.daysLate}</TableCell>
                        <TableCell>
                          <Badge variant={getBucketVariant(student.bucket)}>
                            {student.bucket} ({getBucketText(student.bucket)})
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getBadgeVariant(student.status)}>
                            {student.status === "activo" ? "Activo" : student.status === "bloqueado" ? "Bloqueado" : student.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => openProspectContactFromLate(student)} disabled={loading}>
                            <Phone className="h-4 w-4 mr-1" /> Contactar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                </Table>
              )}
            </CardContent>

            <CardFooter className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Mostrando {studentsData.length} de {totalRows} alumnos con pagos atrasados
              </div>
              <div className="flex items-center gap-2">
                <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1) }}>
                  <SelectTrigger className="w-[110px]"><SelectValue placeholder="Filas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>
                    Anterior
                  </Button>
                  <span className="text-sm">Página {page}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={studentsData.length < perPage || loading}>
                    Siguiente
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline">
                    <Mail className="mr-2 h-4 w-4" /> Enviar Recordatorios
                  </Button>
                  <Button variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" /> Enviar SMS
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* --- Siguientes pagos --- */}
        <TabsContent value="upcoming-payments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Siguientes pagos (próximos 30 días)</CardTitle>
                  <CardDescription>Cuotas pendientes con vencimiento cercano para recordar</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* 🎨 Skeleton para tab de "Siguientes pagos" */}
              {loading && payments.length === 0 ? (
                <TableSkeleton rows={5} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alumno</TableHead>
                      <TableHead>Programa</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Vence</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingPayments.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Sin vencimientos próximos</TableCell></TableRow>
                    ) : (
                    upcomingPayments.map((p: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <div className="font-medium">{p.alumno}</div>
                          <div className="text-xs text-muted-foreground">{p.carnet}</div>
                        </TableCell>
                        <TableCell className="text-sm">{p.programa}</TableCell>
                        <TableCell>Q{p.monto.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>{p.due_date ? new Date(p.due_date).toLocaleDateString('es-GT') : "-"}</TableCell>
                        <TableCell><Badge variant={getBadgeVariant(p.estado)}>{p.estado}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => openProspectContactFromUpcoming(p)}>
                            <Phone className="h-4 w-4 mr-1" /> Recordar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Pagos recientes (con filtros + paginación + Contactar) --- */}
        <TabsContent value="recent-payments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div>
                  <CardTitle>Pagos recientes (últimos 30 días)</CardTitle>
                  <CardDescription>Pagos registrados con opción de contacto de seguimiento</CardDescription>
                </div>
                <div className="flex flex-col md:flex-row gap-2">
                  <Input
                    placeholder="Buscar estudiante / carnet / boleta"
                    value={rpQ}
                    onChange={(e) => { setRpQ(e.target.value); setRpPage(1) }}
                  />
                  <Select value={rpStatus} onValueChange={(v: any) => { setRpStatus(v); setRpPage(1) }}>
                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aprobado">Aprobado</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="rechazado">Rechazado</SelectItem>
                      <SelectItem value="all">Todos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={rpMethod} onValueChange={(v: any) => { setRpMethod(v); setRpPage(1) }}>
                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="Método" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="card">Tarjeta</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                      <SelectItem value="deposit">Depósito</SelectItem>
                      <SelectItem value="check">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alumno</TableHead>
                    <TableHead>Programa</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rpLoading ? (
                    <TableRow><TableCell colSpan={7}><TableSkeleton rows={rpPerPage} /></TableCell></TableRow>
                  ) : rpRows.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No hay pagos recientes</TableCell></TableRow>
                  ) : (
                    rpRows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">
                          <div>{r.studentName ?? r.alumno ?? '—'}</div>
                          <div className="text-xs text-muted-foreground">{r.carnet ?? r.studentId ?? ''}</div>
                        </TableCell>
                        <TableCell>{r.programa?.nombre_del_programa ?? r.program_name ?? r.programa ?? '—'}</TableCell>
                        <TableCell className="text-sm">{r.metodo_pago ?? r.method ?? '—'}</TableCell>
                        <TableCell>{r.fecha_pago ? new Date(r.fecha_pago).toLocaleDateString('es-GT') : "—"}</TableCell>
                        <TableCell className="text-right">
                          Q{Number(r.monto_pagado ?? r.monto ?? r.importe ?? 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={getBadgeVariant(r.estado_pago ?? r.estado ?? 'pendiente')}>
                            {r.estado_pago ?? r.estado ?? '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => openProspectContactFromPayment(r)}>
                            Contactar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Paginación */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 mt-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {rpRows.length} de {rpTotal} pagos
                </div>
                <div className="flex items-center gap-2">
                  <Select value={String(rpPerPage)} onValueChange={(v) => { setRpPerPage(Number(v)); setRpPage(1) }}>
                    <SelectTrigger className="w-[110px]"><SelectValue placeholder="Filas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setRpPage(p => Math.max(1, p - 1))} disabled={rpPage <= 1 || rpLoading}>
                      Anterior
                    </Button>
                    <span className="text-sm">
                      Página {rpPage}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRpPage(p => p + 1)}
                      disabled={rpLoading || (rpRows.length < rpPerPage && rpRows.length < rpTotal)}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* -------- ContactProspectDialog (WhatsApp / Email) -------- */}
      <ContactProspectDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        prospectoId={contactProspectoId}
        contextoPago={contactCtx}
      />
    </div>
  )
}