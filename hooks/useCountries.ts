"use client"

import { useEffect, useState } from "react"

export function useCountries() {
  const [countries, setCountries] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch(
          "https://restcountries.com/v3.1/all?fields=name",
        )
        if (!res.ok) {
          throw new Error(`status ${res.status}`)
        }
        const data = await res.json()
        if (!Array.isArray(data)) {
          throw new Error("unexpected response")
        }
        const names = data.map((c: any) => c.name.common as string)
        names.sort((a, b) => a.localeCompare(b))
        setCountries(names)
      } catch (err) {
        console.error("Error fetching countries", err)
        setCountries(["Guatemala"])
      } finally {
        setLoading(false)
      }
    }
    fetchCountries()
  }, [])

  return { countries, loading }
}

