import { useEffect, useState } from 'react'
import { fetchPrograms, type Program } from '@/services/programs'

export const useProgramas = () => {
  const [programas, setProgramas] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProgramas = async () => {
      try {
        setLoading(true)
        const data = await fetchPrograms()
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