
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Patient, PatientFormData, DocumentConfig } from '../types';
import { validateCPF, validateCNS, applyCadSusMask, applyPhoneMask, validateMobilePhone, applyProcedureMask } from '../services/validationService';
import {
  X,
  CreditCard,
  User,
  Phone,
  MapPin,
  ClipboardList,
  Calendar,
  Clock,
  UserPlus,
  Edit3,
  AlertCircle,
  Hash,
  Search,
  Plus,
  Loader2,
  Save
} from 'lucide-react';
import { procedimentoService } from '../services/procedimentoService';
import NotificationModal from './NotificationModal';
const patientSchema = z.object({
  name: z.string().min(3, 'Nome muito curto'),
  phone: z.string().optional().refine((val) => {
    if (!val || val.replace(/\\D/g, '') === '') return true;
    return validateMobilePhone(val).isValid;
  }, {
    message: 'Telefone inválido. Deve ser no formato (DD) 9XXXX-XXXX'
  }),
  cadSus: z.string().refine((val) => {
    const clean = val.replace(/\D/g, '');
    if (clean.length === 11) return validateCPF(clean);
    if (clean.length === 15) return validateCNS(clean);
    return false;
  }, {
    message: 'O campo deve ter 11 dígitos (CPF) ou 15 dígitos (CNS) válidos'
  }),
  procedimento: z.string().optional(),
  origem: z.enum(['itabuna', 'pactuado']).optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

interface PatientFormProps {
  patient?: Patient;
  initialName?: string;
  onSave: (data: PatientFormData & { id?: string, extra?: Partial<DocumentConfig> }) => void;
  onClose: () => void;
}

const PatientForm: React.FC<PatientFormProps> = ({ patient, initialName, onSave, onClose }) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: initialName || '',
      origem: 'itabuna'
    }
  });

  const [currentTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  const [currentDate] = useState(new Date().toLocaleDateString('pt-BR'));
  const [isSearchingCode, setIsSearchingCode] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [procedureCode, setProcedureCode] = useState('');
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

  useEffect(() => {
    if (patient) {
      reset({
        name: patient.name,
        phone: applyPhoneMask(patient.phone),
        cadSus: applyCadSusMask(patient.cadSus),
      });
    }
  }, [patient, reset]);

  const handleCadSusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyCadSusMask(e.target.value);
    setValue('cadSus', masked, { shouldValidate: true });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyPhoneMask(e.target.value);
    setValue('phone', masked, { shouldValidate: true });
  };

  const handleProcedureCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyProcedureMask(e.target.value);
    setProcedureCode(masked);
  };

  const handleLookupProcedure = async () => {
    if (!procedureCode.trim()) return;

    const cleanCode = procedureCode.replace(/\D/g, '');
    setIsSearchingCode(true);
    try {
      const proc = await procedimentoService.getByCode(cleanCode);
      if (proc) {
        const masked = applyProcedureMask(cleanCode);
        setValue('procedimento', `${masked} - ${proc.description}`, { shouldValidate: true });
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
        setValue('procedimento', `${masked} - ${proc.description}`, { shouldValidate: true });
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

  const onSubmit = (data: PatientFormValues) => {
    const { procedimento, origem, ...patientData } = data;

    if (!patientData.phone || patientData.phone.replace(/\\D/g, '') === '') {
      patientData.phone = '(00) 00000-0000';
    }

    const extra: Partial<DocumentConfig> = !patient ? {
      procedimento: procedimento || '',
      isItabuna: origem === 'itabuna',
      isMPactuado: origem === 'pactuado',
    } : {};

    onSave({ ...patientData, id: patient?.id, extra: !patient ? extra : undefined });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl my-8 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {patient ? <Edit3 className="text-primary-600" size={20} /> : <UserPlus className="text-primary-600" size={20} />}
            {patient ? 'Editar Cadastro' : 'Novo Cadastro A.I.H'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Dados Pessoais</h3>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-tight">
                <User size={14} /> Nome Completo *
              </label>
              <input
                {...register('name')}
                className={`w-full px-4 py-3.5 rounded-2xl border transition-all font-semibold outline-none ${errors.name ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:ring-2 focus:ring-primary-500'}`}
                placeholder="Ex: João Silva"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1 font-bold flex items-center gap-1"><AlertCircle size={12} /> {errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-tight">
                  <CreditCard size={14} /> CPF ou CNS *
                </label>
                <input
                  autoComplete="off"
                  {...register('cadSus')}
                  onChange={handleCadSusChange}
                  className={`w-full px-4 py-3.5 rounded-2xl border transition-all font-mono font-bold outline-none ${errors.cadSus ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-200 focus:ring-2 focus:ring-primary-500'}`}
                  placeholder="000.000.000-00"
                />
                {errors.cadSus && <p className="text-red-500 text-[10px] mt-1 font-black flex items-center gap-1 leading-tight"><AlertCircle size={12} className="shrink-0" /> {errors.cadSus.message}</p>}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-tight">
                  <Phone size={14} /> Telefone
                </label>
                <input
                  autoComplete="off"
                  {...register('phone')}
                  onChange={handlePhoneChange}
                  className={`w-full px-4 py-3.5 rounded-2xl border transition-all font-bold outline-none ${errors.phone ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:ring-2 focus:ring-primary-500'}`}
                  placeholder="(73) 98888-8888"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1 font-bold flex items-center gap-1"><AlertCircle size={12} /> {errors.phone.message}</p>}
              </div>
            </div>
          </div>

          {!patient && (
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Detalhes para Comprovante</h3>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">
                  <MapPin size={14} /> Localidade / Origem *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center justify-center gap-3 p-3.5 rounded-2xl border border-slate-200 cursor-pointer hover:bg-primary-50 hover:border-primary-200 transition-all font-bold text-slate-700 has-[:checked]:bg-primary-600 has-[:checked]:text-white has-[:checked]:border-primary-700">
                    <input
                      type="radio"
                      value="itabuna"
                      {...register('origem')}
                      className="hidden"
                    />
                    Itabuna
                  </label>
                  <label className="flex items-center justify-center gap-3 p-3.5 rounded-2xl border border-slate-200 cursor-pointer hover:bg-primary-50 hover:border-primary-200 transition-all font-bold text-slate-700 has-[:checked]:bg-primary-600 has-[:checked]:text-white has-[:checked]:border-primary-700">
                    <input
                      type="radio"
                      value="pactuado"
                      {...register('origem')}
                      className="hidden"
                    />
                    M. Pactuado
                  </label>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-tight">
                  <Hash size={14} className="text-primary-500" /> Código do Procedimento
                </label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="00.00.00.000-0"
                    value={procedureCode}
                    onChange={handleProcedureCodeChange}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleLookupProcedure())}
                    className="flex-1 px-4 py-3.5 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleLookupProcedure}
                    disabled={isSearchingCode}
                    className="px-6 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center shadow-lg shadow-primary-100"
                  >
                    {isSearchingCode ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                  </button>
                </div>

                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-tight">
                  <ClipboardList size={14} /> Descrição do Procedimento
                </label>
                <textarea
                  {...register('procedimento')}
                  rows={2}
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold text-sm"
                  placeholder="Código - Nome do procedimento aparecerá aqui..."
                />
              </div>

              <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-slate-400" /> {currentDate}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={12} className="text-slate-400" /> {currentTime}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 px-6 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-4 px-6 rounded-2xl bg-primary-600 text-white font-black text-sm uppercase tracking-widest hover:bg-primary-700 transition-all shadow-xl shadow-primary-100 active:scale-95"
            >
              {patient ? 'Salvar Alterações' : 'Cadastrar e Emitir'}
            </button>
          </div>
        </form>
      </div>

      {}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Plus size={24} className="text-primary-600" /> Novo Procedimento
              </h2>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
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
                type="button"
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

export default PatientForm;
