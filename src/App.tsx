import React, { useState, useEffect } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Header } from './components/Header';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { VoiceNovedadModal } from './components/VoiceNovedadModal';
import { SecurityAIAssistant } from './components/SecurityAIAssistant';

// Views
import { DashboardView } from './views/DashboardView';
import { ClientsView } from './views/ClientsView';
import { SitesView } from './views/SitesView';
import { GuardsView } from './views/GuardsView';
import { SupervisorsView } from './views/SupervisorsView';
import { ShiftsView } from './views/ShiftsView';
import { NovedadesView } from './views/NovedadesView';
import { IncidentsView } from './views/IncidentsView';
import { SupervisionesView } from './views/SupervisionesView';
import { VisitsView } from './views/VisitsView';
import { ReportsView } from './views/ReportsView';
import { DocumentsView } from './views/DocumentsView';
import { AlertsView } from './views/AlertsView';
import { AuditView } from './views/AuditView';
import { SettingsView } from './views/SettingsView';
import { MobileGuardView } from './views/MobileGuardView';

import { dbManager } from './lib/supabaseClient';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [activeAlertsCount, setActiveAlertsCount] = useState(
    dbManager.getAlerts().filter(a => a.status === 'ACTIVA').length
  );

  const updateAlertsCount = () => {
    setActiveAlertsCount(dbManager.getAlerts().filter(a => a.status === 'ACTIVA').length);
  };

  useEffect(() => {
    const handleDataChange = () => {
      updateAlertsCount();
    };
    window.addEventListener('securitycrm_datachange', handleDataChange);
    return () => window.removeEventListener('securitycrm_datachange', handleDataChange);
  }, []);

  const handleProfileChange = () => {
    const current = dbManager.getCurrentProfile();
    if (current.role === 'GUARDA') {
      setActiveTab('mobile-guard');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleNavigateTab = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeAlertsCount={activeAlertsCount}
      />

      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col flex-1 min-w-0">
        {/* Sticky Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onOpenAI={() => setAiAssistantOpen(true)}
          activeAlertsCount={activeAlertsCount}
          onProfileChange={handleProfileChange}
        />

        {/* View Content Body */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto pb-24">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigateTab={handleNavigateTab}
              onOpenVoiceModal={() => setVoiceModalOpen(true)}
            />
          )}

          {activeTab === 'mobile-guard' && (
            <MobileGuardView
              onOpenVoiceModal={() => setVoiceModalOpen(true)}
              onOpenAI={() => setAiAssistantOpen(true)}
              onNavigateTab={handleNavigateTab}
            />
          )}

          {activeTab === 'clients' && <ClientsView />}
          {activeTab === 'sites' && <SitesView />}
          {activeTab === 'guards' && <GuardsView />}
          {activeTab === 'supervisors' && <SupervisorsView />}
          {activeTab === 'shifts' && <ShiftsView />}

          {activeTab === 'novedades' && (
            <NovedadesView onOpenVoiceModal={() => setVoiceModalOpen(true)} />
          )}

          {activeTab === 'incidents' && <IncidentsView />}
          {activeTab === 'supervisiones' && <SupervisionesView />}
          {activeTab === 'visits' && <VisitsView />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'documents' && <DocumentsView />}
          {activeTab === 'alerts' && <AlertsView />}
          {activeTab === 'audit' && <AuditView />}
          {activeTab === 'settings' && <SettingsView />}
          {activeTab === 'security-ai' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-extrabold text-white flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-cyan-400" /> Security AI — Copiloto de Mando Operacional
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Asistente de inteligencia artificial conectado a la base de datos de seguridad mediante Function Calling.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4 max-w-md mx-auto py-12">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 mx-auto flex items-center justify-center text-white shadow-xl shadow-cyan-900/40">
                  <Sparkles className="w-8 h-8 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Canal Interactivo de Voz y Texto</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Puedes consultar novedades del día, incidentes críticos, horarios de guardas o registrar novedades por voz.
                  </p>
                </div>
                <button
                  onClick={() => setAiAssistantOpen(true)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/40"
                >
                  Abrir Consola Security AI
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Security AI trigger button (bottom-right of app) */}
      {!aiAssistantOpen && (
        <button
          onClick={() => setAiAssistantOpen(true)}
          className="fixed bottom-6 right-6 z-40 p-3.5 rounded-full bg-gradient-to-tr from-cyan-600 via-indigo-600 to-cyan-400 text-white shadow-2xl shadow-cyan-900/60 hover:scale-110 active:scale-95 transition-all flex items-center justify-center group ring-4 ring-cyan-500/20"
          title="Abrir Asistente Security AI"
        >
          <Sparkles className="w-6 h-6 animate-spin-slow" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 font-bold text-xs pl-0 group-hover:pl-2">
            Security AI
          </span>
        </button>
      )}

      {/* Floating Modals and Drawers */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setSearchOpen(false);
        }}
      />

      <NotificationCenterModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onNavigateToTab={(tab) => {
          setActiveTab(tab);
          setNotificationsOpen(false);
        }}
        onAlertsUpdated={updateAlertsCount}
      />

      <VoiceNovedadModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onNovedadSaved={() => {
          updateAlertsCount();
          setActiveTab('novedades');
        }}
      />

      <SecurityAIAssistant
        isOpen={aiAssistantOpen}
        onClose={() => setAiAssistantOpen(false)}
        onOpenVoiceModal={() => setVoiceModalOpen(true)}
        onNavigateTab={handleNavigateTab}
      />
    </div>
  );
}
