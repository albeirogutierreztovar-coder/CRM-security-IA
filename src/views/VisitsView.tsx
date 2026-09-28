import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Clock,
  MapPin,
  X,
  CheckCircle,
  Truck,
  Shield,
  FileText
} from 'lucide-react';
import { dbManager } from '../lib/supabaseClient';
import { Visit } from '../types/database';

export const VisitsView: React.FC = () => {
  const [visits, setVisits] = useState<Visit[]>(dbManager.getVisits());
  const [sites, setSites] = useState(dbManager.getSites());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [siteId, setSiteId] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorDocument, setVisitorDocument] = useState('');
  const [visitType, setVisitType] = useState<Visit['visit_type']>('CONTRATISTA');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [observations, setObservations] = useState('');

  const refresh = () => {
    setVisits(dbManager.getVisits());
    setSites(dbManager.getSites());
  };

  useEffect(() => {
    const handleDataChange = () => refresh();
    window.addEventListener('securitycrm_datachange', handleDataChange);
    return () => window.removeEventListener('securitycrm_datachange', handleDataChange);
  }, []);

  const openCreateModal = () => {
    setSiteId(sites[0]?.id || '');
    setVisitorName('');
    setVisitorDocument('CC ');
    setVisitType('CONTRATISTA');
    setVehiclePlate('');
    setBadgeNumber('ESC-' + Math.floor(10 + Math.random() * 90));
    setObservations('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName || !visitorDocument || !siteId) return;

    dbManager.createVisit({
      site_id: siteId,
      visitor_name: visitorName,
      visitor_document: visitorDocument,
      visit_type: visitType,
      vehicle_plate: vehiclePlate,
      entry_time: new Date().toISOString().replace('T', ' ').slice(0, 16),
      badge_number: badgeNumber,
      observations: observations || 'Ingreso autorizado conforme a minuta.',
    });

    refresh();
    setIsModalOpen(false);
  };

  const handleMarkExit = (visitId: string) => {
    dbManager.updateVisit(visitId, {
      exit_time: new Date().toISOString().replace('T', ' ').slice(0, 16),
    });
    refresh();
  };

  const filteredVisits = visits.filter(v =>
    v.visitor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.visitor_document.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.vehicle_plate && v.vehicle_plate.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center">
            <Users className="w-5 h-5 mr-2 text-cyan-400" /> Minuta y Control de Acceso de Visitantes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registro peatonal y vehicular de contratistas, proveedores, auditorías y particulares en porterías.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-900/40 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Entrada</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="flex items-center px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs max-w-sm">
        <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar visitante por nombre, cédula o placa..."
          className="w-full bg-transparent text-slate-200 placeholder-slate-500 focus:outline-hidden"
        />
      </div>

      {/* Visits Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
              <th className="py-3 px-4">Visitante</th>
              <th className="py-3 px-4">Documento</th>
              <th className="py-3 px-4">Tipo</th>
              <th className="py-3 px-4">Puesto</th>
              <th className="py-3 px-4">Placa / Escarapela</th>
              <th className="py-3 px-4">Hora Entrada</th>
              <th className="py-3 px-4">Hora Salida</th>
              <th className="py-3 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredVisits.map((visit) => {
              const site = sites.find(s => s.id === visit.site_id);
              const isInside = !visit.exit_time;

              return (
                <tr key={visit.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-100">{visit.visitor_name}</td>
                  <td className="py-3 px-4 text-slate-300 font-mono">{visit.visitor_document}</td>
                  <td className="py-3 px-4 capitalize text-slate-300">{visit.visit_type}</td>
                  <td className="py-3 px-4 text-slate-300">{site?.name || 'Puesto'}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono">
                    {visit.vehicle_plate || 'Peatonal'} {visit.badge_number && `(${visit.badge_number})`}
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-mono">{visit.entry_time}</td>
                  <td className="py-3 px-4 font-mono">
                    {visit.exit_time ? (
                      <span className="text-slate-400">{visit.exit_time}</span>
                    ) : (
                      <span className="text-emerald-400 font-bold flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />
                        En Instalaciones
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {isInside ? (
                      <button
                        onClick={() => handleMarkExit(visit.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-700 text-[11px] font-semibold transition-colors"
                      >
                        Registrar Salida
                      </button>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Finalizado</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Registrar Entrada */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center">
                <Users className="w-4 h-4 mr-2 text-cyan-400" />
                Registrar Ingreso de Visitante
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Puesto de Vigilancia / Portería *</label>
                <select
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                >
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="Mauricio Gallego"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Documento de Identidad *</label>
                  <input
                    type="text"
                    required
                    value={visitorDocument}
                    onChange={(e) => setVisitorDocument(e.target.value)}
                    placeholder="CC 79.443.219"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tipo de Visita</label>
                  <select
                    value={visitType}
                    onChange={(e) => setVisitType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                  >
                    <option value="CONTRATISTA">CONTRATISTA</option>
                    <option value="PROVEEDOR">PROVEEDOR</option>
                    <option value="CLIENTE">CLIENTE</option>
                    <option value="AUTORIDAD">AUTORIDAD</option>
                    <option value="PARTICULAR">PARTICULAR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Placa Vehicular</label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    placeholder="SSX-812"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Escarapela</label>
                  <input
                    type="text"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    placeholder="ESC-012"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Observaciones / Motivo de Entrada</label>
                <textarea
                  rows={2}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Mantenimiento preventivo, entrega de paquete, etc."
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
                  Registrar Ingreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
