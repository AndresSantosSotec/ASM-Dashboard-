"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { api } from "@/services/api"

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface DraftData {
  /** Clave única del borrador */
  draftId: string
  /** Nombre descriptivo (normalmente el nombre del prospecto) */
  label: string
  /** Fecha ISO de última modificación */
  updatedAt: string
  /** Tab activo al guardar */
  activeTab: string
  /** Progreso (%) */
  progress: number
  /** Estado completo del formulario */
  payload: Record<string, unknown>
}

export interface DraftCacheOptions {
  /** Prefijo de la key en localStorage (default: "fichaInscDrafts") */
  storagePrefix?: string
  /** Máximo de borradores por asesor (default: 3) */
  maxDrafts?: number
  /** Intervalo de auto-guardado en ms (default: 30 000 = 30s) */
  autoSaveInterval?: number
}

// ─── Helpers localStorage ────────────────────────────────────────────────────

function getStorageKey(prefix: string, userId: string) {
  return `${prefix}_${userId}`
}

function loadLocalDrafts(prefix: string, userId: string): DraftData[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(getStorageKey(prefix, userId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persistLocalDrafts(prefix: string, userId: string, drafts: DraftData[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(getStorageKey(prefix, userId), JSON.stringify(drafts))
}

function generateKey() {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

// ─── Backend API helpers (fire-and-forget safe) ──────────────────────────────

async function fetchDraftsFromBackend(): Promise<DraftData[]> {
  try {
    const res = await api.get("/fichas-borradores")
    return (res.data.drafts || []) as DraftData[]
  } catch (err) {
    console.warn("[DraftCache] No se pudo cargar borradores del servidor:", err)
    return []
  }
}

async function saveDraftToBackend(draft: DraftData): Promise<void> {
  try {
    await api.post("/fichas-borradores", {
      draft_key: draft.draftId,
      label: draft.label,
      active_tab: draft.activeTab,
      progress: draft.progress,
      payload: draft.payload,
    })
  } catch (err) {
    console.warn("[DraftCache] No se pudo guardar borrador en servidor:", err)
  }
}

async function deleteDraftFromBackend(draftKey: string): Promise<void> {
  try {
    await api.delete(`/fichas-borradores/${draftKey}`)
  } catch (err) {
    console.warn("[DraftCache] No se pudo eliminar borrador en servidor:", err)
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useDraftCache(options: DraftCacheOptions = {}) {
  const {
    storagePrefix = "fichaInscDrafts",
    maxDrafts = 3,
    autoSaveInterval = 30_000,
  } = options

  const [userId, setUserId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<DraftData[]>([])
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null)
  /** Indica que la sincronización inicial desde BD ya terminó */
  const [synced, setSynced] = useState(false)

  // Ref para el payload más reciente (auto-save)
  const latestPayloadRef = useRef<{
    label: string
    activeTab: string
    progress: number
    payload: Record<string, unknown>
  } | null>(null)

  // ── Inicialización: cargar localStorage rápido, luego sincronizar BD ──────

  useEffect(() => {
    const id = localStorage.getItem("userId")
    if (!id) return
    setUserId(id)

    // 🔒 Limpiar borradores locales de OTROS usuarios (protección ante
    //    cambio de sesión en el mismo navegador sin limpiar storage)
    if (typeof window !== "undefined") {
      const allKeys = Object.keys(localStorage)
      for (const key of allKeys) {
        if (
          key.startsWith(`${storagePrefix}_`) &&
          key !== getStorageKey(storagePrefix, id)
        ) {
          localStorage.removeItem(key)
        }
      }
    }

    // 1° Carga rápida desde localStorage (solo la key del usuario actual)
    const local = loadLocalDrafts(storagePrefix, id)
    setDrafts(local)

    // 2° Sincronizar con BD (fuente de verdad — siempre es segura, filtra por user_id en el server)
    ;(async () => {
      const remote = await fetchDraftsFromBackend()
      // BD es la fuente de verdad: usamos SOLO los remotos si existen
      if (remote.length > 0) {
        // Merge: BD gana en caso de conflicto (mismo draftId → usar updatedAt más reciente)
        const merged = new Map<string, DraftData>()
        for (const d of local) merged.set(d.draftId, d)
        for (const d of remote) {
          const existing = merged.get(d.draftId)
          if (!existing || new Date(d.updatedAt) >= new Date(existing.updatedAt)) {
            merged.set(d.draftId, d)
          }
        }
        // Limitar a maxDrafts más recientes
        const sorted = Array.from(merged.values()).sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        const final = sorted.slice(0, maxDrafts)
        setDrafts(final)
        persistLocalDrafts(storagePrefix, id, final)
      } else if (local.length === 0) {
        // Sin datos locales ni remotos → vacío
        setDrafts([])
      }
      setSynced(true)
    })()
  }, [storagePrefix, maxDrafts])

  // ── Guardar borrador (local + BD) ─────────────────────────────────────────

  const saveDraft = useCallback(
    (
      label: string,
      activeTab: string,
      progress: number,
      payload: Record<string, unknown>,
      draftId?: string
    ): string | null => {
      if (!userId) return null

      const existing = loadLocalDrafts(storagePrefix, userId)
      const targetId = draftId || activeDraftId

      const now = new Date().toISOString()

      if (targetId) {
        const idx = existing.findIndex((d) => d.draftId === targetId)
        if (idx >= 0) {
          existing[idx] = {
            ...existing[idx],
            label: label || existing[idx].label,
            updatedAt: now,
            activeTab,
            progress,
            payload,
          }
          persistLocalDrafts(storagePrefix, userId, existing)
          setDrafts([...existing])
          // Sync to BD (fire-and-forget)
          saveDraftToBackend(existing[idx])
          return targetId
        }
      }

      // Crear nuevo
      if (existing.length >= maxDrafts) {
        existing.sort(
          (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        )
        const removed = existing.shift()
        if (removed) deleteDraftFromBackend(removed.draftId)
      }

      const newId = generateKey()
      const newDraft: DraftData = {
        draftId: newId,
        label: label || "Sin nombre",
        updatedAt: now,
        activeTab,
        progress,
        payload,
      }
      existing.push(newDraft)
      persistLocalDrafts(storagePrefix, userId, existing)
      setDrafts([...existing])
      setActiveDraftId(newId)
      // Sync to BD
      saveDraftToBackend(newDraft)
      return newId
    },
    [userId, storagePrefix, maxDrafts, activeDraftId]
  )

  // ── Cargar un borrador ─────────────────────────────────────────────────────

  const loadDraft = useCallback(
    (draftId: string): DraftData | null => {
      if (!userId) return null
      const existing = loadLocalDrafts(storagePrefix, userId)
      const found = existing.find((d) => d.draftId === draftId) || null
      if (found) setActiveDraftId(draftId)
      return found
    },
    [userId, storagePrefix]
  )

  // ── Eliminar un borrador (local + BD) ──────────────────────────────────────

  const deleteDraft = useCallback(
    (draftId: string) => {
      if (!userId) return
      const existing = loadLocalDrafts(storagePrefix, userId).filter(
        (d) => d.draftId !== draftId
      )
      persistLocalDrafts(storagePrefix, userId, existing)
      setDrafts([...existing])
      if (activeDraftId === draftId) setActiveDraftId(null)
      // Sync to BD
      deleteDraftFromBackend(draftId)
    },
    [userId, storagePrefix, activeDraftId]
  )

  // ── Eliminar TODOS ─────────────────────────────────────────────────────────

  const clearAllDrafts = useCallback(() => {
    if (!userId) return
    const existing = loadLocalDrafts(storagePrefix, userId)
    persistLocalDrafts(storagePrefix, userId, [])
    setDrafts([])
    setActiveDraftId(null)
    // Sync to BD
    for (const d of existing) deleteDraftFromBackend(d.draftId)
  }, [userId, storagePrefix])

  // ── Actualizar ref para auto-save ──────────────────────────────────────────

  const updateAutoSaveData = useCallback(
    (
      label: string,
      activeTab: string,
      progress: number,
      payload: Record<string, unknown>
    ) => {
      latestPayloadRef.current = { label, activeTab, progress, payload }
    },
    []
  )

  // ── Auto-save periódico ────────────────────────────────────────────────────

  useEffect(() => {
    if (!userId || autoSaveInterval <= 0) return

    const timer = setInterval(() => {
      const data = latestPayloadRef.current
      if (data) {
        saveDraft(data.label, data.activeTab, data.progress, data.payload)
      }
    }, autoSaveInterval)

    return () => clearInterval(timer)
  }, [userId, autoSaveInterval, saveDraft])

  return {
    drafts,
    activeDraftId,
    synced,
    saveDraft,
    loadDraft,
    deleteDraft,
    clearAllDrafts,
    updateAutoSaveData,
    setActiveDraftId,
    maxDrafts,
  }
}
