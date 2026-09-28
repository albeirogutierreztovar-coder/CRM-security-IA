import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  ClipboardCheck,
  X,
  Shield
} from 'lucide-react';
import { dbManager } from '../lib/supabaseClient';
import { Supervisor } from '../types/database';
import { StatusBadge } from '../components/StatusBadges';

export const SupervisorsView: React.FC = () => {
  const [supervisors, setSupervisors] = useState<Supervisor[]>(dbManager.getSupervisors());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [zone, setZone] = useState('');

  const refresh = () => {
    setSupervisors(dbManager.getSupervisors());
  };

  useEffect(() => {
    const handleDataChange = () => refresh();
    window.addEventListener('securitycrm_datachange', handleDataChange);
    return () => window.removeEventListener('securitycrm_datachange', handleDataChange);
  }, []);

  const openCreateModal = () => {
    setName('');
    setEmployeeCode('SUP-' + Math.floor(10 + Math.random() * 90));
    setPhone('+57 318 ' + Math.floor(1000000 + Math.random() * 9000000));
    setEmail('supervisor@seguridadandina.com.co');
    setZone('Zona Norte / Sabana');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !employeeCode) return;

    dbManager.createSupervisor({
      profile_id: 'user-' + Math.random().toString(36).substring(2, 7),
      name,
      employee_code: employeeCode,
      phone,
      email,
      zone,
      status: 'ACTIVO',
    });

    refresh();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center">
            <UserCheck className="w-5 h-5 mr-2 text-cyan-400" /> Cuerpo de Supervisores de Operaciones
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Supervisores motorizados, jefes de zona perimetral y auditores de listas de chequeo.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-900/40 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Vincular Supervisor</span>
        </button>
      </div>

      {/* Supervisors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {supervisors.map((sup) => {
          const inspectionsCount = dbManager.getInspections().filter(i => i.supervisor_id === sup.id).length;

          return (
            <div
              key={sup.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
                    {sup.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-100">{sup.name}</h3>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">{sup.employee_code}</span>
                  </div>
                </div>
                <StatusBadge status={sup.status} />
              </div>

              <div className="text-xs text-slate-400 space-y-1">
                <p className="flex items-center text-slate-300">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500 shrink-0" />
                  <span>{sup.zone || 'Zona general'}</span>
                </p>
                <p className="flex items-center text-slate-400">
                  <Phone className="w-3.5 h-3.5 mr-1 text-slate-500 shrink-0" />
                  <span>{sup.phone}</span>
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center font-medium">
                  <ClipboardCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  {inspectionsCount} Inspecciones realizadas
                </span>
                <span className="text-cyan-400 font-semibold">Zona Activa</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Vincular Supervisor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center">
                <UserCheck className="w-4 h-4 mr-2 text-cyan-400" />
                Vincular Nuevo Supervisor
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
                    placeholder="Javier Restrepo Gómez"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Código Empleado *</label>
                  <input
                    type="text"
                    required
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    placeholder="SUP-014"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+57 318 765 4321"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Correo</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="supervisor@seguridadandina.com.co"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Zona Operativa Asignada</label>
                <input
                  type="text"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  placeholder="Ej: Zona Norte (CC Norte, Torca)"
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
                  Vincular Supervisor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
