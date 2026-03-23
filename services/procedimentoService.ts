import { supabase } from './storageService';
import { Procedimento } from '../types';

export const procedimentoService = {
    
    async getByCode(code: string): Promise<Procedimento | null> {
        try {
            const { data, error } = await supabase
                .from('procedimentos')
                .select('*')
                .eq('code', code.trim())
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Erro ao buscar procedimento:', err);
            return null;
        }
    },

    
    async create(procedimento: { code: string; description: string }): Promise<Procedimento | null> {
        try {
            const { data, error } = await supabase
                .from('procedimentos')
                .insert([{
                    code: procedimento.code.trim(),
                    description: procedimento.description.toUpperCase().trim()
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Erro ao cadastrar procedimento:', err);
            return null;
        }
    }
};
