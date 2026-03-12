import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // En Next.js Middleware es difícil leer localStorage, se suelen usar Cookies
  // Para este ejemplo simple, asumiremos que validas la sesión en el front, 
  // pero lo ideal es guardar el token en una Cookie.
  
  const token = request.cookies.get('token'); // Si decides usar cookies
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register');

  // Si no hay token y no está en login, mandar a login
  // if (!token && !isAuthPage) {
  //   return NextResponse.redirect(new URL('/login', request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};