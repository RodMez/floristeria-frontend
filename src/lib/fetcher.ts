import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { ClienteAuthResponse, RegisterClienteRequest, PedidoHistorial, DireccionRequest, DireccionResponse, ActualizarPerfilRequest } from '@/types';

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
 * Lógica centralizada de manejo de sesión expirada.
 * Usa flag para evitar ejecución múltiple (race condition con SWR).
 *
 * NO usa window.location.href para no destruir el state de Zustand
 * en memoria. En su lugar, dispara el evento que el store escucha
 * y confía en que cada página protegida redirija vía router.replace.
 */
function handleSessionExpired(): void {
  if (isHandlingSessionExpired) return;
  isHandlingSessionExpired = true;

  // 1. Limpiar cookie del token
  Cookies.remove('token');

  // 2. Disparar evento custom para que el store Zustand reaccione
  window.dispatchEvent(new CustomEvent('auth:session-expired'));

  // 3. Mostrar toast
  toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', {
    duration: 5000,
  });

  // 4. Redirigir via router navigación suave, NO con window.location.href
  //    que destruye todo el state de Zustand en memoria.
  const currentPath = window.location.pathname;
  if (!currentPath.startsWith('/tienda/auth')) {
    // Navegación suave con Next.js: push a /tienda/auth sin recarga completa
    // Usamos replaceState + popstate para que el router de Next.js reaccione
    // sin perder el state de Zustand persistido en localStorage
    window.history.replaceState(null, '', '/tienda/auth');
    window.dispatchEvent(new PopStateEvent('popstate'));
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

  if (res.status === 204) {
    return undefined as unknown as T;
  }

  return res.json() as Promise<T>;
}