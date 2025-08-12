"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "@/utils/api";

export type Action = "view" | "create" | "edit" | "delete" | "export";

interface PermissionsContextValue {
  loading: boolean;
  error: string | null;
  hasView: (routePath: string) => boolean;
  can: (routePath: string, action: Action) => boolean;
  refresh: () => void;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  loading: true,
  error: null,
  hasView: () => false,
  can: () => false,
  refresh: () => {},
});

interface ProviderProps {
  userId: number;
  roleId: number;
  useCache?: boolean;
  children: React.ReactNode;
}

export const PermissionsProvider: React.FC<ProviderProps> = ({
  userId,
  roleId,
  useCache = true,
  children,
}) => {
  const [viewsAllowed, setViewsAllowed] = useState<Set<string>>(new Set());
  const [actionsByRoute, setActionsByRoute] = useState<
    Map<string, Set<Action>>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (useCache) {
        const cachedViews = localStorage.getItem("perm.viewsAllowed");
        const cachedActions = localStorage.getItem("perm.actionsByRoute");
        if (cachedViews && cachedActions) {
          setViewsAllowed(new Set(JSON.parse(cachedViews)));
          const parsed: Record<string, Action[]> = JSON.parse(cachedActions);
          const map = new Map<string, Set<Action>>();
          Object.entries(parsed).forEach(([k, v]) => map.set(k, new Set(v)));
          setActionsByRoute(map);
        }
      }

      const [userPermsRes, rolePermsRes, moduleViewsRes] =
        await Promise.allSettled([
          api.get("/userpermissions", { params: { user_id: userId } }),
          api.get(`/roles/${roleId}/permissions`),
          api.get("/moduleviews"),
        ]);

      const mvIndex: Record<number, string> = {};
      if (moduleViewsRes.status === "fulfilled") {
        const list = moduleViewsRes.value.data?.data || moduleViewsRes.value.data || [];
        list.forEach((mv: any) => {
          if (mv && mv.id != null && mv.view_path) {
            mvIndex[mv.id] = mv.view_path;
          }
        });
      }

      const viewsSet = new Set<string>();
      if (userPermsRes.status === "fulfilled") {
        const permData = userPermsRes.value.data?.data || [];
        permData.forEach((up: any) => {
          const id = up.permission_id || up.permission?.views?.[0]?.id;
          let path = mvIndex[id];
          if (!path) {
            path =
              up.permission?.module?.views?.[0]?.view_path ||
              up.permission?.views?.[0]?.view_path;
          }
          if (path) {
            viewsSet.add(path);
          }
        });
      }

      const actionsMap = new Map<string, Set<Action>>();
      if (rolePermsRes.status === "fulfilled") {
        const items = rolePermsRes.value.data || [];
        items.forEach((item: any) => {
          const route = item.view_path;
          const set = new Set<Action>();
          const perms = item.permissions || {};
          (Object.keys(perms) as Action[]).forEach((act) => {
            if (perms[act]) set.add(act);
          });
          actionsMap.set(route, set);
        });
      }

      setViewsAllowed(viewsSet);
      setActionsByRoute(actionsMap);

      if (useCache) {
        localStorage.setItem(
          "perm.viewsAllowed",
          JSON.stringify(Array.from(viewsSet))
        );
        const obj: Record<string, Action[]> = {};
        actionsMap.forEach((v, k) => {
          obj[k] = Array.from(v);
        });
        localStorage.setItem("perm.actionsByRoute", JSON.stringify(obj));
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar permisos");
    } finally {
      setLoading(false);
    }
  }, [userId, roleId, useCache]);

  useEffect(() => {
    load();
  }, [load]);

  const hasView = useCallback(
    (routePath: string) => viewsAllowed.has(routePath),
    [viewsAllowed]
  );

  const can = useCallback(
    (routePath: string, action: Action) => {
      if (!hasView(routePath)) return false;
      return actionsByRoute.get(routePath)?.has(action) ?? false;
    },
    [hasView, actionsByRoute]
  );

  return (
    <PermissionsContext.Provider
      value={{ loading, error, hasView, can, refresh: load }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionsContext);

export const useHasView = (routePath: string) => {
  const { hasView } = usePermissions();
  return hasView(routePath);
};

export const useCan = (routePath: string, action: Action) => {
  const { can } = usePermissions();
  return can(routePath, action);
};

export default PermissionsProvider;
