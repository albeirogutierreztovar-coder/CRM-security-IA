import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Building2,
  MapPin,
  ShieldCheck,
  FileSpreadsheet,
  AlertTriangle,
  FolderLock,
  ArrowRight
} from 'lucide-react';
import { dbManager } from '../lib/supabaseClient';
import { ActiveTab } from './Sidebar';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: ActiveTab, targetId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    clients: any[];
    sites: any[];
    guards: any[];
    novedades: any[];
    incidents: any[];
    documents: any[];
  }>({ clients: [], sites: [], guards: [], novedades: [], incidents: [], documents: [] });

  useEffect(() => {
    if (query.trim()) {
      setResults(dbManager.globalSearch(query));
    } else {
      setResults({ clients: [], sites: [], guards: [], novedades: [], incidents: [], documents: [] });
    }
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or toggle
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalResults = 
    results.clients.length + 
    results.sites.length + 
    results.guards.length + 
    results.novedades.length + 
    results.incidents.length + 
    results.documents.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-xs">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <Search className="w-5 h-5 text-cyan-400 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por cliente, puesto, guarda, novedad o documento..."
            autoFocus
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-white p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {query && totalResults === 0 && (
            <div className="text-center py-10 text-slate-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No se encontraron registros para "{query}".</p>
              <p className="text-xs text-slate-600 mt-1">Prueba buscando "Centro Comercial", "Carlos", "Puerta" o "Bóveda"</p>
            </div>
          )}

          {!query && (
            <div className="text-center py-8 text-slate-500 text-xs">
              <p className="font-medium text-slate-400 mb-1">Búsqueda Global Operativa</p>
              <p>Escribe cualquier término para explorar toda la base de datos de seguridad.</p>
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                {['Centro Comercial', 'Carlos Benítez', 'Puerta', 'Póliza', 'Intrusión'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Security Sites Results */}
          {results.sites.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-cyan-400" /> Puestos de Vigilancia ({results.sites.length})
              </p>
              <div className="space-y-1.5">
                {results.sites.map((site) => (
                  <button
                    key={site.id}
                    onClick={() => {
                      onNavigate('sites', site.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition-colors group"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">{site.name}</p>
                      <p className="text-[11px] text-slate-400">{site.address} • Código: {site.code}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Guards Results */}
          {results.guards.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Guardas de Seguridad ({results.guards.length})
              </p>
              <div className="space-y-1.5">
                {results.guards.map((guard) => (
                  <button
                    key={guard.id}
                    onClick={() => {
                      onNavigate('guards', guard.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-left transition-colors group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <img src={guard.photo_url} alt={guard.name} className="w-7 h-7 rounded-full object-cover" />
                      <div>
                        <p className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300">{guard.name}</p>
                        <p className="text-[11px] text-slate-400">{guard.position} • {guard.document_number}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Novedades Results */}
          {results.novedades.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-purple-400" /> Novedades Operativas ({results.novedades.length})
              </p>
              <div className="space-y-1.5">
                {results.novedades.map((nov) => (
                  <button
                    key={nov.id}
                    onClick={() => {
                      onNavigate('novedades', nov.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-left transition-colors group"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-purple-300">{nov.title}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-lg">{nov.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Incidents Results */}
          {results.incidents.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-400" /> Incidentes ({results.incidents.length})
              </p>
              <div className="space-y-1.5">
                {results.incidents.map((inc) => (
                  <button
                    key={inc.id}
                    onClick={() => {
                      onNavigate('incidents', inc.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-left transition-colors group"
                  >
                    <div>
                      <p className="text-xs font-semibold text-rose-300">{inc.title}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-lg">{inc.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clients Results */}
          {results.clients.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                <Building2 className="w-3.5 h-3.5 mr-1 text-blue-400" /> Clientes ({results.clients.length})
              </p>
              <div className="space-y-1.5">
                {results.clients.map((cli) => (
                  <button
                    key={cli.id}
                    onClick={() => {
                      onNavigate('clients', cli.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-left transition-colors group"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-blue-300">{cli.name}</p>
                      <p className="text-[11px] text-slate-400">{cli.document} • {cli.phone}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Documents Results */}
          {results.documents.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                <FolderLock className="w-3.5 h-3.5 mr-1 text-amber-400" /> Documentos ({results.documents.length})
              </p>
              <div className="space-y-1.5">
                {results.documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => {
                      onNavigate('documents', doc.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-left transition-colors group"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-amber-300">{doc.name}</p>
                      <p className="text-[11px] text-slate-400">Vence: {doc.expiration_date} • {doc.status}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Presiona <kbd className="px-1 py-0.5 rounded bg-slate-800 font-mono text-slate-400">ESC</kbd> para salir</span>
          <span>SecurityCRM AI Core Search</span>
        </div>
      </div>
    </div>
  );
};
