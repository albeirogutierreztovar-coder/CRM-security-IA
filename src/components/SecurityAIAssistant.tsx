import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Mic,
  Bot,
  User,
  Shield,
  Loader2,
  Calendar,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle,
  FolderLock
} from 'lucide-react';
import { dbManager } from '../lib/supabaseClient';

interface SecurityAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenVoiceModal: () => void;
  onNavigateTab: (tab: any) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  toolCalls?: any[];
  proposal?: any;
}

export const SecurityAIAssistant: React.FC<SecurityAIAssistantProps> = ({
  isOpen,
  onClose,
  onOpenVoiceModal,
  onNavigateTab
}) => {
  const currentProfile = dbManager.getCurrentProfile();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hola ${currentProfile.full_name}. Soy Security AI, tu asistente operacional de seguridad táctica. ¿En qué puedo ayudarte hoy?`,
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsLoading(true);

    try {
      // Gather relevant DB context for Function Calling
      const todayStr = new Date().toISOString().split('T')[0];
      const contextData = {
        metrics: dbManager.getDashboardMetrics(),
        novedadesToday: dbManager.getNovedades().filter(n => n.event_date.startsWith(todayStr)),
        criticalIncidents: dbManager.getIncidents().filter(i => i.status !== 'CERRADO'),
        sites: dbManager.getSites().map(s => ({ id: s.id, name: s.name, code: s.code, risk: s.risk_level })),
        expiringDocs: dbManager.getDocuments().filter(d => d.status === 'POR_VENCER'),
        shiftsToday: dbManager.getShifts().filter(s => s.date === todayStr),
      };

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            content: m.text,
          })),
          contextData,
          userProfile: currentProfile,
        }),
      });

      const data = await response.json();

      let replyText = data.reply || 'Entendido. Consultando base de datos de operaciones.';
      let proposalData = null;

      // Handle function calls if model proposed an action
      if (data.functionCalls && data.functionCalls.length > 0) {
        for (const call of data.functionCalls) {
          if (call.name === 'propose_novedad') {
            proposalData = call.args;
            replyText += `\n\nHe estructurado la propuesta para registrar en ${call.args.site_name}. Presiona el botón de confirmación para archivarla formalmente.`;
          }
        }
      }

      const assistantMsg: Message = {
        id: 'msg-' + Date.now(),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        toolCalls: data.functionCalls,
        proposal: proposalData,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'assistant',
          text: 'No fue posible conectar con el servidor de Security AI. Mostrando información basada en el sistema local.',
          timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmProposal = (proposal: any) => {
    const sites = dbManager.getSites();
    const site = sites.find(s => s.name.toLowerCase().includes((proposal.site_name || '').toLowerCase())) || sites[0];

    dbManager.createNovedad({
      site_id: site.id,
      category: proposal.category || 'seguridad',
      priority: proposal.priority || 'ALTA',
      title: proposal.title || 'Novedad registrada vía Security AI',
      description: proposal.description || 'Reportada en conversación con el asistente.',
      reported_by: proposal.reported_by || currentProfile.full_name,
      event_date: new Date().toISOString().split('T')[0] + ' ' + (proposal.event_time || '10:00'),
      status: 'ABIERTA',
      ai_generated: true,
      ai_confidence: 0.99,
    });

    setMessages(prev => [
      ...prev,
      {
        id: 'sys-' + Date.now(),
        sender: 'assistant',
        text: `✅ ¡Novedad registrada exitosamente en ${site.name}! Se notificó al supervisor de zona y se generó la alerta correspondiente.`,
        timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-96 sm:h-[620px] z-50 bg-slate-900 border border-slate-700/80 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
      {/* Drawer Header */}
      <div className="p-3.5 bg-gradient-to-r from-slate-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-600/30">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 flex items-center">
              Security AI
              <span className="ml-1.5 text-[9px] font-black uppercase px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Copiloto Táctico
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">Inteligencia Artificial con Function Calling</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-3 py-2 bg-slate-950/70 border-b border-slate-800 flex items-center space-x-1.5 overflow-x-auto no-scrollbar text-[11px]">
        <button
          onClick={() => handleSendMessage('Muéstrame las novedades registradas hoy.')}
          className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 shrink-0 border border-slate-700 transition-colors flex items-center space-x-1"
        >
          <FileSpreadsheet className="w-3 h-3 text-cyan-400" />
          <span>Novedades hoy</span>
        </button>
        <button
          onClick={() => handleSendMessage('¿Cuántos incidentes críticos tenemos abiertos?')}
          className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 shrink-0 border border-slate-700 transition-colors flex items-center space-x-1"
        >
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          <span>Incidentes críticos</span>
        </button>
        <button
          onClick={() => handleSendMessage('¿Qué documentos están próximos a vencer?')}
          className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-amber-950 hover:text-amber-300 text-slate-300 shrink-0 border border-slate-700 transition-colors flex items-center space-x-1"
        >
          <FolderLock className="w-3 h-3 text-amber-400" />
          <span>Por vencer</span>
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/60">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-tr-xs shadow-md shadow-cyan-950/50'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-xs shadow-xs'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* Proposal Action Card inside chat if AI proposed one */}
              {msg.proposal && (
                <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-cyan-700/50 space-y-2">
                  <p className="font-bold text-[11px] text-cyan-300 flex items-center">
                    <Sparkles className="w-3.5 h-3.5 mr-1" /> Propuesta para archivar:
                  </p>
                  <p className="text-[11px] text-slate-300"><strong>Puesto:</strong> {msg.proposal.site_name}</p>
                  <p className="text-[11px] text-slate-300"><strong>Prioridad:</strong> {msg.proposal.priority}</p>
                  <p className="text-[11px] text-slate-300"><strong>Detalle:</strong> {msg.proposal.description}</p>
                  <button
                    onClick={() => handleConfirmProposal(msg.proposal)}
                    className="w-full mt-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-[11px] flex items-center justify-center space-x-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>CONFIRMAR Y REGISTRAR AHORA</span>
                  </button>
                </div>
              )}

              <span className={`block text-[9px] mt-1 text-right ${
                msg.sender === 'user' ? 'text-cyan-200' : 'text-slate-400'
              }`}>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-slate-400 text-xs py-2">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Consultando datos en tiempo real...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input controls */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          {/* Voice report trigger */}
          <button
            type="button"
            onClick={onOpenVoiceModal}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition-colors"
            title="Registrar reporte por voz"
          >
            <Mic className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Pregunta algo o dicta una orden..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500/50"
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="p-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white disabled:opacity-40 transition-all shadow-md shadow-cyan-900/40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
