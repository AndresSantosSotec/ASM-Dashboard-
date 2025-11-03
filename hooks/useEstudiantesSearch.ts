import { useCallback, useEffect, useState } from "react"
import { getEstudiantesProgramaSelect, type EstudianteProgramaSelect } from "@/services/mantenimientos"

interface UseEstudiantesSearchOptions {
  debounceMs?: number
  minSearchLength?: number
  maxResults?: number
}

export const useEstudiantesSearch = (options: UseEstudiantesSearchOptions = {}) => {
  const { debounceMs = 300, minSearchLength = 2, maxResults = 50 } = options
  
  const [searchTerm, setSearchTerm] = useState("")
  const [allEstudiantes, setAllEstudiantes] = useState<EstudianteProgramaSelect[]>([])
  const [filteredEstudiantes, setFilteredEstudiantes] = useState<EstudianteProgramaSelect[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar todos los estudiantes una vez al inicio
  useEffect(() => {
    let isCancelled = false
    
    const loadAllEstudiantes = async () => {
      if (allEstudiantes.length > 0) return // Ya cargados
      
      setInitialLoading(true)
      setError(null)
      
      try {
        const response = await getEstudiantesProgramaSelect()
        if (!isCancelled) {
          setAllEstudiantes(response.data)
        }
      } catch (err) {
        if (!isCancelled) {
          setError("Error al cargar estudiantes")
          console.error("Error loading estudiantes:", err)
        }
      } finally {
        if (!isCancelled) {
          setInitialLoading(false)
        }
      }
    }

    loadAllEstudiantes()
    
    return () => {
      isCancelled = true
    }
  }, [allEstudiantes.length])

  // Filtrar estudiantes localmente con debounce
  useEffect(() => {
    if (searchTerm.length < minSearchLength) {
      setFilteredEstudiantes([])
      setLoading(false)
      return
    }

    setLoading(true)
    
    const timeoutId = setTimeout(() => {
      const searchLower = searchTerm.toLowerCase()
      
      const filtered = allEstudiantes
        .filter(estudiante => 
          estudiante.estudiante_nombre.toLowerCase().includes(searchLower) ||
          estudiante.carnet.toLowerCase().includes(searchLower) ||
          estudiante.programa_nombre.toLowerCase().includes(searchLower)
        )
        .slice(0, maxResults)
      
      setFilteredEstudiantes(filtered)
      setLoading(false)
    }, debounceMs)

    return () => {
      clearTimeout(timeoutId)
      setLoading(false)
    }
  }, [searchTerm, allEstudiantes, debounceMs, minSearchLength, maxResults])

  const clearSearch = useCallback(() => {
    setSearchTerm("")
    setFilteredEstudiantes([])
  }, [])

  return {
    searchTerm,
    setSearchTerm,
    estudiantes: filteredEstudiantes,
    loading: loading || initialLoading,
    initialLoading,
    error,
    clearSearch,
    hasMinLength: searchTerm.length >= minSearchLength,
    totalEstudiantes: allEstudiantes.length,
  }
}