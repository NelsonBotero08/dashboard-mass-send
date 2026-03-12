"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, Loader2, LogIn } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Conexión a tu backend de NestJS
      const { data } = await api.post('/auth/login', formData);
      
      // Guardar Token y datos básicos
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast.success('¡Bienvenido de nuevo!');
      
      // Redirigir al Dashboard
      router.push('/');
      router.refresh();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-sm sm:max-w-md bg-white 
                      p-6 sm:p-10 
                      rounded-2xl shadow-xl border border-slate-100">

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-xl 
                          flex items-center justify-center text-blue-600 mb-4">
            <LogIn size={26} />
          </div>

          {/* Logo Responsive */}
          <div className="flex items-center justify-center mb-2">
            <img
              src="/logo-marca-tex.jpg"
              alt="Logo Pash Bulk"
              className="h-16 sm:h-20 md:h-24 w-auto object-contain"
            />
          </div>

          <p className="text-xs sm:text-sm text-slate-500">
            Ingresa a tu panel de control
          </p>
        </div>

        {/* Formulario */}
        <form className="mt-6 sm:mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 ml-1 mb-1">
                Correo Electrónico
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-3 py-2.5 text-sm sm:text-base
                            border border-slate-200 rounded-lg
                            focus:ring-2 focus:ring-blue-500 
                            focus:border-transparent outline-none transition-all"
                  placeholder="admin@empresa.com"
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 ml-1 mb-1">
                Contraseña
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-3 py-2.5 text-sm sm:text-base
                            border border-slate-200 rounded-lg
                            focus:ring-2 focus:ring-blue-500 
                            focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2
                      py-2.5 sm:py-3 px-4
                      text-sm sm:text-base font-semibold
                      rounded-lg text-white bg-blue-600
                      hover:bg-blue-700
                      focus:outline-none focus:ring-2 
                      focus:ring-offset-2 focus:ring-blue-500
                      transition-all disabled:opacity-70"
          >
            {isLoading && <Loader2 className="animate-spin" size={18} />}
            Iniciar Sesión
          </button>

          {/* Register */}
          <div className="text-center pt-2">
            <Link
              href="/register"
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              ¿No tienes cuenta? Regístrate aquí
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}