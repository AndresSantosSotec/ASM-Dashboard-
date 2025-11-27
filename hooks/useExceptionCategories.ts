// hooks/useExceptionCategories.ts
import { useState, useEffect } from "react"
import {
  getExceptionCategories,
  createExceptionCategory,
  updateExceptionCategory,
  deleteExceptionCategory,
  toggleExceptionCategoryStatus,
  assignCategoryBulk,
  assignCategoryToProspecto,
  removeCategoryFromProspecto,
  getAssignedProspectos,
} from "@/services/finance"
import { toast } from "@/hooks/use-toast"

export interface ExceptionCategory {
  id: number
  name: string
  description?: string
  due_day_override?: number | null
  skip_late_fee: boolean
  allow_partial_payments: boolean
  skip_blocking: boolean
  active: boolean
  created_at?: string
  updated_at?: string
}

export interface AssignedProspecto {
  id: number
  nombre_completo: string
  carnet: string
  correo_electronico?: string
  assignment: {
    effective_from?: string | null
    effective_until?: string | null
    notes?: string | null
    is_active: boolean
  }
}

export function useExceptionCategories() {
  const [categories, setCategories] = useState<ExceptionCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCategories = async (params?: { active?: boolean; search?: string }) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getExceptionCategories(params)
      setCategories(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err?.message || "Error al cargar categorías")
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías de excepción",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const create = async (data: Partial<ExceptionCategory>) => {
    try {
      const response = await createExceptionCategory(data)
      await loadCategories()
      return response
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "No se pudo crear la categoría",
        variant: "destructive",
      })
      throw err
    }
  }

  const update = async (id: number, data: Partial<ExceptionCategory>) => {
    try {
      const response = await updateExceptionCategory(id, data)
      await loadCategories()
      return response
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "No se pudo actualizar la categoría",
        variant: "destructive",
      })
      throw err
    }
  }

  const remove = async (id: number) => {
    try {
      await deleteExceptionCategory(id)
      await loadCategories()
      toast({
        title: "Categoría eliminada",
        description: "La categoría fue eliminada exitosamente",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "No se pudo eliminar la categoría",
        variant: "destructive",
      })
      throw err
    }
  }

  const toggleStatus = async (id: number) => {
    try {
      await toggleExceptionCategoryStatus(id)
      await loadCategories()
    } catch (err: any) {
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado de la categoría",
        variant: "destructive",
      })
      throw err
    }
  }

  const assignBulk = async (
    categoryId: number,
    prospectos: number[],
    options?: {
      effective_from?: string | null
      effective_until?: string | null
      notes?: string | null
    }
  ) => {
    try {
      const response = await assignCategoryBulk(categoryId, {
        prospectos,
        ...options,
      })
      
      if (response.data) {
        const { assigned, skipped, errors } = response.data
        toast({
          title: "Asignación completada",
          description: `Se asignó a ${assigned} prospecto(s). ${skipped > 0 ? `${skipped} ya tenían la categoría.` : ""} ${errors.length > 0 ? `${errors.length} errores.` : ""}`,
        })
      }
      
      return response
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "No se pudo asignar la categoría",
        variant: "destructive",
      })
      throw err
    }
  }

  const assign = async (
    categoryId: number,
    prospectoId: number,
    options?: {
      effective_from?: string | null
      effective_until?: string | null
      notes?: string | null
    }
  ) => {
    try {
      await assignCategoryToProspecto(categoryId, {
        prospecto_id: prospectoId,
        ...options,
      })
      toast({
        title: "Categoría asignada",
        description: "La categoría fue asignada exitosamente",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "No se pudo asignar la categoría",
        variant: "destructive",
      })
      throw err
    }
  }

  const unassign = async (categoryId: number, prospectoId: number) => {
    try {
      await removeCategoryFromProspecto(categoryId, prospectoId)
      toast({
        title: "Categoría removida",
        description: "La categoría fue removida exitosamente",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "No se pudo remover la categoría",
        variant: "destructive",
      })
      throw err
    }
  }

  const getAssigned = async (categoryId: number): Promise<AssignedProspecto[]> => {
    try {
      const data = await getAssignedProspectos(categoryId)
      return Array.isArray(data) ? data : []
    } catch (err: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los prospectos asignados",
        variant: "destructive",
      })
      return []
    }
  }

  return {
    categories,
    loading,
    error,
    loadCategories,
    create,
    update,
    remove,
    toggleStatus,
    assignBulk,
    assign,
    unassign,
    getAssigned,
  }
}

