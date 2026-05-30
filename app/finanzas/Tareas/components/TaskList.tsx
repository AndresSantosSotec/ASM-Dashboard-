import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, Clock3, AlertCircle, Search, Loader2, Plus, Trash2 } from 'lucide-react'
import {
  getNotasPagoResumen,
  marcarFacturaEmitida,
  type NotaPagoResumen,
} from '@/services/tareas'
import {
  fetchTareasContables,
  createTareaContable,
  updateTareaContable,
  deleteTareaContable,
  type TareaContable,
  type TareaContablePrioridad,
  type TareaContableCategoria,
} from '@/services/tareas-contables'
import { getConciliacionesRevisionManual, type ConciliacionRevisionManual } from '@/services/mantenimientos'
import { toast } from '@/hooks/use-toast'

type TaskStatus = 'pending' | 'in_progress' | 'action_required' | 'done'
type TaskPriority = 'critical' | 'high' | 'medium' | 'low'
type TaskCategory = 'invoice' | 'payment_distribution' | 'reminder'

type TaskItem = {
  id: number
  key: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  category: TaskCategory
  owner: string
  dueDate: string
  amount?: number
  sourceType: 'nota_factura' | 'revision_manual' | 'tarea_contable'
  carnet?: string
  originalId?: number
  canComplete?: boolean
  canDelete?: boolean
}

const categoryLabel: Record<TaskCategory, string> = {
  invoice: 'Facturas Pendientes',
  payment_distribution: 'Distribución de Pagos',
  reminder: 'Recordatorios',
}

const statusLabel: Record<TaskStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  action_required: 'Requiere acción',
  done: 'Completada',
}

const priorityLabel: Record<TaskPriority, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

const formatCurrency = (value?: number) => {
  if (!value) return '-'
  return `Q ${value.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const statusIcon = (status: TaskStatus) => {
  if (status === 'action_required') return <AlertCircle className="h-4 w-4 text-red-500" />
  if (status === 'in_progress') return <Clock3 className="h-4 w-4 text-blue-500" />
  if (status === 'done') return <CheckCircle2 className="h-4 w-4 text-green-600" />
  return <Clock3 className="h-4 w-4 text-amber-500" />
}

const TaskList = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [hiddenTaskKeys, setHiddenTaskKeys] = useState<string[]>([])
  const [hiddenLoaded, setHiddenLoaded] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all')
  const [activeSection, setActiveSection] = useState<'all' | TaskCategory>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newTask, setNewTask] = useState<{
    titulo: string
    descripcion: string
    fecha: string
    prioridad: TareaContablePrioridad
    categoria: TareaContableCategoria
    responsable: string
    monto: string
  }>({
    titulo: '',
    descripcion: '',
    fecha: new Date().toISOString().slice(0, 10),
    prioridad: 'medium',
    categoria: 'reminder',
    responsable: 'Contabilidad',
    monto: '',
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem('finanzas_tareas_ocultas')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setHiddenTaskKeys(parsed.filter((v) => typeof v === 'string'))
        }
      }
    } catch {
      // noop
    } finally {
      setHiddenLoaded(true)
    }
  }, [])

  const persistHiddenKeys = (next: string[]) => {
    setHiddenTaskKeys(next)
    try {
      localStorage.setItem('finanzas_tareas_ocultas', JSON.stringify(next))
    } catch {
      // noop
    }
  }

  const hideTask = (task: TaskItem) => {
    if (!task.key) return
    if (hiddenTaskKeys.includes(task.key)) return
    persistHiddenKeys([...hiddenTaskKeys, task.key])
    setTasks((prev) => prev.filter((t) => t.key !== task.key))
    toast({
      title: 'Tarea oculta',
      description: 'La tarea repetitiva se ocultó de esta bandeja.',
    })
  }

  const clearHiddenTasks = () => {
    persistHiddenKeys([])
    loadBoardData()
  }

  const dedupeTasks = (rows: TaskItem[]) => {
    const map = new Map<string, TaskItem>()
    for (const row of rows) {
      if (hiddenTaskKeys.includes(row.key)) continue

      const existing = map.get(row.key)
      if (!existing) {
        map.set(row.key, row)
        continue
      }

      // Conserva la versión más crítica si viene repetida.
      const rank = { critical: 4, high: 3, medium: 2, low: 1 }
      if ((rank[row.priority] ?? 0) > (rank[existing.priority] ?? 0)) {
        map.set(row.key, row)
      }
    }

    return Array.from(map.values())
  }

  const mapNotasFactura = (rows: NotaPagoResumen[]): TaskItem[] => {
    return rows
      .filter((row) => !row.factura_emitida && !!row.ultima_fecha_pago)
      .map((row, idx) => {
        const fechaPago = row.ultima_fecha_pago || new Date().toISOString().slice(0, 10)
        const diasSinFactura = Math.floor((Date.now() - new Date(fechaPago).getTime()) / 86400000)
        const prioridad: TaskPriority = diasSinFactura >= 10 ? 'critical' : diasSinFactura >= 5 ? 'high' : 'medium'

        return {
          id: 100000 + idx,
          key: `nota_factura:${row.carnet}`,
          title: `Emitir factura pendiente a ${row.nombre_completo}`,
          status: diasSinFactura >= 10 ? 'action_required' : 'pending',
          priority: prioridad,
          category: 'invoice',
          owner: 'Tesorería',
          dueDate: fechaPago,
          amount: row.ultimo_monto_pago ?? undefined,
          sourceType: 'nota_factura',
          carnet: row.carnet,
          canComplete: true,
        }
      })
  }

  const mapRevisionManual = (rows: ConciliacionRevisionManual[]): TaskItem[] => {
    return rows.map((row, idx) => ({
      id: 200000 + idx,
      key: `revision_manual:${row.id}`,
      title: `Revisar conciliación ${row.reference || 'sin referencia'} (${row.bank || 'Sin banco'})`,
      status: 'action_required',
      priority: 'critical',
      category: 'payment_distribution',
      owner: 'Conciliación',
      dueDate: row.date || new Date().toISOString().slice(0, 10),
      amount: Number(row.amount || 0),
      sourceType: 'revision_manual',
      originalId: row.id,
      canComplete: false,
    }))
  }

  const mapTareasContables = (rows: TareaContable[]): TaskItem[] => {
    return rows
      .filter((row) => !row.completada)
      .map((row, idx) => ({
        id: 300000 + idx,
        key: `tarea_contable:${row.id}`,
        title: row.titulo,
        status: (row.estado ?? 'pending') as TaskStatus,
        priority: (row.prioridad ?? 'medium') as TaskPriority,
        category: (row.categoria ?? 'reminder') as TaskCategory,
        owner: row.responsable || 'Contabilidad',
        dueDate: row.fecha,
        amount: row.monto != null ? Number(row.monto) : undefined,
        sourceType: 'tarea_contable',
        originalId: row.id,
        canComplete: true,
        canDelete: true,
      }))
  }

  const loadBoardData = async () => {
    setLoading(true)
    try {
      const [notasRes, revisionRes, tareasRes] = await Promise.all([
        getNotasPagoResumen({ page: 1, per_page: 200 }),
        getConciliacionesRevisionManual(),
        fetchTareasContables(),
      ])

      const realTasks = [
        ...mapNotasFactura(notasRes.data),
        ...mapRevisionManual(revisionRes.conciliaciones ?? []),
        ...mapTareasContables(tareasRes ?? []),
      ]

      setTasks(dedupeTasks(realTasks))
    } catch (error: any) {
      toast({
        title: 'Error al cargar tablero',
        description: error?.response?.data?.message || error?.message || 'No se pudieron cargar los datos reales.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!hiddenLoaded) return
    loadBoardData()
  }, [hiddenLoaded])

  const summary = useMemo(() => {
    const pending = tasks.filter(t => t.status !== 'done').length
    const critical = tasks.filter(t => t.priority === 'critical' && t.status !== 'done').length
    const totalAmount = tasks
      .filter(t => t.status !== 'done')
      .reduce((acc, t) => acc + (t.amount ?? 0), 0)

    return { pending, critical, totalAmount }
  }, [tasks])

  const filtered = useMemo(() => {
    return tasks.filter(task => {
      if (activeSection !== 'all' && task.category !== activeSection) return false
      if (statusFilter !== 'all' && task.status !== statusFilter) return false
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false

      if (!query.trim()) return true
      const term = query.toLowerCase()
      return (
        task.title.toLowerCase().includes(term) ||
        task.owner.toLowerCase().includes(term) ||
        categoryLabel[task.category].toLowerCase().includes(term)
      )
    })
  }, [tasks, query, statusFilter, priorityFilter, activeSection])

  const updateStatus = (id: number, nextStatus: TaskStatus) => {
    setTasks(prev => prev.map(item => (item.id === id ? { ...item, status: nextStatus } : item)))
  }

  const handleCreate = async () => {
    if (!newTask.titulo.trim() || !newTask.fecha) {
      toast({
        title: 'Datos incompletos',
        description: 'Indica al menos un título y la fecha.',
        variant: 'destructive',
      })
      return
    }
    try {
      setCreating(true)
      await createTareaContable({
        titulo: newTask.titulo.trim(),
        descripcion: newTask.descripcion.trim() || undefined,
        fecha: newTask.fecha,
        prioridad: newTask.prioridad,
        categoria: newTask.categoria,
        responsable: newTask.responsable.trim() || undefined,
        monto: newTask.monto ? Number(newTask.monto) : null,
      })
      toast({
        title: 'Tarea creada',
        description: 'La tarea contable se registró correctamente.',
      })
      setCreateOpen(false)
      setNewTask({
        titulo: '',
        descripcion: '',
        fecha: new Date().toISOString().slice(0, 10),
        prioridad: 'medium',
        categoria: 'reminder',
        responsable: 'Contabilidad',
        monto: '',
      })
      await loadBoardData()
    } catch (error: any) {
      toast({
        title: 'No se pudo crear la tarea',
        description: error?.response?.data?.message || error?.message || 'Error desconocido.',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (task: TaskItem) => {
    if (task.sourceType !== 'tarea_contable' || !task.originalId) return
    if (!window.confirm('¿Eliminar esta tarea contable?')) return
    try {
      setProcessingId(task.id)
      await deleteTareaContable(task.originalId)
      setTasks(prev => prev.filter(t => t.id !== task.id))
      toast({ title: 'Tarea eliminada', description: 'La tarea contable se eliminó.' })
    } catch (error: any) {
      toast({
        title: 'No se pudo eliminar',
        description: error?.response?.data?.message || error?.message || 'Error desconocido.',
        variant: 'destructive',
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleComplete = async (task: TaskItem) => {
    if (!task.canComplete) {
      window.location.href = '/finanzas/Tareas?tab=reconciliation&view=manual_review'
      return
    }

    try {
      setProcessingId(task.id)

      if (task.sourceType === 'nota_factura' && task.carnet) {
        await marcarFacturaEmitida(task.carnet, true)
      }

      if (task.sourceType === 'tarea_contable' && task.originalId) {
        await updateTareaContable(task.originalId, { completada: true })
      }

      updateStatus(task.id, 'done')
      toast({
        title: 'Acción completada',
        description: 'La tarea se actualizó con datos reales del sistema.',
      })
    } catch (error: any) {
      toast({
        title: 'No se pudo completar',
        description: error?.response?.data?.message || error?.message || 'Ocurrió un error al actualizar la tarea.',
        variant: 'destructive',
      })
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Tareas Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.pending}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-700">Críticas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-700">{summary.critical}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-700">Monto por Gestionar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(summary.totalAmount)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <h3 className="text-lg font-semibold">Próximas Acciones</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => {
            setStatusFilter('all')
            setPriorityFilter('all')
            setQuery('')
          }}>
            Limpiar filtros
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nueva Tarea
          </Button>
          <Button size="sm" variant="outline" onClick={clearHiddenTasks}>
            Mostrar ocultas
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando datos reales de notas, conciliación y tareas...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative md:col-span-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar tarea, área o categoría"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | TaskStatus)}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="in_progress">En progreso</SelectItem>
            <SelectItem value="action_required">Requiere acción</SelectItem>
            <SelectItem value="done">Completada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as 'all' | TaskPriority)}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las prioridades</SelectItem>
            <SelectItem value="critical">Crítica</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="low">Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeSection} onValueChange={(v) => setActiveSection(v as 'all' | TaskCategory)} className="space-y-3">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="all">Todo</TabsTrigger>
          <TabsTrigger value="invoice">Facturas</TabsTrigger>
          <TabsTrigger value="payment_distribution">Distribución</TabsTrigger>
          <TabsTrigger value="reminder">Recordatorios</TabsTrigger>
        </TabsList>

        <TabsContent value={activeSection} className="space-y-0">
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarea</TableHead>
                  <TableHead>Sección</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Fecha límite</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(task => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{categoryLabel[task.category]}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {statusIcon(task.status)}
                        <span>{statusLabel[task.status]}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={task.priority === 'critical' ? 'destructive' : 'secondary'}>
                        {priorityLabel[task.priority]}
                      </Badge>
                    </TableCell>
                    <TableCell>{task.owner}</TableCell>
                    <TableCell>{task.dueDate}</TableCell>
                    <TableCell>{formatCurrency(task.amount)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (task.sourceType === 'revision_manual') {
                              window.location.href = '/finanzas/Tareas?tab=reconciliation&view=manual_review'
                              return
                            }
                            updateStatus(task.id, 'in_progress')
                          }}
                        >
                          {task.sourceType === 'revision_manual' ? 'Revisar' : 'Tomar'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={processingId === task.id}
                          onClick={() => handleComplete(task)}
                        >
                          {processingId === task.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (task.sourceType === 'revision_manual' ? 'Abrir' : 'Completar')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => hideTask(task)}
                        >
                          Ocultar
                        </Button>
                        {task.canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={processingId === task.id}
                            onClick={() => handleDelete(task)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                      No hay tareas que coincidan con los filtros.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva tarea contable</DialogTitle>
            <DialogDescription>
              Registra una tarea exclusiva del área contable. No se mezcla con las tareas de asesores.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            <div className="grid gap-1">
              <Label htmlFor="tc-titulo">Título *</Label>
              <Input
                id="tc-titulo"
                value={newTask.titulo}
                onChange={(e) => setNewTask((p) => ({ ...p, titulo: e.target.value }))}
                placeholder="Ej. Conciliar transferencia BAM 12345"
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="tc-desc">Descripción</Label>
              <Textarea
                id="tc-desc"
                value={newTask.descripcion}
                onChange={(e) => setNewTask((p) => ({ ...p, descripcion: e.target.value }))}
                placeholder="Detalle de la tarea contable"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label htmlFor="tc-fecha">Fecha *</Label>
                <Input
                  id="tc-fecha"
                  type="date"
                  value={newTask.fecha}
                  onChange={(e) => setNewTask((p) => ({ ...p, fecha: e.target.value }))}
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="tc-monto">Monto (Q)</Label>
                <Input
                  id="tc-monto"
                  type="number"
                  min={0}
                  step="0.01"
                  value={newTask.monto}
                  onChange={(e) => setNewTask((p) => ({ ...p, monto: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>Prioridad</Label>
                <Select
                  value={newTask.prioridad}
                  onValueChange={(v) => setNewTask((p) => ({ ...p, prioridad: v as TareaContablePrioridad }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Crítica</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label>Categoría</Label>
                <Select
                  value={newTask.categoria}
                  onValueChange={(v) => setNewTask((p) => ({ ...p, categoria: v as TareaContableCategoria }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">Facturas</SelectItem>
                    <SelectItem value="payment_distribution">Distribución</SelectItem>
                    <SelectItem value="reminder">Recordatorio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="tc-resp">Responsable</Label>
              <Input
                id="tc-resp"
                value={newTask.responsable}
                onChange={(e) => setNewTask((p) => ({ ...p, responsable: e.target.value }))}
                placeholder="Contabilidad"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Crear tarea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TaskList