import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Clock,
  Edit2,
  Trash2,
  X,
  FileSpreadsheet,
  AlertTriangle,
  Award,
  UserCheck
} from 'lucide-react';
import { dbManager } from '../lib/supabaseClient';
import { Guard, Shift, Novedad } from '../types/database';
import { StatusBadge, PriorityBadge } from '../components/StatusBadges';

export const GuardsView: React.FC = () => {
  const [guards, setGuards] = useState<Guard[]>(dbManager.getGuards());
  const [sites, setSites] = useState(dbManager.getSites());
  const [selectedGuard, setSelectedGuard] = useState<Guard | null>(guards[0] || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuard, setEditingGuard] = useState<Guard | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('');
  const [hireDate, setHireDate] = useState('2023-01-15');
  const [status, setStatus] = useState<Guard['status']>('ACTIVO');
  const [photoUrl, setPhotoUrl] = useState('');
  const [assignedSiteId, setAssignedSiteId] = useState('');

  const refreshGuards = () => {
    const g = dbManager.getGuards();
    setGuards(g);
    setSites(dbManager.getSites());
    if (selectedGuard) {
      const updated = g.find(x => x.id === selectedGuard.id);
      if (updated) setSelectedGuard(updated);
    }
  };

  useEffect(() => {
    const handleDataChange = () => refreshGuards();
    window.addEventListener('securitycrm_datachange', handleDataChange);
    return () => window.removeEventListener('securitycrm_datachange', handleDataChange);
  }, []);

  const openCreateModal = () => {
    setEditingGuard(null);
    setName('');
    setDocumentNumber('CC ' + Math.floor(10000000 + Math.random() * 90000000));
    setEmployeeCode('GRD-' + Math.floor(200 + Math.random() * 300));
    setPhone('+57 31' + Math.floor(10000000 + Math.random() * 90000000));
    setEmail('guarda@seguridadandina.com.co');
    setPosition('Guarda Operativo Control de Acceso');
    setHireDate(new Date().toISOString().split('T')[0]);
    setStatus('ACTIVO');
    setPhotoUrl('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80');
    setAssignedSiteId(sites[0]?.id || '');
    setIsModalOpen(true);
  };

  const openEditModal = (guard: Guard) => {
    setEditingGuard(guard);
    setName(guard.name);
    setDocumentNumber(guard.document_number);
    setEmployeeCode(guard.employee_code);
    setPhone(guard.phone);
    setEmail(guard.email);
    setPosition(guard.position);
    setHireDate(guard.hire_date);
    setStatus(guard.status);
    setPhotoUrl(guard.photo_url || '');
    setAssignedSiteId(guard.assigned_site_id || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !documentNumber || !employeeCode) return;

    if (editingGuard) {
      dbManager.updateGuard(editingGuard.id, {
        name,
        document_number: documentNumber,
        employee_code: employeeCode,
        phone,
        email,
        position,
        hire_date: hireDate,
        status,
        photo_url: photoUrl,
        assigned_site_id: assignedSiteId,
      });
    } else {
      dbManager.createGuard({
        profile_id: 'user-' + Math.random().toString(36).substring(2, 7),
        name,
        document_number: documentNumber,
        employee_code: employeeCode,
        phone,
        email,
        position,
        hire_date: hireDate,
        status,
        photo_url: photoUrl,
        assigned_site_id: assignedSiteId,
      });
    }

    refreshGuards();
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar guarda de la nómina activa?')) {
      dbManager.deleteGuard(id);
      if (selectedGuard?.id === id) setSelectedGuard(null);
      refreshGuards();
    }
  };

  const filteredGuards = guards.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          g.document_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          g.employee_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || g.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Guard relations
  const guardShifts = selectedGuard
    ? dbManager.getShifts().filter(s => s.guard_id === selectedGuard.id)
    : [];

  const guardNovedades = selectedGuard
    ? dbManager.getNovedades().filter(n => n.reported_by.toLowerCase().includes(selectedGuard.name.toLowerCase()))
    : [];

  const assignedSite = selectedGuard?.assigned_site_id
    ? sites.find(s => s.id === selectedGuard.assigned_site_id)
    : null;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center">
            <ShieldCheck className="w-5 h-5 mr-2 text-cyan-400" /> Roster de Personal Operativo (Guardas)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Fichas técnicas, dotación, asignaciones de puestos y control de asistencia laboral.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-900/40 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Vincular Guarda</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, cédula o código GRD..."
            className="w-full bg-transparent text-slate-200 placeholder-slate-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Estado Laboral:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-hidden"
          >
            <option value="all">Todos los estados</option>
            <option value="ACTIVO">Activo</option>
            <option value="VACACIONES">Vacaciones</option>
            <option value="LICENCIA">Licencia</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Guards Cards + Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Guards List */}
        <div className="lg:col-span-5 space-y-3">
          {filteredGuards.map((guard) => {
            const isSelected = selectedGuard?.id === guard.id;
            const site = sites.find(s => s.id === guard.assigned_site_id);

            return (
              <div
                key={guard.id}
                onClick={() => setSelectedGuard(guard)}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                  isSelected 
                    ? 'bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-950/30' 
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={guard.photo_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                      alt={guard.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-700"
                    />
                    <div>
                      <h3 className="text-xs font-bold text-slate-100">{guard.name}</h3>
                      <p className="text-[11px] text-cyan-400 font-mono mt-0.5">{guard.employee_code} • {guard.document_number}</p>
                    </div>
                  </div>
                  <StatusBadge status={guard.status} />
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <p className="text-slate-300 font-medium">{guard.position}</p>
                  <p className="flex items-center text-slate-400 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500 shrink-0" />
                    <span className="truncate">{site?.name || 'Puesto flotante / Disponible'}</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Tel: {guard.phone}</span>

                  <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEditModal(guard)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(guard.id)}
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

        {/* Guard 360 Full File */}
        <div className="lg:col-span-7">
          {selectedGuard ? (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5 animate-in fade-in duration-150">
              {/* Header Profile */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-4">
                  <img
                    src={selectedGuard.photo_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                    alt={selectedGuard.name}
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-cyan-500/50 shadow-md"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-base font-bold text-white">{selectedGuard.name}</h2>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-bold border border-cyan-800/60">
                        {selectedGuard.employee_code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium mt-0.5">{selectedGuard.position}</p>
                    <p className="text-xs text-slate-400 mt-1 font-mono">{selectedGuard.document_number}</p>
                  </div>
                </div>

                <StatusBadge status={selectedGuard.status} />
              </div>

              {/* Data Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Fecha Ingreso</span>
                  <p className="text-xs font-semibold text-slate-200 mt-0.5">{selectedGuard.hire_date}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Teléfono</span>
                  <p className="text-xs font-semibold text-slate-200 mt-0.5 truncate">{selectedGuard.phone}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Turnos Hist.</span>
                  <p className="text-sm font-bold text-indigo-400 mt-0.5">{guardShifts.length}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Novedades</span>
                  <p className="text-sm font-bold text-purple-400 mt-0.5">{guardNovedades.length}</p>
                </div>
              </div>

              {/* Puesto Asignado */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-cyan-400" /> Puesto de Trabajo Asignado
                </h4>
                {assignedSite ? (
                  <div className="pt-1 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-100">{assignedSite.name}</p>
                      <p className="text-[11px] text-slate-400">{assignedSite.address} • Riesgo: {assignedSite.risk_level}</p>
                    </div>
                    <span className="text-cyan-400 font-mono text-xs font-bold">{assignedSite.code}</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-1">Sin puesto fijo asignado actualmente.</p>
                )}
              </div>

              {/* Turnos Programados */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-indigo-400" /> Historial de Turnos y Asistencia ({guardShifts.length})
                </h4>
                <div className="space-y-1.5">
                  {guardShifts.slice(0, 4).map(shift => {
                    const site = sites.find(s => s.id === shift.site_id);
                    return (
                      <div key={shift.id} className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800 text-xs">
                        <div>
                          <p className="font-semibold text-slate-200">{site?.name || 'Puesto'}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{shift.date} • {shift.start_time} - {shift.end_time} ({shift.shift_type})</p>
                        </div>
                        <StatusBadge status={shift.status} />
                      </div>
                    );
                  })}
                  {guardShifts.length === 0 && (
                    <p className="text-xs text-slate-500 py-2">Sin turnos programados en el registro.</p>
                  )}
                </div>
              </div>

              {/* Novedades reportadas */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-purple-400" /> Novedades Reportadas por el Guarda ({guardNovedades.length})
                </h4>
                <div className="space-y-1.5">
                  {guardNovedades.map(nov => (
                    <div key={nov.id} className="p-2.5 rounded bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{nov.title}</span>
                        <PriorityBadge priority={nov.priority} />
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{nov.description}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{nov.event_date}</p>
                    </div>
                  ))}
                  {guardNovedades.length === 0 && (
                    <p className="text-xs text-slate-500 py-2">No ha reportado novedades hasta la fecha.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-8 rounded-2xl bg-slate-900/50 border border-dashed border-slate-800 text-slate-500 text-sm">
              Selecciona un guarda para ver su expediente operativo.
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear / Editar Guarda */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center">
                <ShieldCheck className="w-4 h-4 mr-2 text-cyan-400" />
                {editingGuard ? 'Editar Guarda' : 'Vincular Guarda Operativo'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Carlos Andrés Benítez"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Código Empleado *</label>
                  <input
                    type="text"
                    required
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    placeholder="GRD-101"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cédula de Ciudadanía *</label>
                  <input
                    type="text"
                    required
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="CC 80.123.456"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Teléfono Móvil</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+57 312 345 6789"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cargo / Especialidad</label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Guarda Operativo Control de Acceso"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Estado</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="VACACIONES">VACACIONES</option>
                    <option value="LICENCIA">LICENCIA</option>
                    <option value="INACTIVO">INACTIVO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Puesto Asignado por Defecto</label>
                <select
                  value={assignedSiteId}
                  onChange={(e) => setAssignedSiteId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                >
                  <option value="">Sin puesto fijo (Flotante / Relevos)</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
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
                  {editingGuard ? 'Guardar Cambios' : 'Vincular Guarda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
