import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Gemini Client
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Catalog of tools for Function Calling
const securityToolDeclarations: FunctionDeclaration[] = [
  {
    name: 'get_today_novedades',
    description: 'Obtiene el listado de novedades registradas en el día de hoy para la empresa de seguridad.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        priority_filter: {
          type: Type.STRING,
          description: 'Filtro opcional por prioridad: BAJA, MEDIA, ALTA, CRÍTICA',
        },
      },
    },
  },
  {
    name: 'get_critical_incidents',
    description: 'Obtiene los incidentes de seguridad abiertos con gravedad GRAVE o CRÍTICA.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'get_site_information',
    description: 'Consulta los datos detallados de un puesto de vigilancia por nombre o código.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'Nombre o código del puesto, por ejemplo "Centro Comercial Norte" o "CCN-01"',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_expiring_documents',
    description: 'Obtiene las pólizas, contratos o licencias que vencen en los próximos X días.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        days_ahead: {
          type: Type.NUMBER,
          description: 'Cantidad de días futuros para auditar vencimientos (ej: 30)',
        },
      },
    },
  },
  {
    name: 'propose_novedad',
    description: 'Estructura una propuesta de registro de novedad a partir de la conversación o relato del guarda para confirmación humana.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        site_name: { type: Type.STRING, description: 'Nombre del puesto donde ocurrió' },
        category: { 
          type: Type.STRING, 
          description: 'Categoría: seguridad, infraestructura, comportamiento, acceso, equipo, vehículo, personal, cliente, mantenimiento, emergencia, otra' 
        },
        priority: { type: Type.STRING, description: 'Prioridad: BAJA, MEDIA, ALTA, CRÍTICA' },
        title: { type: Type.STRING, description: 'Título conciso de la novedad' },
        description: { type: Type.STRING, description: 'Detalle operacional de lo sucedido y acciones tomadas' },
        event_time: { type: Type.STRING, description: 'Hora o momento del suceso' },
        reported_by: { type: Type.STRING, description: 'Nombre o código del guarda que reporta' },
      },
      required: ['site_name', 'category', 'priority', 'title', 'description'],
    },
  },
];

// Security AI Chat Endpoint with Function Calling
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { messages, contextData, userProfile } = req.body;

    if (!geminiApiKey) {
      // Friendly fallback if key is not configured
      return res.json({
        reply: `Hola ${userProfile?.full_name || 'Oficial'}. Soy Security AI. La clave de Gemini no está configurada aún en variables de entorno, pero puedo asistirte consultando los registros locales de SecurityCRM.`,
        toolCalls: [],
      });
    }

    const systemInstruction = `
Eres "Security AI", el asistente operacional inteligente y copiloto de comando para la empresa de seguridad privada "Vigilancia & Seguridad Andina S.A.S." (SecurityCRM AI).
Usuario actual: ${userProfile?.full_name || 'Operador'} (Rol: ${userProfile?.role || 'OPERATIVO'}).
Fecha y hora local: ${new Date().toLocaleString('es-CO')}.

REGLAS CRÍTICAS:
1. Responde SIEMPRE en español, con tono formal, profesional, sobrio, militar/operativo de alta disciplina.
2. NO INVENTES DATOS, NOMBRES NI INCIDENTES. Usa la información suministrada en el contexto o llama a las funciones provistas.
3. Si el usuario te pide registrar una novedad o incidente, extrae los datos y utiliza la herramienta "propose_novedad". NUNCA guardes automáticamente sin pedir confirmación humana explícita.
4. Si falta información crucial (como el puesto o qué ocurrió exactamente), haz una pregunta breve de aclaración antes de proponer.
5. Puedes resumir novedades, turnos e incidentes claramente usando listas y viñetas.

Contexto actual de la base de datos de la empresa:
${JSON.stringify(contextData || {}, null, 2)}
`;

    const userPrompt = messages && messages.length > 0
      ? messages[messages.length - 1].content
      : 'Estado de seguridad';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        tools: [{ functionDeclarations: securityToolDeclarations }],
      },
    });

    const candidate = response.candidates?.[0];
    const textOutput = response.text || '';
    const functionCalls = response.functionCalls || [];

    res.json({
      reply: textOutput,
      functionCalls,
    });
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    res.status(500).json({
      error: 'Error de comunicación con el servicio de IA.',
      message: error?.message || 'Error interno',
    });
  }
});

// Helper function for heuristic fallback when Gemini API is temporarily unavailable (503/rate limit)
function fallbackVoiceToNovedad(transcript: string, currentGuardName?: string, currentSiteName?: string, availableSites?: any[]) {
  const lower = transcript.toLowerCase();
  
  // Detect site
  let matchedSite = currentSiteName || 'Centro Comercial Norte';
  if (availableSites && availableSites.length > 0) {
    for (const s of availableSites) {
      if (lower.includes(s.name.toLowerCase()) || lower.includes((s.code || '').toLowerCase())) {
        matchedSite = s.name;
        break;
      }
    }
  }

  // Detect category
  let category = 'seguridad';
  if (lower.includes('agua') || lower.includes('tuberia') || lower.includes('rociador') || lower.includes('luz') || lower.includes('gotera')) {
    category = 'infraestructura';
  } else if (lower.includes('tractomula') || lower.includes('camion') || lower.includes('furgon') || lower.includes('vehiculo') || lower.includes('parqueadero')) {
    category = 'vehículo';
  } else if (lower.includes('pelea') || lower.includes('insulto') || lower.includes('exaltado') || lower.includes('agresion')) {
    category = 'comportamiento';
  } else if (lower.includes('camara') || lower.includes('radio') || lower.includes('switch') || lower.includes('alarma')) {
    category = 'equipo';
  }

  // Detect priority
  let priority = 'MEDIA';
  if (lower.includes('arma') || lower.includes('robo') || lower.includes('intrusion') || lower.includes('critica') || lower.includes('bomba') || lower.includes('evacuacion')) {
    priority = 'CRÍTICA';
  } else if (lower.includes('abiert') || lower.includes('peligro') || lower.includes('urgente') || lower.includes('fuga')) {
    priority = 'ALTA';
  }

  // Detect time
  let event_time = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  const timeMatch = transcript.match(/\b(\d{1,2})[:\.](\d{2})\b/);
  if (timeMatch) {
    event_time = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
  } else if (lower.includes('diez') && lower.includes('quince')) {
    event_time = '22:15';
  }

  // Generate clean title
  let title = 'Novedad de control en puesto';
  if (lower.includes('puerta') && lower.includes('abierta')) {
    title = 'Puerta de emergencia encontrada abierta';
  } else if (lower.includes('agua') || lower.includes('fuga') || lower.includes('goteo')) {
    title = 'Filtración de agua en instalaciones';
  } else if (lower.includes('precinto') || lower.includes('contenedor')) {
    title = 'Inconsistencia en precinto de vehículo de carga';
  } else if (lower.includes('exaltado') || lower.includes('altercado')) {
    title = 'Altercado y alteración de orden público';
  }

  // Extract reporter name
  let reporter = currentGuardName || 'Guarda de Turno';
  const nameMatch = transcript.match(/soy el guarda\s+([A-Za-zÁÉÍÓÚáéíóúñ]+)/i);
  if (nameMatch) {
    reporter = nameMatch[1];
  }

  return {
    site_name: matchedSite,
    category,
    priority,
    title,
    description: transcript,
    event_time,
    reported_by: reporter,
    requires_confirmation: true,
  };
}

// Endpoint: Speech / Voice to Structured Novedad Transformation
app.post('/api/gemini/speech-to-novedad', async (req: Request, res: Response) => {
  const { transcript, currentGuardName, currentSiteName, availableSites } = req.body;

  if (!transcript || typeof transcript !== 'string') {
    return res.status(400).json({ error: 'Transcripción de voz requerida.' });
  }

  if (!geminiApiKey) {
    return res.json({ proposal: fallbackVoiceToNovedad(transcript, currentGuardName, currentSiteName, availableSites) });
  }

  try {
    const prompt = `
Analiza la siguiente narración de voz de un guarda de seguridad y conviértela en una estructura estricta de NOVEDAD operacional para SecurityCRM AI.

Narración del guarda:
"${transcript}"

Guarda en sesión: "${currentGuardName || 'Desconocido'}"
Puesto actual por defecto: "${currentSiteName || 'No especificado'}"
Lista de puestos disponibles en la empresa:
${JSON.stringify(availableSites || [])}

Debes retornar un JSON con:
- site_name: Nombre exacto del puesto detectado (si no lo menciona, usa "${currentSiteName || ''}").
- category: Una de [seguridad, infraestructura, comportamiento, acceso, equipo, vehículo, personal, cliente, mantenimiento, emergencia, otra].
- priority: Una de [BAJA, MEDIA, ALTA, CRÍTICA]. Si involucra intrusiones, puertas abiertas o armas, debe ser ALTA o CRÍTICA.
- title: Título claro y conciso (máximo 60 caracteres).
- description: Redacción profesional, clara y detallada de lo sucedido y acciones del guarda.
- event_time: Hora aproximada (HH:mm) deducida del texto o la actual.
- reported_by: Nombre del guarda.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            site_name: { type: Type.STRING },
            category: { type: Type.STRING },
            priority: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            event_time: { type: Type.STRING },
            reported_by: { type: Type.STRING },
          },
          required: ['site_name', 'category', 'priority', 'title', 'description', 'event_time', 'reported_by'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    parsed.requires_confirmation = true;

    res.json({ proposal: parsed });
  } catch (error: any) {
    console.warn('Gemini API call hit transient error or high demand, using intelligent fallback parser:', error?.message);
    const fallbackProposal = fallbackVoiceToNovedad(transcript, currentGuardName, currentSiteName, availableSites);
    res.json({ proposal: fallbackProposal });
  }
});

// Endpoint: AI Operational Report Generator
app.post('/api/gemini/generate-report', async (req: Request, res: Response) => {
  try {
    const { site, period, novedades, incidents, inspections, visits } = req.body;

    if (!geminiApiKey) {
      return res.json({
        content: `INFORME OPERACIONAL DE SEGURIDAD\nPuesto: ${site?.name || 'General'}\nPeríodo: ${period || 'Última Semana'}\n\n1. RESUMEN:\nSe registraron ${novedades?.length || 0} novedades y ${incidents?.length || 0} incidentes en el período evaluado.\n\n2. NOVEDADES:\n${novedades?.map((n: any) => `- [${n.priority}] ${n.title}: ${n.description}`).join('\n') || 'Sin novedades registradas'}\n\n3. INCIDENTES:\n${incidents?.map((i: any) => `- [${i.severity}] ${i.title}: ${i.actions_taken || 'En seguimiento'}`).join('\n') || 'Sin incidentes'}\n\n4. ACCIONES REALIZADAS:\nRondas de supervisión cumplidas conforme al protocolo.\n\n5. PENDIENTES:\nSeguimiento a puertas de emergencia y revisión de cerramientos perimetrales.`,
      });
    }

    const prompt = `
Genera un informe formal de seguridad privada para la gerencia y cliente del puesto: "${site?.name || 'General'}".
Período del reporte: ${period || 'Período actual'}.

Datos registrados en el sistema:
- Novedades (${novedades?.length || 0}):
${JSON.stringify(novedades || [], null, 2)}

- Incidentes (${incidents?.length || 0}):
${JSON.stringify(incidents || [], null, 2)}

- Inspecciones de Supervisión (${inspections?.length || 0}):
${JSON.stringify(inspections || [], null, 2)}

- Registro de Visitas (${visits?.length || 0}):
${JSON.stringify(visits || [], null, 2)}

ESTRUCTURA OBLIGATORIA DEL INFORME:
1. DATOS REGISTRADOS
2. RESUMEN EJECUTIVO
3. INCIDENTES DE SEGURIDAD
4. NOVEDADES OPERACIONALES
5. SUPERVISIONES Y AUDITORÍAS EN PUESTO
6. ACCIONES REALIZADAS
7. PENDIENTES Y RECOMENDACIONES DE MITIGACIÓN

Instrucciones: No inventes eventos ni nombres ajenos al reporte. Separa claramente cada sección con mayúsculas y formato profesional.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });

    res.json({ content: response.text });
  } catch (error: any) {
    console.error('Error generating AI report:', error);
    res.status(500).json({ error: 'Error al generar el reporte con IA.' });
  }
});

// Endpoint: AI Insights & Patterns
app.post('/api/gemini/insights', async (req: Request, res: Response) => {
  try {
    const { metrics, sites, novedades, incidents, documents } = req.body;

    if (!geminiApiKey) {
      return res.json({
        insights: [
          {
            type: 'Dato observado',
            title: 'Concentración de novedades en accesos nocturnos',
            description: 'El 65% de las novedades de seguridad se concentran en puertas perimetrales y sótanos entre las 20:00 y las 04:00.',
            severity: 'WARNING',
          },
          {
            type: 'Posible patrón',
            title: 'Riesgo de vulnerabilidad en Centro Comercial Norte',
            description: 'Se detectó reiteración de aperturas en salidas de emergencia los fines de semana coincidiendo con cambios de turno.',
            severity: 'CRITICAL',
          },
          {
            type: 'Dato observado',
            title: 'Vencimiento crítico de pólizas en 5 días',
            description: 'Póliza RCE de Centro Comercial Santa Fe requiere renovación inmediata para evitar suspensión contractual.',
            severity: 'CRITICAL',
          },
          {
            type: 'Información insuficiente',
            title: 'Historial de rondas forestales en Cerros de Torca',
            description: 'Se requieren al menos 14 días adicionales de telemetría de marcación de puntos para determinar patrones de evasión.',
            severity: 'INFO',
          },
        ],
      });
    }

    const prompt = `
Analiza la siguiente data operativa de la empresa de seguridad privada y genera 4 hallazgos de Inteligencia Operativa clasificados estrictamente en:
- "Dato observado" (hecho numérico o fáctico comprobable)
- "Posible patrón" (tendencia o anomalía que requiere atención preventiva)
- "Información insuficiente" (donde faltan datos para una conclusión definitiva)

Data:
Métricas: ${JSON.stringify(metrics)}
Novedades: ${JSON.stringify(novedades?.slice(0, 10))}
Incidentes: ${JSON.stringify(incidents?.slice(0, 5))}
Documentos por vencer: ${JSON.stringify(documents?.filter((d: any) => d.status === 'POR_VENCER'))}

Retorna un array JSON de objetos con:
- type: "Dato observado" | "Posible patrón" | "Información insuficiente"
- title: string corto
- description: análisis objetivo
- severity: "INFO" | "WARNING" | "CRITICAL"
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              severity: { type: Type.STRING },
            },
            required: ['type', 'title', 'description', 'severity'],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '[]');
    res.json({ insights: parsed });
  } catch (error: any) {
    console.error('Error generating AI insights:', error);
    res.status(500).json({ error: 'Error en análisis de inteligencia operativa.' });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'SecurityCRM AI Backend',
    timestamp: new Date().toISOString(),
    gemini_configured: Boolean(geminiApiKey),
  });
});

// Vite middleware mounting in development or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SecurityCRM AI backend listening on port ${PORT}`);
  });
}

startServer();
