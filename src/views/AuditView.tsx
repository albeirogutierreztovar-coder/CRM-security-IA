import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Shield,
  Sparkles,
  User,
  Clock,
  Terminal,
  Database
} from 'lucide-react';
import { dbManager } from '../lib/supabaseClient';
import { AuditLog } from '../types/database';

export const AuditView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>(dbManager.getAuditLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const refresh = () => {
    setLogs(dbManager.getAuditLogs());
  };

  useEffect(() => {
    const handleDataChange = () => refresh();
    window.addEventListener('securitycrm_datachange', handleDataChange);
    return () => window.removeEventListener('securitycrm_datachange', handleDataChange);
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchSearch = log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (log.new_data && log.new_data.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchAction = actionFilter === 'all' || log.action === actionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center">
            <History className="w-5 h-5 mr-2 text-cyan-400" /> Pista de Auditoría e Integridad Forense
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registro cronológico inmutable de accesos, mutaciones de datos y operaciones ejecutadas por Security AI.
          </p>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por usuario, tabla o contenido..."
            className="w-full bg-transparent text-slate-200 placeholder-slate-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Tipo de Acción:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-hidden"
          >
            <option value="all">Todas las acciones</option>
            <option value="LOGIN">LOGIN</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="STATUS_CHANGE">STATUS_CHANGE</option>
            <option value="AI_ACTION">AI_ACTION</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40 font-semibold">
              <th className="py-3 px-4">Timestamp (UTC)</th>
              <th className="py-3 px-4">Usuario Operador</th>
              <th className="py-3 px-4">Acción</th>
              <th className="py-3 px-4">Entidad / Tabla</th>
              <th className="py-3 px-4">Datos y Payload</th>
              <th className="py-3 px-4 text-right">Dirección IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-800/40">
                <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString('es-CO')}
                </td>
                <td className="py-3 px-4 font-sans font-semibold text-slate-200 whitespace-nowrap">
                  {log.user_name}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    log.action === 'CREATE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    log.action === 'UPDATE' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    log.action === 'DELETE' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    log.action === 'AI_ACTION' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {log.action}
                  </span>
                </td>
                <td className="py-3 px-4 text-cyan-400 whitespace-nowrap">{log.table_name}</td>
                <td className="py-3 px-4 max-w-md truncate text-slate-300">
                  {log.new_data || log.old_data || '—'}
                </td>
                <td className="py-3 px-4 text-right text-slate-500 whitespace-nowrap">
                  {log.ip_address || '127.0.0.1'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
