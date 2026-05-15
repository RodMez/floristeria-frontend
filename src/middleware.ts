import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin');

  // Si intenta entrar a /admin sin token, redirigir a /login
  if (isAdminPage && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si intenta entrar a /login teniendo ya un token, redirigir a /admin
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
