// Demo page to showcase the error handler component
// This file demonstrates how the error handler looks and works
// To use: Copy this to app/demo/error-handler/page.tsx

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import ReportErrorHandler from "@/components/admin/report-error-handler"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function ErrorHandlerDemoPage() {
  const [showError, setShowError] = useState(false)
  const [errorType, setErrorType] = useState<'boolean' | 'generic'>('boolean')

  const booleanError = `SQLSTATE[42883]: Undefined function: 7 ERROR: el operador no existe: boolean = integer LINE 1: ...grama" as "programa", CASE WHEN prospectos.activo = 1 THEN 'Activo' ELSE 'Inactivo' END as estado from "estudiante_programa" inner join "prospectos" on "estudiante_programa"."prospecto_id" = "prospectos"."id" inner join "tb_programas" on "estudiante_programa"."programa_id" = "tb_programas"."id" where "estudiante_programa"."created_at" between 2025-10-01 and 2025-10-31 and "estudiante_programa"."deleted_at" is null`

  const genericError = `Error al conectar con el servidor. Por favor, intente nuevamente más tarde.`

  const currentError = errorType === 'boolean' ? booleanError : genericError

  const handleRetry = () => {
    // Simulate retry
    setShowError(false)
    setTimeout(() => {
      alert('Reintentando carga del reporte...')
    }, 300)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Demo: Componente de Manejo de Errores</h1>
        <p className="text-muted-foreground">
          Esta página demuestra cómo funciona el componente ReportErrorHandler con diferentes tipos de errores.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Controles de Demo</CardTitle>
          <CardDescription>
            Seleccione el tipo de error y haga clic en el botón para ver cómo se muestra.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              variant={errorType === 'boolean' ? 'default' : 'outline'}
              onClick={() => {
                setErrorType('boolean')
                setShowError(false)
              }}
            >
              Error de Boolean PostgreSQL
            </Button>
            <Button
              variant={errorType === 'generic' ? 'default' : 'outline'}
              onClick={() => {
                setErrorType('generic')
                setShowError(false)
              }}
            >
              Error Genérico
            </Button>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={() => setShowError(true)}
              variant="destructive"
            >
              Mostrar Error
            </Button>
            <Button
              onClick={() => setShowError(false)}
              variant="outline"
            >
              Ocultar Error
            </Button>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Información</AlertTitle>
            <AlertDescription>
              El error de Boolean PostgreSQL muestra información detallada y pasos de solución.
              El error genérico muestra una versión simplificada del componente.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {showError && (
        <ReportErrorHandler 
          error={currentError}
          onRetry={handleRetry}
          onClose={() => setShowError(false)}
        />
      )}

      {!showError && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Estado Normal
            </CardTitle>
            <CardDescription>
              No hay errores actualmente. Use los controles arriba para simular un error.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Código de Ejemplo</CardTitle>
          <CardDescription>
            Cómo integrar el componente en sus páginas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`import ReportErrorHandler from "@/components/admin/report-error-handler"

export default function MiPaginaDeReportes() {
  const [error, setError] = useState<string | null>(null)
  
  const loadReport = async () => {
    try {
      const response = await fetch('/api/reportes/...')
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const data = await response.json()
      setReportData(data)
    } catch (err: any) {
      setError(err.message)
    }
  }
  
  return (
    <div>
      {error && (
        <ReportErrorHandler 
          error={error}
          onRetry={loadReport}
          onClose={() => setError(null)}
        />
      )}
      
      {/* Resto del contenido de tu página */}
    </div>
  )
}`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Características del Componente</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Detección automática:</strong> Identifica errores de tipo boolean y muestra información específica
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Mensajes en español:</strong> Todos los textos están traducidos y son fáciles de entender
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Pasos de solución:</strong> Proporciona instrucciones detalladas para el equipo de desarrollo
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Ejemplos de código:</strong> Muestra el código incorrecto y correcto lado a lado
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Detalles técnicos:</strong> Permite copiar el error completo para debugging
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Acciones rápidas:</strong> Botones para reintentar, cerrar o ver documentación
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Secciones colapsables:</strong> El usuario puede expandir/contraer detalles según necesite
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Enlaces a documentación:</strong> Link directo al archivo BACKEND_BOOLEAN_FIX.md en GitHub
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Props del Componente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-mono text-sm font-semibold mb-2">error: string</h4>
              <p className="text-sm text-muted-foreground">
                <strong>Requerido.</strong> El mensaje de error completo que se mostrará. 
                El componente detecta automáticamente si es un error de tipo boolean.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-mono text-sm font-semibold mb-2">onRetry?: () =&gt; void</h4>
              <p className="text-sm text-muted-foreground">
                <strong>Opcional.</strong> Función callback que se ejecuta cuando el usuario hace clic en "Reintentar". 
                Si no se proporciona, el botón no se muestra.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-mono text-sm font-semibold mb-2">onClose?: () =&gt; void</h4>
              <p className="text-sm text-muted-foreground">
                <strong>Opcional.</strong> Función callback que se ejecuta cuando el usuario hace clic en "Cerrar". 
                Si no se proporciona, el botón no se muestra.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
