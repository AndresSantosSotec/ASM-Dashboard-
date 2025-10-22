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
import {
  CalendarClock,
  CheckCircle2,
  ListChecks,
  RefreshCw,
  Save,
  Search,
  Wallet,
  XCircle,
} from "lucide-react"

import {
  DEFAULT_KARDEX_RECORDS,
  KARDEX_STATUS_CLASSES,
  KARDEX_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  KardexRecord,
  KardexStatus,
  PaymentMethod,
  currencyFormatter,
  formatDisplayDate,
  normalizeDateInput,
} from "./shared"

interface KardexPagosTabProps {
  initialRecords?: KardexRecord[]
}

export function KardexPagosTab({ initialRecords }: KardexPagosTabProps) {
  const fallbackRecords = useMemo(
    () => (Array.isArray(initialRecords) && initialRecords.length > 0 ? initialRecords : DEFAULT_KARDEX_RECORDS),
    [initialRecords],
  )

  const [records, setRecords] = useState<KardexRecord[]>(() => fallbackRecords.map((record) => ({ ...record })))
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"todos" | KardexStatus>("todos")
  const [methodFilter, setMethodFilter] = useState<"todos" | PaymentMethod>("todos")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<KardexRecord | null>(null)

  useEffect(() => {
    setRecords(fallbackRecords.map((record) => ({ ...record })))
  }, [fallbackRecords])

  const totals = useMemo(
    () => ({
      applied: records.filter((record) => record.estado === "aplicado").length,
      pending: records.filter((record) => record.estado === "pendiente").length,
      annulled: records.filter((record) => record.estado === "anulado").length,
      totalAmount: records.reduce((acc, record) => acc + record.monto, 0),
    }),
    [records],
  )

  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return records.filter((record) => {
      const matchesSearch =
        query.length === 0 ||
        [record.estudiante, record.carnet, record.programa, record.concepto, record.referencia].some((field) =>
          field.toLowerCase().includes(query),
        )
      const matchesStatus = statusFilter === "todos" || record.estado === statusFilter
      const matchesMethod = methodFilter === "todos" || record.metodo === methodFilter
      return matchesSearch && matchesStatus && matchesMethod
    })
  }, [records, searchTerm, statusFilter, methodFilter])

  const handleOpenEdit = (record: KardexRecord) => {
    setEditingRecord({ ...record })
    setIsDialogOpen(true)
  }

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setEditingRecord(null)
    }
  }

  const handleSaveRecord = () => {
    if (!editingRecord) return

    setRecords((prev) => {
      const exists = prev.some((record) => record.id === editingRecord.id)
      if (exists) {
        return prev.map((record) => (record.id === editingRecord.id ? editingRecord : record))
      }
      return [editingRecord, ...prev]
    })

    setIsDialogOpen(false)
    setEditingRecord(null)
  }

  const handleResetFilters = () => {
    setSearchTerm("")
    setStatusFilter("todos")
    setMethodFilter("todos")
    setRecords(fallbackRecords.map((record) => ({ ...record })))
  }

  return (
    <div className="space-y-6">
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Mantenimiento del kardex de pagos</CardTitle>
          <CardDescription>
            Revise y ajuste los movimientos aplicados al kardex de pagos desde el panel administrativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-muted bg-background p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Movimientos registrados</p>
                  <p className="text-2xl font-semibold">{records.length}</p>
                </div>
                <ListChecks className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <div className="rounded-lg border border-muted bg-background p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Monto neto</p>
                  <p className="text-2xl font-semibold">{currencyFormatter.format(totals.totalAmount)}</p>
                </div>
                <Wallet className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <div className="rounded-lg border border-muted bg-background p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Aplicados</p>
                  <p className="text-2xl font-semibold">{totals.applied}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <div className="rounded-lg border border-muted bg-background p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-semibold">{totals.pending}</p>
                </div>
                <CalendarClock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Aplicados: {totals.applied}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-4 w-4 text-amber-500" /> Pendientes: {totals.pending}
            </span>
            <span className="inline-flex items-center gap-1">
              <XCircle className="h-4 w-4 text-red-500" /> Anulados: {totals.annulled}
            </span>
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
              placeholder="Buscar por estudiante, concepto o referencia"
              className="pl-8 sm:w-[280px]"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "todos" | KardexStatus)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="aplicado">Aplicados</SelectItem>
              <SelectItem value="pendiente">Pendientes</SelectItem>
              <SelectItem value="anulado">Anulados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={methodFilter} onValueChange={(value) => setMethodFilter(value as "todos" | PaymentMethod)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Método de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los métodos</SelectItem>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
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
          <CardTitle>Movimientos registrados</CardTitle>
          <CardDescription>
            Seleccione un movimiento para modificarlo o actualice su estado dentro del kardex.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="font-medium">{record.estudiante}</div>
                      <div className="text-xs text-muted-foreground">
                        {record.carnet} · {record.programa}
                      </div>
                      {record.notas ? <div className="text-xs text-muted-foreground">{record.notas}</div> : null}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{record.concepto}</div>
                      <div className="text-xs text-muted-foreground">Ref. {record.referencia}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {PAYMENT_METHOD_LABELS[record.metodo] ?? record.metodo}
                      </Badge>
                    </TableCell>
                    <TableCell>{currencyFormatter.format(record.monto)}</TableCell>
                    <TableCell>{formatDisplayDate(record.fecha)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("capitalize", KARDEX_STATUS_CLASSES[record.estado])}>
                        {KARDEX_STATUS_LABELS[record.estado]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(record)}>
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    No se encontraron movimientos para los filtros seleccionados.
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
            <DialogTitle>Editar movimiento del kardex</DialogTitle>
            <DialogDescription>
              Ajuste la información del movimiento para mantener el kardex sincronizado con los pagos reales.
            </DialogDescription>
          </DialogHeader>
          {editingRecord ? (
            <div className="grid gap-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="kardex-estudiante">Estudiante</Label>
                  <Input
                    id="kardex-estudiante"
                    value={editingRecord.estudiante}
                    onChange={(event) =>
                      setEditingRecord((prev) => (prev ? { ...prev, estudiante: event.target.value } : prev))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kardex-carnet">Carnet</Label>
                  <Input
                    id="kardex-carnet"
                    value={editingRecord.carnet}
                    onChange={(event) =>
                      setEditingRecord((prev) => (prev ? { ...prev, carnet: event.target.value } : prev))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="kardex-programa">Programa</Label>
                  <Input
                    id="kardex-programa"
                    value={editingRecord.programa}
                    onChange={(event) =>
                      setEditingRecord((prev) => (prev ? { ...prev, programa: event.target.value } : prev))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kardex-concepto">Concepto</Label>
                  <Input
                    id="kardex-concepto"
                    value={editingRecord.concepto}
                    onChange={(event) =>
                      setEditingRecord((prev) => (prev ? { ...prev, concepto: event.target.value } : prev))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="kardex-monto">Monto</Label>
                  <Input
                    id="kardex-monto"
                    type="number"
                    step="0.01"
                    value={editingRecord.monto}
                    onChange={(event) =>
                      setEditingRecord((prev) =>
                        prev ? { ...prev, monto: Number(event.target.value) || 0 } : prev,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kardex-fecha">Fecha</Label>
                  <Input
                    id="kardex-fecha"
                    type="date"
                    value={editingRecord.fecha}
                    onChange={(event) =>
                      setEditingRecord((prev) =>
                        prev ? { ...prev, fecha: normalizeDateInput(event.target.value) } : prev,
                      )
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="kardex-metodo">Método de pago</Label>
                  <Select
                    value={editingRecord.metodo}
                    onValueChange={(value) =>
                      setEditingRecord((prev) => (prev ? { ...prev, metodo: value as PaymentMethod } : prev))
                    }
                  >
                    <SelectTrigger id="kardex-metodo">
                      <SelectValue placeholder="Seleccione un método" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kardex-estado">Estado</Label>
                  <Select
                    value={editingRecord.estado}
                    onValueChange={(value) =>
                      setEditingRecord((prev) => (prev ? { ...prev, estado: value as KardexStatus } : prev))
                    }
                  >
                    <SelectTrigger id="kardex-estado">
                      <SelectValue placeholder="Seleccione un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aplicado">Aplicado</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="anulado">Anulado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="kardex-referencia">Referencia</Label>
                <Input
                  id="kardex-referencia"
                  value={editingRecord.referencia}
                  onChange={(event) =>
                    setEditingRecord((prev) => (prev ? { ...prev, referencia: event.target.value } : prev))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kardex-notas">Notas internas</Label>
                <Textarea
                  id="kardex-notas"
                  value={editingRecord.notas ?? ""}
                  onChange={(event) =>
                    setEditingRecord((prev) => (prev ? { ...prev, notas: event.target.value } : prev))
                  }
                  placeholder="Observaciones relevantes para el equipo financiero"
                />
              </div>
            </div>
          ) : null}
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => handleDialogChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveRecord}>
              <Save className="mr-2 h-4 w-4" /> Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
