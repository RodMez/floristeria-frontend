"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSessionExpiredSync } from "@/store/useAuthStore";

/**
 * Listener global de sesión expirada.
 * Cuando el fetcher detecta 401/403 dispara 'auth:session-expired' (logout Zustand)
 * y 'auth:redirect' (navegación). Este componente escucha ambos.
 *
 * Debe montarse UNA vez en el árbol raíz (src/app/layout.tsx) para cubrir
 * tienda y admin. Se mantiene compatible con montaje en tienda/layout.
 */
export default function SessionExpiredListener() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  useSessionExpiredSync();

  const handleRedirect = useCallback((e: Event) => {
    const customEvent = e as CustomEvent<{ path: string }>;
    const path = customEvent.detail?.path;
    if (path && window.location.pathname !== path) {
      routerRef.current.replace(path);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('auth:redirect', handleRedirect);
    return () => {
      window.removeEventListener('auth:redirect', handleRedirect);
    };
  }, [handleRedirect]);

  return null;
}
