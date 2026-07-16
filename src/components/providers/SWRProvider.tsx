"use client";

import { SWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";

/**
 * Provider global de SWR con configuración por defecto.
 * Envuelve la tienda para controlar el cache y manejo de errores.
 */
export default function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        errorRetryCount: 3,
        revalidateOnFocus: false,
        revalidateIfStale: true,
        dedupingInterval: 5000,
        onError: (error) => {
          // No mostrar errores de sesión expirada ni de fetches abortados
          if (error?.message === 'Sesión expirada') return;
          if ((error as Error & { __aborted__?: boolean })?.__aborted__) return;
          console.error('[SWR Error]', error);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
