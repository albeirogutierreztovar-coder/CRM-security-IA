import React, { useState, useEffect } from 'react';
import {
  FolderLock,
  Plus,
  Search,
  FileText,
  Calendar,
  AlertTriangle,
  Clock,
  Download,
  Trash2,
  X,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { dbManager } from '../lib/supabaseClient';
import { SecurityDocument } from '../types/database';
import { StatusBadge } from '../components/StatusBadges';

export const DocumentsView: React.FC = () => {
  const [documents, setDocuments] = useState<SecurityDocument[]>(dbManager.getDocuments());
  const [sites, setSites] = useState(dbManager.getSites());
  const [clients, setClients] = useState(dbManager.getClients());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [documentType, setDocumentType] = useState<SecurityDocument['document_type']>('POLIZA');
  const [siteId, setSiteId] = useState('');
  const [clientId, setClientId] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  const refresh = () => {
    setDocuments(dbManager.getDocuments());
    setSites(dbManager.getSites());
    setClients(dbManager.getClients());
  };

  useEffect(() => {
    const handleDataChange = () => refresh();
    window.addEventListener('securitycrm_datachange', handleDataChange);
    return () => window.removeEventListener('securitycrm_datachange', handleDataChange);
  }, []);

  const openCreateModal = () => {
    setName('');
    setDocumentType('POLIZA');
    setSiteId(sites[0]?.id || '');
    setClientId(clients[0]?.id || '');
    setExpirationDate(new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]);
    setFileUrl('https://example.com/poliza-seguro.pdf');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !expirationDate) return;

    // Determine status from expiration date
    const expDate = new Date(expirationDate);
    const now = new Date();
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    const status: SecurityDocument['status'] = diffDays <= 0 ? 'VENCIDO' : diffDays <= 15 ? 'POR_VENCER' : 'VIGENTE';

    dbManager.createDocument({
      name,
      document_type: documentType,
      site_id: siteId || undefined,
      client_id: clientId || undefined,
      expiration_date: expirationDate,
      file_url: fileUrl,
      status,
      uploaded_by: dbManager.getCurrentProfile().full_name,
    });

    refresh();
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este documento del archivo?')) {
      dbManager.deleteDocument(id);
      refresh();
    }
  };

  const getDaysRemaining = (expDateStr: string) => {
    const exp = new Date(expDateStr);
    const now = new Date();
    return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
  };

  const filteredDocs = documents.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.document_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center">
            <FolderLock className="w-5 h-5 mr-2 text-cyan-400" /> Bóveda y Gestión Documental con Alerta de Vencimiento
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pólizas de responsabilidad civil, permisos DCCA de porte de armas, certificaciones y contratos con radar de expiración.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-900/40 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Cargar Documento</span>
        </button>
      </div>

      {/* Radar de Alertas de Vencimiento Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Documentos</span>
            <p className="text-xl font-bold text-white mt-1">{documents.length}</p>
          </div>
          <FolderLock className="w-6 h-6 text-cyan-400 opacity-60" />
        </div>

        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-amber-400">Próximos a Vencer (≤ 15 días)</span>
            <p className="text-xl font-bold text-amber-300 mt-1">
              {documents.filter(d => d.status === 'POR_VENCER').length}
            </p>
          </div>
          <Clock className="w-6 h-6 text-amber-400 animate-pulse" />
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Documentos Vigentes</span>
            <p className="text-xl font-bold text-emerald-400 mt-1">
              {documents.filter(d => d.status === 'VIGENTE').length}
            </p>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-400 opacity-60" />
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs max-w-sm">
        <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar documento por nombre o tipo..."
          className="w-full bg-transparent text-slate-200 placeholder-slate-500 focus:outline-hidden"
        />
      </div>

      {/* Documents Grid / Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
              <th className="py-3 px-4">Documento</th>
              <th className="py-3 px-4">Tipo</th>
              <th className="py-3 px-4">Puesto / Cliente</th>
              <th className="py-3 px-4">Fecha Vencimiento</th>
              <th className="py-3 px-4">Alerta de Plazo</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredDocs.map((doc) => {
              const days = getDaysRemaining(doc.expiration_date);
              const site = sites.find(s => s.id === doc.site_id);
              const client = clients.find(c => c.id === doc.client_id);

              return (
                <tr key={doc.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-100 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-cyan-400 shrink-0" />
                    <span>{doc.name}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-mono">{doc.document_type}</td>
                  <td className="py-3 px-4 text-slate-400">{site?.name || client?.name || 'General'}</td>
                  <td className="py-3 px-4 font-mono text-slate-300">{doc.expiration_date}</td>
                  <td className="py-3 px-4">
                    {days > 0 ? (
                      <span className={`text-[11px] font-semibold ${
                        days <= 5 ? 'text-rose-400 font-bold animate-pulse' : days <= 15 ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        {days} días restantes
                      </span>
                    ) : (
                      <span className="text-rose-500 font-bold">VENCIDO</span>
                    )}
                  </td>
                  <td className="py-3 px-4"><StatusBadge status={doc.status} /></td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold"
                    >
                      Descargar
                    </a>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Cargar Documento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center">
                <FolderLock className="w-4 h-4 mr-2 text-cyan-400" />
                Cargar Documento a la Bóveda
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre del Documento *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Póliza RCE Seguros del Estado 2024-2025"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tipo de Documento</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                  >
                    <option value="POLIZA">PÓLIZA</option>
                    <option value="CONTRATO">CONTRATO</option>
                    <option value="PERMISO_PORTE_ARMAS">PERMISO PORTE ARMAS</option>
                    <option value="CERTIFICADO_CURSO">CERTIFICADO CURSO</option>
                    <option value="SALUD_OCUPACIONAL">SALUD OCUPACIONAL</option>
                    <option value="PROTOCOLO">PROTOCOLO BASC</option>
                    <option value="INSPECCION_MINISTERIO">INSPECCIÓN MINISTERIO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Fecha de Expiración *</label>
                  <input
                    type="date"
                    required
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Puesto Relacionado</label>
                  <select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                  >
                    <option value="">Aplica a toda la empresa</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cliente</label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                  >
                    <option value="">Empresa de Seguridad</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">URL / Enlace del Archivo Digital</label>
                <input
                  type="text"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://example.com/poliza-rce.pdf"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md shadow-cyan-900/40"
                >
                  Guardar Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
