"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useHasView } from "./PermissionsProvider";

interface Props {
  routePath: string;
  children: React.ReactNode;
}

const RouteGuard: React.FC<Props> = ({ routePath, children }) => {
  const router = useRouter();
  const allowed = useHasView(routePath);

  useEffect(() => {
    if (!allowed) {
      router.replace("/sin-acceso");
    }
  }, [allowed, router]);

  if (!allowed) return null;
  return <>{children}</>;
};

export default RouteGuard;
