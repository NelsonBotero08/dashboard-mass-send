"use client";
import React, { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { Trash2, Plus, FileText, Search, X, MessageCircle, Eye, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TemplateManager = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Estado para controlar qué plantilla está en proceso de borrado
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/bulk/templates');
      setTemplates(res.data);
    } catch (error) {
      console.error("Error al cargar plantillas", error);
    }
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [templates, searchTerm]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/bulk/templates', { name, content });
      setName('');
      setContent('');
      setShowForm(false);
      fetchTemplates();
      toast.success("Plantilla guardada");
    } catch (error) {
      toast.error("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async (id: number) => {
    try {
      await api.delete(`/bulk/templates/${id}`);
      setTemplates(templates.filter(t => t.id !== id));
      setDeletingId(null);
      toast.success("Plantilla eliminada correctamente");
    } catch (error) {
      toast.error("No se pudo eliminar");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Gestión de Plantillas</h2>
          <p className="text-slate-500 text-sm font-medium">Administra tus mensajes predefinidos</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="md:hidden w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-active"
        >
          {showForm ? <X size={20}/> : <Plus size={20}/>}
          {showForm ? 'Cerrar Formulario' : 'Nueva Plantilla'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* FORMULARIO */}
        <div className={cn(
          "lg:col-span-1 transition-all duration-300",
          !showForm && "hidden lg:block"
        )}>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 sticky top-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Creador</h3>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nombre</label>
                <input 
                  value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Cobro Pendiente"
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-sm font-semibold transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Mensaje</label>
                <textarea 
                  value={content} onChange={(e) => setContent(e.target.value)}
                  placeholder="Hola {{nombre}}..."
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl h-40 focus:ring-2 focus:ring-blue-600 outline-none text-sm resize-none leading-relaxed font-medium"
                  required
                />
              </div>

              {content && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                   <div className="bg-[#e5ddd5] p-4 rounded-3xl relative overflow-hidden border border-slate-200/50">
                      <div className="bg-white p-3 rounded-xl rounded-tl-none shadow-sm relative max-w-[90%]">
                        <p className="text-[13px] text-slate-800 whitespace-pre-wrap">{content}</p>
                        <span className="text-[9px] text-slate-400 block text-right mt-1">12:00</span>
                      </div>
                   </div>
                </div>
              )}

              <button 
                type="submit" disabled={loading}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl disabled:bg-slate-200"
              >
                {loading ? 'Guardando...' : 'Guardar Plantilla'}
              </button>
            </form>
          </div>
        </div>

        {/* LISTA */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Buscar plantillas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[2rem] shadow-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map((t) => (
              <div key={t.id} className="group bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 relative overflow-hidden">
                
                {/* INTERFAZ DE BORRADO INLINE */}
                {deletingId === t.id ? (
                  <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-200">
                    <AlertCircle className="text-rose-500 mb-2" size={32} />
                    <p className="text-sm font-black text-slate-800">¿Eliminar plantilla?</p>
                    <p className="text-xs text-slate-500 mb-4">Esta acción no se puede deshacer</p>
                    <div className="flex gap-2 w-full">
                      <button 
                        onClick={() => setDeletingId(null)}
                        className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={() => confirmDelete(t.id)}
                        className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-100"
                      >
                        Sí, eliminar
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                      <MessageCircle size={18} />
                    </div>
                    <h4 className="font-black text-slate-800 text-sm truncate max-w-[140px] uppercase tracking-tight">{t.name}</h4>
                  </div>
                  <button 
                    onClick={() => setDeletingId(t.id)}
                    className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-50 min-h-[100px]">
                  <p className="text-xs text-slate-600 line-clamp-4 leading-relaxed font-medium">
                    {t.content}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                   <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
                     Ready to Send
                   </span>
                   <span className="text-[10px] text-slate-300 font-bold italic">#{t.id}</span>
                </div>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-24 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
               <FileText className="w-14 h-14 text-slate-200 mx-auto mb-4" />
               <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Sin resultados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateManager;