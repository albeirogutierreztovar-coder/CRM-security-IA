import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  MapPin,
  Clock,
  ShieldAlert,
  Camera,
  X,
  CheckCircle,
  FileText,
  AlertCircle
} from 'lucide-react';
import { dbManager } from '../lib/supabaseClient';
import { Incident, IncidentType, IncidentSeverity, IncidentStatus } from '../types/database';
import { StatusBadge } from '../components/StatusBadges';

export const IncidentsView: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>(dbManager.getIncidents());
  const [sites, setSites] = useState(dbManager.getSites());
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [siteId, setSiteId] = useState('');
  const [incidentType, setIncidentType] = useState<IncidentType>('intrusión');
  const [severity, setSeverity] = useState<IncidentSeverity>('GRAVE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [actionsTaken, setActionsTaken] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');

  const refresh = () => {
    setIncidents(dbManager.getIncidents());
    setSites(dbManager.getSites());
  };

  useEffect(() => {
    const handleDataChange = () => refresh();
    window.addEventListener('securitycrm_datachange', handleDataChange);
    return () => window.removeEventListener('securitycrm_datachange', handleDataChange);
  }, []);

  const openCreateModal = () => {
    setSiteId(sites[0]?.id || '');
    setIncidentType('intrusión');
    setSeverity('GRAVE');
    setTitle('');
    setDescription('');
    setLocation('');
    setActionsTaken('');
    setEvidenceUrl('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !siteId) return;

    dbManager.createIncident({
      site_id: siteId,
      reported_by: dbManager.getCurrentProfile().full_name,
      incident_type: incidentType,
      severity,
      title,
      description,
      incident_date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'ABIERTO',
      location: location || 'Área del Puesto',
      actions_taken: actionsTaken,
      evidence_urls: evidenceUrl ? [evidenceUrl] : [],
    });

    refresh();
    setIsModalOpen(false);
  };

  const handleStatusChange = (id: string, status: IncidentStatus) => {
    const closed_at = status === 'CERRADO' ? new Date().toISOString() : undefined;
    dbManager.updateIncident(id, { status, closed_at });
    if (selectedIncident && selectedIncident.id === id) {
      setSelectedIncident({ ...selectedIncident, status, closed_at });
    }
    refresh();
  };

  const filteredIncidents = incidents.filter(i =>
    i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-rose-400" /> Centro de Control de Incidentes Graves
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestión de eventos críticos, intervenciones policiales, croquis de evidencia y cadena de custodia.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-950/50 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Reportar Incidente</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="flex items-center px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs max-w-sm">
        <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar incidentes por título o ubicación..."
          className="w-full bg-transparent text-slate-200 placeholder-slate-500 focus:outline-hidden"
        />
      </div>

      {/* Incidents Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIncidents.map((inc) => {
          const site = sites.find(s => s.id === inc.site_id);

          return (
            <div
              key={inc.id}
              onClick={() => setSelectedIncident(inc)}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer space-y-3 relative overflow-hidden shadow-lg group"
            >
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                inc.severity === 'CRÍTICA' ? 'bg-rose-600' : inc.severity === 'GRAVE' ? 'bg-orange-500' : 'bg-amber-400'
              }`} />

              <div className="flex items-start justify-between pt-1">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {inc.incident_type}
                  </span>
                  <h3 className="text-sm font-bold text-slate-100 mt-2 group-hover:text-cyan-300 transition-colors">
                    {inc.title}
                  </h3>
                </div>
                <StatusBadge status={inc.status} />
              </div>

              <div className="text-xs text-slate-400 space-y-1">
                <p className="flex items-center text-slate-300 font-medium truncate">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-cyan-400 shrink-0" />
                  <span className="truncate">{site?.name || 'Puesto'}</span>
                </p>
                <p className="text-[11px] text-slate-400 truncate">Lugar: {inc.location}</p>
                <p className="text-[11px] text-slate-400 line-clamp-2">{inc.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-mono">{inc.incident_date}</span>
                <span className={`font-bold ${
                  inc.severity === 'CRÍTICA' ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  {inc.severity}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider font-bold">
                  EXPEDIENTE DE INCIDENTE: {selectedIncident.id}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedIncident.title}</h3>
              </div>
              <button onClick={() => setSelectedIncident(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div>
                  <p className="text-slate-400">Puesto: <strong className="text-slate-200">{sites.find(s => s.id === selectedIncident.site_id)?.name}</strong></p>
                  <p className="text-slate-400">Lugar exacto: <span className="text-slate-200">{selectedIncident.location}</span></p>
                  <p className="text-slate-400">Reportado por: <span className="text-slate-200">{selectedIncident.reported_by}</span></p>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-rose-400 font-bold block">{selectedIncident.severity}</span>
                  <StatusBadge status={selectedIncident.status} />
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-300 block mb-1">Descripción de los hechos:</span>
                <p className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 leading-relaxed">
                  {selectedIncident.description}
                </p>
              </div>

              {selectedIncident.actions_taken && (
                <div>
                  <span className="font-bold text-slate-300 block mb-1">Acciones inmediatas tomadas:</span>
                  <p className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-cyan-200 leading-relaxed">
                    {selectedIncident.actions_taken}
                  </p>
                </div>
              )}

              {selectedIncident.evidence_urls && selectedIncident.evidence_urls.length > 0 && (
                <div>
                  <span className="font-bold text-slate-300 block mb-1 flex items-center">
                    <Camera className="w-3.5 h-3.5 mr-1 text-cyan-400" /> Registro Fotográfico:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedIncident.evidence_urls.map((url, i) => (
                      <img key={i} src={url} alt="Evidencia" className="w-full h-36 object-cover rounded-xl border border-slate-700" />
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-slate-400">Actualizar Estado:</span>
                <div className="flex space-x-1.5">
                  {(['ABIERTO', 'EN_INVESTIGACION', 'ACCIONES_TOMADAS', 'CERRADO'] as IncidentStatus[]).map(st => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(selectedIncident.id, st)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                        selectedIncident.status === st
                          ? 'bg-rose-600 text-white font-bold'
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

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-rose-400" />
                Registrar Incidente de Seguridad
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                >
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tipo de Incidente</label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value as IncidentType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                  >
                    {['robo', 'intrusión', 'acceso no autorizado', 'accidente', 'amenaza', 'daño', 'emergencia', 'altercado', 'incendio', 'pérdida', 'otro'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Gravedad</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                  >
                    <option value="CRÍTICA">CRÍTICA</option>
                    <option value="GRAVE">GRAVE</option>
                    <option value="MODERADA">MODERADA</option>
                    <option value="LEVE">LEVE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Título del Incidente *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Intento de forzamiento en escotilla azotea"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Ubicación Precisa</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ej: Cubierta Azotea Torre B"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Descripción Detallada *</label>
                <textarea
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Relato cronológico de los hechos..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Acciones Tomadas / Coordinación Policial</label>
                <textarea
                  rows={2}
                  value={actionsTaken}
                  onChange={(e) => setActionsTaken(e.target.value)}
                  placeholder="Alerta a Policía Cuadrante, revisión de cámaras CCTV..."
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
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-900/40"
                >
                  Registrar Incidente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
