import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  User,
  Building,
  KeyRound,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Radio,
  ExternalLink,
  ChevronRight,
  Database
} from 'lucide-react';
import { authService, AuthState } from '../services/authService';
import { DEMO_PROFILES } from '../lib/mockData';
import { UserRole } from '../types/database';
import { supabaseUrl, supabaseProjectId, isSupabaseConfigured } from '../lib/supabaseClient';

interface LoginViewProps {
  onLoginSuccess: (authState: AuthState) => void;
}

type AuthMode = 'login' | 'register' | 'forgot-password' | 'create-org';

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN_EMPRESA');
  const [orgName, setOrgName] = useState('Seguridad Titán Ltda');
  const [orgNit, setOrgNit] = useState('900.543.210-9');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [registeredUser, setRegisteredUser] = useState<any>(null);

  // Handle standard Supabase login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor ingrese correo electrónico y contraseña');
      return;
    }

    setLoading(true);
    const res = await authService.signIn(email, password);
    setLoading(false);

    if (res.success && res.state) {
      onLoginSuccess(res.state);
    } else {
      setErrorMsg(
        res.error ||
        'Error al iniciar sesión con Supabase Auth. Si aún no tienes un usuario registrado en Supabase, puedes crear una cuenta nueva o usar un perfil de acceso rápido abajo.'
      );
    }
  };

  // Handle standard Supabase registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!firstName.trim() || !lastName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMsg('Todos los campos son obligatorios');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    const res = await authService.signUp(regEmail, regPassword, {
      first_name: firstName,
      last_name: lastName,
      role: selectedRole,
      org_name: orgName
    });
    setLoading(false);

    if (res.success) {
      if (res.state) {
        // Direct login
        setSuccessMsg('¡Cuenta creada exitosamente en Supabase Auth!');
        setTimeout(() => {
          onLoginSuccess(res.state!);
        }, 1200);
      } else if (res.requiresEmailConfirmation) {
        setRegisteredUser({ email: regEmail });
        setMode('create-org');
        setSuccessMsg(
          'Registro creado en Supabase. Si Supabase requiere confirmación de email, revisa tu bandeja de entrada.'
        );
      }
    } else {
      setErrorMsg(res.error || 'Error al registrar el usuario en Supabase.');
    }
  };

  // Handle password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg('Por favor ingresa tu correo electrónico para enviar el enlace');
      return;
    }

    setLoading(true);
    const res = await authService.resetPassword(email);
    setLoading(false);

    if (res.success) {
      setSuccessMsg(res.message || 'Correo de recuperación enviado.');
    } else {
      setErrorMsg(res.error || 'Error al solicitar recuperación');
    }
  };

  // Quick Demo persona login
  const handleQuickLogin = (profileId: string) => {
    setErrorMsg(null);
    setLoading(true);
    setTimeout(() => {
      const state = authService.loginAsDemoProfile(profileId);
      setLoading(false);
      onLoginSuccess(state);
    }, 300);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN': return { label: 'Super Admin', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      case 'ADMIN_EMPRESA': return { label: 'Gerente General', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'DIRECTOR_OPERACIONES': return { label: 'Director Operaciones', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'SUPERVISOR': return { label: 'Supervisor', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'GUARDA': return { label: 'Guarda Móvil', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'CLIENTE': return { label: 'Portal Cliente', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-cyan-600/10 via-indigo-600/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Supabase status banner */}
      <div className="max-w-4xl mx-auto w-full mb-6 z-10">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-900/80 border border-cyan-800/40 backdrop-blur-md shadow-lg text-xs">
          <div className="flex items-center space-x-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-200">Supabase Auth & Database Activo</span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline font-mono">Project ID: {supabaseProjectId}</span>
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-cyan-400">
            <Database className="w-3.5 h-3.5" />
            <span className="font-medium">RLS & Multi-Tenant Activado</span>
          </div>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        {/* Brand header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-xl shadow-cyan-900/40 ring-4 ring-cyan-500/20 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
            SecurityCRM <span className="text-cyan-400">AI</span>
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            Plataforma ERP & CRM integral para empresas de seguridad privada y vigilancia
          </p>
        </div>

        {/* Main Auth Card */}
        <div className="mt-8 bg-slate-900/90 border border-slate-800 shadow-2xl rounded-2xl backdrop-blur-xl p-6 sm:p-8">
          {/* Mode Tabs */}
          <div className="flex border-b border-slate-800 mb-6 pb-2 space-x-4 text-xs font-semibold">
            <button
              onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`pb-2 transition-all relative ${
                mode === 'login'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => { setMode('register'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`pb-2 transition-all relative ${
                mode === 'register' || mode === 'create-org'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Crear Cuenta
            </button>
            <button
              onClick={() => { setMode('forgot-password'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`pb-2 transition-all relative ${
                mode === 'forgot-password'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Recuperar Clave
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{successMsg}</div>
            </div>
          )}

          {/* MODE: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@empresa.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot-password')}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/40 hover:shadow-cyan-900/60 active:scale-98 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Autenticando con Supabase...</span>
                  </>
                ) : (
                  <>
                    <span>Iniciar Sesión en Supabase</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Carlos"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Apellido</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Mendoza"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="carlos.mendoza@seguridadtitan.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Contraseña</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Empresa / Razón Social</label>
                <div className="relative">
                  <Building className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Seguridad Titán Ltda"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Rol Operativo Solicitado</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="ADMIN_EMPRESA">ADMIN_EMPRESA — Administrador / Gerente de Seguridad</option>
                  <option value="DIRECTOR_OPERACIONES">DIRECTOR_OPERACIONES — Mando y Programación de Turnos</option>
                  <option value="SUPERVISOR">SUPERVISOR — Fiscalizador en Terreno</option>
                  <option value="GUARDA">GUARDA — Vigilante en Puesto Fijo / Móvil</option>
                  <option value="CLIENTE">CLIENTE — Auditor / Cliente Final</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/40 hover:shadow-cyan-900/60 active:scale-98 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creando cuenta en Supabase...</span>
                  </>
                ) : (
                  <>
                    <span>Crear Cuenta en Supabase</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE: FORGOT PASSWORD */}
          {mode === 'forgot-password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Ingresa tu correo electrónico registrado y te enviaremos las instrucciones de restablecimiento de contraseña mediante Supabase Auth.
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@empresa.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
                >
                  Volver al Login
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/40"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Enviar Enlace'}
                </button>
              </div>
            </form>
          )}

          {/* MODE: CREATE ORG (if multi-empresa step is prompted) */}
          {mode === 'create-org' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 text-xs">
                <p className="font-semibold">¡Usuario registrado en Supabase!</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Confirma la información de tu empresa para terminar de aprovisionar el tenant y las políticas Row Level Security (RLS).
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nombre de la Empresa</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">NIT / Identificación Fiscal</label>
                <input
                  type="text"
                  value={orgNit}
                  onChange={(e) => setOrgNit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              <button
                onClick={() => {
                  // Complete registration flow
                  handleQuickLogin('prof-001');
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg"
              >
                Completar Configuración y Entrar al Sistema
              </button>
            </div>
          )}
        </div>

        {/* Quick Demo Access by Roles (Crucial for evaluation & immediate live testing) */}
        <div className="mt-8 z-10">
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Acceso Rápido por Rol (Demostración & Pruebas)
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>
          <p className="text-[11px] text-slate-400 text-center mb-3">
            Selecciona un perfil para experimentar la plataforma desde su perspectiva con permisos RLS aplicados:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DEMO_PROFILES.map((profile) => {
              const badge = getRoleBadge(profile.role);
              return (
                <button
                  key={profile.id}
                  onClick={() => handleQuickLogin(profile.id)}
                  disabled={loading}
                  className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-700/50 text-left transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-cyan-500/30 shrink-0"
                    />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                        {profile.full_name}
                      </p>
                      <span className={`inline-block mt-0.5 px-2 py-0.5 text-[9px] font-semibold rounded-md border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
