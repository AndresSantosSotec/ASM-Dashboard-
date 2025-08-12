"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import api from "@/utils/api"

export type Action = "view" | "create" | "edit" | "delete" | "export"

type RolePermissionItem = {
  moduleview_id: number
  menu: string
  submenu: string
  view_path: string
  permissions: Record<Action, boolean>
}

type UserPermissionRecord = {
  id: number
  user_id: number
  permission_id: number
  assigned_at: string
  scope: string
  permission?: any
}

type Normalized = {
  viewsAllowed: Set<string>
  actionsByRoute: Map<string, Set<Action>>
}

type Ctx = Normalized & {
  loading: boolean
  error: string | null
  hasView: (routePath: string) => boolean
  can: (routePath: string, action: Action) => boolean
  refresh: () => Promise<void>
}

const PERM_CACHE_VERSION = "2"

const PermissionsContext = createContext<Ctx | null>(null)

export function normalizeRoute(path: string) {
  try {
    if (path.startsWith("http")) {
      const u = new URL(path)
      path = u.pathname
    }
  } catch {}
  let p = (path || "").trim().toLowerCase()
  p = p.split("?")[0].split("#")[0]
  p = p.replace(/\/{2,}/g, "/")
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1)
  return p
}

function matchesRoute(candidate: string, target: string) {
  const c = normalizeRoute(candidate)
  const t = normalizeRoute(target)
  if (c === t) return true
  if (t.startsWith(c + "/")) return true
  return false
}

type ProviderProps = {
  userId: number
  roleId: number
  children: React.ReactNode
  strictMode?: boolean
  superAdmin?: boolean
  useCache?: boolean
}

export const PermissionsProvider: React.FC<ProviderProps> = ({
  userId,
  roleId,
  children,
  strictMode = false,
  superAdmin = false,
  useCache = true,
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewsAllowed, setViewsAllowed] = useState<Set<string>>(new Set())
  const [actionsByRoute, setActionsByRoute] = useState<
    Map<string, Set<Action>>
  >(new Map())
  const [moduleviewsIndex, setModuleviewsIndex] = useState<
    Map<number, { id: number; view_path: string }>
  >(new Map())

  async function fetchModuleviewsIndex() {
    try {
      const res = await api.get("/moduleviews")
      const list = res.data?.data ?? res.data ?? []
      const map = new Map<number, { id: number; view_path: string }>()
      for (const mv of list) {
        if (mv?.id && mv?.view_path)
          map.set(Number(mv.id), { id: Number(mv.id), view_path: String(mv.view_path) })
      }
      setModuleviewsIndex(map)
    } catch {
      // si no existe endpoint, seguimos sin índice
    }
  }

  async function fetchAll() {
    setLoading(true)
    setError(null)
    try {
      if (useCache && localStorage.getItem("perm.version") !== PERM_CACHE_VERSION) {
        localStorage.removeItem("perm.viewsAllowed")
        localStorage.removeItem("perm.actionsByRoute")
        localStorage.setItem("perm.version", PERM_CACHE_VERSION)
      }

      const [userRes, roleRes] = await Promise.all([
        api.get("/userpermissions", { params: { user_id: userId } }),
        api.get(`/roles/${roleId}/permissions`),
      ])

      if (moduleviewsIndex.size === 0) {
        await fetchModuleviewsIndex()
      }

      const userData: UserPermissionRecord[] = userRes.data?.data ?? userRes.data ?? []
      const roleData: RolePermissionItem[] = roleRes.data ?? []

      const vset = new Set<string>()
      for (const up of userData) {
        const mvId = Number(up.permission_id)
        let vp = moduleviewsIndex.get(mvId)?.view_path
        if (!vp && up.permission?.module?.views?.length) {
          vp = up.permission.module.views[0]?.view_path
        }
        if (vp) vset.add(normalizeRoute(vp))
      }

      const amap = new Map<string, Set<Action>>()
      for (const rp of roleData) {
        const vp = rp?.view_path ? normalizeRoute(rp.view_path) : null
        if (!vp) continue
        const set = amap.get(vp) ?? new Set<Action>()
        ;(["view", "create", "edit", "delete", "export"] as Action[]).forEach((a) => {
          if (rp.permissions?.[a]) set.add(a)
        })
        amap.set(vp, set)
      }

      if (useCache) {
        localStorage.setItem("perm.viewsAllowed", JSON.stringify([...vset]))
        const serializable: Record<string, Action[]> = {}
        amap.forEach((set, route) => (serializable[route] = [...set]))
        localStorage.setItem("perm.actionsByRoute", JSON.stringify(serializable))
      }

      setViewsAllowed(vset)
      setActionsByRoute(amap)

      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.debug("[PERM] viewsAllowed", vset, "[PERM] actionsByRoute", amap)
      }
    } catch (e: any) {
      setError(e?.message ?? "Error cargando permisos")
      if (process.env.NODE_ENV === "development") console.error("[PERM] error", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (useCache) {
      const v = localStorage.getItem("perm.viewsAllowed")
      const a = localStorage.getItem("perm.actionsByRoute")
      if (v && a) {
        const views = new Set<string>(JSON.parse(v))
        const actionsRaw: Record<string, Action[]> = JSON.parse(a)
        const actions = new Map<string, Set<Action>>()
        Object.entries(actionsRaw).forEach(([route, arr]) =>
          actions.set(route, new Set(arr))
        )
        setViewsAllowed(views)
        setActionsByRoute(actions)
      }
    }
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, roleId])

  const hasView = useMemo(
    () => (routePath: string) => {
      if (superAdmin) return true
      const route = normalizeRoute(routePath)
      if (viewsAllowed.has(route)) return true
      if (!strictMode) {
        for (const vp of viewsAllowed) {
          if (matchesRoute(vp, route)) return true
        }
      }
      return false
    },
    [viewsAllowed, superAdmin, strictMode]
  )

  const can = useMemo(
    () => (routePath: string, action: Action) => {
      if (superAdmin) return true
      const route = normalizeRoute(routePath)
      const viewOk = hasView(route) || (!strictMode && viewsAllowed.size > 0)
      if (!viewOk) return false
      const set = actionsByRoute.get(route)
      if (set?.has(action)) return true
      if (!strictMode) {
        for (const [vp, s] of actionsByRoute.entries()) {
          if (matchesRoute(vp, route) && s.has(action)) return true
        }
      }
      return false
    },
    [actionsByRoute, hasView, strictMode, superAdmin, viewsAllowed.size]
  )

  const value: Ctx = {
    loading,
    error,
    viewsAllowed,
    actionsByRoute,
    hasView,
    can,
    refresh: fetchAll,
  }

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext)
  if (!ctx) throw new Error("usePermissions must be used within PermissionsProvider")
  return ctx
}

export function useCan(routePath: string, action: Action) {
  const { can } = usePermissions()
  return can(routePath, action)
}

export function useHasView(routePath: string) {
  const { hasView } = usePermissions()
  return hasView(routePath)
}

export default PermissionsProvider

