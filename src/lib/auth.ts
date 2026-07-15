"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export function useRequireSuperAdmin() {
  const { rol, isAuthenticated, isHydrated } = useAuthStore();
  const router = useRouter();

  const isLoading = !isHydrated;
  const isSuperAdmin = isHydrated && isAuthenticated && rol === "SUPERADMIN";

  useEffect(() => {
    if (isHydrated && !isSuperAdmin) {
      router.replace("/admin");
    }
  }, [isHydrated, isSuperAdmin, router]);

  return { isLoading, isSuperAdmin };
}
