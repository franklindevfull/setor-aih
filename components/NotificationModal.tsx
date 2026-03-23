import React from 'react';
import { X, AlertCircle, HelpCircle, CheckCircle2 } from 'lucide-react';

interface NotificationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'alert' | 'confirm' | 'success';
    onConfirm: () => void;
    onCancel?: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
    isOpen,
    title,
    message,
    type = 'alert',
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    const Icon = type === 'confirm' ? HelpCircle : type === 'success' ? CheckCircle2 : AlertCircle;
    const iconColor = type === 'confirm' ? 'text-primary-600' : type === 'success' ? 'text-green-600' : 'text-red-600';
    const bgColor = type === 'confirm' ? 'bg-primary-50' : type === 'success' ? 'bg-green-50' : 'bg-red-50';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-300">
                <div className="p-8 flex flex-col items-center text-center">
                    <div className={`${bgColor} p-4 rounded-full mb-6`}>
                        <Icon className={iconColor} size={40} />
                    </div>

                    <h2 className="text-xl font-black text-slate-800 mb-2 tracking-tight">{title}</h2>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">{message}</p>

                    <div className="flex gap-3 w-full">
                        {type === 'confirm' && (
                            <button
                                onClick={onCancel}
                                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                                Cancelar
                            </button>
                        )}
                        <button
                            onClick={onConfirm}
                            className={`flex-1 py-4 ${type === 'confirm' || type === 'success' ? 'bg-primary-600' : 'bg-red-600'} text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-lg active:scale-95`}
                        >
                            {type === 'confirm' ? 'Confirmar' : 'Entendido'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationModal;
