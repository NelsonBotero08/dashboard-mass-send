"use client";
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Upload, Send, CheckCircle2, Loader2, MessageSquare,
  Search, X, Users, Image as ImageIcon, ChevronRight
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function MassSendPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // --- ESTADOS DE DATOS ---
  const [templates, setTemplates] = useState<any[]>([]);
  const [dbContacts, setDbContacts] = useState<any[]>([]);
  
  // --- ESTADOS DE SELECCIÓN ---
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<number[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  // --- ESTADOS DE FILTRO (SERVER-SIDE) ---
  const [searchTerm, setSearchTerm] = useState(""); // Filtro de plantillas (Local)
  const [searchContact, setSearchContact] = useState(""); // Filtro de contactos (Server)
  const [excludeDays, setExcludeDays] = useState(7);

  // 1. CARGAR PLANTILLAS (Una sola vez)
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await api.get('/bulk/templates');
        setTemplates(res.data || []);
      } catch (error) {
        console.error("Error templates:", error);
      }
    };
    fetchTemplates();
  }, []);

  // 2. CARGAR CONTACTOS (Cada vez que cambie el buscador o los días de exclusión)
  // Implementamos un pequeño delay (debounce) para no saturar la API al escribir
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFilteredContacts();
    }, 400); // Espera 400ms tras dejar de escribir

    return () => clearTimeout(timer);
  }, [searchContact, excludeDays]);

  const fetchFilteredContacts = async () => {
    try {
      setLoading(true);
      // Enviamos 'search' al backend para que busque en TODA la BD
      const res = await api.get(`/whatsapp/contacts`, {
        params: {
          limit: 100, // Traemos solo 100 resultados relevantes para no saturar el scroll
          excludeDays: excludeDays,
          search: searchContact 
        }
      });
      setDbContacts(res.data.data || []);
    } catch (error) {
      toast.error("Error al sincronizar contactos");
    } finally {
      setLoading(false);
    }
  };

  // 3. LÓGICA DE SELECCIÓN
  const toggleContact = (id: number) => {
    setSelectedContactIds(prev => {
      if (prev.includes(id)) return prev.filter(cId => cId !== id);
      if (prev.length >= 50) {
        toast.warning("Límite de seguridad: 50 contactos por envío");
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedImages(prev => [...prev, ...filesArray].slice(0, 5));
    }
  };

  const handleStartSend = async () => {
    if (selectedContactIds.length === 0 || selectedTemplateIds.length === 0) {
      return toast.error("Faltan contactos o plantillas");
    }

    setLoading(true);
    const formData = new FormData();
    try {
      formData.append('contactIds', selectedContactIds.join(','));
      formData.append('templateIds', selectedTemplateIds.join(','));
      selectedImages.forEach(img => formData.append('images', img));

      await api.post('/whatsapp/start-mobile-campaign', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setStep(3);
      toast.success("Campaña iniciada");
    } catch (error: any) {
      toast.error("Error: " + (error.response?.data?.message || "Fallo de conexión"));
    } finally {
      setLoading(false);
    }
  };

  // Filtro local solo para plantillas (suelen ser pocas)
  const filteredTemplates = useMemo(() => {
    return templates.filter(t =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [templates, searchTerm]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* HEADER */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 italic uppercase">Envío Masivo</h2>
        <div className="flex justify-center items-center gap-4 mt-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className={cn("h-1.5 rounded-full transition-all duration-500", step >= s ? "w-8 bg-blue-600" : "w-4 bg-slate-200")} />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        
        {/* PASO 1: CONTACTOS */}
        {step === 1 && (
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between gap-4 items-end">
              <div className="w-full md:w-1/2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Excluir recientes:</label>
                <select 
                  value={excludeDays} 
                  onChange={(e) => setExcludeDays(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-100 rounded-2xl text-xs font-bold outline-none border-none text-slate-700"
                >
                  <option value={7}>7 Días (Seguro)</option>
                  <option value={15}>15 Días</option>
                  <option value={0}>No filtrar (Mostrar todos)</option>
                </select>
              </div>

              <div className={cn(
                "px-6 py-4 rounded-2xl border flex flex-col items-center justify-center min-w-[140px]",
                selectedContactIds.length >= 50 ? "bg-rose-50 border-rose-100 text-rose-600" : "bg-blue-50 border-blue-100 text-blue-600"
              )}>
                <span className="text-[9px] font-black uppercase">Seleccionados</span>
                <span className="text-2xl font-black">{selectedContactIds.length} / 50</span>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text" 
                placeholder="Buscar en TODA la base de datos..."
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl text-sm outline-none border border-transparent focus:border-blue-200 transition-all"
                value={searchContact} 
                onChange={(e) => setSearchContact(e.target.value)}
              />
              {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-blue-500" size={18} />}
            </div>

            <div className="border border-slate-100 rounded-[1.5rem] overflow-hidden bg-slate-50/30">
              <div className="h-[400px] overflow-y-auto">
                {dbContacts.length > 0 ? dbContacts.map(c => {
                  const isSelected = selectedContactIds.includes(c.id);
                  return (
                    <div 
                      key={c.id} 
                      onClick={() => toggleContact(c.id)}
                      className={cn(
                        "flex items-center justify-between px-6 py-3 border-b border-slate-100 last:border-0 cursor-pointer transition-colors",
                        isSelected ? "bg-blue-600 text-white" : "hover:bg-white bg-transparent"
                      )}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{c.nombre}</span>
                        <span className={cn("text-[10px]", isSelected ? "text-blue-100" : "text-slate-400")}>+{c.telefono}</span>
                      </div>
                      <div className={cn(
                        "w-6 h-6 rounded-full border flex items-center justify-center",
                        isSelected ? "bg-white border-white text-blue-600" : "border-slate-200 bg-white"
                      )}>
                        {isSelected && <CheckCircle2 size={14} />}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 italic text-sm">
                    No se encontraron contactos...
                  </div>
                )}
              </div>
            </div>

            <button
              disabled={selectedContactIds.length === 0}
              onClick={() => setStep(2)}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-30 shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Continuar <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* PASO 2: CONTENIDO */}
        {step === 2 && (
          <div className="p-6 md:p-8 space-y-8">
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare size={14} /> Selecciona Plantillas (Se rotarán)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
                {filteredTemplates.map(t => (
                  <div 
                    key={t.id} 
                    onClick={() => setSelectedTemplateIds(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])}
                    className={cn(
                      "p-4 rounded-2xl border transition-all cursor-pointer",
                      selectedTemplateIds.includes(t.id) ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-100 bg-white"
                    )}
                  >
                    <p className="text-xs font-black text-slate-800 uppercase mb-1">{t.name}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{t.content}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={14} /> Adjuntar Imágenes (Máx 5)
              </h3>
              <div className="flex flex-wrap gap-3 p-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <label className="w-20 h-20 bg-white border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-blue-400 transition-all">
                  <Upload size={20} />
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
                {selectedImages.map((img, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-2xl overflow-hidden group shadow-sm">
                    <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" />
                    <button onClick={() => setSelectedImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-rose-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><X size={20} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={() => setStep(1)} className="px-6 py-4 text-slate-400 font-black text-[10px] uppercase">Atrás</button>
              <button
                  // Ahora se habilita si hay plantillas O si hay imágenes seleccionadas
                  disabled={loading || (selectedTemplateIds.length === 0 && selectedImages.length === 0)}
                  onClick={handleStartSend}
                  className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Lanzar Campaña</>}
                </button>
            </div>
          </div>
        )}

        {/* PASO 3: ÉXITO */}
        {step === 3 && (
          <div className="p-16 text-center space-y-6">
            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto">
              <CheckCircle2 size={48} />
            </div>
            <h3 className="text-3xl font-black text-slate-800 italic">¡EN COLA!</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">Los mensajes se están enviando de forma segura para proteger tu cuenta de WhatsApp.</p>
            <button
              onClick={() => { setStep(1); setSelectedTemplateIds([]); setSelectedContactIds([]); setSelectedImages([]); setSearchContact(""); }}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em]"
            >
              Nuevo Envío Masivo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}