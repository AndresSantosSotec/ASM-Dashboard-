"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface PermissionEntry {
  view_path: string;
  permissions: Record<string, boolean>;
}

interface PermissionsContextType {
  permissions: PermissionEntry[];
  setPermissions: (p: PermissionEntry[]) => void;
  can: (viewPath: string, action: string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType>({
  permissions: [],
  setPermissions: () => {},
  can: () => false,
});

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissions, setPermissionsState] = useState<PermissionEntry[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("permissions");
      if (stored) {
        try {
          setPermissionsState(JSON.parse(stored));
        } catch (e) {
          console.error("Error parseando permisos", e);
        }
      }
    }
  }, []);

  const setPermissions = (p: PermissionEntry[]) => {
    setPermissionsState(p);
    if (typeof window !== "undefined") {
      localStorage.setItem("permissions", JSON.stringify(p));
    }
  };

  const can = (viewPath: string, action: string) => {
    const mod = permissions.find((m) => m.view_path === viewPath);
    return mod?.permissions?.[action] === true;
  };

  return (
    <PermissionsContext.Provider value={{ permissions, setPermissions, can }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export function usePermissions() {
  return useContext(PermissionsContext);
}

export default PermissionsContext;

