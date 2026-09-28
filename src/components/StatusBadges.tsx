import React from 'react';
import { PriorityLevel, NovedadStatus, IncidentSeverity, IncidentStatus, RiskLevel } from '../types/database';

export const PriorityBadge: React.FC<{ priority: PriorityLevel }> = ({ priority }) => {
  switch (priority) {
    case 'CRÍTICA':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 animate-pulse" />
          Crítica
        </span>
      );
    case 'ALTA':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
          Alta
        </span>
      );
    case 'MEDIA':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5" />
          Media
        </span>
      );
    case 'BAJA':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-700/50 text-slate-300 border border-slate-600/50">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
          Baja
        </span>
      );
  }
};

export const StatusBadge: React.FC<{ status: NovedadStatus | string }> = ({ status }) => {
  switch (status) {
    case 'ABIERTA':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-900/30 text-red-300 border border-red-700/40">
          Abierta
        </span>
      );
    case 'EN_REVISIÓN':
    case 'EN_CURSO':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-900/30 text-amber-300 border border-amber-700/40">
          En Revisión
        </span>
      );
    case 'ASIGNADA':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-900/30 text-purple-300 border border-purple-700/40">
          Asignada
        </span>
      );
    case 'RESUELTA':
    case 'COMPLETADO':
    case 'APROBADA':
    case 'ACTIVO':
    case 'VIGENTE':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-900/30 text-emerald-300 border border-emerald-700/40">
          {status}
        </span>
      );
    case 'CERRADA':
    case 'CERRADO':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
          Cerrada
        </span>
      );
    case 'POR_VENCER':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-900/40 text-amber-300 border border-amber-600/50 animate-pulse">
          Por Vencer
        </span>
      );
    case 'VENCIDO':
    case 'AUSENTE':
    case 'REPROBADA':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-950 text-rose-400 border border-rose-800">
          {status}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300">
          {status}
        </span>
      );
  }
};

export const RiskBadge: React.FC<{ risk: RiskLevel }> = ({ risk }) => {
  switch (risk) {
    case 'CRITICO':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-600/20 text-rose-300 border border-rose-500/50">
          Riesgo Crítico
        </span>
      );
    case 'ALTO':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-600/20 text-amber-300 border border-amber-500/50">
          Riesgo Alto
        </span>
      );
    case 'MEDIO':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-600/20 text-blue-300 border border-blue-500/50">
          Riesgo Medio
        </span>
      );
    case 'BAJO':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-600/20 text-emerald-300 border border-emerald-500/50">
          Riesgo Bajo
        </span>
      );
  }
};
