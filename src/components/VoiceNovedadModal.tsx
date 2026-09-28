import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  CheckCircle,
  Edit3,
  X,
  AlertCircle,
  Loader2,
  Volume2
} from 'lucide-react';
import { dbManager } from '../lib/supabaseClient';
import { PriorityLevel, NovedadCategory } from '../types/database';

interface VoiceNovedadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNovedadSaved: () => void;
}

export const VoiceNovedadModal: React.FC<VoiceNovedadModalProps> = ({
  isOpen,
  onClose,
  onNovedadSaved
}) => {
  const currentProfile = dbManager.getCurrentProfile();
  const sites = dbManager.getSites();

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Proposal state for human confirmation
  const [proposal, setProposal] = useState<{
    site_id: string;
    site_name: string;
    category: NovedadCategory;
    priority: PriorityLevel;
    title: string;
    description: string;
    event_time: string;
    reported_by: string;
  } | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'es-CO';

      rec.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
      };

      rec.onerror = (e: any) => {
        console.warn('Speech recognition warning/error:', e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  if (!isOpen) return null;

  const toggleRecording = () => {
    setError(null);
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      setProposal(null);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsRecording(true);
        } catch (e) {
          console.error(e);
          setIsRecording(true);
        }
      } else {
        // Speech API unsupported or simulated
        setIsRecording(true);
      }
    }
  };

  const handleSimulateVoice = (exampleText: string) => {
    setTranscript(exampleText);
    processVoiceToNovedad(exampleText);
  };

  const processVoiceToNovedad = async (textToProcess?: string) => {
    const text = textToProcess || transcript;
    if (!text.trim()) {
      setError('Por favor graba o escribe el reporte hablado.');
      return;
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/speech-to-novedad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          currentGuardName: currentProfile.full_name,
          currentSiteName: sites[0]?.name || 'Centro Comercial Norte',
          availableSites: sites.map(s => ({ id: s.id, name: s.name })),
        }),
      });

      const data = await response.json();
      if (data.proposal) {
        const p = data.proposal;
        // Match site_id
        const matchedSite = sites.find(s => 
          s.name.toLowerCase().includes((p.site_name || '').toLowerCase()) ||
          (p.site_name || '').toLowerCase().includes(s.name.toLowerCase())
        ) || sites[0];

        setProposal({
          site_id: matchedSite.id,
          site_name: matchedSite.name,
          category: (p.category as NovedadCategory) || 'seguridad',
          priority: (p.priority as PriorityLevel) || 'ALTA',
          title: p.title || 'Novedad registrada por voz',
          description: p.description || text,
          event_time: p.event_time || new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          reported_by: p.reported_by || currentProfile.full_name,
        });
      } else {
        setError('No se pudo estructurar la novedad con la IA.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Error al conectar con el servicio de IA. Intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmSave = () => {
    if (!proposal) return;

    dbManager.createNovedad({
      site_id: proposal.site_id,
      category: proposal.category,
      priority: proposal.priority,
      title: proposal.title,
      description: proposal.description,
      reported_by: proposal.reported_by,
      event_date: new Date().toISOString().split('T')[0] + ' ' + proposal.event_time,
      status: 'ABIERTA',
      ai_generated: true,
      ai_confidence: 0.98,
    });

    onNovedadSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-600/30">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center">
                Registro de Novedad por Voz
                <span className="ml-2 text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  AI Transcribe
                </span>
              </h3>
              <p className="text-xs text-slate-400">Habla con naturalidad; Security AI estructurará el informe.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!proposal ? (
            <div className="space-y-4">
              {/* Mic action button */}
              <div className="text-center py-6">
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl ${
                    isRecording
                      ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/50 scale-105'
                      : 'bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white hover:scale-105 shadow-cyan-600/30'
                  }`}
                >
                  {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                  {isRecording && (
                    <span className="absolute -inset-2 rounded-full border-2 border-rose-500/40 animate-ping pointer-events-none" />
                  )}
                </button>
                <p className="mt-3 text-xs font-semibold text-slate-300">
                  {isRecording ? 'Escuchando tu reporte... Haz clic para detener.' : 'Presiona para iniciar dictado de voz'}
                </p>
                <p className="text-[11px] text-slate-500">Micrófono en vivo en español</p>
              </div>

              {/* Transcript input / preview area */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Transcripción del reporte:</label>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Ej: 'Soy el guarda Carlos. Encontré la puerta de emergencia del parqueadero abierta a las diez de la noche y procedí a cerrarla...'"
                  rows={4}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500/50"
                />
              </div>

              {/* Quick test scenarios */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-400">O usa un caso de prueba del manual:</p>
                <div className="space-y-1">
                  <button
                    onClick={() => handleSimulateVoice(
                      "Soy el guarda Carlos. Estoy en el Centro Comercial Norte. Durante la ronda de las 10:15 encontré la puerta de emergencia del parqueadero abierta. No había personas en el lugar y procedí a asegurarla."
                    )}
                    className="w-full text-left p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-cyan-300 transition-colors"
                  >
                    🎯 Caso 1: Puerta de emergencia abierta en Centro Comercial Norte (10:15)
                  </button>
                  <button
                    onClick={() => handleSimulateVoice(
                      "Guarda Jhonathan en Parque Logístico Bodega B. Se presenta goteo fuerte de agua cerca al muelle 18 que amenaza con mojar cajas de mercancía. Ya se notificó a mantenimiento."
                    )}
                    className="w-full text-left p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-cyan-300 transition-colors"
                  >
                    🎯 Caso 2: Filtración de agua en bodega logística (Infraestructura)
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => processVoiceToNovedad()}
                  disabled={!transcript.trim() || isProcessing}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-cyan-900/30 flex items-center space-x-1.5 transition-all"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Estructurando con IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Procesar con Security AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Human In The Loop Confirmation Screen */
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-cyan-900/40">
                  <span className="text-xs font-bold text-cyan-300 flex items-center">
                    <Sparkles className="w-4 h-4 mr-1.5 text-cyan-400" />
                    Propuesta generada por Security AI
                  </span>
                  <span className="text-[10px] text-slate-400">Requiere confirmación humana</span>
                </div>

                {isEditing ? (
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400">Puesto:</label>
                      <select
                        value={proposal.site_id}
                        onChange={(e) => {
                          const s = sites.find(x => x.id === e.target.value);
                          setProposal({ ...proposal, site_id: e.target.value, site_name: s?.name || '' });
                        }}
                        className="w-full mt-1 p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                      >
                        {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-400">Categoría:</label>
                        <select
                          value={proposal.category}
                          onChange={(e) => setProposal({ ...proposal, category: e.target.value as NovedadCategory })}
                          className="w-full mt-1 p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                        >
                          {['seguridad', 'infraestructura', 'comportamiento', 'acceso', 'equipo', 'vehículo', 'personal', 'cliente', 'mantenimiento', 'emergencia', 'otra'].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400">Prioridad:</label>
                        <select
                          value={proposal.priority}
                          onChange={(e) => setProposal({ ...proposal, priority: e.target.value as PriorityLevel })}
                          className="w-full mt-1 p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                        >
                          {['BAJA', 'MEDIA', 'ALTA', 'CRÍTICA'].map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400">Título:</label>
                      <input
                        type="text"
                        value={proposal.title}
                        onChange={(e) => setProposal({ ...proposal, title: e.target.value })}
                        className="w-full mt-1 p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400">Descripción detallada:</label>
                      <textarea
                        value={proposal.description}
                        onChange={(e) => setProposal({ ...proposal, description: e.target.value })}
                        rows={3}
                        className="w-full mt-1 p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Puesto:</span>
                      <span className="font-semibold text-slate-200 text-right">{proposal.site_name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Categoría:</span>
                      <span className="font-medium text-cyan-300 capitalize">{proposal.category}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Prioridad:</span>
                      <span className={`font-bold ${
                        proposal.priority === 'CRÍTICA' ? 'text-rose-400' : proposal.priority === 'ALTA' ? 'text-amber-400' : 'text-blue-400'
                      }`}>
                        {proposal.priority}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Hora:</span>
                      <span className="font-medium text-slate-300">{proposal.event_time}</span>
                    </div>
                    <div className="py-1">
                      <span className="text-slate-400 block mb-1">Título:</span>
                      <p className="font-semibold text-slate-100">{proposal.title}</p>
                    </div>
                    <div className="py-1">
                      <span className="text-slate-400 block mb-1">Descripción:</span>
                      <p className="text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                        {proposal.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons: CONFIRMAR, EDITAR, CANCELAR */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setProposal(null);
                    setIsEditing(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Descartar / Repetir
                </button>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-slate-700 flex items-center space-x-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditing ? 'Ver Resumen' : 'Editar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmSave}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-900/40 flex items-center space-x-1.5 transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>CONFIRMAR Y REGISTRAR</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
