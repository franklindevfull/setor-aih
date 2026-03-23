
import React, { useState, useEffect, useMemo } from 'react';
import { Patient, PatientFormData, DocumentConfig } from './types';
import { storageService } from './services/storageService';
import PatientForm from './components/PatientForm';
import DocumentModal from './components/DocumentModal';
import NotificationModal from './components/NotificationModal';
import Login from './components/Login';
import { authService } from './services/authService';
import { ShieldCheck, Search, X, Users, Edit3, LayoutGrid, FileText, Plus, LogOut, User as UserIcon, Trash2, CreditCard, Phone, Image as ImageIcon } from 'lucide-react';

const App: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPatientForDoc, setSelectedPatientForDoc] = useState<Patient | null>(null);
  const [autoOpenDocConfig, setAutoOpenDocConfig] = useState<Partial<DocumentConfig> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm' | 'success';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert',
    onConfirm: () => { },
  });

  useEffect(() => {
    const checkAuth = () => {
      const auth = authService.isAuthenticated();
      setIsAuthenticated(auth);
      if (auth) {
        loadPatients();
      } else {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const loadPatients = async () => {
    setIsLoading(true);
    await storageService.loadData();
    setPatients(storageService.getPatients());
    setIsLoading(false);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    loadPatients();
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
  };

  const filteredPatients = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return patients.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.cadSus.includes(term)
    ).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [patients, searchTerm]);

  const handleSavePatient = async (data: PatientFormData & { id?: string, extra?: Partial<DocumentConfig> }) => {
    let savedPatient: Patient;

    if (data.id) {
      const existing = patients.find(p => p.id === data.id);
      savedPatient = {
        name: data.name,
        phone: data.phone,
        cadSus: data.cadSus,
        id: data.id,
        updatedAt: Date.now(),
        lastProcedimento: existing?.lastProcedimento,
        isItabuna: existing?.isItabuna,
        isMPactuado: existing?.isMPactuado,
      };
      await storageService.updatePatient(savedPatient);
    } else {
      savedPatient = {
        name: data.name,
        phone: data.phone,
        cadSus: data.cadSus,
        id: Math.random().toString(36).substr(2, 9),
        updatedAt: Date.now(),
        lastProcedimento: data.extra?.procedimento,
        isItabuna: data.extra?.isItabuna,
        isMPactuado: data.extra?.isMPactuado,
      };
      await storageService.addPatient(savedPatient);
    }

    setPatients([...storageService.getPatients()]);
    setIsFormOpen(false);
    setEditingPatient(undefined);
    if (data.extra) {
      setAutoOpenDocConfig(data.extra);
      setSelectedPatientForDoc(savedPatient);
    }
  };

  const handleDeletePatient = async (id: string) => {
    setNotification({
      isOpen: true,
      title: 'Excluir Paciente',
      message: 'Tem certeza que deseja excluir este cadastro? Esta ação não pode ser desfeita.',
      type: 'confirm',
      onConfirm: async () => {
        await storageService.deletePatient(id);
        setPatients([...storageService.getPatients()]);
        setNotification(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  if (!isAuthenticated && !isLoading) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen pb-12 bg-slate-50">
      {}
      <header className="bg-primary-700 shadow-xl border-b-4 border-yellow-400">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2.5 rounded-2xl shadow-inner">
              <ShieldCheck className="text-primary-700" size={32} />
            </div>
            <div className="text-white">
              <h1 className="text-2xl font-black leading-tight tracking-tight">Entrega de Documentos A.I.H</h1>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex flex-col text-right mr-4 border-r border-primary-600/50 pr-6">
              <div className="flex items-center gap-2 justify-end text-white mb-0.5">
                <UserIcon size={14} className="text-primary-200" />
                <span className="font-black text-xs uppercase tracking-wider">{authService.getUser()?.usuario}</span>
              </div>
              <p className="text-primary-100 text-[10px] font-bold uppercase tracking-tighter opacity-80">Setor de Cirurgias Eletivas</p>
            </div>
            <button
              onClick={handleLogout}
              className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-2xl border border-white/10 transition-all font-black text-xs text-white uppercase tracking-widest"
              title="Sair do sistema"
            >
              <LogOut size={18} className="text-primary-100 group-hover:text-white transition-colors" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-10">
        <div className="mb-12">
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">Localizar Paciente (Nome ou CadSUS)</label>
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={24} />
              <input
                type="text"
                placeholder="Ex: João Silva ou 7000..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-16 py-5 bg-white rounded-3xl border-2 border-transparent shadow-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-50 outline-none transition-all text-xl font-bold placeholder:text-slate-300"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-5 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                  title="Limpar pesquisa"
                >
                  <X size={24} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <LayoutGrid className="text-primary-600" size={24} />
            {searchTerm ? 'Resultados da Pesquisa' : 'Cadastros Recentes'}
            <span className="bg-primary-100 text-primary-700 text-xs font-black py-1.5 px-3.5 rounded-full">
              {filteredPatients.length}
            </span>
          </h2>
        </div>

        {filteredPatients.length > 0 ? (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col max-h-[60vh]">
            <div className="overflow-y-auto p-4 space-y-4">
              {filteredPatients.map(patient => (
                <div
                  key={patient.id}
                  className="bg-slate-50 rounded-2xl p-5 border border-transparent hover:border-primary-200 hover:bg-white hover:shadow-md transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-3 rounded-xl shadow-sm group-hover:bg-primary-50 transition-colors shrink-0">
                      <Users className="text-slate-400 group-hover:text-primary-600" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800 tracking-tight">{patient.name}</h3>
                      <div className="flex flex-wrap gap-4 mt-1">
                        <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase">
                          <CreditCard size={14} className="text-slate-300" />
                          <span>CadSUS: {patient.cadSus}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase">
                          <Phone size={14} className="text-slate-300" />
                          <span>Tel: {patient.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2 md:mt-0">
                    <button
                      onClick={() => { setAutoOpenDocConfig(null); setSelectedPatientForDoc(patient); }}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-xl font-black text-xs hover:bg-primary-600 hover:text-white transition-all border border-primary-100"
                    >
                      <FileText size={16} />
                      Comprovante
                    </button>
                    <button
                      onClick={() => { setEditingPatient(patient); setIsFormOpen(true); }}
                      className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeletePatient(patient.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-24 border-2 border-dashed border-slate-200 flex flex-col items-center text-center">
            <div className="bg-slate-50 p-8 rounded-full mb-8">
              <Search size={64} className="text-slate-200" />
            </div>
            <h3 className="text-3xl font-black text-slate-700 mb-4">Cadastro não localizado</h3>
            <button
              onClick={() => { setEditingPatient(undefined); setIsFormOpen(true); }}
              className="flex items-center gap-3 px-12 py-5 bg-primary-600 text-white rounded-3xl font-black text-lg shadow-2xl hover:scale-105 transition-all"
            >
              <Plus size={24} /> Criar Novo Cadastro
            </button>
          </div>
        )}
      </main>


      {isFormOpen && (
        <PatientForm
          patient={editingPatient}
          initialName={searchTerm}
          onSave={handleSavePatient}
          onClose={() => { setIsFormOpen(false); setEditingPatient(undefined); }}
        />
      )}

      {selectedPatientForDoc && (
        <DocumentModal
          patient={selectedPatientForDoc}
          initialConfig={autoOpenDocConfig || undefined}
          onClose={() => { setSelectedPatientForDoc(null); setAutoOpenDocConfig(null); }}
          onUpdatePatient={async (updatedPatient) => {
            await storageService.updatePatient(updatedPatient);
            setPatients([...storageService.getPatients()]);
            setSelectedPatientForDoc(updatedPatient);
          }}
        />
      )}

      {}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/80 backdrop-blur-md py-4 px-6 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <ImageIcon className="text-blue-600" size={20} />

            <span className="font-black text-slate-900 tracking-tight text-sm">Fransoft Developer®</span>
            <span className="text-slate-400 text-[10px] font-bold border-l pl-3 ml-2">fransoft.developer.2026@gmail.com</span>
          </div>

          <div className="bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-100 flex items-center gap-4 text-yellow-700 text-[10px] font-bold">
            <p>• Use A4 (Tamanho Real)</p>
            <p>• Impressão em 2 vias A5</p>
            <p>• Carimbo manual obrigatório</p>
          </div>
        </div>
      </footer>

      <NotificationModal
        {...notification}
        onCancel={() => setNotification(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default App;
