import React, { useState } from 'react';
import { LogIn, User, Lock, Loader2, AlertCircle, ShieldCheck, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/authService';

interface LoginProps {
    onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!usuario.trim() || !senha.trim()) {
            setError('Preencha todos os campos.');
            return;
        }

        setIsLoggingIn(true);
        setError(null);

        try {
            const success = await authService.login(usuario, senha);
            if (success) {
                onLoginSuccess();
            } else {
                setError('Usuário ou senha incorretos.');
            }
        } catch (err) {
            setError('Erro ao conectar com o servidor.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
            {}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-50" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-50" />

            <div className="w-full max-w-md relative">
                {}
                <div className="bg-primary-600 rounded-t-[2.5rem] p-8 flex flex-col items-center text-center shadow-xl">
                    <div className="bg-white p-4 rounded-3xl shadow-inner mb-4">
                        <ShieldCheck className="text-primary-600" size={40} />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Setor de Cirurgias</h1>
                    <p className="text-primary-100 text-sm font-bold mt-2 uppercase tracking-widest">Acesso Restrito</p>
                </div>

                {}
                <div className="bg-white rounded-b-[2.5rem] shadow-2xl p-8 border border-slate-100">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <AlertCircle size={20} className="shrink-0" />
                                <p className="text-sm font-bold">{error}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Usuário</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                                <input
                                    type="text"
                                    value={usuario}
                                    onChange={(e) => setUsuario(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-50 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
                                    placeholder="Seu usuário"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Senha</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-50 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
                                    placeholder="Sua senha"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600 transition-colors p-1"
                                    title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            className="w-full py-4 bg-primary-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-primary-700 transition-all shadow-xl shadow-primary-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3 group"
                        >
                            {isLoggingIn ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    Entrar no Sistema
                                    <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                        <div className="flex flex-col items-center gap-2">
                            <ImageIcon className="text-blue-600" size={24} />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fransoft Developer Group</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
