"use client";
import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { 
  Search, UserPlus, Upload, Trash2, Edit2, X, AlertTriangle, 
  ChevronLeft, ChevronRight, Loader2 
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [formData, setFormData] = useState({ nombre: '', telefono: '', categoria: 'General' });

  // Estados de Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 50;

  const categories = useMemo(() => {
    const unique = Array.from(new Set(contacts.map(c => c.categoria || 'General')));
    return ['Todos', ...unique];
  }, [contacts]);

  useEffect(() => { 
    fetchContacts(); 
  }, [currentPage, searchTerm, selectedCategory]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const catParam = selectedCategory !== 'Todos' ? `&categoria=${selectedCategory}` : '';
      const res = await api.get(`/whatsapp/contacts?search=${searchTerm}${catParam}&page=${currentPage}&limit=${limit}`);
      
      setContacts(res.data.data);
      setTotalPages(res.data.lastPage);
      setTotalRecords(res.data.total);
    } catch (error) { 
      toast.error("Error al cargar contactos"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const fData = new FormData();
    fData.append('file', file);

    const toastId = toast.loading("Procesando archivo masivo... Por favor espera.");
    
    try {
      setLoading(true);
      await api.post('/whatsapp/contacts/import', fData);
      toast.success("Importación completada con éxito", { id: toastId });
      setCurrentPage(1); // Volver a la primera página para ver los nuevos
      fetchContacts();
    } catch (error) { 
      toast.error("Error al importar el archivo", { id: toastId });
    } finally { 
      setLoading(false); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingContact) {
        await api.patch(`/whatsapp/contacts/${editingContact.id}`, formData);
        toast.success("Contacto actualizado");
      } else {
        await api.post('/whatsapp/contacts/manual', formData);
        toast.success("Contacto creado");
      }
      setShowModal(false);
      setEditingContact(null);
      setFormData({ nombre: '', telefono: '', categoria: 'General' });
      fetchContacts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error");
    } finally { setLoading(false); }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      await api.delete(`/whatsapp/contacts/${deleteId}`);
      toast.success("Eliminado correctamente");
      fetchContacts();
      setDeleteId(null);
    } catch (error) { toast.error("Error al eliminar"); } 
    finally { setLoading(false); }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto pb-24">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Directorio</h2>
          <p className="text-slate-500 text-sm font-medium tracking-tight">Total de registros: <span className="text-blue-600 font-bold">{totalRecords}</span></p>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="hidden md:flex items-center gap-2 px-6 py-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 font-bold text-sm cursor-pointer hover:bg-emerald-100 transition-colors">
            {loading ? <Loader2 className="animate-spin" size={18}/> : <Upload size={18} />}
            Importar CSV
            <input type="file" hidden accept=".csv" onChange={handleFileUpload} disabled={loading} />
          </label>
          
          <button 
            onClick={() => { setEditingContact(null); setFormData({ nombre:'', telefono:'', categoria:'General'}); setShowModal(true); }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 p-4 md:px-6 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 font-bold active:scale-95 transition-all"
          >
            <UserPlus size={20} />
            <span className="hidden md:inline">Nuevo Contacto</span>
          </button>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white p-2 md:p-4 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="md:col-span-4 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" placeholder="Buscar contacto..."
            value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-medium text-sm"
          />
        </div>
        <div className="md:col-span-8 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
              className={cn(
                "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                selectedCategory === cat 
                  ? "bg-slate-900 text-white shadow-lg" 
                  : "bg-white text-slate-400 border border-slate-100 hover:bg-slate-50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENEDOR CON SCROLL INTERNO */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="max-h-[500px] overflow-y-auto">
          
          {/* TABLA PC */}
          <table className="hidden md:table w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="bg-slate-50/80 backdrop-blur-md">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacto</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black">
                        {contact.nombre?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-700">{contact.nombre}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-medium text-slate-500">+{contact.telefono}</td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => { setEditingContact(contact); setFormData({ nombre: contact.nombre, telefono: contact.telefono, categoria: contact.categoria }); setShowModal(true); }}
                        className="p-2 text-slate-300 hover:text-blue-600"
                      ><Edit2 size={18} /></button>
                      <button onClick={() => setDeleteId(contact.id)} className="p-2 text-slate-300 hover:text-rose-600"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* LISTA MÓVIL */}
          <div className="md:hidden divide-y divide-slate-50">
            {contacts.map((contact) => (
              <div key={contact.id} className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black">
                    {contact.nombre?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{contact.nombre}</h4>
                    <p className="text-[11px] text-slate-400 font-medium">+{contact.telefono}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingContact(contact); setFormData({ nombre: contact.nombre, telefono: contact.telefono, categoria: contact.categoria }); setShowModal(true); }} className="p-2 text-slate-300"><Edit2 size={18} /></button>
                  <button onClick={() => setDeleteId(contact.id)} className="p-2 text-slate-300"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NAVEGACIÓN (PAGINACIÓN) */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-3 bg-white border border-slate-200 rounded-xl disabled:opacity-30"
            ><ChevronLeft size={16} /></button>
            <button
              disabled={currentPage === totalPages || loading}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-3 bg-slate-900 text-white rounded-xl shadow-lg disabled:opacity-30"
            ><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* MODAL CREAR/EDITAR */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-white w-full md:max-w-md rounded-t-[3rem] md:rounded-[2.5rem] p-8 pb-12 md:pb-8 relative z-10 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tighter uppercase italic">
              {editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {['nombre', 'telefono', 'categoria'].map((field) => (
                <div key={field} className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{field}</label>
                  <input 
                    required={field !== 'categoria'} 
                    value={(formData as any)[field]} 
                    onChange={e => setFormData({...formData, [field]: e.target.value})}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none font-bold text-sm" />
                </div>
              ))}
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl mt-4 flex justify-center items-center gap-2">
                {loading && <Loader2 className="animate-spin" size={18}/>}
                Confirmar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {deleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 relative z-10 text-center">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase">¿Eliminar?</h3>
            <p className="text-slate-500 text-sm font-medium mb-8">Esta acción no se puede deshacer.</p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmDelete} className="w-full bg-rose-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">Eliminar</button>
              <button onClick={() => setDeleteId(null)} className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// "use client";
// import { useState, useEffect, useMemo } from 'react';
// import api from '@/lib/api';
// import { Search, UserPlus, Upload, Trash2, Edit2, X, Phone, User, AlertTriangle } from 'lucide-react';
// import { toast } from 'sonner';
// import { cn } from '@/lib/utils';

// export default function ContactsPage() {
//   const [contacts, setContacts] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState('Todos');
//   const [showModal, setShowModal] = useState(false);
//   const [deleteId, setDeleteId] = useState<number | null>(null);
//   const [editingContact, setEditingContact] = useState<any>(null);
//   const [formData, setFormData] = useState({ nombre: '', telefono: '', categoria: 'General' });

//   const categories = useMemo(() => {
//     const unique = Array.from(new Set(contacts.map(c => c.categoria || 'General')));
//     return ['Todos', ...unique];
//   }, [contacts]);

//   useEffect(() => { fetchContacts(); }, [searchTerm, selectedCategory]);

//   const fetchContacts = async () => {
//     try {
//       const catParam = selectedCategory !== 'Todos' ? `&categoria=${selectedCategory}` : '';
//       const res = await api.get(`/whatsapp/contacts?search=${searchTerm}${catParam}&limit=100`);
//       setContacts(res.data.data);
//     } catch (error) { toast.error("Error al cargar contactos"); }
//   };

//   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const fData = new FormData();
//     fData.append('file', file);
//     try {
//       setLoading(true);
//       await api.post('/whatsapp/contacts/import', fData);
//       toast.success("Importación masiva completada");
//       fetchContacts();
//     } catch (error) { toast.error("Error al importar CSV"); }
//     finally { setLoading(false); }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       if (editingContact) {
//         await api.patch(`/whatsapp/contacts/${editingContact.id}`, formData);
//         toast.success("Contacto actualizado");
//       } else {
//         await api.post('/whatsapp/contacts/manual', formData);
//         toast.success("Contacto creado");
//       }
//       setShowModal(false);
//       setEditingContact(null);
//       setFormData({ nombre: '', telefono: '', categoria: 'General' });
//       fetchContacts();
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || "Error");
//     } finally { setLoading(false); }
//   };

//   const confirmDelete = async () => {
//     if (!deleteId) return;
//     setLoading(true);
//     try {
//       await api.delete(`/whatsapp/contacts/${deleteId}`);
//       toast.success("Contacto eliminado correctamente");
//       fetchContacts();
//       setDeleteId(null);
//     } catch (error) { 
//         toast.error("Error al eliminar"); 
//     } finally { 
//         setLoading(false); 
//     }
//   };

//   return (
//     <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto pb-24">
      
//       {/* HEADER */}
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//         <div>
//           <h2 className="text-3xl font-black text-slate-900 tracking-tight">Directorio</h2>
//           <p className="text-slate-500 text-sm font-medium tracking-tight">Gestión avanzada de bases de datos.</p>
//         </div>
        
//         <div className="flex items-center gap-3">
//           <label className="hidden md:flex items-center gap-2 px-6 py-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 font-bold text-sm cursor-pointer hover:bg-emerald-100 transition-colors">
//             <Upload size={18} />
//             Subida Masiva CSV
//             <input type="file" hidden accept=".csv" onChange={handleFileUpload} />
//           </label>
          
//           <button 
//             onClick={() => { setEditingContact(null); setFormData({ nombre:'', telefono:'', categoria:'General'}); setShowModal(true); }}
//             className="flex-1 md:flex-none flex items-center justify-center gap-2 p-4 md:px-6 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 font-bold active:scale-95 transition-all"
//           >
//             <UserPlus size={20} />
//             <span className="hidden md:inline">Nuevo Contacto</span>
//           </button>
//         </div>
//       </div>

//       {/* SEARCH & FILTERS */}
//       <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white p-2 md:p-4 rounded-[2rem] shadow-sm border border-slate-100">
//         <div className="md:col-span-4 relative">
//           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
//           <input 
//             type="text" placeholder="Buscar contacto..."
//             value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-medium text-sm"
//           />
//         </div>
//         <div className="md:col-span-8 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
//           {categories.map((cat) => (
//             <button
//               key={cat}
//               onClick={() => setSelectedCategory(cat)}
//               className={cn(
//                 "px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
//                 selectedCategory === cat 
//                   ? "bg-slate-900 text-white shadow-lg" 
//                   : "bg-white text-slate-400 border border-slate-100 hover:bg-slate-50"
//               )}
//             >
//               {cat}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* TABLE (PC) */}
//       <div className="hidden md:block bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
//         <table className="w-full text-left border-collapse">
//           <thead>
//             <tr className="bg-slate-50/50">
//               <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacto</th>
//               <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp</th>
//               <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
//               <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-50">
//             {contacts.map((contact) => (
//               <tr key={contact.id} className="hover:bg-slate-50/50 transition-colors">
//                 <td className="px-8 py-5">
//                   <div className="flex items-center gap-4">
//                     <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black">
//                       {contact.nombre.charAt(0).toUpperCase()}
//                     </div>
//                     <span className="font-bold text-slate-700">{contact.nombre}</span>
//                   </div>
//                 </td>
//                 <td className="px-8 py-5">
//                   <span className="text-sm font-medium text-slate-500">+{contact.telefono}</span>
//                 </td>
//                 <td className="px-8 py-5">
//                   <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-tight">
//                     {contact.categoria || 'General'}
//                   </span>
//                 </td>
//                 <td className="px-8 py-5 text-right">
//                   <div className="flex justify-end gap-2">
//                     <button 
//                       onClick={() => { setEditingContact(contact); setFormData({ nombre: contact.nombre, telefono: contact.telefono, categoria: contact.categoria }); setShowModal(true); }}
//                       className="p-2 text-slate-300 hover:text-blue-600 rounded-lg transition-all"
//                     >
//                       <Edit2 size={18} />
//                     </button>
//                     <button 
//                       onClick={() => setDeleteId(contact.id)}
//                       className="p-2 text-slate-300 hover:text-rose-600 rounded-lg transition-all"
//                     >
//                       <Trash2 size={18} />
//                     </button>
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* LIST (MOBILE) */}
//       <div className="md:hidden space-y-3">
//         {contacts.map((contact) => (
//           <div key={contact.id} className="bg-white p-5 rounded-[2rem] border border-slate-50 shadow-sm flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black">
//                 {contact.nombre.charAt(0).toUpperCase()}
//               </div>
//               <div>
//                 <h4 className="font-bold text-slate-900 text-sm">{contact.nombre}</h4>
//                 <p className="text-[11px] text-slate-400 font-medium">+{contact.telefono}</p>
//               </div>
//             </div>
//             <div className="flex gap-1">
//                 <button onClick={() => { setEditingContact(contact); setFormData({ nombre: contact.nombre, telefono: contact.telefono, categoria: contact.categoria }); setShowModal(true); }}
//                    className="p-2 text-slate-300 active:text-blue-600"><Edit2 size={18} /></button>
//                 <button onClick={() => setDeleteId(contact.id)} className="p-2 text-slate-300 active:text-rose-500"><Trash2 size={18} /></button>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* MODAL CREAR/EDITAR */}
//       {showModal && (
//         <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
//           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
//           <div className="bg-white w-full md:max-w-md rounded-t-[3rem] md:rounded-[2.5rem] p-8 pb-12 md:pb-8 relative z-10 animate-in slide-in-from-bottom-10 duration-300">
//             <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tighter uppercase">
//               {editingContact ? 'Editar Lead' : 'Nuevo Lead'}
//             </h3>
//             <form onSubmit={handleSubmit} className="space-y-4">
//               {['nombre', 'telefono', 'categoria'].map((field) => (
//                 <div key={field} className="space-y-1">
//                   <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{field}</label>
//                   <input 
//                     required={field !== 'categoria'} 
//                     value={(formData as any)[field]} 
//                     onChange={e => setFormData({...formData, [field]: e.target.value})}
//                     className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none font-bold text-sm" />
//                 </div>
//               ))}
//               <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl mt-4">
//                 {loading ? 'Guardando...' : 'Confirmar'}
//               </button>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* MODAL ELIMINAR (BONITO Y AZUL) */}
//       {deleteId && (
//         <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
//           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
//           <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 relative z-10 animate-in zoom-in-95 duration-200 shadow-2xl">
//             <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-6">
//               <AlertTriangle size={32} />
//             </div>
//             <h3 className="text-xl font-black text-slate-900 mb-2 uppercase">¿Eliminar contacto?</h3>
//             <p className="text-slate-500 text-sm font-medium mb-8">Esta acción no se puede deshacer. Se borrará permanentemente de tu lista.</p>
            
//             <div className="flex flex-col gap-3">
//               <button 
//                 onClick={confirmDelete}
//                 disabled={loading}
//                 className="w-full bg-rose-500 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-rose-100"
//               >
//                 {loading ? 'Borrando...' : 'Sí, eliminar'}
//               </button>
//               <button 
//                 onClick={() => setDeleteId(null)}
//                 className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest"
//               >
//                 Cancelar
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }