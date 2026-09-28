export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'ADMIN_EMPRESA' 
  | 'DIRECTOR_OPERACIONES' 
  | 'SUPERVISOR' 
  | 'GUARDA' 
  | 'CLIENTE';

export type RiskLevel = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
export type SiteStatus = 'ACTIVO' | 'INACTIVO' | 'MANTENIMIENTO' | 'SUSPENDIDO';

export type PriorityLevel = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRÍTICA';
export type NovedadCategory = 
  | 'seguridad' 
  | 'infraestructura' 
  | 'comportamiento' 
  | 'acceso' 
  | 'equipo' 
  | 'vehículo' 
  | 'personal' 
  | 'cliente' 
  | 'mantenimiento' 
  | 'emergencia' 
  | 'otra';

export type NovedadStatus = 'ABIERTA' | 'EN_REVISIÓN' | 'ASIGNADA' | 'RESUELTA' | 'CERRADA';

export type IncidentType = 
  | 'robo' 
  | 'intrusión' 
  | 'acceso no autorizado' 
  | 'accidente' 
  | 'amenaza' 
  | 'daño' 
  | 'emergencia' 
  | 'altercado' 
  | 'incendio' 
  | 'pérdida' 
  | 'otro';

export type IncidentSeverity = 'LEVE' | 'MODERADA' | 'GRAVE' | 'CRÍTICA';
export type IncidentStatus = 'ABIERTO' | 'EN_INVESTIGACION' | 'ACCIONES_TOMADAS' | 'CERRADO';

export type ShiftType = 'DIURNO_6_18' | 'NOCTURNO_18_6' | 'TURNO_8H' | 'TURNO_12H' | 'REFUERZO' | 'ESPECIAL';
export type ShiftStatus = 'PROGRAMADO' | 'EN_CURSO' | 'COMPLETADO' | 'AUSENTE' | 'CANCELADO';

export type AlertType = 
  | 'NOVEDAD_CRÍTICA' 
  | 'INCIDENTE_CRÍTICO' 
  | 'DOCUMENTO_POR_VENCER' 
  | 'GUARDA_AUSENTE' 
  | 'TURNO_SIN_ASIGNAR' 
  | 'CONFLICTO_DE_TURNO' 
  | 'SUPERVISIÓN_PENDIENTE' 
  | 'PUESTO_SIN_COBERTURA';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertStatus = 'ACTIVA' | 'RECONOCIDA' | 'RESUELTA';

export interface Organization {
  id: string;
  name: string;
  nit: string;
  address: string;
  phone: string;
  email: string;
  logo_url?: string;
  status: 'ACTIVA' | 'INACTIVA';
  created_at: string;
}

export interface Profile {
  id: string;
  organization_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar_url?: string;
  status: 'ACTIVO' | 'INACTIVO';
  created_at: string;
}

export interface Client {
  id: string;
  organization_id: string;
  name: string;
  document: string;
  phone: string;
  email: string;
  address: string;
  status: 'ACTIVO' | 'INACTIVO';
  contact_person?: string;
  created_at: string;
}

export interface SecuritySite {
  id: string;
  organization_id: string;
  client_id: string;
  name: string;
  code: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string;
  risk_level: RiskLevel;
  status: SiteStatus;
  required_guards_count: number;
  operating_hours: string;
  contact_phone: string;
  created_at: string;
}

export interface Guard {
  id: string;
  organization_id: string;
  profile_id: string;
  name: string;
  document_number: string;
  employee_code: string;
  phone: string;
  email: string;
  position: string;
  hire_date: string;
  status: 'ACTIVO' | 'VACACIONES' | 'LICENCIA' | 'INACTIVO';
  photo_url?: string;
  assigned_site_id?: string;
  created_at: string;
}

export interface Supervisor {
  id: string;
  organization_id: string;
  profile_id: string;
  name: string;
  employee_code: string;
  phone: string;
  email: string;
  status: 'ACTIVO' | 'INACTIVO';
  zone?: string;
  created_at: string;
}

export interface Shift {
  id: string;
  organization_id: string;
  site_id: string;
  guard_id: string;
  supervisor_id?: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  shift_type: ShiftType;
  status: ShiftStatus;
  observations?: string;
  created_at: string;
}

export interface Incident {
  id: string;
  organization_id: string;
  site_id: string;
  reported_by: string;
  incident_type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description: string;
  incident_date: string;
  status: IncidentStatus;
  location: string;
  actions_taken?: string;
  evidence_urls?: string[];
  created_at: string;
  closed_at?: string;
}

export interface IncidentEvidence {
  id: string;
  incident_id: string;
  file_url: string;
  file_type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';
  description: string;
  uploaded_by: string;
  created_at: string;
}

export interface Novedad {
  id: string;
  organization_id: string;
  site_id: string;
  reported_by: string;
  shift_id?: string;
  category: NovedadCategory;
  priority: PriorityLevel;
  title: string;
  description: string;
  event_date: string;
  status: NovedadStatus;
  ai_generated?: boolean;
  ai_confidence?: number;
  evidence_urls?: string[];
  created_at: string;
  updated_at: string;
}

export interface InspectionItem {
  id: string;
  item: string;
  status: 'CUMPLE' | 'NO_CUMPLE' | 'NO_APLICA';
  observations?: string;
}

export interface Inspection {
  id: string;
  organization_id: string;
  site_id: string;
  supervisor_id: string;
  inspection_date: string;
  inspection_type: 'RUTINARIA' | 'SORPRESIVA' | 'SEGUIMIENTO' | 'ESPECIAL';
  result: 'APROBADA' | 'OBSERVADA' | 'REPROBADA';
  score: number; // 0 - 100
  observations: string;
  items: InspectionItem[];
  photos?: string[];
  created_at: string;
}

export interface Visit {
  id: string;
  organization_id: string;
  site_id: string;
  visitor_name: string;
  visitor_document: string;
  visit_type: 'CONTRATISTA' | 'PROVEEDOR' | 'CLIENTE' | 'AUTORIDAD' | 'PARTICULAR';
  vehicle_plate?: string;
  entry_time: string;
  exit_time?: string;
  observations: string;
  badge_number?: string;
  created_at: string;
}

export interface Report {
  id: string;
  organization_id: string;
  site_id?: string;
  created_by: string;
  report_type: 
    | 'DIARIO' 
    | 'SEMANAL' 
    | 'MENSUAL' 
    | 'NOVEDADES' 
    | 'INCIDENTES' 
    | 'SUPERVISIONES' 
    | 'ASISTENCIA' 
    | 'CLIENTE' 
    | 'PUESTO';
  title: string;
  content: string;
  period_start: string;
  period_end: string;
  status: 'BORRADOR' | 'GENERADO' | 'APROBADO' | 'ENVIADO';
  created_at: string;
}

export interface SecurityDocument {
  id: string;
  organization_id: string;
  client_id?: string;
  site_id?: string;
  document_type: 
    | 'CONTRATO' 
    | 'POLIZA' 
    | 'CERTIFICADO_CURSO' 
    | 'SALUD_OCUPACIONAL' 
    | 'PERMISO_PORTE_ARMAS' 
    | 'PROTOCOLO' 
    | 'INSPECCION_MINISTERIO';
  name: string;
  file_url: string;
  expiration_date: string;
  status: 'VIGENTE' | 'POR_VENCER' | 'VENCIDO';
  uploaded_by: string;
  created_at: string;
}

export interface Alert {
  id: string;
  organization_id: string;
  site_id?: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  status: AlertStatus;
  created_at: string;
  resolved_at?: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string;
  user_name: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'STATUS_CHANGE' | 'AI_ACTION' | 'EXPORT';
  table_name: string;
  record_id?: string;
  old_data?: string;
  new_data?: string;
  ip_address?: string;
  created_at: string;
}

export interface AIConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  tool_calls?: {
    name: string;
    args: Record<string, any>;
    result?: any;
  }[];
}

export interface AIAction {
  id: string;
  organization_id: string;
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id?: string;
  input_text: string;
  structured_data: Record<string, any>;
  status: 'PENDIENTE_CONFIRMACION' | 'EJECUTADA' | 'CANCELADA';
  created_at: string;
}
