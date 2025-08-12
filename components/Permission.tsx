"use client";
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";

interface Props {
  viewPath: string;
  action: string;
  children: ReactNode;
}

export default function Permission({ viewPath, action, children }: Props) {
  const { can } = usePermissions();
  const router = useRouter();
  const allowed = can(viewPath, action);

  useEffect(() => {
    if (!allowed) {
      router.replace("/403");
    }
  }, [allowed, router]);

  if (!allowed) return null;
  return <>{children}</>;
}

