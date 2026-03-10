import { useCallback, useEffect, useRef, useState } from "react"
import { getEstudiantesProgramaSelect, type EstudianteProgramaSelect } from "@/services/mantenimientos"

interface UseEstudiantesSearchOptions {
  debounceMs?: number
  minSearchLength?: number
  maxResults?: number
}

export const useEstudiantesSearch = (options: UseEstudiantesSearchOptions = {}) => {
  const { debounceMs = 400, minSearchLength = 2, maxResults = 200 } = options

  const [searchTerm, setSearchTerm] = useState("")
  const [estudiantes, setEstudiantes] = useState<EstudianteProgramaSelect[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Búsqueda server-side con debounce — sin límite local, el backend filtra
  useEffect(() => {
    if (searchTerm.length < minSearchLength) {
      setEstudiantes([])
      setLoading(false)
      return
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    setLoading(true)
    setError(null)

    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await getEstudiantesProgramaSelect(searchTerm, {
          params: { limit: maxResults },
        } as any)
        setEstudiantes(response.data ?? [])
      } catch (err: any) {
        // Ignorar cancelaciones silenciosas
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError" || err?.name === "AbortError") return
        setError("Error al cargar estudiantes")
        setEstudiantes([])
        console.error("Error searching estudiantes:", err)
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [searchTerm, minSearchLength, maxResults, debounceMs])

  const clearSearch = useCallback(() => {
    setSearchTerm("")
    setEstudiantes([])
    setError(null)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  return {
    searchTerm,
    setSearchTerm,
    estudiantes,
    loading,
    initialLoading: false,
    error,
    clearSearch,
    hasMinLength: searchTerm.length >= minSearchLength,
    totalEstudiantes: estudiantes.length,
  }
}