import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  X,
  ChevronLeft,
  ChevronRight,
  List,
  CalendarDays,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { dbManager } from '../lib/supabaseClient';
import { Shift, ShiftType, ShiftStatus } from '../types/database';
import { StatusBadge } from '../components/StatusBadges';

export const ShiftsView: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>(dbManager.getShifts());
  const [guards, setGuards] = useState(dbManager.getGuards());
  const [sites, setSites] = useState(dbManager.getSites());
  const [supervisors, setSupervisors] = useState(dbManager.getSupervisors());

  const [viewMode, setViewMode] = useState<'CALENDARIO' | 'LISTA' | 'AGENDA'>('AGENDA');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Form states
  const [siteId, setSiteId] = useState('');
  const [guardId, setGuardId] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('18:00');
  const [shiftType, setShiftType] = useState<ShiftType>('DIURNO_6_18');
  const [status, setStatus] = useState<ShiftStatus>('PROGRAMADO');
  const [observations, setObservations] = useState('');

  const refreshShifts = () => {
    setShifts(dbManager.getShifts());
    setGuards(dbManager.getGuards());
    setSites(dbManager.getSites());
    setSupervisors(dbManager.getSupervisors());
  };

  useEffect(() => {
    const handleDataChange = () => refreshShifts();
    window.addEventListener('securitycrm_datachange', handleDataChange);
    return () => window.removeEventListener('securitycrm_datachange', handleDataChange);
  }, []);

  const openCreateModal = () => {
    setEditingShift(null);
    setConflictWarning(null);
    setSiteId(sites[0]?.id || '');
    setGuardId(guards[0]?.id || '');
    setSupervisorId(supervisors[0]?.id || '');
    setShiftDate(selectedDate);
    setStartTime('06:00');
    setEndTime('18:00');
    setShiftType('DIURNO_6_18');
    setStatus('PROGRAMADO');
    setObservations('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setConflictWarning(null);

    if (editingShift) {
      dbManager.updateShift(editingShift.id, {
        site_id: siteId,
        guard_id: guardId,
        supervisor_id: supervisorId,
        date: shiftDate,
        start_time: startTime,
        end_time: endTime,
        shift_type: shiftType,
        status,
        observations,
      });
      refreshShifts();
      setIsModalOpen(false);
    } else {
      const res = dbManager.createShift({
        site_id: siteId,
        guard_id: guardId,
        supervisor_id: supervisorId,
        date: shiftDate,
        start_time: startTime,
        end_time: endTime,
        shift_type: shiftType,
        status,
        observations,
      });

      if (res.error) {
        setConflictWarning(res.error);
        return;
      }

      refreshShifts();
      setIsModalOpen(false);
    }
  };

  const handleStatusChange = (shiftId: string, newStatus: ShiftStatus) => {
    dbManager.updateShift(shiftId, { status: newStatus });
    refreshShifts();
  };

  const shiftsOnSelectedDate = shifts.filter(s => s.date === selectedDate);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2 text-cyan-400" /> Programación y Cuadrante de Turnos
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Asignación de personal operativo con motor anti-conflicto de turnos superpuestos.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* View switcher buttons */}
          <div className="p-1 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-1">
            {(['AGENDA', 'CALENDARIO', 'LISTA'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === mode
                    ? 'bg-slate-800 text-cyan-400 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-900/40 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Asignar Turno</span>
          </button>
        </div>
      </div>

      {/* Date Navigation Strip */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-hidden"
          />
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            {new Date(selectedDate + 'T12:00:00Z').toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 font-bold">
            {shiftsOnSelectedDate.length} Turnos Programados
          </span>
        </div>
      </div>

      {/* AGENDA VIEW */}
      {viewMode === 'AGENDA' && (
        <div className="space-y-3">
          {shiftsOnSelectedDate.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 text-slate-500 space-y-2">
              <CalendarIcon className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">No hay turnos programados en esta fecha.</p>
              <button
                onClick={openCreateModal}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
              >
                Crear primer turno
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {shiftsOnSelectedDate.map((shift) => {
                const guard = guards.find(g => g.id === shift.guard_id);
                const site = sites.find(s => s.id === shift.site_id);
                const supervisor = supervisors.find(s => s.id === shift.supervisor_id);

                return (
                  <div
                    key={shift.id}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3 relative overflow-hidden shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={guard?.photo_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                          alt={guard?.name}
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-700"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-100">{guard?.name || 'Guarda'}</h4>
                          <span className="text-[10px] text-cyan-400 font-mono">{guard?.employee_code}</span>
                        </div>
                      </div>
                      <StatusBadge status={shift.status} />
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                      <p className="font-semibold text-slate-200 flex items-center truncate">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-cyan-400 shrink-0" />
                        <span className="truncate">{site?.name || 'Puesto'}</span>
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                        <span className="flex items-center font-mono">
                          <Clock className="w-3 h-3 mr-1 text-indigo-400" />
                          {shift.start_time} - {shift.end_time}
                        </span>
                        <span className="text-slate-300 font-medium">{shift.shift_type.replace(/_/g, ' ')}</span>
                      </div>
                    </div>

                    {supervisor && (
                      <p className="text-[11px] text-slate-400 flex items-center">
                        <UserCheck className="w-3.5 h-3.5 mr-1 text-slate-500" />
                        Supervisor: <span className="text-slate-300 ml-1 font-medium">{supervisor.name}</span>
                      </p>
                    )}

                    {shift.observations && (
                      <p className="text-[11px] text-slate-400 italic bg-slate-950/40 p-2 rounded border border-slate-800/80">
                        "{shift.observations}"
                      </p>
                    )}

                    {/* Quick status actions */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500">Cambiar estado:</span>
                      <div className="flex space-x-1">
                        {shift.status !== 'EN_CURSO' && (
                          <button
                            onClick={() => handleStatusChange(shift.id, 'EN_CURSO')}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-amber-950 text-slate-300 hover:text-amber-300 text-[10px] font-semibold border border-slate-700"
                          >
                            Iniciar
                          </button>
                        )}
                        {shift.status !== 'COMPLETADO' && (
                          <button
                            onClick={() => handleStatusChange(shift.id, 'COMPLETADO')}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 text-[10px] font-semibold border border-slate-700"
                          >
                            Completar
                          </button>
                        )}
                        {shift.status !== 'CANCELADO' && (
                          <button
                            onClick={() => handleStatusChange(shift.id, 'CANCELADO')}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 text-[10px] font-semibold border border-slate-700"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'LISTA' && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto shadow-xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Horario</th>
                <th className="py-3 px-4">Guarda Asignado</th>
                <th className="py-3 px-4">Puesto</th>
                <th className="py-3 px-4">Supervisor</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {shifts.map((shift) => {
                const guard = guards.find(g => g.id === shift.guard_id);
                const site = sites.find(s => s.id === shift.site_id);
                const supervisor = supervisors.find(s => s.id === shift.supervisor_id);

                return (
                  <tr key={shift.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-slate-300 font-mono whitespace-nowrap">{shift.date}</td>
                    <td className="py-3 px-4 text-cyan-400 font-mono whitespace-nowrap">{shift.start_time} - {shift.end_time}</td>
                    <td className="py-3 px-4 font-semibold text-slate-100">{guard?.name || 'Guarda'}</td>
                    <td className="py-3 px-4 text-slate-300">{site?.name || 'Puesto'}</td>
                    <td className="py-3 px-4 text-slate-400">{supervisor?.name || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-400">{shift.shift_type}</td>
                    <td className="py-3 px-4"><StatusBadge status={shift.status} /></td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => handleStatusChange(shift.id, 'CANCELADO')}
                        className="text-rose-400 hover:text-rose-300 text-[11px] font-semibold"
                      >
                        Cancelar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CALENDAR VIEW */}
      {viewMode === 'CALENDARIO' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <p className="text-xs text-slate-400">Distribución mensual de turnos operativos y carga horaria:</p>
          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
              <div key={d} className="font-bold text-slate-400 py-1 bg-slate-950/60 rounded border border-slate-800/80">{d}</div>
            ))}
            {Array.from({ length: 31 }, (_, i) => {
              const dayNum = i + 1;
              const dateStr = `2024-04-${dayNum.toString().padStart(2, '0')}`;
              const count = shifts.filter(s => s.date === dateStr).length;

              return (
                <div
                  key={i}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setViewMode('AGENDA');
                  }}
                  className={`min-h-[64px] p-1.5 rounded-lg border text-left cursor-pointer transition-colors ${
                    dateStr === selectedDate
                      ? 'bg-cyan-950/40 border-cyan-500'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] font-bold text-slate-400">{dayNum}</span>
                  {count > 0 && (
                    <div className="mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-600/20 text-cyan-300 border border-cyan-600/30 truncate">
                      {count} turnos
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Asignar / Crear Turno */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2 text-cyan-400" />
                Asignación de Turno Operativo
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Anti-Conflict Warning Banner */}
            {conflictWarning && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div>
                  <p className="font-bold">Conflicto de Programación Detectado</p>
                  <p className="mt-0.5 leading-relaxed">{conflictWarning}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Guarda de Seguridad *</label>
                <select
                  required
                  value={guardId}
                  onChange={(e) => setGuardId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden focus:border-cyan-500"
                >
                  {guards.map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({g.employee_code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Puesto de Vigilancia *</label>
                <select
                  required
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden focus:border-cyan-500"
                >
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Fecha *</label>
                  <input
                    type="date"
                    required
                    value={shiftDate}
                    onChange={(e) => setShiftDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Hora Inicio *</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Hora Fin *</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tipo de Turno</label>
                  <select
                    value={shiftType}
                    onChange={(e) => setShiftType(e.target.value as ShiftType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                  >
                    <option value="DIURNO_6_18">DIURNO (06:00 - 18:00)</option>
                    <option value="NOCTURNO_18_6">NOCTURNO (18:00 - 06:00)</option>
                    <option value="TURNO_12H">TURNO 12H</option>
                    <option value="TURNO_8H">TURNO 8H</option>
                    <option value="REFUERZO">REFUERZO OPERATIVO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Supervisor a Cargo</label>
                  <select
                    value={supervisorId}
                    onChange={(e) => setSupervisorId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                  >
                    {supervisors.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Observaciones / Consigna Especial</label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={2}
                  placeholder="Instrucciones sobre llaves, libros de minuta o relevo..."
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
                  Asignar y Verificar Conflicto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
