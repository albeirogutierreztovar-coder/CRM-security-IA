import React from 'react';
import {
  LayoutDashboard,
  Building2,
  MapPin,
  ShieldCheck,
  UserCheck,
  Calendar,
  AlertTriangle,
  FileSpreadsheet,
  ClipboardCheck,
  Users,
  FileText,
  FolderLock,
  Bell,
  Sparkles,
  History,
  Settings,
  X,
  Smartphone
} from 'lucide-react';
import { dbManager } from '../lib/supabaseClient';

export type ActiveTab = 
  | 'dashboard'
  | 'clients'
  | 'sites'
  | 'guards'
  | 'supervisors'
  | 'shifts'
  | 'novedades'
  | 'incidents'
  | 'supervisiones'
  | 'visits'
  | 'reports'
  | 'documents'
  | 'alerts'
  | 'security-ai'
  | 'audit'
  | 'settings'
  | 'mobile-guard';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onClose: () => void;
  activeAlertsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  activeAlertsCount
}) => {
  const currentProfile = dbManager.getCurrentProfile();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'DIRECTOR_OPERACIONES', 'SUPERVISOR', 'CLIENTE'] },
    { id: 'mobile-guard', label: 'Mi Turno (Móvil)', icon: Smartphone, highlight: true, roles: ['GUARDA', 'SUPERVISOR', 'SUPER_ADMIN', 'ADMIN_EMPRESA'] },
    { id: 'clients', label: 'Clientes', icon: Building2, roles: ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'DIRECTOR_OPERACIONES'] },
    { id: 'sites', label: 'Puestos', icon: MapPin, roles: ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'DIRECTOR_OPERACIONES', 'SUPERVISOR', 'CLIENTE'] },
    { id: 'guards', label: 'Guardas', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'DIRECTOR_OPERACIONES', 'SUPERVISOR'] },
    { id: 'supervisors', label: 'Supervisores', icon: UserCheck, roles: ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'DIRECTOR_OPERACIONES'] },
    { id: 'shifts', label: 'Turnos', icon: Calendar, roles: ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'DIRECTOR_OPERACIONES', 'SUPERVISOR', 'GUARDA'] },
    { id: 'novedades', label: 'Novedades', icon: FileSpreadsheet, roles: ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'DIRECTOR_OPERACIONES', 'SUPERVISOR', 'GUARDA', 'CLIENTE'] },
    { id: 'incidents', label: 'Incidentes', icon: AlertTriangle, roles: ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'DIRECTOR_OPERACIONES', 'SUPERVISOR', 'GUARDA', 'CLIENTE'] },
    { id: 'supervisiones', label: 'Supervisiones', icon: ClipboardCheck, roles: ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'DIRECTOR_OPERACIONES', 'SUPERVISOR'] },
    { id: 'visits', label: 'Visitas', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'DIRECTOR_OPERACIONES', 'SUPERVISOR', 'GUARDA', 'CLIENTE'] },
    { id: 'reports', label: 'Reportes', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'DIRECTOR_OPERACIONES', 'SUPERVISOR', 'CLIENTE'] },
    { id: 'documents', label: 'Documentos', icon: FolderLock, roles: ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'DIRECTOR_OPERACIONES', 'CLIENTE'] },
    { id: 'alerts', label: 'Alertas', icon: Bell, badge: activeAlertsCount, roles: ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'DIRECTOR_OPERACIONES', 'SUPERVISOR'] },
    { id: 'security-ai', label: 'Security AI', icon: Sparkles, special: true, roles: ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'DIRECTOR_OPERACIONES', 'SUPERVISOR', 'GUARDA', 'CLIENTE'] },
    { id: 'audit', label: 'Auditoría', icon: History, roles: ['SUPER_ADMIN', 'ADMIN_EMPRESA'] },
    { id: 'settings', label: 'Configuración', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN_EMPRESA'] },
  ];

  const allowedItems = navItems.filter(item => 
    !item.roles || item.roles.includes(currentProfile.role)
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out
        md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-white flex items-center">
                Security<span className="text-cyan-400">CRM</span>
                <span className="ml-1 text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">AI</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate max-w-[130px]">Vigilancia Andina</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as ActiveTab);
                  onClose();
                }}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group
                  ${isActive 
                    ? 'bg-gradient-to-r from-cyan-950/70 to-slate-800 text-cyan-300 border-l-2 border-cyan-400 font-semibold shadow-xs' 
                    : item.special
                    ? 'bg-indigo-950/30 text-indigo-300 hover:bg-indigo-900/40 border border-indigo-700/30'
                    : item.highlight
                    ? 'bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40 border border-emerald-600/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-cyan-400' : item.special ? 'text-indigo-400' : item.highlight ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                    {item.badge}
                  </span>
                )}
                {item.special && (
                  <span className="text-[10px] font-bold px-1 py-0.2 rounded bg-indigo-500/30 text-indigo-300">
                    VOZ
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tenant Organization card */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/50">
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-cyan-400 border border-slate-700">
                SA
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate">Vigilancia Andina</p>
                <div className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] text-slate-400">Multi-Empresa Activo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
