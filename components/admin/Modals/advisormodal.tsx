"use client"

import React, { useState, useEffect } from "react"
import Swal from "sweetalert2"
// Ajusta las rutas de importación según la estructura real de tu proyecto:
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

interface Advisor {
  id: string
  name: string
}

interface AdvisorModalProps {
  advisor: Advisor
  onClose: () => void
  refreshData: () => void
}

const AdvisorModal: React.FC<AdvisorModalProps> = ({ advisor, onClose, refreshData }) => {
  const [commissionRate, setCommissionRate] = useState<string>("")
  const [isNewCommission, setIsNewCommission] = useState<boolean>(false)

  useEffect(() => {
    const loadCommissionRate = async () => {
      try {
        const response = await fetch(`/api/commissions/rates/${advisor.id}`)
        const data = await response.json()
        setCommissionRate(data.rate || "")
        setIsNewCommission(!data.rate)
      } catch (error) {
        console.error("Error fetching commission rate:", error)
      }
    }

    loadCommissionRate()
  }, [advisor.id])

  const handleSave = async () => {
    try {
      const method = isNewCommission ? "POST" : "PUT"
      const url = isNewCommission
        ? "/api/commissions/rates"
        : `/api/commissions/rates/${advisor.id}`

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: advisor.id, rate: commissionRate }),
      })

      const data = await response.json()
      Swal.fire("Comisión actualizada", "", "success")
      onClose()
      refreshData()  // Refresca los datos para reflejar la nueva comisión
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Error desconocido"
      Swal.fire("Error", errMsg, "error")
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Comisión del Asesor: {advisor.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="commission-rate">Comisión</Label>
            <Input
              id="commission-rate"
              type="number"
              value={commissionRate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCommissionRate(e.target.value)}
              placeholder="Ingrese la tasa de comisión"
            />
            <p className="text-sm text-muted-foreground">
              Porcentaje de comisión para este asesor.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="commission-slider">Tasa de Comisión</Label>
            <Slider
              id="commission-slider"
              min={0}
              max={100}
              step={0.5}
              value={[parseFloat(commissionRate) || 0]}
              onValueChange={(value: number[]) => setCommissionRate(value[0].toString())}
            />
            <div className="flex justify-between">
              <span className="text-sm font-medium">Vista previa: {commissionRate}%</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AdvisorModal