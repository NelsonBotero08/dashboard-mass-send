"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { jwtDecode } from 'jwt-decode'; // Librería para leer el JWT

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const isAuthPage = pathname === '/login' || pathname === '/register';

    if (!token) {
      if (!isAuthPage) {
        setAuthorized(false);
        router.push('/login');
      } else {
        setAuthorized(true);
      }
      return;
    }

    try {
      // Validar si el token ha expirado
      const decoded: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (decoded.exp < currentTime) {
        // El token venció
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthorized(false);
        router.push('/login');
        return;
      }

      // Si hay token y no ha vencido
      setAuthorized(true);
      if (isAuthPage) {
        router.push('/'); // Si está logueado e intenta ir al login, lo mandamos al home
      }

    } catch (error) {
      // Token inválido o corrupto
      localStorage.removeItem('token');
      router.push('/login');
    }
  }, [pathname, router]);

  // Pantalla de carga mientras verificamos
  if (!authorized && pathname !== '/login' && pathname !== '/register') {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}