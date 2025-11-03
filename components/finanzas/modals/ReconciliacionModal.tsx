"use client"

import { useCallback, useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useEstudiantesSearch } from "@/hooks/useEstudiantesSearch"
import { 
  createReconciliacion, 
  getKardex,
  type ReconciliacionCreatePayload,
  type KardexPagoResumen 
} from "@/services/mantenimientos"

// Hook para manejar la carga de kardex por prospecto
const useKardexProspecto = () => {
  const [kardexOptions, setKardexOptions] = useState<KardexPagoResumen[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const loadKardexForProspecto = useCallback(async (prospectoId: number) => {
    if (!prospectoId) {
      setKardexOptions([])
      return
    }

    setLoading(true)
    try {
      const response = await getKardex({ prospecto_id: prospectoId, limit: 50 })
      setKardexOptions(response.data || [])
    } catch (error) {
      console.error('Error loading kardex for prospecto:', error)
      setKardexOptions([])
      toast({
        title: "Error",
        description: "No se pudieron cargar los pagos del prospecto",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const clearKardex = useCallback(() => {
    setKardexOptions([])
  }, [])

  return {
    kardexOptions,
    loading,
    loadKardexForProspecto,
    clearKardex,
  }
}

interface ReconciliacionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (newReconciliacion: any) => void
}

interface FormState {
  prospecto_id: number | undefined
  bank: string
  reference: string
  amount: number
  date: string
  status: string
  kardex_pago_id: number | undefined
}

const INITIAL_FORM_STATE: FormState = {
  prospecto_id: undefined,
  bank: "",
  reference: "",
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  status: "imported",
  kardex_pago_id: undefined,
}

export const ReconciliacionModal = ({ open, onOpenChange, onSuccess }: ReconciliacionModalProps) => {
  const { toast } = useToast()
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE)
  const [submitting, setSubmitting] = useState(false)

  // Hooks personalizados
  const { 
    searchTerm, 
    setSearchTerm, 
    estudiantes, 
    loading: searchingEstudiantes,
    clearSearch,
    hasMinLength,
    error: searchError
  } = useEstudiantesSearch({ maxResults: 50 })
  
  const { 
    kardexOptions, 
    loading: loadingKardex, 
    loadKardexForProspecto, 
    clearKardex 
  } = useKardexProspecto()

  // Reset formulario cuando se abre/cierra el modal
  useEffect(() => {
    if (open) {
      setForm(INITIAL_FORM_STATE)
      clearSearch()
      clearKardex()
    }
  }, [open, clearSearch, clearKardex])

  // Manejar cambio de prospecto
  const handleProspectoChange = useCallback((prospectoId: number | undefined) => {
    setForm(prev => ({
      ...prev,
      prospecto_id: prospectoId,
      kardex_pago_id: undefined, // Reset kardex selection
    }))

    if (prospectoId) {
      loadKardexForProspecto(prospectoId)
    } else {
      clearKardex()
    }
  }, [loadKardexForProspecto, clearKardex])

  // Manejar envío del formulario
  const handleSubmit = useCallback(async () => {
    // Validaciones
    if (!form.bank || !form.reference) {
      toast({
        title: "Error",
        description: "Debe completar banco y referencia",
        variant: "destructive",
      })
      return
    }

    if (form.amount <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const payload: ReconciliacionCreatePayload = {
        prospecto_id: form.prospecto_id,
        bank: form.bank,
        reference: form.reference,
        amount: form.amount,
        date: form.date,
        status: form.status,
        kardex_pago_id: form.kardex_pago_id,
      }

      const newReconciliacion = await createReconciliacion(payload)
      
      toast({
        title: "Reconciliación creada",
        description: "La reconciliación se ha creado exitosamente",
      })
      
      onOpenChange(false)
      onSuccess(newReconciliacion)
      
    } catch (error: any) {
      console.error("Error creating reconciliation:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al crear la reconciliación",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }, [form, toast, onOpenChange, onSuccess])

  // Formatear opciones de kardex para el selector
  const kardexSelectOptions = useMemo(() => {
    return kardexOptions.map(kardex => ({
      id: kardex.id,
      label: `${kardex.monto_pagado?.toLocaleString('es-GT', { style: 'currency', currency: 'GTQ' })} - ${kardex.fecha_pago ? new Date(kardex.fecha_pago).toLocaleDateString('es-GT') : 'Sin fecha'}${kardex.numero_boleta ? ` (Boleta: ${kardex.numero_boleta})` : ''}${kardex.estado_pago ? ` - ${kardex.estado_pago}` : ''}`,
      value: kardex.id,
    }))
  }, [kardexOptions])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Crear Nueva Reconciliación Bancaria</DialogTitle>
          <DialogDescription>
            Registre una nueva conciliación bancaria y vincúlela con un estudiante y pago específico
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Selector de Estudiante/Prospecto con búsqueda optimizada */}
          <div className="grid gap-2">
            <Label htmlFor="rec-prospecto">Estudiante/Prospecto</Label>
            <div className="space-y-2">
              <Input
                placeholder="Buscar por nombre o carnet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
              {hasMinLength && (
                <Select
                  value={form.prospecto_id?.toString() || ""}
                  onValueChange={(value) => handleProspectoChange(value ? parseInt(value) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={searchingEstudiantes ? "Buscando..." : "Seleccione un estudiante"} />
                  </SelectTrigger>
                  <SelectContent>
                    {estudiantes.map((estudiante) => (
                      <SelectItem key={estudiante.estudiante_programa_id} value={estudiante.estudiante_programa_id.toString()}>
                        {estudiante.label}
                      </SelectItem>
                    ))}
                    {estudiantes.length === 0 && !searchingEstudiantes && (
                      <SelectItem value="no-results" disabled>
                        {searchError ? "Error al cargar estudiantes" : "No se encontraron resultados"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
              {!hasMinLength && (
                <p className="text-sm text-muted-foreground">
                  Escriba al menos 2 caracteres para buscar estudiantes
                </p>
              )}
            </div>
          </div>

          {/* Selector de Kardex/Pago (solo visible si se seleccionó un prospecto) */}
          {form.prospecto_id && (
            <div className="grid gap-2">
              <Label htmlFor="rec-kardex">Pago a Reconciliar</Label>
              <Select
                value={form.kardex_pago_id?.toString() || ""}
                onValueChange={(value) => setForm(prev => ({ 
                  ...prev, 
                  kardex_pago_id: value ? parseInt(value) : undefined 
                }))}
                disabled={loadingKardex}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingKardex ? "Cargando pagos..." : "Seleccione un pago (opcional)"} />
                </SelectTrigger>
                <SelectContent>
                  {kardexSelectOptions.map((option) => (
                    <SelectItem key={option.id} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                  {kardexSelectOptions.length === 0 && !loadingKardex && (
                    <SelectItem value="no-payments" disabled>
                      No se encontraron pagos para este estudiante
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Campos principales */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="rec-banco">Banco *</Label>
              <Input
                id="rec-banco"
                value={form.bank}
                onChange={(e) => setForm(prev => ({ ...prev, bank: e.target.value }))}
                placeholder="Nombre del banco"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rec-referencia">Referencia *</Label>
              <Input
                id="rec-referencia"
                value={form.reference}
                onChange={(e) => setForm(prev => ({ ...prev, reference: e.target.value }))}
                placeholder="Número de referencia bancaria"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="rec-monto">Monto *</Label>
              <Input
                id="rec-monto"
                type="number"
                step="0.01"
                value={form.amount || ""}
                onChange={(e) => setForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rec-fecha">Fecha *</Label>
              <Input
                id="rec-fecha"
                type="date"
                value={form.date}
                onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="rec-estado">Estado</Label>
            <Select
              value={form.status}
              onValueChange={(value) => setForm(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="imported">Importado</SelectItem>
                <SelectItem value="conciliado">Conciliado</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
                <SelectItem value="sin_coincidencia">Sin Coincidencia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!form.bank || !form.reference || form.amount <= 0 || submitting}
          >
            {submitting ? "Creando..." : "Crear Reconciliación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}