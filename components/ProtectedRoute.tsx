"use client";


import React, { ReactNode, useEffect } from "react";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { allowedViews } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const alwaysAllowed = ["/", "/login"];
    const views =
      allowedViews.length > 0
        ? allowedViews
        : typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("allowedViews") || "[]")
          : [];

    if (views.length === 0) {
      return;
    }

    const isAllowed =
      alwaysAllowed.includes(pathname) ||
      views.some((v) => pathname.startsWith(v.view_path));

    if (!isAllowed) {
      router.replace("/403");
    }
  }, [pathname, allowedViews, router]);

  return <>{children}</>;
}

