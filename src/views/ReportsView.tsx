import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Download,
  Printer,
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  Loader2,
  FileSpreadsheet,
  FileDown
} from 'lucide-react';
import { dbManager } from '../lib/supabaseClient';
import { Report } from '../types/database';

export const ReportsView: React.FC = () => {
  const [reports, setReports] = useState<Report[]>(dbManager.getReports());
  const [sites, setSites] = useState(dbManager.getSites());
  const [selectedSiteId, setSelectedSiteId] = useState(sites[0]?.id || '');
  const [reportType, setReportType] = useState<Report['report_type']>('SEMANAL');
  const [period, setPeriod] = useState('Semana en curso');
  
  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReportText, setGeneratedReportText] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState('Informe Semanal de Operaciones');

  const refresh = () => {
    setReports(dbManager.getReports());
    setSites(dbManager.getSites());
  };

  useEffect(() => {
    const handleDataChange = () => refresh();
    window.addEventListener('securitycrm_datachange', handleDataChange);
    return () => window.removeEventListener('securitycrm_datachange', handleDataChange);
  }, []);

  const handleGenerateAIReport = async () => {
    setIsGenerating(true);
    const site = sites.find(s => s.id === selectedSiteId) || sites[0];
    const novedades = dbManager.getNovedades().filter(n => n.site_id === site.id);
    const incidents = dbManager.getIncidents().filter(i => i.site_id === site.id);
    const inspections = dbManager.getInspections().filter(i => i.site_id === site.id);
    const visits = dbManager.getVisits().filter(v => v.site_id === site.id);

    try {
      const response = await fetch('/api/gemini/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site,
          period,
          novedades,
          incidents,
          inspections,
          visits,
        }),
      });

      const data = await response.json();
      setGeneratedReportText(data.content);
      setReportTitle(`Informe ${reportType} — ${site.name}`);
    } catch (e) {
      console.error(e);
      // Fallback structured generation
      setGeneratedReportText(
`INFORME OPERACIONAL DE SEGURIDAD PRIVADA
Puesto: ${site.name}
Período: ${period}

1. DATOS REGISTRADOS
- Novedades Operativas Registradas: ${novedades.length}
- Incidentes de Seguridad: ${incidents.length}
- Inspecciones de Supervisión Realizadas: ${inspections.length}
- Ingresos de Visitantes / Minuta: ${visits.length}

2. RESUMEN EJECUTIVO
Durante el período evaluado el puesto operó bajo los protocolos de vigilancia activa. Se mantuvieron las rondas de control y los relevos de personal conforme al cuadrante.

3. INCIDENTES DE SEGURIDAD
${incidents.length > 0 ? incidents.map(i => `- [${i.severity}] ${i.title}: ${i.actions_taken || i.description}`).join('\n') : 'Sin incidentes de criticidad alta registrados.'}

4. NOVEDADES OPERACIONALES
${novedades.length > 0 ? novedades.map(n => `- [${n.priority}] ${n.title}: ${n.description}`).join('\n') : 'Operación normal sin novedades pendientes.'}

5. SUPERVISIONES Y AUDITORÍAS EN PUESTO
${inspections.length > 0 ? inspections.map(insp => `- Puntuación obtenida: ${insp.score}% (${insp.result}). Hallazgos: ${insp.observations}`).join('\n') : 'Rondas de supervisión al día.'}

6. ACCIONES REALIZADAS
- Inspección física de cerrojos electromagnéticos y salidas de evacuación.
- Verificación de libro de minuta y dotación de armamento.

7. PENDIENTES Y RECOMENDACIONES
- Coordinar con mantenimiento del cliente la revisión de iluminación en bahía vehicular.
- Mantener alerta en cambios de turno.`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveReport = () => {
    if (!generatedReportText) return;

    dbManager.createReport({
      site_id: selectedSiteId,
      created_by: dbManager.getCurrentProfile().full_name,
      report_type: reportType,
      title: reportTitle,
      content: generatedReportText,
      period_start: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
      period_end: new Date().toISOString().split('T')[0],
      status: 'GENERADO',
    });

    refresh();
  };

  const handleExportCSV = () => {
    if (!generatedReportText) return;
    const blob = new Blob([generatedReportText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_${reportTitle.replace(/\s+/g, '_')}.txt`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center">
            <FileText className="w-5 h-5 mr-2 text-cyan-400" /> Generador de Reportes Tácticos y Auditorías
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Consolidación estructurada de novedades, incidentes y supervisiones con síntesis de inteligencia artificial.
          </p>
        </div>
      </div>

      {/* Generator Configuration Panel */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
          <Sparkles className="w-4 h-4 mr-2 text-indigo-400" /> Parámetros del Informe Operativo
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Puesto de Vigilancia:</label>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-hidden"
            >
              {sites.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Tipo de Reporte:</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as Report['report_type'])}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-hidden"
            >
              <option value="DIARIO">DIARIO</option>
              <option value="SEMANAL">SEMANAL</option>
              <option value="MENSUAL">MENSUAL</option>
              <option value="NOVEDADES">NOVEDADES</option>
              <option value="INCIDENTES">INCIDENTES</option>
              <option value="SUPERVISIONES">SUPERVISIONES</option>
              <option value="CLIENTE">CONSOLIDADO CLIENTE</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Período de Evaluación:</label>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="Últimos 7 días / Semana 14"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-hidden"
            >
            </input>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleGenerateAIReport}
            disabled={isGenerating}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/50 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
                <span>Sintetizando datos con Security AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Generar Informe Estructurado con IA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Report Display & Export Toolbar */}
      {generatedReportText && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                DOCUMENTO GENERADO POR SECURITY AI
              </span>
              <h2 className="text-base font-bold text-white mt-0.5">{reportTitle}</h2>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold"
                title="Imprimir o Guardar como PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / PDF</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold"
                title="Descargar archivo plano / Excel"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Descargar TXT/CSV</span>
              </button>

              <button
                onClick={handleSaveReport}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Guardar en Archivo</span>
              </button>
            </div>
          </div>

          {/* Structured Text Preview */}
          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs leading-relaxed text-slate-200 whitespace-pre-wrap select-text">
            {generatedReportText}
          </div>
        </div>
      )}

      {/* Saved Reports Archive */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center">
          <FileText className="w-4 h-4 mr-2 text-cyan-400" /> Historial de Informes Oficiales Generados ({reports.length})
        </h3>

        {reports.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No hay reportes archivados todavía. Genera el primero arriba.</p>
        ) : (
          <div className="space-y-2">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-200">{rep.title}</h4>
                  <p className="text-[11px] text-slate-400">
                    Tipo: {rep.report_type} • Creado por: {rep.created_by} • {rep.created_at}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setGeneratedReportText(rep.content);
                    setReportTitle(rep.title);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-[11px]"
                >
                  Abrir Informe
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
