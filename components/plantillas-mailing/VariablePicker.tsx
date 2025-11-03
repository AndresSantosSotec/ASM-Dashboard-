"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Copy, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export interface Variable {
  nombre: string
  descripcion: string
  ejemplo: string
}

interface VariablePickerProps {
  variables: Variable[]
  onInsert?: (variable: string) => void
  usedVariables?: string[]
}

export function VariablePicker({ variables, onInsert, usedVariables = [] }: VariablePickerProps) {
  const [search, setSearch] = useState("")
  const [copiedVar, setCopiedVar] = useState<string | null>(null)

  // Fix: handle undefined variables
  const safeVariables = variables || []
  
  const filteredVariables = safeVariables.filter(
    (v) =>
      v.nombre.toLowerCase().includes(search.toLowerCase()) ||
      v.descripcion.toLowerCase().includes(search.toLowerCase())
  )

  const handleInsert = (variable: string) => {
    const varTag = `{{${variable}}}`
    
    if (onInsert) {
      onInsert(varTag)
      toast.success(`Variable ${varTag} insertada`)
    } else {
      // Copiar al portapapeles si no hay callback
      navigator.clipboard.writeText(varTag)
      setCopiedVar(variable)
      toast.success(`Variable ${varTag} copiada`)
      setTimeout(() => setCopiedVar(null), 2000)
    }
  }

  const isVariableUsed = (nombre: string) => {
    return usedVariables.includes(nombre)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Variables Disponibles</CardTitle>
        <CardDescription className="text-xs">
          Haz clic en "Insertar" para agregar la variable al contenido
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar variable..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>

        <ScrollArea className="h-[400px] pr-3">
          <div className="space-y-2">
            {filteredVariables.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No se encontraron variables
              </p>
            ) : (
              filteredVariables.map((variable) => (
                <div
                  key={variable.nombre}
                  className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                          {`{{${variable.nombre}}}`}
                        </code>
                        {isVariableUsed(variable.nombre) && (
                          <Badge variant="secondary" className="text-xs py-0 px-1.5 h-5">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            En uso
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {variable.descripcion}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleInsert(variable.nombre)}
                      className="h-7 px-2 text-xs shrink-0"
                    >
                      {copiedVar === variable.nombre ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          {onInsert ? "Insertar" : "Copiar"}
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground">Ejemplo:</span>
                    <span className="font-medium">{variable.ejemplo}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {usedVariables.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              Variables utilizadas en esta plantilla:
            </p>
            <div className="flex flex-wrap gap-1">
              {usedVariables.map((varName) => (
                <Badge key={varName} variant="secondary" className="text-xs">
                  {`{{${varName}}}`}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
