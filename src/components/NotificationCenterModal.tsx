import React from 'react';
import {
  Bell,
  X,
  AlertTriangle,
  FileSpreadsheet,
  Clock,
  ShieldAlert,
  CheckCircle,
  CalendarX,
  FolderLock
} from 'lucide-react';
import { dbManager } from '../lib/supabaseClient';
import { Alert, AlertType } from '../types/database';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: any) => void;
  onAlertsUpdated: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  onAlertsUpdated
}) => {
  if (!isOpen) return null;

  const alerts = dbManager.getAlerts();
  const activeAlerts = alerts.filter(a => a.status === 'ACTIVA');

  const handleResolve = (alertId: string) => {
    dbManager.resolveAlert(alertId);
    onAlertsUpdated();
  };

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case 'NOVEDAD_CRÍTICA':
        return <FileSpreadsheet className="w-4 h-4 text-rose-400" />;
      case 'INCIDENTE_CRÍTICO':
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'DOCUMENTO_POR_VENCER':
        return <FolderLock className="w-4 h-4 text-amber-400" />;
      case 'TURNO_SIN_ASIGNAR':
      case 'CONFLICTO_DE_TURNO':
        return <CalendarX className="w-4 h-4 text-orange-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Centro de Alertas Operativas</h3>
              <p className="text-[11px] text-slate-400">
                {activeAlerts.length} alertas activas en tiempo real
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeAlerts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-500/50" />
              <p className="text-sm font-semibold text-slate-300">Todas las alertas atendidas</p>
              <p className="text-xs text-slate-500 mt-1">No hay incidentes críticos ni conflictos activos.</p>
            </div>
          ) : (
            activeAlerts.map((alert) => (
              <div 
                key={alert.id}
                className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-all space-y-2 relative overflow-hidden"
              >
                <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                  alert.severity === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'
                }`} />

                <div className="flex items-start justify-between pl-1">
                  <div className="flex items-center space-x-2">
                    {getAlertIcon(alert.alert_type)}
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {alert.alert_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(alert.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="pl-1">
                  <h4 className="text-xs font-bold text-slate-200">{alert.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{alert.description}</p>
                </div>

                <div className="pl-1 pt-1 flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (alert.alert_type.includes('NOVEDAD')) onNavigateToTab('novedades');
                      else if (alert.alert_type.includes('INCIDENTE')) onNavigateToTab('incidents');
                      else if (alert.alert_type.includes('DOCUMENTO')) onNavigateToTab('documents');
                      else if (alert.alert_type.includes('TURNO')) onNavigateToTab('shifts');
                      onClose();
                    }}
                    className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300"
                  >
                    Ver detalle →
                  </button>

                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-950 hover:text-emerald-300 border border-slate-700 hover:border-emerald-600/50 text-[11px] font-medium text-slate-300 transition-colors"
                  >
                    Reconocer / Resolver
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-500">Supabase Realtime Feed</span>
          <button
            onClick={() => {
              onNavigateToTab('alerts');
              onClose();
            }}
            className="text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            Historial completo
          </button>
        </div>
      </div>
    </div>
  );
};
