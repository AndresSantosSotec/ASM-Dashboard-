"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  Download,
  ArrowLeft,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { importKardexPagos } from "@/services/finance"

interface ImportResult {
  success: boolean
  message: string
  data?: {
    total: number
    exitosos: number
    errores: number
    monto_total: number
    advertencias_count?: number
    kardex_creados?: number
    cuotas_actualizadas?: number
    conciliaciones?: number
  }
  errors?: Array<{
    tipo: string
    cantidad: number
    ejemplos: string[]
  }>
  warnings?: Array<{
    tipo: string
    mensaje: string
  }>
}

export default function ImportarKardexPage() {
  const [file, setFile] = useState<File | null>(null)
  const [tipoArchivo, setTipoArchivo] = useState<string>("cardex_directo")
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      // Validar extensión
      const extension = selectedFile.name.split('.').pop()?.toLowerCase()
      if (!['xlsx', 'xls', 'csv'].includes(extension || '')) {
        toast({
          title: "Archivo no válido",
          description: "Por favor seleccione un archivo Excel (.xlsx, .xls) o CSV",
          variant: "destructive",
        })
        return
      }
      setFile(selectedFile)
      setResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Por favor seleccione un archivo para importar",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setProgress(0)

    // Simular progreso de carga
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev
        return prev + 10
      })
    }, 500)

    try {
      const response = await importKardexPagos(file, tipoArchivo)
      
      clearInterval(progressInterval)
      setProgress(100)

      setResult({
        success: response.success !== false,
        message: response.message || "Importación completada",
        data: response.data || response.resumen || {
          total: response.total || 0,
          exitosos: response.exitosos || 0,
          errores: response.errores || 0,
          monto_total: response.monto_total || 0,
          advertencias_count: response.advertencias_count || 0,
          kardex_creados: response.kardex_creados || 0,
          cuotas_actualizadas: response.cuotas_actualizadas || 0,
          conciliaciones: response.conciliaciones || 0,
        },
        errors: response.errores_detalle || [],
        warnings: response.advertencias || [],
      })

      // Mejorar mensajes según resultado
      const exitosos = response.exitosos || 0
      const errores = response.errores || 0
      
      if (response.success !== false && errores === 0) {
        // Éxito total
        toast({
          title: "Importación exitosa",
          description: `Se procesaron ${exitosos} registros correctamente`
        })
      } else if (exitosos > 0 && errores > 0) {
        // Éxito parcial
        toast({
          title: "Importación parcial",
          description: `${exitosos} registros procesados exitosamente, ${errores} con errores. Se insertaron solo los válidos.`
        })
      } else if (exitosos === 0 && errores > 0) {
        // Todos fallaron
        toast({
          title: "Importación fallida",
          description: `No se pudo procesar ningún registro. Revise los errores.`,
          variant: "destructive",
        })
      } else {
        // Sin datos
        toast({
          title: "Sin datos",
          description: "No se encontraron registros para procesar",
        })
      }
    } catch (error: unknown) {
      clearInterval(progressInterval)
      setProgress(0)
      
      const err = error as { response?: { data?: { message?: string; data?: ImportResult['data']; errores_detalle?: ImportResult['errors'] } }; message?: string }
      const errorMessage = err.response?.data?.message || err.message || "Error al importar el archivo"
      
      setResult({
        success: false,
        message: errorMessage,
        data: err.response?.data?.data,
        errors: err.response?.data?.errores_detalle || [{
          tipo: "ERROR_GENERAL",
          cantidad: 1,
          ejemplos: [errorMessage]
        }],
      })

      toast({
        title: "Error en la importación",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setResult(null)
    setProgress(0)
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Importar Kardex de Pagos</h1>
          <p className="text-muted-foreground mt-1">
            Cargue archivos Excel con el historial de pagos de estudiantes
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/finanzas/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Card de importación */}
        <Card>
          <CardHeader>
            <CardTitle>Cargar Archivo</CardTitle>
            <CardDescription>
              Seleccione el archivo Excel con el kardex de pagos y configure las opciones de importación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo-archivo">Tipo de Archivo</Label>
                <Select value={tipoArchivo} onValueChange={setTipoArchivo}>
                  <SelectTrigger id="tipo-archivo">
                    <SelectValue placeholder="Seleccione el tipo de archivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cardex_directo">Kardex Directo</SelectItem>
                    <SelectItem value="cardex_mensual">Kardex Mensual</SelectItem>
                    <SelectItem value="boletas_banco">Boletas de Banco</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Seleccione el formato del archivo que está importando
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file-upload">Archivo Excel</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  {file && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <FileSpreadsheet className="h-3 w-3" />
                      {(file.size / 1024).toFixed(1)} KB
                    </Badge>
                  )}
                </div>
                {file && (
                  <p className="text-sm text-muted-foreground">
                    Archivo seleccionado: {file.name}
                  </p>
                )}
              </div>

              {uploading && (
                <div className="space-y-2">
                  <Label>Progreso de importación</Label>
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center">
                    {progress < 100 ? `Procesando... ${progress}%` : "Finalizando..."}
                  </p>
                </div>
              )}
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Formato esperado</AlertTitle>
              <AlertDescription>
                El archivo debe contener las siguientes columnas: Carnet, Nombre Estudiante, Plan Estudios,
                Número Boleta, Monto, Fecha Pago, Banco, Concepto, Mes Pago, Mes Inicio, Mensualidad Aprobada.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={resetForm} disabled={uploading}>
              Limpiar
            </Button>
            <Button onClick={handleImport} disabled={!file || uploading}>
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Importando..." : "Importar Archivo"}
            </Button>
          </CardFooter>
        </Card>

        {/* Resultados */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success && (result.errors?.length || 0) === 0 ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Importación Exitosa
                  </>
                ) : (result.data?.exitosos || 0) > 0 ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-yellow-600" />
                    Importación Parcial
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    Importación Fallida
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {result.message}
                {(result.data?.exitosos || 0) > 0 && (result.data?.errores || 0) > 0 && (
                  <span className="block mt-1 text-green-600">
                    ✓ Los registros válidos fueron insertados correctamente
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Filas</p>
                    <p className="text-2xl font-bold">{result.data.total}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Exitosos</p>
                    <p className="text-2xl font-bold text-green-600">{result.data.exitosos}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Errores</p>
                    <p className="text-2xl font-bold text-red-600">{result.data.errores}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Monto Total</p>
                    <p className="text-2xl font-bold">Q{result.data.monto_total.toLocaleString()}</p>
                  </div>
                </div>
              )}

              {result.data && (result.data.kardex_creados || 0) > 0 && (
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Kardex Creados</p>
                    <p className="text-xl font-semibold">{result.data.kardex_creados}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Cuotas Actualizadas</p>
                    <p className="text-xl font-semibold">{result.data.cuotas_actualizadas}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Conciliaciones</p>
                    <p className="text-xl font-semibold">{result.data.conciliaciones}</p>
                  </div>
                </div>
              )}

              {result.errors && result.errors.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <h4 className="font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    Registros con Errores (omitidos)
                  </h4>
                  <Alert variant="default" className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Los registros que se muestran a continuación fueron omitidos debido a errores. 
                      Los registros válidos ya fueron procesados e insertados en el sistema.
                    </AlertDescription>
                  </Alert>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo de Error</TableHead>
                        <TableHead>Cantidad Omitida</TableHead>
                        <TableHead>Ejemplos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.errors.map((error, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{error.tipo}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">{error.cantidad}</Badge>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <ul className="text-sm space-y-1">
                              {error.ejemplos.slice(0, 3).map((ejemplo, i) => (
                                <li key={i} className="text-muted-foreground">
                                  • {ejemplo}
                                </li>
                              ))}
                            </ul>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {result.warnings && result.warnings.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <h4 className="font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    Advertencias
                  </h4>
                  <div className="space-y-2">
                    {result.warnings.map((warning, index) => (
                      <Alert key={index} variant="default">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{warning.tipo}</AlertTitle>
                        <AlertDescription>{warning.mensaje}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push("/finanzas/reportes")}>
                <Download className="mr-2 h-4 w-4" />
                Ver Reportes
              </Button>
              <Button onClick={resetForm}>
                Importar Otro Archivo
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Card de ayuda */}
        <Card>
          <CardHeader>
            <CardTitle>Guía de Importación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Pasos para una importación exitosa:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Verifique que el archivo Excel contenga todas las columnas requeridas</li>
                  <li>Asegúrese de que los carnets de estudiantes sean válidos y estén registrados</li>
                  <li>Revise que las fechas estén en formato correcto (YYYY-MM-DD)</li>
                  <li>Confirme que los montos sean numéricos y mayores a cero</li>
                  <li>Seleccione el tipo de archivo correcto según su formato</li>
                </ol>
              </div>
              <div>
                <h4 className="font-medium mb-2">Errores comunes:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Estudiante no encontrado: El carnet no existe en el sistema (se omite el registro)</li>
                  <li>Programa no identificado: No se pudo determinar el programa del estudiante (se omite)</li>
                  <li>Cuota no encontrada: No existe una cuota pendiente para este pago (se omite)</li>
                  <li>Datos incompletos: Faltan columnas o valores requeridos (se omite)</li>
                  <li>Formato inválido: Fechas o montos en formato incorrecto (se omite)</li>
                </ul>
                <p className="text-sm text-green-600 font-medium mt-2">
                  ℹ️ Los registros con errores se omiten automáticamente. Solo se procesan e insertan los registros válidos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
