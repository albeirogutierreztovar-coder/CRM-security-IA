import React, { useState, useEffect } from 'react';
import {
  Users,
  MapPin,
  Calendar,
  FileSpreadsheet,
  AlertTriangle,
  Bell,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Filter,
  Mic,
  ChevronRight,
  RefreshCw,
  FolderLock
} from 'lucide-react';
import { dbManager } from '../lib/supabaseClient';
import { PriorityBadge, StatusBadge } from '../components/StatusBadges';
import { ActiveTab } from '../components/Sidebar';

interface DashboardViewProps {
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenVoiceModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenVoiceModal
}) => {
  const [metrics, setMetrics] = useState(dbManager.getDashboardMetrics());
  const [novedades, setNovedades] = useState(dbManager.getNovedades());
  const [incidents, setIncidents] = useState(dbManager.getIncidents());
  const [sites, setSites] = useState(dbManager.getSites());
  const [alerts, setAlerts] = useState(dbManager.getAlerts());
  
  // AI Insights State
  const [insights, setInsights] = useState<any[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Filters
  const [filterSite, setFilterSite] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const refreshData = () => {
    setMetrics(dbManager.getDashboardMetrics());
    setNovedades(dbManager.getNovedades());
    setIncidents(dbManager.getIncidents());
    setSites(dbManager.getSites());
    setAlerts(dbManager.getAlerts());
  };

  useEffect(() => {
    const handleDataChange = () => refreshData();
    window.addEventListener('securitycrm_datachange', handleDataChange);
    return () => window.removeEventListener('securitycrm_datachange', handleDataChange);
  }, []);

  const loadAIInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const res = await fetch('/api/gemini/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics,
          sites,
          novedades,
          incidents,
          documents: dbManager.getDocuments(),
        }),
      });
      const data = await res.json();
      if (data.insights) {
        setInsights(data.insights);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  useEffect(() => {
    loadAIInsights();
  }, []);

  // Filtered novedades
  const filteredNovedades = novedades.filter(n => {
    if (filterSite !== 'all' && n.site_id !== filterSite) return false;
    if (filterPriority !== 'all' && n.priority !== filterPriority) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Command Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-xl font-extrabold text-white tracking-tight">Centro de Operaciones Tácticas</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Supervisión perimetral, turnos y telemetría de seguridad en tiempo real.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={onOpenVoiceModal}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/40 transition-all active:scale-98"
          >
            <Mic className="w-4 h-4 text-cyan-200" />
            <span>Reportar por Voz</span>
          </button>

          <button
            onClick={() => onNavigateTab('incidents')}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Incidente</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* GUARDAS ACTIVOS */}
        <div 
          onClick={() => onNavigateTab('guards')}
          className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Guardas Activos</span>
            <Users className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black text-white mt-2">156</p>
          <div className="flex items-center space-x-1 mt-1 text-[10px] text-emerald-400 font-medium">
            <span>98% Asistencia hoy</span>
          </div>
        </div>

        {/* PUESTOS ACTIVOS */}
        <div 
          onClick={() => onNavigateTab('sites')}
          className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Puestos Activos</span>
            <MapPin className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black text-white mt-2">42</p>
          <div className="flex items-center space-x-1 mt-1 text-[10px] text-cyan-400 font-medium">
            <span>100% Cobertura</span>
          </div>
        </div>

        {/* TURNOS HOY */}
        <div 
          onClick={() => onNavigateTab('shifts')}
          className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Turnos Hoy</span>
            <Calendar className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black text-white mt-2">87</p>
          <div className="flex items-center space-x-1 mt-1 text-[10px] text-slate-400 font-medium">
            <span>Diurnos y Nocturnos</span>
          </div>
        </div>

        {/* NOVEDADES HOY */}
        <div 
          onClick={() => onNavigateTab('novedades')}
          className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Novedades Hoy</span>
            <FileSpreadsheet className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black text-white mt-2">13</p>
          <div className="flex items-center space-x-1 mt-1 text-[10px] text-amber-400 font-medium">
            <span>3 pendientes de cierre</span>
          </div>
        </div>

        {/* INCIDENTES ABIERTOS */}
        <div 
          onClick={() => onNavigateTab('incidents')}
          className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Incidentes</span>
            <AlertTriangle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black text-amber-300 mt-2">4</p>
          <div className="flex items-center space-x-1 mt-1 text-[10px] text-amber-400 font-medium">
            <span>1 en investigación</span>
          </div>
        </div>

        {/* ALERTAS CRÍTICAS */}
        <div 
          onClick={() => onNavigateTab('alerts')}
          className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 hover:border-rose-700/60 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-rose-300">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Alertas Críticas</span>
            <Bell className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black text-rose-400 mt-2">2</p>
          <div className="flex items-center space-x-1 mt-1 text-[10px] text-rose-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping mr-1" />
            <span>Acción requerida</span>
          </div>
        </div>
      </div>

      {/* AI INSIGHTS SECTION */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-800/40 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
              <Sparkles className="w-4 h-4 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center">
                AI Insights & Inteligencia Operativa
                <span className="ml-2 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Gemini 3.8 Flash
                </span>
              </h2>
              <p className="text-xs text-slate-400">Detección de patrones, anomalías perimetrales y riesgos predictivos.</p>
            </div>
          </div>
          <button
            onClick={loadAIInsights}
            disabled={isLoadingInsights}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingInsights ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {insights.map((ins, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90 hover:border-slate-700 transition-all space-y-2 relative"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  ins.type === 'Dato observado'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : ins.type === 'Posible patrón'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {ins.type}
                </span>
                <span className={`w-2 h-2 rounded-full ${
                  ins.severity === 'CRITICAL' ? 'bg-rose-500' : ins.severity === 'WARNING' ? 'bg-amber-400' : 'bg-blue-400'
                }`} />
              </div>
              <h4 className="text-xs font-bold text-slate-200 leading-snug">{ins.title}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">{ins.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Charts and Visual Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Novedades por día (Interactive Bar Graphic) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-cyan-400" /> Novedades por Día (Semana)
            </h3>
            <span className="text-[11px] text-slate-400">Total: 48</span>
          </div>

          <div className="h-44 flex items-end justify-between pt-6 px-2 space-x-2">
            {[
              { day: 'Lun', val: 7, height: '40%' },
              { day: 'Mar', val: 5, height: '30%' },
              { day: 'Mié', val: 9, height: '55%' },
              { day: 'Jue', val: 6, height: '35%' },
              { day: 'Vie', val: 11, height: '70%' },
              { day: 'Sáb', val: 14, height: '90%' },
              { day: 'Hoy', val: 13, height: '80%', active: true },
            ].map((col) => (
              <div key={col.day} className="flex-1 flex flex-col items-center gap-2 group">
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-cyan-300">
                  {col.val}
                </span>
                <div className="w-full max-w-[28px] bg-slate-800 rounded-t-md overflow-hidden h-32 flex items-end">
                  <div
                    style={{ height: col.height }}
                    className={`w-full rounded-t-md transition-all duration-500 ${
                      col.active 
                        ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-lg shadow-cyan-500/30' 
                        : 'bg-slate-700 group-hover:bg-slate-600'
                    }`}
                  />
                </div>
                <span className={`text-[10px] font-medium ${col.active ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}>
                  {col.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Incidentes por Gravedad & Novedades por Puesto */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-rose-400" /> Incidentes por Gravedad
            </h3>
            <span className="text-[11px] text-slate-400">Total: 4 abiertos</span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { label: 'Crítica', count: 1, percent: 25, color: 'bg-rose-500' },
              { label: 'Grave', count: 1, percent: 25, color: 'bg-orange-500' },
              { label: 'Moderada', count: 2, percent: 50, color: 'bg-amber-400' },
              { label: 'Leve', count: 0, percent: 0, color: 'bg-slate-600' },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">{item.label}</span>
                  <span className="text-slate-400 font-semibold">{item.count} ({item.percent}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Cumplimiento de Protocolos:</span>
            <span className="font-bold text-emerald-400">96.4%</span>
          </div>
        </div>

        {/* Puestos con Mayor Novedades */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-purple-400" /> Puestos con Más Novedades
            </h3>
            <span className="text-[11px] text-slate-400">Mes en curso</span>
          </div>

          <div className="space-y-3">
            {[
              { name: 'CC Norte — Entrada Principal', count: 14, risk: 'ALTO' },
              { name: 'Parque Logístico — Portería 1', count: 11, risk: 'ALTO' },
              { name: 'Clínica Esperanza — Urgencias', count: 9, risk: 'ALTO' },
              { name: 'CC Norte — Bahía Sótano 2', count: 8, risk: 'MEDIO' },
              { name: 'Cerros de Torca — Bosque', count: 6, risk: 'ALTO' },
            ].map((site, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/80">
                <div className="overflow-hidden pr-2">
                  <p className="text-xs font-semibold text-slate-200 truncate">{site.name}</p>
                  <span className="text-[10px] text-slate-400">Riesgo: {site.risk}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {site.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Realtime Live Operational Novedades Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center">
              <FileSpreadsheet className="w-4 h-4 mr-2 text-cyan-400" /> Novedades Recientes en Tiempo Real
            </h3>
            <p className="text-xs text-slate-400">Sincronizado vía Supabase Realtime y Security AI</p>
          </div>

          {/* Operational Filters */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Puesto:</span>
              <select
                value={filterSite}
                onChange={(e) => setFilterSite(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-hidden"
              >
                <option value="all">Todos los puestos</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400">
              <span>Prioridad:</span>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-hidden"
              >
                <option value="all">Todas</option>
                <option value="CRÍTICA">Crítica</option>
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Media</option>
                <option value="BAJA">Baja</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/40">
                <th className="py-3 px-4">Hora / Fecha</th>
                <th className="py-3 px-4">Puesto</th>
                <th className="py-3 px-4">Título y Descripción</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Prioridad</th>
                <th className="py-3 px-4">Reportado Por</th>
                <th className="py-3 px-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredNovedades.slice(0, 6).map((nov) => {
                const site = sites.find(s => s.id === nov.site_id);
                return (
                  <tr key={nov.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-300 font-mono whitespace-nowrap">
                      {nov.event_date}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200 whitespace-nowrap">
                      {site?.name || 'Puesto'}
                    </td>
                    <td className="py-3 px-4 max-w-md">
                      <p className="font-semibold text-slate-100 flex items-center">
                        {nov.title}
                        {nov.ai_generated && (
                          <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            IA
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{nov.description}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-300 capitalize">
                      {nov.category}
                    </td>
                    <td className="py-3 px-4">
                      <PriorityBadge priority={nov.priority} />
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      {nov.reported_by}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={nov.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="pt-2 flex justify-between items-center text-xs text-slate-400">
          <span>Mostrando novedades operativas registradas</span>
          <button
            onClick={() => onNavigateTab('novedades')}
            className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center"
          >
            Ver todas las novedades ({novedades.length}) <ChevronRight className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
