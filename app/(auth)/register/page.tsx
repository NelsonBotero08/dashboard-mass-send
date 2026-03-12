"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, User, Loader2, UserPlus, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/auth/register-admin-secret', form);
      toast.success('¡Cuenta creada con éxito! Ya puedes iniciar sesión.');
      router.push('/login');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al crear la cuenta';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

 return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-sm sm:max-w-md 
                      bg-white 
                      p-6 sm:p-10 
                      rounded-2xl shadow-xl border border-slate-100">

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-xl 
                          flex items-center justify-center 
                          text-blue-600 mb-4">
            <UserPlus size={26} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Crear Cuenta
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Regístrate para empezar a usar Pash Bulk
          </p>
        </div>

        {/* Form */}
        <form className="mt-6 sm:mt-8 space-y-5" onSubmit={handleRegister}>
          <div className="space-y-4">

            {/* Nombre */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 ml-1 mb-1">
                Nombre Completo
              </label>

              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-3 py-2.5 text-sm sm:text-base
                            border border-slate-200 rounded-lg
                            focus:ring-2 focus:ring-blue-500
                            outline-none transition-all"
                  placeholder="Tu nombre"
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              </div>
            </div>

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
                            outline-none transition-all"
                  placeholder="admin@empresa.com"
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
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
                            outline-none transition-all"
                  placeholder="••••••••"
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
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
                      transition-all disabled:opacity-70"
          >
            {isLoading && <Loader2 className="animate-spin" size={18} />}
            Registrarme
          </button>

          {/* Volver */}
          <div className="flex justify-center pt-3">
            <Link
              href="/login"
              className="flex items-center gap-2 
                        text-xs sm:text-sm 
                        text-slate-500 hover:text-blue-600 
                        transition-colors font-medium"
            >
              <ArrowLeft size={16} />
              Volver al inicio de sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}