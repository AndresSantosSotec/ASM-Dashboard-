import { useEffect, useState } from "react";

function useUserPermissions() {
  const [permissions, setPermissions] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("permissions");
    if (stored) {
      try {
        setPermissions(JSON.parse(stored));
      } catch (e) {
        console.error("Error parseando permisos", e);
      }
    }
  }, []);

  return permissions;
}
function hasPermission(permissions: any[], requiredPath: string) {
    return permissions.some(
      (permiso) => permiso.permission && permiso.permission.view_path === requiredPath
    );
  }

  