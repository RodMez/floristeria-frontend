/**
 * Helper para Meta Pixel (Facebook).
 * Envuelve `window.fbq` con guards para no lanzar errores si el script
 * aún no cargó o si el usuario usa bloqueador de anuncios.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackMetaEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  const fbq = window.fbq;
  if (typeof fbq !== "function") return;
  if (params) {
    fbq("track", eventName, params);
  } else {
    fbq("track", eventName);
  }
}
