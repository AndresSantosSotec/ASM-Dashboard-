import api from './api'

export interface Country {
  id: number
  nombre: string
}

export const fetchCountries = async (): Promise<Country[]> => {
  const res = await api.get('/paises')
  return Array.isArray(res.data) ? res.data : res.data.data
}
