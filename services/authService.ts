import { supabase } from './storageService';

export const authService = {
    
    async login(usuario: string, senha: string): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('usuario', usuario.trim())
                .eq('senha', senha.trim())
                .maybeSingle();

            if (error) throw error;

            if (data) {
                localStorage.setItem('auth_user', JSON.stringify({
                    id: data.id,
                    usuario: data.usuario
                }));
                return true;
            }

            return false;
        } catch (err) {
            console.error('Erro na autenticação:', err);
            return false;
        }
    },

    
    isAuthenticated(): boolean {
        return !!localStorage.getItem('auth_user');
    },

    
    logout(): void {
        localStorage.removeItem('auth_user');
    },

    
    getUser(): { id: string; usuario: string } | null {
        const user = localStorage.getItem('auth_user');
        return user ? JSON.parse(user) : null;
    }
};
