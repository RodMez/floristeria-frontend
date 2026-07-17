import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { ClienteAuthResponse, RegisterClienteRequest, PedidoHistorial, DireccionRequest, DireccionResponse, ActualizarPerfilRequest, ClientePerfilResponse } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Flag global basado en timestamp para evitar múltiples redirecciones/toasts
 * cuando varias peticiones SWR fallan con 401/403 simultáneamente.
 *
 * Usa `window` en vez de variable de módulo para sobrevivir a navegaciones
 * (HMR, soft refresh) y limpiar correctamente basado en TTL.
 */
const SESSION_EXPIRED_FLAG = '__floristeriaSessionExpiredAt';
const SESSION_EXPIRED_TTL = 10000;

function isSessionHandled(): boolean {
  if (typeof window === 'undefined') return false;
  const ts = (window as unknown as Record<string, number>)[SESSION_EXPIRED_FLAG];
  if (!ts) return false;
  if (Date.now() - ts > SESSION_EXPIRED_TTL) {
    delete (window as unknown as Record<string, number>)[SESSION_EXPIRED_FLAG];
    return false;
  }
  return true;
}

function markSessionHandled(): void {
  if (typeof window === 'undefined') return;
  (window as unknown as Record<string, number>)[SESSION_EXPIRED_FLAG] = Date.now();
}

/**
 * Endpoints públicos que NO requieren header de autenticación.
 * El fetcher no enviará Authorization en estos endpoints.
 */
const PUBLIC_ENDPOINTS = [
  '/api/v1/sedes',
  '/api/v1/configuracion',
  '/api/v1/catalogo',
  '/api/v1/clientes/auth',
];

/**
 * Verifica si una URL es un endpoint público.
 */
function isPublicEndpoint(url: string): boolean {
  return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
}

/**
 * Fetcher para SWR con interceptor de sesión expirada.
 *
 * Si la API responde 401/403 y el usuario estaba autenticado:
 *  1. Limpia el estado de auth (cookie + Zustand via evento)
 *  2. Muestra un toast informativo
 *  3. Dispara evento custom para que el layout redirija vía router
 */
export async function fetcher<T = unknown>(url: string): Promise<T> {
  const token = Cookies.get('token');
  const isPublic = isPublicEndpoint(url);

  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(!isPublic && token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    // ── Interceptor de sesión expirada (solo endpoints protegidos) ──
    if (!isPublic && (res.status === 401 || res.status === 403)) {
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
  } catch (error) {
    // Los abortos intencionados (fetch cancelado al desmontar componente,
    // navegar a otra página, etc.) NO son errores reales.
    // No los propagamos a SWR para que no muestre error UI ni
    // dispare el interceptor de sesión expirada.
    if (error instanceof DOMException && error.name === 'AbortError') {
      // Re-lanzar como "cancelación" especial que SWR ignora
      const aborted = new Error('__aborted__');
      (aborted as Error & { __aborted__?: boolean }).__aborted__ = true;
      throw aborted;
    }
    throw error;
  }
}

/**
 * Login de cliente - POST /api/v1/clientes/auth/login
 */
export async function loginCliente(email: string, password: string): Promise<ClienteAuthResponse> {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clientes/auth/login`;

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error('Credenciales inválidas');
  }

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(errorBody || `Error ${res.status}`);
  }

  return res.json() as Promise<ClienteAuthResponse>;
}

/**
 * Registro de cliente - POST /api/v1/clientes/auth/registro
 */
export async function registerCliente(data: RegisterClienteRequest): Promise<ClienteAuthResponse> {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clientes/auth/registro`;

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (res.status === 400 || res.status === 409) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(errorBody || 'Error en el registro');
  }

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(errorBody || `Error ${res.status}`);
  }

  return res.json() as Promise<ClienteAuthResponse>;
}

/**
 * Obtiene el historial de pedidos del cliente autenticado.
 * GET /api/v1/clientes/pedidos
 */
export function getMisPedidos(): Promise<PedidoHistorial[]> {
  return fetcher<PedidoHistorial[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clientes/pedidos`
  );
}

const API_DIRECCIONES = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clientes/direcciones`;

/**
 * Crea una nueva dirección de entrega.
 * POST /api/v1/clientes/direcciones
 */
export function crearDireccion(data: DireccionRequest): Promise<DireccionResponse> {
  return authFetch<DireccionResponse>(API_DIRECCIONES, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Actualiza una dirección existente.
 * PUT /api/v1/clientes/direcciones/{id}
 */
export function actualizarDireccion(id: number, data: DireccionRequest): Promise<DireccionResponse> {
  return authFetch<DireccionResponse>(`${API_DIRECCIONES}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Elimina una dirección del cliente.
 * DELETE /api/v1/clientes/direcciones/{id}
 */
export function eliminarDireccion(id: number): Promise<void> {
  return authFetch<void>(`${API_DIRECCIONES}/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Actualiza el perfil del cliente (nombre y teléfono).
 * PUT /api/v1/clientes/perfil
 */
export function actualizarPerfil(data: ActualizarPerfilRequest): Promise<{ nombre: string; telefono?: string }> {
  return authFetch<{ nombre: string; telefono?: string }>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clientes/perfil`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  );
}

/**
 * Obtiene el perfil del cliente autenticado.
 * GET /api/v1/clientes/perfil
 */
export function obtenerPerfil(): Promise<ClientePerfilResponse> {
  return authFetch<ClientePerfilResponse>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clientes/perfil`
  );
}

/**
 * Lógica centralizada de manejo de sesión expirada.
 * Usa flag para evitar ejecución múltiple (race condition con SWR).
 *
 * NO usa window.location.href para no destruir el state de Zustand
 * en memoria ni el cache de SWR. En su lugar, dispara un evento custom
 * que el layout escucha y redirige vía router.replace().
 */
function handleSessionExpired(): void {
  if (isSessionHandled()) return;
  markSessionHandled();

  // 1. Limpiar cookie del token
  Cookies.remove('token', { path: '/' });

  // 2. Leer el rol ANTES de dispatchEvent (logout lo limpia síncronamente)
  const rol = useAuthStore.getState().rol;
  const isAdmin = rol === 'ADMIN' || rol === 'SUPERADMIN';

  // 3. Disparar evento custom para que el store Zustand reaccione
  window.dispatchEvent(new CustomEvent('auth:session-expired'));

  // 4. Mostrar toast
  toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', {
    duration: 5000,
  });

  // 5. Redirigir según el rol del usuario
  // Admin → /tienda/login (login de admin)
  // Cliente/otros → /tienda/auth (login/registro de cliente)
  const redirectPath = isAdmin ? '/tienda/login' : '/tienda/auth';

  // Solo redirigir si NO estamos ya en la página destino
  if (window.location.pathname !== redirectPath) {
    window.dispatchEvent(new CustomEvent('auth:redirect', {
      detail: { path: redirectPath }
    }));
  }
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
  const isFormData = options.body instanceof FormData;

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
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

  if (res.status === 204) {
    return undefined as unknown as T;
  }

  return res.json() as Promise<T>;
}