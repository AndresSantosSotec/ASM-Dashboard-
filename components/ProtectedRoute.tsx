import React, { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// Define the type for an allowed view
interface AllowedView {
  view_path: string;
}

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { allowedViews } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const alwaysAllowed = ["/", "/login"];
    const views: AllowedView[] =
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
      views.some((v: AllowedView) => pathname.startsWith(v.view_path)); // Type the parameter 'v'

    if (!isAllowed) {
      router.replace("/403");
    }
  }, [pathname, allowedViews, router]);

  return <>{children}</>;
}
