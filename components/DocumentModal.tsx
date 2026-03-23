
import React, { useRef, useState, useEffect } from 'react';
import { Patient, DocumentConfig } from '../types';
import { generatePatientDocument } from '../services/pdfService';
import { X, Printer, Download, FileText, Loader2, ClipboardList, MapPin, Calendar, Clock, RefreshCw, Hash, Save, Search as SearchIcon, Plus } from 'lucide-react';
import { procedimentoService } from '../services/procedimentoService';
import { Procedimento } from '../types';
import NotificationModal from './NotificationModal';
import { applyProcedureMask } from '../services/validationService';

interface DocumentModalProps {
  patient: Patient;
  initialConfig?: Partial<DocumentConfig>;
  onClose: () => void;
  onUpdatePatient?: (updatedPatient: Patient) => void;
}

const DocumentModal: React.FC<DocumentModalProps> = ({ patient, initialConfig, onClose, onUpdatePatient }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isSearchingCode, setIsSearchingCode] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const [procedureCode, setProcedureCode] = useState(() => {
    const proc = initialConfig?.procedimento || patient.lastProcedimento || '';
    const match = proc.split(' - ')[0];
    return match ? match : '';
  });
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert',
  });

  const [config, setConfig] = useState<DocumentConfig>(() => {
    const today = new Date();
    const returnDate = new Date(today);
    returnDate.setDate(today.getDate() + 15);

    return {
      procedimento: initialConfig?.procedimento || patient.lastProcedimento || '',
      isItabuna: initialConfig?.isItabuna ?? patient.isItabuna ?? true,
      isMPactuado: initialConfig?.isMPactuado ?? patient.isMPactuado ?? false,
      deliveryDate: new Date().toISOString().split('T')[0],
      returnDate: returnDate.toISOString().split('T')[0],
      printTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const createPdf = async () => {
    setIsGenerating(true);
    try {
      if (onUpdatePatient) {
        if (patient.lastProcedimento !== config.procedimento || patient.isItabuna !== config.isItabuna || patient.isMPactuado !== config.isMPactuado) {
          onUpdatePatient({
            ...patient,
            lastProcedimento: config.procedimento,
            isItabuna: config.isItabuna,
            isMPactuado: config.isMPactuado,
          });
        }
      }
      await new Promise(resolve => setTimeout(resolve, 400));
      const bytes = await generatePatientDocument(patient, config);
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);

      setPdfUrl(url);
    } catch (error) {
      console.error('Falha ao gerar PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLookupProcedure = async () => {
    if (!procedureCode.trim()) return;

    const cleanCode = procedureCode.replace(/\D/g, '');
    setIsSearchingCode(true);
    try {
      const proc = await procedimentoService.getByCode(cleanCode);
      if (proc) {
        const masked = applyProcedureMask(cleanCode);
        setConfig(prev => ({ ...prev, procedimento: `${masked} - ${proc.description}` }));
      } else {
        setNewCode(cleanCode);
        setNewDescription('');
        setShowRegisterModal(true);
      }
    } catch (err) {
      console.error('Erro na busca:', err);
    } finally {
      setIsSearchingCode(false);
    }
  };

  const handleSaveNewProcedure = async () => {
    if (!newCode || !newDescription) return;

    const cleanCode = newCode.replace(/\D/g, '');
    try {
      const proc = await procedimentoService.create({
        code: cleanCode,
        description: newDescription
      });
      if (proc) {
        const masked = applyProcedureMask(cleanCode);
        setConfig(prev => ({ ...prev, procedimento: `${masked} - ${proc.description}` }));
        setProcedureCode(masked);
        setShowRegisterModal(false);
      }
    } catch (err) {
      setNotification({
        isOpen: true,
        title: 'Erro no Cadastro',
        message: 'Não foi possível salvar o procedimento. Verifique sua conexão ou tente novamente.',
        type: 'alert'
      });
    }
  };
  useEffect(() => {
    createPdf();
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [patient]); 

  const handlePrint = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.print();
    }
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      const fileName = `comprovante-aih-${patient.name.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      link.download = fileName;
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        {}
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-primary-600 p-2 rounded-xl shadow-lg shadow-primary-100">
              <FileText className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 leading-none">Comprovante de Entrega A.I.H</h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">Paciente: {patient.name} | CadSUS: {patient.cadSus}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {}
          <div className="w-full lg:w-96 p-6 border-r border-slate-100 overflow-y-auto bg-white flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <ClipboardList size={14} /> Dados do Comprovante
            </h3>
            <div className="space-y-6 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-tighter flex items-center gap-2">
                  <Hash size={14} className="text-primary-500" /> Código do Procedimento
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="00.00.00.000-0"
                    value={procedureCode}
                    onChange={e => setProcedureCode(applyProcedureMask(e.target.value))}
                    onKeyDown={e => e.key === 'Enter' && handleLookupProcedure()}
                    className="flex-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-bold"
                  />
                  <button
                    onClick={handleLookupProcedure}
                    disabled={isSearchingCode}
                    className="px-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {isSearchingCode ? <Loader2 size={18} className="animate-spin" /> : <SearchIcon size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-tighter">Descrição do Procedimento</label>
                <textarea
                  value={config.procedimento}
                  onChange={e => setConfig({ ...config, procedimento: e.target.value })}
                  rows={4}
                  placeholder="Código - Nome do procedimento aparecerá aqui..."
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm leading-relaxed font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-3 uppercase flex items-center gap-2 tracking-tighter">
                  <MapPin size={14} /> Localidade / Origem
                </label>
                <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="origem"
                      checked={config.isItabuna}
                      onChange={() => setConfig({ ...config, isItabuna: true, isMPactuado: false })}
                      className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-primary-600 transition-colors">Itabuna (Sede)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="origem"
                      checked={config.isMPactuado}
                      onChange={() => setConfig({ ...config, isItabuna: false, isMPactuado: true })}
                      className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-primary-600 transition-colors">Município Pactuado</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-2 tracking-tighter">
                    <Calendar size={14} /> Data
                  </label>
                  <input
                    type="date"
                    value={config.deliveryDate}
                    onChange={e => setConfig({ ...config, deliveryDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-2 tracking-tighter">
                    <Calendar size={14} className="text-primary-500" /> Retorno
                  </label>
                  <input
                    type="date"
                    value={config.returnDate}
                    onChange={e => setConfig({ ...config, returnDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase flex items-center gap-2 tracking-tighter">
                    <Clock size={14} /> Horário
                  </label>
                  <input
                    type="time"
                    value={config.printTime}
                    onChange={e => setConfig({ ...config, printTime: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 mt-6">
              <button
                onClick={createPdf}
                disabled={isGenerating}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
                Atualizar Visualização
              </button>
              <p className="text-[10px] text-slate-400 font-bold uppercase text-center mt-3 leading-tight">
                Os dados acima só serão aplicados no PDF após clicar no botão "Atualizar".
              </p>
            </div>
          </div>

          {}
          <div className="flex-1 bg-slate-200 relative flex flex-col p-4">
            <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl mb-4 p-3 flex justify-center gap-4 text-white shadow-2xl">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-8 py-3 bg-primary-500 hover:bg-primary-600 rounded-xl font-bold transition-all shadow-lg active:scale-95"
              >
                <Printer size={20} /> Imprimir Agora
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-all shadow-lg active:scale-95"
              >
                <Download size={20} /> Baixar PDF
              </button>
            </div>

            <div className="flex-1 rounded-2xl overflow-hidden bg-white shadow-2xl relative">
              {isGenerating && (
                <div className="absolute inset-0 z-10 bg-white/95 flex flex-col items-center justify-center animate-in fade-in duration-200">
                  <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center">
                    <Loader2 className="animate-spin text-primary-600 mb-6" size={64} />
                    <p className="font-black text-slate-800 text-xl tracking-tight">Gerando Comprovante</p>
                    <p className="text-slate-400 text-[10px] font-black uppercase mt-2 tracking-widest">Aguarde o processamento</p>
                  </div>
                </div>
              )}
              {pdfUrl && (
                <iframe
                  ref={iframeRef}
                  src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`}
                  className="w-full h-full border-none"
                  title="Visualização do Comprovante A.I.H"
                />
              )}
            </div>
            <p className="text-center text-[10px] text-slate-500 mt-3 font-black uppercase tracking-[0.2em] opacity-60">
              Sistema de Gestão de Documentos A.I.H - Itabuna/BA
            </p>
          </div>
        </div>
      </div>
      {}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Plus size={24} className="text-primary-600" /> Novo Procedimento
              </h2>
              <button onClick={() => setShowRegisterModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">Código</label>
                <input
                  type="text"
                  value={applyProcedureMask(newCode)}
                  onChange={e => setNewCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="00.00.00.000-0"
                  className="w-full px-5 py-4 bg-slate-100 rounded-2xl border-none focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">Descrição (NOME DO PROCEDIMENTO)</label>
                <textarea
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value.toUpperCase())}
                  rows={3}
                  className="w-full px-5 py-4 bg-slate-100 rounded-2xl border-none focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold text-slate-800"
                />
              </div>
              <button
                onClick={handleSaveNewProcedure}
                className="w-full py-5 bg-primary-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary-200"
              >
                <Save size={20} /> Salvar e Usar
              </button>
            </div>
          </div>
        </div>
      )}

      <NotificationModal
        {...notification}
        onConfirm={() => setNotification(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default DocumentModal;
