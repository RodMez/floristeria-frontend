import Cookies from 'js-cookie';
import { toast } from 'sonner';

/**
 * Flag global para evitar múltiples redirecciones/toasts
 * cuando varias peticiones SWR fallan con 401/403 simultáneamente.
 */
let isHandlingSessionExpired = false;

/**
 * Fetcher para SWR con interceptor de sesión expirada.
 *
 * Si la API responde 401/401 y el usuario estaba autenticado:
 *  1. Limpia el estado de auth (cookie + Zustand via evento)
 *  2. Muestra un toast informativo
 *  3. Redirige a /tienda/login (sin bucle si ya está ahí)
 */
export async function fetcher<T = unknown>(url: string): Promise<T> {
  const token = Cookies.get('token');

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // ── Interceptor de sesión expirada ──────────────────────────
  if (res.status === 401 || res.status === 403) {
    const wasAuthenticated = !!token;

    if (wasAuthenticated) {
      handleSessionExpired();
    }

    // Lanzamos error para que SWR lo maneje como error de fetching
    throw new Error('Sesión expirada');
  }

  // ── Otros errores HTTP ──────────────────────────────────────
  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(errorBody || `Error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Lógica centralizada de manejo de sesión expirada.
 * Usa flag para evitar ejecución múltiple (race condition con SWR).
 */
function handleSessionExpired(): void {
  if (isHandlingSessionExpired) return;
  isHandlingSessionExpired = true;

  // 1. Limpiar cookie del token
  Cookies.remove('token');

  // 2. Disparar evento custom para que el store Zustand reaccione
  //    (No podemos importar useAuthStore directamente porque
  //     Zustand no permite usar hooks fuera de componentes React)
  window.dispatchEvent(new CustomEvent('auth:session-expired'));

  // 3. Mostrar toast
  toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', {
    duration: 5000,
  });

  // 4. Redirigir al login (evitando bucle si ya estamos ahí)
  const currentPath = window.location.pathname;
  if (!currentPath.startsWith('/tienda/login')) {
    window.location.href = '/tienda/login';
  }

  // Reset del flag después de 2s para permitir re-intento si el usuario
  // vuelve a loguearse y la sesión expira de nuevo
  setTimeout(() => {
    isHandlingSessionExpired = false;
  }, 2000);
}

/**
 * Wrapper para peticiones fetch manuales (no SWR)
 * que también intercepta 401/403.
 *
 * Uso: const data = await authFetch<AuthResponse>('/api/auth/me')
 */
export async function authFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = Cookies.get('token');

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 || res.status === 403) {
    const wasAuthenticated = !!token;
    if (wasAuthenticated) {
      handleSessionExpired();
    }
    throw new Error('Sesión expirada');
  }

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(errorBody || `Error ${res.status}`);
  }

  return res.json() as Promise<T>;
}
