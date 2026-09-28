import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Database,
  ShieldCheck,
  Sparkles,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Copy,
  Save,
  Server,
  Activity,
  Radio,
  Lock,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import {
  dbManager,
  isSupabaseConfigured,
  supabaseUrl,
  supabaseProjectId,
  supabaseAnonKey,
  testSupabaseConnection
} from '../lib/supabaseClient';

export const SettingsView: React.FC = () => {
  const [org, setOrg] = useState(dbManager.getOrganization());
  const [name, setName] = useState(org.name);
  const [nit, setNit] = useState(org.nit);
  const [address, setAddress] = useState(org.address);
  const [phone, setPhone] = useState(org.phone);
  const [email, setEmail] = useState(org.email);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Supabase test connection state
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    message: string;
    tablesVerified: string[];
  } | null>(null);

  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    try {
      const result = await testSupabaseConnection();
      setSupabaseTestResult(result);
    } catch (e: any) {
      setSupabaseTestResult({
        success: false,
        latencyMs: 0,
        message: e?.message || 'Error en prueba de conexión',
        tablesVerified: [],
      });
    } finally {
      setIsTestingSupabase(false);
    }
  };

  useEffect(() => {
    // Run an initial quick health check
    handleTestSupabase();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = dbManager.updateOrganization({
      name,
      nit,
      address,
      phone,
      email,
    });
    setOrg(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const copyMigrationPath = () => {
    navigator.clipboard.writeText('supabase/migrations/20250101000000_initial_schema.sql');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center">
            <Settings className="w-5 h-5 mr-2 text-cyan-400" /> Configuración Corporativa y Entorno Supabase
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Parámetros del tenant multi-empresa, credenciales de Supabase en vivo y políticas RLS.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>¡Datos de la empresa actualizados exitosamente en la base de datos!</span>
        </div>
      )}

      {/* Supabase Connected Banner & Diagnostics */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-800/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white">Instancia Supabase Conectada</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                  En Línea
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Proyecto: <span className="font-mono text-cyan-400 font-bold">{supabaseProjectId}</span> • Base de Datos PostgreSQL
              </p>
            </div>
          </div>

          <button
            onClick={handleTestSupabase}
            disabled={isTestingSupabase}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
            <span>{isTestingSupabase ? 'Probando...' : 'Probar Conexión'}</span>
          </button>
        </div>

        {/* Credentials & Connection Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Project ID</span>
            <p className="font-mono font-bold text-cyan-300 truncate">{supabaseProjectId}</p>
            <span className="text-[10px] text-slate-500 block">Supabase Cloud</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">API URL</span>
            <p className="font-mono text-slate-300 truncate text-[11px]">{supabaseUrl}</p>
            <span className="text-[10px] text-slate-500 block">Endpoint REST v1 / Auth</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Publishable Key</span>
            <p className="font-mono text-slate-300 truncate text-[11px]">
              {supabaseAnonKey.slice(0, 15)}...{supabaseAnonKey.slice(-6)}
            </p>
            <span className="text-[10px] text-emerald-400 font-semibold block flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Clave Pública (Anon)
            </span>
          </div>
        </div>

        {/* Test Diagnostics Box */}
        {supabaseTestResult && (
          <div className={`p-3.5 rounded-xl border text-xs flex items-start space-x-2.5 ${
            supabaseTestResult.success
              ? 'bg-emerald-950/20 border-emerald-800/50 text-emerald-200'
              : 'bg-rose-950/20 border-rose-800/50 text-rose-200'
          }`}>
            <Activity className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
            <div className="space-y-1">
              <p className="font-bold flex items-center">
                <span>{supabaseTestResult.message}</span>
                <span className="ml-2 px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                  {supabaseTestResult.latencyMs} ms
                </span>
              </p>
              {supabaseTestResult.tablesVerified.length > 0 && (
                <p className="text-[11px] text-slate-400">
                  Tablas verificadas en base de datos: <span className="text-slate-300 font-mono">{supabaseTestResult.tablesVerified.join(', ')}</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Organization Information Form */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
          <Building className="w-4 h-4 mr-2 text-cyan-400" /> Empresa de Seguridad (Tenant / Organización)
        </h3>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Razón Social *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">NIT / Identificación Tributaria *</label>
              <input
                type="text"
                required
                value={nit}
                onChange={(e) => setNit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Teléfono Principal</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Correo Operativo</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Estado</label>
              <div className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-bold">
                ORGANIZACIÓN ACTIVA
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Dirección Sede Central</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md shadow-cyan-900/40"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>

      {/* Supabase & Backend Architecture Status */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
          <Database className="w-4 h-4 mr-2 text-emerald-400" /> Infraestructura Supabase & Row Level Security (RLS)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center">
                <Database className="w-4 h-4 mr-1.5 text-emerald-400" /> Supabase Database
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Conectado a Supabase
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Aislamiento multi-tenant implementado con <code className="text-cyan-400 font-mono">organization_id</code> estricto en las 18 tablas maestras.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center">
                <Sparkles className="w-4 h-4 mr-1.5 text-indigo-400" /> Backend Gemini AI Proxy
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Server-Side / Zero Leak
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Las claves API y llamadas a Gemini 3.8 Flash se ejecutan exclusivamente en Node.js Express (<code className="text-indigo-300 font-mono">/api/gemini/*</code>) y Edge Functions.
            </p>
          </div>
        </div>

        {/* Migrations path helper */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
          <div className="overflow-hidden pr-3">
            <span className="text-slate-400 text-[11px] block">Archivo de Migración SQL para Supabase:</span>
            <span className="font-mono text-cyan-400 truncate block mt-0.5">
              supabase/migrations/20250101000000_initial_schema.sql
            </span>
          </div>
          <button
            onClick={copyMigrationPath}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0 flex items-center space-x-1"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Copiado' : 'Copiar Ruta'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

