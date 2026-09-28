import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  FileSpreadsheet,
  FolderLock,
  CalendarX,
  ShieldAlert,
  CheckCircle,
  Clock,
  Filter
} from 'lucide-react';
import { dbManager } from '../lib/supabaseClient';
import { Alert, AlertType } from '../types/database';

export const AlertsView: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>(dbManager.getAlerts());
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const refresh = () => {
    setAlerts(dbManager.getAlerts());
  };

  useEffect(() => {
    const handleDataChange = () => refresh();
    window.addEventListener('securitycrm_datachange', handleDataChange);
    return () => window.removeEventListener('securitycrm_datachange', handleDataChange);
  }, []);

  const handleResolve = (id: string) => {
    dbManager.resolveAlert(id);
    refresh();
  };

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case 'NOVEDAD_CRÍTICA':
        return <FileSpreadsheet className="w-5 h-5 text-rose-400" />;
      case 'INCIDENTE_CRÍTICO':
        return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      case 'DOCUMENTO_POR_VENCER':
        return <FolderLock className="w-5 h-5 text-amber-400" />;
      case 'TURNO_SIN_ASIGNAR':
      case 'CONFLICTO_DE_TURNO':
        return <CalendarX className="w-5 h-5 text-orange-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-cyan-400" />;
    }
  };

  const filteredAlerts = alerts.filter(a => {
    const matchSev = severityFilter === 'all' || a.severity === severityFilter;
    const matchStat = statusFilter === 'all' || a.status === statusFilter;
    return matchSev && matchStat;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center">
            <Bell className="w-5 h-5 mr-2 text-rose-400" /> Centro de Notificaciones y Alertas en Tiempo Real
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Recepción inmediata de disparos de alarma, fallos de cobertura, conflictos de turno y vencimientos.
          </p>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="flex items-center space-x-3 text-xs">
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
          <Filter className="w-3.5 h-3.5" />
          <span>Severidad:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-transparent text-slate-200 focus:outline-hidden"
          >
            <option value="all">Todas</option>
            <option value="CRITICAL">Crítica</option>
            <option value="WARNING">Advertencia</option>
            <option value="INFO">Informativa</option>
          </select>
        </div>

        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
          <span>Estado:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-slate-200 focus:outline-hidden"
          >
            <option value="all">Todos</option>
            <option value="ACTIVA">Activa</option>
            <option value="RESUELTA">Resuelta</option>
          </select>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              alert.status === 'ACTIVA'
                ? alert.severity === 'CRITICAL'
                  ? 'bg-rose-950/20 border-rose-900/60 shadow-lg shadow-rose-950/20'
                  : 'bg-amber-950/20 border-amber-900/50'
                : 'bg-slate-900/60 border-slate-800 opacity-60'
            }`}
          >
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                {getAlertIcon(alert.alert_type)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {alert.alert_type.replace(/_/g, ' ')}
                  </span>
                  <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                    alert.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-100">{alert.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">{alert.description}</p>
                <p className="text-[10px] text-slate-500 font-mono flex items-center pt-1">
                  <Clock className="w-3 h-3 mr-1" /> Generada: {new Date(alert.created_at).toLocaleString('es-CO')}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 sm:self-center">
              {alert.status === 'ACTIVA' ? (
                <button
                  onClick={() => handleResolve(alert.id)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-emerald-950 text-slate-200 hover:text-emerald-300 border border-slate-700 hover:border-emerald-600/50 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Reconocer y Resolver</span>
                </button>
              ) : (
                <span className="text-xs font-semibold text-emerald-400 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" /> Resuelta
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
