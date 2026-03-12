"use client";
import { useState, useEffect, useMemo } from 'react';
import { 
  Upload, FileText, Send, CheckCircle2, Loader2, MessageSquare, 
  Search, X, Users, Image as ImageIcon, Smartphone, ChevronRight, Filter, Calendar
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function MassSendPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // --- ESTADOS COMUNES ---
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // --- ESTADOS ESPECÍFICOS ESCRITORIO ---
  const [file, setFile] = useState<File | null>(null);
  const [contactCount, setContactCount] = useState(0);

  // --- ESTADOS ESPECÍFICOS MÓVIL (FILTROS NUEVOS) ---
  const [dbContacts, setDbContacts] = useState<any[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [searchContact, setSearchContact] = useState("");
  
  // Nuevos filtros
  const [filterCategory, setFilterCategory] = useState("Todos");
  const [filterDays, setFilterDays] = useState("0"); // "0" es todos, "7", "15", "30"

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 768);
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tplRes, contRes] = await Promise.all([
          api.get('/bulk/templates'),
          api.get('/whatsapp/contacts?limit=500') // Aumentamos el límite para los filtros
        ]);
        setTemplates(Array.isArray(tplRes.data) ? tplRes.data : []);
        setDbContacts(contRes.data.data || []);
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };
    fetchData();
  }, [isMobile]);

  // --- LÓGICA FILTRADO AVANZADO ---
  const categories = useMemo(() => {
    const unique = Array.from(new Set(dbContacts.map(c => c.categoria || 'General')));
    return ['Todos', ...unique];
  }, [dbContacts]);

  const filteredContacts = useMemo(() => {
    return dbContacts.filter(c => {
      // 1. Filtro por búsqueda (nombre/tel)
      const matchesSearch = c.nombre.toLowerCase().includes(searchContact.toLowerCase()) || c.telefono.includes(searchContact);
      
      // 2. Filtro por categoría
      const matchesCategory = filterCategory === "Todos" || c.categoria === filterCategory;
      
      // 3. Filtro por días desde el último envío
      let matchesDays = true;
      if (filterDays !== "0") {
        if (!c.last_mass_send) {
            matchesDays = true; // Si nunca se le ha enviado, entra en el filtro de "hace más de X días"
        } else {
            const lastSend = new Date(c.last_mass_send);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - lastSend.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            matchesDays = diffDays >= parseInt(filterDays);
        }
      }

      return matchesSearch && matchesCategory && matchesDays;
    });
  }, [dbContacts, searchContact, filterCategory, filterDays]);

  // --- HANDLERS ---
  const handleSelectAllFiltered = () => {
    const ids = filteredContacts.map(c => c.id);
    setSelectedContactIds(ids);
    toast.info(`${ids.length} contactos seleccionados`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onload = (event) => {
          const rows = (event.target?.result as string).split('\n').filter(r => r.trim() !== '');
          setContactCount(rows.length - 1);
        };
        reader.readAsText(selectedFile);
        setStep(2);
      } else {
        toast.error("Solo archivos .csv");
      }
    }
  };

  const handleStartSend = async () => {
    setLoading(true);
    const formData = new FormData();
    try {
      if (!isMobile) {
        if (!file) return;
        formData.append('file', file);
        selectedTemplateIds.forEach(id => {
          const t = templates.find(tpl => tpl.id === id);
          if (t) formData.append('templates', t.content);
        });
        await api.post('/bulk/upload', formData);
      } else {
        formData.append('contactIds', selectedContactIds.join(','));
        formData.append('templateIds', selectedTemplateIds.join(','));
        selectedImages.forEach(img => formData.append('images', img));
        await api.post('/whatsapp/start-mobile-campaign', formData);
      }
      setStep(3);
      toast.success("Campaña iniciada");
    } catch (error) {
      toast.error("Error al iniciar campaña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* HEADER */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
          {isMobile ? <Smartphone size={14}/> : <FileText size={14}/>}
          Modo {isMobile ? 'Móvil (Base de Datos)' : 'Escritorio (CSV)'}
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
          {step === 3 ? '¡ENVÍO EXITOSO!' : 'NUEVA CAMPAÑA'}
        </h2>
      </div>

      {/* STEPS */}
      <div className="flex justify-center items-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className={cn("h-1.5 rounded-full transition-all duration-500", step >= s ? "w-8 bg-blue-600" : "w-4 bg-slate-200")} />
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">

        {step === 1 && (
          <div className="p-6 md:p-8 space-y-6">
            {!isMobile ? (
              // ... (vista desktop se mantiene igual)
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2rem] py-16 hover:bg-slate-50 transition-all cursor-pointer group">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload size={32} />
                </div>
                <p className="mt-4 font-bold text-slate-700">Subir base de datos CSV</p>
                <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
              </label>
            ) : (
              <div className="space-y-6">
                {/* HEADER FILTROS */}
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-2">
                    <Filter size={14} className="text-blue-600"/> Filtros Inteligentes
                  </h3>
                  <button 
                    onClick={handleSelectAllFiltered} 
                    className="text-blue-600 font-black text-[10px] uppercase tracking-tighter bg-blue-50 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                  >
                    Seleccionar {filteredContacts.length}
                  </button>
                </div>

                {/* SELECTOR DE CATEGORÍA (TIPO PILLS) */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Categoría</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {categories.map(c => (
                      <button
                        key={c}
                        onClick={() => setFilterCategory(c)}
                        className={cn(
                          "shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                          filterCategory === c 
                            ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200" 
                            : "bg-white text-slate-500 border-slate-100 hover:border-slate-300"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SELECTOR DE INACTIVIDAD (TIPO PILLS) */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Último Envío (Inactividad)</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {[
                      { label: 'Todos', value: '0' },
                      { label: '+7 Días', value: '7' },
                      { label: '+15 Días', value: '15' },
                      { label: '+30 Días', value: '30' }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFilterDays(opt.value)}
                        className={cn(
                          "shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2",
                          filterDays === opt.value 
                            ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" 
                            : "bg-white text-slate-500 border-slate-100"
                        )}
                      >
                        <Calendar size={12} className={filterDays === opt.value ? "text-blue-200" : "text-slate-300"} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* BARRA DE BÚSQUEDA MEJORADA */}
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                  <input 
                    type="text" placeholder="Buscar nombre o teléfono..." 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-[1.2rem] text-sm font-bold outline-none border-2 border-transparent focus:border-blue-100 focus:bg-white transition-all"
                    value={searchContact} onChange={(e) => setSearchContact(e.target.value)}
                  />
                </div>

                {/* LISTA DE CONTACTOS (Diseño más limpio) */}
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {filteredContacts.length > 0 ? filteredContacts.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => setSelectedContactIds(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])}
                      className={cn(
                        "p-4 rounded-[1.5rem] border transition-all flex justify-between items-center cursor-pointer active:scale-[0.98]",
                        selectedContactIds.includes(c.id) 
                          ? "border-blue-200 bg-blue-50/40 shadow-sm" 
                          : "border-slate-50 bg-slate-50/50 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-black text-xs",
                          selectedContactIds.includes(c.id) ? "bg-blue-600 text-white" : "bg-white text-slate-400 border border-slate-100"
                        )}>
                          {c.nombre.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-700 tracking-tight uppercase">{c.nombre}</p>
                          <p className="text-[10px] text-slate-400 font-bold">+{c.telefono}</p>
                        </div>
                      </div>
                      {selectedContactIds.includes(c.id) && (
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-200">
                          <CheckCircle2 size={14} className="text-white" />
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="py-12 text-center space-y-2">
                      <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-slate-300">
                          <Search size={20}/>
                      </div>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest text-center">Sin resultados</p>
                    </div>
                  )}
                </div>

                {/* BOTÓN CONTINUAR */}
                <button 
                  disabled={selectedContactIds.length === 0}
                  onClick={() => setStep(2)}
                  className="w-full py-5 bg-blue-600 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-[0.15em] shadow-2xl shadow-blue-200 disabled:opacity-20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  Siguiente paso <ChevronRight size={18}/>
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- PASO 2 Y 3 SE MANTIENEN CON TU LÓGICA DE PLANTILLAS --- */}
        {step === 2 && (
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl text-blue-700">
              <Users size={20}/>
              <span className="text-xs font-black uppercase tracking-wider">
                {isMobile ? `${selectedContactIds.length} leads seleccionados` : `${contactCount} contactos del archivo`}
              </span>
            </div>

            <div className="space-y-4">
              <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Mensajes a Rotar</h3>
              <div className="grid gap-3 max-h-48 overflow-y-auto pr-2">
                {templates.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())).map(t => (
                  <div key={t.id} onClick={() => setSelectedTemplateIds(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])}
                    className={cn("p-4 rounded-2xl border transition-all cursor-pointer", selectedTemplateIds.includes(t.id) ? "border-blue-500 bg-blue-50/30" : "bg-white border-slate-100")}>
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tighter">{t.name}</p>
                    <p className="text-xs text-slate-500 line-clamp-1 italic">"{t.content}"</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={() => setStep(1)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Atrás</button>
              <button disabled={loading || selectedTemplateIds.length === 0} onClick={handleStartSend}
                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin"/> : <><Send size={18}/> Lanzar Campaña</>}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-12 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
              <CheckCircle2 size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">¡Proceso Iniciado!</h3>
              <p className="text-sm text-slate-500 font-medium">Hemos programado los envíos masivos. Puedes cerrar esta pestaña.</p>
            </div>
            <button onClick={() => { setStep(1); setSelectedContactIds([]); }}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">
              Volver al inicio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}