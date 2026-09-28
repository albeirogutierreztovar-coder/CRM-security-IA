import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  Users,
  Clock,
  Navigation,
  Edit2,
  Trash2,
  X,
  FileSpreadsheet,
  AlertTriangle,
  ClipboardCheck,
  FolderLock,
  Layers,
  Phone
} from 'lucide-react';
import { dbManager } from '../lib/supabaseClient';
import { SecuritySite, RiskLevel, SiteStatus } from '../types/database';
import { RiskBadge, StatusBadge, PriorityBadge } from '../components/StatusBadges';

export const SitesView: React.FC = () => {
  const [sites, setSites] = useState<SecuritySite[]>(dbManager.getSites());
  const [clients, setClients] = useState(dbManager.getClients());
  const [selectedSite, setSelectedSite] = useState<SecuritySite | null>(sites[0] || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<SecuritySite | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [clientId, setClientId] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(4.7110);
  const [longitude, setLongitude] = useState(-74.0721);
  const [description, setDescription] = useState('');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('MEDIO');
  const [status, setStatus] = useState<SiteStatus>('ACTIVO');
  const [requiredGuards, setRequiredGuards] = useState(4);
  const [operatingHours, setOperatingHours] = useState('24/7');
  const [contactPhone, setContactPhone] = useState('');

  const refreshSites = () => {
    const s = dbManager.getSites();
    setSites(s);
    setClients(dbManager.getClients());
    if (selectedSite) {
      const updated = s.find(x => x.id === selectedSite.id);
      if (updated) setSelectedSite(updated);
    }
  };

  useEffect(() => {
    const handleDataChange = () => refreshSites();
    window.addEventListener('securitycrm_datachange', handleDataChange);
    return () => window.removeEventListener('securitycrm_datachange', handleDataChange);
  }, []);

  const openCreateModal = () => {
    setEditingSite(null);
    setName('');
    setCode('PST-' + Math.floor(100 + Math.random() * 900));
    setClientId(clients[0]?.id || '');
    setAddress('');
    setLatitude(4.7110 + (Math.random() - 0.5) * 0.1);
    setLongitude(-74.0721 + (Math.random() - 0.5) * 0.1);
    setDescription('');
    setRiskLevel('MEDIO');
    setStatus('ACTIVO');
    setRequiredGuards(4);
    setOperatingHours('24/7');
    setContactPhone('+57 (601) 745-9800');
    setIsModalOpen(true);
  };

  const openEditModal = (site: SecuritySite) => {
    setEditingSite(site);
    setName(site.name);
    setCode(site.code);
    setClientId(site.client_id);
    setAddress(site.address);
    setLatitude(site.latitude);
    setLongitude(site.longitude);
    setDescription(site.description);
    setRiskLevel(site.risk_level);
    setStatus(site.status);
    setRequiredGuards(site.required_guards_count);
    setOperatingHours(site.operating_hours);
    setContactPhone(site.contact_phone);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !clientId) return;

    if (editingSite) {
      dbManager.updateSite(editingSite.id, {
        name,
        code,
        client_id: clientId,
        address,
        latitude,
        longitude,
        description,
        risk_level: riskLevel,
        status,
        required_guards_count: requiredGuards,
        operating_hours: operatingHours,
        contact_phone: contactPhone,
      });
    } else {
      dbManager.createSite({
        name,
        code,
        client_id: clientId,
        address,
        latitude,
        longitude,
        description,
        risk_level: riskLevel,
        status,
        required_guards_count: requiredGuards,
        operating_hours: operatingHours,
        contact_phone: contactPhone,
      });
    }

    refreshSites();
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este puesto de vigilancia?')) {
      dbManager.deleteSite(id);
      if (selectedSite?.id === id) setSelectedSite(null);
      refreshSites();
    }
  };

  const filteredSites = sites.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'all' || s.risk_level === riskFilter;
    return matchesSearch && matchesRisk;
  });

  // Related data for selected site
  const siteGuards = selectedSite
    ? dbManager.getGuards().filter(g => g.assigned_site_id === selectedSite.id)
    : [];

  const siteShifts = selectedSite
    ? dbManager.getShifts().filter(s => s.site_id === selectedSite.id)
    : [];

  const siteNovedades = selectedSite
    ? dbManager.getNovedades().filter(n => n.site_id === selectedSite.id)
    : [];

  const siteIncidents = selectedSite
    ? dbManager.getIncidents().filter(i => i.site_id === selectedSite.id)
    : [];

  const siteInspections = selectedSite
    ? dbManager.getInspections().filter(i => i.site_id === selectedSite.id)
    : [];

  const siteDocuments = selectedSite
    ? dbManager.getDocuments().filter(d => d.site_id === selectedSite.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-cyan-400" /> Puestos de Vigilancia y Control Perimetral
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Supervisión geográfica, niveles de riesgo, dotación de guardas y estado de dispositivos.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-900/40 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Puesto</span>
        </button>
      </div>

      {/* Interactive Georeferenced Radar Map View */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Mapa Táctico de Cobertura Geográfica (Bogotá & Sabana)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {sites.length} Puntos Monitoreados
          </span>
        </div>

        {/* Visual Map Canvas / Tactical Grid */}
        <div className="h-64 sm:h-72 w-full mt-3 rounded-xl bg-slate-900 relative overflow-hidden border border-slate-800 flex items-center justify-center">
          {/* Tactical grid background lines */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* Concentric radar circle guides */}
          <div className="absolute w-48 h-48 rounded-full border border-cyan-500/10 pointer-events-none" />
          <div className="absolute w-96 h-96 rounded-full border border-cyan-500/10 pointer-events-none" />

          {/* Interactive Site Markers positioned on tactical canvas */}
          {sites.map((site, index) => {
            const isSelected = selectedSite?.id === site.id;
            // Simulated normalized coordinates for visual layout
            const topPct = 20 + ((index * 23) % 65);
            const leftPct = 15 + ((index * 31) % 72);

            return (
              <div
                key={site.id}
                onClick={() => setSelectedSite(site)}
                style={{ top: `${topPct}%`, left: `${leftPct}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 transition-transform group ${
                  isSelected ? 'scale-125 z-20' : 'hover:scale-110'
                }`}
              >
                <div className="relative flex flex-col items-center">
                  {/* Radar pulse for active sites */}
                  {site.status === 'ACTIVO' && (
                    <span className="absolute w-7 h-7 rounded-full bg-cyan-400/20 animate-ping pointer-events-none" />
                  )}

                  {/* Marker Pin */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border transition-all ${
                    isSelected 
                      ? 'bg-cyan-500 text-slate-950 border-white ring-4 ring-cyan-500/30' 
                      : site.risk_level === 'CRITICO'
                      ? 'bg-rose-600 text-white border-rose-400'
                      : site.risk_level === 'ALTO'
                      ? 'bg-amber-500 text-white border-amber-300'
                      : 'bg-slate-800 text-cyan-300 border-cyan-500/40'
                  }`}>
                    <MapPin className="w-4 h-4" />
                  </div>

                  {/* Tooltip on hover */}
                  <div className={`mt-1 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap bg-slate-950/90 border border-slate-700 text-slate-200 transition-opacity ${
                    isSelected ? 'opacity-100 ring-1 ring-cyan-500' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    {site.code}: {site.name.slice(0, 18)}...
                  </div>
                </div>
              </div>
            );
          })}

          {/* Compass Rose */}
          <div className="absolute bottom-3 right-3 p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center space-x-1">
            <Navigation className="w-3 h-3 text-cyan-400 rotate-45" />
            <span>N 4°42' • W 74°04'</span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar puesto por código o nombre..."
            className="w-full bg-transparent text-slate-200 placeholder-slate-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Nivel de Riesgo:</span>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-hidden"
          >
            <option value="all">Todos los riesgos</option>
            <option value="CRITICO">Crítico</option>
            <option value="ALTO">Alto</option>
            <option value="MEDIO">Medio</option>
            <option value="BAJO">Bajo</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Sites Cards + Site 360 Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sites list */}
        <div className="lg:col-span-5 space-y-3">
          {filteredSites.map((site) => {
            const isSelected = selectedSite?.id === site.id;
            const client = clients.find(c => c.id === site.client_id);

            return (
              <div
                key={site.id}
                onClick={() => setSelectedSite(site)}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                  isSelected 
                    ? 'bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-950/30' 
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                        {site.code}
                      </span>
                      <h3 className="text-xs font-bold text-slate-100">{site.name}</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{client?.name || 'Cliente'}</p>
                  </div>
                  <RiskBadge risk={site.risk_level} />
                </div>

                <p className="text-xs text-slate-400 truncate">{site.address}</p>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1 text-slate-500" />
                    {site.required_guards_count} guardas requeridos
                  </span>

                  <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEditModal(site)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(site.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Site Detailed Profile */}
        <div className="lg:col-span-7">
          {selectedSite ? (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5 animate-in fade-in duration-150">
              {/* Site Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                      {selectedSite.code}
                    </span>
                    <h2 className="text-lg font-bold text-white">{selectedSite.name}</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{selectedSite.description}</p>
                  <p className="text-xs text-slate-300 mt-1 flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500" /> {selectedSite.address} • Coordenadas: {selectedSite.latitude.toFixed(4)}, {selectedSite.longitude.toFixed(4)}
                  </p>
                </div>

                <div className="flex flex-col items-end space-y-1">
                  <RiskBadge risk={selectedSite.risk_level} />
                  <StatusBadge status={selectedSite.status} />
                </div>
              </div>

              {/* Sub-sections */}
              <div className="space-y-4">
                {/* Operación & Guardas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Guardas Req.</span>
                    <p className="text-base font-bold text-slate-100 mt-0.5">{selectedSite.required_guards_count}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Horario</span>
                    <p className="text-xs font-semibold text-slate-100 mt-0.5 truncate">{selectedSite.operating_hours}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Novedades</span>
                    <p className="text-base font-bold text-purple-400 mt-0.5">{siteNovedades.length}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Incidentes</span>
                    <p className="text-base font-bold text-rose-400 mt-0.5">{siteIncidents.length}</p>
                  </div>
                </div>

                {/* Guardas asignados */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1 text-cyan-400" /> Guardas Asignados ({siteGuards.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {siteGuards.map(g => (
                      <div key={g.id} className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                        <img src={g.photo_url} alt={g.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                        <div className="overflow-hidden">
                          <p className="font-semibold text-slate-200 truncate">{g.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{g.position}</p>
                        </div>
                      </div>
                    ))}
                    {siteGuards.length === 0 && (
                      <p className="text-xs text-slate-500 col-span-2 py-2">Sin guardas asignados a este puesto.</p>
                    )}
                  </div>
                </div>

                {/* Turnos en curso */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-indigo-400" /> Turnos Programados / En Curso ({siteShifts.length})
                  </h4>
                  <div className="space-y-1.5">
                    {siteShifts.slice(0, 3).map(shift => {
                      const guard = dbManager.getGuards().find(g => g.id === shift.guard_id);
                      return (
                        <div key={shift.id} className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800 text-xs">
                          <div>
                            <span className="font-semibold text-slate-200">{guard?.name || 'Guarda'}</span>
                            <span className="text-[11px] text-slate-400 ml-2">({shift.start_time} - {shift.end_time})</span>
                          </div>
                          <StatusBadge status={shift.status} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Novedades Recientes */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                    <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-purple-400" /> Novedades en el Puesto ({siteNovedades.length})
                  </h4>
                  <div className="space-y-1.5">
                    {siteNovedades.slice(0, 3).map(nov => (
                      <div key={nov.id} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-100">{nov.title}</span>
                          <PriorityBadge priority={nov.priority} />
                        </div>
                        <p className="text-[11px] text-slate-400">{nov.description}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{nov.event_date} • {nov.reported_by}</p>
                      </div>
                    ))}
                    {siteNovedades.length === 0 && (
                      <p className="text-xs text-slate-500 py-2">Sin novedades reportadas en este puesto.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-8 rounded-2xl bg-slate-900/50 border border-dashed border-slate-800 text-slate-500 text-sm">
              Selecciona un puesto para ver su ficha táctica 360.
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-cyan-400" />
                {editingSite ? 'Editar Puesto' : 'Crear Puesto de Vigilancia'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Nombre del Puesto *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Centro Comercial Norte — Bahía Parqueadero"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Código *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="CCN-02"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Cliente Contratante *</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden focus:border-cyan-500"
                >
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Dirección Física</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Autopista Norte # 185-45, Sótano -2"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nivel de Riesgo</label>
                  <select
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                  >
                    <option value="BAJO">BAJO</option>
                    <option value="MEDIO">MEDIO</option>
                    <option value="ALTO">ALTO</option>
                    <option value="CRITICO">CRÍTICO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Guardas Requeridos</label>
                  <input
                    type="number"
                    min="1"
                    value={requiredGuards}
                    onChange={(e) => setRequiredGuards(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Descripción Operativa</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Detalles sobre rondas, armamento y puntos ciegos..."
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
                  {editingSite ? 'Guardar Cambios' : 'Crear Puesto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
