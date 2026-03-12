"use client";
import React, { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  LayoutDashboard, MessageSquare, RefreshCcw, CheckCircle2, Clock, 
  Search, ChevronLeft, ChevronRight, Smartphone, FilterX, Eye, X, Copy, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ReportsPage = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMsg, setSelectedMsg] = useState<any>(null); // Mensaje para el modal
  const [data, setData] = useState<any>({
    resumen: { total_encontrados: 0, exitosos: 0, fallidos: 0 },
    paginacion: { total_paginas: 1, pagina_actual: 1, total_items: 0 },
    detalle: []
  });

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    phone: '',
    from: '',
    to: ''
  });

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const { page, limit, phone, from, to } = filters;
      let url = `/whatsapp/report?page=${page}&limit=${limit}`;
      if (phone) url += `&phone=${phone}`;
      if (from) url += `&from=${from}`;
      if (to) url += `&to=${to}`;

      const response = await api.get(url);
      setData(response.data);
    } catch (error) {
      console.error("Error al cargar reporte:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  const chartData = [
    { name: 'Total', value: data.resumen.total_encontrados, color: '#3B82F6' },
    { name: 'Éxito', value: data.resumen.exitosos, color: '#10B981' },
    { name: 'Falla', value: data.resumen.fallidos, color: '#EF4444' },
  ];

  return (
    <div className="p-4 md:p-8 bg-[#F9FAFB] min-h-screen space-y-8 animate-in fade-in duration-500 relative">
      
      {/* MODAL DE DETALLE DEL MENSAJE */}
      {selectedMsg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Detalle del Envío</h3>
                  <p className="text-[10px] text-slate-400 font-bold">{selectedMsg.fecha}</p>
                </div>
              </div>
              <button onClick={() => setSelectedMsg(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Destinatario</p>
                  <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    {selectedMsg.telefono}
                    <button onClick={() => copyToClipboard(selectedMsg.telefono)}><Copy size={12} className="text-blue-500" /></button>
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Estado</p>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-wider",
                    selectedMsg.estado.includes('✅') ? "text-green-600" : "text-rose-600"
                  )}>
                    {selectedMsg.estado}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase ml-1">Contenido del Mensaje</p>
                <div className="p-5 bg-blue-50/30 border border-blue-100 rounded-[1.5rem] relative group">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedMsg.mensaje}
                  </p>
                  <button 
                    onClick={() => copyToClipboard(selectedMsg.mensaje)}
                    className="absolute top-3 right-3 p-2 bg-white rounded-xl shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Copy size={14} className="text-slate-400 hover:text-blue-500" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedMsg(null)}
                className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-100 transition-colors"
              >
                CERRAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER & FILTROS (Se mantienen igual) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Métricas de Envío</h1>
          <p className="text-slate-500 text-sm">Monitoreo en tiempo real de la base de datos PostgreSQL</p>
        </div>
        <button 
          onClick={fetchReport}
          className="flex items-center justify-center gap-2 bg-white px-6 py-2.5 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
        >
          <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} /> Sincronizar
        </button>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-4 md:p-6 rounded-[2rem] shadow-sm border border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Buscar Teléfono</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Ej: 57300..."
              value={filters.phone}
              onChange={(e) => setFilters({...filters, phone: e.target.value, page: 1})}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm outline-none"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Desde</label>
          <input type="date" value={filters.from} onChange={(e) => setFilters({...filters, from: e.target.value, page: 1})} className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-sm outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Hasta</label>
          <input type="date" value={filters.to} onChange={(e) => setFilters({...filters, to: e.target.value, page: 1})} className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-sm outline-none" />
        </div>
        <button onClick={() => setFilters({page:1, limit:10, phone:'', from:'', to:''})} className="flex items-center justify-center gap-2 px-4 py-2 text-slate-400 hover:text-rose-500 transition-colors text-sm font-bold">
          <FilterX size={18} /> Limpiar Filtros
        </button>
      </div>

      {/* CARDS Y GRÁFICO (Resumido para brevedad) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard title="Total Filtrado" value={data.resumen.total_encontrados} icon={<MessageSquare />} color="blue" />
        <StatCard title="Enviados ✅" value={data.resumen.exitosos} icon={<CheckCircle2 />} color="green" />
        <StatCard title="Fallidos ❌" value={data.resumen.fallidos} icon={<FilterX />} color="rose" />
      </div>

      {/* TABLA PAGINADA CON ACCIÓN DE VER MÁS */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="px-8 py-5">Fecha</th>
                <th className="px-8 py-5">Teléfono</th>
                <th className="px-8 py-5">Mensaje</th>
                <th className="px-8 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.detalle.length > 0 ? data.detalle.map((msg: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5 text-xs text-slate-500 font-medium">{msg.fecha}</td>
                  <td className="px-8 py-5 text-sm font-bold text-slate-700">{msg.telefono}</td>
                  <td className="px-8 py-5 max-w-xs">
                    <p className="text-sm text-slate-600 truncate">{msg.mensaje}</p>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => setSelectedMsg(msg)}
                      className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all"
                    >
                      <Eye size={14} /> Detalle
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold italic">Sin resultados.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* CONTROLES PAGINACIÓN (Igual que antes) */}
        <div className="px-8 py-6 bg-slate-50/30 flex items-center justify-between">
           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total: {data.paginacion.total_items}</p>
           <div className="flex gap-2">
             <button disabled={filters.page === 1} onClick={() => setFilters({...filters, page: filters.page - 1})} className="p-2 bg-white border rounded-xl disabled:opacity-30"><ChevronLeft/></button>
             <button disabled={filters.page === data.paginacion.total_paginas} onClick={() => setFilters({...filters, page: filters.page + 1})} className="p-2 bg-white border rounded-xl disabled:opacity-30"><ChevronRight/></button>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => {
  const themes: any = { blue: 'bg-blue-600 shadow-blue-100', green: 'bg-emerald-500 shadow-emerald-100', rose: 'bg-rose-500 shadow-rose-100' };
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-5">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg", themes[color])}>{icon}</div>
      <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p><p className="text-2xl font-black text-slate-900">{value || 0}</p></div>
    </div>
  );
};

export default ReportsPage;