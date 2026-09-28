import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Shield,
  MapPin,
  Clock,
  UserCheck,
  Mic,
  AlertTriangle,
  FileSpreadsheet,
  Camera,
  CheckCircle,
  Sparkles,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { dbManager } from '../lib/supabaseClient';

interface MobileGuardViewProps {
  onOpenVoiceModal: () => void;
  onOpenAI: () => void;
  onNavigateTab: (tab: any) => void;
}

export const MobileGuardView: React.FC<MobileGuardViewProps> = ({
  onOpenVoiceModal,
  onOpenAI,
  onNavigateTab
}) => {
  const currentProfile = dbManager.getCurrentProfile();
  const sites = dbManager.getSites();
  const guards = dbManager.getGuards();
  const currentGuard = guards.find(g => g.name.toLowerCase().includes(currentProfile.full_name.toLowerCase())) || guards[0];
  const assignedSite = sites.find(s => s.id === currentGuard?.assigned_site_id) || sites[0];

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('es-CO'));
  const [shiftFinished, setShiftFinished] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('es-CO'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleFinishShift = () => {
    if (confirm('¿Confirmas la entrega de puesto y finalización de tu turno? Se registrará en la minuta digital y auditoría.')) {
      setShiftFinished(true);
      dbManager.logAudit('STATUS_CHANGE', 'shifts', undefined, undefined, 'Finalización de turno por guarda');
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-5 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/60 border border-slate-800 shadow-2xl text-center space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono uppercase tracking-wider text-cyan-400 font-bold">MÓDULO MI TURNO</span>
          <span className="flex items-center text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
            Turno En Curso
          </span>
        </div>

        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">{assignedSite?.name}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{assignedSite?.address}</p>
        </div>

        {/* Live Clock Display */}
        <div className="py-2">
          <div className="text-3xl font-black font-mono text-cyan-300 tracking-wider">
            {currentTime}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Hora oficial de operaciones • Sincronizado
          </p>
        </div>

        {/* Guard & Supervisor Info Strip */}
        <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-left text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold">Guarda en Puesto:</span>
            <p className="font-bold text-slate-200 truncate mt-0.5">{currentProfile.full_name}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold">Supervisor a Cargo:</span>
            <p className="font-bold text-slate-200 truncate mt-0.5">Javier Restrepo (SUP-014)</p>
          </div>
        </div>
      </div>

      {/* Giant Voice Action Button */}
      <div className="text-center py-2">
        <button
          onClick={onOpenVoiceModal}
          className="w-full py-5 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-cyan-500 hover:from-cyan-500 hover:to-indigo-500 text-white font-extrabold text-base shadow-xl shadow-cyan-900/50 flex items-center justify-center space-x-3 transition-all hover:scale-102 active:scale-98"
        >
          <div className="p-2 rounded-xl bg-white/20">
            <Mic className="w-6 h-6 text-white animate-pulse" />
          </div>
          <span>DICTAR NOVEDAD POR VOZ</span>
        </button>
        <p className="text-[11px] text-slate-400 mt-2">
          🎙️ Habla con libertad. Security AI estructurará y confirmará tu informe.
        </p>
      </div>

      {/* Big Tactile Quick Buttons Matrix */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* REGISTRAR NOVEDAD MANUAL */}
        <button
          onClick={() => onNavigateTab('novedades')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition-all active:scale-98 space-y-2 group shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-100">Registrar Novedad</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Formulario manual</p>
          </div>
        </button>

        {/* REPORTAR INCIDENTE */}
        <button
          onClick={() => onNavigateTab('incidents')}
          className="p-4 rounded-2xl bg-rose-950/30 border border-rose-900/40 hover:border-rose-700 text-left transition-all active:scale-98 space-y-2 group shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-rose-300">Reportar Incidente</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Intrusión, robo o emergencia</p>
          </div>
        </button>

        {/* HABLAR CON SECURITY AI */}
        <button
          onClick={onOpenAI}
          className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-900/40 hover:border-indigo-700 text-left transition-all active:scale-98 space-y-2 group shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-indigo-300">Hablar con Security AI</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Consultas y apoyo táctico</p>
          </div>
        </button>

        {/* CONTROL DE VISITAS */}
        <button
          onClick={() => onNavigateTab('visits')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition-all active:scale-98 space-y-2 group shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-100">Control de Visitas</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Entrada y salida peatonal</p>
          </div>
        </button>
      </div>

      {/* Finalizar Turno Button */}
      <div className="pt-2">
        {shiftFinished ? (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-center text-xs space-y-1">
            <CheckCircle className="w-6 h-6 mx-auto text-emerald-400" />
            <p className="font-bold text-sm">Turno Finalizado con Éxito</p>
            <p className="text-slate-400">Minuta foliada y relevo notificado al supervisor.</p>
          </div>
        ) : (
          <button
            onClick={handleFinishShift}
            className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-rose-950 text-slate-300 hover:text-rose-400 border border-slate-800 hover:border-rose-900 font-bold text-xs flex items-center justify-center space-x-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>FINALIZAR TURNO OPERATIVO</span>
          </button>
        )}
      </div>
    </div>
  );
};
