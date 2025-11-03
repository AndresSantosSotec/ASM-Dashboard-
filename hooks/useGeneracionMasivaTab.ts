import { useState, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"

interface UseMasivaTabOptions {
  onDataGenerated?: () => void
}

export interface MasivaFormData {
  programaId: string
  fechaInicio: string
  numCuotas: string
  montoCuota: string
  intervalo: string
}

export const useGeneracionMasivaTab = ({ onDataGenerated }: UseMasivaTabOptions = {}) => {
  const { toast } = useToast()
  
  // Estados del modal de generación masiva
  const [showMasivaModal, setShowMasivaModal] = useState(false)
  const [masivaLoading, setMasivaLoading] = useState(false)
  const [masivaFormData, setMasivaFormData] = useState<MasivaFormData>({
    programaId: "",
    fechaInicio: "",
    numCuotas: "1",
    montoCuota: "",
    intervalo: "monthly",
  })

  // Estados para preview de generación
  const [previewData, setPreviewData] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)

  // Generar preview de cuotas masivas
  const generatePreview = useCallback(async () => {
    if (!masivaFormData.programaId || !masivaFormData.fechaInicio || !masivaFormData.numCuotas || !masivaFormData.montoCuota) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    try {
      setPreviewLoading(true)
      
      const response = await fetch('/api/mantenimientos/cuotas/preview-masiva', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          programa_id: parseInt(masivaFormData.programaId),
          fecha_inicio: masivaFormData.fechaInicio,
          num_cuotas: parseInt(masivaFormData.numCuotas),
          monto_cuota: parseFloat(masivaFormData.montoCuota),
          intervalo: masivaFormData.intervalo,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al generar preview')
      }

      const result = await response.json()
      setPreviewData(result.preview || [])
      setShowPreview(true)
      
      toast({
        title: "Preview generado",
        description: `Se generarán ${result.preview?.length || 0} cuotas`,
      })
    } catch (error: any) {
      toast({
        title: "Error al generar preview",
        description: error.message || "Ha ocurrido un error inesperado",
        variant: "destructive",
      })
    } finally {
      setPreviewLoading(false)
    }
  }, [masivaFormData, toast])

  // Ejecutar generación masiva
  const ejecutarGeneracionMasiva = useCallback(async () => {
    if (!previewData.length) {
      toast({
        title: "No hay datos para generar",
        description: "Primero debe generar un preview",
        variant: "destructive",
      })
      return
    }

    try {
      setMasivaLoading(true)
      
      const response = await fetch('/api/mantenimientos/cuotas/generar-masiva', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          programa_id: parseInt(masivaFormData.programaId),
          fecha_inicio: masivaFormData.fechaInicio,
          num_cuotas: parseInt(masivaFormData.numCuotas),
          monto_cuota: parseFloat(masivaFormData.montoCuota),
          intervalo: masivaFormData.intervalo,
          confirm: true,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al generar cuotas')
      }

      const result = await response.json()
      
      toast({
        title: "Cuotas generadas exitosamente",
        description: `Se han creado ${result.created || 0} cuotas para ${result.estudiantes || 0} estudiantes`,
      })

      // Resetear formulario y cerrar modal
      setShowMasivaModal(false)
      setShowPreview(false)
      setPreviewData([])
      setMasivaFormData({
        programaId: "",
        fechaInicio: "",
        numCuotas: "1",
        montoCuota: "",
        intervalo: "monthly",
      })
      
      // Callback para recargar datos en el componente padre
      onDataGenerated?.()
    } catch (error: any) {
      toast({
        title: "Error al generar cuotas",
        description: error.message || "Ha ocurrido un error inesperado",
        variant: "destructive",
      })
    } finally {
      setMasivaLoading(false)
    }
  }, [previewData, masivaFormData, toast, onDataGenerated])

  // Handler para abrir modal de generación masiva
  const handleGeneracionMasiva = useCallback(() => {
    setShowMasivaModal(true)
  }, [])

  // Handler para cancelar y resetear formulario
  const handleCancelMasiva = useCallback(() => {
    setShowMasivaModal(false)
    setShowPreview(false)
    setPreviewData([])
    setMasivaFormData({
      programaId: "",
      fechaInicio: "",
      numCuotas: "1",
      montoCuota: "",
      intervalo: "monthly",
    })
  }, [])

  // Handler para cambios en el formulario
  const handleMasivaFormChange = useCallback((field: keyof MasivaFormData, value: string) => {
    setMasivaFormData(prev => ({
      ...prev,
      [field]: value,
    }))
    // Reset preview cuando cambian los datos
    if (showPreview) {
      setShowPreview(false)
      setPreviewData([])
    }
  }, [showPreview])

  return {
    // Estados del modal de generación masiva
    showMasivaModal,
    setShowMasivaModal,
    masivaLoading,
    masivaFormData,
    setMasivaFormData,
    
    // Estados del preview
    previewData,
    showPreview,
    previewLoading,
    
    // Funciones principales
    generatePreview,
    ejecutarGeneracionMasiva,
    
    // Handlers
    handleGeneracionMasiva,
    handleCancelMasiva,
    handleMasivaFormChange,
  }
}