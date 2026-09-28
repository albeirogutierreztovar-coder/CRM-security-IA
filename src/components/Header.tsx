import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Sparkles,
  User,
  Shield,
  Building,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { dbManager } from '../lib/supabaseClient';
import { DEMO_PROFILES } from '../lib/mockData';
import { UserRole } from '../types/database';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenAI: () => void;
  activeAlertsCount: number;
  onProfileChange?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenSearch,
  onOpenNotifications,
  onOpenAI,
  activeAlertsCount,
  onProfileChange
}) => {
  const currentProfile = dbManager.getCurrentProfile();
  const organization = dbManager.getOrganization();
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const handleSelectProfile = (profileId: string) => {
    const target = DEMO_PROFILES.find(p => p.id === profileId);
    if (target) {
      dbManager.setCurrentProfile(target);
      setShowRoleSelector(false);
      if (onProfileChange) onProfileChange();
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'ADMIN_EMPRESA': return 'Gerencia General';
      case 'DIRECTOR_OPERACIONES': return 'Director Operaciones';
      case 'SUPERVISOR': return 'Supervisor Zona';
      case 'GUARDA': return 'Guarda de Seguridad';
      case 'CLIENTE': return 'Portal Cliente';
    }
  };

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between">
      {/* Left section: Hamburger & Global Search */}
      <div className="flex items-center space-x-3 md:space-x-4 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <button
          onClick={onOpenSearch}
          className="flex items-center w-full max-w-md px-3.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300 text-xs transition-all shadow-inner group"
        >
          <Search className="w-3.5 h-3.5 mr-2.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          <span className="truncate">Buscar clientes, puestos, guardas, novedades...</span>
          <kbd className="hidden sm:inline-block ml-auto px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-800/80 rounded border border-slate-700">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right section: Enterprise badge, AI trigger, Notification, Role Switcher */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Active Company badge (hidden on extra small) */}
        <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800/70 border border-slate-700/60 text-xs text-slate-300">
          <Building className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-medium text-slate-200 truncate max-w-[170px]">{organization.name}</span>
        </div>

        {/* Security AI trigger button */}
        <button
          onClick={onOpenAI}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-cyan-900/30 transition-all hover:scale-102 active:scale-98"
        >
          <Sparkles className="w-3.5 h-3.5 animate-spin-slow text-cyan-200" />
          <span className="hidden sm:inline">Security AI</span>
          <span className="sm:hidden">IA</span>
        </button>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Centro de Alertas"
        >
          <Bell className="w-4 h-4" />
          {activeAlertsCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-pulse" />
          )}
        </button>

        {/* Role & User Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleSelector(!showRoleSelector)}
            className="flex items-center space-x-2 p-1.5 pl-2 rounded-lg hover:bg-slate-800/80 border border-slate-800 transition-all"
          >
            {currentProfile.avatar_url ? (
              <img
                src={currentProfile.avatar_url}
                alt={currentProfile.full_name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-cyan-500/40"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-cyan-600 flex items-center justify-center text-xs font-bold text-white">
                {currentProfile.full_name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="hidden md:block text-left text-xs leading-tight">
              <p className="font-semibold text-slate-200 truncate max-w-[120px]">{currentProfile.full_name}</p>
              <p className="text-[10px] text-cyan-400 font-medium">{getRoleLabel(currentProfile.role)}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Role selector dropdown menu */}
          {showRoleSelector && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-2 py-2.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 pb-2 mb-2 border-b border-slate-800">
                <p className="text-xs font-bold text-slate-200">Simular Rol / Perfil Demo</p>
                <p className="text-[11px] text-slate-400">Prueba los permisos y vistas de cada actor:</p>
              </div>

              <div className="space-y-1">
                {DEMO_PROFILES.map((p) => {
                  const isCurrent = p.id === currentProfile.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectProfile(p.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                        isCurrent ? 'bg-cyan-950/60 border border-cyan-800/50 text-cyan-300' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        <img
                          src={p.avatar_url}
                          alt={p.full_name}
                          className="w-6 h-6 rounded-full object-cover shrink-0"
                        />
                        <div className="truncate">
                          <p className="font-medium truncate">{p.full_name}</p>
                          <p className="text-[10px] text-slate-400">{getRoleLabel(p.role)}</p>
                        </div>
                      </div>
                      {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
