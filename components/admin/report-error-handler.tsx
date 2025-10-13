"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  AlertCircle, 
  FileText, 
  Database, 
  CheckCircle, 
  XCircle,
  Info,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { useState } from "react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface ReportErrorHandlerProps {
  error: string
  onRetry?: () => void
  onClose?: () => void
}

export function ReportErrorHandler({ error, onRetry, onClose }: ReportErrorHandlerProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [showTechnical, setShowTechnical] = useState(false)
  const [copied, setCopied] = useState(false)

  // Detect if this is a boolean comparison error
  const isBooleanError = error.includes("boolean") && 
    (error.includes("integer") || error.includes("SQLSTATE[42883]"))

  // Detect if this is a type mismatch error
  const isTypeError = error.includes("operador no existe") || 
    error.includes("el operador no existe")

  const copyToClipboard = () => {
    navigator.clipboard.writeText(error)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              No se pudo cargar el reporte
            </CardTitle>
            <CardDescription className="text-red-600">
              {isBooleanError || isTypeError 
                ? "Error de compatibilidad de base de datos detectado"
                : "Ha ocurrido un error al generar el reporte"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main error message */}
        <Alert variant="destructive">
          <Database className="h-4 w-4" />
          <AlertTitle>Error de Base de Datos</AlertTitle>
          <AlertDescription>
            {isBooleanError ? (
              <>
                El sistema ha detectado un problema de compatibilidad entre el tipo de datos 
                <span className="font-mono bg-red-100 px-1 rounded"> boolean </span> 
                y 
                <span className="font-mono bg-red-100 px-1 rounded"> integer </span> 
                en PostgreSQL.
              </>
            ) : (
              "Se ha producido un error al ejecutar la consulta de base de datos."
            )}
          </AlertDescription>
        </Alert>

        {/* Explanation for boolean error */}
        {(isBooleanError || isTypeError) && (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-900">¿Qué está pasando?</h4>
                  <p className="text-sm text-blue-800">
                    PostgreSQL maneja los valores booleanos (verdadero/falso) de manera diferente a MySQL. 
                    La columna <code className="bg-blue-100 px-1 rounded">activo</code> está definida como 
                    <code className="bg-blue-100 px-1 rounded">boolean</code> (true/false), pero la consulta 
                    está intentando compararla con un número entero (1 o 0).
                  </p>
                </div>
              </div>
            </div>

            {/* Solution steps */}
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  Solución
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-700">
                  Este error debe corregirse en el backend de Laravel. Los desarrolladores del backend 
                  deben actualizar las consultas SQL para usar comparaciones booleanas correctas.
                </p>

                <Collapsible open={showDetails} onOpenChange={setShowDetails}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between" size="sm">
                      <span>Ver pasos de solución detallados</span>
                      {showDetails ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 space-y-2">
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5">1</Badge>
                        <div>
                          <p className="font-medium">Localizar la consulta problemática</p>
                          <p className="text-gray-600 text-xs mt-1">
                            Buscar en el backend el controlador o servicio que genera reportes de matrícula
                          </p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5">2</Badge>
                        <div>
                          <p className="font-medium">Corregir la comparación</p>
                          <div className="mt-2 space-y-2">
                            <div>
                              <p className="text-xs text-gray-600 mb-1">❌ Incorrecto:</p>
                              <code className="block bg-red-50 border border-red-200 p-2 rounded text-xs overflow-x-auto">
                                CASE WHEN prospectos.activo = 1 THEN 'Activo' ELSE 'Inactivo' END
                              </code>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">✅ Correcto:</p>
                              <code className="block bg-green-50 border border-green-200 p-2 rounded text-xs overflow-x-auto">
                                CASE WHEN prospectos.activo THEN 'Activo' ELSE 'Inactivo' END
                              </code>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5">3</Badge>
                        <div>
                          <p className="font-medium">Aplicar el mismo cambio en todas las consultas</p>
                          <p className="text-gray-600 text-xs mt-1">
                            Buscar y reemplazar todas las ocurrencias de <code className="bg-gray-200 px-1 rounded">activo = 1</code> 
                            {" "}con <code className="bg-gray-200 px-1 rounded">activo = true</code> o simplemente <code className="bg-gray-200 px-1 rounded">activo</code>
                          </p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5">4</Badge>
                        <div>
                          <p className="font-medium">Probar el reporte nuevamente</p>
                          <p className="text-gray-600 text-xs mt-1">
                            Verificar que el reporte se genera correctamente después de aplicar los cambios
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-amber-900">Nota para desarrolladores</p>
                          <p className="text-amber-700 text-xs mt-1">
                            Consulte el documento <code className="bg-amber-100 px-1 rounded">BACKEND_BOOLEAN_FIX.md</code> 
                            {" "}en la raíz del repositorio para obtener instrucciones detalladas de implementación.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Technical details */}
        <Collapsible open={showTechnical} onOpenChange={setShowTechnical}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between" size="sm">
              <span className="text-xs flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Detalles técnicos
              </span>
              {showTechnical ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="bg-gray-900 text-gray-100 rounded-lg p-3 text-xs font-mono overflow-x-auto relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <CheckCircle className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
              <pre className="whitespace-pre-wrap break-words pr-8">{error}</pre>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Additional help */}
        <div className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="font-medium text-gray-700">¿Necesita más ayuda?</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Contacte al equipo de desarrollo backend</li>
              <li>Revise la documentación en <code className="bg-gray-200 px-1 rounded">BACKEND_BOOLEAN_FIX.md</code></li>
              <li>Verifique los logs del servidor para más información</li>
            </ul>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between gap-2">
        {onClose && (
          <Button variant="outline" onClick={onClose} size="sm">
            Cerrar
          </Button>
        )}
        {onRetry && (
          <Button onClick={onRetry} size="sm">
            Reintentar
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          asChild
          className="ml-auto"
        >
          <a 
            href="https://github.com/AndresSantosSotec/ASM-Dashboard-/blob/main/BACKEND_BOOLEAN_FIX.md" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1"
          >
            <FileText className="h-3 w-3" />
            Ver documentación completa
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}

// Helper component for the collapsible section
export default ReportErrorHandler
