"use client"

import { useState, useEffect } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)

    // Actualizar el estado inicialmente
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    // Callback para cuando cambia el estado
    const listener = () => {
      setMatches(media.matches)
    }

    // Añadir listener
    media.addEventListener("change", listener)

    // Limpiar listener
    return () => media.removeEventListener("change", listener)
  }, [matches, query])

  return matches
}

// Hook personalizado para detectar si es móvil
export function useMobile(): boolean {
  return useMediaQuery("(max-width: 1023px)")
}

