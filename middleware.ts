import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Decodifica el payload de un JWT sin verificar la firma.
 * Solo para leer claims como 'exp' en middleware.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Verifica si un JWT está expirado.
 */
function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') {
    // Si no podemos decodificar o no tiene 'exp', asumir que está expirado
    return true;
  }
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const pathname = request.nextUrl.pathname;

  const isAdminPage = pathname.startsWith('/admin');
  const isLoginPage = pathname === '/tienda/login';

  // Verificar si el token es válido (existe y no está expirado)
  const isTokenValid = token && !isTokenExpired(token);

  // Sin token válido en /admin → redirigir a login
  if (isAdminPage && !isTokenValid) {
    // Limpiar cookie expirada si existe
    const response = NextResponse.redirect(new URL('/tienda/login', request.url));
    if (token) {
      response.cookies.delete('token');
    }
    return response;
  }

  // Con token expirado en /login → limpiar cookie y permitir acceso
  // NOTA: No redirigir de /tienda/login a /admin aunque haya token válido.
  // El login page maneja esto en el cliente con isTokenValid.
  if (isLoginPage && token && !isTokenValid) {
    const response = NextResponse.next();
    response.cookies.delete('token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/tienda/login'],
};
