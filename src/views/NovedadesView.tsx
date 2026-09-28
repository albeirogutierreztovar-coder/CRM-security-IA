import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Mic,
  MapPin,
  Clock,
  Sparkles,
  Camera,
  X,
  CheckCircle,
  Eye,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { dbManager } from '../lib/supabaseClient';
import { Novedad, NovedadCategory, PriorityLevel, NovedadStatus } from '../types/database';
import { PriorityBadge, StatusBadge } from '../components/StatusBadges';

interface NovedadesViewProps {
  onOpenVoiceModal: () => void;
}

export const NovedadesView: React.FC<NovedadesViewProps> = ({ onOpenVoiceModal }) => {
  const [novedades, setNovedades] = useState<Novedad[]>(dbManager.getNovedades());
  const [sites, setSites] = useState(dbManager.getSites());
  const [selectedNovedad, setSelectedNovedad] = useState<Novedad | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form states
  const [siteId, setSiteId] = useState('');
  const [category, setCategory] = useState<NovedadCategory>('seguridad');
  const [priority, setPriority] = useState<PriorityLevel>('MEDIA');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reportedBy, setReportedBy] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');

  const refresh = () => {
    setNovedades(dbManager.getNovedades());
    setSites(dbManager.getSites());
  };

  useEffect(() => {
    const handleDataChange = () => refresh();
    window.addEventListener('securitycrm_datachange', handleDataChange);
    return () => window.removeEventListener('securitycrm_datachange', handleDataChange);
  }, []);

  const openCreateModal = () => {
    setSiteId(sites[0]?.id || '');
    setCategory('seguridad');
    setPriority('MEDIA');
    setTitle('');
    setDescription('');
    setReportedBy(dbManager.getCurrentProfile().full_name);
    setEvidenceUrl('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !siteId) return;

    dbManager.createNovedad({
      site_id: siteId,
      category,
      priority,
      title,
      description,
      reported_by: reportedBy || dbManager.getCurrentProfile().full_name,
      event_date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'ABIERTA',
      evidence_urls: evidenceUrl ? [evidenceUrl] : [],
    });

    refresh();
    setIsModalOpen(false);
  };

  const handleStatusTransition = (novId: string, newStatus: NovedadStatus) => {
    dbManager.updateNovedad(novId, { status: newStatus });
    if (selectedNovedad && selectedNovedad.id === novId) {
      setSelectedNovedad({ ...selectedNovedad, status: newStatus });
    }
    refresh();
  };

  const filteredNovedades = novedades.filter(n => {
    const matchSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        n.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        n.reported_by.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === 'all' || n.category === categoryFilter;
    const matchPrio = priorityFilter === 'all' || n.priority === priorityFilter;
    const matchStat = statusFilter === 'all' || n.status === statusFilter;
    return matchSearch && matchCat && matchPrio && matchStat;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center">
            <FileSpreadsheet className="w-5 h-5 mr-2 text-cyan-400" /> Registro Central de Novedades Operativas
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Minuta digital, evidencia fotográfica y seguimiento de estados en puestos de vigilancia.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={onOpenVoiceModal}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-900/40 transition-all"
          >
            <Mic className="w-4 h-4 text-cyan-200" />
            <span>Dictar por Voz</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Registro Manual</span>
          </button>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="flex items-center px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título o palabra clave..."
            className="w-full bg-transparent text-slate-200 placeholder-slate-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <span className="text-slate-400 shrink-0">Categoría:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-transparent text-slate-200 focus:outline-hidden capitalize"
          >
            <option value="all">Todas</option>
            {['seguridad', 'infraestructura', 'comportamiento', 'acceso', 'equipo', 'vehículo', 'personal', 'cliente', 'mantenimiento', 'emergencia', 'otra'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <span className="text-slate-400 shrink-0">Prioridad:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full bg-transparent text-slate-200 focus:outline-hidden"
          >
            <option value="all">Todas</option>
            <option value="CRÍTICA">Crítica</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Media</option>
            <option value="BAJA">Baja</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <span className="text-slate-400 shrink-0">Estado:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-transparent text-slate-200 focus:outline-hidden"
          >
            <option value="all">Todos los estados</option>
            <option value="ABIERTA">Abierta</option>
            <option value="EN_REVISIÓN">En Revisión</option>
            <option value="ASIGNADA">Asignada</option>
            <option value="RESUELTA">Resuelta</option>
            <option value="CERRADA">Cerrada</option>
          </select>
        </div>
      </div>

      {/* Novedades Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Puesto</th>
                <th className="py-3 px-4">Novedad</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Prioridad</th>
                <th className="py-3 px-4">Reportado Por</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredNovedades.map((nov) => {
                const site = sites.find(s => s.id === nov.site_id);
                return (
                  <tr key={nov.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-300 font-mono whitespace-nowrap">
                      {nov.event_date}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200 whitespace-nowrap">
                      {site?.name || 'Puesto'}
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <p className="font-bold text-slate-100 flex items-center">
                        {nov.title}
                        {nov.ai_generated && (
                          <span className="ml-1.5 text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            IA
                          </span>
                        )}
                        {nov.evidence_urls && nov.evidence_urls.length > 0 && (
                          <Camera className="w-3 h-3 ml-1.5 text-cyan-400" />
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{nov.description}</p>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-300">{nov.category}</td>
                    <td className="py-3 px-4"><PriorityBadge priority={nov.priority} /></td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{nov.reported_by}</td>
                    <td className="py-3 px-4 whitespace-nowrap"><StatusBadge status={nov.status} /></td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedNovedad(nov)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700 text-[11px] font-semibold"
                      >
                        Abrir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Novedad Detail Modal */}
      {selectedNovedad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                  Novedad ID: {selectedNovedad.id}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedNovedad.title}</h3>
              </div>
              <button onClick={() => setSelectedNovedad(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="space-y-1">
                  <p className="text-slate-400">Puesto: <strong className="text-slate-200">{sites.find(s => s.id === selectedNovedad.site_id)?.name}</strong></p>
                  <p className="text-slate-400">Hora del evento: <span className="font-mono text-slate-200">{selectedNovedad.event_date}</span></p>
                  <p className="text-slate-400">Reportado por: <span className="text-slate-200">{selectedNovedad.reported_by}</span></p>
                </div>
                <div className="flex flex-col items-end space-y-1.5">
                  <PriorityBadge priority={selectedNovedad.priority} />
                  <StatusBadge status={selectedNovedad.status} />
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-300 block mb-1">Descripción de los hechos:</span>
                <p className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 leading-relaxed">
                  {selectedNovedad.description}
                </p>
              </div>

              {selectedNovedad.evidence_urls && selectedNovedad.evidence_urls.length > 0 && (
                <div>
                  <span className="font-bold text-slate-300 block mb-1 flex items-center">
                    <Camera className="w-3.5 h-3.5 mr-1 text-cyan-400" /> Evidencias Fotográficas Adjuntas:
                  </span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {selectedNovedad.evidence_urls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt="Evidencia"
                        className="w-full h-36 object-cover rounded-xl border border-slate-700"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Status workflow transitions */}
              <div className="pt-2 border-t border-slate-800">
                <span className="font-bold text-slate-300 block mb-2">Transición de Estado Operativo:</span>
                <div className="flex flex-wrap gap-2">
                  {(['ABIERTA', 'EN_REVISIÓN', 'ASIGNADA', 'RESUELTA', 'CERRADA'] as NovedadStatus[]).map(st => (
                    <button
                      key={st}
                      onClick={() => handleStatusTransition(selectedNovedad.id, st)}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
                        selectedNovedad.status === st
                          ? 'bg-cyan-600 text-white font-bold'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {st.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center">
                <FileSpreadsheet className="w-4 h-4 mr-2 text-cyan-400" />
                Registrar Novedad Operacional
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Puesto de Vigilancia *</label>
                <select
                  required
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden focus:border-cyan-500"
                >
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as NovedadCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden capitalize"
                  >
                    {['seguridad', 'infraestructura', 'comportamiento', 'acceso', 'equipo', 'vehículo', 'personal', 'cliente', 'mantenimiento', 'emergencia', 'otra'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Prioridad</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                  >
                    <option value="BAJA">BAJA</option>
                    <option value="MEDIA">MEDIA</option>
                    <option value="ALTA">ALTA</option>
                    <option value="CRÍTICA">CRÍTICA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Título de la Novedad *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Salida de emergencia encontrada abierta"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Descripción y Acciones Tomadas *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalla lo acontecido, personas presentes y procedimiento ejecutado por el guarda..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">URL de Evidencia Fotográfica (Opcional)</label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md shadow-cyan-900/40"
                >
                  Registrar Novedad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
