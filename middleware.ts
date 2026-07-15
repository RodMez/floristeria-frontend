import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const pathname = request.nextUrl.pathname;

  const isAdminPage = pathname.startsWith('/admin');
  const isLoginPage = pathname === '/tienda/login';

  // Sin token en /admin → redirigir a login
  if (isAdminPage && !token) {
    return NextResponse.redirect(new URL('/tienda/login', request.url));
  }

  // Con token en /login → redirigir a admin
  if (isLoginPage && token) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/tienda/login'],
};
