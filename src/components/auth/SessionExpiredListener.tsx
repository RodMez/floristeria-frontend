"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSessionExpiredSync } from "@/store/useAuthStore";

/**
 * Set de handlers registrados para el evento 'auth:redirect'.
 * Evita duplicación de listeners durante re-mounts rápidos (back/forward).
 */
const REDIRECT_HANDLERS = new Set<(e: Event) => void>();

/**
 * Monta el listener de sesión expirada en el layout de tienda.
 * Cuando el fetcher detecta un 401/403, dispara el evento
 * 'auth:session-expired' y este componente ejecuta logout()
 * en el store Zustand.
 *
 * También escucha 'auth:redirect' para redirigir usando router.replace()
 * en vez de window.location.href (preserva el cache de SWR).
 *
 * Debe montarse UNA vez en el árbol, dentro del layout de tienda.
 */
export default function SessionExpiredListener() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  useSessionExpiredSync();

  useEffect(() => {
    const handleRedirect = (e: Event) => {
      const customEvent = e as CustomEvent<{ path: string }>;
      const path = customEvent.detail?.path;
      if (path && window.location.pathname !== path) {
        routerRef.current.replace(path);
      }
    };

    if (!REDIRECT_HANDLERS.has(handleRedirect)) {
      REDIRECT_HANDLERS.add(handleRedirect);
      window.addEventListener('auth:redirect', handleRedirect);
    }

    return () => {
      REDIRECT_HANDLERS.delete(handleRedirect);
      window.removeEventListener('auth:redirect', handleRedirect);
    };
  }, []);

  return null;
}
