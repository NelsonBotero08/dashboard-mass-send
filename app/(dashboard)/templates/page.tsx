"use client";
import TemplateManager from '@/components/TemplateManager';

export default function TemplatesPage() {
  return (
    <div className="p-8 space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-800">Biblioteca de Plantillas</h1>
        <p className="text-slate-500">Gestiona los mensajes personalizados para tus campañas de Marca-tex.</p>
      </header>
      
      <hr className="border-slate-200" />

      {/* Solo llamamos al componente que ya creamos */}
      <TemplateManager />
    </div>
  );
}