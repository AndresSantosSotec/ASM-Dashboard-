"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { FileSpreadsheet, Download, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface DatoCrudo {
  carnet: string
  nuevo_ingreso_reingreso: string
  dia_1: string
  dia_2: string
  dia_3: string
  mes_ingreso: string
  inscripcion: string
  mensualidad: string
  nombres: string
  apellidos: string
  telefono: string
  email: string
  programa: string
  asesor: string
  prospecto_id: number
}

export function DatosCrudos() {
  const { toast } = useToast()
  const [datos, setDatos] = useState<DatoCrudo[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/gen-credenciales/datos-crudos')
      const result = await response.json()
      
      if (result.success) {
        setDatos(result.data)
        toast({
          title: "Datos cargados",
          description: `${result.total} registros encontrados`,
        })
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos crudos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const exportarCSV = () => {
    const headers = [
      'Carnet',
      'Nuevo ingreso o reingreso',
      'Día 1 que estudiará',
      'Día 2 que estudiará',
      'Día 3 que estudiará',
      'Mes de Ingreso',
      'Inscripción',
      'Monto de Mensualidad',
      'Nombres',
      'Apellidos',
      'Teléfono',
      'Email',
      'Programa',
      'Asesor'
    ]

    const rows = datos.map(d => [
      d.carnet,
      d.nuevo_ingreso_reingreso,
      d.dia_1,
      d.dia_2,
      d.dia_3,
      d.mes_ingreso,
      d.inscripcion,
      d.mensualidad,
      d.nombres,
      d.apellidos,
      d.telefono,
      d.email,
      d.programa,
      d.asesor
    ])

    // Agregar BOM para UTF-8
    const BOM = '\uFEFF'
    const csvContent = BOM + [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `datos_crudos_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)

    toast({
      title: "CSV exportado",
      description: "El archivo se ha descargado correctamente",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Datos Crudos - Vista de Prospectos
              </CardTitle>
              <CardDescription>
                Vista similar a Excel con todos los datos de los prospectos en estado gen_credentials
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={cargarDatos} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button onClick={exportarCSV} disabled={datos.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Carnet</TableHead>
                  <TableHead className="font-semibold">Ingreso/Reingreso</TableHead>
                  <TableHead className="font-semibold">Día 1</TableHead>
                  <TableHead className="font-semibold">Día 2</TableHead>
                  <TableHead className="font-semibold">Día 3</TableHead>
                  <TableHead className="font-semibold">Mes Ingreso</TableHead>
                  <TableHead className="font-semibold">Inscripción</TableHead>
                  <TableHead className="font-semibold">Mensualidad</TableHead>
                  <TableHead className="font-semibold">Nombres</TableHead>
                  <TableHead className="font-semibold">Apellidos</TableHead>
                  <TableHead className="font-semibold">Teléfono</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Programa</TableHead>
                  <TableHead className="font-semibold">Asesor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                      Cargando datos...
                    </TableCell>
                  </TableRow>
                ) : datos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                      No hay datos disponibles
                    </TableCell>
                  </TableRow>
                ) : (
                  datos.map((dato) => (
                    <TableRow key={dato.prospecto_id}>
                      <TableCell>
                        <Badge variant="secondary">{dato.carnet || 'Sin carnet'}</Badge>
                      </TableCell>
                      <TableCell>{dato.nuevo_ingreso_reingreso}</TableCell>
                      <TableCell className="text-muted-foreground">{dato.dia_1 || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{dato.dia_2 || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{dato.dia_3 || '-'}</TableCell>
                      <TableCell>{dato.mes_ingreso}</TableCell>
                      <TableCell className="text-right">{dato.inscripcion}</TableCell>
                      <TableCell className="text-right">Q{dato.mensualidad}</TableCell>
                      <TableCell className="font-medium">{dato.nombres}</TableCell>
                      <TableCell className="font-medium">{dato.apellidos}</TableCell>
                      <TableCell className="font-mono text-sm">{dato.telefono}</TableCell>
                      <TableCell className="text-sm">{dato.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{dato.programa}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{dato.asesor}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {datos.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Total de registros: <span className="font-semibold">{datos.length}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información sobre los Datos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Carnet:</strong> Identificador único del estudiante (se usa para username en Moodle y Microsoft 365)</p>
          <p><strong>Programa:</strong> Formato abreviatura + duración (ej: BBA 24, MHHRR 18)</p>
          <p><strong>Asesor:</strong> Usuario que creó o actualizó por última vez el registro del prospecto</p>
          <p><strong>Inscripción/Mensualidad:</strong> Montos definidos en el programa del estudiante</p>
          <p className="text-muted-foreground italic">
            Los días de estudio (Día 1, 2, 3) y el tipo de ingreso pueden configurarse en el futuro si se agregan campos adicionales.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
