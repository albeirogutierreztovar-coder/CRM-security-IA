import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Organization,
  Profile,
  Client,
  SecuritySite,
  Guard,
  Supervisor,
  Shift,
  Incident,
  Novedad,
  Inspection,
  Visit,
  Report,
  SecurityDocument,
  Alert,
  AuditLog,
  AIAction,
  UserRole
} from '../types/database';
import {
  INITIAL_ORGANIZATION,
  DEMO_PROFILES,
  INITIAL_CLIENTS,
  INITIAL_SECURITY_SITES,
  INITIAL_GUARDS,
  INITIAL_SUPERVISORS,
  INITIAL_SHIFTS,
  INITIAL_NOVEDADES,
  INITIAL_INCIDENTS,
  INITIAL_INSPECTIONS,
  INITIAL_VISITS,
  INITIAL_DOCUMENTS,
  INITIAL_ALERTS,
  INITIAL_AUDIT_LOGS
} from './mockData';

// Supabase default credentials provided by project
const DEFAULT_SUPABASE_PROJECT_ID = 'mlximmcudzcrqcbhdjou';
const DEFAULT_SUPABASE_URL = 'https://mlximmcudzcrqcbhdjou.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_ykAF4KALzBCPSOUmd0N97A_hFRNmU9_';

// Normalize URL (strip trailing /rest/v1 or /rest/v1/ or slash)
function normalizeSupabaseUrl(rawUrl: string): string {
  let url = (rawUrl || '').trim();
  if (url.endsWith('/rest/v1/')) url = url.slice(0, -9);
  else if (url.endsWith('/rest/v1')) url = url.slice(0, -8);
  if (url.endsWith('/')) url = url.slice(0, -1);
  return url;
}

const rawEnvUrl = (import.meta.env.VITE_SUPABASE_URL as string) || DEFAULT_SUPABASE_URL;
const rawEnvKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || DEFAULT_SUPABASE_ANON_KEY;

export const supabaseUrl = normalizeSupabaseUrl(rawEnvUrl);
export const supabaseAnonKey = rawEnvKey.trim();
export const supabaseProjectId = DEFAULT_SUPABASE_PROJECT_ID;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// Initialize Supabase Realtime channel listeners
if (supabase) {
  try {
    supabase
      .channel('securitycrm_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'novedades' }, (payload) => {
        window.dispatchEvent(new CustomEvent('securitycrm_datachange', { detail: { table: 'novedades', payload } }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, (payload) => {
        window.dispatchEvent(new CustomEvent('securitycrm_datachange', { detail: { table: 'alerts', payload } }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, (payload) => {
        window.dispatchEvent(new CustomEvent('securitycrm_datachange', { detail: { table: 'incidents', payload } }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shifts' }, (payload) => {
        window.dispatchEvent(new CustomEvent('securitycrm_datachange', { detail: { table: 'shifts', payload } }));
      })
      .subscribe((status) => {
        console.log('[Supabase Realtime Status]:', status);
      });
  } catch (err) {
    console.warn('[Supabase Realtime Notice]:', err);
  }
}

// Live Supabase connection diagnostic tester
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  latencyMs: number;
  message: string;
  url: string;
  projectId: string;
  tablesVerified: string[];
}> {
  if (!supabase) {
    return {
      success: false,
      latencyMs: 0,
      message: 'Cliente Supabase no configurado.',
      url: supabaseUrl,
      projectId: supabaseProjectId,
      tablesVerified: [],
    };
  }

  const startTime = performance.now();
  try {
    // Test querying master tables
    const [orgsRes, sitesRes, alertsRes] = await Promise.all([
      supabase.from('organizations').select('count').limit(1),
      supabase.from('security_sites').select('count').limit(1),
      supabase.from('alerts').select('count').limit(1),
    ]);

    const latencyMs = Math.round(performance.now() - startTime);

    const tablesVerified: string[] = [];
    if (!orgsRes.error) tablesVerified.push('organizations');
    if (!sitesRes.error) tablesVerified.push('security_sites');
    if (!alertsRes.error) tablesVerified.push('alerts');

    return {
      success: true,
      latencyMs,
      message: `Conexión exitosa con Supabase (Proyecto ${supabaseProjectId}). Tablas respondiendo en ${latencyMs}ms.`,
      url: supabaseUrl,
      projectId: supabaseProjectId,
      tablesVerified,
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Math.round(performance.now() - startTime),
      message: err?.message || 'Error de red con Supabase',
      url: supabaseUrl,
      projectId: supabaseProjectId,
      tablesVerified: [],
    };
  }
}

// Local Reactive Storage Keys
const STORAGE_KEY_PREFIX = 'securitycrm_';

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading localStorage', e);
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('securitycrm_datachange', { detail: { key } }));
  } catch (e) {
    console.error('Error saving to localStorage', e);
  }
}

// In-Memory Database Manager with Realtime Event Bus
class SecurityDBManager {
  private organization: Organization;
  private profiles: Profile[];
  private clients: Client[];
  private sites: SecuritySite[];
  private guards: Guard[];
  private supervisors: Supervisor[];
  private shifts: Shift[];
  private novedades: Novedad[];
  private incidents: Incident[];
  private inspections: Inspection[];
  private visits: Visit[];
  private reports: Report[];
  private documents: SecurityDocument[];
  private alerts: Alert[];
  private auditLogs: AuditLog[];
  private currentProfile: Profile;

  constructor() {
    this.organization = getStored<Organization>('organization', INITIAL_ORGANIZATION);
    this.profiles = getStored<Profile[]>('profiles', DEMO_PROFILES);
    this.clients = getStored<Client[]>('clients', INITIAL_CLIENTS);
    this.sites = getStored<SecuritySite[]>('sites', INITIAL_SECURITY_SITES);
    this.guards = getStored<Guard[]>('guards', INITIAL_GUARDS);
    this.supervisors = getStored<Supervisor[]>('supervisors', INITIAL_SUPERVISORS);
    this.shifts = getStored<Shift[]>('shifts', INITIAL_SHIFTS);
    this.novedades = getStored<Novedad[]>('novedades', INITIAL_NOVEDADES);
    this.incidents = getStored<Incident[]>('incidents', INITIAL_INCIDENTS);
    this.inspections = getStored<Inspection[]>('inspections', INITIAL_INSPECTIONS);
    this.visits = getStored<Visit[]>('visits', INITIAL_VISITS);
    this.reports = getStored<Report[]>('reports', []);
    this.documents = getStored<SecurityDocument[]>('documents', INITIAL_DOCUMENTS);
    this.alerts = getStored<Alert[]>('alerts', INITIAL_ALERTS);
    this.auditLogs = getStored<AuditLog[]>('auditLogs', INITIAL_AUDIT_LOGS);
    
    // Default logged in user is Admin
    this.currentProfile = getStored<Profile>('current_profile', DEMO_PROFILES[0]);
  }

  // --- Session & Multi-Empresa Tenant Control ---
  getCurrentProfile(): Profile {
    return this.currentProfile;
  }

  setCurrentProfile(profile: Profile): void {
    this.currentProfile = profile;
    setStored('current_profile', profile);
    this.logAudit('LOGIN', 'auth.sessions', profile.id, undefined, JSON.stringify({ role: profile.role, name: profile.full_name }));
  }

  getOrganization(): Organization {
    return this.organization;
  }

  updateOrganization(data: Partial<Organization>): Organization {
    this.organization = { ...this.organization, ...data };
    setStored('organization', this.organization);
    this.logAudit('UPDATE', 'organizations', this.organization.id, undefined, JSON.stringify(data));
    return this.organization;
  }

  // --- Audit Logging ---
  logAudit(
    action: AuditLog['action'],
    table_name: string,
    record_id?: string,
    old_data?: string,
    new_data?: string
  ): void {
    const entry: AuditLog = {
      id: 'audit-' + Math.random().toString(36).substring(2, 9),
      organization_id: this.organization.id,
      user_id: this.currentProfile.id,
      user_name: this.currentProfile.full_name,
      action,
      table_name,
      record_id,
      old_data,
      new_data,
      ip_address: '190.144.20.15',
      created_at: new Date().toISOString()
    };
    this.auditLogs = [entry, ...this.auditLogs];
    setStored('auditLogs', this.auditLogs);
  }

  getAuditLogs(): AuditLog[] {
    return this.auditLogs.filter(a => a.organization_id === this.organization.id);
  }

  // --- Clients CRUD ---
  getClients(): Client[] {
    return this.clients.filter(c => c.organization_id === this.organization.id);
  }

  createClient(client: Omit<Client, 'id' | 'organization_id' | 'created_at'>): Client {
    const newClient: Client = {
      ...client,
      id: 'cli-' + Math.random().toString(36).substring(2, 9),
      organization_id: this.organization.id,
      created_at: new Date().toISOString()
    };
    this.clients = [newClient, ...this.clients];
    setStored('clients', this.clients);
    this.logAudit('CREATE', 'clients', newClient.id, undefined, JSON.stringify(newClient));
    return newClient;
  }

  updateClient(id: string, updates: Partial<Client>): Client | null {
    const index = this.clients.findIndex(c => c.id === id && c.organization_id === this.organization.id);
    if (index === -1) return null;
    const old = this.clients[index];
    this.clients[index] = { ...old, ...updates };
    setStored('clients', this.clients);
    this.logAudit('UPDATE', 'clients', id, JSON.stringify(old), JSON.stringify(updates));
    return this.clients[index];
  }

  deleteClient(id: string): boolean {
    const target = this.clients.find(c => c.id === id);
    if (!target) return false;
    this.clients = this.clients.filter(c => c.id !== id);
    setStored('clients', this.clients);
    this.logAudit('DELETE', 'clients', id, JSON.stringify(target));
    return true;
  }

  // --- Security Sites CRUD ---
  getSites(): SecuritySite[] {
    if (this.currentProfile.role === 'CLIENTE') {
      // Return sites belonging to client
      return this.sites.filter(s => s.organization_id === this.organization.id && s.client_id === 'cli-001');
    }
    return this.sites.filter(s => s.organization_id === this.organization.id);
  }

  getSiteById(id: string): SecuritySite | undefined {
    return this.sites.find(s => s.id === id && s.organization_id === this.organization.id);
  }

  createSite(site: Omit<SecuritySite, 'id' | 'organization_id' | 'created_at'>): SecuritySite {
    const newSite: SecuritySite = {
      ...site,
      id: 'site-' + Math.random().toString(36).substring(2, 9),
      organization_id: this.organization.id,
      created_at: new Date().toISOString()
    };
    this.sites = [newSite, ...this.sites];
    setStored('sites', this.sites);
    this.logAudit('CREATE', 'security_sites', newSite.id, undefined, JSON.stringify(newSite));
    return newSite;
  }

  updateSite(id: string, updates: Partial<SecuritySite>): SecuritySite | null {
    const idx = this.sites.findIndex(s => s.id === id && s.organization_id === this.organization.id);
    if (idx === -1) return null;
    const old = this.sites[idx];
    this.sites[idx] = { ...old, ...updates };
    setStored('sites', this.sites);
    this.logAudit('UPDATE', 'security_sites', id, JSON.stringify(old), JSON.stringify(updates));
    return this.sites[idx];
  }

  deleteSite(id: string): boolean {
    const target = this.sites.find(s => s.id === id);
    if (!target) return false;
    this.sites = this.sites.filter(s => s.id !== id);
    setStored('sites', this.sites);
    this.logAudit('DELETE', 'security_sites', id, JSON.stringify(target));
    return true;
  }

  // --- Guards CRUD ---
  getGuards(): Guard[] {
    return this.guards.filter(g => g.organization_id === this.organization.id);
  }

  createGuard(guard: Omit<Guard, 'id' | 'organization_id' | 'created_at'>): Guard {
    const newGuard: Guard = {
      ...guard,
      id: 'guard-' + Math.random().toString(36).substring(2, 9),
      organization_id: this.organization.id,
      created_at: new Date().toISOString()
    };
    this.guards = [newGuard, ...this.guards];
    setStored('guards', this.guards);
    this.logAudit('CREATE', 'guards', newGuard.id, undefined, JSON.stringify(newGuard));
    return newGuard;
  }

  updateGuard(id: string, updates: Partial<Guard>): Guard | null {
    const idx = this.guards.findIndex(g => g.id === id && g.organization_id === this.organization.id);
    if (idx === -1) return null;
    const old = this.guards[idx];
    this.guards[idx] = { ...old, ...updates };
    setStored('guards', this.guards);
    this.logAudit('UPDATE', 'guards', id, JSON.stringify(old), JSON.stringify(updates));
    return this.guards[idx];
  }

  deleteGuard(id: string): boolean {
    const target = this.guards.find(g => g.id === id);
    if (!target) return false;
    this.guards = this.guards.filter(g => g.id !== id);
    setStored('guards', this.guards);
    this.logAudit('DELETE', 'guards', id, JSON.stringify(target));
    return true;
  }

  // --- Supervisors CRUD ---
  getSupervisors(): Supervisor[] {
    return this.supervisors.filter(s => s.organization_id === this.organization.id);
  }

  createSupervisor(sup: Omit<Supervisor, 'id' | 'organization_id' | 'created_at'>): Supervisor {
    const newSup: Supervisor = {
      ...sup,
      id: 'sup-' + Math.random().toString(36).substring(2, 9),
      organization_id: this.organization.id,
      created_at: new Date().toISOString()
    };
    this.supervisors = [newSup, ...this.supervisors];
    setStored('supervisors', this.supervisors);
    this.logAudit('CREATE', 'supervisors', newSup.id, undefined, JSON.stringify(newSup));
    return newSup;
  }

  // --- Shifts & Conflict Detection ---
  getShifts(): Shift[] {
    return this.shifts.filter(s => s.organization_id === this.organization.id);
  }

  checkShiftConflict(guard_id: string, date: string, start_time: string, end_time: string, ignoreShiftId?: string): { hasConflict: boolean; conflictingShift?: Shift } {
    const guardShifts = this.shifts.filter(s => 
      s.guard_id === guard_id && 
      s.date === date && 
      s.status !== 'CANCELADO' &&
      s.id !== ignoreShiftId
    );

    for (const s of guardShifts) {
      // Overlap calculation: (StartA < EndB) and (EndA > StartB)
      if (start_time < s.end_time && end_time > s.start_time) {
        return { hasConflict: true, conflictingShift: s };
      }
    }
    return { hasConflict: false };
  }

  createShift(shift: Omit<Shift, 'id' | 'organization_id' | 'created_at'>): { shift?: Shift; error?: string } {
    const conflict = this.checkShiftConflict(shift.guard_id, shift.date, shift.start_time, shift.end_time);
    if (conflict.hasConflict) {
      // Create alert for conflict
      this.createAlert({
        site_id: shift.site_id,
        alert_type: 'CONFLICTO_DE_TURNO',
        severity: 'WARNING',
        title: 'Conflicto de turno detectado',
        description: `El guarda ya tiene asignado un turno en la fecha ${shift.date} (${conflict.conflictingShift?.start_time} - ${conflict.conflictingShift?.end_time})`,
        status: 'ACTIVA'
      });
      return { error: `Conflicto de programación: El guarda ya cuenta con un turno activo de ${conflict.conflictingShift?.start_time} a ${conflict.conflictingShift?.end_time} en esta fecha.` };
    }

    const newShift: Shift = {
      ...shift,
      id: 'shift-' + Math.random().toString(36).substring(2, 9),
      organization_id: this.organization.id,
      created_at: new Date().toISOString()
    };
    this.shifts = [newShift, ...this.shifts];
    setStored('shifts', this.shifts);
    this.logAudit('CREATE', 'shifts', newShift.id, undefined, JSON.stringify(newShift));
    return { shift: newShift };
  }

  updateShift(id: string, updates: Partial<Shift>): Shift | null {
    const idx = this.shifts.findIndex(s => s.id === id && s.organization_id === this.organization.id);
    if (idx === -1) return null;
    const old = this.shifts[idx];
    this.shifts[idx] = { ...old, ...updates };
    setStored('shifts', this.shifts);
    this.logAudit('UPDATE', 'shifts', id, JSON.stringify(old), JSON.stringify(updates));
    return this.shifts[idx];
  }

  // --- Novedades CRUD & Realtime Alerts ---
  getNovedades(): Novedad[] {
    return this.novedades.filter(n => n.organization_id === this.organization.id);
  }

  createNovedad(data: Omit<Novedad, 'id' | 'organization_id' | 'created_at' | 'updated_at'>): Novedad {
    const newNov: Novedad = {
      ...data,
      id: 'nov-' + Math.random().toString(36).substring(2, 9),
      organization_id: this.organization.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.novedades = [newNov, ...this.novedades];
    setStored('novedades', this.novedades);
    this.logAudit('CREATE', 'novedades', newNov.id, undefined, JSON.stringify(newNov));

    // If critical priority, trigger immediate alert
    if (newNov.priority === 'CRÍTICA') {
      const site = this.getSiteById(newNov.site_id);
      this.createAlert({
        site_id: newNov.site_id,
        alert_type: 'NOVEDAD_CRÍTICA',
        severity: 'CRITICAL',
        title: `Novedad Crítica: ${newNov.title}`,
        description: `En ${site?.name || 'Puesto no especificado'}: ${newNov.description.slice(0, 120)}...`,
        status: 'ACTIVA'
      });
    }

    return newNov;
  }

  updateNovedad(id: string, updates: Partial<Novedad>): Novedad | null {
    const idx = this.novedades.findIndex(n => n.id === id && n.organization_id === this.organization.id);
    if (idx === -1) return null;
    const old = this.novedades[idx];
    this.novedades[idx] = { ...old, ...updates, updated_at: new Date().toISOString() };
    setStored('novedades', this.novedades);
    this.logAudit('UPDATE', 'novedades', id, JSON.stringify(old), JSON.stringify(updates));
    return this.novedades[idx];
  }

  // --- Incidents CRUD ---
  getIncidents(): Incident[] {
    return this.incidents.filter(i => i.organization_id === this.organization.id);
  }

  createIncident(data: Omit<Incident, 'id' | 'organization_id' | 'created_at'>): Incident {
    const newInc: Incident = {
      ...data,
      id: 'inc-' + Math.random().toString(36).substring(2, 9),
      organization_id: this.organization.id,
      created_at: new Date().toISOString()
    };
    this.incidents = [newInc, ...this.incidents];
    setStored('incidents', this.incidents);
    this.logAudit('CREATE', 'incidents', newInc.id, undefined, JSON.stringify(newInc));

    if (newInc.severity === 'CRÍTICA' || newInc.severity === 'GRAVE') {
      const site = this.getSiteById(newInc.site_id);
      this.createAlert({
        site_id: newInc.site_id,
        alert_type: 'INCIDENTE_CRÍTICO',
        severity: 'CRITICAL',
        title: `Incidente Grave/Crítico: ${newInc.title}`,
        description: `Puesto: ${site?.name || 'Desconocido'}. ${newInc.description.slice(0, 120)}`,
        status: 'ACTIVA'
      });
    }

    return newInc;
  }

  updateIncident(id: string, updates: Partial<Incident>): Incident | null {
    const idx = this.incidents.findIndex(i => i.id === id && i.organization_id === this.organization.id);
    if (idx === -1) return null;
    const old = this.incidents[idx];
    this.incidents[idx] = { ...old, ...updates };
    setStored('incidents', this.incidents);
    this.logAudit('UPDATE', 'incidents', id, JSON.stringify(old), JSON.stringify(updates));
    return this.incidents[idx];
  }

  // --- Inspections CRUD ---
  getInspections(): Inspection[] {
    return this.inspections.filter(i => i.organization_id === this.organization.id);
  }

  createInspection(data: Omit<Inspection, 'id' | 'organization_id' | 'created_at'>): Inspection {
    const newInsp: Inspection = {
      ...data,
      id: 'insp-' + Math.random().toString(36).substring(2, 9),
      organization_id: this.organization.id,
      created_at: new Date().toISOString()
    };
    this.inspections = [newInsp, ...this.inspections];
    setStored('inspections', this.inspections);
    this.logAudit('CREATE', 'inspections', newInsp.id, undefined, JSON.stringify(newInsp));
    return newInsp;
  }

  // --- Visits CRUD ---
  getVisits(): Visit[] {
    return this.visits.filter(v => v.organization_id === this.organization.id);
  }

  createVisit(data: Omit<Visit, 'id' | 'organization_id' | 'created_at'>): Visit {
    const newVis: Visit = {
      ...data,
      id: 'vis-' + Math.random().toString(36).substring(2, 9),
      organization_id: this.organization.id,
      created_at: new Date().toISOString()
    };
    this.visits = [newVis, ...this.visits];
    setStored('visits', this.visits);
    this.logAudit('CREATE', 'visits', newVis.id, undefined, JSON.stringify(newVis));
    return newVis;
  }

  updateVisit(id: string, updates: Partial<Visit>): Visit | null {
    const idx = this.visits.findIndex(v => v.id === id && v.organization_id === this.organization.id);
    if (idx === -1) return null;
    this.visits[idx] = { ...this.visits[idx], ...updates };
    setStored('visits', this.visits);
    return this.visits[idx];
  }

  // --- Reports CRUD ---
  getReports(): Report[] {
    return this.reports.filter(r => r.organization_id === this.organization.id);
  }

  createReport(data: Omit<Report, 'id' | 'organization_id' | 'created_at'>): Report {
    const newReport: Report = {
      ...data,
      id: 'rep-' + Math.random().toString(36).substring(2, 9),
      organization_id: this.organization.id,
      created_at: new Date().toISOString()
    };
    this.reports = [newReport, ...this.reports];
    setStored('reports', this.reports);
    this.logAudit('CREATE', 'reports', newReport.id, undefined, JSON.stringify({ title: newReport.title, type: newReport.report_type }));
    return newReport;
  }

  // --- Documents CRUD ---
  getDocuments(): SecurityDocument[] {
    return this.documents.filter(d => d.organization_id === this.organization.id);
  }

  createDocument(data: Omit<SecurityDocument, 'id' | 'organization_id' | 'created_at'>): SecurityDocument {
    const newDoc: SecurityDocument = {
      ...data,
      id: 'doc-' + Math.random().toString(36).substring(2, 9),
      organization_id: this.organization.id,
      created_at: new Date().toISOString()
    };
    this.documents = [newDoc, ...this.documents];
    setStored('documents', this.documents);
    this.logAudit('CREATE', 'documents', newDoc.id, undefined, JSON.stringify(newDoc));
    return newDoc;
  }

  deleteDocument(id: string): boolean {
    const target = this.documents.find(d => d.id === id);
    if (!target) return false;
    this.documents = this.documents.filter(d => d.id !== id);
    setStored('documents', this.documents);
    this.logAudit('DELETE', 'documents', id, JSON.stringify(target));
    return true;
  }

  // --- Alerts CRUD ---
  getAlerts(): Alert[] {
    return this.alerts.filter(a => a.organization_id === this.organization.id);
  }

  createAlert(data: Omit<Alert, 'id' | 'organization_id' | 'created_at'>): Alert {
    const newAlt: Alert = {
      ...data,
      id: 'alt-' + Math.random().toString(36).substring(2, 9),
      organization_id: this.organization.id,
      created_at: new Date().toISOString()
    };
    this.alerts = [newAlt, ...this.alerts];
    setStored('alerts', this.alerts);
    return newAlt;
  }

  resolveAlert(id: string): boolean {
    const idx = this.alerts.findIndex(a => a.id === id && a.organization_id === this.organization.id);
    if (idx === -1) return false;
    this.alerts[idx].status = 'RESUELTA';
    this.alerts[idx].resolved_at = new Date().toISOString();
    setStored('alerts', this.alerts);
    this.logAudit('STATUS_CHANGE', 'alerts', id, undefined, JSON.stringify({ status: 'RESUELTA' }));
    return true;
  }

  // --- Global Search ---
  globalSearch(query: string): {
    clients: Client[];
    sites: SecuritySite[];
    guards: Guard[];
    novedades: Novedad[];
    incidents: Incident[];
    documents: SecurityDocument[];
  } {
    const q = query.toLowerCase().trim();
    if (!q) return { clients: [], sites: [], guards: [], novedades: [], incidents: [], documents: [] };

    return {
      clients: this.getClients().filter(c => c.name.toLowerCase().includes(q) || c.document.toLowerCase().includes(q)),
      sites: this.getSites().filter(s => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)),
      guards: this.getGuards().filter(g => g.name.toLowerCase().includes(q) || g.document_number.toLowerCase().includes(q) || g.employee_code.toLowerCase().includes(q)),
      novedades: this.getNovedades().filter(n => n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q)),
      incidents: this.getIncidents().filter(i => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)),
      documents: this.getDocuments().filter(d => d.name.toLowerCase().includes(q) || d.document_type.toLowerCase().includes(q))
    };
  }

  // --- KPI Aggregations ---
  getDashboardMetrics() {
    const sites = this.getSites();
    const activeSites = sites.filter(s => s.status === 'ACTIVO');
    const guards = this.getGuards();
    const activeGuards = guards.filter(g => g.status === 'ACTIVO');
    const absentGuards = guards.filter(g => g.status === 'VACACIONES' || g.status === 'LICENCIA');
    
    const todayStr = new Date().toISOString().split('T')[0];
    const shiftsToday = this.getShifts().filter(s => s.date === todayStr);
    const novedadesToday = this.getNovedades().filter(n => n.event_date.startsWith(todayStr));
    const openIncidents = this.getIncidents().filter(i => i.status !== 'CERRADO');
    const criticalAlerts = this.getAlerts().filter(a => a.status === 'ACTIVA' && a.severity === 'CRITICAL');
    const expiringDocs = this.getDocuments().filter(d => d.status === 'POR_VENCER');

    // Sites with novedades today
    const sitesWithNovedadesCount = new Set(novedadesToday.map(n => n.site_id)).size;

    return {
      totalSites: sites.length,
      activeSites: activeSites.length,
      sitesWithNovedades: sitesWithNovedadesCount,
      totalGuards: guards.length,
      activeGuards: activeGuards.length,
      absentGuards: absentGuards.length,
      shiftsToday: shiftsToday.length,
      novedadesToday: novedadesToday.length,
      openIncidents: openIncidents.length,
      criticalAlerts: criticalAlerts.length,
      expiringDocuments: expiringDocs.length,
    };
  }
}

export const dbManager = new SecurityDBManager();
