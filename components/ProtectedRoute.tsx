"use client";

import React, { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { allowedViews } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (
      pathname !== "/login" &&
      allowedViews.length > 0 &&
      !allowedViews.some((v) => pathname.startsWith(v.view_path))
    ) {
      router.replace("/403");
    }
  }, [pathname, allowedViews, router]);

  return <>{children}</>;
}

