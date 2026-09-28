# SecurityCRM AI — CRM Inteligente para Empresas de Seguridad Privada y Vigilancia

**SecurityCRM AI** es una plataforma integral de gestión operacional (CRM/ERP vertical) diseñada específicamente para compañías de seguridad privada y vigilancia física. Permite administrar clientes, puestos de vigilancia, guardas, supervisores, turnos con detección anti-conflicto, novedades, incidentes, minutas de visitantes, actas de supervisión con listas de chequeo, gestión documental con alertas de expiración, y un asistente de inteligencia artificial con interacción por voz impulsado por **Google Gemini 3.8 Flash**.

---

## 1. Arquitectura del Sistema

* **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Diseño Responsive adaptado a computadores, tablets y teléfonos móviles.
* **Backend**: Node.js + Express (con middleware de Vite en dev y endpoints proxy para Gemini AI) + TypeScript (`tsx`).
* **Base de Datos & Auth**: Supabase PostgreSQL con Row Level Security (RLS), multi-tenant por `organization_id`, y disparadores automáticos.
* **Inteligencia Artificial**:
  * SDK `@google/genai` (Modelo: `gemini-3.8-flash`).
  * Function Calling con catálogo de herramientas operacionales (consultas reales de novedades, puestos, incidentes y turnos).
  * Structured Outputs para conversión de narraciones de voz a novedades validadas con flujo *Human-in-the-Loop*.
  * Edge Functions en Deno para Supabase.

---

## 2. Roles y Permisos Implementados

| Rol | Alcance y Permisos |
|---|---|
| **SUPER_ADMIN** | Control total transversal y auditoría global. |
| **ADMIN_EMPRESA** | Gestión completa del tenant de la empresa de seguridad. |
| **DIRECTOR_OPERACIONES** | Asignación de turnos, puestos, análisis de incidentes y generación de reportes. |
| **SUPERVISOR** | Inspecciones en puesto con listas de chequeo, control de guardas y novedades. |
| **GUARDA** | Modo móvil simplificado ("Mi Turno"), registro de novedades por voz y control de accesos. |
| **CLIENTE** | Portal para contratantes con consulta de puestos, novedades autorizadas y reportes. |

> **Nota:** Puedes alternar instantáneamente entre los 6 roles en el selector de perfiles de la barra superior.

---

## 3. Instalación y Ejecución Local

1. Clona el repositorio e instala las dependencias:
```bash
npm install
```

2. Configura las variables de entorno en `.env`:
```env
# Clave inyectada por AI Studio o Google AI Studio Secrets:
GEMINI_API_KEY="AIzaSy..."

# Entorno y URL de la aplicación:
APP_URL="http://localhost:3000"
PORT=3000

# Conexión Supabase (opcional para persistencia remota; el sistema cuenta con datastore reactivo local por defecto):
VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
VITE_SUPABASE_ANON_KEY="tu-anon-key-publica"
SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key-solo-backend"
```

3. Inicia el servidor full-stack en modo desarrollo:
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

---

## 4. Configuración de Supabase y Migraciones

El archivo SQL completo con las 18 tablas maestras, índices, triggers y políticas RLS se encuentra en:
```
supabase/migrations/20250101000000_initial_schema.sql
```

### Tablas incluidas:
1. `organizations` (tenants multi-empresa)
2. `profiles` (roles y usuarios vinculados a auth.users)
3. `clients` (empresas contratantes)
4. `security_sites` (puestos de vigilancia con coordenadas y niveles de riesgo)
5. `guards` (roster de personal operativo y puestos)
6. `supervisors` (supervisores de zona)
7. `shifts` (cuadrante de turnos)
8. `incidents` (incidentes graves con cadena de custodia)
9. `incidents_evidence` (archivos fotográficos)
10. `novedades` (minuta digital y eventos)
11. `inspections` (supervisiones y actas con puntaje 0-100%)
12. `inspection_items` (ítems de lista de chequeo)
13. `visits` (minuta de visitantes y escarapelas)
14. `reports` (informes generados)
15. `documents` (pólizas, permisos de porte y contratos)
16. `alerts` (centro de alertas en tiempo real)
17. `audit_logs` (pista inmutable de auditoría forense)
18. `ai_conversations` & `ai_actions` (registro de operaciones de IA)

Para aplicar las migraciones con Supabase CLI:
```bash
supabase db push
```

---

## 5. Asistente Security AI & Operaciones por Voz

* **Botón Flotante y Drawer**: Accesible en todo momento desde cualquier módulo.
* **Function Calling**: Security AI no inventa datos; consulta el estado real de puestos, novedades del día, turnos y documentos en tiempo real.
* **Transformación de Voz a Novedad**:
  El guarda puede hablar naturalmente (o presionar un caso de prueba):
  > *"Soy el guarda Carlos. Estoy en el Centro Comercial Norte. Durante la ronda de las 10:15 encontré la puerta de emergencia del parqueadero abierta. No había personas en el lugar y procedí a asegurarla."*
  
  Security AI procesa el texto mediante el endpoint backend `/api/gemini/speech-to-novedad` y presenta una tarjeta de confirmación humana con:
  * Puesto detectado
  * Categoría clasificada
  * Prioridad asignada
  * Título y descripción sintetizada
  * Botones: **CONFIRMAR**, **EDITAR**, **CANCELAR**.

---

## 6. Seguridad y Buenas Prácticas

* **Cero Filtración de Claves**: La variable `GEMINI_API_KEY` nunca se envía ni expone en bundles del cliente. Todas las llamadas pasan por el servidor Express (`/api/gemini/*`) o Supabase Edge Functions.
* **Row Level Security (RLS)**: Cada consulta filtra estrictamente por `organization_id = current_user_org_id()`.
* **Auditoría Continua**: Cada inicio de sesión, creación, edición, cambio de estado o acción de IA queda registrado en `audit_logs`.
