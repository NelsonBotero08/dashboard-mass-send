"use client";
import { useEffect, useState } from 'react';
import { 
  Smartphone, RefreshCw, CheckCircle2, QrCode, 
  Loader2, LogOut, Trash2, ShieldCheck, AlertCircle,
  X, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function QRPage() {
  const [status, setStatus] = useState({ connected: false, qr: null });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Estado para el Modal de Confirmación
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    type: 'danger' | 'warning';
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
    type: 'warning'
  });

  const fetchStatus = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response: any = await api.get('/whatsapp/status');
      const newData = response.data;

      setStatus(prev => {
        if (prev.qr === newData.qr && prev.connected === newData.connected) {
          return prev; 
        }
        return newData;
      });
    } catch (error) {
      console.error("Error al obtener estado:", error);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    setLoading(true);
    try {
      await api.post('/whatsapp/init'); 
      toast.success("Despertando servicio de WhatsApp...");
      setTimeout(() => fetchStatus(false), 3000);
    } catch (error) {
      toast.error("Error al iniciar el servicio");
    } finally {
      setLoading(false);
    }
  };

  const executeLogout = async () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    setActionLoading(true);
    try {
      await api.post('/whatsapp/logout');
      toast.success("Sesión cerrada correctamente");
      fetchStatus();
    } catch (error) {
      toast.error("Error al cerrar sesión");
    } finally {
      setActionLoading(false);
    }
  };

  const executeResetAuth = async () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    setActionLoading(true);
    try {
      await api.post('/whatsapp/reset-auth');
      toast.success("Archivos de sesión eliminados");
      fetchStatus();
    } catch (error) {
      toast.error("Error al resetear la sesión");
    } finally {
      setActionLoading(false);
    }
  };

  // Disparadores de los modales "bonitos"
  const openLogoutConfirm = () => {
    setConfirmDialog({
      isOpen: true,
      title: "¿Cerrar Sesión Activa?",
      description: "Esta acción desconectará el bot Marca-tex. Deberás escanear el código QR nuevamente para realizar envíos.",
      onConfirm: executeLogout,
      type: 'warning'
    });
  };

  const openResetConfirm = () => {
    setConfirmDialog({
      isOpen: true,
      title: "¿Limpiar Archivos Críticos?",
      description: "Esta acción eliminará físicamente la carpeta de autenticación. Úsala solo si el servicio no responde o el QR está bloqueado.",
      onConfirm: executeResetAuth,
      type: 'danger'
    });
  };

  useEffect(() => {
    fetchStatus(false);
    const interval = setInterval(() => fetchStatus(true), 15000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-8 animate-in fade-in duration-500 relative">
      
      {/* MODAL DE CONFIRMACIÓN PERSONALIZADO */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mx-auto",
                confirmDialog.type === 'danger' ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
              )}>
                {confirmDialog.type === 'danger' ? <AlertTriangle size={32} /> : <AlertCircle size={32} />}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-800">{confirmDialog.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{confirmDialog.description}</p>
              </div>
            </div>
            <div className="flex border-t border-slate-100">
              <button 
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 px-6 py-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDialog.onConfirm}
                className={cn(
                  "flex-1 px-6 py-4 text-sm font-bold text-white transition-colors",
                  confirmDialog.type === 'danger' ? "bg-rose-600 hover:bg-rose-700" : "bg-amber-600 hover:bg-amber-700"
                )}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER RESPONSIVE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Panel de Conexión</h2>
          <p className="text-slate-500 text-sm">Gestiona la vinculación del bot Marca-tex</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => fetchStatus(false)}
            disabled={loading || actionLoading}
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={18} className={cn(loading && "animate-spin text-blue-600")} />
            <span className="sm:hidden lg:inline text-sm font-medium text-slate-700">Actualizar</span>
          </button>
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* TARJETA DE ESTADO */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-6">
          <div className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-inner",
            status?.connected ? "bg-green-100 text-green-600 ring-8 ring-green-50" : "bg-amber-100 text-amber-600 ring-8 ring-amber-50"
          )}>
            {status.connected ? <ShieldCheck size={48} /> : <AlertCircle size={48} />}
          </div>
          
          <div className="space-y-2">
            <h3 className="font-bold text-2xl tracking-tight">
              {status.connected ? "Bot en Línea" : "Desconectado"}
            </h3>
            <p className="text-sm text-slate-500 max-w-[250px] mx-auto">
              {status.connected 
                ? 'El sistema está listo para procesar campañas y responder mensajes.' 
                : 'Escanea el código QR con tu WhatsApp para activar las funciones automáticas.'}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 w-full">
            {!status.connected ? (
              <button 
                onClick={handleGenerateQR} 
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50"
              >
                <QrCode size={20} /> Generar QR
              </button>
            ) : (
              <button 
                onClick={openLogoutConfirm} 
                disabled={actionLoading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-bold hover:bg-rose-100 transition-all active:scale-95 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <LogOut size={20} />} 
                Cerrar Sesión
              </button>
            )}
          </div>
        </div>

        {/* VISUALIZADOR DE QR */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[350px] relative overflow-hidden">
          {loading && !status.qr && !status.connected ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-blue-600" size={48} />
              <p className="text-slate-400 font-medium animate-pulse">Consultando servidor...</p>
            </div>
          ) : status.connected ? (
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-32 h-32 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center mx-auto border border-green-100 rotate-3 animate-in zoom-in duration-500">
                  <CheckCircle2 size={64} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-green-600 font-black uppercase tracking-[0.2em] text-xs">Conexión Segura</p>
                <p className="text-slate-400 text-xs">Vinculado como Administrador</p>
              </div>
            </div>
          ) : status.qr ? (
            <div className="text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="bg-white p-4 border-2 border-slate-50 rounded-[2.5rem] shadow-xl ring-1 ring-slate-100">
                <img 
                  key={status.qr} 
                  src={status.qr} 
                  alt="QR WhatsApp"
                  className="w-56 h-56 md:w-64 md:h-64 mx-auto object-contain transition-opacity duration-300"
                />
              </div>
              <p className="text-[11px] text-blue-500 font-bold bg-blue-50 px-4 py-1 rounded-full inline-block">
                ABRE WHATSAPP {'>'} DISPOSITIVOS VINCULADOS
              </p>
            </div>
          ) : (
            <div className="text-center space-y-6">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                  <QrCode size={40} className="text-slate-200" />
               </div>
               <div className="space-y-2">
                 <p className="text-slate-500 font-semibold">Sin sesión activa</p>
                 <button 
                  onClick={openResetConfirm}
                  disabled={actionLoading}
                  className="text-xs text-slate-400 hover:text-rose-500 underline decoration-dotted transition-colors flex items-center gap-1 mx-auto disabled:opacity-50"
                 >
                   <Trash2 size={12} /> Limpiar archivos temporales
                 </button>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER ADAPTADO */}
      <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-[2rem] flex items-start gap-4">
        <div className="bg-blue-600 p-2 rounded-xl text-white">
          <AlertCircle size={20} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-blue-900">Ayuda del sistema</p>
          <p className="text-xs text-blue-700/80 leading-relaxed">
            Si el código QR no aparece o el estado no cambia a "Conectado" tras escanear, utiliza la opción <b>Limpiar archivos temporales</b> para forzar un reinicio limpio del motor de Baileys.
          </p>
        </div>
      </div>
    </div>
  );
}