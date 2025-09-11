import { useEffect, useState } from 'react'
import fetchProgramas from '@/services/estudiantes'

export const useProgramas = () => {
  const [programas, setProgramas] = useState<Array<{ id: string, nombre: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProgramas = async () => {
      try {
        setLoading(true)
        const data = await fetchProgramas()
        setProgramas(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    loadProgramas()
  }, [])

  return { programas, loading, error }
}