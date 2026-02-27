import { useState, useEffect, useCallback } from "react"

/**
 * Devuelve el valor debounced después de `ms` milisegundos sin cambios.
 */
export function useDebounce<T>(value: T, ms: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), ms)
    return () => clearTimeout(timer)
  }, [value, ms])

  return debouncedValue
}
