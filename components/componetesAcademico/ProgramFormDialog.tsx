// src/components/componentesAcademico/ProgramFormDialog.tsx
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Programa, PricePlan } from "./types"
import { Trash2, CheckCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface Props {
  open: boolean
  mode: "add" | "edit"
  program?: Programa
  onClose: () => void
  onSave: (p: Programa) => void
  onDelete?: (id: number) => void
}

export default function ProgramFormDialog({ open, mode, program, onClose, onSave, onDelete }: Props) {
  const [data, setData] = useState<Programa | null>(null)
  const [newRequirement, setNewRequirement] = useState("")
  const [newPlan, setNewPlan] = useState<PricePlan>({ inscripcion: 0, cuotaMensual: 0, meses: 0 })

  useEffect(() => {
    if (open) {
      setData(
        program ?? {
          id: 0,
          abreviatura: "",
          nombre: "",
          activo: true,
          meses: 0,
          createdAt: new Date().toISOString(),
          pricePlans: [],
        },
      )
      setNewRequirement("")
      setNewPlan({ inscripcion: 0, cuotaMensual: 0, meses: 0 })
    }
  }, [open, program])

  if (!data) return null

  /* ======== Handlers UI ======== */
  const addRequirement = () => {
    if (!newRequirement.trim()) return
    // @ts-ignore (guardamos en prop ficticia)
    setData({ ...data, requirements: [...(data as any).requirements ?? [], newRequirement.trim()] })
    setNewRequirement("")
  }

  const removeRequirement = (req: string) => {
    // @ts-ignore
    setData({ ...data, requirements: (data as any).requirements.filter((r: string) => r !== req) })
  }

  const addPlan = () => {
    setData({ ...data, pricePlans: [...data.pricePlans, newPlan] })
    setNewPlan({ inscripcion: 0, cuotaMensual: 0, meses: 0 })
  }

  const removePlan = (idx: number) => {
    setData({ ...data, pricePlans: data.pricePlans.filter((_, i) => i !== idx) })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Agregar" : "Editar"} Programa Académico</DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Complete los datos y presione Guardar."
              : "Actualice los datos y presione Guardar cambios."}
          </DialogDescription>
        </DialogHeader>

        {/* ---------- FORM ---------- */}
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <Tabs defaultValue="general">
            {/* Tabs header */}
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="general">Información General</TabsTrigger>
              <TabsTrigger value="requirements">Requisitos</TabsTrigger>
              <TabsTrigger value="payment">Costos y Pagos</TabsTrigger>
            </TabsList>

            {/* === General === */}
            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código / Abreviatura</Label>
                  <Input value={data.abreviatura} onChange={(e) => setData({ ...data, abreviatura: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Duración (meses)</Label>
                  <Input
                    type="number"
                    value={data.meses}
                    onChange={(e) => setData({ ...data, meses: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={data.nombre} onChange={(e) => setData({ ...data, nombre: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={data.activo ? "activo" : "inactivo"}
                  onValueChange={(v) => setData({ ...data, activo: v === "activo" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* === Requirements === */}
            <TabsContent value="requirements" className="space-y-4">
              <Label>Requisitos de Admisión</Label>
              <div className="flex space-x-2">
                <Input
                  className="flex-1"
                  value={newRequirement}
                  placeholder="Agregar requisito"
                  onChange={(e) => setNewRequirement(e.target.value)}
                />
                <Button size="sm" type="button" onClick={addRequirement}>
                  Agregar
                </Button>
              </div>
              {/* @ts-ignore */}
              {(data as any).requirements?.map?.((req: string, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{req}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeRequirement(req)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </TabsContent>

            {/* === Payment === */}
            <TabsContent value="payment" className="space-y-4">
              <Label>Planes de Pago</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Matrícula (inscripción)</Label>
                  <Input
                    type="number"
                    value={newPlan.inscripcion || ""}
                    onChange={(e) => setNewPlan({ ...newPlan, inscripcion: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cuota mensual</Label>
                  <Input
                    type="number"
                    value={newPlan.cuotaMensual || ""}
                    onChange={(e) => setNewPlan({ ...newPlan, cuotaMensual: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Meses</Label>
                  <Input
                    type="number"
                    value={newPlan.meses || ""}
                    onChange={(e) => setNewPlan({ ...newPlan, meses: Number(e.target.value) })}
                  />
                </div>
              </div>
              <Button onClick={addPlan} className="w-full" type="button">
                Agregar plan
              </Button>

              {data.pricePlans.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 border rounded-md">
                  <span>
                    Inscripción ${p.inscripcion} · {p.meses} × ${p.cuotaMensual}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => removePlan(idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* ---------- FOOTER ---------- */}
        <DialogFooter className="flex justify-between">
          {mode === "edit" && onDelete && (
            <Button variant="destructive" onClick={() => onDelete(data.id)}>
              Eliminar
            </Button>
          )}
          <div className="space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={() => onSave(data)}>Guardar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
