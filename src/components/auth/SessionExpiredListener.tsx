"use client";

import { useSessionExpiredSync } from "@/store/useAuthStore";

/**
 * Monta el listener de sesión expirada en el layout de tienda.
 * Cuando el fetcher detecta un 401/403, dispara el evento
 * 'auth:session-expired' y este componente ejecuta logout()
 * en el store Zustand.
 *
 * Debe montarse UNA vez en el árbol, dentro del layout de tienda.
 */
export default function SessionExpiredListener() {
  useSessionExpiredSync();
  return null;
}
