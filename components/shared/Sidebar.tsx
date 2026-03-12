"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Send,
  LogOut,
  Smartphone,
  BarChart3,
  Menu,
  X,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "WhatsApp QR", href: "/qr", icon: Smartphone },
  { name: "Envío Masivo", href: "/mass", icon: Send },
  { name: "Plantillas", href: "/templates", icon: MessageSquare },
  { name: "Reportes", href: "/reports", icon: BarChart3 },
  { name: "Contactos", href: "/contacts", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <>
      {/* Botón hamburguesa (solo móvil) */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 bg-white rounded-xl shadow-lg border border-slate-100"
        >
          <Menu size={22} className="text-slate-700" />
        </button>
      </div>

      {/* Overlay móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Sidebar Container */}
      <aside className={cn(
        "fixed md:static top-0 left-0 h-full w-64 bg-white border-r border-slate-100 flex flex-col z-50 transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Header Logo */}
        <div className="p-8 flex items-center justify-between">
          <img src="/logo-marca-tex.jpg" alt="Logo" className="h-10 w-auto object-contain" />
          <button className="md:hidden p-2 hover:bg-slate-100 rounded-full" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Navegación Principal */}
        <nav className="flex-1 px-4 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all",
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-6 border-t border-slate-50">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 px-4 py-3 w-full text-rose-500 hover:bg-rose-50 rounded-2xl transition-colors text-sm font-black uppercase tracking-widest"
          >
            <LogOut size={18} />
            Salir
          </button>
        </div>
      </aside>
    </>
  );
}