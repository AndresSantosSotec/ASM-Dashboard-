"use client"

import { useEffect, useState } from "react"

export function useCountries() {
  const [countries, setCountries] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch("https://restcountries.com/v3.1/all")
        const data = await res.json()
        const names = data.map((c: any) => c.name.common as string)
        names.sort((a: string, b: string) => a.localeCompare(b))
        setCountries(names)
      } catch (err) {
        console.error("Error fetching countries", err)
      } finally {
        setLoading(false)
      }
    }
    fetchCountries()
  }, [])

  return { countries, loading }
}

