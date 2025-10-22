"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { CalendarClock, RefreshCw, Save, Search, Users, Wallet } from "lucide-react"

import {
  DEFAULT_STUDENT_QUOTAS,
  PLAN_TYPE_LABELS,
  QUOTA_STATUS_CLASSES,
  QUOTA_STATUS_LABELS,
  PlanType,
  StudentQuotaRecord,
  StudentQuotaStatus,
  currencyFormatter,
  formatDisplayDate,
  normalizeDateInput,
} from "./shared"

interface CuotasEstudiantesTabProps {
  initialQuotas?: StudentQuotaRecord[]
}

export function CuotasEstudiantesTab({ initialQuotas }: CuotasEstudiantesTabProps) {
  const fallbackQuotas = useMemo(
    () => (Array.isArray(initialQuotas) && initialQuotas.length > 0 ? initialQuotas : DEFAULT_STUDENT_QUOTAS),
    [initialQuotas],
  )

  const [records, setRecords] = useState<StudentQuotaRecord[]>(() => fallbackQuotas.map((quota) => ({ ...quota })))
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"todos" | StudentQuotaStatus>("todos")
  const [planFilter, setPlanFilter] = useState<"todos" | PlanType>("todos")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingQuota, setEditingQuota] = useState<StudentQuotaRecord | null>(null)

  useEffect(() => {
    setRecords(fallbackQuotas.map((quota) => ({ ...quota })))
  }, [fallbackQuotas])

  const totals = useMemo(
    () => ({
      total: records.length,
      totalPendiente: records.reduce((acc, quota) => acc + quota.cuotasPendientes * quota.montoCuota, 0),
      enMora: records.filter((quota) => quota.estado === "en-mora").length,
      reestructurados: records.filter((quota) => quota.estado === "restructurado").length,
    }),
    [records],
  )

  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return records.filter((quota) => {
      const matchesSearch =
        query.length === 0 ||
        [quota.estudiante, quota.carnet, quota.programa].some((field) => field.toLowerCase().includes(query))
      const matchesStatus = statusFilter === "todos" || quota.estado === statusFilter
      const matchesPlan = planFilter === "todos" || quota.tipoPlan === planFilter
      return matchesSearch && matchesStatus && matchesPlan
    })
  }, [records, searchTerm, statusFilter, planFilter])

  const handleOpenEdit = (quota: StudentQuotaRecord) => {
    setEditingQuota({ ...quota })
    setIsDialogOpen(true)
  }

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setEditingQuota(null)
    }
  }

  const handleSaveQuota = () => {
    if (!editingQuota) return

    setRecords((prev) => prev.map((quota) => (quota.id === editingQuota.id ? { ...editingQuota } : quota)))

    setIsDialogOpen(false)
    setEditingQuota(null)
  }

  const handleResetFilters = () => {
    setSearchTerm("")
    setStatusFilter("todos")
    setPlanFilter("todos")
    setRecords(fallbackQuotas.map((quota) => ({ ...quota })))
  }

  return (
    <div className="space-y-6">
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Mantenimiento de cuotas por estudiante</CardTitle>
          <CardDescription>
            Actualice planes de pago, fechas y montos de las cuotas asignadas a cada estudiante.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-muted bg-background p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Estudiantes activos</p>
                  <p className="text-2xl font-semibold">{totals.total}</p>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <div className="rounded-lg border border-muted bg-background p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Saldo estimado</p>
                  <p className="text-2xl font-semibold">{currencyFormatter.format(totals.totalPendiente)}</p>
                </div>
                <Wallet className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <div className="rounded-lg border border-muted bg-background p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">En mora</p>
                  <p className="text-2xl font-semibold">{totals.enMora}</p>
                </div>
                <CalendarClock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            <div className="rounded-lg border border-muted bg-background p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Planes reestructurados</p>
                  <p className="text-2xl font-semibold">{totals.reestructurados}</p>
                </div>
                <RefreshCw className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por estudiante, carnet o programa"
              className="pl-8 sm:w-[260px]"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "todos" | StudentQuotaStatus)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="al-dia">Al día</SelectItem>
              <SelectItem value="en-mora">En mora</SelectItem>
              <SelectItem value="restructurado">Reestructurados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={planFilter} onValueChange={(value) => setPlanFilter(value as "todos" | PlanType)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Tipo de plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los planes</SelectItem>
              {Object.entries(PLAN_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={handleResetFilters} className="w-full md:w-auto">
          <RefreshCw className="mr-2 h-4 w-4" /> Restablecer filtros
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cuotas por estudiante</CardTitle>
          <CardDescription>
            Gestione los ajustes de cuotas pendientes, próximas fechas de pago y estados de cada plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Plan de pago</TableHead>
                <TableHead>Cuotas pendientes</TableHead>
                <TableHead>Próxima cuota</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((quota) => {
                  const totalEstimado = quota.cuotasPendientes * quota.montoCuota
                  return (
                    <TableRow key={quota.id}>
                      <TableCell>
                        <div className="font-medium">{quota.estudiante}</div>
                        <div className="text-xs text-muted-foreground">
                          {quota.carnet} · {quota.programa}
                        </div>
                        {quota.notas ? <div className="text-xs text-muted-foreground">{quota.notas}</div> : null}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{PLAN_TYPE_LABELS[quota.tipoPlan] ?? quota.tipoPlan}</div>
                        <div className="text-xs text-muted-foreground">
                          Monto: {currencyFormatter.format(quota.montoCuota)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{quota.cuotasPendientes}</div>
                        <div className="text-xs text-muted-foreground">
                          Estimado: {currencyFormatter.format(totalEstimado)}
                        </div>
                      </TableCell>
                      <TableCell>{formatDisplayDate(quota.proximaCuota)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("capitalize", QUOTA_STATUS_CLASSES[quota.estado])}>
                          {QUOTA_STATUS_LABELS[quota.estado]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(quota)}>
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No se encontraron cuotas con los filtros seleccionados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar plan de cuotas</DialogTitle>
            <DialogDescription>
              Modifique los montos, fechas o notas de seguimiento asociadas al plan del estudiante seleccionado.
            </DialogDescription>
          </DialogHeader>
          {editingQuota ? (
            <div className="grid gap-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cuota-estudiante">Estudiante</Label>
                  <Input
                    id="cuota-estudiante"
                    value={editingQuota.estudiante}
                    onChange={(event) =>
                      setEditingQuota((prev) => (prev ? { ...prev, estudiante: event.target.value } : prev))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuota-carnet">Carnet</Label>
                  <Input
                    id="cuota-carnet"
                    value={editingQuota.carnet}
                    onChange={(event) => setEditingQuota((prev) => (prev ? { ...prev, carnet: event.target.value } : prev))}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cuota-programa">Programa</Label>
                  <Input
                    id="cuota-programa"
                    value={editingQuota.programa}
                    onChange={(event) =>
                      setEditingQuota((prev) => (prev ? { ...prev, programa: event.target.value } : prev))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuota-plan">Tipo de plan</Label>
                  <Select
                    value={editingQuota.tipoPlan}
                    onValueChange={(value) =>
                      setEditingQuota((prev) => (prev ? { ...prev, tipoPlan: value as PlanType } : prev))
                    }
                  >
                    <SelectTrigger id="cuota-plan">
                      <SelectValue placeholder="Seleccione un plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PLAN_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cuota-monto">Monto por cuota</Label>
                  <Input
                    id="cuota-monto"
                    type="number"
                    step="0.01"
                    value={editingQuota.montoCuota}
                    onChange={(event) =>
                      setEditingQuota((prev) =>
                        prev ? { ...prev, montoCuota: Number(event.target.value) || 0 } : prev,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuota-pendientes">Cuotas pendientes</Label>
                  <Input
                    id="cuota-pendientes"
                    type="number"
                    min={0}
                    value={editingQuota.cuotasPendientes}
                    onChange={(event) =>
                      setEditingQuota((prev) =>
                        prev ? { ...prev, cuotasPendientes: Math.max(Number(event.target.value) || 0, 0) } : prev,
                      )
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cuota-proxima">Próxima fecha de pago</Label>
                  <Input
                    id="cuota-proxima"
                    type="date"
                    value={editingQuota.proximaCuota}
                    onChange={(event) =>
                      setEditingQuota((prev) =>
                        prev ? { ...prev, proximaCuota: normalizeDateInput(event.target.value) } : prev,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuota-estado">Estado del plan</Label>
                  <Select
                    value={editingQuota.estado}
                    onValueChange={(value) =>
                      setEditingQuota((prev) => (prev ? { ...prev, estado: value as StudentQuotaStatus } : prev))
                    }
                  >
                    <SelectTrigger id="cuota-estado">
                      <SelectValue placeholder="Seleccione un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="al-dia">Al día</SelectItem>
                      <SelectItem value="en-mora">En mora</SelectItem>
                      <SelectItem value="restructurado">Reestructurado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cuota-notas">Notas internas</Label>
                <Textarea
                  id="cuota-notas"
                  value={editingQuota.notas ?? ""}
                  onChange={(event) => setEditingQuota((prev) => (prev ? { ...prev, notas: event.target.value } : prev))}
                  placeholder="Detalle acuerdos, compromisos o seguimientos pendientes"
                />
              </div>
            </div>
          ) : null}
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => handleDialogChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveQuota}>
              <Save className="mr-2 h-4 w-4" /> Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
