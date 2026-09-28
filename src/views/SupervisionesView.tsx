import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Plus,
  CheckCircle,
  XCircle,
  MinusCircle,
  Camera,
  MapPin,
  Calendar,
  X,
  Award,
  Search
} from 'lucide-react';
import { dbManager } from '../lib/supabaseClient';
import { Inspection, InspectionItem } from '../types/database';
import { StatusBadge } from '../components/StatusBadges';

export const SupervisionesView: React.FC = () => {
  const [inspections, setInspections] = useState<Inspection[]>(dbManager.getInspections());
  const [sites, setSites] = useState(dbManager.getSites());
  const [supervisors, setSupervisors] = useState(dbManager.getSupervisors());
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(inspections[0] || null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Inspection Checklist runner state
  const [siteId, setSiteId] = useState(sites[0]?.id || '');
  const [supervisorId, setSupervisorId] = useState(supervisors[0]?.id || '');
  const [inspectionType, setInspectionType] = useState<Inspection['inspection_type']>('RUTINARIA');
  const [observations, setObservations] = useState('');
  const [checklist, setChecklist] = useState<InspectionItem[]>([
    { id: '1', item: '¿Guarda presente y en su posición asignada?', status: 'CUMPLE' },
    { id: '2', item: '¿Uniforme reglamentario completo, pulcro y carnet visible?', status: 'CUMPLE' },
    { id: '3', item: '¿Armamento y dotación autorizada y en orden?', status: 'CUMPLE' },
    { id: '4', item: '¿Radio de comunicaciones funcionando y batería cargada?', status: 'CUMPLE' },
    { id: '5', item: '¿Libro de minuta actualizado al minuto y firmado?', status: 'CUMPLE' },
    { id: '6', item: '¿Puesto de trabajo limpio, ordenado y sin elementos ajenos?', status: 'CUMPLE' },
    { id: '7', item: '¿Sistemas de seguridad y botones de pánico operativos?', status: 'CUMPLE' },
    { id: '8', item: '¿Puertas y salidas de emergencia verificadas y aseguradas?', status: 'CUMPLE' },
  ]);

  const refresh = () => {
    setInspections(dbManager.getInspections());
    setSites(dbManager.getSites());
    setSupervisors(dbManager.getSupervisors());
  };

  useEffect(() => {
    const handleDataChange = () => refresh();
    window.addEventListener('securitycrm_datachange', handleDataChange);
    return () => window.removeEventListener('securitycrm_datachange', handleDataChange);
  }, []);

  const openCreateModal = () => {
    setSiteId(sites[0]?.id || '');
    setSupervisorId(supervisors[0]?.id || '');
    setInspectionType('RUTINARIA');
    setObservations('');
    setChecklist([
      { id: '1', item: '¿Guarda presente y en su posición asignada?', status: 'CUMPLE' },
      { id: '2', item: '¿Uniforme reglamentario completo, pulcro y carnet visible?', status: 'CUMPLE' },
      { id: '3', item: '¿Armamento y dotación autorizada y en orden?', status: 'CUMPLE' },
      { id: '4', item: '¿Radio de comunicaciones funcionando y batería cargada?', status: 'CUMPLE' },
      { id: '5', item: '¿Libro de minuta actualizado al minuto y firmado?', status: 'CUMPLE' },
      { id: '6', item: '¿Puesto de trabajo limpio, ordenado y sin elementos ajenos?', status: 'CUMPLE' },
      { id: '7', item: '¿Sistemas de seguridad y botones de pánico operativos?', status: 'CUMPLE' },
      { id: '8', item: '¿Puertas y salidas de emergencia verificadas y aseguradas?', status: 'CUMPLE' },
    ]);
    setIsModalOpen(true);
  };

  const handleToggleItem = (id: string, newStatus: 'CUMPLE' | 'NO_CUMPLE' | 'NO_APLICA') => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
  };

  const calculateScore = (items: InspectionItem[]) => {
    const applicable = items.filter(i => i.status !== 'NO_APLICA');
    if (applicable.length === 0) return 100;
    const complies = applicable.filter(i => i.status === 'CUMPLE').length;
    return Math.round((complies / applicable.length) * 100);
  };

  const handleSaveInspection = (e: React.FormEvent) => {
    e.preventDefault();
    const score = calculateScore(checklist);
    const result: Inspection['result'] = score >= 90 ? 'APROBADA' : score >= 70 ? 'OBSERVADA' : 'REPROBADA';

    const newInsp = dbManager.createInspection({
      site_id: siteId,
      supervisor_id: supervisorId,
      inspection_date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      inspection_type: inspectionType,
      result,
      score,
      observations: observations || 'Ronda de control perimetral ejecutada con normalidad.',
      items: checklist,
      photos: [
        'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&auto=format&fit=crop&q=80'
      ],
    });

    setSelectedInspection(newInsp);
    refresh();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center">
            <ClipboardCheck className="w-5 h-5 mr-2 text-cyan-400" /> Control de Supervisiones e Inspecciones en Puesto
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Auditorías de puesto, listas de chequeo normativas, calificación porcentual y minutas de control.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-900/40 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Ejecutar Inspección</span>
        </button>
      </div>

      {/* Main Grid: Inspections List + Inspection Audit Certificate */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Inspections History List */}
        <div className="lg:col-span-5 space-y-3">
          {inspections.map((insp) => {
            const isSelected = selectedInspection?.id === insp.id;
            const site = sites.find(s => s.id === insp.site_id);
            const sup = supervisors.find(s => s.id === insp.supervisor_id);

            return (
              <div
                key={insp.id}
                onClick={() => setSelectedInspection(insp)}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                  isSelected 
                    ? 'bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-950/30' 
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-100">{site?.name || 'Puesto'}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Supervisor: <strong className="text-slate-200">{sup?.name || 'Supervisor'}</strong>
                    </p>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                      insp.score >= 90 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {insp.score}%
                    </span>
                    <StatusBadge status={insp.result} />
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2">{insp.observations}</p>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{insp.inspection_date}</span>
                  <span className="uppercase text-slate-400 font-semibold">{insp.inspection_type}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Inspection Certificate Detail */}
        <div className="lg:col-span-7">
          {selectedInspection ? (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5 animate-in fade-in duration-150">
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                    ACTA DE SUPERVISIÓN: {selectedInspection.id}
                  </span>
                  <h2 className="text-base font-bold text-white mt-1">
                    {sites.find(s => s.id === selectedInspection.site_id)?.name}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Supervisor Evaluador: <strong className="text-slate-200">{supervisors.find(s => s.id === selectedInspection.supervisor_id)?.name}</strong>
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-2xl font-black text-cyan-400">{selectedInspection.score}%</div>
                  <StatusBadge status={selectedInspection.result} />
                </div>
              </div>

              {/* Checklist Items Result */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                  Resultados de Lista de Chequeo Operativa ({selectedInspection.items?.length || 0} Puntos)
                </h4>
                <div className="space-y-2">
                  {selectedInspection.items?.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-200 font-medium">{item.item}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'CUMPLE' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                          : item.status === 'NO_CUMPLE' 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observations */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Observaciones y Hallazgos del Supervisor
                </h4>
                <p className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  {selectedInspection.observations}
                </p>
              </div>

              {/* Photos */}
              {selectedInspection.photos && selectedInspection.photos.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center">
                    <Camera className="w-3.5 h-3.5 mr-1 text-cyan-400" /> Registro Fotográfico de Puesto
                  </h4>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {selectedInspection.photos.map((url, i) => (
                      <img key={i} src={url} alt="Inspección" className="w-full h-36 object-cover rounded-xl border border-slate-700" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-8 rounded-2xl bg-slate-900/50 border border-dashed border-slate-800 text-slate-500 text-sm">
              Selecciona una inspección para ver el acta completa.
            </div>
          )}
        </div>
      </div>

      {/* Modal Ejecutar Supervisión */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <h3 className="text-base font-bold text-white flex items-center">
                <ClipboardCheck className="w-4 h-4 mr-2 text-cyan-400" />
                Ejecución de Lista de Chequeo en Puesto
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInspection} className="space-y-4 text-xs overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Puesto a Inspeccionar *</label>
                  <select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                  >
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Supervisor Actuante *</label>
                  <select
                    value={supervisorId}
                    onChange={(e) => setSupervisorId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                  >
                    {supervisors.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Checklist items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300">Puntos de Verificación Táctica:</span>
                  <span className="text-cyan-400 font-mono font-bold">
                    Puntuación: {calculateScore(checklist)}%
                  </span>
                </div>

                <div className="space-y-2">
                  {checklist.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between space-x-3"
                    >
                      <span className="text-slate-200">{item.item}</span>
                      <div className="flex space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleItem(item.id, 'CUMPLE')}
                          className={`px-2 py-1 rounded text-[10px] font-bold ${
                            item.status === 'CUMPLE' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          Cumple
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleItem(item.id, 'NO_CUMPLE')}
                          className={`px-2 py-1 rounded text-[10px] font-bold ${
                            item.status === 'NO_CUMPLE' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          No cumple
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Observaciones / Hallazgos</label>
                <textarea
                  rows={2}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Detalles sobre presentación del guarda, novedad en puertas, etc."
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
                  Firmar y Finalizar Acta ({calculateScore(checklist)}%)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
