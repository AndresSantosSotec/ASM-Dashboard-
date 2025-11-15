"use client"

import { useEffect } from "react"
import { FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface ExportProgressModalProps {
  isOpen: boolean
  currentProgress: number
  totalItems: number
  currentPage: number
  totalPages: number
  status: 'loading' | 'success' | 'error'
  errorMessage?: string
}

export function ExportProgressModal({
  isOpen,
  currentProgress,
  totalItems,
  currentPage,
  totalPages,
  status,
  errorMessage
}: ExportProgressModalProps) {
  const percentage = totalItems > 0 ? Math.round((currentProgress / totalItems) * 100) : 0

  useEffect(() => {
    // Prevenir scroll del body cuando el modal está abierto
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 shadow-2xl">
        <CardContent className="pt-6 pb-6">
          {/* Icono superior */}
          <div className="flex justify-center mb-4">
            {status === 'loading' && (
              <div className="relative">
                <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
                <FileSpreadsheet className="h-8 w-8 text-blue-600 absolute top-4 left-4" />
              </div>
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            )}
            {status === 'error' && (
              <AlertCircle className="h-16 w-16 text-red-600" />
            )}
          </div>

          {/* Título */}
          <h3 className="text-xl font-bold text-center mb-2">
            {status === 'loading' && 'Generando Reporte'}
            {status === 'success' && 'Reporte Completado'}
            {status === 'error' && 'Error al Generar Reporte'}
          </h3>

          {/* Descripción */}
          <p className="text-center text-gray-600 mb-6">
            {status === 'loading' && (
              <>
                Procesando estudiantes con datos académicos...
                <br />
                <span className="text-sm text-amber-600 font-medium mt-2 block">
                  ⚠️ Este proceso puede tardar varios minutos dependiendo de la cantidad de datos
                </span>
              </>
            )}
            {status === 'success' && 'El archivo se descargó correctamente'}
            {status === 'error' && (errorMessage || 'Ocurrió un error durante la exportación')}
          </p>

          {/* Barra de progreso */}
          {status === 'loading' && (
            <div className="space-y-4">
              <Progress value={percentage} className="h-3" />
              
              <div className="flex justify-between text-sm text-gray-600">
                <span>
                  {currentProgress} de {totalItems} estudiantes
                </span>
                <span className="font-semibold">
                  {percentage}%
                </span>
              </div>

              <div className="text-center text-sm text-gray-500">
                Página {currentPage} de {totalPages}
              </div>

              {/* Advertencia de tiempo estimado */}
              {totalItems > 100 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                  <p className="text-amber-800 font-medium">
                    📊 Gran volumen de datos detectado
                  </p>
                  <p className="text-amber-700 text-xs mt-1">
                    Tiempo estimado: {Math.ceil(totalPages * 0.5)} - {Math.ceil(totalPages)} minutos
                  </p>
                  <p className="text-amber-600 text-xs mt-1">
                    ⚡ Modo rápido activado: chunks de 100 estudiantes
                  </p>
                </div>
              )}

              {/* Consejo de optimización */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="text-blue-800 font-medium">
                  💡 Consejo
                </p>
                <p className="text-blue-700 text-xs mt-1">
                  Para reportes más rápidos, use los filtros de Programa o Estado antes de exportar.
                </p>
              </div>
            </div>
          )}

          {/* Mensaje de éxito */}
          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800 font-medium">
                ✅ {totalItems} estudiantes exportados exitosamente
              </p>
            </div>
          )}

          {/* Mensaje de error */}
          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">
                {errorMessage || 'Error desconocido. Por favor, intente nuevamente.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
