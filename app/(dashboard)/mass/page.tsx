"use client";

import { useState, useEffect, useMemo } from 'react';

import {

  Upload, FileText, Send, CheckCircle2, Loader2, MessageSquare,

  Search, X, Users, Image as ImageIcon, Smartphone, ChevronRight

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



  // --- ESTADOS ESPECÍFICOS ESCRITORIO (CSV) ---

  const [file, setFile] = useState<File | null>(null);

  const [contactCount, setContactCount] = useState(0);



  // --- ESTADOS ESPECÍFICOS MÓVIL (DB + IMAGES) ---

  const [dbContacts, setDbContacts] = useState<any[]>([]);

  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);

  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const [searchContact, setSearchContact] = useState("");
  
  const [excludeDays, setExcludeDays] = useState(7);



  // // 1. Detectar Ancho de Pantalla

  // useEffect(() => {

  //   const checkSize = () => setIsMobile(window.innerWidth < 768);

  //   checkSize();

  //   window.addEventListener('resize', checkSize);

  //   return () => window.removeEventListener('resize', checkSize);

  // }, []);



  // // 2. Cargar datos iniciales

  // useEffect(() => {

  //   const fetchData = async () => {

  //     try {

  //       const [tplRes, contRes] = await Promise.all([

  //         api.get('/bulk/templates'), // Ajusta segun tu ruta

  //         isMobile ? api.get('/whatsapp/contacts?limit=100') : Promise.resolve({ data: { data: [] } })

  //       ]);

  //       setTemplates(Array.isArray(tplRes.data) ? tplRes.data : []);

  //       if (isMobile) setDbContacts(contRes.data.data || []);

  //     } catch (error) {

  //       console.error("Error cargando datos:", error);

  //     }

  //   };

  //   fetchData();

  // }, [isMobile]);


  // --- LÓGICA ACTUALIZADA ---
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const [tplRes, contRes] = await Promise.all([
        api.get('/bulk/templates'),
        // Enviamos el parámetro al backend para que él haga el trabajo pesado
        api.get(`/whatsapp/contacts?limit=1000&excludeDays=${excludeDays}`)
      ]);
      setTemplates(tplRes.data || []);
      setDbContacts(contRes.data.data || []);
    } catch (error) {
      toast.error("Error al cargar contactos filtrados");
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [excludeDays]); // Se recarga cuando cambias el filtro

// 3. Lógica de selección con BLOQUEO de 50 contactos
const toggleContact = (id: number) => {
  setSelectedContactIds(prev => {
    if (prev.includes(id)) return prev.filter(cId => cId !== id);
    if (prev.length >= 50) {
      toast.warning("Límite de 50 contactos alcanzado para proteger tu línea");
      return prev;
    }
    return [...prev, id];
  });
};

const handleStartSend = async () => {
  if (selectedContactIds.length === 0 || selectedTemplateIds.length === 0) {
    return toast.error("Selecciona contactos y al menos una plantilla");
  }

  setLoading(true);
  const formData = new FormData();

  try {
    // Unificamos al endpoint más potente
    formData.append('contactIds', selectedContactIds.join(','));
    formData.append('templateIds', selectedTemplateIds.join(','));
    
    // Adjuntar hasta 5 imágenes
    selectedImages.forEach(img => formData.append('images', img));

    await api.post('/whatsapp/start-mobile-campaign', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    setStep(3);
    toast.success("Campaña iniciada correctamente");
  } catch (error: any) {
    toast.error("Error al iniciar campaña: " + (error.response?.data?.message || "Error de red"));
  } finally {
    setLoading(false);
  }
};



  // --- LÓGICA FILTRADO ---

  const filteredTemplates = useMemo(() => {

    return templates.filter(t =>

      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||

      t.content.toLowerCase().includes(searchTerm.toLowerCase())

    );

  }, [templates, searchTerm]);



  const filteredContacts = useMemo(() => {

    return dbContacts.filter(c =>

      c.nombre.toLowerCase().includes(searchContact.toLowerCase()) ||

      c.telefono.includes(searchContact)

    );

  }, [dbContacts, searchContact]);



  // --- HANDLERS ---

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {

  //   if (e.target.files?.[0]) {

  //     const selectedFile = e.target.files[0];

  //     if (selectedFile.name.endsWith('.csv')) {

  //       setFile(selectedFile);

  //       const reader = new FileReader();

  //       reader.onload = (event) => {

  //         const rows = (event.target?.result as string).split('\n').filter(r => r.trim() !== '');

  //         setContactCount(rows.length - 1);

  //       };

  //       reader.readAsText(selectedFile);

  //       setStep(2);

  //     } else {

  //       toast.error("Solo archivos .csv");

  //     }

  //   }

  // };



  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    if (e.target.files) {

      const filesArray = Array.from(e.target.files);

      setSelectedImages(prev => [...prev, ...filesArray].slice(0, 5));

    }

  };



  // const handleStartSend = async () => {

  //   setLoading(true);

  //   const formData = new FormData();



  //   try {

  //     if (!isMobile) {

  //       // FLUJO DESKTOP (CSV)

  //       if (!file) return;

  //       formData.append('file', file);

  //       selectedTemplateIds.forEach(id => {

  //         const t = templates.find(tpl => tpl.id === id);

  //         if (t) formData.append('templates', t.content);

  //       });

  //       await api.post('/bulk/upload', formData);

  //     } else {

  //       // FLUJO MOBILE (DB + IMAGES)

  //       formData.append('contactIds', selectedContactIds.join(','));

  //       formData.append('templateIds', selectedTemplateIds.join(','));

  //       selectedImages.forEach(img => formData.append('images', img));



  //       await api.post('/whatsapp/start-mobile-campaign', formData, {

  //         headers: { 'Content-Type': 'multipart/form-data' }

  //       });

  //     }

  //     setStep(3);

  //     toast.success("Campaña iniciada");

  //   } catch (error: any) {

  //     toast.error("Error al iniciar campaña");

  //   } finally {

  //     setLoading(false);

  //   }

  // };



  // return (

  //   <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-24">

  //     <div className="text-center space-y-2">

  //       <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">

  //         {isMobile ? <Smartphone size={14} /> : <FileText size={14} />}

  //         Modo {isMobile ? 'Móvil' : 'Escritorio'}

  //       </div>

  //       <h2 className="text-2xl md:text-3xl font-black text-slate-900">

  //         {step === 3 ? '¡Envío Exitoso!' : 'Nueva Campaña'}

  //       </h2>

  //     </div>



  //     {/* STEPS INDICATOR */}

  //     <div className="flex justify-center items-center gap-4">

  //       {[1, 2, 3].map((s) => (

  //         <div key={s} className={cn(

  //           "h-1.5 rounded-full transition-all duration-500",

  //           step >= s ? "w-8 bg-blue-600" : "w-4 bg-slate-200"

  //         )} />

  //       ))}

  //     </div>



  //     <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">



  //       {/* --- PASO 1 --- */}

  //       {step === 1 && (

  //         <div className="p-8 space-y-6">

  //           {!isMobile ? (

  //             // VISTA DESKTOP: UPLOAD CSV

  //             <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2rem] py-16 hover:bg-slate-50 transition-all cursor-pointer group">

  //               <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">

  //                 <Upload size={32} />

  //               </div>

  //               <p className="mt-4 font-bold text-slate-700">Subir base de datos CSV</p>

  //               <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />

  //             </label>

  //           ) : (

  //             // VISTA MOBILE: SELECT FROM DB

  //             <div className="space-y-4">

  //               <div className="flex items-center justify-between">

  //                 <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Seleccionar Contactos</h3>

  //                 <span className="text-blue-600 font-bold text-xs">{selectedContactIds.length} seleccionados</span>

  //               </div>

  //               <div className="relative">

  //                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />

  //                 <input

  //                   type="text" placeholder="Buscar en la base de datos..."

  //                   className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-2xl text-sm outline-none"

  //                   value={searchContact} onChange={(e) => setSearchContact(e.target.value)}

  //                 />

  //               </div>

  //               <div className="max-h-60 overflow-y-auto space-y-2 pr-2">

  //                 {filteredContacts.map(c => (

  //                   <div

  //                     key={c.id}

  //                     onClick={() => setSelectedContactIds(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])}

  //                     className={cn(

  //                       "p-4 rounded-2xl border transition-all flex justify-between items-center cursor-pointer",

  //                       selectedContactIds.includes(c.id) ? "border-blue-500 bg-blue-50/50" : "border-slate-100 bg-slate-50/30"

  //                     )}

  //                   >

  //                     <div>

  //                       <p className="text-sm font-bold text-slate-700">{c.nombre}</p>

  //                       <p className="text-xs text-slate-400">{c.telefono}</p>

  //                     </div>

  //                     {selectedContactIds.includes(c.id) && <CheckCircle2 size={18} className="text-blue-600" />}

  //                   </div>

  //                 ))}

  //               </div>

  //               <button

  //                 disabled={selectedContactIds.length === 0}

  //                 onClick={() => setStep(2)}

  //                 className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"

  //               >

  //                 Continuar <ChevronRight size={18} />

  //               </button>

  //             </div>

  //           )}

  //         </div>

  //       )}



  //       {/* --- PASO 2: CONFIGURACIÓN --- */}

  //       {step === 2 && (

  //         <div className="p-8 space-y-6">

  //           {/* Header de Info */}

  //           <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl text-blue-700">

  //             {isMobile ? <Users size={20} /> : <FileText size={20} />}

  //             <span className="text-xs font-black uppercase tracking-wider">

  //               {isMobile ? `${selectedContactIds.length} Contactos de DB` : `${contactCount} Contactos de ${file?.name}`}

  //             </span>

  //           </div>



  //           {/* Selección de Plantillas */}

  //           <div className="space-y-4">

  //             <div className="flex items-center justify-between">

  //               <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Plantillas para Rotar</h3>

  //               <div className="relative w-1/2">

  //                 <input

  //                   type="text" placeholder="Filtrar..."

  //                   className="w-full px-4 py-1.5 bg-slate-50 rounded-xl text-xs outline-none border border-slate-100"

  //                   value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}

  //                 />

  //               </div>

  //             </div>

  //             <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto pr-2">

  //               {filteredTemplates.map(t => (

  //                 <div

  //                   key={t.id}

  //                   onClick={() => setSelectedTemplateIds(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])}

  //                   className={cn(

  //                     "p-4 rounded-2xl border transition-all cursor-pointer",

  //                     selectedTemplateIds.includes(t.id) ? "border-blue-500 bg-blue-50/50 shadow-sm" : "border-slate-100 bg-white"

  //                   )}

  //                 >

  //                   <p className="text-sm font-bold text-slate-800">{t.name}</p>

  //                   <p className="text-xs text-slate-500 line-clamp-1">{t.content}</p>

  //                 </div>

  //               ))}

  //             </div>

  //           </div>



  //           {/* Solo Móvil: Carga de Imágenes */}

  //           {isMobile && (

  //             <div className="space-y-3">

  //               <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">

  //                 <ImageIcon size={14} /> Imágenes (Máx 5)

  //               </h3>

  //               <div className="flex gap-2 overflow-x-auto pb-2">

  //                 <label className="shrink-0 w-16 h-16 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-50">

  //                   <Upload size={20} />

  //                   <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />

  //                 </label>

  //                 {selectedImages.map((img, i) => (

  //                   <div key={i} className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-slate-100">

  //                     <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" />

  //                     <button

  //                       onClick={() => setSelectedImages(prev => prev.filter((_, idx) => idx !== i))}

  //                       className="absolute top-0 right-0 p-1 bg-rose-500 text-white rounded-bl-lg"

  //                     ><X size={10} /></button>

  //                   </div>

  //                 ))}

  //               </div>

  //             </div>

  //           )}



  //           <div className="flex gap-4 pt-4">

  //             <button onClick={() => setStep(1)} className="flex-1 py-4 text-slate-400 font-bold uppercase text-xs tracking-widest">Atrás</button>

  //             <button

  //               disabled={loading || selectedTemplateIds.length === 0}

  //               onClick={handleStartSend}

  //               className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 flex items-center justify-center gap-2"

  //             >

  //               {loading ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Iniciar Campaña</>}

  //             </button>

  //           </div>

  //         </div>

  //       )}



  //       {/* --- PASO 3: ÉXITO --- */}

  //       {step === 3 && (

  //         <div className="p-12 text-center space-y-6">

  //           <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">

  //             <CheckCircle2 size={40} />

  //           </div>

  //           <div className="space-y-2">

  //             <h3 className="text-2xl font-black text-slate-800">¡Campaña en Cola!</h3>

  //             <p className="text-sm text-slate-500">Los mensajes se están enviando siguiendo patrones de comportamiento humano.</p>

  //           </div>

  //           <button

  //             onClick={() => { setStep(1); setFile(null); setSelectedTemplateIds([]); setSelectedContactIds([]); setSelectedImages([]); }}

  //             className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"

  //           >

  //             Nuevo Envío

  //           </button>

  //         </div>

  //       )}

  //     </div>

  //   </div>

  // );


  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* HEADER Y INDICADOR (Igual que el tuyo) */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900">
          {step === 3 ? '¡Envío Exitoso!' : 'Configurar Envío Masivo'}
        </h2>
        <p className="text-slate-500 text-sm">Selecciona contactos de tu base de datos y personaliza tu mensaje.</p>
      </div>

      <div className="flex justify-center items-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className={cn("h-1.5 rounded-full transition-all duration-500", step >= s ? "w-8 bg-blue-600" : "w-4 bg-slate-200")} />
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        
        {/* --- PASO 1: SELECCIÓN DE CONTACTOS (UNIFICADO) --- */}
        
        {step === 1 && (
          <div className="p-6 md:p-8 space-y-6">
            {/* HEADER Y FILTRO DE EXCLUSIÓN */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-3 flex-1">
                <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Lista de Contactos</h3>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Excluir enviados hace:</label>
                  <select 
                    value={excludeDays} 
                    onChange={(e) => setExcludeDays(Number(e.target.value))}
                    className="w-full md:w-48 px-3 py-2 bg-slate-100 rounded-xl text-xs font-bold outline-none border-none text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    <option value={7}>7 Días (Seguro)</option>
                    <option value={15}>15 Días</option>
                    <option value={30}>30 Días</option>
                    <option value={0}>No filtrar</option>
                  </select>
                </div>
              </div>

              {/* CONTADOR DE SEGURIDAD */}
              <div className={cn(
                "px-4 py-3 rounded-2xl flex flex-col items-center justify-center min-w-[120px] transition-all",
                selectedContactIds.length >= 50 ? "bg-rose-50 border border-rose-100" : "bg-blue-50 border border-blue-100"
              )}>
                <span className={cn("text-[9px] font-black uppercase", selectedContactIds.length >= 50 ? "text-rose-500" : "text-blue-500")}>
                  Límite Diario
                </span>
                <span className={cn("text-xl font-black", selectedContactIds.length >= 50 ? "text-rose-600" : "text-blue-600")}>
                  {selectedContactIds.length} / 50
                </span>
              </div>
            </div>

            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text" placeholder="Buscar por nombre o teléfono..."
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl text-sm outline-none border border-transparent focus:border-blue-200 focus:bg-white transition-all shadow-sm"
                value={searchContact} onChange={(e) => setSearchContact(e.target.value)}
              />
            </div>

            {/* BOTONES DE ACCIÓN RÁPIDA */}
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => {
                  // Selecciona solo los primeros 50 del filtro actual
                  const toSelect = filteredContacts.slice(0, 50).map(c => c.id);
                  setSelectedContactIds(toSelect);
                  if (filteredContacts.length > 50) toast.info("Se seleccionaron los primeros 50 contactos");
                }}
                className="text-[10px] font-black text-blue-600 uppercase hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors border border-blue-100"
              >
                Seleccionar Top 50
              </button>
              <button 
                onClick={() => setSelectedContactIds([])}
                className="text-[10px] font-black text-slate-400 uppercase hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors"
              >
                Limpiar
              </button>
            </div>

            {/* Lista Compacta */}
            {/* Contenedor principal con bordes redondeados y fondo sutil */}
            <div className="border border-slate-100 rounded-[1.5rem] overflow-hidden bg-white shadow-sm">
              
              {/* ALTURA DINÁMICA: 
                  - md:h-[400px] para pantallas grandes.
                  - h-[50vh] para móvil (ocupa la mitad de la pantalla, evitando el scroll infinito).
              */}
              <div className="h-[50vh] md:h-[400px] overflow-y-auto custom-scrollbar bg-slate-50/20">
                
                {filteredContacts.length > 0 ? filteredContacts.map(c => {
                  const isSelected = selectedContactIds.includes(c.id);
                  
                  return (
                    <div 
                      key={c.id} 
                      onClick={() => {
                        if (!isSelected && selectedContactIds.length >= 50) {
                          return toast.error("Límite de seguridad alcanzado (50)");
                        }
                        setSelectedContactIds(prev => isSelected ? prev.filter(id => id !== c.id) : [...prev, c.id]);
                      }}
                      // Reduje el padding vertical de py-4 a py-2.5 para ganar espacio
                      className={cn(
                        "flex items-center justify-between px-5 py-2.5 border-b border-slate-100 last:border-0 cursor-pointer transition-all",
                        isSelected ? "bg-blue-50/80" : "hover:bg-white"
                      )}
                    >
                      <div className="flex flex-col min-w-0 flex-1">
                        {/* Nombre más compacto */}
                        <span className={cn(
                          "text-xs font-bold truncate", 
                          isSelected ? "text-blue-700" : "text-slate-700"
                        )}>
                          {c.nombre}
                        </span>
                        
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-slate-400 font-mono tracking-tighter">
                            {c.telefono}
                          </span>

                          {/* Medalla más pequeña para móvil */}
                          {excludeDays === 0 && c.lastSent ? (
                            <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-md border border-amber-100">
                              <span className="text-[8px] font-black uppercase tracking-tight italic">Enviado</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md border border-emerald-100">
                              <div className="relative flex h-1 w-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1 w-1 bg-emerald-500"></span>
                              </div>
                              <span className="text-[8px] font-black uppercase tracking-tight">Apto</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Indicador de selección más pequeño */}
                      <div className={cn(
                        "w-5 h-5 rounded-full border flex items-center justify-center transition-all ml-3 shrink-0",
                        isSelected ? "bg-blue-600 border-blue-600 shadow-md shadow-blue-100" : "border-slate-200 bg-white"
                      )}>
                        {isSelected && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="h-full flex flex-col items-center justify-center space-y-2 opacity-60">
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Sin resultados</p>
                  </div>
                )}
              </div>
            </div>

            <button
              disabled={selectedContactIds.length === 0}
              onClick={() => setStep(2)}
              className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-bold flex items-center justify-center gap-3 disabled:opacity-30 shadow-xl shadow-slate-200 transition-transform active:scale-95"
            >
              Continuar con {selectedContactIds.length} seleccionados <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* --- PASO 2: PLANTILLAS e IMÁGENES (UNIFICADO) --- */}
        {step === 2 && (
          <div className="p-6 md:p-8 space-y-8">
            {/* Resumen de contactos */}
            <div className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl text-white">
              <div className="flex items-center gap-3">
                <Users size={18} className="text-blue-400" />
                <span className="text-xs font-black uppercase tracking-widest">{selectedContactIds.length} Contactos listos</span>
              </div>
              <button onClick={() => setStep(1)} className="text-[10px] font-black uppercase text-slate-400 hover:text-white">Cambiar</button>
            </div>

            {/* Plantillas */}
            <div className="space-y-4">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
                <MessageSquare size={14} /> Seleccionar Contenido
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
                {filteredTemplates.map(t => (
                  <div 
                    key={t.id} 
                    onClick={() => setSelectedTemplateIds(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])}
                    className={cn(
                      "p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden",
                      selectedTemplateIds.includes(t.id) ? "border-blue-500 bg-blue-50/50" : "border-slate-100 bg-slate-50/30 hover:bg-slate-50"
                    )}
                  >
                    <p className="text-[11px] font-black text-blue-600 uppercase mb-1">{t.name}</p>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{t.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Imágenes (Ahora visible en PC también) */}
            <div className="space-y-4">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
                <ImageIcon size={14} /> Imágenes Adjuntas (Opcional)
              </h3>
              <div className="flex flex-wrap gap-3 p-4 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                <label className="w-20 h-20 bg-white border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-blue-300 hover:text-blue-400 transition-all">
                  <Upload size={24} />
                  <span className="text-[9px] font-black uppercase mt-1">Subir</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
                {selectedImages.map((img, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-md group">
                    <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setSelectedImages(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute inset-0 bg-rose-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button onClick={() => setStep(1)} className="px-6 py-4 text-slate-400 font-black uppercase text-xs tracking-widest">Atrás</button>
              <button
                disabled={loading || selectedTemplateIds.length === 0}
                onClick={handleStartSend}
                className="flex-1 py-5 bg-blue-600 text-white rounded-[1.5rem] font-bold shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-transform active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><Send size={20} /> Iniciar Envío Masivo</>}
              </button>
            </div>
          </div>
        )}

        {/* --- PASO 3: ÉXITO (Igual que el tuyo) --- */}
        {step === 3 && (
          <div className="p-12 text-center space-y-6">
            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={48} />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">¡Todo en Marcha!</h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Hemos programado el envío para <span className="font-bold text-slate-800">{selectedContactIds.length}</span> contactos usando simulación humana.
              </p>
            </div>
            <button
              onClick={() => { setStep(1); setSelectedTemplateIds([]); setSelectedContactIds([]); setSelectedImages([]); }}
              className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-bold shadow-xl shadow-slate-200 transition-all hover:bg-slate-800"
            >
              Configurar Otro Envío
            </button>
          </div>
        )}
      </div>
    </div>
  );

}