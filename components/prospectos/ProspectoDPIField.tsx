"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ProspectoDPIFieldProps {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

/**
 * Campo DPI (Documento Personal de Identificación - Guatemala).
 * Validación: exactamente 13 dígitos numéricos.
 * Se puede usar en Editar Prospecto o en cualquier formulario de prospecto.
 */
export function ProspectoDPIField({ value, onChange, error, disabled }: ProspectoDPIFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 13)
    onChange(raw)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="dpi">DPI</Label>
      <Input
        id="dpi"
        name="dpi"
        value={value ?? ""}
        onChange={handleChange}
        placeholder="1234567890123"
        maxLength={13}
        inputMode="numeric"
        disabled={disabled}
        className={error ? "border-red-500" : ""}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <p className="text-xs text-muted-foreground">13 dígitos sin espacios ni guiones</p>
    </div>
  )
}
