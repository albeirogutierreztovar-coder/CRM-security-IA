-- ====================================================================
-- SECURITYCRM AI — SUPABASE POSTGRESQL SCHEMA MIGRATION
-- Multi-Tenant Security CRM / ERP with Row Level Security (RLS) & Triggers
-- ====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ORGANIZATIONS (TENANTS)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    nit TEXT NOT NULL UNIQUE,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    logo_url TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVA' CHECK (status IN ('ACTIVA', 'INACTIVA')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PROFILES (AUTH USERS & ROLES)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'GUARDA' CHECK (
        role IN ('SUPER_ADMIN', 'ADMIN_EMPRESA', 'DIRECTOR_OPERACIONES', 'SUPERVISOR', 'GUARDA', 'CLIENTE')
    ),
    avatar_url TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (status IN ('ACTIVO', 'INACTIVO')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    document TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    contact_person TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (status IN ('ACTIVO', 'INACTIVO')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SECURITY SITES (PUESTOS DE VIGILANCIA)
CREATE TABLE IF NOT EXISTS public.security_sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL DEFAULT 4.7110,
    longitude DOUBLE PRECISION NOT NULL DEFAULT -74.0721,
    description TEXT,
    risk_level TEXT NOT NULL DEFAULT 'MEDIO' CHECK (risk_level IN ('BAJO', 'MEDIO', 'ALTO', 'CRITICO')),
    status TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (status IN ('ACTIVO', 'INACTIVO', 'MANTENIMIENTO', 'SUSPENDIDO')),
    required_guards_count INT NOT NULL DEFAULT 1,
    operating_hours TEXT DEFAULT '24/7',
    contact_phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. GUARDS
CREATE TABLE IF NOT EXISTS public.guards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    document_number TEXT NOT NULL,
    employee_code TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    email TEXT,
    position TEXT NOT NULL DEFAULT 'Guarda Operativo',
    hire_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (status IN ('ACTIVO', 'VACACIONES', 'LICENCIA', 'INACTIVO')),
    photo_url TEXT,
    assigned_site_id UUID REFERENCES public.security_sites(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. SUPERVISORS
CREATE TABLE IF NOT EXISTS public.supervisors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    employee_code TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (status IN ('ACTIVO', 'INACTIVO')),
    zone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. SHIFTS (PROGRAMACIÓN Y TURNOS)
CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES public.security_sites(id) ON DELETE CASCADE,
    guard_id UUID NOT NULL REFERENCES public.guards(id) ON DELETE CASCADE,
    supervisor_id UUID REFERENCES public.supervisors(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    shift_type TEXT NOT NULL DEFAULT 'DIURNO_6_18' CHECK (
        shift_type IN ('DIURNO_6_18', 'NOCTURNO_18_6', 'TURNO_8H', 'TURNO_12H', 'REFUERZO', 'ESPECIAL')
    ),
    status TEXT NOT NULL DEFAULT 'PROGRAMADO' CHECK (
        status IN ('PROGRAMADO', 'EN_CURSO', 'COMPLETADO', 'AUSENTE', 'CANCELADO')
    ),
    observations TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. INCIDENTS (INCIDENTES DE SEGURIDAD)
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES public.security_sites(id) ON DELETE CASCADE,
    reported_by TEXT NOT NULL,
    incident_type TEXT NOT NULL CHECK (
        incident_type IN ('robo', 'intrusión', 'acceso no autorizado', 'accidente', 'amenaza', 'daño', 'emergencia', 'altercado', 'incendio', 'pérdida', 'otro')
    ),
    severity TEXT NOT NULL CHECK (severity IN ('LEVE', 'MODERADA', 'GRAVE', 'CRÍTICA')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    incident_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'ABIERTO' CHECK (
        status IN ('ABIERTO', 'EN_INVESTIGACION', 'ACCIONES_TOMADAS', 'CERRADO')
    ),
    location TEXT NOT NULL,
    actions_taken TEXT,
    evidence_urls TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

-- 9. INCIDENTS EVIDENCE
CREATE TABLE IF NOT EXISTS public.incidents_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO')),
    description TEXT,
    uploaded_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. NOVEDADES
CREATE TABLE IF NOT EXISTS public.novedades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES public.security_sites(id) ON DELETE CASCADE,
    reported_by TEXT NOT NULL,
    shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (
        category IN ('seguridad', 'infraestructura', 'comportamiento', 'acceso', 'equipo', 'vehículo', 'personal', 'cliente', 'mantenimiento', 'emergencia', 'otra')
    ),
    priority TEXT NOT NULL CHECK (priority IN ('BAJA', 'MEDIA', 'ALTA', 'CRÍTICA')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'ABIERTA' CHECK (
        status IN ('ABIERTA', 'EN_REVISIÓN', 'ASIGNADA', 'RESUELTA', 'CERRADA')
    ),
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_confidence DOUBLE PRECISION,
    evidence_urls TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. INSPECTIONS (SUPERVISIONES)
CREATE TABLE IF NOT EXISTS public.inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES public.security_sites(id) ON DELETE CASCADE,
    supervisor_id UUID NOT NULL REFERENCES public.supervisors(id) ON DELETE CASCADE,
    inspection_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    inspection_type TEXT NOT NULL DEFAULT 'RUTINARIA' CHECK (
        inspection_type IN ('RUTINARIA', 'SORPRESIVA', 'SEGUIMIENTO', 'ESPECIAL')
    ),
    result TEXT NOT NULL DEFAULT 'APROBADA' CHECK (result IN ('APROBADA', 'OBSERVADA', 'REPROBADA')),
    score INT NOT NULL DEFAULT 100 CHECK (score BETWEEN 0 AND 100),
    observations TEXT,
    photos TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. INSPECTION ITEMS (LISTAS DE CHEQUEO)
CREATE TABLE IF NOT EXISTS public.inspection_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
    item TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('CUMPLE', 'NO_CUMPLE', 'NO_APLICA')),
    observations TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. VISITS (CONTROL DE ACCESO Y MINUTA DE VISITANTES)
CREATE TABLE IF NOT EXISTS public.visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES public.security_sites(id) ON DELETE CASCADE,
    visitor_name TEXT NOT NULL,
    visitor_document TEXT NOT NULL,
    visit_type TEXT NOT NULL CHECK (visit_type IN ('CONTRATISTA', 'PROVEEDOR', 'CLIENTE', 'AUTORIDAD', 'PARTICULAR')),
    vehicle_plate TEXT,
    entry_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    exit_time TIMESTAMPTZ,
    observations TEXT,
    badge_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. REPORTS (REPORTES GENERADOS)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    site_id UUID REFERENCES public.security_sites(id) ON DELETE SET NULL,
    created_by TEXT NOT NULL,
    report_type TEXT NOT NULL CHECK (
        report_type IN ('DIARIO', 'SEMANAL', 'MENSUAL', 'NOVEDADES', 'INCIDENTES', 'SUPERVISIONES', 'ASISTENCIA', 'CLIENTE', 'PUESTO')
    ),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'GENERADO' CHECK (status IN ('BORRADOR', 'GENERADO', 'APROBADO', 'ENVIADO')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. DOCUMENTS (GESTIÓN DOCUMENTAL)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    site_id UUID REFERENCES public.security_sites(id) ON DELETE SET NULL,
    document_type TEXT NOT NULL CHECK (
        document_type IN ('CONTRATO', 'POLIZA', 'CERTIFICADO_CURSO', 'SALUD_OCUPACIONAL', 'PERMISO_PORTE_ARMAS', 'PROTOCOLO', 'INSPECCION_MINISTERIO')
    ),
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    expiration_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'VIGENTE' CHECK (status IN ('VIGENTE', 'POR_VENCER', 'VENCIDO')),
    uploaded_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. ALERTS (CENTRO DE ALERTAS EN TIEMPO REAL)
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    site_id UUID REFERENCES public.security_sites(id) ON DELETE SET NULL,
    alert_type TEXT NOT NULL CHECK (
        alert_type IN ('NOVEDAD_CRÍTICA', 'INCIDENTE_CRÍTICO', 'DOCUMENTO_POR_VENCER', 'GUARDA_AUSENTE', 'TURNO_SIN_ASIGNAR', 'CONFLICTO_DE_TURNO', 'SUPERVISIÓN_PENDIENTE', 'PUESTO_SIN_COBERTURA')
    ),
    severity TEXT NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVA' CHECK (status IN ('ACTIVA', 'RECONOCIDA', 'RESUELTA')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 17. AUDIT LOGS (PISTA DE AUDITORÍA INMUTABLE)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'STATUS_CHANGE', 'AI_ACTION', 'EXPORT')),
    table_name TEXT NOT NULL,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. AI CONVERSATIONS & ACTIONS
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    session_id TEXT NOT NULL,
    message TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    input_text TEXT NOT NULL,
    structured_data JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDIENTE_CONFIRMACION' CHECK (status IN ('PENDIENTE_CONFIRMACION', 'EJECUTADA', 'CANCELADA')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Multi-Tenant Isolation by organization_id
-- ====================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.novedades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_actions ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's organization
CREATE OR REPLACE FUNCTION current_user_org_id() 
RETURNS UUID AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Universal tenant policy macro
CREATE POLICY tenant_org_policy ON public.clients
    FOR ALL USING (organization_id = current_user_org_id());

CREATE POLICY tenant_site_policy ON public.security_sites
    FOR ALL USING (organization_id = current_user_org_id());

CREATE POLICY tenant_guards_policy ON public.guards
    FOR ALL USING (organization_id = current_user_org_id());

CREATE POLICY tenant_shifts_policy ON public.shifts
    FOR ALL USING (organization_id = current_user_org_id());

CREATE POLICY tenant_novedades_policy ON public.novedades
    FOR ALL USING (organization_id = current_user_org_id());

CREATE POLICY tenant_incidents_policy ON public.incidents
    FOR ALL USING (organization_id = current_user_org_id());

CREATE POLICY tenant_alerts_policy ON public.alerts
    FOR ALL USING (organization_id = current_user_org_id());

CREATE POLICY tenant_documents_policy ON public.documents
    FOR ALL USING (organization_id = current_user_org_id());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sites_org ON public.security_sites(organization_id);
CREATE INDEX IF NOT EXISTS idx_novedades_org_date ON public.novedades(organization_id, event_date);
CREATE INDEX IF NOT EXISTS idx_shifts_guard_date ON public.shifts(guard_id, date);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.alerts(organization_id, status);
