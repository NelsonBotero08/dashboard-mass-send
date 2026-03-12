"use client";

import { useEffect, useState } from 'react';
import { MessageSquare, Users, Send, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const [data, setData] = useState({
    sentToday: 0,
    totalContacts: 0, // Cambiado de activeContacts
    templateCount: 0,
    chartData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response: any = await api.get('/bulk/stats');
        const result = response.data;
        
        setData({
          sentToday: result.sentToday || 0,
          totalContacts: result.totalContacts || result.activeContacts || 0,
          templateCount: result.templateCount || 0,
          chartData: result.chartData || []
        });
      } catch (error) {
        console.error("Error cargando estadísticas", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { 
      name: 'Enviados Hoy', 
      value: data.sentToday, 
      icon: Send, 
      color: 'bg-blue-50 text-blue-600',
      description: 'Mensajes procesados hoy'
    },
    { 
      name: 'Base de Datos', 
      value: data.totalContacts, 
      icon: Users, 
      color: 'bg-purple-50 text-purple-600',
      description: 'Contactos registrados'
    },
    { 
      name: 'Plantillas', 
      value: data.templateCount, 
      icon: MessageSquare, 
      color: 'bg-orange-50 text-orange-600',
      description: 'Mensajes configurados'
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Panel de Control</h2>
          <p className="text-slate-500 font-medium">Análisis de rendimiento de tus campañas masivas.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm text-xs font-bold text-slate-600">
          <Calendar size={14} className="text-blue-500" />
          {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* TARJETAS DE ESTADÍSTICAS */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.name} 
              className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110 duration-300", stat.color)}>
                  <Icon size={24} />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.name}</span>
                  <div className="text-3xl font-black text-slate-900">{stat.value}</div>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-medium">{stat.description}</p>
            </div>
          );
        })}
      </div>

      {/* GRÁFICO DE ACTIVIDAD */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Actividad de Envíos</h3>
          </div>
          <select className="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-500 p-2 outline-none">
            <option>Últimos 7 días</option>
          </select>
        </div>

        <div className="h-[300px] md:h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} 
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc', radius: 12 }}
                contentStyle={{ 
                  borderRadius: '20px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '12px'
                }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}
                // Cambiado: textTransform en lugar de uppercase
                labelStyle={{ 
                  fontSize: '10px', 
                  color: '#64748b', 
                  marginBottom: '4px', 
                  fontWeight: '800', 
                  textTransform: 'uppercase' 
                }}
              />
              <Bar 
                dataKey="envios" 
                fill="#3b82f6" 
                radius={[10, 10, 10, 10]} 
                barSize={window?.innerWidth < 768 ? 20 : 45} 
              >
                {data.chartData.map((entry: any, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === data.chartData.length - 1 ? '#3b82f6' : '#e2e8f0'}
                    className="hover:fill-blue-500 transition-colors duration-300"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}