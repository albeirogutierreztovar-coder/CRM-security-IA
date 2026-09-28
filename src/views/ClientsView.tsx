import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Edit2,
  Trash2,
  X,
  Phone,
  Mail,
  UserCheck,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { dbManager } from '../lib/supabaseClient';
import { Client, SecuritySite, Guard, Incident, Novedad } from '../types/database';
import { StatusBadge, PriorityBadge } from '../components/StatusBadges';

export const ClientsView: React.FC = () => {
  const [clients, setClients] = useState<Client[]>(dbManager.getClients());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');

  const refreshClients = () => {
    setClients(dbManager.getClients());
  };

  useEffect(() => {
    const handleDataChange = () => refreshClients();
    window.addEventListener('securitycrm_datachange', handleDataChange);
    return () => window.removeEventListener('securitycrm_datachange', handleDataChange);
  }, []);

  const openCreateModal = () => {
    setEditingClient(null);
    setName('');
    setDocument('');
    setPhone('');
    setEmail('');
    setAddress('');
    setContactPerson('');
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setDocument(client.document);
    setPhone(client.phone);
    setEmail(client.email);
    setAddress(client.address);
    setContactPerson(client.contact_person || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !document) return;

    if (editingClient) {
      dbManager.updateClient(editingClient.id, {
        name,
        document,
        phone,
        email,
        address,
        contact_person: contactPerson,
      });
      if (selectedClient && selectedClient.id === editingClient.id) {
        setSelectedClient({
          ...selectedClient,
          name,
          document,
          phone,
          email,
          address,
          contact_person: contactPerson,
        });
      }
    } else {
      const created = dbManager.createClient({
        name,
        document,
        phone,
        email,
        address,
        contact_person: contactPerson,
        status: 'ACTIVO',
      });
    }

    refreshClients();
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este cliente? Se mantendrá en auditoría.')) {
      dbManager.deleteClient(id);
      if (selectedClient && selectedClient.id === id) setSelectedClient(null);
      refreshClients();
    }
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.document.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Client Details Relations
  const clientSites = selectedClient
    ? dbManager.getSites().filter(s => s.client_id === selectedClient.id)
    : [];

  const clientSiteIds = clientSites.map(s => s.id);
  const clientGuards = dbManager.getGuards().filter(g => g.assigned_site_id && clientSiteIds.includes(g.assigned_site_id));
  const clientIncidents = dbManager.getIncidents().filter(i => clientSiteIds.includes(i.site_id));
  const clientNovedades = dbManager.getNovedades().filter(n => clientSiteIds.includes(n.site_id));
  const clientDocuments = dbManager.getDocuments().filter(d => d.client_id === selectedClient?.id || (d.site_id && clientSiteIds.includes(d.site_id)));

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-cyan-400" /> Administración de Clientes y Contratantes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestión corporativa, puestos asignados, personal de vigilancia y documentación contractual.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-900/40 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs max-w-md">
        <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre de cliente, NIT o dirección..."
          className="w-full bg-transparent text-slate-200 placeholder-slate-500 focus:outline-hidden"
        />
      </div>

      {/* Main Grid: Clients List + Detailed Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Clients Cards list */}
        <div className="lg:col-span-5 space-y-3">
          {filteredClients.map((client) => {
            const isSelected = selectedClient?.id === client.id;
            const sitesCount = dbManager.getSites().filter(s => s.client_id === client.id).length;

            return (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                  isSelected 
                    ? 'bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-950/30' 
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{client.name}</h3>
                    <p className="text-[11px] text-cyan-400 font-mono mt-0.5">{client.document}</p>
                  </div>
                  <StatusBadge status={client.status} />
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{client.address}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    <strong className="text-slate-200">{sitesCount}</strong> Puestos Contratados
                  </span>

                  <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEditModal(client)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
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

        {/* Right: Client 360 Comprehensive View */}
        <div className="lg:col-span-7">
          {selectedClient ? (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5 animate-in fade-in duration-150">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedClient.name}</h2>
                  <p className="text-xs text-cyan-400 font-mono mt-0.5">{selectedClient.document}</p>
                  <p className="text-xs text-slate-400 mt-1 flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500" /> {selectedClient.address}
                  </p>
                  {selectedClient.contact_person && (
                    <p className="text-xs text-slate-300 mt-1">
                      <strong>Contacto:</strong> {selectedClient.contact_person} ({selectedClient.phone})
                    </p>
                  )}
                </div>

                <button
                  onClick={() => openEditModal(selectedClient)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center space-x-1"
                >
                  <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Editar Ficha</span>
                </button>
              </div>

              {/* Sub-tabs: Puestos, Guardas, Incidentes, Novedades, Documentos */}
              <div className="space-y-4">
                {/* Puestos contratados */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> Puestos Contratados ({clientSites.length})
                    </span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {clientSites.map(s => (
                      <div key={s.id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">{s.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">{s.code}</span>
                        </div>
                        <p className="text-slate-400 text-[11px] truncate">{s.address}</p>
                        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                          <span>{s.required_guards_count} guardas requeridos</span>
                          <span className="text-cyan-400 font-semibold">{s.risk_level}</span>
                        </div>
                      </div>
                    ))}
                    {clientSites.length === 0 && (
                      <p className="text-xs text-slate-500 col-span-2 py-3 text-center">No hay puestos registrados para este cliente.</p>
                    )}
                  </div>
                </div>

                {/* Guardas asignados */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> Personal de Seguridad Asignado ({clientGuards.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {clientGuards.map(g => (
                      <div key={g.id} className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                        <img src={g.photo_url} alt={g.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        <div className="overflow-hidden">
                          <p className="font-semibold text-slate-200 truncate">{g.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{g.position} • {g.employee_code}</p>
                        </div>
                      </div>
                    ))}
                    {clientGuards.length === 0 && (
                      <p className="text-xs text-slate-500 col-span-2 py-3 text-center">Sin personal fijo asignado actualmente.</p>
                    )}
                  </div>
                </div>

                {/* Recent Incidentes & Novedades */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
                    <h5 className="text-xs font-bold text-rose-400 flex items-center">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Incidentes ({clientIncidents.length})
                    </h5>
                    {clientIncidents.slice(0, 3).map(inc => (
                      <div key={inc.id} className="text-xs p-2 rounded bg-slate-900 border border-slate-800">
                        <p className="font-semibold text-slate-200 truncate">{inc.title}</p>
                        <p className="text-[10px] text-slate-400">{inc.incident_date} • {inc.severity}</p>
                      </div>
                    ))}
                    {clientIncidents.length === 0 && (
                      <p className="text-[11px] text-slate-500 py-2">Sin incidentes registrados.</p>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
                    <h5 className="text-xs font-bold text-purple-400 flex items-center">
                      <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> Novedades ({clientNovedades.length})
                    </h5>
                    {clientNovedades.slice(0, 3).map(nov => (
                      <div key={nov.id} className="text-xs p-2 rounded bg-slate-900 border border-slate-800">
                        <p className="font-semibold text-slate-200 truncate">{nov.title}</p>
                        <p className="text-[10px] text-slate-400">{nov.event_date} • {nov.priority}</p>
                      </div>
                    ))}
                    {clientNovedades.length === 0 && (
                      <p className="text-[11px] text-slate-500 py-2">Sin novedades registradas.</p>
                    )}
                  </div>
                </div>

                {/* Documentación contractual */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                    <FileText className="w-3.5 h-3.5 mr-1.5 text-amber-400" /> Documentos y Pólizas ({clientDocuments.length})
                  </h4>
                  <div className="space-y-1.5">
                    {clientDocuments.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800 text-xs">
                        <div>
                          <p className="font-semibold text-slate-200">{doc.name}</p>
                          <p className="text-[10px] text-slate-400">Vencimiento: {doc.expiration_date}</p>
                        </div>
                        <StatusBadge status={doc.status} />
                      </div>
                    ))}
                    {clientDocuments.length === 0 && (
                      <p className="text-xs text-slate-500 py-2">Sin documentos archivados.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[350px] flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-900/50 border border-dashed border-slate-800 text-center text-slate-500">
              <Building2 className="w-12 h-12 mb-3 text-slate-700" />
              <h3 className="text-sm font-semibold text-slate-300">Selecciona un cliente</h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Consulta su información completa, puestos contratados, guardas, incidentes y documentos.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center">
                <Building2 className="w-4 h-4 mr-2 text-cyan-400" />
                {editingClient ? 'Editar Cliente' : 'Crear Nuevo Cliente'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre o Razón Social *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Centro Comercial Santa Fe & Plaza Norte"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">NIT o Documento *</label>
                  <input
                    type="text"
                    required
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    placeholder="900.561.229-8"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+57 (601) 678-2000"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operaciones@cliente.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Dirección Principal</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Autopista Norte # 185-45, Bogotá"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Persona de Contacto / Cargo</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Marcela Quintana - Jefe de Seguridad Física"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden focus:border-cyan-500"
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
                  {editingClient ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
