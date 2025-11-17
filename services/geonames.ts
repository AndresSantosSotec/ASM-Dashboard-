import axios from 'axios'
import { API_BASE_URL } from '@/utils/apiConfig'

export interface Country {
  geonameId: number
  countryCode: string
  countryName: string
  continent: string
  capital: string
  languages: string
  population: string
  areaInSqKm: string
  currencyCode: string
}

export interface Region {
  geonameId: number
  name: string
  toponymName: string
  adminCode1: string
  countryCode: string
  countryName: string
  population: number
  lat: string
  lng: string
  fcode: string
}

export interface Municipality {
  geonameId: number
  name: string
  toponymName: string
  adminCode1: string
  countryCode: string
  countryName: string
  adminName1: string
  population: number
  lat: string
  lng: string
  fcode: string
}

export interface GuatemalaData {
  pais: {
    geonameId: number
    countryName: string
    countryCode: string
  }
  departamentos: (Region & {
    municipios: Municipality[]
  })[]
}

export const geoNamesService = {
  /**
   * Obtiene la lista de todos los países desde el backend de Laravel
   */
  async getCountries(): Promise<Country[]> {
    try {
      const response = await axios.get<Country[]>(
        `${API_BASE_URL}/api/geonames/paises`
      )
      return response.data || []
    } catch (error) {
      console.error('Error al obtener países:', error)
      throw new Error('No se pudo obtener la lista de países')
    }
  },

  /**
   * Obtiene los departamentos/regiones de un país específico
   * @param geonameId - ID del país en GeoNames
   */
  async getRegions(geonameId: number): Promise<Region[]> {
    try {
      const response = await axios.get<Region[]>(
        `${API_BASE_URL}/api/geonames/departamentos/${geonameId}`
      )
      return response.data || []
    } catch (error) {
      console.error('Error al obtener regiones:', error)
      throw new Error('No se pudo obtener la lista de regiones')
    }
  },

  /**
   * Obtiene los municipios de una región específica
   * @param geonameId - ID de la región en GeoNames
   */
  async getMunicipalities(geonameId: number): Promise<Municipality[]> {
    try {
      const response = await axios.get<Municipality[]>(
        `${API_BASE_URL}/api/geonames/municipios/${geonameId}`
      )
      return response.data || []
    } catch (error) {
      console.error('Error al obtener municipios:', error)
      throw new Error('No se pudo obtener la lista de municipios')
    }
  },

  /**
   * Obtiene toda la información de Guatemala (departamentos y municipios)
   * @returns Datos completos de Guatemala con departamentos y municipios
   */
  async getGuatemalaData(): Promise<GuatemalaData> {
    try {
      const response = await axios.get<GuatemalaData>(
        `${API_BASE_URL}/api/geonames/guatemala`
      )
      return response.data
    } catch (error) {
      console.error('Error al obtener datos de Guatemala:', error)
      throw new Error('No se pudo obtener la información de Guatemala')
    }
  }
}

